import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { describeHttpError } from '../../core/http/http-error';
import { AuthService } from '../../core/services/auth.service';

/** Matches user-service password rules (same special set as Java `[@#$%^&+=!]`). */
const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/;

function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const raw = control.value as string | undefined;
  if (raw == null || raw === '') {
    return null;
  }
  const v = raw.trim();
  if (v.length === 0) {
    return null;
  }
  return STRONG_PASSWORD_PATTERN.test(v) ? null : { strongPassword: true };
}

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const p = (group.get('password')?.value as string | undefined)?.trim();
  const c = (group.get('confirm')?.value as string | undefined)?.trim();
  if (p === undefined || c === undefined) {
    return null;
  }
  if (p !== c) {
    return { mismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-signup',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly route = inject(ActivatedRoute);

  protected readonly showPassword = signal(false);
  protected readonly submitting = signal(false);

  protected readonly form = this.fb.group(
    {
      name: this.fb.nonNullable.control('', { validators: [Validators.required] }),
      email: this.fb.nonNullable.control('', {
        validators: [Validators.required, Validators.email],
      }),
      password: this.fb.nonNullable.control('', {
        validators: [Validators.required, strongPasswordValidator],
      }),
      confirm: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    },
    { validators: [passwordsMatch] },
  );

  protected errorMessage = '';

  protected submit(): void {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = this.describeFormErrors();
      this.cdr.markForCheck();
      return;
    }
    const raw = this.form.getRawValue();
    const name = raw.name.trim();
    const email = raw.email.trim();
    const password = raw.password.trim();
    this.submitting.set(true);
    this.auth
      .register(name, email, password)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.cdr.markForCheck();
          const next = this.route.snapshot.queryParamMap.get('next');
          if (next === 'history') {
            void this.router.navigate(['/'], { queryParams: { openHistory: '1' } });
            return;
          }
          void this.router.navigate(['/']);
        },
        error: (err: unknown) => {
          this.errorMessage = describeHttpError(err);
          this.cdr.markForCheck();
        },
      });
  }

  private describeFormErrors(): string {
    const c = this.form.controls;
    if (c.name.hasError('required')) {
      return 'Please enter your name.';
    }
    if (c.email.hasError('required')) {
      return 'Please enter your email.';
    }
    if (c.email.hasError('email')) {
      return 'Please enter a valid email address.';
    }
    if (c.password.hasError('required')) {
      return 'Please enter a password.';
    }
    if (c.password.hasError('strongPassword')) {
      return (
        'Password must be at least 8 characters and include uppercase, lowercase, a number, ' +
        'and one special character from: @ # $ % ^ & + = !'
      );
    }
    if (c.confirm.hasError('required')) {
      return 'Please confirm your password.';
    }
    if (this.form.hasError('mismatch')) {
      return 'Password and confirmation do not match (check spaces at the end).';
    }
    return 'Please fix the highlighted fields.';
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected signInWithGoogle(): void {
    const base = environment.googleOAuthAuthorizeUrl?.trim();
    if (!base) {
      this.errorMessage = 'Google sign-in is not configured (googleOAuthAuthorizeUrl).';
      this.cdr.markForCheck();
      return;
    }
    window.location.href = base;
  }
}
