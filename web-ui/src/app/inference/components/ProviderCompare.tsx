'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { X, Check, Minus, ShieldCheck, ShieldAlert, TrendingDown, MessageCircle, Code } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Provider } from '@/shared/types/broker'

interface ProviderCompareProps {
    isOpen: boolean
    onClose: () => void
    providers: Provider[]
    selectedProviders: string[] // Provider addresses
    onToggleProvider: (address: string) => void
    onSelectProvider: (provider: Provider) => void
    officialAddresses: string[]
}

export function ProviderCompare({
    isOpen,
    onClose,
    providers,
    selectedProviders,
    onToggleProvider,
    onSelectProvider,
    officialAddresses,
}: ProviderCompareProps) {
    const compareProviders = useMemo(() => {
        return providers.filter(p => selectedProviders.includes(p.address))
    }, [providers, selectedProviders])

    const cheapestInputPrice = useMemo(() => {
        if (compareProviders.length === 0) return null
        const prices = compareProviders.map(p => p.inputPrice).filter((p): p is number => p !== undefined)
        return prices.length > 0 ? Math.min(...prices) : null
    }, [compareProviders])

    const cheapestOutputPrice = useMemo(() => {
        if (compareProviders.length === 0) return null
        const prices = compareProviders.map(p => p.outputPrice).filter((p): p is number => p !== undefined)
        return prices.length > 0 ? Math.min(...prices) : null
    }, [compareProviders])

    const handleUseProvider = (provider: Provider) => {
        onSelectProvider(provider)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Compare Providers
                        <Badge variant="outline" className="ml-2">
                            {compareProviders.length} selected
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Compare pricing, verification, and features of selected providers side by side.
                    </DialogDescription>
                </DialogHeader>

                {compareProviders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>No providers selected for comparison.</p>
                        <p className="text-sm mt-2">Click the compare checkbox on provider cards to add them.</p>
                    </div>
                ) : (
                    <div className="mt-4">
                        {/* Comparison Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-medium text-gray-500 w-40">Attribute</th>
                                        {compareProviders.map((provider) => (
                                            <th key={provider.address} className="text-center py-3 px-4">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="font-semibold text-gray-900">{provider.name}</span>
                                                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                                        {officialAddresses.includes(provider.address) && (
                                                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-0 px-1.5 py-0.5 text-xs">
                                                                0G
                                                            </Badge>
                                                        )}
                                                        {provider.teeSignerAcknowledged ? (
                                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0 px-1.5 py-0.5 text-xs">
                                                                Verified
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0 px-1.5 py-0.5 text-xs">
                                                                Unverified
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => onToggleProvider(provider.address)}
                                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                        title="Remove from comparison"
                                                    >
                                                        <X className="h-4 w-4 text-gray-400" />
                                                    </button>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Input Price */}
                                    <tr className="border-b border-gray-100">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-600">Input Price</td>
                                        {compareProviders.map((provider) => (
                                            <td key={provider.address} className="text-center py-3 px-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className={cn(
                                                        "font-semibold",
                                                        provider.inputPrice === cheapestInputPrice ? "text-emerald-600" : "text-gray-900"
                                                    )}>
                                                        {provider.inputPrice?.toFixed(4) ?? '-'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">0G/1M</span>
                                                    {provider.inputPrice === cheapestInputPrice && (
                                                        <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
                                                    )}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Output Price */}
                                    <tr className="border-b border-gray-100">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-600">Output Price</td>
                                        {compareProviders.map((provider) => (
                                            <td key={provider.address} className="text-center py-3 px-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className={cn(
                                                        "font-semibold",
                                                        provider.outputPrice === cheapestOutputPrice ? "text-emerald-600" : "text-gray-900"
                                                    )}>
                                                        {provider.outputPrice?.toFixed(4) ?? '-'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">0G/1M</span>
                                                    {provider.outputPrice === cheapestOutputPrice && (
                                                        <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
                                                    )}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Est. Cost per Message */}
                                    <tr className="border-b border-gray-100">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-600">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="flex items-center gap-1 cursor-help">
                                                        Est. per Message
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Estimated cost for a typical message (~500 tokens in, ~500 tokens out)</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </td>
                                        {compareProviders.map((provider) => {
                                            const estCost = ((provider.inputPrice ?? 0) * 0.0005) + ((provider.outputPrice ?? 0) * 0.0005)
                                            return (
                                                <td key={provider.address} className="text-center py-3 px-4">
                                                    <span className="font-semibold text-gray-900">
                                                        ~{estCost.toFixed(6)} 0G
                                                    </span>
                                                </td>
                                            )
                                        })}
                                    </tr>

                                    {/* Verification */}
                                    <tr className="border-b border-gray-100">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-600">TEE Verification</td>
                                        {compareProviders.map((provider) => (
                                            <td key={provider.address} className="text-center py-3 px-4">
                                                {provider.teeSignerAcknowledged ? (
                                                    <div className="flex items-center justify-center gap-1.5 text-green-600">
                                                        <ShieldCheck className="h-4 w-4" />
                                                        <span className="text-sm font-medium">Verified</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1.5 text-red-600">
                                                        <ShieldAlert className="h-4 w-4" />
                                                        <span className="text-sm font-medium">Unverified</span>
                                                    </div>
                                                )}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Verifiability */}
                                    <tr className="border-b border-gray-100">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-600">Verifiability</td>
                                        {compareProviders.map((provider) => (
                                            <td key={provider.address} className="text-center py-3 px-4">
                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0">
                                                    {provider.verifiability}
                                                </Badge>
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Service Type */}
                                    <tr className="border-b border-gray-100">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-600">Service Type</td>
                                        {compareProviders.map((provider) => (
                                            <td key={provider.address} className="text-center py-3 px-4">
                                                <span className="text-sm font-medium text-gray-900 capitalize">
                                                    {provider.serviceType}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Chat Support */}
                                    <tr className="border-b border-gray-100">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-600">Chat Support</td>
                                        {compareProviders.map((provider) => (
                                            <td key={provider.address} className="text-center py-3 px-4">
                                                {provider.serviceType === 'chatbot' ? (
                                                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                                                ) : (
                                                    <Minus className="h-5 w-5 text-gray-300 mx-auto" />
                                                )}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Address */}
                                    <tr className="border-b border-gray-100">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-600">Address</td>
                                        {compareProviders.map((provider) => (
                                            <td key={provider.address} className="text-center py-3 px-4">
                                                <code className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
                                                    {provider.address.slice(0, 8)}...{provider.address.slice(-6)}
                                                </code>
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Action */}
                                    <tr>
                                        <td className="py-4 px-4 text-sm font-medium text-gray-600">Action</td>
                                        {compareProviders.map((provider) => (
                                            <td key={provider.address} className="text-center py-4 px-4">
                                                <div className="flex flex-col gap-2">
                                                    {provider.serviceType === 'chatbot' && (
                                                        <Button
                                                            size="sm"
                                                            className="w-full bg-purple-600 hover:bg-purple-700"
                                                            onClick={() => handleUseProvider(provider)}
                                                            disabled={!provider.teeSignerAcknowledged}
                                                        >
                                                            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                                                            Use for Chat
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={() => handleUseProvider(provider)}
                                                        disabled={!provider.teeSignerAcknowledged}
                                                    >
                                                        <Code className="h-3.5 w-3.5 mr-1.5" />
                                                        Use for Build
                                                    </Button>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Legend */}
                        <div className="mt-6 flex items-center gap-4 text-xs text-gray-500 border-t pt-4">
                            <div className="flex items-center gap-1">
                                <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Lowest price in comparison</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                                <span>TEE verified provider</span>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

// Hook to manage comparison state
export function useProviderCompare() {
    const [isCompareOpen, setIsCompareOpen] = useState(false)
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])

    const toggleProviderForCompare = (address: string) => {
        setSelectedForCompare(prev => {
            if (prev.includes(address)) {
                return prev.filter(a => a !== address)
            }
            // Limit to 3 providers
            if (prev.length >= 3) {
                return [...prev.slice(1), address]
            }
            return [...prev, address]
        })
    }

    const openCompare = () => {
        if (selectedForCompare.length >= 2) {
            setIsCompareOpen(true)
        }
    }

    const closeCompare = () => {
        setIsCompareOpen(false)
    }

    const clearCompare = () => {
        setSelectedForCompare([])
        setIsCompareOpen(false)
    }

    return {
        isCompareOpen,
        selectedForCompare,
        toggleProviderForCompare,
        openCompare,
        closeCompare,
        clearCompare,
    }
}
