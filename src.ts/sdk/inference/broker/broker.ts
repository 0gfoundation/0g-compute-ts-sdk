import type { AccountStructOutput } from '../contract'
import { InferenceServingContract } from '../contract'
import type { JsonRpcSigner, Wallet } from 'ethers'
import { RequestProcessor } from './request'
import { ResponseProcessor } from './response'
import type { VerificationResult } from './verifier'
import { Verifier } from './verifier'
import { AccountProcessor } from './account'
import { ModelProcessor } from './model'
import { Cache, Metadata } from '../../common/storage'
import type { LedgerBroker } from '../../ledger'
import { throwFormattedError } from '../../common/utils'

export class InferenceBroker {
    public requestProcessor!: RequestProcessor
    public responseProcessor!: ResponseProcessor
    public verifier!: Verifier
    public accountProcessor!: AccountProcessor
    public modelProcessor!: ModelProcessor

    private signer: JsonRpcSigner | Wallet
    private contractAddress: string
    private ledger: LedgerBroker

    constructor(
        signer: JsonRpcSigner | Wallet,
        contractAddress: string,
        ledger: LedgerBroker
    ) {
        this.signer = signer
        this.contractAddress = contractAddress
        this.ledger = ledger
    }

    async initialize() {
        let userAddress: string
        try {
            userAddress = await this.signer.getAddress()
        } catch (error) {
            throwFormattedError(error)
        }
        const contract = new InferenceServingContract(
            this.signer,
            this.contractAddress,
            userAddress
        )
        const metadata = new Metadata()
        const cache = new Cache()
        this.requestProcessor = new RequestProcessor(
            contract,
            metadata,
            cache,
            this.ledger
        )
        this.responseProcessor = new ResponseProcessor(
            contract,
            this.ledger,
            metadata,
            cache
        )
        this.accountProcessor = new AccountProcessor(
            contract,
            this.ledger,
            metadata,
            cache
        )
        this.modelProcessor = new ModelProcessor(
            contract,
            this.ledger,
            metadata,
            cache
        )
        this.verifier = new Verifier(contract, this.ledger, metadata, cache)
    }

    /**
     * Retrieves a list of services from the contract.
     *
     * @param {number} offset - The offset for pagination (default: 0).
     * @param {number} limit - The limit for pagination (default: 50).
     * @param {boolean} includeUnacknowledged - Whether to include providers whose TEE signer is not acknowledged (default: false).
     * @returns {Promise<ServiceStructOutput[]>} A promise that resolves to an array of ServiceStructOutput objects.
     * @throws An error if the service list cannot be retrieved.
     */
    public listService = async (
        offset: number = 0,
        limit: number = 50,
        includeUnacknowledged: boolean = false
    ) => {
        try {
            return await this.modelProcessor.listService(
                offset,
                limit,
                includeUnacknowledged
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Retrieves the account information for a given provider address.
     *
     * @param {string} providerAddress - The address of the provider identifying the account.
     *
     * @returns A promise that resolves to the account information.
     *
     * @throws Will throw an error if the account retrieval process fails.
     */
    public getAccount = async (
        providerAddress: string
    ): Promise<AccountStructOutput> => {
        try {
            return await this.accountProcessor.getAccount(providerAddress)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    public getAccountWithDetail = async (
        providerAddress: string
    ): Promise<
        [AccountStructOutput, { amount: bigint; remainTime: bigint }[]]
    > => {
        try {
            return await this.accountProcessor.getAccountWithDetail(
                providerAddress
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * checks if the user has acknowledged the provider signer.
     *
     * @param {string} providerAddress - The address of the provider.
     * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the user
     * has acknowledged the provider signer.
     * @throws Will throw an error if the acknowledgment check fails.
     */
    public acknowledged = async (providerAddress: string) => {
        try {
            return await this.requestProcessor.userAcknowledged(providerAddress)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Check Provider Signer Status
     *
     * Checks if the provider's TEE signer has been acknowledged by the contract owner.
     * This replaces the old user-level acknowledgement system.
     *
     * @param {string} providerAddress - The address of the provider identifying the account.
     * @param {number} gasPrice - Optional gas price for the transaction.
     * @returns Promise<{isAcknowledged: boolean, teeSignerAddress: string, needsAccount: boolean}>
     *
     * @throws Will throw an error if failed to check status.
     */
    public checkProviderSignerStatus = async (
        providerAddress: string,
        gasPrice?: number
    ): Promise<{
        isAcknowledged: boolean
        teeSignerAddress: string
    }> => {
        try {
            return await this.requestProcessor.checkProviderSignerStatus(
                providerAddress,
                gasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Acknowledge TEE Signer (Contract Owner Only)
     *
     * This function allows the contract owner to acknowledge a provider's TEE signer.
     * The TEE signer address should already be set in the service registration.
     *
     * @param {string} providerAddress - The address of the provider
     * @throws Will throw an error if caller is not the contract owner or if acknowledgement fails.
     */
    public acknowledgeProviderTEESigner = async (
        providerAddress: string,
        gasPrice?: number
    ) => {
        try {
            return await this.requestProcessor.ownerAcknowledgeTEESigner(
                providerAddress,
                gasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Revoke TEE Signer Acknowledgement (Contract Owner Only)
     *
     * This function allows the contract owner to revoke a provider's TEE signer acknowledgement.
     *
     * @param {string} providerAddress - The address of the provider
     * @throws Will throw an error if caller is not the contract owner or if revocation fails.
     */
    public revokeProviderTEESignerAcknowledgement = async (
        providerAddress: string,
        gasPrice?: number
    ) => {
        try {
            return await this.requestProcessor.ownerRevokeTEESignerAcknowledgement(
                providerAddress,
                gasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Acknowledge the given provider address.
     *
     * @param {string} providerAddress - The address of the provider identifying the account.
     *
     *
     * @throws Will throw an error if failed to acknowledge.
     */
    public acknowledgeProviderSigner = async (
        providerAddress: string,
        gasPrice?: number
    ) => {
        try {
            return await this.requestProcessor.acknowledgeProviderSigner(
                providerAddress,
                gasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Downloads quote report data from the provider service to a specified file.
     *
     * @param {string} providerAddress - The address of the provider.
     * @param {string} outputPath - The file path where the quote report will be saved.
     *
     * @throws Will throw an error if failed to download the quote report.
     */
    public downloadQuoteReport = async (
        providerAddress: string,
        outputPath: string
    ) => {
        try {
            return await this.requestProcessor.downloadQuoteReport(
                providerAddress,
                outputPath
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Generates request metadata for the provider service.
     * Includes:
     * 1. Request endpoint for the provider service
     * 2. Model information for the provider service
     *
     * @param {string} providerAddress - The address of the provider.
     *
     * @returns { endpoint, model } - Object containing endpoint and model.
     *
     * @throws An error if errors occur during the processing of the request.
     */
    public getServiceMetadata = async (
        providerAddress: string
    ): Promise<{
        endpoint: string
        model: string
    }> => {
        try {
            return await this.requestProcessor.getServiceMetadata(
                providerAddress
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * getRequestHeaders generates billing-related headers for the request
     * when the user uses the provider service.
     *
     * In the 0G Serving system, a request with valid billing headers
     * is considered a settlement proof and will be used by the provider
     * for contract settlement.
     *
     * @param {string} providerAddress - The address of the provider.
     * @param {string} content - The content being billed. For example, in a chatbot service, it is the text input by the user.
     *
     * @returns headers. Records information such as the request fee and user signature.
     *
     * @example
     *
     * const { endpoint, model } = await broker.getServiceMetadata(
     *   providerAddress,
     *   serviceName,
     * );
     *
     * const headers = await broker.getServiceMetadata(
     *   providerAddress,
     *   serviceName,
     *   content,
     * );
     *
     * const openai = new OpenAI({
     *   baseURL: endpoint,
     *   apiKey: "",
     * });
     *
     * const completion = await openai.chat.completions.create(
     *   {
     *     messages: [{ role: "system", content }],
     *     model,
     *   },
     *   headers: {
     *     ...headers,
     *   },
     * );
     *
     * @throws An error if errors occur during the processing of the request.
     */
    public getRequestHeaders = async (
        providerAddress: string,
        content?: string
    ) => {
        try {
            return await this.requestProcessor.getRequestHeaders(
                providerAddress,
                content
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * processResponse is used after the user successfully obtains a response from the provider service.
     *
     * It caches the estimated fee based on usage data, which will be used by getRequestHeaders to determine
     * when to top up the sub-account balance. Additionally, if the service is verifiable, input the chat ID
     * from the response and processResponse will determine the validity of the returned content by checking
     * the provider service's response and corresponding signature associated with the chat ID.
     *
     * Note: Fee caching is only useful for long-running SDK instances (e.g., web servers). In CLI usage,
     * the cache is cleared on each invocation, so automatic balance management doesn't apply.
     *
     * @param {string} providerAddress - The address of the provider.
     * @param {string} chatID - Only for verifiable services. The chat session ID returned by the provider
     * in the `ZG-Res-Key` HTTP response header. Extract this header from the provider's response and pass
     * it here for signature verification. For providers that don't include this header, fall back to using
     * the completion ID. Example: `const chatID = response.headers.get('ZG-Res-Key') || completion.id`
     * @param {string} content - Usage data from the response. For chatbot/speech-to-text: JSON string with
     * token usage; For text-to-image: can be empty. This is used to calculate and cache estimated fees.
     *
     * @returns A boolean value. True indicates the returned content is valid, otherwise it is invalid.
     * null if no chatID provided (verification skipped).
     *
     * @throws An error if any issues occur during the processing of the response.
     */
    public processResponse = async (
        providerAddress: string,
        chatID?: string,
        content?: string
    ): Promise<boolean | null> => {
        try {
            return await this.responseProcessor.processResponse(
                providerAddress,
                chatID,
                content
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * verifyService is used to verify the reliability of the service.
     *
     * @param {string} providerAddress - The address of the provider.
     *
     * @returns A <boolean | null> value. True indicates the service is reliable, otherwise it is unreliable.
     *
     * @throws An error if errors occur during the verification process.
     */
    public verifyService = async (
        providerAddress: string,
        outputDir: string = '.'
    ): Promise<VerificationResult | null> => {
        try {
            return await this.verifier.verifyService(providerAddress, outputDir)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * getSignerRaDownloadLink returns the download link for the Signer RA.
     *
     * It can be provided to users who wish to manually verify the Signer RA.
     *
     * @param {string} providerAddress - provider address.
     *
     * @returns Download link.
     */
    public getSignerRaDownloadLink = async (providerAddress: string) => {
        try {
            return await this.verifier.getSignerRaDownloadLink(providerAddress)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * getChatSignatureDownloadLink returns the download link for the signature of a single chat.
     *
     * It can be provided to users who wish to manually verify the content of a single chat.
     *
     * @param {string} providerAddress - provider address.
     * @param {string} chatID - ID of the chat.
     *
     * @remarks To verify the chat signature, use the following code:
     *
     * ```typescript
     * const messageHash = ethers.hashMessage(messageToBeVerified)
     * const recoveredAddress = ethers.recoverAddress(messageHash, signature)
     * const isValid = recoveredAddress.toLowerCase() === signingAddress.toLowerCase()
     * ```
     *
     * @returns Download link.
     */
    public getChatSignatureDownloadLink = async (
        providerAddress: string,
        chatID: string
    ) => {
        try {
            return await this.verifier.getChatSignatureDownloadLink(
                providerAddress,
                chatID
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Remove service (Provider owner only)
     *
     * This function allows the provider owner to remove their service from the contract.
     * Only the provider who registered the service can remove it.
     *
     * @param {number} gasPrice - Optional gas price for the transaction.
     * @throws Will throw an error if the caller is not the service owner or if removal fails.
     */
    public removeService = async (gasPrice?: number): Promise<void> => {
        try {
            return await this.modelProcessor.removeService(gasPrice)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Update service (Provider owner only)
     *
     * This function allows the provider owner to update their existing service.
     * All parameters are optional - if not provided, the current value is preserved.
     *
     * @param options - Update options
     * @param options.url - New service URL
     * @param options.model - New model name
     * @param options.inputPrice - New input price (in neuron, the smallest unit)
     * @param options.outputPrice - New output price (in neuron, the smallest unit)
     * @param options.gasPrice - Optional gas price for the transaction
     * @throws Will throw an error if the caller is not the service owner or if update fails.
     */
    public updateService = async (options: {
        url?: string
        model?: string
        inputPrice?: bigint
        outputPrice?: bigint
        gasPrice?: number
    }): Promise<void> => {
        try {
            return await this.modelProcessor.updateService(options)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Revoke a specific API key (persistent token) by its tokenId.
     *
     * Sets the corresponding bit in the revokedBitmap for this tokenId.
     * The API key will be immediately invalid, but the tokenId slot remains occupied
     * until revokeAllTokens() is called.
     *
     * Note: Ephemeral tokens (tokenId=255) cannot be individually revoked.
     * Use revokeAllTokens() to revoke ephemeral tokens.
     *
     * @param {string} providerAddress - The provider address
     * @param {number} tokenId - Token ID to revoke (0-254)
     * @param {number} gasPrice - Optional gas price for the transaction
     *
     * @throws Will throw an error if tokenId is 255 (ephemeral token) or if revocation fails.
     *
     * @example
     * ```typescript
     * // Revoke token ID 5 for a provider
     * await broker.inference.revokeApiKey('0x123...', 5)
     * // Token ID 5 is now revoked and the API key is invalid
     * ```
     */
    public revokeApiKey = async (
        providerAddress: string,
        tokenId: number,
        gasPrice?: number
    ): Promise<void> => {
        try {
            return await this.requestProcessor.revokeApiKey(
                providerAddress,
                tokenId,
                gasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Revoke all API keys (both ephemeral and persistent tokens) for a provider.
     *
     * Increments the generation counter and resets the revokedBitmap.
     * All existing API keys (including ephemeral tokens) will be immediately invalid.
     * Reclaims all 255 tokenId slots for reuse.
     *
     * @param {string} providerAddress - The provider address
     * @param {number} gasPrice - Optional gas price for the transaction
     *
     * @throws Will throw an error if revocation fails.
     *
     * @example
     * ```typescript
     * // Revoke all tokens for a provider
     * await broker.inference.revokeAllTokens('0x123...')
     * // All API keys for this provider are now invalid
     * // All 255 tokenId slots are now available for reuse
     * ```
     */
    public revokeAllTokens = async (
        providerAddress: string,
        gasPrice?: number
    ): Promise<void> => {
        try {
            return await this.requestProcessor.revokeAllTokens(
                providerAddress,
                gasPrice
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }
}

/**
 * createInferenceBroker is used to initialize ZGServingUserBroker
 *
 * @param signer - Signer from ethers.js.
 * @param contractAddress - 0G Serving contract address, use default address if not provided.
 *
 * @returns broker instance.
 *
 * @throws An error if the broker cannot be initialized.
 */
export async function createInferenceBroker(
    signer: JsonRpcSigner | Wallet,
    contractAddress: string,
    ledger: LedgerBroker
): Promise<InferenceBroker> {
    const broker = new InferenceBroker(signer, contractAddress, ledger)
    try {
        await broker.initialize()
        return broker
    } catch (error) {
        throw error
    }
}
