"use client";

import React from "react";
import { TrendingUp, Rocket, Flame, ShieldCheck, Zap } from "lucide-react";

interface HeroMetricsBarProps {
  totalTokens: number;
}

export function HeroMetricsBar({ totalTokens }: HeroMetricsBarProps) {
  return (
    <div className="w-full glass-card rounded-2xl p-5 border border-white/10 flex flex-col gap-4 relative overflow-hidden">
      {/* Top Banner Tagline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-mono font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              NEXT-GEN LAUNCHPAD
            </span>
            <span className="text-xs font-mono text-neutral-400">
              Zero Pre-mine • Anti-Snipe Decaying Tax • Auto Uniswap Graduation
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
            Fair-Launch Bonding Curve Terminal
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2 text-xs font-mono text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Anti-Snipe: 99% → 0% in 5 Blocks</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>24H VOLUME</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white">
            68.42 <span className="text-xs text-neutral-400">ETH</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-medium">
            +34.2% vs yesterday
          </span>
        </div>

        {/* Metric 2 */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-mono">
            <Rocket className="w-3.5 h-3.5 text-teal-400" />
            <span>TOKENS LAUNCHED</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white">
            {totalTokens} <span className="text-xs text-neutral-400">PAIRS</span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400 font-medium">
            Fixed 1B supply each
          </span>
        </div>

        {/* Metric 3 */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-mono">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>ETH GRADUATED</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-400">
            21.00 <span className="text-xs text-neutral-400">ETH</span>
          </div>
          <span className="text-[10px] font-mono text-amber-300 font-medium">
            5 pools DEX locked
          </span>
        </div>

        {/* Metric 4 */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-mono">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span>LP BURN RATE</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-violet-300">
            100% <span className="text-xs text-neutral-400">PERMANENT</span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400 font-medium">
            Locked to 0xdead
          </span>
        </div>
      </div>
    </div>
  );
}
