import type { FineTuningServingContract } from '../contract'
import axios from 'axios'
import { ethers } from 'ethers'
import * as fs from 'fs/promises'
import * as path from 'path'
import type { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { throwFormattedError, signDatasetUpload } from '../../common/utils'

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
     * Download LoRA model directly from TEE.
     *
     * This is a fallback when 0G Storage download fails. Requires
     * authentication via signature with timestamp to prevent replay
     * attacks.
     *
     * Implementation notes (May 2026 hackathon report Bug #7):
     *
     * - Streams the response straight to disk via `pipeline()` rather than
     *   buffering the whole encrypted artifact in memory. Large fine-tuned
     *   bases (e.g. Qwen3-32B → ~1.1 GB encrypted) used to OOM the host
     *   before they hit any timeout.
     *
     * - Has **no total-request timeout**. The previous `timeout: 300000`
     *   axios setting was a request-wall-clock cap, not an idleness cap, so
     *   any model that legitimately took longer than 5 minutes to stream
     *   would die with `stream has been aborted` regardless of whether
     *   bytes were still flowing. Instead this method enforces an *idle*
     *   timeout (`options.idleTimeoutMs`, default 60 s) that resets on
     *   every data chunk: a stalled connection is still aborted, but a
     *   slow-but-live one is not.
     *
     * - Retries on transient stream / 5xx failures up to
     *   `options.maxRetries` (default 2 → 3 attempts total) with
     *   exponential backoff. Each attempt re-signs because the broker only
     *   accepts signatures whose timestamp is within 5 minutes; a long
     *   first attempt could otherwise push the retry past validity.
     *   4xx responses (auth, not-found, etc.) are not retried.
     *
     * - Currently re-fetches from byte 0 on each retry. Range-resume is a
     *   straightforward follow-up but requires server-side validation of
     *   `Range` against `POST /lora` (the broker's `ctx.File` already
     *   supports it via `http.ServeFile`); deferred to keep this fix
     *   focused.
     */
    async downloadLoRAFromTEE(
        providerAddress: string,
        taskId: string,
        outputPath: string,
        options?: {
            /**
             * Abort the download if no bytes are received for this many
             * milliseconds. Defaults to 60 000 (60 s). This is an *idle*
             * timeout — a slow but live download is not killed.
             */
            idleTimeoutMs?: number
            /**
             * Number of retry attempts on transient stream / 5xx errors.
             * Defaults to 2 (so up to 3 attempts). 4xx responses are not
             * retried.
             */
            maxRetries?: number
        }
    ): Promise<void> {
        const idleTimeoutMs = options?.idleTimeoutMs ?? 60_000
        const maxRetries = options?.maxRetries ?? 2

        try {
            const url = await this.getProviderUrl(providerAddress)
            const userAddress = this.contract.getUserAddress()
            const taskIdBytes = '0x' + taskId.replace(/-/g, '')
            const endpoint = `${url}/v1/user/${userAddress}/task/${taskId}/lora`

            let destFile = outputPath
            try {
                const stats = await fs.stat(outputPath)
                if (stats.isDirectory()) {
                    destFile = path.join(outputPath, `lora_model_${taskId}.zip`)
                }
            } catch (err) {
                // outputPath doesn't exist yet, use it as the file path
            }

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                // Re-sign on every attempt: the broker only accepts
                // signatures whose timestamp is within 5 minutes, and a
                // slow first attempt may push us past that on retry.
                const timestamp = Math.floor(Date.now() / 1000)
                const message = `${taskIdBytes.slice(2)}${timestamp}`
                const hash = ethers.keccak256(ethers.toUtf8Bytes(message))
                const signature = await this.contract.signer.signMessage(
                    ethers.toBeArray(hash)
                )

                // Truncate any partial output from a previous attempt so
                // we don't end up with a concatenated half-file.
                try {
                    await fs.unlink(destFile)
                } catch (err: any) {
                    if (err.code && err.code !== 'ENOENT') {
                        console.warn(
                            `Warning: could not remove existing file: ${err.message}`
                        )
                    }
                }

                const attemptLabel =
                    maxRetries > 0
                        ? ` (attempt ${attempt + 1}/${maxRetries + 1})`
                        : ''
                console.log(
                    `Downloading LoRA model from TEE: ${endpoint}${attemptLabel}`
                )

                // Idle-timeout watchdog: AbortController is reset on every
                // chunk. Portable across Node http/https and any axios
                // adapter (no socket poking).
                const controller = new AbortController()
                let lastChunkAt = Date.now()
                let bytesReceived = 0
                const watchdog = setInterval(
                    () => {
                        if (Date.now() - lastChunkAt > idleTimeoutMs) {
                            controller.abort()
                        }
                    },
                    Math.min(Math.max(idleTimeoutMs / 4, 1_000), 5_000)
                )

                try {
                    const response = await axios({
                        method: 'post',
                        url: endpoint,
                        data: { signature, timestamp },
                        responseType: 'stream',
                        // No request-wall-clock timeout — see the doc
                        // comment above. The interval above enforces idle.
                        timeout: 0,
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity,
                        signal: controller.signal,
                    })

                    const stream: Readable = response.data
                    stream.on('data', (chunk: Buffer) => {
                        bytesReceived += chunk.length
                        lastChunkAt = Date.now()
                    })

                    const { createWriteStream } = await import('fs')
                    const writer = createWriteStream(destFile)
                    await pipeline(stream, writer)

                    console.log(
                        `LoRA model downloaded from TEE and saved to ${destFile} ` +
                            `(${bytesReceived} bytes)`
                    )
                    return
                } catch (err: any) {
                    const status = err?.response?.status
                    // Permanent client errors should not be retried.
                    if (
                        status &&
                        status >= 400 &&
                        status < 500 &&
                        status !== 408
                    ) {
                        throw err
                    }
                    if (attempt >= maxRetries) {
                        throw new Error(
                            `TEE download failed after ${maxRetries + 1} attempt(s) ` +
                                `(${bytesReceived} bytes received before failure): ` +
                                `${err?.message ?? err}`
                        )
                    }
                    const backoffMs = Math.min(2_000 * 2 ** attempt, 30_000)
                    console.warn(
                        `TEE download attempt ${attempt + 1} failed at ` +
                            `${bytesReceived} bytes (${err?.message ?? err}). ` +
                            `Retrying in ${backoffMs}ms...`
                    )
                    await new Promise((r) => setTimeout(r, backoffMs))
                } finally {
                    clearInterval(watchdog)
                }
            }
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
     * Authentication: Requires signature of keccak256(userAddress + timestamp)
     * - Prevents replay attacks by including timestamp (valid for 5 minutes)
     * - Each upload requires a fresh signature
     *
     * File size limits:
     * - Server default limit: 100MB (configurable via broker's maxUploadSize)
     * - Recommended: Use streaming for files > 10MB
     * - For very large datasets (> 100MB), consider using 0G Storage instead
     *
     * @param providerAddress - The provider's address
     * @param datasetPath - Path to the dataset file (must be JSONL format)
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

            // Generate timestamp and signature for authentication
            // This prevents signature replay attacks by binding signature to current time
            const timestamp = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
            const signature = await signDatasetUpload(
                this.contract.signer,
                userAddress,
                timestamp
            )

            // Use streaming for the upload
            const FormData = (await import('form-data')).default
            const formData = new FormData()

            // Use createReadStream for streaming upload instead of reading entire file
            const { createReadStream } = await import('fs')
            formData.append('file', createReadStream(datasetPath), {
                filename: fileName,
                contentType: 'application/octet-stream',
            })

            // Add signature and timestamp for authentication
            formData.append('signature', signature)
            formData.append('timestamp', timestamp.toString())

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
