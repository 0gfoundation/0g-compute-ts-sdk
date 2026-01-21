'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Loader2, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WithdrawDialogProps {
    isOpen: boolean
    onClose: () => void
    availableBalance: string
    totalBalance: string
    lockedBalance: string
    refund: (amount: number) => Promise<void>
    onSuccess?: () => void
    onDeleteSuccess?: () => void
}

// Helper function to format numbers
const formatNumber = (value: string | number) => {
    if (!value || value === "0" || value === 0) return "0"
    const num = parseFloat(value.toString())
    if (isNaN(num)) return "0"
    return num.toLocaleString('en-US', {
        useGrouping: false,
        minimumFractionDigits: 0,
        maximumFractionDigits: 20
    })
}

export function WithdrawDialog({
    isOpen,
    onClose,
    availableBalance,
    totalBalance,
    lockedBalance,
    refund,
    onSuccess,
    onDeleteSuccess,
}: WithdrawDialogProps) {
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [isWithdrawing, setIsWithdrawing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const { toast } = useToast()

    // Reset state when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setWithdrawAmount('')
            setError(null)
            setShowDeleteConfirm(false)
        }
    }, [isOpen])

    const availableAmount = parseFloat(availableBalance)
    const totalAmount = parseFloat(totalBalance)
    const lockedAmount = parseFloat(lockedBalance)
    const maxWithdrawable = Math.max(0, Math.min(availableAmount, totalAmount - 3))
    const canDeleteAccount = lockedAmount === 0

    const handleWithdraw = async () => {
        if (!withdrawAmount) return

        const amount = parseFloat(withdrawAmount)

        if (amount <= 0) {
            setError("Amount must be greater than 0")
            return
        }

        if (amount > maxWithdrawable) {
            setError("Total balance must remain at least 3 0G")
            return
        }

        setIsWithdrawing(true)
        setError(null)

        try {
            await refund(amount)
            setWithdrawAmount('')
            onClose()
            toast({
                title: "Withdrawal Successful",
                description: `Successfully withdrew ${formatNumber(amount.toString())} 0G to your wallet.`,
            })
            onSuccess?.()
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw'
            setError(errorMessage)
        } finally {
            setIsWithdrawing(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (!canDeleteAccount || availableAmount <= 0) return

        setIsDeleting(true)
        setError(null)

        try {
            await refund(availableAmount)
            setShowDeleteConfirm(false)
            onClose()
            toast({
                title: "Account Deleted",
                description: "All funds have been withdrawn and your account has been deleted.",
            })
            onDeleteSuccess?.()
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw all funds'
            setError(errorMessage)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDeleteClick = () => {
        if (!canDeleteAccount || availableAmount <= 0) return
        setShowDeleteConfirm(true)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="withdraw-amount" className="block text-sm font-medium text-gray-700 mb-2">
                            Amount to Withdraw
                        </label>
                        <div className="relative">
                            <Input
                                type="number"
                                id="withdraw-amount"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="0.0"
                                step="0.01"
                                min="0"
                                max={maxWithdrawable}
                                className="pr-12"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm">0G</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Available: {formatNumber(availableBalance)} 0G | Max withdrawable: {formatNumber(maxWithdrawable.toString())} 0G
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                            Total balance must remain at least 3 0G
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="flex gap-3 sm:gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleWithdraw}
                        disabled={!withdrawAmount || isWithdrawing || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > maxWithdrawable}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                        {isWithdrawing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                    </Button>
                </DialogFooter>

                {/* Delete Account Section */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Delete Account</h3>
                        <p className="text-xs text-gray-600 mb-3">
                            Withdraw all funds and close your account.
                        </p>
                        {!canDeleteAccount && (
                            <Alert className="bg-amber-50 border-amber-200">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <AlertDescription className="text-xs text-amber-700">
                                    You have {formatNumber(lockedBalance)} 0G in provider sub-accounts. Please retrieve all funds from providers before deleting your account.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleDeleteClick}
                        disabled={!canDeleteAccount || isDeleting || availableAmount <= 0}
                        className="w-full border-red-300 text-red-600 hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                    >
                        {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {isDeleting ? "Withdrawing All..." : "Withdraw All & Delete Account"}
                    </Button>
                </div>
            </DialogContent>

            {/* Delete Account Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Account
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Are you sure you want to withdraw all funds and delete your account? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Alert className="bg-red-50 border-red-200">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <AlertDescription className="text-sm text-red-700">
                                You will withdraw <strong>{formatNumber(availableBalance)} 0G</strong> and your account will be permanently deleted.
                            </AlertDescription>
                        </Alert>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter className="flex gap-3 sm:gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {isDeleting ? "Deleting..." : "Yes, Delete Account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    )
}
