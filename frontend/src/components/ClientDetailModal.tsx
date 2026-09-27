import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  GitCommit,
  Calendar,
  Tag,
  CheckCircle2,
  AlertOctagon,
  Loader2,
  Plus,
  Trash2,
  Send,
  PlusCircle,
} from 'lucide-react';
import { Client, Release, ReleaseCreateInput } from '../types';

interface ClientDetailModalProps {
  client: Client | null;
  onClose: () => void;
  onClientUpdated?: () => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  onClose,
  onClientUpdated,
}) => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New Release Form state
  const [isAddingRelease, setIsAddingRelease] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [newReleaseDate, setNewReleaseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [changelogItems, setChangelogItems] = useState<string[]>(['']);
  const [isSubmittingRelease, setIsSubmittingRelease] = useState(false);
  const [formError, setFormError] = useState('');

  const loadReleases = useCallback(async (clientId: string) => {
    setIsLoading(true);
    try {
      if (window.api?.getClientReleases) {
        const data = await window.api.getClientReleases(clientId);
        setReleases(data || []);
      }
    } catch (err) {
      console.error('Failed to load releases', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!client) return;
    loadReleases(client.client_id);
    setIsAddingRelease(false);
    setNewVersion('');
    setChangelogItems(['']);
    setFormError('');
  }, [client, loadReleases]);

  if (!client) return null;

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
    setFormError('');

    if (!newVersion.trim()) {
      setFormError('Version number is required (e.g. v2.5.0)');
      return;
    }

    const filteredBullets = changelogItems
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const payload: ReleaseCreateInput = {
      version: newVersion.trim(),
      release_date: newReleaseDate,
      changelog: filteredBullets,
    };

    setIsSubmittingRelease(true);
    try {
      if (window.api?.createRelease) {
        await window.api.createRelease(client.client_id, payload);
        await loadReleases(client.client_id);
        setIsAddingRelease(false);
        setNewVersion('');
        setChangelogItems(['']);
        onClientUpdated?.();
      }
    } catch (err: any) {
      console.error('Failed to create release:', err);
      setFormError(err.message || 'Failed to publish new release.');
    } finally {
      setIsSubmittingRelease(false);
    }
  };

  const handleDeleteRelease = async (releaseId?: number) => {
    if (!releaseId) return;
    if (!confirm('Are you sure you want to delete this release record?')) return;

    try {
      if (window.api?.deleteRelease) {
        await window.api.deleteRelease(client.client_id, releaseId);
        await loadReleases(client.client_id);
        onClientUpdated?.();
      }
    } catch (err) {
      console.error('Failed to delete release:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-850">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">{client.name}</h2>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  client.status.is_online
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-rose-500/15 text-rose-400'
                }`}
              >
                {client.status.is_online ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : (
                  <AlertOctagon className="mr-1 h-3 w-3" />
                )}
                {client.status.is_online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{client.project_url}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Current Software Snapshot */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Current Active Version</span>
              <span className="font-mono text-sm font-semibold text-emerald-400">
                {client.software.current_version}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Last Software Update</span>
              <span className="font-medium text-slate-200">{client.software.last_update}</span>
            </div>
          </div>

          {/* Release History Header with "+ Add New Version" Button */}
          <div className="flex items-center justify-between">
            <h3 className="flex items-center text-sm font-semibold text-slate-200">
              <GitCommit className="mr-2 h-4 w-4 text-emerald-400" />
              Release History & Changelogs
            </h3>

            <button
              onClick={() => setIsAddingRelease(!isAddingRelease)}
              className="flex items-center space-x-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isAddingRelease ? 'Cancel' : 'New Version'}</span>
            </button>
          </div>

          {/* New Version Creation Form */}
          {isAddingRelease && (
            <form
              onSubmit={handleCreateRelease}
              className="rounded-xl border border-emerald-500/30 bg-slate-850/90 p-4 space-y-3"
            >
              <h4 className="text-xs font-bold text-white flex items-center">
                <PlusCircle className="mr-1.5 h-4 w-4 text-emerald-400" />
                Publish Software Version
              </h4>

              {formError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-2 text-xs text-rose-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              {/* Changelog Bullets */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Changelog / Release Notes
                </label>
                <div className="space-y-2">
                  {changelogItems.map((bullet, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder={`Feature / fix #${idx + 1}...`}
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
                  <Plus className="mr-1 h-3 w-3" /> Add another bullet item
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
                  disabled={isSubmittingRelease}
                  className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmittingRelease ? 'Publishing...' : 'Publish Version'}</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Releases */}
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : releases.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
              No past release logs recorded for this client. Click "New Version" above to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {releases.map((rel) => (
                <div
                  key={rel.id ?? rel.version}
                  className="rounded-xl border border-slate-800 bg-slate-850/60 p-4 transition hover:border-slate-700"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-emerald-400" />
                      <span className="font-mono text-sm font-bold text-white">
                        {rel.version}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5" />
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
                          <span className="mr-2 text-emerald-500">•</span>
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 italic">No notes provided for this release.</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-3 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
