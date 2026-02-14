/**
 * Deposit preset amounts for different networks
 */

export const DEPOSIT_PRESETS = {
  mainnet: [
    { value: 3, label: "3 0G" },
    { value: 10, label: "10 0G" },
    { value: 25, label: "25 0G" },
    { value: 50, label: "50 0G" },
  ],
  testnet: [
    { value: 0.1, label: "0.1 0G" },
    { value: 1, label: "1 0G" },
    { value: 5, label: "5 0G" },
    { value: 10, label: "10 0G" },
  ],
} as const;
