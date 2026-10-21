"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Radio, ExternalLink, Flame } from "lucide-react";
import { TradeActivity } from "@/lib/mockData";
import { formatTimeAgo } from "@/lib/utils";

interface LiveFeedProps {
  trades: TradeActivity[];
  onSelectTokenSymbol?: (symbol: string) => void;
}

export function LiveFeed({ trades, onSelectTokenSymbol }: LiveFeedProps) {
  return (
    <div className="w-full glass-card rounded-2xl p-4 flex flex-col gap-3 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">
            Live Terminal Stream
          </h3>
        </div>
        <span className="text-[10px] font-mono text-neutral-400">
          REAL-TIME WEBSOCKET FEED
        </span>
      </div>

      {/* Stream List */}
      <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
        {trades.map((item) => {
          const isBuy = item.type === "buy";
          return (
            <div
              key={item.id}
              onClick={() => onSelectTokenSymbol && onSelectTokenSymbol(item.tokenSymbol)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isBuy
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {isBuy ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {item.tokenSymbol}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-semibold ${
                        isBuy ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {item.trader}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-white">
                  {item.ethAmount} ETH
                </div>
                <div className="text-[10px] font-mono text-neutral-400">
                  {formatTimeAgo(item.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
