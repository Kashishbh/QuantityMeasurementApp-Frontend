import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';
import { environment } from '../environments/environment';

const httpInterceptors = environment.useMockHistory
  ? [authInterceptor, mockApiInterceptor]
  : [authInterceptor];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors(httpInterceptors)),
  ],
};
