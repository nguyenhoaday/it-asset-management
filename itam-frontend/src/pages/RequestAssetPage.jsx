import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, Clock, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const RequestAssetPage = () => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  const [pendingAssets, setPendingAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPendingAssets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/users/me/assets');
      const data = Array.isArray(response) ? response : (response.data || []);
      const filtered = data.filter(item => item.confirmationStatus === 'PENDING');
      setPendingAssets(filtered);
    } catch (error) {
      console.error('Error fetching pending assets:', error);
      showToast(t('requestAsset.noData'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    fetchPendingAssets();
  }, [fetchPendingAssets]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Intl.DateTimeFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  const handleConfirmAsset = async () => {
    if (!selectedAsset || !selectedAsset.allocationId) return;
    setSubmitting(true);
    try {
      await axiosClient.post(`/allocations/${selectedAsset.allocationId}/confirm`);
      showToast(t('myAssets.confirmSuccess'), 'success');
      setIsConfirmModalOpen(false);
      setSelectedAsset(null);
      fetchPendingAssets();
    } catch (error) {
      console.error('Error confirming asset:', error);
      showToast(t('myAssets.confirmFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectAsset = async () => {
    if (!selectedAsset || !selectedAsset.allocationId) return;
    setSubmitting(true);
    try {
      await axiosClient.post(`/allocations/${selectedAsset.allocationId}/reject`);
      showToast(t('myAssets.rejectSuccess'), 'success');
      setIsRejectModalOpen(false);
      setSelectedAsset(null);
      fetchPendingAssets();
    } catch (error) {
      console.error('Error rejecting asset:', error);
      showToast(t('myAssets.rejectFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-4 p-4 sm:p-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              {t('requestAsset.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('requestAsset.subtitle')}
            </p>
          </div>
        </div>

        {/* List request */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : pendingAssets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <Monitor className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('requestAsset.noData')}</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4">{t('myAssets.assetName')}</th>
                    <th className="px-6 py-4">{t('myAssets.assetCode')}</th>
                    <th className="px-6 py-4">{t('myAssets.assignedAt')}</th>
                    <th className="px-6 py-4">{t('myAssets.confirmationStatus')}</th>
                    <th className="px-6 py-4">{t('myAssets.notes')}</th>
                    <th className="px-6 py-4 text-right">{t('myAssets.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pendingAssets.map(asset => (
                    <tr key={asset.allocationId || asset.assetId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {asset.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {asset.assetCode}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {formatDate(asset.assignedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50">
                          <Clock className="w-3.5 h-3.5" />
                          {t('myAssets.pending')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate" title={asset.notes}>
                        {asset.notes || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedAsset(asset); setIsConfirmModalOpen(true); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {t('myAssets.confirm')}
                          </button>
                          <button
                            onClick={() => { setSelectedAsset(asset); setIsRejectModalOpen(true); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:border-red-900/50 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {t('myAssets.reject')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirm */}
      {isConfirmModalOpen && selectedAsset && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-sm flex flex-col items-center text-center">
            <div className="flex w-full justify-end mb-2">
              <button onClick={() => setIsConfirmModalOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('myAssets.confirmTitle')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t('myAssets.confirmMessage', { name: selectedAsset.name })}
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmAsset}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? '...' : t('myAssets.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject */}
      {isRejectModalOpen && selectedAsset && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-sm flex flex-col items-center text-center">
            <div className="flex w-full justify-end mb-2">
              <button onClick={() => setIsRejectModalOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('myAssets.rejectTitle')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t('myAssets.rejectMessage', { name: selectedAsset.name })}
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleRejectAsset}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? '...' : t('myAssets.reject')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RequestAssetPage;

