"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelProcessor = void 0;
const utils_1 = require("../../common/utils");
const const_1 = require("../const");
const zg_storage_1 = require("../zg-storage");
const base_1 = require("./base");
const logger_1 = require("../../common/logger");
/**
 * ModelProcessor handles model-related operations including listing available models,
 * acknowledging model delivery, and decrypting fine-tuned models.
 */
class ModelProcessor extends base_1.BrokerBase {
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
    async listModel() {
        try {
            const services = await this.contract.listService();
            const customizedModels = [];
            for (const service of services) {
                if (service.models.length !== 0) {
                    const url = service.url;
                    const models = await this.servingProvider.getCustomizedModels(url);
                    for (const item of models) {
                        customizedModels.push([
                            item.name,
                            {
                                description: item.description,
                                provider: service.provider,
                            },
                        ]);
                    }
                }
            }
            return [Object.entries(const_1.MODEL_HASH_MAP), customizedModels];
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    /**
     * Acknowledge model delivery and download the trained model
     * @param providerAddress - The provider's address
     * @param taskId - The task ID
     * @param dataPath - Path to save the downloaded model
     * @param options - Optional configuration
     * @param options.gasPrice - Gas price for the transaction
     * @param options.downloadMethod - Download method: 'tee' (default) or '0g-storage'
     */
    async acknowledgeModel(providerAddress, taskId, dataPath, options) {
        try {
            const gasPrice = options?.gasPrice;
            const downloadMethod = options?.downloadMethod ?? 'tee';
            const deliverable = await this.contract.getDeliverable(providerAddress, taskId);
            logger_1.logger.debug(`deliverable: ${(0, utils_1.hexToRoots)(deliverable.modelRootHash)}`);
            if (!deliverable) {
                throw new Error('No deliverable found');
            }
            if (downloadMethod === '0g-storage') {
                // Download from 0G Storage with built-in hash verification
                await (0, zg_storage_1.download)(dataPath, (0, utils_1.hexToRoots)(deliverable.modelRootHash));
                logger_1.logger.info('Successfully downloaded model from 0G Storage');
            }
            else {
                // Download LoRA directly from TEE
                await this.servingProvider.downloadLoRAFromTEE(providerAddress, taskId, dataPath);
                logger_1.logger.info('Successfully downloaded LoRA model from TEE');
                // Note: TEE downloads are verified by the signature authentication.
                // The broker ensures only authorized users can download the model.
                // Additional hash verification could be added when the broker
                // provides a content hash in the response.
            }
            await this.contract.acknowledgeDeliverable(providerAddress, taskId, gasPrice);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    /**
     * Download model from 0G Storage (original method, for encrypted full model)
     */
    async downloadModelFrom0GStorage(providerAddress, taskId, dataPath) {
        try {
            const deliverable = await this.contract.getDeliverable(providerAddress, taskId);
            if (!deliverable) {
                throw new Error('No deliverable found');
            }
            await (0, zg_storage_1.download)(dataPath, (0, utils_1.hexToRoots)(deliverable.modelRootHash));
            logger_1.logger.info('Successfully downloaded model from 0G Storage');
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    /**
     * Download LoRA model directly from TEE (without acknowledge)
     * Use this when you only want to download the trained LoRA adapter
     */
    async downloadLoRAFromTEE(providerAddress, taskId, outputPath) {
        try {
            await this.servingProvider.downloadLoRAFromTEE(providerAddress, taskId, outputPath);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
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
    async decryptModel(providerAddress, taskId, encryptedModelPath, decryptedModelPath) {
        try {
            const [service, deliverable] = await Promise.all([
                this.contract.getService(providerAddress),
                this.contract.getDeliverable(providerAddress, taskId),
            ]);
            logger_1.logger.debug(`service, ${service}`);
            if (!deliverable) {
                throw new Error('No deliverable found');
            }
            if (!deliverable.acknowledged) {
                throw new Error('Deliverable not acknowledged yet');
            }
            if (!deliverable.encryptedSecret) {
                throw new Error('EncryptedSecret not found');
            }
            const secret = await (0, utils_1.eciesDecrypt)(this.contract.signer, deliverable.encryptedSecret);
            await (0, utils_1.aesGCMDecryptToFile)(secret, encryptedModelPath, decryptedModelPath, service.teeSignerAddress);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
        return;
    }
}
exports.ModelProcessor = ModelProcessor;
//# sourceMappingURL=model.js.map