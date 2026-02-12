/**
 * Minimum deposit and transfer amounts for the 0G Compute Network
 *
 * Based on feedback: unified minimum is 1 0G for all top-ups
 */

export const MINIMUM_DEPOSITS = {
  // Initial account creation (first-time deposit to ledger)
  INITIAL_MAINNET: 3,      // Mainnet initial account
  INITIAL_TESTNET: 0.1,    // Testnet initial account

  // Subsequent deposits to ledger (wallet page)
  TOPUP_LEDGER: 1,         // Minimum top-up to ledger: 1 0G

  // Transfer to provider subaccount
  TOPUP_PROVIDER: 1,       // Minimum transfer to provider: 1 0G
} as const;

export const RECOMMENDED_DEPOSITS = {
  MAINNET: 10,  // Recommended initial deposit for mainnet
  TESTNET: 1,   // Recommended initial deposit for testnet
} as const;
