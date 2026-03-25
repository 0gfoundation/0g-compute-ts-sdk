"use client"

import * as React from "react"
import { useAccount } from "wagmi"
import { useProviderSetup } from "@/shared/hooks/useProviderSetup"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Wallet,
  CreditCard,
  Key,
} from "lucide-react"
import { formatNumber } from "@/shared/utils/formatNumber"
import { cn } from "@/lib/utils"

interface SetupProgressProps {
  /** Provider address */
  provider: string | null

  /** Compact mode (shows fewer details) */
  compact?: boolean

  /** Custom class name */
  className?: string

  /** External refresh trigger - increment to force refresh */
  refreshTrigger?: number
}

interface StepProps {
  /** Step title */
  title: string

  /** Step description */
  description: string

  /** Step status */
  status: "completed" | "pending" | "current"

  /** Icon component */
  icon: React.ReactNode

  /** Optional balance info */
  balanceInfo?: string
}

function Step({ title, description, status, icon, balanceInfo }: StepProps) {
  return (
    <div className="flex items-start gap-3">
      {/* Status Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {status === "completed" && (
          <CheckCircle2 className="h-5 w-5 text-purple-600" />
        )}
        {status === "current" && (
          <Circle className="h-5 w-5 text-purple-600 fill-purple-600" />
        )}
        {status === "pending" && (
          <Circle className="h-5 w-5 text-gray-300" />
        )}
      </div>

      {/* Step Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex-shrink-0",
              status === "completed" && "text-purple-600",
              status === "current" && "text-purple-600",
              status === "pending" && "text-gray-400"
            )}
          >
            {icon}
          </div>
          <h4
            className={cn(
              "text-sm font-medium",
              status === "completed" && "text-purple-900",
              status === "current" && "text-purple-900",
              status === "pending" && "text-gray-500"
            )}
          >
            {title}
          </h4>
        </div>
        <p
          className={cn(
            "text-xs mt-1 ml-6",
            status === "completed" && "text-purple-700",
            status === "current" && "text-purple-700",
            status === "pending" && "text-gray-500"
          )}
        >
          {description}
        </p>
        {balanceInfo && (
          <p className="text-xs text-purple-600 mt-1 ml-6 font-mono">{balanceInfo}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Setup Progress Component
 *
 * Displays step-by-step setup progress for a provider
 * Uses useProviderSetup to track status from blockchain + localStorage
 *
 * Steps:
 * 1. Create main ledger account (deposit funds)
 * 2. Create sub-account for provider (transfer funds)
 * 3. Generate API key
 *
 * @example
 * ```tsx
 * <SetupProgress provider={providerAddress} />
 * ```
 */
export function SetupProgress({
  provider,
  compact = false,
  className,
  refreshTrigger = 0,
}: SetupProgressProps) {
  const { address } = useAccount()
  const { status, isLoading, checkStatus } = useProviderSetup(provider, address)

  // Refresh when external trigger changes
  React.useEffect(() => {
    if (refreshTrigger > 0) {
      checkStatus()
    }
  }, [refreshTrigger, checkStatus])

  if (!provider) {
    return (
      <Alert className="bg-gray-50 border-gray-200">
        <AlertCircle className="h-4 w-4 text-gray-500" />
        <AlertDescription className="text-xs text-gray-700">
          No provider selected
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Alert className="bg-purple-50 border-purple-200">
        <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
        <AlertDescription className="text-xs text-purple-800">
          Checking setup status...
        </AlertDescription>
      </Alert>
    )
  }

  // Determine step statuses
  const getStepStatus = (
    condition: boolean,
    previousCompleted: boolean
  ): "completed" | "pending" | "current" => {
    if (condition) return "completed"
    if (previousCompleted) return "current"
    return "pending"
  }

  const step1Status = getStepStatus(status.hasMainAccount, true)
  const step2Status = getStepStatus(
    status.hasSubAccount,
    status.hasMainAccount
  )
  const step3Status = getStepStatus(
    status.hasApiKey,
    status.hasSubAccount
  )

  return (
    <div className={cn("space-y-4", className)}>
      {/* Steps List */}
      <div className="space-y-4">
        {/* Step 1: Main Account */}
        <Step
          title="Create Main Account"
          description={
            status.hasMainAccount
              ? "Your main ledger account is active"
              : "Deposit funds to create your main account"
          }
          status={step1Status}
          icon={<Wallet className="h-4 w-4" />}
        />

        {/* Step 2: Sub-Account */}
        <Step
          title="Create Sub-Account for Provider"
          description={
            status.hasSubAccount
              ? "Sub-account exists with balance"
              : "Transfer funds to this provider to create sub-account"
          }
          status={step2Status}
          icon={<CreditCard className="h-4 w-4" />}
          balanceInfo={
            status.hasSubAccount
              ? `Balance: ${formatNumber(parseFloat(status.subAccountBalance))} A0GI`
              : undefined
          }
        />

        {/* Step 3: API Key */}
        <Step
          title="Generate API Key"
          description={
            status.hasStoredKey
              ? "API key is stored and ready to use"
              : status.canGenerateKey
              ? "Ready to generate API key"
              : "Transfer funds first to generate API key"
          }
          status={step3Status}
          icon={<Key className="h-4 w-4" />}
        />
      </div>
    </div>
  )
}
