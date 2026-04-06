import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  protected readonly route = inject(ActivatedRoute);

  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.group({
    userName: this.fb.nonNullable.control('', { validators: [Validators.required] }),
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
      this.errorMessage = 'Please enter user name and password.';
      return;
    }
    const { userName, password } = this.form.getRawValue();
    this.auth.login(userName, password);
    this.navigateAfterAuth();
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
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
