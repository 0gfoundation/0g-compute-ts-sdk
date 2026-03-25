import { useCallback } from 'react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useBroker } from '@/shared/providers/BrokerProvider'

/**
 * Hook to guard actions that require a connected wallet
 *
 * @returns {Object} - Guard utilities
 * @returns {Function} requireWallet - Check if wallet is connected, prompt if not
 * @returns {boolean} isWalletConnected - Current wallet connection status
 *
 * @example
 * const { requireWallet } = useWalletGuard()
 *
 * const handleAction = async () => {
 *   if (!requireWallet()) return
 *   // ... perform action
 * }
 */
export function useWalletGuard() {
    const { broker } = useBroker()
    const { openConnectModal } = useConnectModal()

    /**
     * Check if wallet is connected. If not, open connect modal.
     * @returns {boolean} - true if wallet is connected, false otherwise
     */
    const requireWallet = useCallback(() => {
        if (!broker) {
            openConnectModal?.()
            return false
        }
        return true
    }, [broker, openConnectModal])

    return {
        requireWallet,
        isWalletConnected: !!broker,
    }
}
