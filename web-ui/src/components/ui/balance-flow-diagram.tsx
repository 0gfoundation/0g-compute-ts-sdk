'use client'

import * as React from 'react'
import { ArrowDown, ArrowUp, Wallet, Coins, Users, HelpCircle } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface BalanceFlowDiagramProps {
    availableBalance?: string
    lockedBalance?: string
    className?: string
    compact?: boolean
}

export function BalanceFlowDiagram({
    availableBalance,
    lockedBalance,
    className,
    compact = false,
}: BalanceFlowDiagramProps) {
    if (compact) {
        return (
            <div className={cn("flex items-center justify-center gap-2 text-xs text-gray-500", className)}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help">
                                <Wallet className="h-3 w-3" />
                                <span>Wallet</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Your connected wallet</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <ArrowDown className="h-3 w-3 text-green-500" />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help">
                                <Coins className="h-3 w-3" />
                                <span>Available</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Funds ready to use or withdraw</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <ArrowDown className="h-3 w-3 text-green-500" />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help">
                                <Users className="h-3 w-3" />
                                <span>Providers</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Funds allocated to AI providers</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        )
    }

    return (
        <div className={cn("bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100", className)}>
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold text-gray-800">How Your Funds Flow</h3>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p>Understanding the fund flow helps you manage your account effectively. Funds move from your wallet through the available balance to provider accounts.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Wallet */}
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-white border-2 border-purple-200 flex items-center justify-center shadow-sm">
                        <Wallet className="h-7 w-7 text-purple-600" />
                    </div>
                    <span className="mt-2 text-xs font-medium text-gray-700">Your Wallet</span>
                    <span className="text-xs text-gray-500">External</span>
                </div>

                {/* Arrow: Wallet to Available */}
                <div className="flex flex-col items-center">
                    <div className="hidden md:flex items-center">
                        <div className="w-12 h-0.5 bg-gradient-to-r from-purple-300 to-green-300"></div>
                        <ArrowDown className="h-5 w-5 text-green-500 rotate-[-90deg]" />
                    </div>
                    <div className="md:hidden">
                        <ArrowDown className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="text-xs text-green-600 font-medium mt-1">Deposit</span>
                </div>

                {/* Available Balance */}
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-white border-2 border-green-200 flex flex-col items-center justify-center shadow-sm">
                        <Coins className="h-6 w-6 text-green-600" />
                        {availableBalance && (
                            <span className="text-xs font-semibold text-green-700 mt-1">{availableBalance}</span>
                        )}
                    </div>
                    <span className="mt-2 text-xs font-medium text-gray-700">Available Balance</span>
                    <span className="text-xs text-gray-500">Ready to use</span>
                </div>

                {/* Arrow: Available to Providers */}
                <div className="flex flex-col items-center">
                    <div className="hidden md:flex items-center">
                        <div className="w-12 h-0.5 bg-gradient-to-r from-green-300 to-blue-300"></div>
                        <ArrowDown className="h-5 w-5 text-blue-500 rotate-[-90deg]" />
                    </div>
                    <div className="md:hidden">
                        <ArrowDown className="h-5 w-5 text-blue-500" />
                    </div>
                    <span className="text-xs text-blue-600 font-medium mt-1">Auto-fund</span>
                </div>

                {/* Provider Accounts */}
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-white border-2 border-blue-200 flex flex-col items-center justify-center shadow-sm">
                        <Users className="h-6 w-6 text-blue-600" />
                        {lockedBalance && (
                            <span className="text-xs font-semibold text-blue-700 mt-1">{lockedBalance}</span>
                        )}
                    </div>
                    <span className="mt-2 text-xs font-medium text-gray-700">Provider Accounts</span>
                    <span className="text-xs text-gray-500">Pays for AI services</span>
                </div>
            </div>

            {/* Return flow */}
            <div className="mt-6 pt-4 border-t border-purple-100">
                <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-2 text-gray-600">
                        <ArrowUp className="h-4 w-4 text-amber-500" />
                        <span><strong>Retrieve:</strong> Move unused provider funds back to Available Balance</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-2 text-gray-600">
                        <ArrowUp className="h-4 w-4 text-purple-500" />
                        <span><strong>Withdraw:</strong> Move Available Balance to your wallet</span>
                    </div>
                </div>
            </div>

            {/* Quick tips */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white/60 rounded-lg p-3 text-xs">
                    <div className="font-medium text-purple-700 mb-1">Deposit</div>
                    <p className="text-gray-600">Transfer 0G tokens from your wallet to your account</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-xs">
                    <div className="font-medium text-blue-700 mb-1">Auto-funding</div>
                    <p className="text-gray-600">Funds automatically move to providers when you use their services</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-xs">
                    <div className="font-medium text-amber-700 mb-1">Retrieve</div>
                    <p className="text-gray-600">Request unused funds back (may have a lock period)</p>
                </div>
            </div>
        </div>
    )
}
