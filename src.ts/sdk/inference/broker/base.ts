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

    // Minimum locked balance required by provider broker proxy (1 0G in neuron).
    // Matches MinimumLockedBalance in api/inference/const/const.go.
    // Provider requires: lockBalance >= unsettledFee + currentFee + MIN_LOCKED_BALANCE
    protected static readonly MIN_LOCKED_BALANCE =
        BigInt(1) * BigInt(10 ** 18)


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

    // Long TTL for fee caches — these track unsettled fees across the lifetime
    // of a long-running process (e.g. inference server). They should only be
    // cleared explicitly after a successful transfer, not by expiration.
    private static readonly FEE_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

    // Throttle threshold for on-chain balance checks: 10% of MIN_LOCKED_BALANCE (0.1 0G).
    // We only query the chain when accumulated fees since last check exceed this amount,
    // avoiding an on-chain read on every request.
    private static readonly CHECK_BALANCE_THRESHOLD =
        ZGServingUserBrokerBase.MIN_LOCKED_BALANCE / BigInt(10)

    async updateCachedFee(provider: string, fee: bigint) {
        try {
            const cacheFundKey = CacheKeyHelpers.getCachedFeeKey(provider)
            const checkBalanceKey =
                CacheKeyHelpers.getCheckBalanceKey(provider)

            // Accumulate fee in both counters
            const curFee = (await this.cache.getItem(cacheFundKey)) || BigInt(0)
            await this.cache.setItem(
                cacheFundKey,
                BigInt(curFee) + fee,
                ZGServingUserBrokerBase.FEE_CACHE_TTL,
                CacheValueTypeEnum.BigInt
            )

            const curCheckFee =
                (await this.cache.getItem(checkBalanceKey)) || BigInt(0)
            await this.cache.setItem(
                checkBalanceKey,
                BigInt(curCheckFee) + fee,
                ZGServingUserBrokerBase.FEE_CACHE_TTL,
                CacheValueTypeEnum.BigInt
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    private async clearCheckBalanceFee(provider: string) {
        try {
            const key = CacheKeyHelpers.getCheckBalanceKey(provider)
            await this.cache.setItem(
                key,
                BigInt(0),
                ZGServingUserBrokerBase.FEE_CACHE_TTL,
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
                ZGServingUserBrokerBase.FEE_CACHE_TTL,
                CacheValueTypeEnum.BigInt
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    /**
     * Transfer fund from ledger if the provider sub-account balance is insufficient.
     *
     * Provider requires: lockBalance >= unsettledFee + currentFee + MIN_LOCKED_BALANCE (1 0G).
     * We use cachedFee (accumulated via processResponse) to track unsettled fee on the client side.
     *
     * Trigger:  onChainBalance < cachedFee + MIN_LOCKED_BALANCE
     * Transfer: cachedFee + MIN_LOCKED_BALANCE (covers accumulated usage + provider minimum)
     */
    async topUpAccountIfNeeded(
        provider: string,
        content?: string,
        gasPrice?: number
    ) {
        try {
            // Skip auto-funding in browser environments.
            // Browser signers (e.g. MetaMask) require user confirmation for each
            // transaction, so silent auto-funding would cause unexpected wallet popups
            // during chat. Browser dApps should rely on acknowledgeProviderSigner()
            // for initial funding and manual transferFund() for top-ups.
            if (
                typeof window !== 'undefined' &&
                typeof window.document !== 'undefined'
            ) {
                return
            }

            const minLocked = ZGServingUserBrokerBase.MIN_LOCKED_BALANCE

            // Check if it's the first round
            const isFirstRound =
                (await this.cache.getItem(CACHE_KEYS.FIRST_ROUND)) !== 'false'
            if (isFirstRound) {
                await this.handleFirstRound(provider, minLocked, gasPrice)
                return
            }

            if (content) {
                const extractor = await this.getExtractor(provider)
                const newFee = await this.calculateFee(extractor, content)
                await this.updateCachedFee(provider, newFee)
            }

            // Throttle: only query on-chain balance when accumulated fees
            // since last check exceed CHECK_BALANCE_THRESHOLD (0.1 0G).
            if (!(await this.shouldCheckBalance(provider))) {
                return
            }

            // Use cachedFee to estimate provider's unsettled fee
            const cachedFee = await this.getCachedFee(provider)
            const requiredBalance = cachedFee + minLocked

            const deficit = await this.getTransferDeficit(
                provider,
                requiredBalance
            )

            if (deficit > BigInt(0)) {
                await this.doTransfer(
                    provider,
                    deficit,
                    gasPrice
                )
            } else {
                // Balance is sufficient — reset check counter so we don't
                // query the chain again until another 0.1 0G accumulates.
                await this.clearCheckBalanceFee(provider)
            }
        } catch (error: any) {
            logger.warn(
                `[Auto-funding] Top up account failed: ${error?.message || error}`
            )
        }
    }

    private async handleFirstRound(
        provider: string,
        minLocked: bigint,
        gasPrice?: number
    ) {
        // On first round (including after restart), query the provider for
        // the real unsettled fee so we know exactly how much balance is needed.
        // This replaces the in-memory cachedFee which is lost on restart.
        const unsettledFee = await this.fetchUnsettledFee(provider)
        const requiredBalance = unsettledFee + minLocked

        logger.debug(
            `[Auto-funding] First round: unsettledFee=${this.neuronToA0gi(unsettledFee).toFixed(6)} 0G, ` +
                `requiredBalance=${this.neuronToA0gi(requiredBalance).toFixed(6)} 0G`
        )

        // Seed the in-memory cachedFee with the provider's unsettled fee
        // so subsequent throttled checks use the correct baseline.
        if (unsettledFee > BigInt(0)) {
            const cacheFundKey = CacheKeyHelpers.getCachedFeeKey(provider)
            await this.cache.setItem(
                cacheFundKey,
                unsettledFee,
                ZGServingUserBrokerBase.FEE_CACHE_TTL,
                CacheValueTypeEnum.BigInt
            )
        }

        const deficit = await this.getTransferDeficit(
            provider,
            requiredBalance
        )

        if (deficit > BigInt(0)) {
            await this.doTransfer(provider, deficit, gasPrice)
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
     * Fetch unsettled fee from the provider's API.
     * Requires a valid session token (Authorization header).
     * Falls back to 0 if the provider doesn't support this endpoint.
     */
    private async fetchUnsettledFee(provider: string): Promise<bigint> {
        try {
            const svc = await this.getService(provider)
            const headers = await this.getHeader(provider)
            const userAddress = this.contract.getUserAddress()

            const response = await fetch(
                `${svc.url}/v1/user/${userAddress}/unsettledfee`,
                {
                    method: 'GET',
                    headers: {
                        ...headers,
                    },
                }
            )

            if (!response.ok) {
                // Provider may not support this endpoint yet — fall back to 0
                logger.debug(
                    `[Auto-funding] Provider does not support unsettled fee query (${response.status}), using cachedFee fallback`
                )
                return await this.getCachedFee(provider)
            }

            const data = await response.json()
            const fee = BigInt(data.unsettledFee || '0')
            logger.debug(
                `[Auto-funding] Provider unsettled fee: ${this.neuronToA0gi(fee).toFixed(6)} 0G`
            )
            return fee
        } catch (error: any) {
            // Network error or provider unavailable — fall back to cachedFee
            logger.debug(
                `[Auto-funding] Failed to fetch unsettled fee: ${error?.message || error}, using cachedFee fallback`
            )
            return await this.getCachedFee(provider)
        }
    }

    private async getCachedFee(provider: string): Promise<bigint> {
        try {
            const key = CacheKeyHelpers.getCachedFeeKey(provider)
            return BigInt((await this.cache.getItem(key)) || BigInt(0))
        } catch {
            return BigInt(0)
        }
    }

    /**
     * Calculate how much additional fund is needed to meet the required balance.
     * Returns 0 if the current balance is already sufficient.
     * Returns requiredBalance if the account doesn't exist yet.
     */
    private async getTransferDeficit(
        provider: string,
        requiredBalance: bigint
    ): Promise<bigint> {
        try {
            const acc = await this.contract.getAccount(provider)
            const lockedFund = acc.balance - acc.pendingRefund
            logger.debug(
                `Locked fund for provider ${provider}: ${lockedFund.toString()}, required: ${requiredBalance.toString()}`
            )
            if (lockedFund >= requiredBalance) {
                return BigInt(0)
            }
            return requiredBalance - lockedFund
        } catch {
            // Account doesn't exist, need to create it by transferring full amount
            return requiredBalance
        }
    }

    /**
     * Check if accumulated fees since last balance check exceed the threshold.
     * This throttles on-chain reads to avoid querying on every request.
     */
    private async shouldCheckBalance(provider: string): Promise<boolean> {
        try {
            const key = CacheKeyHelpers.getCheckBalanceKey(provider)
            const accumulatedFee =
                (await this.cache.getItem(key)) || BigInt(0)
            const threshold =
                ZGServingUserBrokerBase.CHECK_BALANCE_THRESHOLD
            logger.debug(
                `Check balance throttle for ${provider}: accumulated=${accumulatedFee.toString()}, threshold=${threshold.toString()}`
            )
            return BigInt(accumulatedFee) >= threshold
        } catch {
            // On error, be safe and check
            return true
        }
    }

    private async doTransfer(
        provider: string,
        amount: bigint,
        gasPrice?: number
    ) {
        // Ensure minimum transfer of MIN_LOCKED_BALANCE to avoid frequent
        // tiny transfers that trigger warnings and get rejected by provider.
        const minTransfer = ZGServingUserBrokerBase.MIN_LOCKED_BALANCE
        const transferAmount = amount < minTransfer ? minTransfer : amount

        try {
            await this.ledger.transferFund(
                provider,
                'inference',
                transferAmount,
                gasPrice
            )
            // Clear both counters after successful transfer
            await this.clearCacheFee(provider)
            await this.clearCheckBalanceFee(provider)
        } catch (error: any) {
            const amountInOG = this.neuronToA0gi(transferAmount)
            const errorMessage = error?.message?.toLowerCase() || ''
            if (errorMessage.includes('insufficient')) {
                logger.warn(
                    `[Auto-funding] Requires ${amountInOG.toFixed(4)} 0G in your ledger to transfer to the ` +
                        `provider sub-account, but your ledger available balance is insufficient. ` +
                        `Please deposit more funds:\n` +
                        `  SDK: broker.ledger.depositFund(${Math.ceil(amountInOG)})\n` +
                        `  CLI: 0g-compute-cli deposit --amount ${Math.ceil(amountInOG)}`
                )
                return
            }
            logger.warn(
                `[Auto-funding] Failed to transfer ${amountInOG.toFixed(4)} 0G to provider sub-account: ${
                    error?.message || error
                }`
            )
        }
    }

}
