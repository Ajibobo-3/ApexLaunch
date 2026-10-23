"use client";

import React from "react";
import { TrendingUp, Rocket, Flame, ShieldCheck, Zap } from "lucide-react";

interface HeroMetricsBarProps {
  totalTokens: number;
}

export function HeroMetricsBar({ totalTokens }: HeroMetricsBarProps) {
  return (
    <div className="w-full glass-card rounded-3xl p-6 border border-white/10 flex flex-col gap-5 relative overflow-hidden shadow-premium-lg">
      {/* Top Banner Tagline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald-light text-[11px] font-mono font-semibold flex items-center gap-2 shadow-glow-emerald">
              <span className="w-2 h-2 rounded-full bg-accent-emerald animate-ping" />
              NEXT-GEN LAUNCHPAD
            </span>
            <span className="text-xs font-mono text-foreground-muted tracking-wide">
              Zero Pre-mine • Anti-Snipe Decaying Tax • Auto Uniswap Graduation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2 gradient-text">
            Fair-Launch Bonding Curve Terminal
          </h1>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="px-4 py-2 rounded-2xl bg-surface/50 border border-white/10 flex items-center gap-2.5 text-xs font-mono text-foreground shadow-premium">
            <ShieldCheck className="w-4 h-4 text-accent-emerald" />
            <span>Anti-Snipe: 99% → 0% in 5 Blocks</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-surface/30 border border-white/5 flex flex-col gap-2 hover:bg-surface/50 transition-all duration-300 border-premium-hover">
          <div className="flex items-center gap-2 text-foreground-muted text-xs font-mono">
            <TrendingUp className="w-4 h-4 text-accent-emerald" />
            <span>24H VOLUME</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            68.42 <span className="text-xs text-foreground-muted">ETH</span>
          </div>
          <span className="text-[10px] font-mono text-accent-emerald font-medium">
            +34.2% vs yesterday
          </span>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl bg-surface/30 border border-white/5 flex flex-col gap-2 hover:bg-surface/50 transition-all duration-300 border-premium-hover">
          <div className="flex items-center gap-2 text-foreground-muted text-xs font-mono">
            <Rocket className="w-4 h-4 text-accent-violet" />
            <span>TOKENS LAUNCHED</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {totalTokens} <span className="text-xs text-foreground-muted">PAIRS</span>
          </div>
          <span className="text-[10px] font-mono text-foreground-muted font-medium">
            Fixed 1B supply each
          </span>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl bg-surface/30 border border-white/5 flex flex-col gap-2 hover:bg-surface/50 transition-all duration-300 border-premium-hover">
          <div className="flex items-center gap-2 text-foreground-muted text-xs font-mono">
            <Flame className="w-4 h-4 text-accent-gold" />
            <span>ETH GRADUATED</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-accent-gold gradient-text-gold">
            21.00 <span className="text-xs text-foreground-muted">ETH</span>
          </div>
          <span className="text-[10px] font-mono text-accent-gold-dark font-medium">
            5 pools DEX locked
          </span>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl bg-surface/30 border border-white/5 flex flex-col gap-2 hover:bg-surface/50 transition-all duration-300 border-premium-hover">
          <div className="flex items-center gap-2 text-foreground-muted text-xs font-mono">
            <Zap className="w-4 h-4 text-accent-violet" />
            <span>LP BURN RATE</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-accent-violet-light gradient-text-violet">
            100% <span className="text-xs text-foreground-muted">PERMANENT</span>
          </div>
          <span className="text-[10px] font-mono text-foreground-muted font-medium">
            Locked to 0xdead
          </span>
        </div>
      </div>
    </div>
  );
}
