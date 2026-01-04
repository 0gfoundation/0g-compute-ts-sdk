import type { JsonRpcSigner, AddressLike, Wallet, ContractTransactionReceipt, ContractMethodArgs } from 'ethers';
import type { InferenceServing } from './typechain/InferenceServing';
import type { ServiceStructOutput } from './typechain/InferenceServing';
export declare class InferenceServingContract {
    serving: InferenceServing;
    signer: JsonRpcSigner | Wallet;
    private _userAddress;
    private _gasPrice?;
    private _maxGasPrice?;
    private _step;
    constructor(signer: JsonRpcSigner | Wallet, contractAddress: string, userAddress: string, gasPrice?: number, maxGasPrice?: number, step?: number);
    sendTx(name: string, txArgs: ContractMethodArgs<any[]>, txOptions: any): Promise<void>;
    lockTime(): Promise<bigint>;
    listService(offset?: number, limit?: number, includeUnacknowledged?: boolean): Promise<ServiceStructOutput[]>;
    listAccount(offset?: number, limit?: number): Promise<import(".").AccountStructOutput[]>;
    getAccount(provider: AddressLike): Promise<import(".").AccountStructOutput>;
    /**
     * Acknowledge TEE signer for a provider
     *
     * @param providerAddress - The address of the provider
     * @param acknowledged - Whether to acknowledge (true) or revoke acknowledgement (false)
     */
    acknowledgeTEESigner(providerAddress: AddressLike, acknowledged?: boolean, gasPrice?: number): Promise<void>;
    /**
     * Acknowledge TEE signer for a provider (Contract owner only)
     *
     * @param providerAddress - The address of the provider
     */
    acknowledgeTEESignerByOwner(providerAddress: AddressLike, gasPrice?: number): Promise<void>;
    /**
     * Revoke TEE signer acknowledgement for a provider (Contract owner only)
     *
     * @param providerAddress - The address of the provider
     */
    revokeTEESignerAcknowledgement(providerAddress: AddressLike, gasPrice?: number): Promise<void>;
    getService(providerAddress: string): Promise<ServiceStructOutput>;
    getUserAddress(): string;
    checkReceipt(receipt: ContractTransactionReceipt | null): void;
    /**
     * Revoke a single session token
     * @param provider - The provider address
     * @param tokenId - The token ID to revoke (0-254)
     * @param gasPrice - Optional gas price
     */
    revokeToken(provider: AddressLike, tokenId: number, gasPrice?: number): Promise<void>;
    /**
     * Revoke multiple session tokens
     * @param provider - The provider address
     * @param tokenIds - Array of token IDs to revoke
     * @param gasPrice - Optional gas price
     */
    revokeTokens(provider: AddressLike, tokenIds: number[], gasPrice?: number): Promise<void>;
    /**
     * Revoke all session tokens by incrementing generation
     * This invalidates all existing tokens and resets the tokenId counter
     * @param provider - The provider address
     * @param gasPrice - Optional gas price
     */
    revokeAllTokens(provider: AddressLike, gasPrice?: number): Promise<void>;
}
//# sourceMappingURL=inference.d.ts.map