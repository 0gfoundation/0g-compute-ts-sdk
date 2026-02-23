"use client"

import * as React from "react"
import { useState } from "react"
import { useAccount } from "wagmi"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertCircle,
  Loader2,
  Trash2,
  Key,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
} from "lucide-react"
import { useSlotStatus, type Slot } from "@/shared/hooks/useSlotStatus"
import { useBrokerOperations } from "@/shared/hooks/useBrokerOperations"

interface SlotManagerProps {
  /** Provider address */
  provider: string
  /** Show create key button */
  showCreateButton?: boolean
  /** Callback when create key is clicked */
  onCreateKey?: () => void
}

/**
 * Slot Manager Component
 *
 * Visualizes the 256-slot system for API keys:
 * - 🟢 Active: Occupied by an active key
 * - ⚫ Revoked: Permanently blocked until refresh
 * - ⚪ Available: Ready for use
 */
export function SlotManager({
  provider,
  showCreateButton = false,
  onCreateKey,
}: SlotManagerProps) {
  const { address } = useAccount()
  const { slotStats, allSlots, isLoading, error, refresh } = useSlotStatus(provider, address)
  const { revokeToken, revokeAllTokens } = useBrokerOperations()

  const [revokingSlotId, setRevokingSlotId] = useState<number | null>(null)
  const [showGrid, setShowGrid] = useState(false)
  const [showRevokedList, setShowRevokedList] = useState(false)

  // Separate slots by status
  const activeSlots = allSlots.filter((s) => s.status === "active")
  const revokedSlots = allSlots.filter((s) => s.status === "revoked" && s.id !== 255)
  const unknownSlots = allSlots.filter((s) => s.status === "unknown")
  const availableSlots = allSlots.filter((s) => s.status === "available")

  const handleRevoke = async (slot: Slot) => {
    const label = slot.keyLabel || `Slot #${slot.id}`
    if (
      !confirm(
        `Revoke API Key?\n\n` +
        `Key: ${label}\n` +
        `Slot: #${slot.id}\n\n` +
        `⚠️ This will:\n` +
        `• Immediately invalidate this key\n` +
        `• Mark slot #${slot.id} as ⚫ (revoked)\n` +
        `• Slot #${slot.id} can't be reused until you "Refresh All"\n\n` +
        `Active keys: ${slotStats.active} → ${slotStats.active - 1}\n` +
        `Revoked slots: ${slotStats.revoked} → ${slotStats.revoked + 1}\n\n` +
        `Continue?`
      )
    ) {
      return
    }

    setRevokingSlotId(slot.id)
    try {
      await revokeToken(provider, slot.id)
      await refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to revoke key"
      alert(`Error: ${errorMessage}`)
    } finally {
      setRevokingSlotId(null)
    }
  }

  const handleRefreshAll = async () => {
    if (activeSlots.length === 0) {
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
      const keyList = activeSlots
        .slice(0, 5)
        .map((s) => `  • ${s.keyLabel || `Slot #${s.id}`} (Slot #${s.id})`)
        .join("\n")
      const moreKeys = activeSlots.length > 5 ? `  ... and ${activeSlots.length - 5} more` : ""

      if (
        !confirm(
          `⚠️ REFRESH ALL SLOTS - CRITICAL OPERATION\n\n` +
          `This will RESET the entire slot system:\n\n` +
          `Before:                    After:\n` +
          `🟢 Active: ${slotStats.active}        →     ⚫ All revoked\n` +
          `⚫ Revoked: ${slotStats.revoked}      →     ⚪ All cleared\n` +
          `⚪ Available: ${slotStats.available}   →     ⚪ 256 available\n\n` +
          `⚠️ ALL ${activeSlots.length} active keys will stop working:\n` +
          `${keyList}\n` +
          `${moreKeys}\n\n` +
          `Type "REFRESH ALL" in the next dialog to confirm.`
        )
      ) {
        return
      }

      const confirmation = prompt('Type "REFRESH ALL" to confirm:')
      if (confirmation !== "REFRESH ALL") {
        alert("Operation cancelled. The text did not match.")
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

  const formatDate = (dateStr: string) => {
    if (dateStr === "Never") return "Never"
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="ml-2 text-sm text-gray-600">Loading slot status...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-sm text-red-800">{error}</AlertDescription>
      </Alert>
    )
  }

  const healthStatus =
    slotStats.usagePercent < 60 ? "healthy" : slotStats.usagePercent < 80 ? "warning" : "critical"

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">API Key Slots</h3>
          <p className="text-xs text-gray-500 mt-1">
            {slotStats.active + slotStats.revoked} / {slotStats.total} slots used •{" "}
            {slotStats.available} available
            {slotStats.unknown > 0 && ` • ${slotStats.unknown} unknown`}
          </p>
        </div>
        <div className="flex gap-2">
          {showCreateButton && onCreateKey && (
            <Button size="sm" onClick={onCreateKey} className="bg-purple-600 hover:bg-purple-700">
              + Create Key
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Slot Progress Bar */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Slot Usage</span>
            <Badge
              variant="outline"
              className={
                healthStatus === "healthy"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : healthStatus === "warning"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }
            >
              {slotStats.usagePercent}% used
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-6 bg-gray-100 rounded-lg overflow-hidden">
            {/* Active slots (green) */}
            <div
              className="absolute left-0 h-full bg-green-500 transition-all"
              style={{ width: `${(slotStats.active / slotStats.total) * 100}%` }}
            />
            {/* Revoked slots (gray) */}
            <div
              className="absolute left-0 h-full bg-gray-600 transition-all"
              style={{
                width: `${((slotStats.active + slotStats.revoked) / slotStats.total) * 100}%`,
              }}
            />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600">Active: {slotStats.active}</span>
            </div>
            {slotStats.unknown > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-amber-600">Unknown: {slotStats.unknown}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-600" />
              <span className="text-gray-600">Revoked: {slotStats.revoked}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <span className="text-gray-600">Available: {slotStats.available}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* How it works */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-xs text-blue-800">
          <p className="font-medium mb-1">Understanding Slots</p>
          <p className="mb-2">Think of slots like numbered parking spaces (0-255):</p>
          <p>
            • <span className="font-semibold">Create Key</span> → Occupy 1 space (🟢)
          </p>
          <p>
            • <span className="font-semibold">Revoke Key</span> → Block the space permanently (⚫)
          </p>
          <p>
            • <span className="font-semibold">Refresh All</span> → Clear all spaces and restore 256 slots (⚪)
          </p>
        </AlertDescription>
      </Alert>

      {/* Warning if usage is high */}
      {slotStats.usagePercent >= 80 && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-800">
            <p className="font-medium mb-1">⚠️ High Slot Usage ({slotStats.usagePercent}%)</p>
            <p>
              You're running low on available slots. Consider using "Refresh All Slots" to free up
              space. This will revoke all active keys and restore 256 fresh slots.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Active Keys List */}
      {activeSlots.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900">
            Active Keys ({activeSlots.length})
          </h4>
          <div className="space-y-2">
            {activeSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      Slot #{slot.id}
                    </span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      🟢 Active
                    </Badge>
                  </div>
                  {slot.keyData && (
                    <div className="text-xs text-gray-600 ml-6">
                      <p className="font-medium">{slot.keyLabel || "Unlabeled Key"}</p>
                      <p>Created: {formatDate(slot.keyData.createdAt)}</p>
                      <p>Expires: {formatDate(slot.keyData.expiresAt)}</p>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(slot)}
                  disabled={revokingSlotId === slot.id}
                  className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {revokingSlotId === slot.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Revoke
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unknown Slots Warning */}
      {unknownSlots.length > 0 && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-800">
            <p className="font-medium mb-1">
              {unknownSlots.length} slot{unknownSlots.length > 1 ? 's' : ''} may have keys from another device or browser
            </p>
            <p>
              These slots are not revoked and have no locally stored keys. They may have been
              created from a different browser origin. Generating a new key could reuse one of
              these slots and invalidate the original key.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Revoked Slots (Collapsible) */}
      {revokedSlots.length > 0 && (
        <div className="space-y-2">
          <div
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
            onClick={() => setShowRevokedList(!showRevokedList)}
          >
            <h4 className="text-sm font-semibold text-gray-700">
              Revoked Slots ({revokedSlots.length})
            </h4>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {showRevokedList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          {showRevokedList && (
            <div className="space-y-1">
              {revokedSlots.slice(0, 10).map((slot) => (
                <div key={slot.id} className="flex items-center gap-2 p-2 border rounded text-xs text-gray-600">
                  <span className="font-mono">Slot #{slot.id}</span>
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
                    ⚫ Revoked
                  </Badge>
                </div>
              ))}
              {revokedSlots.length > 10 && (
                <p className="text-xs text-gray-500 p-2">
                  ... and {revokedSlots.length - 10} more revoked slots
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Slot Grid (Collapsible) */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
          className="w-full justify-between"
        >
          <span>{showGrid ? "Hide" : "View"} Slot Grid (All 256 Slots)</span>
          {showGrid ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {showGrid && (
          <Card className="p-4">
            <div className="grid grid-cols-16 gap-1">
              {allSlots.map((slot) => {
                const icon =
                  slot.status === "active" ? "🟢" : slot.status === "revoked" ? "⚫" : slot.status === "unknown" ? "🟡" : "⚪"
                const title =
                  slot.status === "active"
                    ? `Slot #${slot.id}: ${slot.keyLabel || "Active"}`
                    : slot.status === "revoked"
                    ? `Slot #${slot.id}: Revoked`
                    : slot.status === "unknown"
                    ? `Slot #${slot.id}: Unknown (possible external key)`
                    : `Slot #${slot.id}: Available`

                return (
                  <div
                    key={slot.id}
                    className="w-6 h-6 flex items-center justify-center text-xs cursor-help"
                    title={title}
                  >
                    {icon}
                  </div>
                )
              })}
            </div>
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              <p>🟢 = Active key (hover to see details)</p>
              <p>🟡 = Unknown (possible key from another device/browser)</p>
              <p>⚫ = Revoked slot (can&apos;t reuse)</p>
              <p>⚪ = Available slot</p>
            </div>
          </Card>
        )}
      </div>

      {/* Refresh All Button */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900">Refresh All Slots</h4>
              <p className="text-xs text-amber-700 mt-1">
                Use this to clear all {slotStats.revoked} revoked slots and restore 256 fresh slots.
                {activeSlots.length > 0 && (
                  <span className="font-semibold">
                    {" "}
                    ⚠️ This will also revoke all {activeSlots.length} active keys!
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRefreshAll}
            className="w-full"
          >
            ⚠️ Refresh All Slots
          </Button>
        </div>
      </Card>
    </div>
  )
}
