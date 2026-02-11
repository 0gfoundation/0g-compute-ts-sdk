import type { Wallet } from 'ethers';
import type { FineTuningAccountDetail } from './service';
import type { LedgerBroker } from '../../ledger';
import type { Task } from '../provider/provider';
import type { VerificationResult } from './verifier';
export declare class FineTuningBroker {
    private signer;
    private fineTuningCA;
    private ledger;
    private modelProcessor;
    private datasetProcessor;
    private serviceProcessor;
    private verifier;
    private serviceProvider;
    private _gasPrice?;
    private _maxGasPrice?;
    private _step?;
    constructor(signer: Wallet, fineTuningCA: string, ledger: LedgerBroker, gasPrice?: number, maxGasPrice?: number, step?: number);
    initialize(): Promise<void>;
    listService: () => Promise<import("..").FineTuningServiceStructOutput[]>;
    getLockedTime: () => Promise<bigint>;
    getAccount: (providerAddress: string) => Promise<import("../contract").AccountDetailsStructOutput>;
    getAccountWithDetail: (providerAddress: string) => Promise<FineTuningAccountDetail>;
    acknowledgeProviderSigner: (providerAddress: string, gasPrice?: number) => Promise<void>;
    acknowledgeTEESignerByOwner: (providerAddress: string, gasPrice?: number) => Promise<void>;
    revokeTEESignerAcknowledgement: (providerAddress: string, gasPrice?: number) => Promise<void>;
    removeService: (gasPrice?: number) => Promise<void>;
    listModel: () => Promise<[string, {
        [key: string]: string;
    }][][]>;
    modelUsage: (providerAddress: string, preTrainedModelName: string, output: string) => Promise<void>;
    uploadDataset: (dataPath: string, gasPrice?: number, maxGasPrice?: number) => Promise<string>;
    downloadDataset: (dataPath: string, dataRoot: string) => Promise<void>;
    calculateToken: (datasetPath: string, preTrainedModelName: string, usePython: boolean, providerAddress?: string) => Promise<void>;
    createTask: (providerAddress: string, preTrainedModelName: string, datasetHash: string, trainingPath: string, gasPrice?: number) => Promise<string>;
    cancelTask: (providerAddress: string, taskID: string) => Promise<string>;
    listTask: (providerAddress: string) => Promise<Task[]>;
    getTask: (providerAddress: string, taskID?: string) => Promise<Task>;
    getLog: (providerAddress: string, taskID?: string) => Promise<string>;
    acknowledgeModel: (providerAddress: string, taskId: string, dataPath: string, options?: {
        gasPrice?: number;
        downloadMethod?: "tee" | "0g-storage" | "auto";
    }) => Promise<void>;
    /**
     * Download LoRA model directly from TEE
     */
    downloadLoRAFromTEE: (providerAddress: string, taskId: string, outputPath: string) => Promise<void>;
    /**
     * Upload dataset directly to TEE (broker)
     * Returns the dataset hash for use in task creation
     * This is the preferred method for testing
     */
    uploadDatasetToTEE: (providerAddress: string, datasetPath: string) => Promise<{
        datasetHash: string;
        message: string;
    }>;
    /**
     * Download encrypted model from 0G Storage (for advanced use cases)
     */
    downloadModelFrom0GStorage: (providerAddress: string, taskId: string, dataPath: string) => Promise<void>;
    decryptModel: (providerAddress: string, taskId: string, encryptedModelPath: string, decryptedModelPath: string) => Promise<void>;
    /**
     * Verify fine-tuning service TEE attestation (DStack only)
     *
     * Downloads and verifies the TEE attestation report to ensure the provider
     * is running in a trusted execution environment. This simplified version
     * only supports DStack (Intel TDX) verification.
     *
     * @param providerAddress - The provider address to verify
     * @param outputDir - Directory to save attestation reports (default: current directory)
     * @returns Promise resolving to verification results with report paths and status
     *
     * @example
     * ```typescript
     * const broker = await createFineTuningBroker(signer, contractAddress, ledger);
     *
     * // Verify a provider's TEE attestation
     * const result = await broker.verifyService(
     *   '0x1234...',
     *   './attestation-reports'
     * );
     *
     * if (result.success && result.reportsData) {
     *   console.log('Verification successful');
     *   console.log('Reports saved to:', result.outputDirectory);
     * }
     * ```
     *
     * @remarks
     * This method downloads the attestation report and performs automated checks:
     * 1. TEE Signer Address Verification - matches contract signer with report signer
     * 2. Docker Compose Verification - validates compose hash against event log
     *
     * After automated checks, users must manually verify:
     * 1. Docker images using sigstore (https://search.sigstore.dev/)
     * 2. Run dstack-verifier for complete quote verification
     *
     * @throws {Error} If provider doesn't exist or attestation report cannot be retrieved
     */
    verifyService: (providerAddress: string, outputDir?: string) => Promise<VerificationResult>;
}
/**
 * createFineTuningBroker is used to initialize ZGServingUserBroker
 *
 * @param signer - Signer from ethers.js.
 * @param contractAddress - 0G Serving contract address, use default address if not provided.
 * @param ledger - Ledger broker instance.
 * @param gasPrice - Gas price for transactions. If not provided, the gas price will be calculated automatically.
 *
 * @returns broker instance.
 *
 * @throws An error if the broker cannot be initialized.
 */
export declare function createFineTuningBroker(signer: Wallet, contractAddress: string, ledger: LedgerBroker, gasPrice?: number, maxGasPrice?: number, step?: number): Promise<FineTuningBroker>;
//# sourceMappingURL=broker.d.ts.map