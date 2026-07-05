import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { UserCheck, ArrowLeftRight, ArrowRightLeft, X, Upload, Trash2, ExternalLink, FileText } from 'lucide-react';
import axiosClient, { getHostUrl } from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const AllocationModal = ({ isOpen, onClose, onSuccess, asset, action }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toUserId, setToUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [handoverDocUrl, setHandoverDocUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('entityType', 'ALLOCATION');

    try {
      const response = await axiosClient.post('/attachments', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const data = response.data || response;
      const fileUrl = data.fileUrl || (data.data && data.data.fileUrl);
      setHandoverDocUrl(fileUrl);
      showToast(t('common.uploadSuccess') || 'Tải tệp tin lên thành công!', 'success');
    } catch (error) {
      console.error('File upload error:', error);
      showToast(t('common.uploadFailed') || 'Tải tệp tin lên thất bại.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const host = getHostUrl();
    return host ? host + path : path;
  };

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchUsers = useCallback(async (searchVal = '') => {
    setLoadingUsers(true);
    try {
      const response = await axiosClient.get('/users', {
        params: { search: searchVal, size: 50 }
      });
      const usersData = response?.content || [];
      setUsers(usersData.filter(u => u.id !== asset?.assignedToId));
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast(t('allocation.loadUsersFailed'), 'error');
    } finally {
      setLoadingUsers(false);
    }
  }, [asset?.assignedToId, showToast, t]);

  useEffect(() => {
    if (isOpen && (action === 'ASSIGN' || action === 'TRANSFER')) {
      fetchUsers(debouncedSearch);
    }
  }, [isOpen, debouncedSearch, action, fetchUsers]);

  useEffect(() => {
    if (isOpen) {
      setToUserId('');
      setNotes('');
      setHandoverDocUrl('');
      setSearchTerm('');
      setIsOpenDropdown(false);
    }
  }, [isOpen]);

  const selectedUser = users.find(u => u.id === toUserId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!asset?.id) return;
    setSubmitting(true);
    try {
      if (action === 'ASSIGN') {
        await axiosClient.post('/allocations', { assetId: asset.id, toUserId, notes, handoverDocUrl });
        showToast(t('allocation.assignSuccess'), 'success');
      } else if (action === 'RETURN') {
        await axiosClient.post(`/assets/${asset.id}/return`, null, { params: { notes } });
        showToast(t('allocation.returnSuccess'), 'success');
      } else if (action === 'TRANSFER') {
        await axiosClient.post('/allocations/transfers', { assetId: asset.id, toUserId, notes });
        showToast(t('allocation.transferSuccess'), 'success');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Allocation error:', error);
      if (action === 'ASSIGN') showToast(t('allocation.assignFailed'), 'error');
      else if (action === 'RETURN') showToast(t('allocation.returnFailed'), 'error');
      else showToast(t('allocation.transferFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const config = {
    ASSIGN:   { title: t('allocation.assignTitle'),   Icon: UserCheck,      iconColor: 'text-indigo-600 dark:text-indigo-400', btnColor: 'bg-indigo-600 hover:bg-indigo-700', confirmLabel: t('allocation.confirmAssign') },
    RETURN:   { title: t('allocation.returnTitle'),   Icon: ArrowLeftRight,  iconColor: 'text-amber-600 dark:text-amber-400',   btnColor: 'bg-amber-600 hover:bg-amber-700',   confirmLabel: t('allocation.confirmReturn') },
    TRANSFER: { title: t('allocation.transferTitle'), Icon: ArrowRightLeft,  iconColor: 'text-blue-600 dark:text-blue-400',     btnColor: 'bg-blue-600 hover:bg-blue-700',     confirmLabel: t('allocation.confirmTransfer') },
  }[action] || {};

  const { title, Icon, iconColor, btnColor, confirmLabel } = config;
  const needsUser = action === 'ASSIGN' || action === 'TRANSFER';

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
            {title}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {needsUser && (
            <div className="space-y-1.5 relative">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('allocation.toUserLabel')} <span className="text-red-500">*</span>
              </label>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsOpenDropdown(!isOpenDropdown)}
                  disabled={loadingUsers}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors text-left text-gray-900 dark:text-white cursor-pointer flex justify-between items-center"
                >
                  <span>
                    {selectedUser 
                      ? `${selectedUser.fullName || selectedUser.username} (${selectedUser.username})` 
                      : (loadingUsers ? '...' : t('allocation.selectUser'))}
                  </span>
                  <span className="text-gray-400">▼</span>
                </button>

                {isOpenDropdown && (
                  <>
                    <div className="fixed inset-0 z-20 cursor-default" onClick={() => setIsOpenDropdown(false)} />
                    <div className="absolute z-30 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex flex-col overflow-hidden max-h-[min(24rem,calc(90vh-12rem))]">
                      <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900/50">
                        <input
                          type="text"
                          placeholder={t('allocation.searchUserPlaceholder')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-md text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {users.length === 0 ? (
                          <div className="p-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                            {t('allocation.noUsers')}
                          </div>
                        ) : (
                          users.map(u => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setToUserId(u.id);
                                setIsOpenDropdown(false);
                                setSearchTerm('');
                              }}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-800 dark:text-gray-200 flex flex-col gap-0.5 cursor-pointer transition-colors ${
                                toUserId === u.id ? 'bg-indigo-50/70 dark:bg-indigo-900/20 font-medium' : ''
                              }`}
                            >
                              <span>{u.fullName || u.username}</span>
                              <span className="text-[10px] text-gray-400 font-mono">@{u.username} • {u.email}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('allocation.notesLabel')}</label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('allocation.notesPlaceholder')}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-colors text-gray-900 dark:text-white"
            />
          </div>

          {action === 'ASSIGN' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('allocation.handoverDocLabel')}</label>
              
              {handoverDocUrl ? (
                <div className="flex items-center justify-between gap-3 p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 min-w-0">
                    <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span className="truncate max-w-[180px] sm:max-w-[260px] dark:text-white">
                      {handoverDocUrl.split('/').pop().substring(37)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={getFileUrl(handoverDocUrl)}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                      title="Xem tệp tin"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setHandoverDocUrl('')}
                      className="p-1.5 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Xóa tệp tin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    id="handoverDocFile"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    accept="image/*,application/pdf"
                  />
                  <label
                    htmlFor="handoverDocFile"
                    className={`flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-500/5 transition-all cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    ) : (
                      <Upload className="w-4 h-4 text-indigo-500" />
                    )}
                    {uploading ? t('common.uploading') || 'Đang tải lên...' : t('common.uploadFile') || 'Tải lên biên bản bàn giao (Ảnh/PDF)'}
                  </label>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center gap-3">
            <button type="button" onClick={onClose} disabled={submitting} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm cursor-pointer">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={submitting || (needsUser && !toUserId)} className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer ${btnColor}`}>
              {submitting ? '...' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AllocationModal;
