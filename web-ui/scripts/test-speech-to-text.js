#!/usr/bin/env node

/**
 * Speech-to-Text Test Script for 0G Mainnet
 *
 * Usage:
 *   npm run test:stt -- --key=<PRIVATE_KEY> [--audio=<PATH_TO_AUDIO_FILE>]
 *
 * Or with environment variable:
 *   PRIVATE_KEY=<your_key> npm run test:stt -- --audio=<PATH_TO_AUDIO_FILE>
 */

const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Mainnet configuration
const MAINNET_RPC = 'https://evmrpc.0g.ai';
const MAINNET_CHAIN_ID = 16661;

// Parse command line arguments
function parseArgs() {
    const args = {};
    process.argv.slice(2).forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            args[key] = value || true;
        }
    });
    return args;
}

// Format file size
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get MIME type from file extension
function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.webm': 'audio/webm',
        '.m4a': 'audio/m4a',
        '.flac': 'audio/flac',
        '.aac': 'audio/aac',
    };
    return mimeTypes[ext] || 'audio/mpeg';
}

async function main() {
    console.log('='.repeat(60));
    console.log('0G Speech-to-Text Test Script (Mainnet)');
    console.log('='.repeat(60));
    console.log();

    const args = parseArgs();

    // Get private key from args or environment
    const privateKey = args.key || process.env.PRIVATE_KEY;

    if (!privateKey) {
        console.error('Error: Private key is required.');
        console.error('');
        console.error('Usage:');
        console.error('  npm run test:stt -- --key=<PRIVATE_KEY>');
        console.error('  npm run test:stt -- --key=<PRIVATE_KEY> --audio=./test.mp3');
        console.error('');
        console.error('Or set PRIVATE_KEY environment variable:');
        console.error('  PRIVATE_KEY=<your_key> npm run test:stt');
        process.exit(1);
    }

    try {
        // 1. Connect to mainnet
        console.log('[1/5] Connecting to 0G Mainnet...');
        console.log(`      RPC: ${MAINNET_RPC}`);
        console.log(`      Chain ID: ${MAINNET_CHAIN_ID}`);

        const provider = new ethers.JsonRpcProvider(MAINNET_RPC);
        const signer = new ethers.Wallet(privateKey, provider);

        console.log(`      Wallet: ${signer.address}`);

        // Check balance
        const balance = await provider.getBalance(signer.address);
        console.log(`      Balance: ${ethers.formatEther(balance)} 0G`);
        console.log();

        // 2. Initialize broker
        console.log('[2/5] Initializing broker...');
        const broker = await createZGComputeNetworkBroker(signer);
        console.log('      Broker initialized successfully');
        console.log();

        // 3. List all services and filter for speech-to-text
        console.log('[3/5] Fetching available services...');
        const services = await broker.inference.listService();

        console.log(`      Total services: ${services.length}`);

        // Log all unique service types
        const serviceTypes = [...new Set(services.map(s => s.serviceType || 'undefined'))];
        console.log(`      Service types found: ${serviceTypes.join(', ')}`);

        // Filter for speech-to-text
        const sttProviders = services.filter(s =>
            s.serviceType === 'speech-to-text' && s.teeSignerAcknowledged
        );

        console.log(`      Speech-to-text providers: ${sttProviders.length}`);
        console.log();

        if (sttProviders.length === 0) {
            console.log('No verified speech-to-text providers found on mainnet.');
            console.log();
            console.log('All providers (for debugging):');
            services.forEach((s, i) => {
                console.log(`  ${i + 1}. ${s.name || 'Unknown'}`);
                console.log(`     Type: ${s.serviceType || 'N/A'}`);
                console.log(`     Verified: ${s.teeSignerAcknowledged ? 'Yes' : 'No'}`);
                console.log(`     Address: ${s.provider}`);
            });
            return;
        }

        // 4. Show available providers
        console.log('[4/5] Available Speech-to-Text Providers:');
        console.log('-'.repeat(60));

        for (let i = 0; i < sttProviders.length; i++) {
            const p = sttProviders[i];
            console.log(`  ${i + 1}. ${p.name || 'Unknown Provider'}`);
            console.log(`     Model: ${p.model || 'N/A'}`);
            console.log(`     Address: ${p.provider}`);
            console.log(`     Verified: ${p.teeSignerAcknowledged ? 'Yes' : 'No'}`);

            // Get metadata
            try {
                const metadata = await broker.inference.getServiceMetadata(p.provider);
                console.log(`     Endpoint: ${metadata.endpoint}`);
            } catch (e) {
                console.log(`     Endpoint: Unable to fetch`);
            }

            // Check account balance with this provider
            try {
                const account = await broker.inference.getAccount(p.provider);
                const balanceInA0gi = Number(account.balance) / 1e18;
                console.log(`     Your balance: ${balanceInA0gi.toFixed(6)} 0G`);
            } catch (e) {
                console.log(`     Your balance: No account (need to deposit first)`);
            }
            console.log();
        }

        // 5. Test transcription if audio file provided
        if (args.audio) {
            console.log('[5/5] Testing transcription...');
            console.log('-'.repeat(60));

            const audioPath = path.resolve(args.audio);

            if (!fs.existsSync(audioPath)) {
                console.error(`Error: Audio file not found: ${audioPath}`);
                return;
            }

            const stats = fs.statSync(audioPath);
            console.log(`      File: ${path.basename(audioPath)}`);
            console.log(`      Size: ${formatBytes(stats.size)}`);

            // Use first provider
            const selectedProvider = sttProviders[0];
            console.log(`      Provider: ${selectedProvider.name}`);

            // Get metadata
            const metadata = await broker.inference.getServiceMetadata(selectedProvider.provider);
            console.log(`      Model: ${metadata.model}`);
            console.log(`      Endpoint: ${metadata.endpoint}`);

            // Check balance
            let hasBalance = false;
            try {
                const account = await broker.inference.getAccount(selectedProvider.provider);
                if (account && BigInt(account.balance) > 0) {
                    hasBalance = true;
                }
            } catch (e) {
                // No account
            }

            if (!hasBalance) {
                console.log();
                console.log('Warning: No balance with this provider.');
                console.log('You need to deposit funds first before transcribing.');
                console.log();
                console.log('To deposit funds, use the web UI or run:');
                console.log('  broker.inference.depositFund(providerAddress, amount)');
                return;
            }

            // Read file as buffer and create Blob for Node.js native fetch
            const fileBuffer = fs.readFileSync(audioPath);
            const fileName = path.basename(audioPath);
            const mimeType = getMimeType(fileName);

            console.log(`      MIME type: ${mimeType}`);

            // Create FormData using Node.js built-in (works with native fetch)
            const formData = new FormData();
            const fileBlob = new Blob([fileBuffer], { type: mimeType });
            formData.append('file', fileBlob, fileName);
            formData.append('model', metadata.model);
            formData.append('response_format', 'json');

            // Get auth headers
            console.log();
            console.log('      Getting auth headers...');
            const headers = await broker.inference.getRequestHeaders(
                selectedProvider.provider,
                JSON.stringify({ model: metadata.model, file: fileName })
            );

            // Remove Content-Type - let fetch set it with boundary
            delete headers['Content-Type'];

            // Send request
            console.log('      Sending transcription request...');
            const startTime = Date.now();

            const response = await fetch(`${metadata.endpoint}/audio/transcriptions`, {
                method: 'POST',
                headers: headers,
                body: formData,
            });

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log(`      Response status: ${response.status}`);
            console.log(`      Time elapsed: ${elapsed}s`);
            console.log();

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                return;
            }

            const result = await response.json();
            console.log('Transcription Result:');
            console.log('='.repeat(60));
            console.log(result.text || JSON.stringify(result, null, 2));
            console.log('='.repeat(60));
        } else {
            console.log('[5/5] Skipping transcription test (no audio file provided)');
            console.log();
            console.log('To test transcription, run:');
            console.log('  npm run test:stt -- --key=<KEY> --audio=./path/to/audio.mp3');
        }

        console.log();
        console.log('Done!');

    } catch (error) {
        console.error('Error:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

main();
