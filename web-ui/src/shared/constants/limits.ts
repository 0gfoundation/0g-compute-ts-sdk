/**
 * Minimum deposit and transfer amounts for the 0G Compute Network
 *
 * Provider sub-accounts require a minimum locked balance of 3 0G
 * to serve requests (matches MinimumLockedBalance in broker proxy).
 */

export const MINIMUM_DEPOSITS = {
  // Initial account creation (first-time deposit to ledger)
  INITIAL_MAINNET: 3,      // Mainnet initial account (matches contract MIN_ACCOUNT_BALANCE)
  INITIAL_TESTNET: 0.1,    // Testnet initial account

  // Subsequent deposits to ledger (wallet page)
  TOPUP_LEDGER: 1,         // Minimum top-up to ledger: 1 0G

  // Transfer to provider subaccount
  TOPUP_PROVIDER: 3,       // Minimum transfer to provider: 3 0G (matches broker proxy MinimumLockedBalance)
} as const;

export const RECOMMENDED_DEPOSITS = {
  MAINNET: 10,  // Recommended initial deposit for mainnet
  TESTNET: 1,   // Recommended initial deposit for testnet
} as const;
