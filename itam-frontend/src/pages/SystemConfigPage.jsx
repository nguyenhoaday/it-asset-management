import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sliders, Award, Plus, Edit, Trash2, X, Star, ShieldAlert, Layers, Percent } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';
import ConfigTab from '../components/ConfigTab';

const SystemConfigPage = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab = ['scoring-policies', 'general-defaults'].includes(tabParam) ? tabParam : 'scoring-policies';

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    weightAge: 30,
    weightWarranty: 20,
    weightIncident: 30,
    weightCondition: 20,
    isDefault: false
  });
  const [saving, setSaving] = useState(false);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/scoring-policies');
      setPolicies(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching scoring policies:', error);
      showToast(t('scoringPolicies.fetchFailed', 'Không thể tải danh sách chính sách chấm điểm'), 'error');
    } finally {
      setLoading(false);
    }
  }, [t, showToast]);

  useEffect(() => {
    if (activeTab === 'scoring-policies') {
      fetchPolicies();
    }
  }, [activeTab, fetchPolicies]);

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const openAddModal = () => {
    setEditingPolicy(null);
    setFormData({
      name: '',
      description: '',
      weightAge: 30,
      weightWarranty: 20,
      weightIncident: 30,
      weightCondition: 20,
      isDefault: policies.length === 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name || '',
      description: policy.description || '',
      weightAge: policy.weightAge != null ? policy.weightAge : 30,
      weightWarranty: policy.weightWarranty != null ? policy.weightWarranty : 20,
      weightIncident: policy.weightIncident != null ? policy.weightIncident : 30,
      weightCondition: policy.weightCondition != null ? policy.weightCondition : 20,
      isDefault: !!policy.isDefault
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name.startsWith('weight')) {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const totalWeight = formData.weightAge + formData.weightWarranty + formData.weightIncident + formData.weightCondition;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      showToast(t('scoringPolicies.weightsMustSum100', 'Tổng trọng số 4 tiêu chí phải đúng bằng 100%'), 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        weightAge: formData.weightAge,
        weightWarranty: formData.weightWarranty,
        weightIncident: formData.weightIncident,
        weightCondition: formData.weightCondition,
        isDefault: formData.isDefault
      };

      if (editingPolicy) {
        await axiosClient.put(`/scoring-policies/${editingPolicy.id}`, payload);
      } else {
        await axiosClient.post('/scoring-policies', payload);
      }

      showToast(t('scoringPolicies.saveSuccess', 'Đã lưu chính sách chấm điểm thành công'), 'success');
      setIsModalOpen(false);
      fetchPolicies();
    } catch (error) {
      console.error('Error saving scoring policy:', error);
      const errMsg = error.response?.data?.message || t('scoringPolicies.saveFailed', 'Lưu chính sách thất bại');
      showToast(errMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (policyId) => {
    try {
      await axiosClient.post(`/scoring-policies/${policyId}/set-default`);
      showToast(t('scoringPolicies.setDefaultSuccess', 'Đã thiết lập chính sách mặc định thành công'), 'success');
      fetchPolicies();
    } catch (error) {
      console.error('Error setting default policy:', error);
      showToast(t('scoringPolicies.setDefaultFailed', 'Không thể thiết lập mặc định'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!policyToDelete) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/scoring-policies/${policyToDelete.id}`);
      showToast(t('scoringPolicies.deleteSuccess', 'Đã xóa chính sách thành công'), 'success');
      setIsDeleteModalOpen(false);
      fetchPolicies();
    } catch (error) {
      console.error('Error deleting policy:', error);
      const errMsg = error.response?.data?.message || t('scoringPolicies.deleteFailed', 'Không thể xóa chính sách (có thể đang được sử dụng bởi danh mục)');
      showToast(errMsg, 'error');
    } finally {
      setDeleting(false);
    }
  };
  
  const WeightItem = ({ label, value }) => (
    <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-500 dark:text-gray-400">{label}:</span>
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{value}%</span>
    </div>
  );

  const renderScoringPoliciesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" />
            {t('scoringPolicies.listTitle', 'Danh sách Chính sách Chấm điểm')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('scoringPolicies.listDesc', 'Mỗi danh mục tài sản có thể áp dụng một chính sách riêng. Thiết bị phần mềm sẽ tự động loại trừ khỏi việc chấm điểm.')}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : policies.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">{t('scoringPolicies.emptyTitle', 'Chưa có chính sách nào')}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-4">
            {t('scoringPolicies.emptyDesc', 'Tạo chính sách chấm điểm đầu tiên để chuẩn hóa việc định giá và đánh giá sức khỏe tài sản')}
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t('scoringPolicies.addBtn', 'Thêm Chính sách')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className={`p-4 rounded-xl border transition-all ${
                policy.isDefault
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/80 shadow-sm'
                  : 'bg-white dark:bg-slate-800/60 border-gray-200 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          {policy.name}
                        </h3>
                        {policy.isDefault && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                            <Star className="w-3 h-3 fill-current" />
                            {t('scoringPolicies.defaultBadgeShort', 'Mặc định')}
                          </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {policy.description || t('scoringPolicies.noDescription', 'Không có mô tả')}
                    </p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!policy.isDefault && (
                    <button
                      onClick={() => handleSetDefault(policy.id)}
                      title={t('scoringPolicies.setDefaultTooltip', 'Đặt làm chính sách mặc định')}
                      className="p-2 rounded-lg text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 dark:hover:text-yellow-400 transition-colors cursor-pointer"
                    >
                      <Star className="w-4 h-4"/>
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(policy)}
                    title={t('common.edit', 'Chỉnh sửa')}
                    className="p-2 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 dark:hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {!policy.isDefault && (
                    <button
                      onClick={() => { setPolicyToDelete(policy); setIsDeleteModalOpen(true); }}
                      title={t('common.delete', 'Xóa')}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/80 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <WeightItem label={t('settings.weightAgeShort', 'Tuổi đời')} value={policy.weightAge} />
                  <WeightItem label={t('settings.weightWarrantyShort', 'Bảo hành')} value={policy.weightWarranty} />
                  <WeightItem label={t('settings.weightIncidentShort', 'Sửa chữa')} value={policy.weightIncident} />
                  <WeightItem label={t('settings.weightConditionShort', 'Vật lý')} value={policy.weightCondition} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full min-h-0">
        
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col h-full min-h-0 shadow-sm overflow-hidden">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 px-4 sm:px-6 border-b border-gray-200 dark:border-gray-800 gap-4 shrink-0 bg-gray-50/50 dark:bg-slate-800/50">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {t('systemConfig.title', 'Cấu hình Hệ thống')}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('systemConfig.subtitleShort', 'Quản lý chính sách chấm điểm, vòng đời tài sản và các cấu hình chung.')}
              </p>
            </div>

            {activeTab === 'scoring-policies' && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors w-full sm:w-auto justify-center shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {t('scoringPolicies.addBtn', 'Thêm Chính sách')}
              </button>
            )}
          </div>

          <div className="p-4 border-b border-gray-150 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleTabChange('scoring-policies')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'scoring-policies'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <Award className="w-4 h-4" />
                {t('systemConfig.scoringPoliciesTab', 'Chính sách chấm điểm')}
              </button>
              <button
                onClick={() => handleTabChange('general-defaults')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'general-defaults'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                {t('systemConfig.generalDefaultsTab', 'Cấu hình chung')}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 sm:p-6">
            {activeTab === 'scoring-policies' && renderScoringPoliciesTab()}
            {activeTab === 'general-defaults' && <ConfigTab />}
          </div>
        </div>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                {editingPolicy ? t('scoringPolicies.editTitle', 'Chỉnh sửa Chính sách') : t('scoringPolicies.addTitle', 'Thêm Chính sách mới')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('scoringPolicies.nameLabel', 'Tên chính sách')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={t('scoringPolicies.namePlaceholder', 'VD: Tiêu chuẩn Máy chủ & Network')}
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('scoringPolicies.descLabel', 'Mô tả chi tiết')}
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder={t('scoringPolicies.descPlaceholder', 'VD: Ưu tiên độ trễ sự cố và thời gian bảo hành cho các thiết bị trung tâm')}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-slate-800/40 border border-gray-200/80 dark:border-gray-700/60 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5" />
                    {t('scoringPolicies.weightsHeader', 'Phân bổ trọng số')}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                    totalWeight === 100
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                  }`}>
                    <span className="font-mono">{totalWeight}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{t('settings.weightAge', 'Khấu hao theo tuổi đời')}</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{formData.weightAge}%</span>
                      </div>
                      <input
                        type="range" name="weightAge" min="0" max="100" value={formData.weightAge} onChange={handleInputChange}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{t('settings.weightWarranty', 'Tình trạng bảo hành')}</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{formData.weightWarranty}%</span>
                      </div>
                      <input
                        type="range" name="weightWarranty" min="0" max="100" value={formData.weightWarranty} onChange={handleInputChange}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{t('settings.weightIncident', 'Lịch sử sự cố & sửa chữa')}</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{formData.weightIncident}%</span>
                      </div>
                      <input
                        type="range" name="weightIncident" min="0" max="100" value={formData.weightIncident} onChange={handleInputChange}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{t('settings.weightCondition', 'Trạng thái vật lý')}</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{formData.weightCondition}%</span>
                      </div>
                      <input
                        type="range" name="weightCondition" min="0" max="100" value={formData.weightCondition} onChange={handleInputChange}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                </div>

              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  disabled={editingPolicy?.isDefault}
                  className="w-4 h-4 text-indigo-600 bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-indigo-900 dark:text-indigo-200 cursor-pointer select-none">
                  {t('scoringPolicies.isDefaultLabel', 'Đặt làm chính sách mặc định cho toàn hệ thống')}
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {t('common.cancel', 'Hủy')}
                </button>
                <button
                  type="submit"
                  disabled={saving || totalWeight !== 100}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {t('common.save', 'Lưu chính sách')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {isDeleteModalOpen && policyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-800 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('scoringPolicies.deleteConfirmTitle', 'Xác nhận xóa chính sách?')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('scoringPolicies.deleteConfirmDesc', 'Bạn có chắc chắn muốn xóa')} <span className="font-bold text-gray-800 dark:text-gray-200">"{policyToDelete.name}"</span>? {t('scoringPolicies.deleteWarning', 'Hành động này không thể hoàn tác.')}
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t('common.cancel', 'Hủy')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium text-sm rounded-lg transition-all shadow-sm cursor-pointer"
              >
                {deleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {t('common.delete', 'Xóa')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SystemConfigPage;
