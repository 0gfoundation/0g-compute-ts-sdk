import type { InferenceServingContract } from '../contract'
import { ChatBot } from '../extractor'
import type { Extractor } from '../extractor'
import type { ServiceStructOutput } from '../contract'
import type { ServingRequestHeaders } from './request'
import { throwFormattedError } from '../../common/utils'
import * as fs from 'fs/promises'
import type { Cache, Metadata } from '../../common/storage'
import {
    CacheValueTypeEnum,
    CACHE_KEYS,
    CacheKeyHelpers,
} from '../../common/storage'
import type { LedgerBroker } from '../../ledger'
import { keccak256, toUtf8Bytes } from 'ethers'
import { logger } from '../../common/logger'
import { TextToImage } from '../extractor/textToImage'
import { SpeechToText } from '../extractor/speech-to-text'
import { ImageEditing } from '../extractor/imageEditing'

export interface TdxQuoteResponse {
    rawReport: string
    signingAddress: string
}

/**
 * Special token ID reserved for ephemeral tokens.
 * Ephemeral tokens (tokenId=255) are not checked against the revoked bitmap,
 * only generation check applies. This allows unlimited ephemeral tokens without
 * consuming the 0-254 tokenId quota.
 */
export const EPHEMERAL_TOKEN_ID = 255

/**
 * Maximum duration for ephemeral tokens (24 hours in milliseconds).
 * Ephemeral tokens must have an expiration time and cannot exceed this duration.
 */
export const EPHEMERAL_TOKEN_MAX_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Session mode for token generation
 */
export enum SessionMode {
    /** Ephemeral token: uses tokenId=255, not individually revocable, no quota consumption */
    Ephemeral = 'ephemeral',
    /** Persistent token: uses tokenId 0-254, individually revocable, consumes quota */
    Persistent = 'persistent',
}

export interface SessionToken {
    address: string
    provider: string
    timestamp: number
    expiresAt: number // 0 = never expires
    nonce: string
    generation: number // Token generation for batch revocation
    tokenId: number // 0-254: persistent tokens, 255: ephemeral token
}

export interface CachedSession {
    token: SessionToken
    signature: string
    rawMessage: string
}

/**
 * API Key information for persistent tokens
 */
export interface ApiKeyInfo {
    /** Token ID (0-254) */
    tokenId: number
    /** Creation timestamp in milliseconds */
    createdAt: number
    /** Expiration timestamp in milliseconds, 0 = never expires */
    expiresAt: number
    /** The raw token string for Authorization header */
    rawToken: string
}

/**
 * Options for generating session tokens
 */
export interface SessionTokenOptions {
    /** Session mode: ephemeral (default) or persistent */
    mode?: SessionMode
    /** Duration in milliseconds. 0 = never expires. Default: 24 hours for ephemeral */
    duration?: number
    /** Specific tokenId to use for persistent mode (0-254). If not provided, will find available one from bitmap */
    tokenId?: number
}

export abstract class ZGServingUserBrokerBase {
    protected contract: InferenceServingContract
    protected metadata: Metadata
    protected cache: Cache

    private checkAccountThreshold = BigInt(100)

    // Threshold factors for chatbot/speech-to-text/zgStorage
    // Should align with ResponseFeeReservationFactor in provider broker
    private topUpTriggerThreshold = BigInt(1000000)
    private topUpTargetThreshold = BigInt(2000000)

    // Threshold factors for text-to-image/image-editing
    // Should align with ResponseFeeReservationFactorForImage in provider broker
    private topUpTriggerThresholdForImage = BigInt(100)
    private topUpTargetThresholdForImage = BigInt(200)
    protected ledger: LedgerBroker

    constructor(
        contract: InferenceServingContract,
        ledger: LedgerBroker,
        metadata: Metadata,
        cache: Cache
    ) {
        this.contract = contract
        this.ledger = ledger
        this.metadata = metadata
        this.cache = cache
    }

    protected async getService(
        providerAddress: string,
        useCache = true
    ): Promise<ServiceStructOutput> {
        const key = CacheKeyHelpers.getServiceKey(providerAddress)
        const cachedSvc = await this.cache.getItem(key)
        if (cachedSvc && useCache) {
            return cachedSvc
        }

        try {
            const svc = await this.contract.getService(providerAddress)
            logger.debug('Fetched service info from contract:', svc)
            await this.cache.setItem(
                key,
                svc,
                10 * 60 * 1000,
                CacheValueTypeEnum.Service
            )
            return svc
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async getQuote(providerAddress: string): Promise<TdxQuoteResponse> {
        try {
            const service = await this.getService(providerAddress)
            const url = service.url

            const endpoint = `${url}/v1/quote`

            const rawReport = await this.fetchText(endpoint, {
                method: 'GET',
            })

            return {
                rawReport,
                signingAddress: '',
            } as TdxQuoteResponse
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async downloadQuoteReport(
        providerAddress: string,
        outputPath: string
    ): Promise<void> {
        try {
            const service = await this.getService(providerAddress)

            const url = service.url
            const endpoint = `${url}/v1/quote`

            const quoteString = await this.fetchText(endpoint, {
                method: 'GET',
            })

            await fs.writeFile(outputPath, quoteString)
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async userAcknowledged(providerAddress: string): Promise<boolean> {
        const userAddress = this.contract.getUserAddress()
        const key = CacheKeyHelpers.getUserAckKey(userAddress, providerAddress)
        const cachedSvc = await this.cache.getItem(key)
        if (cachedSvc) {
            return true
        }

        try {
            const account = await this.contract.getAccount(providerAddress)
            if (account.acknowledged) {
                await this.cache.setItem(
                    key,
                    '',
                    10 * 60 * 1000,
                    CacheValueTypeEnum.Other
                )

                return true
            } else {
                return false
            }
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async fetchText(endpoint: string, options: RequestInit): Promise<string> {
        try {
            const response = await fetch(endpoint, options)
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }
            const buffer = await response.arrayBuffer()
            return Buffer.from(buffer).toString('utf-8')
        } catch (error) {
            throwFormattedError(error)
        }
    }

    protected async getExtractor(
        providerAddress: string,
        useCache = true
    ): Promise<Extractor> {
        try {
            const svc = await this.getService(providerAddress, useCache)
            const extractor = this.createExtractor(svc)
            return extractor
        } catch (error) {
            throwFormattedError(error)
        }
    }

    protected createExtractor(svc: ServiceStructOutput): Extractor {
        switch (svc.serviceType) {
            case 'chatbot':
                return new ChatBot(svc)
            case 'text-to-image':
                return new TextToImage(svc)
            case 'image-editing':
                return new ImageEditing(svc)
            case 'speech-to-text':
                return new SpeechToText(svc)
            default:
                throw new Error('Unknown service type')
        }
    }

    protected a0giToNeuron(value: number): bigint {
        const valueStr = value.toFixed(18)
        const parts = valueStr.split('.')

        // Handle integer part
        const integerPart = parts[0]
        let integerPartAsBigInt = BigInt(integerPart) * BigInt(10 ** 18)

        // Handle fractional part if it exists
        if (parts.length > 1) {
            let fractionalPart = parts[1]
            while (fractionalPart.length < 18) {
                fractionalPart += '0'
            }
            if (fractionalPart.length > 18) {
                fractionalPart = fractionalPart.slice(0, 18) // Truncate to avoid overflow
            }

            const fractionalPartAsBigInt = BigInt(fractionalPart)
            integerPartAsBigInt += fractionalPartAsBigInt
        }

        return integerPartAsBigInt
    }

    protected neuronToA0gi(value: bigint): number {
        const divisor = BigInt(10 ** 18)
        const integerPart = value / divisor
        const remainder = value % divisor
        const decimalPart = Number(remainder) / Number(divisor)
        return Number(integerPart) + decimalPart
    }

    private generateNonce(): string {
        if (typeof window !== 'undefined' && window.crypto) {
            // Browser environment - use Web Crypto API
            const array = new Uint8Array(16)
            window.crypto.getRandomValues(array)
            return Array.from(array, (byte) =>
                byte.toString(16).padStart(2, '0')
            ).join('')
        } else {
            // Node.js or other environment - use timestamp-based nonce
            const timestamp = Date.now()
            const random = Math.random()
            const randomStr = random.toString(36).substring(2, 15)
            return `${timestamp}-${randomStr}`.padEnd(32, '0')
        }
    }

    /**
     * Get account info from cache or contract.
     * @param providerAddress - The provider address
     */
    private async getAccountInfo(
        providerAddress: string
    ): Promise<{ generation: number; revokedBitmap: bigint }> {
        const userAddress = this.contract.getUserAddress()
        const cacheKey = `account_info_${userAddress}_${providerAddress}`

        // Try cache first
        const cached = (await this.cache.getItem(cacheKey)) as {
            generation: number
            revokedBitmap: string // stored as string for serialization
        } | null
        if (cached) {
            return {
                generation: cached.generation,
                revokedBitmap: BigInt(cached.revokedBitmap),
            }
        }

        // Fetch from contract
        try {
            const account = await this.contract.getAccount(providerAddress)
            // Handle case where account exists but fields don't exist (pre-upgrade accounts)
            const info = {
                generation:
                    account.generation != null ? Number(account.generation) : 0,
                revokedBitmap: account.revokedBitmap ?? BigInt(0),
            }

            // Cache for 5 minutes
            await this.cache.setItem(
                cacheKey,
                {
                    generation: info.generation,
                    revokedBitmap: info.revokedBitmap.toString(),
                },
                5 * 60 * 1000,
                CacheValueTypeEnum.Other
            )

            return info
        } catch {
            // Account may not exist yet
            return {
                generation: 0,
                revokedBitmap: BigInt(0),
            }
        }
    }

    /**
     * Generate a new session token with generation and tokenId for revocation support
     * @param providerAddress - The provider address
     * @param options - Optional configuration for token generation
     * @returns The cached session with token, signature, and raw message
     */
    async generateSessionToken(
        providerAddress: string,
        options?: SessionTokenOptions
    ): Promise<CachedSession> {
        const userAddress = this.contract.getUserAddress()
        const timestamp = Date.now()
        const mode = options?.mode ?? SessionMode.Ephemeral
        const nonce = this.generateNonce()

        // Determine duration and expiresAt based on mode
        let duration: number
        let expiresAt: number

        if (mode === SessionMode.Ephemeral) {
            // Ephemeral tokens MUST have an expiration time and cannot exceed 24 hours
            duration = options?.duration ?? EPHEMERAL_TOKEN_MAX_DURATION
            if (duration <= 0) {
                // Force ephemeral tokens to have expiration
                duration = EPHEMERAL_TOKEN_MAX_DURATION
            }
            if (duration > EPHEMERAL_TOKEN_MAX_DURATION) {
                throw new Error(
                    `Ephemeral token duration cannot exceed 24 hours (${EPHEMERAL_TOKEN_MAX_DURATION}ms)`
                )
            }
            expiresAt = timestamp + duration
        } else {
            // Persistent tokens can have any duration, including never expires (0)
            duration = options?.duration ?? 0
            expiresAt = duration > 0 ? timestamp + duration : 0
        }

        // Determine tokenId based on mode
        let tokenId: number
        let generation: number

        if (mode === SessionMode.Ephemeral) {
            // Ephemeral tokens always use tokenId=255
            tokenId = EPHEMERAL_TOKEN_ID
            const accountInfo = await this.getAccountInfo(providerAddress)
            generation = accountInfo.generation
        } else {
            // Persistent tokens: use provided tokenId or find available one from bitmap
            const accountInfo = await this.getAccountInfo(providerAddress)
            generation = accountInfo.generation

            if (options?.tokenId !== undefined) {
                // Use the specified tokenId
                tokenId = options.tokenId
                if (tokenId < 0 || tokenId >= EPHEMERAL_TOKEN_ID) {
                    throw new Error(
                        `Invalid tokenId: ${tokenId}. Must be between 0 and ${
                            EPHEMERAL_TOKEN_ID - 1
                        }`
                    )
                }
                // Check if this tokenId is already revoked
                const bit = BigInt(1) << BigInt(tokenId)
                if ((accountInfo.revokedBitmap & bit) !== BigInt(0)) {
                    throw new Error(
                        `TokenId ${tokenId} is already revoked. Use a different tokenId or call revokeAllTokens() to reset.`
                    )
                }
            } else {
                // Find available tokenId from bitmap (only checks revoked, not occupied)
                // Note: This may return a tokenId that's already in use but not revoked yet.
                // UI layer should track occupied tokenIds and provide a specific tokenId.
                tokenId = this.findAvailableTokenId(accountInfo.revokedBitmap)
            }
        }

        const token: SessionToken = {
            address: userAddress,
            provider: providerAddress,
            timestamp,
            expiresAt,
            nonce,
            generation,
            tokenId,
        }

        // Create message to be signed
        const message = JSON.stringify(token)

        // Create hash using the same method as signRequest in encrypt.ts
        const messageHash = keccak256(toUtf8Bytes(message))

        // Sign using the same pattern as signRequest: signMessage with toBeArray
        const signature = await this.contract.signer.signMessage(
            Buffer.from(messageHash.slice(2), 'hex')
        )

        const session: CachedSession = {
            token,
            signature,
            rawMessage: message,
        }

        // Only cache ephemeral sessions
        if (mode === SessionMode.Ephemeral) {
            const cacheKey = CacheKeyHelpers.getSessionTokenKey(
                userAddress,
                providerAddress
            )
            await this.cache.setItem(
                cacheKey,
                session,
                duration,
                CacheValueTypeEnum.Session
            )
        }

        return session
    }

    /**
     * Find the smallest available tokenId from the revoked bitmap.
     * @param revokedBitmap - The bitmap of revoked tokenIds
     * @returns The smallest available tokenId (0-254)
     */
    private findAvailableTokenId(revokedBitmap: bigint): number {
        // Find the smallest available tokenId (0-254)
        // tokenId 255 is reserved for ephemeral tokens
        for (let tokenId = 0; tokenId < EPHEMERAL_TOKEN_ID; tokenId++) {
            const bit = BigInt(1) << BigInt(tokenId)
            if ((revokedBitmap & bit) === BigInt(0)) {
                // This tokenId is not revoked, it's available
                return tokenId
            }
        }

        // All 255 tokenIds are revoked
        throw new Error(
            'API Key limit reached (255). Call revokeAllTokens() to reset.'
        )
    }

    /**
     * Get or create an ephemeral session token for the provider.
     * Ephemeral tokens use tokenId=255 and don't consume the API key quota.
     * @param providerAddress - The provider address
     * @returns The cached or newly generated session
     */
    async getOrCreateSession(providerAddress: string): Promise<CachedSession> {
        const userAddress = this.contract.getUserAddress()
        const cacheKey = CacheKeyHelpers.getSessionTokenKey(
            userAddress,
            providerAddress
        )
        const cached = (await this.cache.getItem(
            cacheKey
        )) as CachedSession | null

        if (cached) {
            // Ephemeral tokens always have expiration time
            // Check if token has enough time remaining (at least 1 hour)
            const hasTimeRemaining =
                cached.token.expiresAt > Date.now() + 60 * 60 * 1000

            if (hasTimeRemaining) {
                return cached
            }
        }

        // Generate new ephemeral session
        return await this.generateSessionToken(providerAddress, {
            mode: SessionMode.Ephemeral,
        })
    }

    /**
     * Get request headers with an ephemeral session token.
     * This is the default method for SDK usage - it uses ephemeral tokens
     * that don't consume the API key quota.
     * @param providerAddress - The provider address
     * @returns Headers with Authorization
     */
    async getHeader(providerAddress: string): Promise<ServingRequestHeaders> {
        // Check if provider is acknowledged - this is still necessary
        if (!(await this.userAcknowledged(providerAddress))) {
            throw new Error('Provider signer is not acknowledged')
        }

        // Get or create ephemeral session token
        const session = await this.getOrCreateSession(providerAddress)

        return {
            Authorization: `Bearer app-sk-${Buffer.from(
                session.rawMessage + '|' + session.signature
            ).toString('base64')}`,
        }
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
    async createApiKey(
        providerAddress: string,
        options?: {
            expiresIn?: number // milliseconds, 0 = never expires
            tokenId?: number // Specific tokenId to use (0-254), if not provided, will find available one
        }
    ): Promise<ApiKeyInfo> {
        const session = await this.generateSessionToken(providerAddress, {
            mode: SessionMode.Persistent,
            duration: options?.expiresIn ?? 0, // Default: never expires
            tokenId: options?.tokenId,
        })

        const rawToken = `app-sk-${Buffer.from(
            session.rawMessage + '|' + session.signature
        ).toString('base64')}`

        return {
            tokenId: session.token.tokenId,
            createdAt: session.token.timestamp,
            expiresAt: session.token.expiresAt,
            rawToken,
        }
    }

    /**
     * Revoke an API Key by its tokenId.
     * This calls the contract to revoke the token.
     * @param providerAddress - The provider address
     * @param tokenId - The token ID to revoke (0-254)
     * @param gasPrice - Optional gas price
     */
    async revokeApiKey(
        providerAddress: string,
        tokenId: number,
        gasPrice?: number
    ): Promise<void> {
        if (tokenId === EPHEMERAL_TOKEN_ID) {
            throw new Error(
                'Cannot revoke ephemeral token individually. Use revokeAllTokens() instead.'
            )
        }

        // Revoke on contract
        await this.contract.revokeToken(providerAddress, tokenId, gasPrice)
    }

    /**
     * Revoke all tokens (both ephemeral and persistent).
     * This increments the generation, invalidating all existing tokens.
     * @param providerAddress - The provider address
     * @param gasPrice - Optional gas price
     */
    async revokeAllTokens(
        providerAddress: string,
        gasPrice?: number
    ): Promise<void> {
        // Revoke on contract
        await this.contract.revokeAllTokens(providerAddress, gasPrice)

        // Clear ephemeral session cache
        await this.clearEphemeralSession(providerAddress)

        // Also clear account info cache to ensure fresh generation number is fetched
        // When generation increments, cached account info with old generation becomes stale
        const userAddress = this.contract.getUserAddress()
        const accountInfoKey = `account_info_${userAddress}_${providerAddress}`
        this.cache.setItem(accountInfoKey, null, 1, CacheValueTypeEnum.Other)
    }

    /**
     * Clear ephemeral session cache
     */
    private async clearEphemeralSession(
        providerAddress: string
    ): Promise<void> {
        const userAddress = this.contract.getUserAddress()
        const cacheKey = CacheKeyHelpers.getSessionTokenKey(
            userAddress,
            providerAddress
        )
        // Remove by setting to null with short TTL
        await this.cache.setItem(cacheKey, null, 1, CacheValueTypeEnum.Other)
    }

    async calculateFee(extractor: Extractor, content: string): Promise<bigint> {
        const svc = await extractor.getSvcInfo()
        const outputCount = await extractor.getOutputCount(content)
        const inputCount = await extractor.getInputCount(content)
        return (
            BigInt(outputCount) * BigInt(svc.outputPrice) +
            BigInt(inputCount) * BigInt(svc.inputPrice)
        )
    }

    async updateCachedFee(provider: string, fee: bigint) {
        try {
            const cacheFundKey = CacheKeyHelpers.getCachedFeeKey(provider)
            const balanceCheckKey = CacheKeyHelpers.getCheckBalanceKey(provider)
            const accumulatedCheckFee =
                (await this.cache.getItem(balanceCheckKey)) || BigInt(0)
            await this.cache.setItem(
                balanceCheckKey,
                BigInt(accumulatedCheckFee) + fee,
                1 * 60 * 1000,
                CacheValueTypeEnum.BigInt
            )
            const curFee = (await this.cache.getItem(cacheFundKey)) || BigInt(0)
            await this.cache.setItem(
                cacheFundKey,
                BigInt(curFee) + fee,
                1 * 60 * 1000,
                CacheValueTypeEnum.BigInt
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async clearBalanceCheckFee(provider: string) {
        try {
            const key = CacheKeyHelpers.getCheckBalanceKey(provider)
            await this.cache.setItem(
                key,
                BigInt(0),
                1 * 60 * 1000,
                CacheValueTypeEnum.BigInt
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async clearCacheFee(provider: string) {
        try {
            const key = CacheKeyHelpers.getCachedFeeKey(provider)
            await this.cache.setItem(
                key,
                BigInt(0),
                1 * 60 * 1000,
                CacheValueTypeEnum.BigInt
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Transfer fund from ledger if fund in the inference account is less than a topUpTriggerThreshold * (inputPrice + outputPrice)
     */
    async topUpAccountIfNeeded(
        provider: string,
        content?: string,
        gasPrice?: number
    ) {
        try {
            // Exit early if running in browser environment
            if (
                typeof window !== 'undefined' &&
                typeof window.document !== 'undefined'
            ) {
                return
            }

            const extractor = await this.getExtractor(provider)
            const svc = await extractor.getSvcInfo()

            // Select threshold factors based on service type
            // Image services use smaller factors since each unit costs more
            const isImageService =
                svc.serviceType === 'text-to-image' ||
                svc.serviceType === 'image-editing'
            const targetFactor = isImageService
                ? this.topUpTargetThresholdForImage
                : this.topUpTargetThreshold
            const triggerFactor = isImageService
                ? this.topUpTriggerThresholdForImage
                : this.topUpTriggerThreshold

            // Calculate target and trigger thresholds
            // Minimum target threshold is 1 0G (10^18 neuron)
            const minTargetThreshold = BigInt(10 ** 18)
            const calculatedTargetThreshold =
                targetFactor *
                (BigInt(svc.inputPrice) + BigInt(svc.outputPrice))
            const targetThreshold =
                calculatedTargetThreshold > minTargetThreshold
                    ? calculatedTargetThreshold
                    : minTargetThreshold
            const triggerThreshold =
                triggerFactor *
                (BigInt(svc.inputPrice) + BigInt(svc.outputPrice))

            logger.debug(
                `topUpAccountIfNeeded: serviceType=${svc.serviceType}, isImageService=${isImageService}, ` +
                `triggerFactor=${triggerFactor}, targetFactor=${targetFactor}, ` +
                `triggerThreshold=${triggerThreshold}, targetThreshold=${targetThreshold}`
            )

            // Check if it's the first round
            const isFirstRound =
                (await this.cache.getItem(CACHE_KEYS.FIRST_ROUND)) !== 'false'
            if (isFirstRound) {
                await this.handleFirstRound(
                    provider,
                    triggerThreshold,
                    targetThreshold,
                    gasPrice
                )
                return
            }

            let newFee = BigInt(0)
            if (content) {
                newFee = await this.calculateFee(extractor, content)
                await this.updateCachedFee(provider, newFee)
            }

            // Check if we need to check the account
            if (!(await this.shouldCheckAccount(svc))) return

            await this.clearBalanceCheckFee(provider)

            // Re-check the account balance
            let needTransfer = false
            try {
                const acc = await this.contract.getAccount(provider)
                const lockedFund = acc.balance - acc.pendingRefund

                logger.debug(
                    `Locked fund for provider ${provider}: ${lockedFund.toString()}, trigger threshold: ${triggerThreshold.toString()}`
                )
                needTransfer = lockedFund < triggerThreshold
            } catch {
                // Account doesn't exist, need to create it by transferring funds
                needTransfer = true
            }

            if (needTransfer) {
                try {
                    await this.ledger.transferFund(
                        provider,
                        'inference',
                        targetThreshold,
                        gasPrice
                    )
                    await this.clearCacheFee(provider)
                } catch (error: any) {
                    // Check if it's an insufficient balance error
                    const errorMessage = error?.message?.toLowerCase() || ''
                    if (errorMessage.includes('insufficient')) {
                        console.warn(
                            `Warning: To ensure stable service from the provider, ${targetThreshold} neuron needs to be transferred from the balance, but the current balance is insufficient.`
                        )
                        return
                    }
                    console.warn(
                        `Warning: Failed to transfer funds: ${
                            error?.message || error
                        }`
                    )
                    return
                }
            }
        } catch (error: any) {
            console.warn(
                `Warning: Top up account failed: ${error?.message || error}`
            )
        }
    }

    private async handleFirstRound(
        provider: string,
        triggerThreshold: bigint,
        targetThreshold: bigint,
        gasPrice?: number
    ) {
        let needTransfer = false

        try {
            const acc = await this.contract.getAccount(provider)
            const lockedFund = acc.balance - acc.pendingRefund
            needTransfer = lockedFund < triggerThreshold
        } catch {
            needTransfer = true
        }

        if (needTransfer) {
            try {
                await this.ledger.transferFund(
                    provider,
                    'inference',
                    targetThreshold,
                    gasPrice
                )
            } catch (error: any) {
                // Check if it's an insufficient balance error
                const errorMessage = error?.message?.toLowerCase() || ''
                if (errorMessage.includes('insufficient')) {
                    console.warn(
                        `Warning: To ensure stable service from the provider, ${targetThreshold} neuron needs to be transferred from the balance, but the current balance is insufficient.`
                    )
                    return
                }
                console.warn(
                    `Warning: Failed to transfer funds: ${
                        error?.message || error
                    }`
                )
                return
            }
        }

        // Mark the first round as complete
        await this.cache.setItem(
            CACHE_KEYS.FIRST_ROUND,
            'false',
            10000000 * 60 * 1000,
            CacheValueTypeEnum.Other
        )
    }

    /**
     * Check the cache fund for this provider, return true if the fund is above checkAccountThreshold * (inputPrice + outputPrice)
     * @param svc
     */
    async shouldCheckAccount(svc: ServiceStructOutput) {
        try {
            const key = CacheKeyHelpers.getCheckBalanceKey(svc.provider)
            const accumulatedFund = (await this.cache.getItem(key)) || BigInt(0)
            logger.debug(
                `Accumulated fund for provider before checking balance ${
                    svc.provider
                }: ${accumulatedFund.toString()} and threshold to check account balance: ${
                    this.checkAccountThreshold *
                    (svc.inputPrice + svc.outputPrice)
                }`
            )
            return (
                accumulatedFund >
                this.checkAccountThreshold * (svc.inputPrice + svc.outputPrice)
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }
}
