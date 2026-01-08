/**
 * Provider TEE Verification Hook (Web-friendly)
 *
 * This hook directly uses SDK's verifyService method which now supports browser environment.
 * The SDK automatically skips file saving in browser and returns report data.
 */

import { useCallback, useState } from 'react'
import { use0GBroker } from './use0GBroker'

export interface VerificationLog {
    timestamp: number
    type: 'info' | 'success' | 'error' | 'warning' | 'step'
    message: string
}

export interface VerificationReport {
    name: string
    content: Record<string, unknown>
    fileName: string
}

export interface VerificationResult {
    success: boolean
    logs: VerificationLog[]
    reports: VerificationReport[]
    summary: {
        teeVerifier: string
        targetSeparated: boolean
        verifierURL?: string
        signerMatches: number
        totalSignerChecks: number
    }
}

export function useProviderVerification() {
    const { broker } = use0GBroker()
    const [isVerifying, setIsVerifying] = useState(false)
    const [logs, setLogs] = useState<VerificationLog[]>([])

    const addLog = useCallback(
        (type: VerificationLog['type'], message: string) => {
            const log: VerificationLog = {
                timestamp: Date.now(),
                type,
                message,
            }
            setLogs((prev) => [...prev, log])
        },
        []
    )

    const verifyProvider = useCallback(
        async (providerAddress: string): Promise<VerificationResult> => {
            if (!broker) {
                throw new Error(
                    'Broker not initialized. Please connect your wallet.'
                )
            }

            setIsVerifying(true)
            setLogs([])

            const reports: VerificationReport[] = []
            let success = false
            let teeVerifier = ''
            let targetSeparated = false
            let verifierURL: string | undefined

            // Intercept console.log to capture SDK logs
            const originalLog = console.log
            const originalError = console.error
            const originalWarn = console.warn

            const captureLog = (...args: any[]) => {
                const message = args.join(' ')

                // Parse log type from message
                if (message.startsWith('📋') || message.startsWith('🔧') || message.startsWith('📥') || message.startsWith('🔑')) {
                    addLog('step', message)
                } else if (message.includes('✅')) {
                    addLog('success', message.replace(/^ {3}/, ''))
                } else if (message.includes('⚠️') || message.includes('Warning')) {
                    addLog('warning', message.replace(/^ {3}/, ''))
                } else if (message.includes('❌')) {
                    addLog('error', message.replace(/^ {3}/, ''))
                } else if (message.startsWith('   ')) {
                    addLog('info', message.replace(/^ {3}/, ''))
                } else {
                    addLog('info', message)
                }

                // Also call original log for debugging
                originalLog(...args)
            }

            const captureError = (...args: any[]) => {
                const message = args.join(' ')
                addLog('error', message)
                originalError(...args)
            }

            const captureWarn = (...args: any[]) => {
                const message = args.join(' ')
                addLog('warning', message)
                originalWarn(...args)
            }

            // Replace console methods
            console.log = captureLog
            console.error = captureError
            console.warn = captureWarn

            try {
                // Call SDK's verifyService method directly
                // The SDK will output logs via console which we intercept
                const result = await broker.inference.verifyService(
                    providerAddress,
                    '.' // outputDir (not used in browser)
                )

                if (!result) {
                    throw new Error('Verification returned null result')
                }

                // Extract data from SDK result
                success = result.success
                teeVerifier = result.teeVerifier
                targetSeparated = result.targetSeparated
                verifierURL = result.verifierURL

                // Convert SDK report data to our format for download
                const reportsData = (result as any).reportsData
                if (reportsData) {
                    if (reportsData.broker) {
                        reports.push({
                            name: 'Broker Attestation Report',
                            content: reportsData.broker,
                            fileName: 'broker_attestation_report.json',
                        })
                    }
                    if (reportsData.llm) {
                        reports.push({
                            name: 'LLM Attestation Report',
                            content: reportsData.llm,
                            fileName: 'llm_attestation_report.json',
                        })
                    }
                    if (reportsData.combined) {
                        reports.push({
                            name: 'Combined Attestation Report',
                            content: reportsData.combined,
                            fileName: 'attestation_report.json',
                        })
                    }
                }

                // Add final summary
                addLog('step', '📊 Verification Summary')
                addLog('info', `Total reports downloaded: ${reports.length}`)
                if (success) {
                    addLog('success', '✅ Provider verification PASSED')
                } else {
                    addLog('error', '❌ Provider verification FAILED')
                }
                addLog(
                    'info',
                    'You can download the attestation reports below for further analysis'
                )
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Unknown error occurred'
                addLog('error', `Verification failed: ${errorMessage}`)
                success = false
            } finally {
                // Restore original console methods
                console.log = originalLog
                console.error = originalError
                console.warn = originalWarn

                setIsVerifying(false)
            }

            return {
                success,
                logs,
                reports,
                summary: {
                    teeVerifier,
                    targetSeparated,
                    verifierURL,
                    signerMatches: 0, // SDK handles this internally
                    totalSignerChecks: 0, // SDK handles this internally
                },
            }
        },
        [broker, addLog]
    )

    return {
        isVerifying,
        logs,
        verifyProvider,
    }
}
