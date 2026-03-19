#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = fineTuning;
const tslib_1 = require("tslib");
const util_1 = require("./util");
const cli_table3_1 = tslib_1.__importDefault(require("cli-table3"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const const_1 = require("./const");
const path = tslib_1.__importStar(require("path"));
const fs = tslib_1.__importStar(require("fs/promises"));
const zg_storage_1 = require("../sdk/fine-tuning/zg-storage");
const const_2 = require("../sdk/fine-tuning/const");
const adapter_name_1 = require("../sdk/common/utils/adapter-name");
function fineTuning(program) {
    program
        .command('verify')
        .description('Verify the reliability and TEE attestation of a fine-tuning service')
        .requiredOption('--provider <address>', 'Provider address')
        .option('--output-dir <path>', 'Output directory for verification reports', '.')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .action((options) => {
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            const result = await broker.fineTuning.verifyService(options.provider, options.outputDir);
            if (!result) {
                console.error('❌ Verification failed: No result returned');
                process.exit(1);
            }
            if (!result.success) {
                console.error('❌ Service verification failed');
                console.error('   Reports saved to:', result.outputDirectory);
                console.error('   Review the attestation reports for details');
                process.exit(1);
            }
            // Success case
            console.log('✅ Verification completed successfully');
            console.log('   Reports:', result.reportsGenerated.join(', '));
            console.log('   Output directory:', result.outputDirectory);
        });
    });
    program
        .command('list-models')
        .description('List available models')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .action((options) => {
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            const models = await broker.fineTuning.listModel();
            console.log(`Predefined Model:`);
            let table = new cli_table3_1.default({
                head: [chalk_1.default.blue('Name'), chalk_1.default.blue('Description')],
                colWidths: [30, 75],
            });
            models[0].forEach((model) => {
                table.push([
                    (0, util_1.splitIntoChunks)(model[0], 28),
                    (0, util_1.splitIntoChunks)(model[1].description, 73),
                ]);
            });
            console.log(table.toString());
            console.log(`Provider's Model:`);
            table = new cli_table3_1.default({
                head: [
                    chalk_1.default.blue('Name'),
                    chalk_1.default.blue('Description'),
                    chalk_1.default.blue('Provider'),
                ],
                colWidths: [30, 75, 45],
            });
            models[1].forEach((model) => {
                table.push([
                    (0, util_1.splitIntoChunks)(model[0], 28),
                    (0, util_1.splitIntoChunks)(model[1].description, 73),
                    (0, util_1.splitIntoChunks)(model[1].provider, 42),
                ]);
            });
            console.log(table.toString());
        });
    });
    program
        .command('model-usage')
        .description('Download detailed customized model usage')
        .requiredOption('--provider <address>', 'Provider address for the task')
        .requiredOption('--model <name>', 'Pre-trained model name to use')
        .requiredOption('--output <path>', 'Download path')
        .option(`--rpc <url>', '0G Chain RPC endpoint, default is ${const_1.ZG_RPC_ENDPOINT_TESTNET}`, const_1.ZG_RPC_ENDPOINT_TESTNET)
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .action((options) => {
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            await broker.fineTuning.modelUsage(options.provider, options.model, options.output);
        });
    });
    program
        .command('upload')
        .description('Upload a dataset for fine-tuning')
        .requiredOption('--data-path <path>', 'Path to the dataset')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address, use default address if not provided')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address, use default address if not provided')
        .option('--gas-price <price>', 'Gas price for transactions')
        .option('--max-gas-price <price>', 'Max gas price for transactions')
        .option('--step <step>', 'Step for gas price adjustment')
        .action((options) => {
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            await broker.fineTuning.uploadDataset(options.dataPath);
        });
    });
    program
        .command('download')
        .description('Download a data')
        .requiredOption('--data-path <path>', 'Path to the dataset')
        .requiredOption('--data-root <hash>', 'Root hash of the dataset')
        .option(`--rpc <url>', '0G Chain RPC endpoint, default is ${const_1.ZG_RPC_ENDPOINT_TESTNET}`, const_1.ZG_RPC_ENDPOINT_TESTNET)
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .action((options) => {
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            await broker.fineTuning.downloadDataset(options.dataPath, options.dataRoot);
        });
    });
    program
        .command('calculate-token')
        .description('Calculate token count (optional - for cost estimation only, no longer required for task creation)')
        .requiredOption('--model <name>', 'Pre-trained model name to use')
        .requiredOption('--dataset-path <path>', 'Path to the zip file containing the fine-tuning dataset')
        .option('--provider <address>', 'Provider address for the task')
        .action(async (options) => {
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            await broker.fineTuning.calculateToken(options.datasetPath, options.model, false, options.provider);
        });
    });
    program
        .command('create-task')
        .description('Create a fine-tuning task (fee calculated automatically by broker)')
        .requiredOption('--provider <address>', 'Provider address for the task')
        .requiredOption('--model <name>', 'Pre-trained model name to use')
        .option('--dataset <hash>', 'Hash of the dataset (from 0G Storage)')
        .option('--dataset-path <path>', 'Path to the dataset file (will be uploaded directly to TEE)')
        .requiredOption('--config-path <path>', 'Fine-tuning configuration path')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .option('--gas-price <price>', 'Gas price for transactions')
        .option('--max-gas-price <price>', 'Max gas price for transactions')
        .option('--step <step>', 'Step for gas price adjustment')
        .action((options) => {
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            // Validate: exactly one of --dataset or --dataset-path must be provided
            if (!options.dataset && !options.datasetPath) {
                console.error(chalk_1.default.red('Error: Either --dataset (hash) or --dataset-path (file path) must be provided'));
                process.exit(1);
            }
            if (options.dataset && options.datasetPath) {
                console.error(chalk_1.default.red('Error: --dataset and --dataset-path are mutually exclusive. Please provide only one.'));
                process.exit(1);
            }
            let datasetHash = options.dataset;
            // If dataset-path is provided, upload dataset (0G Storage first, fallback to TEE)
            if (options.datasetPath) {
                try {
                    console.log('Uploading dataset to 0G Storage...');
                    const rootHash = await broker.fineTuning.uploadDataset(options.datasetPath, options.gasPrice, options.maxGasPrice);
                    if (rootHash) {
                        datasetHash = rootHash;
                        console.log('Dataset uploaded to 0G Storage, root hash:', datasetHash);
                    }
                    else {
                        throw new Error('Upload succeeded but no root hash returned');
                    }
                }
                catch (storageErr) {
                    console.warn(chalk_1.default.yellow(`\n⚠️  0G Storage upload failed: ${storageErr}`));
                    console.log('Falling back to direct TEE upload...');
                    const result = await broker.fineTuning.uploadDatasetToTEE(options.provider, options.datasetPath);
                    datasetHash = result.datasetHash;
                    console.log('Dataset uploaded to TEE (fallback), hash:', datasetHash);
                }
            }
            console.log('Verify provider...');
            await broker.fineTuning.acknowledgeProviderSigner(options.provider, options.gasPrice);
            console.log('Provider verified');
            // Check account balance and warn if insufficient
            try {
                const accountDetail = await broker.fineTuning.getAccountWithDetail(options.provider);
                const availableBalance = accountDetail.account.balance - accountDetail.account.pendingRefund;
                if (availableBalance <= BigInt(0)) {
                    console.warn(chalk_1.default.yellow('\n⚠️  Warning: Your fine-tuning account balance is 0 or negative'));
                    console.warn(chalk_1.default.yellow('   Please deposit funds before creating a task:'));
                    console.warn(chalk_1.default.cyan(`   0g-compute-cli transfer-fund --provider ${options.provider} --service fine-tuning --amount <amount>\n`));
                }
            }
            catch (err) {
                // Ignore balance check errors, proceed with task creation
            }
            console.log('Creating task (fee will be calculated automatically)...');
            const taskId = await broker.fineTuning.createTask(options.provider, options.model, datasetHash, options.configPath, options.gasPrice);
            console.log('Created Task ID:', taskId);
        });
    });
    program
        .command('cancel-task')
        .description('Cancel a fine-tuning task')
        .requiredOption('--task <id>', 'Task ID, if not provided, the latest task will be retrieved')
        .requiredOption('--provider <address>', 'Provider address for the task')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .action((options) => {
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            const r = await broker.fineTuning.cancelTask(options.provider, options.task);
            console.log(r);
        });
    });
    program
        .command('list-tasks')
        .description('Retrieve all fine-tuning task')
        .requiredOption('--provider <address>', 'Provider address')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .action((options) => {
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            const tasks = await broker.fineTuning.listTask(options.provider);
            const table = new cli_table3_1.default({
                head: [
                    chalk_1.default.blue('ID'),
                    chalk_1.default.blue('Created At'),
                    chalk_1.default.blue('Status'),
                ],
                colWidths: [50, 30, 30],
            });
            for (const task of tasks) {
                table.push([task.id, task.createdAt, task.progress]);
            }
            console.log(table.toString());
        });
    });
    program
        .command('get-task')
        .description('Retrieve fine-tuning task information')
        .requiredOption('--provider <address>', 'Provider address')
        .option('--task <id>', 'Task ID, if not provided, the latest task will be retrieved')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .action((options) => {
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            const task = await broker.fineTuning.getTask(options.provider, options.task);
            const table = new cli_table3_1.default({
                head: [chalk_1.default.blue('Field'), chalk_1.default.blue('Value')],
                colWidths: [35, 85],
            });
            table.push(['ID', task.id]);
            table.push(['Created At', task.createdAt]);
            table.push(['Pre-trained Model Hash', task.preTrainedModelHash]);
            table.push(['Dataset Hash', task.datasetHash]);
            table.push([
                'Training Params',
                (0, util_1.splitIntoChunks)(task.trainingParams, 80),
            ]);
            table.push(['Fee (neuron)', task.fee]);
            table.push(['Progress', task.progress]);
            console.log(table.toString());
        });
    });
    program
        .command('get-log')
        .description('Retrieve fine-tuning task log')
        .requiredOption('--provider <address>', 'Provider address')
        .option('--task <id>', 'Task ID, if not provided, the latest task will be retrieved')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .action((options) => {
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            const log = await broker.fineTuning.getLog(options.provider, options.task);
            console.log(log);
        });
    });
    program
        .command('acknowledge-model')
        .description('Acknowledge the availability of a model')
        .requiredOption('--provider <address>', 'Provider address')
        .requiredOption('--task-id <id>', 'Task ID')
        .requiredOption('--data-path <path>', 'Path to store the model')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .option('--gas-price <price>', 'Gas price for transactions')
        .option('--max-gas-price <price>', 'Max gas price for transactions')
        .option('--step <step>', 'Step for gas price adjustment')
        .option('--download-method <method>', 'Download method: auto (try 0G Storage then TEE), 0g-storage, or tee (default: auto)')
        .option('--model <name>', 'Base model name (required when using --deploy, e.g. Qwen2.5-0.5B-Instruct)')
        .option('--deploy', 'Also deploy the adapter to the inference GPU after acknowledging', false)
        .action((options) => {
        if (options.deploy && !options.model) {
            console.error(chalk_1.default.red('Error: --model is required when using --deploy'));
            process.exit(1);
        }
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            await broker.fineTuning.acknowledgeModel(options.provider, options.taskId, options.dataPath, {
                gasPrice: options.gasPrice,
                downloadMethod: options.downloadMethod ?? 'auto',
            });
            console.log('Acknowledged model');
            if (options.deploy) {
                console.log('\nWaiting for inference broker to download the adapter...');
                await deployAdapterToBroker(broker, options.provider, options.model, options.taskId, true, 180);
            }
        });
    });
    program
        .command('decrypt-model')
        .description('Decrypt a model')
        .requiredOption('--provider <address>', 'Provider address')
        .requiredOption('--task-id <id>', 'Task ID')
        .requiredOption('--encrypted-model <path>', 'Path to the encrypted model')
        .requiredOption('--output <path>', 'Path to the decrypted model')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Ledger contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .action((options) => {
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            await broker.fineTuning.decryptModel(options.provider, options.taskId, options.encryptedModel, options.output);
            console.log('Decrypted model');
        });
    });
    program
        .command('download-counter')
        .description('Download token-counter')
        .action(async (options) => {
        let binaryDir = path.join(__dirname, '..', '..', 'binary');
        let executorDir = binaryDir;
        const binaryFile = path.join(executorDir, 'token_counter');
        const storageClient = path.join(binaryDir, '0g-storage-client');
        try {
            await fs.access(storageClient, fs.constants.X_OK);
        }
        catch (err) {
            console.log(`Grant execute permission (755) to the file ${storageClient}`);
            await fs.chmod(storageClient, 0o755);
        }
        await (0, zg_storage_1.download)(binaryFile, const_2.TOKEN_COUNTER_MERKLE_ROOT);
        await fs.chmod(binaryFile, 0o755);
    });
    program
        .command('list-providers')
        .description('List fine-tuning providers')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .action((options) => {
        const table = new cli_table3_1.default({
            colWidths: [50, 50],
        });
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            const services = await broker.fineTuning.listService();
            services.forEach((service, index) => {
                table.push([
                    chalk_1.default.blue(`Provider ${index + 1}`),
                    chalk_1.default.blue(service.provider),
                ]);
                let available = !service.occupied ? '\u2713' : `\u2717`;
                table.push(['Available', available]);
                table.push([
                    'Price Per Byte in Dataset (0G)',
                    service.pricePerToken
                        ? (0, util_1.neuronToA0gi)(BigInt(service.pricePerToken)).toFixed(18)
                        : 'N/A',
                ]);
            });
            console.log(table.toString());
        });
    });
    program
        .command('ack-provider', { hidden: true })
        .description('Acknowledge TEE Signer (Contract owner only)')
        .requiredOption('--provider <address>', 'Provider address')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .option('--gas-price <price>', 'Gas price for transactions')
        .action((options) => {
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            await broker.fineTuning.acknowledgeTEESignerByOwner(options.provider, options.gasPrice);
            console.log('Provider acknowledged successfully!');
        });
    });
    program
        .command('revoke', { hidden: true })
        .description('Revoke TEE signer acknowledgement (Contract owner only)')
        .requiredOption('--provider <address>', 'Provider address')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .option('--gas-price <price>', 'Gas price for transactions')
        .action((options) => {
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            await broker.fineTuning.revokeTEESignerAcknowledgement(options.provider, options.gasPrice);
            console.log('Provider TEE signer acknowledgement revoked successfully!');
        });
    });
    program
        .command('remove-service')
        .description('[For provider] Remove your service from the contract')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .option('--gas-price <price>', 'Gas price for transactions')
        .action((options) => {
        (0, util_1.withFineTuningBroker)(options, async (broker) => {
            await broker.fineTuning.removeService(options.gasPrice);
            console.log('Service removed successfully!');
        });
    });
    program
        .command('get-adapter-name')
        .description('Get the LoRA adapter model name for inference after fine-tuning')
        .requiredOption('--model <name>', 'Base model name (e.g. Qwen2.5-0.5B-Instruct)')
        .requiredOption('--task-id <id>', 'Fine-tuning task ID')
        .action((options) => {
        const adapterName = (0, adapter_name_1.makeAdapterName)(options.model, options.taskId);
        console.log(adapterName);
    });
    program
        .command('deploy-adapter')
        .description('Deploy a downloaded LoRA adapter to the inference GPU (triggers vLLM loading)')
        .requiredOption('--provider <address>', 'Inference provider address')
        .requiredOption('--model <name>', 'Base model name used in fine-tuning (e.g. Qwen2.5-0.5B-Instruct)')
        .requiredOption('--task-id <id>', 'Fine-tuning task ID')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--wait', 'Wait until the adapter is fully deployed (polls status)', false)
        .option('--timeout <seconds>', 'Timeout in seconds when using --wait', '120')
        .action((options) => {
        (0, util_1.withBroker)(options, async (broker) => {
            await deployAdapterToBroker(broker, options.provider, options.model, options.taskId, options.wait, parseInt(options.timeout));
        });
    });
    program
        .command('chat')
        .description('Send a chat request to a fine-tuned model via the inference broker')
        .requiredOption('--provider <address>', 'Inference provider address (serves the fine-tuned model)')
        .option('--model <name>', 'Base model name used in fine-tuning (e.g. Qwen2.5-0.5B-Instruct)')
        .option('--task-id <id>', 'Fine-tuning task ID')
        .option('--adapter-name <name>', 'LoRA adapter name (overrides --model + --task-id)')
        .requiredOption('--message <text>', 'User message to send')
        .option('--system <text>', 'System prompt', 'You are a helpful assistant.')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--fine-tuning-ca <address>', 'Fine Tuning contract address')
        .action((options) => {
        let adapterName;
        if (options.adapterName) {
            adapterName = options.adapterName;
        }
        else if (options.model && options.taskId) {
            adapterName = (0, adapter_name_1.makeAdapterName)(options.model, options.taskId);
        }
        else {
            console.error(chalk_1.default.red('Error: Provide either --adapter-name or both --model and --task-id'));
            process.exit(1);
        }
        (0, util_1.withBroker)(options, async (broker) => {
            console.log(chalk_1.default.gray(`Adapter model name: ${adapterName}`));
            const { endpoint } = await broker.inference.getServiceMetadata(options.provider);
            const headers = await broker.inference.getRequestHeaders(options.provider, JSON.stringify({
                model: adapterName,
                messages: [
                    { role: 'system', content: options.system },
                    { role: 'user', content: options.message },
                ],
            }));
            const axios = (await Promise.resolve().then(() => tslib_1.__importStar(require('axios')))).default;
            const resp = await axios.post(`${endpoint}/chat/completions`, {
                model: adapterName,
                messages: [
                    { role: 'system', content: options.system },
                    { role: 'user', content: options.message },
                ],
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
            });
            const choice = resp.data?.choices?.[0];
            if (choice) {
                console.log(chalk_1.default.green('\nAssistant:'), choice.message?.content || '(empty)');
            }
            if (resp.data?.usage) {
                console.log(chalk_1.default.gray(`\nTokens: ${resp.data.usage.prompt_tokens} prompt + ${resp.data.usage.completion_tokens} completion = ${resp.data.usage.total_tokens} total`));
            }
        });
    });
}
async function getBrokerBaseUrl(broker, providerAddress) {
    const { endpoint } = await broker.inference.getServiceMetadata(providerAddress);
    // endpoint is like "https://host/v1/proxy", we need "https://host"
    return endpoint.replace(/\/v1\/proxy$/, '');
}
async function deployAdapterToBroker(broker, providerAddress, baseModel, taskId, wait, timeoutSeconds) {
    const axios = (await Promise.resolve().then(() => tslib_1.__importStar(require('axios')))).default;
    const baseUrl = await getBrokerBaseUrl(broker, providerAddress);
    const adapterName = (0, adapter_name_1.makeAdapterName)(baseModel, taskId);
    console.log(chalk_1.default.gray(`Adapter name: ${adapterName}`));
    console.log(chalk_1.default.gray(`Broker URL: ${baseUrl}`));
    // If --wait, first poll until the adapter exists and is "ready"
    if (wait) {
        console.log('Waiting for adapter to be ready...');
        const deadline = Date.now() + timeoutSeconds * 1000;
        let lastState = '';
        while (Date.now() < deadline) {
            try {
                const statusResp = await axios.get(`${baseUrl}/v1/lora/adapters/${adapterName}`);
                const state = statusResp.data?.state;
                if (state && state !== lastState) {
                    console.log(chalk_1.default.gray(`  Adapter state: ${state}`));
                    lastState = state;
                }
                if (state === 'ready' || state === 'active') {
                    break;
                }
                if (state === 'failed') {
                    console.log(chalk_1.default.yellow('Adapter download failed, attempting deploy anyway...'));
                    break;
                }
            }
            catch (err) {
                if (err?.response?.status !== 404) {
                    console.log(chalk_1.default.gray(`  Waiting... (${err?.message || 'not ready'})`));
                }
            }
            await new Promise((r) => setTimeout(r, 3000));
        }
        if (Date.now() >= deadline && lastState !== 'ready' && lastState !== 'active') {
            console.error(chalk_1.default.red(`Timed out after ${timeoutSeconds}s waiting for adapter to be ready (last state: ${lastState || 'not found'})`));
            process.exit(1);
        }
    }
    // If adapter is already active, skip deploy
    try {
        const statusResp = await axios.get(`${baseUrl}/v1/lora/adapters/${adapterName}`);
        if (statusResp.data?.state === 'active') {
            console.log(chalk_1.default.green('Adapter is already deployed and active!'));
            return;
        }
    }
    catch {
        // Adapter not found yet, proceed with deploy
    }
    // Call deploy API
    console.log('Requesting adapter deployment...');
    try {
        const deployResp = await axios.post(`${baseUrl}/v1/lora/adapters/deploy`, { taskId, baseModel });
        console.log(chalk_1.default.green(deployResp.data?.message || 'Deploy request sent'));
    }
    catch (err) {
        const errMsg = err?.response?.data?.error || err?.message || 'unknown error';
        console.error(chalk_1.default.red(`Deploy failed: ${errMsg}`));
        process.exit(1);
    }
    // If --wait, poll until active
    if (wait) {
        console.log('Waiting for deployment to complete...');
        const deadline = Date.now() + timeoutSeconds * 1000;
        while (Date.now() < deadline) {
            try {
                const statusResp = await axios.get(`${baseUrl}/v1/lora/adapters/${adapterName}`);
                const state = statusResp.data?.state;
                if (state === 'active') {
                    console.log(chalk_1.default.green('\nAdapter deployed successfully! You can now use `fine-tuning chat` to chat with it.'));
                    return;
                }
                if (state === 'failed') {
                    console.error(chalk_1.default.red('Adapter deployment failed.'));
                    process.exit(1);
                }
            }
            catch {
                // ignore polling errors
            }
            await new Promise((r) => setTimeout(r, 2000));
        }
        console.error(chalk_1.default.red(`Timed out after ${timeoutSeconds}s waiting for deployment to complete.`));
        process.exit(1);
    }
}
//# sourceMappingURL=fine-tuning.js.map