import { describe, it } from 'mocha'
import { expect } from 'chai'
import {
    parseCacheTokenBilling,
    parseCacheTokenBillingFromModelInfo,
    parseTieredPricing,
    parseTieredPricingFromModelInfo,
} from '../read-only-model'
import type { ProviderModelInfo } from '../read-only-model'

describe('tiered pricing multiplier fold', () => {
    it('folds num/den into an effective decimal (HTTP /v1/models)', () => {
        const modelInfo = {
            pricing: {
                tiered_pricing: [
                    {
                        max_input_tokens: 32000,
                        input_multiplier: 1,
                        output_multiplier: 1,
                    },
                    {
                        max_input_tokens: 0,
                        input_multiplier: 3,
                        input_multiplier_denominator: 2, // 1.5x
                        output_multiplier: 5,
                        output_multiplier_denominator: 2, // 2.5x
                    },
                ],
            },
        } as unknown as ProviderModelInfo

        const parsed = parseTieredPricingFromModelInfo(modelInfo)
        expect(parsed?.tiers).to.have.length(2)
        expect(parsed!.tiers[0].inputMultiplier).to.equal(1)
        expect(parsed!.tiers[1].inputMultiplier).to.equal(1.5)
        expect(parsed!.tiers[1].outputMultiplier).to.equal(2.5)
    })

    it('treats a missing denominator as 1 (legacy integer config unchanged)', () => {
        const modelInfo = {
            pricing: {
                tiered_pricing: [
                    {
                        max_input_tokens: 0,
                        input_multiplier: 4,
                        output_multiplier: 3,
                    },
                ],
            },
        } as unknown as ProviderModelInfo

        const parsed = parseTieredPricingFromModelInfo(modelInfo)
        expect(parsed!.tiers[0].inputMultiplier).to.equal(4)
        expect(parsed!.tiers[0].outputMultiplier).to.equal(3)
    })

    it('folds num/den from on-chain additionalInfo', () => {
        const additionalInfo = JSON.stringify({
            tieredPricing: {
                tiers: [
                    {
                        maxInputTokens: 0,
                        inputMultiplier: 3,
                        inputMultiplierDenominator: 2,
                        outputMultiplier: 2,
                        // outputMultiplierDenominator omitted -> 1
                    },
                ],
            },
        })

        const parsed = parseTieredPricing(additionalInfo)
        expect(parsed!.tiers[0].inputMultiplier).to.equal(1.5)
        expect(parsed!.tiers[0].outputMultiplier).to.equal(2)
    })
})

// A provider's own /v1/models can serve anything; list-providers renders these
// values with BigInt, which throws on a fraction, NaN or Infinity.
describe('malformed provider pricing is dropped', () => {
    const info = (pricing: unknown) =>
        JSON.parse(JSON.stringify({ pricing })) as ProviderModelInfo

    it('drops a cache divisor that is not a positive safe integer', () => {
        for (const divisor of [2.5, -3, 0]) {
            expect(
                parseCacheTokenBillingFromModelInfo(
                    info({ cache_token_billing: { divisor } })
                )
            ).to.equal(undefined)
            expect(
                parseCacheTokenBilling(
                    JSON.stringify({ cacheTokenBilling: { divisor } })
                )
            ).to.equal(undefined)
        }
        // JSON 1e400 parses to Infinity
        const inf = JSON.parse(
            '{"pricing":{"cache_token_billing":{"divisor":1e400}}}'
        ) as ProviderModelInfo
        expect(parseCacheTokenBillingFromModelInfo(inf)).to.equal(undefined)
        expect(
            parseCacheTokenBillingFromModelInfo(
                info({ cache_token_billing: { divisor: 6 } })
            )
        ).to.deep.equal({ divisor: 6 })
    })

    it('keeps a schedule within the broker limits (1x..1000x, last bound 0)', () => {
        const parsed = parseTieredPricingFromModelInfo(
            info({
                tiered_pricing: [
                    {
                        max_input_tokens: 1000,
                        input_multiplier: 1,
                        output_multiplier: 1,
                    },
                    {
                        max_input_tokens: 0,
                        input_multiplier: 1000,
                        output_multiplier: 3,
                        output_multiplier_denominator: 2,
                    },
                ],
            })
        )
        expect(parsed?.tiers).to.deep.equal([
            { maxInputTokens: 1000, inputMultiplier: 1, outputMultiplier: 1 },
            { maxInputTokens: 0, inputMultiplier: 1000, outputMultiplier: 1.5 },
        ])
    })

    // The broker accepts or refuses a schedule as a whole: one bad tier drops
    // the schedule rather than stretching a neighbour over its range.
    it('drops the whole schedule when any tier is invalid', () => {
        const valid = {
            max_input_tokens: 1000,
            input_multiplier: 1,
            output_multiplier: 1,
        }
        const bad: unknown[] = [
            null,
            7,
            'x',
            {
                max_input_tokens: 2000,
                input_multiplier: 1001,
                output_multiplier: 1,
            },
            {
                max_input_tokens: 2000,
                input_multiplier: 0.5,
                output_multiplier: 1,
            },
            {
                max_input_tokens: 2000.5,
                input_multiplier: 2,
                output_multiplier: 2,
            },
            { max_input_tokens: -1, input_multiplier: 2, output_multiplier: 2 },
            {
                max_input_tokens: 0,
                input_multiplier: 1e200,
                input_multiplier_denominator: 1e-103,
                output_multiplier: 1,
            },
        ]
        for (const b of bad) {
            expect(
                parseTieredPricingFromModelInfo(
                    info({ tiered_pricing: [valid, b] })
                ),
                JSON.stringify(b)
            ).to.equal(undefined)
        }
        // JSON 1e400 parses to Infinity
        expect(
            parseTieredPricingFromModelInfo(
                JSON.parse(
                    '{"pricing":{"tiered_pricing":[{"max_input_tokens":0,"input_multiplier":1e400,"output_multiplier":1}]}}'
                ) as ProviderModelInfo
            )
        ).to.equal(undefined)
        expect(
            parseTieredPricing(
                JSON.stringify({
                    tieredPricing: {
                        tiers: [
                            {
                                maxInputTokens: 10,
                                inputMultiplier: 1,
                                outputMultiplier: 1,
                            },
                            null,
                        ],
                    },
                })
            )
        ).to.equal(undefined)
        expect(
            parseCacheTokenBillingFromModelInfo(
                info({ cache_token_billing: 4 })
            )
        ).to.equal(undefined)
    })
})
