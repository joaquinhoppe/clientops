import React, { useState, useEffect } from 'react';
import { X, Building2, Globe, DollarSign, Tag, CheckCircle2, AlertOctagon, Save } from 'lucide-react';
import { Client, ClientCreateInput, ClientUpdateInput } from '../types';

interface ClientFormModalProps {
  isOpen: boolean;
  client: Client | null; // null = Create mode, object = Edit mode
  onClose: () => void;
  onSaved: () => void;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  client,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [totalDue, setTotalDue] = useState('0');
  const [currency, setCurrency] = useState('USD');
  const [billingStatus, setBillingStatus] = useState('paid');
  const [currentVersion, setCurrentVersion] = useState('v1.0.0');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isEditMode = Boolean(client);

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setProjectUrl(client.project_url || '');
      setIsOnline(client.status?.is_online ?? true);
      setTotalDue(client.billing?.total_due?.toString() || '0');
      setCurrency(client.billing?.currency || 'USD');
      setBillingStatus(client.billing?.status || 'paid');
      setCurrentVersion(client.software?.current_version || 'v1.0.0');
    } else {
      setName('');
      setProjectUrl('');
      setIsOnline(true);
      setTotalDue('0');
      setCurrency('USD');
      setBillingStatus('paid');
      setCurrentVersion('v1.0.0');
    }
    setErrorMessage('');
  }, [client, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSaving(true);

    try {
      if (isEditMode && client) {
        const updatePayload: ClientUpdateInput = {
          name: name.trim(),
          project_url: projectUrl.trim(),
          is_online: isOnline,
          total_due: parseFloat(totalDue) || 0,
          currency: currency.trim().toUpperCase(),
          billing_status: billingStatus.toLowerCase(),
          current_version: currentVersion.trim(),
        };

        if (window.api?.updateClient) {
          await window.api.updateClient(client.client_id, updatePayload);
        }
      } else {
        const createPayload: ClientCreateInput = {
          name: name.trim(),
          project_url: projectUrl.trim(),
          is_online: isOnline,
          total_due: parseFloat(totalDue) || 0,
          currency: currency.trim().toUpperCase(),
          billing_status: billingStatus.toLowerCase(),
          current_version: currentVersion.trim(),
        };

        if (window.api?.createClient) {
          await window.api.createClient(createPayload);
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error saving client:', err);
      setErrorMessage(err.message || 'Failed to save client details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-850">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              {isEditMode ? `Edit Client: ${client?.name}` : 'Register New Client'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Client Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Client / Commercial Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Global Logistics"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Project URL */}
          <div>
            <label className="flex items-center text-xs font-semibold text-slate-300 mb-1">
              <Globe className="mr-1 h-3.5 w-3.5 text-emerald-400" />
              Project / Deployment URL *
            </label>
            <input
              type="url"
              required
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://client-domain.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Status & Version row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Initial Health Status
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOnline(true)}
                  className={`flex flex-1 items-center justify-center space-x-1.5 rounded-lg border py-2 text-xs font-medium transition ${
                    isOnline
                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Online</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOnline(false)}
                  className={`flex flex-1 items-center justify-center space-x-1.5 rounded-lg border py-2 text-xs font-medium transition ${
                    !isOnline
                      ? 'border-rose-500/50 bg-rose-500/20 text-rose-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >
                  <AlertOctagon className="h-3.5 w-3.5" />
                  <span>Offline</span>
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center text-xs font-semibold text-slate-300 mb-1">
                <Tag className="mr-1 h-3.5 w-3.5 text-emerald-400" />
                Current Software Version
              </label>
              <input
                type="text"
                required
                value={currentVersion}
                onChange={(e) => setCurrentVersion(e.target.value)}
                placeholder="v1.0.0"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Billing section */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="flex items-center text-xs font-semibold text-slate-300 mb-1">
                <DollarSign className="mr-1 h-3.5 w-3.5 text-emerald-400" />
                Total Due
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={totalDue}
                onChange={(e) => setTotalDue(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="BRL">BRL (R$)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Billing Status
              </label>
              <select
                value={billingStatus}
                onChange={(e) => setBillingStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Client'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
