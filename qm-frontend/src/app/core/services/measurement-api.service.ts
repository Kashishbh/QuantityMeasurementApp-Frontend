import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { describeHttpError } from '../http/http-error';
import { environment } from '../../../environments/environment';
import type { MeasurementType, Operation } from '../models/measurement.models';
import { unitToBackend } from './unit-mapping';

export interface QuantityInputPayload {
  thisQuantityDTO: { value: number; unit: string };
  thatQuantityDTO: { value: number; unit: string };
  measurementType: string;
}

@Injectable({ providedIn: 'root' })
export class MeasurementApiService {
  private readonly http = inject(HttpClient);

  private apiRoot(): string {
    return environment.apiUrl.replace(/\/$/, '');
  }

  private quantitiesPath(suffix: string): string {
    const root = this.apiRoot();
    const path = `/api/v1/quantities/${suffix}`;
    return root ? `${root}${path}` : path;
  }

  runOperation(
    operation: Operation,
    measurementType: MeasurementType,
    value1: number,
    unit1: string,
    value2: number | null,
    unit2: string,
    userId: number | null,
  ): Observable<boolean | number> {
    const uid = userId != null && userId > 0 ? userId : 0;
    const mt = measurementType.toUpperCase();

    if (operation === 'CONVERT') {
      const params = new HttpParams()
        .set('value', String(value1))
        .set('fromUnit', unitToBackend(unit1))
        .set('toUnit', unitToBackend(unit2))
        .set('measurementType', mt)
        .set('userId', String(uid));
      return this.http
        .post<number>(this.quantitiesPath('convert'), null, { params })
        .pipe(catchError((e) => throwError(() => this.mapError(e))));
    }

    const pathSuffix =
      operation === 'COMPARE'
        ? 'compare'
        : operation === 'ADD'
          ? 'add'
          : operation === 'SUBTRACT'
            ? 'subtract'
            : operation === 'MULTIPLY'
              ? 'multiply'
              : 'divide';

    if (value2 === null) {
      return throwError(() => new Error('Second value is required for this operation.'));
    }

    const body: QuantityInputPayload = {
      thisQuantityDTO: { value: value1, unit: unitToBackend(unit1) },
      thatQuantityDTO: { value: value2, unit: unitToBackend(unit2) },
      measurementType: mt,
    };

    const params = new HttpParams().set('userId', String(uid));
    const url = this.quantitiesPath(pathSuffix);

    if (operation === 'COMPARE') {
      return this.http
        .post<boolean>(url, body, { params })
        .pipe(catchError((e) => throwError(() => this.mapError(e))));
    }

    return this.http
      .post<number>(url, body, { params })
      .pipe(catchError((e) => throwError(() => this.mapError(e))));
  }

  private mapError(err: unknown): Error {
    if (err instanceof HttpErrorResponse) {
      return new Error(describeHttpError(err));
    }
    if (err instanceof Error) {
      return err;
    }
    return new Error(describeHttpError(err));
  }
}
