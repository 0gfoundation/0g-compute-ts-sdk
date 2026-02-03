import {
    aesGCMDecryptToFile,
    eciesDecrypt,
    hexToRoots,
    throwFormattedError,
} from '../../common/utils'
import { MODEL_HASH_MAP } from '../const'
import { download } from '../zg-storage'
import { BrokerBase } from './base'
import { logger } from '../../common/logger'

/**
 * ModelProcessor handles model-related operations including listing available models,
 * acknowledging model delivery, and decrypting fine-tuned models.
 */
export class ModelProcessor extends BrokerBase {
    /**
     * List all available models including both standard pre-trained models
     * and customized models from providers.
     *
     * @returns A tuple containing two arrays:
     *   - [0]: Standard pre-trained models with their configurations
     *   - [1]: Customized models from providers with descriptions
     *
     * @example
     * ```typescript
     * const [standardModels, customizedModels] = await broker.fineTuning.listModel();
     *
     * // Standard models: [['meta-llama/Llama-2-7b-chat-hf', {...}], ...]
     * // Customized models: [['my-model', { description: '...', provider: '0x...' }], ...]
     * ```
     */
    async listModel(): Promise<[string, { [key: string]: string }][][]> {
        try {
            const services = await this.contract.listService()
            const customizedModels: [string, { [key: string]: string }][] = []

            for (const service of services) {
                if (service.models.length !== 0) {
                    const url = service.url
                    const models = await this.servingProvider.getCustomizedModels(
                        url
                    )
                    for (const item of models) {
                        customizedModels.push([
                            item.name,
                            {
                                description: item.description,
                                provider: service.provider,
                            },
                        ])
                    }
                }
            }

            return [Object.entries(MODEL_HASH_MAP), customizedModels]
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Acknowledge receipt of a fine-tuned model from a provider.
     * Downloads the encrypted model from 0G Storage and confirms receipt on-chain.
     *
     * @param providerAddress - Address of the provider who trained the model
     * @param taskId - ID of the fine-tuning task
     * @param dataPath - Local path where the encrypted model will be saved
     * @param gasPrice - Optional gas price for the transaction
     * @throws Error if no deliverable found or download fails
     *
     * @example
     * ```typescript
     * await broker.fineTuning.acknowledgeModel(
     *   '0x1234...',
     *   'task-123',
     *   './encrypted-model.bin'
     * );
     * ```
     */
    async acknowledgeModel(
        providerAddress: string,
        taskId: string,
        dataPath: string,
        gasPrice?: number
    ): Promise<void> {
        try {
            const deliverable = await this.contract.getDeliverable(
                providerAddress,
                taskId
            )

            logger.debug(
                `deliverable: ${hexToRoots(deliverable.modelRootHash)}`
            )

            if (!deliverable) {
                throw new Error('No deliverable found')
            }

            await download(dataPath, hexToRoots(deliverable.modelRootHash))

            await this.contract.acknowledgeDeliverable(
                providerAddress,
                taskId,
                gasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Decrypt a fine-tuned model after acknowledgement.
     * Uses the user's private key to decrypt the model encryption key,
     * then decrypts the model file.
     *
     * @param providerAddress - Address of the provider who trained the model
     * @param taskId - ID of the fine-tuning task
     * @param encryptedModelPath - Local path to the encrypted model file
     * @param decryptedModelPath - Local path where the decrypted model will be saved
     * @throws Error if deliverable not found, not acknowledged, or decryption fails
     *
     * @example
     * ```typescript
     * await broker.fineTuning.decryptModel(
     *   '0x1234...',
     *   'task-123',
     *   './encrypted-model.bin',
     *   './my-model'
     * );
     * ```
     *
     * @remarks
     * The model can only be decrypted after:
     * 1. The provider has delivered the encrypted model
     * 2. The user has acknowledged the model (called acknowledgeModel)
     * 3. The provider has shared the encrypted decryption key
     */
    async decryptModel(
        providerAddress: string,
        taskId: string,
        encryptedModelPath: string,
        decryptedModelPath: string
    ): Promise<void> {
        try {
            const [service, deliverable] = await Promise.all([
                this.contract.getService(providerAddress),
                this.contract.getDeliverable(providerAddress, taskId),
            ])

            logger.debug(`service, ${service}`)

            if (!deliverable) {
                throw new Error('No deliverable found')
            }

            if (!deliverable.acknowledged) {
                throw new Error('Deliverable not acknowledged yet')
            }

            if (!deliverable.encryptedSecret) {
                throw new Error('EncryptedSecret not found')
            }

            const secret = await eciesDecrypt(
                this.contract.signer,
                deliverable.encryptedSecret
            )

            await aesGCMDecryptToFile(
                secret,
                encryptedModelPath,
                decryptedModelPath,
                service.teeSignerAddress
            )
        } catch (error) {
            throwFormattedError(error)
        }
        return
    }
}
