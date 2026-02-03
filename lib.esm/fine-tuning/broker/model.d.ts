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
    acknowledgeModel(providerAddress: string, taskId: string, dataPath: string, gasPrice?: number): Promise<void>;
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
}
//# sourceMappingURL=model.d.ts.map