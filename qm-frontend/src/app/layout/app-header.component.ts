import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { HistoryUiService } from '../core/services/history-ui.service';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  template: `
    <header class="header" role="banner">
      <a routerLink="/" class="brand" aria-label="Quantity Measurement App home">
        <span class="brand-mark" aria-hidden="true">QM</span>
        <span class="brand-text">Quantity Measurement App</span>
      </a>
      <nav class="nav-links" aria-label="Section navigation">
        <a class="nav-link" href="/">Home</a>
        <a class="nav-link" href="#features">Features</a>
        <a class="nav-link" href="#converter">Converter</a>
        <a class="nav-link" href="#history" (click)="onHistoryLink($event)">History</a>
      </nav>
      <div class="header-actions">
        @if (auth.isSignedIn()) {
          <span class="user-pill" aria-live="polite">
            <span class="sr-only">Signed in as </span>{{ auth.user()?.userName }}
            @if (auth.isGuest()) {
              <span class="sr-only">(guest)</span>
            }
          </span>
        }
        <button
          type="button"
          class="btn-icon"
          (click)="theme.toggle()"
          [attr.aria-pressed]="theme.mode() === 'dark'"
          [attr.aria-label]="theme.mode() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
        >
          {{ theme.mode() === 'dark' ? '☀️' : '🌙' }}
        </button>
        @if (auth.isSignedIn()) {
          <button type="button" class="btn-link" (click)="logout()">Logout</button>
        } @else {
          <a routerLink="/login" class="btn-link">Login</a>
        }
        <button type="button" class="btn-primary header-history" (click)="onHistory()">
          History
        </button>
      </div>
    </header>
  `,
  styleUrl: './app-header.component.css',
})
export class AppHeaderComponent {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly historyUi = inject(HistoryUiService);

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }

  onHistoryLink(e: MouseEvent): void {
    e.preventDefault();
    this.onHistory();
  }

  onHistory(): void {
    if (!this.auth.canViewHistory()) {
      void this.router.navigate(['/login'], { queryParams: { next: 'history' } });
      return;
    }
    this.historyUi.open();
  }
}
