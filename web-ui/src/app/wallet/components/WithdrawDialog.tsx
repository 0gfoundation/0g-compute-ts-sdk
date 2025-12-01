'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface WithdrawDialogProps {
    isOpen: boolean
    onClose: () => void
    availableBalance: string
    totalBalance: string
    lockedBalance: string
    withdrawAmount: string
    onWithdrawAmountChange: (value: string) => void
    onWithdraw: () => void
    onDeleteAccount: () => void
    isWithdrawing: boolean
    isDeleting: boolean
    error: string | null
    formatNumber: (value: string | number) => string
}

export function WithdrawDialog({
    isOpen,
    onClose,
    availableBalance,
    totalBalance,
    lockedBalance,
    withdrawAmount,
    onWithdrawAmountChange,
    onWithdraw,
    onDeleteAccount,
    isWithdrawing,
    isDeleting,
    error,
    formatNumber,
}: WithdrawDialogProps) {
    const availableAmount = parseFloat(availableBalance)
    const totalAmount = parseFloat(totalBalance)
    const lockedAmount = parseFloat(lockedBalance)
    const maxWithdrawable = Math.max(0, Math.min(availableAmount, totalAmount - 3))
    const canDeleteAccount = lockedAmount === 0

    const handleClose = () => {
        onWithdrawAmountChange('')
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
                                onChange={(e) => onWithdrawAmountChange(e.target.value)}
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
                    <Button variant="outline" onClick={handleClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={onWithdraw}
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
                        onClick={onDeleteAccount}
                        disabled={!canDeleteAccount || isDeleting || availableAmount <= 0}
                        className="w-full border-red-300 text-red-600 hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                    >
                        {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {isDeleting ? "Withdrawing All..." : "Withdraw All & Delete Account"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
