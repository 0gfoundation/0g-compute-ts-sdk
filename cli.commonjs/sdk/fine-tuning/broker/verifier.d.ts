import { BrokerBase } from './base';
import type { FineTuningServingContract } from '../contract';
import type { LedgerBroker } from '../../ledger';
import type { Provider } from '../provider/provider';
export interface AttestationReport {
    tcb_info?: Record<string, unknown>;
    info?: {
        tcb_info?: Record<string, unknown>;
    };
    event_log?: EventLogEntry[];
    report_data?: string;
    [key: string]: unknown;
}
export interface EventLogEntry {
    event: string;
    event_payload?: string;
    [key: string]: unknown;
}
export interface ComposeVerificationResult {
    isValid: boolean;
    error?: string;
    calculatedHash?: string;
    eventLogHash?: string;
    composeHashEvent?: EventLogEntry;
}
export interface VerificationResult {
    success: boolean;
    teeVerifier: string;
    reportsGenerated: string[];
    outputDirectory: string;
    reportsData?: {
        combined?: AttestationReport;
    };
}
export interface VerificationSummary {
    composeVerification: boolean;
    signerAddressVerification: boolean;
    allVerificationsPassed: boolean;
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
export declare class Verifier extends BrokerBase {
    constructor(contract: FineTuningServingContract, ledger: LedgerBroker, servingProvider: Provider);
    /**
     * Verify fine-tuning service TEE attestation (DStack only)
     *
     * @param providerAddress - The provider address to verify
     * @param outputDir - Directory to save attestation reports (default: current directory)
     * @returns Verification results and user guidance
     */
    verifyService(providerAddress: string, outputDir?: string): Promise<VerificationResult>;
    /**
     * Extract TEE signer address from attestation report
     */
    private extractTeeSignerAddress;
    /**
     * Process DStack-specific verification steps
     */
    private processDStackVerification;
    /**
     * Verify compose hash based on the dstack verification logic
     */
    private verifyComposeHash;
    /**
     * Extract all Docker images from tcb_info
     */
    private extractAllImagesFromTcbInfo;
    /**
     * Check if running in browser environment
     */
    private isBrowser;
    /**
     * Save report to file (Node.js only)
     */
    private saveReportToFile;
}
//# sourceMappingURL=verifier.d.ts.map