import { Injectable } from '@angular/core';
import type {
  LengthUnit,
  MeasurementComputeResult,
  MeasurementType,
  Operation,
  TemperatureUnit,
  VolumeUnit,
  WeightUnit,
} from '../models/measurement.models';
import {
  LENGTH_UNITS,
  TEMPERATURE_UNITS,
  VOLUME_UNITS,
  WEIGHT_UNITS,
} from '../models/measurement.models';

/** Canonical base: LENGTH → metres, VOLUME → litres, WEIGHT → kg, TEMPERATURE → Celsius. */
@Injectable({ providedIn: 'root' })
export class MeasurementService {
  unitsFor(type: MeasurementType): readonly string[] {
    switch (type) {
      case 'LENGTH':
        return LENGTH_UNITS;
      case 'VOLUME':
        return VOLUME_UNITS;
      case 'WEIGHT':
        return WEIGHT_UNITS;
      case 'TEMPERATURE':
        return TEMPERATURE_UNITS;
      default: {
        const _exhaustive: never = type;
        return _exhaustive;
      }
    }
  }

  compute(
    measurementType: MeasurementType,
    operation: Operation,
    value1: number,
    unit1: string,
    value2: number | null,
    unit2: string,
  ): MeasurementComputeResult {
    if (operation === 'CONVERT') {
      const v = this.convertToUnit(measurementType, value1, unit1, unit2);
      return { kind: 'convert', valueInTargetUnit: v, targetUnit: unit2 };
    }

    if (value2 === null || Number.isNaN(value2)) {
      throw new Error('Second value is required for this operation.');
    }

    // Backend parity:
    // - Normalize both values to a base unit (Length: inch, Volume: litre, Weight: kilogram, Temperature: celsius)
    // - Temperature only supports CONVERT and COMPARE.
    const b1 = this.toBase(measurementType, value1, unit1 as never);
    const b2 = this.toBase(measurementType, value2, unit2 as never);

    if (operation === 'COMPARE') {
      // Backend uses 0.0001 tolerance across types.
      const equal = Math.abs(b1 - b2) < 0.0001;
      return { kind: 'compare', outcome: equal ? 'equal' : 'secondGreater', targetUnit: '' };
    }

    if (measurementType === 'TEMPERATURE') {
      throw new Error(`${capitalize(operation)} not supported for Temperature`);
    }

    let baseResult: number;
    switch (operation) {
      case 'ADD':
        baseResult = b1 + b2;
        // Backend returns result in unit1 (not unit2).
        return {
          kind: 'numeric',
          valueInTargetUnit: this.fromBase(measurementType, baseResult, unit1 as never),
          targetUnit: unit1,
        };
      case 'SUBTRACT':
        baseResult = b1 - b2;
        // Backend returns result in unit1 (not unit2).
        return {
          kind: 'numeric',
          valueInTargetUnit: this.fromBase(measurementType, baseResult, unit1 as never),
          targetUnit: unit1,
        };
      case 'MULTIPLY':
        // Backend multiplies base values; for the UI we show the first unit.
        baseResult = b1 * b2;
        return { kind: 'numeric', valueInTargetUnit: baseResult, targetUnit: unit1 };
      case 'DIVIDE':
        if (Math.abs(b2) < 1e-15) {
          throw new Error('Cannot divide by zero (second value).');
        }
        // Backend divides base values; for the UI we show the first unit.
        baseResult = b1 / b2;
        return { kind: 'numeric', valueInTargetUnit: baseResult, targetUnit: unit1 };
      default: {
        const _ex: never = operation;
        return _ex;
      }
    }
  }

  convertToUnit(
    type: MeasurementType,
    value: number,
    fromUnit: string,
    toUnit: string,
  ): number {
    const base = this.toBase(type, value, fromUnit as never);
    return this.fromBase(type, base, toUnit as never);
  }

  private toBase(
    type: MeasurementType,
    value: number,
    unit: LengthUnit | VolumeUnit | WeightUnit | TemperatureUnit,
  ): number {
    switch (type) {
      case 'LENGTH':
        return lengthToMetres(unit as LengthUnit, value);
      case 'VOLUME':
        return volumeToLitres(unit as VolumeUnit, value);
      case 'WEIGHT':
        return weightToKg(unit as WeightUnit, value);
      case 'TEMPERATURE':
        return temperatureToCelsius(unit as TemperatureUnit, value);
      default: {
        const _e: never = type;
        return _e;
      }
    }
  }

  private fromBase(
    type: MeasurementType,
    base: number,
    unit: LengthUnit | VolumeUnit | WeightUnit | TemperatureUnit,
  ): number {
    switch (type) {
      case 'LENGTH':
        return metresToLength(unit as LengthUnit, base);
      case 'VOLUME':
        return litresToVolume(unit as VolumeUnit, base);
      case 'WEIGHT':
        return kgToWeight(unit as WeightUnit, base);
      case 'TEMPERATURE':
        return celsiusToTemperature(unit as TemperatureUnit, base);
      default: {
        const _e: never = type;
        return _e;
      }
    }
  }
}

function capitalize(s: string): string {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

function lengthToMetres(u: LengthUnit, v: number): number {
  switch (u) {
    case 'Inch':
      return v * 0.0254;
    case 'Feet':
      return v * 0.3048;
    case 'Yard':
      return v * 0.9144;
    case 'Meter':
      return v;
    default: {
      const _e: never = u;
      return _e;
    }
  }
}

function metresToLength(u: LengthUnit, m: number): number {
  switch (u) {
    case 'Inch':
      return m / 0.0254;
    case 'Feet':
      return m / 0.3048;
    case 'Yard':
      return m / 0.9144;
    case 'Meter':
      return m;
    default: {
      const _e: never = u;
      return _e;
    }
  }
}

/** US liquid gallon */
function volumeToLitres(u: VolumeUnit, v: number): number {
  switch (u) {
    case 'Litre':
      return v;
    case 'Millilitre':
      return v / 1000;
    case 'Gallon':
      return v * 3.785411784;
    default: {
      const _e: never = u;
      return _e;
    }
  }
}

function litresToVolume(u: VolumeUnit, l: number): number {
  switch (u) {
    case 'Litre':
      return l;
    case 'Millilitre':
      return l * 1000;
    case 'Gallon':
      return l / 3.785411784;
    default: {
      const _e: never = u;
      return _e;
    }
  }
}

function weightToKg(u: WeightUnit, v: number): number {
  switch (u) {
    case 'Kilogram':
      return v;
    case 'Gram':
      return v / 1000;
    case 'Pound':
      return v * 0.45359237;
    default: {
      const _e: never = u;
      return _e;
    }
  }
}

function kgToWeight(u: WeightUnit, kg: number): number {
  switch (u) {
    case 'Kilogram':
      return kg;
    case 'Gram':
      return kg * 1000;
    case 'Pound':
      return kg / 0.45359237;
    default: {
      const _e: never = u;
      return _e;
    }
  }
}

function temperatureToCelsius(u: TemperatureUnit, v: number): number {
  switch (u) {
    case 'Celsius':
      return v;
    case 'Fahrenheit':
      return ((v - 32) * 5) / 9;
    default: {
      const _e: never = u;
      return _e;
    }
  }
}

function celsiusToTemperature(u: TemperatureUnit, c: number): number {
  switch (u) {
    case 'Celsius':
      return c;
    case 'Fahrenheit':
      return (c * 9) / 5 + 32;
    default: {
      const _e: never = u;
      return _e;
    }
  }
}
