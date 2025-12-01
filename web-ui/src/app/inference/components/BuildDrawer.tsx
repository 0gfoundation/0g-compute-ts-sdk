'use client'

import * as React from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { BookOpen, Zap, Settings, ExternalLink } from 'lucide-react'
import type { Provider } from '@/shared/types/broker'
import { CodeBlock, InlineCodeBlock } from './CodeBlock'
import {
    CODE_TABS,
    getQuickStartCodeExample,
    getSDKExample,
    type TabType,
} from '../constants/codeExamples'

interface BuildDrawerProps {
    provider: Provider | null
    isOpen: boolean
    onClose: () => void
}

export function BuildDrawer({ provider, isOpen, onClose }: BuildDrawerProps) {
    const [selectedTab, setSelectedTab] = React.useState<TabType>('curl')

    const modelDisplayName = provider
        ? provider.model.includes('/')
            ? provider.model.split('/').slice(1).join('/')
            : provider.model
        : 'Provider'

    const showSDKExamples =
        provider?.serviceType === 'text-to-image' ||
        provider?.serviceType === 'chatbot' ||
        provider?.serviceType === 'speech-to-text'

    const showQuickStart = provider?.serviceType === 'chatbot'

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                className="w-1/2 min-w-[600px] overflow-y-auto sm:max-w-none"
            >
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl">
                        Build with {modelDisplayName}
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-8">
                    {/* Setup Steps */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Setup Steps
                        </h2>
                        <div className="space-y-4">
                            <SetupStep
                                step={1}
                                title="Install the 0G Compute CLI"
                                code="pnpm install @0glabs/0g-serving-broker -g"
                            />

                            <SetupStep
                                step={2}
                                title="Deposit funds to your account"
                                code="0g-compute-cli deposit --amount 5"
                                description="(If your account balance is insufficient, please deposit funds first.)"
                            />

                            <SetupStep
                                step={3}
                                title="Verify provider (optional)"
                                code={
                                    provider
                                        ? `0g-compute-cli inference verify --provider ${provider.address}`
                                        : '0g-compute-cli inference verify --provider <provider_address>'
                                }
                                description="(This will output the provider's report and allow you to further verify the provider as instructed)"
                            />

                            <SetupStep
                                step={4}
                                title="Transfer funds to provider account"
                                code={
                                    provider
                                        ? `0g-compute-cli transfer-fund --provider ${provider.address} --amount 5`
                                        : '0g-compute-cli transfer-fund --provider <provider_address> --amount 5'
                                }
                                description="(Transfer funds from main account to sub-account for the specified provider. This will automatically acknowledge the provider as trusted. We recommend depositing more than 5 0G, as the provider requires a minimum balance to respond.)"
                            />

                            <SetupStep
                                step={5}
                                title="Get secret for the provider"
                                code={
                                    provider
                                        ? `0g-compute-cli inference get-secret --provider ${provider.address}`
                                        : '0g-compute-cli inference get-secret --provider <provider_address>'
                                }
                                description="(Get the secret and use it in various SDKs)"
                            />

                            {/* SDK Examples */}
                            {showSDKExamples && (
                                <div>
                                    <h3 className="text-base font-medium text-gray-700 mb-2">
                                        6. SDK Examples
                                    </h3>
                                    <p className="text-xs text-gray-600 mb-3">
                                        Use your secret obtained from step 5 in the examples below:
                                    </p>
                                    <Tabs
                                        value={selectedTab}
                                        onValueChange={(v) => setSelectedTab(v as TabType)}
                                    >
                                        <TabsList className="mb-3">
                                            {CODE_TABS.map((tab) => (
                                                <TabsTrigger
                                                    key={tab.key}
                                                    value={tab.key}
                                                    className="text-xs"
                                                >
                                                    {tab.label}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {CODE_TABS.map((tab) => (
                                            <TabsContent key={tab.key} value={tab.key}>
                                                <CodeBlock
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
                    </section>

                    {/* Quick Start section - only for chatbot */}
                    {showQuickStart && (
                        <section>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                Quick Start a Service
                            </h2>
                            <div className="space-y-4">
                                <SetupStep
                                    step={1}
                                    title="Start the server"
                                    code={
                                        provider
                                            ? `0g-compute-cli inference serve --provider ${provider.address}`
                                            : '0g-compute-cli inference serve --provider <PROVIDER_ADDRESS>'
                                    }
                                />

                                <div>
                                    <h3 className="text-base font-medium text-gray-700 mb-2">
                                        2. Use OpenAI API format to make a request
                                    </h3>
                                    <Tabs
                                        value={selectedTab}
                                        onValueChange={(v) => setSelectedTab(v as TabType)}
                                    >
                                        <TabsList className="mb-3">
                                            {CODE_TABS.map((tab) => (
                                                <TabsTrigger
                                                    key={tab.key}
                                                    value={tab.key}
                                                    className="text-xs"
                                                >
                                                    {tab.label}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {CODE_TABS.map((tab) => (
                                            <TabsContent key={tab.key} value={tab.key}>
                                                <CodeBlock
                                                    code={getQuickStartCodeExample(tab.key)}
                                                    language={tab.key}
                                                />
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Integration Resources */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Integrate into your App
                        </h2>

                        <ResourceCard
                            icon={BookOpen}
                            title="SDK Documentation"
                            description="Comprehensive guides for integrating 0G Compute Network into your applications."
                            href="https://docs.0g.ai/developer-hub/building-on-0g/compute-network/inference#sdk"
                            buttonText="View Documentation"
                        />

                        <ResourceCard
                            icon={Zap}
                            title="Starter Kit"
                            description="Ready-to-use TypeScript starter kit with examples and best practices."
                            href="https://github.com/0glabs/0g-compute-ts-starter-kit"
                            buttonText="View on GitHub"
                        />
                    </section>

                    {/* Become a Provider */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Not satisfied with existing providers?
                        </h2>

                        <ResourceCard
                            icon={Settings}
                            title="Become a Provider"
                            description="Learn how to add your own inference provider to the 0G Compute Network through our comprehensive documentation."
                            href="https://docs.0g.ai/developer-hub/building-on-0g/compute-network/inference-provider"
                            buttonText="View Provider Documentation"
                        />
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    )
}

interface SetupStepProps {
    step: number
    title: string
    code: string
    description?: string
}

function SetupStep({ step, title, code, description }: SetupStepProps) {
    return (
        <div>
            <h3 className="text-base font-medium text-gray-700 mb-2">
                {step}. {title}
            </h3>
            <InlineCodeBlock code={code} />
            {description && (
                <p className="text-xs text-gray-600 mt-1">{description}</p>
            )}
        </div>
    )
}

interface ResourceCardProps {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
    href: string
    buttonText: string
}

function ResourceCard({
    icon: Icon,
    title,
    description,
    href,
    buttonText,
}: ResourceCardProps) {
    return (
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-gray-200">
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                    <Icon className="w-6 h-6 text-purple-600 mt-0.5" />
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900 mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{description}</p>
                    <Button asChild className="bg-purple-600 hover:bg-purple-700">
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {buttonText}
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    )
}
