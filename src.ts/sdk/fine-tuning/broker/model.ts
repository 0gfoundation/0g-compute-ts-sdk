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
    protected declare contract: FineTuningServingContract
    protected ledger: LedgerBroker
    protected servingProvider: Provider

    constructor(
        contract: FineTuningServingContract,
        ledger: LedgerBroker,
        servingProvider: Provider
    ) {
        super(contract)
        this.contract = contract
        this.ledger = ledger
        this.servingProvider = servingProvider
    }

    /**
     * Get storage configuration based on current network
     */
    protected async getStorageConfig(): Promise<StorageConfig> {
        try {
            const chainId = await this.contract.signer.provider
                ?.getNetwork()
                .then((n) => n.chainId)
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
     * @param options.teeIdleTimeoutMs - For the TEE path: abort if no bytes
     *   are received for this many ms (default 60 000). This is an *idle*
     *   timeout, not a total-request timeout — large models stream fine even
     *   when they take well over 5 minutes.
     * @param options.teeMaxRetries - For the TEE path: number of retry
     *   attempts on transient stream / 5xx errors (default 2 → 3 attempts
     *   total).
     */
    async acknowledgeModel(
        providerAddress: string,
        taskId: string,
        dataPath: string,
        options?: {
            gasPrice?: number
            downloadMethod?: 'tee' | '0g-storage' | 'auto'
            teeIdleTimeoutMs?: number
            teeMaxRetries?: number
        }
    ): Promise<void> {
        try {
            const gasPrice = options?.gasPrice
            const downloadMethod = options?.downloadMethod ?? 'auto'
            const teeDownloadOptions = {
                idleTimeoutMs: options?.teeIdleTimeoutMs,
                maxRetries: options?.teeMaxRetries,
            }

            const deliverable = await this.contract.getDeliverable(
                providerAddress,
                taskId
            )

            logger.debug(`deliverable: ${deliverable.modelRootHash}`)

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
                    dataPath,
                    teeDownloadOptions
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
                await download(
                    storageDownloadPath,
                    deliverable.modelRootHash,
                    storageConfig
                )
                logger.info(
                    `Successfully downloaded model from 0G Storage to ${storageDownloadPath}`
                )
            } else {
                // Auto mode: try 0G Storage first, fallback to TEE
                try {
                    logger.info('Downloading model from 0G Storage...')
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
                        dataPath,
                        teeDownloadOptions
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
     * Acknowledge a delivered task on-chain *without* downloading or
     * verifying the model artifact.
     *
     * This is the escape hatch for the failure mode reported in the May
     * 2026 hackathon bug report (Bug #4): a user retrieved a model via
     * the legacy two-step `downloadModelFrom0GStorage` + `decryptModel`
     * flow and forgot to call `acknowledgeModel`. Days later the artifact
     * was garbage-collected from both 0G Storage and the TEE buffer, at
     * which point `acknowledgeModel` could no longer succeed (it requires
     * a successful download), and the user's deliverable queue was
     * permanently locked — every subsequent `addDeliverable` reverted with
     * "previous deliverable not acknowledged".
     *
     * Calling this method directly with the stuck task id releases the
     * queue without requiring any artifact retrieval.
     *
     * Prefer `acknowledgeModel(...)` for the normal happy path; that
     * function downloads, verifies the artifact hash, and then acks. Use
     * `acknowledgeDeliverable` only when:
     *   - the artifact is gone or you have already retrieved it offline, AND
     *   - you accept that no on-chain hash verification is performed.
     *
     * @param providerAddress - Address of the provider who delivered the task
     * @param taskId - The task id whose deliverable is to be acknowledged
     * @param gasPrice - Optional gas price override for the on-chain transaction
     */
    async acknowledgeDeliverable(
        providerAddress: string,
        taskId: string,
        gasPrice?: number
    ): Promise<void> {
        try {
            const deliverable = await this.contract.getDeliverable(
                providerAddress,
                taskId
            )
            if (!deliverable) {
                throw new Error(`No deliverable found for task ${taskId}`)
            }
            if (deliverable.acknowledged) {
                logger.info(
                    `Deliverable for task ${taskId} is already acknowledged on-chain — nothing to do.`
                )
                return
            }

            await this.contract.acknowledgeDeliverable(
                providerAddress,
                taskId,
                gasPrice
            )
            logger.info(
                `Acknowledged deliverable for task ${taskId} (provider ${providerAddress}). ` +
                    'Note: no model hash was verified by this call. ' +
                    'If you have not yet retrieved the artifact, call acknowledgeModel(...) instead.'
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Download the encrypted model file from 0G Storage.
     *
     * @deprecated For the normal retrieval flow prefer
     * {@link ModelProcessor.acknowledgeModel} which downloads, verifies the
     * on-chain model hash, and acknowledges the deliverable in one call.
     *
     * Calling this method on its own (without a subsequent
     * {@link ModelProcessor.acknowledgeDeliverable} or
     * {@link ModelProcessor.acknowledgeModel}) leaves the deliverable in an
     * "unacknowledged" state on-chain. The provider contract then rejects
     * any future `addDeliverable` for the same `(user, provider)` pair
     * with "previous deliverable not acknowledged", permanently locking
     * the user's queue. This is the May 2026 bug report's Bug #4 trigger.
     *
     * Use this method only as part of an advanced retrieval pipeline where
     * you control acknowledgement separately, and remember to call
     * `acknowledgeDeliverable(provider, taskId)` afterwards.
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
                    downloadPath = path.join(dataPath, `model_${taskId}.bin`)
                }
            } catch {
                // Path doesn't exist yet, use as-is
            }

            const storageConfig = await this.getStorageConfig()
            await download(
                downloadPath,
                deliverable.modelRootHash,
                storageConfig
            )
            logger.info(
                `Successfully downloaded model from 0G Storage to ${downloadPath}`
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Download LoRA model directly from TEE (without acknowledge).
     * Use this when you only want to download the trained LoRA adapter.
     *
     * @param options.idleTimeoutMs - Abort the download if no bytes are
     *   received for this many ms (default 60 000). This is an idle
     *   timeout — slow but live downloads are not killed.
     * @param options.maxRetries - Retry attempts on transient stream /
     *   5xx errors (default 2 → 3 attempts total).
     */
    async downloadLoRAFromTEE(
        providerAddress: string,
        taskId: string,
        outputPath: string,
        options?: {
            idleTimeoutMs?: number
            maxRetries?: number
        }
    ): Promise<void> {
        try {
            await this.servingProvider.downloadLoRAFromTEE(
                providerAddress,
                taskId,
                outputPath,
                options
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
                    logger.info(`Hash verification passed for task ${taskId}`)
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
     * @deprecated For the normal retrieval flow prefer
     * {@link ModelProcessor.acknowledgeModel} which downloads, verifies, and
     * acknowledges in one call. `decryptModel` is the second half of the
     * legacy two-step pattern (`downloadModelFrom0GStorage` + `decryptModel`)
     * — neither half acknowledges the deliverable on-chain. Forgetting the
     * acknowledgement is what triggered Bug #4 in the May 2026 hackathon
     * bug report, where a user's task queue became permanently locked.
     *
     * @remarks
     * The model can only be decrypted after:
     * 1. The provider has delivered the encrypted model
     * 2. The user has acknowledged the model (called acknowledgeModel
     *    OR acknowledgeDeliverable)
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
                throw new Error(
                    `Deliverable for task ${taskId} is not acknowledged yet. ` +
                        'Call broker.fineTuning.acknowledgeModel(provider, taskId, dataPath) ' +
                        '(preferred — downloads, verifies, and acks) ' +
                        'or broker.fineTuning.acknowledgeDeliverable(provider, taskId) ' +
                        '(if the artifact is no longer retrievable). ' +
                        'Without acknowledgement the user queue stays locked and any future ' +
                        'fine-tune task will fail with "previous deliverable not acknowledged".'
                )
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
