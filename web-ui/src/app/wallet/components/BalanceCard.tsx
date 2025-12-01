'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface BalanceCardProps {
    title: string
    amount: string
    unit?: string
    description?: string
    isLoading?: boolean
    action?: {
        label: string
        onClick: () => void
        disabled?: boolean
    }
}

export function BalanceCard({
    title,
    amount,
    unit = '0G',
    description,
    isLoading = false,
    action,
}: BalanceCardProps) {
    return (
        <Card className="bg-gray-50">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">
                            {title}
                        </h3>
                        {description && (
                            <p className="text-xs text-gray-500 mt-1">
                                {description}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {isLoading && (
                            <div className="flex items-center text-gray-500">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span className="text-sm">Loading...</span>
                            </div>
                        )}
                        {action && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={action.onClick}
                                disabled={action.disabled}
                                className="text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                            >
                                {action.label}
                            </Button>
                        )}
                    </div>
                </div>
                <div className="text-xl font-semibold text-gray-900">
                    {amount} <span className="text-sm text-gray-500 font-normal">{unit}</span>
                </div>
            </CardContent>
        </Card>
    )
}
