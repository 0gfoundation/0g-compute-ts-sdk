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
        limit: number = 50
    ): Promise<ServiceStructOutput[]> {
        try {
            const services = await this.contract.listService(offset, limit)
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
}

export function isVerifiability(value: string): value is Verifiability {
    return Object.values(VerifiabilityEnum).includes(value as VerifiabilityEnum)
}
