export const ZG_RPC_ENDPOINT_TESTNET = 'https://evmrpc-testnet.0g.ai'

export const INDEXER_URL_STANDARD =
    'https://indexer-storage-testnet-standard.0g.ai'
export const INDEXER_URL_TURBO = 'https://indexer-storage-testnet-turbo.0g.ai'

export const TOKEN_COUNTER_MERKLE_ROOT =
    '0x4e8ae3790920b9971397f088fcfacbb9dad0c28ec2831f37f3481933b1fdbdbc'

export const TOKEN_COUNTER_FILE_HASH =
    '26ab266a12c9ce34611aba3f82baf056dc683181236d5fa15edb8eb8c8db3872'

/**
 * Model configuration type definition
 *
 * Hash Validation:
 * - Model hashes are generated from the model files stored in 0G Storage or TEE.
 * - When a task is created, the smart contract validates the model hash against registered providers.
 * - The 'turbo' hash is used for TEE-based (turbo) storage, 'standard' for regular 0G Storage.
 * - Empty 'standard' hash means the model is only available via turbo storage.
 */
type ModelConfig = {
    [key: string]: { [key: string]: string }
}

/**
 * Base models available on testnet and testnet-dev
 */
const BASE_MODELS: ModelConfig = {
    'Qwen2.5-0.5B-Instruct': {
        turbo: '0xb4f76a886b8655c92bb021922d60b5e4d9271a5c9da98b6cb10937a06c2c75a7',
        standard: '',
        description:
            'Qwen2.5-0.5B-Instruct is a compact instruction-tuned language model optimized for LoRA fine-tuning. More details at: https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct',
        tokenizer: 'Qwen/Qwen2.5-0.5B-Instruct',
        type: 'text',
    },
}

/**
 * Additional models only available on mainnet
 */
const MAINNET_ONLY_MODELS: ModelConfig = {
    'Qwen3-32B': {
        turbo: '0x2e6f9620c35bdcb2b753cc7aa34e78077a8ed133e36fa36008fd6bdfd29af3a5',
        standard: '',
        description:
            'Qwen3-32B is a powerful 32B parameter language model with thinking/non-thinking mode switching. Optimized for LoRA fine-tuning. More details at: https://huggingface.co/Qwen/Qwen3-32B',
        tokenizer: 'Qwen/Qwen3-32B',
        type: 'text',
    },
}

/**
 * Mock model for local development and testing (hardhat)
 */
const MOCK_MODELS: ModelConfig = {
    'mock-model': {
        turbo: '0xcb42b5ca9e998c82dd239ef2d20d22a4ae16b3dc0ce0a855c93b52c7c2bab6dc',
        standard: '',
        description: 'Mock model for local development and testing',
        tokenizer:
            '0x382842561e59d71f90c1861041989428dd2c1f664e65a56ea21f3ade216b2046',
        type: 'text',
    },
}

/**
 * TESTNET_MODELS: Models available on testnet (base models only)
 */
export const TESTNET_MODELS: ModelConfig = {
    ...BASE_MODELS,
}

/**
 * TESTNET_DEV_MODELS: Models available on testnet-dev (same as testnet)
 */
export const TESTNET_DEV_MODELS: ModelConfig = {
    ...BASE_MODELS,
}

/**
 * MAINNET_MODELS: All models available on mainnet (base + mainnet-only)
 */
export const MAINNET_MODELS: ModelConfig = {
    ...BASE_MODELS,
    ...MAINNET_ONLY_MODELS,
}

/**
 * HARDHAT_MODELS: Models available on local hardhat network (mock models for testing)
 */
export const HARDHAT_MODELS: ModelConfig = {
    ...MOCK_MODELS,
}

/**
 * MODEL_HASH_MAP: Legacy export, defaults to all models
 * @deprecated Use TESTNET_MODELS or MAINNET_MODELS instead
 */
export const MODEL_HASH_MAP: ModelConfig = MAINNET_MODELS

// AutomataDcapAttestation for quote verification
// https://explorer.ata.network/address/0xE26E11B257856B0bEBc4C759aaBDdea72B64351F/contract/65536_2/readContract#F6

export const AUTOMATA_RPC = 'https://1rpc.io/ata'

export const AUTOMATA_CONTRACT_ADDRESS =
    '0xE26E11B257856B0bEBc4C759aaBDdea72B64351F'

export const AUTOMATA_ABI = [
    {
        inputs: [
            {
                internalType: 'bytes',
                name: 'rawQuote',
                type: 'bytes',
            },
        ],
        name: 'verifyAndAttestOnChain',
        outputs: [
            {
                internalType: 'bool',
                name: 'success',
                type: 'bool',
            },
            {
                internalType: 'bytes',
                name: 'output',
                type: 'bytes',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
]
