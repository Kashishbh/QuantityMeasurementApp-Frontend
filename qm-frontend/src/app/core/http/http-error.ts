import { HttpErrorResponse } from '@angular/common/http';

/**
 * Human-readable message for failed HTTP calls (network, CORS, Spring error JSON, plain text).
 */
export function describeHttpError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return (
        'Cannot reach the backend. Check that Eureka, API gateway (port 8080), measurement-service, and ' +
        'user-service are running. Use `ng serve` so requests go through proxy.conf.json. ' +
        'If you use a production build on port 4200, the gateway must allow CORS from http://localhost:4200.'
      );
    }

    const body = err.error;

    if (typeof body === 'string') {
      const t = body.trim();
      if (t.startsWith('{')) {
        try {
          const o = JSON.parse(t) as { message?: unknown };
          if (typeof o.message === 'string') {
            return o.message;
          }
        } catch {
          /* fall through */
        }
      }
      if (t.length > 0 && t.length < 800) {
        return t;
      }
    }

    if (typeof body === 'object' && body !== null) {
      const o = body as Record<string, unknown>;
      if (typeof o['message'] === 'string') {
        return o['message'];
      }
      if (typeof o['error'] === 'string') {
        return o['error'];
      }
    }

    return err.message || `Request failed (${err.status})`;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return 'Something went wrong.';
}
