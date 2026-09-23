import React, { useState } from 'react';
import {
  WifiOff,
  Wifi,
  RefreshCw,
  Trash2,
  List,
  CheckCircle2,
  X,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { QueuedRequest } from '../../hooks/useOnlineStatus';

interface OfflineNetworkBannerProps {
  isOnline: boolean;
  offlineQueue: QueuedRequest[];
  syncPendingRequests: () => Promise<void>;
  clearQueue: () => void;
  isSyncing: boolean;
  lastSyncedAt: string | null;
}

export const OfflineNetworkBanner: React.FC<OfflineNetworkBannerProps> = ({
  isOnline,
  offlineQueue,
  syncPendingRequests,
  clearQueue,
  isSyncing,
  lastSyncedAt,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  const handleSyncClick = async () => {
    await syncPendingRequests();
    setShowSyncSuccess(true);
    setTimeout(() => setShowSyncSuccess(false), 4000);
  };

  if (isOnline && offlineQueue.length === 0 && !showSyncSuccess) {
    return null;
  }

  return (
    <>
      {/* Top Floating Notification Banner */}
      <div className="fixed bottom-4 right-4 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {!isOnline ? (
          <div className="bg-amber-900/90 dark:bg-amber-950/95 backdrop-blur-md border border-amber-600/50 text-amber-100 p-4 rounded-2xl shadow-2xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-800/80 rounded-xl text-amber-200 mt-0.5 shrink-0">
                <WifiOff className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-amber-200">You are Offline</h4>
                  {offlineQueue.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-700 text-amber-100 text-[11px] font-extrabold">
                      {offlineQueue.length} Queued
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Working in offline mode. Medical records and logs will be queued & automatically synced when connection is restored.
                </p>
                {offlineQueue.length > 0 && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-100 underline mt-1"
                  >
                    <List className="w-3.5 h-3.5" /> View Queued Requests ({offlineQueue.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : offlineQueue.length > 0 ? (
          <div className="bg-teal-900/95 dark:bg-teal-950/95 backdrop-blur-md border border-teal-500/50 text-teal-100 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-800/80 rounded-xl text-teal-200 shrink-0">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-teal-200">Back Online!</h4>
                <p className="text-xs text-teal-200/90">
                  {offlineQueue.length} pending update{offlineQueue.length > 1 ? 's' : ''} ready to sync.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSyncClick}
                disabled={isSyncing}
                className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-1.5 text-teal-300 hover:text-white rounded-lg hover:bg-teal-800/50"
                title="View Queue"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : showSyncSuccess ? (
          <div className="bg-emerald-900/95 backdrop-blur-md border border-emerald-500/50 text-emerald-100 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-emerald-200">Sync Complete!</h4>
                <p className="text-xs text-emerald-200/90">
                  All queued offline requests synced successfully{lastSyncedAt ? ` at ${lastSyncedAt}` : ''}.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSyncSuccess(false)}
              className="text-emerald-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Modal to view queued requests */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <List className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Offline Request Queue
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {offlineQueue.length} request{offlineQueue.length > 1 ? 's' : ''} saved locally
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
              {offlineQueue.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No pending requests in offline queue.
                </div>
              ) : (
                offlineQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold uppercase text-[10px]">
                          {item.method || 'POST'}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.description || item.endpoint}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3" /> {item.timestamp}
                        <span>•</span>
                        <span className="font-mono text-[10px] truncate max-w-[200px]">
                          {item.endpoint}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  clearQueue();
                  setIsModalOpen(false);
                }}
                disabled={offlineQueue.length === 0}
                className="px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Queue
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Close
                </button>
                {isOnline && offlineQueue.length > 0 && (
                  <button
                    onClick={async () => {
                      await handleSyncClick();
                      setIsModalOpen(false);
                    }}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sync Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
