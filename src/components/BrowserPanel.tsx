import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, ExternalLink, ShieldCheck, Monitor, Laptop } from 'lucide-react';
import { NetworkConfig, AccountInfo } from '../types';

interface BrowserPanelProps {
  currentNetwork: NetworkConfig;
  activeAccount: AccountInfo;
  initialUrl?: string;
  launchKey?: number;
}

export const BrowserPanel: React.FC<BrowserPanelProps> = ({ currentNetwork, activeAccount, initialUrl, launchKey }) => {
  const [url, setUrl] = useState<string>('http://localhost:3000');
  const [iframeUrl, setIframeUrl] = useState<string>('http://localhost:3000');
  const [key, setKey] = useState<number>(0);
  const [syncConfirmation, setSyncConfirmation] = useState<{
    publicKey: string;
    status: 'synced' | 'acknowledged';
    updatedAt: string;
  } | null>(null);
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

  const postAccountChangeToIframe = React.useCallback((publicKey: string, accountName?: string) => {
    const payload = {
      type: 'SOROCREW_ACCOUNT_CHANGED' as const,
      publicKey,
      accountName,
      timestamp: Date.now(),
    };
    try {
      iframeRef.current?.contentWindow?.postMessage(payload, '*');
    } catch {
      // Cross-origin postMessage is safe, guard in case frame is detaching
    }
    setSyncConfirmation({
      publicKey,
      status: 'synced',
      updatedAt: new Date().toLocaleTimeString(),
    });
  }, []);

  React.useEffect(() => {
    postAccountChangeToIframe(activeAccount.publicKey, activeAccount.name);
  }, [activeAccount.publicKey, activeAccount.name, postAccountChangeToIframe]);

  React.useEffect(() => {
    const handleCustomSwitch = (event: Event) => {
      const customEvt = event as CustomEvent<{ publicKey?: string; accountName?: string }>;
      if (customEvt.detail?.publicKey) {
        postAccountChangeToIframe(customEvt.detail.publicKey, customEvt.detail.accountName);
      }
    };

    const handleFrameMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'SOROCREW_ACCOUNT_CHANGED_ACK' && typeof data.publicKey === 'string') {
        setSyncConfirmation({
          publicKey: data.publicKey,
          status: 'acknowledged',
          updatedAt: new Date().toLocaleTimeString(),
        });
      } else if (data.type === 'SOROCREW_ACCOUNT_CHANGED' && typeof data.publicKey === 'string') {
        setSyncConfirmation({
          publicKey: data.publicKey,
          status: 'synced',
          updatedAt: new Date().toLocaleTimeString(),
        });
      } else if (data.type === 'SOROCREW_GET_ACTIVE_ACCOUNT') {
        postAccountChangeToIframe(activeAccount.publicKey, activeAccount.name);
      }
    };

    window.addEventListener('sorocrew:account-switch', handleCustomSwitch);
    window.addEventListener('message', handleFrameMessage);
    return () => {
      window.removeEventListener('sorocrew:account-switch', handleCustomSwitch);
      window.removeEventListener('message', handleFrameMessage);
    };
  }, [activeAccount.publicKey, activeAccount.name, postAccountChangeToIframe]);

  React.useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
      setIframeUrl(initialUrl);
      setKey((prev) => prev + 1);
    }
  }, [initialUrl, launchKey]);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let target = url.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'http://' + target;
    }
    setIframeUrl(target);
    setKey((prev) => prev + 1);
  };

  const handleReload = () => {
    setKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#000000] overflow-hidden">
      {/* Neo-brutalist Browser URL Bar */}
      <div className="bg-slate-100 border-b-2 border-black p-2.5 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button onClick={handleReload} className="neo-box-sm p-1.5 hover:bg-slate-200 cursor-pointer" title="Reload Tab">
            <RotateCw className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Address Input Bar */}
        <form onSubmit={handleNavigate} className="flex-1 flex items-center">
          <div className="relative w-full">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter dApp URL (e.g. http://localhost:3000)"
              className="neo-input w-full pr-24 font-mono text-xs"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="neo-badge bg-blue-100 text-[10px] text-blue-900 border-black">
                @sorocrew/provider INJECTED
              </span>
            </div>
          </div>
        </form>

        {/* Preset Selector */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              setUrl(e.target.value);
              setIframeUrl(e.target.value);
              setKey((prev) => prev + 1);
            }
          }}
          className="neo-input text-xs font-bold hidden xl:block cursor-pointer"
        >
          <option value="">dApp Presets...</option>
          <option value="http://localhost:3000">http://localhost:3000 (React)</option>
          <option value="http://localhost:5173">http://localhost:5173 (Vite)</option>
          <option value="http://localhost:8000">http://localhost:8000 (Quickstart)</option>
        </select>

        {/* External Tab */}
        <a
          href={iframeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="neo-box-sm p-1.5 hover:bg-slate-200"
          title="Open dApp in External Window"
        >
          <ExternalLink className="w-4 h-4 text-black" />
        </a>
      </div>

      {/* Active Context Banner */}
      <div className="bg-blue-50 border-b-2 border-black px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-bold">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black animate-ping"></span>
          <span>Target Network: <strong className="uppercase text-blue-700">{currentNetwork.name}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="hidden md:inline">
            Active Signer: <span className="font-extrabold text-black">{activeAccount.name} ({activeAccount.publicKey.slice(0, 8)}...)</span>
          </span>
          {syncConfirmation && (
            <span
              data-testid="account-sync-badge"
              className="inline-flex items-center gap-1 bg-emerald-200 text-black border border-black rounded px-1.5 py-0.5 text-[10px] font-black"
              title={`Dispatched SOROCREW_ACCOUNT_CHANGED (${syncConfirmation.publicKey}) at ${syncConfirmation.updatedAt}`}
            >
              <ShieldCheck className="w-3 h-3 text-emerald-800" />
              <span>
                {syncConfirmation.status === 'acknowledged' ? 'Frame ACK' : 'Frame Synced'}: {syncConfirmation.publicKey.slice(0, 6)}...
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Main dApp Window / Iframe Viewer */}
      <div className="flex-1 bg-slate-50 relative overflow-hidden">
        <iframe
          ref={iframeRef}
          key={key}
          src={iframeUrl}
          onLoad={() => postAccountChangeToIframe(activeAccount.publicKey, activeAccount.name)}
          title="Soroban dApp Runner Frame"
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />

        {/* Helpful Overlay Info Box if localhost is loading */}
        <div className="absolute bottom-3 right-3 max-w-sm bg-white border-2 border-black p-3 rounded-lg shadow-[3px_3px_0px_0px_#000000] text-xs font-mono">
          <div className="font-extrabold text-black flex items-center gap-1 mb-1">
            <Monitor className="w-4 h-4 text-blue-600" />
            <span>dApp Testing Tab Active</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-tight">
            Any dApp running in this frame has <code className="bg-slate-100 px-1 border border-black">window.stellar</code> and <code className="bg-slate-100 px-1 border border-black">window.freighter</code> injected automatically.
          </p>
        </div>
      </div>
    </div>
  );
};
