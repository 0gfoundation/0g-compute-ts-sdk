'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { ArrowDown, ArrowUp, ChevronDown, Info, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BalanceCard } from './BalanceCard'
import { ProviderFundsTable } from './ProviderFundsTable'
import { BalanceFlowDiagram } from '@/components/ui/balance-flow-diagram'

interface ProviderAccount {
    provider: string
    balance: string
    requestedReturn: string
}

interface RefundDetail {
    amount: bigint
    remainTime: bigint
}

interface LedgerInfo {
    totalBalance: string
    availableBalance: string
    locked: string
    inferences: ProviderAccount[]
    fineTunings: ProviderAccount[]
}

interface FundDistributionProps {
    ledgerInfo: LedgerInfo
    onWithdraw: () => void
    onRetrieveAll: () => void
    onRetrieveInference: () => void
    onRetrieveFineTuning: () => void
    isRetrievingAll: boolean
    isRetrievingInference: boolean
    isRetrievingFineTuning: boolean
    expandedRefunds: { [key: string]: boolean }
    onToggleRefund: (provider: string, type: 'inference' | 'fine-tuning') => void
    refundDetails: { [key: string]: RefundDetail[] }
    loadingRefunds: { [key: string]: boolean }
    onRefreshRefund: (provider: string, type: 'inference' | 'fine-tuning') => void
    showSuccessAlert: { message: string; show: boolean }
    error: string | null
    formatNumber: (value: string | number) => string
    formatTime: (seconds: number) => string
}

export function FundDistribution({
    ledgerInfo,
    onWithdraw,
    onRetrieveAll,
    onRetrieveInference,
    onRetrieveFineTuning,
    isRetrievingAll,
    isRetrievingInference,
    isRetrievingFineTuning,
    expandedRefunds,
    onToggleRefund,
    refundDetails,
    loadingRefunds,
    onRefreshRefund,
    showSuccessAlert,
    error,
    formatNumber,
    formatTime,
}: FundDistributionProps) {
    const [isLockedExpanded, setIsLockedExpanded] = React.useState(false)

    return (
        <div className="space-y-6">
            {/* Visual Balance Flow Diagram */}
            <BalanceFlowDiagram
                availableBalance={`${formatNumber(ledgerInfo.availableBalance)} 0G`}
                lockedBalance={`${formatNumber(ledgerInfo.locked)} 0G`}
            />

            {/* Success Alert */}
            {showSuccessAlert.show && (
                <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-sm text-green-800 font-medium">Success</AlertTitle>
                    <AlertDescription
                        className="text-sm text-green-700 mt-1"
                        dangerouslySetInnerHTML={{ __html: showSuccessAlert.message }}
                    />
                </Alert>
            )}

            {/* Total Balance Container */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="flex items-center mb-4">
                    <h2 className="text-sm font-medium text-gray-600 mr-2">Total Balance:</h2>
                    <div className="text-sm font-medium text-gray-600">
                        {formatNumber(ledgerInfo.totalBalance)} <span className="text-xs text-gray-500 font-normal">0G</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Available Balance */}
                    <BalanceCard
                        title="Available Balance"
                        amount={formatNumber(ledgerInfo.availableBalance)}
                        description="Available for provider funding and withdrawal"
                        action={{
                            label: 'Withdraw',
                            onClick: onWithdraw,
                            disabled: parseFloat(ledgerInfo.availableBalance) === 0,
                        }}
                    />

                    {/* Fund Flow Visualization */}
                    <div className="flex items-center justify-center gap-6 py-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center text-green-600 cursor-help">
                                        <ArrowDown className="w-3 h-3 mr-1" />
                                        <span className="text-xs">Auto-funds on usage</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-64">
                                    <p className="font-medium mb-1">Auto-funding Process</p>
                                    <p className="text-xs text-gray-300">
                                        For each AI service provider you use, the system creates a separate sub-account under your control that holds funds specifically allocated for paying that provider&apos;s services.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        onClick={onRetrieveAll}
                                        disabled={isRetrievingAll}
                                        className="bg-purple-600 hover:bg-purple-700 text-xs px-2 py-1 h-auto"
                                    >
                                        <ArrowUp className="w-3 h-3 mr-1" />
                                        {isRetrievingAll && <Loader2 className="h-2 w-2 animate-spin mr-1" />}
                                        Retrieve
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-64">
                                    <p className="font-medium mb-1">Retrieve Unused Funds</p>
                                    <p className="text-xs text-gray-300">
                                        Transfer unused funds from provider sub-accounts back to your Available Balance for withdrawal or other uses.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* Provider Funds with integrated details */}
                    <Card className="bg-gray-50">
                        <CardContent className="p-4">
                            <Collapsible open={isLockedExpanded} onOpenChange={setIsLockedExpanded}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">
                                            Distributed Provider Funds
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Funds currently distributed to service providers
                                        </p>
                                    </div>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600 hover:bg-purple-50">
                                            <span className="mr-2 text-sm font-medium">
                                                {isLockedExpanded ? 'Hide Details' : 'View Details'}
                                            </span>
                                            <ChevronDown className={cn("w-4 h-4 transition-transform", isLockedExpanded && "rotate-180")} />
                                        </Button>
                                    </CollapsibleTrigger>
                                </div>
                                <div className="text-xl font-semibold text-gray-900">
                                    {formatNumber(ledgerInfo.locked)} <span className="text-sm text-gray-500 font-normal">0G</span>
                                </div>

                                <CollapsibleContent>
                                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-6">
                                        {/* Inference Providers */}
                                        <ProviderFundsTable
                                            title="Inference Providers"
                                            providers={ledgerInfo.inferences}
                                            emptyMessage="No inference services have been used yet"
                                            onRetrieve={onRetrieveInference}
                                            isRetrieving={isRetrievingInference}
                                            expandedRefunds={expandedRefunds}
                                            onToggleRefund={(provider) => onToggleRefund(provider, 'inference')}
                                            refundDetails={refundDetails}
                                            loadingRefunds={loadingRefunds}
                                            onRefreshRefund={(provider) => onRefreshRefund(provider, 'inference')}
                                            type="inference"
                                            formatNumber={formatNumber}
                                            formatTime={formatTime}
                                        />

                                        {/* Fine-tuning Providers */}
                                        <ProviderFundsTable
                                            title="Fine-tuning Providers"
                                            providers={ledgerInfo.fineTunings}
                                            emptyMessage="Fine-tuning services details are temporarily unavailable. Support coming soon."
                                            onRetrieve={onRetrieveFineTuning}
                                            isRetrieving={isRetrievingFineTuning}
                                            expandedRefunds={expandedRefunds}
                                            onToggleRefund={(provider) => onToggleRefund(provider, 'fine-tuning')}
                                            refundDetails={refundDetails}
                                            loadingRefunds={loadingRefunds}
                                            onRefreshRefund={(provider) => onRefreshRefund(provider, 'fine-tuning')}
                                            type="fine-tuning"
                                            formatNumber={formatNumber}
                                            formatTime={formatTime}
                                        />
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    )
}
