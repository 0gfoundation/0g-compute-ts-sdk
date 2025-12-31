#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = controller;
const tslib_1 = require("tslib");
const util_1 = require("./util");
const network_setup_1 = require("./network-setup");
const private_key_setup_1 = require("./private-key-setup");
const controller_endpoint_setup_1 = require("./controller-endpoint-setup");
const cli_table3_1 = tslib_1.__importDefault(require("cli-table3"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const axios_1 = tslib_1.__importDefault(require("axios"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const ethers_1 = require("ethers");
const logger_1 = require("../sdk/common/logger");
/**
 * Generate a random nonce for session token
 */
function generateNonce() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`.padEnd(32, '0');
}
/**
 * Generate Session Token for Controller API authentication
 * Note: No provider parameter needed - address is derived from wallet
 */
async function generateControllerSessionToken(wallet, duration = 3600000 // Default 1 hour
) {
    const timestamp = Date.now();
    const nonce = generateNonce();
    const userAddress = await wallet.getAddress();
    const token = {
        address: userAddress,
        timestamp,
        expiresAt: duration > 0 ? timestamp + duration : 0,
        nonce,
    };
    const message = JSON.stringify(token);
    const messageHash = (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(message));
    const signature = await wallet.signMessage(Buffer.from(messageHash.slice(2), 'hex'));
    const rawToken = `app-sk-${Buffer.from(message + '|' + signature).toString('base64')}`;
    return rawToken;
}
/**
 * Handle axios error and display friendly message
 */
function handleAxiosError(error) {
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error;
        const status = axiosError.response.status;
        const errorMsg = axiosError.response.data?.error || axiosError.response.statusText;
        if (status === 401) {
            console.error(chalk_1.default.red('Error: Authentication failed.'), 'Your wallet address may not be in the admin whitelist.');
        }
        else if (status === 403) {
            console.error(chalk_1.default.red('Error: Access forbidden.'), 'Your IP may not be in the allowed list.');
        }
        else {
            console.error(chalk_1.default.red(`Error (${status}):`), errorMsg);
        }
    }
    else if (error instanceof Error) {
        console.error(chalk_1.default.red('Error:'), error.message);
    }
    else {
        console.error(chalk_1.default.red('Error:'), String(error));
    }
    process.exit(1);
}
function controller(program) {
    program
        .command('status')
        .description('[For provider] View container status')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--controller-endpoint <url>', 'Controller endpoint URL (overrides saved config)')
        .action(async (options) => {
        try {
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const broker = await (0, util_1.initBroker)(options);
            const userAddress = await wallet.getAddress();
            const endpoint = await (0, controller_endpoint_setup_1.getControllerEndpoint)(options, broker, userAddress);
            const rawToken = await generateControllerSessionToken(wallet);
            logger_1.logger.debug(`Fetching container status from: ${endpoint}/v1/containers`);
            const response = await axios_1.default.get(`${endpoint}/v1/containers`, {
                headers: {
                    Authorization: `Bearer ${rawToken}`,
                },
            });
            const containers = response.data.containers || [];
            if (containers.length === 0) {
                console.log('No containers found.');
                process.exit(0);
            }
            const table = new cli_table3_1.default({
                head: ['Name', 'State', 'Health', 'Image'],
                colWidths: [45, 12, 12, 50],
            });
            containers.forEach((container) => {
                const stateColor = container.state === 'running'
                    ? chalk_1.default.green
                    : chalk_1.default.red;
                const healthColor = container.health === 'healthy'
                    ? chalk_1.default.green
                    : container.health === 'unhealthy'
                        ? chalk_1.default.red
                        : chalk_1.default.yellow;
                table.push([
                    container.name,
                    stateColor(container.state),
                    healthColor(container.health || 'N/A'),
                    container.image || 'N/A',
                ]);
            });
            console.log('\nContainer Status:');
            console.log(table.toString());
            process.exit(0);
        }
        catch (error) {
            handleAxiosError(error);
        }
    });
    program
        .command('restart')
        .description('[For provider] Restart a specific container')
        .requiredOption('--container <name>', 'Container name (broker/event or full name)')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--controller-endpoint <url>', 'Controller endpoint URL (overrides saved config)')
        .action(async (options) => {
        try {
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const broker = await (0, util_1.initBroker)(options);
            const userAddress = await wallet.getAddress();
            const endpoint = await (0, controller_endpoint_setup_1.getControllerEndpoint)(options, broker, userAddress);
            const rawToken = await generateControllerSessionToken(wallet);
            console.log(chalk_1.default.blue(`Restarting container: ${options.container}...`));
            await axios_1.default.post(`${endpoint}/v1/containers/${options.container}/restart`, {}, {
                headers: {
                    Authorization: `Bearer ${rawToken}`,
                },
            });
            console.log(chalk_1.default.green(`Container ${options.container} restarted successfully!`));
            process.exit(0);
        }
        catch (error) {
            handleAxiosError(error);
        }
    });
    program
        .command('start')
        .description('[For provider] Start a specific container')
        .requiredOption('--container <name>', 'Container name (broker/event or full name)')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--controller-endpoint <url>', 'Controller endpoint URL (overrides saved config)')
        .action(async (options) => {
        try {
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const broker = await (0, util_1.initBroker)(options);
            const userAddress = await wallet.getAddress();
            const endpoint = await (0, controller_endpoint_setup_1.getControllerEndpoint)(options, broker, userAddress);
            const rawToken = await generateControllerSessionToken(wallet);
            console.log(chalk_1.default.blue(`Starting container: ${options.container}...`));
            await axios_1.default.post(`${endpoint}/v1/containers/${options.container}/start`, {}, {
                headers: {
                    Authorization: `Bearer ${rawToken}`,
                },
            });
            console.log(chalk_1.default.green(`Container ${options.container} started successfully!`));
            process.exit(0);
        }
        catch (error) {
            handleAxiosError(error);
        }
    });
    program
        .command('stop')
        .description('[For provider] Stop a specific container')
        .requiredOption('--container <name>', 'Container name (broker/event or full name)')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--controller-endpoint <url>', 'Controller endpoint URL (overrides saved config)')
        .action(async (options) => {
        try {
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const broker = await (0, util_1.initBroker)(options);
            const userAddress = await wallet.getAddress();
            const endpoint = await (0, controller_endpoint_setup_1.getControllerEndpoint)(options, broker, userAddress);
            const rawToken = await generateControllerSessionToken(wallet);
            console.log(chalk_1.default.blue(`Stopping container: ${options.container}...`));
            await axios_1.default.post(`${endpoint}/v1/containers/${options.container}/stop`, {}, {
                headers: {
                    Authorization: `Bearer ${rawToken}`,
                },
            });
            console.log(chalk_1.default.green(`Container ${options.container} stopped successfully!`));
            process.exit(0);
        }
        catch (error) {
            handleAxiosError(error);
        }
    });
    program
        .command('get-config')
        .description('[For provider] Get configuration (core/ingress/prometheus)')
        .requiredOption('--type <type>', 'Config type: core (broker+event YAML), ingress (env vars), prometheus (base64 YAML)')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--controller-endpoint <url>', 'Controller endpoint URL (overrides saved config)')
        .option('--output <path>', 'Output file path (optional)')
        .option('--decode', 'Decode base64 content (for prometheus config)')
        .action(async (options) => {
        try {
            const configType = options.type.toLowerCase();
            if (!['core', 'ingress', 'prometheus'].includes(configType)) {
                console.error(chalk_1.default.red('Error: --type must be one of: core, ingress, prometheus'));
                process.exit(1);
            }
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const broker = await (0, util_1.initBroker)(options);
            const userAddress = await wallet.getAddress();
            const endpoint = await (0, controller_endpoint_setup_1.getControllerEndpoint)(options, broker, userAddress);
            const rawToken = await generateControllerSessionToken(wallet);
            console.log(`${endpoint}/v1/config/${configType}`);
            const response = await axios_1.default.get(`${endpoint}/v1/config/${configType}`, {
                headers: {
                    Authorization: `Bearer ${rawToken}`,
                },
            });
            let output;
            if (configType === 'ingress') {
                // ingress returns { env: { KEY: VALUE, ... } }
                output = JSON.stringify(response.data.env, null, 2);
            }
            else if (configType === 'prometheus') {
                // prometheus returns { config: "base64..." }
                const base64Config = response.data.config;
                if (options.decode && base64Config) {
                    output = Buffer.from(base64Config, 'base64').toString('utf-8');
                }
                else {
                    output = base64Config || '';
                }
            }
            else {
                // core returns { config: "yaml..." }
                output = response.data.config;
            }
            if (options.output) {
                fs_1.default.writeFileSync(options.output, output);
                console.log(chalk_1.default.green(`Config saved to: ${options.output}`));
            }
            else {
                console.log(chalk_1.default.blue(`\nConfiguration (${configType}):\n`));
                console.log(output);
            }
            process.exit(0);
        }
        catch (error) {
            handleAxiosError(error);
        }
    });
    program
        .command('update-config')
        .description('[For provider] Update configuration (core/ingress/prometheus)')
        .requiredOption('--type <type>', 'Config type: core (YAML file), ingress (JSON env vars), prometheus (YAML file, will be base64 encoded)')
        .requiredOption('--config <path>', 'Path to config file')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--controller-endpoint <url>', 'Controller endpoint URL (overrides saved config)')
        .action(async (options) => {
        try {
            const configType = options.type.toLowerCase();
            if (!['core', 'ingress', 'prometheus'].includes(configType)) {
                console.error(chalk_1.default.red('Error: --type must be one of: core, ingress, prometheus'));
                process.exit(1);
            }
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const broker = await (0, util_1.initBroker)(options);
            const userAddress = await wallet.getAddress();
            const endpoint = await (0, controller_endpoint_setup_1.getControllerEndpoint)(options, broker, userAddress);
            const rawToken = await generateControllerSessionToken(wallet);
            const configContent = fs_1.default.readFileSync(options.config, 'utf-8');
            console.log(chalk_1.default.blue(`Updating ${configType} config...`));
            let requestBody;
            if (configType === 'ingress') {
                // ingress expects { env: { KEY: VALUE, ... } }
                const envVars = JSON.parse(configContent);
                requestBody = { env: envVars };
            }
            else if (configType === 'prometheus') {
                // prometheus expects { config: "base64..." }
                const base64Content = Buffer.from(configContent).toString('base64');
                requestBody = { config: base64Content };
            }
            else {
                // core expects { config: "yaml..." }
                requestBody = { config: configContent };
            }
            await axios_1.default.put(`${endpoint}/v1/config/${configType}`, requestBody, {
                headers: {
                    Authorization: `Bearer ${rawToken}`,
                    'Content-Type': 'application/json',
                },
            });
            console.log(chalk_1.default.green('Config updated successfully!'));
            if (configType === 'core') {
                console.log(chalk_1.default.green('Broker and event containers restarted.'));
            }
            process.exit(0);
        }
        catch (error) {
            handleAxiosError(error);
        }
    });
    // Admin whitelist management commands
    program
        .command('list-admins')
        .description('[For provider] List admin wallet addresses')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--controller-endpoint <url>', 'Controller endpoint URL (overrides saved config)')
        .action(async (options) => {
        try {
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const broker = await (0, util_1.initBroker)(options);
            const userAddress = await wallet.getAddress();
            const endpoint = await (0, controller_endpoint_setup_1.getControllerEndpoint)(options, broker, userAddress);
            const rawToken = await generateControllerSessionToken(wallet);
            const response = await axios_1.default.get(`${endpoint}/v1/admin/wallets`, {
                headers: {
                    Authorization: `Bearer ${rawToken}`,
                },
            });
            const addresses = response.data.addresses || [];
            console.log(chalk_1.default.blue('\nAdmin Wallet Addresses:'));
            if (addresses.length === 0) {
                console.log('  No admin addresses configured.');
            }
            else {
                addresses.forEach((addr, index) => {
                    console.log(`  ${index + 1}. ${addr}`);
                });
            }
            process.exit(0);
        }
        catch (error) {
            handleAxiosError(error);
        }
    });
    program
        .command('add-admin')
        .description('[For provider] Add admin wallet address')
        .requiredOption('--address <address>', 'Wallet address to add')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--controller-endpoint <url>', 'Controller endpoint URL (overrides saved config)')
        .action(async (options) => {
        try {
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const broker = await (0, util_1.initBroker)(options);
            const userAddress = await wallet.getAddress();
            const endpoint = await (0, controller_endpoint_setup_1.getControllerEndpoint)(options, broker, userAddress);
            const rawToken = await generateControllerSessionToken(wallet);
            await axios_1.default.post(`${endpoint}/v1/admin/wallets`, { address: options.address }, {
                headers: {
                    Authorization: `Bearer ${rawToken}`,
                    'Content-Type': 'application/json',
                },
            });
            console.log(chalk_1.default.green(`Admin wallet added: ${options.address}`));
            process.exit(0);
        }
        catch (error) {
            handleAxiosError(error);
        }
    });
    program
        .command('remove-admin')
        .description('[For provider] Remove admin wallet address')
        .requiredOption('--address <address>', 'Wallet address to remove')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--controller-endpoint <url>', 'Controller endpoint URL (overrides saved config)')
        .action(async (options) => {
        try {
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const broker = await (0, util_1.initBroker)(options);
            const userAddress = await wallet.getAddress();
            const endpoint = await (0, controller_endpoint_setup_1.getControllerEndpoint)(options, broker, userAddress);
            const rawToken = await generateControllerSessionToken(wallet);
            await axios_1.default.delete(`${endpoint}/v1/admin/wallets/${encodeURIComponent(options.address)}`, {
                headers: {
                    Authorization: `Bearer ${rawToken}`,
                },
            });
            console.log(chalk_1.default.green(`Admin wallet removed: ${options.address}`));
            process.exit(0);
        }
        catch (error) {
            handleAxiosError(error);
        }
    });
    // IP whitelist management commands
    program
        .command('list-ips')
        .description('[For provider] List allowed IP addresses')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--controller-endpoint <url>', 'Controller endpoint URL (overrides saved config)')
        .action(async (options) => {
        try {
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const broker = await (0, util_1.initBroker)(options);
            const userAddress = await wallet.getAddress();
            const endpoint = await (0, controller_endpoint_setup_1.getControllerEndpoint)(options, broker, userAddress);
            const rawToken = await generateControllerSessionToken(wallet);
            const response = await axios_1.default.get(`${endpoint}/v1/admin/ips`, {
                headers: {
                    Authorization: `Bearer ${rawToken}`,
                },
            });
            const ips = response.data.ips || [];
            console.log(chalk_1.default.blue('\nAllowed IP Addresses:'));
            if (ips.length === 0) {
                console.log('  No IP whitelist configured (all IPs allowed).');
            }
            else {
                ips.forEach((ip, index) => {
                    console.log(`  ${index + 1}. ${ip}`);
                });
            }
            process.exit(0);
        }
        catch (error) {
            handleAxiosError(error);
        }
    });
    program
        .command('add-ip')
        .description('[For provider] Add IP to whitelist')
        .requiredOption('--ip <ip>', 'IP address or CIDR to add (e.g., 192.168.1.100 or 192.168.1.0/24)')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--controller-endpoint <url>', 'Controller endpoint URL (overrides saved config)')
        .action(async (options) => {
        try {
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const broker = await (0, util_1.initBroker)(options);
            const userAddress = await wallet.getAddress();
            const endpoint = await (0, controller_endpoint_setup_1.getControllerEndpoint)(options, broker, userAddress);
            const rawToken = await generateControllerSessionToken(wallet);
            await axios_1.default.post(`${endpoint}/v1/admin/ips`, { ip: options.ip }, {
                headers: {
                    Authorization: `Bearer ${rawToken}`,
                    'Content-Type': 'application/json',
                },
            });
            console.log(chalk_1.default.green(`IP added to whitelist: ${options.ip}`));
            process.exit(0);
        }
        catch (error) {
            handleAxiosError(error);
        }
    });
    program
        .command('remove-ip')
        .description('[For provider] Remove IP from whitelist')
        .requiredOption('--ip <ip>', 'IP address or CIDR to remove')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--controller-endpoint <url>', 'Controller endpoint URL (overrides saved config)')
        .action(async (options) => {
        try {
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const broker = await (0, util_1.initBroker)(options);
            const userAddress = await wallet.getAddress();
            const endpoint = await (0, controller_endpoint_setup_1.getControllerEndpoint)(options, broker, userAddress);
            const rawToken = await generateControllerSessionToken(wallet);
            await axios_1.default.delete(`${endpoint}/v1/admin/ips/${encodeURIComponent(options.ip)}`, {
                headers: {
                    Authorization: `Bearer ${rawToken}`,
                },
            });
            console.log(chalk_1.default.green(`IP removed from whitelist: ${options.ip}`));
            process.exit(0);
        }
        catch (error) {
            handleAxiosError(error);
        }
    });
    // Image management commands
    program
        .command('image-info')
        .description('[For provider] Get current image information')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--controller-endpoint <url>', 'Controller endpoint URL (overrides saved config)')
        .action(async (options) => {
        try {
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const broker = await (0, util_1.initBroker)(options);
            const userAddress = await wallet.getAddress();
            const endpoint = await (0, controller_endpoint_setup_1.getControllerEndpoint)(options, broker, userAddress);
            logger_1.logger.debug(`Fetching image info from: ${endpoint}/v1/images/info`);
            const rawToken = await generateControllerSessionToken(wallet);
            const response = await axios_1.default.get(`${endpoint}/v1/images/info`, {
                headers: {
                    Authorization: `Bearer ${rawToken}`,
                },
            });
            const info = response.data;
            console.log(chalk_1.default.blue('\nCurrent Image Information:'));
            console.log(`  Image:    ${info.image}`);
            console.log(`  Digest:   ${info.digest || 'N/A'}`);
            console.log(`  Image ID: ${info.imageId}`);
            console.log(`  Created:  ${info.created}`);
            console.log(`  Size:     ${(info.size / 1024 / 1024).toFixed(2)} MB`);
            process.exit(0);
        }
        catch (error) {
            handleAxiosError(error);
        }
    });
    program
        .command('update-images')
        .description('[For provider] Pull latest image and recreate broker/event containers')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--controller-endpoint <url>', 'Controller endpoint URL (overrides saved config)')
        .action(async (options) => {
        try {
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const broker = await (0, util_1.initBroker)(options);
            const userAddress = await wallet.getAddress();
            const endpoint = await (0, controller_endpoint_setup_1.getControllerEndpoint)(options, broker, userAddress);
            const rawToken = await generateControllerSessionToken(wallet);
            console.log(chalk_1.default.blue('Pulling latest image and updating containers...'));
            console.log(chalk_1.default.yellow('This may take a few minutes. Please wait...\n'));
            const response = await axios_1.default.post(`${endpoint}/v1/images/update`, {}, {
                headers: {
                    Authorization: `Bearer ${rawToken}`,
                },
                timeout: 300000, // 5 minutes timeout for image pull
            });
            const result = response.data;
            if (result.success) {
                console.log(chalk_1.default.green('Image updated successfully!\n'));
                console.log(`  Image:    ${result.image}`);
                console.log(`  Digest:   ${result.digest || 'N/A'}`);
                console.log(`  Image ID: ${result.imageId}\n`);
                if (result.updatedContainers &&
                    result.updatedContainers.length > 0) {
                    const table = new cli_table3_1.default({
                        head: ['Container', 'Old ID', 'New ID', 'Status'],
                        colWidths: [40, 15, 15, 12],
                    });
                    result.updatedContainers.forEach((container) => {
                        const statusColor = container.status === 'running'
                            ? chalk_1.default.green
                            : chalk_1.default.red;
                        table.push([
                            container.name,
                            container.oldContainerId,
                            container.newContainerId,
                            statusColor(container.status),
                        ]);
                    });
                    console.log('Updated Containers:');
                    console.log(table.toString());
                }
            }
            else {
                console.error(chalk_1.default.red('Image update failed:'), result.error);
                process.exit(1);
            }
            process.exit(0);
        }
        catch (error) {
            handleAxiosError(error);
        }
    });
    // Controller endpoint management command
    program
        .command('reset-controller-endpoint')
        .description('[For provider] Reset saved controller endpoint configuration')
        .action(async () => {
        (0, controller_endpoint_setup_1.resetControllerEndpoint)();
        console.log(chalk_1.default.gray('Next command will prompt for endpoint configuration again.'));
        process.exit(0);
    });
}
//# sourceMappingURL=controller.js.map