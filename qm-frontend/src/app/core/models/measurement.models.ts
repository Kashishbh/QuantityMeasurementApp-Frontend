export type MeasurementType = 'LENGTH' | 'VOLUME' | 'WEIGHT' | 'TEMPERATURE';

export type Operation = 'CONVERT' | 'COMPARE' | 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE';

export const LENGTH_UNITS = ['Inch', 'Feet', 'Yard', 'Meter'] as const;
export type LengthUnit = (typeof LENGTH_UNITS)[number];

export const VOLUME_UNITS = ['Litre', 'Millilitre', 'Gallon'] as const;
export type VolumeUnit = (typeof VOLUME_UNITS)[number];

export const WEIGHT_UNITS = ['Kilogram', 'Gram', 'Pound'] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export const TEMPERATURE_UNITS = ['Celsius', 'Fahrenheit'] as const;
export type TemperatureUnit = (typeof TEMPERATURE_UNITS)[number];

export type UnitFor<T extends MeasurementType> = T extends 'LENGTH'
  ? LengthUnit
  : T extends 'VOLUME'
    ? VolumeUnit
    : T extends 'WEIGHT'
      ? WeightUnit
      : TemperatureUnit;

export interface MeasurementSession {
  userName: string;
  isGuest: boolean;
}

export type CompareOutcome = 'equal' | 'firstGreater' | 'secondGreater';

export interface ConvertResult {
  kind: 'convert';
  valueInTargetUnit: number;
  targetUnit: string;
}

export interface CompareResult {
  kind: 'compare';
  outcome: CompareOutcome;
  targetUnit: string;
}

export interface NumericOpResult {
  kind: 'numeric';
  valueInTargetUnit: number;
  targetUnit: string;
}

export type MeasurementComputeResult = ConvertResult | CompareResult | NumericOpResult;
