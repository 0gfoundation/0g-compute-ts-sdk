/**
 * Blockchain Error Formatting Utility
 *
 * Translates cryptic blockchain errors into user-friendly messages
 * Supports common error codes and patterns from ethers.js, wagmi, and smart contracts
 */

export interface BlockchainError extends Error {
  code?: number | string
  reason?: string
  transaction?: any
  data?: any
}

/**
 * Format blockchain errors into user-friendly messages
 *
 * @param error - The error object from blockchain operations
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await broker.ledger.transferFund(...)
 * } catch (err) {
 *   toast.error(formatBlockchainError(err))
 * }
 * ```
 */
export function formatBlockchainError(error: unknown): string {
  if (!error) {
    return 'An unknown error occurred'
  }

  if (typeof error === 'string') {
    return error
  }

  if (!(error instanceof Error)) {
    return 'An unknown error occurred'
  }

  const err = error as BlockchainError

  // User rejected transaction (MetaMask, etc.)
  if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
    return 'Transaction was cancelled in your wallet'
  }

  // User denied account access
  if (err.code === 4100) {
    return 'Please connect your wallet to continue'
  }

  // Insufficient funds for gas
  if (
    err.message?.toLowerCase().includes('insufficient funds') ||
    err.message?.toLowerCase().includes('insufficient balance')
  ) {
    // Check if it's gas-related or balance-related
    if (err.message?.toLowerCase().includes('gas')) {
      return 'Insufficient balance to pay for gas fees. Please add more funds to your wallet.'
    }
    return 'Insufficient balance for this transaction'
  }

  // Network errors
  if (
    err.message?.toLowerCase().includes('network') ||
    err.message?.toLowerCase().includes('connection')
  ) {
    return 'Network error. Please check your connection and try again.'
  }

  // Timeout errors
  if (err.message?.toLowerCase().includes('timeout')) {
    return 'Transaction timed out. Please try again.'
  }

  // Nonce errors
  if (
    err.message?.toLowerCase().includes('nonce') ||
    err.message?.toLowerCase().includes('replacement')
  ) {
    return 'Transaction nonce error. Please refresh and try again.'
  }

  // Contract revert reasons - map to friendly messages
  if (err.reason) {
    const friendlyMessages: Record<string, string> = {
      // Ledger contract errors
      'Ledger does not exist': 'Please create your account first by depositing funds',
      'Insufficient balance': 'Your account balance is too low for this operation',
      'Insufficient locked fund': 'Insufficient funds in provider account',

      // Provider errors
      'Provider not acknowledged': 'This provider has not been acknowledged yet',
      'Provider does not exist': 'Provider not found',
      'Invalid provider address': 'Invalid provider address',

      // Service errors
      'Service does not exist': 'Service not found',
      'Service not available': 'Service is currently unavailable',

      // Transfer errors
      'Transfer amount too small': 'Transfer amount is too small',
      'Transfer failed': 'Transfer failed. Please try again.',

      // Refund errors
      'No funds to refund': 'No funds available for refund',
      'Refund in lock period': 'Funds are still in lock period',

      // Generic
      'Invalid parameter': 'Invalid parameter provided',
      'Unauthorized': 'You are not authorized for this operation',
    }

    return friendlyMessages[err.reason] || `Transaction failed: ${err.reason}`
  }

  // Generic execution reverted
  if (err.message?.includes('execution reverted')) {
    // Try to extract the reason if available
    const match = err.message.match(/execution reverted:?\s*(.+)/)
    if (match && match[1]) {
      return `Transaction failed: ${match[1]}`
    }
    return 'Transaction failed. Please check your inputs and try again.'
  }

  // Contract call errors
  if (err.message?.includes('call revert exception')) {
    return 'Smart contract call failed. Please try again.'
  }

  // Missing revert data - usually means contract reverted without reason
  if (err.message?.includes('missing revert data')) {
    return 'Transaction failed. Please ensure you have enough 0G tokens for gas and the deposit amount.'
  }

  // Internal JSON-RPC error
  if (err.message?.includes('Internal JSON-RPC error')) {
    return 'Network error. Please check your wallet connection and try again.'
  }

  // Gas estimation errors
  if (err.message?.toLowerCase().includes('gas required exceeds')) {
    return 'Transaction requires too much gas. Please try with a smaller amount.'
  }

  // Slippage errors
  if (err.message?.toLowerCase().includes('slippage')) {
    return 'Price changed too much. Please try again.'
  }

  // Unpredictable gas limit
  if (err.message?.includes('cannot estimate gas')) {
    return 'Cannot estimate gas for this transaction. The transaction may fail.'
  }

  // Fallback to original message if it's reasonably short
  if (err.message && err.message.length < 100) {
    return err.message
  }

  // Truncate long messages
  if (err.message && err.message.length >= 100) {
    return `${err.message.substring(0, 97)}...`
  }

  // Final fallback
  return 'Transaction failed. Please try again.'
}

/**
 * Check if an error is a user rejection
 *
 * @param error - The error object
 * @returns True if user rejected the transaction
 */
export function isUserRejection(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const err = error as BlockchainError
  return err.code === 4001 || err.code === 'ACTION_REJECTED'
}

/**
 * Check if an error is due to insufficient funds
 *
 * @param error - The error object
 * @returns True if insufficient funds
 */
export function isInsufficientFunds(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message?.toLowerCase() || ''
  return message.includes('insufficient funds') || message.includes('insufficient balance')
}

/**
 * Check if an error is a network error
 *
 * @param error - The error object
 * @returns True if network error
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message?.toLowerCase() || ''
  return message.includes('network') || message.includes('connection') || message.includes('timeout')
}
