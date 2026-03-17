import type { TdxQuoteResponse } from './base'
import { ZGServingUserBrokerBase } from './base'
import { ethers } from 'ethers'
import { throwFormattedError } from '../../common/utils'
import type { InferenceServingContract } from '../contract'
import type { LedgerBroker } from '../../ledger'
import type { Cache, Metadata } from '../../common/storage'
import { createHash } from 'crypto'

export interface ResponseSignature {
    text: string
    signature: string
}

export interface SingerRAVerificationResult {
    /**
     * Whether the signer RA is valid
     * null means the RA has not been verified
     */
    valid: boolean | null
    /**
     * The signing address of the signer
     */
    signingAddress: string
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
    targetSeparated: boolean
    verifierURL?: string
    reportsGenerated: string[]
    outputDirectory: string
    reportsData?: {
        broker?: AttestationReport
        llm?: AttestationReport
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

export interface AdditionalInfo {
    VerifierURL?: string
    TargetSeparated?: boolean
    TEEVerifier?: string
    TargetTeeAddress?: string
    ImageName?: string
    ImageDigest?: string
}

export interface AttestationReport {
    tcb_info?: Record<string, unknown>
    info?: {
        tcb_info?: Record<string, unknown>
    }
    event_log?: EventLogEntry[]
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

export interface VerificationSummary {
    composeVerification: boolean
    signerAddressVerification: boolean
    signerAddressMatches: number
    totalReports: number
    allVerificationsPassed: boolean
}

/**
 * The Verifier class contains methods for verifying service reliability.
 */
export class Verifier extends ZGServingUserBrokerBase {
    constructor(
        contract: InferenceServingContract,
        ledger: LedgerBroker,
        metadata: Metadata,
        cache: Cache
    ) {
        super(contract, ledger, metadata, cache)
    }

    /**
     * Comprehensive TEE service verification guide
     * Guides users through verifying whether a provider is running in TEE
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
            log('step', `🔍 Starting TEE verification for provider: ${providerAddress}`)
            log('info', '')

            // Step 1: Get service information from contract
            log('step', '📋 Step 1: Retrieving service information from contract...')
            const svc = await this.getService(providerAddress)

            if (!svc.additionalInfo) {
                throw new Error(
                    'Service additionalInfo is missing - cannot proceed with verification'
                )
            }

            // Step 2: Parse additionalInfo and analyze service configuration
            log('step', '🔧 Step 2: Parsing and analyzing service configuration...')
            let additionalInfo: AdditionalInfo
            try {
                additionalInfo = JSON.parse(
                    svc.additionalInfo
                ) as AdditionalInfo
            } catch {
                throw new Error(
                    'Failed to parse service additionalInfo as JSON'
                )
            }

            const verifierURL = additionalInfo.VerifierURL
            const targetSeparated = additionalInfo.TargetSeparated === true
            const teeVerifier = additionalInfo.TEEVerifier || 'dstack' // default to dstack
            const imageName = additionalInfo.ImageName
            const imageDigest = additionalInfo.ImageDigest

            if (teeVerifier === 'dstack' && !verifierURL) {
                log('warning', '⚠️  Warning: VerifierURL not found in additionalInfo')
            }

            // Display service verification configuration
            log('info', `   Provider URL: ${svc.url}`)
            log('info', `   TEE Verifier: ${teeVerifier}`)
            if (imageName) {
                log('info', `   Image Name: ${imageName}`)
            }
            if (imageDigest) {
                log('info', `   Image Digest: ${imageDigest}`)
            }

            // TEE verification method information
            if (teeVerifier === 'dstack') {
                log('info', '   Verification Method: DStack TEE (Intel TDX)')
                log('info', '   Verification includes: Quote validation, Compose hash check, Image integrity')
            } else if (teeVerifier === 'cryptopilot') {
                log('info', '   Verification Method: CryptoPilot TEE')
                log('info', '   Please follow the official documentation to verify the downloaded attestation report.')
                log('info', '   Official documentation: https://github.com/0gfoundation/0g-tapp-verifier/blob/main/README.md')
            } else {
                log('info', `   Verification Method: Unknown (${teeVerifier})`)
            }

            // Component architecture information
            if (targetSeparated) {
                log('info', '   Architecture: Separated (Broker and LLM inference in different TEE nodes)')
                log('info', '   Required Reports: 2 (Broker + LLM inference)')
            } else {
                log('info', '   Architecture: Combined (Broker and LLM inference in same TEE node)')
                log('info', '   Required Reports: 1 (Combined)')
            }

            if (verifierURL) {
                log('info', `   Verifier Image URL: ${verifierURL}`)
            }
            log('info', '')

            // Step 3: Get attestation reports
            log('step', '📥 Step 3: Downloading attestation reports...')
            const reports: Record<string, AttestationReport> = {}

            if (targetSeparated) {
                // Get both broker and LLM reports
                log('info', '   Downloading broker attestation report...')
                const brokerReport = await this.getQuote(providerAddress)
                const brokerPath = `${outputDir}/broker_attestation_report.json`
                await this.saveReportToFile(brokerReport.rawReport, brokerPath)
                reports.broker = JSON.parse(
                    brokerReport.rawReport
                ) as AttestationReport
                log('success', `   ✅ Broker report saved to: ${brokerPath}`)

                log('info', '   Downloading LLM inference attestation report...')
                const llmReport = await this.getQuoteInLLMServer(
                    svc.url,
                    svc.model
                )
                const llmPath = `${outputDir}/llm_attestation_report.json`
                await this.saveReportToFile(llmReport.rawReport, llmPath)
                reports.llm = JSON.parse(
                    llmReport.rawReport
                ) as AttestationReport
                log('success', `   ✅ LLM report saved to: ${llmPath}`)
            } else {
                // Get single combined report via broker
                log('info', '   Downloading combined attestation report...')
                const combinedReport = await this.getQuote(providerAddress)
                const combinedPath = `${outputDir}/attestation_report.json`
                await this.saveReportToFile(
                    combinedReport.rawReport,
                    combinedPath
                )
                reports.combined = JSON.parse(
                    combinedReport.rawReport
                ) as AttestationReport
                log('success', `   ✅ Combined report saved to: ${combinedPath}`)
            }
            log('info', '')

            // If cryptopilot, return after step 3
            if (teeVerifier === 'cryptopilot') {
                return {
                    success: true,
                    teeVerifier,
                    targetSeparated,
                    verifierURL,
                    reportsGenerated: Object.keys(reports),
                    outputDirectory: outputDir,
                    reportsData: reports,
                    signerVerification: {
                        contractAddress: svc.teeSignerAddress,
                        reportAddresses: [],
                        allMatch: false,
                    },
                    composeVerification: {
                        passed: false,
                        details: {},
                    },
                    dockerImages: [],
                    steps,
                }
            }

            // Step 4: TEE Signer Address Verification
            log('step', '🔑 Step 4: TEE Signer Address Verification')
            log('info', `   Contract TEE Signer Address: ${svc.teeSignerAddress}`)

            // Extract signer addresses from reports and verify
            const reportAddresses: SignerReportMatch[] = []
            let signerMatches = 0
            let totalSignerChecks = 0
            for (const [reportType, report] of Object.entries(reports)) {
                if (reportType === 'llm') {
                    continue
                }

                const reportSignerAddress = this.extractTeeSignerAddress(report)
                if (reportSignerAddress) {
                    totalSignerChecks++
                    const addressMatch =
                        reportSignerAddress.toLowerCase() ===
                        svc.teeSignerAddress.toLowerCase()
                    const label = reportType.charAt(0).toUpperCase() + reportType.slice(1)
                    log('info', `   ${label} Report Signer: ${reportSignerAddress}`)
                    log(
                        addressMatch ? 'success' : 'error',
                        `   Address Match: ${addressMatch ? '✅ MATCH' : '❌ MISMATCH'}`
                    )

                    reportAddresses.push({
                        reportType,
                        address: reportSignerAddress,
                        match: addressMatch,
                    })

                    if (addressMatch) {
                        signerMatches++
                    } else {
                        log('warning', `   ⚠️  Warning: TEE signer address mismatch detected!`)
                    }
                } else {
                    const label = reportType.charAt(0).toUpperCase() + reportType.slice(1)
                    log('info', `   ${label} Report: No signer address found`)
                }
            }
            log('info', '')

            const signerAllMatch = signerMatches === totalSignerChecks && totalSignerChecks > 0

            // Step 5: Process DStack verification if applicable
            let dockerImages: string[] = []
            let composeVerificationPassed = false
            let composeDetails: Record<string, { calculatedHash?: string; eventLogHash?: string; error?: string }> = {}
            if (teeVerifier === 'dstack') {
                log('step', '🔍 Step 5: DStack Verification Process')
                const result = await this.processDStackVerification(reports, log)
                dockerImages = result.images
                composeVerificationPassed = result.composeVerificationPassed
                composeDetails = result.composeDetails
            } else if (teeVerifier === 'cryptopilot') {
                log('step', '🔍 Step 5: CryptoPilot Verification Process')
                log('warning', '   ⚠️  CryptoPilot verification is not yet implemented.')
                log('info', '   Please refer to CryptoPilot documentation for manual verification.')
                composeVerificationPassed = false
            }
            log('info', '')

            // Verification Summary
            const verificationSummary: VerificationSummary = {
                composeVerification: composeVerificationPassed,
                signerAddressVerification: signerAllMatch,
                signerAddressMatches: signerMatches,
                totalReports: totalSignerChecks,
                allVerificationsPassed:
                    composeVerificationPassed && signerAllMatch,
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
                } (${verificationSummary.signerAddressMatches}/${
                    verificationSummary.totalReports
                } matches)`
            )
            log('info', '')
            log('info', '🎯 ============================================================================')
            log('info', '🎯  AUTOMATED VERIFICATION CHECKS HAVE BEEN COMPLETED')
            log('info', '🎯  Please continue with the manual verification steps below to complete')
            log('info', '🎯  the full verification process.')
            log('info', '🎯 ============================================================================')
            log('info', '')

            // Step 6: Image verification guidance
            log('step', '🖼️  Step 6: Image Verification')

            // Display found Docker images
            if (dockerImages.length > 0) {
                log('info', `   Images Extracted from Docker Compose (${dockerImages.length}):`)

                const brokerImages: string[] = []
                const otherImages: string[] = []

                dockerImages.forEach((image, index) => {
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

                // Show broker verification guidance only if broker images are found
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

            // Step 7: Download and verify the verifier image
            if (verifierURL) {
                log('step', '🔐 Step 7: Download and Verify the Verifier Image')
                log('info', '')
                log('info', '   The verifier image will be used in Step 8 to perform comprehensive verification.')
                log('info', '   Before using it, we need to ensure the verifier itself has a verifiable build process.')
                log('info', '')
                log('info', `   Verifier image download URL: ${verifierURL}`)
                log('info', '   To verify the verifier image:')
                log('info', '   1. Download the verifier image from the provided URL')
                log('info', '   2. Get the image hash/digest')
                log('info', '   3. Verify the build process at: https://search.sigstore.dev/')
                log('info', '')
            }

            // Step 8: Verifier usage instructions
            log('step', '🛠️  Step 8: Run Verifier for Complete Verification')

            if (teeVerifier === 'dstack') {
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
                log('info', '   2. Verify the downloaded attestation report(s):')

                // Show specific commands based on whether components are separated
                if (targetSeparated) {
                    log('info', '      # Verify broker attestation report')
                    log('info', `      curl -s -d @${outputDir}/broker_attestation_report.json localhost:8080/verify`)
                    log('info', '')
                    log('info', '      # Verify LLM attestation report')
                    log('info', `      curl -s -d @${outputDir}/llm_attestation_report.json localhost:8080/verify`)
                } else {
                    log('info', `      curl -s -d @${outputDir}/attestation_report.json localhost:8080/verify`)
                }
                log('info', '')
            } else if (teeVerifier === 'cryptopilot') {
                log('info', '')
                log('info', '   The CryptoPilot verifier verification process:')
                log('info', '   [CryptoPilot verifier details to be implemented]')
                log('info', '')
            } else {
                log('info', '')
                log('info', '   [Verifier usage instructions for this TEE type]')
            }

            return {
                success: true,
                teeVerifier,
                targetSeparated,
                verifierURL,
                reportsGenerated: Object.keys(reports),
                outputDirectory: outputDir,
                reportsData: reports,
                signerVerification: {
                    contractAddress: svc.teeSignerAddress,
                    reportAddresses,
                    allMatch: signerAllMatch,
                },
                composeVerification: {
                    passed: composeVerificationPassed,
                    details: composeDetails,
                },
                dockerImages,
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
            // Check if report_data exists in the report
            const reportData = (report as any).report_data
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
        reports: Record<string, AttestationReport>,
        log: (type: VerificationStep['type'], message: string) => void
    ): Promise<{
        images: string[]
        composeVerificationPassed: boolean
        composeDetails: Record<string, { calculatedHash?: string; eventLogHash?: string; error?: string }>
    }> {
        const allImages: string[] = []
        let composeVerificationCount = 0
        let passedComposeVerifications = 0
        const composeDetails: Record<string, { calculatedHash?: string; eventLogHash?: string; error?: string }> = {}

        for (const [reportType, report] of Object.entries(reports)) {
            log('info', `   Processing ${reportType} report...`)

            if (
                !(report.tcb_info || report.info?.tcb_info) ||
                !report.event_log
            ) {
                log('warning', `   ⚠️  Warning: ${reportType} report missing tcb_info or event_log`)
                continue
            }

            try {
                // Parse tcb_info if it's a string
                let tcbInfo: Record<string, unknown>
                if (typeof report.tcb_info === 'string') {
                    tcbInfo = JSON.parse(report.tcb_info) as Record<
                        string,
                        unknown
                    >
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
                    continue
                }

                // Verify compose hash against event log
                const composeResult = this.verifyComposeHash(tcbInfo, eventLog)
                composeVerificationCount++
                if (composeResult.isValid) {
                    passedComposeVerifications++
                }

                composeDetails[reportType] = {
                    calculatedHash: composeResult.calculatedHash,
                    eventLogHash: composeResult.eventLogHash,
                    error: composeResult.error,
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

                // Extract all images from tcb_info for later processing
                const images = this.extractAllImagesFromTcbInfo(tcbInfo)
                images.forEach((image) => {
                    if (!allImages.includes(image)) {
                        allImages.push(image)
                    }
                })
            } catch (error) {
                log('warning', `   ⚠️  Error processing ${reportType} report: ${error}`)
            }
        }

        const composeVerificationPassed =
            composeVerificationCount > 0 &&
            passedComposeVerifications === composeVerificationCount
        return {
            images: allImages,
            composeVerificationPassed,
            composeDetails,
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
            // Pattern 1: image: <image-address>
            const imageMatches = tcbString.match(/"image"\s*:\s*"([^"]+)"/g)

            if (imageMatches) {
                for (const match of imageMatches) {
                    // Extract the image address from the match
                    const imageMatch = match.match(/"image"\s*:\s*"([^"]+)"/)
                    if (imageMatch && imageMatch[1]) {
                        const imageAddr = imageMatch[1].trim()
                        // Avoid duplicates
                        if (!images.includes(imageAddr)) {
                            images.push(imageAddr)
                        }
                    }
                }
            }

            // Also try alternative pattern without quotes around key
            const altImageMatches = tcbString.match(/image:\s*([^",\s\}]+)/g)
            if (altImageMatches) {
                for (const match of altImageMatches) {
                    const imageAddr = match.replace(/^image:\s*/, '').trim()
                    // Remove any trailing quotes if present
                    const cleanAddr = imageAddr.replace(/["']/g, '')
                    // Avoid duplicates
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
     * In browser environment, this is a no-op
     */
    private async saveReportToFile(
        reportContent: string,
        filePath: string
    ): Promise<void> {
        // Skip file saving in browser environment
        if (this.isBrowser()) {
            return
        }

        const fs = await import('fs/promises')
        await fs.writeFile(filePath, reportContent, 'utf8')
    }

    async getSignerRaDownloadLink(providerAddress: string): Promise<string> {
        try {
            const svc = await this.getService(providerAddress)
            return `${svc.url}/v1/proxy/attestation/report`
        } catch (error) {
            throwFormattedError(error)
        }
    }

    async getChatSignatureDownloadLink(
        providerAddress: string,
        chatID: string
    ): Promise<string> {
        try {
            const svc = await this.getService(providerAddress)
            return `${svc.url}/v1/proxy/signature/${chatID}`
        } catch (error) {
            throwFormattedError(error)
        }
    }

    static async verifyRA(
        providerBrokerURL: string,
        nvidia_payload: Record<string, unknown>
    ): Promise<boolean> {
        return fetch(`${providerBrokerURL}/v1/quote/verify/gpu`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(nvidia_payload),
        })
            .then((response) => {
                if (response.status === 200) {
                    return true
                }
                if (response.status === 404) {
                    throw new Error('verify RA error: 404')
                } else {
                    return false
                }
            })
            .catch((error) => {
                if (error instanceof Error) {
                    console.error(error.message)
                }
                return false
            })
    }

    async getQuoteInLLMServer(
        providerBrokerURL: string,
        model: string
    ): Promise<TdxQuoteResponse> {
        try {
            const rawReport = await this.fetchText(
                `${providerBrokerURL}/v1/proxy/attestation/report?model=${model}`,
                {
                    method: 'GET',
                }
            )
            const ret = JSON.parse(rawReport)
            return {
                rawReport,
                signingAddress: ret['signing_address'],
            } as TdxQuoteResponse
        } catch (error) {
            throwFormattedError(error)
        }
    }

    static async fetchSignatureByChatID(
        providerBrokerURL: string,
        chatID: string,
        model: string
    ): Promise<ResponseSignature> {
        return fetch(
            `${providerBrokerURL}/v1/proxy/signature/${chatID}?model=${model}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
            .then((response) => {
                if (!response.ok) {
                    throw new Error('getting signature error')
                }
                return response.json()
            })
            .then((data) => {
                return data as ResponseSignature
            })
            .catch((error) => {
                throwFormattedError(error)
            })
    }

    static verifySignature(
        message: string,
        signature: string,
        expectedAddress: string
    ): boolean {
        const messageHash = ethers.hashMessage(message)

        const recoveredAddress = ethers.recoverAddress(messageHash, signature)

        return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase()
    }
}
