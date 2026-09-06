import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { syncPendingMutations, getPendingMutations } from '../utils/indexedDb';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    const mutations = await getPendingMutations();
    setPendingCount(mutations.length);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) {
      toast.error('Cannot sync while offline. Reconnect to the internet first.');
      return;
    }

    setIsSyncing(true);
    const toastId = toast.loading('Syncing offline changes with server...');

    try {
      const { synced, failed } = await syncPendingMutations(api);
      await refreshPendingCount();

      if (failed > 0) {
        toast.error(`Sync finished: ${synced} synced, ${failed} failed`, { id: toastId });
      } else if (synced > 0) {
        toast.success(`Successfully synced ${synced} offline action(s)!`, { id: toastId });
      } else {
        toast.success('All data is up to date', { id: toastId });
      }
    } catch (err) {
      toast.error('Sync failed: ' + err.message, { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored! Reconciling server state...');
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast('You are now offline. Changes will queue locally.', {
        icon: '⚠️',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [triggerSync, refreshPendingCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    triggerSync,
  };
};

export default useOfflineSync;
