'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
// import { ScrollArea } from '@/components/ui/scroll-area' // Using native scrolling instead
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Download,
  Loader2,
} from 'lucide-react'
import type {
  VerificationLog,
  VerificationReport,
  VerificationResult,
} from '@/shared/hooks/useProviderVerification'

interface VerificationLogViewerProps {
  isOpen: boolean
  onClose: () => void
  logs: VerificationLog[]
  result: VerificationResult | null
  isVerifying: boolean
}

export function VerificationLogViewer({
  isOpen,
  onClose,
  logs,
  result,
  isVerifying,
}: VerificationLogViewerProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [logs])

  const downloadReport = (report: VerificationReport) => {
    const blob = new Blob([JSON.stringify(report.content, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = report.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getLogColor = (type: VerificationLog['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-700'
      case 'error':
        return 'text-red-700'
      case 'warning':
        return 'text-yellow-700'
      case 'step':
        return 'text-blue-700 font-semibold'
      default:
        return 'text-gray-700'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col" aria-describedby="verification-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Provider TEE Verification
            {isVerifying && <Loader2 className="h-4 w-4 animate-spin" />}
          </DialogTitle>
          <p id="verification-description" className="sr-only">
            Provider TEE verification logs and results
          </p>
        </DialogHeader>

        {/* Log Output Area */}
        <div
          className="flex-1 border rounded-lg bg-gray-50 p-4 overflow-y-auto max-h-96"
          ref={scrollAreaRef}
        >
          <div className="font-mono text-sm space-y-2">
            {logs.length === 0 && (
              <div className="text-gray-500 italic">
                Waiting for verification to start...
              </div>
            )}

            {logs.map((log, index) => (
              <div key={index} className="flex items-start">
                <span className={getLogColor(log.type)}>{log.message}</span>
              </div>
            ))}

            {isVerifying && (
              <div className="flex items-center gap-2 text-gray-600 mt-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying...</span>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        {result && !isVerifying && (
          <div className="space-y-3 pt-3 border-t">
            {/* Summary Info */}
            <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">TEE Verifier:</span>
                <span className="font-medium">{result.summary.teeVerifier}</span>
              </div>
              {/* Only show Signer Verification if there are checks performed */}
              {result.summary.totalSignerChecks > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Signer Verification:</span>
                  <span className="font-medium">
                    {result.summary.signerMatches}/{result.summary.totalSignerChecks}{' '}
                    passed
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Reports Generated:</span>
                <span className="font-medium">{result.reports.length}</span>
              </div>
            </div>

            {/* Download Reports */}
            {result.reports.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  Download Attestation Reports:
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.reports.map((report, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReport(report)}
                      className="text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {report.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isVerifying}
            size="sm"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
