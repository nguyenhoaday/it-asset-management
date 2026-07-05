import localforage from 'localforage';

localforage.config({
  name: 'itam-offline-db',
  storeName: 'scans'
});

export const saveOfflineScan = async (sessionId, scanData) => {
  const scans = await getOfflineScans(sessionId);
  
  // check quét trùng lặp
  const isDuplicate = scans.some(item => item.assetId === scanData.assetId);
  if (isDuplicate) {
    throw new Error('DUPLICATE_SCAN');
  }
  
  scans.push({
    ...scanData,
    timestamp: new Date().toISOString()
  });
  
  await localforage.setItem(`session_${sessionId}`, scans);
};

export const getOfflineScans = async (sessionId) => {
  const scans = await localforage.getItem(`session_${sessionId}`);
  return scans || [];
};

export const clearOfflineScans = async (sessionId) => {
  await localforage.removeItem(`session_${sessionId}`);
};
