import type { AddressLike } from 'ethers'
import { throwFormattedError } from '../common/utils'
import type { LedgerManagerContract } from './contract'
import type { InferenceServingContract } from '../inference/contract'
import type { FineTuningServingContract } from '../fine-tuning/contract'
import type { Cache, Metadata } from '../common/storage'
import { CacheValueTypeEnum, CACHE_KEYS } from '../common/storage'
import { logger } from '../common/logger'

export interface LedgerDetailStructOutput {
    ledgerInfo: bigint[]
    infers: [string, bigint, bigint][]
    fines: [string, bigint, bigint][] | null
}

export interface ServiceNames {
    inference: string
    fineTuning?: string
}
/**
 * LedgerProcessor contains methods for creating, depositing funds, and retrieving 0G Compute Network Ledgers.
 */
export class LedgerProcessor {
    protected metadata: Metadata
    protected cache: Cache

    protected ledgerContract: LedgerManagerContract
    protected inferenceContract: InferenceServingContract
    protected fineTuningContract: FineTuningServingContract | undefined
    protected serviceNames: ServiceNames

    constructor(
        metadata: Metadata,
        cache: Cache,
        ledgerContract: LedgerManagerContract,
        inferenceContract: InferenceServingContract,
        fineTuningContract: FineTuningServingContract | undefined,
        serviceNames: ServiceNames
    ) {
        this.metadata = metadata
        this.ledgerContract = ledgerContract
        this.inferenceContract = inferenceContract
        this.fineTuningContract = fineTuningContract
        this.cache = cache
        this.serviceNames = serviceNames
    }

    async getLedger() {
        try {
            const ledger = await this.ledgerContract.getLedger()
            return ledger
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async getLedgerWithDetail(): Promise<LedgerDetailStructOutput> {
        try {
            const ledger = await this.ledgerContract.getLedger()
            const ledgerInfo = [
                ledger.totalBalance,
                ledger.totalBalance - ledger.availableBalance,
                ledger.availableBalance,
            ]

            // Get providers using the new getLedgerProviders method with service names
            const userAddress = this.ledgerContract.getUserAddress()
            const inferenceProviders =
                await this.ledgerContract.getLedgerProviders(
                    userAddress,
                    this.serviceNames.inference
                )

            const infers: [string, bigint, bigint][] = await Promise.all(
                inferenceProviders.map(async (provider) => {
                    const account = await this.inferenceContract.getAccount(
                        provider
                    )
                    return [provider, account.balance, account.pendingRefund]
                })
            )

            if (
                typeof this.fineTuningContract == 'undefined' ||
                !this.serviceNames.fineTuning
            ) {
                return { ledgerInfo, infers, fines: [] }
            }

            const fineTuningProviders =
                await this.ledgerContract.getLedgerProviders(
                    userAddress,
                    this.serviceNames.fineTuning
                )

            const fines: [string, bigint, bigint][] = await Promise.all(
                fineTuningProviders.map(async (provider) => {
                    const account = await this.fineTuningContract?.getAccount(
                        provider
                    )
                    return [provider, account!.balance, account!.pendingRefund]
                })
            )

            return { ledgerInfo, infers, fines }
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async listLedger() {
        try {
            const ledgers = await this.ledgerContract.listLedger()
            return ledgers
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Minimum balance required to create a ledger (3 0G).
     * This matches the MIN_ACCOUNT_BALANCE constant in the LedgerManager contract.
     */
    static readonly MIN_LEDGER_BALANCE_OG = 3

    async addLedger(balance: number, gasPrice?: number) {
        try {
            if (balance < LedgerProcessor.MIN_LEDGER_BALANCE_OG) {
                throw new Error(
                    `Minimum balance to create a ledger is ${LedgerProcessor.MIN_LEDGER_BALANCE_OG} 0G, but got ${balance} 0G. ` +
                        `Please use: broker.ledger.addLedger(${LedgerProcessor.MIN_LEDGER_BALANCE_OG})`
                )
            }

            try {
                const ledger = await this.getLedger()
                if (ledger) {
                    throw new Error(
                        'Ledger already exists, with balance: ' +
                            this.neuronToA0gi(ledger.totalBalance) +
                            ' 0G'
                    )
                }
            } catch (error) {}

            await this.ledgerContract.addLedger(
                this.a0giToNeuron(balance),
                '',
                gasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async deleteLedger(gasPrice?: number) {
        try {
            await this.ledgerContract.deleteLedger(gasPrice)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async depositFund(balance: number, gasPrice?: number) {
        try {
            if (balance <= 0) {
                throw new Error(
                    `Deposit amount must be greater than 0 0G, but got ${balance} 0G`
                )
            }

            // Check if ledger exists; if not, depositFund will create one.
            // The contract requires MIN_ACCOUNT_BALANCE for ledger creation.
            let ledgerExists = false
            try {
                const ledger = await this.getLedger()
                if (ledger) {
                    ledgerExists = true
                }
            } catch {
                // Ledger does not exist
            }

            if (
                !ledgerExists &&
                balance < LedgerProcessor.MIN_LEDGER_BALANCE_OG
            ) {
                throw new Error(
                    `No ledger exists yet. depositFund will create one, but the contract requires a minimum of ${LedgerProcessor.MIN_LEDGER_BALANCE_OG} 0G. ` +
                        `Got ${balance} 0G. Please use: broker.ledger.depositFund(${LedgerProcessor.MIN_LEDGER_BALANCE_OG})`
                )
            }

            const amount = this.a0giToNeuron(balance).toString()
            await this.ledgerContract.depositFund(amount, gasPrice)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async refund(balance: number, gasPrice?: number) {
        try {
            const amount = this.a0giToNeuron(balance).toString()
            await this.ledgerContract.refund(amount, gasPrice)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Deposits a specified amount of funds into Ledger for a specific recipient address.
     *
     * @param {AddressLike} recipient - The address to deposit funds for.
     * @param {number} balance - The amount of funds to be deposited. Units are in 0G.
     * @param {number} gasPrice - The gas price to be used for the transaction. If not provided,
     *                            the default/auto-generated gas price will be used. Units are in neuron.
     *
     * @throws  An error if the deposit fails.
     */
    async depositFundFor(
        recipient: AddressLike,
        balance: number,
        gasPrice?: number
    ) {
        try {
            const amount = this.a0giToNeuron(balance).toString()
            await this.ledgerContract.depositFundFor(
                recipient,
                amount,
                gasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Minimum transfer amount for new service sub-account creation (1 0G in neuron).
     * Matches the contract's MIN_TRANSFER_AMOUNT constant.
     * User-facing transfers should use MIN_TRANSFER_AMOUNT_OG (1 0G).
     */
    static readonly MIN_TRANSFER_AMOUNT_CONTRACT = BigInt(10 ** 18)

    /**
     * Recommended minimum transfer amount for user-facing operations (1 0G in neuron).
     * Matches the MinimumLockedBalance in the broker proxy, ensuring the provider
     * sub-account has enough balance to serve requests.
     */
    static readonly MIN_TRANSFER_AMOUNT_OG = BigInt(1) * BigInt(10 ** 18)

    async transferFund(
        to: AddressLike,
        serviceTypeStr: 'inference' | 'fine-tuning',
        balance: bigint,
        gasPrice?: number
    ) {
        try {
            if (balance <= BigInt(0)) {
                throw new Error(
                    'Transfer amount must be greater than 0'
                )
            }

            // Warn if transferring less than the recommended minimum (1 0G),
            // but allow it since internal operations (e.g. account creation) may transfer smaller amounts.
            if (
                balance > BigInt(0) &&
                balance < LedgerProcessor.MIN_TRANSFER_AMOUNT_OG
            ) {
                const amountInOG = this.neuronToA0gi(balance)
                logger.warn(
                    `Warning: Transferring ${amountInOG.toFixed(6)} 0G to provider sub-account. ` +
                        `The recommended minimum is 1 0G to meet provider balance requirements. ` +
                        `Requests may be rejected if sub-account balance is below the provider's minimum threshold.`
                )
            }

            const amount = balance.toString()
            // Map service type to service name
            const serviceName =
                serviceTypeStr === 'inference'
                    ? this.serviceNames.inference
                    : this.serviceNames.fineTuning

            if (!serviceName) {
                throw new Error(
                    `Service name not available for ${serviceTypeStr}`
                )
            }

            await this.ledgerContract.transferFund(
                to,
                serviceName,
                amount,
                gasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Returns the list of providers with their balance info for a given service type.
     *
     * @param serviceTypeStr - 'inference' or 'fine-tuning'
     * @returns Array of [providerAddress, balance, pendingRefund] tuples
     */
    async getProvidersWithBalance(
        serviceTypeStr: 'inference' | 'fine-tuning'
    ): Promise<[string, bigint, bigint][]> {
        try {
            const ledger = await this.getLedgerWithDetail()
            const providers =
                serviceTypeStr === 'inference' ? ledger.infers : ledger.fines
            if (!providers) {
                throw new Error(
                    'No providers found, please ensure you are using Wallet instance to create the broker'
                )
            }
            return providers.filter((x) => x[1] > 0n || x[2] > 0n)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async retrieveFund(
        serviceTypeStr: 'inference' | 'fine-tuning',
        gasPrice?: number
    ) {
        try {
            const ledger = await this.getLedgerWithDetail()
            const providers =
                serviceTypeStr == 'inference' ? ledger.infers : ledger.fines
            if (!providers) {
                throw new Error(
                    'No providers found, please ensure you are using Wallet instance to create the broker'
                )
            }

            const providerAddresses = providers
                .filter((x) => x[1] - x[2] >= 0n)
                .map((x) => x[0])

            // Map service type to service name
            const serviceName =
                serviceTypeStr === 'inference'
                    ? this.serviceNames.inference
                    : this.serviceNames.fineTuning

            if (!serviceName) {
                throw new Error(
                    `Service name not available for ${serviceTypeStr}`
                )
            }

            await this.ledgerContract.retrieveFund(
                providerAddresses,
                serviceName,
                gasPrice
            )

            if (serviceTypeStr == 'inference') {
                await this.cache.setItem(
                    CACHE_KEYS.FIRST_ROUND,
                    'true',
                    10000000 * 60 * 1000,
                    CacheValueTypeEnum.Other
                )
            }
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Retrieves funds from a specific provider's sub-account.
     *
     * @param serviceTypeStr - 'inference' or 'fine-tuning'
     * @param providerAddress - The address of the provider to retrieve funds from
     * @param gasPrice - Optional gas price for the transaction
     */
    async retrieveFundFromProvider(
        serviceTypeStr: 'inference' | 'fine-tuning',
        providerAddress: string,
        gasPrice?: number
    ) {
        try {
            const serviceName =
                serviceTypeStr === 'inference'
                    ? this.serviceNames.inference
                    : this.serviceNames.fineTuning

            if (!serviceName) {
                throw new Error(
                    `Service name not available for ${serviceTypeStr}`
                )
            }

            await this.ledgerContract.retrieveFund(
                [providerAddress],
                serviceName,
                gasPrice
            )

            if (serviceTypeStr === 'inference') {
                await this.cache.setItem(
                    CACHE_KEYS.FIRST_ROUND,
                    'true',
                    10000000 * 60 * 1000,
                    CacheValueTypeEnum.Other
                )
            }
        } catch (error) {
            throwFormattedError(error)
        }
    }

    // Method removed: createSettleSignerKey is no longer needed
    // since we're using placeholders in addLedger

    protected a0giToNeuron(value: number): bigint {
        const valueStr = value.toFixed(18)
        const parts = valueStr.split('.')

        // Handle integer part
        const integerPart = parts[0]
        let integerPartAsBigInt = BigInt(integerPart) * BigInt(10 ** 18)

        // Handle fractional part if it exists
        if (parts.length > 1) {
            let fractionalPart = parts[1]
            while (fractionalPart.length < 18) {
                fractionalPart += '0'
            }
            if (fractionalPart.length > 18) {
                fractionalPart = fractionalPart.slice(0, 18) // Truncate to avoid overflow
            }

            const fractionalPartAsBigInt = BigInt(fractionalPart)
            integerPartAsBigInt += fractionalPartAsBigInt
        }

        return integerPartAsBigInt
    }

    protected neuronToA0gi(value: bigint): number {
        const divisor = BigInt(10 ** 18)
        const integerPart = value / divisor
        const remainder = value % divisor
        const decimalPart = Number(remainder) / Number(divisor)

        return Number(integerPart) + decimalPart
    }
}
