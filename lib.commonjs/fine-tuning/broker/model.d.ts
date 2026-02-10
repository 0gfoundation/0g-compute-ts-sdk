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
     * Use this when you only want to download the trained LoRA adapter
     */
    downloadLoRAFromTEE(providerAddress: string, taskId: string, outputPath: string): Promise<void>;
    decryptModel(providerAddress: string, taskId: string, encryptedModelPath: string, decryptedModelPath: string): Promise<void>;
}
//# sourceMappingURL=model.d.ts.map