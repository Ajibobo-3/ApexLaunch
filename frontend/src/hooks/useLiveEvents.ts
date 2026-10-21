"use client";

import { useEffect, useRef, useState } from "react";
import { usePublicClient, useWatchContractEvent } from "wagmi";
import { formatUnits } from "viem";
import { FACTORY_ABI, POOL_ABI, getContractAddresses, LaunchpadToken, TradeActivity } from "@/config/contracts";

interface UseLiveEventsProps {
  onTokenCreated?: (token: LaunchpadToken) => void;
  onTrade?: (trade: TradeActivity) => void;
  poolAddresses?: `0x${string}`[];
  enabled?: boolean;
}

export function useLiveEvents({
  onTokenCreated,
  onTrade,
  poolAddresses = [],
  enabled = true,
}: UseLiveEventsProps) {
  const publicClient = usePublicClient();
  const addresses = getContractAddresses();
  const [isConnected, setIsConnected] = useState(false);
  const lastSeenBlockRef = useRef<bigint | null>(null);

  // Track WebSocket connection status
  useEffect(() => {
    if (!publicClient || !enabled) return;

    const checkConnection = async () => {
      try {
        const blockNumber = await publicClient.getBlockNumber();
        if (blockNumber) {
          setIsConnected(true);

          // Initialize last seen block on first connection
          if (lastSeenBlockRef.current === null) {
            lastSeenBlockRef.current = blockNumber;
          }
        }
      } catch (error) {
        setIsConnected(false);
        console.error("WebSocket connection check failed:", error);
      }
    };

    checkConnection();

    // Poll connection status
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [publicClient, enabled]);

  // Backfill missed events on reconnection
  useEffect(() => {
    if (!publicClient || !enabled || !isConnected) return;

    const backfillEvents = async () => {
      try {
        const currentBlock = await publicClient.getBlockNumber();
        if (!currentBlock || !lastSeenBlockRef.current) return;

        const fromBlock = lastSeenBlockRef.current + 1n;
        const toBlock = currentBlock;

        if (fromBlock > toBlock) return;

        console.log(`Backfilling events from block ${fromBlock} to ${toBlock}`);

        // Backfill TokenCreated events
        const tokenCreatedLogs = await publicClient.getLogs({
          address: addresses.factory,
          event: {
            type: "event",
            name: "TokenCreated",
            inputs: [
              { type: "address", indexed: true, name: "token" },
              { type: "address", indexed: true, name: "pool" },
              { type: "address", indexed: true, name: "creator" },
              { type: "string", indexed: false, name: "name" },
              { type: "string", indexed: false, name: "symbol" },
              { type: "string", indexed: false, name: "tokenURI" },
              { type: "uint256", indexed: false, name: "initialBuyEth" },
              { type: "uint256", indexed: false, name: "initialBuyTokens" },
              { type: "uint256", indexed: false, name: "timestamp" },
            ],
          },
          fromBlock,
          toBlock,
        });

        for (const log of tokenCreatedLogs) {
          if (onTokenCreated && log.args) {
            const token: LaunchpadToken = {
              address: log.args.token as `0x${string}`,
              poolAddress: log.args.pool as `0x${string}`,
              name: log.args.name as string,
              symbol: log.args.symbol as string,
              tokenURI: log.args.tokenURI as string,
              creator: log.args.creator as `0x${string}`,
              supplySold: log.args.initialBuyTokens || 0n,
              ethReserve: log.args.initialBuyEth || 0n,
              currentPrice: 1000000000n, // Default 1 Gwei
              graduated: false,
              createdAt: Number(log.args.timestamp || log.blockNumber),
              marketCapEth: 0,
              progressPercent: 0,
              volume24hEth: 0,
            };
            onTokenCreated(token);
          }
        }

        // Backfill Buy and Sell events for each pool
        for (const poolAddress of poolAddresses) {
          const buyLogs = await publicClient.getLogs({
            address: poolAddress,
            event: {
              type: "event",
              name: "Buy",
              inputs: [
                { type: "address", indexed: true, name: "buyer" },
                { type: "address", indexed: true, name: "recipient" },
                { type: "uint256", indexed: false, name: "ethIn" },
                { type: "uint256", indexed: false, name: "tokensOut" },
                { type: "uint256", indexed: false, name: "fee" },
                { type: "uint256", indexed: false, name: "antiSnipeTax" },
                { type: "uint256", indexed: false, name: "newSupplySold" },
                { type: "uint256", indexed: false, name: "spotPrice" },
              ],
            },
            fromBlock,
            toBlock,
          });

          for (const log of buyLogs) {
            if (onTrade && log.args) {
              const trade: TradeActivity = {
                id: `backfill-${log.blockHash}-${log.logIndex}`,
                type: "buy",
                tokenAddress: poolAddress,
                tokenSymbol: "", // Will be filled by caller
                ethAmount: formatUnits(log.args.ethIn || 0n, 18),
                tokenAmount: formatUnits(log.args.tokensOut || 0n, 18),
                trader: log.args.buyer as `0x${string}`,
                timestamp: Number(log.blockNumber),
                txHash: log.transactionHash,
              };
              onTrade(trade);
            }
          }

          const sellLogs = await publicClient.getLogs({
            address: poolAddress,
            event: {
              type: "event",
              name: "Sell",
              inputs: [
                { type: "address", indexed: true, name: "seller" },
                { type: "address", indexed: true, name: "recipient" },
                { type: "uint256", indexed: false, name: "tokensIn" },
                { type: "uint256", indexed: false, name: "ethOut" },
                { type: "uint256", indexed: false, name: "fee" },
                { type: "uint256", indexed: false, name: "newSupplySold" },
                { type: "uint256", indexed: false, name: "spotPrice" },
              ],
            },
            fromBlock,
            toBlock,
          });

          for (const log of sellLogs) {
            if (onTrade && log.args) {
              const trade: TradeActivity = {
                id: `backfill-${log.blockHash}-${log.logIndex}`,
                type: "sell",
                tokenAddress: poolAddress,
                tokenSymbol: "", // Will be filled by caller
                ethAmount: formatUnits(log.args.ethOut || 0n, 18),
                tokenAmount: formatUnits(log.args.tokensIn || 0n, 18),
                trader: log.args.seller as `0x${string}`,
                timestamp: Number(log.blockNumber),
                txHash: log.transactionHash,
              };
              onTrade(trade);
            }
          }
        }

        // Update last seen block
        lastSeenBlockRef.current = currentBlock;
      } catch (error) {
        console.error("Event backfill failed:", error);
      }
    };

    // Trigger backfill when connection is established
    if (isConnected && lastSeenBlockRef.current !== null) {
      backfillEvents();
    }
  }, [publicClient, addresses.factory, poolAddresses, isConnected, enabled, onTokenCreated, onTrade]);

  // Watch TokenCreated events via WebSocket
  useWatchContractEvent({
    address: addresses.factory,
    abi: FACTORY_ABI,
    eventName: "TokenCreated",
    enabled: enabled && isConnected,
    onLogs: (logs) => {
      for (const log of logs) {
        if (onTokenCreated && log.args) {
          const token: LaunchpadToken = {
            address: log.args.token as `0x${string}`,
            poolAddress: log.args.pool as `0x${string}`,
            name: log.args.name as string,
            symbol: log.args.symbol as string,
            tokenURI: log.args.tokenURI as string,
            creator: log.args.creator as `0x${string}`,
            supplySold: log.args.initialBuyTokens || 0n,
            ethReserve: log.args.initialBuyEth || 0n,
            currentPrice: 1000000000n,
            graduated: false,
            createdAt: Number(log.args.timestamp || log.blockNumber),
            marketCapEth: 0,
            progressPercent: 0,
            volume24hEth: 0,
          };
          onTokenCreated(token);

          // Update last seen block
          if (log.blockNumber) {
            lastSeenBlockRef.current = log.blockNumber;
          }
        }
      }
    },
  });

  // Watch Buy events for each pool
  for (const poolAddress of poolAddresses) {
    useWatchContractEvent({
      address: poolAddress,
      abi: POOL_ABI,
      eventName: "Buy",
      enabled: enabled && isConnected,
      onLogs: (logs) => {
        for (const log of logs) {
          if (onTrade && log.args) {
            const trade: TradeActivity = {
              id: `live-${log.blockHash}-${log.logIndex}`,
              type: "buy",
              tokenAddress: poolAddress,
              tokenSymbol: "", // Will be filled by caller
              ethAmount: formatUnits(log.args.ethIn || 0n, 18),
              tokenAmount: formatUnits(log.args.tokensOut || 0n, 18),
              trader: log.args.buyer as `0x${string}`,
              timestamp: Number(log.blockNumber),
              txHash: log.transactionHash,
            };
            onTrade(trade);

            // Update last seen block
            if (log.blockNumber) {
              lastSeenBlockRef.current = log.blockNumber;
            }
          }
        }
      },
    });

    useWatchContractEvent({
      address: poolAddress,
      abi: POOL_ABI,
      eventName: "Sell",
      enabled: enabled && isConnected,
      onLogs: (logs) => {
        for (const log of logs) {
          if (onTrade && log.args) {
            const trade: TradeActivity = {
              id: `live-${log.blockHash}-${log.logIndex}`,
              type: "sell",
              tokenAddress: poolAddress,
              tokenSymbol: "", // Will be filled by caller
              ethAmount: formatUnits(log.args.ethOut || 0n, 18),
              tokenAmount: formatUnits(log.args.tokensIn || 0n, 18),
              trader: log.args.seller as `0x${string}`,
              timestamp: Number(log.blockNumber),
              txHash: log.transactionHash,
            };
            onTrade(trade);

            // Update last seen block
            if (log.blockNumber) {
              lastSeenBlockRef.current = log.blockNumber;
            }
          }
        }
      },
    });
  }

  return {
    isConnected,
  };
}
