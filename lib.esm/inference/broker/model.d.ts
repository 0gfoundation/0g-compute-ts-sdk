import type { ServiceStructOutput } from '../contract';
import { ZGServingUserBrokerBase } from './base';
export declare enum VerifiabilityEnum {
    OpML = "OpML",
    TeeML = "TeeML",
    ZKML = "ZKML"
}
export type Verifiability = VerifiabilityEnum.OpML | VerifiabilityEnum.TeeML | VerifiabilityEnum.ZKML;
export declare class ModelProcessor extends ZGServingUserBrokerBase {
    listService(offset?: number, limit?: number): Promise<ServiceStructOutput[]>;
}
export declare function isVerifiability(value: string): value is Verifiability;
//# sourceMappingURL=model.d.ts.map