'use client'

import { useEffect, useState } from 'react'
import { useX402Demo } from '../../shared/hooks/useX402Demo'
import { useAccount } from 'wagmi'

export default function X402DemoPage() {
  const { isConnected } = useAccount()
  const {
    x402Wrapper,
    isInitializing,
    isDepositing,
    ledgerInfo,
    depositResult,
    usdcBalance,
    isFetchingBalance,
    initWrapper,
    depositViaX402,
    depositTraditional,
    refreshLedgerInfo,
    callFaucet
  } = useX402Demo()

  const [amount, setAmount] = useState('10')
  const [paymentMethod, setPaymentMethod] = useState<'x402' | 'traditional'>('x402')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isFaucetLoading, setIsFaucetLoading] = useState(false)

  useEffect(() => {
    if (isConnected && !x402Wrapper && !isInitializing) {
      initWrapper()
    }
  }, [isConnected, x402Wrapper, isInitializing, initWrapper])

  useEffect(() => {
    if (x402Wrapper) {
      refreshLedgerInfo()
    }
  }, [x402Wrapper, refreshLedgerInfo])

  const handleDeposit = async () => {
    setErrorMessage(null)
    try {
      if (paymentMethod === 'x402') {
        await depositViaX402(parseFloat(amount))
      } else {
        await depositTraditional(parseFloat(amount))
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Deposit failed')
    }
  }

  const handleFaucet = async () => {
    setErrorMessage(null)
    setIsFaucetLoading(true)
    try {
      await callFaucet()
    } catch (err: any) {
      setErrorMessage(err.message || 'Faucet call failed')
    } finally {
      setIsFaucetLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">x402 Payment Demo</h1>
          <p className="text-gray-600">Please connect your wallet to continue</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            x402 Payment Protocol Demo
          </h1>
          <p className="text-gray-600">
            Compare traditional deposits vs x402-powered payments
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Traditional Method */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🏦</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Traditional Deposit</h2>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 mb-4">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">❌</span>
                <span>Requires native A0GI tokens</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">❌</span>
                <span>User pays gas fees</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">❌</span>
                <span>Single chain only</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">❌</span>
                <span>Manual balance management</span>
              </li>
            </ul>
            <div className="text-2xl font-bold text-gray-900">~$2.00</div>
            <div className="text-xs text-gray-600">Average cost per deposit</div>
          </div>

          {/* x402 Method */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white border-2 border-purple-600">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h2 className="text-xl font-bold">x402 Payment</h2>
            </div>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Pay with USDC/DAI/USDT</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Gasless (provider pays)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Multi-chain support</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Automatic refills</span>
              </li>
            </ul>
            <div className="text-2xl font-bold">$0.00</div>
            <div className="text-xs opacity-90">Zero fees for users</div>
          </div>
        </div>

        {/* Balance Display */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Account Balances</h3>
            <button
              onClick={handleFaucet}
              disabled={isFaucetLoading || !x402Wrapper}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isFaucetLoading ? '🚰 Getting USDC...' : '🚰 Get Test USDC'}
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-700 font-medium">Ledger Balance</div>
              <div className="text-2xl font-bold text-purple-600">
                {ledgerInfo?.availableBalance || '0'} A0GI
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-700 font-medium">USDC Balance (Real)</div>
              <div className="text-2xl font-bold text-green-600">
                {isFetchingBalance ? 'Loading...' : `${usdcBalance} USDC`}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Contract: {process.env.NEXT_PUBLIC_USDC_ADDRESS?.substring(0, 8)}...
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-700 font-medium">Total Balance</div>
              <div className="text-2xl font-bold text-gray-900">
                {ledgerInfo?.totalBalance || '0'} A0GI
              </div>
            </div>
          </div>
        </div>

        {/* Deposit Interface */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Try a Deposit</h3>

          {/* Payment Method Selector */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setPaymentMethod('x402')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'x402'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-bold text-gray-900 mb-1">⚡ x402 Payment</div>
              <div className="text-sm text-gray-700">Pay with USDC</div>
            </button>
            <button
              onClick={() => setPaymentMethod('traditional')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'traditional'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-bold text-gray-900 mb-1">🏦 Traditional</div>
              <div className="text-sm text-gray-700">Pay with A0GI</div>
            </button>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Deposit
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="10"
              min="0"
              step="0.1"
            />
            <div className="text-xs text-gray-700 mt-1">
              {paymentMethod === 'x402'
                ? '1 A0GI = 1 USDC (for demo)'
                : 'Uses native A0GI tokens + gas fees'
              }
            </div>
          </div>

          {/* Deposit Button */}
          <button
            onClick={handleDeposit}
            disabled={isDepositing || !amount || parseFloat(amount) <= 0}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
              paymentMethod === 'x402'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isDepositing ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                Processing...
              </span>
            ) : (
              `Deposit ${amount} A0GI via ${paymentMethod === 'x402' ? 'x402' : 'Traditional'}`
            )}
          </button>

          {/* Error Display */}
          {errorMessage && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="font-bold text-red-800 mb-2">❌ Error</div>
              <div className="text-sm text-red-700">{errorMessage}</div>
            </div>
          )}

          {/* Result Display */}
          {depositResult && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-bold text-green-800 mb-2">✅ Deposit Successful!</div>
              <div className="text-sm text-green-700">
                <div>Transaction: {depositResult.txHash}</div>
                <div className="mt-2">
                  Check console for full x402 payment details →
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ Demo Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• This is a simulated x402 demo using the existing SDK</li>
            <li>• USDC balance is simulated (starts at 1000 USDC)</li>
            <li>• x402 signatures are mocked for demonstration</li>
            <li>• In production, this would use real EIP-712 signatures and ERC-3009 transfers</li>
            <li>• Open browser console to see detailed x402 payment flow</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
