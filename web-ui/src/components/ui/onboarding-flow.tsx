'use client'

import * as React from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Wallet,
    Coins,
    Users,
    MessageSquare,
    Check,
    ChevronRight,
    Sparkles,
    ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingStep {
    id: number
    title: string
    description: string
    icon: React.ReactNode
    action?: React.ReactNode
    completed: boolean
    current: boolean
}

interface OnboardingFlowProps {
    hasBalance?: boolean
    hasProvider?: boolean
    onDepositClick?: () => void
    onSelectProviderClick?: () => void
    onStartChatClick?: () => void
    className?: string
}

export function OnboardingFlow({
    hasBalance = false,
    hasProvider = false,
    onDepositClick,
    onSelectProviderClick,
    onStartChatClick,
    className,
}: OnboardingFlowProps) {
    const { isConnected } = useAccount()

    // Determine current step based on state
    const getCurrentStep = () => {
        if (!isConnected) return 1
        if (!hasBalance) return 2
        if (!hasProvider) return 3
        return 4
    }

    const currentStep = getCurrentStep()

    const steps: OnboardingStep[] = [
        {
            id: 1,
            title: 'Connect Wallet',
            description: 'Link your Web3 wallet to get started',
            icon: <Wallet className="h-5 w-5" />,
            completed: isConnected,
            current: currentStep === 1,
            action: !isConnected ? (
                <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                        <Button
                            onClick={openConnectModal}
                            variant="gradient"
                            size="sm"
                        >
                            Connect Wallet
                        </Button>
                    )}
                </ConnectButton.Custom>
            ) : null,
        },
        {
            id: 2,
            title: 'Add Funds',
            description: 'Deposit 0G tokens to your account',
            icon: <Coins className="h-5 w-5" />,
            completed: hasBalance,
            current: currentStep === 2,
            action: isConnected && !hasBalance ? (
                <Button
                    onClick={onDepositClick}
                    variant="gradient"
                    size="sm"
                >
                    Add Funds
                </Button>
            ) : null,
        },
        {
            id: 3,
            title: 'Choose Provider',
            description: 'Select an AI service provider',
            icon: <Users className="h-5 w-5" />,
            completed: hasProvider,
            current: currentStep === 3,
            action: hasBalance && !hasProvider ? (
                <Button
                    onClick={onSelectProviderClick}
                    variant="outline"
                    size="sm"
                >
                    Browse Providers
                </Button>
            ) : null,
        },
        {
            id: 4,
            title: 'Start Chatting',
            description: 'Begin using decentralized AI',
            icon: <MessageSquare className="h-5 w-5" />,
            completed: false,
            current: currentStep === 4,
            action: hasProvider ? (
                <Button
                    onClick={onStartChatClick}
                    variant="gradient"
                    size="sm"
                >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Chat
                </Button>
            ) : null,
        },
    ]

    // If user has completed onboarding, show a minimal view
    if (isConnected && hasBalance && hasProvider) {
        return (
            <Card className={cn("bg-gradient-subtle border-primary/20", className)}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <Check className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">You&apos;re all set!</h3>
                                <p className="text-sm text-muted-foreground">Ready to use decentralized AI services</p>
                            </div>
                        </div>
                        <Button
                            onClick={onStartChatClick}
                            variant="gradient"
                        >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Go to Chat
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={cn("border-border", className)}>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Get Started with 0G Compute
                </CardTitle>
                <CardDescription>
                    Complete these steps to start using decentralized AI
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={cn(
                                "flex items-start gap-4 p-4 rounded-xl transition-all duration-200",
                                step.current && "bg-secondary border border-primary/20 shadow-sm",
                                step.completed && "bg-muted/50",
                                !step.current && !step.completed && "opacity-50"
                            )}
                        >
                            {/* Step number/check */}
                            <div className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200",
                                step.completed && "bg-green-100 text-green-600",
                                step.current && !step.completed && "bg-primary text-primary-foreground shadow-glow",
                                !step.current && !step.completed && "bg-muted text-muted-foreground"
                            )}>
                                {step.completed ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <span className="text-sm font-semibold">{step.id}</span>
                                )}
                            </div>

                            {/* Step content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "transition-colors duration-200",
                                        step.current ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {step.icon}
                                    </span>
                                    <h4 className={cn(
                                        "font-medium",
                                        step.completed && "text-green-700",
                                        step.current && "text-foreground",
                                        !step.current && !step.completed && "text-muted-foreground"
                                    )}>
                                        {step.title}
                                    </h4>
                                    {step.completed && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                            Done
                                        </span>
                                    )}
                                </div>
                                <p className={cn(
                                    "text-sm mt-1",
                                    step.current ? "text-muted-foreground" : "text-muted-foreground/70"
                                )}>
                                    {step.description}
                                </p>
                            </div>

                            {/* Action button */}
                            {step.action && (
                                <div className="flex-shrink-0">
                                    {step.action}
                                </div>
                            )}

                            {/* Arrow to next step */}
                            {index < steps.length - 1 && step.completed && (
                                <ChevronRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Progress indicator */}
                <div className="mt-6 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                        <span>Progress</span>
                        <span className="font-mono">{Math.round(((currentStep - 1) / 4) * 100)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-brand h-2 rounded-full transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Compact version for showing in sidebar or header
export function OnboardingProgress({
    className,
}: {
    className?: string
}) {
    const { isConnected } = useAccount()

    if (!isConnected) {
        return (
            <div className={cn("flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200", className)}>
                <Wallet className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700">Connect wallet to get started</span>
                <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                        <Button
                            onClick={openConnectModal}
                            size="sm"
                            variant="outline"
                            className="ml-auto h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                            Connect
                        </Button>
                    )}
                </ConnectButton.Custom>
            </div>
        )
    }

    return null
}
