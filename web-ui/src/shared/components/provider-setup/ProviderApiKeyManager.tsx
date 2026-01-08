"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useBrokerOperations } from "@/shared/hooks/useBrokerOperations"
import { useSlotStatus } from "@/shared/hooks/useSlotStatus"
import {
  storeApiKey,
  getApiKeysForProvider,
  getApiKeyCountForProvider,
  deleteApiKeyById,
  setChatApiKey,
  unsetChatApiKey,
  type StoredApiKey
} from "@/shared/utils/apiKeyStorage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  Key,
  Copy,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react"

interface ProviderApiKeyManagerProps {
  /** Provider address */
  provider: string

  /** Optional label for the API key */
  label?: string

  /** Success callback */
  onSuccess?: (apiKey: string) => void

  /** Error callback */
  onError?: (error: string) => void

  /** Button variant */
  variant?: "default" | "outline" | "secondary"

  /** Button size */
  size?: "default" | "sm" | "lg"
}

/**
 * Provider API Key Manager Component
 *
 * A complete API key management interface for a specific provider.
 * Handles key generation, display, deletion, and slot status tracking.
 *
 * Features:
 * - Display all existing API keys for this provider
 * - Generate new API keys with customizable expiration
 * - Delete/revoke individual keys
 * - Show/hide key values
 * - Copy keys to clipboard
 * - Integrated slot status tracking
 *
 * Uses useBrokerOperations for key generation
 * Uses apiKeyStorage for localStorage persistence
 * Uses useSlotStatus for slot availability
 *
 * @example
 * ```tsx
 * <ProviderApiKeyManager
 *   provider={providerAddress}
 *   label="Production Key"
 *   onSuccess={(key) => console.log('Generated:', key)}
 * />
 * ```
 */
export function ProviderApiKeyManager({
  provider,
  label,
  onSuccess,
  onError,
  variant = "default",
  size = "default",
}: ProviderApiKeyManagerProps) {
  const { address } = useAccount()
  const [isGenerating, setIsGenerating] = useState(false)
  const [expiresIn, setExpiresIn] = useState<string>("never")
  const [keyLabel, setKeyLabel] = useState<string>("")
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [showKeys, setShowKeys] = useState<{ [keyId: string]: boolean }>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [showExistingKeys, setShowExistingKeys] = useState(true)
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null)

  const { getSecret, revokeToken } = useBrokerOperations()
  const { findNextAvailableTokenIdFromData, refresh: refreshSlots } = useSlotStatus(provider, address)

  // Check if user already has keys for this provider (reactive)
  const [existingKeys, setExistingKeys] = useState<StoredApiKey[]>(() =>
    address ? getApiKeysForProvider(provider, address) : []
  )

  // Refresh existing keys check when component mounts or provider/address changes
  useEffect(() => {
    if (address) {
      setExistingKeys(getApiKeysForProvider(provider, address))
    } else {
      setExistingKeys([])
    }
    setShowGenerateForm(false)
    setGeneratedKey(null)
  }, [provider, address])

  const handleGenerate = async () => {
    if (!address) {
      setError("Please connect your wallet first")
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedKey(null)

    // FIXED: Add retry logic to handle race conditions when multiple tabs generate keys simultaneously
    const MAX_RETRIES = 3
    const RETRY_DELAY_BASE = 200 // milliseconds

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 [GetSecretButton] Retry attempt ${attempt + 1}/${MAX_RETRIES}`)
          // Exponential backoff: 200ms, 400ms, 800ms
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_BASE * Math.pow(2, attempt)))
        }

        // CRITICAL: Refresh slot status first and get fresh data
        console.log('🔄 [GetSecretButton] Starting key generation...')
        const freshTokens = await refreshSlots()
        console.log('📊 [GetSecretButton] Fresh tokens count:', freshTokens.length)
        console.log('📊 [GetSecretButton] Revoked tokens:', freshTokens.filter(t => t.isRevoked).map(t => t.tokenId))

        // Check localStorage
        const localKeys = getApiKeysForProvider(provider, address)
        console.log('💾 [GetSecretButton] LocalStorage keys:', localKeys.map(k => ({ tokenId: k.tokenId, label: k.label })))

        // Find next available tokenId (using fresh data, bypassing stale React state)
        const nextTokenId = findNextAvailableTokenIdFromData(freshTokens)
        console.log('🎯 [GetSecretButton] Next available tokenId:', nextTokenId)

        if (nextTokenId === null) {
          throw new Error(
            'All 255 token slots are occupied or revoked. Please use "Refresh All Slots" to free up space.'
          )
        }

        // Generate API key with specific tokenId
        console.log('🔑 [GetSecretButton] Calling getSecret with tokenId:', nextTokenId)
        const { apiKey, expiresAt, tokenId } = await getSecret(provider, expiresIn, nextTokenId)
        console.log('✅ [GetSecretButton] Key generated successfully with tokenId:', tokenId)

      // Generate unique ID
      const keyId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      // Store in localStorage
      storeApiKey({
        id: keyId,
        provider,
        apiKey,
        tokenId,
        expiresAt,
        createdAt: new Date().toISOString(),
        label: keyLabel.trim() || label || undefined,
      }, address)

      // Refresh slot status to update available tokenIds
      await refreshSlots()

        // Refresh existing keys state
        setExistingKeys(getApiKeysForProvider(provider, address))
        setGeneratedKey(apiKey)
        setShowKeys({ ...showKeys, [keyId]: true })
        setShowGenerateForm(false)
        setKeyLabel("") // Reset label input
        onSuccess?.(apiKey)

        // Success - exit retry loop
        setIsGenerating(false)
        return
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to generate API key"

        // Check if this is a retryable error (slot collision)
        const isRetryable =
          errorMessage.includes('already in use') ||
          errorMessage.includes('already revoked') ||
          errorMessage.includes('slot') ||
          errorMessage.includes('token')

        // If this is the last attempt or error is not retryable, throw
        if (attempt === MAX_RETRIES - 1 || !isRetryable) {
          console.error('❌ [GetSecretButton] Key generation failed:', errorMessage)
          setError(errorMessage)
          onError?.(errorMessage)
          setIsGenerating(false)
          return
        }

        // Log retry
        console.warn(`⚠️ [GetSecretButton] Retryable error on attempt ${attempt + 1}:`, errorMessage)
        // Continue to next retry attempt
      }
    }
  }

  const handleCopy = async (keyToCopy: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(keyToCopy)
      setCopied(keyId)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const toggleShowKey = (keyId: string) => {
    setShowKeys({ ...showKeys, [keyId]: !showKeys[keyId] })
  }

  const handleChatKeyToggle = (keyId: string, checked: boolean) => {
    if (!address) return

    try {
      if (checked) {
        // Mark this key as chat key (automatically unmarks others for same provider)
        setChatApiKey(keyId, address)
      } else {
        // Unmark this key
        unsetChatApiKey(keyId, address)
      }

      // Refresh existing keys state to reflect changes
      setExistingKeys(getApiKeysForProvider(provider, address))
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update chat key"
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }

  const handleDelete = async (keyId: string) => {
    if (!address) return

    const key = existingKeys.find((k) => k.id === keyId)
    if (!key) return

    // Warn if deleting a key that's used for chat
    const warningMessage = key.usedForChat
      ? `⚠️ WARNING: This key is currently used for chat!\n\n` +
        `Key: ${key.label || "Unlabeled"}\n` +
        `Slot: #${key.tokenId}\n\n` +
        `Revoking this key will:\n` +
        `• Immediately invalidate this key\n` +
        `• Stop chat from using this key\n` +
        `• Mark slot #${key.tokenId} as ⚫ revoked\n` +
        `• Slot #${key.tokenId} can't be reused until you "Refresh All"\n\n` +
        `Continue?`
      : `Revoke API Key?\n\n` +
        `Key: ${key.label || "Unlabeled"}\n` +
        `Slot: #${key.tokenId}\n\n` +
        `⚠️ This will:\n` +
        `• Immediately invalidate this key\n` +
        `• Mark slot #${key.tokenId} as ⚫ revoked\n` +
        `• Slot #${key.tokenId} can't be reused until you "Refresh All"\n\n` +
        `Continue?`

    if (!confirm(warningMessage)) {
      return
    }

    setDeletingKeyId(keyId)
    try {
      // First revoke on-chain
      await revokeToken(provider, key.tokenId)

      // Then delete from localStorage
      deleteApiKeyById(keyId, address)

      // Refresh slot status to update revoked bitmap
      await refreshSlots()

      setExistingKeys(getApiKeysForProvider(provider, address))
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete API key"
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setDeletingKeyId(null)
    }
  }

  const keyCount = address ? getApiKeyCountForProvider(provider, address) : 0

  // Helper to render a single key (ultra-compact version)
  const renderKey = (key: StoredApiKey, isNewlyGenerated = false) => {
    const isVisible = showKeys[key.id] || false
    const isCopied = copied === key.id

    return (
      <div
        key={key.id}
        className={`group px-2 py-1.5 rounded-md hover:bg-gray-50 border transition-colors ${
          key.usedForChat
            ? 'border-purple-300 bg-purple-50/30'
            : isNewlyGenerated
            ? 'bg-green-50/50 border-green-200'
            : 'border-transparent hover:border-gray-200'
        }`}
      >
        {/* Grid layout: Radio + Icon/Label + Tag + Slot + Key + Actions */}
        <div className="grid items-center gap-2" style={{ gridTemplateColumns: "auto auto 1fr auto auto 1fr auto" }}>
          {/* Radio button for chat selection */}
          <div>
            <input
              type="radio"
              name={`chat-key-${provider}`}
              checked={key.usedForChat === true}
              onChange={(e) => handleChatKeyToggle(key.id, e.target.checked)}
              className="h-3 w-3 text-purple-600 focus:ring-purple-500 cursor-pointer"
              title={key.usedForChat ? "Used for chat" : "Use for chat"}
            />
          </div>

          {/* Icon */}
          <div>
            <Key className="h-3 w-3 text-gray-400" />
          </div>

          {/* Label with sparkle */}
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-xs font-medium text-gray-700 truncate" title={key.label || "API Key"}>
              {key.label || "API Key"}
            </span>
            {isNewlyGenerated && <span className="text-xs">✨</span>}
          </div>

          {/* Chat tag - fixed width column */}
          <div className="w-10">
            {key.usedForChat && (
              <span className="text-[9px] px-1 py-0.5 bg-purple-100 text-purple-700 rounded whitespace-nowrap">
                Chat
              </span>
            )}
          </div>

          {/* Slot number */}
          <div>
            <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">#{key.tokenId}</span>
          </div>

          {/* Key value (masked) */}
          <div className="min-w-0">
            <input
              type={isVisible ? "text" : "password"}
              value={key.apiKey}
              readOnly
              className="w-full text-[10px] font-mono bg-transparent border-0 outline-none text-gray-600 px-1"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => toggleShowKey(key.id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title={isVisible ? "Hide" : "Show"}
            >
              {isVisible ? (
                <EyeOff className="h-3 w-3 text-gray-500" />
              ) : (
                <Eye className="h-3 w-3 text-gray-500" />
              )}
            </button>
            <button
              onClick={() => handleCopy(key.apiKey, key.id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Copy"
            >
              {isCopied ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3 text-gray-500" />
              )}
            </button>
            <button
              onClick={() => handleDelete(key.id)}
              disabled={deletingKeyId === key.id}
              className="p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
              title="Revoke"
            >
              {deletingKeyId === key.id ? (
                <Loader2 className="h-3 w-3 text-red-600 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3 text-red-500" />
              )}
            </button>
          </div>
        </div>

        {/* Metadata - only visible on hover */}
        <div className="text-[9px] text-gray-400 mt-0.5 ml-7 opacity-0 group-hover:opacity-100 transition-opacity">
          Created: {new Date(key.createdAt).toLocaleDateString()} • Expires: {key.expiresAt === 'Never' ? 'Never' : new Date(key.expiresAt).toLocaleDateString()}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Existing Keys Section */}
      {existingKeys.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-700">
              Existing API Keys ({keyCount})
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExistingKeys(!showExistingKeys)}
              className="h-6 text-xs"
            >
              {showExistingKeys ? "Hide" : "Show"}
            </Button>
          </div>

          {showExistingKeys && (
            <div className="max-h-[300px] overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
              {existingKeys.map((key) => renderKey(key, false))}
            </div>
          )}
        </div>
      )}

      {/* Newly Generated Key */}
      {generatedKey && existingKeys.length > 0 && (
        <div className="space-y-2">
          {renderKey(
            existingKeys.find((k) => k.apiKey === generatedKey)!,
            true
          )}
        </div>
      )}

      {/* Generate New Key Section */}
      <div className="space-y-2">
        {!showGenerateForm && (
          <Button
            onClick={() => setShowGenerateForm(true)}
            variant={existingKeys.length > 0 ? "outline" : variant}
            size={size}
            className="w-full"
          >
            <Key className="h-4 w-4 mr-2" />
            {existingKeys.length > 0 ? "Generate New Key" : "Generate API Key"}
          </Button>
        )}

        {showGenerateForm && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">
                API Key Name (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g., Production Key"
                value={keyLabel}
                onChange={(e) => setKeyLabel(e.target.value)}
                className="text-sm"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">
                Expiration Duration
              </label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant={variant}
                size={size}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowGenerateForm(false)}
                variant="outline"
                size={size}
              >
                Cancel
              </Button>
            </div>

            {/* Prerequisites Notice */}
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-xs text-amber-800">
                Prerequisites: Main account must exist and sub-account must have balance
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-xs text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
