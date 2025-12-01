import * as React from 'react'
import { cn } from '@/lib/utils'
import {
    AlertTriangle,
    Loader2,
    WalletCards,
    ServerOff,
    type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from './card'

type StateType = 'loading' | 'error' | 'empty' | 'wallet-disconnected' | 'custom'

interface StateDisplayProps {
    type: StateType
    title?: string
    description?: string
    icon?: LucideIcon
    className?: string
    children?: React.ReactNode
}

const defaultConfigs: Record<
    Exclude<StateType, 'custom'>,
    { icon: LucideIcon; title: string; description: string; iconClassName: string }
> = {
    loading: {
        icon: Loader2,
        title: 'Initializing...',
        description: 'Please wait while we set things up.',
        iconClassName: 'animate-spin text-purple-600',
    },
    error: {
        icon: AlertTriangle,
        title: 'Something went wrong',
        description: 'An error occurred. Please try again later.',
        iconClassName: 'text-yellow-500',
    },
    empty: {
        icon: ServerOff,
        title: 'No Data Available',
        description: 'There is no data to display at this time.',
        iconClassName: 'text-gray-400',
    },
    'wallet-disconnected': {
        icon: WalletCards,
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to access this feature.',
        iconClassName: 'text-purple-600',
    },
}

export function StateDisplay({
    type,
    title,
    description,
    icon: CustomIcon,
    className,
    children,
}: StateDisplayProps) {
    const config = type !== 'custom' ? defaultConfigs[type] : null
    const Icon = CustomIcon || config?.icon || AlertTriangle
    const displayTitle = title || config?.title || 'Notice'
    const displayDescription = description || config?.description || ''
    const iconClassName = config?.iconClassName || 'text-gray-500'

    return (
        <Card className={cn('w-full', className)}>
            <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center border border-purple-200">
                        <Icon className={cn('w-8 h-8', iconClassName)} />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {displayTitle}
                </h3>
                {displayDescription && (
                    <p className="text-gray-600">{displayDescription}</p>
                )}
                {children}
            </CardContent>
        </Card>
    )
}

interface NoticeBarProps {
    variant?: 'warning' | 'error' | 'info'
    title: string
    description: string
    className?: string
}

export function NoticeBar({
    variant = 'warning',
    title,
    description,
    className,
}: NoticeBarProps) {
    const variantStyles = {
        warning: {
            container: 'bg-yellow-50 border-yellow-200',
            icon: 'text-yellow-500',
            title: 'text-yellow-800',
            description: 'text-yellow-700',
        },
        error: {
            container: 'bg-red-50 border-red-200',
            icon: 'text-red-500',
            title: 'text-red-800',
            description: 'text-red-700',
        },
        info: {
            container: 'bg-blue-50 border-blue-200',
            icon: 'text-blue-500',
            title: 'text-blue-800',
            description: 'text-blue-700',
        },
    }

    const styles = variantStyles[variant]

    return (
        <div
            className={cn(
                'rounded-xl border p-4 mb-6',
                styles.container,
                className
            )}
        >
            <div className="flex items-start">
                <AlertTriangle
                    className={cn('w-5 h-5 mr-3 mt-0.5 flex-shrink-0', styles.icon)}
                />
                <div className="flex-1 min-w-0">
                    <h3 className={cn('text-sm font-medium', styles.title)}>
                        {title}
                    </h3>
                    <p className={cn('text-sm mt-1', styles.description)}>
                        {description}
                    </p>
                </div>
            </div>
        </div>
    )
}
