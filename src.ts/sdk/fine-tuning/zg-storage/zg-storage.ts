import { INDEXER_URL_TESTNET_TURBO, ZG_RPC_ENDPOINT_TESTNET } from '../const'
import { spawn } from 'child_process'
import * as fs from 'fs/promises'
import { logger } from '../../common/logger'
import { getBundledBinary } from './binary-path'

export interface StorageConfig {
    rpcUrl?: string
    indexerUrl?: string
}

export async function upload(
    privateKey: string,
    dataPath: string,
    gasPrice?: number,
    maxGasPrice?: number,
    config?: StorageConfig
): Promise<string> {
    try {
        const fileSize = await getFileContentSize(dataPath)

        // Use provided config or default to testnet
        const rpcUrl = config?.rpcUrl || ZG_RPC_ENDPOINT_TESTNET
        const indexerUrl = config?.indexerUrl || INDEXER_URL_TESTNET_TURBO

        return new Promise((resolve, reject) => {
            const command = getBundledBinary('0g-storage-client')
            const args = [
                'upload',
                '--url',
                rpcUrl,
                '--key',
                privateKey,
                '--indexer',
                indexerUrl,
                '--file',
                dataPath,
                '--skip-tx=false',
                '--log-level=debug',
            ]

            if (gasPrice) {
                args.push('--gas-price', gasPrice.toString())
            }

            if (maxGasPrice) {
                args.push('--max-gas-price', maxGasPrice.toString())
            }

            let rootHash = ''
            const childProcess = spawn(command, args)

            childProcess.stdout.on('data', (data) => {
                const output = data.toString()
                logger.debug(output)
                // Capture root hash from output: "file uploaded, root = 0x..."
                const match = output.match(/root\s*=\s*(0x[0-9a-fA-F]+)/)
                if (match) {
                    rootHash = match[1]
                }
            })

            childProcess.stderr.on('data', (data) => {
                const output = data.toString()
                logger.warn(output)
                // Also check stderr since some log output goes to stderr
                const match = output.match(/root\s*=\s*(0x[0-9a-fA-F]+)/)
                if (match) {
                    rootHash = match[1]
                }
            })

            childProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Process exited with code ${code}`))
                } else if (!rootHash) {
                    reject(
                        new Error(
                            'Upload succeeded but no root hash was captured from output'
                        )
                    )
                } else {
                    logger.info(`File size: ${fileSize} bytes`)
                    resolve(rootHash)
                }
            })

            childProcess.on('error', (err) => {
                reject(err)
            })
        })
    } catch (err) {
        logger.error(`Upload failed: ${err}`)
        throw err
    }
}

export async function download(
    dataPath: string,
    dataRoot: string,
    config?: StorageConfig
): Promise<void> {
    // Use provided config or default to testnet
    const indexerUrl = config?.indexerUrl || INDEXER_URL_TESTNET_TURBO

    return new Promise((resolve, reject) => {
        const command = getBundledBinary('0g-storage-client')

        const args = [
            'download',
            '--file',
            dataPath,
            '--indexer',
            indexerUrl,
            '--roots',
            dataRoot,
        ]

        const process = spawn(command, args)

        let log = ''

        process.stdout.on('data', (data) => {
            const output = data.toString()
            log += output
            logger.debug(output)
        })

        process.stderr.on('data', (data) => {
            const errorOutput = data.toString()
            log += errorOutput
            logger.warn(errorOutput)
        })

        process.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Process exited with code ${code}`))
            }

            if (
                !log
                    .trim()
                    .endsWith('Succeeded to validate the downloaded file')
            ) {
                return reject(new Error('Failed to download the file'))
            }

            resolve()
        })

        process.on('error', (err) => {
            reject(err)
        })
    })
}

async function getFileContentSize(filePath: string): Promise<number> {
    try {
        const fileHandle = await fs.open(filePath, 'r')
        try {
            const stats = await fileHandle.stat()
            return stats.size
        } finally {
            await fileHandle.close()
        }
    } catch (err) {
        throw new Error(
            `Error processing file: ${
                err instanceof Error ? err.message : String(err)
            }`
        )
    }
}
