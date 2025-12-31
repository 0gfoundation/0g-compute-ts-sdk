#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveControllerEndpoint = deriveControllerEndpoint;
exports.getControllerEndpoint = getControllerEndpoint;
exports.resetControllerEndpoint = resetControllerEndpoint;
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const config_1 = require("./config");
const interactive_selection_1 = require("./interactive-selection");
/**
 * Get Controller endpoint from provider's service URL
 * Adds 'controller-' prefix to the hostname
 * e.g., compute-network-6.example.com -> controller-compute-network-6.example.com
 */
async function deriveControllerEndpoint(broker, userAddress) {
    const serviceMetadata = await broker.inference.getServiceMetadata(userAddress);
    const url = new URL(serviceMetadata.endpoint);
    // Add 'controller-' prefix to the hostname
    url.hostname = `controller-${url.hostname}`;
    url.port = '';
    url.pathname = '';
    // Remove trailing slash to avoid double slashes when concatenating paths
    return url.toString().replace(/\/$/, '');
}
/**
 * Prompts user to select controller endpoint source
 */
async function promptControllerEndpointSelection(broker, userAddress) {
    console.log(chalk_1.default.blue('\n🔧 Controller Endpoint Setup'));
    console.log();
    const choice = await (0, interactive_selection_1.interactiveSelect)({
        message: 'How would you like to configure the controller endpoint?',
        options: [
            {
                title: 'Auto-detect from on-chain data',
                value: 'auto',
                description: 'Derive endpoint from your provider service metadata',
            },
            {
                title: 'Enter custom endpoint',
                value: 'custom',
                description: 'Manually specify the controller endpoint URL',
            },
        ],
    });
    if (choice === 'custom') {
        console.log();
        const customEndpoint = await (0, interactive_selection_1.textInput)('Enter controller endpoint URL', 'https://controller-your-domain.com');
        if (!customEndpoint) {
            console.log(chalk_1.default.red('Controller endpoint cannot be empty'));
            return await promptControllerEndpointSelection(broker, userAddress);
        }
        // Validate URL format
        try {
            new URL(customEndpoint);
        }
        catch {
            console.log(chalk_1.default.red('Invalid URL format. Please enter a valid URL.'));
            return await promptControllerEndpointSelection(broker, userAddress);
        }
        // Remove trailing slash
        const normalizedEndpoint = customEndpoint.replace(/\/$/, '');
        return { endpoint: normalizedEndpoint, source: 'custom' };
    }
    // Auto-detect from on-chain data
    console.log(chalk_1.default.gray('\nDeriving endpoint from on-chain data...'));
    const endpoint = await deriveControllerEndpoint(broker, userAddress);
    return { endpoint, source: 'auto' };
}
/**
 * Gets the controller endpoint with interactive setup if needed
 * Priority: CLI option > saved config (with notification) > interactive setup
 */
async function getControllerEndpoint(options, broker, userAddress) {
    // Priority 1: CLI option
    if (options.controllerEndpoint) {
        return options.controllerEndpoint.replace(/\/$/, '');
    }
    // Priority 2: Check saved config
    const savedConfig = (0, config_1.getConfiguredControllerEndpoint)();
    if (savedConfig.endpoint) {
        const sourceLabel = savedConfig.source === 'auto' ? 'auto-detected' : 'custom';
        console.log(chalk_1.default.cyan(`ℹ Using saved controller endpoint (${sourceLabel}): ${savedConfig.endpoint}`));
        return savedConfig.endpoint;
    }
    // Priority 3: Interactive setup
    console.log(chalk_1.default.yellow('⚠ No controller endpoint configured.'));
    const selection = await promptControllerEndpointSelection(broker, userAddress);
    console.log(chalk_1.default.green(`\n✓ Controller endpoint: ${selection.endpoint}`));
    console.log(chalk_1.default.gray(`  Source: ${selection.source === 'auto'
        ? 'Auto-detected from on-chain data'
        : 'Custom'}`));
    // Save to config
    (0, config_1.setConfiguredControllerEndpoint)(selection.endpoint, selection.source);
    console.log(chalk_1.default.blue(`ℹ Settings saved to ~/.0g-compute-cli/config.json\n`));
    return selection.endpoint;
}
/**
 * Reset controller endpoint configuration
 */
function resetControllerEndpoint() {
    (0, config_1.clearControllerEndpoint)();
    console.log(chalk_1.default.green('✓ Controller endpoint configuration cleared.'));
}
//# sourceMappingURL=controller-endpoint-setup.js.map