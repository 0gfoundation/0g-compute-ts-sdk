"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAccount, useWalletClient, useChainId, useSwitchChain } from 'wagmi'
import type { ZGComputeNetworkBroker, ZGComputeNetworkReadOnlyBroker } from '@0gfoundation/0g-compute-ts-sdk'
import { createZGComputeNetworkBroker, createZGComputeNetworkReadOnlyBroker } from '@0gfoundation/0g-compute-ts-sdk'
import type { JsonRpcSigner } from 'ethers'
import { BrowserProvider } from 'ethers'
import { APP_CONSTANTS } from '../constants/app'
import { errorHandler } from '../utils/errorHandling'
import { neuronToA0giString } from '../utils/currency'
import { clearChainCache, setCurrentChainInCache } from '../utils/chainCache'
import { zgMainnet, zgTestnet } from '../config/wagmi'
import { useChainRestore } from '../hooks/useChainRestore'
import { useReadOnlyBroker } from '../hooks/useReadOnlyBroker'

interface InferenceInfo {
    provider: string
    balance: string
    requestedReturn: string
}

interface FineTuningInfo {
    provider: string
    balance: string
    requestedReturn: string
}

export interface LedgerInfo {
    totalBalance: string
    availableBalance: string
    locked: string
    inferences: InferenceInfo[]
    fineTunings: FineTuningInfo[]
}

export interface BrokerContextValue {
    broker: ZGComputeNetworkBroker | null
    readOnlyBroker: ZGComputeNetworkReadOnlyBroker | null
    isInitializing: boolean
    error: string | null
    ledgerInfo: LedgerInfo | null
    initializeBroker: () => Promise<void>
    refreshLedgerInfo: () => Promise<LedgerInfo | null>
    addLedger: (balance: number) => Promise<void>
    depositFund: (amount: number) => Promise<void>
}

const defaultBrokerValue: BrokerContextValue = {
    broker: null,
    readOnlyBroker: null,
    isInitializing: true,
    error: null,
    ledgerInfo: null,
    initializeBroker: async () => {},
    refreshLedgerInfo: async () => null,
    addLedger: async () => { throw new Error('BrokerProvider not mounted') },
    depositFund: async () => { throw new Error('BrokerProvider not mounted') },
}

const BrokerContext = createContext<BrokerContextValue>(defaultBrokerValue)

export function useBroker(): BrokerContextValue {
    return useContext(BrokerContext)
}

function processLedgerData(
    rawLedgerInfo: [bigint, bigint],
    infers: Array<[string, bigint, bigint]> | undefined,
    fines: Array<[string, bigint, bigint]> | undefined | null,
): LedgerInfo {
    const totalBigInt = BigInt(rawLedgerInfo[0])
    const lockedBigInt = BigInt(rawLedgerInfo[1])
    const availableBigInt = totalBigInt - lockedBigInt

    const processedInferences: InferenceInfo[] = []
    if (infers && infers.length > 0) {
        for (const infer of infers) {
            processedInferences.push({
                provider: infer[0],
                balance: neuronToA0giString(BigInt(infer[1])),
                requestedReturn: neuronToA0giString(BigInt(infer[2])),
            })
        }
    }

    const processedFineTunings: FineTuningInfo[] = []
    if (fines && fines.length > 0) {
        for (const fine of fines) {
            processedFineTunings.push({
                provider: fine[0],
                balance: neuronToA0giString(BigInt(fine[1])),
                requestedReturn: neuronToA0giString(BigInt(fine[2])),
            })
        }
    }

    return {
        totalBalance: neuronToA0giString(totalBigInt),
        availableBalance: neuronToA0giString(availableBigInt),
        locked: neuronToA0giString(lockedBigInt),
        inferences: processedInferences,
        fineTunings: processedFineTunings,
    }
}

/**
 * Create broker instance with abort support and chain validation
 *
 * @param walletClient - Wallet client from wagmi
 * @param expectedChainId - Expected chain ID to validate against
 * @param signal - AbortSignal for cancellation
 * @returns Promise resolving to broker instance
 * @throws Error if signer creation fails or chain mismatch detected
 */
async function createBrokerWithAbort(
    walletClient: any,
    expectedChainId: number,
    signal: AbortSignal
): Promise<ZGComputeNetworkBroker> {
    // Initial delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    if (signal.aborted) throw new Error('Aborted')

    // Create signer with retry logic
    let signer: JsonRpcSigner | undefined
    let signerChainId: number | undefined
    const provider = new BrowserProvider(walletClient)
    const maxRetries = APP_CONSTANTS.BLOCKCHAIN.MAX_SIGNER_RETRIES

    for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
        if (signal.aborted) throw new Error('Aborted')

        try {
            signer = await provider.getSigner()
            await signer.getAddress()
            const network = await provider.getNetwork()
            signerChainId = Number(network.chainId)
            break
        } catch (signerError) {
            if (retryCount >= maxRetries - 1) {
                throw signerError
            }
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
    }

    if (!signer) {
        throw new Error('Failed to create signer')
    }

    // Validate chain ID
    if (signerChainId !== expectedChainId) {
        throw new Error(
            `Chain mismatch: expected ${expectedChainId}, got ${signerChainId}`
        )
    }

    if (signal.aborted) throw new Error('Aborted')

    // Create broker instance
    const brokerInstance = await createZGComputeNetworkBroker(
        signer as Parameters<typeof createZGComputeNetworkBroker>[0]
    )

    if (signal.aborted) throw new Error('Aborted')

    return brokerInstance
}

export function BrokerProvider({ children }: { children: React.ReactNode }) {
    const { isConnected } = useAccount()
    const { data: walletClient } = useWalletClient()
    const chainId = useChainId()
    const { switchChain } = useSwitchChain()

    const [broker, setBroker] = useState<ZGComputeNetworkBroker | null>(null)
    const [isInitializing, setIsInitializing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [ledgerInfo, setLedgerInfo] = useState<LedgerInfo | null>(null)

    // Cancellation token: AbortController for cancelling in-flight initialization
    const abortControllerRef = useRef<AbortController | null>(null)

    // Track current chainId to detect changes (useRef to avoid extra renders)
    const currentChainIdRef = useRef<number | undefined>(undefined)

    // Always-current chainId ref — updated during render so async code
    // can compare the broker's chain against the latest value.
    const chainIdRef = useRef(chainId)
    chainIdRef.current = chainId

    // Chain restoration hook
    const { shouldSkipInit } = useChainRestore({
        isConnected,
        currentChainId: chainId,
        switchChain,
    })

    // Read-only broker hook
    const readOnlyBroker = useReadOnlyBroker({
        chainId,
        enabled: !shouldSkipInit || !isConnected,
    })

    const initializeBroker = useCallback(async () => {
        if (!walletClient || !isConnected) {
            setIsInitializing(false)
            return
        }

        // Create new AbortController for this initialization
        const abortController = new AbortController()
        abortControllerRef.current = abortController

        setIsInitializing(true)
        setError(null)

        try {
            // Create broker with abort support and chain validation
            const brokerInstance = await createBrokerWithAbort(
                walletClient,
                chainIdRef.current,
                abortController.signal
            )

            if (abortController.signal.aborted) return

            // Fetch ledger info (non-fatal if it fails)
            try {
                const { ledgerInfo: raw, infers, fines } =
                    await brokerInstance.ledger.ledger.getLedgerWithDetail()
                if (abortController.signal.aborted) return
                setLedgerInfo(processLedgerData(raw as [bigint, bigint], infers, fines))
            } catch {
                // Ledger fetch failed but broker is still usable
            }

            if (abortController.signal.aborted) return

            setBroker(brokerInstance)
        } catch (err: unknown) {
            if (abortController.signal.aborted) return
            const appError = errorHandler.handle(err, 'BrokerInitialization')
            setError(appError.userMessage)
        } finally {
            if (!abortController.signal.aborted) {
                setIsInitializing(false)
            }
        }
    }, [walletClient, isConnected])

    const refreshLedgerInfo = useCallback(async (): Promise<LedgerInfo | null> => {
        if (!broker) return null

        try {
            const { ledgerInfo: raw, infers, fines } =
                await broker.ledger.ledger.getLedgerWithDetail()
            const processed = processLedgerData(raw as [bigint, bigint], infers, fines)
            setLedgerInfo(processed)
            return processed
        } catch (err: unknown) {
            if (err instanceof Error && err.message.includes('Account does not exist')) {
                setLedgerInfo(null)
                return null
            }
            throw err
        }
    }, [broker])

    const addLedger = useCallback(
        async (balance: number) => {
            if (!broker) {
                throw new Error('Broker not initialized')
            }

            try {
                await broker.ledger.addLedger(balance)
                await refreshLedgerInfo()
            } catch (err: unknown) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Failed to add ledger'
                throw new Error(errorMessage)
            }
        },
        [broker, refreshLedgerInfo]
    )

    const depositFund = useCallback(
        async (amount: number) => {
            if (!broker) {
                throw new Error('Broker not initialized')
            }

            try {
                await broker.ledger.depositFund(amount)
                await refreshLedgerInfo()
            } catch (err: unknown) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to deposit funds'
                throw new Error(errorMessage)
            }
        },
        [broker, refreshLedgerInfo]
    )

    // Reset state when wallet disconnects
    useEffect(() => {
        if (!isConnected) {
            setBroker(null)
            setLedgerInfo(null)
            setError(null)
            setIsInitializing(false)
            currentChainIdRef.current = undefined
        }
    }, [isConnected])

    // Update chain cache
    useEffect(() => {
        setCurrentChainInCache(chainId)
    }, [chainId])

    // Auto-initialize broker and handle chain switching
    useEffect(() => {
        if (shouldSkipInit || !isConnected || !walletClient) return

        const prevChainId = currentChainIdRef.current

        // Handle chain change
        if (prevChainId !== undefined && chainId !== prevChainId) {
            // Abort any in-flight initialization
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }

            // Clear state
            setLedgerInfo(null)
            setBroker(null)
            setError(null)
            clearChainCache(prevChainId)
        }

        // Update current chain tracking
        currentChainIdRef.current = chainId

        // Initialize if no broker exists
        if (!broker) {
            let retryTimerId: ReturnType<typeof setTimeout> | undefined
            let cancelled = false

            const initWithRetry = async () => {
                try {
                    await initializeBroker()
                } catch {
                    if (!cancelled) {
                        retryTimerId = setTimeout(() => {
                            initializeBroker()
                        }, 2000)
                    }
                }
            }
            initWithRetry()

            return () => {
                cancelled = true
                if (retryTimerId !== undefined) clearTimeout(retryTimerId)
            }
        }
    }, [shouldSkipInit, isConnected, walletClient, chainId, broker, initializeBroker])

    const value = useMemo<BrokerContextValue>(() => ({
        broker,
        readOnlyBroker,
        isInitializing,
        error,
        ledgerInfo,
        initializeBroker,
        refreshLedgerInfo,
        addLedger,
        depositFund,
    }), [broker, readOnlyBroker, isInitializing, error, ledgerInfo,
         initializeBroker, refreshLedgerInfo, addLedger, depositFund])

    return (
        <BrokerContext.Provider value={value}>
            {children}
        </BrokerContext.Provider>
    )
}
