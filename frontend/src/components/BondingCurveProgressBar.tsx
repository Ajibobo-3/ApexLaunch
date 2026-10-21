"use client";

import React from "react";
import { formatEther } from "viem";
import { Sparkles, Flame, CheckCircle2, Lock } from "lucide-react";
import { LaunchpadToken } from "@/config/contracts";

interface BondingCurveProgressBarProps {
  token: LaunchpadToken;
}

export function BondingCurveProgressBar({ token }: BondingCurveProgressBarProps) {
  const currentEth = parseFloat(formatEther(token.ethReserve));
  const targetEth = 4.2;
  const progress = Math.min(100, Math.max(0, token.progressPercent));
  const remainingEth = Math.max(0, targetEth - currentEth);
  const isGraduated = token.graduated || progress >= 100;

  return (
    <div className="w-full glass-card rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden border border-white/10">
      {/* Background Accent Aura */}
      <div
        className={`absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isGraduated ? "bg-amber-500" : "bg-emerald-500"
        }`}
      />

      {/* Header Info */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {isGraduated ? (
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4 animate-bounce" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>
          )}
          <div>
            <h4 className="text-sm font-semibold tracking-wide text-white">
              {isGraduated ? "Graduated to Uniswap DEX" : "Bonding Curve Progress"}
            </h4>
            <p className="text-xs text-neutral-400 font-mono">
              {isGraduated
                ? "Liquidity pool locked & LP burned to 0xdead forever"
                : `${currentEth.toFixed(3)} / ${targetEth} ETH accumulated`}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`text-xl font-bold font-mono tracking-tight ${
              isGraduated ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {progress.toFixed(1)}%
          </span>
          <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono">
            {isGraduated ? "COMPLETE" : "THRESHOLD"}
          </p>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-3.5 bg-neutral-900/90 rounded-full overflow-hidden p-0.5 border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out relative ${
            isGraduated
              ? "bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 glow-gold shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              : "bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 glow-emerald shadow-[0_0_15px_rgba(16,185,129,0.5)]"
          }`}
          style={{ width: `${Math.max(3, progress)}%` }}
        >
          {/* Shimmer sweep line */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Milestone Footer */}
      <div className="flex items-center justify-between text-xs text-neutral-400 font-mono pt-1 border-t border-white/5">
        <span className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-neutral-500" />
          DEX Reserve: <strong className="text-neutral-200">200M (20%)</strong>
        </span>
        {isGraduated ? (
          <span className="text-amber-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            100% LP Burned
          </span>
        ) : (
          <span className="text-neutral-400">
            <strong className="text-emerald-400">{remainingEth.toFixed(3)} ETH</strong> to graduation
          </span>
        )}
      </div>
    </div>
  );
}
