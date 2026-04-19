import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { describeHttpError } from '../../core/http/http-error';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly route = inject(ActivatedRoute);

  protected readonly showPassword = signal(false);
  protected readonly submitting = signal(false);

  protected readonly form = this.fb.group({
    email: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.email],
    }),
    password: this.fb.nonNullable.control('', { validators: [Validators.required] }),
  });

  protected errorMessage = '';

  protected guestLogin(): void {
    this.errorMessage = '';
    this.auth.loginAsGuest();
    this.navigateAfterAuth();
  }

  protected submit(): void {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Please enter a valid email and password.';
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.auth
      .login(email, password)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.cdr.markForCheck();
          this.navigateAfterAuth();
        },
        error: (err: unknown) => {
          this.errorMessage = describeHttpError(err);
          this.cdr.markForCheck();
        },
      });
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  /** Full-page navigation to Spring OAuth2 (Google). */
  protected signInWithGoogle(): void {
    const base = environment.googleOAuthAuthorizeUrl?.trim();
    if (!base) {
      this.errorMessage = 'Google sign-in is not configured (googleOAuthAuthorizeUrl).';
      return;
    }
    window.location.href = base;
  }

  private navigateAfterAuth(): void {
    const next = this.route.snapshot.queryParamMap.get('next');
    if (next === 'history') {
      void this.router.navigate(['/'], { queryParams: { openHistory: '1' } });
      return;
    }
    void this.router.navigate(['/']);
  }
}
