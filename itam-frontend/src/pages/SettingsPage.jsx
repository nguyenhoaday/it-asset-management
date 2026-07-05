import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Lock, Settings, ShieldCheck, Mail, Building, ShieldAlert, KeyRound, Check, Sliders } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';
import ConfigTab from '../components/ConfigTab';

const SettingsPage = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tabParam = searchParams.get('tab');
  const activeTab = ['profile', 'password', 'config'].includes(tabParam) ? tabParam : 'profile';
  
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get('/users/me');
        setUserInfo(res.data || res);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast(t('settings.passwordMismatch'), 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      await axiosClient.post('/users/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      showToast(t('settings.changePasswordSuccess'), 'success');
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error(err);
      showToast(t('settings.changePasswordFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-slate-900/50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {t('settings.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('settings.subtitle')}
          </p>
        </div>

        {/* Layout tab */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[450px]">
          
          {/* Tab */}
          <div className="w-full md:w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/20 p-4 space-y-1 shrink-0">
            <button
              onClick={() => handleTabChange('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              {t('settings.profileTab')}
            </button>
            <button
              onClick={() => handleTabChange('password')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              {t('settings.passwordTab')}
            </button>
            {userInfo?.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => handleTabChange('config')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'config'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4" />
                {t('settings.configTab', 'Cấu hình Hệ thống')}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 sm:p-8">
            
            {/* Profile */}
            {activeTab === 'profile' && userInfo && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-500" />
                    {t('settings.personalInfo')}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('settings.personalInfoDesc')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('settings.fullName')}</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white">
                      <User className="w-4 h-4 text-gray-400" />
                      {userInfo.fullName || '-'}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('settings.username')}</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white">
                      <KeyRound className="w-4 h-4 text-gray-400" />
                      {userInfo.username || '-'}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('settings.email')}</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {userInfo.email || '-'}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('settings.role')}</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white">
                      <ShieldAlert className="w-4 h-4 text-gray-400" />
                      <span className="font-mono text-xs px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-900/30">
                        {userInfo.role || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('settings.department')}</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white">
                      <Building className="w-4 h-4 text-gray-400" />
                      {userInfo.departmentName || '-'}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('settings.status')}</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white">
                      <ShieldCheck className="w-4 h-4 text-gray-400" />
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {t('settings.active')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Change password */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-indigo-500" />
                    {t('settings.changePassword')}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('settings.changePasswordDesc')}
                  </p>
                </div>

                <div className="space-y-5 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t('settings.oldPassword')}</label>
                    <input
                      type="password"
                      name="oldPassword"
                      required
                      placeholder={t('settings.oldPasswordPlaceholder')}
                      value={passwordForm.oldPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-300 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t('settings.newPassword')}</label>
                    <input
                      type="password"
                      name="newPassword"
                      required
                      placeholder={t('settings.newPasswordPlaceholder')}
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-300 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t('settings.confirmPassword')}</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      placeholder={t('settings.confirmPasswordPlaceholder')}
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-300 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-indigo-100 dark:shadow-none cursor-pointer"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {t('settings.updatePasswordBtn')}
                  </button>
                </div>
              </form>
            )}

            {/* Config tab */}
            {activeTab === 'config' && userInfo?.role === 'SUPER_ADMIN' && (
              <ConfigTab />
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
