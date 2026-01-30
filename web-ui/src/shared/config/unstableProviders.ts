/**
 * Configuration for unstable providers
 * Add provider addresses that are currently experiencing service instability
 */

export const UNSTABLE_PROVIDERS: string[] = [
    // Add unstable provider addresses here
    '0x1B3AAef3ae5050EEE04ea38cD4B087472BD85EB0',
    '0xBB3f5b0b5062CB5B3245222C5917afD1f6e13aF6',
    '0x4415ef5CBb415347bb18493af7cE01f225Fc0868',
    '0xa48f01287233509FD694a22Bf840225062E67836',
    '0xa48f01287233509FD694a22Bf840225062E67836',
    '0x4b2a941929E39Adbea5316dDF2B9Bd8Ff3134389',
]

/**
 * Configuration for official 0G providers
 * Add provider addresses that are officially maintained by 0G
 */
export const OFFICIAL_0G_PROVIDERS: string[] = [
    // Add official 0G provider addresses here
    // Example:
    '0xd9966e13a6026Fcca4b13E7ff95c94DE268C471C',
    '0xE29a72c7629815Eb480aE5b1F2dfA06f06cdF974',
    '0x36aCffCEa3CCe07cAdd1740Ad992dB16Ab324517',
    '0x4b2a941929E39Adbea5316dDF2B9Bd8Ff3134389'
]

/**
 * Check if a provider is marked as unstable
 * @param providerAddress - The provider address to check
 * @returns true if the provider is in the unstable list
 */
export function isProviderUnstable(providerAddress: string): boolean {
    const lowerAddress = providerAddress.toLowerCase()
    return UNSTABLE_PROVIDERS.some(
        (addr) => addr.toLowerCase() === lowerAddress
    )
}

/**
 * Check if a provider is an official 0G provider
 * @param providerAddress - The provider address to check
 * @returns true if the provider is an official 0G provider
 */
export function isOfficial0GProvider(providerAddress: string): boolean {
    const lowerAddress = providerAddress.toLowerCase()
    return OFFICIAL_0G_PROVIDERS.some(
        (addr) => addr.toLowerCase() === lowerAddress
    )
}
