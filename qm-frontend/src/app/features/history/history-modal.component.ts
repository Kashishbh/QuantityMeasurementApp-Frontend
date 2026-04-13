import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, effect, inject } from '@angular/core';
import { describeHttpError } from '../../core/http/http-error';
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
  protected readonly historyApi = inject(HistoryService);
  protected readonly historyUi = inject(HistoryUiService);
  private readonly cdr = inject(ChangeDetectorRef);

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
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.errorMessage = describeHttpError(err);
        this.loading = false;
        this.cdr.markForCheck();
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
      error: (err: unknown) => {
        this.errorMessage = describeHttpError(err);
        this.cdr.markForCheck();
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
