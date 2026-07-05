import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Edit, Package, QrCode, ClipboardList, Info,
  Settings, UserCheck, ArrowRightLeft, PenTool, CheckCircle2
} from 'lucide-react';
import axiosClient from '../services/axiosClient';
import AllocationModal from '../components/AllocationModal';
import MaintenanceModal from '../components/MaintenanceModal';
import HealthScoreWidget from '../components/HealthScoreWidget';

const AssetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language?.startsWith('vi') ? 'vi-VN' : 'en-US';

  const [asset, setAsset] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [allocAction, setAllocAction] = useState('ASSIGN');
  const [activeTab, setActiveTab] = useState('allocations');
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [maintAction, setMaintAction] = useState('START');

  // User Info
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const role = currentUser?.role || 'EMPLOYEE';
  const canManage = role === 'SUPER_ADMIN' || role === 'IT_STAFF';

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'ASSIGNED': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-900/50';
      case 'MAINTENANCE': return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50';
      case 'PENDING_CONFIRMATION': return 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-900/50';
      case 'LOST':
      case 'BROKEN': return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-900/50';
      case 'RETIRED': return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:border-gray-600';
      default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:border-gray-600';
    }
  };

  const fetchAssetData = useCallback(async () => {
    setLoading(true);
    try {
      const assetRes = await axiosClient.get(`/assets/${id}`);
      setAsset(assetRes);

      if (canManage) {
        const allocRes = await axiosClient.get(`/assets/${id}/allocations`);
        setAllocations(allocRes || []);

        const maintRes = await axiosClient.get(`/assets/${id}/maintenances`);
        setMaintenances(maintRes || []);
      }

      try {
        const qrRes = await axiosClient.get(`/assets/${id}/qr`, { responseType: 'blob' });
        const imageUrl = URL.createObjectURL(qrRes);
        setQrCode(imageUrl);
      } catch (err) {
        console.error('Failed to fetch QR code', err);
      }

      try {
        const healthRes = await axiosClient.get(`/assets/${id}/health`);
        setHealthData(healthRes);
      } catch (err) {
        console.error('Failed to fetch health data', err);
      }

    } catch (err) {
      console.error("Error fetching asset details:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssetData();
  }, [fetchAssetData]);

  // Revoke object URL
  useEffect(() => {
    return () => {
      if (qrCode) URL.revokeObjectURL(qrCode);
    };
  }, [qrCode]);

  const handleOpenAllocModal = (actionType) => {
    setAllocAction(actionType);
    setIsAllocModalOpen(true);
  };

  const handleDownloadQr = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `QR_${asset.assetCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQr = () => {
    if (!qrCode) return;

    let iframe = document.getElementById('qr-print-iframe');
    if (iframe) {
      iframe.remove();
    }

    iframe = document.createElement('iframe');
    iframe.id = 'qr-print-iframe';
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print QR - ${asset.assetCode}</title>
          <style>
            @page {
              size: 50mm 40mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              width: 50mm;
              height: 40mm;
              display: flex;
              justify-content: center;
              align-items: center;
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
            }
            .container {
              width: 48mm;
              height: 38mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 1px dashed #cbd5e1;
              border-radius: 4px;
              box-sizing: border-box;
              padding: 2px;
            }
            img {
              width: 25mm;
              height: 25mm;
              display: block;
            }
            h2 {
              margin: 2px 0 0 0;
              font-size: 8px;
              color: #0f172a;
              font-weight: 700;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 44mm;
            }
            p {
              margin: 1px 0 0 0;
              font-size: 7px;
              color: #475569;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img id="qr-img" src="${qrCode}" />
            <h2>${asset.name}</h2>
            <p>${asset.assetCode}</p>
          </div>
          <script>
            const img = document.getElementById('qr-img');
            const runPrint = () => {
              setTimeout(() => {
                window.focus();
                window.print();
              }, 250);
            };
            if (img.complete) {
              runPrint();
            } else {
              img.onload = runPrint;
            }
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-50 dark:bg-slate-900/50">
        <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <span className="text-gray-500 dark:text-gray-400">{t('assetDetail.loading')}</span>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-50 dark:bg-slate-900/50">
        <Package className="w-12 h-12 text-gray-400 mb-4" />
        <span className="text-gray-500 dark:text-gray-400">{t('assetDetail.notFound')}</span>
        <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 hover:underline">
          {t('assetDetail.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-4 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {t('assetDetail.title')}
              </h1>
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => navigate(`/assets/${id}/edit`)}
                className="flex-1 sm:flex-none flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors justify-center shadow-sm cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                {t('assetDetail.edit')}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {canManage && (
            <div className="flex flex-wrap gap-3">
              {asset.status === 'AVAILABLE' && (
                <>
                  <button
                    onClick={() => handleOpenAllocModal('ASSIGN')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    {t('actions.assign')}
                  </button>
                  <button
                    onClick={() => {
                      setMaintAction('START');
                      setIsMaintModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    <PenTool className="w-4 h-4" />
                    {t('actions.maintenance')}
                  </button>
                </>
              )}
              {asset.status === 'ASSIGNED' && (
                <>
                  <button
                    onClick={() => handleOpenAllocModal('RETURN')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    {t('actions.return')}
                  </button>
                  <button
                    onClick={() => handleOpenAllocModal('TRANSFER')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    {t('actions.transfer')}
                  </button>
                </>
              )}
              {asset.status === 'MAINTENANCE' && (
                <button
                  onClick={() => {
                    setMaintAction('COMPLETE');
                    setIsMaintModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t('maintenance.completeMaintenance')}
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Thông tin chung */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 bg-gray-50/50 dark:bg-slate-800/50">
                  <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('assetDetail.generalInfo')}</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('assets.tableName')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{asset.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('assets.tableCode')}</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded inline-block">{asset.assetCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('assets.tableCategory')}</p>
                    <p className="text-gray-900 dark:text-white">{asset.categoryName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('assetDetail.status')}</p>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded border uppercase tracking-wider inline-block mt-1 ${getStatusColor(asset.status)}`}>
                      {t(`status.${asset.status}`)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('assetDetail.serialNumber')}</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white">{asset.serialNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('assetDetail.purchaseDate')}</p>
                    <p className="text-gray-900 dark:text-white">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString(currentLocale) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('assetDetail.purchaseCost')}</p>
                    <p className="text-gray-900 dark:text-white">
                      {asset.purchaseCost
                        ? new Intl.NumberFormat(currentLocale, {
                          style: 'currency',
                          currency: asset.currency || 'VND',
                          minimumFractionDigits: (asset.currency || 'VND') === 'VND' ? 0 : 2
                        }).format(asset.purchaseCost)
                        : '-'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('assetDetail.warrantyExpiry')}</p>
                    <p className="text-gray-900 dark:text-white">{asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString(currentLocale) : '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin cấu hình */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden h-full">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 bg-gray-50/50 dark:bg-slate-800/50">
                  <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('assetDetail.specifications')}</h3>
                </div>
                <div className="p-4">
                  {asset.specification && Object.keys(asset.specification).length > 0 ? (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                      {Object.entries(asset.specification).map(([key, value]) => (
                        <li key={key} className="py-3 flex justify-between items-start gap-4">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-sm text-gray-900 dark:text-white text-right break-words max-w-[60%]">{String(value)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 py-8">
                      <Settings className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">{t('assetDetail.noSpecifications')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden text-center">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 bg-gray-50/50 dark:bg-slate-800/50 justify-center">
                  <QrCode className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('assetDetail.qrCodeTitle')}</h3>
                </div>
                <div className="p-6 flex flex-col items-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('assetDetail.qrDesc')}</p>

                  <div className="bg-white p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm inline-block">
                    {qrCode ? (
                      <>
                        <img src={qrCode} alt="Asset QR Code" className="w-48 h-48 object-contain" />
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
                          <p className="text-xs font-semibold text-gray-900 dark:text-slate-200 truncate max-w-[192px]">{asset.name}</p>
                          <p className="text-[10px] font-mono text-gray-500 mt-0.5">{asset.assetCode}</p>
                        </div>
                      </>
                    ) : (
                      <div className="w-48 h-48 bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 rounded-lg">
                        <QrCode className="w-8 h-8 mb-2" />
                        <span className="text-xs">No QR Code available</span>
                      </div>
                    )}
                  </div>

                  {qrCode && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <button
                        onClick={handleDownloadQr}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer bg-transparent border-none outline-none"
                      >
                        {t('assetDetail.downloadQr')}
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={handlePrintQr}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer bg-transparent border-none outline-none"
                      >
                        {t('assetDetail.printQr')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {canManage && <HealthScoreWidget healthData={healthData} currency={asset?.currency || 'VND'} />}

          {/* Lịch sử và bảo trì*/}
          {canManage && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50">
                <button
                  onClick={() => setActiveTab('allocations')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${activeTab === 'allocations'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-semibold'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  {t('assetDetail.tabAllocations')}
                </button>
                <button
                  onClick={() => setActiveTab('maintenances')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${activeTab === 'maintenances'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-semibold'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                  <PenTool className="w-4 h-4" />
                  {t('assetDetail.tabMaintenances')}
                </button>
              </div>

              <div className="p-1">
                {activeTab === 'allocations' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium border-b border-gray-100 dark:border-gray-800">
                        <tr>
                          <th className="px-4 py-3">{t('assetDetail.historyDate')}</th>
                          <th className="px-4 py-3">{t('assetDetail.historyType')}</th>
                          <th className="px-4 py-3">{t('requests.fromUser')}</th>
                          <th className="px-4 py-3">{t('requests.toUser')}</th>
                          <th className="px-4 py-3">{t('assetDetail.status')}</th>
                          <th className="px-4 py-3">{t('assetDetail.notes')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                        {allocations.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                              {t('assetDetail.noHistory')}
                            </td>
                          </tr>
                        ) : (
                          allocations.map((alloc, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                {new Date(alloc.createdAt || alloc.eventTime).toLocaleString(currentLocale)}
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                {alloc.actionType || 'Bàn giao'}
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                {alloc.fromUserId || '-'}
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                {alloc.toUserId || '-'}
                              </td>
                              <td className="px-4 py-3">
                                {alloc.confirmationStatus === 'PENDING' && <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded text-xs">{t('assetDetail.statusPending')}</span>}
                                {alloc.confirmationStatus === 'CONFIRMED' && <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded text-xs">{t('assetDetail.statusConfirmed')}</span>}
                                {alloc.confirmationStatus === 'REJECTED' && <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded text-xs">{t('assetDetail.statusRejected')}</span>}
                                {!alloc.confirmationStatus && <span className="text-gray-500">-</span>}
                              </td>
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400 truncate max-w-[200px]" title={alloc.notes}>
                                {alloc.notes || '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium border-b border-gray-100 dark:border-gray-800">
                        <tr>
                          <th className="px-4 py-3">{t('maintenance.startDate')}</th>
                          <th className="px-4 py-3">{t('maintenance.endDate')}</th>
                          <th className="px-4 py-3">{t('maintenance.providerName')}</th>
                          <th className="px-4 py-3">{t('maintenance.issueDescription')}</th>
                          <th className="px-4 py-3">{t('maintenance.actionTaken')}</th>
                          <th className="px-4 py-3">{t('maintenance.repairCost')}</th>
                          <th className="px-4 py-3">{t('maintenance.status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                        {maintenances.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                              {t('maintenance.noLogs')}
                            </td>
                          </tr>
                        ) : (
                          maintenances.map((log, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                {log.startDate ? new Date(log.startDate).toLocaleDateString(currentLocale) : '-'}
                              </td>
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                {log.endDate ? new Date(log.endDate).toLocaleDateString(currentLocale) : '-'}
                              </td>
                              <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                                {log.providerName || '-'}
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[150px] truncate" title={log.issueDescription}>
                                {log.issueDescription || '-'}
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[150px] truncate" title={log.actionTaken}>
                                {log.actionTaken || '-'}
                              </td>
                              <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                                {log.repairCost
                                  ? new Intl.NumberFormat(currentLocale, {
                                    style: 'currency',
                                    currency: asset.currency || 'VND',
                                    minimumFractionDigits: (asset.currency || 'VND') === 'VND' ? 0 : 2
                                  }).format(log.repairCost)
                                  : '-'
                                }
                              </td>
                              <td className="px-4 py-3">
                                {log.status === 'IN_PROGRESS' ? (
                                  <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1/2 rounded text-[10px] font-bold uppercase border border-amber-200">{t('maintenance.inProgress')}</span>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1/2 rounded text-[10px] font-bold uppercase border border-emerald-200">{t('maintenance.completed')}</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AllocationModal
        isOpen={isAllocModalOpen}
        onClose={() => setIsAllocModalOpen(false)}
        onSuccess={fetchAssetData}
        asset={asset}
        action={allocAction}
      />

      <MaintenanceModal
        isOpen={isMaintModalOpen}
        onClose={() => setIsMaintModalOpen(false)}
        actionType={maintAction}
        assetId={asset.id}
        activeMaintenanceLogId={
          maintenances.find(log => log.status === 'IN_PROGRESS')?.id || null
        }
        currency={asset.currency || 'VND'}
        onSuccess={fetchAssetData}
      />
    </div>
  );
};

export default AssetDetailPage;
