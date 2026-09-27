import React from 'react';
import { ExternalLink, CheckCircle2, AlertOctagon, Tag, History, Power } from 'lucide-react';
import { Client } from '../types';

interface ClientCardProps {
  client: Client;
  onSelectClient: (client: Client) => void;
  onToggleStatus: (clientId: string) => void;
  isToggling: boolean;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onSelectClient,
  onToggleStatus,
  isToggling,
}) => {
  const isOnline = client.status.is_online;
  const isOverdue =
    client.billing.status.toLowerCase() === 'overdue' || client.billing.total_due > 0;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 ${
        isOnline
          ? 'border-slate-800 bg-slate-850/80 hover:border-slate-700 hover:shadow-lg hover:shadow-emerald-950/10'
          : 'border-rose-900/50 bg-rose-950/10 hover:border-rose-800'
      }`}
    >
      <div>
        {/* Header: Name and Status Badge (FR-01, FR-02) */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-white group-hover:text-emerald-400 transition">
              {client.name}
            </h3>
            <a
              href={client.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center text-xs text-slate-400 hover:text-slate-200"
            >
              <span className="truncate">{client.project_url.replace(/^https?:\/\//, '')}</span>
              <ExternalLink className="ml-1 h-3 w-3 shrink-0" />
            </a>
          </div>

          <div
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
              isOnline
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse'
            }`}
          >
            {isOnline ? (
              <>
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                ONLINE
              </>
            ) : (
              <>
                <AlertOctagon className="mr-1 h-3.5 w-3.5" />
                OFFLINE
              </>
            )}
          </div>
        </div>

        {/* Financial / Billing Overview (FR-03) */}
        <div className="mt-4 rounded-lg bg-slate-900/70 p-3 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Billing Status</span>
            <span
              className={`rounded px-1.5 py-0.5 font-medium uppercase text-[10px] ${
                isOverdue
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {client.billing.status}
            </span>
          </div>

          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Total Due</span>
            <span
              className={`text-base font-bold ${
                isOverdue ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: client.billing.currency || 'USD',
              }).format(client.billing.total_due)}
            </span>
          </div>
        </div>

        {/* Software Version Info (FR-04) */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center">
            <Tag className="mr-1 h-3.5 w-3.5 text-slate-500" />
            Version:
          </span>
          <span className="font-mono font-medium text-slate-200">
            {client.software.current_version}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex items-center space-x-2 border-t border-slate-800/80 pt-4">
        {/* Toggle Status for Notification Testing */}
        <button
          onClick={() => onToggleStatus(client.client_id)}
          disabled={isToggling}
          title={isOnline ? "Simulate server going offline (triggers OS alert)" : "Bring server back online"}
          className={`flex flex-1 items-center justify-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            isOnline
              ? 'border-rose-900/60 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40'
              : 'border-emerald-900/60 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/40'
          }`}
        >
          <Power className="h-3.5 w-3.5" />
          <span>{isOnline ? 'Test Offline' : 'Set Online'}</span>
        </button>

        {/* View Releases Modal (FR-04) */}
        <button
          onClick={() => onSelectClient(client)}
          className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
        >
          <History className="h-3.5 w-3.5 text-slate-400" />
          <span>Releases</span>
        </button>
      </div>
    </div>
  );
};
