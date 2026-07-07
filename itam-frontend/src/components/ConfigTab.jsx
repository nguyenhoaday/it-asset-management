import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sliders, Save } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const ConfigTab = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [configs, setConfigs] = useState({
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
            if (item.configKey === 'asset_lifecycle_months') {
              configMap[item.configKey] = parseInt(item.configValue, 10);
            }
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
    setSaving(true);
    try {
      const payload = {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-500" />
          {t('systemConfig.generalDefaultsTab', 'Cấu hình chung')}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('settings.modelConfigDesc')}
        </p>
      </div>

      <div className="space-y-6 pt-2 max-w-2xl">
        
        <div className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
          <label htmlFor='asset_lifecycle_months' className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('settings.lifecycleMonths')}
          </label>
          <input 
            id='asset_lifecycle_months'
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
          disabled={saving}
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
