"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelProcessor = exports.VerifiabilityEnum = void 0;
exports.isVerifiability = isVerifiability;
const tslib_1 = require("tslib");
const base_1 = require("./base");
const utils_1 = require("../../common/utils");
const axios_1 = tslib_1.__importDefault(require("axios"));
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
     * Retrieves a list of services with detailed health metrics from the monitoring API.
     *
     * @param {number} offset - The offset for pagination (default: 0).
     * @param {number} limit - The limit for pagination (default: 50).
     * @param {boolean} includeUnacknowledged - Whether to include providers whose TEE signer is not acknowledged (default: false).
     * @returns {Promise<ServiceWithDetail[]>} A promise that resolves to an array of ServiceWithDetail objects containing both blockchain and health data.
     * @throws An error if the service list cannot be retrieved or health API is unreachable.
     */
    async listServiceWithDetail(offset = 0, limit = 50, includeUnacknowledged = false) {
        try {
            // Get services from blockchain
            const services = await this.listService(offset, limit, includeUnacknowledged);
            // Determine health API endpoint based on chain ID
            const chainId = await this.contract.signer.provider
                ?.getNetwork()
                .then((n) => n.chainId);
            const healthApiEndpoint = this.getHealthApiEndpoint(chainId);
            // Fetch health metrics from API
            let healthMetrics = [];
            try {
                const response = await axios_1.default.get(`${healthApiEndpoint}/health`, {
                    timeout: 10000, // 10 second timeout
                });
                healthMetrics = response.data.services || [];
            }
            catch (error) {
                // Continue without health metrics
            }
            // Create a map of health metrics by provider address
            const healthMap = new Map();
            for (const metric of healthMetrics) {
                healthMap.set(metric.provider.toLowerCase(), metric);
            }
            // Merge health metrics with services
            // Note: Cannot use spread operator on ethers Result objects as it loses named properties
            const servicesWithDetail = services.map((service) => {
                const health = healthMap.get(service.provider.toLowerCase());
                return {
                    provider: service.provider,
                    serviceType: service.serviceType,
                    url: service.url,
                    inputPrice: service.inputPrice,
                    outputPrice: service.outputPrice,
                    updatedAt: service.updatedAt,
                    model: service.model,
                    verifiability: service.verifiability,
                    additionalInfo: service.additionalInfo,
                    teeSignerAddress: service.teeSignerAddress,
                    teeSignerAcknowledged: service.teeSignerAcknowledged,
                    healthMetrics: health
                        ? {
                            status: health.status,
                            uptime: health.checks.uptime,
                            avgResponseTime: health.performance.response_time?.avg ?? 0,
                            lastCheck: health.lastCheck,
                        }
                        : undefined,
                };
            });
            return servicesWithDetail;
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    /**
     * Get health API endpoint based on chain ID
     * @param chainId - The chain ID
     * @returns The health API endpoint URL
     */
    getHealthApiEndpoint(chainId) {
        // Mainnet: 16661n, Testnet: 16602n
        if (chainId === 16661n) {
            return 'https://compute-status.0g.ai';
        }
        else {
            // Default to testnet
            return 'https://compute-status-testnet.0g.ai';
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