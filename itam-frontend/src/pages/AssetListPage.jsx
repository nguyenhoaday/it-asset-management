import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Package, ShieldAlert, X } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const AssetListPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const warrantyExpiring = searchParams.get('warrantyExpiring') === 'true';

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const [assetToDelete, setAssetToDelete] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || 'EMPLOYEE';
  const canAddEdit = role === 'SUPER_ADMIN' || role === 'IT_STAFF';

  const currentLocale = i18n.language?.startsWith('vi') ? 'vi-VN' : 'en-US';

  const statuses = [
    'AVAILABLE',
    'ASSIGNED',
    'MAINTENANCE',
    'LOST',
    'BROKEN',
    'PENDING_CONFIRMATION',
    'RETIRED'
  ];

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

  const getWarrantyBadge = (warrantyExpiry) => {
    if (!warrantyExpiry) return null;
    const today = new Date();
    const expiry = new Date(warrantyExpiry);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-900/50">
          {t('assets.warrantyExpired')}
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50">
          {t('assets.warrantyExpiringSoon')}
        </span>
      );
    }
    return null;
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load danh muc
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosClient.get('/categories');
        setCategories(response || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Load asset
  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const params = {
          page: page,
          size: pageSize,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedCategory) params.categoryId = selectedCategory;
        if (selectedStatus) params.status = selectedStatus;
        if (warrantyExpiring) params.warrantyExpiring = true;

        const response = await axiosClient.get('/assets', { params });
        setAssets(response?.content || []);
        setTotalPages(response?.totalPages || 0);
        setTotalElements(response?.totalElements || 0);
      } catch (error) {
        console.error('Error fetching assets:', error);
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [debouncedSearch, selectedCategory, selectedStatus, warrantyExpiring, page, refreshKey]);

  const clearWarrantyFilter = () => {
    setSearchParams({});
    setPage(0);
  };

  const confirmDelete = async () => {
    if (!assetToDelete) return;
    try {
      await axiosClient.delete(`/assets/${assetToDelete.id}`);
      showToast(t('common.deleteSuccess', { defaultValue: "Xóa tài sản thành công!" }), 'success');
      setPage(0);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting asset:', error);
      showToast(
        error.response?.data?.message || t('common.deleteFailed', { defaultValue: "Xóa thất bại. Vui lòng thử lại!" }),
        'error'
      );
    } finally {
      setAssetToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 sm:p-6">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full min-h-0">
        
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col h-full min-h-0 shadow-sm overflow-hidden">
          
          {/* Header card */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 px-4 sm:px-6 border-b border-gray-200 dark:border-gray-800 gap-4 shrink-0 bg-gray-50/50 dark:bg-slate-800/50">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {t('assets.title')}
              </h1>
            </div>
            {canAddEdit && (
              <button
                onClick={() => navigate('/assets/new')}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors w-full sm:w-auto justify-center shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {t('assets.addAsset')}
              </button>
            )}
          </div>

          {/* Banner cảnh báo khi lọc warranty */}
          {warrantyExpiring && (
            <div className="px-4 sm:px-6 py-2.5 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">{t('assets.warrantyFilterBadge')}</span>
              </div>
              <button
                onClick={clearWarrantyFilter}
                className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-300 font-medium transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                {t('assets.warrantyFilterClear')}
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="p-4 border-b border-gray-150 dark:border-gray-800 shrink-0">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('assets.searchPlaceholder')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="md:w-48 shrink-0">
                <select
                  className="block w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors appearance-none cursor-pointer"
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setPage(0); }}
                >
                  <option value="">{t('assets.allCategories')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:w-48 shrink-0">
                <select
                  className="block w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors appearance-none cursor-pointer"
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setPage(0); }}
                >
                  <option value="">{t('assets.allStatuses')}</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>{t(`status.${s}`)}</option>
                  ))}
                </select>
              </div>

              {/* Nút toggle lọc bảo hành */}
              <button
                onClick={() => {
                  if (warrantyExpiring) {
                    setSearchParams({});
                  } else {
                    setSearchParams({ warrantyExpiring: 'true' });
                  }
                  setPage(0);
                }}
                className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                  warrantyExpiring
                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-amber-300 hover:text-amber-600 dark:hover:border-amber-700 dark:hover:text-amber-400'
                }`}
                title={t('assets.warrantyFilterBadge')}
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">
                  {warrantyExpiring ? t('assets.warrantyFilterClear') : t('assets.tableWarrantyExpiry')}
                </span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-gray-50/80 dark:bg-slate-800/80 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3">{t('assets.tableName')}</th>
                  <th className="px-6 py-3">{t('assets.tableCode')}</th>
                  <th className="px-6 py-3">{t('assets.tableCategory')}</th>
                  <th className="px-6 py-3">{t('assets.tableStatus')}</th>
                  <th className="px-6 py-3">{t('assets.tableUser')}</th>
                  {warrantyExpiring && (
                    <th className="px-6 py-3">{t('assets.tableWarrantyExpiry')}</th>
                  )}
                  <th className="px-6 py-3 text-right">{t('assets.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={warrantyExpiring ? 7 : 6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <span>{t('common.loading')}</span>
                      </div>
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan={warrantyExpiring ? 7 : 6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <Package className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                        <span className="font-medium">{t('assets.noData')}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {asset.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">
                        {asset.assetCode}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {asset.categoryName || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded border uppercase tracking-wider inline-flex items-center justify-center whitespace-nowrap ${getStatusColor(asset.status)}`}>
                          {t(`status.${asset.status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {asset.assignedTo || '-'}
                      </td>
                      {warrantyExpiring && (
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-700 dark:text-gray-300 text-xs">
                              {asset.warrantyExpiry
                                ? new Date(asset.warrantyExpiry).toLocaleDateString(currentLocale)
                                : '-'}
                            </span>
                            {asset.warrantyExpiry && getWarrantyBadge(asset.warrantyExpiry)}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/assets/${asset.id}`)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canAddEdit && (
                            <>
                              <button
                                onClick={() => navigate(`/assets/${asset.id}/edit`)}
                                className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 dark:hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setAssetToDelete(asset)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {!loading && assets.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {t('assets.pageInfo', { page: page + 1, totalPages: Math.max(1, totalPages) })}
                {totalElements > 0 && <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">{t('common.totalAssets', { count: totalElements })}</span>}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">Prev</span>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="hidden sm:inline text-sm font-medium">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {assetToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('common.confirmDeleteTitle', { defaultValue: "Xác nhận xóa tài sản" })}
              </h3>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {t('common.confirmDeleteMessage', {
                name: assetToDelete.name,
                defaultValue: `Bạn có chắc chắn muốn xóa tài sản "${assetToDelete.name}" không? Hành động này không thể hoàn tác.`
              })}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setAssetToDelete(null)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm cursor-pointer shadow-xs"
              >
                {t('assets.cancel', { defaultValue: "Hủy" })}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm cursor-pointer shadow-xs"
              >
                {t('common.delete', { defaultValue: "Xóa thiết bị" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetListPage;
