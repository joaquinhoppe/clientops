import React, { useEffect, useState } from 'react';
import { X, GitCommit, Calendar, Tag, CheckCircle2, AlertOctagon, Loader2 } from 'lucide-react';
import { Client, Release } from '../types';

interface ClientDetailModalProps {
  client: Client | null;
  onClose: () => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ client, onClose }) => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!client) return;

    let isMounted = true;
    setIsLoading(true);

    if (window.api && window.api.getClientReleases) {
      window.api
        .getClientReleases(client.client_id)
        .then((data) => {
          if (isMounted) {
            setReleases(data || []);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load releases', err);
          if (isMounted) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [client]);

  if (!client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
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

          {/* Release History (FR-04) */}
          <div>
            <h3 className="flex items-center text-sm font-semibold text-slate-200 mb-4">
              <GitCommit className="mr-2 h-4 w-4 text-emerald-400" />
              Release History & Changelogs
            </h3>

            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : releases.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
                No past release logs recorded for this client.
              </div>
            ) : (
              <div className="space-y-4">
                {releases.map((rel, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-850/60 p-4 transition hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-emerald-400" />
                        <span className="font-mono text-sm font-bold text-white">
                          {rel.version}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{rel.release_date}</span>
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
