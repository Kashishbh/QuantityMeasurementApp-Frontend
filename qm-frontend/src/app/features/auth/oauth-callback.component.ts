import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { describeHttpError } from '../../core/http/http-error';
import { AuthService } from '../../core/services/auth.service';

/**
 * Google OAuth completion route. Backend must redirect here with `#token=...&email=...` (URL-encoded).
 *
 * **"User not found" fix (user-service):** JWT subject must be the **Google email** in `users`.
 * Use `OAuth2User.getAttribute("email")` — not `authentication.getName()` (often Google `"sub"`).
 * See `parseOAuthRedirectHash` + `AuthService.completeOAuthLogin` and Java snippet in repo comments.
 */
@Component({
  selector: 'app-oauth-callback',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="card" role="status">
        <h1 class="title">Signing you in…</h1>
        @if (errorMessage) {
          <p class="alert" role="alert">{{ errorMessage }}</p>
          <p><a routerLink="/login">Back to login</a></p>
        }
      </div>
    </div>
  `,
  styles: `
    .auth-page {
      min-height: 40vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .card {
      max-width: 28rem;
    }
    .title {
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }
    .alert {
      color: var(--qm-danger, #c62828);
    }
  `,
})
export class OauthCallbackComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  protected errorMessage = '';

  ngOnInit(): void {
    const fromHash = parseOAuthRedirectHash(window.location.hash);
    const fromQuery = this.parseFromQuery(this.route.snapshot.queryParamMap);
    const token = fromHash.token ?? fromQuery.token;
    const oauthError = fromQuery.error ?? fromHash.error;

    if (oauthError) {
      this.errorMessage = `Google sign-in was cancelled or failed (${oauthError}).`;
      this.clearUrlFragment();
      this.cdr.markForCheck();
      return;
    }

    if (!token) {
      this.errorMessage =
        'No token in this URL. Your backend probably still returns JSON after Google login instead of redirecting ' +
        'to this page. Update OAuth2AuthenticationSuccessHandler to redirect to /oauth-callback#token=… (see source ' +
        'comment in oauth-callback.component.ts).';
      this.cdr.markForCheck();
      return;
    }

    this.auth.completeOAuthLogin(token).subscribe({
      next: () => {
        this.clearUrlFragment();
        const next = this.route.snapshot.queryParamMap.get('next');
        if (next === 'history') {
          void this.router.navigate(['/'], { queryParams: { openHistory: '1' } });
          return;
        }
        void this.router.navigate(['/']);
      },
      error: (e: unknown) => {
        this.errorMessage = e instanceof Error ? e.message : describeHttpError(e);
        this.clearUrlFragment();
        this.cdr.markForCheck();
      },
    });
  }

  private parseFromQuery(params: { get(name: string): string | null }): { token?: string; error?: string } {
    return {
      token: params.get('token') ?? undefined,
      error: params.get('error') ?? undefined,
    };
  }

  private clearUrlFragment(): void {
    if (typeof history !== 'undefined' && window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }
}

/**
 * Parse `#token=...&email=...` without URLSearchParams (which can turn JWT `+` into space).
 */
function parseOAuthRedirectHash(hash: string): { token?: string; email?: string; error?: string } {
  const raw = (hash.startsWith('#') ? hash.slice(1) : hash).trim();
  if (!raw) {
    return {};
  }
  const out: Record<string, string> = {};
  try {
    for (const part of raw.split('&')) {
      const eq = part.indexOf('=');
      if (eq === -1) {
        continue;
      }
      const key = decodeURIComponent(part.slice(0, eq));
      const val = decodeURIComponent(part.slice(eq + 1));
      out[key] = val;
    }
  } catch {
    return {};
  }
  return {
    token: out['token'],
    email: out['email'],
    error: out['error'],
  };
}
