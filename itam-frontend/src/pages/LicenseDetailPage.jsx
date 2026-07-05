import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileKey, ArrowLeft, Key, UserPlus, RotateCcw, X, Info, ClipboardList, CheckCircle2 } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const LicenseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const role = currentUser?.role || 'EMPLOYEE';
  const canManage = role === 'SUPER_ADMIN' || role === 'IT_STAFF';

  const [license, setLicense] = useState(null);
  const [allocations, setAllocations] = useState([]);
  
  const [dropdownUsers, setDropdownUsers] = useState([]);
  const [allUsersForMap, setAllUsersForMap] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);

  const [loading, setLoading] = useState(true);

  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [allocateUserId, setAllocateUserId] = useState('');
  const [allocateNotes, setAllocateNotes] = useState('');
  const [submittingAllocate, setSubmittingAllocate] = useState(false);
  
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [allocationToRevoke, setAllocationToRevoke] = useState(null);
  const [submittingRevoke, setSubmittingRevoke] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [licenseRes, allocRes, usersRes] = await Promise.all([
        axiosClient.get(`/licenses/${id}`),
        axiosClient.get(`/licenses/${id}/allocations`),
        axiosClient.get('/users', { params: { size: 1000 } }) // Load up to 1000 users for lookup mapping
      ]);

      setLicense(licenseRes.data || licenseRes);
      
      const allocData = allocRes.data || allocRes;
      setAllocations(Array.isArray(allocData) ? allocData : (allocData.content || []));

      const usersData = usersRes?.content || [];
      setAllUsersForMap(usersData);
    } catch (error) {
      console.error('Error fetching license details:', error);
      showToast(t('licenses.noData'), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load dropdown
  const fetchDropdownUsers = async (searchVal = '') => {
    try {
      const response = await axiosClient.get('/users', {
        params: { search: searchVal, size: 50 }
      });
      setDropdownUsers(response?.content || []);
    } catch (error) {
      console.error('Error fetching dropdown users:', error);
    }
  };

  useEffect(() => {
    if (isAllocateModalOpen) {
      fetchDropdownUsers(debouncedSearch);
    }
  }, [isAllocateModalOpen, debouncedSearch]);

  const userMap = useMemo(() => {
    const map = {};
    allUsersForMap.forEach(u => {
      map[u.id] = {
        fullName: u.fullName || u.username,
        username: u.username
      };
    });
    return map;
  }, [allUsersForMap]);

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

  const maskKey = (key) => {
    if (!key) return '-';
    if (canManage) return key;
    return key.length > 4 ? `••••-••••-••••-${key.slice(-4)}` : '••••';
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!allocateUserId) return;

    setSubmittingAllocate(true);
    try {
      await axiosClient.post(`/licenses/${id}/allocate`, {
        userId: allocateUserId,
        notes: allocateNotes
      });
      showToast(t('licenses.allocateSuccess'), 'success');
      setIsAllocateModalOpen(false);
      setAllocateUserId('');
      setAllocateNotes('');
      fetchData();
    } catch (error) {
      console.error('Error allocating key:', error);
      showToast(t('licenses.allocateFailed'), 'error');
    } finally {
      setSubmittingAllocate(false);
    }
  };

  const handleRevokeSubmit = async () => {
    if (!allocationToRevoke) return;

    setSubmittingRevoke(true);
    try {
      await axiosClient.post(`/licenses/allocations/${allocationToRevoke.id}/return`);
      showToast(t('licenses.revokeSuccess'), 'success');
      setIsRevokeModalOpen(false);
      setAllocationToRevoke(null);
      fetchData();
    } catch (error) {
      console.error('Error revoking key:', error);
      showToast(t('licenses.revokeFailed'), 'error');
    } finally {
      setSubmittingRevoke(false);
    }
  };

  const openRevokeModal = (alloc) => {
    setAllocationToRevoke(alloc);
    setIsRevokeModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-50 dark:bg-slate-900/50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  if (!license) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-50 dark:bg-slate-900/50">
        <FileKey className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300">{t('licenses.notFound')}</h2>
        <button onClick={() => navigate('/licenses')} className="mt-4 text-indigo-600 hover:underline cursor-pointer">
          {t('assetDetail.back')}
        </button>
      </div>
    );
  }

  const activeAllocations = allocations.filter(a => !a.returnedAt);
  const seatsUsed = license.usedSeats ?? activeAllocations.length;
  const seatsTotal = license.totalSeats || 1;
  const seatsAvailable = Math.max(0, seatsTotal - seatsUsed);

  // Lấy danh sách users
  const usersWithActiveKeys = new Set(activeAllocations.map(a => a.userId));
  const availableUsers = dropdownUsers.filter(u => !usersWithActiveKeys.has(u.id));
  const selectedUser = allUsersForMap.find(u => u.id === allocateUserId);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-4 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/licenses')}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {license.licenseName}
            </h1>
          </div>
        </div>
        {canManage && seatsAvailable > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => {
                setIsAllocateModalOpen(true);
                setAllocateUserId('');
                setAllocateNotes('');
                setSearchTerm('');
                setIsOpenDropdown(false);
              }}
              className="flex-1 sm:flex-none flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors justify-center shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {t('licenses.allocateKey')}
            </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto w-full space-y-6">
        
        {/* Thông tin chi tiết */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 bg-gray-50/50 dark:bg-slate-800/50">
                <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <h2 className="font-semibold text-gray-900 dark:text-white">{t('assetDetail.generalInfo')}</h2>
              </div>
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('licenses.nameLabel')}</h3>
                  <p className="font-medium text-gray-900 dark:text-white">{license.licenseName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('licenses.codeLabel')}</h3>
                  <p className="font-mono text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded inline-block">
                    {license.licenseCode}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('licenses.licenseKeyLabel')}</h3>
                  <p className="font-mono text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded break-all border border-gray-200 dark:border-gray-700">
                    {maskKey(license.licenseKey)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('licenses.purchaseDateLabel')}</h3>
                  <p className="text-gray-900 dark:text-white">{formatDate(license.purchaseDate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('licenses.expirationDateLabel')}</h3>
                  <p className="text-gray-900 dark:text-white">{formatDate(license.expirationDate)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 bg-gray-50/50 dark:bg-slate-800/50">
                <Key className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <h2 className="font-semibold text-gray-900 dark:text-white">{t('licenses.keyStats')}</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('licenses.seatsTotal')}</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">{seatsTotal}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-900/50">
                  <span className="text-sm text-indigo-600 dark:text-indigo-400">{t('licenses.seatsUsed')}</span>
                  <span className="font-bold text-lg text-indigo-700 dark:text-indigo-300">{seatsUsed}</span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  seatsAvailable > 0 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-900/50' 
                    : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-900/50'
                }`}>
                  <span className={`text-sm ${seatsAvailable > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t('licenses.seatsAvailable')}
                  </span>
                  <span className={`font-bold text-lg ${seatsAvailable > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                    {seatsAvailable}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/*Danh sách đã phân bổ */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[300px]">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">{t('licenses.allocationTitle')}</h2>
            </div>
          </div>
          
          {allocations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('licenses.noAllocations')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4">{t('licenses.employee')}</th>
                    <th className="px-6 py-4">{t('licenses.allocatedAt')}</th>
                    <th className="px-6 py-4">{t('licenses.statusLabel')}</th>
                    <th className="px-6 py-4">{t('licenses.notes')}</th>
                    {canManage && <th className="px-6 py-4 text-right">{t('licenses.actions')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {allocations.map(alloc => {
                    const isReturned = !!alloc.returnedAt;
                    const employeeName = userMap[alloc.userId]?.fullName || alloc.userId;
                    const usernameVal = userMap[alloc.userId]?.username ? ` (${userMap[alloc.userId]?.username})` : '';
                    
                    return (
                      <tr key={alloc.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {employeeName}{usernameVal}
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                          {formatDate(alloc.allocatedAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            isReturned 
                              ? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:border-gray-700'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50'
                          }`}>
                            {isReturned ? (
                              t('licenses.returned')
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {t('licenses.inUse')}
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate" title={alloc.notes}>
                          {alloc.notes || '-'}
                        </td>
                        {canManage && (
                          <td className="px-6 py-4 text-right">
                            {!isReturned && (
                              <button 
                                onClick={() => openRevokeModal(alloc)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:border-red-900/50 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                {t('licenses.revokeKey')}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
      </div>

      {/* Allocate Modal */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-md flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {t('licenses.allocateKey')}
              </h2>
              <button onClick={() => setIsAllocateModalOpen(false)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              <div className="space-y-1.5 relative">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('licenses.employee')} <span className="text-red-500">*</span>
                </label>
                
                {/* Search Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsOpenDropdown(!isOpenDropdown)}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors text-left text-gray-900 dark:text-white cursor-pointer flex justify-between items-center"
                  >
                    <span>
                      {selectedUser 
                        ? `${selectedUser.fullName || selectedUser.username} (${selectedUser.username})` 
                        : t('licenses.selectEmployee')}
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
                          {availableUsers.length === 0 ? (
                            <div className="p-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                              {t('allocation.noUsers')}
                            </div>
                          ) : (
                            availableUsers.map(u => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  setAllocateUserId(u.id);
                                  setIsOpenDropdown(false);
                                  setSearchTerm('');
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-800 dark:text-gray-200 flex flex-col gap-0.5 cursor-pointer transition-colors ${
                                  allocateUserId === u.id ? 'bg-indigo-50/70 dark:bg-indigo-900/20 font-medium' : ''
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

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('licenses.notes')}
                </label>
                <textarea
                  rows="3"
                  value={allocateNotes}
                  onChange={(e) => setAllocateNotes(e.target.value)}
                  placeholder={t('licenses.notesPlaceholder')}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-colors dark:text-white"
                />
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  disabled={submittingAllocate}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingAllocate || !allocateUserId}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submittingAllocate ? '...' : t('licenses.confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke nodal */}
      {isRevokeModalOpen && allocationToRevoke && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('licenses.confirmRevokeTitle')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t('licenses.confirmRevokeMessage', { name: userMap[allocationToRevoke.userId]?.fullName || allocationToRevoke.userId })}
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsRevokeModalOpen(false)}
                disabled={submittingRevoke}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleRevokeSubmit}
                disabled={submittingRevoke}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {submittingRevoke ? '...' : t('licenses.revoke')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LicenseDetailPage;
