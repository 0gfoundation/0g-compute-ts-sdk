"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = void 0;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const fs = tslib_1.__importStar(require("fs/promises"));
const path = tslib_1.__importStar(require("path"));
const utils_1 = require("../../common/utils");
class Provider {
    contract;
    constructor(contract) {
        this.contract = contract;
    }
    async fetchJSON(endpoint, options) {
        try {
            const response = await fetch(endpoint, options);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error);
            }
            return response.json();
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async fetchText(endpoint, options) {
        try {
            const response = await fetch(endpoint, options);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const buffer = await response.arrayBuffer();
            return Buffer.from(buffer).toString('utf-8');
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async getProviderUrl(providerAddress) {
        try {
            const service = await this.contract.getService(providerAddress);
            return service.url;
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async getQuote(providerAddress) {
        try {
            const url = await this.getProviderUrl(providerAddress);
            const endpoint = `${url}/v1/quote`;
            const rawReport = await this.fetchText(endpoint, {
                method: 'GET',
            });
            const ret = JSON.parse(rawReport);
            return {
                rawReport,
                signingAddress: ret['report_data'],
            };
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async createTask(providerAddress, task) {
        try {
            const url = await this.getProviderUrl(providerAddress);
            const userAddress = this.contract.getUserAddress();
            const endpoint = `${url}/v1/user/${userAddress}/task`;
            const response = await this.fetchJSON(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(task),
            });
            return response.id;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create task: ${error.message}`);
            }
            throw new Error('Failed to create task');
        }
    }
    async cancelTask(providerAddress, signature, taskID) {
        try {
            const url = await this.getProviderUrl(providerAddress);
            const userAddress = this.contract.getUserAddress();
            const endpoint = `${url}/v1/user/${userAddress}/task/${taskID}/cancel`;
            const response = await this.fetchText(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    signature: signature,
                }),
            });
            return response;
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async getTask(providerAddress, userAddress, taskID) {
        try {
            const url = await this.getProviderUrl(providerAddress);
            const endpoint = `${url}/v1/user/${encodeURIComponent(userAddress)}/task/${taskID}`;
            console.log('url', url);
            console.log('endpoint', endpoint);
            return this.fetchJSON(endpoint, { method: 'GET' });
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async listTask(providerAddress, userAddress, latest = false) {
        try {
            const url = await this.getProviderUrl(providerAddress);
            let endpoint = `${url}/v1/user/${encodeURIComponent(userAddress)}/task`;
            if (latest) {
                endpoint += '?latest=true';
            }
            return this.fetchJSON(endpoint, { method: 'GET' });
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async getPendingTaskCounter(providerAddress) {
        try {
            const url = await this.getProviderUrl(providerAddress);
            const endpoint = `${url}/v1/task/pending`;
            return Number(await this.fetchText(endpoint, {
                method: 'GET',
            }));
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async getLog(providerAddress, userAddress, taskID) {
        try {
            const url = await this.getProviderUrl(providerAddress);
            const endpoint = `${url}/v1/user/${userAddress}/task/${taskID}/log`;
            return this.fetchText(endpoint, { method: 'GET' });
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async getCustomizedModels(url) {
        try {
            const endpoint = `${url}/v1/model`;
            const response = await this.fetchJSON(endpoint, { method: 'GET' });
            return response;
        }
        catch (error) {
            console.error(`Failed to get customized models: ${error}`);
            return [];
        }
    }
    async getCustomizedModel(providerAddress, moduleName) {
        try {
            const url = await this.getProviderUrl(providerAddress);
            const endpoint = `${url}/v1/model/${moduleName}`;
            const response = await this.fetchJSON(endpoint, { method: 'GET' });
            return response;
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async getCustomizedModelDetailUsage(providerAddress, moduleName, outputPath) {
        try {
            const url = await this.getProviderUrl(providerAddress);
            const endpoint = `${url}/v1/model/desc/${moduleName}`;
            let destFile = outputPath;
            try {
                const stats = await fs.stat(outputPath);
                if (stats.isDirectory()) {
                    destFile = path.join(outputPath, `${moduleName}.zip`);
                }
                await fs.unlink(destFile);
            }
            catch (err) { }
            const response = await (0, axios_1.default)({
                method: 'get',
                url: endpoint,
                responseType: 'arraybuffer',
            });
            await fs.writeFile(destFile, response.data);
            console.log(`Model downloaded and saved to ${destFile}`);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    /**
     * Download LoRA model directly from TEE
     * This is a fallback when 0G Storage download fails
     * Requires authentication via signature
     */
    async downloadLoRAFromTEE(providerAddress, taskId, outputPath) {
        try {
            const url = await this.getProviderUrl(providerAddress);
            const userAddress = this.contract.getUserAddress();
            // Generate signature for authentication
            // Uses same format as CancelTask: signMessage(keccak256(binaryTaskID))
            const signature = await (0, utils_1.signTaskID)(this.contract.signer, taskId);
            const endpoint = `${url}/v1/user/${userAddress}/task/${taskId}/lora`;
            let destFile = outputPath;
            try {
                const stats = await fs.stat(outputPath);
                if (stats.isDirectory()) {
                    destFile = path.join(outputPath, `lora_model_${taskId}.zip`);
                }
            }
            catch (err) {
                // outputPath doesn't exist or is not accessible, use it as the file path
            }
            // Remove existing file if exists
            try {
                await fs.access(destFile);
                await fs.unlink(destFile);
            }
            catch (err) {
                // File doesn't exist (ENOENT) is fine, other errors should be noted
                if (err.code && err.code !== 'ENOENT') {
                    console.warn(`Warning: Could not remove existing file: ${err.message}`);
                }
            }
            console.log(`Downloading LoRA model from TEE: ${url}/v1/user/${userAddress}/task/${taskId}/lora`);
            const response = await (0, axios_1.default)({
                method: 'post',
                url: endpoint,
                data: { signature },
                responseType: 'arraybuffer',
                timeout: 300000, // 5 minutes timeout for large files
            });
            await fs.writeFile(destFile, response.data);
            console.log(`LoRA model downloaded from TEE and saved to ${destFile}`);
        }
        catch (error) {
            if (error.response) {
                throw new Error(`Failed to download LoRA from TEE: ${error.response.data?.error || error.response.statusText} (status: ${error.response.status})`);
            }
            (0, utils_1.throwFormattedError)(error);
        }
    }
    /**
     * Upload dataset directly to TEE (broker)
     * Returns the dataset hash for use in task creation
     * This is the preferred method over 0G Storage for testing
     *
     * File size limits:
     * - Server default limit: 100MB (configurable via broker's maxUploadSize)
     * - Recommended: Use streaming for files > 10MB
     * - For very large datasets (> 100MB), consider using 0G Storage instead
     *
     * @param providerAddress - The provider's address
     * @param datasetPath - Path to the dataset file
     * @param options - Optional configuration
     * @param options.maxFileSizeMB - Maximum file size in MB (default: 100)
     * @param options.timeoutMs - Request timeout in milliseconds (default: calculated based on file size)
     */
    async uploadDatasetToTEE(providerAddress, datasetPath, options) {
        try {
            const maxFileSizeMB = options?.maxFileSizeMB ?? 100;
            const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;
            const url = await this.getProviderUrl(providerAddress);
            const userAddress = this.contract.getUserAddress();
            const endpoint = `${url}/v1/user/${userAddress}/dataset`;
            // Check file size
            const stats = await fs.stat(datasetPath);
            const fileSizeBytes = stats.size;
            const fileSizeMB = fileSizeBytes / (1024 * 1024);
            if (fileSizeBytes > maxFileSizeBytes) {
                throw new Error(`File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxFileSizeMB}MB). ` +
                    `Consider using 0G Storage for large datasets.`);
            }
            if (fileSizeMB > 10) {
                console.warn(`Warning: Large file detected (${fileSizeMB.toFixed(2)}MB). ` +
                    `Upload may take longer. Consider using 0G Storage for better reliability.`);
            }
            // Calculate timeout based on file size (minimum 60s, +30s per 10MB)
            const calculatedTimeout = Math.max(60000, 60000 + Math.ceil(fileSizeMB / 10) * 30000);
            const timeout = options?.timeoutMs ?? calculatedTimeout;
            const fileName = path.basename(datasetPath);
            console.log(`Uploading dataset to TEE: ${endpoint}`);
            console.log(`File: ${fileName}, Size: ${fileSizeMB.toFixed(2)}MB`);
            console.log(`Timeout: ${timeout / 1000}s`);
            // Use streaming for the upload
            const FormData = (await Promise.resolve().then(() => tslib_1.__importStar(require('form-data')))).default;
            const formData = new FormData();
            // Use createReadStream for streaming upload instead of reading entire file
            const { createReadStream } = await Promise.resolve().then(() => tslib_1.__importStar(require('fs')));
            formData.append('file', createReadStream(datasetPath), {
                filename: fileName,
                contentType: 'application/octet-stream',
            });
            const response = await (0, axios_1.default)({
                method: 'post',
                url: endpoint,
                data: formData,
                headers: formData.getHeaders(),
                timeout: timeout,
                maxContentLength: maxFileSizeBytes,
                maxBodyLength: maxFileSizeBytes,
            });
            console.log(`Dataset uploaded successfully`);
            return response.data;
        }
        catch (error) {
            if (error.code === 'ECONNABORTED') {
                throw new Error(`Upload timed out. The file may be too large or network is slow. ` +
                    `Try increasing timeoutMs or use 0G Storage for large datasets.`);
            }
            if (error.response) {
                const status = error.response.status;
                if (status === 413) {
                    throw new Error(`File too large: Server rejected the upload (HTTP 413). ` +
                        `The server's file size limit may be lower than expected. ` +
                        `Use 0G Storage for large datasets.`);
                }
                throw new Error(`Failed to upload dataset: ${error.response.data?.error || error.response.statusText} (status: ${status})`);
            }
            (0, utils_1.throwFormattedError)(error);
        }
    }
}
exports.Provider = Provider;
//# sourceMappingURL=provider.js.map