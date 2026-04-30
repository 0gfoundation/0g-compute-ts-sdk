# 0G Compute Network SDK - Code Review Standards

This document defines code review standards for the 0G Compute Network SDK and CLI project. Claude will follow these standards when reviewing code.

## Project Overview

**0G Compute Network SDK** (`@0gfoundation/0g-compute-ts-sdk`) is the client-side library and tooling for the 0G Compute Network. It enables developers to access decentralized AI inference and fine-tuning services through:

- **TypeScript SDK**: Programmatic access to AI services
- **CLI Tools**: Command-line interface for account management and service interaction
- **Web UI**: Browser-based interface for service discovery and testing

### Key Value Propositions
- **Developer-First**: OpenAI-compatible API for easy migration
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Multi-Interface**: SDK, CLI, and Web UI for different use cases
- **Verifiable**: Built-in TEE response verification

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              0G Compute Network SDK/CLI                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CLI Tools (src.ts/cli/)  ─┐                                │
│  Web UI (web-ui/)          ├──→ SDK (src.ts/sdk/) ──→ Blockchain
│  User Application          ─┘         ↓                      │
│                                  Provider Brokers            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Architecture Layers:**
1. **SDK Core** (`src.ts/sdk/`): The foundation library
2. **CLI** (`src.ts/cli/`): Command-line interface built on SDK
3. **Web UI** (`web-ui/`): React-based interface built on SDK

**Critical Design Principle**: CLI and Web UI are **consumers** of the SDK. They should NOT contain business logic. All business logic belongs in the SDK.

## Directory Structure and Rules

> **⚠️ Important**: When reviewing code, **skip compiled/generated directories**: `cli.commonjs/`, `lib.commonjs/`, `lib.esm/`, and `types/`. Focus on source code in `src.ts/`, `web-ui/`, and configuration files. See [Review Scope](#review-scope-and-priority) for details.
>
> **🚨 Breaking Changes**: Pay special attention to changes in `broker.ts` files as they define public APIs. Any signature changes are [BREAKING CHANGES] that impact all users. See [Breaking Changes Alert](#breaking-changes-alert-) for guidelines.

### 📁 `src.ts/sdk/` - SDK Core Library

The SDK is the **single source of truth** for all business logic. It's organized into service modules:

```
src.ts/sdk/
├── broker.ts              # Main entry point, network config
├── inference/             # AI inference service
├── fine-tuning/           # Model fine-tuning service
├── ledger/                # Account & balance management
└── common/                # Shared utilities
```

#### General SDK Rules
- ✅ **Export clean APIs**: All public methods must be intuitive and well-documented
- ✅ **No side effects**: Functions should be pure when possible
- ✅ **Error handling**: Always wrap blockchain calls with proper error handling
- ✅ **Type safety**: No `any` types in public APIs
- ❌ **No CLI/UI code**: SDK must work in any environment (Node.js, browser, React Native)
- ❌ **No console.log**: Use proper logging utilities or events

---

### 📁 `src.ts/sdk/broker.ts` - Main Entry Point

**Purpose**: Creates and initializes all service brokers (ledger, inference, fine-tuning).

**Responsibilities:**
- Network configuration (testnet, mainnet, hardhat)
- Contract address management
- Service broker initialization
- Dev mode detection

**Code Rules:**
```typescript
// ✅ GOOD: Clean factory pattern
export async function createZGComputeNetworkBroker(
  signer: JsonRpcSigner | Wallet
): Promise<ZGComputeNetworkBroker> {
  const chainId = await signer.getChainId();
  const contracts = getContractAddresses(chainId);

  const ledger = await createLedgerBroker(signer, contracts.ledger);
  const inference = await createInferenceBroker(signer, contracts.inference, ledger);
  const fineTuning = await createFineTuningBroker(signer, contracts.fineTuning, ledger);

  return { ledger, inference, fineTuning };
}

// ❌ BAD: Exposing internal details
export function createBroker(options: any) {
  // Forcing users to understand internal implementation
}
```

**Review Checklist:**
- [ ] Contract addresses are correct for each network
- [ ] Dev mode detection works in all environments (Node.js, browser, Next.js)
- [ ] Network auto-detection logic is robust
- [ ] All service brokers are properly initialized

---

### 📁 `src.ts/sdk/inference/` - AI Inference Service

**Purpose**: Handle AI inference requests (chatbot, text-to-image, speech-to-text).

**Directory Structure:**
```
inference/
├── broker/                # Service orchestration
│   ├── broker.ts         # Public API (InferenceBroker class)
│   ├── request.ts        # Request header generation
│   ├── response.ts       # Response processing & fee settlement
│   ├── verifier.ts       # TEE signature verification
│   ├── account.ts        # Provider account management
│   ├── model.ts          # Service discovery
│   └── base.ts           # Internal utilities
├── contract/             # Smart contract interaction
│   ├── inference.ts      # Contract wrapper
│   └── typechain/        # Generated contract types
└── extractor/            # Usage data extraction
    ├── chatbot.ts        # Extract token usage
    ├── textToImage.ts    # Extract image count
    └── speech-to-text.ts # Extract audio duration
```

#### `inference/broker/broker.ts` - Public API

**Purpose**: The **only** file that exposes public methods to SDK users.

**Code Organization:**
```typescript
export class InferenceBroker {
  // Internal processors (not exposed)
  private requestProcessor: RequestProcessor;
  private responseProcessor: ResponseProcessor;
  private verifier: Verifier;

  // Public API methods (exposed to users)
  public async listService() { ... }
  public async getServiceMetadata() { ... }
  public async getRequestHeaders() { ... }
  public async processResponse() { ... }
  public async acknowledgeProviderSigner() { ... }
}
```

**Code Rules:**
- ✅ **Public methods only**: Only expose methods users need
- ✅ **Delegate to processors**: Actual logic in separate processor files
- ✅ **Consistent naming**: All public methods use camelCase
- ✅ **Complete JSDoc**: Every public method needs full documentation
- ❌ **No direct contract calls**: Use processors/contract wrappers
- ❌ **No complex logic**: Keep broker.ts thin, logic goes in processors

**Review Checklist:**
- [ ] Public API is intuitive and self-explanatory
- [ ] All methods have proper error handling
- [ ] JSDoc includes examples for complex methods
- [ ] Return types are properly typed (no `any`)

#### `inference/broker/request.ts` - Request Processing & Preparation

**Purpose**: Handle all pre-request preparation, including header generation, account setup, provider verification, and automatic balance management.

**Responsibilities:**
- **Service Metadata**: Get provider endpoint and model information
- **Balance Management**: Check sub-account balance and top up from main account if needed (via `ledger.transferFund`)
- **Provider Verification**: Check if provider's TEE signer is acknowledged
- **User Acknowledgement**: Allow users to acknowledge/revoke trust in provider's TEE signer
- **Header Generation**: Generate authenticated request headers (bearer token)

**Key Methods:**
- `getServiceMetadata()`: Returns provider endpoint and model
- `getRequestHeaders()`: Calls `topUpAccountIfNeeded()` then generates headers (this is where automatic balance management happens)
- `checkProviderSignerStatus()`: Verifies TEE signer acknowledgement status, creates account if needed
- `acknowledgeProviderSigner()`: User acknowledges provider's TEE signer
- `ownerAcknowledgeTEESigner()`: Contract owner acknowledges provider's TEE signer

**Code Rules:**
```typescript
// ✅ GOOD: Complete pre-request flow
export class RequestProcessor {
  async getRequestHeaders(providerAddress: string, content?: string) {
    // 1. Check and top up balance if needed (uses cached fees from processResponse)
    await this.topUpAccountIfNeeded(providerAddress, content);

    // 2. Generate authentication headers
    return await this.getHeader(providerAddress);
  }

  async checkProviderSignerStatus(providerAddress: string) {
    // 1. Ensure user has an account (create if needed)
    try {
      await this.contract.getAccount(providerAddress);
    } catch {
      await this.ledger.transferFund(providerAddress, 'inference', minAmount);
    }

    // 2. Check TEE signer acknowledgement status
    const service = await this.getService(providerAddress);
    return {
      isAcknowledged: service.teeSignerAcknowledged,
      teeSignerAddress: service.teeSignerAddress
    };
  }
}

// ❌ BAD: Missing preparation steps
export class RequestProcessor {
  async generateHeaders(providerAddress: string) {
    // Only generating headers without checking balance or provider status
    return { Authorization: token };
  }
}
```

**Balance Management Logic:**
The `topUpAccountIfNeeded()` method implements smart balance management:
1. Uses cached fee estimates from `processResponse()` to track accumulated usage
2. When accumulated fees reach a threshold (e.g., 1000 units), checks actual sub-account balance
3. If balance is low (< 500 units), tops up to 1000 units via `ledger.transferFund()`
4. This minimizes blockchain calls while preventing service interruption

**Review Checklist:**
- [ ] Balance checks use cached fees efficiently
- [ ] Account creation is automatic and transparent
- [ ] TEE signer verification is performed
- [ ] No private key logging
- [ ] Gas estimation is included for transactions

#### `inference/broker/response.ts` - Response Processing

**Purpose**: Process inference responses by caching fee estimates and verifying TEE signatures.

**Responsibilities:**
- Extract usage data from response content (tokens, images, audio duration)
- Calculate and cache estimated fees per provider
- Verify TEE signatures if chatID is provided
- Check service verifiability status

**Important**: This processor does NOT directly transfer funds. It only caches fee estimates, which are later used by `RequestProcessor.getRequestHeaders()` to determine when balance top-ups are needed.

**Usage Context:**
- **Long-running SDK instances** (web servers, services): Fee caching enables smart balance management across multiple requests
- **CLI usage**: Cache is cleared on each CLI invocation, so the automatic balance management doesn't apply

**Code Rules:**
```typescript
// ✅ GOOD: Cache fees and verify
export class ResponseProcessor {
  async processResponse(providerAddress: string, chatID?: string, content?: string) {
    // 1. Calculate and cache fee estimate if usage data provided
    if (content) {
      const fee = await this.calculateFee(extractor, content);
      await this.updateCachedFee(providerAddress, fee);
    }

    // 2. Perform TEE verification if chatID provided
    if (chatID) {
      const service = await this.getService(providerAddress);
      if (!service.teeSignerAcknowledged) {
        console.warn('TEE Signer is not acknowledged');
        return false;
      }

      const signature = await Verifier.fetchSignatureByChatID(
        service.url,
        chatID,
        service.model
      );

      return Verifier.verifySignature(
        signature.text,
        signature.signature,
        service.teeSignerAddress
      );
    }

    return null; // No verification performed
  }
}

// ❌ BAD: Trying to manage funds here
export class ResponseProcessor {
  async processResponse(providerAddress: string, usage: Usage) {
    const fee = this.calculateFee(usage);
    // Don't do this - fund management is RequestProcessor's job
    if (balance < fee) {
      await this.ledger.transferFund(providerAddress, fee);
    }
  }
}
```

**Review Checklist:**
- [ ] Fee calculation matches provider pricing
- [ ] Cache updates are efficient (no excessive writes)
- [ ] TEE verification handles missing signatures gracefully
- [ ] Verification failures are logged but don't crash
- [ ] Usage extraction works for all service types (chatbot, image, speech)

#### `inference/broker/verifier.ts` - TEE Verification

**Purpose**: Verify that inference responses came from a genuine TEE environment.

**Responsibilities:**
- Fetch provider's TEE public key from contract
- Verify response signatures using TEE key
- Cache verification results
- Handle verification failures gracefully

**Code Rules:**
```typescript
// ✅ GOOD: Comprehensive verification
export class Verifier {
  async verifyResponse(
    providerAddress: string,
    chatID: string,
    responseData: unknown
  ): Promise<VerificationResult> {
    // 1. Get cached or fetch TEE public key
    const teeKey = await this.getTEEPublicKey(providerAddress);

    // 2. Extract signature from response
    const signature = this.extractSignature(responseData);

    // 3. Verify signature
    const isValid = this.verifySignature(chatID, signature, teeKey);

    if (!isValid) {
      console.warn(`⚠️ TEE verification failed for provider ${providerAddress}`);
      // Don't throw - verification failure is not a fatal error
    }

    return { isValid, teeKey, signature };
  }
}

// ❌ BAD: Throwing on verification failure
export class Verifier {
  async verifyResponse(...) {
    const isValid = this.verifySignature(...);
    if (!isValid) {
      throw new Error('Verification failed'); // Too aggressive
    }
  }
}
```

**Review Checklist:**
- [ ] Public key extraction from attestation is correct
- [ ] Signature format matches provider implementation
- [ ] Verification failure is logged but doesn't crash
- [ ] Cache TTL for TEE keys is reasonable (e.g., 24 hours)

#### `inference/broker/account.ts` - Account Management

**Purpose**: Manage provider-specific sub-accounts (acknowledge, check balances).

**Code Rules:**
- ✅ Simple, focused on account operations
- ❌ Don't mix with request/response processing

#### `inference/broker/model.ts` - Service Discovery

**Purpose**: List and retrieve AI service metadata.

**Code Rules:**
- ✅ Cache service metadata (TTL: 5-10 minutes)
- ✅ Filter out unacknowledged providers by default
- ❌ Don't fetch usage or balance data here

#### `inference/contract/` - Smart Contract Wrapper

**Purpose**: Encapsulate all blockchain interactions.

**Code Rules:**
```typescript
// ✅ GOOD: Clean contract wrapper
export class InferenceServingContract {
  private contract: InferenceServing;

  async getService(address: string): Promise<Service> {
    try {
      const result = await this.contract.getService(address);
      return this.formatService(result);
    } catch (error) {
      if (error.code === 'CALL_EXCEPTION') {
        throw new ServiceNotFoundError(address);
      }
      throw error;
    }
  }
}

// ❌ BAD: Exposing raw contract
export function getContract() {
  return new InferenceServing__factory().attach(address);
}
```

**Review Checklist:**
- [ ] All contract calls have proper error handling
- [ ] Gas estimation is included for transactions
- [ ] Return types are converted to SDK types (not raw contract types)
- [ ] Events are properly typed and parsed

#### `inference/extractor/` - Usage Extraction

**Purpose**: Extract usage data from different service types.

**Code Rules:**
```typescript
// ✅ GOOD: Service-specific extractors
export class ChatbotExtractor {
  extract(response: ChatCompletionResponse): Usage {
    return {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
    };
  }
}

// ❌ BAD: Generic extraction that fails
export function extractUsage(response: any): any {
  return response.usage || response.data?.usage || {};
}
```

**Review Checklist:**
- [ ] Handles both streaming and non-streaming responses
- [ ] Extracts all relevant usage metrics
- [ ] Handles missing usage data gracefully
- [ ] Works with different response formats

---

### 📁 `src.ts/sdk/fine-tuning/` - Model Fine-Tuning Service

**Purpose**: Manage model fine-tuning tasks and encrypted model delivery.

**Directory Structure:**
```
fine-tuning/
├── broker/              # Service orchestration
│   ├── broker.ts       # Public API (FineTuningBroker class)
│   ├── model.ts        # Model listing and encryption/decryption
│   ├── dataset.ts      # Dataset upload/download and token calculation
│   └── service.ts      # Task lifecycle management
├── contract/           # Smart contract interaction
├── provider/           # Provider communication
├── zg-storage/         # 0G Storage integration
└── token/              # Token counting utilities
```

#### `fine-tuning/broker/broker.ts` - Public API

**Purpose**: Expose fine-tuning operations to SDK users.

**Code Rules:**
- ✅ **Task lifecycle**: Create, monitor, acknowledge, decrypt
- ✅ **State validation**: Ensure valid state transitions
- ✅ **Provider queue**: Handle busy providers gracefully
- ❌ **No storage logic**: Delegate to zg-storage module

**Review Checklist:**
- [ ] Task creation validates all parameters
- [ ] State transitions follow the state machine
- [ ] Encrypted model download is secure
- [ ] Decryption key is only shared after user confirms

#### `fine-tuning/broker/service.ts` - Task Management

**Purpose**: Handle task lifecycle and state management.

**Task State Machine:**
```
Init → SettingUp → SetUp → Training → Trained →
Delivering → Delivered → UserAcknowledged → Finished
            ↓ (any stage)
          Failed
```

**Code Rules:**
```typescript
// ✅ GOOD: Validate state transitions
export class ServiceProcessor {
  async updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    const task = await this.getTask(taskId);

    if (!this.isValidTransition(task.status, newStatus)) {
      throw new InvalidStateTransitionError(task.status, newStatus);
    }

    await this.contract.updateTaskStatus(taskId, newStatus);
  }

  private isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
    const validTransitions = {
      [TaskStatus.Init]: [TaskStatus.SettingUp, TaskStatus.Failed],
      [TaskStatus.SettingUp]: [TaskStatus.SetUp, TaskStatus.Failed],
      // ...
    };
    return validTransitions[from]?.includes(to) ?? false;
  }
}

// ❌ BAD: No validation
export class ServiceProcessor {
  async updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    await this.contract.updateTaskStatus(taskId, newStatus); // Unsafe
  }
}
```

**Review Checklist:**
- [ ] State transitions are validated
- [ ] Provider queue logic is correct (FIFO)
- [ ] Failed tasks release provider capacity
- [ ] Task history is preserved

#### `fine-tuning/broker/model.ts` - Model Management

**Purpose**: Manage model listing, acknowledgement, and encryption/decryption.

**Responsibilities:**
- **List Models**: Enumerate available pre-trained and customized models
- **Acknowledge Model**: Download and confirm receipt of fine-tuned models
- **Decrypt Model**: Decrypt fine-tuned models after acknowledgement

**Code Rules:**
```typescript
// ✅ GOOD: Clear model operations
export class ModelProcessor {
  async listModel(): Promise<[string, { [key: string]: string }][][]> {
    // Returns [standardModels, customizedModels]
    const services = await this.contract.listService();
    const customizedModels = await this.fetchCustomizedModels(services);
    return [Object.entries(MODEL_HASH_MAP), customizedModels];
  }

  async acknowledgeModel(providerAddress: string, taskId: string, dataPath: string) {
    // 1. Get deliverable info from contract
    const deliverable = await this.contract.getDeliverable(providerAddress, taskId);

    // 2. Download encrypted model from 0G Storage
    await download(dataPath, hexToRoots(deliverable.modelRootHash));

    // 3. Confirm on-chain
    await this.contract.acknowledgeDeliverable(providerAddress, taskId);
  }

  async decryptModel(providerAddress: string, taskId: string, encryptedPath: string, decryptedPath: string) {
    // 1. Verify deliverable is acknowledged
    const deliverable = await this.contract.getDeliverable(providerAddress, taskId);
    if (!deliverable.acknowledged) {
      throw new Error('Deliverable not acknowledged yet');
    }

    // 2. Decrypt the encryption key using user's private key
    const secret = await eciesDecrypt(this.signer, deliverable.encryptedSecret);

    // 3. Decrypt the model file
    await aesGCMDecryptToFile(secret, encryptedPath, decryptedPath);
  }
}
```

**Security Rules:**
- ✅ **Strong encryption**: AES-256-GCM for model, ECIES for key
- ✅ **Key management**: User's public key for encryption, private key for decryption
- ✅ **Secure deletion**: Clear keys from memory after use
- ❌ **No key logging**: Never log encryption/decryption keys

**Review Checklist:**
- [ ] Encryption algorithm is secure (AES-256-GCM)
- [ ] Key exchange follows proper protocol (ECIES)
- [ ] Decryption only happens after acknowledgement
- [ ] Model listing handles both standard and customized models
- [ ] Temporary files are cleaned up

#### `fine-tuning/broker/dataset.ts` - Dataset Management

**Purpose**: Handle dataset operations including upload, download, and token calculation.

**Responsibilities:**
- **Upload Dataset**: Upload training data to 0G Storage
- **Download Dataset**: Download datasets from 0G Storage
- **Calculate Tokens**: Compute token count for cost estimation

**Code Rules:**
```typescript
// ✅ GOOD: Focused dataset operations
export class DatasetProcessor {
  async uploadDataset(privateKey: string, dataPath: string, gasPrice?: number) {
    // Upload to 0G Storage and return root hash
    await upload(privateKey, dataPath, gasPrice);
  }

  async downloadDataset(dataPath: string, dataRoot: string) {
    // Download from 0G Storage using root hash
    await download(dataPath, dataRoot);
  }

  async calculateToken(
    datasetPath: string,
    usePython: boolean,
    preTrainedModelName: string,
    providerAddress?: string
  ): Promise<number> {
    // 1. Get tokenizer configuration
    let tokenizer: string;
    let dataType: string;

    if (preTrainedModelName in MODEL_HASH_MAP) {
      // Standard model
      tokenizer = MODEL_HASH_MAP[preTrainedModelName].tokenizer;
      dataType = MODEL_HASH_MAP[preTrainedModelName].type;
    } else {
      // Customized model - fetch from provider
      if (!providerAddress) {
        throw new Error('Provider address required for customized model');
      }
      const model = await this.servingProvider.getCustomizedModel(
        providerAddress,
        preTrainedModelName
      );
      tokenizer = model.tokenizer;
      dataType = model.dataType;
    }

    // 2. Calculate token count
    const dataSize = usePython
      ? await calculateTokenSizeViaPython(tokenizer, datasetPath, dataType)
      : await calculateTokenSizeViaExe(tokenizer, datasetPath, dataType, ...);

    console.log(`Token size for ${datasetPath}: ${dataSize}`);
    return dataSize;
  }
}

// ❌ BAD: Mixing dataset and model operations
export class ModelProcessor {
  async uploadDataset(...) { /* Don't mix concerns */ }
  async decryptModel(...) { /* Different responsibility */ }
}
```

**Token Calculation:**
- Supports both Python-based and executable-based token counting
- Automatically selects appropriate tokenizer based on model
- Handles both standard pre-trained models and customized models
- Returns token count for accurate cost estimation

**Review Checklist:**
- [ ] Upload handles large files efficiently (chunked upload)
- [ ] Download verifies file integrity (checksum)
- [ ] Token calculation supports all model types
- [ ] Tokenizer selection is correct for each model
- [ ] Provider address validation for customized models
- [ ] Proper error handling for network failures

#### `fine-tuning/zg-storage/` - 0G Storage Integration

**Purpose**: Upload/download datasets and models to 0G Storage.

**Code Rules:**
- ✅ **Root hash validation**: Verify hash format (0x + 64 hex chars)
- ✅ **Chunked upload**: Handle large files efficiently
- ✅ **Retry logic**: Network failures are common, retry with backoff
- ❌ **No file caching**: Don't store large files in memory

**Review Checklist:**
- [ ] File upload handles large files (>1GB)
- [ ] Download verifies file integrity (checksum)
- [ ] Network errors are retried with exponential backoff
- [ ] Progress reporting for long uploads/downloads

#### `fine-tuning/provider/` - Provider Communication

**Purpose**: Communicate with fine-tuning providers.

**Code Rules:**
- ✅ Poll for task status updates (don't spam)
- ✅ Handle provider errors gracefully
- ❌ Don't expose provider URLs to users (security)

---

### 📁 `src.ts/sdk/ledger/` - Account Management

**Purpose**: Manage user accounts and balances.

**Directory Structure:**
```
ledger/
├── broker.ts           # Public API (account operations)
├── ledger.ts           # Ledger contract wrapper
└── contract/           # Smart contract interaction
```

#### `ledger/broker.ts` - Account API

**Purpose**: Provide account management functions.

**Public Methods:**
- `depositFund(amount)`: Deposit 0G tokens to main account
- `getLedger()`: Get account balance and sub-accounts
- `retrieveFund(providerAddress)`: Request refund from sub-account (24h lock)
- `refund(amount)`: Withdraw to wallet after lock period

**Code Rules:**
```typescript
// ✅ GOOD: User-friendly API
export class LedgerBroker {
  async depositFund(amount: number) {
    const amountWei = ethers.parseEther(amount.toString());
    const gasLimit = await this.contract.estimateGas.deposit(amountWei);

    const tx = await this.contract.deposit(amountWei, { gasLimit });
    await tx.wait();

    return { amount, txHash: tx.hash };
  }
}

// ❌ BAD: Exposing blockchain complexity
export class LedgerBroker {
  async deposit(amountWei: bigint, gasOptions: GasOptions) {
    // User has to understand Wei, gas, etc.
  }
}
```

**Review Checklist:**
- [ ] Amounts are converted from user-friendly units (0G) to Wei
- [ ] Gas estimation is automatic
- [ ] Transaction confirmation is awaited
- [ ] Balance updates are reflected immediately (optimistic UI)

---

### 📁 `src.ts/sdk/common/` - Shared Utilities

**Purpose**: Utilities used across all services.

**Directory Structure:**
```
common/
├── utils/              # Helper functions
│   ├── error.ts        # Error formatting
│   └── crypto.ts       # Cryptography helpers
├── storage/            # Caching and metadata
│   ├── cache.ts        # In-memory cache
│   └── metadata.ts     # Service metadata storage
├── automata/           # State machines
└── logger.ts           # Logging utilities
```

#### Code Rules for Utilities
- ✅ **Pure functions**: No side effects
- ✅ **Well-tested**: High test coverage (>90%)
- ✅ **Documented**: Clear JSDoc for all exports
- ❌ **No business logic**: Utilities are generic, not service-specific

**Review Checklist:**
- [ ] Functions are pure and reusable
- [ ] Error messages are user-friendly
- [ ] No dependencies on specific services
- [ ] TypeScript types are strict

---

### 📁 `src.ts/cli/` - Command Line Interface

**Purpose**: Provide command-line tools built on top of the SDK.

**Architecture Principle**: CLI is a **thin wrapper** around SDK. It should:
- ✅ Parse command-line arguments
- ✅ Format output for terminal display
- ✅ Handle user interaction (prompts, spinners)
- ✅ Call SDK methods
- ❌ **NO business logic** - all logic must be in SDK

**Directory Structure:**
```
cli/
├── cli.ts              # Main CLI entry point
├── inference.ts        # Inference commands
├── fine-tuning.ts      # Fine-tuning commands
├── ledger.ts           # Account commands
├── controller.ts       # Provider controller commands
├── auth.ts             # Login/authentication
├── config.ts           # Configuration management
├── network.ts          # Network selection
└── util.ts             # CLI helpers (spinners, prompts)
```

#### General CLI Rules

```typescript
// ✅ GOOD: Thin wrapper around SDK
export async function depositCommand(amount: number) {
  const broker = await loadBroker();
  const spinner = ora('Depositing funds...').start();

  try {
    const result = await broker.ledger.depositFund(amount);
    spinner.succeed(`✅ Deposited ${amount} 0G tokens`);
    console.log(`Transaction: ${result.txHash}`);
  } catch (error) {
    spinner.fail('❌ Deposit failed');
    console.error(formatError(error));
    process.exit(1);
  }
}

// ❌ BAD: Business logic in CLI
export async function depositCommand(amount: number) {
  // Don't implement blockchain logic here
  const contract = new ethers.Contract(...);
  const tx = await contract.deposit(ethers.parseEther(amount.toString()));
  // This should all be in SDK
}
```

#### CLI User Experience Rules

**Error Messages:**
```typescript
// ✅ GOOD: Actionable errors
if (balance < amount) {
  console.error('❌ Insufficient balance');
  console.error(`   Required: ${amount} 0G`);
  console.error(`   Available: ${balance} 0G`);
  console.error('\n💡 Add more funds:');
  console.error(`   0g-compute-cli deposit --amount ${amount - balance + 1}`);
  process.exit(1);
}

// ❌ BAD: Technical jargon
console.error('Error: InsufficientFundsException at line 142');
```

**Progress Indicators:**
```typescript
// ✅ GOOD: Visual feedback
const spinner = ora('Waiting for transaction confirmation...').start();
await tx.wait();
spinner.succeed('✅ Transaction confirmed');

// ❌ BAD: Silent operations
await tx.wait(); // User sees nothing for 15 seconds
```

**Interactive Prompts:**
```typescript
// ✅ GOOD: Confirm destructive actions
const confirmed = await confirm({
  message: 'This will delete all local data. Continue?',
  default: false,
});

if (!confirmed) {
  console.log('Cancelled.');
  process.exit(0);
}

// ❌ BAD: No confirmation
await deleteAllData(); // Dangerous!
```

#### CLI File-Specific Rules

**`cli/inference.ts`** - Inference Commands
- Commands: `list-providers`, `acknowledge-provider`, `get-secret`, `serve`, `verify`
- Focus on output formatting (tables, JSON)
- Delegate all logic to `broker.inference`

**`cli/fine-tuning.ts`** - Fine-tuning Commands
- Commands: `create-task`, `get-task`, `acknowledge-model`, `decrypt-model`
- Handle file I/O (dataset upload, model download)
- Progress bars for long operations
- Delegate crypto operations to SDK

**`cli/ledger.ts`** - Account Commands
- Commands: `deposit`, `refund`, `get-account`, `transfer-fund`, `retrieve-fund`
- Display balances in user-friendly format
- Confirm before transactions
- Delegate all blockchain operations to SDK

**`cli/controller.ts`** - Provider Controller
- Commands for service providers to manage their infrastructure
- Authenticate with provider endpoints
- Display container status in tables
- Handle YAML/JSON config files

**Review Checklist for CLI:**
- [ ] All commands use SDK methods (no direct contract calls)
- [ ] Errors are user-friendly with actionable suggestions
- [ ] Long operations show progress indicators
- [ ] Destructive actions require confirmation
- [ ] Output is well-formatted (tables, colors, emojis)
- [ ] Help text is clear and includes examples

---

### 📁 `web-ui/` - Web User Interface

**Purpose**: React-based web interface for service discovery and testing.

**Architecture Principle**: Web UI is built on top of SDK, similar to CLI.

**Directory Structure:**
```
web-ui/
├── app/                # Next.js app router pages
├── components/         # React components
│   ├── marketplace/    # Service browsing
│   ├── chat/           # Chat interface
│   └── account/        # Wallet & balance
├── hooks/              # React hooks for SDK
├── lib/                # Web-specific utilities
└── shared/             # Shared assets
```

#### General Web UI Rules

```typescript
// ✅ GOOD: React hook wrapping SDK
export function useInferenceService(providerAddress: string) {
  const { broker } = useBroker();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchService() {
      try {
        const svc = await broker.inference.getServiceMetadata(providerAddress);
        setService(svc);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchService();
  }, [providerAddress, broker]);

  return { service, loading, error };
}

// ❌ BAD: Business logic in component
export function ServiceCard({ address }) {
  const [service, setService] = useState(null);

  useEffect(() => {
    // Don't call contracts directly from components
    const contract = new ethers.Contract(...);
    contract.getService(address).then(setService);
  }, [address]);
}
```

#### Web UI File-Specific Rules

**`components/marketplace/`** - Service Discovery
- Display available services in cards/tables
- Filter by service type, price, verification status
- Use SDK's `listService()` method
- Cache results to avoid repeated calls

**`components/chat/`** - Chat Interface
- Real-time streaming responses
- Token usage display
- Use SDK's `getRequestHeaders()` and `processResponse()`
- Handle both streaming and non-streaming modes

**`components/account/`** - Wallet Integration
- Connect wallet (MetaMask, WalletConnect)
- Display balance and sub-accounts
- Deposit/withdraw interface
- Use SDK's ledger methods

**`hooks/`** - React Hooks
- Wrap SDK methods in React hooks
- Handle loading/error states
- Provide reactive updates

**Review Checklist for Web UI:**
- [ ] All SDK calls are wrapped in React hooks
- [ ] Loading and error states are handled
- [ ] Wallet connection is secure (no private key exposure)
- [ ] Responsive design (mobile-friendly)
- [ ] No business logic in components (use SDK)
- [ ] Proper TypeScript types (no `any`)

---

## Code Review Focus Areas

### 1. TypeScript Standards

#### Must Follow
- Strict TypeScript mode enabled
- No `any` types unless absolutely necessary
- Comprehensive JSDoc for public APIs
- Proper error types (not `unknown` or `any`)

#### Type Safety
```typescript
// ✅ GOOD: Proper typing
interface InferenceRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
}

async function sendRequest(req: InferenceRequest): Promise<InferenceResponse> {
  // Implementation...
}

// ❌ BAD: Using any
async function sendRequest(req: any): Promise<any> {
  // Implementation...
}
```

#### Naming Conventions
- Functions: camelCase (e.g., `getServiceMetadata`)
- Classes: PascalCase (e.g., `InferenceBroker`)
- Constants: UPPER_SNAKE_CASE (e.g., `DEFAULT_GAS_LIMIT`)
- Interfaces: PascalCase without `I` prefix (e.g., `Service`, not `IService`)

### 2. SDK API Design

#### Developer Experience
```typescript
// ✅ GOOD: Intuitive, chainable API
const broker = await createZGComputeNetworkBroker(signer);
await broker.ledger.depositFund(10);
const services = await broker.inference.listService();

// ❌ BAD: Confusing API
const broker = new Broker();
await broker.init(signer);
await broker.ledger.deposit(10, { wait: true });
const services = await broker.getServices("inference");
```

#### Error Handling
```typescript
// ✅ GOOD: Descriptive errors with context
class InsufficientBalanceError extends Error {
  constructor(
    public required: bigint,
    public available: bigint,
    public providerAddress: string
  ) {
    super(
      `Insufficient balance: need ${required} but have ${available} for provider ${providerAddress}`
    );
    this.name = 'InsufficientBalanceError';
  }
}

// ❌ BAD: Generic errors
throw new Error("Not enough balance");
```

### 3. Blockchain Security

#### Private Key Handling
- [ ] Never log private keys or mnemonics
- [ ] Clear sensitive data from memory after use
- [ ] Use environment variables, never hardcode
- [ ] Warn users about private key security

```typescript
// ✅ GOOD: Secure key handling
const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY!,
  provider
);

// ❌ BAD: Hardcoded key
const wallet = new ethers.Wallet(
  "0x1234567890abcdef...",
  provider
);
```

#### Transaction Safety
```typescript
// ✅ GOOD: Proper gas estimation and error handling
async function depositFund(amount: number): Promise<void> {
  try {
    const amountWei = ethers.parseEther(amount.toString());
    const gasLimit = await contract.deposit.estimateGas(amountWei);

    const tx = await contract.deposit(amountWei, { gasLimit });
    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error("Transaction failed");
    }
  } catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new InsufficientWalletBalanceError(amount);
    }
    throw error;
  }
}
```

### 4. Async/Promise Patterns

#### Proper Error Handling
```typescript
// ✅ GOOD: Try-catch with specific error handling
async function fetchService(address: string): Promise<Service> {
  try {
    const service = await contract.getService(address);
    return service;
  } catch (error) {
    if (error.code === 'CALL_EXCEPTION') {
      throw new ServiceNotFoundError(address);
    }
    throw error;
  }
}

// ❌ BAD: Unhandled promise rejection
async function fetchService(address: string): Promise<Service> {
  return contract.getService(address); // May throw, not handled
}
```

#### Concurrent Operations
```typescript
// ✅ GOOD: Parallel execution when possible
const [account, services, balance] = await Promise.all([
  broker.ledger.getLedger(),
  broker.inference.listService(),
  broker.ledger.getBalance()
]);

// ❌ BAD: Sequential when not needed
const account = await broker.ledger.getLedger();
const services = await broker.inference.listService();
const balance = await broker.ledger.getBalance();
```

### 5. Testing Requirements

#### Unit Tests
```typescript
// ✅ GOOD: Comprehensive test cases
describe('InferenceBroker', () => {
  describe('listService', () => {
    it('should return list of services', async () => {
      const services = await broker.inference.listService();
      expect(services).toBeInstanceOf(Array);
      expect(services.length).toBeGreaterThan(0);
    });

    it('should filter unacknowledged providers by default', async () => {
      const services = await broker.inference.listService();
      const unacknowledged = services.filter(s => !s.isAcknowledged);
      expect(unacknowledged).toHaveLength(0);
    });

    it('should include unacknowledged when flag is set', async () => {
      const services = await broker.inference.listService(0, 50, true);
      expect(services).toBeInstanceOf(Array);
      // May or may not have unacknowledged services
    });
  });
});
```

#### Integration Tests
- Test with local blockchain (Hardhat/Ganache)
- Mock provider services
- Test CLI commands end-to-end

### 6. Documentation Standards

#### JSDoc Requirements
```typescript
/**
 * Processes an inference response by caching fee estimates and verifying TEE signature.
 *
 * @param providerAddress - Address of the AI service provider
 * @param chatID - Optional response identifier for TEE verification
 * @param receivedContent - Optional usage data for fee estimation and caching
 * @returns Promise resolving to true if verification passed, false if failed, null if no chatID provided
 *
 * @example
 * ```typescript
 * const response = await fetch(endpoint, { headers });
 * const data = await response.json();
 * const chatID = response.headers.get('ZG-Res-Key');
 *
 * const isValid = await broker.inference.processResponse(
 *   providerAddress,
 *   chatID,
 *   JSON.stringify(data.usage)
 * );
 * ```
 *
 * @remarks
 * This method caches fee estimates which are used by getRequestHeaders() to determine
 * when to top up sub-account balance. Fee caching is only effective in long-running
 * SDK instances (e.g., web servers), not in CLI usage where cache is cleared on each run.
 *
 * @throws {ProviderNotFoundError} If provider doesn't exist
 */
async function processResponse(
  providerAddress: string,
  chatID?: string,
  receivedContent?: string
): Promise<boolean | null> {
  // Implementation...
}
```

## Common Anti-Patterns to Avoid

### ❌ Architecture Violations

```typescript
// BAD: Business logic in CLI
export async function depositCommand(amount: number) {
  const contract = new ethers.Contract(...);
  const tx = await contract.deposit(ethers.parseEther(amount.toString()));
  // This should be in SDK!
}

// BAD: Business logic in Web UI component
export function DepositButton({ amount }) {
  const onClick = async () => {
    const contract = new ethers.Contract(...);
    await contract.deposit(amount);
    // This should be in SDK!
  };
}

// BAD: CLI/UI code in SDK
export class InferenceBroker {
  async listService() {
    const services = await this.contract.listServices();
    console.log('Services:', services); // NO! SDK shouldn't log
    return services;
  }
}
```

### ❌ TypeScript
```typescript
// BAD: Using any
function processData(data: any): any {
  return data.result;
}

// BAD: Type assertion without validation
const service = response as Service;

// BAD: Ignoring async errors
broker.depositFund(10); // Missing await
```

### ❌ Error Handling
```typescript
// BAD: Silent failures
try {
  await operation();
} catch (error) {
  // Ignore error
}

// BAD: Generic error messages
throw new Error("Something went wrong");

// BAD: Exposing internal errors to users
console.error(error.stack); // Shows technical details
```

### ❌ Security
```typescript
// BAD: Logging sensitive data
console.log('Private key:', wallet.privateKey);

// BAD: No input validation
async function transferFund(address: string, amount: number) {
  return contract.transfer(address, amount); // No validation
}

// BAD: Trusting user input
const gasPrice = userInput.gasPrice; // Could be malicious
```

## Review Process Guidelines

### Review Scope and Priority

#### Files to SKIP (Generated/Build Artifacts)
**DO NOT review** the following directories - they contain compiled/generated code:
- ❌ `cli.commonjs/` - Compiled CLI output
- ❌ `lib.commonjs/` - Compiled CommonJS output
- ❌ `lib.esm/` - Compiled ES Module output
- ❌ `types/` - Generated TypeScript type definitions

**Focus reviews on source files only**: `src.ts/`, `web-ui/`, and documentation files.

#### Breaking Changes Alert 🚨

**CRITICAL**: When reviewing changes to **public API files** (`broker.ts`), pay special attention as these directly impact users:

**High-Priority Breaking Change Files:**
```
src.ts/sdk/inference/broker/broker.ts         # InferenceBroker public API
src.ts/sdk/fine-tuning/broker/broker.ts       # FineTuningBroker public API
src.ts/sdk/ledger/broker.ts                   # LedgerBroker public API
src.ts/sdk/broker.ts                          # Main ZGComputeNetworkBroker API
```

**When ANY public method signature changes in these files:**

1. **Flag as [BREAKING CHANGE]** immediately
2. **Assess impact**:
   - Method signature changed (parameters added/removed/reordered)
   - Return type changed
   - Method renamed or removed
   - New required parameters added
3. **Document migration path**:
   - Provide before/after examples
   - Suggest deprecation warnings if appropriate
   - Update SDK version (major bump for breaking changes)
4. **Check documentation**:
   - README examples must be updated
   - JSDoc must reflect new signature
   - Migration guide needed for major changes

**Example Breaking Change Alert:**
```
[BREAKING CHANGE] src.ts/sdk/inference/broker/broker.ts:338
Issue: getRequestHeaders() parameter order changed
Old: getRequestHeaders(providerAddress: string, content?: string)
New: getRequestHeaders(content: string, providerAddress?: string)
Impact: ALL users calling this method will break
Required Actions:
  1. Add deprecation warning for old signature (if backward compat possible)
  2. Document migration in CHANGELOG.md
  3. Bump major version (e.g., 1.x.x → 2.0.0)
  4. Update all examples in README and docs
```

**Non-Breaking API Changes (Still Important):**
- New optional parameters (append to end)
- New methods added (no removal)
- Internal implementation changes (no signature change)
- Bug fixes that don't change behavior

Even non-breaking changes to broker.ts files should be carefully reviewed for:
- Consistency with existing API patterns
- Proper JSDoc documentation
- Backward compatibility considerations

### Severity Levels
1. **[CRITICAL]**: Security vulnerabilities, data loss risk, wallet safety
2. **[HIGH]**: Architecture violations, **API breaking changes**, type safety issues
3. **[MEDIUM]**: UX problems, missing documentation, test coverage
4. **[LOW/nit]**: Code style, naming, minor improvements

### Feedback Format
When reviewing code:
1. **Specify severity** and exact location (file:line)
2. **Explain the issue** and its impact
3. **Provide fix suggestions** with code examples
4. **Highlight good practices** with positive feedback

### Example Review Comments
```
[CRITICAL] src.ts/sdk/ledger/broker.ts:89
Issue: Private key is logged in error message
Impact: Private key exposure in logs is a critical security risk
Fix: Remove private key from error, only log wallet address
```

```
[HIGH] src.ts/cli/inference.ts:45-67
Issue: Business logic implemented in CLI instead of SDK
Impact: Logic cannot be reused by Web UI or other consumers
Fix: Move logic to src.ts/sdk/inference/broker/broker.ts and call from CLI
```

```
✅ src.ts/sdk/inference/broker/verifier.ts:45-67
Good: Excellent TEE verification with proper error handling. The
fallback logic for missing chatID is well implemented.
```

```
[nit] src.ts/cli/commands/deposit.ts:34
Suggestion: Consider adding a spinner for the transaction wait time
to improve user experience during the ~15 second confirmation period.
```

## Reference Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [ethers.js Documentation](https://docs.ethers.org/v6/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [0G Compute Network Docs](https://docs.0g.ai/developer-hub/building-on-0g/compute-network)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

---

**Note**: Code reviews should be constructive and helpful. The goal is to improve code quality and developer experience, not to criticize. Always assume good intent and provide actionable feedback.
