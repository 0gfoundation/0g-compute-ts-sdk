"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetProcessor = void 0;
const utils_1 = require("../../common/utils");
const const_1 = require("../const");
const zg_storage_1 = require("../zg-storage");
const base_1 = require("./base");
const token_1 = require("../token");
/**
 * DatasetProcessor handles dataset-related operations including upload, download,
 * and token calculation for fine-tuning tasks.
 */
class DatasetProcessor extends base_1.BrokerBase {
    /**
     * Upload a dataset to 0G Storage for fine-tuning.
     *
     * @param privateKey - Private key for signing the upload transaction
     * @param dataPath - Local path to the dataset file
     * @param gasPrice - Optional gas price for the transaction
     * @param maxGasPrice - Optional maximum gas price
     * @throws Error if upload fails
     */
    async uploadDataset(privateKey, dataPath, gasPrice, maxGasPrice) {
        try {
            await (0, zg_storage_1.upload)(privateKey, dataPath, gasPrice);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    /**
     * Download a dataset from 0G Storage.
     *
     * @param dataPath - Local path where the dataset will be saved
     * @param dataRoot - Root hash of the dataset in 0G Storage
     * @throws Error if download fails
     */
    async downloadDataset(dataPath, dataRoot) {
        try {
            await (0, zg_storage_1.download)(dataPath, dataRoot);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
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
    async calculateToken(datasetPath, usePython, preTrainedModelName, providerAddress) {
        try {
            let tokenizer;
            let dataType;
            // Determine tokenizer and data type from model configuration
            if (preTrainedModelName in const_1.MODEL_HASH_MAP) {
                tokenizer = const_1.MODEL_HASH_MAP[preTrainedModelName].tokenizer;
                dataType = const_1.MODEL_HASH_MAP[preTrainedModelName].type;
            }
            else {
                // Customized model - fetch from provider
                if (providerAddress === undefined) {
                    throw new Error('Provider address is required for customized model');
                }
                const model = await this.servingProvider.getCustomizedModel(providerAddress, preTrainedModelName);
                tokenizer = model.tokenizer;
                dataType = model.dataType;
            }
            // Calculate token size using specified method
            let dataSize = 0;
            if (usePython) {
                dataSize = await (0, token_1.calculateTokenSizeViaPython)(tokenizer, datasetPath, dataType);
            }
            else {
                dataSize = await (0, token_1.calculateTokenSizeViaExe)(tokenizer, datasetPath, dataType, const_1.TOKEN_COUNTER_MERKLE_ROOT, const_1.TOKEN_COUNTER_FILE_HASH);
            }
            console.log(`The token size for the dataset ${datasetPath} is ${dataSize}`);
            return dataSize;
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
}
exports.DatasetProcessor = DatasetProcessor;
//# sourceMappingURL=dataset.js.map