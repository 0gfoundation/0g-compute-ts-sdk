import {
    aesGCMDecryptToFile,
    eciesDecrypt,
    throwFormattedError,
} from '../../common/utils'
import {
    ZG_RPC_ENDPOINT_TESTNET,
    ZG_RPC_ENDPOINT_MAINNET,
    INDEXER_URL_TESTNET_TURBO,
    INDEXER_URL_MAINNET_TURBO,
} from '../const'
import { download } from '../zg-storage'
import type { StorageConfig } from '../zg-storage'
import { ReadOnlyModelProcessor } from './read-only-model'
import type { FineTuningServingContract } from '../contract'
import type { LedgerBroker } from '../../ledger'
import type { Provider } from '../provider/provider'
import { logger } from '../../common/logger'
import { ethers } from 'ethers'
import fs from 'fs/promises'
import path from 'path'
import { getNetworkType } from '../../constants'

/**
 * ModelProcessor handles model-related operations including listing available models,
 * acknowledging model delivery, and decrypting fine-tuned models.
 *
 * Extends ReadOnlyModelProcessor to inherit listModel() for read-only operations.
 */
export class ModelProcessor extends ReadOnlyModelProcessor {
    protected contract: FineTuningServingContract
    protected ledger: LedgerBroker
    protected servingProvider: Provider

    constructor(
        contract: FineTuningServingContract,
        ledger: LedgerBroker,
        servingProvider: Provider
    ) {
        super(contract.serving)
        this.contract = contract
        this.ledger = ledger
        this.servingProvider = servingProvider
    }

    /**
     * Get storage configuration based on current network
     */
    protected async getStorageConfig(): Promise<StorageConfig> {
        try {
            const chainId = await this.contract.signer.provider?.getNetwork().then(n => n.chainId)
            const networkType = chainId ? getNetworkType(chainId) : 'unknown'

            if (networkType === 'mainnet') {
                return {
                    rpcUrl: ZG_RPC_ENDPOINT_MAINNET,
                    indexerUrl: INDEXER_URL_MAINNET_TURBO,
                }
            } else {
                return {
                    rpcUrl: ZG_RPC_ENDPOINT_TESTNET,
                    indexerUrl: INDEXER_URL_TESTNET_TURBO,
                }
            }
        } catch {
            return {
                rpcUrl: ZG_RPC_ENDPOINT_TESTNET,
                indexerUrl: INDEXER_URL_TESTNET_TURBO,
            }
        }
    }

    /**
     * Acknowledge model delivery and download the trained model
     * @param providerAddress - The provider's address
     * @param taskId - The task ID
     * @param dataPath - Path to save the downloaded model
     * @param options - Optional configuration
     * @param options.gasPrice - Gas price for the transaction
     * @param options.downloadMethod - Download method: 'auto' (default, try 0G Storage first then TEE fallback), 'tee', or '0g-storage'
     */
    async acknowledgeModel(
        providerAddress: string,
        taskId: string,
        dataPath: string,
        options?: {
            gasPrice?: number
            downloadMethod?: 'tee' | '0g-storage' | 'auto'
        }
    ): Promise<void> {
        try {
            const gasPrice = options?.gasPrice
            const downloadMethod = options?.downloadMethod ?? 'auto'

            const deliverable = await this.contract.getDeliverable(
                providerAddress,
                taskId
            )

            logger.debug(
                `deliverable: ${deliverable.modelRootHash}`
            )

            if (!deliverable) {
                throw new Error('No deliverable found')
            }

            // Resolve storage download path: 0G Storage client needs a file path, not a directory
            let storageDownloadPath = dataPath
            try {
                const stats = await fs.stat(dataPath)
                if (stats.isDirectory()) {
                    storageDownloadPath = path.join(
                        dataPath,
                        `model_${taskId}.bin`
                    )
                }
            } catch {
                // Path doesn't exist yet, use as-is (will be created as a file)
            }

            if (downloadMethod === 'tee') {
                // Download LoRA directly from TEE
                await this.servingProvider.downloadLoRAFromTEE(
                    providerAddress,
                    taskId,
                    dataPath
                )
                logger.info('Successfully downloaded LoRA model from TEE')

                // Verify hash of downloaded file against on-chain modelRootHash
                await this.verifyDownloadedModelHash(
                    dataPath,
                    taskId,
                    deliverable.modelRootHash
                )
            } else if (downloadMethod === '0g-storage') {
                // Download from 0G Storage with built-in hash verification
                const storageConfig = await this.getStorageConfig()
                await download(storageDownloadPath, deliverable.modelRootHash, storageConfig)
                logger.info(
                    `Successfully downloaded model from 0G Storage to ${storageDownloadPath}`
                )
            } else {
                // Auto mode: try 0G Storage first, fallback to TEE
                try {
                    logger.info(
                        'Downloading model from 0G Storage...'
                    )
                    const storageConfig = await this.getStorageConfig()
                    await download(
                        storageDownloadPath,
                        deliverable.modelRootHash,
                        storageConfig
                    )
                    logger.info(
                        `Successfully downloaded model from 0G Storage to ${storageDownloadPath}`
                    )
                } catch (storageErr) {
                    logger.warn(
                        `0G Storage download failed: ${storageErr}. Falling back to TEE download...`
                    )
                    await this.servingProvider.downloadLoRAFromTEE(
                        providerAddress,
                        taskId,
                        dataPath
                    )
                    logger.info(
                        'Successfully downloaded LoRA model from TEE (fallback)'
                    )

                    // Verify hash of downloaded file against on-chain modelRootHash
                    await this.verifyDownloadedModelHash(
                        dataPath,
                        taskId,
                        deliverable.modelRootHash
                    )
                }
            }

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
     * Download model from 0G Storage (original method, for encrypted full model)
     */
    async downloadModelFrom0GStorage(
        providerAddress: string,
        taskId: string,
        dataPath: string
    ): Promise<void> {
        try {
            const deliverable = await this.contract.getDeliverable(
                providerAddress,
                taskId
            )

            if (!deliverable) {
                throw new Error('No deliverable found')
            }

            // Resolve path: 0G Storage client needs a file path, not a directory
            let downloadPath = dataPath
            try {
                const stats = await fs.stat(dataPath)
                if (stats.isDirectory()) {
                    downloadPath = path.join(
                        dataPath,
                        `model_${taskId}.bin`
                    )
                }
            } catch {
                // Path doesn't exist yet, use as-is
            }

            const storageConfig = await this.getStorageConfig()
            await download(downloadPath, deliverable.modelRootHash, storageConfig)
            logger.info(
                `Successfully downloaded model from 0G Storage to ${downloadPath}`
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Download LoRA model directly from TEE (without acknowledge)
     * Use this when you only want to download the trained LoRA adapter
     */
    async downloadLoRAFromTEE(
        providerAddress: string,
        taskId: string,
        outputPath: string
    ): Promise<void> {
        try {
            await this.servingProvider.downloadLoRAFromTEE(
                providerAddress,
                taskId,
                outputPath
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Verify the hash of a downloaded model file against the expected on-chain hash.
     */
    private async verifyDownloadedModelHash(
        filePath: string,
        taskId: string,
        expectedHash: string
    ): Promise<void> {
        try {
            let actualFile = filePath
            try {
                const stats = await fs.stat(filePath)
                if (stats.isDirectory()) {
                    const files = await fs.readdir(filePath)
                    const loraFile = files.find(
                        (f) =>
                            f.startsWith('lora_model_') ||
                            f.endsWith('.data') ||
                            f.endsWith('.zip')
                    )
                    if (loraFile) {
                        actualFile = `${filePath}/${loraFile}`
                    } else if (files.length === 1) {
                        actualFile = `${filePath}/${files[0]}`
                    } else {
                        logger.warn(
                            `Cannot determine downloaded file in directory ${filePath}, skipping hash verification`
                        )
                        return
                    }
                }
            } catch (err) {
                logger.warn(
                    `Downloaded file not found at ${filePath}, skipping hash verification`
                )
                return
            }

            const fileData = await fs.readFile(actualFile)
            const computedHash = ethers.keccak256(fileData)

            if (
                expectedHash &&
                expectedHash !==
                    '0x0000000000000000000000000000000000000000000000000000000000000000'
            ) {
                if (computedHash !== expectedHash) {
                    logger.warn(
                        `Hash mismatch for task ${taskId}: expected ${expectedHash}, got ${computedHash}`
                    )
                } else {
                    logger.info(
                        `Hash verification passed for task ${taskId}`
                    )
                }
            } else {
                logger.info(
                    `No on-chain hash to verify against for task ${taskId}, computed hash: ${computedHash}`
                )
            }
        } catch (err) {
            logger.warn(`Hash verification failed: ${err}`)
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
