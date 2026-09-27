import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertOctagon,
  Globe,
  ExternalLink,
  DollarSign,
  Calendar,
  Tag,
  Power,
  Edit3,
  CreditCard,
  GitCommit,
  FileText,
  Plus,
  Trash2,
  Check,
  XCircle,
  PlusCircle,
  Send,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  Client,
  Release,
  ReleaseCreateInput,
  ClientNote,
  ClientNoteCreateInput,
  Payment,
  PaymentCreateInput,
} from '../types';

interface ClientDetailPageProps {
  client: Client;
  onBack: () => void;
  onEditClient: (client: Client) => void;
  onToggleStatus: (clientId: string) => void;
  isToggling: boolean;
  onRefreshClient: () => void;
}

type TabType = 'payments' | 'releases' | 'notes';

export const ClientDetailPage: React.FC<ClientDetailPageProps> = ({
  client,
  onBack,
  onEditClient,
  onToggleStatus,
  isToggling,
  onRefreshClient,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('payments');

  // Payments State
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(
    client.billing?.recurring_amount?.toString() || '0'
  );
  const [paymentDueDate, setPaymentDueDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid'>('unpaid');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Releases State
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoadingReleases, setIsLoadingReleases] = useState(false);
  const [isAddingRelease, setIsAddingRelease] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [newReleaseDate, setNewReleaseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [newReleaseCost, setNewReleaseCost] = useState('0');
  const [changelogItems, setChangelogItems] = useState<string[]>(['']);
  const [releaseSubmitting, setReleaseSubmitting] = useState(false);
  const [releaseError, setReleaseError] = useState('');

  // Notes State
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteError, setNoteError] = useState('');

  // Load Payments
  const loadPayments = useCallback(async () => {
    setIsLoadingPayments(true);
    try {
      if (window.api?.getClientPayments) {
        const data = await window.api.getClientPayments(client.client_id);
        setPayments(data || []);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setIsLoadingPayments(false);
    }
  }, [client.client_id]);

  // Load Releases
  const loadReleases = useCallback(async () => {
    setIsLoadingReleases(true);
    try {
      if (window.api?.getClientReleases) {
        const data = await window.api.getClientReleases(client.client_id);
        setReleases(data || []);
      }
    } catch (err) {
      console.error('Failed to load releases:', err);
    } finally {
      setIsLoadingReleases(false);
    }
  }, [client.client_id]);

  // Load Notes
  const loadNotes = useCallback(async () => {
    setIsLoadingNotes(true);
    try {
      if (window.api?.getClientNotes) {
        const data = await window.api.getClientNotes(client.client_id);
        setNotes(data || []);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setIsLoadingNotes(false);
    }
  }, [client.client_id]);

  useEffect(() => {
    loadPayments();
    loadReleases();
    loadNotes();
  }, [loadPayments, loadReleases, loadNotes]);

  // Calculate total release costs
  const totalReleaseCosts = useMemo(() => {
    return releases.reduce((sum, r) => sum + (r.cost || 0), 0);
  }, [releases]);

  // Payment Handlers
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Please enter a valid payment amount greater than zero.');
      return;
    }

    setPaymentSubmitting(true);
    try {
      if (window.api?.createClientPayment) {
        const payload: PaymentCreateInput = {
          amount: amt,
          currency: client.billing?.currency || 'USD',
          due_date: paymentDueDate,
          status: paymentStatus,
          paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
          notes: paymentNotes.trim() || undefined,
        };
        await window.api.createClientPayment(client.client_id, payload);
        await loadPayments();
        onRefreshClient();
        setIsAddingPayment(false);
        setPaymentNotes('');
        setPaymentStatus('unpaid');
      }
    } catch (err: any) {
      console.error('Failed to create payment record:', err);
      setPaymentError(err.message || 'Failed to create payment record.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleTogglePaymentStatus = async (payment: Payment) => {
    const isCurrentlyPaid = payment.status.toLowerCase() === 'paid';
    const newStatus = isCurrentlyPaid ? 'unpaid' : 'paid';
    const paidAt = isCurrentlyPaid ? null : new Date().toISOString();

    try {
      if (window.api?.updateClientPayment) {
        await window.api.updateClientPayment(client.client_id, payment.id, {
          status: newStatus,
          paid_at: paidAt,
        });
        await loadPayments();
        onRefreshClient();
      }
    } catch (err) {
      console.error('Failed to toggle payment status:', err);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    try {
      if (window.api?.deleteClientPayment) {
        await window.api.deleteClientPayment(client.client_id, paymentId);
        await loadPayments();
        onRefreshClient();
      }
    } catch (err) {
      console.error('Failed to delete payment:', err);
    }
  };

  // Release Handlers
  const handleAddChangelogBullet = () => {
    setChangelogItems([...changelogItems, '']);
  };

  const handleUpdateChangelogBullet = (index: number, value: string) => {
    const updated = [...changelogItems];
    updated[index] = value;
    setChangelogItems(updated);
  };

  const handleRemoveChangelogBullet = (index: number) => {
    if (changelogItems.length <= 1) {
      setChangelogItems(['']);
      return;
    }
    setChangelogItems(changelogItems.filter((_, i) => i !== index));
  };

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    setReleaseError('');

    if (!newVersion.trim()) {
      setReleaseError('Version identifier is required (e.g. v2.1.0)');
      return;
    }

    const filteredBullets = changelogItems
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const costNum = parseFloat(newReleaseCost) || 0;

    const payload: ReleaseCreateInput = {
      version: newVersion.trim(),
      release_date: newReleaseDate,
      changelog: filteredBullets,
      cost: costNum,
    };

    setReleaseSubmitting(true);
    try {
      if (window.api?.createRelease) {
        await window.api.createRelease(client.client_id, payload);
        await loadReleases();
        setIsAddingRelease(false);
        setNewVersion('');
        setNewReleaseCost('0');
        setChangelogItems(['']);
        onRefreshClient();
      }
    } catch (err: any) {
      console.error('Failed to publish release:', err);
      setReleaseError(err.message || 'Failed to publish release.');
    } finally {
      setReleaseSubmitting(false);
    }
  };

  const handleDeleteRelease = async (releaseId?: number) => {
    if (!releaseId) return;
    if (!confirm('Are you sure you want to delete this release record?')) return;
    try {
      if (window.api?.deleteRelease) {
        await window.api.deleteRelease(client.client_id, releaseId);
        await loadReleases();
        onRefreshClient();
      }
    } catch (err) {
      console.error('Failed to delete release:', err);
    }
  };

  // Note Handlers
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoteError('');
    if (!noteContent.trim()) {
      setNoteError('Note content cannot be empty.');
      return;
    }

    setNoteSubmitting(true);
    try {
      if (window.api?.createClientNote) {
        const payload: ClientNoteCreateInput = {
          title: noteTitle.trim() || undefined,
          content: noteContent.trim(),
        };
        await window.api.createClientNote(client.client_id, payload);
        await loadNotes();
        setNoteTitle('');
        setNoteContent('');
      }
    } catch (err: any) {
      console.error('Failed to save note:', err);
      setNoteError(err.message || 'Failed to save note.');
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      if (window.api?.deleteClientNote) {
        await window.api.deleteClientNote(client.client_id, noteId);
        await loadNotes();
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const isOnline = client.status?.is_online;
  const isOverdue =
    client.billing?.status?.toLowerCase() === 'overdue' ||
    (client.billing?.total_due || 0) > 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Navigation & Client Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Roster</span>
          </button>

          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-white tracking-tight">{client.name}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
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
              </span>
            </div>

            <div className="mt-1 flex items-center space-x-2 text-xs text-slate-400">
              <Globe className="h-3.5 w-3.5 text-slate-500" />
              <a
                href={client.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 hover:underline flex items-center"
              >
                <span>{client.project_url}</span>
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onToggleStatus(client.client_id)}
            disabled={isToggling}
            title={isOnline ? "Simulate offline state" : "Restore online state"}
            className={`flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              isOnline
                ? 'border-rose-900/60 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40'
                : 'border-emerald-900/60 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/40'
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            <span>{isOnline ? 'Test Offline Alert' : 'Set Online'}</span>
          </button>

          <button
            onClick={() => onEditClient(client)}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            <Edit3 className="h-3.5 w-3.5 text-slate-400" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* KPI / Tech Business Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Retainer Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-850/80 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center">
              <DollarSign className="mr-1 h-3.5 w-3.5 text-emerald-400" />
              Monthly Retainer
            </span>
            <span className="text-[10px] rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400 font-mono">
              Recurring
            </span>
          </div>
          <div className="text-xl font-bold text-white">
            ${(client.billing?.recurring_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            <span className="text-xs font-normal text-slate-400 ml-1">/month</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 flex items-center">
            <Calendar className="mr-1 h-3 w-3 text-slate-500" />
            Due on Day {client.billing?.payment_due_day || 1} of each month
          </p>
        </div>

        {/* Outstanding Balance */}
        <div className="rounded-xl border border-slate-800 bg-slate-850/80 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center">
              <CreditCard className="mr-1 h-3.5 w-3.5 text-amber-400" />
              Outstanding Balance
            </span>
            <span
              className={`text-[10px] uppercase font-bold rounded px-1.5 py-0.5 ${
                isOverdue
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {client.billing?.status}
            </span>
          </div>
          <div
            className={`text-xl font-bold ${
              isOverdue ? 'text-amber-400' : 'text-slate-100'
            }`}
          >
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: client.billing?.currency || 'USD',
            }).format(client.billing?.total_due || 0)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {isOverdue ? 'Payment overdue / pending reconciliation' : 'Current account settled'}
          </p>
        </div>

        {/* Total Release Costs */}
        <div className="rounded-xl border border-slate-800 bg-slate-850/80 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center">
              <Sparkles className="mr-1 h-3.5 w-3.5 text-purple-400" />
              Total Release Costs
            </span>
            <span className="text-[10px] text-slate-400">
              {releases.length} {releases.length === 1 ? 'build' : 'builds'}
            </span>
          </div>
          <div className="text-xl font-bold text-white">
            ${totalReleaseCosts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Cumulative development & deployment expenses
          </p>
        </div>

        {/* Active Software Version */}
        <div className="rounded-xl border border-slate-800 bg-slate-850/80 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center">
              <Tag className="mr-1 h-3.5 w-3.5 text-emerald-400" />
              Active Version
            </span>
            <span className="text-[10px] text-slate-400">
              Updated {client.software?.last_update || 'N/A'}
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {client.software?.current_version || 'v1.0.0'}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Tracked production build release
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === 'payments'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Payments & Invoices</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
            {payments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('releases')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === 'releases'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCommit className="h-4 w-4" />
          <span>Releases & Costs</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
            {releases.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === 'notes'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Internal Notes</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
            {notes.length}
          </span>
        </button>
      </div>

      {/* TAB CONTENT: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Payment & Billing Ledger</h3>
              <p className="text-xs text-slate-400">
                Track client recurring dues, invoice payments, and cycle settlement statuses.
              </p>
            </div>

            <button
              onClick={() => setIsAddingPayment(!isAddingPayment)}
              className="flex items-center space-x-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isAddingPayment ? 'Cancel' : 'Record Payment / Invoice'}</span>
            </button>
          </div>

          {/* Add Payment Form */}
          {isAddingPayment && (
            <form
              onSubmit={handleCreatePayment}
              className="rounded-xl border border-emerald-500/30 bg-slate-850 p-4 space-y-4 shadow-lg"
            >
              <h4 className="text-xs font-bold text-white flex items-center">
                <PlusCircle className="mr-1.5 h-4 w-4 text-emerald-400" />
                Record New Payment or Retainer Cycle
              </h4>

              {paymentError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-2.5 text-xs text-rose-300">
                  {paymentError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="e.g. 1500.00"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDueDate}
                    onChange={(e) => setPaymentDueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as 'unpaid' | 'paid')}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="unpaid">Unpaid / Invoiced</option>
                    <option value="paid">Paid & Settled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Notes / Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly maintenance retainer, wire ref #29841"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsAddingPayment(false)}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{paymentSubmitting ? 'Recording...' : 'Save Payment'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Payments Table */}
          {isLoadingPayments ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
              No payments or invoices recorded yet for this client. Click "Record Payment / Invoice" above.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-850/50">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold">
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Settled At</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payments.map((p) => {
                    const isPaid = p.status.toLowerCase() === 'paid';
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-medium text-slate-200">
                          {p.due_date}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          ${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                          <span className="text-[10px] font-normal text-slate-400">{p.currency}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              isPaid
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <Check className="mr-1 h-3 w-3" />
                                PAID
                              </>
                            ) : (
                              <>
                                <Clock className="mr-1 h-3 w-3" />
                                UNPAID
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                          {p.notes || <span className="text-slate-500 italic">No notes</span>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleTogglePaymentStatus(p)}
                              className={`flex items-center space-x-1 rounded px-2.5 py-1 text-[11px] font-medium transition ${
                                isPaid
                                  ? 'bg-slate-800 text-slate-300 hover:bg-amber-950/40 hover:text-amber-300'
                                  : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'
                              }`}
                            >
                              {isPaid ? (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Mark Unpaid
                                </>
                              ) : (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Mark Paid
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleDeletePayment(p.id)}
                              title="Delete record"
                              className="rounded p-1 text-slate-500 hover:text-rose-400 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: RELEASES & COSTS */}
      {activeTab === 'releases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Releases & Financial Costs</h3>
              <p className="text-xs text-slate-400">
                Track software build tags, release dates, changelog features, and financial development costs.
              </p>
            </div>

            <button
              onClick={() => setIsAddingRelease(!isAddingRelease)}
              className="flex items-center space-x-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isAddingRelease ? 'Cancel' : 'Publish Version'}</span>
            </button>
          </div>

          {/* Add Release Form */}
          {isAddingRelease && (
            <form
              onSubmit={handleCreateRelease}
              className="rounded-xl border border-emerald-500/30 bg-slate-850 p-4 space-y-3 shadow-lg"
            >
              <h4 className="text-xs font-bold text-white flex items-center">
                <PlusCircle className="mr-1.5 h-4 w-4 text-emerald-400" />
                Publish Software Release & Log Build Cost
              </h4>

              {releaseError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-2 text-xs text-rose-300">
                  {releaseError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Version Tag *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. v2.5.0"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Release Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newReleaseDate}
                    onChange={(e) => setNewReleaseDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Build / Development Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newReleaseCost}
                    onChange={(e) => setNewReleaseCost(e.target.value)}
                    placeholder="e.g. 1200.00"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Changelog Bullets */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Changelog / Deliverable Notes
                </label>
                <div className="space-y-2">
                  {changelogItems.map((bullet, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder={`Feature / deliverable / fix #${idx + 1}...`}
                        value={bullet}
                        onChange={(e) => handleUpdateChangelogBullet(idx, e.target.value)}
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveChangelogBullet(idx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddChangelogBullet}
                  className="mt-2 text-[11px] text-emerald-400 hover:underline flex items-center"
                >
                  <Plus className="mr-1 h-3 w-3" /> Add another changelog item
                </button>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingRelease(false)}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={releaseSubmitting}
                  className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{releaseSubmitting ? 'Publishing...' : 'Publish Version'}</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Releases */}
          {isLoadingReleases ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : releases.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
              No software releases published for this client yet. Click "Publish Version" above.
            </div>
          ) : (
            <div className="space-y-4">
              {releases.map((rel) => (
                <div
                  key={rel.id ?? rel.version}
                  className="rounded-xl border border-slate-800 bg-slate-850/60 p-4 transition hover:border-slate-700 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1.5">
                        <Tag className="h-4 w-4 text-emerald-400" />
                        <span className="font-mono text-sm font-bold text-white">
                          {rel.version}
                        </span>
                      </div>

                      {/* Cost Badge */}
                      <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-300 border border-purple-500/20">
                        <DollarSign className="h-3 w-3 mr-0.5" />
                        Cost: ${(rel.cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>{rel.release_date}</span>
                      </div>
                      {rel.id && (
                        <button
                          onClick={() => handleDeleteRelease(rel.id)}
                          title="Delete this release"
                          className="rounded p-1 text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {rel.changelog && rel.changelog.length > 0 ? (
                      rel.changelog.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start">
                          <span className="mr-2 text-emerald-400">•</span>
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 italic">No notes logged for this release.</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: INTERNAL NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Client Notes & Activity Log</h3>
            <p className="text-xs text-slate-400">
              Keep track of internal meeting records, infrastructure decisions, credentials references, and commercial follow-ups.
            </p>
          </div>

          {/* New Note Form */}
          <form
            onSubmit={handleCreateNote}
            className="rounded-xl border border-slate-800 bg-slate-850 p-4 space-y-3 shadow-lg"
          >
            {noteError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-2 text-xs text-rose-300">
                {noteError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Note Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Q1 Infrastructure Review or Meeting with Tech Lead"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Content *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Add notes, requirements, decisions, or follow-ups for this client..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-y"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={noteSubmitting}
                className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{noteSubmitting ? 'Saving Note...' : 'Add Note'}</span>
              </button>
            </div>
          </form>

          {/* Notes History */}
          {isLoadingNotes ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : notes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
              No notes logged for this client yet. Use the form above to add your first note.
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border border-slate-800 bg-slate-850/60 p-4 transition hover:border-slate-700"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs font-bold text-white">
                        {note.title || 'General Note'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      <span>{new Date(note.created_at).toLocaleString()}</span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        title="Delete note"
                        className="rounded p-1 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Clients Roster</span>
            </button>

            <span className="text-xs text-slate-500">
              Tip: Press <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 border border-slate-700">Esc</kbd> anytime to return to roster
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
