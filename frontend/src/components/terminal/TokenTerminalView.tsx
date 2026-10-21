"use client";

import React from "react";
import { formatEther } from "viem";
import { Copy, ExternalLink, Globe, Send, CheckCircle2, Flame, ShieldCheck, ArrowLeft } from "lucide-react";
import { XIcon } from "@/components/ui/Icons";
import { LaunchpadToken } from "@/config/contracts";
import { TradingViewChart } from "@/components/charts/TradingViewChart";
import { BondingCurveProgressBar } from "@/components/BondingCurveProgressBar";
import { TradeWidget } from "@/components/trading/TradeWidget";
import { formatAddress, formatCompactNumber, formatEth, formatTimeAgo } from "@/lib/utils";
import { TradeActivity } from "@/lib/mockData";

interface TokenTerminalViewProps {
  token: LaunchpadToken;
  trades: TradeActivity[];
  onBack: () => void;
  onTradeSuccess: (trade: any) => void;
}

export function TokenTerminalView({
  token,
  trades,
  onBack,
  onTradeSuccess,
}: TokenTerminalViewProps) {
  const isGraduated = token.graduated || token.progressPercent >= 100;
  const tokenTrades = trades.filter(
    (t) =>
      t.tokenAddress.toLowerCase() === token.address.toLowerCase() ||
      t.tokenSymbol.toLowerCase() === token.symbol.toLowerCase()
  );

  const [copied, setCopied] = React.useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(token.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn">
      {/* Top Navigation & Token Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5 rounded-2xl border border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-all border border-white/5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <img
            src={
              token.metadata?.image ||
              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80"
            }
            alt={token.name}
            className="w-14 h-14 rounded-2xl object-cover border border-white/10 glow-emerald"
          />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {token.name}
              </h2>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                ${token.symbol}
              </span>
              {isGraduated && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3" /> GRADUATED
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-400 mt-1">
              <button
                onClick={copyAddress}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <span>Token: {formatAddress(token.address)}</span>
                <Copy className="w-3 h-3 text-neutral-500" />
                {copied && <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>}
              </button>
              <span>•</span>
              <a
                href={`https://sepolia.etherscan.io/address/${token.address}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-neutral-400 hover:text-emerald-400 transition-colors"
              >
                <span>Etherscan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <span>Creator: {formatAddress(token.creator)}</span>
            </div>
          </div>
        </div>

        {/* Social Icons & Share */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {token.metadata?.website && (
            <a
              href={token.metadata.website}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-all border border-white/5"
            >
              <Globe className="w-4 h-4" />
            </a>
          )}
          {token.metadata?.twitter && (
            <a
              href={token.metadata.twitter}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-all border border-white/5"
            >
              <XIcon className="w-4 h-4" />
            </a>
          )}
          {token.metadata?.telegram && (
            <a
              href={token.metadata.telegram}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-all border border-white/5"
            >
              <Send className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Main Terminal Layout: Left Chart + Progress, Right Swap Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols wide) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* TradingView Candlestick Chart */}
          <TradingViewChart token={token} />

          {/* Bonding Curve Progress */}
          <BondingCurveProgressBar token={token} />

          {/* Description & Tokenomics Card */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col gap-4">
            <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
              Tokenomics & Protocol Architecture
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed font-sans">
              {token.metadata?.description ||
                "ApexLaunch bonding curve token featuring continuous on-chain pricing, anti-snipe block decay, and automated LP burn on DEX graduation."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-neutral-400 block">TOTAL SUPPLY</span>
                <span className="font-bold text-white">1,000,000,000</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-neutral-400 block">CURVE SUPPLY</span>
                <span className="font-bold text-emerald-400">800,000,000 (80%)</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-neutral-400 block">DEX LIQUIDITY</span>
                <span className="font-bold text-teal-400">200,000,000 (20%)</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-neutral-400 block">LP TOKENS</span>
                <span className="font-bold text-amber-400">BURNED TO 0xDEAD</span>
              </div>
            </div>
          </div>

          {/* Recent Trades Table for this Token */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
                Orderbook & Swap History
              </h3>
              <span className="text-xs font-mono text-neutral-400">
                {tokenTrades.length} Swaps Recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-neutral-400 border-b border-white/5">
                    <th className="pb-2">TYPE</th>
                    <th className="pb-2">ETH AMOUNT</th>
                    <th className="pb-2">TOKENS</th>
                    <th className="pb-2">TRADER</th>
                    <th className="pb-2 text-right">TIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tokenTrades.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-neutral-400">
                        No swaps recorded for this token yet. Be the first trader!
                      </td>
                    </tr>
                  ) : (
                    tokenTrades.map((trade) => {
                      const isBuy = trade.type === "buy";
                      return (
                        <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                                isBuy
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-rose-500/15 text-rose-400"
                              }`}
                            >
                              {trade.type}
                            </span>
                          </td>
                          <td className="py-2.5 font-bold text-white">{trade.ethAmount} ETH</td>
                          <td className="py-2.5 text-neutral-300">{trade.tokenAmount}</td>
                          <td className="py-2.5 text-neutral-400">{trade.trader}</td>
                          <td className="py-2.5 text-right text-neutral-400">
                            {formatTimeAgo(trade.timestamp)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Swap Widget & Pool Security Stats */}
        <div className="flex flex-col gap-6">
          <TradeWidget token={token} onTradeSuccess={onTradeSuccess} />

          {/* Security & Anti-Snipe Info Card */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col gap-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-white/5 pb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>SECURITY & FAIR LAUNCH VERIFICATION</span>
            </div>
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">Anti-Snipe Status:</span>
              <span className="text-emerald-400 font-semibold">Exited Block 5 (0% Tax)</span>
            </div>
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">Ownership:</span>
              <span className="text-white">Renounced / Pool Managed</span>
            </div>
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">DEX Graduation:</span>
              <span className="text-white">Auto Uniswap V2 / V4</span>
            </div>
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">LP Burn Recipient:</span>
              <span className="text-amber-400">0x000...dEaD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
