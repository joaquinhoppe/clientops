import React, { useState, useEffect } from 'react';
import { X, Save, KeyRound, Globe, Clock, CheckCircle } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [apiKey, setApiKey] = useState('clientops-secret-key-2026');
  const [pollingInterval, setPollingInterval] = useState(30);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  useEffect(() => {
    if (isOpen && window.api?.getSettings) {
      window.api.getSettings().then((settings: AppSettings) => {
        if (settings) {
          setApiUrl(settings.apiUrl || 'http://localhost:8000');
          setApiKey(settings.apiKey || 'clientops-secret-key-2026');
          setPollingInterval(settings.pollingIntervalSeconds || 30);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (window.api?.saveSettings) {
        await window.api.saveSettings({
          apiUrl: apiUrl.trim(),
          apiKey: apiKey.trim(),
          pollingIntervalSeconds: Number(pollingInterval),
        });
        setShowSavedNotification(true);
        setTimeout(() => {
          setShowSavedNotification(false);
          onSaved();
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error('Error saving settings', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-850">
          <h2 className="text-base font-bold text-white">Application Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* API URL */}
          <div>
            <label className="flex items-center text-xs font-semibold text-slate-300 mb-1.5">
              <Globe className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
              Backend API URL
            </label>
            <input
              type="url"
              required
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              The target RESTful API server (FastAPI).
            </p>
          </div>

          {/* API Key (Encrypted via safeStorage) */}
          <div>
            <label className="flex items-center text-xs font-semibold text-slate-300 mb-1.5">
              <KeyRound className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
              API Key (Stored with OS Encryption)
            </label>
            <input
              type="password"
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter secure API key..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Encrypted at rest with Electron safeStorage (NFR-02).
            </p>
          </div>

          {/* Polling Interval */}
          <div>
            <label className="flex items-center text-xs font-semibold text-slate-300 mb-1.5">
              <Clock className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
              Health Polling Interval
            </label>
            <select
              value={pollingInterval}
              onChange={(e) => setPollingInterval(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value={10}>Every 10 seconds (Testing & Fast Alerts)</option>
              <option value={30}>Every 30 seconds (Default)</option>
              <option value={60}>Every 1 minute</option>
              <option value={300}>Every 5 minutes</option>
            </select>
          </div>

          {/* Save Status Notification */}
          {showSavedNotification && (
            <div className="flex items-center justify-center space-x-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 text-xs text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              <span>Settings saved & encrypted successfully!</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
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
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
