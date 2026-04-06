import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { HistoryEntryDto, SaveHistoryRequestDto } from '../models/history.models';

const LS_KEY = 'qm_history_entries';

function historyMarkerUrl(): string {
  const base = environment.apiUrl.replace(/\/$/, '');
  return `${base}/history`;
}

function readEntries(): HistoryEntryDto[] {
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

function writeEntries(entries: HistoryEntryDto[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(entries));
}

/**
 * Intercepts requests to `${environment.apiUrl}/history` when no backend is available.
 * Persists mock data in localStorage so refresh keeps history.
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const marker = historyMarkerUrl();
  if (!req.url.includes(marker)) {
    return next(req);
  }

  if (req.method === 'GET') {
    const entries = readEntries().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return of(new HttpResponse({ status: 200, body: entries }));
  }

  if (req.method === 'POST') {
    const body = req.body as SaveHistoryRequestDto;
    const entry: HistoryEntryDto = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      measurementType: String(body?.measurementType ?? ''),
      operation: String(body?.operation ?? ''),
      expression: String(body?.expression ?? ''),
      resultSummary: String(body?.resultSummary ?? ''),
    };
    const all = [entry, ...readEntries()];
    writeEntries(all);
    return of(new HttpResponse({ status: 201, body: entry }));
  }

  if (req.method === 'DELETE') {
    writeEntries([]);
    return of(new HttpResponse({ status: 204, body: null }));
  }

  return next(req);
};
