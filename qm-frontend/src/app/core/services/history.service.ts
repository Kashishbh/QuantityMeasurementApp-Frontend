import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { HistoryEntryDto, SaveHistoryRequestDto } from '../models/history.models';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly http = inject(HttpClient);

  private url(): string {
    const base = environment.apiUrl.replace(/\/$/, '');
    return `${base}/history`;
  }

  list(): Observable<HistoryEntryDto[]> {
    return this.http.get<HistoryEntryDto[]>(this.url()).pipe(
      catchError((e) => throwError(() => this.mapError(e))),
    );
  }

  save(entry: SaveHistoryRequestDto): Observable<HistoryEntryDto> {
    return this.http.post<HistoryEntryDto>(this.url(), entry).pipe(
      catchError((e) => throwError(() => this.mapError(e))),
    );
  }

  clear(): Observable<void> {
    return this.http.delete<void>(this.url()).pipe(
      catchError((e) => throwError(() => this.mapError(e))),
    );
  }

  private mapError(err: unknown): Error {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { message?: string } | string | null;
      const msg =
        typeof body === 'object' && body && 'message' in body && typeof body.message === 'string'
          ? body.message
          : typeof body === 'string'
            ? body
            : err.message;
      return new Error(msg || `Request failed (${err.status})`);
    }
    if (err instanceof Error) {
      return err;
    }
    return new Error('Unknown error');
  }
}
