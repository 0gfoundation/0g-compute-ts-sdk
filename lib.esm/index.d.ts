import { DeferredTopicFilter, EventFragment, EventLog, ContractTransactionResponse, FunctionFragment, ContractTransaction, LogDescription, Typed, TransactionRequest, BaseContract, ContractRunner, Listener, AddressLike, BigNumberish, BytesLike, ContractMethod, Interface, Result, JsonRpcSigner, Wallet, ContractMethodArgs as ContractMethodArgs$3, ContractTransactionReceipt, ethers } from 'ethers';

interface TypedDeferredTopicFilter$2<_TCEvent extends TypedContractEvent$2> extends DeferredTopicFilter {
}
interface TypedContractEvent$2<InputTuple extends Array<any> = any, OutputTuple extends Array<any> = any, OutputObject = any> {
    (...args: Partial<InputTuple>): TypedDeferredTopicFilter$2<TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>>;
    name: string;
    fragment: EventFragment;
    getFragment(...args: Partial<InputTuple>): EventFragment;
}
type __TypechainAOutputTuple$2<T> = T extends TypedContractEvent$2<infer _U, infer W> ? W : never;
type __TypechainOutputObject$2<T> = T extends TypedContractEvent$2<infer _U, infer _W, infer V> ? V : never;
interface TypedEventLog$2<TCEvent extends TypedContractEvent$2> extends Omit<EventLog, 'args'> {
    args: __TypechainAOutputTuple$2<TCEvent> & __TypechainOutputObject$2<TCEvent>;
}
interface TypedLogDescription$2<TCEvent extends TypedContractEvent$2> extends Omit<LogDescription, 'args'> {
    args: __TypechainAOutputTuple$2<TCEvent> & __TypechainOutputObject$2<TCEvent>;
}
type TypedListener$2<TCEvent extends TypedContractEvent$2> = (...listenerArg: [
    ...__TypechainAOutputTuple$2<TCEvent>,
    TypedEventLog$2<TCEvent>,
    ...undefined[]
]) => void;
type StateMutability$2 = 'nonpayable' | 'payable' | 'view';
type BaseOverrides$2 = Omit<TransactionRequest, 'to' | 'data'>;
type NonPayableOverrides$2 = Omit<BaseOverrides$2, 'value' | 'blockTag' | 'enableCcipRead'>;
type PayableOverrides$2 = Omit<BaseOverrides$2, 'blockTag' | 'enableCcipRead'>;
type ViewOverrides$2 = Omit<TransactionRequest, 'to' | 'data'>;
type Overrides$2<S extends StateMutability$2> = S extends 'nonpayable' ? NonPayableOverrides$2 : S extends 'payable' ? PayableOverrides$2 : ViewOverrides$2;
type PostfixOverrides$2<A extends Array<any>, S extends StateMutability$2> = A | [...A, Overrides$2<S>];
type ContractMethodArgs$2<A extends Array<any>, S extends StateMutability$2> = PostfixOverrides$2<{
    [I in keyof A]-?: A[I] | Typed;
}, S>;
type DefaultReturnType$2<R> = R extends Array<any> ? R[0] : R;
interface TypedContractMethod$2<A extends Array<any> = Array<any>, R = any, S extends StateMutability$2 = 'payable'> {
    (...args: ContractMethodArgs$2<A, S>): S extends 'view' ? Promise<DefaultReturnType$2<R>> : Promise<ContractTransactionResponse>;
    name: string;
    fragment: FunctionFragment;
    getFragment(...args: ContractMethodArgs$2<A, S>): FunctionFragment;
    populateTransaction(...args: ContractMethodArgs$2<A, S>): Promise<ContractTransaction>;
    staticCall(...args: ContractMethodArgs$2<A, 'view'>): Promise<DefaultReturnType$2<R>>;
    send(...args: ContractMethodArgs$2<A, S>): Promise<ContractTransactionResponse>;
    estimateGas(...args: ContractMethodArgs$2<A, S>): Promise<bigint>;
    staticCallResult(...args: ContractMethodArgs$2<A, 'view'>): Promise<R>;
}

type ServiceParamsStruct = {
    serviceType: string;
    url: string;
    model: string;
    verifiability: string;
    inputPrice: BigNumberish;
    outputPrice: BigNumberish;
    additionalInfo: string;
    teeSignerAddress: AddressLike;
};
type RefundStructOutput$1 = [
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
type AccountStructOutput = [
    user: string,
    provider: string,
    nonce: bigint,
    balance: bigint,
    pendingRefund: bigint,
    refunds: RefundStructOutput$1[],
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
    refunds: RefundStructOutput$1[];
    additionalInfo: string;
    acknowledged: boolean;
    validRefundsLength: bigint;
    generation: bigint;
    revokedBitmap: bigint;
};
type ServiceStructOutput$1 = [
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
type TEESettlementDataStruct = {
    user: AddressLike;
    provider: AddressLike;
    totalFee: BigNumberish;
    requestsHash: BytesLike;
    nonce: BigNumberish;
    signature: BytesLike;
};
interface InferenceServingInterface extends Interface {
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
declare namespace AccountDeletedEvent$1 {
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
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace AllTokensRevokedEvent {
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
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace BalanceUpdatedEvent$1 {
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
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace BatchBalanceUpdatedEvent {
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
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace ContractInitializedEvent {
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
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace InitializedEvent$2 {
    type InputTuple = [version: BigNumberish];
    type OutputTuple = [version: bigint];
    interface OutputObject {
        version: bigint;
    }
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace LockTimeUpdatedEvent$1 {
    type InputTuple = [
        oldLockTime: BigNumberish,
        newLockTime: BigNumberish
    ];
    type OutputTuple = [oldLockTime: bigint, newLockTime: bigint];
    interface OutputObject {
        oldLockTime: bigint;
        newLockTime: bigint;
    }
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace OwnershipTransferredEvent$2 {
    type InputTuple = [previousOwner: AddressLike, newOwner: AddressLike];
    type OutputTuple = [previousOwner: string, newOwner: string];
    interface OutputObject {
        previousOwner: string;
        newOwner: string;
    }
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace ProviderStakeReturnedEvent$1 {
    type InputTuple = [provider: AddressLike, amount: BigNumberish];
    type OutputTuple = [provider: string, amount: bigint];
    interface OutputObject {
        provider: string;
        amount: bigint;
    }
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace ProviderStakedEvent$1 {
    type InputTuple = [provider: AddressLike, amount: BigNumberish];
    type OutputTuple = [provider: string, amount: bigint];
    interface OutputObject {
        provider: string;
        amount: bigint;
    }
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace ProviderTEESignerAcknowledgedEvent$1 {
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
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace RefundRequestedEvent$1 {
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
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace ServiceRemovedEvent$1 {
    type InputTuple = [service: AddressLike];
    type OutputTuple = [service: string];
    interface OutputObject {
        service: string;
    }
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace ServiceUpdatedEvent$1 {
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
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace TEESettlementResultEvent {
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
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace TokenRevokedEvent {
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
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
declare namespace TokensRevokedEvent {
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
    type Event = TypedContractEvent$2<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$2<Event>;
    type Log = TypedEventLog$2<Event>;
    type LogDescription = TypedLogDescription$2<Event>;
}
interface InferenceServing extends BaseContract {
    connect(runner?: ContractRunner | null): InferenceServing;
    waitForDeployment(): Promise<this>;
    interface: InferenceServingInterface;
    queryFilter<TCEvent extends TypedContractEvent$2>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog$2<TCEvent>>>;
    queryFilter<TCEvent extends TypedContractEvent$2>(filter: TypedDeferredTopicFilter$2<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog$2<TCEvent>>>;
    on<TCEvent extends TypedContractEvent$2>(event: TCEvent, listener: TypedListener$2<TCEvent>): Promise<this>;
    on<TCEvent extends TypedContractEvent$2>(filter: TypedDeferredTopicFilter$2<TCEvent>, listener: TypedListener$2<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent$2>(event: TCEvent, listener: TypedListener$2<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent$2>(filter: TypedDeferredTopicFilter$2<TCEvent>, listener: TypedListener$2<TCEvent>): Promise<this>;
    listeners<TCEvent extends TypedContractEvent$2>(event: TCEvent): Promise<Array<TypedListener$2<TCEvent>>>;
    listeners(eventName?: string): Promise<Array<Listener>>;
    removeAllListeners<TCEvent extends TypedContractEvent$2>(event?: TCEvent): Promise<this>;
    MAX_LOCKTIME: TypedContractMethod$2<[], [bigint], 'view'>;
    MIN_LOCKTIME: TypedContractMethod$2<[], [bigint], 'view'>;
    MIN_PROVIDER_STAKE: TypedContractMethod$2<[], [bigint], 'view'>;
    accountExists: TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike
    ], [
        boolean
    ], 'view'>;
    acknowledgeTEESigner: TypedContractMethod$2<[
        provider: AddressLike,
        acknowledged: boolean
    ], [
        void
    ], 'nonpayable'>;
    acknowledgeTEESignerByOwner: TypedContractMethod$2<[
        provider: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    addAccount: TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike,
        additionalInfo: string
    ], [
        void
    ], 'payable'>;
    addOrUpdateService: TypedContractMethod$2<[
        params: ServiceParamsStruct
    ], [
        void
    ], 'payable'>;
    deleteAccount: TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    depositFund: TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike,
        cancelRetrievingAmount: BigNumberish
    ], [
        void
    ], 'payable'>;
    getAccount: TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike
    ], [
        AccountStructOutput
    ], 'view'>;
    getAccountsByProvider: TypedContractMethod$2<[
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
    getAccountsByUser: TypedContractMethod$2<[
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
    getAllAccounts: TypedContractMethod$2<[
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
    getAllServices: TypedContractMethod$2<[
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            ServiceStructOutput$1[],
            bigint
        ] & {
            services: ServiceStructOutput$1[];
            total: bigint;
        }
    ], 'view'>;
    getBatchAccountsByUsers: TypedContractMethod$2<[
        users: AddressLike[]
    ], [
        AccountStructOutput[]
    ], 'view'>;
    getPendingRefund: TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike
    ], [
        bigint
    ], 'view'>;
    getService: TypedContractMethod$2<[
        provider: AddressLike
    ], [
        ServiceStructOutput$1
    ], 'view'>;
    initialize: TypedContractMethod$2<[
        _locktime: BigNumberish,
        _ledgerAddress: AddressLike,
        owner: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    initialized: TypedContractMethod$2<[], [boolean], 'view'>;
    isTokenRevoked: TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike,
        tokenId: BigNumberish
    ], [
        boolean
    ], 'view'>;
    ledgerAddress: TypedContractMethod$2<[], [string], 'view'>;
    lockTime: TypedContractMethod$2<[], [bigint], 'view'>;
    owner: TypedContractMethod$2<[], [string], 'view'>;
    previewSettlementResults: TypedContractMethod$2<[
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
    processRefund: TypedContractMethod$2<[
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
    removeService: TypedContractMethod$2<[], [void], 'nonpayable'>;
    renounceOwnership: TypedContractMethod$2<[], [void], 'nonpayable'>;
    requestRefundAll: TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    revokeAllTokens: TypedContractMethod$2<[
        provider: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    revokeTEESignerAcknowledgement: TypedContractMethod$2<[
        provider: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    revokeToken: TypedContractMethod$2<[
        provider: AddressLike,
        tokenId: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    revokeTokens: TypedContractMethod$2<[
        provider: AddressLike,
        tokenIds: BigNumberish[]
    ], [
        void
    ], 'nonpayable'>;
    serviceExists: TypedContractMethod$2<[
        provider: AddressLike
    ], [
        boolean
    ], 'view'>;
    settleFeesWithTEE: TypedContractMethod$2<[
        settlements: TEESettlementDataStruct[]
    ], [
        bigint[]
    ], 'nonpayable'>;
    supportsInterface: TypedContractMethod$2<[
        interfaceId: BytesLike
    ], [
        boolean
    ], 'view'>;
    transferOwnership: TypedContractMethod$2<[
        newOwner: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    updateLockTime: TypedContractMethod$2<[
        _locktime: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
    getFunction(nameOrSignature: 'MAX_LOCKTIME'): TypedContractMethod$2<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'MIN_LOCKTIME'): TypedContractMethod$2<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'MIN_PROVIDER_STAKE'): TypedContractMethod$2<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'accountExists'): TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike
    ], [
        boolean
    ], 'view'>;
    getFunction(nameOrSignature: 'acknowledgeTEESigner'): TypedContractMethod$2<[
        provider: AddressLike,
        acknowledged: boolean
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'acknowledgeTEESignerByOwner'): TypedContractMethod$2<[provider: AddressLike], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'addAccount'): TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike,
        additionalInfo: string
    ], [
        void
    ], 'payable'>;
    getFunction(nameOrSignature: 'addOrUpdateService'): TypedContractMethod$2<[params: ServiceParamsStruct], [void], 'payable'>;
    getFunction(nameOrSignature: 'deleteAccount'): TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'depositFund'): TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike,
        cancelRetrievingAmount: BigNumberish
    ], [
        void
    ], 'payable'>;
    getFunction(nameOrSignature: 'getAccount'): TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike
    ], [
        AccountStructOutput
    ], 'view'>;
    getFunction(nameOrSignature: 'getAccountsByProvider'): TypedContractMethod$2<[
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
    getFunction(nameOrSignature: 'getAccountsByUser'): TypedContractMethod$2<[
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
    getFunction(nameOrSignature: 'getAllAccounts'): TypedContractMethod$2<[
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
    getFunction(nameOrSignature: 'getAllServices'): TypedContractMethod$2<[
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            ServiceStructOutput$1[],
            bigint
        ] & {
            services: ServiceStructOutput$1[];
            total: bigint;
        }
    ], 'view'>;
    getFunction(nameOrSignature: 'getBatchAccountsByUsers'): TypedContractMethod$2<[
        users: AddressLike[]
    ], [
        AccountStructOutput[]
    ], 'view'>;
    getFunction(nameOrSignature: 'getPendingRefund'): TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike
    ], [
        bigint
    ], 'view'>;
    getFunction(nameOrSignature: 'getService'): TypedContractMethod$2<[
        provider: AddressLike
    ], [
        ServiceStructOutput$1
    ], 'view'>;
    getFunction(nameOrSignature: 'initialize'): TypedContractMethod$2<[
        _locktime: BigNumberish,
        _ledgerAddress: AddressLike,
        owner: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'initialized'): TypedContractMethod$2<[], [boolean], 'view'>;
    getFunction(nameOrSignature: 'isTokenRevoked'): TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike,
        tokenId: BigNumberish
    ], [
        boolean
    ], 'view'>;
    getFunction(nameOrSignature: 'ledgerAddress'): TypedContractMethod$2<[], [string], 'view'>;
    getFunction(nameOrSignature: 'lockTime'): TypedContractMethod$2<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'owner'): TypedContractMethod$2<[], [string], 'view'>;
    getFunction(nameOrSignature: 'previewSettlementResults'): TypedContractMethod$2<[
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
    getFunction(nameOrSignature: 'processRefund'): TypedContractMethod$2<[
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
    getFunction(nameOrSignature: 'removeService'): TypedContractMethod$2<[], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'renounceOwnership'): TypedContractMethod$2<[], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'requestRefundAll'): TypedContractMethod$2<[
        user: AddressLike,
        provider: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'revokeAllTokens'): TypedContractMethod$2<[provider: AddressLike], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'revokeTEESignerAcknowledgement'): TypedContractMethod$2<[provider: AddressLike], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'revokeToken'): TypedContractMethod$2<[
        provider: AddressLike,
        tokenId: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'revokeTokens'): TypedContractMethod$2<[
        provider: AddressLike,
        tokenIds: BigNumberish[]
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'serviceExists'): TypedContractMethod$2<[provider: AddressLike], [boolean], 'view'>;
    getFunction(nameOrSignature: 'settleFeesWithTEE'): TypedContractMethod$2<[
        settlements: TEESettlementDataStruct[]
    ], [
        bigint[]
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'supportsInterface'): TypedContractMethod$2<[interfaceId: BytesLike], [boolean], 'view'>;
    getFunction(nameOrSignature: 'transferOwnership'): TypedContractMethod$2<[newOwner: AddressLike], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'updateLockTime'): TypedContractMethod$2<[_locktime: BigNumberish], [void], 'nonpayable'>;
    getEvent(key: 'AccountDeleted'): TypedContractEvent$2<AccountDeletedEvent$1.InputTuple, AccountDeletedEvent$1.OutputTuple, AccountDeletedEvent$1.OutputObject>;
    getEvent(key: 'AllTokensRevoked'): TypedContractEvent$2<AllTokensRevokedEvent.InputTuple, AllTokensRevokedEvent.OutputTuple, AllTokensRevokedEvent.OutputObject>;
    getEvent(key: 'BalanceUpdated'): TypedContractEvent$2<BalanceUpdatedEvent$1.InputTuple, BalanceUpdatedEvent$1.OutputTuple, BalanceUpdatedEvent$1.OutputObject>;
    getEvent(key: 'BatchBalanceUpdated'): TypedContractEvent$2<BatchBalanceUpdatedEvent.InputTuple, BatchBalanceUpdatedEvent.OutputTuple, BatchBalanceUpdatedEvent.OutputObject>;
    getEvent(key: 'ContractInitialized'): TypedContractEvent$2<ContractInitializedEvent.InputTuple, ContractInitializedEvent.OutputTuple, ContractInitializedEvent.OutputObject>;
    getEvent(key: 'Initialized'): TypedContractEvent$2<InitializedEvent$2.InputTuple, InitializedEvent$2.OutputTuple, InitializedEvent$2.OutputObject>;
    getEvent(key: 'LockTimeUpdated'): TypedContractEvent$2<LockTimeUpdatedEvent$1.InputTuple, LockTimeUpdatedEvent$1.OutputTuple, LockTimeUpdatedEvent$1.OutputObject>;
    getEvent(key: 'OwnershipTransferred'): TypedContractEvent$2<OwnershipTransferredEvent$2.InputTuple, OwnershipTransferredEvent$2.OutputTuple, OwnershipTransferredEvent$2.OutputObject>;
    getEvent(key: 'ProviderStakeReturned'): TypedContractEvent$2<ProviderStakeReturnedEvent$1.InputTuple, ProviderStakeReturnedEvent$1.OutputTuple, ProviderStakeReturnedEvent$1.OutputObject>;
    getEvent(key: 'ProviderStaked'): TypedContractEvent$2<ProviderStakedEvent$1.InputTuple, ProviderStakedEvent$1.OutputTuple, ProviderStakedEvent$1.OutputObject>;
    getEvent(key: 'ProviderTEESignerAcknowledged'): TypedContractEvent$2<ProviderTEESignerAcknowledgedEvent$1.InputTuple, ProviderTEESignerAcknowledgedEvent$1.OutputTuple, ProviderTEESignerAcknowledgedEvent$1.OutputObject>;
    getEvent(key: 'RefundRequested'): TypedContractEvent$2<RefundRequestedEvent$1.InputTuple, RefundRequestedEvent$1.OutputTuple, RefundRequestedEvent$1.OutputObject>;
    getEvent(key: 'ServiceRemoved'): TypedContractEvent$2<ServiceRemovedEvent$1.InputTuple, ServiceRemovedEvent$1.OutputTuple, ServiceRemovedEvent$1.OutputObject>;
    getEvent(key: 'ServiceUpdated'): TypedContractEvent$2<ServiceUpdatedEvent$1.InputTuple, ServiceUpdatedEvent$1.OutputTuple, ServiceUpdatedEvent$1.OutputObject>;
    getEvent(key: 'TEESettlementResult'): TypedContractEvent$2<TEESettlementResultEvent.InputTuple, TEESettlementResultEvent.OutputTuple, TEESettlementResultEvent.OutputObject>;
    getEvent(key: 'TokenRevoked'): TypedContractEvent$2<TokenRevokedEvent.InputTuple, TokenRevokedEvent.OutputTuple, TokenRevokedEvent.OutputObject>;
    getEvent(key: 'TokensRevoked'): TypedContractEvent$2<TokensRevokedEvent.InputTuple, TokensRevokedEvent.OutputTuple, TokensRevokedEvent.OutputObject>;
    filters: {
        'AccountDeleted(address,address,uint256)': TypedContractEvent$2<AccountDeletedEvent$1.InputTuple, AccountDeletedEvent$1.OutputTuple, AccountDeletedEvent$1.OutputObject>;
        AccountDeleted: TypedContractEvent$2<AccountDeletedEvent$1.InputTuple, AccountDeletedEvent$1.OutputTuple, AccountDeletedEvent$1.OutputObject>;
        'AllTokensRevoked(address,address,uint256)': TypedContractEvent$2<AllTokensRevokedEvent.InputTuple, AllTokensRevokedEvent.OutputTuple, AllTokensRevokedEvent.OutputObject>;
        AllTokensRevoked: TypedContractEvent$2<AllTokensRevokedEvent.InputTuple, AllTokensRevokedEvent.OutputTuple, AllTokensRevokedEvent.OutputObject>;
        'BalanceUpdated(address,address,uint256,uint256)': TypedContractEvent$2<BalanceUpdatedEvent$1.InputTuple, BalanceUpdatedEvent$1.OutputTuple, BalanceUpdatedEvent$1.OutputObject>;
        BalanceUpdated: TypedContractEvent$2<BalanceUpdatedEvent$1.InputTuple, BalanceUpdatedEvent$1.OutputTuple, BalanceUpdatedEvent$1.OutputObject>;
        'BatchBalanceUpdated(address[],uint256[],uint256[])': TypedContractEvent$2<BatchBalanceUpdatedEvent.InputTuple, BatchBalanceUpdatedEvent.OutputTuple, BatchBalanceUpdatedEvent.OutputObject>;
        BatchBalanceUpdated: TypedContractEvent$2<BatchBalanceUpdatedEvent.InputTuple, BatchBalanceUpdatedEvent.OutputTuple, BatchBalanceUpdatedEvent.OutputObject>;
        'ContractInitialized(address,uint256,address)': TypedContractEvent$2<ContractInitializedEvent.InputTuple, ContractInitializedEvent.OutputTuple, ContractInitializedEvent.OutputObject>;
        ContractInitialized: TypedContractEvent$2<ContractInitializedEvent.InputTuple, ContractInitializedEvent.OutputTuple, ContractInitializedEvent.OutputObject>;
        'Initialized(uint8)': TypedContractEvent$2<InitializedEvent$2.InputTuple, InitializedEvent$2.OutputTuple, InitializedEvent$2.OutputObject>;
        Initialized: TypedContractEvent$2<InitializedEvent$2.InputTuple, InitializedEvent$2.OutputTuple, InitializedEvent$2.OutputObject>;
        'LockTimeUpdated(uint256,uint256)': TypedContractEvent$2<LockTimeUpdatedEvent$1.InputTuple, LockTimeUpdatedEvent$1.OutputTuple, LockTimeUpdatedEvent$1.OutputObject>;
        LockTimeUpdated: TypedContractEvent$2<LockTimeUpdatedEvent$1.InputTuple, LockTimeUpdatedEvent$1.OutputTuple, LockTimeUpdatedEvent$1.OutputObject>;
        'OwnershipTransferred(address,address)': TypedContractEvent$2<OwnershipTransferredEvent$2.InputTuple, OwnershipTransferredEvent$2.OutputTuple, OwnershipTransferredEvent$2.OutputObject>;
        OwnershipTransferred: TypedContractEvent$2<OwnershipTransferredEvent$2.InputTuple, OwnershipTransferredEvent$2.OutputTuple, OwnershipTransferredEvent$2.OutputObject>;
        'ProviderStakeReturned(address,uint256)': TypedContractEvent$2<ProviderStakeReturnedEvent$1.InputTuple, ProviderStakeReturnedEvent$1.OutputTuple, ProviderStakeReturnedEvent$1.OutputObject>;
        ProviderStakeReturned: TypedContractEvent$2<ProviderStakeReturnedEvent$1.InputTuple, ProviderStakeReturnedEvent$1.OutputTuple, ProviderStakeReturnedEvent$1.OutputObject>;
        'ProviderStaked(address,uint256)': TypedContractEvent$2<ProviderStakedEvent$1.InputTuple, ProviderStakedEvent$1.OutputTuple, ProviderStakedEvent$1.OutputObject>;
        ProviderStaked: TypedContractEvent$2<ProviderStakedEvent$1.InputTuple, ProviderStakedEvent$1.OutputTuple, ProviderStakedEvent$1.OutputObject>;
        'ProviderTEESignerAcknowledged(address,address,bool)': TypedContractEvent$2<ProviderTEESignerAcknowledgedEvent$1.InputTuple, ProviderTEESignerAcknowledgedEvent$1.OutputTuple, ProviderTEESignerAcknowledgedEvent$1.OutputObject>;
        ProviderTEESignerAcknowledged: TypedContractEvent$2<ProviderTEESignerAcknowledgedEvent$1.InputTuple, ProviderTEESignerAcknowledgedEvent$1.OutputTuple, ProviderTEESignerAcknowledgedEvent$1.OutputObject>;
        'RefundRequested(address,address,uint256,uint256)': TypedContractEvent$2<RefundRequestedEvent$1.InputTuple, RefundRequestedEvent$1.OutputTuple, RefundRequestedEvent$1.OutputObject>;
        RefundRequested: TypedContractEvent$2<RefundRequestedEvent$1.InputTuple, RefundRequestedEvent$1.OutputTuple, RefundRequestedEvent$1.OutputObject>;
        'ServiceRemoved(address)': TypedContractEvent$2<ServiceRemovedEvent$1.InputTuple, ServiceRemovedEvent$1.OutputTuple, ServiceRemovedEvent$1.OutputObject>;
        ServiceRemoved: TypedContractEvent$2<ServiceRemovedEvent$1.InputTuple, ServiceRemovedEvent$1.OutputTuple, ServiceRemovedEvent$1.OutputObject>;
        'ServiceUpdated(address,string,string,uint256,uint256,uint256,string,string)': TypedContractEvent$2<ServiceUpdatedEvent$1.InputTuple, ServiceUpdatedEvent$1.OutputTuple, ServiceUpdatedEvent$1.OutputObject>;
        ServiceUpdated: TypedContractEvent$2<ServiceUpdatedEvent$1.InputTuple, ServiceUpdatedEvent$1.OutputTuple, ServiceUpdatedEvent$1.OutputObject>;
        'TEESettlementResult(address,uint8,uint256)': TypedContractEvent$2<TEESettlementResultEvent.InputTuple, TEESettlementResultEvent.OutputTuple, TEESettlementResultEvent.OutputObject>;
        TEESettlementResult: TypedContractEvent$2<TEESettlementResultEvent.InputTuple, TEESettlementResultEvent.OutputTuple, TEESettlementResultEvent.OutputObject>;
        'TokenRevoked(address,address,uint8)': TypedContractEvent$2<TokenRevokedEvent.InputTuple, TokenRevokedEvent.OutputTuple, TokenRevokedEvent.OutputObject>;
        TokenRevoked: TypedContractEvent$2<TokenRevokedEvent.InputTuple, TokenRevokedEvent.OutputTuple, TokenRevokedEvent.OutputObject>;
        'TokensRevoked(address,address,uint8[])': TypedContractEvent$2<TokensRevokedEvent.InputTuple, TokensRevokedEvent.OutputTuple, TokensRevokedEvent.OutputObject>;
        TokensRevoked: TypedContractEvent$2<TokensRevokedEvent.InputTuple, TokensRevokedEvent.OutputTuple, TokensRevokedEvent.OutputObject>;
    };
}

declare class InferenceServingContract {
    serving: InferenceServing;
    signer: JsonRpcSigner | Wallet;
    private _userAddress;
    private _gasPrice?;
    private _maxGasPrice?;
    private _step;
    constructor(signer: JsonRpcSigner | Wallet, contractAddress: string, userAddress: string, gasPrice?: number, maxGasPrice?: number, step?: number);
    sendTx(name: string, txArgs: ContractMethodArgs$3<any[]>, txOptions: any): Promise<void>;
    lockTime(): Promise<bigint>;
    listService(offset?: number, limit?: number, includeUnacknowledged?: boolean): Promise<ServiceStructOutput$1[]>;
    listAccount(offset?: number, limit?: number): Promise<AccountStructOutput[]>;
    getAccount(provider: AddressLike): Promise<AccountStructOutput>;
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
    getService(providerAddress: string): Promise<ServiceStructOutput$1>;
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

declare abstract class Extractor {
    abstract getSvcInfo(): Promise<ServiceStructOutput$1>;
    abstract getInputCount(content: string): Promise<number>;
    abstract getOutputCount(content: string): Promise<number>;
}

declare class Metadata {
    private nodeStorage;
    private initialized;
    private isBrowser;
    private storagePrefix;
    constructor();
    initialize(): Promise<void>;
    private setItem;
    private getItem;
    storeSigningKey(key: string, value: string): Promise<void>;
    getSigningKey(key: string): Promise<string | null>;
}

declare enum CacheValueTypeEnum {
    Service = "service",
    BigInt = "bigint",
    Other = "other",
    Session = "session"
}
type CacheValueType = CacheValueTypeEnum.Service | CacheValueTypeEnum.BigInt | CacheValueTypeEnum.Other | CacheValueTypeEnum.Session;
declare class Cache {
    private nodeStorage;
    private initialized;
    private isBrowser;
    private storagePrefix;
    constructor();
    setLock(key: string, value: string, ttl: number, type: CacheValueType): boolean;
    removeLock(key: string): void;
    setItem(key: string, value: any, ttl: number, type: CacheValueType): void;
    getItem(key: string): any | null;
    private initialize;
    private setStorageItem;
    private getStorageItem;
    private removeStorageItem;
    private cleanupExpiredItems;
    static encodeValue(value: any): string;
    static decodeValue(encodedValue: string, type: CacheValueType): any;
    static createServiceStructOutput(fields: [
        string,
        string,
        string,
        bigint,
        bigint,
        bigint,
        string,
        string,
        string,
        string,
        boolean
    ]): ServiceStructOutput$1;
}

interface TypedDeferredTopicFilter$1<_TCEvent extends TypedContractEvent$1> extends DeferredTopicFilter {
}
interface TypedContractEvent$1<InputTuple extends Array<any> = any, OutputTuple extends Array<any> = any, OutputObject = any> {
    (...args: Partial<InputTuple>): TypedDeferredTopicFilter$1<TypedContractEvent$1<InputTuple, OutputTuple, OutputObject>>;
    name: string;
    fragment: EventFragment;
    getFragment(...args: Partial<InputTuple>): EventFragment;
}
type __TypechainAOutputTuple$1<T> = T extends TypedContractEvent$1<infer _U, infer W> ? W : never;
type __TypechainOutputObject$1<T> = T extends TypedContractEvent$1<infer _U, infer _W, infer V> ? V : never;
interface TypedEventLog$1<TCEvent extends TypedContractEvent$1> extends Omit<EventLog, 'args'> {
    args: __TypechainAOutputTuple$1<TCEvent> & __TypechainOutputObject$1<TCEvent>;
}
interface TypedLogDescription$1<TCEvent extends TypedContractEvent$1> extends Omit<LogDescription, 'args'> {
    args: __TypechainAOutputTuple$1<TCEvent> & __TypechainOutputObject$1<TCEvent>;
}
type TypedListener$1<TCEvent extends TypedContractEvent$1> = (...listenerArg: [
    ...__TypechainAOutputTuple$1<TCEvent>,
    TypedEventLog$1<TCEvent>,
    ...undefined[]
]) => void;
type StateMutability$1 = 'nonpayable' | 'payable' | 'view';
type BaseOverrides$1 = Omit<TransactionRequest, 'to' | 'data'>;
type NonPayableOverrides$1 = Omit<BaseOverrides$1, 'value' | 'blockTag' | 'enableCcipRead'>;
type PayableOverrides$1 = Omit<BaseOverrides$1, 'blockTag' | 'enableCcipRead'>;
type ViewOverrides$1 = Omit<TransactionRequest, 'to' | 'data'>;
type Overrides$1<S extends StateMutability$1> = S extends 'nonpayable' ? NonPayableOverrides$1 : S extends 'payable' ? PayableOverrides$1 : ViewOverrides$1;
type PostfixOverrides$1<A extends Array<any>, S extends StateMutability$1> = A | [...A, Overrides$1<S>];
type ContractMethodArgs$1<A extends Array<any>, S extends StateMutability$1> = PostfixOverrides$1<{
    [I in keyof A]-?: A[I] | Typed;
}, S>;
type DefaultReturnType$1<R> = R extends Array<any> ? R[0] : R;
interface TypedContractMethod$1<A extends Array<any> = Array<any>, R = any, S extends StateMutability$1 = 'payable'> {
    (...args: ContractMethodArgs$1<A, S>): S extends 'view' ? Promise<DefaultReturnType$1<R>> : Promise<ContractTransactionResponse>;
    name: string;
    fragment: FunctionFragment;
    getFragment(...args: ContractMethodArgs$1<A, S>): FunctionFragment;
    populateTransaction(...args: ContractMethodArgs$1<A, S>): Promise<ContractTransaction>;
    staticCall(...args: ContractMethodArgs$1<A, 'view'>): Promise<DefaultReturnType$1<R>>;
    send(...args: ContractMethodArgs$1<A, S>): Promise<ContractTransactionResponse>;
    estimateGas(...args: ContractMethodArgs$1<A, S>): Promise<bigint>;
    staticCallResult(...args: ContractMethodArgs$1<A, 'view'>): Promise<R>;
}

type ServiceInfoStructOutput = [
    serviceAddress: string,
    serviceContract: string,
    serviceType: string,
    version: string,
    fullName: string,
    description: string,
    isRecommended: boolean,
    registeredAt: bigint
] & {
    serviceAddress: string;
    serviceContract: string;
    serviceType: string;
    version: string;
    fullName: string;
    description: string;
    isRecommended: boolean;
    registeredAt: bigint;
};
type LedgerStructOutput = [
    user: string,
    availableBalance: bigint,
    totalBalance: bigint,
    additionalInfo: string
] & {
    user: string;
    availableBalance: bigint;
    totalBalance: bigint;
    additionalInfo: string;
};
interface LedgerManagerInterface extends Interface {
    getFunction(nameOrSignature: 'MAX_ADDITIONAL_INFO_LENGTH' | 'MAX_PROVIDERS_PER_BATCH' | 'MAX_PROVIDERS_PER_USER_PER_SERVICE' | 'MAX_SERVICES' | 'MIN_ACCOUNT_BALANCE' | 'MIN_TRANSFER_AMOUNT' | 'addLedger' | 'deleteLedger' | 'depositFund' | 'depositFundFor' | 'getAllActiveServices' | 'getAllLedgers' | 'getAllVersions' | 'getLedger' | 'getLedgerProviders' | 'getRecommendedService' | 'getServiceAddressByName' | 'getServiceInfo' | 'initialize' | 'initialized' | 'isRecommendedVersion' | 'owner' | 'refund' | 'registerService' | 'renounceOwnership' | 'retrieveFund' | 'setRecommendedService' | 'spendFund' | 'transferFund' | 'transferOwnership' | 'updateAdditionalInfo'): FunctionFragment;
    getEvent(nameOrSignatureOrTopic: 'FundSpent' | 'Initialized' | 'LedgerInfoUpdated' | 'OwnershipTransferred' | 'RecommendedServiceUpdated' | 'ServiceRegistered'): EventFragment;
    encodeFunctionData(functionFragment: 'MAX_ADDITIONAL_INFO_LENGTH', values?: undefined): string;
    encodeFunctionData(functionFragment: 'MAX_PROVIDERS_PER_BATCH', values?: undefined): string;
    encodeFunctionData(functionFragment: 'MAX_PROVIDERS_PER_USER_PER_SERVICE', values?: undefined): string;
    encodeFunctionData(functionFragment: 'MAX_SERVICES', values?: undefined): string;
    encodeFunctionData(functionFragment: 'MIN_ACCOUNT_BALANCE', values?: undefined): string;
    encodeFunctionData(functionFragment: 'MIN_TRANSFER_AMOUNT', values?: undefined): string;
    encodeFunctionData(functionFragment: 'addLedger', values: [string]): string;
    encodeFunctionData(functionFragment: 'deleteLedger', values?: undefined): string;
    encodeFunctionData(functionFragment: 'depositFund', values?: undefined): string;
    encodeFunctionData(functionFragment: 'depositFundFor', values: [AddressLike]): string;
    encodeFunctionData(functionFragment: 'getAllActiveServices', values?: undefined): string;
    encodeFunctionData(functionFragment: 'getAllLedgers', values: [BigNumberish, BigNumberish]): string;
    encodeFunctionData(functionFragment: 'getAllVersions', values: [string]): string;
    encodeFunctionData(functionFragment: 'getLedger', values: [AddressLike]): string;
    encodeFunctionData(functionFragment: 'getLedgerProviders', values: [AddressLike, string]): string;
    encodeFunctionData(functionFragment: 'getRecommendedService', values: [string]): string;
    encodeFunctionData(functionFragment: 'getServiceAddressByName', values: [string]): string;
    encodeFunctionData(functionFragment: 'getServiceInfo', values: [AddressLike]): string;
    encodeFunctionData(functionFragment: 'initialize', values: [AddressLike]): string;
    encodeFunctionData(functionFragment: 'initialized', values?: undefined): string;
    encodeFunctionData(functionFragment: 'isRecommendedVersion', values: [string, string]): string;
    encodeFunctionData(functionFragment: 'owner', values?: undefined): string;
    encodeFunctionData(functionFragment: 'refund', values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: 'registerService', values: [string, string, AddressLike, string]): string;
    encodeFunctionData(functionFragment: 'renounceOwnership', values?: undefined): string;
    encodeFunctionData(functionFragment: 'retrieveFund', values: [AddressLike[], string]): string;
    encodeFunctionData(functionFragment: 'setRecommendedService', values: [string, string]): string;
    encodeFunctionData(functionFragment: 'spendFund', values: [AddressLike, BigNumberish]): string;
    encodeFunctionData(functionFragment: 'transferFund', values: [AddressLike, string, BigNumberish]): string;
    encodeFunctionData(functionFragment: 'transferOwnership', values: [AddressLike]): string;
    encodeFunctionData(functionFragment: 'updateAdditionalInfo', values: [string]): string;
    decodeFunctionResult(functionFragment: 'MAX_ADDITIONAL_INFO_LENGTH', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'MAX_PROVIDERS_PER_BATCH', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'MAX_PROVIDERS_PER_USER_PER_SERVICE', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'MAX_SERVICES', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'MIN_ACCOUNT_BALANCE', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'MIN_TRANSFER_AMOUNT', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'addLedger', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'deleteLedger', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'depositFund', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'depositFundFor', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getAllActiveServices', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getAllLedgers', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getAllVersions', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getLedger', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getLedgerProviders', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getRecommendedService', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getServiceAddressByName', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'getServiceInfo', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'initialize', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'initialized', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'isRecommendedVersion', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'owner', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'refund', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'registerService', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'renounceOwnership', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'retrieveFund', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'setRecommendedService', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'spendFund', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'transferFund', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'transferOwnership', data: BytesLike): Result;
    decodeFunctionResult(functionFragment: 'updateAdditionalInfo', data: BytesLike): Result;
}
declare namespace FundSpentEvent {
    type InputTuple = [
        user: AddressLike,
        service: AddressLike,
        amount: BigNumberish
    ];
    type OutputTuple = [user: string, service: string, amount: bigint];
    interface OutputObject {
        user: string;
        service: string;
        amount: bigint;
    }
    type Event = TypedContractEvent$1<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$1<Event>;
    type Log = TypedEventLog$1<Event>;
    type LogDescription = TypedLogDescription$1<Event>;
}
declare namespace InitializedEvent$1 {
    type InputTuple = [version: BigNumberish];
    type OutputTuple = [version: bigint];
    interface OutputObject {
        version: bigint;
    }
    type Event = TypedContractEvent$1<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$1<Event>;
    type Log = TypedEventLog$1<Event>;
    type LogDescription = TypedLogDescription$1<Event>;
}
declare namespace LedgerInfoUpdatedEvent {
    type InputTuple = [user: AddressLike, additionalInfo: string];
    type OutputTuple = [user: string, additionalInfo: string];
    interface OutputObject {
        user: string;
        additionalInfo: string;
    }
    type Event = TypedContractEvent$1<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$1<Event>;
    type Log = TypedEventLog$1<Event>;
    type LogDescription = TypedLogDescription$1<Event>;
}
declare namespace OwnershipTransferredEvent$1 {
    type InputTuple = [previousOwner: AddressLike, newOwner: AddressLike];
    type OutputTuple = [previousOwner: string, newOwner: string];
    interface OutputObject {
        previousOwner: string;
        newOwner: string;
    }
    type Event = TypedContractEvent$1<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$1<Event>;
    type Log = TypedEventLog$1<Event>;
    type LogDescription = TypedLogDescription$1<Event>;
}
declare namespace RecommendedServiceUpdatedEvent {
    type InputTuple = [
        serviceType: string,
        version: string,
        serviceAddress: AddressLike
    ];
    type OutputTuple = [
        serviceType: string,
        version: string,
        serviceAddress: string
    ];
    interface OutputObject {
        serviceType: string;
        version: string;
        serviceAddress: string;
    }
    type Event = TypedContractEvent$1<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$1<Event>;
    type Log = TypedEventLog$1<Event>;
    type LogDescription = TypedLogDescription$1<Event>;
}
declare namespace ServiceRegisteredEvent {
    type InputTuple = [serviceAddress: AddressLike, serviceName: string];
    type OutputTuple = [serviceAddress: string, serviceName: string];
    interface OutputObject {
        serviceAddress: string;
        serviceName: string;
    }
    type Event = TypedContractEvent$1<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter$1<Event>;
    type Log = TypedEventLog$1<Event>;
    type LogDescription = TypedLogDescription$1<Event>;
}
interface LedgerManager extends BaseContract {
    connect(runner?: ContractRunner | null): LedgerManager;
    waitForDeployment(): Promise<this>;
    interface: LedgerManagerInterface;
    queryFilter<TCEvent extends TypedContractEvent$1>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog$1<TCEvent>>>;
    queryFilter<TCEvent extends TypedContractEvent$1>(filter: TypedDeferredTopicFilter$1<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog$1<TCEvent>>>;
    on<TCEvent extends TypedContractEvent$1>(event: TCEvent, listener: TypedListener$1<TCEvent>): Promise<this>;
    on<TCEvent extends TypedContractEvent$1>(filter: TypedDeferredTopicFilter$1<TCEvent>, listener: TypedListener$1<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent$1>(event: TCEvent, listener: TypedListener$1<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent$1>(filter: TypedDeferredTopicFilter$1<TCEvent>, listener: TypedListener$1<TCEvent>): Promise<this>;
    listeners<TCEvent extends TypedContractEvent$1>(event: TCEvent): Promise<Array<TypedListener$1<TCEvent>>>;
    listeners(eventName?: string): Promise<Array<Listener>>;
    removeAllListeners<TCEvent extends TypedContractEvent$1>(event?: TCEvent): Promise<this>;
    MAX_ADDITIONAL_INFO_LENGTH: TypedContractMethod$1<[], [bigint], 'view'>;
    MAX_PROVIDERS_PER_BATCH: TypedContractMethod$1<[], [bigint], 'view'>;
    MAX_PROVIDERS_PER_USER_PER_SERVICE: TypedContractMethod$1<[
    ], [
        bigint
    ], 'view'>;
    MAX_SERVICES: TypedContractMethod$1<[], [bigint], 'view'>;
    MIN_ACCOUNT_BALANCE: TypedContractMethod$1<[], [bigint], 'view'>;
    MIN_TRANSFER_AMOUNT: TypedContractMethod$1<[], [bigint], 'view'>;
    addLedger: TypedContractMethod$1<[
        additionalInfo: string
    ], [
        [bigint, bigint]
    ], 'payable'>;
    deleteLedger: TypedContractMethod$1<[], [void], 'nonpayable'>;
    depositFund: TypedContractMethod$1<[], [void], 'payable'>;
    depositFundFor: TypedContractMethod$1<[
        recipient: AddressLike
    ], [
        void
    ], 'payable'>;
    getAllActiveServices: TypedContractMethod$1<[
    ], [
        ServiceInfoStructOutput[]
    ], 'view'>;
    getAllLedgers: TypedContractMethod$1<[
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            LedgerStructOutput[],
            bigint
        ] & {
            ledgers: LedgerStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getAllVersions: TypedContractMethod$1<[
        serviceType: string
    ], [
        [
            string[],
            string[],
            boolean[]
        ] & {
            versions: string[];
            addresses: string[];
            isRecommendedFlags: boolean[];
        }
    ], 'view'>;
    getLedger: TypedContractMethod$1<[
        user: AddressLike
    ], [
        LedgerStructOutput
    ], 'view'>;
    getLedgerProviders: TypedContractMethod$1<[
        user: AddressLike,
        serviceName: string
    ], [
        string[]
    ], 'view'>;
    getRecommendedService: TypedContractMethod$1<[
        serviceType: string
    ], [
        [string, string] & {
            version: string;
            serviceAddress: string;
        }
    ], 'view'>;
    getServiceAddressByName: TypedContractMethod$1<[
        serviceName: string
    ], [
        string
    ], 'view'>;
    getServiceInfo: TypedContractMethod$1<[
        serviceAddress: AddressLike
    ], [
        ServiceInfoStructOutput
    ], 'view'>;
    initialize: TypedContractMethod$1<[owner: AddressLike], [void], 'nonpayable'>;
    initialized: TypedContractMethod$1<[], [boolean], 'view'>;
    isRecommendedVersion: TypedContractMethod$1<[
        serviceType: string,
        version: string
    ], [
        boolean
    ], 'view'>;
    owner: TypedContractMethod$1<[], [string], 'view'>;
    refund: TypedContractMethod$1<[amount: BigNumberish], [void], 'nonpayable'>;
    registerService: TypedContractMethod$1<[
        serviceType: string,
        version: string,
        serviceAddress: AddressLike,
        description: string
    ], [
        void
    ], 'nonpayable'>;
    renounceOwnership: TypedContractMethod$1<[], [void], 'nonpayable'>;
    retrieveFund: TypedContractMethod$1<[
        providers: AddressLike[],
        serviceName: string
    ], [
        void
    ], 'nonpayable'>;
    setRecommendedService: TypedContractMethod$1<[
        serviceType: string,
        version: string
    ], [
        void
    ], 'nonpayable'>;
    spendFund: TypedContractMethod$1<[
        user: AddressLike,
        amount: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    transferFund: TypedContractMethod$1<[
        provider: AddressLike,
        serviceName: string,
        amount: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    transferOwnership: TypedContractMethod$1<[
        newOwner: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    updateAdditionalInfo: TypedContractMethod$1<[
        additionalInfo: string
    ], [
        void
    ], 'nonpayable'>;
    getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
    getFunction(nameOrSignature: 'MAX_ADDITIONAL_INFO_LENGTH'): TypedContractMethod$1<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'MAX_PROVIDERS_PER_BATCH'): TypedContractMethod$1<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'MAX_PROVIDERS_PER_USER_PER_SERVICE'): TypedContractMethod$1<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'MAX_SERVICES'): TypedContractMethod$1<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'MIN_ACCOUNT_BALANCE'): TypedContractMethod$1<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'MIN_TRANSFER_AMOUNT'): TypedContractMethod$1<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'addLedger'): TypedContractMethod$1<[
        additionalInfo: string
    ], [
        [bigint, bigint]
    ], 'payable'>;
    getFunction(nameOrSignature: 'deleteLedger'): TypedContractMethod$1<[], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'depositFund'): TypedContractMethod$1<[], [void], 'payable'>;
    getFunction(nameOrSignature: 'depositFundFor'): TypedContractMethod$1<[recipient: AddressLike], [void], 'payable'>;
    getFunction(nameOrSignature: 'getAllActiveServices'): TypedContractMethod$1<[], [ServiceInfoStructOutput[]], 'view'>;
    getFunction(nameOrSignature: 'getAllLedgers'): TypedContractMethod$1<[
        offset: BigNumberish,
        limit: BigNumberish
    ], [
        [
            LedgerStructOutput[],
            bigint
        ] & {
            ledgers: LedgerStructOutput[];
            total: bigint;
        }
    ], 'view'>;
    getFunction(nameOrSignature: 'getAllVersions'): TypedContractMethod$1<[
        serviceType: string
    ], [
        [
            string[],
            string[],
            boolean[]
        ] & {
            versions: string[];
            addresses: string[];
            isRecommendedFlags: boolean[];
        }
    ], 'view'>;
    getFunction(nameOrSignature: 'getLedger'): TypedContractMethod$1<[user: AddressLike], [LedgerStructOutput], 'view'>;
    getFunction(nameOrSignature: 'getLedgerProviders'): TypedContractMethod$1<[
        user: AddressLike,
        serviceName: string
    ], [
        string[]
    ], 'view'>;
    getFunction(nameOrSignature: 'getRecommendedService'): TypedContractMethod$1<[
        serviceType: string
    ], [
        [string, string] & {
            version: string;
            serviceAddress: string;
        }
    ], 'view'>;
    getFunction(nameOrSignature: 'getServiceAddressByName'): TypedContractMethod$1<[serviceName: string], [string], 'view'>;
    getFunction(nameOrSignature: 'getServiceInfo'): TypedContractMethod$1<[
        serviceAddress: AddressLike
    ], [
        ServiceInfoStructOutput
    ], 'view'>;
    getFunction(nameOrSignature: 'initialize'): TypedContractMethod$1<[owner: AddressLike], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'initialized'): TypedContractMethod$1<[], [boolean], 'view'>;
    getFunction(nameOrSignature: 'isRecommendedVersion'): TypedContractMethod$1<[
        serviceType: string,
        version: string
    ], [
        boolean
    ], 'view'>;
    getFunction(nameOrSignature: 'owner'): TypedContractMethod$1<[], [string], 'view'>;
    getFunction(nameOrSignature: 'refund'): TypedContractMethod$1<[amount: BigNumberish], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'registerService'): TypedContractMethod$1<[
        serviceType: string,
        version: string,
        serviceAddress: AddressLike,
        description: string
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'renounceOwnership'): TypedContractMethod$1<[], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'retrieveFund'): TypedContractMethod$1<[
        providers: AddressLike[],
        serviceName: string
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'setRecommendedService'): TypedContractMethod$1<[
        serviceType: string,
        version: string
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'spendFund'): TypedContractMethod$1<[
        user: AddressLike,
        amount: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'transferFund'): TypedContractMethod$1<[
        provider: AddressLike,
        serviceName: string,
        amount: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'transferOwnership'): TypedContractMethod$1<[newOwner: AddressLike], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'updateAdditionalInfo'): TypedContractMethod$1<[additionalInfo: string], [void], 'nonpayable'>;
    getEvent(key: 'FundSpent'): TypedContractEvent$1<FundSpentEvent.InputTuple, FundSpentEvent.OutputTuple, FundSpentEvent.OutputObject>;
    getEvent(key: 'Initialized'): TypedContractEvent$1<InitializedEvent$1.InputTuple, InitializedEvent$1.OutputTuple, InitializedEvent$1.OutputObject>;
    getEvent(key: 'LedgerInfoUpdated'): TypedContractEvent$1<LedgerInfoUpdatedEvent.InputTuple, LedgerInfoUpdatedEvent.OutputTuple, LedgerInfoUpdatedEvent.OutputObject>;
    getEvent(key: 'OwnershipTransferred'): TypedContractEvent$1<OwnershipTransferredEvent$1.InputTuple, OwnershipTransferredEvent$1.OutputTuple, OwnershipTransferredEvent$1.OutputObject>;
    getEvent(key: 'RecommendedServiceUpdated'): TypedContractEvent$1<RecommendedServiceUpdatedEvent.InputTuple, RecommendedServiceUpdatedEvent.OutputTuple, RecommendedServiceUpdatedEvent.OutputObject>;
    getEvent(key: 'ServiceRegistered'): TypedContractEvent$1<ServiceRegisteredEvent.InputTuple, ServiceRegisteredEvent.OutputTuple, ServiceRegisteredEvent.OutputObject>;
    filters: {
        'FundSpent(address,address,uint256)': TypedContractEvent$1<FundSpentEvent.InputTuple, FundSpentEvent.OutputTuple, FundSpentEvent.OutputObject>;
        FundSpent: TypedContractEvent$1<FundSpentEvent.InputTuple, FundSpentEvent.OutputTuple, FundSpentEvent.OutputObject>;
        'Initialized(uint8)': TypedContractEvent$1<InitializedEvent$1.InputTuple, InitializedEvent$1.OutputTuple, InitializedEvent$1.OutputObject>;
        Initialized: TypedContractEvent$1<InitializedEvent$1.InputTuple, InitializedEvent$1.OutputTuple, InitializedEvent$1.OutputObject>;
        'LedgerInfoUpdated(address,string)': TypedContractEvent$1<LedgerInfoUpdatedEvent.InputTuple, LedgerInfoUpdatedEvent.OutputTuple, LedgerInfoUpdatedEvent.OutputObject>;
        LedgerInfoUpdated: TypedContractEvent$1<LedgerInfoUpdatedEvent.InputTuple, LedgerInfoUpdatedEvent.OutputTuple, LedgerInfoUpdatedEvent.OutputObject>;
        'OwnershipTransferred(address,address)': TypedContractEvent$1<OwnershipTransferredEvent$1.InputTuple, OwnershipTransferredEvent$1.OutputTuple, OwnershipTransferredEvent$1.OutputObject>;
        OwnershipTransferred: TypedContractEvent$1<OwnershipTransferredEvent$1.InputTuple, OwnershipTransferredEvent$1.OutputTuple, OwnershipTransferredEvent$1.OutputObject>;
        'RecommendedServiceUpdated(string,string,address)': TypedContractEvent$1<RecommendedServiceUpdatedEvent.InputTuple, RecommendedServiceUpdatedEvent.OutputTuple, RecommendedServiceUpdatedEvent.OutputObject>;
        RecommendedServiceUpdated: TypedContractEvent$1<RecommendedServiceUpdatedEvent.InputTuple, RecommendedServiceUpdatedEvent.OutputTuple, RecommendedServiceUpdatedEvent.OutputObject>;
        'ServiceRegistered(address,string)': TypedContractEvent$1<ServiceRegisteredEvent.InputTuple, ServiceRegisteredEvent.OutputTuple, ServiceRegisteredEvent.OutputObject>;
        ServiceRegistered: TypedContractEvent$1<ServiceRegisteredEvent.InputTuple, ServiceRegisteredEvent.OutputTuple, ServiceRegisteredEvent.OutputObject>;
    };
}

declare class LedgerManagerContract {
    ledger: LedgerManager;
    signer: JsonRpcSigner | Wallet;
    private _userAddress;
    private _gasPrice?;
    private _maxGasPrice?;
    private _step;
    constructor(signer: JsonRpcSigner | Wallet, contractAddress: string, userAddress: string, gasPrice?: number, maxGasPrice?: number, step?: number);
    sendTx(name: string, txArgs: ContractMethodArgs$3<any[]>, txOptions: any): Promise<void>;
    addLedger(balance: bigint, additionalInfo?: string, gasPrice?: number): Promise<void>;
    listLedger(offset?: number, limit?: number): Promise<LedgerStructOutput[]>;
    getLedger(): Promise<LedgerStructOutput>;
    getLedgerProviders(user: string, serviceName: string): Promise<string[]>;
    getServiceInfo(serviceAddress: string): Promise<ServiceInfoStructOutput>;
    depositFund(balance: string, gasPrice?: number): Promise<void>;
    refund(amount: BigNumberish, gasPrice?: number): Promise<void>;
    transferFund(provider: AddressLike, serviceName: string, amount: BigNumberish, gasPrice?: number): Promise<void>;
    retrieveFund(providers: AddressLike[], serviceName: string, gasPrice?: number): Promise<void>;
    deleteLedger(gasPrice?: number): Promise<void>;
    depositFundFor(recipient: AddressLike, amount: string, gasPrice?: number): Promise<void>;
    getUserAddress(): string;
    checkReceipt(receipt: ContractTransactionReceipt | null): void;
}

interface TypedDeferredTopicFilter<_TCEvent extends TypedContractEvent> extends DeferredTopicFilter {
}
interface TypedContractEvent<InputTuple extends Array<any> = any, OutputTuple extends Array<any> = any, OutputObject = any> {
    (...args: Partial<InputTuple>): TypedDeferredTopicFilter<TypedContractEvent<InputTuple, OutputTuple, OutputObject>>;
    name: string;
    fragment: EventFragment;
    getFragment(...args: Partial<InputTuple>): EventFragment;
}
type __TypechainAOutputTuple<T> = T extends TypedContractEvent<infer _U, infer W> ? W : never;
type __TypechainOutputObject<T> = T extends TypedContractEvent<infer _U, infer _W, infer V> ? V : never;
interface TypedEventLog<TCEvent extends TypedContractEvent> extends Omit<EventLog, 'args'> {
    args: __TypechainAOutputTuple<TCEvent> & __TypechainOutputObject<TCEvent>;
}
interface TypedLogDescription<TCEvent extends TypedContractEvent> extends Omit<LogDescription, 'args'> {
    args: __TypechainAOutputTuple<TCEvent> & __TypechainOutputObject<TCEvent>;
}
type TypedListener<TCEvent extends TypedContractEvent> = (...listenerArg: [
    ...__TypechainAOutputTuple<TCEvent>,
    TypedEventLog<TCEvent>,
    ...undefined[]
]) => void;
type StateMutability = 'nonpayable' | 'payable' | 'view';
type BaseOverrides = Omit<TransactionRequest, 'to' | 'data'>;
type NonPayableOverrides = Omit<BaseOverrides, 'value' | 'blockTag' | 'enableCcipRead'>;
type PayableOverrides = Omit<BaseOverrides, 'blockTag' | 'enableCcipRead'>;
type ViewOverrides = Omit<TransactionRequest, 'to' | 'data'>;
type Overrides<S extends StateMutability> = S extends 'nonpayable' ? NonPayableOverrides : S extends 'payable' ? PayableOverrides : ViewOverrides;
type PostfixOverrides<A extends Array<any>, S extends StateMutability> = A | [...A, Overrides<S>];
type ContractMethodArgs<A extends Array<any>, S extends StateMutability> = PostfixOverrides<{
    [I in keyof A]-?: A[I] | Typed;
}, S>;
type DefaultReturnType<R> = R extends Array<any> ? R[0] : R;
interface TypedContractMethod<A extends Array<any> = Array<any>, R = any, S extends StateMutability = 'payable'> {
    (...args: ContractMethodArgs<A, S>): S extends 'view' ? Promise<DefaultReturnType<R>> : Promise<ContractTransactionResponse>;
    name: string;
    fragment: FunctionFragment;
    getFragment(...args: ContractMethodArgs<A, S>): FunctionFragment;
    populateTransaction(...args: ContractMethodArgs<A, S>): Promise<ContractTransaction>;
    staticCall(...args: ContractMethodArgs<A, 'view'>): Promise<DefaultReturnType<R>>;
    send(...args: ContractMethodArgs<A, S>): Promise<ContractTransactionResponse>;
    estimateGas(...args: ContractMethodArgs<A, S>): Promise<bigint>;
    staticCallResult(...args: ContractMethodArgs<A, 'view'>): Promise<R>;
}

type QuotaStruct = {
    cpuCount: BigNumberish;
    nodeMemory: BigNumberish;
    gpuCount: BigNumberish;
    nodeStorage: BigNumberish;
    gpuType: string;
};
type QuotaStructOutput = [
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
type RefundStructOutput = [
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
type DeliverableStructOutput = [
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
type AccountDetailsStructOutput = [
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
type AccountSummaryStructOutput = [
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
type ServiceStructOutput = [
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
type VerifierInputStruct = {
    id: string;
    encryptedSecret: BytesLike;
    modelRootHash: BytesLike;
    nonce: BigNumberish;
    signature: BytesLike;
    taskFee: BigNumberish;
    user: AddressLike;
};
interface FineTuningServingInterface extends Interface {
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
declare namespace AccountDeletedEvent {
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
declare namespace BalanceUpdatedEvent {
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
declare namespace DeliverableAcknowledgedEvent {
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
declare namespace DeliverableAddedEvent {
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
declare namespace DeliverableEvictedEvent {
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
declare namespace FeesSettledEvent {
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
declare namespace InitializedEvent {
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
declare namespace LockTimeUpdatedEvent {
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
declare namespace OwnershipTransferredEvent {
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
declare namespace ProviderStakeReturnedEvent {
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
declare namespace ProviderStakedEvent {
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
declare namespace ProviderTEESignerAcknowledgedEvent {
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
declare namespace RefundRequestedEvent {
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
declare namespace ServiceRemovedEvent {
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
declare namespace ServiceUpdatedEvent {
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
interface FineTuningServing extends BaseContract {
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

declare class FineTuningServingContract {
    serving: FineTuningServing;
    signer: Wallet;
    private _userAddress;
    private _gasPrice?;
    private _maxGasPrice?;
    private _step;
    constructor(signer: Wallet, contractAddress: string, userAddress: string, gasPrice?: number, maxGasPrice?: number, step?: number);
    lockTime(): Promise<bigint>;
    sendTx(name: string, txArgs: ContractMethodArgs$3<any[]>, txOptions: any): Promise<void>;
    listService(): Promise<ServiceStructOutput[]>;
    listAccount(offset?: number, limit?: number): Promise<AccountSummaryStructOutput[]>;
    getAccount(provider: AddressLike): Promise<AccountDetailsStructOutput>;
    acknowledgeTEESigner(providerAddress: AddressLike, acknowledged: boolean, gasPrice?: number): Promise<void>;
    acknowledgeTEESignerByOwner(providerAddress: AddressLike, gasPrice?: number): Promise<void>;
    revokeTEESignerAcknowledgement(providerAddress: AddressLike, gasPrice?: number): Promise<void>;
    removeService(gasPrice?: number): Promise<void>;
    acknowledgeDeliverable(providerAddress: AddressLike, id: string, gasPrice?: number): Promise<void>;
    getService(providerAddress: string): Promise<ServiceStructOutput>;
    getDeliverable(providerAddress: AddressLike, id: string): Promise<DeliverableStructOutput>;
    getUserAddress(): string;
    checkReceipt(receipt: ContractTransactionReceipt | null): void;
}

interface LedgerDetailStructOutput {
    ledgerInfo: bigint[];
    infers: [string, bigint, bigint][];
    fines: [string, bigint, bigint][] | null;
}
interface ServiceNames {
    inference: string;
    fineTuning?: string;
}
/**
 * LedgerProcessor contains methods for creating, depositing funds, and retrieving 0G Compute Network Ledgers.
 */
declare class LedgerProcessor {
    protected metadata: Metadata;
    protected cache: Cache;
    protected ledgerContract: LedgerManagerContract;
    protected inferenceContract: InferenceServingContract;
    protected fineTuningContract: FineTuningServingContract | undefined;
    protected serviceNames: ServiceNames;
    constructor(metadata: Metadata, cache: Cache, ledgerContract: LedgerManagerContract, inferenceContract: InferenceServingContract, fineTuningContract: FineTuningServingContract | undefined, serviceNames: ServiceNames);
    getLedger(): Promise<LedgerStructOutput>;
    getLedgerWithDetail(): Promise<LedgerDetailStructOutput>;
    listLedger(): Promise<LedgerStructOutput[]>;
    addLedger(balance: number, gasPrice?: number): Promise<void>;
    deleteLedger(gasPrice?: number): Promise<void>;
    depositFund(balance: number, gasPrice?: number): Promise<void>;
    refund(balance: number, gasPrice?: number): Promise<void>;
    /**
     * Deposits a specified amount of funds into Ledger for a specific recipient address.
     *
     * @param {AddressLike} recipient - The address to deposit funds for.
     * @param {number} balance - The amount of funds to be deposited. Units are in 0G.
     * @param {number} gasPrice - The gas price to be used for the transaction. If not provided,
     *                            the default/auto-generated gas price will be used. Units are in neuron.
     *
     * @throws  An error if the deposit fails.
     */
    depositFundFor(recipient: AddressLike, balance: number, gasPrice?: number): Promise<void>;
    transferFund(to: AddressLike, serviceTypeStr: 'inference' | 'fine-tuning', balance: bigint, gasPrice?: number): Promise<void>;
    retrieveFund(serviceTypeStr: 'inference' | 'fine-tuning', gasPrice?: number): Promise<void>;
    protected a0giToNeuron(value: number): bigint;
    protected neuronToA0gi(value: bigint): number;
}

declare class LedgerBroker {
    ledger: LedgerProcessor;
    private signer;
    private ledgerCA;
    private inferenceCA;
    private fineTuningCA;
    private gasPrice;
    private maxGasPrice;
    private step;
    constructor(signer: JsonRpcSigner | Wallet, ledgerCA: string, inferenceCA: string, fineTuningCA: string, gasPrice?: number, maxGasPrice?: number, step?: number);
    initialize(): Promise<void>;
    private getServiceNames;
    /**
     * Adds a new ledger to the contract.
     *
     * @param {number} balance - The initial balance to be assigned to the new ledger. Units are in 0G.
     * @param {number} gasPrice - The gas price to be used for the transaction. If not provided,
     *                            the default/auto-generated gas price will be used. Units are in neuron.
     *
     * @throws  An error if the ledger creation fails.
     *
     * @remarks
     * When creating an ledger, a key pair is also created to sign the request.
     */
    addLedger: (balance: number, gasPrice?: number) => Promise<void>;
    /**
     * Retrieves the ledger information for current wallet address.
     *
     * @returns A promise that resolves to the ledger information.
     *
     * @throws Will throw an error if the ledger retrieval process fails.
     */
    getLedger: () => Promise<LedgerStructOutput>;
    /**
     * Deposits a specified amount of funds into Ledger corresponding to the current wallet address.
     *
     * @param {string} amount - The amount of funds to be deposited. Units are in 0G.
     * @param {number} gasPrice - The gas price to be used for the transaction. If not provided,
     *                            the default/auto-generated gas price will be used. Units are in neuron.
     *
     * @throws  An error if the deposit fails.
     */
    depositFund: (amount: number, gasPrice?: number) => Promise<void>;
    /**
     * Refunds a specified amount using the ledger.
     *
     * @param amount - The amount to be refunded.
     * @param {number} gasPrice - The gas price to be used for the transaction. If not provided,
     *                            the default/auto-generated gas price will be used. Units are in neuron.
     *
     * @returns A promise that resolves when the refund is processed.
     * @throws Will throw an error if the refund process fails.
     *
     * @remarks The amount should be a positive number.
     */
    refund: (amount: number, gasPrice?: number) => Promise<void>;
    /**
     * Deposits a specified amount of funds into Ledger for a specific recipient address.
     *
     * @param {AddressLike} recipient - The address to deposit funds for.
     * @param {number} amount - The amount of funds to be deposited. Units are in 0G.
     * @param {number} gasPrice - The gas price to be used for the transaction. If not provided,
     *                            the default/auto-generated gas price will be used. Units are in neuron.
     *
     * @throws  An error if the deposit fails.
     */
    depositFundFor: (recipient: AddressLike, amount: number, gasPrice?: number) => Promise<void>;
    /**
     * Transfers a specified amount of funds to a provider for a given service type.
     *
     * @param provider - The address of the provider to whom the funds are being transferred.
     * @param serviceTypeStr - The type of service for which the funds are being transferred.
     *                         It can be either 'inference' or 'fine-tuning'.
     * @param amount - The amount of funds to be transferred. Units are in neuron.
     * @param {number} gasPrice - The gas price to be used for the transaction. If not provided,
     *                            the default/auto-generated gas price will be used. Units are in neuron.
     *
     * @returns A promise that resolves with the result of the fund transfer operation.
     * @throws Will throw an error if the fund transfer operation fails.
     */
    transferFund: (provider: AddressLike, serviceTypeStr: "inference" | "fine-tuning", amount: bigint, gasPrice?: number) => Promise<void>;
    /**
     * Retrieves funds from the all sub-accounts (for inference and fine-tuning) of the current wallet address.
     *
     * @param serviceTypeStr - The type of service for which the funds are being retrieved.
     *                         It can be either 'inference' or 'fine-tuning'.
     * @param {number} gasPrice - The gas price to be used for the transaction. If not provided,
     *                            the default/auto-generated gas price will be used. Units are in neuron.
     *
     * @returns A promise that resolves with the result of the fund retrieval operation.
     * @throws Will throw an error if the fund retrieval operation fails.
     */
    retrieveFund: (serviceTypeStr: "inference" | "fine-tuning", gasPrice?: number) => Promise<void>;
    /**
     * Deletes the ledger corresponding to the current wallet address.
     *
     * @param {number} gasPrice - The gas price to be used for the transaction. If not provided,
     *                           the default/auto-generated gas price will be used. Units are in neuron.
     *
     * @throws  An error if the deletion fails.
     */
    deleteLedger: (gasPrice?: number) => Promise<void>;
}
/**
 * createLedgerBroker is used to initialize LedgerBroker
 *
 * @param signer - Signer from ethers.js.
 * @param ledgerCA - Ledger contract address, use default address if not provided.
 *
 * @returns broker instance.
 *
 * @throws An error if the broker cannot be initialized.
 */
declare function createLedgerBroker(signer: JsonRpcSigner | Wallet, ledgerCA: string, inferenceCA: string, fineTuningCA: string, gasPrice?: number, maxGasPrice?: number, step?: number): Promise<LedgerBroker>;

declare class Automata {
    protected provider: any;
    protected contract: ethers.Contract;
    constructor();
    verifyQuote(rawQuote: string): Promise<boolean | undefined>;
}

/**
 * ServingRequestHeaders contains headers related to request.
 * Only Address and VLLM-Proxy are required now.
 */
interface ServingRequestHeaders {
    /**
     * @deprecated This field is no longer used but kept for backwards compatibility
     */
    'X-Phala-Signature-Type'?: 'StandaloneApi';
    /**
     * @deprecated User's address - no longer used, it included in Authorization header
     */
    Address?: string;
    /**
     * @deprecated Total fee for the request - no longer used
     */
    Fee?: string;
    /**
     * @deprecated Fee required for the input - no longer used
     */
    'Input-Fee'?: string;
    /**
     * @deprecated Pedersen hash - no longer used
     */
    'Request-Hash'?: string;
    /**
     * @deprecated Nonce - no longer used
     */
    Nonce?: string;
    /**
     * @deprecated User's signature - no longer used
     */
    Signature?: string;
    Authorization: string;
}
/**
 * RequestProcessor is a subclass of ZGServingUserBroker.
 * It needs to be initialized with createZGServingUserBroker
 * before use.
 */
declare class RequestProcessor extends ZGServingUserBrokerBase {
    protected automata: Automata;
    constructor(contract: InferenceServingContract, metadata: Metadata, cache: Cache, ledger: LedgerBroker);
    getServiceMetadata(providerAddress: string): Promise<{
        endpoint: string;
        model: string;
    }>;
    getRequestHeaders(providerAddress: string, content?: string): Promise<ServingRequestHeaders>;
    /**
     * Check if provider's TEE signer is acknowledged by the contract owner.
     * This method no longer performs acknowledgement (which is owner-only),
     * but verifies if the provider is ready for use.
     */
    checkProviderSignerStatus(providerAddress: string, gasPrice?: number): Promise<{
        isAcknowledged: boolean;
        teeSignerAddress: string;
    }>;
    /**
     * acknowledgeProviderSigner tells the contract that user trust the acknowledgment of contract owner towards certain provider.
     *
     * @param providerAddress - The address of the provider
     */
    acknowledgeProviderSigner(providerAddress: string, gasPrice?: number): Promise<void>;
    /**
     * revokeAcknowledgeProviderSigner tells the contract that user not trust the acknowledgment of contract owner towards certain provider.
     * The function only take effect when the balance of the account is empty.
     *
     * @param providerAddress - The address of the provider
     */
    revokeAcknowledgeProviderSigner(providerAddress: string, gasPrice?: number): Promise<void>;
    /**
     * Acknowledge TEE Signer (Contract Owner Only)
     *
     * @param providerAddress - The address of the provider
     */
    ownerAcknowledgeTEESigner(providerAddress: string, gasPrice?: number): Promise<void>;
    /**
     * Revoke TEE Signer Acknowledgement (Contract Owner Only)
     *
     * @param providerAddress - The address of the provider
     */
    ownerRevokeTEESignerAcknowledgement(providerAddress: string, gasPrice?: number): Promise<void>;
}

interface TdxQuoteResponse {
    rawReport: string;
    signingAddress: string;
}
/**
 * Session mode for token generation
 */
declare enum SessionMode {
    /** Ephemeral token: uses tokenId=255, not individually revocable, no quota consumption */
    Ephemeral = "ephemeral",
    /** Persistent token: uses tokenId 0-254, individually revocable, consumes quota */
    Persistent = "persistent"
}
interface SessionToken {
    address: string;
    provider: string;
    timestamp: number;
    expiresAt: number;
    nonce: string;
    generation: number;
    tokenId: number;
}
interface CachedSession {
    token: SessionToken;
    signature: string;
    rawMessage: string;
}
/**
 * API Key information for persistent tokens
 */
interface ApiKeyInfo {
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
interface SessionTokenOptions {
    /** Session mode: ephemeral (default) or persistent */
    mode?: SessionMode;
    /** Duration in milliseconds. 0 = never expires. Default: 24 hours for ephemeral */
    duration?: number;
    /** Specific tokenId to use for persistent mode (0-254). If not provided, will find available one from bitmap */
    tokenId?: number;
}
declare abstract class ZGServingUserBrokerBase {
    protected contract: InferenceServingContract;
    protected metadata: Metadata;
    protected cache: Cache;
    private checkAccountThreshold;
    private topUpTriggerThreshold;
    private topUpTargetThreshold;
    protected ledger: LedgerBroker;
    constructor(contract: InferenceServingContract, ledger: LedgerBroker, metadata: Metadata, cache: Cache);
    protected getService(providerAddress: string, useCache?: boolean): Promise<ServiceStructOutput$1>;
    getQuote(providerAddress: string): Promise<TdxQuoteResponse>;
    downloadQuoteReport(providerAddress: string, outputPath: string): Promise<void>;
    userAcknowledged(providerAddress: string): Promise<boolean>;
    fetchText(endpoint: string, options: RequestInit): Promise<string>;
    protected getExtractor(providerAddress: string, useCache?: boolean): Promise<Extractor>;
    protected createExtractor(svc: ServiceStructOutput$1): Extractor;
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
    shouldCheckAccount(svc: ServiceStructOutput$1): Promise<boolean>;
}

/**
 * AccountProcessor contains methods for creating, depositing funds, and retrieving 0G Serving Accounts.
 */
declare class AccountProcessor extends ZGServingUserBrokerBase {
    getAccount(provider: AddressLike): Promise<AccountStructOutput>;
    getAccountWithDetail(provider: AddressLike): Promise<[
        AccountStructOutput,
        {
            amount: bigint;
            remainTime: bigint;
        }[]
    ]>;
    listAccount(): Promise<AccountStructOutput[]>;
}

interface ServiceWithDetail {
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
    healthMetrics?: {
        status: string;
        uptime: number;
        avgResponseTime: number;
        lastCheck: string;
    };
}
declare class ModelProcessor extends ZGServingUserBrokerBase {
    listService(offset?: number, limit?: number, includeUnacknowledged?: boolean): Promise<ServiceStructOutput$1[]>;
    /**
     * Retrieves a list of services with detailed health metrics from the monitoring API.
     *
     * @param {number} offset - The offset for pagination (default: 0).
     * @param {number} limit - The limit for pagination (default: 50).
     * @param {boolean} includeUnacknowledged - Whether to include providers whose TEE signer is not acknowledged (default: false).
     * @returns {Promise<ServiceWithDetail[]>} A promise that resolves to an array of ServiceWithDetail objects containing both blockchain and health data.
     * @throws An error if the service list cannot be retrieved or health API is unreachable.
     */
    listServiceWithDetail(offset?: number, limit?: number, includeUnacknowledged?: boolean): Promise<ServiceWithDetail[]>;
    /**
     * Get health API endpoint based on chain ID
     * @param chainId - The chain ID
     * @returns The health API endpoint URL
     */
    private getHealthApiEndpoint;
    /**
     * Remove service (Provider owner only)
     *
     * This function allows the provider owner to remove their service from the contract.
     *
     * @param {number} gasPrice - Optional gas price for the transaction.
     * @throws Will throw an error if the caller is not the service owner or if removal fails.
     */
    removeService(gasPrice?: number): Promise<void>;
    /**
     * Update service (Provider owner only)
     *
     * This function allows the provider owner to update their existing service.
     * All parameters are optional - if not provided, the current value is preserved.
     *
     * @param options - Update options
     * @param options.url - New service URL
     * @param options.model - New model name
     * @param options.inputPrice - New input price (in neuron, the smallest unit)
     * @param options.outputPrice - New output price (in neuron, the smallest unit)
     * @param options.gasPrice - Optional gas price for the transaction
     * @throws Will throw an error if the caller is not the service owner or if update fails.
     */
    updateService(options: {
        url?: string;
        model?: string;
        inputPrice?: bigint;
        outputPrice?: bigint;
        gasPrice?: number;
    }): Promise<void>;
}

/**
 * ResponseProcessor is a subclass of ZGServingUserBroker.
 * It needs to be initialized with createZGServingUserBroker
 * before use.
 */
declare class ResponseProcessor extends ZGServingUserBrokerBase {
    constructor(contract: InferenceServingContract, ledger: LedgerBroker, metadata: Metadata, cache: Cache);
    processResponse(providerAddress: string, chatID?: string, content?: string): Promise<boolean | null>;
}

interface ResponseSignature {
    text: string;
    signature: string;
}
interface SingerRAVerificationResult {
    /**
     * Whether the signer RA is valid
     * null means the RA has not been verified
     */
    valid: boolean | null;
    /**
     * The signing address of the signer
     */
    signingAddress: string;
}
interface VerificationResult$1 {
    success: boolean;
    teeVerifier: string;
    targetSeparated: boolean;
    verifierURL?: string;
    reportsGenerated: string[];
    outputDirectory: string;
    reportsData?: {
        broker?: AttestationReport$1;
        llm?: AttestationReport$1;
        combined?: AttestationReport$1;
    };
}
interface AttestationReport$1 {
    tcb_info?: Record<string, unknown>;
    info?: {
        tcb_info?: Record<string, unknown>;
    };
    event_log?: EventLogEntry$1[];
    [key: string]: unknown;
}
interface EventLogEntry$1 {
    event: string;
    event_payload?: string;
    [key: string]: unknown;
}
/**
 * The Verifier class contains methods for verifying service reliability.
 */
declare class Verifier extends ZGServingUserBrokerBase {
    constructor(contract: InferenceServingContract, ledger: LedgerBroker, metadata: Metadata, cache: Cache);
    /**
     * Comprehensive TEE service verification guide
     * Guides users through verifying whether a provider is running in TEE
     *
     * @param providerAddress - The provider address to verify
     * @param outputDir - Directory to save attestation reports (default: current directory)
     * @returns Verification results and user guidance
     */
    verifyService(providerAddress: string, outputDir?: string): Promise<VerificationResult$1>;
    /**
     * Extract TEE signer address from attestation report
     */
    private extractTeeSignerAddress;
    /**
     * Process DStack-specific verification steps
     */
    private processDStackVerification;
    /**
     * Verify compose hash based on the dstack verification logic
     */
    private verifyComposeHash;
    /**
     * Extract all Docker images from tcb_info
     */
    private extractAllImagesFromTcbInfo;
    /**
     * Check if running in browser environment
     */
    private isBrowser;
    /**
     * Save report to file (Node.js only)
     * In browser environment, this is a no-op
     */
    private saveReportToFile;
    getSignerRaDownloadLink(providerAddress: string): Promise<string>;
    getChatSignatureDownloadLink(providerAddress: string, chatID: string): Promise<string>;
    static verifyRA(providerBrokerURL: string, nvidia_payload: Record<string, unknown>): Promise<boolean>;
    getQuoteInLLMServer(providerBrokerURL: string, model: string): Promise<TdxQuoteResponse>;
    static fetchSignatureByChatID(providerBrokerURL: string, chatID: string, model: string): Promise<ResponseSignature>;
    static verifySignature(message: string, signature: string, expectedAddress: string): boolean;
}

declare class InferenceBroker {
    requestProcessor: RequestProcessor;
    responseProcessor: ResponseProcessor;
    verifier: Verifier;
    accountProcessor: AccountProcessor;
    modelProcessor: ModelProcessor;
    private signer;
    private contractAddress;
    private ledger;
    constructor(signer: JsonRpcSigner | Wallet, contractAddress: string, ledger: LedgerBroker);
    initialize(): Promise<void>;
    /**
     * Retrieves a list of services from the contract.
     *
     * @param {number} offset - The offset for pagination (default: 0).
     * @param {number} limit - The limit for pagination (default: 50).
     * @param {boolean} includeUnacknowledged - Whether to include providers whose TEE signer is not acknowledged (default: false).
     * @returns {Promise<ServiceStructOutput[]>} A promise that resolves to an array of ServiceStructOutput objects.
     * @throws An error if the service list cannot be retrieved.
     */
    listService: (offset?: number, limit?: number, includeUnacknowledged?: boolean) => Promise<ServiceStructOutput$1[]>;
    /**
     * Retrieves a list of services with detailed health metrics from the monitoring API.
     *
     * This method combines on-chain service data with real-time health metrics including
     * uptime percentage and average response time (latency) for each service provider.
     *
     * @param {number} offset - The offset for pagination (default: 0).
     * @param {number} limit - The limit for pagination (default: 50).
     * @param {boolean} includeUnacknowledged - Whether to include providers whose TEE signer is not acknowledged (default: false).
     * @returns {Promise<ServiceWithDetail[]>} A promise that resolves to an array of ServiceWithDetail objects containing both blockchain and health data.
     * @throws An error if the service list cannot be retrieved.
     *
     * @example
     * ```typescript
     * const servicesWithHealth = await broker.inference.listServiceWithDetail();
     * servicesWithHealth.forEach(service => {
     *   console.log(`Provider: ${service.provider}`);
     *   if (service.healthMetrics) {
     *     console.log(`  Uptime: ${service.healthMetrics.uptime}%`);
     *     console.log(`  Latency: ${service.healthMetrics.avgResponseTime}ms`);
     *   }
     * });
     * ```
     */
    listServiceWithDetail: (offset?: number, limit?: number, includeUnacknowledged?: boolean) => Promise<ServiceWithDetail[]>;
    /**
     * Retrieves the account information for a given provider address.
     *
     * @param {string} providerAddress - The address of the provider identifying the account.
     *
     * @returns A promise that resolves to the account information.
     *
     * @throws Will throw an error if the account retrieval process fails.
     */
    getAccount: (providerAddress: string) => Promise<AccountStructOutput>;
    getAccountWithDetail: (providerAddress: string) => Promise<[AccountStructOutput, {
        amount: bigint;
        remainTime: bigint;
    }[]]>;
    /**
     * checks if the user has acknowledged the provider signer.
     *
     * @param {string} providerAddress - The address of the provider.
     * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the user
     * has acknowledged the provider signer.
     * @throws Will throw an error if the acknowledgment check fails.
     */
    acknowledged: (providerAddress: string) => Promise<boolean>;
    /**
     * Check Provider Signer Status
     *
     * Checks if the provider's TEE signer has been acknowledged by the contract owner.
     * This replaces the old user-level acknowledgement system.
     *
     * @param {string} providerAddress - The address of the provider identifying the account.
     * @param {number} gasPrice - Optional gas price for the transaction.
     * @returns Promise<{isAcknowledged: boolean, teeSignerAddress: string, needsAccount: boolean}>
     *
     * @throws Will throw an error if failed to check status.
     */
    checkProviderSignerStatus: (providerAddress: string, gasPrice?: number) => Promise<{
        isAcknowledged: boolean;
        teeSignerAddress: string;
    }>;
    /**
     * Acknowledge TEE Signer (Contract Owner Only)
     *
     * This function allows the contract owner to acknowledge a provider's TEE signer.
     * The TEE signer address should already be set in the service registration.
     *
     * @param {string} providerAddress - The address of the provider
     * @throws Will throw an error if caller is not the contract owner or if acknowledgement fails.
     */
    acknowledgeProviderTEESigner: (providerAddress: string, gasPrice?: number) => Promise<void>;
    /**
     * Revoke TEE Signer Acknowledgement (Contract Owner Only)
     *
     * This function allows the contract owner to revoke a provider's TEE signer acknowledgement.
     *
     * @param {string} providerAddress - The address of the provider
     * @throws Will throw an error if caller is not the contract owner or if revocation fails.
     */
    revokeProviderTEESignerAcknowledgement: (providerAddress: string, gasPrice?: number) => Promise<void>;
    /**
     * Acknowledge the given provider address.
     *
     * @param {string} providerAddress - The address of the provider identifying the account.
     *
     *
     * @throws Will throw an error if failed to acknowledge.
     */
    acknowledgeProviderSigner: (providerAddress: string, gasPrice?: number) => Promise<void>;
    /**
     * Downloads quote report data from the provider service to a specified file.
     *
     * @param {string} providerAddress - The address of the provider.
     * @param {string} outputPath - The file path where the quote report will be saved.
     *
     * @throws Will throw an error if failed to download the quote report.
     */
    downloadQuoteReport: (providerAddress: string, outputPath: string) => Promise<void>;
    /**
     * Generates request metadata for the provider service.
     * Includes:
     * 1. Request endpoint for the provider service
     * 2. Model information for the provider service
     *
     * @param {string} providerAddress - The address of the provider.
     *
     * @returns { endpoint, model } - Object containing endpoint and model.
     *
     * @throws An error if errors occur during the processing of the request.
     */
    getServiceMetadata: (providerAddress: string) => Promise<{
        endpoint: string;
        model: string;
    }>;
    /**
     * getRequestHeaders generates billing-related headers for the request
     * when the user uses the provider service.
     *
     * In the 0G Serving system, a request with valid billing headers
     * is considered a settlement proof and will be used by the provider
     * for contract settlement.
     *
     * @param {string} providerAddress - The address of the provider.
     * @param {string} content - The content being billed. For example, in a chatbot service, it is the text input by the user.
     *
     * @returns headers. Records information such as the request fee and user signature.
     *
     * @example
     *
     * const { endpoint, model } = await broker.getServiceMetadata(
     *   providerAddress,
     *   serviceName,
     * );
     *
     * const headers = await broker.getServiceMetadata(
     *   providerAddress,
     *   serviceName,
     *   content,
     * );
     *
     * const openai = new OpenAI({
     *   baseURL: endpoint,
     *   apiKey: "",
     * });
     *
     * const completion = await openai.chat.completions.create(
     *   {
     *     messages: [{ role: "system", content }],
     *     model,
     *   },
     *   headers: {
     *     ...headers,
     *   },
     * );
     *
     * @throws An error if errors occur during the processing of the request.
     */
    getRequestHeaders: (providerAddress: string, content?: string) => Promise<ServingRequestHeaders>;
    /**
     * processResponse is used after the user successfully obtains a response from the provider service.
     *
     * It caches the estimated fee based on usage data, which will be used by getRequestHeaders to determine
     * when to top up the sub-account balance. Additionally, if the service is verifiable, input the chat ID
     * from the response and processResponse will determine the validity of the returned content by checking
     * the provider service's response and corresponding signature associated with the chat ID.
     *
     * Note: Fee caching is only useful for long-running SDK instances (e.g., web servers). In CLI usage,
     * the cache is cleared on each invocation, so automatic balance management doesn't apply.
     *
     * @param {string} providerAddress - The address of the provider.
     * @param {string} chatID - Only for verifiable services. The chat session ID returned by the provider
     * in the `ZG-Res-Key` HTTP response header. Extract this header from the provider's response and pass
     * it here for signature verification. For providers that don't include this header, fall back to using
     * the completion ID. Example: `const chatID = response.headers.get('ZG-Res-Key') || completion.id`
     * @param {string} content - Usage data from the response. For chatbot/speech-to-text: JSON string with
     * token usage; For text-to-image: can be empty. This is used to calculate and cache estimated fees.
     *
     * @returns A boolean value. True indicates the returned content is valid, otherwise it is invalid.
     * null if no chatID provided (verification skipped).
     *
     * @throws An error if any issues occur during the processing of the response.
     */
    processResponse: (providerAddress: string, chatID?: string, content?: string) => Promise<boolean | null>;
    /**
     * verifyService is used to verify the reliability of the service.
     *
     * @param {string} providerAddress - The address of the provider.
     *
     * @returns A <boolean | null> value. True indicates the service is reliable, otherwise it is unreliable.
     *
     * @throws An error if errors occur during the verification process.
     */
    verifyService: (providerAddress: string, outputDir?: string) => Promise<VerificationResult$1 | null>;
    /**
     * getSignerRaDownloadLink returns the download link for the Signer RA.
     *
     * It can be provided to users who wish to manually verify the Signer RA.
     *
     * @param {string} providerAddress - provider address.
     *
     * @returns Download link.
     */
    getSignerRaDownloadLink: (providerAddress: string) => Promise<string>;
    /**
     * getChatSignatureDownloadLink returns the download link for the signature of a single chat.
     *
     * It can be provided to users who wish to manually verify the content of a single chat.
     *
     * @param {string} providerAddress - provider address.
     * @param {string} chatID - ID of the chat.
     *
     * @remarks To verify the chat signature, use the following code:
     *
     * ```typescript
     * const messageHash = ethers.hashMessage(messageToBeVerified)
     * const recoveredAddress = ethers.recoverAddress(messageHash, signature)
     * const isValid = recoveredAddress.toLowerCase() === signingAddress.toLowerCase()
     * ```
     *
     * @returns Download link.
     */
    getChatSignatureDownloadLink: (providerAddress: string, chatID: string) => Promise<string>;
    /**
     * Remove service (Provider owner only)
     *
     * This function allows the provider owner to remove their service from the contract.
     * Only the provider who registered the service can remove it.
     *
     * @param {number} gasPrice - Optional gas price for the transaction.
     * @throws Will throw an error if the caller is not the service owner or if removal fails.
     */
    removeService: (gasPrice?: number) => Promise<void>;
    /**
     * Update service (Provider owner only)
     *
     * This function allows the provider owner to update their existing service.
     * All parameters are optional - if not provided, the current value is preserved.
     *
     * @param options - Update options
     * @param options.url - New service URL
     * @param options.model - New model name
     * @param options.inputPrice - New input price (in neuron, the smallest unit)
     * @param options.outputPrice - New output price (in neuron, the smallest unit)
     * @param options.gasPrice - Optional gas price for the transaction
     * @throws Will throw an error if the caller is not the service owner or if update fails.
     */
    updateService: (options: {
        url?: string;
        model?: string;
        inputPrice?: bigint;
        outputPrice?: bigint;
        gasPrice?: number;
    }) => Promise<void>;
    /**
     * Revoke a specific API key (persistent token) by its tokenId.
     *
     * Sets the corresponding bit in the revokedBitmap for this tokenId.
     * The API key will be immediately invalid, but the tokenId slot remains occupied
     * until revokeAllTokens() is called.
     *
     * Note: Ephemeral tokens (tokenId=255) cannot be individually revoked.
     * Use revokeAllTokens() to revoke ephemeral tokens.
     *
     * @param {string} providerAddress - The provider address
     * @param {number} tokenId - Token ID to revoke (0-254)
     * @param {number} gasPrice - Optional gas price for the transaction
     *
     * @throws Will throw an error if tokenId is 255 (ephemeral token) or if revocation fails.
     *
     * @example
     * ```typescript
     * // Revoke token ID 5 for a provider
     * await broker.inference.revokeApiKey('0x123...', 5)
     * // Token ID 5 is now revoked and the API key is invalid
     * ```
     */
    revokeApiKey: (providerAddress: string, tokenId: number, gasPrice?: number) => Promise<void>;
    /**
     * Revoke all API keys (both ephemeral and persistent tokens) for a provider.
     *
     * Increments the generation counter and resets the revokedBitmap.
     * All existing API keys (including ephemeral tokens) will be immediately invalid.
     * Reclaims all 255 tokenId slots for reuse.
     *
     * @param {string} providerAddress - The provider address
     * @param {number} gasPrice - Optional gas price for the transaction
     *
     * @throws Will throw an error if revocation fails.
     *
     * @example
     * ```typescript
     * // Revoke all tokens for a provider
     * await broker.inference.revokeAllTokens('0x123...')
     * // All API keys for this provider are now invalid
     * // All 255 tokenId slots are now available for reuse
     * ```
     */
    revokeAllTokens: (providerAddress: string, gasPrice?: number) => Promise<void>;
}
/**
 * createInferenceBroker is used to initialize ZGServingUserBroker
 *
 * @param signer - Signer from ethers.js.
 * @param contractAddress - 0G Serving contract address, use default address if not provided.
 *
 * @returns broker instance.
 *
 * @throws An error if the broker cannot be initialized.
 */
declare function createInferenceBroker(signer: JsonRpcSigner | Wallet, contractAddress: string, ledger: LedgerBroker): Promise<InferenceBroker>;

interface Task {
    readonly id?: string;
    readonly createdAt?: string;
    readonly updatedAt?: string;
    userAddress: string;
    preTrainedModelHash: string;
    datasetHash: string;
    trainingParams: string;
    fee: string;
    nonce: string;
    signature: string;
    readonly progress?: string;
    readonly deliverIndex?: string;
    wait?: boolean;
}

interface FineTuningAccountDetail {
    account: AccountDetailsStructOutput;
    refunds: {
        amount: bigint;
        remainTime: bigint;
    }[];
}

interface AttestationReport {
    tcb_info?: Record<string, unknown>;
    info?: {
        tcb_info?: Record<string, unknown>;
    };
    event_log?: EventLogEntry[];
    report_data?: string;
    [key: string]: unknown;
}
interface EventLogEntry {
    event: string;
    event_payload?: string;
    [key: string]: unknown;
}
interface VerificationResult {
    success: boolean;
    teeVerifier: string;
    reportsGenerated: string[];
    outputDirectory: string;
    reportsData?: {
        combined?: AttestationReport;
    };
}

declare class FineTuningBroker {
    private signer;
    private fineTuningCA;
    private ledger;
    private modelProcessor;
    private datasetProcessor;
    private serviceProcessor;
    private verifier;
    private serviceProvider;
    private _gasPrice?;
    private _maxGasPrice?;
    private _step?;
    constructor(signer: Wallet, fineTuningCA: string, ledger: LedgerBroker, gasPrice?: number, maxGasPrice?: number, step?: number);
    initialize(): Promise<void>;
    listService: () => Promise<ServiceStructOutput[]>;
    getLockedTime: () => Promise<bigint>;
    getAccount: (providerAddress: string) => Promise<AccountDetailsStructOutput>;
    getAccountWithDetail: (providerAddress: string) => Promise<FineTuningAccountDetail>;
    acknowledgeProviderSigner: (providerAddress: string, gasPrice?: number) => Promise<void>;
    acknowledgeTEESignerByOwner: (providerAddress: string, gasPrice?: number) => Promise<void>;
    revokeTEESignerAcknowledgement: (providerAddress: string, gasPrice?: number) => Promise<void>;
    removeService: (gasPrice?: number) => Promise<void>;
    listModel: () => Promise<[string, {
        [key: string]: string;
    }][][]>;
    modelUsage: (providerAddress: string, preTrainedModelName: string, output: string) => Promise<void>;
    uploadDataset: (dataPath: string, gasPrice?: number, maxGasPrice?: number) => Promise<void>;
    downloadDataset: (dataPath: string, dataRoot: string) => Promise<void>;
    calculateToken: (datasetPath: string, preTrainedModelName: string, usePython: boolean, providerAddress?: string) => Promise<void>;
    createTask: (providerAddress: string, preTrainedModelName: string, datasetHash: string, trainingPath: string, gasPrice?: number) => Promise<string>;
    cancelTask: (providerAddress: string, taskID: string) => Promise<string>;
    listTask: (providerAddress: string) => Promise<Task[]>;
    getTask: (providerAddress: string, taskID?: string) => Promise<Task>;
    getLog: (providerAddress: string, taskID?: string) => Promise<string>;
    acknowledgeModel: (providerAddress: string, taskId: string, dataPath: string, options?: {
        gasPrice?: number;
        downloadMethod?: "tee" | "0g-storage";
    }) => Promise<void>;
    /**
     * Download LoRA model directly from TEE
     */
    downloadLoRAFromTEE: (providerAddress: string, taskId: string, outputPath: string) => Promise<void>;
    /**
     * Upload dataset directly to TEE (broker)
     * Returns the dataset hash for use in task creation
     * This is the preferred method for testing
     */
    uploadDatasetToTEE: (providerAddress: string, datasetPath: string) => Promise<{
        datasetHash: string;
        message: string;
    }>;
    /**
     * Download encrypted model from 0G Storage (for advanced use cases)
     */
    downloadModelFrom0GStorage: (providerAddress: string, taskId: string, dataPath: string) => Promise<void>;
    decryptModel: (providerAddress: string, taskId: string, encryptedModelPath: string, decryptedModelPath: string) => Promise<void>;
    /**
     * Verify fine-tuning service TEE attestation (DStack only)
     *
     * Downloads and verifies the TEE attestation report to ensure the provider
     * is running in a trusted execution environment. This simplified version
     * only supports DStack (Intel TDX) verification.
     *
     * @param providerAddress - The provider address to verify
     * @param outputDir - Directory to save attestation reports (default: current directory)
     * @returns Promise resolving to verification results with report paths and status
     *
     * @example
     * ```typescript
     * const broker = await createFineTuningBroker(signer, contractAddress, ledger);
     *
     * // Verify a provider's TEE attestation
     * const result = await broker.verifyService(
     *   '0x1234...',
     *   './attestation-reports'
     * );
     *
     * if (result.success && result.reportsData) {
     *   console.log('Verification successful');
     *   console.log('Reports saved to:', result.outputDirectory);
     * }
     * ```
     *
     * @remarks
     * This method downloads the attestation report and performs automated checks:
     * 1. TEE Signer Address Verification - matches contract signer with report signer
     * 2. Docker Compose Verification - validates compose hash against event log
     *
     * After automated checks, users must manually verify:
     * 1. Docker images using sigstore (https://search.sigstore.dev/)
     * 2. Run dstack-verifier for complete quote verification
     *
     * @throws {Error} If provider doesn't exist or attestation report cannot be retrieved
     */
    verifyService: (providerAddress: string, outputDir?: string) => Promise<VerificationResult>;
}
/**
 * createFineTuningBroker is used to initialize ZGServingUserBroker
 *
 * @param signer - Signer from ethers.js.
 * @param contractAddress - 0G Serving contract address, use default address if not provided.
 * @param ledger - Ledger broker instance.
 * @param gasPrice - Gas price for transactions. If not provided, the gas price will be calculated automatically.
 *
 * @returns broker instance.
 *
 * @throws An error if the broker cannot be initialized.
 */
declare function createFineTuningBroker(signer: Wallet, contractAddress: string, ledger: LedgerBroker, gasPrice?: number, maxGasPrice?: number, step?: number): Promise<FineTuningBroker>;

declare const TESTNET_CHAIN_ID = 16602n;
declare const MAINNET_CHAIN_ID = 16661n;
declare const HARDHAT_CHAIN_ID = 31337n;
declare const CONTRACT_ADDRESSES: {
    readonly testnet: {
        readonly ledger: "0xE70830508dAc0A97e6c087c75f402f9Be669E406";
        readonly inference: "0xa79F4c8311FF93C06b8CfB403690cc987c93F91E";
        readonly fineTuning: "0xaC66eBd174435c04F1449BBa08157a707B6fa7b1";
    };
    readonly testnetDev: {
        readonly ledger: "0x815B93ab4Ba4BDF530dbF1552649a3c534F8BbF7";
        readonly inference: "0x41bD7Ac5c19000A974D5c192bcd5FB67b56C85c5";
        readonly fineTuning: "0x4e4158DF35CfdC0ac63264D3E112F5B8E9a5c569";
    };
    readonly mainnet: {
        readonly ledger: "0x2dE54c845Cd948B72D2e32e39586fe89607074E3";
        readonly inference: "0x47340d900bdFec2BD393c626E12ea0656F938d84";
        readonly fineTuning: "0x0000000000000000000000000000000000000000";
    };
    readonly hardhat: {
        readonly ledger: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
        readonly inference: "0x0165878A594ca255338adfa4d48449f69242Eb8F";
        readonly fineTuning: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";
    };
};
/**
 * Check if dev mode is enabled
 * Supports multiple ways to enable dev mode:
 * - Node.js: ZG_DEV_MODE environment variable
 * - Next.js: NEXT_PUBLIC_ZG_DEV_MODE environment variable (build-time)
 * - Browser: localStorage 'ZG_DEV_MODE' = 'true'
 * - Browser: URL parameter ?dev=true or ?ZG_DEV_MODE=true
 */
declare function isDevMode(): boolean;
/**
 * Helper function to determine network type from chain ID
 */
declare function getNetworkType(chainId: bigint): 'mainnet' | 'testnet' | 'hardhat' | 'unknown';
declare class ZGComputeNetworkBroker {
    ledger: LedgerBroker;
    inference: InferenceBroker;
    fineTuning?: FineTuningBroker;
    constructor(ledger: LedgerBroker, inferenceBroker: InferenceBroker, fineTuningBroker?: FineTuningBroker);
}
/**
 * createZGComputeNetworkBroker is used to initialize ZGComputeNetworkBroker
 *
 * This function automatically detects the network from the signer's provider and uses
 * appropriate contract addresses. You can override any address by providing it explicitly.
 *
 * @param signer - Signer from ethers.js.
 * @param ledgerCA - 0G Compute Network Ledger Contact address, auto-detected if not provided.
 * @param inferenceCA - 0G Compute Network Inference Serving contract address, auto-detected if not provided.
 * @param fineTuningCA - 0G Compute Network Fine Tuning Serving contract address, auto-detected if not provided.
 * @param gasPrice - Gas price for transactions. If not provided, the gas price will be calculated automatically.
 * @param maxGasPrice - Maximum gas price for transactions.
 * @param step - Step for gas price adjustment.
 *
 * @returns broker instance.
 *
 * @throws An error if the broker cannot be initialized.
 */
declare function createZGComputeNetworkBroker(signer: JsonRpcSigner | Wallet, ledgerCA?: string, inferenceCA?: string, fineTuningCA?: string, gasPrice?: number, maxGasPrice?: number, step?: number): Promise<ZGComputeNetworkBroker>;

/**
 * Environment detection utility
 * Helps distinguish between Node.js and browser environments
 */
declare const isBrowser: () => boolean;
declare const isNode: () => boolean;
declare const isWebWorker: () => boolean;
declare const hasWebCrypto: () => boolean;

/**
 * Crypto adapter that provides unified encryption/decryption interface
 * for both Node.js and browser environments
 */
interface CryptoAdapter {
    aesGCMEncrypt(key: Buffer, data: Buffer, iv: Buffer): Promise<{
        encrypted: Buffer;
        authTag: Buffer;
    }>;
    aesGCMDecrypt(key: Buffer, encryptedData: Buffer, iv: Buffer, authTag: Buffer): Promise<Buffer>;
    randomBytes(length: number): Buffer;
}
declare function getCryptoAdapter(): CryptoAdapter;

export { CONTRACT_ADDRESSES, type CryptoAdapter, FineTuningBroker, type ServiceStructOutput as FineTuningServiceStructOutput, HARDHAT_CHAIN_ID, AccountProcessor as InferenceAccountProcessor, type AccountStructOutput as InferenceAccountStructOutput, InferenceBroker, ModelProcessor as InferenceModelProcessor, RequestProcessor as InferenceRequestProcessor, ResponseProcessor as InferenceResponseProcessor, type ServiceStructOutput$1 as InferenceServiceStructOutput, type ServingRequestHeaders as InferenceServingRequestHeaders, type SingerRAVerificationResult as InferenceSingerRAVerificationResult, Verifier as InferenceVerifier, LedgerBroker, MAINNET_CHAIN_ID, TESTNET_CHAIN_ID, ZGComputeNetworkBroker, createFineTuningBroker, createInferenceBroker, createLedgerBroker, createZGComputeNetworkBroker, getCryptoAdapter, getNetworkType, hasWebCrypto, isBrowser, isDevMode, isNode, isWebWorker };
