import axios from 'axios'
import { makeAdapterName } from '../../common/utils/adapter-name'

const ADAPTER_POLL_INTERVAL_MS = 3000
const DEPLOY_POLL_INTERVAL_MS = 2000
const DEFAULT_DEPLOY_TIMEOUT_SECONDS = 120

export type AdapterState =
    | 'init'
    | 'pending'
    | 'downloading'
    | 'ready'
    | 'active'
    | 'loading'
    | 'offloaded'
    | 'archived'
    | 'failed'

export interface AdapterInfo {
    adapterName: string
    taskId: string
    baseModel: string
    userAddress: string
    state: AdapterState
    storagePath?: string
    storageRootHash?: string
    error?: string
}

export interface AdapterStatusResponse {
    adapterName: string
    state: AdapterState
    error?: string
}

export interface DeployResponse {
    message: string
    adapterName?: string
}

export interface ChatResponse {
    id: string
    model: string
    choices: Array<{
        message: { role: string; content: string }
        finish_reason: string
    }>
    usage?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
}

export interface DeployAdapterOptions {
    wait?: boolean
    timeoutSeconds?: number
    onProgress?: (state: string) => void
}

export interface ChatOptions {
    systemPrompt?: string
}

export interface LoRADependencies {
    getEndpoint(providerAddress: string): Promise<string>
    getHeaders(
        providerAddress: string,
        content?: string
    ): Promise<Record<string, string>>
}

export class LoRAProcessor {
    private deps: LoRADependencies

    constructor(deps: LoRADependencies) {
        this.deps = deps
    }

    private async getBrokerBaseUrl(providerAddress: string): Promise<string> {
        const endpoint = await this.deps.getEndpoint(providerAddress)
        return endpoint.replace(/\/v1\/proxy$/, '')
    }

    async resolveAdapterName(
        providerAddress: string,
        taskId: string,
        baseModel: string
    ): Promise<string> {
        const localName = makeAdapterName(baseModel, taskId)
        const baseUrl = await this.getBrokerBaseUrl(providerAddress)
        try {
            const resp = await axios.get(`${baseUrl}/v1/lora/adapters`)
            const adapters: AdapterInfo[] = resp.data?.adapters || []
            const match = adapters.find((a) => a.taskId === taskId)
            if (match?.adapterName) {
                return match.adapterName
            }
        } catch {
            // Fall back to locally generated name
        }
        return localName
    }

    async listAdapters(providerAddress: string): Promise<AdapterInfo[]> {
        const baseUrl = await this.getBrokerBaseUrl(providerAddress)
        const resp = await axios.get(`${baseUrl}/v1/lora/adapters`)
        return resp.data?.adapters || []
    }

    async getAdapterStatus(
        providerAddress: string,
        adapterName: string
    ): Promise<AdapterStatusResponse> {
        const baseUrl = await this.getBrokerBaseUrl(providerAddress)
        const resp = await axios.get(
            `${baseUrl}/v1/lora/adapters/${adapterName}`
        )
        return resp.data
    }

    async deployAdapter(
        providerAddress: string,
        baseModel: string,
        taskId: string,
        options: DeployAdapterOptions = {}
    ): Promise<DeployResponse> {
        const {
            wait = false,
            timeoutSeconds = DEFAULT_DEPLOY_TIMEOUT_SECONDS,
            onProgress,
        } = options

        const baseUrl = await this.getBrokerBaseUrl(providerAddress)
        let adapterName = await this.resolveAdapterName(
            providerAddress,
            taskId,
            baseModel
        )
        const localName = makeAdapterName(baseModel, taskId)
        let nameResolved = adapterName !== localName

        if (wait) {
            const deadline = Date.now() + timeoutSeconds * 1000
            let lastState = ''
            while (Date.now() < deadline) {
                if (!nameResolved) {
                    try {
                        const resolved = await this.resolveAdapterName(
                            providerAddress,
                            taskId,
                            baseModel
                        )
                        if (resolved !== localName) {
                            adapterName = resolved
                            nameResolved = true
                        }
                    } catch {
                        // Broker may not have processed event yet
                    }
                }

                try {
                    const status = await this.getAdapterStatus(
                        providerAddress,
                        adapterName
                    )
                    const state = status.state
                    if (state && state !== lastState) {
                        lastState = state
                        onProgress?.(state)
                    }
                    if (state === 'ready' || state === 'active') break
                    if (state === 'failed') break
                } catch {
                    // Not found yet
                }
                await new Promise((r) =>
                    setTimeout(r, ADAPTER_POLL_INTERVAL_MS)
                )
            }
            if (
                Date.now() >= deadline &&
                lastState !== 'ready' &&
                lastState !== 'active'
            ) {
                throw new Error(
                    `Timed out after ${timeoutSeconds}s waiting for adapter to be ready (last state: ${lastState || 'not found'})`
                )
            }
        }

        // If already active, skip deploy
        try {
            const status = await this.getAdapterStatus(
                providerAddress,
                adapterName
            )
            if (status.state === 'active') {
                return { message: 'Adapter is already deployed and active!' }
            }
        } catch {
            // Not found, proceed
        }

        // Call deploy API
        const deployResp = await axios.post(
            `${baseUrl}/v1/lora/adapters/deploy`,
            { taskId, baseModel }
        )
        const result: DeployResponse = {
            message: deployResp.data?.message || 'Deploy request sent',
            adapterName,
        }

        if (wait) {
            const deadline = Date.now() + timeoutSeconds * 1000
            while (Date.now() < deadline) {
                try {
                    const status = await this.getAdapterStatus(
                        providerAddress,
                        adapterName
                    )
                    if (status.state === 'active') {
                        result.message =
                            'Adapter deployed successfully! You can now chat with it.'
                        return result
                    }
                    if (status.state === 'failed') {
                        throw new Error('Adapter deployment failed.')
                    }
                    onProgress?.(status.state)
                } catch (err: unknown) {
                    if (
                        err instanceof Error &&
                        err.message.includes('failed')
                    ) {
                        throw err
                    }
                }
                await new Promise((r) =>
                    setTimeout(r, DEPLOY_POLL_INTERVAL_MS)
                )
            }
            throw new Error(
                `Timed out after ${timeoutSeconds}s waiting for deployment to complete.`
            )
        }

        return result
    }

    async chat(
        providerAddress: string,
        adapterName: string,
        message: string,
        options: ChatOptions = {}
    ): Promise<ChatResponse> {
        const { systemPrompt = 'You are a helpful assistant.' } = options
        const endpoint = await this.deps.getEndpoint(providerAddress)

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
        ]

        const headers = await this.deps.getHeaders(
            providerAddress,
            JSON.stringify({ model: adapterName, messages })
        )

        const resp = await axios.post(
            `${endpoint}/chat/completions`,
            { model: adapterName, messages },
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
            }
        )

        return resp.data
    }
}
