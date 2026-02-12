/**
 * Unified Broker Operations Hook
 *
 * This hook provides a centralized business logic layer for broker operations.
 * It extracts and unifies patterns currently scattered across components (TopUpModal, etc.)
 *
 * Key Features:
 * - Single source of truth for broker operations
 * - Consistent error handling across all operations
 * - Unified refresh patterns
 * - Reuses existing currency utilities
 *
 * @example
 * ```typescript
 * const { transferFund, verifyProvider, getSecret } = useBrokerOperations()
 *
 * // Transfer funds
 * await transferFund(providerAddress, 5, 'inference', refreshProviderBalance)
 *
 * // Verify provider
 * const result = await verifyProvider(providerAddress)
 *
 * // Get API key
 * const { apiKey, expiresAt, tokenId } = await getSecret(providerAddress, '24h')
 * ```
 */

import { useCallback } from 'react'
import { useBroker } from '../providers/BrokerProvider'
import { a0giToNeuron, neuronToA0gi } from '../utils/currency'
import { formatBlockchainError } from '../utils/blockchainErrors'

// ==================== Types ====================

export interface BrokerOperationsReturn {
  // Transfer operations
  transferFund: (
    provider: string,
    amount: number,
    serviceType: 'inference' | 'fine-tuning',
    onRefreshProvider?: () => Promise<void>
  ) => Promise<void>

  // Provider operations
  verifyProvider: (provider: string) => Promise<{
    success: boolean
    report?: any
  }>

  // API key operations
  getSecret: (
    provider: string,
    expiresIn?: string,
    tokenId?: number
  ) => Promise<{
    apiKey: string
    expiresAt: string
    tokenId: number
  }>

  revokeToken: (provider: string, tokenId: number) => Promise<void>

  revokeAllTokens: (provider: string) => Promise<void>

  // Account checks
  getSubAccount: (provider: string) => Promise<{
    exists: boolean
    balance: string
    pendingRefund: string
  }>

  checkMainAccount: () => Promise<boolean>
}

// ==================== Helper Functions ====================

/**
 * Parse duration string to milliseconds
 *
 * @param duration - Duration string (e.g., '1h', '24h', '7d', '30d')
 * @returns Duration in milliseconds
 *
 * @example
 * ```typescript
 * parseDuration('1h')  // 3600000
 * parseDuration('24h') // 86400000
 * parseDuration('7d')  // 604800000
 * ```
 */
function parseDuration(duration: string): number {
  const units: Record<string, number> = {
    h: 60 * 60 * 1000, // hours
    d: 24 * 60 * 60 * 1000, // days
    w: 7 * 24 * 60 * 60 * 1000, // weeks
    m: 30 * 24 * 60 * 60 * 1000, // months (approximate)
  }

  const match = duration.match(/^(\d+)([hdwm])$/)
  if (!match) {
    throw new Error('Invalid duration format. Use format like "1h", "24h", "7d", "30d"')
  }

  const value = parseInt(match[1], 10)
  const unit = match[2]

  if (!units[unit]) {
    throw new Error(`Invalid duration unit: ${unit}. Use h, d, w, or m`)
  }

  return value * units[unit]
}

// ==================== Main Hook ====================

/**
 * Hook for unified broker operations
 *
 * Provides high-level business logic methods that wrap broker SDK calls
 * with consistent error handling and refresh patterns
 *
 * @returns Object with broker operation methods
 */
export function useBrokerOperations(): BrokerOperationsReturn {
  const { broker, refreshLedgerInfo } = useBroker()

  /**
   * Transfer funds to provider sub-account
   *
   * Extracted from TopUpModal.tsx - unified implementation
   * Uses existing currency.ts utility for precise conversion
   *
   * @param provider - Provider address
   * @param amount - Amount in A0GI
   * @param serviceType - Service type (inference/fine-tuning)
   * @param onRefreshProvider - Optional callback to refresh provider balance
   *
   * @throws Error if broker not initialized or transfer fails
   *
   * @example
   * ```typescript
   * await transferFund(
   *   '0x123...',
   *   5,
   *   'inference',
   *   refreshProviderBalance
   * )
   * ```
   */
  const transferFund = useCallback(
    async (
      provider: string,
      amount: number,
      serviceType: 'inference' | 'fine-tuning',
      onRefreshProvider?: () => Promise<void>
    ): Promise<void> => {
      if (!broker) {
        throw new Error('Broker not initialized. Please connect your wallet.')
      }

      try {
        // IMPORTANT: Use existing currency utility (same as TopUpModal)
        // This is identical to SDK's a0giToNeuron() but already in our codebase
        const amountInNeuron = a0giToNeuron(amount)

        // Call broker transfer
        await broker.ledger.transferFund(
          provider,
          serviceType,
          amountInNeuron
        )

        // Refresh both ledger and provider balance in parallel (from TopUpModal pattern)
        // This ensures UI stays in sync with blockchain state
        const refreshTasks = [refreshLedgerInfo()]
        if (onRefreshProvider) {
          refreshTasks.push(onRefreshProvider())
        }
        await Promise.all(refreshTasks)
      } catch (err) {
        // Use unified error formatter for consistent error messages
        throw new Error(formatBlockchainError(err))
      }
    },
    [broker, refreshLedgerInfo]
  )

  /**
   * Verify provider reliability
   *
   * Calls the provider's verification endpoint to check service reliability
   * Downloads and validates the provider's TEE quote
   *
   * @param provider - Provider address
   * @returns Verification result with success flag and optional report
   *
   * @throws Error if broker not initialized or verification fails
   *
   * @example
   * ```typescript
   * const result = await verifyProvider('0x123...')
   * if (result.success) {
   *   console.log('Provider is reliable')
   * }
   * ```
   */
  const verifyProvider = useCallback(
    async (provider: string): Promise<{ success: boolean; report?: any }> => {
      if (!broker) {
        throw new Error('Broker not initialized. Please connect your wallet.')
      }

      try {
        const result = await broker.inference.verifyService(provider)
        return {
          success: result?.success || false,
          report: result,
        }
      } catch (err) {
        throw new Error(formatBlockchainError(err))
      }
    },
    [broker]
  )

  /**
   * Generate API key for provider
   *
   * Creates a persistent API key that can be used for authentication
   * Uses public SDK API (NOT internal requestProcessor)
   *
   * Prerequisites:
   * - Main ledger account must exist
   * - Sub-account for provider must exist (transfer funds first)
   *
   * @param provider - Provider address
   * @param expiresIn - Expiration duration ('never', '1h', '24h', '7d', '30d')
   * @returns API key and expiration info
   *
   * @throws Error if prerequisites not met or key generation fails
   *
   * @example
   * ```typescript
   * const { apiKey, expiresAt, tokenId } = await getSecret('0x123...', '24h')
   * // Use: Authorization: Bearer app-sk-...
   * // tokenId: 0-254 (on-chain slot identifier)
   * ```
   */
  const getSecret = useCallback(
    async (
      provider: string,
      expiresIn: string = 'never',
      tokenId?: number
    ): Promise<{ apiKey: string; expiresAt: string; tokenId: number }> => {
      if (!broker) {
        throw new Error('Broker not initialized. Please connect your wallet.')
      }

      try {
        // Validate main account exists
        await broker.ledger.getLedger()

        // Validate sub-account exists for provider
        const account = await broker.inference.getAccount(provider)
        if (!account) {
          throw new Error(
            'No sub-account found for this provider. Please transfer funds first.'
          )
        }

        // Parse duration string to milliseconds
        let durationMs = 0
        if (expiresIn !== 'never') {
          durationMs = parseDuration(expiresIn)
        }

        // ⚠️ TECHNICAL DEBT (DEBT-001):
        // We're using broker.inference.requestProcessor.createApiKey() to access tokenId parameter.
        // This is an internal API that may change in future SDK versions.
        //
        // Why we need this:
        // - We need to specify tokenId to control which slot (0-254) to use
        // - Public API doesn't support tokenId parameter yet
        // - This is critical for our 256-slot management system
        //
        // Mitigation:
        // - This is how official CLI does it (cli/inference.ts:897)
        // - SDK team is aware and working on exposing this in public API
        // - We monitor SDK updates and will migrate when available
        //
        // Risk: Medium - SDK upgrade may break this functionality
        // TODO: Track SDK issue/PR for exposing createApiKey with tokenId in public API
        const apiKeyInfo = await broker.inference.requestProcessor.createApiKey(provider, {
          expiresIn: durationMs,
          tokenId,
        } as any)

        return {
          apiKey: apiKeyInfo.rawToken,
          expiresAt: apiKeyInfo.expiresAt
            ? new Date(apiKeyInfo.expiresAt).toISOString()
            : 'Never',
          tokenId: apiKeyInfo.tokenId,
        }
      } catch (err) {
        throw new Error(formatBlockchainError(err))
      }
    },
    [broker]
  )

  /**
   * Revoke a specific API key (token) by its tokenId
   *
   * Sets the bit in the revokedBitmap for this tokenId.
   * The API key will be immediately invalid, but the tokenId slot remains occupied
   * until revokeAllTokens() is called.
   *
   * @param provider - Provider address
   * @param tokenId - Token ID to revoke (0-254)
   *
   * @throws Error if broker not initialized or revocation fails
   *
   * @example
   * ```typescript
   * await revokeToken('0x123...', 5)
   * // Token ID 5 is now revoked and the API key is invalid
   * ```
   */
  const revokeToken = useCallback(
    async (provider: string, tokenId: number): Promise<void> => {
      if (!broker) {
        throw new Error('Broker not initialized. Please connect your wallet.')
      }

      try {
        await broker.inference.revokeApiKey(provider, tokenId)
      } catch (err) {
        throw new Error(formatBlockchainError(err))
      }
    },
    [broker]
  )

  /**
   * Revoke all API keys for a provider
   *
   * Increments the generation counter and resets the revokedBitmap.
   * All existing API keys (both ephemeral and persistent) will be immediately invalid.
   * Reclaims all 255 tokenId slots for reuse.
   *
   * @param provider - Provider address
   *
   * @throws Error if broker not initialized or revocation fails
   *
   * @example
   * ```typescript
   * await revokeAllTokens('0x123...')
   * // All API keys for this provider are now invalid
   * // All 255 token slots are now available for reuse
   * ```
   */
  const revokeAllTokens = useCallback(
    async (provider: string): Promise<void> => {
      if (!broker) {
        throw new Error('Broker not initialized. Please connect your wallet.')
      }

      try {
        await broker.inference.revokeAllTokens(provider)
      } catch (err) {
        throw new Error(formatBlockchainError(err))
      }
    },
    [broker]
  )

  /**
   * Get sub-account info for provider
   *
   * Pattern adopted from useProviderManagement.ts
   * Fetches account balance and pending refund from smart contract
   *
   * @param provider - Provider address
   * @returns Account info (exists, balance, pendingRefund)
   *
   * @example
   * ```typescript
   * const account = await getSubAccount('0x123...')
   * if (account.exists) {
   *   console.log(`Balance: ${account.balance} A0GI`)
   *   console.log(`Pending refund: ${account.pendingRefund} A0GI`)
   * }
   * ```
   */
  const getSubAccount = useCallback(
    async (
      provider: string
    ): Promise<{ exists: boolean; balance: string; pendingRefund: string }> => {
      if (!broker) {
        throw new Error('Broker not initialized. Please connect your wallet.')
      }

      try {
        const account = await broker.inference.getAccount(provider)

        if (account && account.balance) {
          // Calculate actual balance (total - pending refund)
          const balanceInA0gi = neuronToA0gi(
            BigInt(account.balance) - BigInt(account.pendingRefund)
          )
          const pendingRefundInA0gi = neuronToA0gi(account.pendingRefund)

          return {
            exists: true,
            balance: balanceInA0gi.toString(),
            pendingRefund: pendingRefundInA0gi.toString(),
          }
        }

        return {
          exists: false,
          balance: '0',
          pendingRefund: '0',
        }
      } catch {
        // Account doesn't exist or error occurred
        return {
          exists: false,
          balance: '0',
          pendingRefund: '0',
        }
      }
    },
    [broker]
  )

  /**
   * Check if main ledger account exists
   *
   * Used to verify setup prerequisites
   *
   * @returns True if main account exists
   *
   * @example
   * ```typescript
   * const hasAccount = await checkMainAccount()
   * if (!hasAccount) {
   *   alert('Please deposit funds to create your account')
   * }
   * ```
   */
  const checkMainAccount = useCallback(async (): Promise<boolean> => {
    if (!broker) return false

    try {
      await broker.ledger.getLedger()
      return true
    } catch {
      return false
    }
  }, [broker])

  return {
    transferFund,
    verifyProvider,
    getSecret,
    revokeToken,
    revokeAllTokens,
    getSubAccount,
    checkMainAccount,
  }
}
