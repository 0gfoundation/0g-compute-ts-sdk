import type { BaseContract, BigNumberish, BytesLike, FunctionFragment, Result, Interface, EventFragment, AddressLike, ContractRunner, ContractMethod, Listener } from 'ethers';
import type { TypedContractEvent, TypedDeferredTopicFilter, TypedEventLog, TypedLogDescription, TypedListener, TypedContractMethod } from './common.js';
export type ServiceParamsStruct = {
    serviceType: string;
    url: string;
    model: string;
    verifiability: string;
    inputPrice: BigNumberish;
    outputPrice: BigNumberish;
    additionalInfo: string;
    teeSignerAddress: AddressLike;
};
export type ServiceParamsStructOutput = [
    serviceType: string,
    url: string,
    model: string,
    verifiability: string,
    inputPrice: bigint,
    outputPrice: bigint,
    additionalInfo: string,
    teeSignerAddress: string
] & {
    serviceType: string;
    url: string;
    model: string;
    verifiability: string;
    inputPrice: bigint;
    outputPrice: bigint;
    additionalInfo: string;
    teeSignerAddress: string;
};
export type RefundStruct = {
    index: BigNumberish;
    amount: BigNumberish;
    createdAt: BigNumberish;
    processed: boolean;
};
export type RefundStructOutput = [
    index: bigint,
    amount: bigint,
    createdAt: bigint,
    processed: boolean
] & {
    index: bigint;
    amount: bigint;
    createdAt: bigint;
    processed: boolean;
};
export type AccountStruct = {
    user: AddressLike;
    provider: AddressLike;
    nonce: BigNumberish;
    balance: BigNumberish;
    pendingRefund: BigNumberish;
    refunds: RefundStruct[];
    additionalInfo: string;
    acknowledged: boolean;
    validRefundsLength: BigNumberish;
    generation: BigNumberish;
    revokedBitmap: BigNumberish;
};
export type AccountStructOutput = [
    user: string,
    provider: string,
    nonce: bigint,
    balance: bigint,
    pendingRefund: bigint,
    refunds: RefundStructOutput[],
    additionalInfo: string,
    acknowledged: boolean,
    validRefundsLength: bigint,
    generation: bigint,
    revokedBitmap: bigint
] & {
    user: string;
    provider: string;
    nonce: bigint;
    balance: bigint;
    pendingRefund: bigint;
    refunds: RefundStructOutput[];
    additionalInfo: string;
    acknowledged: boolean;
    validRefundsLength: bigint;
    generation: bigint;
    revokedBitmap: bigint;
};
export type ServiceStruct = {
    provider: AddressLike;
    serviceType: string;
    url: string;
    inputPrice: BigNumberish;
    outputPrice: BigNumberish;
    updatedAt: BigNumberish;
    model: string;
    verifiability: string;
    additionalInfo: string;
    teeSignerAddress: AddressLike;
    teeSignerAcknowledged: boolean;
};
export type ServiceStructOutput = [
    provider: string,
    serviceType: string,
    url: string,
    inputPrice: bigint,
    outputPrice: bigint,
    updatedAt: bigint,
    model: string,
    verifiability: string,
    additionalInfo: string,
    teeSignerAddress: string,
    teeSignerAcknowledged: boolean
] & {
    provider: string;
    serviceType: string;
    url: string;
    inputPrice: bigint;
    outputPrice: bigint;
    updatedAt: bigint;
    model: string;
    verifiability: string;
    additionalInfo: string;
    teeSignerAddress: string;
    teeSignerAcknowledged: boolean;
};
export type TEESettlementDataStruct = {
    user: AddressLike;
    provider: AddressLike;
    totalFee: BigNumberish;
    requestsHash: BytesLike;
    nonce: BigNumberish;
    signature: BytesLike;
};
export type TEESettlementDataStructOutput = [
    user: string,
    provider: string,
    totalFee: bigint,
    requestsHash: string,
    nonce: bigint,
    signature: string
] & {
    user: string;
    provider: string;
    totalFee: bigint;
    requestsHash: string;
    nonce: bigint;
    signature: string;
};
export interface InferenceServingInterface extends Interface {
    getFunction(nameOrSignature: 'MAX_LOCKTIME' | 'MIN_LOCKTIME' | 'MIN_PROVIDER_STAKE' | 'accountExists' | 'acknowledgeTEESigner' | 'acknowledgeTEESignerByOwner' | 'addAccount' | 'addOrUpdateService' | 'deleteAccount' | 'depositFund' | 'getAccount' | 'getAccountsByProvider' | 'getAccountsByUser' | 'getAllAccounts' | 'getAllServices' | 'getBatchAccountsByUsers' | 'getPendingRefund' | 'getService' | 'initialize' | 'initialized' | 'isTokenRevoked' | 'ledgerAddress' | 'lockTime' | 'owner' | 'previewSettlementResults' | 'processRefund' | 'removeService' | 'renounceOwnership' | 'requestRefundAll' | 'revokeAllTokens' | 'revokeTEESignerAcknowledgement' | 'revokeToken' | 'revokeTokens' | 'serviceExists' | 'settleFeesWithTEE' | 'supportsInterface' | 'transferOwnership' | 'updateLockTime'): FunctionFragment;
    getEvent(nameOrSignatureOrTopic: 'AccountDeleted' | 'AllTokensRevoked' | 'BalanceUpdated' | 'BatchBalanceUpdated' | 'ContractInitialized' | 'Initialized' | 'LockTimeUpdated' | 'OwnershipTransferred' | 'ProviderStakeReturned' | 'ProviderStaked' | 'ProviderTEESignerAcknowledged' | 'RefundRequested' | 'ServiceRemoved' | 'ServiceUpdated' | 'TEESettlementResult' | 'TokenRevoked' | 'TokensRevoked'): EventFragment;
    encodeFunctionData(functionFragment: 'MAX_LOCKTIME', values?: undefined): string;
    encodeFunctionData(functionFragment: 'MIN_LOCKTIME', values?: undefined): string;
    encodeFunctionData(functionFragment: 'MIN_PROVIDER_STAKE', values?: undefined): string;
    encodeFunctionData(functionFragment: 'accountExists', values: [AddressLike, AddressLike]): string;
    encodeFunctionData(functionFragment: 'acknowledgeTEESigner', values: [AddressLike, boolean]): string;
    encodeFunctionData(functionFragment: 'acknowledgeTEESignerByOwner', values: [AddressLike]): string;
    encodeFunctionData(functionFragment: 'addAccount', values: [AddressLike, AddressLike, string]): string;
    encodeFunctionData(functionFragment: 'addOrUpdateService', values: [ServiceParamsStruct]): string;
    encodeFunctionData(functionFragment: 'deleteAccount', values: [AddressLike, AddressLike]): string;
    encodeFunctionData(functionFragment: 'depositFund', values: [AddressLike, AddressLike, BigNumberish]): string;
    encodeFunctionData(functionFragment: 'getAccount', values: [AddressLike, AddressLike]): string;
    encodeFunctionData(functionFragment: 'getAccountsByProvider', values: [AddressLike, BigNumberish, BigNumberish]): string;
    encodeFunctionData(functionFragment: 'getAccountsByUser', values: [AddressLike, BigNumberish, BigNumberish]): string;
    encodeFunctionData(functionFragment: 'getAllAccounts', values: [BigNumberish, BigNumberish]): string;
    encodeFunctionData(functionFragment: 'getAllServices', values: [BigNumberish, BigNumberish]): string;
    encodeFunctionData(functionFragment: 'getBatchAccountsByUsers', values: [AddressLike[]]): string;
    encodeFunctionData(functionFragment: 'getPendingRefund', values: [AddressLike, AddressLike]): string;
    encodeFunctionData(functionFragment: 'getService', values: [AddressLike]): string;
    encodeFunctionData(functionFragment: 'initialize', values: [BigNumberish, AddressLike, AddressLike]): string;
    encodeFunctionData(functionFragment: 'initialized', values?: undefined): string;
    encodeFunctionData(functionFragment: 'isTokenRevoked', values: [AddressLike, AddressLike, BigNumberish]): string;
    encodeFunctionData(functionFragment: 'ledgerAddress', values?: undefined): string;
    encodeFunctionData(functionFragment: 'lockTime', values?: undefined): string;
    encodeFunctionData(functionFragment: 'owner', values?: undefined): string;
    encodeFunctionData(functionFragment: 'previewSettlementResults', values: [TEESettlementDataStruct[]]): string;
    encodeFunctionData(functionFragment: 'processRefund', values: [AddressLike, AddressLike]): string;
    encodeFunctionData(functionFragment: 'removeService', values?: undefined): string;
    encodeFunctionData(functionFragment: 'renounceOwnership', values?: undefined): string;
    encodeFunctionData(functionFragment: 'requestRefundAll', values: [AddressLike, AddressLike]): string;
    encodeFunctionData(functionFragment: 'revokeAllTokens', values: [AddressLike]): string;
    encodeFunctionData(functionFragment: 'revokeTEESignerAcknowledgement', values: [AddressLike]): string;
    encodeFunctionData(functionFragment: 'revokeToken', values: [AddressLike, BigNumberish]): string;
    encodeFunctionData(functionFragment: 'revokeTokens', values: [AddressLike, BigNumberish[]]): string;
    encodeFunctionData(functionFragment: 'serviceExists', values: [AddressLike]): string;
    encodeFunctionData(functionFragment: 'settleFeesWithTEE', values: [TEESettlementDataStruct[]]): string;
    encodeFunctionData(functionFragment: 'supportsInterface', values: [BytesLike]): string;
    encodeFunctionData(functionFragment: 'transferOwnership', values: [AddressLike]): string;
    encodeFunctionData(functionFragment: 'updateLockTime', values: [BigNumberish]): string;
    decodeFunctionResult(functionFragment: 'MAX_LOCKTIME', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'MIN_LOCKTIME', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'MIN_PROVIDER_STAKE', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'accountExists', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'acknowledgeTEESigner', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'acknowledgeTEESignerByOwner', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'addAccount', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'addOrUpdateService', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'deleteAccount', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'depositFund', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getAccount', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getAccountsByProvider', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getAccountsByUser', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getAllAccounts', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getAllServices', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getBatchAccountsByUsers', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getPendingRefund', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getService', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'initialize', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'initialized', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'isTokenRevoked', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'ledgerAddress', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'lockTime', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'owner', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'previewSettlementResults', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'processRefund', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'removeService', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'renounceOwnership', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'requestRefundAll', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'revokeAllTokens', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'revokeTEESignerAcknowledgement', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'revokeToken', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'revokeTokens', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'serviceExists', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'settleFeesWithTEE', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'supportsInterface', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'transferOwnership', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'updateLockTime', data: BytesLike): Result;
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
export declare namespace AllTokensRevokedEvent {
    type InputTuple = [
        user: AddressLike,
        provider: AddressLike,
        newGeneration: BigNumberish
    ];
    type OutputTuple = [
        user: string,
        provider: string,
        newGeneration: bigint
    ];
    interface OutputObject {
        user: string;
        provider: string;
        newGeneration: bigint;
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
export declare namespace BatchBalanceUpdatedEvent {
    type InputTuple = [
        users: AddressLike[],
        balances: BigNumberish[],
        pendingRefunds: BigNumberish[]
    ];
    type OutputTuple = [
        users: string[],
        balances: bigint[],
        pendingRefunds: bigint[]
    ];
    interface OutputObject {
        users: string[];
        balances: bigint[];
        pendingRefunds: bigint[];
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace ContractInitializedEvent {
    type InputTuple = [
        owner: AddressLike,
        lockTime: BigNumberish,
        ledgerAddress: AddressLike
    ];
    type OutputTuple = [
        owner: string,
        lockTime: bigint,
        ledgerAddress: string
    ];
    interface OutputObject {
        owner: string;
        lockTime: bigint;
        ledgerAddress: string;
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
    type InputTuple = [service: AddressLike];
    type OutputTuple = [service: string];
    interface OutputObject {
        service: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace ServiceUpdatedEvent {
    type InputTuple = [
        service: AddressLike,
        serviceType: string,
        url: string,
        inputPrice: BigNumberish,
        outputPrice: BigNumberish,
        updatedAt: BigNumberish,
        model: string,
        verifiability: string
    ];
    type OutputTuple = [
        service: string,
        serviceType: string,
        url: string,
        inputPrice: bigint,
        outputPrice: bigint,
        updatedAt: bigint,
        model: string,
        verifiability: string
    ];
    interface OutputObject {
        service: string;
        serviceType: string;
        url: string;
        inputPrice: bigint;
        outputPrice: bigint;
        updatedAt: bigint;
        model: string;
        verifiability: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace TEESettlementResultEvent {
    type InputTuple = [
        user: AddressLike,
        status: BigNumberish,
        unsettledAmount: BigNumberish
    ];
    type OutputTuple = [
        user: string,
        status: bigint,
        unsettledAmount: bigint
    ];
    interface OutputObject {
        user: string;
        status: bigint;
        unsettledAmount: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace TokenRevokedEvent {
    type InputTuple = [
        user: AddressLike,
        provider: AddressLike,
        tokenId: BigNumberish
    ];
    type OutputTuple = [user: string, provider: string, tokenId: bigint];
    interface OutputObject {
        user: string;
        provider: string;
        tokenId: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace TokensRevokedEvent {
    type InputTuple = [
        user: AddressLike,
        provider: AddressLike,
        tokenIds: BigNumberish[]
    ];
    type OutputTuple = [
        user: string,
        provider: string,
        tokenIds: bigint[]
    ];
    interface OutputObject {
        user: string;
        provider: string;
        tokenIds: bigint[];
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export interface InferenceServing extends BaseContract {
    connect(runner?: ContractRunner | null): InferenceServing;
    waitForDeployment(): Promise<this>;
    interface: InferenceServingInterface;
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
    addOrUpdateService: TypedContractMethod<[
        params: ServiceParamsStruct
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
        AccountStructOutput
    ], 'view'>;
    getAccountsByProvider: TypedContractMethod<[
        provider: AddressLike,
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            AccountStructOutput[],
            bigint
        ] & {
            accounts: AccountStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getAccountsByUser: TypedContractMethod<[
        user: AddressLike,
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            AccountStructOutput[],
            bigint
        ] & {
            accounts: AccountStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getAllAccounts: TypedContractMethod<[
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            AccountStructOutput[],
            bigint
        ] & {
            accounts: AccountStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getAllServices: TypedContractMethod<[
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            ServiceStructOutput[],
            bigint
        ] & {
            services: ServiceStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getBatchAccountsByUsers: TypedContractMethod<[
        users: AddressLike[]
    ], [
        AccountStructOutput[]
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
        owner: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    initialized: TypedContractMethod<[], [boolean], 'view'>;
    isTokenRevoked: TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike,
        tokenId: BigNumberish
    ], [
        boolean
    ], 'view'>;
    ledgerAddress: TypedContractMethod<[], [string], 'view'>;
    lockTime: TypedContractMethod<[], [bigint], 'view'>;
    owner: TypedContractMethod<[], [string], 'view'>;
    previewSettlementResults: TypedContractMethod<[
        settlements: TEESettlementDataStruct[]
    ], [
        [
            string[],
            bigint[],
            string[],
            bigint[]
        ] & {
            failedUsers: string[];
            failureReasons: bigint[];
            partialUsers: string[];
            partialAmounts: bigint[];
        }
    ], 'view'>;
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
    revokeAllTokens: TypedContractMethod<[
        provider: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    revokeTEESignerAcknowledgement: TypedContractMethod<[
        provider: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    revokeToken: TypedContractMethod<[
        provider: AddressLike,
        tokenId: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    revokeTokens: TypedContractMethod<[
        provider: AddressLike,
        tokenIds: BigNumberish[]
    ], [
        void
    ], 'nonpayable'>;
    serviceExists: TypedContractMethod<[
        provider: AddressLike
    ], [
        boolean
    ], 'view'>;
    settleFeesWithTEE: TypedContractMethod<[
        settlements: TEESettlementDataStruct[]
    ], [
        bigint[]
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
    getFunction(nameOrSignature: 'addOrUpdateService'): TypedContractMethod<[params: ServiceParamsStruct], [void], 'payable'>;
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
        AccountStructOutput
    ], 'view'>;
    getFunction(nameOrSignature: 'getAccountsByProvider'): TypedContractMethod<[
        provider: AddressLike,
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            AccountStructOutput[],
            bigint
        ] & {
            accounts: AccountStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getFunction(nameOrSignature: 'getAccountsByUser'): TypedContractMethod<[
        user: AddressLike,
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            AccountStructOutput[],
            bigint
        ] & {
            accounts: AccountStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getFunction(nameOrSignature: 'getAllAccounts'): TypedContractMethod<[
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            AccountStructOutput[],
            bigint
        ] & {
            accounts: AccountStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getFunction(nameOrSignature: 'getAllServices'): TypedContractMethod<[
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            ServiceStructOutput[],
            bigint
        ] & {
            services: ServiceStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getFunction(nameOrSignature: 'getBatchAccountsByUsers'): TypedContractMethod<[
        users: AddressLike[]
    ], [
        AccountStructOutput[]
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
        owner: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'initialized'): TypedContractMethod<[], [boolean], 'view'>;
    getFunction(nameOrSignature: 'isTokenRevoked'): TypedContractMethod<[
        user: AddressLike,
        provider: AddressLike,
        tokenId: BigNumberish
    ], [
        boolean
    ], 'view'>;
    getFunction(nameOrSignature: 'ledgerAddress'): TypedContractMethod<[], [string], 'view'>;
    getFunction(nameOrSignature: 'lockTime'): TypedContractMethod<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'owner'): TypedContractMethod<[], [string], 'view'>;
    getFunction(nameOrSignature: 'previewSettlementResults'): TypedContractMethod<[
        settlements: TEESettlementDataStruct[]
    ], [
        [
            string[],
            bigint[],
            string[],
            bigint[]
        ] & {
            failedUsers: string[];
            failureReasons: bigint[];
            partialUsers: string[];
            partialAmounts: bigint[];
        }
    ], 'view'>;
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
    getFunction(nameOrSignature: 'revokeAllTokens'): TypedContractMethod<[provider: AddressLike], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'revokeTEESignerAcknowledgement'): TypedContractMethod<[provider: AddressLike], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'revokeToken'): TypedContractMethod<[
        provider: AddressLike,
        tokenId: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'revokeTokens'): TypedContractMethod<[
        provider: AddressLike,
        tokenIds: BigNumberish[]
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'serviceExists'): TypedContractMethod<[provider: AddressLike], [boolean], 'view'>;
    getFunction(nameOrSignature: 'settleFeesWithTEE'): TypedContractMethod<[
        settlements: TEESettlementDataStruct[]
    ], [
        bigint[]
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'supportsInterface'): TypedContractMethod<[interfaceId: BytesLike], [boolean], 'view'>;
    getFunction(nameOrSignature: 'transferOwnership'): TypedContractMethod<[newOwner: AddressLike], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'updateLockTime'): TypedContractMethod<[_locktime: BigNumberish], [void], 'nonpayable'>;
    getEvent(key: 'AccountDeleted'): TypedContractEvent<AccountDeletedEvent.InputTuple, AccountDeletedEvent.OutputTuple, AccountDeletedEvent.OutputObject>;
    getEvent(key: 'AllTokensRevoked'): TypedContractEvent<AllTokensRevokedEvent.InputTuple, AllTokensRevokedEvent.OutputTuple, AllTokensRevokedEvent.OutputObject>;
    getEvent(key: 'BalanceUpdated'): TypedContractEvent<BalanceUpdatedEvent.InputTuple, BalanceUpdatedEvent.OutputTuple, BalanceUpdatedEvent.OutputObject>;
    getEvent(key: 'BatchBalanceUpdated'): TypedContractEvent<BatchBalanceUpdatedEvent.InputTuple, BatchBalanceUpdatedEvent.OutputTuple, BatchBalanceUpdatedEvent.OutputObject>;
    getEvent(key: 'ContractInitialized'): TypedContractEvent<ContractInitializedEvent.InputTuple, ContractInitializedEvent.OutputTuple, ContractInitializedEvent.OutputObject>;
    getEvent(key: 'Initialized'): TypedContractEvent<InitializedEvent.InputTuple, InitializedEvent.OutputTuple, InitializedEvent.OutputObject>;
    getEvent(key: 'LockTimeUpdated'): TypedContractEvent<LockTimeUpdatedEvent.InputTuple, LockTimeUpdatedEvent.OutputTuple, LockTimeUpdatedEvent.OutputObject>;
    getEvent(key: 'OwnershipTransferred'): TypedContractEvent<OwnershipTransferredEvent.InputTuple, OwnershipTransferredEvent.OutputTuple, OwnershipTransferredEvent.OutputObject>;
    getEvent(key: 'ProviderStakeReturned'): TypedContractEvent<ProviderStakeReturnedEvent.InputTuple, ProviderStakeReturnedEvent.OutputTuple, ProviderStakeReturnedEvent.OutputObject>;
    getEvent(key: 'ProviderStaked'): TypedContractEvent<ProviderStakedEvent.InputTuple, ProviderStakedEvent.OutputTuple, ProviderStakedEvent.OutputObject>;
    getEvent(key: 'ProviderTEESignerAcknowledged'): TypedContractEvent<ProviderTEESignerAcknowledgedEvent.InputTuple, ProviderTEESignerAcknowledgedEvent.OutputTuple, ProviderTEESignerAcknowledgedEvent.OutputObject>;
    getEvent(key: 'RefundRequested'): TypedContractEvent<RefundRequestedEvent.InputTuple, RefundRequestedEvent.OutputTuple, RefundRequestedEvent.OutputObject>;
    getEvent(key: 'ServiceRemoved'): TypedContractEvent<ServiceRemovedEvent.InputTuple, ServiceRemovedEvent.OutputTuple, ServiceRemovedEvent.OutputObject>;
    getEvent(key: 'ServiceUpdated'): TypedContractEvent<ServiceUpdatedEvent.InputTuple, ServiceUpdatedEvent.OutputTuple, ServiceUpdatedEvent.OutputObject>;
    getEvent(key: 'TEESettlementResult'): TypedContractEvent<TEESettlementResultEvent.InputTuple, TEESettlementResultEvent.OutputTuple, TEESettlementResultEvent.OutputObject>;
    getEvent(key: 'TokenRevoked'): TypedContractEvent<TokenRevokedEvent.InputTuple, TokenRevokedEvent.OutputTuple, TokenRevokedEvent.OutputObject>;
    getEvent(key: 'TokensRevoked'): TypedContractEvent<TokensRevokedEvent.InputTuple, TokensRevokedEvent.OutputTuple, TokensRevokedEvent.OutputObject>;
    filters: {
        'AccountDeleted(address,address,uint256)': TypedContractEvent<AccountDeletedEvent.InputTuple, AccountDeletedEvent.OutputTuple, AccountDeletedEvent.OutputObject>;
        AccountDeleted: TypedContractEvent<AccountDeletedEvent.InputTuple, AccountDeletedEvent.OutputTuple, AccountDeletedEvent.OutputObject>;
        'AllTokensRevoked(address,address,uint256)': TypedContractEvent<AllTokensRevokedEvent.InputTuple, AllTokensRevokedEvent.OutputTuple, AllTokensRevokedEvent.OutputObject>;
        AllTokensRevoked: TypedContractEvent<AllTokensRevokedEvent.InputTuple, AllTokensRevokedEvent.OutputTuple, AllTokensRevokedEvent.OutputObject>;
        'BalanceUpdated(address,address,uint256,uint256)': TypedContractEvent<BalanceUpdatedEvent.InputTuple, BalanceUpdatedEvent.OutputTuple, BalanceUpdatedEvent.OutputObject>;
        BalanceUpdated: TypedContractEvent<BalanceUpdatedEvent.InputTuple, BalanceUpdatedEvent.OutputTuple, BalanceUpdatedEvent.OutputObject>;
        'BatchBalanceUpdated(address[],uint256[],uint256[])': TypedContractEvent<BatchBalanceUpdatedEvent.InputTuple, BatchBalanceUpdatedEvent.OutputTuple, BatchBalanceUpdatedEvent.OutputObject>;
        BatchBalanceUpdated: TypedContractEvent<BatchBalanceUpdatedEvent.InputTuple, BatchBalanceUpdatedEvent.OutputTuple, BatchBalanceUpdatedEvent.OutputObject>;
        'ContractInitialized(address,uint256,address)': TypedContractEvent<ContractInitializedEvent.InputTuple, ContractInitializedEvent.OutputTuple, ContractInitializedEvent.OutputObject>;
        ContractInitialized: TypedContractEvent<ContractInitializedEvent.InputTuple, ContractInitializedEvent.OutputTuple, ContractInitializedEvent.OutputObject>;
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
        'ServiceUpdated(address,string,string,uint256,uint256,uint256,string,string)': TypedContractEvent<ServiceUpdatedEvent.InputTuple, ServiceUpdatedEvent.OutputTuple, ServiceUpdatedEvent.OutputObject>;
        ServiceUpdated: TypedContractEvent<ServiceUpdatedEvent.InputTuple, ServiceUpdatedEvent.OutputTuple, ServiceUpdatedEvent.OutputObject>;
        'TEESettlementResult(address,uint8,uint256)': TypedContractEvent<TEESettlementResultEvent.InputTuple, TEESettlementResultEvent.OutputTuple, TEESettlementResultEvent.OutputObject>;
        TEESettlementResult: TypedContractEvent<TEESettlementResultEvent.InputTuple, TEESettlementResultEvent.OutputTuple, TEESettlementResultEvent.OutputObject>;
        'TokenRevoked(address,address,uint8)': TypedContractEvent<TokenRevokedEvent.InputTuple, TokenRevokedEvent.OutputTuple, TokenRevokedEvent.OutputObject>;
        TokenRevoked: TypedContractEvent<TokenRevokedEvent.InputTuple, TokenRevokedEvent.OutputTuple, TokenRevokedEvent.OutputObject>;
        'TokensRevoked(address,address,uint8[])': TypedContractEvent<TokensRevokedEvent.InputTuple, TokensRevokedEvent.OutputTuple, TokensRevokedEvent.OutputObject>;
        TokensRevoked: TypedContractEvent<TokensRevokedEvent.InputTuple, TokensRevokedEvent.OutputTuple, TokensRevokedEvent.OutputObject>;
    };
}
//# sourceMappingURL=InferenceServing.d.ts.map