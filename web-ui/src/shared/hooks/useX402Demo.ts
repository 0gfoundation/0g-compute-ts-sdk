import { useState, useCallback, useEffect } from 'react'
import { use0GBroker } from './use0GBroker'
import { X402BrokerWrapper, type X402DepositResult } from '../../lib/x402/x402Wrapper'
import { useWalletClient } from 'wagmi'
import { BrowserProvider } from 'ethers'

export function useX402Demo() {
  const { broker, isInitializing, error, ledgerInfo, refreshLedgerInfo } = use0GBroker()
  const { data: walletClient } = useWalletClient()

  const [x402Wrapper, setX402Wrapper] = useState<X402BrokerWrapper | null>(null)
  const [isDepositing, setIsDepositing] = useState(false)
  const [depositResult, setDepositResult] = useState<X402DepositResult | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<number>(0)
  const [isFetchingBalance, setIsFetchingBalance] = useState(false)

  // Initialize wrapper
  const initWrapper = useCallback(async () => {
    if (!broker || !walletClient) return

    try {
      const provider = new BrowserProvider(walletClient as any)
      const signer = await provider.getSigner()

      const wrapper = new X402BrokerWrapper(broker, signer)
      setX402Wrapper(wrapper)

      console.log('✅ x402 wrapper initialized')

      // Fetch initial USDC balance
      const balance = await wrapper.getUSDCBalance()
      setUsdcBalance(balance)
      console.log(`💰 USDC balance: ${balance}`)
    } catch (err) {
      console.error('Failed to initialize x402 wrapper:', err)
    }
  }, [broker, walletClient])

  // Fetch USDC balance
  const fetchUSDCBalance = useCallback(async () => {
    if (!x402Wrapper) return

    setIsFetchingBalance(true)
    try {
      const balance = await x402Wrapper.getUSDCBalance()
      setUsdcBalance(balance)
    } catch (err) {
      console.error('Failed to fetch USDC balance:', err)
    } finally {
      setIsFetchingBalance(false)
    }
  }, [x402Wrapper])

  // Call faucet to get USDC
  const callFaucet = useCallback(async () => {
    if (!x402Wrapper) {
      throw new Error('x402 wrapper not initialized')
    }

    try {
      await x402Wrapper.callFaucet()
      await fetchUSDCBalance()
    } catch (err) {
      console.error('Faucet call failed:', err)
      throw err
    }
  }, [x402Wrapper, fetchUSDCBalance])

  // Deposit via x402 (REAL implementation)
  const depositViaX402 = useCallback(async (amount: number) => {
    if (!x402Wrapper) {
      throw new Error('x402 wrapper not initialized')
    }

    setIsDepositing(true)
    setDepositResult(null)

    try {
      const result = await x402Wrapper.depositViaX402(amount)
      setDepositResult(result)

      // Refresh both ledger info and USDC balance
      await refreshLedgerInfo()
      await fetchUSDCBalance()

      return result
    } catch (err) {
      console.error('x402 deposit failed:', err)
      throw err
    } finally {
      setIsDepositing(false)
    }
  }, [x402Wrapper, refreshLedgerInfo, fetchUSDCBalance])

  // Compare with traditional deposit
  const depositTraditional = useCallback(async (amount: number) => {
    if (!broker) {
      throw new Error('Broker not initialized')
    }

    setIsDepositing(true)

    try {
      console.log('🔵 Traditional deposit flow started')
      console.log('⚠️  Requires native A0GI tokens')
      console.log('⚠️  User pays gas fees')

      await broker.ledger.depositFund(amount)
      await refreshLedgerInfo()

      console.log('✅ Traditional deposit complete')
    } catch (err) {
      console.error('Traditional deposit failed:', err)
      throw err
    } finally {
      setIsDepositing(false)
    }
  }, [broker, refreshLedgerInfo])

  // Auto-initialize wrapper when broker is ready
  useEffect(() => {
    if (broker && walletClient && !x402Wrapper) {
      initWrapper()
    }
  }, [broker, walletClient, x402Wrapper, initWrapper])

  return {
    broker,
    x402Wrapper,
    isInitializing,
    isDepositing,
    error,
    ledgerInfo,
    depositResult,
    usdcBalance,
    isFetchingBalance,
    initWrapper,
    depositViaX402,
    depositTraditional,
    refreshLedgerInfo,
    fetchUSDCBalance,
    callFaucet
  }
}
