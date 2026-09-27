import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { ClientCard } from './components/ClientCard';
import { ClientDetailModal } from './components/ClientDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { filterClients } from './utils/filterLogic';
import { Client, HealthFilter, BillingFilter } from './types';
import { AlertCircle, ServerCrash, Inbox } from 'lucide-react';

export default function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [billingFilter, setBillingFilter] = useState<BillingFilter>('all');

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [togglingClientId, setTogglingClientId] = useState<string | null>(null);

  // Load clients
  const loadClients = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (window.api && window.api.getClients) {
        const data = await window.api.getClients();
        if (Array.isArray(data)) {
          setClients(data);
        }
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    loadClients();

    // Listen to background polling updates
    let unsubscribeUpdates = () => {};
    let unsubscribeConnection = () => {};

    if (window.api) {
      if (window.api.onClientsUpdated) {
        unsubscribeUpdates = window.api.onClientsUpdated((updatedClients: Client[]) => {
          if (Array.isArray(updatedClients)) {
            setClients(updatedClients);
          }
        });
      }

      if (window.api.onConnectionStatus) {
        unsubscribeConnection = window.api.onConnectionStatus((status: { isConnected: boolean }) => {
          setIsConnected(status.isConnected);
        });
      }
    }

    return () => {
      unsubscribeUpdates();
      unsubscribeConnection();
    };
  }, [loadClients]);

  // Handle status toggle (testing FR-05)
  const handleToggleStatus = async (clientId: string) => {
    setTogglingClientId(clientId);
    try {
      if (window.api && window.api.toggleStatus) {
        await window.api.toggleStatus(clientId);
        await loadClients();
      }
    } catch (err) {
      console.error('Failed to toggle client status:', err);
    } finally {
      setTogglingClientId(null);
    }
  };

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return filterClients(clients, searchQuery, healthFilter, billingFilter);
  }, [clients, searchQuery, healthFilter, billingFilter]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Navbar
        isConnected={isConnected}
        isRefreshing={isRefreshing}
        onRefresh={loadClients}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Offline Warning Banner (NFR-04 Availability) */}
        {!isConnected && (
          <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-rose-300">
            <div className="flex items-center space-x-3">
              <ServerCrash className="h-5 w-5 text-rose-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Backend Unreachable</p>
                <p className="text-xs text-rose-400/80">
                  Showing last cached status. Check if Docker container or API is running.
                </p>
              </div>
            </div>
            <button
              onClick={loadClients}
              className="rounded-lg bg-rose-900/40 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-900/70 transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Search & Filters (FR-06) */}
        <FilterBar
          clients={clients}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          healthFilter={healthFilter}
          onHealthFilterChange={setHealthFilter}
          billingFilter={billingFilter}
          onBillingFilterChange={setBillingFilter}
        />

        {/* Client Roster Grid (FR-01, FR-02, FR-03, FR-04) */}
        {filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.client_id}
                client={client}
                onSelectClient={setSelectedClient}
                onToggleStatus={handleToggleStatus}
                isToggling={togglingClientId === client.client_id}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/30">
            {clients.length === 0 ? (
              <>
                <Inbox className="h-10 w-10 text-slate-600 mb-3" />
                <h3 className="text-sm font-semibold text-slate-300">No Clients Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Waiting for initial data from backend API. Make sure the backend server is running.
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="h-10 w-10 text-slate-600 mb-3" />
                <h3 className="text-sm font-semibold text-slate-300">No Matching Clients</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting your search query or clearing active filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setHealthFilter('all');
                    setBillingFilter('all');
                  }}
                  className="mt-4 rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  Reset Filters
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {/* Release Notes / Changelog Modal (FR-04) */}
      <ClientDetailModal
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
      />

      {/* Settings Modal (NFR-02) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={loadClients}
      />
    </div>
  );
}
