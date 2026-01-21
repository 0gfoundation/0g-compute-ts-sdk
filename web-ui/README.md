# 0G Compute Web UI

A modern web interface for the 0G Compute Network - enabling decentralized AI services.

## Features

- **AI Chat Interface** - Stream responses from decentralized AI providers
- **Wallet Integration** - Connect via RainbowKit (MetaMask, WalletConnect, etc.)
- **Fund Management** - Deposit, withdraw, and manage funds across providers
- **Visual Balance Flow** - Understand how your funds move through the system
- **Guided Onboarding** - Step-by-step setup for new users

## Tech Stack

- **Framework:** Next.js 15 (React 19)
- **Styling:** TailwindCSS + shadcn/ui
- **Wallet:** RainbowKit + wagmi
- **State:** React Query + Dexie (IndexedDB)
- **SDK:** @0glabs/0g-serving-broker

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- A Web3 wallet (MetaMask, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/0glabs/0g-compute-web-ui.git
cd 0g-compute-web-ui

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Build static export
pnpm build

# The output will be in the 'out' directory
```

## Deployment

This app uses Next.js static export (`output: 'export'`), making it compatible with:

- **Vercel** (recommended)
- **Netlify**
- **Cloudflare Pages**
- **GitHub Pages**
- **Any static hosting**

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/0glabs/0g-compute-web-ui)

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── inference/          # AI inference & chat
│   ├── wallet/             # Account management
│   └── fine-tuning/        # Model fine-tuning
├── components/
│   └── ui/                 # Reusable UI components
├── shared/
│   ├── hooks/              # Custom React hooks
│   ├── providers/          # Context providers
│   └── utils/              # Utility functions
└── lib/                    # SDK integration
```

## Key Components

| Component | Description |
|-----------|-------------|
| `OnboardingFlow` | Guided setup wizard for new users |
| `BalanceFlowDiagram` | Visual representation of fund flow |
| `TopUpModal` | Transfer funds to providers |
| `WithdrawDialog` | Withdraw funds to wallet |

## Configuration

The app connects to the 0G Compute Network. Configure chain settings in:
- `src/shared/providers/RainbowProvider.tsx`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [0G Documentation](https://docs.0g.ai)
- [0G Compute Concepts](https://docs.0g.ai/concepts/compute)
- [SDK Repository](https://github.com/0glabs/0g-serving-user-broker)
