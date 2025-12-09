#!/usr/bin/env ts-node
/**
 * Get Controller endpoint from provider's service URL
 * Adds 'controller-' prefix to the hostname
 * e.g., compute-network-6.example.com -> controller-compute-network-6.example.com
 */
export declare function deriveControllerEndpoint(broker: any, userAddress: string): Promise<string>;
/**
 * Gets the controller endpoint with interactive setup if needed
 * Priority: CLI option > saved config (with notification) > interactive setup
 */
export declare function getControllerEndpoint(options: any, broker: any, userAddress: string): Promise<string>;
/**
 * Reset controller endpoint configuration
 */
export declare function resetControllerEndpoint(): void;
//# sourceMappingURL=controller-endpoint-setup.d.ts.map