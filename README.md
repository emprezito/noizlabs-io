# NoizLabs - Audio Tokenization Platform 🎵🔗

NoizLabs is a cutting-edge platform that enables creators to turn audio clips & sound Memes into Tradable tokens on the Solana blockchain. Built for degen traders, meme enthusiasts, musicians, podcasters, and audio creators to monetize their work through decentralized ownership and trading.

## 🚀 Features

- **Audio Tokenization**: Convert audio clips & Sound Memes into tradable Tokens
- **Solana Integration**: Fast, low-cost transactions on Solana
- **Raydium DEX**: Built-in liquidity pool creation and trading
- **Web3 Wallet Support**: Connect with Phantom, Solflare, and other wallets
- **Modern UI**: Built with Next.js, TypeScript, and Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Blockchain**: Solana, Raydium SDK
- **Web3**: @solana/wallet-adapter, @solana/web3.js
- **UI**: shadcn/ui, Framer Motion
- **Deployment**: Vercel (via Lovable)

## 🏁 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>

# Navigate to project directory
cd noizlabs

# Install dependencies
npm install

# Start development server
npm run dev
```
open http://localhost:3000 to view your application

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## How it works ##

- **Upload Audio:** Drag and drop audio file or record directly
- **Create Token:** Mint Unique SPL Tokens for each audio clip
- **Add Liquidity:** Create Trading pools on Raydium
- **Trade & Earn:** Buy, sell and earn from Tokenized audio clips

## Development ##

**Available Script**

```bash
npm run dev          # Start development server

npm run build        # Build for production

npm run start        # Start production server

npm run lint         # Run ESLint
```
**Environment Variable** 

create a .env.local file:

```bash
NEXT_PUBLIC_SOLANA_RPC_URL=your_rpc_endpoint
NEXT_PUBLIC_SOLANA_NETWORK=devnet/mainnet
```

## Deployment ##

This project is deployed via vercel. To deploy:
1. Push your changes to the main branch 
2. Connect your Github repository to vercel
3. Vercel will automatically deploy on each push to main

**Manual Deployment**

```bash

# Build the project
npm run build

# Deploy to Vercel
npx vercel --prod

```

## 🔗 Links ##
-**Live Demo:** [Noizlabs live Demo](https://youtu.be/a0IfbN4J5oQ?si=LweJ24HAQUmxYcI1)
-**Website:** [Noizlabs.vercel.app](noizlabs.vercel.app)
-**X (Formerly Twitter):** [x.com/noizlabs_io]


Built with ❤️ by the NoizLabs team