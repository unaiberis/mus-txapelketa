export type AutoSplitPreset = '50-30-15-5' | '40-30-20-10' | '60-25-10-5' | 'custom';

export function currencySymbol(currency: string): string {
  const map: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    JPY: '¥',
    CAD: '$',
    AUD: '$',
  };
  return map[currency] || currency;
}

export function percentToPresetKey(pct: [number, number, number, number]): AutoSplitPreset {
  const key = pct.join('-');
  if (key === '50-30-15-5') return '50-30-15-5';
  if (key === '40-30-20-10') return '40-30-20-10';
  if (key === '60-25-10-5') return '60-25-10-5';
  return 'custom';
}

export function presetToPercentages(preset: AutoSplitPreset): [number, number, number, number] {
  if (preset === '50-30-15-5') return [50, 30, 15, 5];
  if (preset === '40-30-20-10') return [40, 30, 20, 10];
  if (preset === '60-25-10-5') return [60, 25, 10, 5];
  return [50, 30, 15, 5];
}

export default { currencySymbol, percentToPresetKey, presetToPercentages };
