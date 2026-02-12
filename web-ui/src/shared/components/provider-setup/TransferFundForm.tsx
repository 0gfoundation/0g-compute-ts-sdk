"use client"

import * as React from "react"
import { useState } from "react"
import { useBrokerOperations } from "@/shared/hooks/useBrokerOperations"
import { useBroker } from "@/shared/providers/BrokerProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Loader2, CheckCircle2, Info } from "lucide-react"
import { MINIMUM_DEPOSITS } from "@/shared/constants/limits"
import { formatNumber } from "@/shared/utils/formatNumber"

interface TransferFundFormProps {
  /** Provider address */
  provider: string

  /** Service type */
  serviceType: "inference" | "fine-tuning"

  /** Optional callback to refresh provider balance */
  onRefreshProvider?: () => Promise<void>

  /** Success callback */
  onSuccess?: () => void

  /** Error callback */
  onError?: (error: string) => void
}

/**
 * Transfer Fund Form Component
 *
 * Reuses business logic from useBrokerOperations
 * Similar to TopUpModal but more generic for use in BuildDrawer
 *
 * @example
 * ```tsx
 * <TransferFundForm
 *   provider={providerAddress}
 *   serviceType="inference"
 *   onRefreshProvider={refreshProviderBalance}
 *   onSuccess={() => toast.success('Transfer successful')}
 * />
 * ```
 */
export function TransferFundForm({
  provider,
  serviceType,
  onRefreshProvider,
  onSuccess,
  onError,
}: TransferFundFormProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successAmount, setSuccessAmount] = useState("")

  const { transferFund } = useBrokerOperations()
  const { ledgerInfo } = useBroker()

  const handleTransfer = async () => {
    // Validate amount
    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (amountNum < MINIMUM_DEPOSITS.TOPUP_PROVIDER) {
      setError(`Minimum transfer amount is ${MINIMUM_DEPOSITS.TOPUP_PROVIDER} 0G`)
      return
    }

    // Check sufficient balance
    const available = parseFloat(ledgerInfo?.availableBalance || "0")
    if (amountNum > available) {
      setError("Insufficient balance")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await transferFund(provider, amountNum, serviceType, onRefreshProvider)

      setSuccessAmount(amount)
      setSuccess(true)
      setAmount("")

      // Show success message briefly
      setTimeout(() => setSuccess(false), 3000)

      // Wait for blockchain to propagate, then refresh status
      // Use a longer delay to ensure blockchain state is updated
      setTimeout(async () => {
        // Call onRefreshProvider again to ensure balance is fresh
        if (onRefreshProvider) {
          await onRefreshProvider()
        }
        onSuccess?.()
      }, 1500)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to transfer funds"
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const available = parseFloat(ledgerInfo?.availableBalance || "0")

  const handleMaxClick = () => {
    setAmount(ledgerInfo?.availableBalance || "0")
    setError(null)
    setSuccess(false)
  }

  return (
    <div className="space-y-3">
      {/* Transfer Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setError(null)
              setSuccess(false)
            }}
            disabled={isLoading}
            min="0"
            step="0.000001"
            className="pr-24"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleMaxClick}
              disabled={isLoading}
              className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-semibold px-1.5 py-0.5 rounded transition-colors disabled:opacity-50"
            >
              Max
            </button>
            <span className="text-gray-400 text-sm">|</span>
            <span className="text-gray-500 text-sm font-medium">0G</span>
          </div>
        </div>
        <Button
          onClick={handleTransfer}
          disabled={isLoading || !amount}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Transferring...
            </>
          ) : (
            "Transfer"
          )}
        </Button>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-500 flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">This provider has been verified by 0G, but requires your acknowledgment to proceed. Initiating this transfer will automatically mark the provider as trusted. If you have concerns, please check manually using the 'Verify Provider' button above</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Balance Info */}
      <p className="text-xs text-gray-500">
        Available for Transfer: {ledgerInfo ? (
          <span className="font-semibold text-gray-900">{formatNumber(available)} 0G</span>
        ) : (
          <span>Loading...</span>
        )}
        {' '}(<a
          href="/wallet"
          className="text-purple-500 hover:text-purple-700 hover:underline"
          title="Go to ledger page to view details and deposit funds"
        >
          view details and deposit in account page
        </a>)
      </p>

      {/* Recommendations */}
      <p className="text-xs text-amber-600">
        Recommended: Transfer at least 5 0G for stable service response
      </p>

      {/* Success Message */}
      {success && (
        <Alert className="bg-purple-50 border-purple-200">
          <CheckCircle2 className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-xs text-purple-800">
            Successfully transferred {successAmount} 0G to provider
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-xs text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
