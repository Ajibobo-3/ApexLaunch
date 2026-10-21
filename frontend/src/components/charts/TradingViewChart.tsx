"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, IChartApi, ISeriesApi } from "lightweight-charts";
import { LaunchpadToken } from "@/config/contracts";

interface TradingViewChartProps {
  token: LaunchpadToken;
}

export function TradingViewChart({ token }: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m" | "1h" | "1D">("5m");

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "#07070a" },
        textColor: "#8e8e9f",
        fontSize: 12,
        fontFamily: "var(--font-mono, monospace)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.03)" },
        horzLines: { color: "rgba(255, 255, 255, 0.03)" },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "rgba(16, 185, 129, 0.4)",
          width: 1,
          style: 2,
        },
        horzLine: {
          color: "rgba(16, 185, 129, 0.4)",
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        scaleMargins: {
          top: 0.15,
          bottom: 0.15,
        },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
      width: container.clientWidth,
      height: 380,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    // Generate realistic historical bonding curve candlestick data
    const basePrice = Number(token.currentPrice) / 1e9; // in Gwei
    const initialPrice = 1.0;
    const now = Math.floor(Date.now() / 1000);
    const candleCount = 45;
    const intervalSeconds = timeframe === "1m" ? 60 : timeframe === "5m" ? 300 : timeframe === "15m" ? 900 : 3600;

    const candleData = [];
    let currentOpen = initialPrice;

    for (let i = candleCount; i >= 0; i--) {
      const time = (now - i * intervalSeconds) as any;
      const progressFraction = (candleCount - i) / candleCount;
      const targetMid = initialPrice + (basePrice - initialPrice) * progressFraction;
      const variance = (Math.random() - 0.45) * 0.4;
      
      const open = Math.max(0.8, currentOpen);
      const close = Math.max(0.8, targetMid + variance);
      const high = Math.max(open, close) + Math.random() * 0.25;
      const low = Math.min(open, close) - Math.random() * 0.18;

      candleData.push({
        time,
        open: parseFloat(open.toFixed(4)),
        high: parseFloat(high.toFixed(4)),
        low: parseFloat(low.toFixed(4)),
        close: parseFloat(close.toFixed(4)),
      });

      currentOpen = close;
    }

    candlestickSeries.setData(candleData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [token, timeframe]);

  return (
    <div className="w-full glass-card rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE ORACLE
          </div>
          <span className="text-xs font-mono text-neutral-400">
            Spot Price:{" "}
            <span className="text-white font-semibold">
              {(Number(token.currentPrice) / 1e9).toFixed(4)} Gwei
            </span>
          </span>
          <span className="text-xs font-mono text-emerald-400 font-medium">
            +{(token.progressPercent * 1.8).toFixed(1)}%
          </span>
        </div>

        {/* Timeframe Selectors */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-lg border border-white/5">
          {(["1m", "5m", "15m", "1h", "1D"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all ${
                timeframe === tf
                  ? "bg-white/10 text-white font-semibold shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div ref={chartContainerRef} className="w-full h-[380px] relative rounded-xl overflow-hidden" />
    </div>
  );
}
