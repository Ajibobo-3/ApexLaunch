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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 p-0.5 shadow-[0_0_20px_rgba(16,185,129,0.35)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all">
            <div className="w-full h-full bg-[#07070a] rounded-[10px] flex items-center justify-center">
              <span className="font-mono font-black text-emerald-400 text-lg tracking-tighter">
                ▲
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-wider text-white">
                APEX<span className="text-emerald-400">LAUNCH</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                V2.4
              </span>
            </div>
            <p className="text-[10px] font-mono text-neutral-400 hidden sm:block">
              Decentralized Bonding Curve Engine
            </p>
          </div>
        </a>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md relative hidden md:block">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by token name, ticker, or 0x address..."
          className="w-full bg-white/[0.03] hover:bg-white/[0.05] focus:bg-neutral-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Network Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{chain?.name || "Sepolia Testnet"}</span>
        </div>

        {/* Testnet Faucet Link */}
        <a
          href="https://sepoliafaucet.com"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 text-xs font-mono text-neutral-400 hover:text-white transition-all"
        >
          <span>Faucet</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {/* Launch Token Primary Action */}
        <button
          onClick={onOpenLaunchModal}
          className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-mono font-bold text-xs tracking-wide flex items-center gap-1.5 hover:opacity-90 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>Launch Token</span>
        </button>

        {/* Wallet Connect Button */}
        {isConnected ? (
          <div className="relative">
            <button
              onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-emerald-500/30 text-xs font-mono text-emerald-400 hover:border-emerald-500/60 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold">{formatAddress(address)}</span>
              {balanceData && (
                <span className="text-neutral-400 hidden sm:inline">
                  ({parseFloat(formatEther(balanceData.value)).toFixed(3)} {balanceData.symbol})
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {walletDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0b0b10] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1">
                <div className="px-3 py-2 border-b border-white/5">
                  <p className="text-[10px] font-mono text-neutral-500">CONNECTED AS</p>
                  <p className="text-xs font-mono text-white truncate">{address}</p>
                </div>
                <button
                  onClick={() => {
                    disconnect();
                    setWalletDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono text-rose-400 hover:bg-rose-500/10 transition-colors w-full text-left"
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/15 text-xs font-mono text-white font-medium hover:border-white/30 transition-all cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
}
