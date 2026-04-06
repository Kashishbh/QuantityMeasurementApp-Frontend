import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type {
  MeasurementType,
  Operation,
} from '../../core/models/measurement.models';
import { AuthService } from '../../core/services/auth.service';
import { HistoryService } from '../../core/services/history.service';
import { HistoryUiService } from '../../core/services/history-ui.service';
import { MeasurementService } from '../../core/services/measurement.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly fb = inject(FormBuilder);
  private readonly measurement = inject(MeasurementService);
  private readonly historyApi = inject(HistoryService);
  private readonly historyUi = inject(HistoryUiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly form = this.fb.group({
    measurementType: this.fb.nonNullable.control<MeasurementType>('LENGTH'),
    operation: this.fb.nonNullable.control<Operation>('CONVERT'),
    value1: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    unit1: this.fb.nonNullable.control('Inch'),
    value2: this.fb.nonNullable.control(''),
    unit2: this.fb.nonNullable.control('Meter'),
  });

  protected resultText = '';
  protected errorMessage = '';
  protected saveMessage = '';
  protected saveError = '';

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.form.controls.measurementType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((t) => this.applyDefaultsForType(t));

    this.form.controls.operation.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateValue2Validators());

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const open = params.get('openHistory');
      if (open === '1' || open === 'true') {
        if (this.auth.canViewHistory()) {
          this.historyUi.open();
        }
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { openHistory: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });

    this.applyDefaultsForType(this.form.controls.measurementType.getRawValue());
    this.updateValue2Validators();
  }

  protected measurementTypes: MeasurementType[] = ['LENGTH', 'VOLUME', 'WEIGHT', 'TEMPERATURE'];

  protected operations: Operation[] = [
    'CONVERT',
    'COMPARE',
    'ADD',
    'SUBTRACT',
    'MULTIPLY',
    'DIVIDE',
  ];

  protected units(): readonly string[] {
    return this.measurement.unitsFor(this.form.controls.measurementType.getRawValue());
  }

  protected showSecondRow(): boolean {
    return this.form.controls.operation.getRawValue() !== 'CONVERT';
  }

  protected compute(): void {
    this.errorMessage = '';
    this.resultText = '';
    this.saveMessage = '';
    this.saveError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    const type = this.form.controls.measurementType.getRawValue();
    const op = this.form.controls.operation.getRawValue();
    const v1 = this.parseNumber(this.form.controls.value1.getRawValue());
    const unit1 = this.form.controls.unit1.getRawValue();
    const unit2 = this.form.controls.unit2.getRawValue();

    if (v1 === null) {
      this.errorMessage = 'First value must be a valid number.';
      return;
    }

    let v2: number | null = null;
    if (op !== 'CONVERT') {
      v2 = this.parseNumber(this.form.controls.value2.getRawValue());
      if (v2 === null) {
        this.errorMessage = 'Second value must be a valid number.';
        return;
      }
    }

    try {
      const res = this.measurement.compute(type, op, v1, unit1, v2, unit2);
      if (res.kind === 'convert') {
        this.resultText = this.formatWithUnit(res.valueInTargetUnit, res.targetUnit);
      } else if (res.kind === 'compare') {
        // Backend parity: COMPARE is equality with tolerance.
        this.resultText =
          res.outcome === 'equal' ? 'Equal (within tolerance)' : 'Not equal';
      } else {
        this.resultText = this.formatWithUnit(res.valueInTargetUnit, res.targetUnit);
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Could not compute.';
    }
  }

  protected swapUnits(): void {
    const u1 = this.form.controls.unit1.getRawValue();
    const u2 = this.form.controls.unit2.getRawValue();
    const v1 = this.form.controls.value1.getRawValue();
    const v2 = this.form.controls.value2.getRawValue();
    this.form.patchValue({
      unit1: u2,
      unit2: u1,
      value1: v2,
      value2: v1,
    });
  }

  protected saveToHistory(): void {
    this.saveMessage = '';
    this.saveError = '';
    if (!this.resultText) {
      this.saveError = 'Run a calculation first.';
      return;
    }

    const type = this.form.controls.measurementType.getRawValue();
    const op = this.form.controls.operation.getRawValue();
    const v1 = this.form.controls.value1.getRawValue();
    const u1 = this.form.controls.unit1.getRawValue();
    const v2 = this.form.controls.value2.getRawValue();
    const u2 = this.form.controls.unit2.getRawValue();

    const expression =
      op === 'CONVERT'
        ? `${v1} ${u1} → ${u2}`
        : `${v1} ${u1}, ${v2} ${u2}`;

    this.historyApi
      .save({
        measurementType: type,
        operation: op,
        expression,
        resultSummary: this.resultText,
      })
      .subscribe({
        next: () => {
          this.saveMessage = 'Saved to history.';
          if (this.historyUi.isOpen()) {
            // If the modal is currently open, refresh it so the new entry appears immediately.
            this.historyUi.requestReload();
          }
        },
        error: (err: Error) => {
          this.saveError = err.message;
        },
      });
  }

  private applyDefaultsForType(t: MeasurementType): void {
    const units = this.measurement.unitsFor(t);
    const u1 = units[0] ?? 'Meter';
    const u2 = units[1] ?? u1;
    this.form.patchValue({ unit1: u1, unit2: u2 });
  }

  private updateValue2Validators(): void {
    const op = this.form.controls.operation.getRawValue();
    const c = this.form.controls.value2;
    if (op === 'CONVERT') {
      c.clearValidators();
    } else {
      c.setValidators([Validators.required]);
    }
    c.updateValueAndValidity();
  }

  private parseNumber(raw: string): number | null {
    const t = raw.trim().replace(',', '.');
    if (t === '') {
      return null;
    }
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }

  private formatNum(n: number): string {
    const abs = Math.abs(n);
    const digits = abs >= 1000 || abs < 0.01 ? 6 : 4;
    return n.toLocaleString(undefined, { maximumFractionDigits: digits });
  }

  private formatWithUnit(value: number, unit: string): string {
    const u = unit.trim();
    return u ? `${this.formatNum(value)} ${u}` : this.formatNum(value);
  }
}
