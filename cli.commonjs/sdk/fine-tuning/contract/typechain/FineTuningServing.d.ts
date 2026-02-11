import type { BaseContract, BigNumberish, BytesLike, FunctionFragment, Result, Interface, EventFragment, AddressLike, ContractRunner, ContractMethod, Listener } from 'ethers';
import type { TypedContractEvent, TypedDeferredTopicFilter, TypedEventLog, TypedLogDescription, TypedListener, TypedContractMethod } from './common.js';
export type QuotaStruct = {
    cpuCount: BigNumberish;
    nodeMemory: BigNumberish;
    gpuCount: BigNumberish;
    nodeStorage: BigNumberish;
    gpuType: string;
};
export type QuotaStructOutput = [
    cpuCount: bigint,
    nodeMemory: bigint,
    gpuCount: bigint,
    nodeStorage: bigint,
    gpuType: string
] & {
    cpuCount: bigint;
    nodeMemory: bigint;
    gpuCount: bigint;
    nodeStorage: bigint;
    gpuType: string;
};
export type RefundStruct = {
    index: BigNumberish;
    amount: BigNumberish;
    createdAt: BigNumberish;
    _deprecated_processed: boolean;
};
export type RefundStructOutput = [
    index: bigint,
    amount: bigint,
    createdAt: bigint,
    _deprecated_processed: boolean
] & {
    index: bigint;
    amount: bigint;
    createdAt: bigint;
    _deprecated_processed: boolean;
};
export type DeliverableStruct = {
    id: string;
    modelRootHash: BytesLike;
    encryptedSecret: BytesLike;
    acknowledged: boolean;
    timestamp: BigNumberish;
    settled: boolean;
};
export type DeliverableStructOutput = [
    id: string,
    modelRootHash: string,
    encryptedSecret: string,
    acknowledged: boolean,
    timestamp: bigint,
    settled: boolean
] & {
    id: string;
    modelRootHash: string;
    encryptedSecret: string;
    acknowledged: boolean;
    timestamp: bigint;
    settled: boolean;
};
export type AccountDetailsStruct = {
    user: AddressLike;
    provider: AddressLike;
    nonce: BigNumberish;
    balance: BigNumberish;
    pendingRefund: BigNumberish;
    refunds: RefundStruct[];
    additionalInfo: string;
    deliverables: DeliverableStruct[];
    validRefundsLength: BigNumberish;
    deliverablesHead: BigNumberish;
    deliverablesCount: BigNumberish;
    acknowledged: boolean;
};
export type AccountDetailsStructOutput = [
    user: string,
    provider: string,
    nonce: bigint,
    balance: bigint,
    pendingRefund: bigint,
    refunds: RefundStructOutput[],
    additionalInfo: string,
    deliverables: DeliverableStructOutput[],
    validRefundsLength: bigint,
    deliverablesHead: bigint,
    deliverablesCount: bigint,
    acknowledged: boolean
] & {
    user: string;
    provider: string;
    nonce: bigint;
    balance: bigint;
    pendingRefund: bigint;
    refunds: RefundStructOutput[];
    additionalInfo: string;
    deliverables: DeliverableStructOutput[];
    validRefundsLength: bigint;
    deliverablesHead: bigint;
    deliverablesCount: bigint;
    acknowledged: boolean;
};
export type AccountSummaryStruct = {
    user: AddressLike;
    provider: AddressLike;
    nonce: BigNumberish;
    balance: BigNumberish;
    pendingRefund: BigNumberish;
    additionalInfo: string;
    validRefundsLength: BigNumberish;
    deliverablesCount: BigNumberish;
    acknowledged: boolean;
};
export type AccountSummaryStructOutput = [
    user: string,
    provider: string,
    nonce: bigint,
    balance: bigint,
    pendingRefund: bigint,
    additionalInfo: string,
    validRefundsLength: bigint,
    deliverablesCount: bigint,
    acknowledged: boolean
] & {
    user: string;
    provider: string;
    nonce: bigint;
    balance: bigint;
    pendingRefund: bigint;
    additionalInfo: string;
    validRefundsLength: bigint;
    deliverablesCount: bigint;
    acknowledged: boolean;
};
export type ServiceStruct = {
    provider: AddressLike;
    url: string;
    quota: QuotaStruct;
    pricePerToken: BigNumberish;
    occupied: boolean;
    models: string[];
    teeSignerAddress: AddressLike;
    teeSignerAcknowledged: boolean;
};
export type ServiceStructOutput = [
    provider: string,
    url: string,
    quota: QuotaStructOutput,
    pricePerToken: bigint,
    occupied: boolean,
    models: string[],
    teeSignerAddress: string,
    teeSignerAcknowledged: boolean
] & {
    provider: string;
    url: string;
    quota: QuotaStructOutput;
    pricePerToken: bigint;
    occupied: boolean;
    models: string[];
    teeSignerAddress: string;
    teeSignerAcknowledged: boolean;
};
export type VerifierInputStruct = {
    id: string;
    encryptedSecret: BytesLike;
    modelRootHash: BytesLike;
    nonce: BigNumberish;
    signature: BytesLike;
    taskFee: BigNumberish;
    user: AddressLike;
};
export type VerifierInputStructOutput = [
    id: string,
    encryptedSecret: string,
    modelRootHash: string,
    nonce: bigint,
    signature: string,
    taskFee: bigint,
    user: string
] & {
    id: string;
    encryptedSecret: string;
    modelRootHash: string;
    nonce: bigint;
    signature: string;
    taskFee: bigint;
    user: string;
};
export interface FineTuningServingInterface extends Interface {
    getFunction(nameOrSignature: 'MAX_LOCKTIME' | 'MIN_LOCKTIME' | 'MIN_PROVIDER_STAKE' | 'accountExists' | 'acknowledgeDeliverable' | 'acknowledgeTEESigner' | 'acknowledgeTEESignerByOwner' | 'addAccount' | 'addDeliverable' | 'addOrUpdateService' | 'deleteAccount' | 'depositFund' | 'getAccount' | 'getAccountsByProvider' | 'getAccountsByUser' | 'getAllAccounts' | 'getAllServices' | 'getBatchAccountsByUsers' | 'getDeliverable' | 'getDeliverables' | 'getPendingRefund' | 'getService' | 'initialize' | 'initialized' | 'ledgerAddress' | 'lockTime' | 'owner' | 'penaltyPercentage' | 'processRefund' | 'removeService' | 'renounceOwnership' | 'requestRefundAll' | 'revokeTEESignerAcknowledgement' | 'settleFees' | 'supportsInterface' | 'transferOwnership' | 'updateLockTime' | 'updatePenaltyPercentage'): FunctionFragment;
    getEvent(nameOrSignatureOrTopic: 'AccountDeleted' | 'BalanceUpdated' | 'DeliverableAcknowledged' | 'DeliverableAdded' | 'DeliverableEvicted' | 'FeesSettled' | 'Initialized' | 'LockTimeUpdated' | 'OwnershipTransferred' | 'ProviderStakeReturned' | 'ProviderStaked' | 'ProviderTEESignerAcknowledged' | 'RefundRequested' | 'ServiceRemoved' | 'ServiceUpdated'): EventFragment;
    encodeFunctionData(functionFragment: 'MAX_LOCKTIME', values?: undefined): string;
    encodeFunctionData(functionFragment: 'MIN_LOCKTIME', values?: undefined): string;
    encodeFunctionData(functionFragment: 'MIN_PROVIDER_STAKE', values?: undefined): string;
    encodeFunctionData(functionFragment: 'accountExists', values: [AddressLike, AddressLike]): string;
    encodeFunctionData(functionFragment: 'acknowledgeDeliverable', values: [AddressLike, string]): string;
    encodeFunctionData(functionFragment: 'acknowledgeTEESigner', values: [AddressLike, boolean]): string;
    encodeFunctionData(functionFragment: 'acknowledgeTEESignerByOwner', values: [AddressLike]): string;
    encodeFunctionData(functionFragment: 'addAccount', values: [AddressLike, AddressLike, string]): string;
    encodeFunctionData(functionFragment: 'addDeliverable', values: [AddressLike, string, BytesLike]): string;
    encodeFunctionData(functionFragment: 'addOrUpdateService', values: [
        string,
        QuotaStruct,
        BigNumberish,
        boolean,
        string[],
        AddressLike
    ]): string;
    encodeFunctionData(functionFragment: 'deleteAccount', values: [AddressLike, AddressLike]): string;
    encodeFunctionData(functionFragment: 'depositFund', values: [AddressLike, AddressLike, BigNumberish]): string;
    encodeFunctionData(functionFragment: 'getAccount', values: [AddressLike, AddressLike]): string;
    encodeFunctionData(functionFragment: 'getAccountsByProvider', values: [AddressLike, BigNumberish, BigNumberish]): string;
    encodeFunctionData(functionFragment: 'getAccountsByUser', values: [AddressLike, BigNumberish, BigNumberish]): string;
    encodeFunctionData(functionFragment: 'getAllAccounts', values: [BigNumberish, BigNumberish]): string;
    encodeFunctionData(functionFragment: 'getAllServices', values?: undefined): string;
    encodeFunctionData(functionFragment: 'getBatchAccountsByUsers', values: [AddressLike[]]): string;
    encodeFunctionData(functionFragment: 'getDeliverable', values: [AddressLike, AddressLike, string]): string;
    encodeFunctionData(functionFragment: 'getDeliverables', values: [AddressLike, AddressLike]): string;
    encodeFunctionData(functionFragment: 'getPendingRefund', values: [AddressLike, AddressLike]): string;
    encodeFunctionData(functionFragment: 'getService', values: [AddressLike]): string;
    encodeFunctionData(functionFragment: 'initialize', values: [BigNumberish, AddressLike, AddressLike, BigNumberish]): string;
    encodeFunctionData(functionFragment: 'initialized', values?: undefined): string;
    encodeFunctionData(functionFragment: 'ledgerAddress', values?: undefined): string;
    encodeFunctionData(functionFragment: 'lockTime', values?: undefined): string;
    encodeFunctionData(functionFragment: 'owner', values?: undefined): string;
    encodeFunctionData(functionFragment: 'penaltyPercentage', values?: undefined): string;
    encodeFunctionData(functionFragment: 'processRefund', values: [AddressLike, AddressLike]): string;
    encodeFunctionData(functionFragment: 'removeService', values?: undefined): string;
    encodeFunctionData(functionFragment: 'renounceOwnership', values?: undefined): string;
    encodeFunctionData(functionFragment: 'requestRefundAll', values: [AddressLike, AddressLike]): string;
    encodeFunctionData(functionFragment: 'revokeTEESignerAcknowledgement', values: [AddressLike]): string;
    encodeFunctionData(functionFragment: 'settleFees', values: [VerifierInputStruct]): string;
    encodeFunctionData(functionFragment: 'supportsInterface', values: [BytesLike]): string;
    encodeFunctionData(functionFragment: 'transferOwnership', values: [AddressLike]): string;
    encodeFunctionData(functionFragment: 'updateLockTime', values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: 'updatePenaltyPercentage', values: [BigNumberish]): string;
    decodeFunctionResult(functionFragment: 'MAX_LOCKTIME', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'MIN_LOCKTIME', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'MIN_PROVIDER_STAKE', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'accountExists', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'acknowledgeDeliverable', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'acknowledgeTEESigner', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'acknowledgeTEESignerByOwner', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'addAccount', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'addDeliverable', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'addOrUpdateService', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'deleteAccount', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'depositFund', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getAccount', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getAccountsByProvider', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getAccountsByUser', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getAllAccounts', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getAllServices', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getBatchAccountsByUsers', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getDeliverable', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getDeliverables', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getPendingRefund', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getService', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'initialize', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'initialized', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'ledgerAddress', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'lockTime', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'owner', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'penaltyPercentage', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'processRefund', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'removeService', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'renounceOwnership', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'requestRefundAll', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'revokeTEESignerAcknowledgement', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'settleFees', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'supportsInterface', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'transferOwnership', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'updateLockTime', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'updatePenaltyPercentage', data: BytesLike): Result;
}
export declare namespace AccountDeletedEvent {
    type InputTuple = [
        user: AddressLike,
        provider: AddressLike,
        refundedAmount: BigNumberish
    ];
    type OutputTuple = [
        user: string,
        provider: string,
        refundedAmount: bigint
    ];
    interface OutputObject {
        user: string;
        provider: string;
        refundedAmount: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace BalanceUpdatedEvent {
    type InputTuple = [
        user: AddressLike,
        provider: AddressLike,
        amount: BigNumberish,
        pendingRefund: BigNumberish
    ];
    type OutputTuple = [
        user: string,
        provider: string,
        amount: bigint,
        pendingRefund: bigint
    ];
    interface OutputObject {
        user: string;
        provider: string;
        amount: bigint;
        pendingRefund: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace DeliverableAcknowledgedEvent {
    type InputTuple = [
        user: AddressLike,
        provider: AddressLike,
        deliverableId: string,
        timestamp: BigNumberish
    ];
    type OutputTuple = [
        user: string,
        provider: string,
        deliverableId: string,
        timestamp: bigint
    ];
    interface OutputObject {
        user: string;
        provider: string;
        deliverableId: string;
        timestamp: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace DeliverableAddedEvent {
    type InputTuple = [
        user: AddressLike,
        provider: AddressLike,
        deliverableId: string,
        modelRootHash: BytesLike,
        timestamp: BigNumberish
    ];
    type OutputTuple = [
        user: string,
        provider: string,
        deliverableId: string,
        modelRootHash: string,
        timestamp: bigint
    ];
    interface OutputObject {
        user: string;
        provider: string;
        deliverableId: string;
        modelRootHash: string;
        timestamp: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace DeliverableEvictedEvent {
    type InputTuple = [
        provider: AddressLike,
        user: AddressLike,
        evictedDeliverableId: string,
        newDeliverableId: string,
        timestamp: BigNumberish
    ];
    type OutputTuple = [
        provider: string,
        user: string,
        evictedDeliverableId: string,
        newDeliverableId: string,
        timestamp: bigint
    ];
    interface OutputObject {
        provider: string;
        user: string;
        evictedDeliverableId: string;
        newDeliverableId: string;
        timestamp: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace FeesSettledEvent {
    type InputTuple = [
        user: AddressLike,
        provider: AddressLike,
        deliverableId: string,
        fee: BigNumberish,
        acknowledged: boolean,
        nonce: BigNumberish
    ];
    type OutputTuple = [
        user: string,
        provider: string,
        deliverableId: string,
        fee: bigint,
        acknowledged: boolean,
        nonce: bigint
    ];
    interface OutputObject {
        user: string;
        provider: string;
        deliverableId: string;
        fee: bigint;
        acknowledged: boolean;
        nonce: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace InitializedEvent {
    type InputTuple = [version: BigNumberish];
    type OutputTuple = [version: bigint];
    interface OutputObject {
        version: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace LockTimeUpdatedEvent {
    type InputTuple = [
        oldLockTime: BigNumberish,
        newLockTime: BigNumberish
    ];
    type OutputTuple = [oldLockTime: bigint, newLockTime: bigint];
    interface OutputObject {
        oldLockTime: bigint;
        newLockTime: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace OwnershipTransferredEvent {
    type InputTuple = [previousOwner: AddressLike, newOwner: AddressLike];
    type OutputTuple = [previousOwner: string, newOwner: string];
    interface OutputObject {
        previousOwner: string;
        newOwner: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace ProviderStakeReturnedEvent {
    type InputTuple = [provider: AddressLike, amount: BigNumberish];
    type OutputTuple = [provider: string, amount: bigint];
    interface OutputObject {
        provider: string;
        amount: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace ProviderStakedEvent {
    type InputTuple = [provider: AddressLike, amount: BigNumberish];
    type OutputTuple = [provider: string, amount: bigint];
    interface OutputObject {
        provider: string;
        amount: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace ProviderTEESignerAcknowledgedEvent {
    type InputTuple = [
        provider: AddressLike,
        teeSignerAddress: AddressLike,
        acknowledged: boolean
    ];
    type OutputTuple = [
        provider: string,
        teeSignerAddress: string,
        acknowledged: boolean
    ];
    interface OutputObject {
        provider: string;
        teeSignerAddress: string;
        acknowledged: boolean;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace RefundRequestedEvent {
    type InputTuple = [
        user: AddressLike,
        provider: AddressLike,
        index: BigNumberish,
        timestamp: BigNumberish
    ];
    type OutputTuple = [
        user: string,
        provider: string,
        index: bigint,
        timestamp: bigint
    ];
    interface OutputObject {
        user: string;
        provider: string;
        index: bigint;
        timestamp: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace ServiceRemovedEvent {
    type InputTuple = [provider: AddressLike];
    type OutputTuple = [provider: string];
    interface OutputObject {
        provider: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace ServiceUpdatedEvent {
    type InputTuple = [
        provider: AddressLike,
        url: string,
        quota: QuotaStruct,
        pricePerToken: BigNumberish,
        teeSignerAddress: AddressLike,
        occupied: boolean
    ];
    type OutputTuple = [
        provider: string,
        url: string,
        quota: QuotaStructOutput,
        pricePerToken: bigint,
        teeSignerAddress: string,
        occupied: boolean
    ];
    interface OutputObject {
        provider: string;
        url: string;
        quota: QuotaStructOutput;
        pricePerToken: bigint;
        teeSignerAddress: string;
        occupied: boolean;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export interface FineTuningServing extends BaseContract {
    connect(runner?: ContractRunner | null): FineTuningServing;
    waitForDeployment(): Promise<this>;
    interface: FineTuningServingInterface;
    queryFilter<TCEvent extends TypedContractEvent>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    queryFilter<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    listeners<TCEvent extends TypedContractEvent>(event: TCEvent): Promise<Array<TypedListener<TCEvent>>>;
    listeners(eventName?: string): Promise<Array<Listener>>;
    removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
    MAX_LOCKTIME: TypedContractMethod<[], [bigint], 'view'>;
    MIN_LOCKTIME: TypedContractMethod<[], [bigint], 'view'>;
    MIN_PROVIDER_STAKE: TypedContractMethod<[], [bigint], 'view'>;
    accountExists: TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike
    ], [
        boolean
    ], 'view'>;
    acknowledgeDeliverable: TypedContractMethod<[
        provider: AddressLike,
        id: string
    ], [
        void
    ], 'nonpayable'>;
    acknowledgeTEESigner: TypedContractMethod<[
        provider: AddressLike,
        acknowledged: boolean
    ], [
        void
    ], 'nonpayable'>;
    acknowledgeTEESignerByOwner: TypedContractMethod<[
        provider: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    addAccount: TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike,
        additionalInfo: string
    ], [
        void
    ], 'payable'>;
    addDeliverable: TypedContractMethod<[
        user: AddressLike,
        id: string,
        modelRootHash: BytesLike
    ], [
        void
    ], 'nonpayable'>;
    addOrUpdateService: TypedContractMethod<[
        url: string,
        quota: QuotaStruct,
        pricePerToken: BigNumberish,
        occupied: boolean,
        models: string[],
        teeSignerAddress: AddressLike
    ], [
        void
    ], 'payable'>;
    deleteAccount: TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    depositFund: TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike,
        cancelRetrievingAmount: BigNumberish
    ], [
        void
    ], 'payable'>;
    getAccount: TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike
    ], [
        AccountDetailsStructOutput
    ], 'view'>;
    getAccountsByProvider: TypedContractMethod<[
        provider: AddressLike,
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            AccountSummaryStructOutput[],
            bigint
        ] & {
            accounts: AccountSummaryStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getAccountsByUser: TypedContractMethod<[
        user: AddressLike,
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            AccountSummaryStructOutput[],
            bigint
        ] & {
            accounts: AccountSummaryStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getAllAccounts: TypedContractMethod<[
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            AccountSummaryStructOutput[],
            bigint
        ] & {
            accounts: AccountSummaryStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getAllServices: TypedContractMethod<[], [ServiceStructOutput[]], 'view'>;
    getBatchAccountsByUsers: TypedContractMethod<[
        users: AddressLike[]
    ], [
        AccountSummaryStructOutput[]
    ], 'view'>;
    getDeliverable: TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike,
        id: string
    ], [
        DeliverableStructOutput
    ], 'view'>;
    getDeliverables: TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike
    ], [
        DeliverableStructOutput[]
    ], 'view'>;
    getPendingRefund: TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike
    ], [
        bigint
    ], 'view'>;
    getService: TypedContractMethod<[
        provider: AddressLike
    ], [
        ServiceStructOutput
    ], 'view'>;
    initialize: TypedContractMethod<[
        _locktime: BigNumberish,
        _ledgerAddress: AddressLike,
        owner: AddressLike,
        _penaltyPercentage: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    initialized: TypedContractMethod<[], [boolean], 'view'>;
    ledgerAddress: TypedContractMethod<[], [string], 'view'>;
    lockTime: TypedContractMethod<[], [bigint], 'view'>;
    owner: TypedContractMethod<[], [string], 'view'>;
    penaltyPercentage: TypedContractMethod<[], [bigint], 'view'>;
    processRefund: TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike
    ], [
        [
            bigint,
            bigint,
            bigint
        ] & {
            totalAmount: bigint;
            balance: bigint;
            pendingRefund: bigint;
        }
    ], 'nonpayable'>;
    removeService: TypedContractMethod<[], [void], 'nonpayable'>;
    renounceOwnership: TypedContractMethod<[], [void], 'nonpayable'>;
    requestRefundAll: TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    revokeTEESignerAcknowledgement: TypedContractMethod<[
        provider: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    settleFees: TypedContractMethod<[
        verifierInput: VerifierInputStruct
    ], [
        void
    ], 'nonpayable'>;
    supportsInterface: TypedContractMethod<[
        interfaceId: BytesLike
    ], [
        boolean
    ], 'view'>;
    transferOwnership: TypedContractMethod<[
        newOwner: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    updateLockTime: TypedContractMethod<[
        _locktime: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    updatePenaltyPercentage: TypedContractMethod<[
        _penaltyPercentage: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
    getFunction(nameOrSignature: 'MAX_LOCKTIME'): TypedContractMethod<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'MIN_LOCKTIME'): TypedContractMethod<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'MIN_PROVIDER_STAKE'): TypedContractMethod<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'accountExists'): TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike
    ], [
        boolean
    ], 'view'>;
    getFunction(nameOrSignature: 'acknowledgeDeliverable'): TypedContractMethod<[
        provider: AddressLike,
        id: string
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'acknowledgeTEESigner'): TypedContractMethod<[
        provider: AddressLike,
        acknowledged: boolean
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'acknowledgeTEESignerByOwner'): TypedContractMethod<[provider: AddressLike], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'addAccount'): TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike,
        additionalInfo: string
    ], [
        void
    ], 'payable'>;
    getFunction(nameOrSignature: 'addDeliverable'): TypedContractMethod<[
        user: AddressLike,
        id: string,
        modelRootHash: BytesLike
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'addOrUpdateService'): TypedContractMethod<[
        url: string,
        quota: QuotaStruct,
        pricePerToken: BigNumberish,
        occupied: boolean,
        models: string[],
        teeSignerAddress: AddressLike
    ], [
        void
    ], 'payable'>;
    getFunction(nameOrSignature: 'deleteAccount'): TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'depositFund'): TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike,
        cancelRetrievingAmount: BigNumberish
    ], [
        void
    ], 'payable'>;
    getFunction(nameOrSignature: 'getAccount'): TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike
    ], [
        AccountDetailsStructOutput
    ], 'view'>;
    getFunction(nameOrSignature: 'getAccountsByProvider'): TypedContractMethod<[
        provider: AddressLike,
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            AccountSummaryStructOutput[],
            bigint
        ] & {
            accounts: AccountSummaryStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getFunction(nameOrSignature: 'getAccountsByUser'): TypedContractMethod<[
        user: AddressLike,
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            AccountSummaryStructOutput[],
            bigint
        ] & {
            accounts: AccountSummaryStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getFunction(nameOrSignature: 'getAllAccounts'): TypedContractMethod<[
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            AccountSummaryStructOutput[],
            bigint
        ] & {
            accounts: AccountSummaryStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getFunction(nameOrSignature: 'getAllServices'): TypedContractMethod<[], [ServiceStructOutput[]], 'view'>;
    getFunction(nameOrSignature: 'getBatchAccountsByUsers'): TypedContractMethod<[
        users: AddressLike[]
    ], [
        AccountSummaryStructOutput[]
    ], 'view'>;
    getFunction(nameOrSignature: 'getDeliverable'): TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike,
        id: string
    ], [
        DeliverableStructOutput
    ], 'view'>;
    getFunction(nameOrSignature: 'getDeliverables'): TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike
    ], [
        DeliverableStructOutput[]
    ], 'view'>;
    getFunction(nameOrSignature: 'getPendingRefund'): TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike
    ], [
        bigint
    ], 'view'>;
    getFunction(nameOrSignature: 'getService'): TypedContractMethod<[
        provider: AddressLike
    ], [
        ServiceStructOutput
    ], 'view'>;
    getFunction(nameOrSignature: 'initialize'): TypedContractMethod<[
        _locktime: BigNumberish,
        _ledgerAddress: AddressLike,
        owner: AddressLike,
        _penaltyPercentage: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'initialized'): TypedContractMethod<[], [boolean], 'view'>;
    getFunction(nameOrSignature: 'ledgerAddress'): TypedContractMethod<[], [string], 'view'>;
    getFunction(nameOrSignature: 'lockTime'): TypedContractMethod<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'owner'): TypedContractMethod<[], [string], 'view'>;
    getFunction(nameOrSignature: 'penaltyPercentage'): TypedContractMethod<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'processRefund'): TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike
    ], [
        [
            bigint,
            bigint,
            bigint
        ] & {
            totalAmount: bigint;
            balance: bigint;
            pendingRefund: bigint;
        }
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'removeService'): TypedContractMethod<[], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'renounceOwnership'): TypedContractMethod<[], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'requestRefundAll'): TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'revokeTEESignerAcknowledgement'): TypedContractMethod<[provider: AddressLike], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'settleFees'): TypedContractMethod<[
        verifierInput: VerifierInputStruct
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'supportsInterface'): TypedContractMethod<[interfaceId: BytesLike], [boolean], 'view'>;
    getFunction(nameOrSignature: 'transferOwnership'): TypedContractMethod<[newOwner: AddressLike], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'updateLockTime'): TypedContractMethod<[_locktime: BigNumberish], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'updatePenaltyPercentage'): TypedContractMethod<[
        _penaltyPercentage: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    getEvent(key: 'AccountDeleted'): TypedContractEvent<AccountDeletedEvent.InputTuple, AccountDeletedEvent.OutputTuple, AccountDeletedEvent.OutputObject>;
    getEvent(key: 'BalanceUpdated'): TypedContractEvent<BalanceUpdatedEvent.InputTuple, BalanceUpdatedEvent.OutputTuple, BalanceUpdatedEvent.OutputObject>;
    getEvent(key: 'DeliverableAcknowledged'): TypedContractEvent<DeliverableAcknowledgedEvent.InputTuple, DeliverableAcknowledgedEvent.OutputTuple, DeliverableAcknowledgedEvent.OutputObject>;
    getEvent(key: 'DeliverableAdded'): TypedContractEvent<DeliverableAddedEvent.InputTuple, DeliverableAddedEvent.OutputTuple, DeliverableAddedEvent.OutputObject>;
    getEvent(key: 'DeliverableEvicted'): TypedContractEvent<DeliverableEvictedEvent.InputTuple, DeliverableEvictedEvent.OutputTuple, DeliverableEvictedEvent.OutputObject>;
    getEvent(key: 'FeesSettled'): TypedContractEvent<FeesSettledEvent.InputTuple, FeesSettledEvent.OutputTuple, FeesSettledEvent.OutputObject>;
    getEvent(key: 'Initialized'): TypedContractEvent<InitializedEvent.InputTuple, InitializedEvent.OutputTuple, InitializedEvent.OutputObject>;
    getEvent(key: 'LockTimeUpdated'): TypedContractEvent<LockTimeUpdatedEvent.InputTuple, LockTimeUpdatedEvent.OutputTuple, LockTimeUpdatedEvent.OutputObject>;
    getEvent(key: 'OwnershipTransferred'): TypedContractEvent<OwnershipTransferredEvent.InputTuple, OwnershipTransferredEvent.OutputTuple, OwnershipTransferredEvent.OutputObject>;
    getEvent(key: 'ProviderStakeReturned'): TypedContractEvent<ProviderStakeReturnedEvent.InputTuple, ProviderStakeReturnedEvent.OutputTuple, ProviderStakeReturnedEvent.OutputObject>;
    getEvent(key: 'ProviderStaked'): TypedContractEvent<ProviderStakedEvent.InputTuple, ProviderStakedEvent.OutputTuple, ProviderStakedEvent.OutputObject>;
    getEvent(key: 'ProviderTEESignerAcknowledged'): TypedContractEvent<ProviderTEESignerAcknowledgedEvent.InputTuple, ProviderTEESignerAcknowledgedEvent.OutputTuple, ProviderTEESignerAcknowledgedEvent.OutputObject>;
    getEvent(key: 'RefundRequested'): TypedContractEvent<RefundRequestedEvent.InputTuple, RefundRequestedEvent.OutputTuple, RefundRequestedEvent.OutputObject>;
    getEvent(key: 'ServiceRemoved'): TypedContractEvent<ServiceRemovedEvent.InputTuple, ServiceRemovedEvent.OutputTuple, ServiceRemovedEvent.OutputObject>;
    getEvent(key: 'ServiceUpdated'): TypedContractEvent<ServiceUpdatedEvent.InputTuple, ServiceUpdatedEvent.OutputTuple, ServiceUpdatedEvent.OutputObject>;
    filters: {
        'AccountDeleted(address,address,uint256)': TypedContractEvent<AccountDeletedEvent.InputTuple, AccountDeletedEvent.OutputTuple, AccountDeletedEvent.OutputObject>;
        AccountDeleted: TypedContractEvent<AccountDeletedEvent.InputTuple, AccountDeletedEvent.OutputTuple, AccountDeletedEvent.OutputObject>;
        'BalanceUpdated(address,address,uint256,uint256)': TypedContractEvent<BalanceUpdatedEvent.InputTuple, BalanceUpdatedEvent.OutputTuple, BalanceUpdatedEvent.OutputObject>;
        BalanceUpdated: TypedContractEvent<BalanceUpdatedEvent.InputTuple, BalanceUpdatedEvent.OutputTuple, BalanceUpdatedEvent.OutputObject>;
        'DeliverableAcknowledged(address,address,string,uint256)': TypedContractEvent<DeliverableAcknowledgedEvent.InputTuple, DeliverableAcknowledgedEvent.OutputTuple, DeliverableAcknowledgedEvent.OutputObject>;
        DeliverableAcknowledged: TypedContractEvent<DeliverableAcknowledgedEvent.InputTuple, DeliverableAcknowledgedEvent.OutputTuple, DeliverableAcknowledgedEvent.OutputObject>;
        'DeliverableAdded(address,address,string,bytes,uint256)': TypedContractEvent<DeliverableAddedEvent.InputTuple, DeliverableAddedEvent.OutputTuple, DeliverableAddedEvent.OutputObject>;
        DeliverableAdded: TypedContractEvent<DeliverableAddedEvent.InputTuple, DeliverableAddedEvent.OutputTuple, DeliverableAddedEvent.OutputObject>;
        'DeliverableEvicted(address,address,string,string,uint256)': TypedContractEvent<DeliverableEvictedEvent.InputTuple, DeliverableEvictedEvent.OutputTuple, DeliverableEvictedEvent.OutputObject>;
        DeliverableEvicted: TypedContractEvent<DeliverableEvictedEvent.InputTuple, DeliverableEvictedEvent.OutputTuple, DeliverableEvictedEvent.OutputObject>;
        'FeesSettled(address,address,string,uint256,bool,uint256)': TypedContractEvent<FeesSettledEvent.InputTuple, FeesSettledEvent.OutputTuple, FeesSettledEvent.OutputObject>;
        FeesSettled: TypedContractEvent<FeesSettledEvent.InputTuple, FeesSettledEvent.OutputTuple, FeesSettledEvent.OutputObject>;
        'Initialized(uint8)': TypedContractEvent<InitializedEvent.InputTuple, InitializedEvent.OutputTuple, InitializedEvent.OutputObject>;
        Initialized: TypedContractEvent<InitializedEvent.InputTuple, InitializedEvent.OutputTuple, InitializedEvent.OutputObject>;
        'LockTimeUpdated(uint256,uint256)': TypedContractEvent<LockTimeUpdatedEvent.InputTuple, LockTimeUpdatedEvent.OutputTuple, LockTimeUpdatedEvent.OutputObject>;
        LockTimeUpdated: TypedContractEvent<LockTimeUpdatedEvent.InputTuple, LockTimeUpdatedEvent.OutputTuple, LockTimeUpdatedEvent.OutputObject>;
        'OwnershipTransferred(address,address)': TypedContractEvent<OwnershipTransferredEvent.InputTuple, OwnershipTransferredEvent.OutputTuple, OwnershipTransferredEvent.OutputObject>;
        OwnershipTransferred: TypedContractEvent<OwnershipTransferredEvent.InputTuple, OwnershipTransferredEvent.OutputTuple, OwnershipTransferredEvent.OutputObject>;
        'ProviderStakeReturned(address,uint256)': TypedContractEvent<ProviderStakeReturnedEvent.InputTuple, ProviderStakeReturnedEvent.OutputTuple, ProviderStakeReturnedEvent.OutputObject>;
        ProviderStakeReturned: TypedContractEvent<ProviderStakeReturnedEvent.InputTuple, ProviderStakeReturnedEvent.OutputTuple, ProviderStakeReturnedEvent.OutputObject>;
        'ProviderStaked(address,uint256)': TypedContractEvent<ProviderStakedEvent.InputTuple, ProviderStakedEvent.OutputTuple, ProviderStakedEvent.OutputObject>;
        ProviderStaked: TypedContractEvent<ProviderStakedEvent.InputTuple, ProviderStakedEvent.OutputTuple, ProviderStakedEvent.OutputObject>;
        'ProviderTEESignerAcknowledged(address,address,bool)': TypedContractEvent<ProviderTEESignerAcknowledgedEvent.InputTuple, ProviderTEESignerAcknowledgedEvent.OutputTuple, ProviderTEESignerAcknowledgedEvent.OutputObject>;
        ProviderTEESignerAcknowledged: TypedContractEvent<ProviderTEESignerAcknowledgedEvent.InputTuple, ProviderTEESignerAcknowledgedEvent.OutputTuple, ProviderTEESignerAcknowledgedEvent.OutputObject>;
        'RefundRequested(address,address,uint256,uint256)': TypedContractEvent<RefundRequestedEvent.InputTuple, RefundRequestedEvent.OutputTuple, RefundRequestedEvent.OutputObject>;
        RefundRequested: TypedContractEvent<RefundRequestedEvent.InputTuple, RefundRequestedEvent.OutputTuple, RefundRequestedEvent.OutputObject>;
        'ServiceRemoved(address)': TypedContractEvent<ServiceRemovedEvent.InputTuple, ServiceRemovedEvent.OutputTuple, ServiceRemovedEvent.OutputObject>;
        ServiceRemoved: TypedContractEvent<ServiceRemovedEvent.InputTuple, ServiceRemovedEvent.OutputTuple, ServiceRemovedEvent.OutputObject>;
        'ServiceUpdated(address,string,tuple,uint256,address,bool)': TypedContractEvent<ServiceUpdatedEvent.InputTuple, ServiceUpdatedEvent.OutputTuple, ServiceUpdatedEvent.OutputObject>;
        ServiceUpdated: TypedContractEvent<ServiceUpdatedEvent.InputTuple, ServiceUpdatedEvent.OutputTuple, ServiceUpdatedEvent.OutputObject>;
    };
}
//# sourceMappingURL=FineTuningServing.d.ts.map