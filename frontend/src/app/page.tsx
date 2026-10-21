"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { HeroMetricsBar } from "@/components/layout/HeroMetricsBar";
import { MainTokenGrid } from "@/components/tokens/MainTokenGrid";
import { LiveFeed } from "@/components/terminal/LiveFeed";
import { TokenTerminalView } from "@/components/terminal/TokenTerminalView";
import { CreateTokenModal } from "@/components/modals/CreateTokenModal";
import { useLaunchpad } from "@/hooks/useLaunchpad";
import { LaunchpadToken } from "@/config/contracts";
import { ShieldCheck, Flame, Cpu, ExternalLink, Activity } from "lucide-react";
import { GithubIcon } from "@/components/ui/Icons";

export default function HomePage() {
  const {
    tokens,
    trades,
    selectedToken,
    setSelectedToken,
    addTrade,
    addNewToken,
    totalLaunched,
  } = useLaunchpad();

  const [searchQuery, setSearchQuery] = useState("");
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"explore" | "terminal">("explore");

  const handleSelectToken = (token: LaunchpadToken) => {
    setSelectedToken(token);
    setViewMode("terminal");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectFromLiveFeed = (symbol: string) => {
    const matched = tokens.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase());
    if (matched) {
      setSelectedToken(matched);
      setViewMode("terminal");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleTradeSuccess = (trade: any) => {
    addTrade(trade);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050507] cyber-grid-bg text-[#f4f4f6]">
      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenLaunchModal={() => setIsLaunchModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-8">
        {viewMode === "terminal" && selectedToken ? (
          /* Focused Token Terminal Page View */
          <TokenTerminalView
            token={selectedToken}
            trades={trades}
            onBack={() => setViewMode("explore")}
            onTradeSuccess={handleTradeSuccess}
          />
        ) : (
          /* Explore Launchpad Overview View */
          <>
            {/* Hero Metrics & Protocols Overview */}
            <HeroMetricsBar totalTokens={tokens.length} />

            {/* Main Dual Grid + Live Stream Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Token Grid (3 cols) */}
              <div className="lg:col-span-3">
                <MainTokenGrid
                  tokens={tokens}
                  searchQuery={searchQuery}
                  selectedToken={selectedToken}
                  onSelectToken={handleSelectToken}
                />
              </div>

              {/* Sidebar: Live Terminal Stream Feed */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <LiveFeed
                  trades={trades}
                  onSelectTokenSymbol={handleSelectFromLiveFeed}
                />

                {/* Cyber Architecture Highlights */}
                <div className="glass-card rounded-2xl p-4 border border-white/10 flex flex-col gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-white/5 pb-2">
                    <Cpu className="w-4 h-4" />
                    <span>SMART CONTRACT SPECS</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="text-neutral-400">Solidity:</span>
                    <span className="text-white">^0.8.24 (Foundry)</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="text-neutral-400">Fixed Supply:</span>
                    <span className="text-emerald-400">1,000,000,000</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="text-neutral-400">Threshold:</span>
                    <span className="text-white">4.2 ETH (100% DEX)</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="text-neutral-400">Anti-Snipe:</span>
                    <span className="text-white">99% Block Decay</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="text-neutral-400">Swap Fee:</span>
                    <span className="text-white">1% to Treasury</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Creation Modal */}
      <CreateTokenModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
        onSuccess={(newToken) => {
          addNewToken(newToken);
          setViewMode("terminal");
        }}
      />

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-[#07070a]/80 backdrop-blur-md py-6 px-4 sm:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wider">APEXLAUNCH</span>
            <span>•</span>
            <span>Next-Gen Decentralized Token Launchpad</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>Foundry Contracts</span>
            </a>
            <span>•</span>
            <a
              href="https://sepolia.etherscan.io"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <span>Sepolia Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
