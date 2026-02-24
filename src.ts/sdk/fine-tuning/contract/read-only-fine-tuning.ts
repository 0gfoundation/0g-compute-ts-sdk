import type { JsonRpcProvider, JsonRpcSigner, Wallet } from 'ethers'
import { FineTuningServing__factory } from './typechain'
import type { FineTuningServing } from './typechain/FineTuningServing'
import type { ServiceStructOutput } from './typechain/FineTuningServing'
import { throwFormattedError } from '../../common/utils'

export class ReadOnlyFineTuningServingContract {
    protected serving: FineTuningServing

    constructor(
        provider: JsonRpcProvider | JsonRpcSigner | Wallet,
        contractAddress: string
    ) {
        this.serving = FineTuningServing__factory.connect(
            contractAddress,
            provider
        )
    }

    lockTime(): Promise<bigint> {
        return this.serving.lockTime()
    }

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
