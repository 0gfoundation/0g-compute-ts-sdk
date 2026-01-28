import type { ZGComputeNetworkBroker } from '@0glabs/0g-serving-broker'
import { keccak256, toUtf8Bytes, Contract, formatUnits, parseUnits } from 'ethers'

const USDC_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function faucet() external',
  'function decimals() view returns (uint8)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function receiveWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, bytes signature) external'
]

const GATEWAY_ABI = [
  'function payWithUSDC(uint256 usdcAmount) external',
  'function exchangeRate() view returns (uint256)',
  'function getCredits(address user) view returns (uint256)',
  'function withdrawCredits(uint256 amount) external'
]

export interface X402Payment {
  protocol: string
  version: string
  domain: {
    name: string
    version: string
    chainId: number
    verifyingContract: string
  }
  message: {
    from: string
    to: string
    value: string
    validAfter: number
    validBefore: number
    nonce: string
  }
  signature: string
  timestamp: number
}

export interface X402DepositResult {
  success: boolean
  txHash?: string
  x402Payment: X402Payment
}

/**
 * x402 Payment Wrapper
 * Wraps existing broker to simulate x402 payments
 * NO SDK changes required!
 */
export class X402BrokerWrapper {
  private broker: ZGComputeNetworkBroker
  private wallet: any // ethers Wallet/Signer
  private usdcContract: Contract | null = null
  private gatewayContract: Contract | null = null
  private usdcAddress: string
  private gatewayAddress: string

  constructor(broker: ZGComputeNetworkBroker, wallet: any) {
    this.broker = broker
    this.wallet = wallet
    this.usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS || ''
    this.gatewayAddress = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY || ''

    if (this.usdcAddress && wallet) {
      this.usdcContract = new Contract(this.usdcAddress, USDC_ABI, wallet)
    }
    if (this.gatewayAddress && wallet) {
      this.gatewayContract = new Contract(this.gatewayAddress, GATEWAY_ABI, wallet)
    }
  }

  /**
   * Pay with USDC via x402 payment gateway
   * This is the REAL implementation that:
   * 1. Approves USDC to payment gateway
   * 2. Calls gateway to accept USDC and credit ledger
   * 3. No A0GI required from user!
   */
  async depositViaX402(amount: number, token: 'USDC' | 'DAI' = 'USDC'): Promise<X402DepositResult> {
    console.log('🔷 x402 Payment Flow Started')

    if (!this.usdcContract || !this.gatewayContract) {
      throw new Error('Contracts not initialized')
    }

    // Step 1: Check real USDC balance
    const balance = await this.getUSDCBalance()
    if (balance < amount) {
      throw new Error(`Insufficient ${token} balance. Have: ${balance}, Need: ${amount}`)
    }

    // Step 2: Generate x402 payment (for display/logging)
    console.log('📝 Generating x402 payment authorization...')
    const payment = await this.generateX402Payment(amount, token)
    console.log('✅ Payment authorization generated:', payment)

    // Step 3: Show payment details to user
    await this.displayPaymentConfirmation(payment)

    // Step 4: Execute REAL USDC payment via gateway
    console.log('💳 Executing USDC payment via gateway...')
    try {
      // Convert amount to USDC decimals (6)
      const usdcAmount = parseUnits(amount.toString(), 6)

      // Step 4a: Approve gateway to spend USDC
      console.log('📝 Approving USDC spend...')
      const approveTx = await this.usdcContract.approve(this.gatewayAddress, usdcAmount)
      await approveTx.wait()
      console.log('✅ USDC approved')

      // Step 4b: Pay with USDC through gateway (gets A0GI credits)
      console.log('💰 Paying with USDC...')
      const payTx = await this.gatewayContract.payWithUSDC(usdcAmount)
      const receipt = await payTx.wait()
      console.log('✅ USDC payment successful - received A0GI credits!')

      // Step 4c: Check credits
      const userAddress = await this.wallet.getAddress()
      const credits = await this.gatewayContract.getCredits(userAddress)
      console.log(`💰 A0GI Credits: ${formatUnits(credits, 18)} A0GI`)

      // Step 4d: Withdraw credits as A0GI
      console.log('💸 Withdrawing A0GI credits...')
      const withdrawTx = await this.gatewayContract.withdrawCredits(credits)
      await withdrawTx.wait()
      console.log('✅ A0GI withdrawn to your wallet!')

      // Step 4e: Deposit to ledger using SDK (with your A0GI)
      console.log('📝 Depositing to ledger...')
      await this.broker.ledger.depositFund(amount)
      console.log('✅ Ledger deposit complete!')

      const newBalance = await this.getUSDCBalance()
      console.log(`💰 Remaining ${token} balance: ${newBalance}`)
      console.log('🎉 Complete! Paid with USDC → Got A0GI → Deposited to Ledger')

      return {
        success: true,
        txHash: receipt.hash,
        x402Payment: payment
      }
    } catch (error) {
      console.error('❌ x402 payment failed:', error)
      throw error
    }
  }

  /**
   * Generate x402 payment authorization (simulated for MVP)
   */
  private async generateX402Payment(amount: number, token: string): Promise<X402Payment> {
    const userAddress = await this.wallet.getAddress()
    const timestamp = Math.floor(Date.now() / 1000)

    // Simulate EIP-712 signature
    const domain = {
      name: token === 'USDC' ? 'USD Coin' : 'Dai Stablecoin',
      version: '2',
      chainId: 16602, // 0G testnet
      verifyingContract: this.usdcAddress || this.getTokenAddress(token)
    }

    const message = {
      from: userAddress,
      to: '0x09D00A2B31067da09bf0e873E58746d1285174Cc', // Ledger contract (from SDK)
      value: this.toTokenAmount(amount, token),
      validAfter: timestamp,
      validBefore: timestamp + 3600, // 1 hour validity
      nonce: this.generateNonce()
    }

    // In MVP, we create a mock signature
    // Real implementation would call: await wallet.signTypedData(domain, types, message)
    const mockSignature = '0x' + 'a'.repeat(130) // Mock signature

    return {
      protocol: 'x402',
      version: '1.0',
      domain,
      message,
      signature: mockSignature,
      timestamp: Date.now()
    }
  }

  /**
   * Display payment confirmation (console for MVP, modal in real app)
   */
  private async displayPaymentConfirmation(payment: X402Payment): Promise<void> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔷 x402 Payment Authorization')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Protocol:', payment.protocol)
    console.log('Version:', payment.version)
    console.log('From:', payment.message.from)
    console.log('To:', payment.message.to)
    console.log('Amount:', payment.message.value)
    console.log('Token:', payment.domain.name)
    console.log('Valid Until:', new Date(payment.message.validBefore * 1000).toLocaleString())
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  private getTokenAddress(token: string): string {
    // Mock addresses for demo
    return token === 'USDC'
      ? '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
      : '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  }

  private toTokenAmount(a0gi: number, token: string): string {
    // USDC has 6 decimals, DAI has 18
    const decimals = token === 'USDC' ? 6 : 18
    return (a0gi * Math.pow(10, decimals)).toString()
  }

  private generateNonce(): string {
    return keccak256(toUtf8Bytes(`${Date.now()}-${Math.random()}`))
  }

  /**
   * Get real USDC balance from contract
   */
  async getUSDCBalance(): Promise<number> {
    if (!this.usdcContract) return 0

    try {
      const userAddress = await this.wallet.getAddress()
      const balance = await this.usdcContract.balanceOf(userAddress)
      return Number(formatUnits(balance, 6)) // USDC has 6 decimals
    } catch (error) {
      console.error('Error fetching USDC balance:', error)
      return 0
    }
  }

  /**
   * Call faucet to get test USDC
   */
  async callFaucet(): Promise<void> {
    if (!this.usdcContract) {
      throw new Error('USDC contract not initialized')
    }

    console.log('🚰 Calling faucet to get test USDC...')
    const tx = await this.usdcContract.faucet()
    await tx.wait()
    console.log('✅ Faucet called successfully! You received 1000 USDC')
  }

  /**
   * Access underlying broker
   */
  get original(): ZGComputeNetworkBroker {
    return this.broker
  }
}
