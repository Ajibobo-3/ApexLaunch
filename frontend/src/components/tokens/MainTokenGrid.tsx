"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, Flame, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { LaunchpadToken } from "@/config/contracts";
import { TokenCard } from "./TokenCard";

interface MainTokenGridProps {
  tokens: LaunchpadToken[];
  searchQuery: string;
  selectedToken: LaunchpadToken | null;
  onSelectToken: (token: LaunchpadToken) => void;
}

export function MainTokenGrid({
  tokens,
  searchQuery,
  selectedToken,
  onSelectToken,
}: MainTokenGridProps) {
  const [activeTab, setActiveTab] = useState<"active" | "graduated">("active");
  const [sortBy, setSortBy] = useState<"progress" | "marketCap" | "volume" | "newest">("progress");

  const filteredAndSortedTokens = useMemo(() => {
    return tokens
      .filter((t) => {
        // Tab filter
        const isGraduated = t.graduated || t.progressPercent >= 100;
        if (activeTab === "active" && isGraduated) return false;
        if (activeTab === "graduated" && !isGraduated) return false;

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = t.name.toLowerCase().includes(q);
          const matchSymbol = t.symbol.toLowerCase().includes(q);
          const matchAddr = t.address.toLowerCase().includes(q);
          if (!matchName && !matchSymbol && !matchAddr) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "progress") return b.progressPercent - a.progressPercent;
        if (sortBy === "marketCap") return b.marketCapEth - a.marketCapEth;
        if (sortBy === "volume") return b.volume24hEth - a.volume24hEth;
        if (sortBy === "newest") return b.createdAt - a.createdAt;
        return 0;
      });
  }, [tokens, activeTab, sortBy, searchQuery]);

  const activeCount = tokens.filter((t) => !t.graduated && t.progressPercent < 100).length;
  const graduatedCount = tokens.filter((t) => t.graduated || t.progressPercent >= 100).length;

  return (
    <div className="w-full flex flex-col gap-5">
      {/* View Toggle Bar & Sorting Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        {/* Dual View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === "active"
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live Bonding Curves</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/10 text-neutral-300">
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("graduated")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === "graduated"
                ? "bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Graduated Pools</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/10 text-neutral-300">
              {graduatedCount}
            </span>
          </button>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-xs font-mono text-neutral-500 hidden sm:inline">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-neutral-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="progress">Bonding % Completed</option>
            <option value="marketCap">Market Cap</option>
            <option value="volume">24h Volume</option>
            <option value="newest">Creation Time (Newest)</option>
          </select>
        </div>
      </div>

      {/* Grid of Tokens */}
      {filteredAndSortedTokens.length === 0 ? (
        <div className="w-full glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 border border-white/5">
          <SlidersHorizontal className="w-8 h-8 text-neutral-600" />
          <h4 className="text-base font-mono font-bold text-neutral-300">No matching tokens found</h4>
          <p className="text-xs text-neutral-500 font-mono">
            Try adjusting your search query or switch view tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedTokens.map((token) => (
            <TokenCard
              key={token.address}
              token={token}
              isSelected={selectedToken?.address === token.address}
              onSelect={onSelectToken}
            />
          ))}
        </div>
      )}
    </div>
  );
}
