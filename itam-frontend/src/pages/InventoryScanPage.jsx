import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QrCode, ArrowLeft, Info, Search, ClipboardCheck, Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';
import useAuth from '../context/useAuth';
import { saveOfflineScan } from '../services/offlineDB';
import { useOfflineSync } from '../services/useOfflineSync';

const InventoryScanPage = () => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Khởi tạo chế độ quét từ URL param: ?mode=lookup => LOOKUP, ngược lại => INVENTORY
  const initialMode = searchParams.get('mode') === 'lookup' ? 'LOOKUP' : 'INVENTORY';
  const [scanMode, setScanMode] = useState(initialMode);
  
  const [scannedAssetId, setScannedAssetId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [manualId, setManualId] = useState('');

  const [assetDetails, setAssetDetails] = useState(null);
  const [fetchingAsset, setFetchingAsset] = useState(false);
  
  const scannerRef = useRef(null);

  const { isOnline, syncing, pendingCount, updatePendingCount, performSync } = useOfflineSync(
    activeSession?.id,
    () => {
      showToast(t('common.syncSuccess'), 'success');
    },
    () => {
      showToast(t('common.syncFailed'), 'error');
    }
  );

  const fetchActiveSession = useCallback(async () => {
    if (initialMode === 'LOOKUP' || user?.role === 'EMPLOYEE') {
      setActiveSession(null);
      setScanMode('LOOKUP');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axiosClient.get('/inventory-sessions/active');
      const data = response.data || response;
      if (data && data.id) {
        setActiveSession(data);
        // Chỉ ghi đè sang INVENTORY nếu URL không chỉ định lookup
        if (initialMode !== 'LOOKUP') {
          setScanMode('INVENTORY');
        }
      } else {
        setActiveSession(null);
        setScanMode('LOOKUP');
      }
    } catch (error) {
      console.error('Error fetching active session:', error);
      setActiveSession(null);
      setScanMode('LOOKUP');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  // Khởi tạo camera quét mã QR
  useEffect(() => {
    if (loading) return;

    if (scannedAssetId) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
        scannerRef.current = null;
      }
      return;
    }

    const readerElement = document.getElementById("reader");
    if (!readerElement) {
      return;
    }
    readerElement.innerHTML = "";

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 260, height: 260 }, rememberLastUsedCamera: true },
      false
    );

    scannerRef.current = scanner;

    scanner.render((decodedText) => {
      setScannedAssetId(decodedText);
    }, () => {
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear scanner on unmount", e));
        scannerRef.current = null;
      }
    };
  }, [scannedAssetId, loading]);

  useEffect(() => {
    if (i18n.language !== 'vi') return;
    const readerEl = document.getElementById("reader");
    if (!readerEl) return;

    const translateScanner = () => {
      const dict = {
        "Request Camera Permissions": "Cấp quyền truy cập Camera",
        "Start Scanning": "Bắt đầu quét",
        "Stop Scanning": "Dừng quét camera",
        "Scan an Image File": "Quét từ file ảnh",
        "Scan using camera directly": "Quét trực tiếp từ camera",
        "Select Camera": "Chọn Camera",
        "Or drop an image to scan": "Hoặc thả tệp hình ảnh vào đây",
        "Choose Image": "Chọn file ảnh",
        "No image chosen": "Chưa chọn file"
      };
      readerEl.querySelectorAll("button, a, span, label").forEach(el => {
        const text = el.textContent?.trim();
        if (text && dict[text]) {
          el.textContent = dict[text];
        }
      });
    };

    translateScanner();
    const observer = new MutationObserver(translateScanner);
    observer.observe(readerEl, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [i18n.language, scannedAssetId, loading]);

  useEffect(() => {
    if (scannedAssetId) {
      const fetchAsset = async () => {
        setFetchingAsset(true);
        setAssetDetails(null);
        try {
          // Nếu thiết bị đang offline, bỏ qua gọi API
          if (!navigator.onLine) {
            throw new TypeError('Failed to fetch');
          }

          const res = await axiosClient.get(`/assets/${scannedAssetId}`);
          const data = res.data || res;
          setAssetDetails(data);
        } catch (err) {
          console.error('Failed to fetch asset details:', err);
          if (!navigator.onLine) {
            // Thông tin tạm thời
            setAssetDetails({
              id: scannedAssetId,
              name: t('common.offlineDevice'),
              assetCode: 'N/A',
              serialNumber: 'N/A',
              status: 'AVAILABLE'
            });
            showToast(t('common.offlineMode'), 'warning');
          } else {
            showToast(t('common.unknownError', { defaultValue: 'Không tìm thấy thiết bị hoặc mã không hợp lệ!' }), 'error');
            setScannedAssetId('');
          }
        } finally {
          setFetchingAsset(false);
        }
      };
      fetchAsset();
    } else {
      setAssetDetails(null);
    }
  }, [scannedAssetId, showToast, t]);

  const handleManualSubmit = () => {
    if (manualId.trim()) {
      setScannedAssetId(manualId.trim());
      setManualId('');
    }
  };

  const handleQuickSubmit = async (status) => {
    if (!scannedAssetId || !activeSession) return;

    setSubmitting(true);
    try {
      if (!navigator.onLine) {
        throw new TypeError('Failed to fetch');
      }

      await axiosClient.post(`/inventory-sessions/${activeSession.id}/items`, {
        assetId: scannedAssetId,
        checkedStatus: status,
        notes: notes.trim()
      });
      showToast(t('inventory.scanSuccess'), 'success');
      setScannedAssetId('');
      setNotes('');
    } catch (error) {
      console.error('Error submitting scan:', error);
      // Xử lý ngoại tuyến
      if (!navigator.onLine || error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        try {
          await saveOfflineScan(activeSession.id, {
            assetId: scannedAssetId,
            checkedStatus: status,
            notes: notes.trim()
          });
          showToast(t('common.savedOffline'), 'warning');
          setScannedAssetId('');
          setNotes('');
          if (updatePendingCount) updatePendingCount();
        } catch (localError) {
          if (localError.message === 'DUPLICATE_SCAN') {
            showToast(t('inventory.duplicateScan'), 'warning');
          } else {
            showToast(t('inventory.scanFailed'), 'error');
          }
          setScannedAssetId('');
        }
      } else {
        if (error.response?.data?.code === 'DUPLICATE_SCAN' || error.response?.status === 409) {
          showToast(t('inventory.duplicateScan'), 'warning');
        } else {
          showToast(t('inventory.scanFailed'), 'error');
        }
        setScannedAssetId('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const cancelScan = () => {
    setScannedAssetId('');
    setNotes('');
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-50 dark:bg-slate-900/50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 sm:p-6">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full min-h-0">
        
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col h-full min-h-0 shadow-sm overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between gap-4 py-3 px-4 sm:px-6 bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  {scanMode === 'LOOKUP' ? t('inventory.scanLookupTitle') : t('inventory.scanTitle')}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                  {scanMode === 'INVENTORY' && activeSession ? activeSession.title : t('inventory.scanLookupSubtitle')}
                </p>
              </div>
            </div>

            {/* Online/Offline */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-950">
                  <Wifi className="w-3.5 h-3.5" />
                  {t('common.online')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-950 animate-pulse">
                  <WifiOff className="w-3.5 h-3.5" />
                  {t('common.offline')}
                </span>
              )}
            </div>
          </div>

          {/* Offline sync */}
          {pendingCount > 0 && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-950 px-4 py-3 flex items-center justify-between gap-4 shrink-0 transition-all">
              <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-400">
                <RefreshCw className={`w-4 h-4 text-amber-600 dark:text-amber-500 ${syncing ? 'animate-spin' : ''}`} />
                <span>
                  {t('common.syncPending', { count: pendingCount })}
                </span>
              </div>
              <button
                type="button"
                onClick={performSync}
                disabled={syncing || !isOnline}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {syncing ? t('common.syncing') : t('common.syncNow')}
              </button>
            </div>
          )}

          {/* Điều hướng chế độ quét */}
          {activeSession && (
            <div className="flex border-b border-gray-200 dark:border-gray-800 shrink-0">
              <button
                onClick={() => {
                  cancelScan();
                  setScanMode('INVENTORY');
                }}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  scanMode === 'INVENTORY'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                {t('inventory.modeInventory')}
              </button>
              <button
                onClick={() => {
                  cancelScan();
                  setScanMode('LOOKUP');
                }}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  scanMode === 'LOOKUP'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Search className="w-4 h-4" />
                {t('inventory.modeLookup')}
              </button>
            </div>
          )}

          {/* Cảnh báo chế độ tra cứu nếu không có đợt kiểm kê active (chỉ hiển thị khi admin/staff truy cập quét kiểm kê nhưng chưa có đợt mở) */}
          {!activeSession && initialMode !== 'LOOKUP' && user?.role !== 'EMPLOYEE' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2 border-b border-amber-100 dark:border-amber-900/50 shrink-0">
              <Info className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{t('inventory.lookupModeAlert')}</span>
            </div>
          )}

          {/* Scan */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-start sm:justify-center bg-gray-50/20 dark:bg-slate-950/10 min-h-0">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md overflow-hidden flex flex-col my-auto">
              
              <div className="p-4 text-center border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50 shrink-0">
                 <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                   {scanMode === 'INVENTORY' ? t('inventory.scanSubtitle') : t('inventory.modeLookup')}
                 </p>
              </div>

              <div className="p-6 overflow-y-auto min-h-0 flex-1">
                <style>{`
                  #reader {
                    border: none !important;
                    padding: 0 !important;
                  }
                  #reader button {
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
                    color: white !important;
                    font-weight: 700 !important;
                    font-size: 13px !important;
                    padding: 10px 20px !important;
                    border-radius: 10px !important;
                    border: none !important;
                    margin: 8px 4px !important;
                    cursor: pointer !important;
                    box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25) !important;
                    transition: all 0.2s ease !important;
                  }
                  #reader button:hover {
                    transform: translateY(-1px) !important;
                    box-shadow: 0 6px 14px rgba(79, 70, 229, 0.35) !important;
                  }
                  #reader select {
                    padding: 8px 12px !important;
                    border-radius: 10px !important;
                    border: 1.5px solid #cbd5e1 !important;
                    margin: 8px 4px !important;
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    background-color: white !important;
                    color: #1e293b !important;
                    outline: none !important;
                    max-width: 90% !important;
                  }
                  .dark #reader select {
                    background-color: #0f172a !important;
                    border-color: #334155 !important;
                    color: #f8fafc !important;
                  }
                  #reader a {
                    color: #6366f1 !important;
                    font-weight: 600 !important;
                    text-decoration: none !important;
                    margin-top: 8px !important;
                    display: inline-block !important;
                    font-size: 13px !important;
                  }
                `}</style>
                <div id="reader" className={`w-full overflow-hidden rounded-lg ${scannedAssetId ? 'hidden' : 'block'}`}></div>
                
                {!scannedAssetId && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">
                      {t('inventory.orEnterManualUuid')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        placeholder={t('inventory.enterUuidPlaceholder')}
                        className="flex-1 border rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleManualSubmit}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0"
                      >
                        {t('common.confirm')}
                      </button>
                    </div>
                  </div>
                )}

                {scannedAssetId && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    
                    {fetchingAsset ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('inventory.scanning')}</p>
                      </div>
                    ) : assetDetails ? (
                      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">{t('inventory.assetDetails')}</p>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mt-1">{assetDetails.name}</h3>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            assetDetails.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' :
                            assetDetails.status === 'ASSIGNED' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300' :
                            assetDetails.status === 'MAINTENANCE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300' :
                            'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300'
                          }`}>
                            {assetDetails.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 text-xs text-gray-600 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
                          <div>
                            <span className="font-semibold text-gray-400 dark:text-gray-500 block">{t('inventory.assetCodeLabel')}</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{assetDetails.assetCode || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-400 dark:text-gray-500 block">{t('inventory.serialNumberLabel')}</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 font-mono">{assetDetails.serialNumber || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-400 dark:text-gray-500 block">{t('inventory.categoryLabel')}</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{assetDetails.categoryName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-400 dark:text-gray-500 block">{t('inventory.warrantyExpiryLabel')}</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{assetDetails.warrantyExpiry || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-indigo-100/50 dark:border-indigo-900/20 text-[9px] font-mono text-gray-400 break-all">
                          UUID: {scannedAssetId}
                        </div>
                      </div>
                    ) : null}

                    {/* Kiểm kê */}
                    {scanMode === 'INVENTORY' && assetDetails && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('inventory.notes')}
                          </label>
                          <textarea
                            rows="2"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('inventory.enterNotesPlaceholder')}
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-gray-900 dark:text-white"
                          />
                        </div>

                        {/* Kiểm kê */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => handleQuickSubmit('FOUND')}
                            disabled={submitting || fetchingAsset}
                            className="flex flex-col items-center justify-center p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all active:scale-95 text-center shadow-sm cursor-pointer"
                          >
                            <span className="text-base">✓</span>
                            <span className="text-xs mt-1 font-semibold">{t('inventory.found')}</span>
                          </button>
                          <button
                            onClick={() => handleQuickSubmit('DAMAGED')}
                            disabled={submitting || fetchingAsset}
                            className="flex flex-col items-center justify-center p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all active:scale-95 text-center shadow-sm cursor-pointer"
                          >
                            <span className="text-base">⚠</span>
                            <span className="text-xs mt-1 font-semibold">{t('inventory.damaged')}</span>
                          </button>
                          <button
                            onClick={() => handleQuickSubmit('MISSING')}
                            disabled={submitting || fetchingAsset}
                            className="flex flex-col items-center justify-center p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all active:scale-95 text-center shadow-sm cursor-pointer"
                          >
                            <span className="text-base">?</span>
                            <span className="text-xs mt-1 font-semibold">{t('inventory.missing')}</span>
                          </button>
                        </div>
                      </>
                    )}

                    {/* Tra cứu */}
                    {scanMode === 'LOOKUP' && assetDetails && (
                      <div className="space-y-2 pt-2">
                        <button
                          onClick={() => navigate(`/assets/${scannedAssetId}`)}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Info className="w-4 h-4" />
                          {t('inventory.viewFullDetails')}
                        </button>
                        <button
                          onClick={cancelScan}
                          className="w-full py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          {t('inventory.scanNext')}
                        </button>
                      </div>
                    )}

                    {/* Trả về/hủy chế độ kiểm kê */}
                    {scanMode === 'INVENTORY' && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={cancelScan}
                          disabled={submitting}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-semibold text-sm cursor-pointer"
                        >
                          {t('inventory.cancelScan')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InventoryScanPage;
