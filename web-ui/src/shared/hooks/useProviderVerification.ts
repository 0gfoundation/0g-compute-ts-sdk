/**
 * Provider TEE Verification Hook (Web-friendly)
 *
 * This hook uses SDK's verifyService method with the onLog callback for
 * real-time step-by-step output and structured result data.
 */

import { useCallback, useState } from 'react'
import { useBroker } from '../providers/BrokerProvider'

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
    const { broker } = useBroker()
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
            let signerMatches = 0
            let totalSignerChecks = 0

            try {
                // Call SDK's verifyService with onLog callback for real-time output
                const result = await broker.inference.verifyService(
                    providerAddress,
                    '.', // outputDir (not used in browser)
                    (step) => addLog(step.type, step.message)
                )

                if (!result) {
                    throw new Error('Verification returned null result')
                }

                // Extract data from SDK result
                success = result.success
                teeVerifier = result.teeVerifier
                targetSeparated = result.targetSeparated
                verifierURL = result.verifierURL

                // Extract signer verification data from structured result
                if (result.signerVerification) {
                    totalSignerChecks = result.signerVerification.reportAddresses.length
                    signerMatches = result.signerVerification.reportAddresses.filter(
                        (r) => r.match
                    ).length
                }

                // Convert SDK report data to our format for download
                const reportsData = result.reportsData
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
                    signerMatches,
                    totalSignerChecks,
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
