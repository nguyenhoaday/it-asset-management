import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Monitor, CheckCircle } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const MyAssetListPage = () => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyAssets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/users/me/assets');
      const data = Array.isArray(response) ? response : (response.data || []);
      const confirmed = data.filter(item => item.confirmationStatus === 'CONFIRMED');
      setAssets(confirmed);
    } catch (error) {
      console.error('Error fetching my assets:', error);
      showToast(t('myAssets.noData'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    fetchMyAssets();
  }, [fetchMyAssets]);

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

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-4 p-4 sm:p-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Monitor className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              {t('myAssets.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('myAssets.subtitle')}
            </p>
          </div>
        </div>

        {/* List assets */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : assets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <Monitor className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('myAssets.noData')}</h3>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {assets.map(asset => (
                    <tr 
                      key={asset.allocationId || asset.assetId} 
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => asset.assetId && navigate(`/assets/${asset.assetId}`)}
                    >
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {t('myAssets.confirmed')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate" title={asset.notes}>
                        {asset.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAssetListPage;
