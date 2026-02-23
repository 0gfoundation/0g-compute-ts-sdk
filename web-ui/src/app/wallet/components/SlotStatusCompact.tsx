"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { useSlotStatus } from "@/shared/hooks/useSlotStatus"
import { useBrokerOperations } from "@/shared/hooks/useBrokerOperations"
import { getApiKeysForProvider } from "@/shared/utils/apiKeyStorage"

interface SlotStatusCompactProps {
  /** Provider address */
  provider: string

  /** Optional refresh trigger - increment to force refresh */
  refreshTrigger?: number
}

/**
 * Compact Slot Status Component
 *
 * Shows slot usage overview and refresh all button.
 * Designed to be embedded in the Generate API Key section.
 */
export function SlotStatusCompact({ provider, refreshTrigger }: SlotStatusCompactProps) {
  const { address } = useAccount()
  const { slotStats, isLoading, error, refresh } = useSlotStatus(provider, address)
  const { revokeAllTokens } = useBrokerOperations()

  // Track expanded state
  const [isExpanded, setIsExpanded] = useState(false)

  // Track active keys reactively
  const [activeKeys, setActiveKeys] = useState(() =>
    address ? getApiKeysForProvider(provider, address) : []
  )

  // Update active keys when address, provider, or refreshTrigger changes
  useEffect(() => {
    if (address) {
      setActiveKeys(getApiKeysForProvider(provider, address))
    } else {
      setActiveKeys([])
    }
  }, [address, provider, refreshTrigger])

  // Refresh slot status when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      refresh()
    }
  }, [refreshTrigger, refresh])

  const handleRefreshAll = async () => {
    if (activeKeys.length === 0) {
      if (
        !confirm(
          `Refresh All Slots?\n\n` +
          `This will clear all ${slotStats.revoked} revoked slots and restore 256 fresh slots.\n\n` +
          `Continue?`
        )
      ) {
        return
      }
    } else {
      // Has active keys - show detailed warning
      const keyList = activeKeys
        .slice(0, 5)
        .map((k) => `  • ${k.label || "Unlabeled"} (Slot #${k.tokenId})`)
        .join("\n")
      const moreKeys = activeKeys.length > 5 ? `  ... and ${activeKeys.length - 5} more` : ""

      if (
        !confirm(
          `⚠️ REFRESH ALL SLOTS - CRITICAL OPERATION\n\n` +
          `This will:\n` +
          `• Revoke ALL ${activeKeys.length} active keys\n` +
          `• Clear all ${slotStats.revoked} revoked slots\n` +
          `• Restore all 256 slots\n\n` +
          `⚠️ Keys that will stop working:\n` +
          `${keyList}\n` +
          `${moreKeys}\n\n` +
          `Type "REFRESH ALL" in the next dialog to confirm.`
        )
      ) {
        return
      }

      const confirmation = prompt('Type "REFRESH ALL" to confirm:')
      if (confirmation !== "REFRESH ALL") {
        alert("Operation cancelled.")
        return
      }
    }

    try {
      await revokeAllTokens(provider)
      await refresh()
      alert("All slots refreshed successfully! You now have 256 fresh slots.")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to refresh slots"
      alert(`Error: ${errorMessage}`)
    }
  }

  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-md p-3">
        <div className="flex items-center">
          <Loader2 className="h-4 w-4 animate-spin text-gray-600 mr-2" />
          <span className="text-xs text-gray-600">Loading slot status...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-xs text-red-800">{error}</AlertDescription>
      </Alert>
    )
  }

  const healthStatus =
    slotStats.usagePercent < 60 ? "healthy" : slotStats.usagePercent < 80 ? "warning" : "critical"

  return (
    <div className="border border-gray-200 rounded-md">
      {/* Compact Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-gray-700">Slot Usage:</span>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="Active"></span>
            <span className="text-gray-600">{slotStats.active} active</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-400" title="Available"></span>
            <span className="text-gray-600">{slotStats.available} available</span>
          </div>
          {slotStats.unknown > 0 && (
            <>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400" title="Possible external keys"></span>
                <span className="text-amber-600">{slotStats.unknown} unknown</span>
              </div>
            </>
          )}
          {slotStats.revoked > 0 && (
            <>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500" title="Revoked"></span>
                <span className="text-amber-600">{slotStats.revoked} revoked</span>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mini Progress Bar */}
          <div className="relative w-16 h-1.5 bg-gray-100 rounded overflow-hidden">
            <div
              className={
                healthStatus === "healthy"
                  ? "absolute left-0 h-full bg-green-500"
                  : healthStatus === "warning"
                  ? "absolute left-0 h-full bg-amber-500"
                  : "absolute left-0 h-full bg-red-500"
              }
              style={{ width: `${slotStats.usagePercent}%` }}
            />
          </div>
          <Badge
            variant="outline"
            className={
              healthStatus === "healthy"
                ? "bg-gray-50 text-gray-700 border-gray-200 text-xs"
                : healthStatus === "warning"
                ? "bg-amber-50 text-amber-700 border-amber-200 text-xs"
                : "bg-red-50 text-red-700 border-red-200 text-xs"
            }
          >
            {slotStats.usagePercent}%
          </Badge>
          {isExpanded ? (
            <RefreshCw className="h-3 w-3 text-gray-500" />
          ) : (
            <RefreshCw className="h-3 w-3 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-200">
          {/* Progress Bar */}
          <div className="relative w-full h-2 bg-gray-100 rounded overflow-hidden mt-3">
            {/* Active slots (green) */}
            <div
              className="absolute left-0 h-full bg-green-500"
              style={{ width: `${(slotStats.active / slotStats.total) * 100}%` }}
            />
            {/* Revoked slots (gray) */}
            <div
              className="absolute left-0 h-full bg-gray-600"
              style={{
                width: `${((slotStats.active + slotStats.revoked) / slotStats.total) * 100}%`,
              }}
            />
          </div>

          {/* Warning if usage is high */}
          {slotStats.usagePercent >= 80 && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-800">
                High usage. Consider refreshing slots to free up space.
              </AlertDescription>
            </Alert>
          )}

          {/* Refresh All Button */}
          {slotStats.revoked > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              className="w-full text-xs h-7"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh All Slots ({slotStats.revoked} revoked)
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
