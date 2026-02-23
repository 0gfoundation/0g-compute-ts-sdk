/**
 * useSlotStatus Hook
 *
 * Provides detailed slot status visualization for the 256-slot system.
 * Built on top of useOnChainTokens to provide user-friendly slot metrics.
 *
 * Slot Lifecycle:
 * 1. Available (⚪) - Empty slot, ready for use
 * 2. Active (🟢) - Occupied by an active API key
 * 3. Revoked (⚫) - Permanently blocked until "Refresh All"
 *
 * @example
 * ```typescript
 * const { slotStats, allSlots, refresh } = useSlotStatus(providerAddress)
 *
 * console.log(`Active: ${slotStats.active}`)
 * console.log(`Revoked: ${slotStats.revoked}`)
 * console.log(`Available: ${slotStats.available}`)
 * ```
 */

import { useMemo, useCallback } from 'react'
import { useOnChainTokens, type OnChainToken } from './useOnChainTokens'
import { getApiKeysForProvider, type StoredApiKey } from '../utils/apiKeyStorage'

export type SlotStatus = 'available' | 'active' | 'revoked' | 'unknown'

export interface Slot {
  /** Slot number (0-255) */
  id: number

  /** Current status of this slot */
  status: SlotStatus

  /** API key label if this slot has an active key */
  keyLabel?: string

  /** Full key data if available */
  keyData?: StoredApiKey

  /** When this slot was revoked (if status is 'revoked') */
  revokedAt?: Date
}

export interface SlotStats {
  /** Total number of slots (always 256) */
  total: number

  /** Active keys occupying slots */
  active: number

  /** Revoked slots (blocked permanently) */
  revoked: number

  /** Available slots ready for use */
  available: number

  /** Slots that may have keys from another origin/device */
  unknown: number

  /** Percentage of used slots (active + revoked) */
  usagePercent: number

  /** Generation counter from contract */
  generation: number
}

export interface UseSlotStatusReturn {
  /** Slot statistics summary */
  slotStats: SlotStats

  /** All 256 slots with their detailed status */
  allSlots: Slot[]

  /** Is fetching from contract */
  isLoading: boolean

  /** Error if any */
  error: string | null

  /** Refresh data from contract and return fresh tokens */
  refresh: () => Promise<OnChainToken[]>

  /** Find next available tokenId (not revoked and not occupied by active key) */
  findNextAvailableTokenId: () => number | null

  /** Find next available tokenId from provided token data (bypasses stale React state) */
  findNextAvailableTokenIdFromData: (freshTokens: OnChainToken[]) => number | null
}

const TOTAL_SLOTS = 256
const MAX_TOKEN_ID = 254 // Slots 0-254 are usable (slot 255 reserved for ephemeral)

/**
 * Hook to get detailed slot status
 *
 * @param provider - Provider address
 * @param userAddress - User's wallet address for localStorage lookup (optional)
 */
export function useSlotStatus(provider: string, userAddress?: string): UseSlotStatusReturn {
  const { tokens, generation, externalSlotCount, isLoading, error, refresh } = useOnChainTokens(provider, userAddress)

  /**
   * Calculate slot statistics and build detailed slot list
   */
  const { slotStats, allSlots } = useMemo(() => {
    let activeCount = 0
    let revokedCount = 0
    let unknownCount = 0
    const slots: Slot[] = []

    // Determine if user has interacted with the key system before
    const localKeyCount = tokens.filter(t => t.localData).length
    const hasInteracted = generation > 0 || localKeyCount > 0

    // Process slots 0-254 (usable slots)
    for (let i = 0; i <= MAX_TOKEN_ID; i++) {
      const token = tokens.find((t) => t.tokenId === i)

      if (!token) {
        // No data yet, treat as available
        slots.push({
          id: i,
          status: 'available',
        })
        continue
      }

      if (token.isRevoked) {
        // Revoked slot
        revokedCount++
        slots.push({
          id: i,
          status: 'revoked',
          revokedAt: new Date(), // TODO: Get actual revoke timestamp if available
        })
      } else if (token.localData) {
        // Active key
        activeCount++
        slots.push({
          id: i,
          status: 'active',
          keyLabel: token.localData.label,
          keyData: token.localData,
        })
      } else if (hasInteracted) {
        // Not revoked, no local data, but user has interacted before.
        // This slot may have a key from another origin/device.
        unknownCount++
        slots.push({
          id: i,
          status: 'unknown',
        })
      } else {
        // Not revoked, no local data, brand new user — truly available
        slots.push({
          id: i,
          status: 'available',
        })
      }
    }

    // Add slot 255 (reserved for ephemeral tokens)
    slots.push({
      id: 255,
      status: 'revoked', // Always show as unavailable since it's reserved
    })

    const availableCount = TOTAL_SLOTS - activeCount - revokedCount - unknownCount
    const usagePercent = Math.round(((activeCount + revokedCount) / TOTAL_SLOTS) * 100)

    const stats: SlotStats = {
      total: TOTAL_SLOTS,
      active: activeCount,
      revoked: revokedCount,
      available: availableCount,
      unknown: unknownCount,
      usagePercent,
      generation,
    }

    return { slotStats: stats, allSlots: slots }
  }, [tokens, generation])

  /**
   * Find the next available tokenId
   * Returns the smallest tokenId that is:
   * 1. Not revoked (bit = 0 in revokedBitmap)
   * 2. Not occupied by an active key (checked in localStorage directly)
   *
   * NOTE: Reads localStorage directly to get the freshest data
   */
  const findNextAvailableTokenId = useCallback((): number | null => {
    // Get fresh localStorage data (not from React state)
    const freshLocalKeys = getApiKeysForProvider(provider, userAddress)
    const occupiedTokenIds = new Set(freshLocalKeys.map(k => k.tokenId))

    for (let tokenId = 0; tokenId <= MAX_TOKEN_ID; tokenId++) {
      // Check if this tokenId is revoked on-chain
      const token = tokens.find((t) => t.tokenId === tokenId)
      const isRevoked = token?.isRevoked ?? false

      // Available if: NOT revoked AND NOT occupied
      if (!isRevoked && !occupiedTokenIds.has(tokenId)) {
        return tokenId
      }
    }
    // All slots are occupied or revoked
    return null
  }, [tokens, provider, userAddress])

  /**
   * Find next available tokenId from provided fresh token data
   * This bypasses potentially stale React state
   *
   * FIXED: Optimized to use localData already present in freshTokens
   * instead of redundantly reading from localStorage again
   */
  const findNextAvailableTokenIdFromData = useCallback(
    (freshTokens: OnChainToken[]): number | null => {
      // FIXED: Extract occupied tokenIds directly from freshTokens[].localData
      // This avoids redundant localStorage read since localData is already loaded
      const occupiedTokenIds = new Set(
        freshTokens
          .filter((t) => t.localData) // Only tokens with associated keys
          .map((t) => t.tokenId)
      )

      console.log('🔍 [findNextAvailableTokenId] Searching for available slot...')
      console.log('🔍 [findNextAvailableTokenId] Fresh tokens count:', freshTokens.length)
      console.log('🔍 [findNextAvailableTokenId] Occupied tokenIds:', Array.from(occupiedTokenIds))

      for (let tokenId = 0; tokenId <= MAX_TOKEN_ID; tokenId++) {
        // Check if this tokenId is revoked on-chain (using fresh data)
        const token = freshTokens.find((t) => t.tokenId === tokenId)
        const isRevoked = token?.isRevoked ?? false
        const isOccupied = occupiedTokenIds.has(tokenId)

        // Log first 10 slots for debugging
        if (tokenId < 10) {
          console.log(`🔍 [findNextAvailableTokenId] Slot ${tokenId}: revoked=${isRevoked}, occupied=${isOccupied}`)
        }

        // Available if: NOT revoked AND NOT occupied
        if (!isRevoked && !isOccupied) {
          console.log(`✅ [findNextAvailableTokenId] Found available slot: ${tokenId}`)
          return tokenId
        }
      }
      // All slots are occupied or revoked
      console.log('❌ [findNextAvailableTokenId] No available slots found!')
      return null
    },
    [] // FIXED: No dependencies needed since we use only the argument data
  )

  return {
    slotStats,
    allSlots,
    isLoading,
    error,
    refresh,
    findNextAvailableTokenId,
    findNextAvailableTokenIdFromData,
  }
}
