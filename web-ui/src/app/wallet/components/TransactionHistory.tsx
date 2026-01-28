'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    ArrowDownCircle,
    ArrowUpCircle,
    ArrowRightCircle,
    Clock,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Filter,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export type TransactionType = 'deposit' | 'transfer' | 'retrieve' | 'usage'

export interface Transaction {
    id: string
    type: TransactionType
    amount: string
    timestamp: number
    status: 'pending' | 'completed' | 'failed'
    providerAddress?: string
    providerName?: string
    txHash?: string
    description?: string
}

interface TransactionHistoryProps {
    transactions: Transaction[]
    isLoading?: boolean
    onRefresh?: () => void
    formatNumber: (value: string | number) => string
    explorerBaseUrl?: string
}

type FilterType = 'all' | TransactionType
type TimeGroup = 'Today' | 'Yesterday' | 'Last 7 Days' | 'Last 30 Days' | 'Older'

const TIME_GROUP_ORDER: TimeGroup[] = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Older']

function getTimeGroup(timestamp: number): TimeGroup {
    const now = new Date()
    const date = new Date(timestamp)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    if (date >= today) return 'Today'
    if (date >= yesterday) return 'Yesterday'
    if (date >= lastWeek) return 'Last 7 Days'
    if (date >= lastMonth) return 'Last 30 Days'
    return 'Older'
}

function TransactionIcon({ type }: { type: TransactionType }) {
    switch (type) {
        case 'deposit':
            return <ArrowDownCircle className="h-5 w-5 text-green-600" />
        case 'transfer':
            return <ArrowRightCircle className="h-5 w-5 text-blue-600" />
        case 'retrieve':
            return <ArrowUpCircle className="h-5 w-5 text-orange-600" />
        case 'usage':
            return <Clock className="h-5 w-5 text-purple-600" />
        default:
            return null
    }
}

function TransactionBadge({ type }: { type: TransactionType }) {
    const variants: Record<TransactionType, { bg: string; text: string; label: string }> = {
        deposit: { bg: 'bg-green-100', text: 'text-green-800', label: 'Deposit' },
        transfer: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Transfer' },
        retrieve: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Retrieve' },
        usage: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Usage' },
    }

    const variant = variants[type]

    return (
        <Badge className={cn(variant.bg, variant.text, 'hover:' + variant.bg, 'border-0 px-2 py-0.5 text-xs')}>
            {variant.label}
        </Badge>
    )
}

function StatusBadge({ status }: { status: Transaction['status'] }) {
    switch (status) {
        case 'completed':
            return (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0 px-1.5 py-0.5 text-xs">
                    Completed
                </Badge>
            )
        case 'pending':
            return (
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-0 px-1.5 py-0.5 text-xs">
                    Pending
                </Badge>
            )
        case 'failed':
            return (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0 px-1.5 py-0.5 text-xs">
                    Failed
                </Badge>
            )
    }
}

function TransactionItem({
    transaction,
    formatNumber,
    explorerBaseUrl,
}: {
    transaction: Transaction
    formatNumber: (value: string | number) => string
    explorerBaseUrl?: string
}) {
    const isPositive = transaction.type === 'deposit' || transaction.type === 'retrieve'
    const formattedDate = new Date(transaction.timestamp).toLocaleString()

    return (
        <div className="flex items-start gap-3 py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
                <TransactionIcon type={transaction.type} />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <TransactionBadge type={transaction.type} />
                    <StatusBadge status={transaction.status} />
                </div>

                <div className="text-sm text-gray-900 mb-1">
                    {transaction.description || getDefaultDescription(transaction)}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formattedDate}</span>
                    {transaction.providerName && (
                        <>
                            <span>•</span>
                            <span>Provider: {transaction.providerName}</span>
                        </>
                    )}
                    {transaction.txHash && explorerBaseUrl && (
                        <>
                            <span>•</span>
                            <a
                                href={`${explorerBaseUrl}/tx/${transaction.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                            >
                                <span>View Tx</span>
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* Amount */}
            <div className={cn(
                "flex-shrink-0 text-right font-medium",
                isPositive ? "text-green-600" : "text-gray-900"
            )}>
                <span>{isPositive ? '+' : '-'}{formatNumber(transaction.amount)} 0G</span>
            </div>
        </div>
    )
}

function getDefaultDescription(transaction: Transaction): string {
    switch (transaction.type) {
        case 'deposit':
            return 'Deposited funds to ledger'
        case 'transfer':
            return transaction.providerName
                ? `Transferred to ${transaction.providerName}`
                : 'Transferred to provider'
        case 'retrieve':
            return transaction.providerName
                ? `Retrieved from ${transaction.providerName}`
                : 'Retrieved from provider'
        case 'usage':
            return transaction.providerName
                ? `Inference with ${transaction.providerName}`
                : 'Inference usage'
        default:
            return 'Transaction'
    }
}

export function TransactionHistory({
    transactions,
    isLoading = false,
    onRefresh,
    formatNumber,
    explorerBaseUrl,
}: TransactionHistoryProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [filter, setFilter] = useState<FilterType>('all')

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        if (filter === 'all') return transactions
        return transactions.filter(t => t.type === filter)
    }, [transactions, filter])

    // Group transactions by time
    const groupedTransactions = useMemo(() => {
        const groups: Record<TimeGroup, Transaction[]> = {
            'Today': [],
            'Yesterday': [],
            'Last 7 Days': [],
            'Last 30 Days': [],
            'Older': [],
        }

        filteredTransactions.forEach(tx => {
            const group = getTimeGroup(tx.timestamp)
            groups[group].push(tx)
        })

        // Sort within each group by timestamp (newest first)
        Object.keys(groups).forEach(key => {
            groups[key as TimeGroup].sort((a, b) => b.timestamp - a.timestamp)
        })

        return groups
    }, [filteredTransactions])

    const filterOptions: { value: FilterType; label: string }[] = [
        { value: 'all', label: 'All Transactions' },
        { value: 'deposit', label: 'Deposits' },
        { value: 'transfer', label: 'Transfers' },
        { value: 'retrieve', label: 'Retrievals' },
        { value: 'usage', label: 'Usage' },
    ]

    return (
        <TooltipProvider>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center gap-2 hover:text-purple-600 transition-colors"
                        >
                            <CardTitle className="text-base">Transaction History</CardTitle>
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </button>

                        <div className="flex items-center gap-2">
                            {/* Filter Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8">
                                        <Filter className="h-3.5 w-3.5 mr-1.5" />
                                        {filterOptions.find(f => f.value === filter)?.label}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {filterOptions.map(option => (
                                        <DropdownMenuItem
                                            key={option.value}
                                            onClick={() => setFilter(option.value)}
                                            className={cn(
                                                filter === option.value && 'bg-purple-50 text-purple-600'
                                            )}
                                        >
                                            {option.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Refresh Button */}
                            {onRefresh && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={onRefresh}
                                            disabled={isLoading}
                                        >
                                            <RefreshCw className={cn(
                                                "h-4 w-4",
                                                isLoading && "animate-spin"
                                            )} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Refresh transactions</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </CardHeader>

                {isExpanded && (
                    <CardContent className="pt-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8 text-gray-500">
                                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                                Loading transactions...
                            </div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No transactions found</p>
                                {filter !== 'all' && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => setFilter('all')}
                                        className="mt-2"
                                    >
                                        Show all transactions
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {TIME_GROUP_ORDER.map(group => {
                                    const groupTransactions = groupedTransactions[group]
                                    if (groupTransactions.length === 0) return null

                                    return (
                                        <div key={group}>
                                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-4">
                                                {group}
                                            </div>
                                            <div className="space-y-1">
                                                {groupTransactions.map(tx => (
                                                    <TransactionItem
                                                        key={tx.id}
                                                        transaction={tx}
                                                        formatNumber={formatNumber}
                                                        explorerBaseUrl={explorerBaseUrl}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>
        </TooltipProvider>
    )
}

// Hook to manage transaction history (can be expanded to fetch from blockchain/backend)
export function useTransactionHistory() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Add a new transaction
    const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
        const newTx: Transaction = {
            ...transaction,
            id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
        }
        setTransactions(prev => [newTx, ...prev])

        // Persist to localStorage
        try {
            const stored = localStorage.getItem('transactionHistory')
            const existing = stored ? JSON.parse(stored) : []
            localStorage.setItem('transactionHistory', JSON.stringify([newTx, ...existing].slice(0, 100)))
        } catch {
            // Silent fail for localStorage
        }
    }

    // Load transactions from localStorage
    const loadTransactions = () => {
        setIsLoading(true)
        try {
            const stored = localStorage.getItem('transactionHistory')
            if (stored) {
                setTransactions(JSON.parse(stored))
            }
        } catch {
            // Silent fail
        } finally {
            setIsLoading(false)
        }
    }

    // Refresh transactions
    const refreshTransactions = () => {
        loadTransactions()
    }

    // Update transaction status
    const updateTransactionStatus = (txId: string, status: Transaction['status'], txHash?: string) => {
        setTransactions(prev => prev.map(tx => {
            if (tx.id === txId) {
                return { ...tx, status, ...(txHash ? { txHash } : {}) }
            }
            return tx
        }))

        // Update in localStorage
        try {
            const stored = localStorage.getItem('transactionHistory')
            if (stored) {
                const existing = JSON.parse(stored)
                const updated = existing.map((tx: Transaction) => {
                    if (tx.id === txId) {
                        return { ...tx, status, ...(txHash ? { txHash } : {}) }
                    }
                    return tx
                })
                localStorage.setItem('transactionHistory', JSON.stringify(updated))
            }
        } catch {
            // Silent fail
        }
    }

    React.useEffect(() => {
        loadTransactions()
    }, [])

    return {
        transactions,
        isLoading,
        addTransaction,
        refreshTransactions,
        updateTransactionStatus,
    }
}
