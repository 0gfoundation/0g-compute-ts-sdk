"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZGServingUserBrokerBase = exports.SessionMode = exports.EPHEMERAL_TOKEN_MAX_DURATION = exports.EPHEMERAL_TOKEN_ID = void 0;
const tslib_1 = require("tslib");
const extractor_1 = require("../extractor");
const utils_1 = require("../../common/utils");
const fs = tslib_1.__importStar(require("fs/promises"));
const storage_1 = require("../../common/storage");
const ethers_1 = require("ethers");
const logger_1 = require("../../common/logger");
const textToImage_1 = require("../extractor/textToImage");
const speech_to_text_1 = require("../extractor/speech-to-text");
/**
 * Special token ID reserved for ephemeral tokens.
 * Ephemeral tokens (tokenId=255) are not checked against the revoked bitmap,
 * only generation check applies. This allows unlimited ephemeral tokens without
 * consuming the 0-254 tokenId quota.
 */
exports.EPHEMERAL_TOKEN_ID = 255;
/**
 * Maximum duration for ephemeral tokens (24 hours in milliseconds).
 * Ephemeral tokens must have an expiration time and cannot exceed this duration.
 */
exports.EPHEMERAL_TOKEN_MAX_DURATION = 24 * 60 * 60 * 1000; // 24 hours
/**
 * Session mode for token generation
 */
var SessionMode;
(function (SessionMode) {
    /** Ephemeral token: uses tokenId=255, not individually revocable, no quota consumption */
    SessionMode["Ephemeral"] = "ephemeral";
    /** Persistent token: uses tokenId 0-254, individually revocable, consumes quota */
    SessionMode["Persistent"] = "persistent";
})(SessionMode || (exports.SessionMode = SessionMode = {}));
class ZGServingUserBrokerBase {
    contract;
    metadata;
    cache;
    checkAccountThreshold = BigInt(100);
    topUpTriggerThreshold = BigInt(1000000);
    topUpTargetThreshold = BigInt(2000000);
    ledger;
    constructor(contract, ledger, metadata, cache) {
        this.contract = contract;
        this.ledger = ledger;
        this.metadata = metadata;
        this.cache = cache;
    }
    async getService(providerAddress, useCache = true) {
        const key = storage_1.CacheKeyHelpers.getServiceKey(providerAddress);
        const cachedSvc = await this.cache.getItem(key);
        if (cachedSvc && useCache) {
            return cachedSvc;
        }
        try {
            const svc = await this.contract.getService(providerAddress);
            logger_1.logger.debug('Fetched service info from contract:', svc);
            await this.cache.setItem(key, svc, 10 * 60 * 1000, storage_1.CacheValueTypeEnum.Service);
            return svc;
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async getQuote(providerAddress) {
        try {
            const service = await this.getService(providerAddress);
            const url = service.url;
            const endpoint = `${url}/v1/quote`;
            const rawReport = await this.fetchText(endpoint, {
                method: 'GET',
            });
            return {
                rawReport,
                signingAddress: '',
            };
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async downloadQuoteReport(providerAddress, outputPath) {
        try {
            const service = await this.getService(providerAddress);
            const url = service.url;
            const endpoint = `${url}/v1/quote`;
            const quoteString = await this.fetchText(endpoint, {
                method: 'GET',
            });
            await fs.writeFile(outputPath, quoteString);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async userAcknowledged(providerAddress) {
        const userAddress = this.contract.getUserAddress();
        const key = storage_1.CacheKeyHelpers.getUserAckKey(userAddress, providerAddress);
        const cachedSvc = await this.cache.getItem(key);
        if (cachedSvc) {
            return true;
        }
        try {
            const account = await this.contract.getAccount(providerAddress);
            if (account.acknowledged) {
                await this.cache.setItem(key, '', 10 * 60 * 1000, storage_1.CacheValueTypeEnum.Other);
                return true;
            }
            else {
                return false;
            }
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async fetchText(endpoint, options) {
        try {
            const response = await fetch(endpoint, options);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const buffer = await response.arrayBuffer();
            return Buffer.from(buffer).toString('utf-8');
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async getExtractor(providerAddress, useCache = true) {
        try {
            const svc = await this.getService(providerAddress, useCache);
            const extractor = this.createExtractor(svc);
            return extractor;
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    createExtractor(svc) {
        switch (svc.serviceType) {
            case 'chatbot':
                return new extractor_1.ChatBot(svc);
            case 'text-to-image':
                return new textToImage_1.TextToImage(svc);
            case 'speech-to-text':
                return new speech_to_text_1.SpeechToText(svc);
            default:
                throw new Error('Unknown service type');
        }
    }
    a0giToNeuron(value) {
        const valueStr = value.toFixed(18);
        const parts = valueStr.split('.');
        // Handle integer part
        const integerPart = parts[0];
        let integerPartAsBigInt = BigInt(integerPart) * BigInt(10 ** 18);
        // Handle fractional part if it exists
        if (parts.length > 1) {
            let fractionalPart = parts[1];
            while (fractionalPart.length < 18) {
                fractionalPart += '0';
            }
            if (fractionalPart.length > 18) {
                fractionalPart = fractionalPart.slice(0, 18); // Truncate to avoid overflow
            }
            const fractionalPartAsBigInt = BigInt(fractionalPart);
            integerPartAsBigInt += fractionalPartAsBigInt;
        }
        return integerPartAsBigInt;
    }
    neuronToA0gi(value) {
        const divisor = BigInt(10 ** 18);
        const integerPart = value / divisor;
        const remainder = value % divisor;
        const decimalPart = Number(remainder) / Number(divisor);
        return Number(integerPart) + decimalPart;
    }
    generateNonce() {
        if (typeof window !== 'undefined' && window.crypto) {
            // Browser environment - use Web Crypto API
            const array = new Uint8Array(16);
            window.crypto.getRandomValues(array);
            return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
        }
        else {
            // Node.js or other environment - use timestamp-based nonce
            const timestamp = Date.now();
            const random = Math.random();
            const randomStr = random.toString(36).substring(2, 15);
            return `${timestamp}-${randomStr}`.padEnd(32, '0');
        }
    }
    /**
     * Get account info from cache or contract.
     * @param providerAddress - The provider address
     */
    async getAccountInfo(providerAddress) {
        const userAddress = this.contract.getUserAddress();
        const cacheKey = `account_info_${userAddress}_${providerAddress}`;
        // Try cache first
        const cached = (await this.cache.getItem(cacheKey));
        if (cached) {
            return {
                generation: cached.generation,
                revokedBitmap: BigInt(cached.revokedBitmap),
            };
        }
        // Fetch from contract
        try {
            const account = await this.contract.getAccount(providerAddress);
            // Handle case where account exists but fields don't exist (pre-upgrade accounts)
            const info = {
                generation: account.generation != null ? Number(account.generation) : 0,
                revokedBitmap: account.revokedBitmap ?? BigInt(0),
            };
            // Cache for 5 minutes
            await this.cache.setItem(cacheKey, {
                generation: info.generation,
                revokedBitmap: info.revokedBitmap.toString(),
            }, 5 * 60 * 1000, storage_1.CacheValueTypeEnum.Other);
            return info;
        }
        catch {
            // Account may not exist yet
            return {
                generation: 0,
                revokedBitmap: BigInt(0),
            };
        }
    }
    /**
     * Generate a new session token with generation and tokenId for revocation support
     * @param providerAddress - The provider address
     * @param options - Optional configuration for token generation
     * @returns The cached session with token, signature, and raw message
     */
    async generateSessionToken(providerAddress, options) {
        const userAddress = this.contract.getUserAddress();
        const timestamp = Date.now();
        const mode = options?.mode ?? SessionMode.Ephemeral;
        const nonce = this.generateNonce();
        // Determine duration and expiresAt based on mode
        let duration;
        let expiresAt;
        if (mode === SessionMode.Ephemeral) {
            // Ephemeral tokens MUST have an expiration time and cannot exceed 24 hours
            duration = options?.duration ?? exports.EPHEMERAL_TOKEN_MAX_DURATION;
            if (duration <= 0) {
                // Force ephemeral tokens to have expiration
                duration = exports.EPHEMERAL_TOKEN_MAX_DURATION;
            }
            if (duration > exports.EPHEMERAL_TOKEN_MAX_DURATION) {
                throw new Error(`Ephemeral token duration cannot exceed 24 hours (${exports.EPHEMERAL_TOKEN_MAX_DURATION}ms)`);
            }
            expiresAt = timestamp + duration;
        }
        else {
            // Persistent tokens can have any duration, including never expires (0)
            duration = options?.duration ?? 0;
            expiresAt = duration > 0 ? timestamp + duration : 0;
        }
        // Determine tokenId based on mode
        let tokenId;
        let generation;
        if (mode === SessionMode.Ephemeral) {
            // Ephemeral tokens always use tokenId=255
            tokenId = exports.EPHEMERAL_TOKEN_ID;
            const accountInfo = await this.getAccountInfo(providerAddress);
            generation = accountInfo.generation;
        }
        else {
            // Persistent tokens: find available tokenId from bitmap
            // CLI usage is single-instance, so cache is fine
            const accountInfo = await this.getAccountInfo(providerAddress);
            generation = accountInfo.generation;
            tokenId = this.findAvailableTokenId(accountInfo.revokedBitmap);
        }
        const token = {
            address: userAddress,
            provider: providerAddress,
            timestamp,
            expiresAt,
            nonce,
            generation,
            tokenId,
        };
        // Create message to be signed
        const message = JSON.stringify(token);
        // Create hash using the same method as signRequest in encrypt.ts
        const messageHash = (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(message));
        // Sign using the same pattern as signRequest: signMessage with toBeArray
        const signature = await this.contract.signer.signMessage(Buffer.from(messageHash.slice(2), 'hex'));
        const session = {
            token,
            signature,
            rawMessage: message,
        };
        // Only cache ephemeral sessions
        if (mode === SessionMode.Ephemeral) {
            const cacheKey = storage_1.CacheKeyHelpers.getSessionTokenKey(userAddress, providerAddress);
            await this.cache.setItem(cacheKey, session, duration, storage_1.CacheValueTypeEnum.Session);
        }
        return session;
    }
    /**
     * Find the smallest available tokenId from the revoked bitmap.
     * @param revokedBitmap - The bitmap of revoked tokenIds
     * @returns The smallest available tokenId (0-254)
     */
    findAvailableTokenId(revokedBitmap) {
        // Find the smallest available tokenId (0-254)
        // tokenId 255 is reserved for ephemeral tokens
        for (let tokenId = 0; tokenId < exports.EPHEMERAL_TOKEN_ID; tokenId++) {
            const bit = BigInt(1) << BigInt(tokenId);
            if ((revokedBitmap & bit) === BigInt(0)) {
                // This tokenId is not revoked, it's available
                return tokenId;
            }
        }
        // All 255 tokenIds are revoked
        throw new Error('API Key limit reached (255). Call revokeAllTokens() to reset.');
    }
    /**
     * Get or create an ephemeral session token for the provider.
     * Ephemeral tokens use tokenId=255 and don't consume the API key quota.
     * @param providerAddress - The provider address
     * @returns The cached or newly generated session
     */
    async getOrCreateSession(providerAddress) {
        const userAddress = this.contract.getUserAddress();
        const cacheKey = storage_1.CacheKeyHelpers.getSessionTokenKey(userAddress, providerAddress);
        const cached = (await this.cache.getItem(cacheKey));
        if (cached) {
            // Ephemeral tokens always have expiration time
            // Check if token has enough time remaining (at least 1 hour)
            const hasTimeRemaining = cached.token.expiresAt > Date.now() + 60 * 60 * 1000;
            if (hasTimeRemaining) {
                return cached;
            }
        }
        // Generate new ephemeral session
        return await this.generateSessionToken(providerAddress, {
            mode: SessionMode.Ephemeral,
        });
    }
    /**
     * Get request headers with an ephemeral session token.
     * This is the default method for SDK usage - it uses ephemeral tokens
     * that don't consume the API key quota.
     * @param providerAddress - The provider address
     * @returns Headers with Authorization
     */
    async getHeader(providerAddress) {
        // Check if provider is acknowledged - this is still necessary
        if (!(await this.userAcknowledged(providerAddress))) {
            throw new Error('Provider signer is not acknowledged');
        }
        // Get or create ephemeral session token
        const session = await this.getOrCreateSession(providerAddress);
        return {
            Authorization: `Bearer app-sk-${Buffer.from(session.rawMessage + '|' + session.signature).toString('base64')}`,
        };
    }
    // ==================== API Key Management ====================
    /**
     * Create a new API Key (persistent token).
     * API Keys consume tokenId quota (0-254) and can be individually revoked.
     * The tokenId is determined by finding the smallest available ID from the contract's bitmap.
     * @param providerAddress - The provider address
     * @param options - Optional configuration
     * @returns The API key information including the raw token
     */
    async createApiKey(providerAddress, options) {
        const session = await this.generateSessionToken(providerAddress, {
            mode: SessionMode.Persistent,
            duration: options?.expiresIn ?? 0, // Default: never expires
        });
        const rawToken = `app-sk-${Buffer.from(session.rawMessage + '|' + session.signature).toString('base64')}`;
        return {
            tokenId: session.token.tokenId,
            createdAt: session.token.timestamp,
            expiresAt: session.token.expiresAt,
            rawToken,
        };
    }
    /**
     * Revoke an API Key by its tokenId.
     * This calls the contract to revoke the token.
     * @param providerAddress - The provider address
     * @param tokenId - The token ID to revoke (0-254)
     * @param gasPrice - Optional gas price
     */
    async revokeApiKey(providerAddress, tokenId, gasPrice) {
        if (tokenId === exports.EPHEMERAL_TOKEN_ID) {
            throw new Error('Cannot revoke ephemeral token individually. Use revokeAllTokens() instead.');
        }
        // Revoke on contract
        await this.contract.revokeToken(providerAddress, tokenId, gasPrice);
    }
    /**
     * Revoke all tokens (both ephemeral and persistent).
     * This increments the generation, invalidating all existing tokens.
     * @param providerAddress - The provider address
     * @param gasPrice - Optional gas price
     */
    async revokeAllTokens(providerAddress, gasPrice) {
        // Revoke on contract
        await this.contract.revokeAllTokens(providerAddress, gasPrice);
        // Clear ephemeral session cache
        await this.clearEphemeralSession(providerAddress);
    }
    /**
     * Clear ephemeral session cache
     */
    async clearEphemeralSession(providerAddress) {
        const userAddress = this.contract.getUserAddress();
        const cacheKey = storage_1.CacheKeyHelpers.getSessionTokenKey(userAddress, providerAddress);
        // Remove by setting to null with short TTL
        await this.cache.setItem(cacheKey, null, 1, storage_1.CacheValueTypeEnum.Other);
    }
    async calculateFee(extractor, content) {
        const svc = await extractor.getSvcInfo();
        const outputCount = await extractor.getOutputCount(content);
        const inputCount = await extractor.getInputCount(content);
        return (BigInt(outputCount) * BigInt(svc.outputPrice) +
            BigInt(inputCount) * BigInt(svc.inputPrice));
    }
    async updateCachedFee(provider, fee) {
        try {
            const cacheFundKey = storage_1.CacheKeyHelpers.getCachedFeeKey(provider);
            const balanceCheckKey = storage_1.CacheKeyHelpers.getCheckBalanceKey(provider);
            const accumulatedCheckFee = (await this.cache.getItem(balanceCheckKey)) || BigInt(0);
            await this.cache.setItem(balanceCheckKey, BigInt(accumulatedCheckFee) + fee, 1 * 60 * 1000, storage_1.CacheValueTypeEnum.BigInt);
            const curFee = (await this.cache.getItem(cacheFundKey)) || BigInt(0);
            await this.cache.setItem(cacheFundKey, BigInt(curFee) + fee, 1 * 60 * 1000, storage_1.CacheValueTypeEnum.BigInt);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async clearBalanceCheckFee(provider) {
        try {
            const key = storage_1.CacheKeyHelpers.getCheckBalanceKey(provider);
            await this.cache.setItem(key, BigInt(0), 1 * 60 * 1000, storage_1.CacheValueTypeEnum.BigInt);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async clearCacheFee(provider) {
        try {
            const key = storage_1.CacheKeyHelpers.getCachedFeeKey(provider);
            await this.cache.setItem(key, BigInt(0), 1 * 60 * 1000, storage_1.CacheValueTypeEnum.BigInt);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    /**
     * Transfer fund from ledger if fund in the inference account is less than a topUpTriggerThreshold * (inputPrice + outputPrice)
     */
    async topUpAccountIfNeeded(provider, content, gasPrice) {
        try {
            // Exit early if running in browser environment
            if (typeof window !== 'undefined' &&
                typeof window.document !== 'undefined') {
                return;
            }
            const extractor = await this.getExtractor(provider);
            const svc = await extractor.getSvcInfo();
            // Calculate target and trigger thresholds
            // Minimum target threshold is 1 0G (10^18 neuron)
            const minTargetThreshold = BigInt(10 ** 18);
            const calculatedTargetThreshold = this.topUpTargetThreshold *
                (BigInt(svc.inputPrice) + BigInt(svc.outputPrice));
            const targetThreshold = calculatedTargetThreshold > minTargetThreshold
                ? calculatedTargetThreshold
                : minTargetThreshold;
            const triggerThreshold = this.topUpTriggerThreshold *
                (BigInt(svc.inputPrice) + BigInt(svc.outputPrice));
            // Check if it's the first round
            const isFirstRound = (await this.cache.getItem(storage_1.CACHE_KEYS.FIRST_ROUND)) !== 'false';
            if (isFirstRound) {
                await this.handleFirstRound(provider, triggerThreshold, targetThreshold, gasPrice);
                return;
            }
            let newFee = BigInt(0);
            if (content) {
                newFee = await this.calculateFee(extractor, content);
                await this.updateCachedFee(provider, newFee);
            }
            // Check if we need to check the account
            if (!(await this.shouldCheckAccount(svc)))
                return;
            await this.clearBalanceCheckFee(provider);
            // Re-check the account balance
            let needTransfer = false;
            try {
                const acc = await this.contract.getAccount(provider);
                const lockedFund = acc.balance - acc.pendingRefund;
                logger_1.logger.debug(`Locked fund for provider ${provider}: ${lockedFund.toString()}, trigger threshold: ${triggerThreshold.toString()}`);
                needTransfer = lockedFund < triggerThreshold;
            }
            catch {
                // Account doesn't exist, need to create it by transferring funds
                needTransfer = true;
            }
            if (needTransfer) {
                try {
                    await this.ledger.transferFund(provider, 'inference', targetThreshold, gasPrice);
                    await this.clearCacheFee(provider);
                }
                catch (error) {
                    // Check if it's an insufficient balance error
                    const errorMessage = error?.message?.toLowerCase() || '';
                    if (errorMessage.includes('insufficient')) {
                        console.warn(`Warning: To ensure stable service from the provider, ${targetThreshold} neuron needs to be transferred from the balance, but the current balance is insufficient.`);
                        return;
                    }
                    console.warn(`Warning: Failed to transfer funds: ${error?.message || error}`);
                    return;
                }
            }
        }
        catch (error) {
            console.warn(`Warning: Top up account failed: ${error?.message || error}`);
        }
    }
    async handleFirstRound(provider, triggerThreshold, targetThreshold, gasPrice) {
        let needTransfer = false;
        try {
            const acc = await this.contract.getAccount(provider);
            const lockedFund = acc.balance - acc.pendingRefund;
            needTransfer = lockedFund < triggerThreshold;
        }
        catch {
            needTransfer = true;
        }
        if (needTransfer) {
            try {
                await this.ledger.transferFund(provider, 'inference', targetThreshold, gasPrice);
            }
            catch (error) {
                // Check if it's an insufficient balance error
                const errorMessage = error?.message?.toLowerCase() || '';
                if (errorMessage.includes('insufficient')) {
                    console.warn(`Warning: To ensure stable service from the provider, ${targetThreshold} neuron needs to be transferred from the balance, but the current balance is insufficient.`);
                    return;
                }
                console.warn(`Warning: Failed to transfer funds: ${error?.message || error}`);
                return;
            }
        }
        // Mark the first round as complete
        await this.cache.setItem(storage_1.CACHE_KEYS.FIRST_ROUND, 'false', 10000000 * 60 * 1000, storage_1.CacheValueTypeEnum.Other);
    }
    /**
     * Check the cache fund for this provider, return true if the fund is above checkAccountThreshold * (inputPrice + outputPrice)
     * @param svc
     */
    async shouldCheckAccount(svc) {
        try {
            const key = storage_1.CacheKeyHelpers.getCheckBalanceKey(svc.provider);
            const accumulatedFund = (await this.cache.getItem(key)) || BigInt(0);
            logger_1.logger.debug(`Accumulated fund for provider before checking balance ${svc.provider}: ${accumulatedFund.toString()} and threshold to check account balance: ${this.checkAccountThreshold *
                (svc.inputPrice + svc.outputPrice)}`);
            return (accumulatedFund >
                this.checkAccountThreshold * (svc.inputPrice + svc.outputPrice));
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
}
exports.ZGServingUserBrokerBase = ZGServingUserBrokerBase;
//# sourceMappingURL=base.js.map