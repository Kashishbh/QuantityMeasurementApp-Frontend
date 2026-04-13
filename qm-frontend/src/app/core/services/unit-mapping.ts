/** Maps UI unit labels to backend enum strings (see measurement-service). */
const UI_TO_BACKEND: Readonly<Record<string, string>> = {
  Inch: 'INCH',
  Feet: 'FEET',
  Yard: 'YARD',
  Meter: 'METER',
  Litre: 'LITRE',
  Millilitre: 'MILLILITRE',
  Gallon: 'GALLON',
  Kilogram: 'KILOGRAM',
  Gram: 'GRAM',
  Pound: 'POUND',
  Celsius: 'CELSIUS',
  Fahrenheit: 'FAHRENHEIT',
};

export function unitToBackend(unit: string): string {
  const mapped = UI_TO_BACKEND[unit.trim()];
  if (mapped) {
    return mapped;
  }
  return unit.trim().toUpperCase().replace(/\s+/g, '');
}
