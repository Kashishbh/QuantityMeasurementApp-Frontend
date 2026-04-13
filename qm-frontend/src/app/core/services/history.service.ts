import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { describeHttpError } from '../http/http-error';
import { environment } from '../../../environments/environment';
import type { HistoryEntryDto, SaveHistoryRequestDto } from '../models/history.models';
import { AuthService } from './auth.service';

const LS_KEY = 'qm_history_entries';

interface ConversionHistoryRow {
  id: number;
  userId: number;
  measurementType: string;
  thisUnit: string;
  thisValue: number;
  thatUnit: string;
  thatValue: number;
  result: number;
  timestamp: unknown;
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  /** Server-backed history cannot be bulk-deleted with the current API. */
  canClearAll(): boolean {
    return false;
  }

  list(): Observable<HistoryEntryDto[]> {
    if (environment.useBackendMeasurement) {
      if (!this.auth.isRegistered()) {
        return of([]);
      }
      const url = this.joinApi('/api/users/my-history');
      return this.http.get<ConversionHistoryRow[] | unknown>(url).pipe(
        map((rows) => {
          const list = Array.isArray(rows) ? rows : [];
          return list.map((r) => this.mapServerRow(r)).sort((a, b) => this.sortDesc(a.createdAt, b.createdAt));
        }),
        catchError((e) => throwError(() => this.mapError(e))),
      );
    }
    return of(this.readLocalEntries().sort((a, b) => this.sortDesc(a.createdAt, b.createdAt)));
  }

  save(entry: SaveHistoryRequestDto): Observable<HistoryEntryDto> {
    if (environment.useBackendMeasurement) {
      return throwError(
        () =>
          new Error(
            this.auth.isRegistered()
              ? 'History is saved automatically when you use Calculate.'
              : 'Sign in to save history to your account.',
          ),
      );
    }
    const row: HistoryEntryDto = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      measurementType: String(entry?.measurementType ?? ''),
      operation: String(entry?.operation ?? ''),
      expression: String(entry?.expression ?? ''),
      resultSummary: String(entry?.resultSummary ?? ''),
    };
    const all = [row, ...this.readLocalEntries()];
    this.writeLocalEntries(all);
    return of(row);
  }

  clear(): Observable<void> {
    if (!this.canClearAll()) {
      return throwError(
        () => new Error('Clear all is not available for server history. Entries are stored on your account.'),
      );
    }
    this.writeLocalEntries([]);
    return of(undefined);
  }

  private joinApi(path: string): string {
    const root = environment.apiUrl.replace(/\/$/, '');
    return root ? `${root}${path}` : path;
  }

  private mapServerRow(r: ConversionHistoryRow): HistoryEntryDto {
    const createdAt = normalizeTimestamp(r.timestamp);
    const expression = buildExpression(r);
    return {
      id: String(r.id),
      createdAt,
      measurementType: r.measurementType,
      operation: 'SAVED',
      expression,
      resultSummary: formatResult(r.result),
    };
  }

  private sortDesc(a: string, b: string): number {
    return new Date(b).getTime() - new Date(a).getTime();
  }

  private readLocalEntries(): HistoryEntryDto[] {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(isHistoryEntry);
    } catch {
      return [];
    }
  }

  private writeLocalEntries(entries: HistoryEntryDto[]): void {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  }

  private mapError(err: unknown): Error {
    return new Error(describeHttpError(err));
  }
}

function isHistoryEntry(x: unknown): x is HistoryEntryDto {
  if (x === null || typeof x !== 'object') {
    return false;
  }
  const o = x as Record<string, unknown>;
  return (
    typeof o['id'] === 'string' &&
    typeof o['createdAt'] === 'string' &&
    typeof o['measurementType'] === 'string' &&
    typeof o['operation'] === 'string' &&
    typeof o['expression'] === 'string' &&
    typeof o['resultSummary'] === 'string'
  );
}

function normalizeTimestamp(t: unknown): string {
  if (typeof t === 'string') {
    return t;
  }
  if (Array.isArray(t) && t.length >= 6) {
    const y = Number(t[0]);
    const mo = Number(t[1]);
    const d = Number(t[2]);
    const h = Number(t[3]);
    const mi = Number(t[4]);
    const s = Number(t[5]);
    if ([y, mo, d, h, mi, s].every((n) => Number.isFinite(n))) {
      return new Date(y, mo - 1, d, h, mi, s).toISOString();
    }
  }
  return new Date().toISOString();
}

function buildExpression(r: ConversionHistoryRow): string {
  const thatEmpty = r.thatUnit === '' || r.thatUnit == null;
  if (thatEmpty && r.thatValue === 0) {
    return `${r.thisValue} ${r.thisUnit}`;
  }
  return `${r.thisValue} ${r.thisUnit} · ${r.thatValue} ${r.thatUnit}`;
}

function formatResult(n: number): string {
  const abs = Math.abs(n);
  const digits = abs >= 1000 || abs < 0.01 ? 6 : 4;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}
