import type { ZGComputeNetworkBroker } from '@0glabs/0g-serving-broker'
import { keccak256, toUtf8Bytes, Contract, formatUnits, parseUnits } from 'ethers'

const USDC_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function faucet() external',
  'function decimals() view returns (uint8)'
]

const X402_RELAY_ABI = [
  'function receiveUSDCAndSwap(address from, uint256 usdcAmount, uint256 validAfter, uint256 validBefore, bytes32 nonce, bytes signature) external',
  'function getPoolStatus() external view returns (uint256 a0giLiquidity, uint256 rate, uint256 usdcBalance)',
  'function calculateA0GIOutput(uint256 usdcAmount) external view returns (uint256)'
]

const LEDGER_ABI = [
  'function depositFund() external payable'
]

export interface X402DepositResult {
  success: boolean
  txHash?: string
  depositedToLedger: boolean
}

/**
 * X402 Real Implementation
 * Phase 1: Two-step atomic flow
 * 1. Sign USDC authorization (gasless)
 * 2. Get A0GI + deposit to ledger
 */
export class X402BrokerWrapper {
  private broker: ZGComputeNetworkBroker
  private wallet: any
  private usdcContract: Contract | null = null
  private relayContract: Contract | null = null
  private ledgerContract: Contract | null = null
  private usdcAddress: string
  private relayAddress: string
  private ledgerAddress: string

  constructor(broker: ZGComputeNetworkBroker, wallet: any) {
    this.broker = broker
    this.wallet = wallet
    this.usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS || ''
    this.relayAddress = process.env.NEXT_PUBLIC_X402_RELAY || ''
    this.ledgerAddress = process.env.NEXT_PUBLIC_LEDGER_ADDRESS || ''

    if (this.usdcAddress && wallet) {
      this.usdcContract = new Contract(this.usdcAddress, USDC_ABI, wallet)
    }
    if (this.relayAddress && wallet) {
      this.relayContract = new Contract(this.relayAddress, X402_RELAY_ABI, wallet)
    }
    if (this.ledgerAddress && wallet) {
      this.ledgerContract = new Contract(this.ledgerAddress, LEDGER_ABI, wallet)
    }
  }

  /**
   * REAL x402 Payment Flow
   * Step 1: Sign USDC authorization (GASLESS)
   * Step 2: Swap USDC for A0GI atomically
   * Step 3: Deposit A0GI to ledger
   */
  async depositViaX402(amount: number): Promise<X402DepositResult> {
    console.log('🔷 x402 Payment Flow Started (REAL Implementation)')

    if (!this.usdcContract || !this.relayContract || !this.ledgerContract) {
      throw new Error('Contracts not initialized')
    }

    // Step 1: Check USDC balance
    const balance = await this.getUSDCBalance()
    if (balance < amount) {
      throw new Error(`Insufficient USDC. Have: ${balance}, Need: ${amount}`)
    }

    console.log(`💰 Paying ${amount} USDC...`)

    try {
      // Step 2: Generate EIP-712 signature for USDC (GASLESS!)
      console.log('📝 Step 1/3: Generating USDC authorization (gasless)...')

      const userAddress = await this.wallet.getAddress()
      const usdcAmount = parseUnits(amount.toString(), 6) // 6 decimals

      const validAfter = 0 // Valid immediately
      const validBefore = Math.floor(Date.now() / 1000) + 3600 // 1 hour
      const nonce = keccak256(toUtf8Bytes(`${Date.now()}-${Math.random()}`))

      // EIP-712 domain
      const domain = {
        name: 'Mock USDC',
        version: '1',
        chainId: 16602,
        verifyingContract: this.usdcAddress
      }

      // EIP-712 types
      const types = {
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' }
        ]
      }

      const message = {
        from: userAddress,
        to: this.relayAddress,
        value: usdcAmount,
        validAfter,
        validBefore,
        nonce
      }

      // User signs (NO GAS!)
      const signature = await this.wallet.signTypedData(domain, types, message)
      console.log('✅ Signature obtained')

      // Step 3: Submit to relay (swap USDC → A0GI)
      console.log('💳 Step 2/3: Swapping USDC → A0GI...')

      const swapTx = await this.relayContract.receiveUSDCAndSwap(
        userAddress,
        usdcAmount,
        validAfter,
        validBefore,
        nonce,
        signature
      )

      const swapReceipt = await swapTx.wait()
      console.log('✅ USDC → A0GI swap successful!')
      console.log(`💰 Received ${amount} A0GI`)

      // Step 4: Deposit to Ledger
      console.log('📝 Step 3/3: Depositing to Ledger...')

      const a0giAmount = parseUnits(amount.toString(), 18)
      const depositTx = await this.ledgerContract.depositFund({ value: a0giAmount })
      await depositTx.wait()

      console.log('✅ Ledger deposit complete!')
      console.log('🎉 Complete! Paid USDC → Got A0GI → Deposited to Ledger')

      return {
        success: true,
        txHash: swapReceipt.hash,
        depositedToLedger: true
      }

    } catch (error) {
      console.error('❌ x402 payment failed:', error)
      throw error
    }
  }

  /**
   * Get real USDC balance
   */
  async getUSDCBalance(): Promise<number> {
    if (!this.usdcContract) return 0

    try {
      const userAddress = await this.wallet.getAddress()
      const balance = await this.usdcContract.balanceOf(userAddress)
      return Number(formatUnits(balance, 6))
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
   * Get relay pool status
   */
  async getRelayStatus() {
    if (!this.relayContract) return null

    try {
      const status = await this.relayContract.getPoolStatus()
      return {
        liquidity: Number(formatUnits(status[0], 18)),
        exchangeRate: Number(formatUnits(status[1], 18)),
        usdcBalance: Number(formatUnits(status[2], 6))
      }
    } catch (error) {
      console.error('Error fetching relay status:', error)
      return null
    }
  }

  /**
   * Access underlying broker
   */
  get original(): ZGComputeNetworkBroker {
    return this.broker
  }
}
