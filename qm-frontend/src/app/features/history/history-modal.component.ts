import { CommonModule } from '@angular/common';
import { Component, HostListener, effect, inject } from '@angular/core';
import type { HistoryEntryDto } from '../../core/models/history.models';
import { HistoryService } from '../../core/services/history.service';
import { HistoryUiService } from '../../core/services/history-ui.service';

@Component({
  selector: 'app-history-modal',
  imports: [CommonModule],
  templateUrl: './history-modal.component.html',
  styleUrl: './history-modal.component.css',
})
export class HistoryModalComponent {
  private readonly historyApi = inject(HistoryService);
  protected readonly historyUi = inject(HistoryUiService);

  protected entries: HistoryEntryDto[] = [];
  protected loading = false;
  protected errorMessage = '';
  protected clearMessage = '';

  constructor() {
    // Reload whenever `HistoryUiService.requestReload()` is called.
    effect(() => {
      this.historyUi.reloadTick();
      this.load();
    });
  }

  protected load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.historyApi.list().subscribe({
      next: (rows) => {
        this.entries = rows;
        this.loading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.loading = false;
      },
    });
  }

  protected clearAll(): void {
    this.clearMessage = '';
    this.errorMessage = '';
    this.historyApi.clear().subscribe({
      next: () => {
        this.entries = [];
        this.clearMessage = 'History cleared.';
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
      },
    });
  }

  protected close(): void {
    this.historyUi.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
