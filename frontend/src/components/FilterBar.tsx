import React from 'react';
import { Search, Activity, DollarSign, X } from 'lucide-react';
import { HealthFilter, BillingFilter, Client } from '../types';

interface FilterBarProps {
  clients: Client[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  healthFilter: HealthFilter;
  onHealthFilterChange: (hf: HealthFilter) => void;
  billingFilter: BillingFilter;
  onBillingFilterChange: (bf: BillingFilter) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  clients,
  searchQuery,
  onSearchChange,
  healthFilter,
  onHealthFilterChange,
  billingFilter,
  onBillingFilterChange,
}) => {
  const totalCount = clients.length;
  const onlineCount = clients.filter((c) => c.status.is_online).length;
  const offlineCount = totalCount - onlineCount;
  const overdueCount = clients.filter(
    (c) => c.billing.status.toLowerCase() === 'overdue' || c.billing.total_due > 0
  ).length;

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search Input (FR-06) */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by client name or domain..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-2 pl-10 pr-9 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Health Status Filter (FR-06) */}
        <div className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-800/50 p-1 text-xs">
          <span className="flex items-center pl-2 pr-1 font-medium text-slate-400">
            <Activity className="mr-1 h-3.5 w-3.5" />
            Health:
          </span>
          <button
            onClick={() => onHealthFilterChange('all')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              healthFilter === 'all'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => onHealthFilterChange('online')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              healthFilter === 'online'
                ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Online ({onlineCount})
          </button>
          <button
            onClick={() => onHealthFilterChange('offline')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              healthFilter === 'offline'
                ? 'bg-rose-600/30 text-rose-400 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            Offline ({offlineCount})
          </button>
        </div>

        {/* Financial / Billing Filter (FR-06) */}
        <div className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-800/50 p-1 text-xs">
          <span className="flex items-center pl-2 pr-1 font-medium text-slate-400">
            <DollarSign className="mr-1 h-3.5 w-3.5" />
            Billing:
          </span>
          <button
            onClick={() => onBillingFilterChange('all')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              billingFilter === 'all'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onBillingFilterChange('overdue')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              billingFilter === 'overdue'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            Debtors ({overdueCount})
          </button>
          <button
            onClick={() => onBillingFilterChange('paid')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              billingFilter === 'paid'
                ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Paid Only
          </button>
        </div>
      </div>
    </div>
  );
};
