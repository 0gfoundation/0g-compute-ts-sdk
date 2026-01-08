import type { InferenceServingContract } from '../contract';
import type { Extractor } from '../extractor';
import type { ServiceStructOutput } from '../contract';
import type { ServingRequestHeaders } from './request';
import type { Cache, Metadata } from '../../common/storage';
import type { LedgerBroker } from '../../ledger';
export interface TdxQuoteResponse {
    rawReport: string;
    signingAddress: string;
}
/**
 * Special token ID reserved for ephemeral tokens.
 * Ephemeral tokens (tokenId=255) are not checked against the revoked bitmap,
 * only generation check applies. This allows unlimited ephemeral tokens without
 * consuming the 0-254 tokenId quota.
 */
export declare const EPHEMERAL_TOKEN_ID = 255;
/**
 * Maximum duration for ephemeral tokens (24 hours in milliseconds).
 * Ephemeral tokens must have an expiration time and cannot exceed this duration.
 */
export declare const EPHEMERAL_TOKEN_MAX_DURATION: number;
/**
 * Session mode for token generation
 */
export declare enum SessionMode {
    /** Ephemeral token: uses tokenId=255, not individually revocable, no quota consumption */
    Ephemeral = "ephemeral",
    /** Persistent token: uses tokenId 0-254, individually revocable, consumes quota */
    Persistent = "persistent"
}
export interface SessionToken {
    address: string;
    provider: string;
    timestamp: number;
    expiresAt: number;
    nonce: string;
    generation: number;
    tokenId: number;
}
export interface CachedSession {
    token: SessionToken;
    signature: string;
    rawMessage: string;
}
/**
 * API Key information for persistent tokens
 */
export interface ApiKeyInfo {
    /** Token ID (0-254) */
    tokenId: number;
    /** Creation timestamp in milliseconds */
    createdAt: number;
    /** Expiration timestamp in milliseconds, 0 = never expires */
    expiresAt: number;
    /** The raw token string for Authorization header */
    rawToken: string;
}
/**
 * Options for generating session tokens
 */
export interface SessionTokenOptions {
    /** Session mode: ephemeral (default) or persistent */
    mode?: SessionMode;
    /** Duration in milliseconds. 0 = never expires. Default: 24 hours for ephemeral */
    duration?: number;
    /** Specific tokenId to use for persistent mode (0-254). If not provided, will find available one from bitmap */
    tokenId?: number;
}
export declare abstract class ZGServingUserBrokerBase {
    protected contract: InferenceServingContract;
    protected metadata: Metadata;
    protected cache: Cache;
    private checkAccountThreshold;
    private topUpTriggerThreshold;
    private topUpTargetThreshold;
    protected ledger: LedgerBroker;
    constructor(contract: InferenceServingContract, ledger: LedgerBroker, metadata: Metadata, cache: Cache);
    protected getService(providerAddress: string, useCache?: boolean): Promise<ServiceStructOutput>;
    getQuote(providerAddress: string): Promise<TdxQuoteResponse>;
    downloadQuoteReport(providerAddress: string, outputPath: string): Promise<void>;
    userAcknowledged(providerAddress: string): Promise<boolean>;
    fetchText(endpoint: string, options: RequestInit): Promise<string>;
    protected getExtractor(providerAddress: string, useCache?: boolean): Promise<Extractor>;
    protected createExtractor(svc: ServiceStructOutput): Extractor;
    protected a0giToNeuron(value: number): bigint;
    protected neuronToA0gi(value: bigint): number;
    private generateNonce;
    /**
     * Get account info from cache or contract.
     * @param providerAddress - The provider address
     */
    private getAccountInfo;
    /**
     * Generate a new session token with generation and tokenId for revocation support
     * @param providerAddress - The provider address
     * @param options - Optional configuration for token generation
     * @returns The cached session with token, signature, and raw message
     */
    generateSessionToken(providerAddress: string, options?: SessionTokenOptions): Promise<CachedSession>;
    /**
     * Find the smallest available tokenId from the revoked bitmap.
     * @param revokedBitmap - The bitmap of revoked tokenIds
     * @returns The smallest available tokenId (0-254)
     */
    private findAvailableTokenId;
    /**
     * Get or create an ephemeral session token for the provider.
     * Ephemeral tokens use tokenId=255 and don't consume the API key quota.
     * @param providerAddress - The provider address
     * @returns The cached or newly generated session
     */
    getOrCreateSession(providerAddress: string): Promise<CachedSession>;
    /**
     * Get request headers with an ephemeral session token.
     * This is the default method for SDK usage - it uses ephemeral tokens
     * that don't consume the API key quota.
     * @param providerAddress - The provider address
     * @returns Headers with Authorization
     */
    getHeader(providerAddress: string): Promise<ServingRequestHeaders>;
    /**
     * Create a new API Key (persistent token).
     * API Keys consume tokenId quota (0-254) and can be individually revoked.
     * The tokenId is determined by finding the smallest available ID from the contract's bitmap.
     * @param providerAddress - The provider address
     * @param options - Optional configuration
     * @returns The API key information including the raw token
     */
    createApiKey(providerAddress: string, options?: {
        expiresIn?: number;
        tokenId?: number;
    }): Promise<ApiKeyInfo>;
    /**
     * Revoke an API Key by its tokenId.
     * This calls the contract to revoke the token.
     * @param providerAddress - The provider address
     * @param tokenId - The token ID to revoke (0-254)
     * @param gasPrice - Optional gas price
     */
    revokeApiKey(providerAddress: string, tokenId: number, gasPrice?: number): Promise<void>;
    /**
     * Revoke all tokens (both ephemeral and persistent).
     * This increments the generation, invalidating all existing tokens.
     * @param providerAddress - The provider address
     * @param gasPrice - Optional gas price
     */
    revokeAllTokens(providerAddress: string, gasPrice?: number): Promise<void>;
    /**
     * Clear ephemeral session cache
     */
    private clearEphemeralSession;
    calculateFee(extractor: Extractor, content: string): Promise<bigint>;
    updateCachedFee(provider: string, fee: bigint): Promise<void>;
    clearBalanceCheckFee(provider: string): Promise<void>;
    clearCacheFee(provider: string): Promise<void>;
    /**
     * Transfer fund from ledger if fund in the inference account is less than a topUpTriggerThreshold * (inputPrice + outputPrice)
     */
    topUpAccountIfNeeded(provider: string, content?: string, gasPrice?: number): Promise<void>;
    private handleFirstRound;
    /**
     * Check the cache fund for this provider, return true if the fund is above checkAccountThreshold * (inputPrice + outputPrice)
     * @param svc
     */
    shouldCheckAccount(svc: ServiceStructOutput): Promise<boolean>;
}
//# sourceMappingURL=base.d.ts.map