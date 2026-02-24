import type { JsonRpcProvider, JsonRpcSigner, Wallet } from 'ethers'
import { InferenceServing__factory } from './typechain'
import type { InferenceServing } from './typechain/InferenceServing'
import type { ServiceStructOutput } from './typechain/InferenceServing'
import { throwFormattedError } from '../../common/utils'

export class ReadOnlyInferenceServingContract {
    protected serving: InferenceServing

    constructor(
        provider: JsonRpcProvider | JsonRpcSigner | Wallet,
        contractAddress: string
    ) {
        this.serving = InferenceServing__factory.connect(
            contractAddress,
            provider
        )
    }

    lockTime(): Promise<bigint> {
        return this.serving.lockTime()
    }

    async listService(
        offset: number = 0,
        limit: number = 50,
        includeUnacknowledged: boolean = false
    ): Promise<ServiceStructOutput[]> {
        try {
            const result = await this.serving.getAllServices(offset, limit)
            if (includeUnacknowledged) {
                return result.services
            }
            return result.services.filter(
                (service) => service.teeSignerAcknowledged
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async getService(providerAddress: string): Promise<ServiceStructOutput> {
        try {
            return this.serving.getService(providerAddress)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async getChainId(): Promise<bigint | undefined> {
        const network = await this.serving.runner?.provider?.getNetwork()
        return network?.chainId
    }
}
