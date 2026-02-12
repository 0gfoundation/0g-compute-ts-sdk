/**
 * Format numbers with dynamic precision based on value size
 * Unified formatting utility for the entire application
 *
 * @param value - Number or string to format
 * @param precision - 'display' (default): adaptive decimals for UI display;
 *                    'full': up to 18 decimals without grouping (for confirmations)
 *
 * Display precision rules:
 * - Very small (< 0.000001): 12 decimal places
 * - Small (< 0.01): 8 decimal places
 * - Normal (< 1000): 6 decimal places
 * - Large (>= 1000): 6 decimal places with thousand separators
 */
export const formatNumber = (value: string | number, precision: 'display' | 'full' = 'display'): string => {
  if (value === '' || value === null || value === undefined) return '--';
  if (value === '0' || value === 0) return '0';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || !isFinite(num)) return '--';

  if (precision === 'full') {
    return num.toLocaleString('en-US', {
      useGrouping: false,
      minimumFractionDigits: 0,
      maximumFractionDigits: 18,
    });
  }

  // For very small numbers, show more precision
  if (Math.abs(num) < 0.000001) {
    return num.toFixed(12).replace(/\.?0+$/, '');
  }
  // For small numbers
  else if (Math.abs(num) < 0.01) {
    return num.toFixed(8).replace(/\.?0+$/, '');
  }
  // For normal numbers
  else if (Math.abs(num) < 1000) {
    return num.toFixed(6).replace(/\.?0+$/, '');
  }
  // For large numbers, use comma separators
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
};

