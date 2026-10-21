import { http, createConfig, cookieStorage, createStorage } from "wagmi";
import { sepolia, arbitrumSepolia, baseSepolia, foundry } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [sepolia, baseSepolia, arbitrumSepolia, foundry],
  connectors: [
    injected({ shimDisconnect: true }),
  ],
  ssr: true,
  storage: createStorage({
    storage: typeof window !== "undefined" ? window.localStorage : cookieStorage,
  }),
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.sepolia.org"),
    [baseSepolia.id]: http("https://sepolia.base.org"),
    [arbitrumSepolia.id]: http("https://sepolia-rollup.arbitrum.io/rpc"),
    [foundry.id]: http("http://127.0.0.1:8545"),
  },
});
