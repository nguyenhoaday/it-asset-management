import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Search, X, ChevronLeft, ChevronRight, Mail, ShieldAlert, KeyRound, Building, Edit2, CheckCircle2, XCircle, Copy, Check, Star, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const UserManagementPage = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);

  // Filter/sort
  const [departmentId, setDepartmentId] = useState('');
  const [isActive, setIsActive] = useState('');
  const [sortBy, setSortBy] = useState('fullName');
  const [sortDirection, setSortDirection] = useState('asc');

  const [departments, setDepartments] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [tempPasswordModal, setTempPasswordModal] = useState({ open: false, username: '', password: '' });
  const [userToReset, setUserToReset] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleResetClick = (user) => {
    setUserToReset(user);
  };

  const confirmResetPassword = async () => {
    if (!userToReset) return;
    try {
      setLoading(true);
      const res = await axiosClient.post(`/users/${userToReset.id}/reset-password`);
      showToast(t('users.resetPasswordSuccess'), 'success');
      const targetUser = userToReset;
      setUserToReset(null);
      setTempPasswordModal({
        open: true,
        username: targetUser.username,
        password: res.data || res
      });
    } catch (err) {
      console.error('Error resetting password:', err);
      showToast(err.response?.data?.message || t('common.unknownError'), 'error');
      setUserToReset(null);
    } finally {
      setLoading(false);
    }
  };

  const copyTempPassword = () => {
    navigator.clipboard.writeText(tempPasswordModal.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const initialFormState = {
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    departmentId: '',
    isActive: true
  };
  
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/users', {
        params: { 
          search: debouncedSearch,
          departmentId: departmentId || undefined,
          isActive: isActive !== '' ? isActive === 'true' : undefined,
          sortBy,
          sortDirection,
          page, 
          size: pageSize 
        }
      });
      
      const data = response.data || response;
      
      if (data.content) {
        setUsers(data.content);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || data.content.length);
      } else if (Array.isArray(data)) {
        setUsers(data);
        setTotalPages(1);
        setTotalElements(data.length);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load users
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, departmentId, isActive, sortBy, sortDirection, page, pageSize]);

  // Load departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axiosClient.get('/departments');
        const data = response.data || response;
        if (Array.isArray(data)) {
          setDepartments(data);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
    setPage(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'isActive' ? value === 'true' : value 
    }));
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    let deptId = '';
    if (user.departmentName && departments.length > 0) {
      const matched = departments.find(d => d.name === user.departmentName);
      if (matched) {
        deptId = matched.id;
      }
    }

    setFormData({
      fullName: user.fullName || '',
      username: user.username || '',
      email: user.email || '',
      password: '', 
      role: user.role || 'EMPLOYEE',
      departmentId: deptId,
      isActive: user.isActive !== undefined ? user.isActive : true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        // Edit mode
        const updatePayload = {
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          departmentId: formData.departmentId || null,
          isActive: formData.isActive
        };
        await axiosClient.patch(`/users/${editingUser.id}`, updatePayload);
        showToast(t('users.updateSuccess'), 'success');
      } else {
        // Create mode
        const createPayload = { ...formData };
        if (!createPayload.departmentId) delete createPayload.departmentId;
        delete createPayload.isActive;
        await axiosClient.post('/auth/register', createPayload);
        showToast(t('users.createSuccess'), 'success');
      }
      setIsModalOpen(false);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Save error:', error);
      showToast(editingUser ? t('users.updateFailed') : t('users.createFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/50">
            <ShieldAlert className="w-3.5 h-3.5" />
            SUPER ADMIN
          </span>
        );
      case 'IT_STAFF':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50">
            <KeyRound className="w-3.5 h-3.5" />
            IT STAFF
          </span>
        );
      case 'EMPLOYEE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-900/50">
            <Users className="w-3.5 h-3.5" />
            EMPLOYEE
          </span>
        );
    }
  };

  const getStatusBadge = (isActive) => {
    if (isActive !== false) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t('users.active')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/50">
        <XCircle className="w-3.5 h-3.5" />
        {t('users.inactive')}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 sm:p-6">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full min-h-0">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col h-full min-h-0 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 py-4 px-6 bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-800 shrink-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {t('users.title')}
            </h1>
            <button 
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {t('users.createBtn')}
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0 flex flex-col gap-4">
            {/* Filter */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <div className="relative flex-1 sm:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('users.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                />
              </div>
              <select
                value={departmentId}
                onChange={(e) => { setDepartmentId(e.target.value); setPage(0); }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">-- {t('users.department')} --</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              <select
                value={isActive}
                onChange={(e) => { setIsActive(e.target.value); setPage(0); }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">-- {t('users.status')} --</option>
                <option value="true">{t('users.active')}</option>
                <option value="false">{t('users.inactive')}</option>
              </select>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                    <tr>
                      <th 
                        className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => handleSort('fullName')}
                      >
                        <div className="flex items-center gap-2">
                          {t('users.fullName')}
                          {sortBy === 'fullName' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 text-indigo-500" /> : <ArrowDown className="w-4 h-4 text-indigo-500" />
                          ) : <ArrowUpDown className="w-4 h-4 opacity-50" />}
                        </div>
                      </th>
                      <th className="px-6 py-4">{t('users.username')}</th>
                      <th className="px-6 py-4">{t('users.email')}</th>
                      <th className="px-6 py-4">{t('users.role')}</th>
                      <th className="px-6 py-4">{t('users.department')}</th>
                      <th className="px-6 py-4">{t('users.isActive')}</th>
                      <th 
                        className="px-6 py-4 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => handleSort('ui.careScore')}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {t('users.careScore')}
                          {sortBy === 'ui.careScore' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 text-indigo-500" /> : <ArrowDown className="w-4 h-4 text-indigo-500" />
                          ) : <ArrowUpDown className="w-4 h-4 opacity-50" />}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {user.fullName}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                          @{user.username}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-gray-400" />
                            {user.departmentName || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(user.isActive)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 rounded-full">
                            <Star className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
                            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                              {user.careScore ?? 100}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleResetClick(user)}
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                              title={t('users.resetPasswordTooltip')}
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                              title={t('common.edit')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          {t('users.noData')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Phân trang */}
            {totalPages > 0 && (
              <div className="flex items-center justify-between shrink-0 pt-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('common.pageInfo', { page: page + 1, totalPages })}
                  {totalElements > 0 && <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">{t('common.totalUsers', { count: totalElements })}</span>}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto flex flex-col relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              {editingUser ? (
                <>
                  <Edit2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  {t('common.edit')}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  {t('users.createBtn')}
                </>
              )}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('users.fullName')}
                </label>
                <input
                  required
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('users.username')}
                </label>
                <input
                  required
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('users.email')}
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {!editingUser && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('users.password')}
                  </label>
                  <input
                    required
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('users.role')}
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="IT_STAFF">IT_STAFF</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('users.department')}
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">-- {t('users.department')} --</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editingUser && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('users.isActive')}
                  </label>
                  <select
                    name="isActive"
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="true">{t('users.active')}</option>
                    <option value="false">{t('users.inactive')}</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? '...' : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal hiển thị mật khẩu tạm */}
      {tempPasswordModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl sm:max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {t('users.tempPasswordModalTitle')}
                </h3>
              </div>
              <button
                onClick={() => setTempPasswordModal({ open: false, username: '', password: '' })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('users.tempPasswordModalSubtitle', { username: tempPasswordModal.username })}
              </p>

              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                <code className="flex-1 font-mono text-base font-bold text-amber-900 dark:text-amber-300 text-center select-all">
                  {tempPasswordModal.password}
                </code>
                <button
                  type="button"
                  onClick={copyTempPassword}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('users.copied') : t('users.copyPassword')}
                </button>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => setTempPasswordModal({ open: false, username: '', password: '' })}
                className="w-full py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium text-sm transition-colors cursor-pointer"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận đặt lại mật khẩu */}
      {userToReset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl sm:max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {t('users.confirmResetTitle')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">@{userToReset.username}</p>
              </div>
            </div>

            <p className="py-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('users.confirmResetMessage', { username: userToReset.username })}
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToReset(null)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmResetPassword}
                disabled={loading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors font-medium text-sm flex items-center gap-2 shadow-md shadow-amber-600/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? '...' : t('users.resetPasswordTooltip')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
