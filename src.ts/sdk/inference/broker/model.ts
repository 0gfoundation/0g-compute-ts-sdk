import type { InferenceServingContract } from '../contract'
import { throwFormattedError } from '../../common/utils'
import type { LedgerBroker } from '../../ledger'
import type { Cache, Metadata } from '../../common/storage'
import { ReadOnlyModelProcessor } from './read-only-model'
// Import and re-export types from read-only-model
import type {
    ServiceHealthMetric,
    ServiceWithDetail,
    Verifiability,
    HealthStatus,
} from './read-only-model'
import { VerifiabilityEnum, isVerifiability } from './read-only-model'

// Re-export types for convenience
export type {
    ServiceHealthMetric,
    ServiceWithDetail,
    Verifiability,
    HealthStatus,
}
export { VerifiabilityEnum, isVerifiability }

/**
 * Authenticated model processor extending read-only functionality
 * Adds provider-only operations like removeService and updateService
 *
 * Inherits from ReadOnlyModelProcessor:
 * - listService() - List all services
 * - listServiceWithDetail() - List services with health metrics
 */
export class ModelProcessor extends ReadOnlyModelProcessor {
    // Additional properties for authenticated operations
    protected contract: InferenceServingContract
    protected ledger: LedgerBroker
    protected metadata: Metadata
    protected cache: Cache

    constructor(
        contract: InferenceServingContract,
        contractAddress: string,
        ledger: LedgerBroker,
        metadata: Metadata,
        cache: Cache
    ) {
        // Initialize base class with the signer from contract
        // Get contract address from the serving contract instance
        super(contract.signer, contractAddress)

        this.contract = contract
        this.ledger = ledger
        this.metadata = metadata
        this.cache = cache
    }

    // Note: listService() and listServiceWithDetail() are inherited from ReadOnlyModelProcessor

    /**
     * Remove service (Provider owner only)
     *
     * This function allows the provider owner to remove their service from the contract.
     *
     * @param {number} gasPrice - Optional gas price for the transaction.
     * @throws Will throw an error if the caller is not the service owner or if removal fails.
     */
    async removeService(gasPrice?: number): Promise<void> {
        try {
            const txOptions: any = {}
            if (gasPrice) {
                txOptions.gasPrice = gasPrice
            }

            await this.contract.sendTx('removeService', [], txOptions)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Update service (Provider owner only)
     *
     * This function allows the provider owner to update their existing service.
     * All parameters are optional - if not provided, the current value is preserved.
     *
     * @param options - Update options
     * @param options.url - New service URL
     * @param options.model - New model name
     * @param options.inputPrice - New input price (in neuron, the smallest unit)
     * @param options.outputPrice - New output price (in neuron, the smallest unit)
     * @param options.gasPrice - Optional gas price for the transaction
     * @throws Will throw an error if the caller is not the service owner or if update fails.
     */
    async updateService(options: {
        url?: string
        model?: string
        inputPrice?: bigint
        outputPrice?: bigint
        gasPrice?: number
    }): Promise<void> {
        try {
            // Get current service to preserve unchanged fields
            const userAddress = this.contract.getUserAddress()
            const currentService = await this.contract.getService(userAddress)

            if (!currentService || !currentService.provider) {
                throw new Error('Service not found for the current provider')
            }

            // Build ServiceParams with updated values (use new value if provided, otherwise keep current)
            const params = {
                serviceType: currentService.serviceType,
                url: options.url ?? currentService.url,
                model: options.model ?? currentService.model,
                verifiability: currentService.verifiability,
                inputPrice: options.inputPrice ?? currentService.inputPrice,
                outputPrice: options.outputPrice ?? currentService.outputPrice,
                additionalInfo: currentService.additionalInfo,
                teeSignerAddress: currentService.teeSignerAddress,
            }

            const txOptions: { gasPrice?: number } = {}
            if (options.gasPrice) {
                txOptions.gasPrice = options.gasPrice
            }

            await this.contract.sendTx(
                'addOrUpdateService',
                [params],
                txOptions
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }
}
