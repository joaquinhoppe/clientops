import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { ClientCard } from './components/ClientCard';
import { ClientDetailPage } from './components/ClientDetailPage';
import { ClientFormModal } from './components/ClientFormModal';
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
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

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
          // Also update selected client if open
          if (selectedClient) {
            const fresh = data.find((c) => c.client_id === selectedClient.client_id);
            if (fresh) setSelectedClient(fresh);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedClient]);

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
            setSelectedClient((current) => {
              if (!current) return null;
              return updatedClients.find((c) => c.client_id === current.client_id) || current;
            });
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

  // Open Create Client modal
  const handleOpenCreateClient = () => {
    setEditingClient(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Client modal
  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsFormModalOpen(true);
  };

  // Delete client
  const handleDeleteClient = async (client: Client) => {
    const confirmed = confirm(
      `Are you sure you want to permanently delete "${client.name}" and all associated releases, notes, and payments?`
    );
    if (!confirmed) return;

    try {
      if (window.api?.deleteClient) {
        await window.api.deleteClient(client.client_id);
        await loadClients();
        if (selectedClient?.client_id === client.client_id) {
          setSelectedClient(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete client:', err);
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
        onOpenCreateClient={handleOpenCreateClient}
        onGoHome={() => setSelectedClient(null)}
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

        {selectedClient ? (
          /* Dedicated Client Page */
          <ClientDetailPage
            client={selectedClient}
            onBack={() => setSelectedClient(null)}
            onEditClient={handleEditClient}
            onToggleStatus={handleToggleStatus}
            isToggling={togglingClientId === selectedClient.client_id}
            onRefreshClient={loadClients}
          />
        ) : (
          /* Dashboard Roster View */
          <>
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
                    onEditClient={handleEditClient}
                    onDeleteClient={handleDeleteClient}
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
                    <h3 className="text-sm font-semibold text-slate-300">No Clients Registered</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Get started by creating your first client deployment.
                    </p>
                    <button
                      onClick={handleOpenCreateClient}
                      className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                    >
                      Create Client
                    </button>
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
          </>
        )}
      </main>

      {/* Create / Edit Client Modal */}
      <ClientFormModal
        isOpen={isFormModalOpen}
        client={editingClient}
        onClose={() => setIsFormModalOpen(false)}
        onSaved={loadClients}
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
