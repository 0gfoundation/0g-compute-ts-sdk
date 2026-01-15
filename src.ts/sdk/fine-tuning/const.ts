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
export const MESSAGE_FOR_ENCRYPTION_KEY = 'MESSAGE_FOR_ENCRYPTION_KEY'

export const ZG_RPC_ENDPOINT_TESTNET = 'https://evmrpc-testnet.0g.ai'

export const INDEXER_URL_STANDARD =
    'https://indexer-storage-testnet-standard.0g.ai'
export const INDEXER_URL_TURBO = 'https://indexer-storage-testnet-turbo.0g.ai'

export const TOKEN_COUNTER_MERKLE_ROOT =
    '0x4e8ae3790920b9971397f088fcfacbb9dad0c28ec2831f37f3481933b1fdbdbc'

export const TOKEN_COUNTER_FILE_HASH =
    '26ab266a12c9ce34611aba3f82baf056dc683181236d5fa15edb8eb8c8db3872'

export const MODEL_HASH_MAP: {
    [key: string]: { [key: string]: string }
} = {
    'distilbert-base-uncased': {
        turbo: '0x7f2244b25cd2219dfd9d14c052982ecce409356e0f08e839b79796e270d110a7',
        standard: '',
        description:
            'DistilBERT is a transformers model, smaller and faster than BERT, which was pretrained on the same corpus in a self-supervised fashion, using the BERT base model as a teacher. More details can be found at: https://huggingface.co/distilbert/distilbert-base-uncased',
        tokenizer:
            '0x3317127671a3217583069001b2a00454ef4d1e838f8f1f4ffbe64db0ec7ed960',
        type: 'text',
    },
    // mobilenet_v2: {
    //     turbo: '0x8645816c17a8a70ebf32bcc7e621c659e8d0150b1a6bfca27f48f83010c6d12e',
    //     standard: '',
    //     description:
    //         'MobileNet V2 model pre-trained on ImageNet-1k at resolution 224x224. More details can be found at: https://huggingface.co/google/mobilenet_v2_1.0_224',
    // tokenizer:
    //     '0xcfdb4cf199829a3cbd453dd39cea5c337a29d4be5a87bad99d76f5a33ac2dfba',
    // type: 'image',
    // },
    // 'deepseek-r1-distill-qwen-1.5b': {
    //     turbo: '0x2084fdd904c9a3317dde98147d4e7778a40e076b5b0eb469f7a8f27ae5b13e7f',
    //     standard: '',
    //     description:
    //         'DeepSeek-R1-Zero, a model trained via large-scale reinforcement learning (RL) without supervised fine-tuning (SFT) as a preliminary step, demonstrated remarkable performance on reasoning. More details can be found at: https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B',
    // tokenizer:
    //     '0x382842561e59d71f90c1861041989428dd2c1f664e65a56ea21f3ade216b2046',
    // type: 'text',
    // },
    // 'cocktailsgd-opt-1.3b': {
    //     turbo: '0x02ed6d3889bebad9e2cd4008066478654c0886b12ad25ea7cf7d31df3441182e',
    //     standard: '',
    //     description:
    //         'CocktailSGD-opt-1.3B finetunes the Opt-1.3B langauge model with CocktailSGD, which is a novel distributed finetuning framework. More details can be found at: https://github.com/DS3Lab/CocktailSGD',
    //     tokenizer:
    //         '0x459311517bdeb3a955466d4e5e396944b2fdc68890de78f506261d95e6d1b000',
    //     type: 'text',
    // },
    // // TODO: remove
    // 'mock-model': {
    //     turbo: '0xcb42b5ca9e998c82dd239ef2d20d22a4ae16b3dc0ce0a855c93b52c7c2bab6dc',
    //     standard: '',
    //     description: '',
    //     tokenizer:
    //         '0x382842561e59d71f90c1861041989428dd2c1f664e65a56ea21f3ade216b2046',
    //     type: 'text',
    // },
}

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
