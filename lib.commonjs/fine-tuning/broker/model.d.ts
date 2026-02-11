import { BrokerBase } from './base';
/**
 * ModelProcessor handles model-related operations including listing available models,
 * acknowledging model delivery, and decrypting fine-tuned models.
 */
export declare class ModelProcessor extends BrokerBase {
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
    listModel(): Promise<[string, {
        [key: string]: string;
    }][][]>;
    /**
     * Acknowledge model delivery and download the trained model
     * @param providerAddress - The provider's address
     * @param taskId - The task ID
     * @param dataPath - Path to save the downloaded model
     * @param options - Optional configuration
     * @param options.gasPrice - Gas price for the transaction
     * @param options.downloadMethod - Download method: 'tee' (default) or '0g-storage'
     */
    acknowledgeModel(providerAddress: string, taskId: string, dataPath: string, options?: {
        gasPrice?: number;
        downloadMethod?: 'tee' | '0g-storage';
    }): Promise<void>;
    /**
     * Download model from 0G Storage (original method, for encrypted full model)
     */
    downloadModelFrom0GStorage(providerAddress: string, taskId: string, dataPath: string): Promise<void>;
    /**
     * Download LoRA model directly from TEE (without acknowledge)
     * Use this when you only want to download the trained LoRA adapter.
     * Verifies the downloaded file's hash against the on-chain modelRootHash.
     */
    downloadLoRAFromTEE(providerAddress: string, taskId: string, outputPath: string): Promise<void>;
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
    decryptModel(providerAddress: string, taskId: string, encryptedModelPath: string, decryptedModelPath: string): Promise<void>;
    /**
     * Verify the hash of a downloaded model file against the on-chain modelRootHash.
     * The broker computes modelRootHash as keccak256(encryptedFileBytes).
     *
     * @param filePath - Path to the downloaded file (may be a directory or file)
     * @param taskId - Task ID for logging
     * @param expectedHash - Expected hash from the contract deliverable (hex string)
     * @throws Error if hash verification fails
     */
    private verifyDownloadedModelHash;
}
//# sourceMappingURL=model.d.ts.map