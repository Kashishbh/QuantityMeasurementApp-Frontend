import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HistoryUiService {
  readonly isOpen = signal(false);
  readonly reloadTick = signal(0);

  open(): void {
    this.isOpen.set(true);
    // Bumps reload tick so the modal (when mounted) always refetches; also helps any future always-mounted UI.
    this.reloadTick.update((v) => v + 1);
  }

  close(): void {
    this.isOpen.set(false);
  }

  /** Trigger the modal to reload entries (e.g., after a save). */
  requestReload(): void {
    this.reloadTick.update((v) => v + 1);
  }
}
