# 0G Compute Network SDK

Access decentralized AI computing through the 0G Compute Network - a GPU marketplace that connects developers with affordable AI inference and fine-tuning services.

## Features

- **AI Inference**: Run LLMs, text-to-image, image editing, and speech-to-text models — with both sync and async modes
- **Fine-tuning**: Customize models with your own data
- **OpenAI Compatible**: Works with existing OpenAI SDK clients
- **Web UI**: Built-in interface for easy service discovery and testing
- **CLI Tools**: Command-line interface for automation

## Requirements

- Node.js >= 20.0.0
- A wallet with 0G tokens

## Installation

```bash
# Using pnpm (recommended)
pnpm add @0glabs/0g-serving-broker

# Using npm
npm install @0glabs/0g-serving-broker

# Using yarn
yarn add @0glabs/0g-serving-broker

# Install globally for CLI access
pnpm add @0glabs/0g-serving-broker -g
```

## Quick Start

### Web UI

The fastest way to get started:

```bash
# Launch the Web UI
0g-compute-cli ui start-web
```

Open `http://localhost:3090` in your browser to:

- Connect your wallet (MetaMask)
- Browse available AI services
- Chat with AI models directly
- Get integration code examples

### CLI

```bash
# Setup network
0g-compute-cli setup-network

# Login with your wallet
0g-compute-cli login

# Deposit funds
0g-compute-cli deposit --amount 10

# List available providers
0g-compute-cli inference list-providers

# Transfer funds to a provider
0g-compute-cli transfer-fund --provider <PROVIDER_ADDRESS> --amount 5

# Acknowledge provider before use
0g-compute-cli inference acknowledge-provider --provider <PROVIDER_ADDRESS>

# Get API secret for direct access
0g-compute-cli inference get-secret --provider <PROVIDER_ADDRESS>

# Generate API key with a specific token ID (0-254)
0g-compute-cli inference get-secret --provider <PROVIDER_ADDRESS> --token-id 5
```

### SDK

```typescript
import { ethers } from 'ethers'
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker'

// Initialize
const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai')
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)
const broker = await createZGComputeNetworkBroker(wallet)

// Discover services
const services = await broker.inference.listService()

// Fund your account
await broker.ledger.depositFund(10)

// Acknowledge provider
await broker.inference.acknowledgeProviderSigner(providerAddress)

// Get service metadata
const { endpoint, model } =
    await broker.inference.getServiceMetadata(providerAddress)

// Generate auth headers
const headers = await broker.inference.getRequestHeaders(providerAddress)

// Make request (OpenAI compatible)
const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Hello!' }],
    }),
})

// Or make async request (support images-generations and images-edits)

// Async endpoints live under /v1/async instead of /v1/proxy
const asyncBase = endpoint.replace('/v1/proxy', '/v1/async')
const requestBody = {
    model,
    prompt: 'A cute baby sea otter',
    n: 1,
    size: '512x512',
    response_format: 'b64_json',
}

// Step 1 — submit the job
const submitHeaders = await broker.inference.getRequestHeaders(
    providerAddress,
    JSON.stringify(requestBody)
)
const submitRes = await fetch(`${asyncBase}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...submitHeaders },
    body: JSON.stringify(requestBody),
})
// 202 Accepted → { jobId: "uuid", status: "pending" }
const { jobId } = await submitRes.json()

// Step 2 — poll until done
let job
do {
    const retryAfter = job?.retryAfter ?? 5
    await new Promise((r) => setTimeout(r, retryAfter * 1000))

    const pollHeaders =
        await broker.inference.getRequestHeaders(providerAddress)
    const pollRes = await fetch(`${asyncBase}/jobs/${jobId}`, {
        headers: pollHeaders,
    })
    const retryAfterHeader = pollRes.headers.get('Retry-After')
    job = {
        ...(await pollRes.json()),
        retryAfter: retryAfterHeader ? Number(retryAfterHeader) : 5,
    }
} while (job.status === 'pending' || job.status === 'processing')

if (job.status === 'failed') throw new Error(job.errorMessage)

// job.data — raw provider response, e.g. { data: [{ b64_json: "..." }] }
```

## Direct API Access

After obtaining a secret with `0g-compute-cli inference get-secret`, use any OpenAI-compatible client:

```typescript
import OpenAI from 'openai'

const client = new OpenAI({
    baseURL: `${serviceUrl}/v1/proxy`,
    apiKey: 'app-sk-<YOUR_SECRET>',
})

const completion = await client.chat.completions.create({
    model: 'model-name',
    messages: [{ role: 'user', content: 'Hello!' }],
})
```

## Account Management

The 0G Compute Network uses a two-tier account system:

- **Main Account**: Where you deposit funds from your wallet
- **Sub-Accounts**: Provider-specific accounts for service payments

```bash
# Check account balance
0g-compute-cli get-account

# Deposit to main account
0g-compute-cli deposit --amount 10

# Transfer to provider sub-account
0g-compute-cli transfer-fund --provider <PROVIDER_ADDRESS> --amount 5

# Request refund from sub-accounts (24-hour lock period)
0g-compute-cli retrieve-fund

# Withdraw to wallet
0g-compute-cli refund --amount 5
```

## Fine-tuning

Customize AI models with your own data:

```bash
# List available providers
0g-compute-cli fine-tuning list-providers

# List available models
0g-compute-cli fine-tuning list-models

# Upload your dataset
0g-compute-cli fine-tuning upload --data-path ./my-dataset

# Create fine-tuning task
0g-compute-cli fine-tuning create-task \
  --provider <PROVIDER_ADDRESS> \
  --model distilbert-base-uncased \
  --dataset <DATASET_ROOT_HASH> \
  --config-path ./config.json \
  --data-size <SIZE>

# Monitor progress
0g-compute-cli fine-tuning get-task --provider <PROVIDER_ADDRESS> --task <TASK_ID>

# Download and decrypt result
0g-compute-cli fine-tuning acknowledge-model --provider <PROVIDER_ADDRESS> --task-id <TASK_ID> --data-path ./model
0g-compute-cli fine-tuning decrypt-model --provider <PROVIDER_ADDRESS> --task-id <TASK_ID> --encrypted-model ./model --output ./model.zip
```

## Provider Controller (For Service Providers)

Service providers can manage their deployed containers and configurations remotely using the controller CLI.

### Setup

```bash
# Reset saved endpoint configuration
0g-compute-cli controller reset-controller-endpoint
```

### Container Management

```bash
# View all container status
0g-compute-cli controller status

# Start/stop/restart specific containers
0g-compute-cli controller start --container broker
0g-compute-cli controller stop --container event
0g-compute-cli controller restart --container ingress

# Available containers: broker, event, ingress, prometheus-init, prometheus
```

### Configuration Management

The controller manages three types of configurations:

| Type         | Description                         | Format                     |
| ------------ | ----------------------------------- | -------------------------- |
| `core`       | Broker + Event shared config        | YAML                       |
| `ingress`    | Nginx ingress environment variables | JSON                       |
| `prometheus` | Prometheus monitoring config        | YAML (auto base64 encoded) |

```bash
# Get configuration
0g-compute-cli controller get-config --type core --output config.yaml
0g-compute-cli controller get-config --type ingress
0g-compute-cli controller get-config --type prometheus --decode  # decode base64

# Update configuration
# core: updates config AND restarts broker+event
0g-compute-cli controller update-config --type core --config config.yaml

# ingress: provide JSON file with env vars
# Example env.json: {"DOMAIN": "example.com", "PORT": "443"}
0g-compute-cli controller update-config --type ingress --config env.json

# prometheus: provide YAML file (auto base64 encoded)
0g-compute-cli controller update-config --type prometheus --config prometheus.yml
```

### Admin & Security Management

```bash
# Manage admin wallet whitelist
0g-compute-cli controller list-admins
0g-compute-cli controller add-admin --address 0x...
0g-compute-cli controller remove-admin --address 0x...

# Manage IP whitelist
0g-compute-cli controller list-ips
0g-compute-cli controller add-ip --ip 192.168.1.100
0g-compute-cli controller add-ip --ip 10.0.0.0/8  # CIDR supported
0g-compute-cli controller remove-ip --ip 192.168.1.100
```

### Image Management

```bash
# View current image info
0g-compute-cli controller image-info

# Pull latest image and recreate broker+event containers
0g-compute-cli controller update-images
```

## Network Configuration

| Network | RPC Endpoint                 |
| ------- | ---------------------------- |
| Testnet | https://evmrpc-testnet.0g.ai |
| Mainnet | https://evmrpc.0g.ai         |

## Browser Usage

For browser environments, you'll need polyfills for Node.js built-in modules:

```bash
pnpm add -D vite-plugin-node-polyfills
```

```javascript
// vite.config.js
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default {
    plugins: [
        nodePolyfills({
            include: ['crypto', 'stream', 'util', 'buffer', 'process'],
            globals: { Buffer: true, global: true, process: true },
        }),
    ],
}
```

## Troubleshooting

### Insufficient Balance

```bash
# Check which account needs funds
0g-compute-cli get-account

# Deposit to main account
0g-compute-cli deposit --amount 10

# Transfer to provider
0g-compute-cli transfer-fund --provider <ADDRESS> --amount 5
```

### Provider Not Acknowledged

```bash
0g-compute-cli inference acknowledge-provider --provider <PROVIDER_ADDRESS>
```

### Web UI Port Conflict

```bash
0g-compute-cli ui start-web --port 3091
```

## Documentation

- [0G Compute Network Overview](https://docs.0g.ai/developer-hub/building-on-0g/compute-network/overview)
- [Inference Guide](https://docs.0g.ai/developer-hub/building-on-0g/compute-network/inference)
- [Fine-tuning Guide](https://docs.0g.ai/developer-hub/building-on-0g/compute-network/fine-tuning)
- [Account Management](https://docs.0g.ai/developer-hub/building-on-0g/compute-network/account-management)
