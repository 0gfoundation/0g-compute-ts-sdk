import { FineTuningServingContract } from '../contract'
import type { Wallet } from 'ethers'
import { ModelProcessor } from './model'
import { DatasetProcessor } from './dataset'
import type { FineTuningAccountDetail } from './service'
import { ServiceProcessor } from './service'
import type { LedgerBroker } from '../../ledger'
import { Provider } from '../provider/provider'
import type { Task } from '../provider/provider'
import { throwFormattedError } from '../../common/utils'
import { Verifier } from './verifier'
import type { VerificationResult } from './verifier'

export class FineTuningBroker {
    private signer: Wallet
    private fineTuningCA: string
    private ledger!: LedgerBroker
    private modelProcessor!: ModelProcessor
    private datasetProcessor!: DatasetProcessor
    private serviceProcessor!: ServiceProcessor
    private verifier!: Verifier
    private serviceProvider!: Provider
    private _gasPrice?: number
    private _maxGasPrice?: number
    private _step?: number

    constructor(
        signer: Wallet,
        fineTuningCA: string,
        ledger: LedgerBroker,
        gasPrice?: number,
        maxGasPrice?: number,
        step?: number
    ) {
        this.signer = signer
        this.fineTuningCA = fineTuningCA
        this.ledger = ledger
        this._gasPrice = gasPrice
        this._maxGasPrice = maxGasPrice
        this._step = step
    }

    async initialize() {
        let userAddress: string
        try {
            userAddress = await this.signer.getAddress()
        } catch (error) {
            throwFormattedError(error)
        }

        const contract = new FineTuningServingContract(
            this.signer,
            this.fineTuningCA,
            userAddress,
            this._gasPrice,
            this._maxGasPrice,
            this._step
        )

        this.serviceProvider = new Provider(contract)
        this.modelProcessor = new ModelProcessor(
            contract,
            this.ledger,
            this.serviceProvider
        )
        this.datasetProcessor = new DatasetProcessor(
            contract,
            this.ledger,
            this.serviceProvider
        )
        this.serviceProcessor = new ServiceProcessor(
            contract,
            this.ledger,
            this.serviceProvider
        )
        this.verifier = new Verifier(
            contract,
            this.ledger,
            this.serviceProvider
        )
    }

    public listService = async () => {
        try {
            return await this.serviceProcessor.listService()
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public getLockedTime = async () => {
        try {
            return await this.serviceProcessor.getLockTime()
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public getAccount = async (providerAddress: string) => {
        try {
            return await this.serviceProcessor.getAccount(providerAddress)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public getAccountWithDetail = async (
        providerAddress: string
    ): Promise<FineTuningAccountDetail> => {
        try {
            return await this.serviceProcessor.getAccountWithDetail(
                providerAddress
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public acknowledgeProviderSigner = async (
        providerAddress: string,
        gasPrice?: number
    ) => {
        try {
            return await this.serviceProcessor.acknowledgeProviderSigner(
                providerAddress,
                gasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public acknowledgeTEESignerByOwner = async (
        providerAddress: string,
        gasPrice?: number
    ) => {
        try {
            return await this.serviceProcessor.acknowledgeTEESignerByOwner(
                providerAddress,
                gasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public revokeTEESignerAcknowledgement = async (
        providerAddress: string,
        gasPrice?: number
    ) => {
        try {
            return await this.serviceProcessor.revokeTEESignerAcknowledgement(
                providerAddress,
                gasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public removeService = async (gasPrice?: number) => {
        try {
            return await this.serviceProcessor.removeService(gasPrice)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public listModel = () => {
        try {
            return this.modelProcessor.listModel()
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public modelUsage = (
        providerAddress: string,
        preTrainedModelName: string,
        output: string
    ) => {
        try {
            return this.serviceProcessor.modelUsage(
                providerAddress,
                preTrainedModelName,
                output
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public uploadDataset = async (
        dataPath: string,
        gasPrice?: number,
        maxGasPrice?: number
    ): Promise<void> => {
        try {
            await this.datasetProcessor.uploadDataset(
                this.signer.privateKey,
                dataPath,
                gasPrice || this._gasPrice,
                maxGasPrice || this._maxGasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public downloadDataset = async (
        dataPath: string,
        dataRoot: string
    ): Promise<void> => {
        try {
            await this.datasetProcessor.downloadDataset(dataPath, dataRoot)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public calculateToken = async (
        datasetPath: string,
        preTrainedModelName: string,
        usePython: boolean,
        providerAddress?: string
    ): Promise<void> => {
        try {
            await this.datasetProcessor.calculateToken(
                datasetPath,
                usePython,
                preTrainedModelName,
                providerAddress
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public createTask = async (
        providerAddress: string,
        preTrainedModelName: string,
        dataSize: number,
        datasetHash: string,
        trainingPath: string,
        gasPrice?: number
    ): Promise<string> => {
        try {
            return await this.serviceProcessor.createTask(
                providerAddress,
                preTrainedModelName,
                dataSize,
                datasetHash,
                trainingPath,
                gasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public cancelTask = async (
        providerAddress: string,
        taskID: string
    ): Promise<string> => {
        try {
            return await this.serviceProcessor.cancelTask(
                providerAddress,
                taskID
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public listTask = async (providerAddress: string): Promise<Task[]> => {
        try {
            return await this.serviceProcessor.listTask(providerAddress)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public getTask = async (
        providerAddress: string,
        taskID?: string
    ): Promise<Task> => {
        try {
            const task = await this.serviceProcessor.getTask(
                providerAddress,
                taskID
            )
            return task
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public getLog = async (
        providerAddress: string,
        taskID?: string
    ): Promise<string> => {
        try {
            return await this.serviceProcessor.getLog(providerAddress, taskID)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public acknowledgeModel = async (
        providerAddress: string,
        taskId: string,
        dataPath: string,
        gasPrice?: number
    ): Promise<void> => {
        try {
            return await this.modelProcessor.acknowledgeModel(
                providerAddress,
                taskId,
                dataPath,
                gasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public decryptModel = async (
        providerAddress: string,
        taskId: string,
        encryptedModelPath: string,
        decryptedModelPath: string
    ): Promise<void> => {
        try {
            return await this.modelProcessor.decryptModel(
                providerAddress,
                taskId,
                encryptedModelPath,
                decryptedModelPath
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

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
    public verifyService = async (
        providerAddress: string,
        outputDir: string = '.'
    ): Promise<VerificationResult> => {
        try {
            return await this.verifier.verifyService(
                providerAddress,
                outputDir
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }
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
export async function createFineTuningBroker(
    signer: Wallet,
    contractAddress: string,
    ledger: LedgerBroker,
    gasPrice?: number,
    maxGasPrice?: number,
    step?: number
): Promise<FineTuningBroker> {
    const broker = new FineTuningBroker(
        signer,
        contractAddress,
        ledger,
        gasPrice,
        maxGasPrice,
        step
    )
    try {
        await broker.initialize()
        return broker
    } catch (error) {
        throw error
    }
}
