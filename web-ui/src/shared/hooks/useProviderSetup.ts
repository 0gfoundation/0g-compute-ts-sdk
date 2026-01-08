/**
 * Provider Setup Status Hook
 *
 * Tracks the setup progress for a specific provider by combining
 * localStorage state with on-chain blockchain state.
 *
 * This provides a robust status check that works across:
 * - Multiple devices
 * - Browser cache clears
 * - Different sessions
 *
 * @example
 * ```typescript
 * const { status, isLoading, checkStatus } = useProviderSetup(providerAddress)
 *
 * if (status.hasMainAccount && status.hasSubAccount) {
 *   // Ready to get API key
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react'
import { useBrokerOperations } from './useBrokerOperations'
import { getStoredApiKeys } from '../utils/apiKeyStorage'

// ==================== Types ====================

export interface SetupStatus {
  /** Main ledger account exists */
  hasMainAccount: boolean

  /** Sub-account exists for this provider */
  hasSubAccount: boolean

  /** Sub-account balance in A0GI */
  subAccountBalance: string

  /** Pending refund amount in A0GI */
  subAccountPendingRefund: string

  /** Has API key (either stored locally OR can generate one) */
  hasApiKey: boolean

  /** Has API key stored locally */
  hasStoredKey: boolean

  /** Can generate API key (sub-account exists with balance) */
  canGenerateKey: boolean

  /** Provider verification status (null = not checked) */
  isVerified: boolean | null
}

export interface UseProviderSetupReturn {
  /** Current setup status */
  status: SetupStatus

  /** Loading state */
  isLoading: boolean

  /** Manually trigger status check */
  checkStatus: () => Promise<void>
}

// ==================== Main Hook ====================

/**
 * Hook for tracking provider setup status
 *
 * Combines localStorage with on-chain state to provide accurate
 * status even across devices and cache clears
 *
 * @param providerAddress - Provider address to track (null = no provider)
 * @param userAddress - User's wallet address (required for user-specific storage)
 * @returns Setup status and controls
 */
export function useProviderSetup(
  providerAddress: string | null,
  userAddress?: string
): UseProviderSetupReturn {
  const {
    checkMainAccount,
    getSubAccount,
  } = useBrokerOperations()

  const [status, setStatus] = useState<SetupStatus>({
    hasMainAccount: false,
    hasSubAccount: false,
    subAccountBalance: '0',
    subAccountPendingRefund: '0',
    hasApiKey: false,
    hasStoredKey: false,
    canGenerateKey: false,
    isVerified: null,
  })

  const [isLoading, setIsLoading] = useState(false)

  /**
   * Check setup status by combining multiple sources
   *
   * Sources:
   * 1. Main account - from blockchain
   * 2. Sub-account - from blockchain (source of truth)
   * 3. API key - from localStorage + sub-account state
   */
  const checkStatus = useCallback(async () => {
    if (!providerAddress) {
      // No provider selected, reset status
      setStatus({
        hasMainAccount: false,
        hasSubAccount: false,
        subAccountBalance: '0',
        subAccountPendingRefund: '0',
        hasApiKey: false,
        hasStoredKey: false,
        canGenerateKey: false,
        isVerified: null,
      })
      return
    }

    setIsLoading(true)
    try {
      // Check main account (from blockchain)
      const hasMain = await checkMainAccount()

      // Check sub-account (from blockchain - SOURCE OF TRUTH)
      const subAccount = await getSubAccount(providerAddress)

      // Check API key status (combine localStorage + on-chain state)
      const storedKeys = getStoredApiKeys(userAddress)
      const hasStoredKey = storedKeys.some(
        (k) => k.provider.toLowerCase() === providerAddress.toLowerCase()
      )

      // User can generate API key if sub-account exists with balance
      // This handles cases where user cleared browser data or is on different device
      const canGenerateKey =
        subAccount.exists && parseFloat(subAccount.balance) > 0

      setStatus({
        hasMainAccount: hasMain,
        hasSubAccount: subAccount.exists,
        subAccountBalance: subAccount.balance,
        subAccountPendingRefund: subAccount.pendingRefund,
        // FIXED: hasApiKey should only reflect if a key is actually stored
        // This ensures UI accurately shows step as incomplete until user generates a key
        // canGenerateKey is separate flag that BuildDrawer can use for UI logic
        hasApiKey: hasStoredKey,
        hasStoredKey,
        canGenerateKey,
        isVerified: null, // Can be enhanced to check verification status
      })
    } catch (err) {
      console.error('Failed to check setup status:', err)
      // Reset to safe defaults on error
      setStatus({
        hasMainAccount: false,
        hasSubAccount: false,
        subAccountBalance: '0',
        subAccountPendingRefund: '0',
        hasApiKey: false,
        hasStoredKey: false,
        canGenerateKey: false,
        isVerified: null,
      })
    } finally {
      setIsLoading(false)
    }
  }, [providerAddress, userAddress, checkMainAccount, getSubAccount])

  // Auto-check when provider or user address changes
  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  return {
    status,
    isLoading,
    checkStatus,
  }
}
