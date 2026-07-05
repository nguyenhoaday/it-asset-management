import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Wrench, CheckCircle } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';

const MaintenanceModal = ({ isOpen, onClose, actionType, assetId, activeMaintenanceLogId, currency = 'VND', onSuccess }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [providerName, setProviderName] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [repairCost, setRepairCost] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state
      setProviderName('');
      setIssueDescription('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setRepairCost('');
      setActionTaken('');
      setEndDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (actionType === 'START') {
        await axiosClient.post('/maintenances', {
          assetId,
          providerName: providerName.trim(),
          issueDecription: issueDescription.trim(),
          startDate: new Date(startDate).toISOString()
        });
        showToast(t('maintenance.startSuccess'), 'success');
      } else {
        await axiosClient.patch(`/maintenances/${activeMaintenanceLogId}`, {
          repairCost: parseFloat(repairCost) || 0.0,
          actionTaken: actionTaken.trim(),
          endDate: new Date(endDate).toISOString()
        });
        showToast(t('maintenance.completeSuccess'), 'success');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting maintenance log:', error);
      if (actionType === 'START') {
        showToast(t('maintenance.startFailed'), 'error');
      } else {
        showToast(t('maintenance.completeFailed'), 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isStart = actionType === 'START';

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto flex flex-col border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {isStart ? (
              <Wrench className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
            {isStart ? t('maintenance.startMaintenance') : t('maintenance.completeMaintenance')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form*/}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isStart ? (
            <>
              {/* Provider name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('maintenance.providerName')}
                </label>
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder={t('maintenance.enterProviderName')}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('maintenance.issueDescription')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder={t('maintenance.enterIssueDescription')}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                />
              </div>

              {/* Start date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {t('maintenance.startDate')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </>
          ) : (
            <>
              {/* Repair cost */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('maintenance.repairCost')} (Unit: {currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={repairCost}
                  onChange={(e) => setRepairCost(e.target.value)}
                  placeholder={t('maintenance.enterRepairCost')}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              {/* Action taken */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('maintenance.actionTaken')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder={t('maintenance.enterActionTaken')}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                />
              </div>

              {/* End date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {t('maintenance.endDate')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-75 disabled:cursor-not-allowed shadow-sm ${
                isStart
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {submitting ? '...' : t('common.save')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default MaintenanceModal;
