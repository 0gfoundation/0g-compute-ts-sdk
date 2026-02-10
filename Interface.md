# Compute Network Customer Interface

## Inference

1. add ledger
2. deposit fund (optional)
3. refund fund (optional)
4. list services
5. acknowledge provider signer
6. generate header
    1. transfer fund to sub account
7. call openai SDK
8. verify response

## FineTuning

1. add ledger: 0g-compute-cli add-account
2. get ledger: 0g-compute-cli get-account
3. deposit fund (optional) 0g-compute-cli deposit -a <>
4. refund fund (optional) 0g-compute-cli refund -a <>
5. list services
6. acknowledge provider signer
    1. [`call provider url/v1/quote`] call provider quote api to download quote (contains provider signer)
    2. [`TBD`] verify the quote using third party service (TODO: Jiahao discuss with Phala)
    3. [`call contract`] acknowledge the provider signer in contract
7. [`use 0g storage sdk`] upload dataset, get dataset root hash
8. create task
    1. get preTrained model root hash based on the model
    2. [`call contract`] calculate fee
    3. [`call contract`] transfer fund from ledger to fine-tuning provider
    4. [`call provider url/v1/task`]call provider task creation api to create task
9. [`call provider url/v1/task-progress`] call provider task progress api to get task progress
10. acknowledge encrypted model with root hash
    1. [`call contract`] get deliverable with root hash
    2. [`use 0g storage sdk`] download model, calculate root hash, compare with provided root hash
    3. [`call contract`] acknowledge the model in contract
11. decrypt model
    1. [`call contract`] get deliverable with encryptedSecret
    2. decrypt the encryptedSecret
    3. decrypt model with secret [TODO: Discuss LiuYuan]

### Code Structure

#### util

1. storage-client
2. provider-client
3. encryption

#### module

1. broker (main)
2. ledger (1-3)
3. service
   listService (4)
   acknowledgeProviderSigner (5)
   createTask (7)
   getTaskProgress (8)
4. model
   uploadDataset (6)
   acknowledgeModel (9)
   decryptModel (10)

### Structure

1. Leger structure

    ```solidity
    struct Ledger {
        address user;
        uint availableBalance;
        uint totalBalance;
        uint[2] inferenceSigner;
        string additionalInfo;
        address[] inferenceProviders;
        address[] fineTuningProviders;
    }
    ```

2. Service structure

    ```solidity
    struct Service {
        address provider;
        string name;
        string url;
        Quota quota;
        uint pricePerToken;
        address providerSigner;
        bool occupied;
    }
    ```

3. FineTuning account structure

    ```solidity
    struct Account {
        address user;
        address provider;
        uint nonce;
        uint balance;
        uint pendingRefund;
        Refund[] refunds;
        string additionalInfo;
        address providerSigner;
        Deliverable[] deliverables;
    }

    struct Deliverable {
        bytes modelRootHash;
        bytes encryptedSecret;
        bool acknowledged;
    }
    ```

### Provider interface

1. Endpoint: https://github.com/0glabs/0g-serving-broker/blob/main/api/fine-tuning/internal/handler/handler.go#L23
2. Task Model: https://github.com/0glabs/0g-serving-broker/blob/main/api/fine-tuning/schema/task.go#L12
3. Task creation example:

    ```bash
    curl -X POST http://Domain/v1/task -d '{
    "customerAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "datasetHash": "0xe080961aa45248f8855dbd540fb40c4927b980c6dc773740da79f19c0b2570c2",
    "isTurbo": true,
    "preTrainedModelHash": "0xe080961aa45248f8855dbd540fb40c4927b980c6dc773740da79f19c0b2570c2",
    "trainingParams": "{
        "CustomerAddress": "0xabc",
        "PreTrainedModelHash": "0x7f2244b25cd2219dfd9d14c052982ecce409356e0f08e839b79796e270d110a7",
        "DatasetHash": "0xaae9b4e031e06f84b20f10ec629f36c57719ea512992a6b7e2baea93f447a5fa",
        "IsTurbo": true,
        "TrainingParams": "{\"num_train_epochs\": 3, \"per_device_train_batch_size\": 16, \"per_device_eval_batch_size\": 16, \"warmup_steps\": 500, \"weight_decay\": 0.01, \"logging_dir\": \"./logs\", \"logging_steps\": 100, \"evaluation_strategy\": \"no\", \"save_strategy\": \"steps\", \"save_steps\": 500, \"eval_steps\": 500, \"load_best_model_at_end\": false, \"metric_for_best_model\": \"accuracy\", \"greater_is_better\": true, \"report_to\": [\"none\"]}"
    }"
    }'
    ```
