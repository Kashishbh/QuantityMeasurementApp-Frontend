import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const p = group.get('password')?.value as string | undefined;
  const c = group.get('confirm')?.value as string | undefined;
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
  protected readonly route = inject(ActivatedRoute);

  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.group(
    {
      userName: this.fb.nonNullable.control('', { validators: [Validators.required] }),
      password: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(4)] }),
      confirm: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    },
    { validators: [passwordsMatch] },
  );

  protected errorMessage = '';

  protected submit(): void {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Please complete all fields. Passwords must match (min 4 characters).';
      return;
    }
    const { userName, password } = this.form.getRawValue();
    this.auth.signup(userName, password);
    const next = this.route.snapshot.queryParamMap.get('next');
    if (next === 'history') {
      void this.router.navigate(['/'], { queryParams: { openHistory: '1' } });
      return;
    }
    void this.router.navigate(['/']);
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
