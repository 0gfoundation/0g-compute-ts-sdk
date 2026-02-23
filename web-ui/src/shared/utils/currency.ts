import { APP_CONSTANTS } from '../constants/app';

/**
 * Converts neuron units to 0G units
 * @param value - Value in neuron (wei equivalent for 0G)
 * @returns Value in 0G (ether equivalent for 0G)
 * @example
 * ```typescript
 * const a0gi = neuronToA0gi(BigInt('1000000000000000000')); // Returns 1
 * ```
 */
export const neuronToA0gi = (value: bigint): number => {
  return parseFloat(neuronToA0giString(value));
};

/**
 * Converts 0G units to neuron units
 * @param value - Value in 0G (ether equivalent for 0G)
 * @returns Value in neuron (wei equivalent for 0G)
 * @example
 * ```typescript
 * const neuron = a0giToNeuron(1); // Returns BigInt('1000000000000000000')
 * ```
 */
export const a0giToNeuron = (value: number): bigint => {
  const valueStr = value.toFixed(APP_CONSTANTS.BLOCKCHAIN.NEURON_DECIMALS);
  const parts = valueStr.split('.');
  
  // Handle integer part
  const integerPart = parts[0];
  let integerPartAsBigInt = BigInt(integerPart) * (BigInt(10) ** BigInt(APP_CONSTANTS.BLOCKCHAIN.NEURON_DECIMALS));
  
  // Handle fractional part if it exists
  if (parts.length > 1) {
    let fractionalPart = parts[1];
    while (fractionalPart.length < APP_CONSTANTS.BLOCKCHAIN.NEURON_DECIMALS) {
      fractionalPart += '0';
    }
    if (fractionalPart.length > APP_CONSTANTS.BLOCKCHAIN.NEURON_DECIMALS) {
      fractionalPart = fractionalPart.slice(0, APP_CONSTANTS.BLOCKCHAIN.NEURON_DECIMALS);
    }
    
    const fractionalPartAsBigInt = BigInt(fractionalPart);
    integerPartAsBigInt += fractionalPartAsBigInt;
  }
  
  return integerPartAsBigInt;
};

/**
 * Converts neuron units to a precise 0G decimal string without float precision loss.
 * Uses pure BigInt arithmetic and string operations.
 * @param value - Value in neuron (BigInt)
 * @returns Exact decimal string representation in 0G units
 * @example
 * ```typescript
 * neuronToA0giString(BigInt('1000000000000000000')); // "1"
 * neuronToA0giString(BigInt('1234567890000000000000')); // "1234.56789"
 * neuronToA0giString(1n); // "0.000000000000000001"
 * ```
 */
export const neuronToA0giString = (value: bigint): string => {
  if (value === BigInt(0)) return '0';
  const isNegative = value < BigInt(0);
  const abs = isNegative ? -value : value;
  const decimals = APP_CONSTANTS.BLOCKCHAIN.NEURON_DECIMALS;
  const divisor = BigInt(10) ** BigInt(decimals);
  const intPart = abs / divisor;
  const remainder = abs % divisor;
  const decStr = remainder.toString().padStart(decimals, '0').replace(/0+$/, '');
  const sign = isNegative ? '-' : '';
  return decStr ? `${sign}${intPart}.${decStr}` : `${sign}${intPart}`;
};

/**
 * Converts a 0G decimal string (as produced by neuronToA0giString) back to neuron BigInt
 * without any floating-point intermediate step.
 * @param value - Decimal string in 0G units (e.g. "1234.56789")
 * @returns Value in neuron (BigInt)
 * @example
 * ```typescript
 * a0giStringToNeuron("1");                    // BigInt('1000000000000000000')
 * a0giStringToNeuron("1234.56789");           // BigInt('1234567890000000000000')
 * a0giStringToNeuron("0.000000000000000001"); // BigInt(1)
 * a0giStringToNeuron("0");                    // BigInt(0)
 * ```
 */
export const a0giStringToNeuron = (value: string): bigint => {
  if (!value || value === '0') return BigInt(0);
  const isNegative = value.startsWith('-');
  const abs = isNegative ? value.slice(1) : value;
  const [intPart, decPart = ''] = abs.split('.');
  const decimals = APP_CONSTANTS.BLOCKCHAIN.NEURON_DECIMALS;
  const padded = decPart.padEnd(decimals, '0').slice(0, decimals);
  const result = BigInt(intPart) * (BigInt(10) ** BigInt(decimals)) + BigInt(padded);
  return isNegative ? -result : result;
};

/**
 * Formats a balance for display with appropriate decimal places
 * @param balance - Balance in 0G
 * @param maxDecimals - Maximum decimal places to show (default: 6)
 * @returns Formatted balance string
 */
export const formatBalance = (balance: number, maxDecimals: number = 6): string => {
  if (balance === 0) return '0';

  const formatted = balance.toFixed(maxDecimals);
  // Remove trailing zeros
  return formatted.replace(/\.?0+$/, '');
};