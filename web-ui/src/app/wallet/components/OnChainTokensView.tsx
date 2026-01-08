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
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { useOnChainTokens, type OnChainToken } from "@/shared/hooks/useOnChainTokens"
import { useBrokerOperations } from "@/shared/hooks/useBrokerOperations"

interface OnChainTokensViewProps {
  /** Provider address */
  provider: string
}

/**
 * On-Chain Tokens View Component
 *
 * Displays all 255 tokenId slots (0-254) with their on-chain status.
 * This is the source of truth - even if localStorage is lost,
 * users can see and revoke any occupied tokenId.
 */
export function OnChainTokensView({ provider }: OnChainTokensViewProps) {
  const { address } = useAccount()
  const { tokens, generation, isLoading, error, refresh } = useOnChainTokens(provider, address)
  const { revokeToken } = useBrokerOperations()
  const [revokingTokenId, setRevokingTokenId] = useState<number | null>(null)
  const [showRevoked, setShowRevoked] = useState(false)

  const handleRevoke = async (token: OnChainToken) => {
    const label = token.localData?.label || `Token ID ${token.tokenId}`
    if (
      !confirm(
        `Are you sure you want to revoke ${label}? ` +
        `This will invalidate the API key on-chain.`
      )
    ) {
      return
    }

    setRevokingTokenId(token.tokenId)
    try {
      await revokeToken(provider, token.tokenId)
      await refresh()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to revoke token"
      alert(`Error: ${errorMessage}`)
    } finally {
      setRevokingTokenId(null)
    }
  }

  // Separate tokens
  const activeTokens = tokens.filter((t) => !t.isRevoked && t.localData)
  const unknownTokens = tokens.filter((t) => !t.isRevoked && !t.localData)
  const revokedTokens = tokens.filter((t) => t.isRevoked)

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

  const isExpired = (dateStr: string) => {
    if (dateStr === "Never") return false
    return new Date(dateStr) < new Date()
  }

  const renderToken = (token: OnChainToken) => {
    const isDeleting = revokingTokenId === token.tokenId
    const expired = token.localData && isExpired(token.localData.expiresAt)

    return (
      <div
        key={token.tokenId}
        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Key className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="font-mono text-sm font-semibold text-gray-900">
              Token ID: {token.tokenId}
            </span>
            {token.isRevoked ? (
              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
                <XCircle className="h-3 w-3 mr-1" />
                Revoked
              </Badge>
            ) : token.localData ? (
              expired ? (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Expired
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <HelpCircle className="h-3 w-3 mr-1" />
                Unknown
              </Badge>
            )}
          </div>

          {token.localData ? (
            <div className="text-xs text-gray-600">
              <p className="font-medium">{token.localData.label || "Unlabeled Key"}</p>
              <p>Created: {formatDate(token.localData.createdAt)}</p>
              <p>Expires: {formatDate(token.localData.expiresAt)}</p>
            </div>
          ) : !token.isRevoked ? (
            <p className="text-xs text-amber-600">
              localStorage data missing. This token may be active on-chain.
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              This token slot is available for reuse.
            </p>
          )}
        </div>

        {!token.isRevoked && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRevoke(token)}
            disabled={isDeleting}
            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1" />
                Revoke
              </>
            )}
          </Button>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="ml-2 text-sm text-gray-600">Loading on-chain token status...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-sm text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mt-1">
            Generation: {generation} • {activeTokens.length + unknownTokens.length} active • {revokedTokens.length} revoked
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-xs text-blue-800">
          This shows all token slots for this provider. Even if localStorage is cleared,
          you can see and revoke occupied tokens.
        </AlertDescription>
      </Alert>

      {/* Active Tokens */}
      {activeTokens.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900">
            Active Tokens ({activeTokens.length})
          </h4>
          <div className="space-y-2">
            {activeTokens.map(renderToken)}
          </div>
        </div>
      )}

      {/* Unknown Tokens */}
      {unknownTokens.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-amber-900">
            Unknown Tokens ({unknownTokens.length})
          </h4>
          <p className="text-xs text-amber-700 mb-2">
            These tokens are not revoked on-chain but have no localStorage data.
          </p>
          <div className="space-y-2">
            {unknownTokens.map(renderToken)}
          </div>
        </div>
      )}

      {/* Revoked Tokens */}
      {revokedTokens.length > 0 && (
        <div className="space-y-2">
          <div
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
            onClick={() => setShowRevoked(!showRevoked)}
          >
            <h4 className="text-sm font-semibold text-gray-700">
              Revoked Tokens ({revokedTokens.length})
            </h4>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {showRevoked ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          {showRevoked && (
            <div className="space-y-2">
              {revokedTokens.map(renderToken)}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {activeTokens.length === 0 && unknownTokens.length === 0 && revokedTokens.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Key className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No tokens found for this provider</p>
        </div>
      )}
    </div>
  )
}
