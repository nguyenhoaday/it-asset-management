import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sliders, Save, AlertCircle } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const ConfigTab = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [configs, setConfigs] = useState({
    health_weight_age: 30,
    health_weight_warranty: 20,
    health_weight_incident: 30,
    health_weight_condition: 20,
    asset_lifecycle_months: 60
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const res = await axiosClient.get('/configs');
        const configMap = {};
        if (Array.isArray(res)) {
          res.forEach(item => {
            configMap[item.configKey] = parseInt(item.configValue, 10);
          });
        }
        setConfigs(prev => ({ ...prev, ...configMap }));
      } catch (err) {
        console.error('Failed to fetch configs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  const handleChange = (key, value) => {
    setConfigs(prev => ({ ...prev, [key]: parseInt(value, 10) || 0 }));
  };

  const handleSave = async () => {
    // Kiểm tra tổng trọng số
    const totalWeight = configs.health_weight_age + configs.health_weight_warranty + configs.health_weight_incident + configs.health_weight_condition;
    if (totalWeight !== 100) {
      showToast(t('settings.weightsMustSum100'), 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        health_weight_age: configs.health_weight_age.toString(),
        health_weight_warranty: configs.health_weight_warranty.toString(),
        health_weight_incident: configs.health_weight_incident.toString(),
        health_weight_condition: configs.health_weight_condition.toString(),
        asset_lifecycle_months: configs.asset_lifecycle_months.toString()
      };
      await axiosClient.put('/configs', payload);
      showToast(t('settings.configSaved'), 'success');
    } catch (err) {
      console.error(err);
      showToast(t('settings.configSaveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalWeight = configs.health_weight_age + configs.health_weight_warranty + configs.health_weight_incident + configs.health_weight_condition;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-500" />
          {t('settings.modelConfig')}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('settings.modelConfigDesc')}
        </p>
      </div>

      <div className="space-y-6 pt-2 max-w-2xl">
        
        {/* Tuổi đời */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('settings.weightAge')}
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="number" min="0" max="100" 
                value={configs.health_weight_age} 
                onChange={(e) => handleChange('health_weight_age', e.target.value)}
                className="w-16 px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center text-indigo-600 dark:text-indigo-400 font-bold"
              />
              <span className="text-sm font-bold text-gray-500">%</span>
            </div>
          </div>
          <input 
            type="range" min="0" max="100" 
            value={configs.health_weight_age} 
            onChange={(e) => handleChange('health_weight_age', e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Bảo hành */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('settings.weightWarranty')}
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="number" min="0" max="100" 
                value={configs.health_weight_warranty} 
                onChange={(e) => handleChange('health_weight_warranty', e.target.value)}
                className="w-16 px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center text-indigo-600 dark:text-indigo-400 font-bold"
              />
              <span className="text-sm font-bold text-gray-500">%</span>
            </div>
          </div>
          <input 
            type="range" min="0" max="100" 
            value={configs.health_weight_warranty} 
            onChange={(e) => handleChange('health_weight_warranty', e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Lịch sử sự cố */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('settings.weightIncident')}
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="number" min="0" max="100" 
                value={configs.health_weight_incident} 
                onChange={(e) => handleChange('health_weight_incident', e.target.value)}
                className="w-16 px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center text-indigo-600 dark:text-indigo-400 font-bold"
              />
              <span className="text-sm font-bold text-gray-500">%</span>
            </div>
          </div>
          <input 
            type="range" min="0" max="100" 
            value={configs.health_weight_incident} 
            onChange={(e) => handleChange('health_weight_incident', e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Trạng thái vật lý */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('settings.weightCondition')}
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="number" min="0" max="100" 
                value={configs.health_weight_condition} 
                onChange={(e) => handleChange('health_weight_condition', e.target.value)}
                className="w-16 px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center text-indigo-600 dark:text-indigo-400 font-bold"
              />
              <span className="text-sm font-bold text-gray-500">%</span>
            </div>
          </div>
          <input 
            type="range" min="0" max="100" 
            value={configs.health_weight_condition} 
            onChange={(e) => handleChange('health_weight_condition', e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Tổng */}
        <div className={`p-4 rounded-xl flex items-center justify-between font-bold text-sm ${totalWeight === 100 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
          <div className="flex items-center gap-2">
            {totalWeight !== 100 && <AlertCircle className="w-5 h-5" />}
            {t('settings.totalWeight')}
          </div>
          <span>{totalWeight}%</span>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Vòng đời khấu hao */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('settings.lifecycleMonths')}
          </label>
          <input 
            type="number" min="12" max="120"
            value={configs.asset_lifecycle_months} 
            onChange={(e) => handleChange('asset_lifecycle_months', e.target.value)}
            className="w-full md:w-1/2 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('settings.lifecycleDesc')}
          </p>
        </div>

      </div>

      <div className="pt-4 flex justify-end max-w-2xl">
        <button
          onClick={handleSave}
          disabled={saving || totalWeight !== 100}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-indigo-100 dark:shadow-none cursor-pointer"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {t('common.save')}
        </button>
      </div>

    </div>
  );
};

export default ConfigTab;
