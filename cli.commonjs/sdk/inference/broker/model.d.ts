import type { ServiceStructOutput } from '../contract';
import { ZGServingUserBrokerBase } from './base';
export declare enum VerifiabilityEnum {
    OpML = "OpML",
    TeeML = "TeeML",
    ZKML = "ZKML"
}
export type Verifiability = VerifiabilityEnum.OpML | VerifiabilityEnum.TeeML | VerifiabilityEnum.ZKML;
export declare class ModelProcessor extends ZGServingUserBrokerBase {
    listService(offset?: number, limit?: number, includeUnacknowledged?: boolean): Promise<ServiceStructOutput[]>;
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
export declare function isVerifiability(value: string): value is Verifiability;
//# sourceMappingURL=model.d.ts.map