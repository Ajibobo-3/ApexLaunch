import LaunchpadFactoryAbi from "./abis/LaunchpadFactory.json";
import BondingCurvePoolAbi from "./abis/BondingCurvePool.json";
import ApexTokenAbi from "./abis/ApexToken.json";

export const FACTORY_ABI = LaunchpadFactoryAbi as any;
export const POOL_ABI = BondingCurvePoolAbi as any;
export const TOKEN_ABI = ApexTokenAbi as any;

export const DEFAULT_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111"); // Sepolia

export const CONTRACT_ADDRESSES: Record<number, { factory: `0x${string}`; graduator: `0x${string}`; rpc: string }> = {
  // Sepolia Testnet
  11155111: {
    factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`) || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    graduator: (process.env.NEXT_PUBLIC_GRADUATOR_ADDRESS as `0x${string}`) || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    rpc: process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.sepolia.org",
  },
  // Robinhood Chain Testnet / L2 Testnet
  46630: {
    factory: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    graduator: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    rpc: "https://rpc.testnet.robinhood.com",
  },
  // Local Anvil / Foundry
  31337: {
    factory: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    graduator: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    rpc: "http://127.0.0.1:8545",
  },
};

export function getContractAddresses(chainId?: number) {
  const targetId = chainId && CONTRACT_ADDRESSES[chainId] ? chainId : DEFAULT_CHAIN_ID;
  return CONTRACT_ADDRESSES[targetId] || CONTRACT_ADDRESSES[11155111];
}

export interface TokenMetadata {
  description?: string;
  image?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}

export interface LaunchpadToken {
  address: `0x${string}`;
  poolAddress: `0x${string}`;
  name: string;
  symbol: string;
  tokenURI: string;
  creator: `0x${string}`;
  supplySold: bigint;
  ethReserve: bigint;
  currentPrice: bigint;
  graduated: boolean;
  dexPair?: `0x${string}`;
  createdAt: number;
  metadata?: TokenMetadata;
  marketCapEth: number;
  progressPercent: number;
  volume24hEth: number;
}
