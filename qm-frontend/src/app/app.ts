import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HistoryModalComponent } from './features/history/history-modal.component';
import { HistoryUiService } from './core/services/history-ui.service';
import { ThemeService } from './core/services/theme.service';
import { AppHeaderComponent } from './layout/app-header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppHeaderComponent, HistoryModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly historyUi = inject(HistoryUiService);

  constructor() {
    inject(ThemeService);
  }
}
