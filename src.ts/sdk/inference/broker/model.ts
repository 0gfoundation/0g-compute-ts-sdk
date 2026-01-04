import type { ServiceStructOutput } from '../contract'
import { ZGServingUserBrokerBase } from './base'
import { throwFormattedError } from '../../common/utils'

export enum VerifiabilityEnum {
    OpML = 'OpML',
    TeeML = 'TeeML',
    ZKML = 'ZKML',
}

export type Verifiability =
    | VerifiabilityEnum.OpML
    | VerifiabilityEnum.TeeML
    | VerifiabilityEnum.ZKML

export class ModelProcessor extends ZGServingUserBrokerBase {
    async listService(
        offset: number = 0,
        limit: number = 50,
        includeUnacknowledged: boolean = false
    ): Promise<ServiceStructOutput[]> {
        try {
            const services = await this.contract.listService(
                offset,
                limit,
                includeUnacknowledged
            )
            return services
        } catch (error) {
            throwFormattedError(error)
        }
    }

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

export function isVerifiability(value: string): value is Verifiability {
    return Object.values(VerifiabilityEnum).includes(value as VerifiabilityEnum)
}
