import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'qm_theme';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.readInitial());

  constructor() {
    this.apply(this.mode());
  }

  toggle(): void {
    const next: ThemeMode = this.mode() === 'light' ? 'dark' : 'light';
    this.set(next);
  }

  set(mode: ThemeMode): void {
    localStorage.setItem(STORAGE_KEY, mode);
    this.mode.set(mode);
    this.apply(mode);
  }

  private apply(mode: ThemeMode): void {
    document.documentElement.dataset['theme'] = mode;
    document.documentElement.style.colorScheme = mode === 'dark' ? 'dark' : 'light';
  }

  private readInitial(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch {
      /* ignore */
    }
    return 'light';
  }
}
