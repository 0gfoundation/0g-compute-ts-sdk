"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelProcessor = void 0;
const tslib_1 = require("tslib");
const utils_1 = require("../../common/utils");
const const_1 = require("../const");
const zg_storage_1 = require("../zg-storage");
const base_1 = require("./base");
const logger_1 = require("../../common/logger");
const ethers_1 = require("ethers");
const promises_1 = tslib_1.__importDefault(require("fs/promises"));
const path_1 = tslib_1.__importDefault(require("path"));
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
     * @param options.downloadMethod - Download method: 'auto' (default, try 0G Storage first then TEE fallback), 'tee', or '0g-storage'
     */
    async acknowledgeModel(providerAddress, taskId, dataPath, options) {
        try {
            const gasPrice = options?.gasPrice;
            const downloadMethod = options?.downloadMethod ?? 'auto';
            const deliverable = await this.contract.getDeliverable(providerAddress, taskId);
            logger_1.logger.debug(`deliverable: ${deliverable.modelRootHash}`);
            if (!deliverable) {
                throw new Error('No deliverable found');
            }
            // Resolve storage download path: 0G Storage client needs a file path, not a directory
            let storageDownloadPath = dataPath;
            try {
                const stats = await promises_1.default.stat(dataPath);
                if (stats.isDirectory()) {
                    storageDownloadPath = path_1.default.join(dataPath, `model_${taskId}.bin`);
                }
            }
            catch {
                // Path doesn't exist yet, use as-is (will be created as a file)
            }
            if (downloadMethod === 'tee') {
                // Download LoRA directly from TEE
                await this.servingProvider.downloadLoRAFromTEE(providerAddress, taskId, dataPath);
                logger_1.logger.info('Successfully downloaded LoRA model from TEE');
                // Verify hash of downloaded file against on-chain modelRootHash
                await this.verifyDownloadedModelHash(dataPath, taskId, deliverable.modelRootHash);
            }
            else if (downloadMethod === '0g-storage') {
                // Download from 0G Storage with built-in hash verification
                await (0, zg_storage_1.download)(storageDownloadPath, deliverable.modelRootHash);
                logger_1.logger.info(`Successfully downloaded model from 0G Storage to ${storageDownloadPath}`);
            }
            else {
                // Auto mode: try 0G Storage first, fallback to TEE
                try {
                    logger_1.logger.info('Downloading model from 0G Storage...');
                    await (0, zg_storage_1.download)(storageDownloadPath, deliverable.modelRootHash);
                    logger_1.logger.info(`Successfully downloaded model from 0G Storage to ${storageDownloadPath}`);
                }
                catch (storageErr) {
                    logger_1.logger.warn(`0G Storage download failed: ${storageErr}. Falling back to TEE download...`);
                    await this.servingProvider.downloadLoRAFromTEE(providerAddress, taskId, dataPath);
                    logger_1.logger.info('Successfully downloaded LoRA model from TEE (fallback)');
                    // Verify hash of downloaded file against on-chain modelRootHash
                    await this.verifyDownloadedModelHash(dataPath, taskId, deliverable.modelRootHash);
                }
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
            // Resolve path: 0G Storage client needs a file path, not a directory
            let downloadPath = dataPath;
            try {
                const stats = await promises_1.default.stat(dataPath);
                if (stats.isDirectory()) {
                    downloadPath = path_1.default.join(dataPath, `model_${taskId}.bin`);
                }
            }
            catch {
                // Path doesn't exist yet, use as-is
            }
            await (0, zg_storage_1.download)(downloadPath, deliverable.modelRootHash);
            logger_1.logger.info(`Successfully downloaded model from 0G Storage to ${downloadPath}`);
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
     * Verify the hash of a downloaded model file against the expected on-chain hash.
     */
    async verifyDownloadedModelHash(filePath, taskId, expectedHash) {
        try {
            let actualFile = filePath;
            try {
                const stats = await promises_1.default.stat(filePath);
                if (stats.isDirectory()) {
                    const files = await promises_1.default.readdir(filePath);
                    const loraFile = files.find((f) => f.startsWith('lora_model_') ||
                        f.endsWith('.data') ||
                        f.endsWith('.zip'));
                    if (loraFile) {
                        actualFile = `${filePath}/${loraFile}`;
                    }
                    else if (files.length === 1) {
                        actualFile = `${filePath}/${files[0]}`;
                    }
                    else {
                        logger_1.logger.warn(`Cannot determine downloaded file in directory ${filePath}, skipping hash verification`);
                        return;
                    }
                }
            }
            catch (err) {
                logger_1.logger.warn(`Downloaded file not found at ${filePath}, skipping hash verification`);
                return;
            }
            const fileData = await promises_1.default.readFile(actualFile);
            const computedHash = ethers_1.ethers.keccak256(fileData);
            if (expectedHash &&
                expectedHash !==
                    '0x0000000000000000000000000000000000000000000000000000000000000000') {
                if (computedHash !== expectedHash) {
                    logger_1.logger.warn(`Hash mismatch for task ${taskId}: expected ${expectedHash}, got ${computedHash}`);
                }
                else {
                    logger_1.logger.info(`Hash verification passed for task ${taskId}`);
                }
            }
            else {
                logger_1.logger.info(`No on-chain hash to verify against for task ${taskId}, computed hash: ${computedHash}`);
            }
        }
        catch (err) {
            logger_1.logger.warn(`Hash verification failed: ${err}`);
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