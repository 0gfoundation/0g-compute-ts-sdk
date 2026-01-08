"use client"

import * as React from "react"
import { useState } from "react"
import { useBrokerOperations } from "@/shared/hooks/useBrokerOperations"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ShieldCheck, ShieldAlert, AlertCircle } from "lucide-react"

interface VerifyProviderButtonProps {
  /** Provider address */
  provider: string

  /** Button variant */
  variant?: "default" | "outline" | "secondary"

  /** Button size */
  size?: "default" | "sm" | "lg"

  /** Success callback */
  onSuccess?: (report: any) => void

  /** Error callback */
  onError?: (error: string) => void

  /** Optional custom button text */
  buttonText?: string
}

/**
 * Verify Provider Button Component
 *
 * Reuses business logic from useBrokerOperations
 * Verifies provider reliability by checking TEE quote
 *
 * @example
 * ```tsx
 * <VerifyProviderButton
 *   provider={providerAddress}
 *   onSuccess={(report) => console.log('Verified:', report)}
 * />
 * ```
 */
export function VerifyProviderButton({
  provider,
  variant = "outline",
  size = "default",
  onSuccess,
  onError,
  buttonText = "Verify Provider",
}: VerifyProviderButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    report?: any
    error?: string
  } | null>(null)

  const { verifyProvider } = useBrokerOperations()

  const handleVerify = async () => {
    setIsVerifying(true)
    setVerificationResult(null)

    try {
      const result = await verifyProvider(provider)

      setVerificationResult({
        success: result.success,
        report: result.report,
      })

      if (result.success) {
        onSuccess?.(result.report)
      } else {
        const errorMsg = "Provider verification failed"
        setVerificationResult({
          success: false,
          error: errorMsg,
        })
        onError?.(errorMsg)
      }

      // Auto-hide result after 5 seconds
      setTimeout(() => setVerificationResult(null), 5000)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to verify provider"
      setVerificationResult({
        success: false,
        error: errorMessage,
      })
      onError?.(errorMessage)

      // Auto-hide error after 5 seconds
      setTimeout(() => setVerificationResult(null), 5000)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Verify Button */}
      <Button
        onClick={handleVerify}
        disabled={isVerifying}
        variant={variant}
        size={size}
        className="w-full"
      >
        {isVerifying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Verifying...
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>

      {/* Verification Info */}
      <p className="text-xs text-gray-600">
        Verifies provider reliability by checking TEE (Trusted Execution Environment) quote
      </p>

      {/* Success Result */}
      {verificationResult?.success && (
        <Alert className="bg-green-50 border-green-200">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-xs text-green-800">
            <p className="font-medium mb-1">Provider is verified and reliable</p>
            {verificationResult.report && (
              <p className="text-green-700">
                TEE quote validated successfully
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Failure Result */}
      {verificationResult && !verificationResult.success && (
        <Alert className="bg-red-50 border-red-200">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-xs text-red-800">
            <p className="font-medium mb-1">Verification failed</p>
            {verificationResult.error && (
              <p className="text-red-700">{verificationResult.error}</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Warning Notice */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-xs text-amber-800">
          Always verify providers before transferring funds to ensure service reliability
        </AlertDescription>
      </Alert>
    </div>
  )
}
