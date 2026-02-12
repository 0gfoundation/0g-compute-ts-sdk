"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = upload;
exports.download = download;
const tslib_1 = require("tslib");
const const_1 = require("../const");
const child_process_1 = require("child_process");
const path_1 = tslib_1.__importDefault(require("path"));
const fs = tslib_1.__importStar(require("fs/promises"));
const logger_1 = require("../../common/logger");
async function upload(privateKey, dataPath, gasPrice, maxGasPrice) {
    try {
        const fileSize = await getFileContentSize(dataPath);
        return new Promise((resolve, reject) => {
            const command = path_1.default.join(__dirname, '..', '..', '..', '..', 'binary', '0g-storage-client');
            const args = [
                'upload',
                '--url',
                const_1.ZG_RPC_ENDPOINT_TESTNET,
                '--key',
                privateKey,
                '--indexer',
                const_1.INDEXER_URL_TURBO,
                '--file',
                dataPath,
                '--skip-tx=false',
                '--log-level=debug',
            ];
            if (gasPrice) {
                args.push('--gas-price', gasPrice.toString());
            }
            if (maxGasPrice) {
                args.push('--max-gas-price', maxGasPrice.toString());
            }
            let rootHash = '';
            const childProcess = (0, child_process_1.spawn)(command, args);
            childProcess.stdout.on('data', (data) => {
                const output = data.toString();
                logger_1.logger.debug(output);
                // Capture root hash from output: "file uploaded, root = 0x..."
                const match = output.match(/root\s*=\s*(0x[0-9a-fA-F]+)/);
                if (match) {
                    rootHash = match[1];
                }
            });
            childProcess.stderr.on('data', (data) => {
                const output = data.toString();
                logger_1.logger.warn(output);
                // Also check stderr since some log output goes to stderr
                const match = output.match(/root\s*=\s*(0x[0-9a-fA-F]+)/);
                if (match) {
                    rootHash = match[1];
                }
            });
            childProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Process exited with code ${code}`));
                }
                else if (!rootHash) {
                    reject(new Error('Upload succeeded but no root hash was captured from output'));
                }
                else {
                    logger_1.logger.info(`File size: ${fileSize} bytes`);
                    resolve(rootHash);
                }
            });
            childProcess.on('error', (err) => {
                reject(err);
            });
        });
    }
    catch (err) {
        logger_1.logger.error(`Upload failed: ${err}`);
        throw err;
    }
}
async function download(dataPath, dataRoot) {
    return new Promise((resolve, reject) => {
        const command = path_1.default.join(__dirname, '..', '..', '..', '..', 'binary', '0g-storage-client');
        const args = [
            'download',
            '--file',
            dataPath,
            '--indexer',
            const_1.INDEXER_URL_TURBO,
            '--roots',
            dataRoot,
        ];
        const process = (0, child_process_1.spawn)(command, args);
        let log = '';
        process.stdout.on('data', (data) => {
            const output = data.toString();
            log += output;
            logger_1.logger.debug(output);
        });
        process.stderr.on('data', (data) => {
            const errorOutput = data.toString();
            log += errorOutput;
            logger_1.logger.warn(errorOutput);
        });
        process.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Process exited with code ${code}`));
            }
            if (!log
                .trim()
                .endsWith('Succeeded to validate the downloaded file')) {
                return reject(new Error('Failed to download the file'));
            }
            resolve();
        });
        process.on('error', (err) => {
            reject(err);
        });
    });
}
async function getFileContentSize(filePath) {
    try {
        const fileHandle = await fs.open(filePath, 'r');
        try {
            const stats = await fileHandle.stat();
            return stats.size;
        }
        finally {
            await fileHandle.close();
        }
    }
    catch (err) {
        throw new Error(`Error processing file: ${err instanceof Error ? err.message : String(err)}`);
    }
}
//# sourceMappingURL=zg-storage.js.map