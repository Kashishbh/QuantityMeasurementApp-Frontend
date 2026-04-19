import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./landing/landing-page.component').then((m) => m.LandingPageComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/auth/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'oauth-callback',
    loadComponent: () =>
      import('./features/auth/oauth-callback.component').then((m) => m.OauthCallbackComponent),
  },
  { path: '**', redirectTo: '' },
];
