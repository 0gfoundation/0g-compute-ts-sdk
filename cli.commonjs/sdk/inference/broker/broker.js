"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InferenceBroker = void 0;
exports.createInferenceBroker = createInferenceBroker;
const contract_1 = require("../contract");
const request_1 = require("./request");
const response_1 = require("./response");
const verifier_1 = require("./verifier");
const account_1 = require("./account");
const model_1 = require("./model");
const storage_1 = require("../../common/storage");
const utils_1 = require("../../common/utils");
class InferenceBroker {
    requestProcessor;
    responseProcessor;
    verifier;
    accountProcessor;
    modelProcessor;
    signer;
    contractAddress;
    ledger;
    constructor(signer, contractAddress, ledger) {
        this.signer = signer;
        this.contractAddress = contractAddress;
        this.ledger = ledger;
    }
    async initialize() {
        let userAddress;
        try {
            userAddress = await this.signer.getAddress();
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
        const contract = new contract_1.InferenceServingContract(this.signer, this.contractAddress, userAddress);
        const metadata = new storage_1.Metadata();
        const cache = new storage_1.Cache();
        this.requestProcessor = new request_1.RequestProcessor(contract, metadata, cache, this.ledger);
        this.responseProcessor = new response_1.ResponseProcessor(contract, this.ledger, metadata, cache);
        this.accountProcessor = new account_1.AccountProcessor(contract, this.ledger, metadata, cache);
        this.modelProcessor = new model_1.ModelProcessor(contract, this.ledger, metadata, cache);
        this.verifier = new verifier_1.Verifier(contract, this.ledger, metadata, cache);
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
    listService = async (offset = 0, limit = 50, includeUnacknowledged = false) => {
        try {
            return await this.modelProcessor.listService(offset, limit, includeUnacknowledged);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
    /**
     * Retrieves the account information for a given provider address.
     *
     * @param {string} providerAddress - The address of the provider identifying the account.
     *
     * @returns A promise that resolves to the account information.
     *
     * @throws Will throw an error if the account retrieval process fails.
     */
    getAccount = async (providerAddress) => {
        try {
            return await this.accountProcessor.getAccount(providerAddress);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
    getAccountWithDetail = async (providerAddress) => {
        try {
            return await this.accountProcessor.getAccountWithDetail(providerAddress);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
    /**
     * checks if the user has acknowledged the provider signer.
     *
     * @param {string} providerAddress - The address of the provider.
     * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the user
     * has acknowledged the provider signer.
     * @throws Will throw an error if the acknowledgment check fails.
     */
    acknowledged = async (providerAddress) => {
        try {
            return await this.requestProcessor.userAcknowledged(providerAddress);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
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
    checkProviderSignerStatus = async (providerAddress, gasPrice) => {
        try {
            return await this.requestProcessor.checkProviderSignerStatus(providerAddress, gasPrice);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
    /**
     * Acknowledge TEE Signer (Contract Owner Only)
     *
     * This function allows the contract owner to acknowledge a provider's TEE signer.
     * The TEE signer address should already be set in the service registration.
     *
     * @param {string} providerAddress - The address of the provider
     * @throws Will throw an error if caller is not the contract owner or if acknowledgement fails.
     */
    acknowledgeProviderTEESigner = async (providerAddress, gasPrice) => {
        try {
            return await this.requestProcessor.ownerAcknowledgeTEESigner(providerAddress, gasPrice);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
    /**
     * Revoke TEE Signer Acknowledgement (Contract Owner Only)
     *
     * This function allows the contract owner to revoke a provider's TEE signer acknowledgement.
     *
     * @param {string} providerAddress - The address of the provider
     * @throws Will throw an error if caller is not the contract owner or if revocation fails.
     */
    revokeProviderTEESignerAcknowledgement = async (providerAddress, gasPrice) => {
        try {
            return await this.requestProcessor.ownerRevokeTEESignerAcknowledgement(providerAddress, gasPrice);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
    /**
     * Acknowledge the given provider address.
     *
     * @param {string} providerAddress - The address of the provider identifying the account.
     *
     *
     * @throws Will throw an error if failed to acknowledge.
     */
    acknowledgeProviderSigner = async (providerAddress, gasPrice) => {
        try {
            return await this.requestProcessor.acknowledgeProviderSigner(providerAddress, gasPrice);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
    /**
     * Downloads quote report data from the provider service to a specified file.
     *
     * @param {string} providerAddress - The address of the provider.
     * @param {string} outputPath - The file path where the quote report will be saved.
     *
     * @throws Will throw an error if failed to download the quote report.
     */
    downloadQuoteReport = async (providerAddress, outputPath) => {
        try {
            return await this.requestProcessor.downloadQuoteReport(providerAddress, outputPath);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
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
    getServiceMetadata = async (providerAddress) => {
        try {
            return await this.requestProcessor.getServiceMetadata(providerAddress);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
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
    getRequestHeaders = async (providerAddress, content) => {
        try {
            return await this.requestProcessor.getRequestHeaders(providerAddress, content);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
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
    processResponse = async (providerAddress, chatID, content) => {
        try {
            return await this.responseProcessor.processResponse(providerAddress, chatID, content);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
    /**
     * verifyService is used to verify the reliability of the service.
     *
     * @param {string} providerAddress - The address of the provider.
     *
     * @returns A <boolean | null> value. True indicates the service is reliable, otherwise it is unreliable.
     *
     * @throws An error if errors occur during the verification process.
     */
    verifyService = async (providerAddress, outputDir = '.') => {
        try {
            return await this.verifier.verifyService(providerAddress, outputDir);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
    /**
     * getSignerRaDownloadLink returns the download link for the Signer RA.
     *
     * It can be provided to users who wish to manually verify the Signer RA.
     *
     * @param {string} providerAddress - provider address.
     *
     * @returns Download link.
     */
    getSignerRaDownloadLink = async (providerAddress) => {
        try {
            return await this.verifier.getSignerRaDownloadLink(providerAddress);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
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
    getChatSignatureDownloadLink = async (providerAddress, chatID) => {
        try {
            return await this.verifier.getChatSignatureDownloadLink(providerAddress, chatID);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
    /**
     * Remove service (Provider owner only)
     *
     * This function allows the provider owner to remove their service from the contract.
     * Only the provider who registered the service can remove it.
     *
     * @param {number} gasPrice - Optional gas price for the transaction.
     * @throws Will throw an error if the caller is not the service owner or if removal fails.
     */
    removeService = async (gasPrice) => {
        try {
            return await this.modelProcessor.removeService(gasPrice);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
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
    updateService = async (options) => {
        try {
            return await this.modelProcessor.updateService(options);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
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
    revokeApiKey = async (providerAddress, tokenId, gasPrice) => {
        try {
            return await this.requestProcessor.revokeApiKey(providerAddress, tokenId, gasPrice);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
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
    revokeAllTokens = async (providerAddress, gasPrice) => {
        try {
            return await this.requestProcessor.revokeAllTokens(providerAddress, gasPrice);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    };
}
exports.InferenceBroker = InferenceBroker;
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
async function createInferenceBroker(signer, contractAddress, ledger) {
    const broker = new InferenceBroker(signer, contractAddress, ledger);
    try {
        await broker.initialize();
        return broker;
    }
    catch (error) {
        throw error;
    }
}
//# sourceMappingURL=broker.js.map