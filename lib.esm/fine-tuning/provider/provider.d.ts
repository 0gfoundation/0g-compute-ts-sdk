import type { FineTuningServingContract } from '../contract';
export interface Task {
    readonly id?: string;
    readonly createdAt?: string;
    readonly updatedAt?: string;
    userAddress: string;
    preTrainedModelHash: string;
    datasetHash: string;
    trainingParams: string;
    fee: string;
    nonce: string;
    signature: string;
    readonly progress?: string;
    readonly deliverIndex?: string;
    wait?: boolean;
}
export interface TdxQuoteResponse {
    rawReport: string;
    signingAddress: string;
}
export interface CustomizedModel {
    name: string;
    hash: string;
    image: string;
    dataType: string;
    trainingScript: string;
    description: string;
    tokenizer: string;
}
export declare class Provider {
    private contract;
    constructor(contract: FineTuningServingContract);
    private fetchJSON;
    private fetchText;
    getProviderUrl(providerAddress: string): Promise<string>;
    getQuote(providerAddress: string): Promise<TdxQuoteResponse>;
    createTask(providerAddress: string, task: Task): Promise<string>;
    cancelTask(providerAddress: string, signature: string, taskID: string): Promise<string>;
    getTask(providerAddress: string, userAddress: string, taskID: string): Promise<Task>;
    listTask(providerAddress: string, userAddress: string, latest?: boolean): Promise<Task[]>;
    getPendingTaskCounter(providerAddress: string): Promise<number>;
    getLog(providerAddress: string, userAddress: string, taskID: string): Promise<string>;
    getCustomizedModels(url: string): Promise<CustomizedModel[]>;
    getCustomizedModel(providerAddress: string, moduleName: string): Promise<CustomizedModel>;
    getCustomizedModelDetailUsage(providerAddress: string, moduleName: string, outputPath: string): Promise<void>;
    /**
     * Download LoRA model directly from TEE
     * This is a fallback when 0G Storage download fails
     * Requires authentication via signature
     */
    downloadLoRAFromTEE(providerAddress: string, taskId: string, outputPath: string): Promise<void>;
    /**
     * Upload dataset directly to TEE (broker)
     * Returns the dataset hash for use in task creation
     * This is the preferred method over 0G Storage for testing
     *
     * File size limits:
     * - Server default limit: 100MB (configurable via broker's maxUploadSize)
     * - Recommended: Use streaming for files > 10MB
     * - For very large datasets (> 100MB), consider using 0G Storage instead
     *
     * @param providerAddress - The provider's address
     * @param datasetPath - Path to the dataset file
     * @param options - Optional configuration
     * @param options.maxFileSizeMB - Maximum file size in MB (default: 100)
     * @param options.timeoutMs - Request timeout in milliseconds (default: calculated based on file size)
     */
    uploadDatasetToTEE(providerAddress: string, datasetPath: string, options?: {
        maxFileSizeMB?: number;
        timeoutMs?: number;
    }): Promise<{
        datasetHash: string;
        message: string;
    }>;
}
//# sourceMappingURL=provider.d.ts.map