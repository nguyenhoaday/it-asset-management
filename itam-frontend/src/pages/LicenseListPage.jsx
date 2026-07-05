import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FileKey, Plus, Edit, Trash2, Search, X, ChevronLeft, ChevronRight, AlertCircle, Upload, ExternalLink, FileText, Eye } from 'lucide-react';
import axiosClient, { getHostUrl } from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const LicenseListPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || 'EMPLOYEE';
  const canManage = role === 'SUPER_ADMIN' || role === 'IT_STAFF';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const size = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const [formData, setFormData] = useState({
    licenseName: '',
    licenseCode: '',
    licenseKey: '',
    totalSeats: 1,
    purchaseCost: '',
    purchaseDate: '',
    expirationDate: '',
    purchaseInvoiceUrl: ''
  });
  const [saving, setSaving] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [licenseToDelete, setLicenseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('entityType', 'LICENSE');
    if (editingLicense) {
      uploadData.append('entityId', editingLicense.id);
    }

    try {
      const response = await axiosClient.post('/attachments', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const data = response.data || response;
      const fileUrl = data.fileUrl || (data.data && data.data.fileUrl);
      setFormData(prev => ({ ...prev, purchaseInvoiceUrl: fileUrl }));
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
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page
  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/licenses', {
        params: {
          search: debouncedSearch,
          status: statusFilter,
          page,
          size
        }
      });
      const resData = response.data || response;
      if (resData && resData.content) {
        setLicenses(resData.content);
        setTotalPages(resData.totalPages || 1);
        setTotalElements(resData.totalElements || resData.content.length);
      } else if (Array.isArray(resData)) {
        setLicenses(resData);
        setTotalPages(1);
        setTotalElements(resData.length);
      } else {
        setLicenses([]);
        setTotalElements(0);
      }
    } catch (error) {
      console.error('Error fetching licenses:', error);
      showToast(t('licenses.noData'), 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, page, size]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const getLicenseStatus = (expirationDate) => {
    if (!expirationDate) return { label: t('licenses.statusUnknown'), color: 'bg-gray-100 text-gray-800 border-gray-200' };
    
    const now = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: t('licenses.statusExpired'), color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-900/50' };
    } else if (diffDays <= 30) {
      return { label: t('licenses.statusExpiringSoon'), color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50' };
    } else {
      return { label: t('licenses.statusValid'), color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50' };
    }
  };

  const openAddModal = () => {
    setEditingLicense(null);
    setFormData({
      licenseName: '',
      licenseCode: '',
      licenseKey: '',
      totalSeats: 1,
      purchaseCost: '',
      purchaseDate: '',
      expirationDate: '',
      purchaseInvoiceUrl: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (e, lic) => {
    e.stopPropagation();
    setEditingLicense(lic);
    setFormData({
      licenseName: lic.licenseName || '',
      licenseCode: lic.licenseCode || '',
      licenseKey: lic.licenseKey || '',
      totalSeats: lic.totalSeats || 1,
      purchaseCost: lic.purchaseCost || '',
      purchaseDate: lic.purchaseDate ? lic.purchaseDate.substring(0, 10) : '',
      expirationDate: lic.expirationDate ? lic.expirationDate.substring(0, 10) : '',
      purchaseInvoiceUrl: lic.purchaseInvoiceUrl || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'licenseCode') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        totalSeats: parseInt(formData.totalSeats, 10),
        purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : null
      };

      if (editingLicense) {
        await axiosClient.patch(`/licenses/${editingLicense.id}`, payload);
      } else {
        await axiosClient.post('/licenses', payload);
      }
      
      showToast(t('licenses.saveSuccess'), 'success');
      closeModal();
      fetchLicenses();
    } catch (error) {
      console.error('Error saving license:', error);
      showToast(t('licenses.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (e, lic) => {
    e.stopPropagation();
    setLicenseToDelete(lic);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setLicenseToDelete(null);
  };

  const handleDelete = async () => {
    if (!licenseToDelete) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/licenses/${licenseToDelete.id}`);
      showToast(t('licenses.deleteSuccess'), 'success');
      closeDeleteModal();
      fetchLicenses();
    } catch (error) {
      console.error('Error deleting license:', error);
      showToast(t('licenses.deleteFailed'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Intl.DateTimeFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
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

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-4 p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileKey className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              {t('licenses.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('licenses.subtitle')}
            </p>
          </div>
          {canManage && (
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors w-full sm:w-auto justify-center shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t('licenses.addLicense')}
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder={t('assets.searchPlaceholder')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors dark:text-white cursor-pointer"
          >
            <option value="">{t('common.allStatus', 'Tất cả trạng thái')}</option>
            <option value="VALID">{t('licenses.statusValid', 'Hợp lệ')}</option>
            <option value="EXPIRING_SOON">{t('licenses.statusExpiringSoon', 'Sắp hết hạn')}</option>
            <option value="EXPIRED">{t('licenses.statusExpired', 'Đã hết hạn')}</option>
          </select>
        </div>

        {/* Card List */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : licenses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <FileKey className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('licenses.noData')}</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4">{t('licenses.nameLabel')}</th>
                    <th className="px-6 py-4">{t('licenses.codeLabel')}</th>
                    <th className="px-6 py-4">{t('licenses.licenseKeyLabel')}</th>
                    <th className="px-6 py-4">{t('licenses.seatsLabel')}</th>
                    <th className="px-6 py-4">{t('licenses.expirationDateLabel')}</th>
                    <th className="px-6 py-4">{t('licenses.statusLabel')}</th>
                    {canManage && <th className="px-6 py-4 text-right">{t('licenses.actions')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {licenses.map(lic => {
                    const status = getLicenseStatus(lic.expirationDate);
                    const allocated = lic.usedSeats || 0;
                    
                    return (
                      <tr 
                        key={lic.id} 
                        onClick={() => navigate(`/licenses/${lic.id}`)}
                        className="hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {lic.licenseName}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                          {lic.licenseCode}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                          {maskKey(lic.licenseKey)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{allocated}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-500">{lic.totalSeats}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                          {formatDate(lic.expirationDate)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        {canManage && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/licenses/${lic.id}`);
                                }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 rounded transition-colors cursor-pointer"
                                title="Xem chi tiết"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => openEditModal(e, lic)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 rounded transition-colors cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {isSuperAdmin && (
                                <button 
                                  onClick={(e) => openDeleteModal(e, lic)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded transition-colors cursor-pointer"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && licenses.length > 0 && (
            <div className="mt-auto border-t border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('assets.pageInfo', { page: page + 1, totalPages })}
                {totalElements > 0 && <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">{t('common.totalLicenses', { count: totalElements })}</span>}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-colors bg-transparent cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-colors bg-transparent cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileKey className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {editingLicense ? t('licenses.editTitle') : t('licenses.addTitle')}
              </h2>
              <button onClick={closeModal} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('licenses.nameLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="licenseName"
                    required
                    value={formData.licenseName}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors dark:text-white"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('licenses.codeLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="licenseCode"
                    required
                    value={formData.licenseCode}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono transition-colors dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('licenses.licenseKeyLabel')}
                  </label>
                  <input
                    type="text"
                    name="licenseKey"
                    value={formData.licenseKey}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none font-mono transition-colors dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('licenses.totalSeatsLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="totalSeats"
                    min="1"
                    required
                    value={formData.totalSeats}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('licenses.purchaseCostLabel')}
                  </label>
                  <input
                    type="number"
                    name="purchaseCost"
                    step="0.01"
                    value={formData.purchaseCost}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('licenses.purchaseDateLabel')}
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('licenses.expirationDateLabel')}
                  </label>
                  <input
                    type="date"
                    name="expirationDate"
                    value={formData.expirationDate}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('licenses.invoiceLabel')}
                  </label>
                  
                  {formData.purchaseInvoiceUrl ? (
                    <div className="flex items-center justify-between gap-3 p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 min-w-0">
                        <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-[180px] sm:max-w-[340px] dark:text-white">
                          {formData.purchaseInvoiceUrl.split('/').pop().substring(37)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={getFileUrl(formData.purchaseInvoiceUrl)}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                          title="Xem tệp tin"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, purchaseInvoiceUrl: '' }))}
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
                        id="licenseInvoiceFile"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        accept="image/*,application/pdf"
                      />
                      <label
                        htmlFor="licenseInvoiceFile"
                        className={`flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-500/5 transition-all cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading ? (
                          <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        ) : (
                          <Upload className="w-4 h-4 text-indigo-500" />
                        )}
                        {uploading ? t('common.uploading') || 'Đang tải lên...' : t('common.uploadFile') || 'Tải lên hóa đơn đính kèm (Ảnh/PDF)'}
                      </label>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4 flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? '...' : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {isDeleteModalOpen && licenseToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('licenses.confirmDeleteTitle')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t('licenses.confirmDeleteMessage', { name: licenseToDelete.licenseName })}
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {deleting ? '...' : t('licenses.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseListPage;
