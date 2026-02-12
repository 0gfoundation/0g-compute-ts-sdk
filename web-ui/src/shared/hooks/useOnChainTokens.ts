/**
 * useOnChainTokens Hook
 *
 * Fetches on-chain token status from the smart contract.
 * Shows all 255 tokenId slots (0-254) with their revocation status.
 *
 * This is the source of truth - localStorage may be lost, but
 * on-chain data persists. Users can revoke any tokenId even if
 * localStorage data is missing.
 *
 * @example
 * ```typescript
 * const { tokens, isLoading, refresh } = useOnChainTokens(providerAddress)
 *
 * tokens.forEach(token => {
 *   if (token.isRevoked) {
 *     console.log(`Token ${token.tokenId} is revoked`)
 *   } else if (token.localData) {
 *     console.log(`Token ${token.tokenId}: ${token.localData.label}`)
 *   } else {
 *     console.log(`Token ${token.tokenId}: Unknown (localStorage lost)`)
 *   }
 * })
 * ```
 */

import { useState, useEffect, useCallback } from 'react'
import { useBroker } from '../providers/BrokerProvider'
import { getApiKeysForProvider, type StoredApiKey } from '../utils/apiKeyStorage'

export interface OnChainToken {
  /** Token ID (0-254) */
  tokenId: number

  /** Is this token revoked on-chain? (bit = 1 in revokedBitmap) */
  isRevoked: boolean

  /** Local storage data if available */
  localData?: StoredApiKey

  /** Is this token occupied? (not revoked, and either has localData or was used before) */
  isOccupied: boolean
}

export interface UseOnChainTokensReturn {
  /** All 255 tokens (0-254) with their status */
  tokens: OnChainToken[]

  /** Generation counter from contract */
  generation: number

  /** Is fetching from contract */
  isLoading: boolean

  /** Error if any */
  error: string | null

  /** Refresh data from contract and return fresh tokens */
  refresh: () => Promise<OnChainToken[]>
}

const MAX_TOKEN_ID = 254 // 0-254, 255 is reserved for ephemeral tokens

/**
 * Hook to fetch on-chain token status
 *
 * @param provider - Provider address
 * @param userAddress - User's wallet address for localStorage lookup (optional)
 */
export function useOnChainTokens(provider: string, userAddress?: string): UseOnChainTokensReturn {
  const { broker } = useBroker()
  const [tokens, setTokens] = useState<OnChainToken[]>([])
  const [generation, setGeneration] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Parse revokedBitmap to determine which tokens are revoked
   */
  const parseRevokedBitmap = useCallback(
    (revokedBitmap: bigint): boolean[] => {
      const revoked = new Array(MAX_TOKEN_ID + 1).fill(false)

      for (let tokenId = 0; tokenId <= MAX_TOKEN_ID; tokenId++) {
        const bit = BigInt(1) << BigInt(tokenId)
        revoked[tokenId] = (revokedBitmap & bit) !== BigInt(0)
      }

      return revoked
    },
    []
  )

  /**
   * Fetch token status from contract
   * Returns the token list directly (in addition to updating state)
   */
  const fetchTokenStatus = useCallback(async (): Promise<OnChainToken[]> => {
    if (!broker || !provider) {
      setTokens([])
      setIsLoading(false)
      return []
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch account info from contract
      const account = await broker.inference.getAccount(provider)

      // Extract generation and revokedBitmap
      const gen = account.generation != null ? Number(account.generation) : 0
      const bitmap = account.revokedBitmap ?? BigInt(0)

      setGeneration(gen)

      // Parse bitmap to get revocation status
      const revokedStatus = parseRevokedBitmap(bitmap)

      // Get local storage data (user-specific)
      const localKeys = getApiKeysForProvider(provider, userAddress)
      const localKeysByTokenId = new Map<number, StoredApiKey>()
      localKeys.forEach((key) => {
        localKeysByTokenId.set(key.tokenId, key)
      })

      // Build token list
      const tokenList: OnChainToken[] = []
      for (let tokenId = 0; tokenId <= MAX_TOKEN_ID; tokenId++) {
        const isRevoked = revokedStatus[tokenId]
        const localData = localKeysByTokenId.get(tokenId)

        // A token is "occupied" if:
        // 1. It has local data (we know about it)
        // 2. OR it's NOT revoked but we don't have local data (localStorage may be lost)
        //    In this case, we can't be 100% sure it's occupied vs never used,
        //    but we show it to allow users to revoke if needed
        const isOccupied = !isRevoked && (!!localData || false)

        tokenList.push({
          tokenId,
          isRevoked,
          localData,
          isOccupied,
        })
      }

      setTokens(tokenList)
      console.log('📡 [fetchTokenStatus] Fetched tokens, returning data...')
      console.log('📡 [fetchTokenStatus] Total tokens:', tokenList.length)
      console.log('📡 [fetchTokenStatus] Revoked count:', tokenList.filter(t => t.isRevoked).length)
      console.log('📡 [fetchTokenStatus] With localData count:', tokenList.filter(t => t.localData).length)
      return tokenList  // Return data directly
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch on-chain token status'
      setError(errorMessage)
      console.error('Failed to fetch token status:', err)
      return []  // Return empty array on error
    } finally {
      setIsLoading(false)
    }
  }, [broker, provider, userAddress, parseRevokedBitmap])

  // Fetch on mount and when provider/broker changes
  useEffect(() => {
    fetchTokenStatus()
  }, [fetchTokenStatus])

  return {
    tokens,
    generation,
    isLoading,
    error,
    refresh: fetchTokenStatus,
  }
}
