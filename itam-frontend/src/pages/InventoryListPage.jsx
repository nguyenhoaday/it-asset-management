import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, QrCode, Plus, XCircle, AlertCircle, FileText, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const InventoryListPage = () => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const canScan = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'IT_STAFF';

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [submittingClose, setSubmittingClose] = useState(false);

  const fetchActiveSession = useCallback(async () => {
    try {
      const response = await axiosClient.get('/inventory-sessions/active');
      const data = response.data || response;
      if (data && data.id) {
        setActiveSession(data);
      } else {
        setActiveSession(null);
      }
    } catch (error) {
      setActiveSession(null);
      if (error.response?.status !== 404) {
        console.error('Error fetching active session:', error);
      }
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('size', size);

      const response = await axiosClient.get(`/inventory-sessions?${params.toString()}`);
      setSessions(response.content || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showToast(t('inventory.scanFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }, [page, size, showToast, t]);

  useEffect(() => {
    fetchActiveSession();
    fetchSessions();
  }, [fetchActiveSession, fetchSessions]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle) return;

    setSubmittingCreate(true);
    try {
      await axiosClient.post('/inventory-sessions', { title: newTitle });
      showToast(t('inventory.createSuccess'), 'success');
      setIsCreateModalOpen(false);
      setNewTitle('');
      fetchActiveSession();
      fetchSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      showToast(t('inventory.createFailed'), 'error');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;

    setSubmittingClose(true);
    try {
      await axiosClient.patch(`/inventory-sessions/${activeSession.id}`);
      showToast(t('inventory.closeSuccess'), 'success');
      setIsCloseModalOpen(false);
      fetchActiveSession();
      fetchSessions();
    } catch (error) {
      console.error('Error closing session:', error);
      showToast(t('inventory.closeFailed'), 'error');
    } finally {
      setSubmittingClose(false);
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
      <div className="max-w-7xl mx-auto w-full space-y-6 p-4 sm:p-6 flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {t('inventory.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('inventory.subtitle')}
            </p>
          </div>
        </div>

        {/* Active session */}
        <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            {t('inventory.activeSession')}
          </h2>
          
          {activeSession ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-900/30 rounded-xl">
              <div>
                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300">
                  {activeSession.title}
                </h3>
                <p className="text-sm text-indigo-700/70 dark:text-indigo-400/70 mt-1">
                  {t('inventory.createdAt')}: {formatDate(activeSession.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => navigate(`/inventory/${activeSession.id}/report`)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  {t('inventory.viewProgress') || 'Xem tiến độ'}
                </button>
                {canScan && (
                  <button
                    onClick={() => navigate('/inventory/scan')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <QrCode className="w-4 h-4 shrink-0" />
                    {t('inventory.startScan')}
                  </button>
                )}
                {isSuperAdmin && (
                  <button
                    onClick={() => setIsCloseModalOpen(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4 shrink-0" />
                    {t('inventory.closeSession')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gray-50 dark:bg-slate-800/50 rounded-xl text-center sm:text-left border border-dashed border-gray-300 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">{t('inventory.noActiveSession')}</p>
                </div>
              </div>
              {isSuperAdmin && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  {t('inventory.createSession')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Lịch sử kiểm kê */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden min-h-[400px]">
          <div className="p-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 bg-gray-50/50 dark:bg-slate-800/50">
            <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">{t('inventory.history')}</h2>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <ClipboardCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Không có dữ liệu lịch sử</h3>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4">{t('inventory.sessionName')}</th>
                      <th className="px-6 py-4">{t('inventory.status')}</th>
                      <th className="px-6 py-4">{t('inventory.createdAt')}</th>
                      <th className="px-6 py-4">{t('inventory.closedAt')}</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {sessions.map(session => {
                      const isActive = session.status === 'ACTIVE';
                      
                      return (
                        <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            {session.title}
                          </td>
                          <td className="px-6 py-4">
                            {isActive ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50">
                                {t('inventory.active')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:border-gray-700">
                                {t('inventory.closed')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                            {formatDate(session.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                            {formatDate(session.closedAt)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => navigate(`/inventory/${session.id}/report`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {isActive ? (t('inventory.viewProgress') || 'Xem tiến độ') : (t('inventory.viewReport') || 'Xem báo cáo')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Trang <span className="font-medium text-gray-900 dark:text-white">{page + 1}</span> / <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Create modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-md flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {t('inventory.createSession')}
              </h2>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('inventory.sessionTitle')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t('inventory.enterSessionTitle')}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                />
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={submittingCreate}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate || !newTitle.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submittingCreate ? '...' : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close confirm */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('inventory.closeSession')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t('inventory.closeConfirm')}
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                disabled={submittingClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleCloseSession}
                disabled={submittingClose}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submittingClose ? '...' : t('inventory.closeSession')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryListPage;
