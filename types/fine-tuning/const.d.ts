/**
 * MESSAGE_FOR_ENCRYPTION_KEY is a fixed message used to derive the encryption key.
 *
 * Background:
 * To ensure a consistent and unique encryption key can be generated from a user's Ethereum wallet,
 * we utilize a fixed message combined with a signing mechanism.
 *
 * Purpose:
 * - This string is provided to the Ethereum signing function to generate a digital signature based on the user's private key.
 * - The produced signature is then hashed (using SHA-256) to create a consistent 256-bit encryption key from the same wallet.
 * - This process offers a way to protect data without storing additional keys.
 *
 * Note:
 * - The uniqueness and stability of this message are crucial; do not change it unless you fully understand the impact
 *   on the key derivation and encryption process.
 * - Because the signature is derived from the wallet's private key, it ensures that different wallets cannot produce the same key.
 */
export declare const MESSAGE_FOR_ENCRYPTION_KEY = "MESSAGE_FOR_ENCRYPTION_KEY";
export declare const ZG_RPC_ENDPOINT_TESTNET = "https://evmrpc-testnet.0g.ai";
export declare const INDEXER_URL_STANDARD = "https://indexer-storage-testnet-standard.0g.ai";
export declare const INDEXER_URL_TURBO = "https://indexer-storage-testnet-turbo.0g.ai";
export declare const TOKEN_COUNTER_MERKLE_ROOT = "0x4e8ae3790920b9971397f088fcfacbb9dad0c28ec2831f37f3481933b1fdbdbc";
export declare const TOKEN_COUNTER_FILE_HASH = "26ab266a12c9ce34611aba3f82baf056dc683181236d5fa15edb8eb8c8db3872";
export declare const MODEL_HASH_MAP: {
    [key: string]: {
        [key: string]: string;
    };
};
export declare const AUTOMATA_RPC = "https://1rpc.io/ata";
export declare const AUTOMATA_CONTRACT_ADDRESS = "0xE26E11B257856B0bEBc4C759aaBDdea72B64351F";
export declare const AUTOMATA_ABI: {
    inputs: {
        internalType: string;
        name: string;
        type: string;
    }[];
    name: string;
    outputs: {
        internalType: string;
        name: string;
        type: string;
    }[];
    stateMutability: string;
    type: string;
}[];
//# sourceMappingURL=const.d.ts.map