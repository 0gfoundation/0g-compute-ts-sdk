'use client'

import { InlineCodeBlock } from '../CodeBlock'

interface SetupStepProps {
    step: number
    title: string
    code: string
    description?: string
}

export function SetupStep({ step, title, code, description }: SetupStepProps) {
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
