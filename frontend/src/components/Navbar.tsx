import React from 'react';
import { LayoutDashboard, Settings as SettingsIcon, RefreshCw, Wifi, WifiOff, Plus, ArrowLeft } from 'lucide-react';

interface NavbarProps {
  isConnected: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenCreateClient: () => void;
  onGoHome?: () => void;
  selectedClientName?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  isConnected,
  isRefreshing,
  onRefresh,
  onOpenSettings,
  onOpenCreateClient,
  onGoHome,
  selectedClientName,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 backdrop-blur">
      <div className="flex items-center space-x-3 select-none">
        <div
          className="flex items-center space-x-2.5 cursor-pointer group"
          onClick={onGoHome}
          title="Go to Clients Roster (Esc)"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition">
              ClientOps
            </h1>
            <p className="text-xs text-slate-400">Operations & Health Monitor</p>
          </div>
        </div>

        {selectedClientName && (
          <div className="flex items-center space-x-2 pl-3 border-l border-slate-800">
            <button
              onClick={onGoHome}
              className="flex items-center space-x-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition shadow-sm"
              title="Return to the client roster (or press Esc)"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Roster</span>
            </button>
            <span className="text-slate-600 text-sm">/</span>
            <span className="text-xs font-semibold text-slate-300 truncate max-w-xs">{selectedClientName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {/* Backend Connectivity Status */}
        <div
          className={`flex items-center space-x-2 rounded-full px-3 py-1 text-xs font-medium border ${
            isConnected
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {isConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <Wifi className="h-3.5 w-3.5" />
              <span>Backend Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              <span>Backend Offline</span>
            </>
          )}
        </div>

        {/* Add New Client Button */}
        <button
          onClick={onOpenCreateClient}
          title="Register a new web client"
          className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Client</span>
        </button>

        {/* Manual Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh client status now"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Open API & Polling Settings"
          className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
        >
          <SettingsIcon className="h-4 w-4 text-slate-400" />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
};
