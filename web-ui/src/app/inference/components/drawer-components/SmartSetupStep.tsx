'use client'

import * as React from 'react'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Circle, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StepStatus = 'incomplete' | 'complete-good' | 'complete-warning'

interface SmartSetupStepProps {
  /** Step number */
  step: number

  /** Step title */
  title: string

  /** Step status determines icon, color, and default expansion */
  status: StepStatus

  /** Summary info displayed when collapsed (e.g., "Balance: 100 A0GI") */
  summaryInfo?: string

  /** Content to display when expanded */
  children: React.ReactNode

  /** Force expansion state (optional) */
  forceExpanded?: boolean

  /** Warning message for complete-warning state */
  warningMessage?: string

  /** Optional action element to display next to the title */
  titleAction?: React.ReactNode
}

/**
 * Smart Setup Step Component
 *
 * Implements the "Smart Steps" pattern with three states:
 * 1. incomplete: Not yet completed - Default expanded, shows ○
 * 2. complete-good: Completed and sufficient - Default collapsed, shows ✓
 * 3. complete-warning: Completed but needs attention - Default expanded, shows !
 *
 * @example
 * ```tsx
 * <SmartSetupStep
 *   step={2}
 *   title="Transfer Funds to Provider"
 *   status="complete-warning"
 *   summaryInfo="Balance: 0.1 A0GI"
 *   warningMessage="Balance is low. Recommended: > 5 A0GI"
 * >
 *   <TransferFundForm ... />
 * </SmartSetupStep>
 * ```
 */
export function SmartSetupStep({
  step,
  title,
  status,
  summaryInfo,
  children,
  forceExpanded,
  warningMessage,
  titleAction,
}: SmartSetupStepProps) {
  // Default: all panels are collapsed
  const defaultExpanded = false
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Use forced expansion if provided
  const expanded = forceExpanded !== undefined ? forceExpanded : isExpanded

  // Status-based styling
  const getStatusIcon = () => {
    switch (status) {
      case 'incomplete':
        return <Circle className="h-5 w-5 text-gray-400" />
      case 'complete-good':
        return <CheckCircle2 className="h-5 w-5 text-gray-600" />
      case 'complete-warning':
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getContainerClassName = () => {
    const base = 'rounded-lg border transition-colors'

    switch (status) {
      case 'incomplete':
        return cn(base, 'bg-white border-gray-200')
      case 'complete-good':
        return cn(base, 'bg-gray-50 border-gray-200')
      case 'complete-warning':
        return cn(base, 'bg-gray-50 border-gray-200')
    }
  }

  const getTitleClassName = () => {
    const base = 'text-base font-medium'

    switch (status) {
      case 'incomplete':
        return cn(base, 'text-gray-900')
      case 'complete-good':
        return cn(base, 'text-gray-900')
      case 'complete-warning':
        return cn(base, 'text-gray-900')
    }
  }

  const getSummaryClassName = () => {
    switch (status) {
      case 'incomplete':
        return 'text-gray-600'
      case 'complete-good':
        return 'text-gray-700'
      case 'complete-warning':
        return 'text-gray-700'
    }
  }

  return (
    <div className={getContainerClassName()}>
      {/* Header - Always visible, clickable to toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start justify-between text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Status Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon()}
          </div>

          {/* Title and Summary */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={getTitleClassName()}>
                {step}. {title}
              </h3>
              {titleAction && (
                <div onClick={(e) => e.stopPropagation()}>
                  {titleAction}
                </div>
              )}
            </div>

            {/* Summary info (shown when collapsed) */}
            {!expanded && summaryInfo && (
              <p className={cn('text-sm mt-1', getSummaryClassName())}>
                {summaryInfo}
              </p>
            )}
          </div>

          {/* Expand/Collapse Icon */}
          <div className="flex-shrink-0">
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
      </button>

      {/* Content - Shown when expanded */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Warning message for complete-warning state */}
          {status === 'complete-warning' && warningMessage && (
            <div className="flex items-start gap-2 p-3 bg-gray-100 border border-gray-300 rounded-md">
              <AlertCircle className="h-4 w-4 text-gray-700 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-900">{warningMessage}</p>
            </div>
          )}

          {/* Step content */}
          {children}
        </div>
      )}
    </div>
  )
}
