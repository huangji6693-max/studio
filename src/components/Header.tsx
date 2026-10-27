import React, { useState } from 'react';
import { NetworkConfig, NetworkType, AccountInfo } from '../types';
import { NETWORKS, fundAccountWithFriendbot } from '../services/stellar';
import { Globe, Coins, ShieldCheck, RefreshCw, Key, Plus, ExternalLink, Zap } from 'lucide-react';

interface HeaderProps {
  currentNetwork: NetworkConfig;
  onSelectNetwork: (net: NetworkConfig) => void;
  accounts: AccountInfo[];
  activeAccount: AccountInfo;
  onSelectAccount: (acc: AccountInfo) => void;
  onAddAccount: () => void;
  accountBalance: string;
  onRefreshBalance: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentNetwork,
  onSelectNetwork,
  accounts,
  activeAccount,
  onSelectAccount,
  onAddAccount,
  accountBalance,
  onRefreshBalance,
}) => {
  const [funding, setFunding] = useState(false);
  const [fundingNotice, setFundingNotice] = useState<string | null>(null);

  const dispatchAccountSwitchToFrames = (acc: AccountInfo) => {
    const payload = {
      type: 'SOROCREW_ACCOUNT_CHANGED' as const,
      publicKey: acc.publicKey,
      accountName: acc.name,
      timestamp: Date.now(),
    };

    window.dispatchEvent(new CustomEvent('sorocrew:account-switch', { detail: payload }));

    const frames = document.querySelectorAll<HTMLIFrameElement>('iframe');
    frames.forEach((frame) => {
      try {
        frame.contentWindow?.postMessage(payload, '*');
      } catch {
        // Ignore cross-origin frame access errors if any
      }
    });
  };

  const handleAccountSelect = (acc: AccountInfo) => {
    onSelectAccount(acc);
    dispatchAccountSwitchToFrames(acc);
  };

  const handleFund = async () => {
    setFunding(true);
    setFundingNotice(null);
    const res = await fundAccountWithFriendbot(currentNetwork, activeAccount.publicKey);
    setFunding(false);
    setFundingNotice(res.message);
    if (res.success) {
      setTimeout(() => onRefreshBalance(), 1000);
    }
  };

  return (
    <header className="border-b-4 border-black bg-white px-4 py-3 shadow-[0_4px_0_0_#000000] sticky top-0 z-50">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand Logo & Title (Neo-Brutalist Black Ops One) */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white font-['Black_Ops_One'] text-2xl px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_#000000] rounded">
            CREW
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-['Black_Ops_One'] text-lg tracking-wider text-black">STUDIO</span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Soroban Dev Environment</span>
          </div>
        </div>

        {/* Universal Network Toggler Header Widget */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_#000000]">
          <div className="flex items-center gap-1 px-2 py-1 text-xs font-mono font-black text-black uppercase">
            <Globe className="w-4 h-4 text-blue-600 animate-pulse" />
            <span className="hidden md:inline">Network:</span>
          </div>

          {(['local', 'testnet', 'futurenet', 'mainnet'] as NetworkType[]).map((netId) => {
            const net = NETWORKS[netId];
            const isActive = currentNetwork.id === netId;
            return (
              <button
                key={netId}
                onClick={() => onSelectNetwork(net)}
                className={`px-3 py-1 text-xs font-black rounded-md border-2 border-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-[2px_2px_0px_0px_#000000] translate-x-[-1px] translate-y-[-1px]'
                    : 'bg-white text-black hover:bg-slate-200 shadow-none'
                }`}
              >
                {net.isLocal ? 'LOCAL' : net.name.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Account Switcher & 1-Click Friendbot Faucet */}
        <div className="flex items-center gap-2">
          {/* Active Account Dropdown */}
          <div className="flex items-center gap-2 bg-white border-2 border-black rounded-lg px-2.5 py-1 shadow-[3px_3px_0px_0px_#000000]">
            <Key className="w-4 h-4 text-blue-600" />
            <select
              value={activeAccount.publicKey}
              aria-label="Select active Stellar account"
              onChange={(e) => {
                const acc = accounts.find((a) => a.publicKey === e.target.value);
                if (acc) handleAccountSelect(acc);
              }}
              className="bg-transparent text-xs font-mono font-extrabold text-black focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[180px] truncate"
            >
              {accounts.map((acc) => (
                <option key={acc.publicKey} value={acc.publicKey}>
                  {acc.name} ({acc.publicKey.slice(0, 5)}...)
                </option>
              ))}
            </select>
            
            <button
              onClick={onAddAccount}
              title="Generate New Test Keypair"
              className="p-1 hover:bg-blue-100 rounded border border-black transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-black" />
            </button>
          </div>

          {/* Account Balance & Refresh */}
          <div className="hidden lg:flex items-center gap-1.5 bg-yellow-300 border-2 border-black px-2.5 py-1 rounded-lg text-xs font-mono font-black shadow-[2px_2px_0px_0px_#000000]">
            <Coins className="w-3.5 h-3.5 text-black" />
            <span>{accountBalance}</span>
            <button onClick={onRefreshBalance} className="hover:rotate-180 transition-transform p-0.5">
              <RefreshCw className="w-3 h-3 text-black" />
            </button>
          </div>

          {/* 1-Click Friendbot Faucet Button */}
          {currentNetwork.friendbotUrl && (
            <button
              onClick={handleFund}
              disabled={funding}
              className="neo-btn-blue text-xs py-1.5 px-3"
              title={`Fund ${activeAccount.name} with 10,000 test XLM`}
            >
              <Zap className={`w-3.5 h-3.5 ${funding ? 'animate-spin' : ''}`} />
              <span>{funding ? 'Funding...' : 'Fund XLM'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Funding Notification Banner if triggered */}
      {fundingNotice && (
        <div className="mt-2 text-xs font-mono font-bold p-1.5 bg-blue-100 border-2 border-black rounded flex items-center justify-between">
          <span>{fundingNotice}</span>
          <button onClick={() => setFundingNotice(null)} className="text-black font-black hover:underline">✕ Dismiss</button>
        </div>
      )}
    </header>
  );
};
