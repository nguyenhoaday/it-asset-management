import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, X, Package, ClipboardList, Upload, Trash2, ExternalLink, FileText } from 'lucide-react';
import axiosClient, { getHostUrl } from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const AssetFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // User Info
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || 'EMPLOYEE';
  const canManage = role === 'SUPER_ADMIN' || role === 'IT_STAFF';

  // Form
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    serialNumber: '',
    status: 'AVAILABLE',
    purchaseCost: '',
    currency: 'VND',
    purchaseDate: '',
    warrantyExpiry: '',
    usefulLifeMonths: '',
    purchaseInvoiceUrl: '',
    specification: {}
  });

  const [schema, setSchema] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('entityType', 'ASSET');
    if (isEdit) {
      uploadData.append('entityId', id);
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

  useEffect(() => {
    if (!canManage) {
      navigate('/unauthorized');
      return;
    }

    const fetchInitialData = async () => {
      try {
        const catRes = await axiosClient.get('/categories');
        const cats = catRes || [];
        setCategories(cats);

        if (isEdit) {
          const asset = await axiosClient.get(`/assets/${id}`);
          
          setFormData({
            name: asset.name || '',
            categoryId: asset.categoryId || asset.category?.id || '',
            serialNumber: asset.serialNumber || '',
            status: asset.status || 'AVAILABLE',
            purchaseCost: asset.purchaseCost || '',
            currency: asset.currency || 'VND',
            purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
            warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split('T')[0] : '',
            usefulLifeMonths: asset.usefulLifeMonths != null ? asset.usefulLifeMonths : '',
            purchaseInvoiceUrl: asset.purchaseInvoiceUrl || '',
            specification: asset.specification || {}
          });

          const selectedCatId = asset.categoryId || asset.category?.id;
          if (selectedCatId) {
            const cat = cats.find(c => String(c.id || c.categoryId) === String(selectedCatId));
            if (cat && cat.specificationSchema) {
              setSchema(typeof cat.specificationSchema === 'string' ? JSON.parse(cat.specificationSchema) : cat.specificationSchema);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEdit, canManage, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const newCatId = e.target.value;
    setFormData(prev => ({ ...prev, categoryId: newCatId, specification: {} }));
    
    const cat = categories.find(c => String(c.id || c.categoryId) === String(newCatId));
    if (cat && cat.specificationSchema) {
      setSchema(typeof cat.specificationSchema === 'string' ? JSON.parse(cat.specificationSchema) : cat.specificationSchema);
    } else {
      setSchema(null);
    }
  };

  const handleSpecChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      specification: {
        ...prev.specification,
        [key]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        purchaseCost: formData.purchaseCost ? Number(formData.purchaseCost) : null,
        usefulLifeMonths: formData.usefulLifeMonths !== '' ? Number(formData.usefulLifeMonths) : null,
      };

      if (isEdit) {
        await axiosClient.put(`/assets/${id}`, payload);
      } else {
        await axiosClient.post('/assets', payload);
      }
      
      showToast(t('assets.saveSuccess'), 'success');
      navigate('/assets');
    } catch (err) {
      console.error("Error saving asset:", err);
      showToast(t('assets.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-50 dark:bg-slate-900/50">
        <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <span className="text-gray-500 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  const statuses = [
    'AVAILABLE',
    'ASSIGNED',
    'MAINTENANCE',
    'LOST',
    'BROKEN',
    'RETIRED'
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate('/assets')}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {isEdit ? t('assets.editTitle') : t('assets.addTitle')}
          </h1>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-gray-100 dark:divide-gray-800">
            
            {/* Info */}
            <div className="p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-gray-400" />
                {t('assetDetail.generalInfo')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('assets.nameLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('assets.categoryLabel')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categoryId"
                    required
                    value={formData.categoryId}
                    onChange={handleCategoryChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  >
                    <option value="" disabled>{t('assets.selectCategory')}</option>
                    {categories.map(cat => (
                      <option key={cat.id || cat.categoryId} value={cat.id || cat.categoryId}>
                        {cat.name || cat.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('assets.serialLabel')}
                  </label>
                  <input
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleInputChange}
                    placeholder={t('assets.serialPlaceholder')}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('assets.statusLabel')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  >
                    {statuses.map(s => (
                      <option key={s} value={s}>{t(`status.${s}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('assetDetail.purchaseDate')} & {t('assetDetail.warrantyExpiry')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('assets.costLabel')}
                  </label>
                  <div className="flex rounded-lg shadow-sm">
                    <input
                      type="number"
                      name="purchaseCost"
                      value={formData.purchaseCost}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-700 rounded-l-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors z-10"
                    />
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="block w-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-r-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors z-20"
                    >
                      <option value="VND">VND</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('assets.invoiceLabel')}
                  </label>
                  
                  {formData.purchaseInvoiceUrl ? (
                    <div className="flex items-center justify-between gap-3 p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 min-w-0">
                        <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-[180px] sm:max-w-[260px]">
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
                        id="invoiceFile"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        accept="image/*,application/pdf"
                      />
                      <label
                        htmlFor="invoiceFile"
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

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('assets.purchaseDateLabel')}
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('assets.warrantyExpiryLabel')}
                  </label>
                  <input
                    type="date"
                    name="warrantyExpiry"
                    value={formData.warrantyExpiry}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('assets.usefulLifeLabel')}
                  </label>
                  <input
                    type="number"
                    name="usefulLifeMonths"
                    value={formData.usefulLifeMonths}
                    onChange={handleInputChange}
                    placeholder={t('assets.usefulLifePlaceholder')}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Thông tin chi tiết */}
            {schema && Object.keys(schema).length > 0 && (
              <div className="p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('assetDetail.specifications')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(schema).map(([key, type]) => {
                    const val = formData.specification[key] || '';
                    return (
                      <div key={key} className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {key.replace(/_/g, ' ')}
                        </label>
                        {type === 'boolean' || type === 'bool' ? (
                          <div className="flex items-center mt-2">
                            <input
                              type="checkbox"
                              checked={Boolean(val)}
                              onChange={(e) => handleSpecChange(key, e.target.checked)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Yes</span>
                          </div>
                        ) : (
                          <input
                            type={type === 'integer' || type === 'number' ? 'number' : 'text'}
                            value={val}
                            onChange={(e) => handleSpecChange(key, e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-6 bg-gray-50/50 dark:bg-slate-800/30 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => navigate('/assets')}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
                {t('assets.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : t('assets.save')}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AssetFormPage;
