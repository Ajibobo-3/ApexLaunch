"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { FACTORY_ABI, POOL_ABI, TOKEN_ABI, getContractAddresses, LaunchpadToken } from "@/config/contracts";
import { INITIAL_SHOWCASE_TOKENS, INITIAL_TRADES, TradeActivity } from "@/lib/mockData";

export function useLaunchpad() {
  const { address, chainId, isConnected } = useAccount();
  const addresses = getContractAddresses(chainId);

  const [tokens, setTokens] = useState<LaunchpadToken[]>(INITIAL_SHOWCASE_TOKENS);
  const [trades, setTrades] = useState<TradeActivity[]>(INITIAL_TRADES);
  const [selectedToken, setSelectedToken] = useState<LaunchpadToken | null>(INITIAL_SHOWCASE_TOKENS[0]);

  // Read total tokens launched from on-chain factory
  const { data: totalLaunchedOnChain, refetch: refetchTotal } = useReadContract({
    address: addresses.factory,
    abi: FACTORY_ABI,
    functionName: "totalTokensLaunched",
  });

  // Add new trade locally (optimistic update + event propagation)
  const addTrade = useCallback((trade: Omit<TradeActivity, "id">) => {
    const newTrade: TradeActivity = {
      ...trade,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setTrades((prev) => [newTrade, ...prev.slice(0, 49)]);

    // Update token reserves optimistically
    setTokens((prev) =>
      prev.map((t) => {
        if (t.address.toLowerCase() === trade.tokenAddress.toLowerCase()) {
          const ethDelta = parseFloat(trade.ethAmount);
          const currentEth = parseFloat(formatEther(t.ethReserve));
          const newEth = trade.type === "buy" ? currentEth + ethDelta : Math.max(0, currentEth - ethDelta);
          const progress = Math.min(100, (newEth / 4.2) * 100);
          const graduated = progress >= 100;

          return {
            ...t,
            ethReserve: parseEther(newEth.toFixed(6)),
            progressPercent: parseFloat(progress.toFixed(1)),
            graduated,
            volume24hEth: parseFloat((t.volume24hEth + ethDelta).toFixed(2)),
          };
        }
        return t;
      })
    );
  }, []);

  // Add newly created token to local state
  const addNewToken = useCallback((newToken: LaunchpadToken) => {
    setTokens((prev) => [newToken, ...prev]);
    setSelectedToken(newToken);
  }, []);

  return {
    tokens,
    trades,
    selectedToken,
    setSelectedToken,
    addTrade,
    addNewToken,
    totalLaunched: totalLaunchedOnChain ? Number(totalLaunchedOnChain) : tokens.length,
    refetchTotal,
    isConnected,
    userAddress: address,
    factoryAddress: addresses.factory,
  };
}
