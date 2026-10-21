# ApexLaunch 🚀
### Next-Gen Decentralized Token Launchpad & Bonding Curve Engine

ApexLaunch is a full-stack, production-ready decentralized token launchpad protocol built with Foundry, Solidity (`^0.8.24`), Next.js 14+ (App Router), Tailwind CSS, Viem/Wagmi v2, and TradingView Lightweight Charts.

Inspired by luxury financial terminals and cyberpunk minimalism, ApexLaunch is designed to surpass legacy launchpads (such as Pump.fun and PonsFamily) with mathematical precision, anti-snipe MEV protection, and guaranteed automated DEX graduation.

---

## 🏛 Core Architectural Pillars

### 1. Mathematical Bonding Curve Pool (`BondingCurvePool.sol`)
- **Continuous Pricing Equation:**
  $$\text{Spot Price: } P(s) = P_0 + \frac{K \cdot s}{\text{SCALE}}$$
  $$\text{ETH Cost: } \int_{s}^{s+\Delta s} P(u) du = \frac{P_0 \cdot \Delta s}{10^{18}} + \frac{K_{\text{num}} \cdot \Delta s \cdot (2s + \Delta s)}{K_{\text{den}}}$$
- **Fixed Supply:** 1,000,000,000 tokens ($10^9 \times 10^{18}$).
- **Supply Allocation:** 
  - **80% (800,000,000 tokens):** Traded dynamically along the bonding curve.
  - **20% (200,000,000 tokens):** Locked in reserve for DEX graduation.
- **Closed-Form Integer Root Calculation:** Zero Newton-Raphson approximation loops. Exact $\Delta s$ tokens received per $\Delta E$ solved via integer quadratic formula:
  $$\Delta s = \frac{\sqrt{c_1^2 + 4 c_2 c_0} - c_1}{2 c_2}$$
  Ensures sub-50k gas swaps with 100% mathematical reversibility.

### 2. Decaying Anti-Snipe Tax Mechanism
- Early block sniper protection decaying from 99% down to 0% across 5 blocks:
  - **Block 0 (Creation block):** 99% tax
  - **Block 1:** 79% tax
  - **Block 2:** 59% tax
  - **Block 3:** 39% tax
  - **Block 4:** 19% tax
  - **Block 5+:** 0% tax (Completely safe for honest public trading)
- Collected anti-snipe tax is forwarded to the platform treasury / pool, disincentivizing sandwich MEV and bot snipers while protecting retail participants.
- **Dev-Buy Bundle Exemption:** Creator initial buy bundles executed atomically in `createToken` are exempt from the anti-snipe tax.

### 3. Automated DEX Liquidity Graduation (`DEXGraduator.sol`)
- **Graduation Threshold:** Exactly `4.2 ETH` accumulated in the curve pool.
- **Automated Migration:** When threshold is met, the pool automatically locks bonding curve trading, transfers the accumulated `4.2 ETH` + `200M reserved tokens` to `DEXGraduator`.
- **Permanent LP Burn:** Interacts with Uniswap V2 / V4 router to create the DEX pair and burns 100% of the minted LP tokens directly to `0x000000000000000000000000000000000000dEaD`.

### 4. High-End Financial Terminal UI
- Deep pitch-black dark mode (`#050507`), glassmorphic panels, hairline borders (`rgba(255,255,255,0.08)`), and emerald/crimson/gold neon glow accents.
- **Real-Time Candlestick Charting:** Powered by TradingView's canvas `lightweight-charts` engine with multi-timeframe resolution.
- **Live Terminal Feed:** Real-time stream of new token creations, buys, sells, and DEX migrations.
- **1-Click Trade Drawer:** Instant buy/sell with customizable slippage presets, anti-snipe safety badge, and gas estimation.
- **Drag-and-Drop Creator Modal:** IPFS metadata upload, dev-buy bundle options, and live ticker avatar preview.

---

## 📁 Repository Structure

```
ApexLaunch/
├── contracts/                     # Foundry Smart Contracts
│   ├── src/
│   │   ├── ApexToken.sol          # Fixed supply ERC-20 with Permit & metadata
│   │   ├── BondingCurvePool.sol   # Bonding curve AMM, anti-snipe, graduation
│   │   ├── LaunchpadFactory.sol   # Token & pool factory with dev bundles
│   │   ├── DEXGraduator.sol       # DEX migration & LP burning engine
│   │   ├── interfaces/            # Uniswap V2 / V4 interfaces
│   │   └── mocks/                 # Mock DEX Router & Factory for test suites
│   ├── test/
│   │   └── ApexLaunch.t.sol       # Comprehensive Foundry test & fuzz suite
│   ├── script/
│   │   └── Deploy.s.sol           # Sepolia / Testnet deployment script
│   └── foundry.toml               # Solc 0.8.33 configuration & remappings
├── frontend/                      # Next.js 14+ App Router
│   ├── src/
│   │   ├── app/                   # App router pages & layouts
│   │   ├── components/            # Luxury UI components
│   │   │   ├── charts/            # TradingView Candlestick canvas chart
│   │   │   ├── layout/            # Header, HeroMetricsBar, Nav
│   │   │   ├── modals/            # CreateTokenModal (drag & drop, dev bundle)
│   │   │   ├── terminal/          # LiveFeed, TokenTerminalView
│   │   │   ├── tokens/            # MainTokenGrid, TokenCard
│   │   │   └── trading/           # TradeWidget (1-click Buy/Sell drawer)
│   │   ├── config/                # Wagmi v2, Viem, contract ABIs & addresses
│   │   ├── hooks/                 # Real-time Web3 event hooks
│   │   └── lib/                   # Utilities & mock showcase state
│   ├── package.json
│   └── next.config.ts
├── .github/workflows/
│   └── test-and-deploy.yml        # CI/CD workflow running forge test & build
├── vercel.json                    # Vercel deployment configuration
└── README.md
```

---

## 🛠 Local Setup & Testing

### Prerequisites
- [Foundry](https://getfoundry.sh/) (`forge`, `cast`, `anvil`)
- [Node.js](https://nodejs.org/) (v18+) & `npm`

### 1. Smart Contract Tests (Foundry)
```bash
cd contracts

# Run all test suites with verbose execution traces
forge test -vvv

# Run fuzz tests (256 runs per invariant)
forge test --fuzz-runs 256
```

### 2. Deploying Contracts to Sepolia Testnet
```bash
cd contracts

# Export deployer private key and RPC URL
export PRIVATE_KEY="your-private-key"
export RPC_URL="https://rpc.sepolia.org"

# Broadcast deployment
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify
```

### 3. Running the Frontend Locally
```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the ApexLaunch terminal.

### 4. Building for Production
```bash
cd frontend
npm run build
```

---

## 🚀 Vercel Deployment

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete ApexLaunch protocol & frontend"
   git push origin main
   ```
2. Import the repository in [Vercel](https://vercel.com):
   - **Framework Preset:** Next.js
   - **Root Directory:** `./frontend` (or root with provided `vercel.json`)
   - **Environment Variables:**
     - `NEXT_PUBLIC_CHAIN_ID`: `11155111`
     - `NEXT_PUBLIC_FACTORY_ADDRESS`: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
     - `NEXT_PUBLIC_GRADUATOR_ADDRESS`: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
     - `NEXT_PUBLIC_RPC_URL`: `https://rpc.sepolia.org`

---

## 🛡 Security & Edge Cases Handled
- **Reentrancy Protection:** All fund transfers and state changes protected by OpenZeppelin `ReentrancyGuard`.
- **Slippage Bounds:** Both `buy` and `sell` accept minimum return thresholds (`minTokensOut`, `minEthOut`).
- **Zero Supply Inflation:** Fixed supply of 1B tokens minted exclusively during pool initialization; no minting capabilities exist post-deployment.
- **LP Lock Guarantee:** Migration directly routes LP tokens to `0xdead`, preventing developer rug pulls or liquidity withdrawal.

---

## 📜 License
MIT License.
