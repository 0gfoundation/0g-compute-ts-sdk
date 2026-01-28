'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Preset amounts for quick deposit
const PRESET_AMOUNTS = [
    { value: 5, label: '5 0G' },
    { value: 10, label: '10 0G' },
    { value: 25, label: '25 0G' },
    { value: 50, label: '50 0G' },
]

interface AddFundsFormProps {
    depositFund: (amount: number) => Promise<void>
    onSuccess?: () => void
}

export function AddFundsForm({ depositFund, onSuccess }: AddFundsFormProps) {
    const [amount, setAmount] = useState('')
    const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    const handlePresetClick = (presetValue: number) => {
        setSelectedPreset(presetValue)
        setAmount(presetValue.toString())
        setError(null)
    }

    const handleCustomInput = (value: string) => {
        setAmount(value)
        setSelectedPreset(null)
        setError(null)
    }

    const handleSubmit = async () => {
        if (!amount) return

        const numAmount = parseFloat(amount)
        if (numAmount <= 0) return

        setIsLoading(true)
        setError(null)

        try {
            await depositFund(numAmount)
            toast({
                title: "Funds Added Successfully",
                description: `Added ${amount} 0G tokens to your account.`,
            })
            setAmount('')
            onSuccess?.()
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to add funds'
            setError(errorMessage)
            toast({
                variant: "destructive",
                title: "Failed to Add Funds",
                description: errorMessage,
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="bg-gray-50">
            <CardContent className="p-4">
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                    Add Funds
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        {/* Quick-add preset amounts */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quick Add
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {PRESET_AMOUNTS.map((preset) => (
                                    <button
                                        key={preset.value}
                                        onClick={() => handlePresetClick(preset.value)}
                                        disabled={isLoading}
                                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                            selectedPreset === preset.value
                                                ? 'bg-purple-100 border-purple-500 text-purple-700'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <div className="font-semibold">{preset.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom amount input */}
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                                Custom Amount
                            </label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    id="amount"
                                    value={amount}
                                    onChange={(e) => handleCustomInput(e.target.value)}
                                    placeholder="Enter amount"
                                    step="0.01"
                                    min="0"
                                    className="pr-12"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 text-sm">0G</span>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            onClick={handleSubmit}
                            disabled={!amount || isLoading || parseFloat(amount) <= 0}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {isLoading ? "Adding Funds..." : `Add ${amount || '0'} 0G`}
                        </Button>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-start">
                            <Info className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-purple-800">
                                    How it works
                                </h3>
                                <ul className="mt-2 text-sm text-purple-700 space-y-1">
                                    <li>Funds are deposited to your account</li>
                                    <li>They are used automatically for AI service payments</li>
                                    <li>Unused funds can be withdrawn anytime</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
