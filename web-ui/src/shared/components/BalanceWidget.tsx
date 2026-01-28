'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Wallet, Plus, ExternalLink, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface BalanceWidgetProps {
  totalBalance: string | number
  availableBalance?: string | number
  lockedBalance?: string | number
  providerBalance?: number | null
  providerName?: string
  isLoading?: boolean
  onAddFunds?: () => void
  onViewDetails?: () => void
  compact?: boolean
  showProviderBalance?: boolean
}

// Helper function to format numbers
const formatNumber = (value: string | number): string => {
  if (!value || value === '0' || value === 0) return '0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'

  // For very small numbers, show more precision
  if (Math.abs(num) < 0.000001) {
    return num.toFixed(12).replace(/\.?0+$/, '')
  }
  // For small numbers
  else if (Math.abs(num) < 0.01) {
    return num.toFixed(8).replace(/\.?0+$/, '')
  }
  // For normal numbers
  else if (Math.abs(num) < 1000) {
    return num.toFixed(4).replace(/\.?0+$/, '')
  }
  // For large numbers, use comma separators
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

export function BalanceWidget({
  totalBalance,
  availableBalance,
  lockedBalance,
  providerBalance,
  providerName,
  isLoading = false,
  onAddFunds,
  onViewDetails,
  compact = false,
  showProviderBalance = false,
}: BalanceWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasBreakdown = availableBalance !== undefined || lockedBalance !== undefined
  const totalNum = typeof totalBalance === 'string' ? parseFloat(totalBalance) : totalBalance
  const isLowBalance = totalNum < 1

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${
                isLowBalance ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'
              }`}>
                <Wallet className={`w-3.5 h-3.5 ${isLowBalance ? 'text-yellow-600' : 'text-gray-500'}`} />
                <span className={`font-medium ${isLowBalance ? 'text-yellow-700' : 'text-gray-700'}`}>
                  {isLoading ? '...' : formatNumber(totalBalance)} 0G
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" className="p-3 max-w-xs">
              <div className="space-y-2">
                <div className="font-semibold">Account Balance</div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span>{formatNumber(totalBalance)} 0G</span>
                  </div>
                  {availableBalance !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Available:</span>
                      <span className="text-green-400">{formatNumber(availableBalance)} 0G</span>
                    </div>
                  )}
                  {lockedBalance !== undefined && parseFloat(String(lockedBalance)) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Locked:</span>
                      <span className="text-orange-400">{formatNumber(lockedBalance)} 0G</span>
                    </div>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
          {onAddFunds && (
            <button
              onClick={onAddFunds}
              className={`p-1.5 rounded-md transition-colors ${
                isLowBalance
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
              title="Add Funds"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </TooltipProvider>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Main Balance Display */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isLowBalance ? 'bg-yellow-100' : 'bg-purple-100'}`}>
              <Wallet className={`w-5 h-5 ${isLowBalance ? 'text-yellow-600' : 'text-purple-600'}`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-500">Total Balance</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Your total balance across all providers. Available balance can be used immediately,
                        while locked balance is allocated to specific providers.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-baseline gap-1">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-purple-600"></div>
                    <span className="text-sm text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <>
                    <span className={`text-xl font-semibold ${isLowBalance ? 'text-yellow-700' : 'text-gray-900'}`}>
                      {formatNumber(totalBalance)}
                    </span>
                    <span className="text-sm text-gray-500">0G</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {onAddFunds && (
              <button
                onClick={onAddFunds}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isLowBalance
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                <Plus className="w-4 h-4" />
                Add Funds
              </button>
            )}
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Details
              </button>
            )}
          </div>
        </div>

        {/* Low Balance Warning */}
        {isLowBalance && !isLoading && (
          <div className="mt-3 flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 rounded-md px-3 py-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Low balance. Add funds to continue using AI services.</span>
          </div>
        )}
      </div>

      {/* Expandable Breakdown */}
      {hasBreakdown && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span>Balance Breakdown</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isExpanded && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-3">
              {/* Available Balance */}
              {availableBalance !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">Available</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">
                            Balance available for immediate use or transfer to providers.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-sm font-medium text-green-700">
                    {formatNumber(availableBalance)} 0G
                  </span>
                </div>
              )}

              {/* Locked Balance */}
              {lockedBalance !== undefined && parseFloat(String(lockedBalance)) > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-gray-600">Locked (Providers)</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">
                            Balance allocated to AI providers. Can be retrieved after lock period.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-sm font-medium text-orange-700">
                    {formatNumber(lockedBalance)} 0G
                  </span>
                </div>
              )}

              {/* Provider-specific Balance */}
              {showProviderBalance && providerBalance !== undefined && providerBalance !== null && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span className="text-sm text-gray-600">
                        {providerName ? `${providerName}` : 'Current Provider'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-purple-700">
                      {formatNumber(providerBalance)} 0G
                    </span>
                  </div>
                </div>
              )}

              {/* View Full Details Link */}
              {onViewDetails && (
                <button
                  onClick={onViewDetails}
                  className="w-full mt-2 text-xs text-purple-600 hover:text-purple-700 hover:underline text-center"
                >
                  View full account details
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Mini version for inline use
export function BalanceWidgetMini({
  balance,
  isLoading,
  onAddFunds,
  variant = 'default',
}: {
  balance: number | string
  isLoading?: boolean
  onAddFunds?: () => void
  variant?: 'default' | 'warning' | 'danger'
}) {
  const variantStyles = {
    default: 'bg-gray-50 border-gray-200 text-gray-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    danger: 'bg-red-50 border-red-200 text-red-700',
  }

  const buttonStyles = {
    default: 'bg-purple-500 hover:bg-purple-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600',
    danger: 'bg-red-500 hover:bg-red-600',
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border ${variantStyles[variant]}`}>
        <Wallet className="w-3.5 h-3.5" />
        <span className="font-medium">
          {isLoading ? '...' : formatNumber(balance)} 0G
        </span>
      </div>
      {onAddFunds && (
        <button
          onClick={onAddFunds}
          className={`p-1.5 rounded-md text-white transition-colors ${buttonStyles[variant]}`}
          title="Add Funds"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
