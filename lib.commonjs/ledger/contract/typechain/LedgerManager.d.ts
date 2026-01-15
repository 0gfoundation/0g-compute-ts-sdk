import type { BaseContract, BigNumberish, BytesLike, FunctionFragment, Result, Interface, EventFragment, AddressLike, ContractRunner, ContractMethod, Listener } from 'ethers';
import type { TypedContractEvent, TypedDeferredTopicFilter, TypedEventLog, TypedLogDescription, TypedListener, TypedContractMethod } from './common.js';
export type ServiceInfoStruct = {
    serviceAddress: AddressLike;
    serviceContract: AddressLike;
    serviceType: string;
    version: string;
    fullName: string;
    description: string;
    isRecommended: boolean;
    registeredAt: BigNumberish;
};
export type ServiceInfoStructOutput = [
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
export type LedgerStruct = {
    user: AddressLike;
    availableBalance: BigNumberish;
    totalBalance: BigNumberish;
    additionalInfo: string;
};
export type LedgerStructOutput = [
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
export interface LedgerManagerInterface extends Interface {
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
export declare namespace FundSpentEvent {
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
export declare namespace LedgerInfoUpdatedEvent {
    type InputTuple = [user: AddressLike, additionalInfo: string];
    type OutputTuple = [user: string, additionalInfo: string];
    interface OutputObject {
        user: string;
        additionalInfo: string;
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
export declare namespace RecommendedServiceUpdatedEvent {
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
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace ServiceRegisteredEvent {
    type InputTuple = [serviceAddress: AddressLike, serviceName: string];
    type OutputTuple = [serviceAddress: string, serviceName: string];
    interface OutputObject {
        serviceAddress: string;
        serviceName: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export interface LedgerManager extends BaseContract {
    connect(runner?: ContractRunner | null): LedgerManager;
    waitForDeployment(): Promise<this>;
    interface: LedgerManagerInterface;
    queryFilter<TCEvent extends TypedContractEvent>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    queryFilter<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    listeners<TCEvent extends TypedContractEvent>(event: TCEvent): Promise<Array<TypedListener<TCEvent>>>;
    listeners(eventName?: string): Promise<Array<Listener>>;
    removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
    MAX_ADDITIONAL_INFO_LENGTH: TypedContractMethod<[], [bigint], 'view'>;
    MAX_PROVIDERS_PER_BATCH: TypedContractMethod<[], [bigint], 'view'>;
    MAX_PROVIDERS_PER_USER_PER_SERVICE: TypedContractMethod<[
    ], [
        bigint
    ], 'view'>;
    MAX_SERVICES: TypedContractMethod<[], [bigint], 'view'>;
    MIN_ACCOUNT_BALANCE: TypedContractMethod<[], [bigint], 'view'>;
    MIN_TRANSFER_AMOUNT: TypedContractMethod<[], [bigint], 'view'>;
    addLedger: TypedContractMethod<[
        additionalInfo: string
    ], [
        [bigint, bigint]
    ], 'payable'>;
    deleteLedger: TypedContractMethod<[], [void], 'nonpayable'>;
    depositFund: TypedContractMethod<[], [void], 'payable'>;
    depositFundFor: TypedContractMethod<[
        recipient: AddressLike
    ], [
        void
    ], 'payable'>;
    getAllActiveServices: TypedContractMethod<[
    ], [
        ServiceInfoStructOutput[]
    ], 'view'>;
    getAllLedgers: TypedContractMethod<[
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
    getAllVersions: TypedContractMethod<[
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
    getLedger: TypedContractMethod<[
        user: AddressLike
    ], [
        LedgerStructOutput
    ], 'view'>;
    getLedgerProviders: TypedContractMethod<[
        user: AddressLike,
        serviceName: string
    ], [
        string[]
    ], 'view'>;
    getRecommendedService: TypedContractMethod<[
        serviceType: string
    ], [
        [string, string] & {
            version: string;
            serviceAddress: string;
        }
    ], 'view'>;
    getServiceAddressByName: TypedContractMethod<[
        serviceName: string
    ], [
        string
    ], 'view'>;
    getServiceInfo: TypedContractMethod<[
        serviceAddress: AddressLike
    ], [
        ServiceInfoStructOutput
    ], 'view'>;
    initialize: TypedContractMethod<[owner: AddressLike], [void], 'nonpayable'>;
    initialized: TypedContractMethod<[], [boolean], 'view'>;
    isRecommendedVersion: TypedContractMethod<[
        serviceType: string,
        version: string
    ], [
        boolean
    ], 'view'>;
    owner: TypedContractMethod<[], [string], 'view'>;
    refund: TypedContractMethod<[amount: BigNumberish], [void], 'nonpayable'>;
    registerService: TypedContractMethod<[
        serviceType: string,
        version: string,
        serviceAddress: AddressLike,
        description: string
    ], [
        void
    ], 'nonpayable'>;
    renounceOwnership: TypedContractMethod<[], [void], 'nonpayable'>;
    retrieveFund: TypedContractMethod<[
        providers: AddressLike[],
        serviceName: string
    ], [
        void
    ], 'nonpayable'>;
    setRecommendedService: TypedContractMethod<[
        serviceType: string,
        version: string
    ], [
        void
    ], 'nonpayable'>;
    spendFund: TypedContractMethod<[
        user: AddressLike,
        amount: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    transferFund: TypedContractMethod<[
        provider: AddressLike,
        serviceName: string,
        amount: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    transferOwnership: TypedContractMethod<[
        newOwner: AddressLike
    ], [
        void
    ], 'nonpayable'>;
    updateAdditionalInfo: TypedContractMethod<[
        additionalInfo: string
    ], [
        void
    ], 'nonpayable'>;
    getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
    getFunction(nameOrSignature: 'MAX_ADDITIONAL_INFO_LENGTH'): TypedContractMethod<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'MAX_PROVIDERS_PER_BATCH'): TypedContractMethod<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'MAX_PROVIDERS_PER_USER_PER_SERVICE'): TypedContractMethod<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'MAX_SERVICES'): TypedContractMethod<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'MIN_ACCOUNT_BALANCE'): TypedContractMethod<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'MIN_TRANSFER_AMOUNT'): TypedContractMethod<[], [bigint], 'view'>;
    getFunction(nameOrSignature: 'addLedger'): TypedContractMethod<[
        additionalInfo: string
    ], [
        [bigint, bigint]
    ], 'payable'>;
    getFunction(nameOrSignature: 'deleteLedger'): TypedContractMethod<[], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'depositFund'): TypedContractMethod<[], [void], 'payable'>;
    getFunction(nameOrSignature: 'depositFundFor'): TypedContractMethod<[recipient: AddressLike], [void], 'payable'>;
    getFunction(nameOrSignature: 'getAllActiveServices'): TypedContractMethod<[], [ServiceInfoStructOutput[]], 'view'>;
    getFunction(nameOrSignature: 'getAllLedgers'): TypedContractMethod<[
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
    getFunction(nameOrSignature: 'getAllVersions'): TypedContractMethod<[
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
    getFunction(nameOrSignature: 'getLedger'): TypedContractMethod<[user: AddressLike], [LedgerStructOutput], 'view'>;
    getFunction(nameOrSignature: 'getLedgerProviders'): TypedContractMethod<[
        user: AddressLike,
        serviceName: string
    ], [
        string[]
    ], 'view'>;
    getFunction(nameOrSignature: 'getRecommendedService'): TypedContractMethod<[
        serviceType: string
    ], [
        [string, string] & {
            version: string;
            serviceAddress: string;
        }
    ], 'view'>;
    getFunction(nameOrSignature: 'getServiceAddressByName'): TypedContractMethod<[serviceName: string], [string], 'view'>;
    getFunction(nameOrSignature: 'getServiceInfo'): TypedContractMethod<[
        serviceAddress: AddressLike
    ], [
        ServiceInfoStructOutput
    ], 'view'>;
    getFunction(nameOrSignature: 'initialize'): TypedContractMethod<[owner: AddressLike], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'initialized'): TypedContractMethod<[], [boolean], 'view'>;
    getFunction(nameOrSignature: 'isRecommendedVersion'): TypedContractMethod<[
        serviceType: string,
        version: string
    ], [
        boolean
    ], 'view'>;
    getFunction(nameOrSignature: 'owner'): TypedContractMethod<[], [string], 'view'>;
    getFunction(nameOrSignature: 'refund'): TypedContractMethod<[amount: BigNumberish], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'registerService'): TypedContractMethod<[
        serviceType: string,
        version: string,
        serviceAddress: AddressLike,
        description: string
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'renounceOwnership'): TypedContractMethod<[], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'retrieveFund'): TypedContractMethod<[
        providers: AddressLike[],
        serviceName: string
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'setRecommendedService'): TypedContractMethod<[
        serviceType: string,
        version: string
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'spendFund'): TypedContractMethod<[
        user: AddressLike,
        amount: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'transferFund'): TypedContractMethod<[
        provider: AddressLike,
        serviceName: string,
        amount: BigNumberish
    ], [
        void
    ], 'nonpayable'>;
    getFunction(nameOrSignature: 'transferOwnership'): TypedContractMethod<[newOwner: AddressLike], [void], 'nonpayable'>;
    getFunction(nameOrSignature: 'updateAdditionalInfo'): TypedContractMethod<[additionalInfo: string], [void], 'nonpayable'>;
    getEvent(key: 'FundSpent'): TypedContractEvent<FundSpentEvent.InputTuple, FundSpentEvent.OutputTuple, FundSpentEvent.OutputObject>;
    getEvent(key: 'Initialized'): TypedContractEvent<InitializedEvent.InputTuple, InitializedEvent.OutputTuple, InitializedEvent.OutputObject>;
    getEvent(key: 'LedgerInfoUpdated'): TypedContractEvent<LedgerInfoUpdatedEvent.InputTuple, LedgerInfoUpdatedEvent.OutputTuple, LedgerInfoUpdatedEvent.OutputObject>;
    getEvent(key: 'OwnershipTransferred'): TypedContractEvent<OwnershipTransferredEvent.InputTuple, OwnershipTransferredEvent.OutputTuple, OwnershipTransferredEvent.OutputObject>;
    getEvent(key: 'RecommendedServiceUpdated'): TypedContractEvent<RecommendedServiceUpdatedEvent.InputTuple, RecommendedServiceUpdatedEvent.OutputTuple, RecommendedServiceUpdatedEvent.OutputObject>;
    getEvent(key: 'ServiceRegistered'): TypedContractEvent<ServiceRegisteredEvent.InputTuple, ServiceRegisteredEvent.OutputTuple, ServiceRegisteredEvent.OutputObject>;
    filters: {
        'FundSpent(address,address,uint256)': TypedContractEvent<FundSpentEvent.InputTuple, FundSpentEvent.OutputTuple, FundSpentEvent.OutputObject>;
        FundSpent: TypedContractEvent<FundSpentEvent.InputTuple, FundSpentEvent.OutputTuple, FundSpentEvent.OutputObject>;
        'Initialized(uint8)': TypedContractEvent<InitializedEvent.InputTuple, InitializedEvent.OutputTuple, InitializedEvent.OutputObject>;
        Initialized: TypedContractEvent<InitializedEvent.InputTuple, InitializedEvent.OutputTuple, InitializedEvent.OutputObject>;
        'LedgerInfoUpdated(address,string)': TypedContractEvent<LedgerInfoUpdatedEvent.InputTuple, LedgerInfoUpdatedEvent.OutputTuple, LedgerInfoUpdatedEvent.OutputObject>;
        LedgerInfoUpdated: TypedContractEvent<LedgerInfoUpdatedEvent.InputTuple, LedgerInfoUpdatedEvent.OutputTuple, LedgerInfoUpdatedEvent.OutputObject>;
        'OwnershipTransferred(address,address)': TypedContractEvent<OwnershipTransferredEvent.InputTuple, OwnershipTransferredEvent.OutputTuple, OwnershipTransferredEvent.OutputObject>;
        OwnershipTransferred: TypedContractEvent<OwnershipTransferredEvent.InputTuple, OwnershipTransferredEvent.OutputTuple, OwnershipTransferredEvent.OutputObject>;
        'RecommendedServiceUpdated(string,string,address)': TypedContractEvent<RecommendedServiceUpdatedEvent.InputTuple, RecommendedServiceUpdatedEvent.OutputTuple, RecommendedServiceUpdatedEvent.OutputObject>;
        RecommendedServiceUpdated: TypedContractEvent<RecommendedServiceUpdatedEvent.InputTuple, RecommendedServiceUpdatedEvent.OutputTuple, RecommendedServiceUpdatedEvent.OutputObject>;
        'ServiceRegistered(address,string)': TypedContractEvent<ServiceRegisteredEvent.InputTuple, ServiceRegisteredEvent.OutputTuple, ServiceRegisteredEvent.OutputObject>;
        ServiceRegistered: TypedContractEvent<ServiceRegisteredEvent.InputTuple, ServiceRegisteredEvent.OutputTuple, ServiceRegisteredEvent.OutputObject>;
    };
}
//# sourceMappingURL=LedgerManager.d.ts.map