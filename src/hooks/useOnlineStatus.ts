import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export interface QueuedRequest {
  id: string;
  endpoint: string;
  method: string;
  payload: any;
  description: string;
  timestamp: string;
}

const QUEUE_STORAGE_KEY = 'jeevancare_offline_queue';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineQueue, setOfflineQueue] = useState<QueuedRequest[]>(() => {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const isSyncingRef = useRef(isSyncing);
  isSyncingRef.current = isSyncing;

  // Sync state changes with localStorage
  const saveQueue = useCallback((queue: QueuedRequest[]) => {
    setOfflineQueue(queue);
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to persist offline queue:', e);
    }
  }, []);

  const enqueueRequest = useCallback((endpoint: string, method: string, payload: any, description: string) => {
    const newItem: QueuedRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      endpoint,
      method,
      payload,
      description,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setOfflineQueue((prev) => {
      const updated = [newItem, ...prev];
      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist offline queue:', e);
      }
      return updated;
    });

    return newItem;
  }, []);

  const clearQueue = useCallback(() => {
    saveQueue([]);
  }, [saveQueue]);

  const syncPendingRequests = useCallback(async () => {
    if (isSyncingRef.current) return;

    let currentQueue: QueuedRequest[] = [];
    setOfflineQueue((prev) => {
      currentQueue = prev;
      return prev;
    });

    if (currentQueue.length === 0) return;

    setIsSyncing(true);
    const remainingQueue: QueuedRequest[] = [];

    for (const item of currentQueue) {
      try {
        const response = await fetch(item.endpoint, {
          method: item.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });

        if (!response.ok) {
          if (response.status >= 500 || response.status === 429) {
            remainingQueue.push(item);
          }
        }
      } catch (error) {
        remainingQueue.push(item);
      }
    }

    saveQueue(remainingQueue);
    setIsSyncing(false);
    setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [saveQueue]);

  const syncPendingRequestsRef = useRef(syncPendingRequests);
  useEffect(() => {
    syncPendingRequestsRef.current = syncPendingRequests;
  }, [syncPendingRequests]);

  // Handle Online / Offline event listeners mounted once
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncPendingRequestsRef.current) {
        syncPendingRequestsRef.current();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration note:', err);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return useMemo(
    () => ({
      isOnline,
      offlineQueue,
      enqueueRequest,
      syncPendingRequests,
      clearQueue,
      isSyncing,
      lastSyncedAt,
    }),
    [
      isOnline,
      offlineQueue,
      enqueueRequest,
      syncPendingRequests,
      clearQueue,
      isSyncing,
      lastSyncedAt,
    ]
  );
}
