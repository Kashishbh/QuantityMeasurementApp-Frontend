import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

function pathNeedsAuth(url: string): boolean {
  try {
    const u = new URL(url, 'http://local.invalid');
    const p = u.pathname;
    return p === '/api/users/me' || p === '/api/users/my-history';
  } catch {
    return url.includes('/api/users/me') || url.includes('/api/users/my-history');
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useBackendMeasurement) {
    return next(req);
  }
  if (!pathNeedsAuth(req.url)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.token();
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
