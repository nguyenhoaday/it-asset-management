import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, CheckCircle, XCircle, Filter, ChevronLeft, ChevronRight, ArrowRightLeft, UserPlus, X, AlertCircle, ArchiveRestore } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const RequestListPage = () => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const [allocations, setAllocations] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const [usersMap, setUsersMap] = useState({});
  const [assetsMap, setAssetsMap] = useState({});

  const [loading, setLoading] = useState(true);

  // Modal confirm/reject bàn giao
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedAlloc, setSelectedAlloc] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchLookupData = useCallback(async () => {
    try {
      const [usersRes, assetsRes] = await Promise.all([
        axiosClient.get('/users?size=1000'),
        axiosClient.get('/assets?size=1000')
      ]);

      const usersList = Array.isArray(usersRes) ? usersRes : (usersRes.data || usersRes.content || []);
      const newUsersMap = {};
      usersList.forEach(u => {
        newUsersMap[u.id] = u.fullName || u.username;
      });
      setUsersMap(newUsersMap);

      const assetsList = Array.isArray(assetsRes) ? assetsRes : (assetsRes.data || assetsRes.content || []);
      const newAssetsMap = {};
      assetsList.forEach(a => {
        newAssetsMap[a.id] = { name: a.name, code: a.assetCode };
      });
      setAssetsMap(newAssetsMap);

    } catch (error) {
      console.error('Error fetching lookup data:', error);
    }
  }, []);

  const fetchAllocations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('size', size);
      if (statusFilter && statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      const response = await axiosClient.get(`/allocations?${params.toString()}`);

      setAllocations(response.content || []);
      setTotalPages(response.totalPages || 1);
      setTotalElements(response.totalElements || 0);

      if (response.page !== undefined) {
        setPage(response.page);
      }

    } catch (error) {
      console.error('Error fetching allocations:', error);
      showToast(t('requests.noData'), 'error');
    } finally {
      setLoading(false);
    }
  }, [page, size, statusFilter, showToast, t]);

  useEffect(() => {
    fetchLookupData().then(() => fetchAllocations());
  }, [fetchLookupData, fetchAllocations]);

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handlePrevPage = () => {
    if (page > 0) setPage(p => p - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) setPage(p => p + 1);
  };

  const handleConfirmAsset = async () => {
    if (!selectedAlloc) return;
    setSubmitting(true);
    try {
      await axiosClient.post(`/allocations/${selectedAlloc.id}/confirm`);
      showToast(t('myAssets.confirmSuccess'), 'success');
      setIsConfirmModalOpen(false);
      setSelectedAlloc(null);
      fetchAllocations();
    } catch (error) {
      console.error('Error confirming asset:', error);
      showToast(t('myAssets.confirmFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectAsset = async () => {
    if (!selectedAlloc) return;
    setSubmitting(true);
    try {
      await axiosClient.post(`/allocations/${selectedAlloc.id}/reject`);
      showToast(t('myAssets.rejectSuccess'), 'success');
      setIsRejectModalOpen(false);
      setSelectedAlloc(null);
      fetchAllocations();
    } catch (error) {
      console.error('Error rejecting asset:', error);
      showToast(t('myAssets.rejectFailed'), 'error');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-4 p-4 sm:p-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              {t('requests.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('requests.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm cursor-pointer"
              >
                <option value="ALL">{t('requests.allStatuses')}</option>
                <option value="PENDING">{t('requests.pending')}</option>
                <option value="CONFIRMED">{t('requests.confirmed')}</option>
                <option value="REJECTED">{t('requests.rejected')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* list */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm flex flex-col min-h-[400px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : allocations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('requests.noData')}</h3>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4">{t('requests.assetName')}</th>
                      <th className="px-6 py-4">{t('requests.assetCode')}</th>
                      <th className="px-6 py-4">{t('requests.actionType')}</th>
                      <th className="px-6 py-4">{t('requests.fromUser')}</th>
                      <th className="px-6 py-4">{t('requests.toUser')}</th>
                      <th className="px-6 py-4">{t('requests.eventTime')}</th>
                      <th className="px-6 py-4">{t('requests.status')}</th>
                      <th className="px-6 py-4">{t('requests.notes')}</th>
                      <th className="px-6 py-4 text-right">{t('common.actions') || t('myAssets.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {allocations.map(alloc => {
                      const isPending = alloc.confirmationStatus === 'PENDING';
                      const isConfirmed = alloc.confirmationStatus === 'CONFIRMED';
                      const isRejected = alloc.confirmationStatus === 'REJECTED';

                      const isAssign = alloc.actionType === 'ASSIGN';
                      const isTransfer = alloc.actionType === 'TRANSFER';
                      const isReturn = alloc.actionType === 'RETURN';

                      const assetInfo = assetsMap[alloc.assetId] || { name: '-', code: '-' };
                      const fromUserName = alloc.fromUserId ? (usersMap[alloc.fromUserId] || alloc.fromUserId) : '-';
                      const toUserName = alloc.toUserId ? (usersMap[alloc.toUserId] || alloc.toUserId) : '-';

                      // Chỉ có thể xác nhận nếu pending và là chính user đó
                      const canAction = isPending && currentUser && alloc.toUserId === currentUser.id;

                      return (
                        <tr key={alloc.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            {assetInfo.name}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                            {assetInfo.code}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                              {isAssign && <UserPlus className="w-4 h-4 text-emerald-500" />}
                              {isTransfer && <ArrowRightLeft className="w-4 h-4 text-blue-500" />}
                              {isReturn && <ArchiveRestore className="w-4 h-4 text-amber-500" />}
                              <span>{isAssign ? t('requests.actionAssign') : isTransfer ? t('requests.actionTransfer') : isReturn ? t('requests.actionReturn') : alloc.actionType}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                            {fromUserName}
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                            {toUserName}
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                            {formatDate(alloc.eventTime)}
                          </td>
                          <td className="px-6 py-4">
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50">
                                <Clock className="w-3.5 h-3.5" />
                                {t('requests.pending')}
                              </span>
                            )}
                            {isConfirmed && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {t('requests.confirmed')}
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-900/50">
                                <XCircle className="w-3.5 h-3.5" />
                                {t('requests.rejected')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate" title={alloc.notes}>
                            {alloc.notes || '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {canAction ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => { setSelectedAlloc(alloc); setIsConfirmModalOpen(true); }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  {t('myAssets.confirm')}
                                </button>
                                <button
                                  onClick={() => { setSelectedAlloc(alloc); setIsRejectModalOpen(true); }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:border-red-900/50 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                                >
                                  <XCircle className="w-3 h-3" />
                                  {t('myAssets.reject')}
                                </button>
                              </div>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phân trang */}
              {allocations.length > 0 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t('assets.pageInfo', { page: page + 1, totalPages: totalPages })}
                    {totalElements > 0 && <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">{t('common.totalRequests', { count: totalElements })}</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={page === 0}
                      className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={page >= totalPages - 1}
                      className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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

      {/* Confirm modal */}
      {isConfirmModalOpen && selectedAlloc && (
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
              {t('myAssets.confirmMessage', { name: assetsMap[selectedAlloc.assetId]?.name || '' })}
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

      {/* Reject modal */}
      {isRejectModalOpen && selectedAlloc && (
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
              {t('myAssets.rejectMessage', { name: assetsMap[selectedAlloc.assetId]?.name || '' })}
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

export default RequestListPage;
