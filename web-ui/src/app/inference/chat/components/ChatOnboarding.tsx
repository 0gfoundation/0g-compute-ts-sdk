'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { X, MessageCircle, Wallet, Send, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ONBOARDING_STORAGE_KEY = 'chat-onboarding-step'

interface OnboardingStep {
    id: number
    title: string
    description: string
    icon: React.ReactNode
    targetSelector?: string
    position: 'top' | 'bottom' | 'left' | 'right'
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 1,
        title: 'Select a Provider',
        description: 'Choose an AI provider from the dropdown. Each provider offers different models and pricing.',
        icon: <MessageCircle className="h-5 w-5" />,
        targetSelector: '.provider-dropdown',
        position: 'bottom',
    },
    {
        id: 2,
        title: 'Fund Your Provider',
        description: 'Add funds to your selected provider using the "Add Funds" button. This allows you to pay for AI services.',
        icon: <Wallet className="h-5 w-5" />,
        position: 'bottom',
    },
    {
        id: 3,
        title: 'Start Chatting',
        description: 'Type your message and press Enter or click Send. Your conversation is verified on-chain for transparency.',
        icon: <Send className="h-5 w-5" />,
        position: 'top',
    },
]

interface ChatOnboardingProps {
    currentStep: number
    onNext: () => void
    onSkip: () => void
    onStepClick: (step: number) => void
}

export function ChatOnboarding({ currentStep, onNext, onSkip, onStepClick }: ChatOnboardingProps) {
    const step = ONBOARDING_STEPS[currentStep - 1]

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40 z-40" onClick={onSkip} />

            {/* Onboarding Card */}
            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                    {/* Progress bar */}
                    <div className="h-1 bg-gray-100">
                        <div
                            className="h-full bg-purple-600 transition-all duration-300"
                            style={{ width: `${(currentStep / ONBOARDING_STEPS.length) * 100}%` }}
                        />
                    </div>

                    <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600">
                                    {step.icon}
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-0.5">
                                        Step {currentStep} of {ONBOARDING_STEPS.length}
                                    </div>
                                    <h3 className="font-semibold text-gray-900">
                                        {step.title}
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={onSkip}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Skip onboarding"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-5">
                            {step.description}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={onSkip}
                                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Skip tutorial
                            </button>
                            <Button
                                onClick={onNext}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {currentStep === ONBOARDING_STEPS.length ? 'Get Started' : 'Next'}
                                {currentStep < ONBOARDING_STEPS.length && (
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Step indicators */}
                    <div className="px-5 pb-4 flex justify-center gap-1.5">
                        {ONBOARDING_STEPS.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => onStepClick(index + 1)}
                                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                    index + 1 === currentStep
                                        ? 'w-6 bg-purple-600'
                                        : index + 1 < currentStep
                                        ? 'w-1.5 bg-purple-300'
                                        : 'w-1.5 bg-gray-200'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

// Hook to track onboarding step via localStorage
export function useChatOnboarding() {
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)

    useEffect(() => {
        const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY)
        if (stored === 'completed') {
            setShowOnboarding(false)
        } else {
            setShowOnboarding(true)
            setCurrentStep(stored ? parseInt(stored, 10) : 1)
        }
    }, [])

    const advanceStep = (step: number) => {
        if (step > currentStep) {
            localStorage.setItem(ONBOARDING_STORAGE_KEY, String(step))
        }
        setCurrentStep(step)
    }

    const completeOnboarding = () => {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'completed')
        setShowOnboarding(false)
    }

    const resetOnboarding = () => {
        localStorage.removeItem(ONBOARDING_STORAGE_KEY)
        setShowOnboarding(true)
        setCurrentStep(1)
    }

    return { showOnboarding, currentStep, advanceStep, completeOnboarding, resetOnboarding }
}
