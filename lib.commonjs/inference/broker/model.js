"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelProcessor = exports.VerifiabilityEnum = void 0;
exports.isVerifiability = isVerifiability;
const base_1 = require("./base");
const utils_1 = require("../../common/utils");
var VerifiabilityEnum;
(function (VerifiabilityEnum) {
    VerifiabilityEnum["OpML"] = "OpML";
    VerifiabilityEnum["TeeML"] = "TeeML";
    VerifiabilityEnum["ZKML"] = "ZKML";
})(VerifiabilityEnum || (exports.VerifiabilityEnum = VerifiabilityEnum = {}));
class ModelProcessor extends base_1.ZGServingUserBrokerBase {
    async listService(offset = 0, limit = 50) {
        try {
            const services = await this.contract.listService(offset, limit);
            return services;
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    /**
     * Remove service (Provider owner only)
     *
     * This function allows the provider owner to remove their service from the contract.
     *
     * @param {number} gasPrice - Optional gas price for the transaction.
     * @throws Will throw an error if the caller is not the service owner or if removal fails.
     */
    async removeService(gasPrice) {
        try {
            const txOptions = {};
            if (gasPrice) {
                txOptions.gasPrice = gasPrice;
            }
            await this.contract.sendTx('removeService', [], txOptions);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
}
exports.ModelProcessor = ModelProcessor;
function isVerifiability(value) {
    return Object.values(VerifiabilityEnum).includes(value);
}
//# sourceMappingURL=model.js.map