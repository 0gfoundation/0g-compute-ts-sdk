/**
 * API Key Storage Utility
 *
 * Manages persistent storage of API keys in localStorage
 * Handles expiration, cleanup, and CRUD operations
 *
 * @example
 * ```typescript
 * // Store a key
 * storeApiKey({
 *   provider: '0x123...',
 *   apiKey: 'app-sk-...',
 *   expiresAt: '2024-12-31T23:59:59Z',
 *   createdAt: new Date().toISOString()
 * })
 *
 * // Get all keys
 * const keys = getStoredApiKeys()
 *
 * // Delete a key
 * deleteApiKey('0x123...')
 * ```
 */

// ==================== Types ====================

export interface StoredApiKey {
  /** Unique ID for this key (timestamp + random) */
  id: string

  /** Provider address */
  provider: string

  /** API key (Bearer token) */
  apiKey: string

  /** Token ID on-chain (0-254) */
  tokenId: number

  /** Expiration timestamp (ISO string or 'Never') */
  expiresAt: string

  /** Creation timestamp (ISO string) */
  createdAt: string

  /** Optional user-defined label */
  label?: string

  /** Whether this key is used for chat (only one per provider) */
  usedForChat?: boolean
}

// ==================== Constants ====================

const STORAGE_KEY_PREFIX = '0g_compute_api_keys'
const MAX_KEYS_PER_PROVIDER = 20 // Soft limit to prevent excessive keys

/**
 * Get storage key for a specific user
 *
 * @param userAddress - User's wallet address (optional for backward compatibility)
 * @returns Storage key for this user
 */
function getStorageKey(userAddress?: string): string {
  if (!userAddress) {
    // Fallback to legacy global key for backward compatibility
    return STORAGE_KEY_PREFIX
  }
  // Use user-specific key: 0g_compute_api_keys_0x123...
  return `${STORAGE_KEY_PREFIX}_${userAddress.toLowerCase()}`
}

// ==================== Storage Functions ====================

/**
 * Store an API key
 *
 * Supports multiple keys per provider (up to MAX_KEYS_PER_PROVIDER)
 * Automatically generates a unique ID if not provided
 *
 * @param key - API key to store
 * @param userAddress - User's wallet address (required for user-specific storage)
 * @throws Error if provider has too many keys
 */
export function storeApiKey(key: StoredApiKey, userAddress?: string): void {
  try {
    const existing = getStoredApiKeys(userAddress)

    // Generate unique ID if not provided
    if (!key.id) {
      key.id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    }

    // Check if this provider already has too many keys
    const providerKeys = existing.filter(
      (k) => k.provider.toLowerCase() === key.provider.toLowerCase()
    )

    if (providerKeys.length >= MAX_KEYS_PER_PROVIDER) {
      throw new Error(
        `Maximum ${MAX_KEYS_PER_PROVIDER} keys per provider reached. Please revoke unused keys first.`
      )
    }

    // Add new key (don't remove existing keys)
    existing.push(key)

    // Save to localStorage (user-specific)
    const storageKey = getStorageKey(userAddress)
    localStorage.setItem(storageKey, JSON.stringify(existing))
  } catch (err) {
    console.error('Failed to store API key:', err)
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to store API key. Please try again.')
  }
}

/**
 * Get all stored API keys
 *
 * Automatically filters out expired keys and invalid entries
 *
 * @param userAddress - User's wallet address (required for user-specific storage)
 * @returns Array of valid API keys
 */
export function getStoredApiKeys(userAddress?: string): StoredApiKey[] {
  try {
    const storageKey = getStorageKey(userAddress)
    const stored = localStorage.getItem(storageKey)
    if (!stored) return []

    const keys = JSON.parse(stored) as StoredApiKey[]

    // Filter out expired keys and invalid entries
    const now = new Date()
    const validKeys = keys.filter((k) => {
      // Skip entries without tokenId (old data before tokenId was added)
      if (k.tokenId === undefined || k.tokenId === null) {
        console.warn(`Skipping key without tokenId: ${k.id}`)
        return false
      }

      // Skip expired keys
      if (k.expiresAt !== 'Never') {
        const expiresAt = new Date(k.expiresAt)
        if (expiresAt <= now) {
          return false
        }
      }

      return true
    })

    // If we filtered out any keys, update storage
    if (validKeys.length !== keys.length) {
      const storageKey = getStorageKey(userAddress)
      localStorage.setItem(storageKey, JSON.stringify(validKeys))
    }

    return validKeys
  } catch (err) {
    console.error('Failed to get API keys:', err)
    return []
  }
}

/**
 * Get all API keys for a specific provider
 *
 * @param provider - Provider address
 * @param userAddress - User's wallet address (required for user-specific storage)
 * @returns Array of API keys for this provider
 */
export function getApiKeysForProvider(provider: string, userAddress?: string): StoredApiKey[] {
  const keys = getStoredApiKeys(userAddress)
  return keys.filter(
    (k) => k.provider.toLowerCase() === provider.toLowerCase()
  )
}

/**
 * Get newest API key for a specific provider
 *
 * For backward compatibility - returns the most recently created key
 *
 * @param provider - Provider address
 * @param userAddress - User's wallet address (required for user-specific storage)
 * @returns Newest API key or null if not found
 */
export function getApiKeyForProvider(provider: string, userAddress?: string): StoredApiKey | null {
  const keys = getApiKeysForProvider(provider, userAddress)
  if (keys.length === 0) return null

  // Return newest key (by createdAt timestamp)
  return keys.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0]
}

/**
 * Delete a specific API key by its unique ID
 *
 * @param keyId - Unique key ID
 * @param userAddress - User's wallet address (required for user-specific storage)
 */
export function deleteApiKeyById(keyId: string, userAddress?: string): void {
  try {
    const existing = getStoredApiKeys(userAddress)
    const filtered = existing.filter((k) => k.id !== keyId)

    if (filtered.length === existing.length) {
      throw new Error('API key not found')
    }

    const storageKey = getStorageKey(userAddress)
    localStorage.setItem(storageKey, JSON.stringify(filtered))
  } catch (err) {
    console.error('Failed to delete API key:', err)
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to delete API key. Please try again.')
  }
}

/**
 * Delete all API keys for a provider
 *
 * @param provider - Provider address
 * @param userAddress - User's wallet address (required for user-specific storage)
 */
export function deleteApiKey(provider: string, userAddress?: string): void {
  try {
    const existing = getStoredApiKeys(userAddress)
    const filtered = existing.filter(
      (k) => k.provider.toLowerCase() !== provider.toLowerCase()
    )

    const storageKey = getStorageKey(userAddress)
    localStorage.setItem(storageKey, JSON.stringify(filtered))
  } catch (err) {
    console.error('Failed to delete API keys:', err)
    throw new Error('Failed to delete API keys. Please try again.')
  }
}

/**
 * Clear all expired API keys
 *
 * Automatically called by getStoredApiKeys(), but can be called manually
 *
 * @param userAddress - User's wallet address (required for user-specific storage)
 */
export function clearExpiredKeys(userAddress?: string): void {
  // getStoredApiKeys() automatically filters and updates storage
  getStoredApiKeys(userAddress)
}

/**
 * Clear all API keys
 *
 * USE WITH CAUTION - This removes all stored API keys
 *
 * @param userAddress - User's wallet address (required for user-specific storage)
 */
export function clearAllApiKeys(userAddress?: string): void {
  try {
    const storageKey = getStorageKey(userAddress)
    localStorage.removeItem(storageKey)
  } catch (err) {
    console.error('Failed to clear API keys:', err)
    throw new Error('Failed to clear API keys. Please try again.')
  }
}

/**
 * Check if a provider has stored API keys
 *
 * @param provider - Provider address
 * @param userAddress - User's wallet address (required for user-specific storage)
 * @returns True if at least one key exists and is not expired
 */
export function hasApiKey(provider: string, userAddress?: string): boolean {
  return getApiKeysForProvider(provider, userAddress).length > 0
}

/**
 * Get count of stored API keys for a specific provider
 *
 * @param provider - Provider address
 * @param userAddress - User's wallet address (required for user-specific storage)
 * @returns Number of valid (non-expired) keys for this provider
 */
export function getApiKeyCountForProvider(provider: string, userAddress?: string): number {
  return getApiKeysForProvider(provider, userAddress).length
}

/**
 * Get total count of stored API keys across all providers
 *
 * @param userAddress - User's wallet address (required for user-specific storage)
 * @returns Number of valid (non-expired) keys
 */
export function getApiKeyCount(userAddress?: string): number {
  return getStoredApiKeys(userAddress).length
}

/**
 * Get the API key marked for chat usage for a specific provider
 *
 * @param provider - Provider address
 * @param userAddress - User's wallet address (required for user-specific storage)
 * @returns The API key marked for chat, or the newest key if none marked, or null
 */
export function getChatApiKey(provider: string, userAddress?: string): StoredApiKey | null {
  const keys = getApiKeysForProvider(provider, userAddress)
  if (keys.length === 0) return null

  // First, look for a key marked for chat
  const chatKey = keys.find(k => k.usedForChat === true)
  if (chatKey) return chatKey

  // Fallback: return the newest key
  return keys.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0]
}

/**
 * Set a specific key as the chat key for its provider
 * Automatically unmarks other keys for the same provider
 *
 * @param keyId - Unique key ID to mark as chat key
 * @param userAddress - User's wallet address (required for user-specific storage)
 * @throws Error if key not found
 */
export function setChatApiKey(keyId: string, userAddress?: string): void {
  try {
    const allKeys = getStoredApiKeys(userAddress)
    let keyFound = false
    let targetProvider: string | null = null

    // First pass: find the target key and its provider
    for (const key of allKeys) {
      if (key.id === keyId) {
        targetProvider = key.provider
        keyFound = true
        break
      }
    }

    if (!keyFound || !targetProvider) {
      throw new Error('API key not found')
    }

    // Second pass: update keys
    const updatedKeys = allKeys.map(key => {
      if (key.provider.toLowerCase() === targetProvider!.toLowerCase()) {
        // For keys of the same provider, only mark the target key
        return {
          ...key,
          usedForChat: key.id === keyId
        }
      }
      // Keys for other providers remain unchanged
      return key
    })

    const storageKey = getStorageKey(userAddress)
    localStorage.setItem(storageKey, JSON.stringify(updatedKeys))
  } catch (err) {
    console.error('Failed to set chat API key:', err)
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to set chat API key. Please try again.')
  }
}

/**
 * Unmark a key as the chat key
 *
 * @param keyId - Unique key ID to unmark
 * @param userAddress - User's wallet address (required for user-specific storage)
 */
export function unsetChatApiKey(keyId: string, userAddress?: string): void {
  try {
    const allKeys = getStoredApiKeys(userAddress)
    const updatedKeys = allKeys.map(key => {
      if (key.id === keyId) {
        return {
          ...key,
          usedForChat: false
        }
      }
      return key
    })

    const storageKey = getStorageKey(userAddress)
    localStorage.setItem(storageKey, JSON.stringify(updatedKeys))
  } catch (err) {
    console.error('Failed to unset chat API key:', err)
    throw new Error('Failed to unset chat API key. Please try again.')
  }
}
