import { useEffect, useState, useCallback } from 'react';
import { getOfflineScans, clearOfflineScans } from './offlineDB';
import axiosClient from './axiosClient';

export const useOfflineSync = (sessionId, onSyncSuccess, onSyncError) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const updatePendingCount = useCallback(async () => {
    if (!sessionId) return;
    const scans = await getOfflineScans(sessionId);
    setPendingCount(scans.length);
  }, [sessionId]);

  const performSync = useCallback(async () => {
    if (!navigator.onLine || !sessionId || syncing) return;
    
    const scans = await getOfflineScans(sessionId);
    if (scans.length === 0) return;

    setSyncing(true);
    try {
      // Map scan với payload của batch upload endpoint
      const payload = scans.map(({ assetId, checkedStatus, notes }) => ({
        assetId,
        checkedStatus,
        notes
      }));

      await axiosClient.post(`/inventory-sessions/${sessionId}/items/batch`, payload);
      await clearOfflineScans(sessionId);
      await updatePendingCount();
      
      if (onSyncSuccess) onSyncSuccess(payload.length);
    } catch (error) {
      console.error('Offline sync failed:', error);
      if (onSyncError) onSyncError(error);
    } finally {
      setSyncing(false);
    }
  }, [sessionId, syncing, onSyncSuccess, onSyncError, updatePendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      performSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sessionId, performSync, updatePendingCount]);

  return { isOnline, syncing, pendingCount, updatePendingCount, performSync };
};
