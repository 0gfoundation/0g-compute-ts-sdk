#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = inference;
const tslib_1 = require("tslib");
const util_1 = require("./util");
const network_setup_1 = require("./network-setup");
const private_key_setup_1 = require("./private-key-setup");
const interactive_selection_1 = require("./interactive-selection");
const cli_table3_1 = tslib_1.__importDefault(require("cli-table3"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const axios_1 = tslib_1.__importDefault(require("axios"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const ethers_1 = require("ethers");
async function promptDurationSelection() {
    console.log(chalk_1.default.blue('\n⏱️  API Key Duration Selection'));
    console.log();
    const durationChoice = await (0, interactive_selection_1.interactiveSelect)({
        message: 'Please select the API Key expiration duration:',
        options: [
            {
                title: 'Never expires',
                value: '0',
                description: 'API Key will never expire (can still be revoked)',
            },
            {
                title: '1 hour',
                value: '3600000',
                description: '3600 seconds (1 hour)',
            },
            {
                title: '24 hours',
                value: '86400000',
                description: '86400 seconds (24 hours)',
            },
            {
                title: '7 days',
                value: '604800000',
                description: '604800 seconds (7 days)',
            },
            {
                title: '30 days',
                value: '2592000000',
                description: '2592000 seconds (30 days)',
            },
            {
                title: 'Custom duration',
                value: 'custom',
                description: 'Enter custom duration in seconds',
            },
        ],
    });
    if (durationChoice === 'custom') {
        console.log();
        const customSeconds = await (0, interactive_selection_1.textInput)('Enter duration in seconds (0 for never expires):');
        const seconds = parseInt(customSeconds);
        if (isNaN(seconds) || seconds < 0) {
            throw new Error('Duration must be a non-negative number');
        }
        return seconds * 1000; // Convert to milliseconds
    }
    return parseInt(durationChoice);
}
function inference(program) {
    program
        .command('list-providers')
        .description('List inference providers')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--include-invalid', 'Include all services, even those without valid teeSignerAddress')
        .action((options) => {
        const table = new cli_table3_1.default({
            colWidths: [50, 50],
        });
        (0, util_1.withBroker)(options, async (broker) => {
            // TODO: Support pagination for listing services
            const services = await broker.inference.listService(0, 50, options.includeInvalid);
            services.forEach((service, index) => {
                table.push([
                    chalk_1.default.blue(`Provider ${index + 1}`),
                    chalk_1.default.blue(service.provider),
                ]);
                table.push(['Model', service.model || 'N/A']);
                // Only show input price for non text-to-image and non image-editing services
                if (service.serviceType !== 'text-to-image' &&
                    service.serviceType !== 'image-editing') {
                    table.push([
                        'Input Price Per Token (0G)',
                        service.inputPrice
                            ? (0, util_1.neuronToA0gi)(BigInt(service.inputPrice)).toFixed(18)
                            : 'N/A',
                    ]);
                }
                // Change output price label for text-to-image and image-editing services
                const outputPriceLabel = service.serviceType === 'text-to-image' ||
                    service.serviceType === 'image-editing'
                    ? 'Price Per Image (OG)'
                    : 'Output Price Per Token (0G)';
                table.push([
                    outputPriceLabel,
                    service.outputPrice
                        ? (0, util_1.neuronToA0gi)(BigInt(service.outputPrice)).toFixed(18)
                        : 'N/A',
                ]);
                table.push([
                    'Verifiability',
                    service.verifiability || 'N/A',
                ]);
            });
            console.log(table.toString());
        });
    });
    program
        .command('acknowledge-provider')
        .description('Acknowledge the provider signer')
        .requiredOption('--provider <address>', 'Provider address')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--gas-price <price>', 'Gas price for transactions')
        .action((options) => {
        (0, util_1.withBroker)(options, async (broker) => {
            await broker.inference.acknowledgeProviderSigner(options.provider, options.gasPrice);
            console.log('Provider signer acknowledged successfully!');
        });
    });
    program
        .command('remove-service')
        .description('[For provider] Remove your service from the contract')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--gas-price <price>', 'Gas price for transactions')
        .action((options) => {
        (0, util_1.withBroker)(options, async (broker) => {
            await broker.inference.removeService(options.gasPrice);
            console.log('Service removed successfully!');
        });
    });
    program
        .command('update-service')
        .description('[For provider] Update your service (url, model, input price, output price)')
        .option('--url <url>', 'New service URL')
        .option('--model <model>', 'New model name')
        .option('--input-price <price>', 'New input price in 0G (e.g., 0.000000000000000001)')
        .option('--output-price <price>', 'New output price in 0G (e.g., 0.000000000000000001)')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--gas-price <price>', 'Gas price for transactions')
        .action((options) => {
        // Check that at least one update option is provided
        if (!options.url &&
            !options.model &&
            !options.inputPrice &&
            !options.outputPrice) {
            console.error('Error: At least one of --url, --model, --input-price, or --output-price must be provided');
            process.exit(1);
        }
        (0, util_1.withBroker)(options, async (broker) => {
            const updateOptions = {};
            if (options.url) {
                updateOptions.url = options.url;
            }
            if (options.model) {
                updateOptions.model = options.model;
            }
            if (options.inputPrice) {
                updateOptions.inputPrice = (0, util_1.a0giToNeuron)(parseFloat(options.inputPrice));
            }
            if (options.outputPrice) {
                updateOptions.outputPrice = (0, util_1.a0giToNeuron)(parseFloat(options.outputPrice));
            }
            if (options.gasPrice) {
                updateOptions.gasPrice = options.gasPrice;
            }
            console.log('Updating service with options:', {
                url: updateOptions.url,
                model: updateOptions.model,
                inputPrice: updateOptions.inputPrice
                    ? `${updateOptions.inputPrice} neuron`
                    : undefined,
                outputPrice: updateOptions.outputPrice
                    ? `${updateOptions.outputPrice} neuron`
                    : undefined,
            });
            await broker.inference.updateService(updateOptions);
            console.log('Service updated successfully!');
        });
    });
    program
        .command('serve')
        .description('Start local inference service')
        .requiredOption('--provider <address>', 'Provider address')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--gas-price <price>', 'Gas price for transactions')
        .option('--port <port>', 'Port to run the local inference service on', '3000')
        .option('--host <host>', 'Host to bind the local inference service', '0.0.0.0')
        .action(async (options) => {
        // Ensure RPC endpoint is configured
        const rpc = await (0, network_setup_1.getRpcEndpoint)(options);
        // Ensure private key is configured
        const key = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
        const { runInferenceServer } = await Promise.resolve().then(() => tslib_1.__importStar(require('../example/inference-server')));
        await runInferenceServer({ ...options, rpc, key });
    });
    program
        .command('router-serve')
        .description('Start high-availability router service with multiple providers')
        .option('--add-provider <address,priority>', 'Add on-chain provider with priority (e.g., 0x1234567890abcdef,10). Use comma separator. Can be used multiple times', (value, previous) => {
        const providers = previous || [];
        const [address, priority] = value.split(',');
        if (!address) {
            throw new Error('Invalid provider format. Use: address,priority (comma-separated)');
        }
        providers.push({
            address: address.trim(),
            priority: priority && priority.trim()
                ? parseInt(priority.trim())
                : 100,
        });
        return providers;
    }, [])
        .option('--add-endpoint <id,endpoint,apikey,model,priority>', 'Add direct endpoint (e.g., openai,https://api.openai.com/v1,key,gpt-4o,10). Use commas as separators. Can be used multiple times', (value, previous) => {
        const endpoints = previous || [];
        const [id, endpoint, apiKey, model, priority] = value.split(',');
        if (!id || !endpoint) {
            throw new Error('Invalid endpoint format. Use: id,endpoint,apikey,model,priority (comma-separated)');
        }
        endpoints.push({
            id: id.trim(),
            endpoint: endpoint.trim(),
            apiKey: apiKey && apiKey.trim() ? apiKey.trim() : undefined,
            model: model && model.trim() ? model.trim() : 'gpt-3.5-turbo',
            priority: priority && priority.trim()
                ? parseInt(priority.trim())
                : 50,
        });
        return endpoints;
    }, [])
        .option('--default-provider-priority <number>', 'Default priority for on-chain providers not explicitly set', '100')
        .option('--default-endpoint-priority <number>', 'Default priority for direct endpoints not explicitly set', '50')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--gas-price <price>', 'Gas price for transactions')
        .option('--port <port>', 'Port to run the router service on', '3000')
        .option('--host <host>', 'Host to bind the router service', '0.0.0.0')
        .option('--cache-duration <seconds>', 'Cache duration in seconds', '60')
        .option('--request-timeout <seconds>', 'Request timeout in seconds for each provider', '60')
        .action(async (options) => {
        // Build providers list with priorities
        const providers = [];
        const providerPriorities = {};
        if (options.addProvider && options.addProvider.length > 0) {
            for (const prov of options.addProvider) {
                providers.push(prov.address);
                providerPriorities[prov.address] = prov.priority;
            }
        }
        // Build direct endpoints
        const directEndpoints = {};
        if (options.addEndpoint && options.addEndpoint.length > 0) {
            for (const ep of options.addEndpoint) {
                directEndpoints[ep.id] = {
                    endpoint: ep.endpoint,
                    apiKey: ep.apiKey,
                    model: ep.model,
                    priority: ep.priority,
                };
            }
        }
        // Build priority config
        const priorityConfig = {
            providers: providerPriorities,
            defaultProviderPriority: parseInt(options.defaultProviderPriority),
            defaultEndpointPriority: parseInt(options.defaultEndpointPriority),
        };
        // Ensure at least one provider type is specified
        if (providers.length === 0 &&
            Object.keys(directEndpoints).length === 0) {
            console.error('Error: Must specify either --add-provider or --add-endpoint');
            process.exit(1);
        }
        // Ensure RPC endpoint is configured if we have on-chain providers
        let rpc = options.rpc;
        let key = options.key;
        if (providers.length > 0) {
            if (!rpc) {
                rpc = await (0, network_setup_1.getRpcEndpoint)(options);
            }
            if (!key) {
                key = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            }
        }
        const routerOptions = {
            ...options,
            rpc,
            key,
            providers,
            directEndpoints: Object.keys(directEndpoints).length > 0
                ? directEndpoints
                : undefined,
            priorityConfig,
            requestTimeout: options.requestTimeout,
        };
        const { runRouterServer } = await Promise.resolve().then(() => tslib_1.__importStar(require('../example/router-server')));
        await runRouterServer(routerOptions);
    });
    program
        .command('download-report')
        .description('Download quote data to a specified file')
        .requiredOption('--provider <address>', 'Provider address')
        .requiredOption('--output <path>', 'Output file path for the quote report')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--gas-price <price>', 'Gas price for transactions')
        .action((options) => {
        (0, util_1.withBroker)(options, async (broker) => {
            await broker.inference.downloadQuoteReport(options.provider, options.output);
            console.log(`Quote report downloaded to: ${options.output}`);
        });
    });
    program
        .command('verify')
        .description('Verify the reliability of a service')
        .requiredOption('--provider <address>', 'Provider address')
        .option('--output-dir <path>', 'Output directory for verification reports', '.')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action((options) => {
        (0, util_1.withBroker)(options, async (broker) => {
            const result = await broker.inference.verifyService(options.provider, options.outputDir);
            if (result) {
                if (!result.success) {
                    console.log('❌ Service verification failed');
                }
            }
            else {
                console.log('Verification result is null');
            }
        });
    });
    program
        .command('list-logs')
        .description('[For provider] List available log files from your provider service')
        .option('--component <component>', 'Component name (broker/event/both)', 'both')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
        try {
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const userAddress = await wallet.getAddress();
            const broker = await (0, util_1.initBroker)(options);
            try {
                // Get service metadata for current user's provider service
                const serviceMetadata = await broker.inference.getServiceMetadata(userAddress);
                // Create session for provider authentication
                const session = await broker.inference.requestProcessor.getOrCreateSession(userAddress);
                const endpoint = `${serviceMetadata.endpoint.replace('/proxy', '/logs')}?component=${options.component}`;
                const response = await axios_1.default.get(endpoint, {
                    headers: {
                        Address: userAddress,
                        'Session-Token': session.rawMessage,
                        'Session-Signature': session.signature,
                    },
                });
                const logs = response.data.logs || [];
                if (logs.length === 0) {
                    console.log('No log files found.');
                    return;
                }
                const table = new cli_table3_1.default({
                    head: [
                        'Component',
                        'Filename',
                        'Size (bytes)',
                        'Modified Time',
                        'Current',
                    ],
                    colWidths: [12, 30, 15, 25, 10],
                });
                logs.forEach((log) => {
                    const modifiedTime = new Date(log.modifiedTime * 1000).toLocaleString();
                    const isCurrent = log.isCurrentLog ? '✓' : '';
                    const size = log.size.toLocaleString();
                    table.push([
                        chalk_1.default.blue(log.component),
                        log.name,
                        size,
                        modifiedTime,
                        isCurrent ? chalk_1.default.green(isCurrent) : '',
                    ]);
                });
                console.log('\nAvailable Log Files:');
                console.log(table.toString());
                process.exit(0);
            }
            catch (error) {
                if (error &&
                    typeof error === 'object' &&
                    'response' in error) {
                    const axiosError = error;
                    console.error('Error:', axiosError.response.data?.error ||
                        axiosError.response.statusText);
                }
                else if (error instanceof Error) {
                    console.error('Error:', error.message);
                }
                else {
                    console.error('Error:', String(error));
                }
                process.exit(1);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Error:', error.message);
            }
            else {
                console.error('Error:', String(error));
            }
            process.exit(1);
        }
    });
    program
        .command('download-log')
        .description('[For provider] Download a specific log file from your provider service')
        .requiredOption('--component <component>', 'Component name (broker/event)')
        .requiredOption('--filename <filename>', 'Log file name')
        .option('--output <path>', 'Output file path (defaults to filename)')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
        try {
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const userAddress = await wallet.getAddress();
            const broker = await (0, util_1.initBroker)(options);
            try {
                // Get service metadata for current user's provider service
                const serviceMetadata = await broker.inference.getServiceMetadata(userAddress);
                // Create session for provider authentication
                const session = await broker.inference.requestProcessor.getOrCreateSession(userAddress);
                const endpoint = `${serviceMetadata.endpoint.replace('/proxy', '/logs')}/${options.component}/${options.filename}`;
                const response = await axios_1.default.get(endpoint, {
                    headers: {
                        Address: userAddress,
                        'Session-Token': session.rawMessage,
                        'Session-Signature': session.signature,
                    },
                    responseType: 'stream',
                });
                const outputPath = options.output || options.filename;
                const writer = fs_1.default.createWriteStream(outputPath);
                response.data.pipe(writer);
                writer.on('finish', () => {
                    console.log(`Log file downloaded to: ${outputPath}`);
                    process.exit(0);
                });
                writer.on('error', (error) => {
                    console.error('Error writing file:', error.message);
                    process.exit(1);
                });
            }
            catch (error) {
                if (error &&
                    typeof error === 'object' &&
                    'response' in error) {
                    const axiosError = error;
                    console.error('Error:', axiosError.response.data?.error ||
                        axiosError.response.statusText);
                }
                else if (error instanceof Error) {
                    console.error('Error:', error.message);
                }
                else {
                    console.error('Error:', String(error));
                }
                process.exit(1);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Error:', error.message);
            }
            else {
                console.error('Error:', String(error));
            }
            process.exit(1);
        }
    });
    program
        .command('view-log')
        .description('[For provider] View a specific log file content from your provider service')
        .requiredOption('--component <component>', 'Component name (broker/event)')
        .requiredOption('--filename <filename>', 'Log file name')
        .option('--lines <number>', 'Number of lines to show (default: all)', 'all')
        .option('--tail', 'Show last N lines instead of first N lines')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
        try {
            const rpcEndpoint = await (0, network_setup_1.getRpcEndpoint)(options);
            const privateKey = await (0, private_key_setup_1.ensurePrivateKeyConfiguration)();
            if (!privateKey) {
                throw new Error('Private key is required');
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const userAddress = await wallet.getAddress();
            const broker = await (0, util_1.initBroker)(options);
            try {
                // Get service metadata for current user's provider service
                const serviceMetadata = await broker.inference.getServiceMetadata(userAddress);
                // Create session for provider authentication
                const session = await broker.inference.requestProcessor.getOrCreateSession(userAddress);
                const endpoint = `${serviceMetadata.endpoint.replace('/proxy', '/logs')}/${options.component}/${options.filename}`;
                const response = await axios_1.default.get(endpoint, {
                    headers: {
                        Address: userAddress,
                        'Session-Token': session.rawMessage,
                        'Session-Signature': session.signature,
                    },
                });
                let content = response.data;
                if (options.lines !== 'all') {
                    const numLines = parseInt(options.lines);
                    const lines = content.split('\n');
                    if (options.tail) {
                        content = lines.slice(-numLines).join('\n');
                    }
                    else {
                        content = lines.slice(0, numLines).join('\n');
                    }
                }
                console.log(`\n${chalk_1.default.blue('Log file:')} ${options.component}/${options.filename}`);
                console.log(`${chalk_1.default.blue('Provider:')} ${userAddress}`);
                console.log('─'.repeat(80));
                console.log(content);
                if (content && !content.endsWith('\n')) {
                    console.log(); // Add newline if content doesn't end with one
                }
                process.exit(0);
            }
            catch (error) {
                if (error &&
                    typeof error === 'object' &&
                    'response' in error) {
                    const axiosError = error;
                    console.error('Error:', axiosError.response.data?.error ||
                        axiosError.response.statusText);
                }
                else if (error instanceof Error) {
                    console.error('Error:', error.message);
                }
                else {
                    console.error('Error:', String(error));
                }
                process.exit(1);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Error:', error.message);
            }
            else {
                console.error('Error:', String(error));
            }
            process.exit(1);
        }
    });
    program
        .command('ack-provider', { hidden: true })
        .description('verify TEE remote attestation of service')
        .requiredOption('--provider <address>', 'Provider address')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--gas-price <price>', 'Gas price for transactions')
        .action((options) => {
        (0, util_1.withBroker)(options, async (broker) => {
            await broker.inference.acknowledgeProviderTEESigner(options.provider, options.gasPrice);
            console.log('Provider acknowledged successfully!');
        });
    });
    program
        .command('revoke', { hidden: true })
        .description('Revoke TEE signer acknowledgement for a provider')
        .requiredOption('--provider <address>', 'Provider address')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--gas-price <price>', 'Gas price for transactions')
        .action((options) => {
        (0, util_1.withBroker)(options, async (broker) => {
            await broker.inference.revokeProviderTEESignerAcknowledgement(options.provider, options.gasPrice);
            console.log('Provider TEE signer acknowledgement revoked successfully!');
        });
    });
    program
        .command('get-secret')
        .description('Generate an authentication secret (API Key) for API access')
        .requiredOption('--provider <address>', 'Provider address')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
        try {
            const duration = await promptDurationSelection();
            (0, util_1.withBroker)(options, async (broker) => {
                // Use createApiKey to generate a persistent token
                const apiKey = await broker.inference.requestProcessor.createApiKey(options.provider, { expiresIn: duration });
                const bearerToken = apiKey.rawToken;
                // Get service metadata to determine service type
                // TODO: Support pagination for listing services
                const services = await broker.inference.listService(0, 50, true);
                const service = services.find((s) => s.provider.toLowerCase() ===
                    options.provider.toLowerCase());
                if (!service) {
                    throw new Error(`Service not found for provider: ${options.provider}`);
                }
                const serviceType = service.serviceType;
                const serviceUrl = service.url;
                const serviceModel = service.model || 'default-model';
                console.log();
                console.log(chalk_1.default.green('✓ API Key generated successfully!'));
                console.log(chalk_1.default.gray(`Provider: ${options.provider}`));
                console.log(chalk_1.default.gray(`Service Type: ${serviceType}`));
                console.log(chalk_1.default.gray(`Token ID: ${apiKey.tokenId}`));
                if (apiKey.expiresAt > 0) {
                    console.log(chalk_1.default.gray(`Expires: ${new Date(apiKey.expiresAt).toLocaleString()}`));
                }
                else {
                    console.log(chalk_1.default.gray(`Expires: Never`));
                }
                console.log();
                console.log(chalk_1.default.blue('Use this Authorization header:'));
                console.log();
                console.log(chalk_1.default.white('Authorization: Bearer ' + bearerToken));
                console.log();
                // Show curl examples based on service type
                console.log(chalk_1.default.blue('Example curl command:'));
                console.log();
                if (serviceType === 'speech-to-text') {
                    console.log(chalk_1.default.white(`curl ${serviceUrl}/v1/proxy/audio/transcriptions \\
  -H "Authorization: Bearer ${bearerToken}" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@audio.ogg" \\
  -F "model=${serviceModel}" \\
  -F "response_format=json"`));
                }
                else if (serviceType === 'text-to-image') {
                    console.log(chalk_1.default.white(`curl ${serviceUrl}/v1/proxy/images/generations \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${bearerToken}" \\
  -d '{
    "model": "${serviceModel}",
    "prompt": "A cute baby sea otter",
    "n": 1,
    "size": "512x512",
    "response_format": "b64_json"
  }' | jq -r ".data[0].b64_json" | base64 -d > output.png && open output.png`));
                }
                else if (serviceType === 'image-editing') {
                    console.log(chalk_1.default.white(`curl -s -X POST ${serviceUrl}/v1/proxy/images/edits \\
  -H "Authorization: Bearer ${bearerToken}" \\
  -F "prompt=Create a lovely gift basket with these items in it" \\
  -F "response_format=b64_json" \\
  -F "image=@image.png" \\
  | jq -r '.data[0].b64_json' | base64 -d > result.png`));
                }
                else {
                    // Default to chatbot/text type
                    console.log(chalk_1.default.white(`curl ${serviceUrl}/v1/proxy/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${bearerToken}" \\
  -d '{
    "model": "${serviceModel}",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'`));
                }
                console.log();
                console.log(chalk_1.default.yellow('⚠️  IMPORTANT SECURITY NOTES:'));
                console.log(chalk_1.default.yellow(`   • This API Key can be revoked using: 0g-compute-cli inference revoke-token --provider ${options.provider} --token-id ${apiKey.tokenId}`));
                console.log(chalk_1.default.yellow('   • Keep it secure and do not share it'));
                if (apiKey.expiresAt > 0) {
                    console.log(chalk_1.default.yellow('   • It will expire automatically at the specified time'));
                }
            });
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(chalk_1.default.red('Error:'), error.message);
            }
            else {
                console.error(chalk_1.default.red('Error:'), String(error));
            }
            process.exit(1);
        }
    });
    program
        .command('revoke-token')
        .description('Revoke a specific API Key by its token ID')
        .requiredOption('--provider <address>', 'Provider address')
        .requiredOption('--token-id <id>', 'Token ID to revoke (0-254)')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--gas-price <price>', 'Gas price for transactions')
        .action((options) => {
        const tokenId = parseInt(options.tokenId);
        if (isNaN(tokenId) || tokenId < 0 || tokenId > 254) {
            console.error(chalk_1.default.red('Error: Token ID must be a number between 0 and 254'));
            process.exit(1);
        }
        (0, util_1.withBroker)(options, async (broker) => {
            await broker.inference.requestProcessor.revokeApiKey(options.provider, tokenId, options.gasPrice);
            console.log(chalk_1.default.green(`✓ Token ID ${tokenId} revoked successfully for provider ${options.provider}`));
        });
    });
    program
        .command('revoke-all-tokens')
        .description('Revoke all API Keys for a provider (increments generation)')
        .requiredOption('--provider <address>', 'Provider address')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--gas-price <price>', 'Gas price for transactions')
        .action((options) => {
        (0, util_1.withBroker)(options, async (broker) => {
            await broker.inference.requestProcessor.revokeAllTokens(options.provider, options.gasPrice);
            console.log(chalk_1.default.green(`✓ All tokens revoked successfully for provider ${options.provider}`));
            console.log(chalk_1.default.yellow('   Note: All existing API Keys and ephemeral tokens are now invalid.'));
        });
    });
}
//# sourceMappingURL=inference.js.map