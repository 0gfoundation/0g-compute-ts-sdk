#!/usr/bin/env ts-node
interface CLIConfig {
    rpcEndpoint?: string;
    network?: 'mainnet' | 'testnet' | 'custom';
    privateKey?: string;
    controllerEndpoint?: string;
    controllerEndpointSource?: 'auto' | 'custom';
    lastUpdated?: string;
}
/**
 * Loads the CLI configuration from file
 */
export declare function loadConfig(): CLIConfig;
/**
 * Saves the CLI configuration to file
 */
export declare function saveConfig(config: CLIConfig): void;
/**
 * Gets the RPC endpoint from config file, environment variable, or user input
 */
export declare function getConfiguredRpcEndpoint(): string | undefined;
/**
 * Sets the RPC endpoint in config file
 */
export declare function setConfiguredRpcEndpoint(rpcEndpoint: string, network: 'mainnet' | 'testnet' | 'custom'): void;
/**
 * Gets the private key from config file only
 */
export declare function getConfiguredPrivateKey(): string | undefined;
/**
 * Sets the private key in config file
 */
export declare function setConfiguredPrivateKey(privateKey: string): void;
/**
 * Clears the configuration
 */
export declare function clearConfig(): void;
/**
 * Gets the controller endpoint from config file
 */
export declare function getConfiguredControllerEndpoint(): {
    endpoint?: string;
    source?: 'auto' | 'custom';
};
/**
 * Sets the controller endpoint in config file
 */
export declare function setConfiguredControllerEndpoint(endpoint: string, source: 'auto' | 'custom'): void;
/**
 * Clears the controller endpoint from config
 */
export declare function clearControllerEndpoint(): void;
export {};
//# sourceMappingURL=config.d.ts.map