import { throwFormattedError } from '../../common/utils'
import { MODEL_HASH_MAP, TOKEN_COUNTER_FILE_HASH, TOKEN_COUNTER_MERKLE_ROOT } from '../const'
import { download, upload } from '../zg-storage'
import { BrokerBase } from './base'
import { calculateTokenSizeViaPython, calculateTokenSizeViaExe } from '../token'

/**
 * DatasetProcessor handles dataset-related operations including upload, download,
 * and token calculation for fine-tuning tasks.
 */
export class DatasetProcessor extends BrokerBase {
    /**
     * Upload a dataset to 0G Storage for fine-tuning.
     *
     * @param privateKey - Private key for signing the upload transaction
     * @param dataPath - Local path to the dataset file
     * @param gasPrice - Optional gas price for the transaction
     * @param maxGasPrice - Optional maximum gas price
     * @throws Error if upload fails
     */
    async uploadDataset(
        privateKey: string,
        dataPath: string,
        gasPrice?: number,
        maxGasPrice?: number
    ): Promise<void> {
        try {
            await upload(privateKey, dataPath, gasPrice)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Download a dataset from 0G Storage.
     *
     * @param dataPath - Local path where the dataset will be saved
     * @param dataRoot - Root hash of the dataset in 0G Storage
     * @throws Error if download fails
     */
    async downloadDataset(dataPath: string, dataRoot: string): Promise<void> {
        try {
            await download(dataPath, dataRoot)
        } catch (error) {
            throwFormattedError(error)
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
    async calculateToken(
        datasetPath: string,
        usePython: boolean,
        preTrainedModelName: string,
        providerAddress?: string
    ): Promise<number> {
        try {
            let tokenizer: string
            let dataType: string

            // Determine tokenizer and data type from model configuration
            if (preTrainedModelName in MODEL_HASH_MAP) {
                tokenizer = MODEL_HASH_MAP[preTrainedModelName].tokenizer
                dataType = MODEL_HASH_MAP[preTrainedModelName].type
            } else {
                // Customized model - fetch from provider
                if (providerAddress === undefined) {
                    throw new Error(
                        'Provider address is required for customized model'
                    )
                }

                const model = await this.servingProvider.getCustomizedModel(
                    providerAddress,
                    preTrainedModelName
                )
                tokenizer = model.tokenizer
                dataType = model.dataType
            }

            // Calculate token size using specified method
            let dataSize = 0
            if (usePython) {
                dataSize = await calculateTokenSizeViaPython(
                    tokenizer,
                    datasetPath,
                    dataType
                )
            } else {
                dataSize = await calculateTokenSizeViaExe(
                    tokenizer,
                    datasetPath,
                    dataType,
                    TOKEN_COUNTER_MERKLE_ROOT,
                    TOKEN_COUNTER_FILE_HASH
                )
            }

            console.log(
                `The token size for the dataset ${datasetPath} is ${dataSize}`
            )

            return dataSize
        } catch (error) {
            throwFormattedError(error)
        }
    }
}
