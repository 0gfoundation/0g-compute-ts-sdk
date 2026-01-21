/**
 * Token estimation utilities for cost calculation
 *
 * These are rough estimates based on common tokenization patterns:
 * - English text: ~4 characters per token
 * - Code: ~3 characters per token
 * - Average response length: ~500 tokens for a typical AI response
 */

// Average characters per token (conservative estimate)
const CHARS_PER_TOKEN = 4

// Average response length in tokens for cost estimation
const AVG_RESPONSE_TOKENS = 500

/**
 * Estimate the number of tokens in a string
 */
export function estimateTokens(text: string): number {
    if (!text || text.length === 0) return 0
    return Math.ceil(text.length / CHARS_PER_TOKEN)
}

/**
 * Estimate the cost of a message based on provider pricing
 * @param inputText - The user's input message
 * @param inputPrice - Price per 1M input tokens in 0G
 * @param outputPrice - Price per 1M output tokens in 0G
 * @returns Estimated cost in 0G
 */
export function estimateMessageCost(
    inputText: string,
    inputPrice: number | undefined,
    outputPrice: number | undefined
): number {
    const inputTokens = estimateTokens(inputText)

    // Calculate input cost (per 1M tokens)
    const inputCost = inputPrice
        ? (inputTokens / 1_000_000) * inputPrice
        : 0

    // Estimate output cost based on average response
    const outputCost = outputPrice
        ? (AVG_RESPONSE_TOKENS / 1_000_000) * outputPrice
        : 0

    return inputCost + outputCost
}

/**
 * Format a cost value for display
 */
export function formatCost(cost: number): string {
    if (cost < 0.000001) return '< 0.000001'
    if (cost < 0.001) return cost.toFixed(6)
    if (cost < 0.1) return cost.toFixed(4)
    return cost.toFixed(2)
}

/**
 * Estimate messages remaining based on balance and pricing
 */
export function estimateMessagesRemaining(
    balance: number,
    inputPrice: number | undefined,
    outputPrice: number | undefined
): number {
    // Estimate cost of a typical message (100 input tokens, 500 output tokens)
    const typicalInputTokens = 100
    const typicalOutputTokens = 500

    const inputCost = inputPrice
        ? (typicalInputTokens / 1_000_000) * inputPrice
        : 0
    const outputCost = outputPrice
        ? (typicalOutputTokens / 1_000_000) * outputPrice
        : 0

    const costPerMessage = inputCost + outputCost

    if (costPerMessage === 0) return Infinity

    return Math.floor(balance / costPerMessage)
}
