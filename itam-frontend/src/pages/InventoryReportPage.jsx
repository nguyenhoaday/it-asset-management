import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, PieChart as PieChartIcon, CheckCircle, XCircle, AlertTriangle, HelpCircle, Hash, Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const InventoryReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalReportPages, setTotalReportPages] = useState(1);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const repRes = await axiosClient.get(`/inventory-sessions/${id}/report`);
      setReport(repRes.data || repRes);
    } catch (error) {
      console.error('Error fetching inventory report details:', error);
      showToast(t('inventory.scanFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast, t]);

  const fetchItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const response = await axiosClient.get(`/inventory-sessions/${id}/items`, {
        params: {
          page: currentPage - 1,
          size: 10,
          search: searchQuery,
          status: statusFilter
        }
      });
      const data = response.data || response;
      setItems(data.content || []);
      setTotalReportPages(data.totalPages || 1);
      setTotalItems(data.totalElements || 0);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setItemsLoading(false);
    }
  }, [id, currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => { // Reset page khi filter thay đổi
    fetchItems();
  }, [fetchItems, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleExport = async () => {
    try {
      showToast(t('reports.exporting'), 'info');
      const response = await axiosClient.get(`/reports/inventory/${id}?lang=${i18n.language || 'vi'}`, {
        responseType: 'blob'
      });
      const blob = response instanceof Blob ? response : (response.data || response);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCao_KiemKe_${report?.sessionTitle || id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast(t('reports.exportSuccess'), 'success');
    } catch (err) {
      console.error(err);
      showToast(t('reports.exportFailed'), 'error');
    }
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

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-50 dark:bg-slate-900/50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900/50">
        <div className="p-4 sm:p-6 flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shrink-0">
          <button
            onClick={() => navigate('/inventory')}
            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('inventory.reportTitle')}
          </h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <PieChartIcon className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('inventory.loadReportFailed')}
          </h2>
          <button
            onClick={() => navigate('/inventory')}
            className="text-indigo-600 hover:underline cursor-pointer"
          >
            {t('inventory.backToList')}
          </button>
        </div>
      </div>
    );
  }

  const {
    sessionTitle: title,
    totalAssets,
    scannedCount,
    foundCount: found,
    missingCount: missing,
    damagedCount: damaged,
    unverifiedCount: unverified
  } = report;

  const data = [
    { name: t('inventory.found'), value: found, color: '#10b981', fill: '#10b981' },
    { name: t('inventory.missing'), value: missing, color: '#ef4444', fill: '#ef4444' },
    { name: t('inventory.damaged'), value: damaged, color: '#f59e0b', fill: '#f59e0b' },
    { name: t('inventory.unverified'), value: unverified, color: '#94a3b8', fill: '#94a3b8' },
  ].filter(item => item.value > 0);

  const statsCards = [
    { label: t('inventory.totalAssets'), value: totalAssets, icon: Hash, colorClass: 'text-indigo-600 dark:text-indigo-400', bgClass: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-900/50' },
    { label: t('inventory.scannedCount'), value: scannedCount, icon: PieChartIcon, colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-900/50' },
    { label: t('inventory.found'), value: found, icon: CheckCircle, colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-900/50' },
    { label: t('inventory.missing'), value: missing, icon: XCircle, colorClass: 'text-red-600 dark:text-red-400', bgClass: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-900/50' },
    { label: t('inventory.damaged'), value: damaged, icon: AlertTriangle, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-900/50' },
    { label: t('inventory.unverified'), value: unverified, icon: HelpCircle, colorClass: 'text-slate-600 dark:text-slate-400', bgClass: 'bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-700/50' },
  ];



  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 sm:p-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/inventory')}
            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {t('inventory.reportTitle')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              {title}
            </p>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
        >
          {t('reports.exportExcel') || 'Xuất Excel'}
        </button>
      </div>

      <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* Thống kê */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {statsCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`p-4 rounded-2xl border ${stat.bgClass} flex flex-col items-center text-center shadow-sm`}>
                <div className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 flex items-center justify-center mb-3 shadow-sm">
                  <Icon className={`w-5 h-5 ${stat.colorClass}`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</h3>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Biểu đồ */}
        {totalAssets > 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    formatter={(value, name) => {
                      const percent = totalAssets > 0 ? ((value / totalAssets) * 100).toFixed(1) : 0;
                      return [`${value} (${percent}%)`, name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full md:w-1/2 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('inventory.distributionTitle')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('inventory.distributionDesc', { count: totalAssets, title })}
              </p>
              <div className="space-y-3 pt-4">
                {data.map((item, index) => {
                  const percentage = ((item.value / totalAssets) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('common.noData')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('inventory.noAssetsInSession')}</p>
          </div>
        )}

        {/* Danh sách chi tiết các tài sản đã kiểm kê */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              {t('inventory.detailedList') || 'Chi tiết kết quả quét'}
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t('inventory.searchPlaceholder') || 'Tìm kiếm thiết bị...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              {/* Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">{t('inventory.allStatuses') || 'Tất cả trạng thái'}</option>
                <option value="FOUND">{t('inventory.found') || 'Tìm thấy'}</option>
                <option value="MISSING">{t('inventory.missing') || 'Thất lạc'}</option>
                <option value="DAMAGED">{t('inventory.damaged') || 'Hư hỏng'}</option>
                <option value="UNVERIFIED">{t('inventory.unverified') || 'Chưa xác minh'}</option>
              </select>
            </div>
          </div>

          {itemsLoading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : totalItems === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              {t('inventory.noItemsFound')}
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4">{t('inventory.assetCode')}</th>
                      <th className="px-6 py-4">{t('inventory.assetName')}</th>
                      <th className="px-6 py-4">{t('inventory.scannedBy')}</th>
                      <th className="px-6 py-4">{t('inventory.status')}</th>
                      <th className="px-6 py-4">{t('inventory.scannedAt')}</th>
                      <th className="px-6 py-4">{t('inventory.notes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {items.map((item) => {
                      const code = item.assetCode || 'N/A';
                      const name = item.assetName || 'N/A';
                      const user = item.checkedByName || 'Hệ thống';

                      let badgeClass;
                      let statusLabel;
                      switch (item.checkedStatus) {
                        case 'FOUND':
                          badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50';
                          statusLabel = t('inventory.found');
                          break;
                        case 'MISSING':
                          badgeClass = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-900/50';
                          statusLabel = t('inventory.missing');
                          break;
                        case 'DAMAGED':
                          badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50';
                          statusLabel = t('inventory.damaged');
                          break;
                        default:
                          badgeClass = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-gray-300 dark:border-gray-700';
                          statusLabel = t('inventory.unverified');
                      }

                      return (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-900 dark:text-white">
                            {code}
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                            {name}
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                            {user}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badgeClass}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                            {formatDate(item.checkedAt)}
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate" title={item.notes}>
                            {item.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phân trang */}
              {totalReportPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {t('common.pageInfo', { page: currentPage, totalPages: totalReportPages })}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalReportPages, p + 1))}
                      disabled={currentPage >= totalReportPages}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default InventoryReportPage;
