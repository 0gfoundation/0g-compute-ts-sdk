"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAccount, useWalletClient, useChainId } from 'wagmi'
import type { ZGComputeNetworkBroker } from '@0glabs/0g-serving-broker'
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker'
import type { JsonRpcSigner } from 'ethers'
import { BrowserProvider } from 'ethers'
import { APP_CONSTANTS } from '../constants/app'
import { errorHandler } from '../utils/errorHandling'
import { neuronToA0giString } from '../utils/currency'
import { clearChainCache, setCurrentChainInCache } from '../utils/chainCache'

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
    isInitializing: boolean
    isChainSwitching: boolean
    error: string | null
    ledgerInfo: LedgerInfo | null
    initializeBroker: () => Promise<void>
    refreshLedgerInfo: () => Promise<void>
    addLedger: (balance: number) => Promise<void>
    depositFund: (amount: number) => Promise<void>
}

const defaultBrokerValue: BrokerContextValue = {
    broker: null,
    isInitializing: true,
    isChainSwitching: false,
    error: null,
    ledgerInfo: null,
    initializeBroker: async () => {},
    refreshLedgerInfo: async () => {},
    addLedger: async () => { throw new Error('BrokerProvider not mounted') },
    depositFund: async () => { throw new Error('BrokerProvider not mounted') },
}

const BrokerContext = createContext<BrokerContextValue>(defaultBrokerValue)

export function useBroker(): BrokerContextValue {
    return useContext(BrokerContext)
}

function processLedgerData(
    rawLedgerInfo: any,
    infers: any[] | undefined,
    fines: any[] | undefined,
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

export function BrokerProvider({ children }: { children: React.ReactNode }) {
    const { isConnected } = useAccount()
    const { data: walletClient } = useWalletClient()
    const chainId = useChainId()

    const [broker, setBroker] = useState<ZGComputeNetworkBroker | null>(null)
    const [isInitializing, setIsInitializing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [ledgerInfo, setLedgerInfo] = useState<LedgerInfo | null>(null)
    const [isChainSwitching, setIsChainSwitching] = useState(false)

    // Cancellation token: each initializeBroker call gets a unique id;
    // stale calls check this before writing state.
    const initIdRef = useRef<symbol | null>(null)

    const initializeBroker = useCallback(async () => {
        if (!walletClient || !isConnected) {
            setIsInitializing(false)
            return
        }

        const thisInitId = Symbol()
        initIdRef.current = thisInitId

        setIsInitializing(true)
        setError(null)

        try {
            await new Promise((resolve) => setTimeout(resolve, 500))

            if (initIdRef.current !== thisInitId) return

            let provider: BrowserProvider
            let signer: JsonRpcSigner | undefined
            let retryCount = 0
            const maxRetries = APP_CONSTANTS.BLOCKCHAIN.MAX_SIGNER_RETRIES

            while (retryCount < maxRetries) {
                try {
                    provider = new BrowserProvider(walletClient)
                    signer = await provider.getSigner()

                    await signer.getAddress()
                    await provider.getNetwork()

                    break
                } catch (signerError) {
                    retryCount++

                    if (retryCount >= maxRetries) {
                        throw signerError
                    }

                    await new Promise((resolve) => setTimeout(resolve, 1000))

                    if (initIdRef.current !== thisInitId) return
                }
            }

            if (initIdRef.current !== thisInitId) return

            if (!signer) {
                throw new Error('Failed to create signer')
            }

            const brokerInstance = await createZGComputeNetworkBroker(
                signer as any // TODO: Fix this type assertion when 0g-serving-broker types are available
            )

            if (initIdRef.current !== thisInitId) return

            // Fetch ledger using the instance directly (bypasses stale broker closure)
            try {
                const { ledgerInfo: raw, infers, fines } =
                    await brokerInstance.ledger.ledger.getLedgerWithDetail()
                if (initIdRef.current !== thisInitId) return
                setLedgerInfo(processLedgerData(raw, infers, fines))
            } catch {
                // Ledger fetch failed but broker is still usable
            }

            if (initIdRef.current !== thisInitId) return

            setBroker(brokerInstance as unknown as ZGComputeNetworkBroker)
        } catch (err: unknown) {
            if (initIdRef.current !== thisInitId) return
            const appError = errorHandler.handle(err, 'BrokerInitialization')
            setError(appError.userMessage)
        } finally {
            if (initIdRef.current === thisInitId) {
                setIsInitializing(false)
            }
        }
    }, [walletClient, isConnected])

    const refreshLedgerInfo = useCallback(async () => {
        if (!broker) return

        try {
            const { ledgerInfo: raw, infers, fines } =
                await broker.ledger.ledger.getLedgerWithDetail()
            setLedgerInfo(processLedgerData(raw, infers, fines))
        } catch (err: unknown) {
            setLedgerInfo(null)
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

    // Auto-initialize when wallet connects with retry mechanism
    useEffect(() => {
        if (isConnected && walletClient && !broker && !isChainSwitching) {
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
    }, [isConnected, walletClient, broker, isChainSwitching, initializeBroker])

    // Reset state when wallet disconnects (or on initial load without wallet)
    useEffect(() => {
        if (!isConnected) {
            setBroker(null)
            setLedgerInfo(null)
            setError(null)
            setIsInitializing(false)
            setIsChainSwitching(false)
        }
    }, [isConnected])

    // Track current chainId to detect changes (useRef to avoid extra renders)
    const currentChainIdRef = useRef<number | undefined>(chainId)

    // Update cache with current chain
    useEffect(() => {
        setCurrentChainInCache(chainId)
    }, [chainId])

    // Reset broker and reinitialize when chain changes
    useEffect(() => {
        const prevChainId = currentChainIdRef.current

        if (prevChainId !== undefined && chainId !== prevChainId && isConnected && walletClient) {
            setIsChainSwitching(true)

            setLedgerInfo(null)
            setBroker(null)
            setError(null)

            clearChainCache(prevChainId)

            currentChainIdRef.current = chainId

            const reinitialize = async () => {
                try {
                    await initializeBroker()
                } catch (err) {
                    console.error('Failed to reinitialize broker after chain switch:', err)
                } finally {
                    setIsChainSwitching(false)
                }
            }

            const timerId = setTimeout(reinitialize, 1000)

            return () => clearTimeout(timerId)
        } else if (prevChainId === undefined) {
            currentChainIdRef.current = chainId
        }
    }, [chainId, isConnected, walletClient, initializeBroker])

    const value = useMemo<BrokerContextValue>(() => ({
        broker,
        isInitializing,
        isChainSwitching,
        error,
        ledgerInfo,
        initializeBroker,
        refreshLedgerInfo,
        addLedger,
        depositFund,
    }), [broker, isInitializing, isChainSwitching, error, ledgerInfo,
         initializeBroker, refreshLedgerInfo, addLedger, depositFund])

    return (
        <BrokerContext.Provider value={value}>
            {children}
        </BrokerContext.Provider>
    )
}
