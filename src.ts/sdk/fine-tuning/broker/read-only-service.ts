import type { ServiceStructOutput } from '../contract'
import type { ReadOnlyFineTuningServingContract } from '../contract'

/**
 * Read-only service processor for listing fine-tuning services.
 * Works without authentication - only requires a read-only contract.
 */
export class ReadOnlyServiceProcessor {
    protected contract: ReadOnlyFineTuningServingContract

    constructor(contract: ReadOnlyFineTuningServingContract) {
        this.contract = contract
    }

    /**
     * List fine-tuning services from the blockchain.
     *
     * @param includeUnacknowledged - Include unacknowledged services (default: false)
     * @returns Array of service struct outputs
     */
    async listService(
        includeUnacknowledged: boolean = false
    ): Promise<ServiceStructOutput[]> {
        return this.contract.listService(includeUnacknowledged)
    }
}
