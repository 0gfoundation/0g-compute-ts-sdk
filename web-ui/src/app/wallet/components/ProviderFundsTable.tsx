'use client'

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronUp, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
        <div>
            <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-700">{title}</h5>
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
                                                    <div className="space-y-2">
                                                        {refundDetails[refundKey].map((refund, refundIndex) => (
                                                            <div key={refundIndex} className="bg-gray-50 rounded p-3">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <div className="text-xs font-medium text-gray-500 mb-1">Amount</div>
                                                                        <div className="text-xs font-medium text-gray-900">
                                                                            {formatNumber((Number(refund.amount) / 1e18).toString())} 0G
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs font-medium text-gray-500 mb-1">Lock Time</div>
                                                                        <div className="text-xs font-medium text-gray-900">
                                                                            {formatTime(Number(refund.remainTime))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
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
    )
}
