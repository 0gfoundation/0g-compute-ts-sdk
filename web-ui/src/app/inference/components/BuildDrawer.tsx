'use client'

import * as React from 'react'
import { useAccount } from 'wagmi'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { BookOpen, Zap, MessageCircle, ShieldCheck } from 'lucide-react'
import type { Provider } from '@/shared/types/broker'
import { CodeBlock } from './CodeBlock'
import { SetupStep, ResourceCard, SmartSetupStep, type StepStatus } from './drawer-components'
import {
    CODE_TABS,
    getQuickStartCodeExample,
    getSDKExample,
    type TabType,
} from '../constants/codeExamples'
import {
    TransferFundForm,
    ProviderApiKeyManager,
} from '@/shared/components/provider-setup'
import { useProviderSetup } from '@/shared/hooks/useProviderSetup'
import { useProviderVerification, type VerificationResult } from '@/shared/hooks/useProviderVerification'
import { Loader2 as LoaderIcon } from 'lucide-react'
import { SlotStatusCompact } from '@/app/wallet/components'
import { VerificationLogViewer } from './VerificationLogViewer'

interface BuildDrawerProps {
    provider: Provider | null
    isOpen: boolean
    onClose: () => void
}

type SetupMode = 'cli' | 'interactive' | 'sdk'

export function BuildDrawer({ provider, isOpen, onClose }: BuildDrawerProps) {
    const { address } = useAccount()
    const [selectedTab, setSelectedTab] = React.useState<TabType>('curl')
    const [setupMode, setSetupMode] = React.useState<SetupMode>('interactive')
    const [showVerificationDialog, setShowVerificationDialog] = React.useState(false)
    const [verificationResults, setVerificationResults] = React.useState<Record<string, VerificationResult>>({})
    const [refreshTrigger, setRefreshTrigger] = React.useState(0)

    // Track provider setup status in real-time
    const { status, checkStatus } = useProviderSetup(
        provider?.address || null,
        address
    )

    // Provider verification hook
    const { isVerifying, logs, verifyProvider } = useProviderVerification()

    // Get current provider's verification result
    const verificationResult = provider?.address ? verificationResults[provider.address] : null

    const modelDisplayName = provider
        ? provider.model.includes('/')
            ? provider.model.split('/').slice(1).join('/')
            : provider.model
        : 'Provider'

    const showSDKExamples =
        provider?.serviceType === 'text-to-image' ||
        provider?.serviceType === 'image-editing' ||
        provider?.serviceType === 'chatbot' ||
        provider?.serviceType === 'speech-to-text'

    const showQuickStart = setupMode === 'cli' && provider?.serviceType === 'chatbot'

    // Handle provider verification
    const handleVerify = async () => {
        if (!provider) return

        // Open verification dialog
        setShowVerificationDialog(true)

        // Clear current provider's result before verifying
        setVerificationResults(prev => {
            const newResults = { ...prev }
            delete newResults[provider.address]
            return newResults
        })

        try {
            const result = await verifyProvider(provider.address)
            // Store result for this specific provider
            setVerificationResults(prev => ({
                ...prev,
                [provider.address]: result
            }))
        } catch (err) {
            console.error('Verification error:', err)
        }
    }

    // Handle balance refresh - increment trigger to force SetupProgress to refresh
    const handleRefreshBalance = async () => {
        await checkStatus()
        setRefreshTrigger(prev => prev + 1)
    }

    // Determine step status based on current state
    const getDepositStepStatus = (): StepStatus => {
        if (!status.hasMainAccount) return 'incomplete'
        // For now, deposit is always "complete-good" once created
        // We could add balance threshold logic here if needed
        return 'complete-good'
    }

    const getTransferStepStatus = (): StepStatus => {
        if (!status.hasMainAccount) return 'incomplete'
        if (!status.hasSubAccount) return 'incomplete'

        // Check if sub-account balance is below recommended threshold
        const balance = parseFloat(status.subAccountBalance)
        const RECOMMENDED_BALANCE = 5 // 5 A0GI recommended

        if (balance < RECOMMENDED_BALANCE) {
            return 'complete-warning'
        }

        return 'complete-good'
    }

    const getApiKeyStepStatus = (): StepStatus => {
        if (!status.hasSubAccount) return 'incomplete'
        if (!status.hasApiKey) return 'incomplete'
        return 'complete-good'
    }

    // Get summary info for each step
    const getTransferSummaryInfo = (): string => {
        if (!status.hasSubAccount) return ''
        return `Balance: ${status.subAccountBalance} A0GI`
    }

    const getTransferWarningMessage = (): string | undefined => {
        // Warning message removed per user request
        return undefined
    }

    // Check if Chat tab should be enabled (方案 D)
    const isChatEnabled = React.useMemo(() => {
        // Condition 1: Must be chatbot service type
        if (provider?.serviceType !== 'chatbot') return false

        // Condition 2: User must have generated API key
        if (!status.hasApiKey) return false

        // Condition 3: Account must have balance
        const balance = parseFloat(status.subAccountBalance)
        if (balance <= 0) return false

        return true
    }, [provider, status])

    // Get Chat tab tooltip message for disabled state
    const getChatDisabledTooltip = (): string => {
        if (provider?.serviceType !== 'chatbot') {
            return 'Chat is only available for chatbot providers'
        }
        if (!status.hasApiKey) {
            return 'Please generate an API Key first (Step 3)'
        }
        const balance = parseFloat(status.subAccountBalance)
        if (balance <= 0) {
            return 'Please ensure your account has balance (Step 2)'
        }
        return ''
    }

    // Handle Chat tab click - navigate to chat page
    const handleChatClick = () => {
        if (!isChatEnabled || !provider) return

        const chatUrl = `/inference/chat?provider=${encodeURIComponent(provider.address)}&model=${encodeURIComponent(provider.model)}`
        window.location.href = chatUrl
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:w-[85vw] md:w-[70vw] lg:w-1/2 lg:min-w-[600px] overflow-y-auto sm:max-w-none"
                hideClose
            >
                <SheetHeader className="mb-6 space-y-6">
                    {/* Title, TeeML Badge and Pricing - Same Row */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <SheetTitle className="text-xl">
                                Build with {modelDisplayName}
                            </SheetTitle>
                            {provider?.verifiability && (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md">
                                    {provider.verifiability}
                                </span>
                            )}
                        </div>

                        {/* Pricing Information - Top Right */}
                        {provider && (provider.inputPrice !== undefined || provider.outputPrice !== undefined) && (
                            <div className="flex flex-col items-end gap-1 text-xs">
                                {/* Input price - hidden for image generation services */}
                                {provider.inputPrice !== undefined &&
                                 provider.serviceType !== 'text-to-image' &&
                                 provider.serviceType !== 'image-editing' && (
                                    <div>
                                        <span className="text-gray-500">Input:</span>
                                        <span className="ml-1 font-medium text-gray-900">
                                            {provider.inputPrice.toString().replace(/\.?0+$/, '')} 0G / 1M tokens
                                        </span>
                                    </div>
                                )}
                                {/* Output price - label changes based on service type */}
                                {provider.outputPrice !== undefined && (
                                    <div>
                                        <span className="text-gray-500">
                                            {provider.serviceType === 'text-to-image' ||
                                             provider.serviceType === 'image-editing'
                                                ? 'Price/Image:'
                                                : 'Output:'}
                                        </span>
                                        <span className="ml-1 font-medium text-gray-900">
                                            {provider.outputPrice.toString().replace(/\.?0+$/, '')} 0G
                                            {provider.serviceType !== 'text-to-image' &&
                                             provider.serviceType !== 'image-editing' &&
                                             ' / 1M tokens'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons - Separate Row */}
                    {provider && (
                        <div className="flex items-center gap-2">
                            {provider.serviceType === 'chatbot' && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleChatClick}
                                    disabled={!isChatEnabled}
                                    className="h-7 text-xs bg-purple-600 hover:bg-purple-700"
                                    title={!isChatEnabled ? getChatDisabledTooltip() : 'Open chat page'}
                                >
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    Chat
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleVerify}
                                disabled={isVerifying}
                                className={`h-7 text-xs border ${
                                    verificationResult?.success
                                        ? 'border-green-600 text-green-700 bg-green-50 hover:bg-green-100'
                                        : 'border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {isVerifying ? (
                                    <LoaderIcon className="h-3 w-3 animate-spin mr-1" />
                                ) : verificationResult?.success ? (
                                    <ShieldCheck className="h-3 w-3 mr-1 text-green-600" />
                                ) : (
                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                )}
                                {verificationResult?.success ? 'Verified' : 'Verify Provider'}
                            </Button>
                        </div>
                    )}
                </SheetHeader>

                {/* Tabs for Setup and CLI - Pill Style */}
                <Tabs value={setupMode} onValueChange={(v) => setSetupMode(v as SetupMode)} className="mt-10">
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg inline-flex">
                        <button
                            onClick={() => setSetupMode('interactive')}
                            className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${
                                setupMode === 'interactive'
                                    ? 'bg-white text-purple-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Setup
                        </button>
                        <button
                            onClick={() => setSetupMode('cli')}
                            className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${
                                setupMode === 'cli'
                                    ? 'bg-white text-purple-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            CLI
                        </button>
                        <button
                            onClick={() => setSetupMode('sdk')}
                            className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${
                                setupMode === 'sdk'
                                    ? 'bg-white text-purple-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            SDK
                        </button>
                    </div>
                </Tabs>

                {/* Tabs Content */}
                <Tabs value={setupMode} onValueChange={(v) => setSetupMode(v as SetupMode)}>
                    {/* Setup Tab Content */}
                    <TabsContent value="interactive" className="mt-4">
                        {/* Interactive Setup Components - Smart Steps */}
                        <div className="space-y-4">
                                {/* Step 1: Deposit - Link to Wallet page */}
                                <SmartSetupStep
                                    step={1}
                                    title="Create Main Account"
                                    status={getDepositStepStatus()}
                                    summaryInfo={status.hasMainAccount ? "Account created" : undefined}
                                >
                                    <p className="text-sm text-gray-700 mb-3">
                                        Deposit funds to create your main ledger account
                                    </p>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            window.location.href = '/wallet'
                                        }}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        Go to Wallet Page
                                    </Button>
                                </SmartSetupStep>

                                {/* Step 2: Transfer Funds to Provider */}
                                {provider && (
                                    <SmartSetupStep
                                        step={2}
                                        title="Transfer Funds to Provider"
                                        status={getTransferStepStatus()}
                                        summaryInfo={getTransferSummaryInfo()}
                                        warningMessage={getTransferWarningMessage()}
                                    >
                                        {/* Transfer Form */}
                                        {status.hasMainAccount && (
                                            <TransferFundForm
                                                provider={provider.address}
                                                serviceType="inference"
                                                onRefreshProvider={handleRefreshBalance}
                                                onSuccess={handleRefreshBalance}
                                            />
                                        )}
                                    </SmartSetupStep>
                                )}

                                {/* Step 3: Generate API Key */}
                                {provider && (
                                    <SmartSetupStep
                                        step={3}
                                        title="Generate API Key"
                                        status={getApiKeyStepStatus()}
                                        summaryInfo={status.hasApiKey && status.hasStoredKey ? "API Key stored locally" : undefined}
                                    >
                                        {status.hasSubAccount && (
                                            <div className="space-y-3">
                                                <ProviderApiKeyManager
                                                    provider={provider.address}
                                                    label={`${modelDisplayName} Key`}
                                                    onSuccess={handleRefreshBalance}
                                                />

                                                {/* Slot Status */}
                                                <div className="pt-3 border-t border-gray-200">
                                                    <SlotStatusCompact
                                                        provider={provider.address}
                                                        refreshTrigger={refreshTrigger}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {!status.hasSubAccount && (
                                            <p className="text-sm text-gray-600">
                                                Please complete the previous steps first
                                            </p>
                                        )}
                                    </SmartSetupStep>
                                )}
                            </div>

                            {/* SDK Examples - Only show when API key exists and SDK examples are available */}
                            {showSDKExamples && status.hasApiKey && provider && (
                                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-800 mb-1">
                                            API Usage Examples
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Use your API key with the examples below:
                                        </p>
                                    </div>
                                    <Tabs
                                        value={selectedTab}
                                        onValueChange={(v) => setSelectedTab(v as TabType)}
                                    >
                                        <TabsList className="mb-3 h-8">
                                            {CODE_TABS.map((tab) => (
                                                <TabsTrigger
                                                    key={tab.key}
                                                    value={tab.key}
                                                    className="text-xs px-3 py-1"
                                                >
                                                    {tab.label}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {CODE_TABS.map((tab) => (
                                            <TabsContent key={tab.key} value={tab.key}>
                                                <CodeBlock
                                                    title={`${provider.serviceType === 'chatbot' ? 'Chat Completions' : 'API Request'}`}
                                                    code={getSDKExample(
                                                        tab.key,
                                                        provider.serviceType,
                                                        provider
                                                    )}
                                                    language={tab.key}
                                                />
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                </div>
                            )}
                    </TabsContent>

                    {/* CLI Tab Content */}
                    <TabsContent value="cli" className="mt-4">
                        <div className="space-y-6">
                            <SetupStep
                                step={1}
                                title="Install the 0G Compute CLI"
                                packageManagerOptions={[
                                    { key: 'npm', label: 'npm', command: 'npm install @0gfoundation/0g-compute-ts-sdk -g' },
                                    { key: 'yarn', label: 'yarn', command: 'yarn global add @0gfoundation/0g-compute-ts-sdk' },
                                    { key: 'pnpm', label: 'pnpm', command: 'pnpm install @0gfoundation/0g-compute-ts-sdk -g' }
                                ]}
                            />

                            <SetupStep
                                step={2}
                                title="Deposit funds to your account"
                                code="0g-compute-cli deposit --amount 5"
                                alert={{
                                    type: 'info',
                                    message: 'Before transferring funds to a provider, ensure your account has sufficient balance.'
                                }}
                            />

                            <SetupStep
                                step={3}
                                title="Verify provider (optional)"
                                code={
                                    provider
                                        ? `0g-compute-cli inference verify --provider ${provider.address}`
                                        : '0g-compute-cli inference verify --provider <provider_address>'
                                }
                                alert={{
                                    type: 'info',
                                    message: 'This step is optional. It will output the provider\'s attestation report for further verification.'
                                }}
                            />

                            <SetupStep
                                step={4}
                                title="Transfer funds to provider account"
                                code={
                                    provider
                                        ? `0g-compute-cli transfer-fund --provider ${provider.address} --amount 5`
                                        : '0g-compute-cli transfer-fund --provider <provider_address> --amount 5'
                                }
                                alert={{
                                    type: 'warning',
                                    message: 'This will automatically acknowledge the provider as trusted. We recommend depositing at least 1 0G for stable service response.'
                                }}
                            />

                                <SetupStep
                                    step={5}
                                    title="Get secret for the provider"
                                    code={
                                        provider
                                            ? `0g-compute-cli inference get-secret --provider ${provider.address}`
                                            : '0g-compute-cli inference get-secret --provider <provider_address>'
                                    }
                                    alert={{
                                        type: 'info',
                                        message: 'Save this secret securely. You will need it to authenticate with the provider in your applications.'
                                    }}
                                />

                                {/* SDK Examples */}
                                {showSDKExamples && (
                                    <div className="space-y-3 mt-6">
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-800 mb-1">
                                                6. SDK Examples
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Use your secret obtained from step 5 in the examples below:
                                            </p>
                                        </div>
                                        <Tabs
                                            value={selectedTab}
                                            onValueChange={(v) => setSelectedTab(v as TabType)}
                                        >
                                            <TabsList className="mb-3 h-8">
                                                {CODE_TABS.map((tab) => (
                                                    <TabsTrigger
                                                        key={tab.key}
                                                        value={tab.key}
                                                        className="text-xs px-3 py-1"
                                                    >
                                                        {tab.label}
                                                    </TabsTrigger>
                                                ))}
                                            </TabsList>
                                            {CODE_TABS.map((tab) => (
                                                <TabsContent key={tab.key} value={tab.key}>
                                                    <CodeBlock
                                                        title={`${provider?.serviceType === 'chatbot' ? 'Chat Completions' : 'API Request'}`}
                                                        code={getSDKExample(
                                                            tab.key,
                                                            provider?.serviceType,
                                                            provider
                                                        )}
                                                        language={tab.key}
                                                    />
                                                </TabsContent>
                                            ))}
                                        </Tabs>
                                    </div>
                                )}
                            </div>

                            {/* Quick Start section - only for chatbot */}
                            {showQuickStart && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-6">
                                        Quick Start a Service
                                    </h2>
                                    <div className="space-y-6">
                                        <SetupStep
                                            step={1}
                                            title="Start the server"
                                            code={
                                                provider
                                                    ? `0g-compute-cli inference serve --provider ${provider.address}`
                                                    : '0g-compute-cli inference serve --provider <PROVIDER_ADDRESS>'
                                            }
                                        />

                                        <div className="space-y-3">
                                            <h3 className="text-base font-semibold text-gray-800">
                                                2. Use OpenAI API format to make a request
                                            </h3>
                                            <Tabs
                                                value={selectedTab}
                                                onValueChange={(v) => setSelectedTab(v as TabType)}
                                            >
                                                <TabsList className="mb-3 h-8">
                                                    {CODE_TABS.map((tab) => (
                                                        <TabsTrigger
                                                            key={tab.key}
                                                            value={tab.key}
                                                            className="text-xs px-3 py-1"
                                                        >
                                                            {tab.label}
                                                        </TabsTrigger>
                                                    ))}
                                                </TabsList>
                                                {CODE_TABS.map((tab) => (
                                                    <TabsContent key={tab.key} value={tab.key}>
                                                        <CodeBlock
                                                            title="Chat Completions Request"
                                                            code={getQuickStartCodeExample(tab.key)}
                                                            language={tab.key}
                                                        />
                                                    </TabsContent>
                                                ))}
                                            </Tabs>
                                        </div>
                                    </div>
                                </div>
                            )}
                    </TabsContent>

                    {/* SDK Tab Content - Centered Layout */}
                    <TabsContent value="sdk" className="flex items-start justify-center pt-20">
                        <div className="space-y-8 max-w-2xl w-full">
                            <div className="text-center space-y-3">
                                <h2 className="text-3xl font-bold text-gray-900">
                                    Integrate into your App
                                </h2>
                                <p className="text-base text-gray-600 max-w-lg mx-auto">
                                    Get started with our SDK and starter kit to build your application
                                </p>
                            </div>

                            <div className="space-y-4">
                                <ResourceCard
                                    icon={BookOpen}
                                    title="SDK Documentation"
                                    description="Comprehensive guides for integrating 0G Compute Network into your applications."
                                    href="https://docs.0g.ai/developer-hub/building-on-0g/compute-network/inference#installation-2"
                                />

                                <ResourceCard
                                    icon={Zap}
                                    title="Starter Kit"
                                    description="Ready-to-use TypeScript starter kit with examples and best practices."
                                    href="https://github.com/0glabs/0g-compute-ts-starter-kit"
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </SheetContent>

            {/* Verification Log Viewer Dialog */}
            <VerificationLogViewer
                isOpen={showVerificationDialog}
                onClose={() => setShowVerificationDialog(false)}
                logs={logs}
                result={verificationResult}
                isVerifying={isVerifying}
            />
        </Sheet>
    )
}
