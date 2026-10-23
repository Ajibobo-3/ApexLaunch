"use client";

import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { formatEther } from "viem";
import { Wallet, LogOut, ChevronDown, Rocket, ExternalLink, Search, Sparkles, ShieldCheck } from "lucide-react";
import { formatAddress } from "@/lib/utils";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenLaunchModal: () => void;
}

export function Header({ searchQuery, onSearchChange, onOpenLaunchModal }: HeaderProps) {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({ address });

  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 px-4 sm:px-8 py-4 flex items-center justify-between gap-4 backdrop-blur-xl">
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-emerald via-accent-emerald-light to-accent-emerald-dark p-0.5 shadow-glow-emerald group-hover:scale-105 transition-all duration-300">
            <div className="w-full h-full bg-gradient-to-br from-surface-elevated to-surface rounded-[14px] flex items-center justify-center">
              <span className="font-mono font-black text-accent-emerald-light text-xl tracking-tighter animate-pulse-glow">
                ▲
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white gradient-text">
                APEX<span className="text-accent-emerald-light">LAUNCH</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald-light shadow-glow-emerald">
                V2.4
              </span>
            </div>
            <p className="text-[10px] font-mono text-foreground-muted hidden sm:block tracking-wide">
              Premium Decentralized Bonding Curve Engine
            </p>
          </div>
        </a>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md relative hidden md:block">
        <Search className="w-4 h-4 text-foreground-muted absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by token name, ticker, or 0x address..."
          className="w-full bg-surface/50 hover:bg-surface/70 focus:bg-surface-elevated border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-mono text-white placeholder-foreground-subtle focus:outline-none focus:border-accent-emerald/50 focus:shadow-glow-emerald transition-all duration-300"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Network Badge */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface/50 border border-white/10 text-xs font-mono text-foreground-muted shadow-premium">
          <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse shadow-glow-emerald" />
          <span className="text-foreground">{chain?.name || "Sepolia Testnet"}</span>
        </div>

        {/* Testnet Faucet Link */}
        <a
          href="https://sepoliafaucet.com"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface/30 hover:bg-surface/50 border border-white/10 text-xs font-mono text-foreground-muted hover:text-foreground transition-all duration-300 border-premium-hover"
        >
          <span>Faucet</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Launch Token Primary Action */}
        <button
          onClick={onOpenLaunchModal}
          className="px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-accent-emerald via-accent-emerald-light to-accent-emerald-dark text-black font-mono font-bold text-xs tracking-wide flex items-center gap-2 hover:shadow-glow-emerald transition-all duration-300 cursor-pointer transform hover:scale-105"
        >
          <Rocket className="w-4 h-4" />
          <span>Launch Token</span>
        </button>

        {/* Wallet Connect Button */}
        {isConnected ? (
          <div className="relative">
            <button
              onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-surface-elevated border border-accent-emerald/30 text-xs font-mono text-accent-emerald-light hover:border-accent-emerald/60 transition-all shadow-glow-emerald cursor-pointer transform hover:scale-105 duration-300"
            >
              <div className="w-2 h-2 rounded-full bg-accent-emerald shadow-glow-emerald" />
              <span className="font-bold">{formatAddress(address)}</span>
              {balanceData && (
                <span className="text-foreground-muted hidden sm:inline">
                  ({parseFloat(formatEther(balanceData.value)).toFixed(3)} {balanceData.symbol})
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-foreground-muted" />
            </button>

            {walletDropdownOpen && (
              <div className="absolute right-0 mt-3 w-52 bg-surface-elevated border border-white/10 rounded-2xl p-2 shadow-premium-lg z-50 flex flex-col gap-1 backdrop-blur-xl">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-[10px] font-mono text-foreground-subtle">CONNECTED AS</p>
                  <p className="text-xs font-mono text-white truncate">{address}</p>
                </div>
                <button
                  onClick={() => {
                    disconnect();
                    setWalletDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono text-accent-rose hover:bg-accent-rose/10 transition-colors w-full text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => {
              const connector = connectors[0];
              if (connector) connect({ connector });
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface-elevated hover:bg-surface border border-white/15 text-xs font-mono text-white font-medium hover:border-white/30 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-premium"
          >
            <Wallet className="w-4 h-4 text-accent-emerald" />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
}
