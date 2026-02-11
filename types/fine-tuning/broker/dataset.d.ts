import { BrokerBase } from './base';
/**
 * DatasetProcessor handles dataset-related operations including upload, download,
 * and token calculation for fine-tuning tasks.
 */
export declare class DatasetProcessor extends BrokerBase {
    /**
     * Upload a dataset to 0G Storage for fine-tuning.
     *
     * @param privateKey - Private key for signing the upload transaction
     * @param dataPath - Local path to the dataset file
     * @param gasPrice - Optional gas price for the transaction
     * @param maxGasPrice - Optional maximum gas price
     * @returns Root hash of the uploaded dataset in 0G Storage
     * @throws Error if upload fails
     */
    uploadDataset(privateKey: string, dataPath: string, gasPrice?: number, maxGasPrice?: number): Promise<string>;
    /**
     * Download a dataset from 0G Storage.
     *
     * @param dataPath - Local path where the dataset will be saved
     * @param dataRoot - Root hash of the dataset in 0G Storage
     * @throws Error if download fails
     */
    downloadDataset(dataPath: string, dataRoot: string): Promise<void>;
    /**
     * Calculate the token size of a dataset for cost estimation.
     * Supports both Python-based and executable-based token counting.
     *
     * @param datasetPath - Local path to the dataset file
     * @param usePython - Whether to use Python for token counting (true) or executable (false)
     * @param preTrainedModelName - Name of the pre-trained model (determines tokenizer)
     * @param providerAddress - Optional provider address (required for customized models)
     * @returns Token count of the dataset
     * @throws Error if provider address is not provided for customized models
     *
     * @example
     * ```typescript
     * // Calculate tokens for a standard model
     * await broker.fineTuning.calculateToken(
     *   './dataset.jsonl',
     *   false,
     *   'meta-llama/Llama-2-7b-chat-hf'
     * );
     *
     * // Calculate tokens for a customized model
     * await broker.fineTuning.calculateToken(
     *   './dataset.jsonl',
     *   false,
     *   'my-custom-model',
     *   '0x1234...'
     * );
     * ```
     */
    calculateToken(datasetPath: string, usePython: boolean, preTrainedModelName: string, providerAddress?: string): Promise<number>;
}
//# sourceMappingURL=dataset.d.ts.map