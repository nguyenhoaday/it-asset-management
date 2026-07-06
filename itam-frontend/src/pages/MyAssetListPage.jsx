import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Monitor, Key, CheckCircle, Copy, Check, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const MyAssetListPage = () => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('hardware');
  const [assets, setAssets] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

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

  const fetchMyLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/licenses/my');
      const data = Array.isArray(response) ? response : (response.data || []);
      setLicenses(data);
    } catch (error) {
      console.error('Error fetching my licenses:', error);
      showToast(t('myAssets.noSoftwareData'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    if (activeTab === 'hardware') {
      fetchMyAssets();
    } else {
      fetchMyLicenses();
    }
  }, [activeTab, fetchMyAssets, fetchMyLicenses]);

  const handleCopyKey = (key, id) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopiedKey(id);
    showToast(t('myAssets.copySuccess'), 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

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

  const formatExpDate = (dateString) => {
    if (!dateString) return t('licenses.statusUnknown') || 'Vĩnh viễn';
    try {
      return new Intl.DateTimeFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  const getExpirationBadge = (expirationDate) => {
    if (!expirationDate) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t('licenses.valid') || 'Vĩnh viễn'}
        </span>
      );
    }
    const exp = new Date(expirationDate);
    const today = new Date();
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-900/50">
          <AlertTriangle className="w-3.5 h-3.5" />
          {t('licenses.expired') || 'Đã hết hạn'}
        </span>
      );
    } else if (diffDays <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50">
          <Clock className="w-3.5 h-3.5" />
          {t('licenses.expiringSoon') || 'Sắp hết hạn'} ({diffDays} ngày)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50">
        <ShieldCheck className="w-3.5 h-3.5" />
        {t('licenses.valid') || 'Còn hạn'}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-4 p-4 sm:p-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {activeTab === 'hardware' ? (
                <Monitor className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Key className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              )}
              {activeTab === 'hardware' ? t('myAssets.title') : t('myAssets.tabSoftware')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {activeTab === 'hardware' ? t('myAssets.subtitle') : t('myAssets.softwareSubtitle')}
            </p>
          </div>
        </div>

        {/* Tab */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 gap-6">
          <button
            onClick={() => setActiveTab('hardware')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'hardware'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Monitor className="w-4 h-4" />
            {t('myAssets.tabHardware')} ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('software')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'software'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Key className="w-4 h-4" />
            {t('myAssets.tabSoftware')} ({licenses.length})
          </button>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'hardware' ? (
            assets.length === 0 ? (
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
            )
          ) : (
            /* List */
            licenses.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <Key className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('myAssets.noSoftwareData')}</h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4">{t('licenses.nameLabel') || 'Tên phần mềm'}</th>
                      <th className="px-6 py-4">{t('licenses.codeLabel') || 'Mã gói'}</th>
                      <th className="px-6 py-4">{t('licenses.licenseKeyLabel') || 'Mã kích hoạt (Key)'}</th>
                      <th className="px-6 py-4">{t('myAssets.assignedAt')}</th>
                      <th className="px-6 py-4">{t('licenses.expirationDateLabel') || 'Ngày hết hạn'}</th>
                      <th className="px-6 py-4">{t('myAssets.notes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {licenses.map(lic => (
                      <tr key={lic.allocationId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Key className="w-4 h-4 text-indigo-500" />
                          {lic.licenseName}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                          {lic.licenseCode}
                        </td>
                        <td className="px-6 py-4">
                          {lic.licenseKey ? (
                            <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs">
                              <span className="select-all font-semibold text-indigo-600 dark:text-indigo-400">{lic.licenseKey}</span>
                              <button
                                onClick={() => handleCopyKey(lic.licenseKey, lic.allocationId)}
                                className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                                title={t('myAssets.copyKey')}
                              >
                                {copiedKey === lic.allocationId ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Không có key</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                          {formatDate(lic.allocatedAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getExpirationBadge(lic.expirationDate)}
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatExpDate(lic.expirationDate)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate" title={lic.notes}>
                          {lic.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAssetListPage;
