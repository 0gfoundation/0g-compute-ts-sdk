import type { FineTuningServingContract } from '../contract'
import axios from 'axios'
import * as fs from 'fs/promises'
import * as path from 'path'
import { throwFormattedError, signTaskID } from '../../common/utils'

export interface Task {
    readonly id?: string
    readonly createdAt?: string
    readonly updatedAt?: string
    userAddress: string
    preTrainedModelHash: string
    datasetHash: string
    trainingParams: string
    fee: string
    nonce: string
    signature: string
    readonly progress?: string
    readonly deliverIndex?: string
    wait?: boolean
}

export interface TdxQuoteResponse {
    rawReport: string
    signingAddress: string
}

export interface CustomizedModel {
    name: string
    hash: string
    image: string
    dataType: string
    trainingScript: string
    description: string
    tokenizer: string
}

export class Provider {
    private contract: FineTuningServingContract

    constructor(contract: FineTuningServingContract) {
        this.contract = contract
    }

    private async fetchJSON(
        endpoint: string,
        options: RequestInit
    ): Promise<any> {
        try {
            const response = await fetch(endpoint, options)
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error)
            }
            return response.json()
        } catch (error) {
            throwFormattedError(error)
        }
    }

    private async fetchText(
        endpoint: string,
        options: RequestInit
    ): Promise<string> {
        try {
            const response = await fetch(endpoint, options)
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }
            const buffer = await response.arrayBuffer()
            return Buffer.from(buffer).toString('utf-8')
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async getProviderUrl(providerAddress: string): Promise<string> {
        try {
            const service = await this.contract.getService(providerAddress)
            return service.url
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async getQuote(providerAddress: string): Promise<TdxQuoteResponse> {
        try {
            const url = await this.getProviderUrl(providerAddress)
            const endpoint = `${url}/v1/quote`

            const rawReport = await this.fetchText(endpoint, {
                method: 'GET',
            })
            const ret = JSON.parse(rawReport)
            return {
                rawReport,
                signingAddress: ret['report_data'],
            } as TdxQuoteResponse
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async createTask(providerAddress: string, task: Task): Promise<string> {
        try {
            const url = await this.getProviderUrl(providerAddress)
            const userAddress = this.contract.getUserAddress()
            const endpoint = `${url}/v1/user/${userAddress}/task`

            const response = await this.fetchJSON(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(task),
            })
            return response.id
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create task: ${error.message}`)
            }
            throw new Error('Failed to create task')
        }
    }

    async cancelTask(
        providerAddress: string,
        signature: string,
        taskID: string
    ): Promise<string> {
        try {
            const url = await this.getProviderUrl(providerAddress)
            const userAddress = this.contract.getUserAddress()
            const endpoint = `${url}/v1/user/${userAddress}/task/${taskID}/cancel`

            const response = await this.fetchText(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    signature: signature,
                }),
            })
            return response
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async getTask(
        providerAddress: string,
        userAddress: string,
        taskID: string
    ): Promise<Task> {
        try {
            const url = await this.getProviderUrl(providerAddress)
            const endpoint = `${url}/v1/user/${encodeURIComponent(
                userAddress
            )}/task/${taskID}`

            console.log('url', url)
            console.log('endpoint', endpoint)

            return this.fetchJSON(endpoint, { method: 'GET' }) as Promise<Task>
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async listTask(
        providerAddress: string,
        userAddress: string,
        latest = false
    ): Promise<Task[]> {
        try {
            const url = await this.getProviderUrl(providerAddress)
            let endpoint = `${url}/v1/user/${encodeURIComponent(
                userAddress
            )}/task`

            if (latest) {
                endpoint += '?latest=true'
            }

            return this.fetchJSON(endpoint, { method: 'GET' }) as Promise<
                Task[]
            >
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async getPendingTaskCounter(providerAddress: string) {
        try {
            const url = await this.getProviderUrl(providerAddress)
            const endpoint = `${url}/v1/task/pending`

            return Number(
                await this.fetchText(endpoint, {
                    method: 'GET',
                })
            )
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async getLog(
        providerAddress: string,
        userAddress: string,
        taskID: string
    ): Promise<string> {
        try {
            const url = await this.getProviderUrl(providerAddress)
            const endpoint = `${url}/v1/user/${userAddress}/task/${taskID}/log`
            return this.fetchText(endpoint, { method: 'GET' })
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async getCustomizedModels(url: string): Promise<CustomizedModel[]> {
        try {
            const endpoint = `${url}/v1/model`
            const response = await this.fetchJSON(endpoint, { method: 'GET' })
            return response as CustomizedModel[]
        } catch (error) {
            console.error(`Failed to get customized models: ${error}`)
            return []
        }
    }

    async getCustomizedModel(
        providerAddress: string,
        moduleName: string
    ): Promise<CustomizedModel> {
        try {
            const url = await this.getProviderUrl(providerAddress)
            const endpoint = `${url}/v1/model/${moduleName}`
            const response = await this.fetchJSON(endpoint, { method: 'GET' })
            return response as CustomizedModel
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async getCustomizedModelDetailUsage(
        providerAddress: string,
        moduleName: string,
        outputPath: string
    ): Promise<void> {
        try {
            const url = await this.getProviderUrl(providerAddress)
            const endpoint = `${url}/v1/model/desc/${moduleName}`

            let destFile = outputPath
            try {
                const stats = await fs.stat(outputPath)
                if (stats.isDirectory()) {
                    destFile = path.join(outputPath, `${moduleName}.zip`)
                }

                await fs.unlink(destFile)
            } catch (err) {}

            const response = await axios({
                method: 'get',
                url: endpoint,
                responseType: 'arraybuffer',
            })

            await fs.writeFile(destFile, response.data)
            console.log(`Model downloaded and saved to ${destFile}`)
        } catch (error: any) {
            throwFormattedError(error)
        }
    }

    /**
     * Download LoRA model directly from TEE
     * This is a fallback when 0G Storage download fails
     * Requires authentication via signature
     */
    async downloadLoRAFromTEE(
        providerAddress: string,
        taskId: string,
        outputPath: string
    ): Promise<void> {
        try {
            const url = await this.getProviderUrl(providerAddress)
            const userAddress = this.contract.getUserAddress()

            // Generate signature for authentication
            // Uses same format as CancelTask: signMessage(keccak256(binaryTaskID))
            const signature = await signTaskID(this.contract.signer, taskId)

            const endpoint = `${url}/v1/user/${userAddress}/task/${taskId}/lora`

            let destFile = outputPath
            try {
                const stats = await fs.stat(outputPath)
                if (stats.isDirectory()) {
                    destFile = path.join(outputPath, `lora_model_${taskId}.zip`)
                }
            } catch (err) {
                // outputPath doesn't exist or is not accessible, use it as the file path
            }

            // Remove existing file if exists
            try {
                await fs.access(destFile)
                await fs.unlink(destFile)
            } catch (err: any) {
                // File doesn't exist (ENOENT) is fine, other errors should be noted
                if (err.code && err.code !== 'ENOENT') {
                    console.warn(
                        `Warning: Could not remove existing file: ${err.message}`
                    )
                }
            }

            console.log(
                `Downloading LoRA model from TEE: ${url}/v1/user/${userAddress}/task/${taskId}/lora`
            )

            const response = await axios({
                method: 'post',
                url: endpoint,
                data: { signature },
                responseType: 'arraybuffer',
                timeout: 300000, // 5 minutes timeout for large files
            })

            await fs.writeFile(destFile, response.data)
            console.log(
                `LoRA model downloaded from TEE and saved to ${destFile}`
            )
        } catch (error: any) {
            if (error.response) {
                throw new Error(
                    `Failed to download LoRA from TEE: ${
                        error.response.data?.error || error.response.statusText
                    } (status: ${error.response.status})`
                )
            }
            throwFormattedError(error)
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
    async uploadDatasetToTEE(
        providerAddress: string,
        datasetPath: string,
        options?: {
            maxFileSizeMB?: number
            timeoutMs?: number
        }
    ): Promise<{ datasetHash: string; message: string }> {
        try {
            const maxFileSizeMB = options?.maxFileSizeMB ?? 100
            const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024

            const url = await this.getProviderUrl(providerAddress)
            const userAddress = this.contract.getUserAddress()
            const endpoint = `${url}/v1/user/${userAddress}/dataset`

            // Check file size
            const stats = await fs.stat(datasetPath)
            const fileSizeBytes = stats.size
            const fileSizeMB = fileSizeBytes / (1024 * 1024)

            if (fileSizeBytes > maxFileSizeBytes) {
                throw new Error(
                    `File size (${fileSizeMB.toFixed(
                        2
                    )}MB) exceeds maximum allowed size (${maxFileSizeMB}MB). ` +
                        `Consider using 0G Storage for large datasets.`
                )
            }

            if (fileSizeMB > 10) {
                console.warn(
                    `Warning: Large file detected (${fileSizeMB.toFixed(
                        2
                    )}MB). ` +
                        `Upload may take longer. Consider using 0G Storage for better reliability.`
                )
            }

            // Calculate timeout based on file size (minimum 60s, +30s per 10MB)
            const calculatedTimeout = Math.max(
                60000,
                60000 + Math.ceil(fileSizeMB / 10) * 30000
            )
            const timeout = options?.timeoutMs ?? calculatedTimeout

            const fileName = path.basename(datasetPath)

            console.log(`Uploading dataset to TEE: ${endpoint}`)
            console.log(`File: ${fileName}, Size: ${fileSizeMB.toFixed(2)}MB`)
            console.log(`Timeout: ${timeout / 1000}s`)

            // Use streaming for the upload
            const FormData = (await import('form-data')).default
            const formData = new FormData()

            // Use createReadStream for streaming upload instead of reading entire file
            const { createReadStream } = await import('fs')
            formData.append('file', createReadStream(datasetPath), {
                filename: fileName,
                contentType: 'application/octet-stream',
            })

            const response = await axios({
                method: 'post',
                url: endpoint,
                data: formData,
                headers: formData.getHeaders(),
                timeout: timeout,
                maxContentLength: maxFileSizeBytes,
                maxBodyLength: maxFileSizeBytes,
            })

            console.log(`Dataset uploaded successfully`)
            return response.data as { datasetHash: string; message: string }
        } catch (error: any) {
            if (error.code === 'ECONNABORTED') {
                throw new Error(
                    `Upload timed out. The file may be too large or network is slow. ` +
                        `Try increasing timeoutMs or use 0G Storage for large datasets.`
                )
            }
            if (error.response) {
                const status = error.response.status
                if (status === 413) {
                    throw new Error(
                        `File too large: Server rejected the upload (HTTP 413). ` +
                            `The server's file size limit may be lower than expected. ` +
                            `Use 0G Storage for large datasets.`
                    )
                }
                throw new Error(
                    `Failed to upload dataset: ${
                        error.response.data?.error || error.response.statusText
                    } (status: ${status})`
                )
            }
            throwFormattedError(error)
        }
    }
}
