"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Verifier = void 0;
const base_1 = require("./base");
const crypto_1 = require("crypto");
const utils_1 = require("../../common/utils");
/**
 * Type guard to validate AttestationReport structure
 */
function isAttestationReport(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }
    const report = obj;
    // Check for required fields
    const hasTcbInfo = 'tcb_info' in report;
    const hasInfo = 'info' in report;
    return hasTcbInfo || hasInfo;
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
 * NOTE: This verification method uses console.log for user guidance.
 * This is consistent with the inference verifier and acceptable because
 * verification is primarily an interactive CLI operation. For programmatic
 * use, see VerificationResult.reportsData.
 */
class Verifier extends base_1.BrokerBase {
    constructor(contract, ledger, servingProvider) {
        super(contract, ledger, servingProvider);
    }
    /**
     * Verify fine-tuning service TEE attestation (DStack only)
     *
     * @param providerAddress - The provider address to verify
     * @param outputDir - Directory to save attestation reports (default: current directory)
     * @returns Verification results and user guidance
     */
    async verifyService(providerAddress, outputDir = '.') {
        try {
            console.log(`🔍 Starting TEE verification for fine-tuning provider: ${providerAddress}`);
            console.log('');
            // Step 1: Get service information from contract
            console.log('📋 Step 1: Retrieving service information from contract...');
            const service = await this.contract.getService(providerAddress);
            console.log(`   Provider URL: ${service.url}`);
            console.log(`   TEE Verifier: dstack (Intel TDX)`);
            console.log('   Verification Method: DStack TEE (Intel TDX)');
            console.log('   Verification includes: Quote validation, Compose hash check, Image integrity');
            console.log('   Required Reports: 1');
            console.log('');
            // Step 2: Get attestation report
            console.log('📥 Step 2: Downloading attestation report...');
            const { rawReport } = await this.servingProvider.getQuote(providerAddress);
            if (!rawReport) {
                throw new Error('Failed to get quote from provider');
            }
            const reportPath = `${outputDir}/fine_tuning_attestation_report.json`;
            await this.saveReportToFile(rawReport, reportPath);
            // Parse and validate report structure
            const reportObj = JSON.parse(rawReport);
            if (!isAttestationReport(reportObj)) {
                throw new Error('Invalid attestation report format');
            }
            const report = reportObj;
            console.log(`   ✅ Attestation report saved to: ${reportPath}`);
            console.log('');
            // Step 3: TEE Signer Address Verification
            console.log('🔑 Step 3: TEE Signer Address Verification');
            console.log(`   Contract TEE Signer Address: ${service.teeSignerAddress}`);
            const reportSignerAddress = this.extractTeeSignerAddress(report);
            let signerMatches = false;
            if (reportSignerAddress) {
                signerMatches =
                    reportSignerAddress.toLowerCase() ===
                        service.teeSignerAddress.toLowerCase();
                console.log(`   Report Signer Address: ${reportSignerAddress}`);
                console.log(`   Address Match: ${signerMatches ? '✅ MATCH' : '❌ MISMATCH'}`);
                if (!signerMatches) {
                    console.log(`   ⚠️  Warning: TEE signer address mismatch detected!`);
                }
            }
            else {
                console.log(`   Report: No signer address found`);
            }
            console.log('');
            // Step 4: DStack Verification
            console.log('🔍 Step 4: DStack Verification Process');
            const { images, composeVerificationPassed } = await this.processDStackVerification(report);
            console.log('');
            // Verification Summary
            const verificationSummary = {
                composeVerification: composeVerificationPassed,
                signerAddressVerification: signerMatches,
                allVerificationsPassed: composeVerificationPassed && signerMatches,
            };
            console.log('📋 Automated Verification Summary');
            console.log(`   Docker Compose Verification: ${verificationSummary.composeVerification
                ? '✅ PASSED'
                : '❌ FAILED'}`);
            console.log(`   TEE Signer Address Verification: ${verificationSummary.signerAddressVerification
                ? '✅ PASSED'
                : '❌ FAILED'}`);
            console.log('');
            console.log('🎯 ============================================================================');
            console.log('🎯  AUTOMATED VERIFICATION CHECKS HAVE BEEN COMPLETED');
            console.log('🎯  Please continue with the manual verification steps below to complete');
            console.log('🎯  the full verification process.');
            console.log('🎯 ============================================================================');
            console.log('');
            // Step 5: Image verification guidance
            console.log('🖼️  Step 5: Image Verification');
            if (images.length > 0) {
                console.log(`   Images Extracted from Docker Compose (${images.length}):`);
                const brokerImages = [];
                const otherImages = [];
                images.forEach((image, index) => {
                    const isBroker = image.includes('broker') || image.includes('0g-serving');
                    if (isBroker) {
                        brokerImages.push(image);
                        console.log(`     ${index + 1}. ${image} (0G Broker)`);
                    }
                    else {
                        otherImages.push(image);
                        console.log(`     ${index + 1}. ${image}`);
                    }
                });
                console.log('');
                if (brokerImages.length > 0) {
                    console.log('   To verify 0G broker image integrity:');
                    console.log('   1. The broker image address has been extracted from the report');
                    console.log('   2. Visit: https://github.com/0gfoundation/0g-serving-broker/releases');
                    console.log('   3. Find the compute network broker image with matching Digest (SHA256)');
                    console.log('   4. Verify the build process at: https://search.sigstore.dev/');
                    console.log('');
                }
                if (otherImages.length > 0) {
                    console.log(`   Note: Please verify the other images (${otherImages.join(', ')}) according to their respective sources`);
                    console.log('');
                }
            }
            else {
                console.log('   No images extracted from Docker Compose');
                console.log('');
            }
            // Step 6: Verifier usage instructions
            console.log('🛠️  Step 6: Run Verifier for Complete Verification');
            console.log('');
            console.log('   The DStack verifier performs three main verification steps:');
            console.log('');
            console.log('   1. Quote Verification:');
            console.log('      - Validates the TDX quote using dcap-qvl');
            console.log('      - Checks the quote signature and TCB status');
            console.log('');
            console.log('   2. Event Log Verification:');
            console.log('      - Replays event logs to ensure RTMR values match');
            console.log('      - Extracts app information from the logs');
            console.log('');
            console.log('   3. OS Image Hash Verification:');
            console.log('      - Automatically downloads OS images if not cached locally');
            console.log('      - Uses dstack-mr to compute expected measurements');
            console.log('      - Compares against the verified measurements from the quote');
            console.log('');
            console.log('   Usage Instructions:');
            console.log('');
            console.log('   1. Start the verifier service locally (example with dstack-verifier:0.5.4):');
            console.log('      docker run -d -p 8080:8080 docker.io/dstacktee/dstack-verifier:0.5.4');
            console.log('');
            console.log('   2. Verify the downloaded attestation report:');
            console.log(`      curl -s -d @${outputDir}/fine_tuning_attestation_report.json localhost:8080/verify`);
            console.log('');
            return {
                success: true,
                teeVerifier: 'dstack',
                reportsGenerated: ['combined'],
                outputDirectory: outputDir,
                reportsData: { combined: report },
            };
        }
        catch (error) {
            console.error('❌ TEE verification failed:', error);
            (0, utils_1.throwFormattedError)(error);
        }
    }
    /**
     * Extract TEE signer address from attestation report
     */
    extractTeeSignerAddress(report) {
        try {
            const reportData = report.report_data;
            if (!reportData) {
                return null;
            }
            // Decode the base64 report_data to get the signer address
            const decodedData = Buffer.from(reportData, 'base64').toString('utf-8');
            // Remove NULL characters that pad the address
            const signingAddress = decodedData.replace(/\0/g, '');
            return signingAddress || null;
        }
        catch {
            return null;
        }
    }
    /**
     * Process DStack-specific verification steps
     */
    async processDStackVerification(report) {
        console.log(`   Processing attestation report...`);
        if (!(report.tcb_info || report.info?.tcb_info) || !report.event_log) {
            console.log(`   ⚠️  Warning: report missing tcb_info or event_log`);
            return { images: [], composeVerificationPassed: false };
        }
        try {
            // Parse tcb_info if it's a string
            let tcbInfo;
            if (typeof report.tcb_info === 'string') {
                tcbInfo = JSON.parse(report.tcb_info);
            }
            else {
                tcbInfo =
                    report.tcb_info ||
                        report.info?.tcb_info;
            }
            // Parse event_log if it's a string
            let eventLog;
            if (typeof report.event_log === 'string') {
                eventLog = JSON.parse(report.event_log);
            }
            else if (Array.isArray(report.event_log)) {
                eventLog = report.event_log;
            }
            else {
                console.log(`   ⚠️  Warning: event_log is not in expected format`);
                return { images: [], composeVerificationPassed: false };
            }
            // Verify compose hash against event log
            const composeResult = this.verifyComposeHash(tcbInfo, eventLog);
            console.log(`   Docker Compose Verification:`);
            if (composeResult.calculatedHash) {
                console.log(`     Calculated Hash: ${composeResult.calculatedHash}`);
            }
            if (composeResult.eventLogHash) {
                console.log(`     Event Log Hash:  ${composeResult.eventLogHash}`);
            }
            console.log(`     Status: ${composeResult.isValid ? '✅ VALID' : '❌ INVALID'}`);
            if (!composeResult.isValid && composeResult.error) {
                console.log(`     Error: ${composeResult.error}`);
            }
            // Extract all images from tcb_info
            const images = this.extractAllImagesFromTcbInfo(tcbInfo);
            return {
                images,
                composeVerificationPassed: composeResult.isValid,
            };
        }
        catch (error) {
            console.log(`   ⚠️  Error processing report: ${error}`);
            return { images: [], composeVerificationPassed: false };
        }
    }
    /**
     * Verify compose hash based on the dstack verification logic
     */
    verifyComposeHash(tcbInfo, eventLog) {
        try {
            if (!tcbInfo.app_compose) {
                return {
                    isValid: false,
                    error: 'app_compose not found in tcb_info',
                };
            }
            // Hash the app_compose JSON string
            const composeHash = (0, crypto_1.createHash)('sha256')
                .update(tcbInfo.app_compose)
                .digest('hex');
            // Find compose-hash event in the event log
            const composeHashEvent = eventLog.find((entry) => entry.event === 'compose-hash');
            if (!composeHashEvent) {
                return {
                    isValid: false,
                    error: 'No compose-hash event found in event log',
                    calculatedHash: composeHash,
                };
            }
            const expectedHash = composeHashEvent.event_payload;
            return {
                isValid: composeHash === expectedHash,
                calculatedHash: composeHash,
                eventLogHash: expectedHash,
                composeHashEvent,
            };
        }
        catch (error) {
            return {
                isValid: false,
                error: `Compose hash verification failed: ${error}`,
            };
        }
    }
    /**
     * Extract all Docker images from tcb_info
     */
    extractAllImagesFromTcbInfo(tcbInfo) {
        try {
            const images = [];
            const tcbString = JSON.stringify(tcbInfo);
            // Match various image patterns in docker-compose format
            const imageMatches = tcbString.match(/"image"\s*:\s*"([^"]+)"/g);
            if (imageMatches) {
                for (const match of imageMatches) {
                    const imageMatch = match.match(/"image"\s*:\s*"([^"]+)"/);
                    if (imageMatch && imageMatch[1]) {
                        const imageAddr = imageMatch[1].trim();
                        if (!images.includes(imageAddr)) {
                            images.push(imageAddr);
                        }
                    }
                }
            }
            // Also try alternative pattern
            const altImageMatches = tcbString.match(/image:\s*([^",\s\}]+)/g);
            if (altImageMatches) {
                for (const match of altImageMatches) {
                    const imageAddr = match.replace(/^image:\s*/, '').trim();
                    const cleanAddr = imageAddr.replace(/["']/g, '');
                    if (cleanAddr && !images.includes(cleanAddr)) {
                        images.push(cleanAddr);
                    }
                }
            }
            return images;
        }
        catch {
            return [];
        }
    }
    /**
     * Check if running in browser environment
     */
    isBrowser() {
        return typeof window !== 'undefined' && typeof document !== 'undefined';
    }
    /**
     * Save report to file (Node.js only)
     */
    async saveReportToFile(reportContent, filePath) {
        if (this.isBrowser()) {
            return;
        }
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        await fs.writeFile(filePath, reportContent, 'utf8');
    }
}
exports.Verifier = Verifier;
//# sourceMappingURL=verifier.js.map