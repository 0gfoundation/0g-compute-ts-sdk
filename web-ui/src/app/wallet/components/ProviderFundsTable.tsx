'use client'

import { useState, useEffect } from 'react'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { ChevronUp, RefreshCw, Loader2, HelpCircle, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Live countdown component
function CountdownTimer({ remainSeconds, formatTime }: { remainSeconds: number; formatTime: (s: number) => string }) {
    const [timeLeft, setTimeLeft] = useState(remainSeconds)

    useEffect(() => {
        setTimeLeft(remainSeconds)
    }, [remainSeconds])

    useEffect(() => {
        if (timeLeft <= 0) return

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft])

    const isReady = timeLeft <= 0
    const progress = remainSeconds > 0 ? ((remainSeconds - timeLeft) / remainSeconds) * 100 : 100

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                {isReady ? (
                    <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Ready to retrieve</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-amber-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{formatTime(timeLeft)}</span>
                    </div>
                )}
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-1000 ${
                        isReady ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    )
}

interface ProviderAccount {
    provider: string
    balance: string
    requestedReturn: string
}

interface RefundDetail {
    amount: bigint
    remainTime: bigint
}

interface ProviderFundsTableProps {
    title: string
    providers: ProviderAccount[]
    emptyMessage: string
    onRetrieve: () => void
    isRetrieving: boolean
    expandedRefunds: { [key: string]: boolean }
    onToggleRefund: (provider: string) => void
    refundDetails: { [key: string]: RefundDetail[] }
    loadingRefunds: { [key: string]: boolean }
    onRefreshRefund: (provider: string) => void
    type: 'inference' | 'fine-tuning'
    formatNumber: (value: string | number) => string
    formatTime: (seconds: number) => string
}

export function ProviderFundsTable({
    title,
    providers,
    emptyMessage,
    onRetrieve,
    isRetrieving,
    expandedRefunds,
    onToggleRefund,
    refundDetails,
    loadingRefunds,
    onRefreshRefund,
    type,
    formatNumber,
    formatTime,
}: ProviderFundsTableProps) {
    const getRefundKey = (provider: string) => `${type}-${provider}`

    return (
        <TooltipProvider>
            <div>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h5 className="text-sm font-medium text-gray-700">{title}</h5>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="p-0.5 rounded-full hover:bg-gray-100 transition-colors">
                                    <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs p-3">
                                <p className="font-semibold mb-2">What are lock periods?</p>
                                <p className="text-xs text-gray-300 mb-2">
                                    When you request to retrieve funds from a provider, there&apos;s a waiting period
                                    (lock period) before the funds become available. This is a security measure
                                    to ensure service integrity.
                                </p>
                                <p className="text-xs text-gray-400">
                                    Typical lock period: ~1-24 hours depending on the provider.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRetrieve}
                        disabled={isRetrieving}
                        className="text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                    >
                        {isRetrieving && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                        Retrieve
                    </Button>
                </div>

            {providers.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {providers.map((provider, index) => {
                        const refundKey = getRefundKey(provider.provider)
                        const isExpanded = expandedRefunds[refundKey]
                        const hasPendingRetrieval = parseFloat(provider.requestedReturn) > 0

                        return (
                            <Collapsible
                                key={index}
                                open={isExpanded}
                                onOpenChange={() => onToggleRefund(provider.provider)}
                            >
                                <Card className="bg-white">
                                    <CardContent className="p-4">
                                        {/* Provider Address - always full width on mobile */}
                                        <div className="mb-3 md:mb-0">
                                            <div className="text-xs font-medium text-gray-500 mb-1">Provider Address</div>
                                            <div className="text-sm font-medium text-gray-900 font-mono break-all">
                                                {provider.provider}
                                            </div>
                                        </div>
                                        {/* Fund info - side by side on mobile, grid on desktop */}
                                        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs font-medium text-gray-500 mb-1">Current Fund</div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatNumber(provider.balance)} 0G
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-medium text-gray-500 mb-1">Pending Retrieval</div>
                                                <CollapsibleTrigger asChild>
                                                    <button
                                                        className={cn(
                                                            "text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors flex items-center",
                                                            hasPendingRetrieval && "cursor-pointer"
                                                        )}
                                                        disabled={!hasPendingRetrieval}
                                                    >
                                                        {formatNumber(provider.requestedReturn)} 0G
                                                        {hasPendingRetrieval && (
                                                            <ChevronUp className={cn(
                                                                "ml-1 h-3 w-3 transition-transform",
                                                                !isExpanded && "rotate-180"
                                                            )} />
                                                        )}
                                                    </button>
                                                </CollapsibleTrigger>
                                            </div>
                                        </div>

                                        {/* Retrieval Details - Full width */}
                                        <CollapsibleContent>
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-xs font-medium text-gray-700">Retrieval Details</div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onRefreshRefund(provider.provider)
                                                        }}
                                                        disabled={loadingRefunds[refundKey]}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <RefreshCw className={cn(
                                                            "h-3 w-3",
                                                            loadingRefunds[refundKey] && "animate-spin"
                                                        )} />
                                                    </Button>
                                                </div>

                                                {loadingRefunds[refundKey] ? (
                                                    <div className="flex items-center text-gray-500">
                                                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                                        <span className="text-xs">Loading...</span>
                                                    </div>
                                                ) : refundDetails[refundKey]?.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {refundDetails[refundKey].map((refund, refundIndex) => {
                                                            const remainSeconds = Number(refund.remainTime)
                                                            const isReady = remainSeconds <= 0
                                                            return (
                                                                <div
                                                                    key={refundIndex}
                                                                    className={`rounded-lg p-3 border ${
                                                                        isReady
                                                                            ? 'bg-green-50 border-green-200'
                                                                            : 'bg-amber-50 border-amber-200'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div>
                                                                            <div className="text-xs font-medium text-gray-500 mb-0.5">Amount</div>
                                                                            <div className="text-sm font-semibold text-gray-900">
                                                                                {formatNumber((Number(refund.amount) / 1e18).toString())} 0G
                                                                            </div>
                                                                        </div>
                                                                        {isReady && (
                                                                            <div className="px-2 py-1 bg-green-100 rounded-full">
                                                                                <span className="text-xs font-medium text-green-700">Ready</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs font-medium text-gray-500 mb-1">
                                                                            {isReady ? 'Status' : 'Time Remaining'}
                                                                        </div>
                                                                        <CountdownTimer
                                                                            remainSeconds={remainSeconds}
                                                                            formatTime={formatTime}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-gray-500 italic">No pending refunds</div>
                                                )}
                                            </div>
                                        </CollapsibleContent>
                                    </CardContent>
                                </Card>
                            </Collapsible>
                        )
                    })}
                </div>
            ) : (
                <div className="text-sm text-gray-500 italic bg-white rounded-lg p-4 border border-gray-200">
                    {emptyMessage}
                </div>
            )}
            </div>
        </TooltipProvider>
    )
}
