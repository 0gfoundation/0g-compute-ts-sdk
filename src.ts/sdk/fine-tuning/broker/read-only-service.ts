import type { FineTuningServing, ServiceStructOutput } from '../contract/typechain/FineTuningServing'
import { throwFormattedError } from '../../common/utils'

/**
 * Read-only service processor for listing fine-tuning services.
 * Works without authentication - only requires a provider-connected contract.
 */
export class ReadOnlyServiceProcessor {
    protected serving: FineTuningServing

    constructor(serving: FineTuningServing) {
        this.serving = serving
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
        try {
            const services = await this.serving.getAllServices()
            if (includeUnacknowledged) {
                return services
            }
            return services.filter(
                (service) => service.teeSignerAcknowledged
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }
}
