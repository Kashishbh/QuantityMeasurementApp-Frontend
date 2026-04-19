import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { describeHttpError } from '../http/http-error';
import { environment } from '../../../environments/environment';
import type { LoginResponseDto, MeResponseDto, RegisterResponseDto } from '../models/auth.models';
import type { MeasurementSession } from '../models/measurement.models';

const STORAGE_KEY = 'qm_auth_session';

interface StoredAuthPayload extends MeasurementSession {
  token?: string;
  email?: string;
  userId?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly session = signal<StoredAuthPayload | null>(this.readSession());

  readonly user = computed(() => this.session());
  readonly token = computed(() => {
    const s = this.session();
    return s?.token ?? null;
  });
  readonly isSignedIn = computed(() => this.session() !== null);
  readonly isGuest = computed(() => this.session()?.isGuest ?? false);
  readonly isRegistered = computed(() => {
    const s = this.session();
    return s !== null && !s.isGuest && Boolean(s.token);
  });

  /** History modal and server-backed list require a real account (not guest). */
  readonly canViewHistory = computed(() => this.isRegistered());

  constructor() {
    this.syncFromStorage();
    window.addEventListener('storage', () => this.syncFromStorage());
  }

  loginAsGuest(): void {
    this.setSession({ userName: 'Guest', isGuest: true });
  }

  login(email: string, password: string): Observable<void> {
    const url = this.authUrl('/auth/login');
    return this.http.post<LoginResponseDto>(url, { email: email.trim(), password }).pipe(
      switchMap((res) => {
        if (!res?.token) {
          return throwError(() => new Error('Login response did not include a token. Check user-service logs.'));
        }
        return this.persistTokenSession(res.token, res.email);
      }),
      map(() => undefined),
      catchError((e) => throwError(() => new Error(describeHttpError(e)))),
    );
  }

  register(name: string, email: string, password: string): Observable<void> {
    const url = this.authUrl('/auth/register');
    return this.http
      .post<RegisterResponseDto>(url, {
        name: name.trim(),
        email: email.trim(),
        password,
      })
      .pipe(
        switchMap(() => this.login(email, password)),
        catchError((e) => throwError(() => new Error(describeHttpError(e)))),
      );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
  }

  /**
   * After Google OAuth, backend redirects to `/oauth-callback#token=...&email=...`.
   * `/api/users/me` must succeed — JWT subject must be the **same email** stored in `users` (see OAuth2 success handler).
   */
  completeOAuthLogin(token: string): Observable<void> {
    const trimmed = token.trim();
    if (!trimmed) {
      return throwError(() => new Error('Missing token from OAuth callback.'));
    }
    return this.persistTokenSession(trimmed, '').pipe(
      map(() => undefined),
      catchError((e: unknown) => {
        const msg = e instanceof Error ? e.message : describeHttpError(e);
        if (msg.includes('User not found')) {
          return throwError(
            () =>
              new Error(
                `${msg} — Google OAuth: JWT must use the Google **email** as subject (same as DB). ` +
                  'Use OAuth2User.getAttribute("email") in OAuth2AuthenticationSuccessHandler, not authentication.getName() (often Google "sub").',
              ),
          );
        }
        return throwError(() => (e instanceof Error ? e : new Error(msg)));
      }),
    );
  }

  /** Numeric user id for measurement-service `userId` query param; null for guests. */
  backendUserId(): number | null {
    const s = this.session();
    if (!s || s.isGuest || s.userId == null) {
      return null;
    }
    return s.userId;
  }

  private persistTokenSession(token: string, email: string): Observable<void> {
    const meUrl = this.apiUrl('/api/users/me');
    return this.http.get<MeResponseDto>(meUrl, { headers: { Authorization: `Bearer ${token}` } }).pipe(
      map((me) => {
        if (me.userId == null || Number.isNaN(Number(me.userId))) {
          throw new Error('Profile response did not include a valid userId.');
        }
        const display = me.name?.trim() || me.email;
        this.setSession({
          userName: display,
          isGuest: false,
          token,
          email: me.email,
          userId: Number(me.userId),
        });
      }),
      catchError((e) => throwError(() => new Error(describeHttpError(e)))),
    );
  }

  private authUrl(path: string): string {
    const root = environment.apiUrl.replace(/\/$/, '');
    return root ? `${root}${path}` : path;
  }

  private apiUrl(path: string): string {
    return this.authUrl(path);
  }

  private setSession(session: StoredAuthPayload): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.session.set(session);
  }

  private readSession(): StoredAuthPayload | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }
      const o = parsed as Record<string, unknown>;
      if (typeof o['userName'] !== 'string') {
        return null;
      }
      const isGuest = Boolean(o['isGuest']);
      const token = typeof o['token'] === 'string' ? o['token'] : undefined;
      const email = typeof o['email'] === 'string' ? o['email'] : undefined;
      const userId = parseStoredUserId(o['userId']);

      if (!isGuest && !token) {
        return { userName: o['userName'] as string, isGuest: true };
      }

      return {
        userName: o['userName'] as string,
        isGuest,
        token,
        email,
        userId,
      };
    } catch {
      return null;
    }
  }

  private syncFromStorage(): void {
    this.session.set(this.readSession());
  }
}

/** localStorage JSON may deserialize userId as number or string. */
function parseStoredUserId(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}
