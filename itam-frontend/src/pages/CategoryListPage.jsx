import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderTree, Plus, Edit, Trash2, X, AlertTriangle } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const CategoryListPage = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || 'EMPLOYEE';
  const canManage = role === 'SUPER_ADMIN' || role === 'IT_STAFF';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', specificationSchema: '' });
  const [schemaError, setSchemaError] = useState('');
  const [saving, setSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/categories');
      setCategories(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast(t('categories.deleteFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }, [t, showToast]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', code: '', description: '', specificationSchema: '' });
    setSchemaError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      code: cat.code || '',
      description: cat.description || '',
      specificationSchema: cat.specificationSchema ? JSON.stringify(cat.specificationSchema, null, 2) : ''
    });
    setSchemaError('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'code' ? value.toUpperCase() : value }));
    if (name === 'specificationSchema') setSchemaError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let parsedSchema = null;
    if (formData.specificationSchema && formData.specificationSchema.trim() !== '') {
      try { parsedSchema = JSON.parse(formData.specificationSchema); }
      catch { setSchemaError(t('categories.schemaInvalid')); return; }
    }
    setSaving(true);
    try {
      const payload = { name: formData.name, code: formData.code, description: formData.description, specificationSchema: parsedSchema };
      if (editingCategory) { await axiosClient.put(`/categories/${editingCategory.id}`, payload); }
      else { await axiosClient.post('/categories', payload); }
      showToast(t('categories.saveSuccess'), 'success');
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      showToast(t('categories.saveFailed'), 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/categories/${categoryToDelete.id}`);
      showToast(t('categories.deleteSuccess'), 'success');
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast(t('categories.deleteFailed'), 'error');
    } finally { setDeleting(false); }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-4 p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FolderTree className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              {t('categories.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('categories.subtitle')}</p>
          </div>
          {canManage && (
            <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors w-full sm:w-auto justify-center shadow-sm cursor-pointer">
              <Plus className="w-4 h-4" />
              {t('categories.addCategory')}
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 flex flex-col items-center text-center">
            <FolderTree className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('categories.noData')}</h3>
            {canManage && (
              <button onClick={openAddModal} className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium text-sm mt-4 cursor-pointer">
                + {t('categories.addCategory')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => {
              const specCount = cat.specificationSchema ? Object.keys(cat.specificationSchema).length : 0;
              return (
                <div key={cat.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1" title={cat.name}>{cat.name}</h3>
                      <span className="inline-block px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-mono text-xs rounded border border-indigo-100 dark:border-indigo-900/50">
                        {cat.code}
                      </span>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${cat.isActive !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:border-gray-700'}`}>
                      {cat.isActive !== false ? t('categories.active') : t('categories.inactive')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[2.5rem] mb-4" title={cat.description}>
                    {cat.description || '—'}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{specCount} {t('categories.schemaFields')}</span>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(cat)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 rounded-lg transition-colors cursor-pointer" title={t('categories.editTitle')}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setCategoryToDelete(cat); setIsDeleteModalOpen(true); }} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer" title={t('categories.delete')}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* add/edit */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {editingCategory ? t('categories.editTitle') : t('categories.addTitle')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('categories.nameLabel')} <span className="text-red-500">*</span></label>
                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('categories.codeLabel')} <span className="text-red-500">*</span></label>
                <input type="text" name="code" required value={formData.code} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('categories.descriptionLabel')}</label>
                <textarea name="description" rows="2" value={formData.description} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('categories.schemaLabel')}</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('categories.schemaHint')}</p>
                <textarea name="specificationSchema" rows="5" value={formData.specificationSchema} onChange={handleInputChange} placeholder={'{\n  "cpu": "string",\n  "ram": "string"\n}'} className={`block w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 outline-none font-mono resize-none transition-colors ${schemaError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500'}`} />
                {schemaError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{schemaError}</p>}
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm cursor-pointer">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-70 cursor-pointer">{saving ? '...' : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* delete confirm */}
      {isDeleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('categories.confirmDeleteTitle')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('categories.confirmDeleteMessage', { name: categoryToDelete.name })}</p>
            <div className="flex gap-3 w-full">
              <button type="button" onClick={() => { setIsDeleteModalOpen(false); setCategoryToDelete(null); }} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm cursor-pointer">{t('common.cancel')}</button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-70 cursor-pointer">{deleting ? '...' : t('categories.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryListPage;
