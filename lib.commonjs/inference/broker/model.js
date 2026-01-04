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
    async listService(offset = 0, limit = 50, includeUnacknowledged = false) {
        try {
            const services = await this.contract.listService(offset, limit, includeUnacknowledged);
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
    async updateService(options) {
        try {
            // Get current service to preserve unchanged fields
            const userAddress = this.contract.getUserAddress();
            const currentService = await this.contract.getService(userAddress);
            if (!currentService || !currentService.provider) {
                throw new Error('Service not found for the current provider');
            }
            // Build ServiceParams with updated values (use new value if provided, otherwise keep current)
            const params = {
                serviceType: currentService.serviceType,
                url: options.url ?? currentService.url,
                model: options.model ?? currentService.model,
                verifiability: currentService.verifiability,
                inputPrice: options.inputPrice ?? currentService.inputPrice,
                outputPrice: options.outputPrice ?? currentService.outputPrice,
                additionalInfo: currentService.additionalInfo,
                teeSignerAddress: currentService.teeSignerAddress,
            };
            const txOptions = {};
            if (options.gasPrice) {
                txOptions.gasPrice = options.gasPrice;
            }
            await this.contract.sendTx('addOrUpdateService', [params], txOptions);
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