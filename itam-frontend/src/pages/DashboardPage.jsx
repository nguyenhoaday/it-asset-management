import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Package, Users, Wrench, ShieldAlert,
  ClipboardCheck, ArrowRight, Plus, Key, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import {
  PieChart, Pie, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';
import LeaderboardWidget from '../components/LeaderboardWidget';
import { useMemo } from 'react';

const PIE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const DashboardPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || 'USER';
  const isPrivileged = role === 'SUPER_ADMIN' || role === 'IT_STAFF';

  const [summary, setSummary] = useState({
    totalAssets: 0,
    assignedAssets: 0,
    maintenanceAssets: 0,
    expiringWarrantyAssets: 0
  });
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          axiosClient.get('/analytics/summary'),
          axiosClient.get('/analytics/categories'),
          axiosClient.get('/analytics/departments'),
          axiosClient.get('/inventory-sessions/active')
        ]);

        if (results[0].status === 'fulfilled') setSummary(results[0].value || {});
        if (results[1].status === 'fulfilled') setCategories(Array.isArray(results[1].value) ? results[1].value : []);
        if (results[2].status === 'fulfilled') setDepartments(Array.isArray(results[2].value) ? results[2].value : []);

        if (results[3].status === 'fulfilled' && results[3].value && results[3].value.id) {
          setActiveSession(results[3].value);
        } else {
          setActiveSession(null);
        }

        const anyFailed = results.slice(0, 3).some(r => r.status === 'rejected');
        if (anyFailed) {
          showToast(t('common.connectionError'), 'error');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportAssets = async () => {
    setIsExportOpen(false);
    try {
      showToast(t('reports.exporting') || 'Đang xuất báo cáo...', 'info');
      const response = await axiosClient.get(`/reports/assets?lang=${i18n.language || 'vi'}`, {
        responseType: 'blob'
      });
      const blob = response instanceof Blob ? response : (response.data || response);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCao_TaiSan_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast(t('reports.exportSuccess') || 'Tải báo cáo thành công!', 'success');
    } catch (err) {
      console.error(err);
      showToast(t('reports.exportFailed') || 'Xuất báo cáo thất bại!', 'error');
    }
  };

  const handleExportAllocations = async () => {
    setIsExportOpen(false);
    try {
      showToast(t('reports.exporting') || 'Đang xuất báo cáo...', 'info');
      const response = await axiosClient.get(`/reports/allocations?lang=${i18n.language || 'vi'}`, {
        responseType: 'blob'
      });
      const blob = response instanceof Blob ? response : (response.data || response);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCao_CapPhat_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast(t('reports.exportSuccess') || 'Tải báo cáo thành công!', 'success');
    } catch (err) {
      console.error(err);
      showToast(t('reports.exportFailed') || 'Xuất báo cáo thất bại!', 'error');
    }
  };

  const handleExportMaintenances = async () => {
    setIsExportOpen(false);
    try {
      showToast(t('reports.exporting') || 'Đang xuất báo cáo...', 'info');
      const response = await axiosClient.get(`/reports/maintenances?lang=${i18n.language || 'vi'}`, {
        responseType: 'blob'
      });
      const blob = response instanceof Blob ? response : (response.data || response);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCao_BaoTri_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast(t('reports.exportSuccess') || 'Tải báo cáo thành công!', 'success');
    } catch (err) {
      console.error(err);
      showToast(t('reports.exportFailed') || 'Xuất báo cáo thất bại!', 'error');
    }
  };

  const processedCategories = useMemo(() => {
    if (categories.length <= 5) {
      return categories.map((c, i) => ({ ...c, fill: PIE_COLORS[i % PIE_COLORS.length] }));
    }
    const sorted = [...categories].sort((a, b) => (b.count || 0) - (a.count || 0));
    const top5 = sorted.slice(0, 5).map((c, i) => ({ ...c, fill: PIE_COLORS[i % PIE_COLORS.length] }));
    const others = sorted.slice(5).reduce((acc, curr) => acc + (curr.count || 0), 0);
    return [...top5, { categoryName: t('dashboard.others', 'Khác'), count: others, fill: PIE_COLORS[5 % PIE_COLORS.length] }];
  }, [categories, t]);

  const totalPie = processedCategories.reduce((acc, curr) => acc + (curr.count || 0), 0);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {t('dashboard.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('dashboard.subtitle')}
            </p>
          </div>

          {isPrivileged && (
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  {t('reports.exportDropdown') || 'Xuất báo cáo'}
                </button>
                {isExportOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsExportOpen(false)} />
                    <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 sm:w-64 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50">
                      <div className="p-1">
                        <button
                          onClick={handleExportAssets}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                        >
                          {t('reports.assetsExcel') || 'Xuất danh sách tài sản (Excel)'}
                        </button>
                        <button
                          onClick={handleExportAllocations}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                        >
                          {t('reports.allocationsExcel') || 'Xuất lịch sử bàn giao (Excel)'}
                        </button>
                        <button
                          onClick={handleExportMaintenances}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                        >
                          {t('reports.maintenancesPdf') || 'Xuất lịch sử bảo trì (PDF)'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Thông báo sắp hết hạn bảo hành */}
        {!loading && summary.expiringWarrantyAssets > 0 && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">
                  {t('dashboard.warrantyAlertTitle')}
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-500/80 mt-0.5">
                  {t('dashboard.warrantyAlertMessage', { count: summary.expiringWarrantyAssets })}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/assets?warrantyExpiring=true')}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 text-sm font-medium rounded-lg hover:bg-amber-100 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
            >
              {t('dashboard.viewList')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Thông báo đang kiểm kê */}
        {!loading && activeSession && (
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg shrink-0">
                <ClipboardCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">
                  {t('dashboard.activeInventoryBanner')} <span className="font-semibold">{activeSession.title}</span>
                </h3>
              </div>
            </div>
            <button
              onClick={() => navigate('/inventory/scan')}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              {t('dashboard.goToScan')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Thống kê */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tổng tài sản */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
              ) : (
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{summary.totalAssets ?? 0}</h3>
              )}
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.totalAssets')}</p>
            </div>
          </div>

          {/* Card 2: Số lượng tài sản được bàn giao */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
              ) : (
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{summary.assignedAssets ?? 0}</h3>
              )}
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.assignedAssets')}</p>
            </div>
          </div>

          {/* Card 3: Số lượng tài sản đang bảo trì */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
              ) : (
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{summary.maintenanceAssets ?? 0}</h3>
              )}
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.maintenanceAssets')}</p>
            </div>
          </div>

          {/* Card 4: Số lượng tài sản sắp hết hạn bảo hành */}
          <div 
            onClick={() => navigate('/assets?warrantyExpiring=true')}
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group cursor-pointer hover:border-red-300 dark:hover:border-red-500/50 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
              ) : (
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{summary.expiringWarrantyAssets ?? 0}</h3>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.expiringWarranty')}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('dashboard.expiringWarrantyNote')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Biểu đồ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* biểu đồ tròn: Thống kê theo loại tài sản */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 flex flex-col h-[400px]">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              {t('dashboard.categoryDistribution')}
            </h3>
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-36 h-36 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse border-8 border-gray-100 dark:border-slate-900"></div>
              </div>
            ) : processedCategories.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                {t('dashboard.noData')}
              </div>
            ) : (
              <>
                <div className="h-44 w-full shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={processedCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="categoryName"
                        stroke="none"
                      />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        formatter={(value, name) => {
                          const percent = totalPie > 0 ? ((value / totalPie) * 100).toFixed(1) : 0;
                          return [`${value} (${percent}%)`, name];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 custom-scrollbar">
                  {processedCategories.map((entry, index) => {
                    const percent = totalPie > 0 ? ((entry.count / totalPie) * 100).toFixed(1) : 0;
                    return (
                      <div key={index} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                          <span className="text-gray-600 dark:text-gray-400 truncate">{entry.categoryName}</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 shrink-0">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>


          {/* biểu đồ cột: Thống kê theo phòng ban */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 flex flex-col h-[400px]">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
              {t('dashboard.departmentDistribution')}
            </h3>
            <div className="flex-1 w-full relative overflow-x-auto overflow-y-hidden custom-scrollbar">
              {loading ? (
                <div className="absolute inset-0 flex items-end justify-between px-4 pb-8 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded-t-sm" style={{ height: `${(i + 1) * 15 + 10}%` }}></div>
                  ))}
                </div>
              ) : departments.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  {t('dashboard.noData')}
                </div>
              ) : (
                <div style={{ minWidth: `${Math.max(departments.length * 60, 300)}px`, height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departments}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="departmentName"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        dy={10}
                        tickFormatter={(value) => value.length > 12 ? value.substring(0, 10) + '...' : value}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <RechartsTooltip
                        cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        formatter={(value) => [value, t('dashboard.totalAssets')]}
                      />
                      <Bar
                        dataKey="count"
                        name={t('dashboard.totalAssets')}
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                        barSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard Widget */}
          <LeaderboardWidget />

        </div>

        {/* Các thao tác nhanh (dành cho quản trị viên) */}
        {isPrivileged && (
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
              {t('dashboard.quickActions')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/assets/new')}
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white text-sm">{t('dashboard.addAsset')}</span>
              </button>

              <button
                onClick={() => navigate('/requests')}
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white text-sm">{t('dashboard.manageAllocations')}</span>
              </button>

              <button
                onClick={() => navigate('/inventory')}
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white text-sm">{t('dashboard.manageInventory')}</span>
              </button>

              <button
                onClick={() => navigate('/licenses')}
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Key className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white text-sm">{t('dashboard.manageLicenses')}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardPage;
