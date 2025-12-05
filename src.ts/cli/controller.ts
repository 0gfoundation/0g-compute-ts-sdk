#!/usr/bin/env ts-node

import type { Command } from 'commander'
import { initBroker } from './util'
import { getRpcEndpoint } from './network-setup'
import { ensurePrivateKeyConfiguration } from './private-key-setup'
import Table from 'cli-table3'
import chalk from 'chalk'
import axios from 'axios'
import fs from 'fs'
import yaml from 'yaml'
import { ethers, keccak256, toUtf8Bytes } from 'ethers'
import { logger } from '../sdk/common/logger'

/**
 * Session Token for Controller API authentication
 * Note: No 'provider' field needed - the address is derived from the private key
 */
interface ControllerSessionToken {
    address: string
    timestamp: number
    expiresAt: number // 0 = never expires
    nonce: string
}

/**
 * Generate a random nonce for session token
 */
function generateNonce(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `${timestamp}-${random}`.padEnd(32, '0')
}

/**
 * Generate Session Token for Controller API authentication
 * Note: No provider parameter needed - address is derived from wallet
 */
async function generateControllerSessionToken(
    wallet: ethers.Wallet,
    duration: number = 3600000 // Default 1 hour
): Promise<string> {
    const timestamp = Date.now()
    const nonce = generateNonce()
    const userAddress = await wallet.getAddress()

    const token: ControllerSessionToken = {
        address: userAddress,
        timestamp,
        expiresAt: duration > 0 ? timestamp + duration : 0,
        nonce,
    }

    const message = JSON.stringify(token)
    const messageHash = keccak256(toUtf8Bytes(message))
    const signature = await wallet.signMessage(
        Buffer.from(messageHash.slice(2), 'hex')
    )

    const rawToken = `app-sk-${Buffer.from(message + '|' + signature).toString(
        'base64'
    )}`

    return rawToken
}

/**
 * Get Controller endpoint from provider's service URL
 * The controller runs on a different port (default 3090) than the main service
 */
async function getControllerEndpoint(
    broker: any,
    userAddress: string,
    controllerPort: number = 3090
): Promise<string> {
    // userAddress is the provider address (derived from private key)
    const serviceMetadata = await broker.inference.getServiceMetadata(
        userAddress
    )
    const url = new URL(serviceMetadata.endpoint)
    url.port = controllerPort.toString()
    url.pathname = ''
    // Remove trailing slash to avoid double slashes when concatenating paths
    return url.toString().replace(/\/$/, '')
}

/**
 * Handle axios error and display friendly message
 */
function handleAxiosError(error: unknown): never {
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
            response: {
                status: number
                data?: { error?: string }
                statusText: string
            }
        }
        const status = axiosError.response.status
        const errorMsg =
            axiosError.response.data?.error || axiosError.response.statusText

        if (status === 401) {
            console.error(
                chalk.red('Error: Authentication failed.'),
                'Your wallet address may not be in the admin whitelist.'
            )
        } else if (status === 403) {
            console.error(
                chalk.red('Error: Access forbidden.'),
                'Your IP may not be in the allowed list.'
            )
        } else {
            console.error(chalk.red(`Error (${status}):`), errorMsg)
        }
    } else if (error instanceof Error) {
        console.error(chalk.red('Error:'), error.message)
    } else {
        console.error(chalk.red('Error:'), String(error))
    }
    process.exit(1)
}

export default function controller(program: Command) {
    program
        .command('status')
        .description('[For provider] View container status')
        .option('--controller-port <port>', 'Controller port', '3090')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
            try {
                const rpcEndpoint = await getRpcEndpoint(options)
                const privateKey = await ensurePrivateKeyConfiguration()
                if (!privateKey) {
                    throw new Error('Private key is required')
                }

                const provider = new ethers.JsonRpcProvider(rpcEndpoint)
                const wallet = new ethers.Wallet(privateKey, provider)

                const broker = await initBroker(options)
                const userAddress = await wallet.getAddress()
                const endpoint = await getControllerEndpoint(
                    broker,
                    userAddress,
                    parseInt(options.controllerPort)
                )

                const rawToken = await generateControllerSessionToken(wallet)

                logger.debug(
                    `Fetching container status from: ${endpoint}/v1/containers`
                )
                const response = await axios.get(`${endpoint}/v1/containers`, {
                    headers: {
                        Authorization: `Bearer ${rawToken}`,
                    },
                })

                const containers = response.data.containers || []

                if (containers.length === 0) {
                    console.log('No containers found.')
                    process.exit(0)
                }

                const table = new Table({
                    head: ['Name', 'State', 'Health', 'Image'],
                    colWidths: [45, 12, 12, 50],
                })

                containers.forEach(
                    (container: {
                        name: string
                        state: string
                        health: string
                        image: string
                    }) => {
                        const stateColor =
                            container.state === 'running'
                                ? chalk.green
                                : chalk.red
                        const healthColor =
                            container.health === 'healthy'
                                ? chalk.green
                                : container.health === 'unhealthy'
                                ? chalk.red
                                : chalk.yellow

                        table.push([
                            container.name,
                            stateColor(container.state),
                            healthColor(container.health || 'N/A'),
                            container.image || 'N/A',
                        ])
                    }
                )

                console.log('\nContainer Status:')
                console.log(table.toString())
                process.exit(0)
            } catch (error) {
                handleAxiosError(error)
            }
        })

    program
        .command('restart')
        .description('[For provider] Restart a specific container')
        .requiredOption(
            '--container <name>',
            'Container name (broker/event or full name)'
        )
        .option('--controller-port <port>', 'Controller port', '3090')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
            try {
                const rpcEndpoint = await getRpcEndpoint(options)
                const privateKey = await ensurePrivateKeyConfiguration()
                if (!privateKey) {
                    throw new Error('Private key is required')
                }

                const provider = new ethers.JsonRpcProvider(rpcEndpoint)
                const wallet = new ethers.Wallet(privateKey, provider)

                const broker = await initBroker(options)
                const userAddress = await wallet.getAddress()
                const endpoint = await getControllerEndpoint(
                    broker,
                    userAddress,
                    parseInt(options.controllerPort)
                )

                const rawToken = await generateControllerSessionToken(wallet)

                console.log(
                    chalk.blue(`Restarting container: ${options.container}...`)
                )

                await axios.post(
                    `${endpoint}/v1/containers/${options.container}/restart`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${rawToken}`,
                        },
                    }
                )

                console.log(
                    chalk.green(
                        `Container ${options.container} restarted successfully!`
                    )
                )
                process.exit(0)
            } catch (error) {
                handleAxiosError(error)
            }
        })

    program
        .command('start')
        .description('[For provider] Start a specific container')
        .requiredOption(
            '--container <name>',
            'Container name (broker/event or full name)'
        )
        .option('--controller-port <port>', 'Controller port', '3090')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
            try {
                const rpcEndpoint = await getRpcEndpoint(options)
                const privateKey = await ensurePrivateKeyConfiguration()
                if (!privateKey) {
                    throw new Error('Private key is required')
                }

                const provider = new ethers.JsonRpcProvider(rpcEndpoint)
                const wallet = new ethers.Wallet(privateKey, provider)

                const broker = await initBroker(options)
                const userAddress = await wallet.getAddress()
                const endpoint = await getControllerEndpoint(
                    broker,
                    userAddress,
                    parseInt(options.controllerPort)
                )

                const rawToken = await generateControllerSessionToken(wallet)

                console.log(
                    chalk.blue(`Starting container: ${options.container}...`)
                )

                await axios.post(
                    `${endpoint}/v1/containers/${options.container}/start`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${rawToken}`,
                        },
                    }
                )

                console.log(
                    chalk.green(
                        `Container ${options.container} started successfully!`
                    )
                )
                process.exit(0)
            } catch (error) {
                handleAxiosError(error)
            }
        })

    program
        .command('stop')
        .description('[For provider] Stop a specific container')
        .requiredOption(
            '--container <name>',
            'Container name (broker/event or full name)'
        )
        .option('--controller-port <port>', 'Controller port', '3090')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
            try {
                const rpcEndpoint = await getRpcEndpoint(options)
                const privateKey = await ensurePrivateKeyConfiguration()
                if (!privateKey) {
                    throw new Error('Private key is required')
                }

                const provider = new ethers.JsonRpcProvider(rpcEndpoint)
                const wallet = new ethers.Wallet(privateKey, provider)

                const broker = await initBroker(options)
                const userAddress = await wallet.getAddress()
                const endpoint = await getControllerEndpoint(
                    broker,
                    userAddress,
                    parseInt(options.controllerPort)
                )

                const rawToken = await generateControllerSessionToken(wallet)

                console.log(
                    chalk.blue(`Stopping container: ${options.container}...`)
                )

                await axios.post(
                    `${endpoint}/v1/containers/${options.container}/stop`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${rawToken}`,
                        },
                    }
                )

                console.log(
                    chalk.green(
                        `Container ${options.container} stopped successfully!`
                    )
                )
                process.exit(0)
            } catch (error) {
                handleAxiosError(error)
            }
        })

    program
        .command('get-config')
        .description('[For provider] Get container configuration')
        .requiredOption(
            '--container <name>',
            'Container name (broker/event or full name)'
        )
        .option('--controller-port <port>', 'Controller port', '3090')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .option('--output <path>', 'Output file path (optional)')
        .action(async (options) => {
            try {
                const rpcEndpoint = await getRpcEndpoint(options)
                const privateKey = await ensurePrivateKeyConfiguration()
                if (!privateKey) {
                    throw new Error('Private key is required')
                }

                const provider = new ethers.JsonRpcProvider(rpcEndpoint)
                const wallet = new ethers.Wallet(privateKey, provider)

                const broker = await initBroker(options)
                const userAddress = await wallet.getAddress()
                const endpoint = await getControllerEndpoint(
                    broker,
                    userAddress,
                    parseInt(options.controllerPort)
                )

                const rawToken = await generateControllerSessionToken(wallet)

                const response = await axios.get(
                    `${endpoint}/v1/configs/${options.container}`,
                    {
                        headers: {
                            Authorization: `Bearer ${rawToken}`,
                        },
                    }
                )

                // config is YAML string content
                const config = response.data.config as string

                if (options.output) {
                    fs.writeFileSync(options.output, config)
                    console.log(
                        chalk.green(`Config saved to: ${options.output}`)
                    )
                } else {
                    console.log(
                        chalk.blue(
                            `\nConfiguration for ${options.container}:\n`
                        )
                    )
                    console.log(config)
                }
                process.exit(0)
            } catch (error) {
                handleAxiosError(error)
            }
        })

    program
        .command('update-config')
        .description('[For provider] Update container configuration')
        .requiredOption(
            '--container <name>',
            'Container name (broker/event or full name)'
        )
        .requiredOption('--config <path>', 'Path to new config file (YAML)')
        .option('--controller-port <port>', 'Controller port', '3090')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
            try {
                const rpcEndpoint = await getRpcEndpoint(options)
                const privateKey = await ensurePrivateKeyConfiguration()
                if (!privateKey) {
                    throw new Error('Private key is required')
                }

                const provider = new ethers.JsonRpcProvider(rpcEndpoint)
                const wallet = new ethers.Wallet(privateKey, provider)

                const broker = await initBroker(options)
                const userAddress = await wallet.getAddress()
                const endpoint = await getControllerEndpoint(
                    broker,
                    userAddress,
                    parseInt(options.controllerPort)
                )

                const rawToken = await generateControllerSessionToken(wallet)

                // Read config file
                const configContent = fs.readFileSync(options.config, 'utf-8')
                const config = yaml.parse(configContent)

                console.log(
                    chalk.blue(
                        `Updating config for container: ${options.container}...`
                    )
                )

                await axios.put(
                    `${endpoint}/v1/configs/${options.container}`,
                    { config },
                    {
                        headers: {
                            Authorization: `Bearer ${rawToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )

                console.log(chalk.green('Config updated successfully!'))
                console.log(
                    chalk.yellow(
                        'Note: Use "apply-config" to update config and restart the container.'
                    )
                )
                process.exit(0)
            } catch (error) {
                handleAxiosError(error)
            }
        })

    program
        .command('apply-config')
        .description(
            '[For provider] Update configuration and restart container'
        )
        .requiredOption(
            '--container <name>',
            'Container name (broker/event or full name)'
        )
        .requiredOption('--config <path>', 'Path to new config file (YAML)')
        .option('--controller-port <port>', 'Controller port', '3090')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
            try {
                const rpcEndpoint = await getRpcEndpoint(options)
                const privateKey = await ensurePrivateKeyConfiguration()
                if (!privateKey) {
                    throw new Error('Private key is required')
                }

                const provider = new ethers.JsonRpcProvider(rpcEndpoint)
                const wallet = new ethers.Wallet(privateKey, provider)

                const broker = await initBroker(options)
                const userAddress = await wallet.getAddress()
                const endpoint = await getControllerEndpoint(
                    broker,
                    userAddress,
                    parseInt(options.controllerPort)
                )

                const rawToken = await generateControllerSessionToken(wallet)

                // Read config file
                const configContent = fs.readFileSync(options.config, 'utf-8')
                const config = yaml.parse(configContent)

                console.log(
                    chalk.blue(
                        `Applying config and restarting container: ${options.container}...`
                    )
                )

                await axios.post(
                    `${endpoint}/v1/configs/${options.container}/apply`,
                    { config },
                    {
                        headers: {
                            Authorization: `Bearer ${rawToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )

                console.log(
                    chalk.green('Config applied and container restarted!')
                )
                process.exit(0)
            } catch (error) {
                handleAxiosError(error)
            }
        })

    // Admin whitelist management commands
    program
        .command('list-admins')
        .description('[For provider] List admin wallet addresses')
        .option('--controller-port <port>', 'Controller port', '3090')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
            try {
                const rpcEndpoint = await getRpcEndpoint(options)
                const privateKey = await ensurePrivateKeyConfiguration()
                if (!privateKey) {
                    throw new Error('Private key is required')
                }

                const provider = new ethers.JsonRpcProvider(rpcEndpoint)
                const wallet = new ethers.Wallet(privateKey, provider)

                const broker = await initBroker(options)
                const userAddress = await wallet.getAddress()
                const endpoint = await getControllerEndpoint(
                    broker,
                    userAddress,
                    parseInt(options.controllerPort)
                )

                const rawToken = await generateControllerSessionToken(wallet)

                const response = await axios.get(
                    `${endpoint}/v1/admin/wallets`,
                    {
                        headers: {
                            Authorization: `Bearer ${rawToken}`,
                        },
                    }
                )

                const addresses = response.data.addresses || []

                console.log(chalk.blue('\nAdmin Wallet Addresses:'))
                if (addresses.length === 0) {
                    console.log('  No admin addresses configured.')
                } else {
                    addresses.forEach((addr: string, index: number) => {
                        console.log(`  ${index + 1}. ${addr}`)
                    })
                }
                process.exit(0)
            } catch (error) {
                handleAxiosError(error)
            }
        })

    program
        .command('add-admin')
        .description('[For provider] Add admin wallet address')
        .requiredOption('--address <address>', 'Wallet address to add')
        .option('--controller-port <port>', 'Controller port', '3090')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
            try {
                const rpcEndpoint = await getRpcEndpoint(options)
                const privateKey = await ensurePrivateKeyConfiguration()
                if (!privateKey) {
                    throw new Error('Private key is required')
                }

                const provider = new ethers.JsonRpcProvider(rpcEndpoint)
                const wallet = new ethers.Wallet(privateKey, provider)

                const broker = await initBroker(options)
                const userAddress = await wallet.getAddress()
                const endpoint = await getControllerEndpoint(
                    broker,
                    userAddress,
                    parseInt(options.controllerPort)
                )

                const rawToken = await generateControllerSessionToken(wallet)

                await axios.post(
                    `${endpoint}/v1/admin/wallets`,
                    { address: options.address },
                    {
                        headers: {
                            Authorization: `Bearer ${rawToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )

                console.log(
                    chalk.green(`Admin wallet added: ${options.address}`)
                )
                process.exit(0)
            } catch (error) {
                handleAxiosError(error)
            }
        })

    program
        .command('remove-admin')
        .description('[For provider] Remove admin wallet address')
        .requiredOption('--address <address>', 'Wallet address to remove')
        .option('--controller-port <port>', 'Controller port', '3090')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
            try {
                const rpcEndpoint = await getRpcEndpoint(options)
                const privateKey = await ensurePrivateKeyConfiguration()
                if (!privateKey) {
                    throw new Error('Private key is required')
                }

                const provider = new ethers.JsonRpcProvider(rpcEndpoint)
                const wallet = new ethers.Wallet(privateKey, provider)

                const broker = await initBroker(options)
                const userAddress = await wallet.getAddress()
                const endpoint = await getControllerEndpoint(
                    broker,
                    userAddress,
                    parseInt(options.controllerPort)
                )

                const rawToken = await generateControllerSessionToken(wallet)

                await axios.delete(
                    `${endpoint}/v1/admin/wallets/${encodeURIComponent(
                        options.address
                    )}`,
                    {
                        headers: {
                            Authorization: `Bearer ${rawToken}`,
                        },
                    }
                )

                console.log(
                    chalk.green(`Admin wallet removed: ${options.address}`)
                )
                process.exit(0)
            } catch (error) {
                handleAxiosError(error)
            }
        })

    // IP whitelist management commands
    program
        .command('list-ips')
        .description('[For provider] List allowed IP addresses')
        .option('--controller-port <port>', 'Controller port', '3090')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
            try {
                const rpcEndpoint = await getRpcEndpoint(options)
                const privateKey = await ensurePrivateKeyConfiguration()
                if (!privateKey) {
                    throw new Error('Private key is required')
                }

                const provider = new ethers.JsonRpcProvider(rpcEndpoint)
                const wallet = new ethers.Wallet(privateKey, provider)

                const broker = await initBroker(options)
                const userAddress = await wallet.getAddress()
                const endpoint = await getControllerEndpoint(
                    broker,
                    userAddress,
                    parseInt(options.controllerPort)
                )

                const rawToken = await generateControllerSessionToken(wallet)

                const response = await axios.get(`${endpoint}/v1/admin/ips`, {
                    headers: {
                        Authorization: `Bearer ${rawToken}`,
                    },
                })

                const ips = response.data.ips || []

                console.log(chalk.blue('\nAllowed IP Addresses:'))
                if (ips.length === 0) {
                    console.log(
                        '  No IP whitelist configured (all IPs allowed).'
                    )
                } else {
                    ips.forEach((ip: string, index: number) => {
                        console.log(`  ${index + 1}. ${ip}`)
                    })
                }
                process.exit(0)
            } catch (error) {
                handleAxiosError(error)
            }
        })

    program
        .command('add-ip')
        .description('[For provider] Add IP to whitelist')
        .requiredOption(
            '--ip <ip>',
            'IP address or CIDR to add (e.g., 192.168.1.100 or 192.168.1.0/24)'
        )
        .option('--controller-port <port>', 'Controller port', '3090')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
            try {
                const rpcEndpoint = await getRpcEndpoint(options)
                const privateKey = await ensurePrivateKeyConfiguration()
                if (!privateKey) {
                    throw new Error('Private key is required')
                }

                const provider = new ethers.JsonRpcProvider(rpcEndpoint)
                const wallet = new ethers.Wallet(privateKey, provider)

                const broker = await initBroker(options)
                const userAddress = await wallet.getAddress()
                const endpoint = await getControllerEndpoint(
                    broker,
                    userAddress,
                    parseInt(options.controllerPort)
                )

                const rawToken = await generateControllerSessionToken(wallet)

                await axios.post(
                    `${endpoint}/v1/admin/ips`,
                    { ip: options.ip },
                    {
                        headers: {
                            Authorization: `Bearer ${rawToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )

                console.log(chalk.green(`IP added to whitelist: ${options.ip}`))
                process.exit(0)
            } catch (error) {
                handleAxiosError(error)
            }
        })

    program
        .command('remove-ip')
        .description('[For provider] Remove IP from whitelist')
        .requiredOption('--ip <ip>', 'IP address or CIDR to remove')
        .option('--controller-port <port>', 'Controller port', '3090')
        .option('--rpc <url>', '0G Chain RPC endpoint')
        .option('--ledger-ca <address>', 'Account (ledger) contract address')
        .option('--inference-ca <address>', 'Inference contract address')
        .action(async (options) => {
            try {
                const rpcEndpoint = await getRpcEndpoint(options)
                const privateKey = await ensurePrivateKeyConfiguration()
                if (!privateKey) {
                    throw new Error('Private key is required')
                }

                const provider = new ethers.JsonRpcProvider(rpcEndpoint)
                const wallet = new ethers.Wallet(privateKey, provider)

                const broker = await initBroker(options)
                const userAddress = await wallet.getAddress()
                const endpoint = await getControllerEndpoint(
                    broker,
                    userAddress,
                    parseInt(options.controllerPort)
                )

                const rawToken = await generateControllerSessionToken(wallet)

                await axios.delete(
                    `${endpoint}/v1/admin/ips/${encodeURIComponent(
                        options.ip
                    )}`,
                    {
                        headers: {
                            Authorization: `Bearer ${rawToken}`,
                        },
                    }
                )

                console.log(
                    chalk.green(`IP removed from whitelist: ${options.ip}`)
                )
                process.exit(0)
            } catch (error) {
                handleAxiosError(error)
            }
        })
}
