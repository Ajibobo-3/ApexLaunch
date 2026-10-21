"use client";

import React from "react";
import { formatEther } from "viem";
import { Flame, Sparkles, Globe, Send, Lock, ChevronRight } from "lucide-react";
import { XIcon } from "@/components/ui/Icons";
import { LaunchpadToken } from "@/config/contracts";
import { formatCompactNumber, formatEth, formatTimeAgo } from "@/lib/utils";

interface TokenCardProps {
  token: LaunchpadToken;
  isSelected: boolean;
  onSelect: (token: LaunchpadToken) => void;
}

export function TokenCard({ token, isSelected, onSelect }: TokenCardProps) {
  const isGraduated = token.graduated || token.progressPercent >= 100;
  const currentEth = parseFloat(formatEther(token.ethReserve));
  const spotPriceGwei = (Number(token.currentPrice) / 1e9).toFixed(3);

  return (
    <div
      onClick={() => onSelect(token)}
      className={`glass-card rounded-2xl p-4 flex flex-col gap-3.5 transition-all cursor-pointer relative overflow-hidden group ${
        isSelected
          ? "border-emerald-500/50 bg-[#0d0d14] shadow-[0_0_30px_rgba(16,185,129,0.18)]"
          : "hover:border-white/20 hover:bg-[#0c0c11]"
      }`}
    >
      {/* Background Glow */}
      <div
        className={`absolute -right-12 -top-12 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20 transition-opacity group-hover:opacity-40 ${
          isGraduated ? "bg-amber-500" : "bg-emerald-500"
        }`}
      />

      {/* Top Header: Avatar, Name, Badge */}
      <div className="flex items-center justify-between gap-2.5 z-10">
        <div className="flex items-center gap-2.5">
          <img
            src={
              token.metadata?.image ||
              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80"
            }
            alt={token.name}
            className="w-11 h-11 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                {token.name}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs text-neutral-400">
              <span className="font-semibold text-emerald-400/90">${token.symbol}</span>
              <span>•</span>
              <span>{formatTimeAgo(token.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {isGraduated ? (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold tracking-wide">
            <Flame className="w-3 h-3" />
            DEX
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold tracking-wide">
            <Sparkles className="w-3 h-3" />
            {token.progressPercent.toFixed(1)}%
          </span>
        )}
      </div>

      {/* Description Snippet */}
      {token.metadata?.description && (
        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed font-sans">
          {token.metadata.description}
        </p>
      )}

      {/* Market Cap & Spot Price */}
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-xs">
        <div>
          <span className="text-[10px] text-neutral-400 block">MARKET CAP</span>
          <span className="font-bold text-white">
            {token.marketCapEth.toFixed(2)} ETH
          </span>
        </div>
        <div>
          <span className="text-[10px] text-neutral-400 block">SPOT PRICE</span>
          <span className="font-bold text-emerald-400">
            {spotPriceGwei} Gwei
          </span>
        </div>
      </div>

      {/* Bonding Curve Mini Progress */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <span>Bonding Curve</span>
          <span className={isGraduated ? "text-amber-400 font-semibold" : "text-white"}>
            {isGraduated ? "Graduated (4.2 ETH)" : `${currentEth.toFixed(2)} / 4.2 ETH`}
          </span>
        </div>

        <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-white/5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isGraduated
                ? "bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                : "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            }`}
            style={{ width: `${Math.max(4, token.progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Footer: Volume & Socials */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-neutral-400 font-mono">
        <span>Vol: <strong className="text-white">{token.volume24hEth.toFixed(1)} ETH</strong></span>

        <div className="flex items-center gap-2">
          {token.metadata?.website && (
            <a
              href={token.metadata.website}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-neutral-500 hover:text-emerald-400 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
          {token.metadata?.twitter && (
            <a
              href={token.metadata.twitter}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-neutral-500 hover:text-emerald-400 transition-colors"
            >
              <XIcon className="w-3.5 h-3.5" />
            </a>
          )}
          <span className="flex items-center gap-0.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform font-bold text-[11px]">
            Trade <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
