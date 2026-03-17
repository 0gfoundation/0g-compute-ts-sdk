import { BrokerBase } from './base'
import type { FineTuningServingContract } from '../contract'
import type { LedgerBroker } from '../../ledger'
import type { Provider } from '../provider/provider'
import { createHash } from 'crypto'
import { throwFormattedError } from '../../common/utils'

export interface AttestationReport {
    tcb_info?: Record<string, unknown>
    info?: {
        tcb_info?: Record<string, unknown>
    }
    event_log?: EventLogEntry[]
    report_data?: string
    [key: string]: unknown
}

export interface EventLogEntry {
    event: string
    event_payload?: string
    [key: string]: unknown
}

export interface ComposeVerificationResult {
    isValid: boolean
    error?: string
    calculatedHash?: string
    eventLogHash?: string
    composeHashEvent?: EventLogEntry
}

export interface VerificationStep {
    type: 'info' | 'success' | 'error' | 'warning' | 'step'
    message: string
}

export interface SignerReportMatch {
    reportType: string
    address: string
    match: boolean
}

export interface VerificationResult {
    success: boolean
    teeVerifier: string
    reportsGenerated: string[]
    outputDirectory: string
    reportsData?: {
        combined?: AttestationReport
    }
    signerVerification?: {
        contractAddress: string
        reportAddresses: SignerReportMatch[]
        allMatch: boolean
    }
    composeVerification?: {
        passed: boolean
        details: Record<string, { calculatedHash?: string; eventLogHash?: string; error?: string }>
    }
    dockerImages?: string[]
    steps?: VerificationStep[]
}

export interface VerificationSummary {
    composeVerification: boolean
    signerAddressVerification: boolean
    allVerificationsPassed: boolean
}

/**
 * Type guard to validate AttestationReport structure
 */
function isAttestationReport(obj: unknown): obj is AttestationReport {
    if (typeof obj !== 'object' || obj === null) {
        return false
    }

    const report = obj as Record<string, unknown>

    // Check for required fields
    const hasTcbInfo = 'tcb_info' in report
    const hasInfo = 'info' in report

    return hasTcbInfo || hasInfo
}

/**
 * The Verifier class contains methods for verifying fine-tuning service reliability.
 * This is a simplified version with the following limitations:
 * - Only supports DStack TEE verification (Intel TDX)
 * - Only supports combined architecture (broker and training in same TEE)
 * - Does not support separated architecture (unlike inference verification)
 * - Does not support CryptoPilot or other TEE verifiers
 *
 * @remarks
 * Fine-tuning verification is simpler because the entire training process
 * happens in a single TEE environment, unlike inference which may separate
 * broker and LLM components.
 *
 * NOTE: This verification method returns structured VerificationResult data.
 * Callers can provide an onLog callback for real-time step-by-step output.
 * All verification steps are also available in VerificationResult.steps.
 */
export class Verifier extends BrokerBase {
    constructor(
        contract: FineTuningServingContract,
        ledger: LedgerBroker,
        servingProvider: Provider
    ) {
        super(contract, ledger, servingProvider)
    }

    /**
     * Verify fine-tuning service TEE attestation (DStack only)
     *
     * @param providerAddress - The provider address to verify
     * @param outputDir - Directory to save attestation reports (default: current directory)
     * @param onLog - Optional callback for real-time step-by-step output
     * @returns Verification results with structured data and all log steps
     */
    async verifyService(
        providerAddress: string,
        outputDir: string = '.',
        onLog?: (step: VerificationStep) => void
    ): Promise<VerificationResult> {
        const steps: VerificationStep[] = []
        const log = (type: VerificationStep['type'], message: string) => {
            const step: VerificationStep = { type, message }
            steps.push(step)
            onLog?.(step)
        }

        try {
            log('step', `🔍 Starting TEE verification for fine-tuning provider: ${providerAddress}`)
            log('info', '')

            // Step 1: Get service information from contract
            log('step', '📋 Step 1: Retrieving service information from contract...')
            const service = await this.contract.getService(providerAddress)

            log('info', `   Provider URL: ${service.url}`)
            log('info', `   TEE Verifier: dstack (Intel TDX)`)
            log('info', '   Verification Method: DStack TEE (Intel TDX)')
            log('info', '   Verification includes: Quote validation, Compose hash check, Image integrity')
            log('info', '   Required Reports: 1')
            log('info', '')

            // Step 2: Get attestation report
            log('step', '📥 Step 2: Downloading attestation report...')
            const { rawReport } = await this.servingProvider.getQuote(
                providerAddress
            )

            if (!rawReport) {
                throw new Error('Failed to get quote from provider')
            }

            const reportPath = `${outputDir}/fine_tuning_attestation_report.json`
            await this.saveReportToFile(rawReport, reportPath)

            // Parse and validate report structure
            const reportObj = JSON.parse(rawReport)
            if (!isAttestationReport(reportObj)) {
                throw new Error('Invalid attestation report format')
            }
            const report = reportObj

            log('success', `   ✅ Attestation report saved to: ${reportPath}`)
            log('info', '')

            // Step 3: TEE Signer Address Verification
            log('step', '🔑 Step 3: TEE Signer Address Verification')
            log('info', `   Contract TEE Signer Address: ${service.teeSignerAddress}`)

            const reportSignerAddress = this.extractTeeSignerAddress(report)
            const reportAddresses: SignerReportMatch[] = []
            let signerMatches = false
            if (reportSignerAddress) {
                signerMatches =
                    reportSignerAddress.toLowerCase() ===
                    service.teeSignerAddress.toLowerCase()
                log('info', `   Report Signer Address: ${reportSignerAddress}`)
                log(
                    signerMatches ? 'success' : 'error',
                    `   Address Match: ${signerMatches ? '✅ MATCH' : '❌ MISMATCH'}`
                )

                reportAddresses.push({
                    reportType: 'combined',
                    address: reportSignerAddress,
                    match: signerMatches,
                })

                if (!signerMatches) {
                    log('warning', `   ⚠️  Warning: TEE signer address mismatch detected!`)
                }
            } else {
                log('info', `   Report: No signer address found`)
            }
            log('info', '')

            // Step 4: DStack Verification
            log('step', '🔍 Step 4: DStack Verification Process')
            const { images, composeVerificationPassed, composeDetails } =
                await this.processDStackVerification(report, log)
            log('info', '')

            // Verification Summary
            const verificationSummary: VerificationSummary = {
                composeVerification: composeVerificationPassed,
                signerAddressVerification: signerMatches,
                allVerificationsPassed:
                    composeVerificationPassed && signerMatches,
            }

            log('step', '📋 Automated Verification Summary')
            log(
                verificationSummary.composeVerification ? 'success' : 'error',
                `   Docker Compose Verification: ${
                    verificationSummary.composeVerification
                        ? '✅ PASSED'
                        : '❌ FAILED'
                }`
            )
            log(
                verificationSummary.signerAddressVerification ? 'success' : 'error',
                `   TEE Signer Address Verification: ${
                    verificationSummary.signerAddressVerification
                        ? '✅ PASSED'
                        : '❌ FAILED'
                }`
            )
            log('info', '')
            log('info', '🎯 ============================================================================')
            log('info', '🎯  AUTOMATED VERIFICATION CHECKS HAVE BEEN COMPLETED')
            log('info', '🎯  Please continue with the manual verification steps below to complete')
            log('info', '🎯  the full verification process.')
            log('info', '🎯 ============================================================================')
            log('info', '')

            // Step 5: Image verification guidance
            log('step', '🖼️  Step 5: Image Verification')

            if (images.length > 0) {
                log('info', `   Images Extracted from Docker Compose (${images.length}):`)

                const brokerImages: string[] = []
                const otherImages: string[] = []

                images.forEach((image, index) => {
                    const isBroker =
                        image.includes('broker') || image.includes('0g-serving')

                    if (isBroker) {
                        brokerImages.push(image)
                        log('info', `     ${index + 1}. ${image} (0G Broker)`)
                    } else {
                        otherImages.push(image)
                        log('info', `     ${index + 1}. ${image}`)
                    }
                })

                log('info', '')

                if (brokerImages.length > 0) {
                    log('info', '   To verify 0G broker image integrity:')
                    log('info', '   1. The broker image address has been extracted from the report')
                    log('info', '   2. Visit: https://github.com/0gfoundation/0g-serving-broker/releases')
                    log('info', '   3. Find the compute network broker image with matching Digest (SHA256)')
                    log('info', '   4. Verify the build process at: https://search.sigstore.dev/')
                    log('info', '')
                }

                if (otherImages.length > 0) {
                    log('info', `   Note: Please verify the other images (${otherImages.join(', ')}) according to their respective sources`)
                    log('info', '')
                }
            } else {
                log('info', '   No images extracted from Docker Compose')
                log('info', '')
            }

            // Step 6: Verifier usage instructions
            log('step', '🛠️  Step 6: Run Verifier for Complete Verification')
            log('info', '')
            log('info', '   The DStack verifier performs three main verification steps:')
            log('info', '')
            log('info', '   1. Quote Verification:')
            log('info', '      - Validates the TDX quote using dcap-qvl')
            log('info', '      - Checks the quote signature and TCB status')
            log('info', '')
            log('info', '   2. Event Log Verification:')
            log('info', '      - Replays event logs to ensure RTMR values match')
            log('info', '      - Extracts app information from the logs')
            log('info', '')
            log('info', '   3. OS Image Hash Verification:')
            log('info', '      - Automatically downloads OS images if not cached locally')
            log('info', '      - Uses dstack-mr to compute expected measurements')
            log('info', '      - Compares against the verified measurements from the quote')
            log('info', '')
            log('info', '   Usage Instructions:')
            log('info', '')
            log('info', '   1. Start the verifier service locally (example with dstack-verifier:0.5.4):')
            log('info', '      docker run -d -p 8080:8080 docker.io/dstacktee/dstack-verifier:0.5.4')
            log('info', '')
            log('info', '   2. Verify the downloaded attestation report:')
            log('info', `      curl -s -d @${outputDir}/fine_tuning_attestation_report.json localhost:8080/verify`)
            log('info', '')

            return {
                success: true,
                teeVerifier: 'dstack',
                reportsGenerated: ['combined'],
                outputDirectory: outputDir,
                reportsData: { combined: report },
                signerVerification: {
                    contractAddress: service.teeSignerAddress,
                    reportAddresses,
                    allMatch: signerMatches,
                },
                composeVerification: {
                    passed: composeVerificationPassed,
                    details: composeDetails,
                },
                dockerImages: images,
                steps,
            }
        } catch (error) {
            log('error', `❌ TEE verification failed: ${error}`)
            throwFormattedError(error)
        }
    }

    /**
     * Extract TEE signer address from attestation report
     */
    private extractTeeSignerAddress(report: AttestationReport): string | null {
        try {
            const reportData = report.report_data
            if (!reportData) {
                return null
            }

            // Decode the base64 report_data to get the signer address
            const decodedData = Buffer.from(reportData, 'base64').toString(
                'utf-8'
            )
            // Remove NULL characters that pad the address
            const signingAddress = decodedData.replace(/\0/g, '')

            return signingAddress || null
        } catch {
            return null
        }
    }

    /**
     * Process DStack-specific verification steps
     */
    private async processDStackVerification(
        report: AttestationReport,
        log: (type: VerificationStep['type'], message: string) => void
    ): Promise<{
        images: string[]
        composeVerificationPassed: boolean
        composeDetails: Record<string, { calculatedHash?: string; eventLogHash?: string; error?: string }>
    }> {
        log('info', `   Processing attestation report...`)

        if (!(report.tcb_info || report.info?.tcb_info) || !report.event_log) {
            log('warning', `   ⚠️  Warning: report missing tcb_info or event_log`)
            return { images: [], composeVerificationPassed: false, composeDetails: {} }
        }

        try {
            // Parse tcb_info if it's a string
            let tcbInfo: Record<string, unknown>
            if (typeof report.tcb_info === 'string') {
                tcbInfo = JSON.parse(report.tcb_info) as Record<string, unknown>
            } else {
                tcbInfo =
                    report.tcb_info ||
                    (report.info?.tcb_info as Record<string, unknown>)
            }

            // Parse event_log if it's a string
            let eventLog: EventLogEntry[]
            if (typeof report.event_log === 'string') {
                eventLog = JSON.parse(report.event_log) as EventLogEntry[]
            } else if (Array.isArray(report.event_log)) {
                eventLog = report.event_log
            } else {
                log('warning', `   ⚠️  Warning: event_log is not in expected format`)
                return { images: [], composeVerificationPassed: false, composeDetails: {} }
            }

            // Verify compose hash against event log
            const composeResult = this.verifyComposeHash(tcbInfo, eventLog)

            const composeDetails: Record<string, { calculatedHash?: string; eventLogHash?: string; error?: string }> = {
                combined: {
                    calculatedHash: composeResult.calculatedHash,
                    eventLogHash: composeResult.eventLogHash,
                    error: composeResult.error,
                },
            }

            log('info', `   Docker Compose Verification:`)

            if (composeResult.calculatedHash) {
                log('info', `     Calculated Hash: ${composeResult.calculatedHash}`)
            }
            if (composeResult.eventLogHash) {
                log('info', `     Event Log Hash:  ${composeResult.eventLogHash}`)
            }
            log(
                composeResult.isValid ? 'success' : 'error',
                `     Status: ${composeResult.isValid ? '✅ VALID' : '❌ INVALID'}`
            )

            if (!composeResult.isValid && composeResult.error) {
                log('error', `     Error: ${composeResult.error}`)
            }

            // Extract all images from tcb_info
            const images = this.extractAllImagesFromTcbInfo(tcbInfo)

            return {
                images,
                composeVerificationPassed: composeResult.isValid,
                composeDetails,
            }
        } catch (error) {
            log('warning', `   ⚠️  Error processing report: ${error}`)
            return { images: [], composeVerificationPassed: false, composeDetails: {} }
        }
    }

    /**
     * Verify compose hash based on the dstack verification logic
     */
    private verifyComposeHash(
        tcbInfo: Record<string, unknown>,
        eventLog: EventLogEntry[]
    ): ComposeVerificationResult {
        try {
            if (!tcbInfo.app_compose) {
                return {
                    isValid: false,
                    error: 'app_compose not found in tcb_info',
                }
            }

            // Hash the app_compose JSON string
            const composeHash = createHash('sha256')
                .update(tcbInfo.app_compose as string)
                .digest('hex')

            // Find compose-hash event in the event log
            const composeHashEvent = eventLog.find(
                (entry) => entry.event === 'compose-hash'
            )

            if (!composeHashEvent) {
                return {
                    isValid: false,
                    error: 'No compose-hash event found in event log',
                    calculatedHash: composeHash,
                }
            }

            const expectedHash = composeHashEvent.event_payload
            return {
                isValid: composeHash === expectedHash,
                calculatedHash: composeHash,
                eventLogHash: expectedHash,
                composeHashEvent,
            }
        } catch (error) {
            return {
                isValid: false,
                error: `Compose hash verification failed: ${error}`,
            }
        }
    }

    /**
     * Extract all Docker images from tcb_info
     */
    private extractAllImagesFromTcbInfo(
        tcbInfo: Record<string, unknown>
    ): string[] {
        try {
            const images: string[] = []
            const tcbString = JSON.stringify(tcbInfo)

            // Match various image patterns in docker-compose format
            const imageMatches = tcbString.match(/"image"\s*:\s*"([^"]+)"/g)

            if (imageMatches) {
                for (const match of imageMatches) {
                    const imageMatch = match.match(/"image"\s*:\s*"([^"]+)"/)
                    if (imageMatch && imageMatch[1]) {
                        const imageAddr = imageMatch[1].trim()
                        if (!images.includes(imageAddr)) {
                            images.push(imageAddr)
                        }
                    }
                }
            }

            // Also try alternative pattern
            const altImageMatches = tcbString.match(/image:\s*([^",\s\}]+)/g)
            if (altImageMatches) {
                for (const match of altImageMatches) {
                    const imageAddr = match.replace(/^image:\s*/, '').trim()
                    const cleanAddr = imageAddr.replace(/["']/g, '')
                    if (cleanAddr && !images.includes(cleanAddr)) {
                        images.push(cleanAddr)
                    }
                }
            }

            return images
        } catch {
            return []
        }
    }

    /**
     * Check if running in browser environment
     */
    private isBrowser(): boolean {
        return typeof window !== 'undefined' && typeof document !== 'undefined'
    }

    /**
     * Save report to file (Node.js only)
     */
    private async saveReportToFile(
        reportContent: string,
        filePath: string
    ): Promise<void> {
        if (this.isBrowser()) {
            return
        }

        const fs = await import('fs/promises')
        await fs.writeFile(filePath, reportContent, 'utf8')
    }
}
