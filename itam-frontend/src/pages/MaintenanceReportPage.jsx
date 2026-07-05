import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileDown, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

const MaintenanceReportPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [dateRange, setDateRange] = useState({
        from: undefined,
        to: undefined,
    });
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const handleExport = async () => {
        if (!dateRange.from || !dateRange.to) {
            showToast(t('reports.selectDateRange'), 'warning');
            return;
        }

        try {
            showToast(t('reports.exporting'), 'info');
            const fromStr = format(dateRange.from, 'yyyy-MM-dd');
            const toStr = format(dateRange.to, 'yyyy-MM-dd');

            const response = await axiosClient.get(`/reports/maintenances`, {
                params: {
                    from: fromStr,
                    to: toStr,
                    lang: i18n.language || 'vi',
                },
                responseType: 'blob',
            });

            const blob = response.data || response;
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            const fileName = `BaoCao_BaoTri_${fromStr}_${toStr}.pdf`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showToast(t('reports.exportSuccess'), 'success');
        } catch (err) {
            console.error(err);
            showToast(t('reports.exportFailed'), 'error');
        }
    };

    const handleDayClick = (day, modifiers) => {
        if (modifiers.selected) {
          setDateRange({ from: undefined, to: undefined });
        }
      };

    const footer = (
        <div className="px-4 pt-2 flex justify-end">
            <button
                className="text-sm text-indigo-600 hover:underline"
                onClick={() => setIsPickerOpen(false)}
            >
                {t('common.done')}
            </button>
        </div>
    );


    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900/50">
            <div className="p-4 sm:p-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileDown className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        {t('reports.maintenanceReport')}
                    </h1>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-8 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('reports.selectDateRange')}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('reports.maintenanceReportHint')}
                    </p>

                    <div className="relative">
                        <button
                            onClick={() => setIsPickerOpen(!isPickerOpen)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <CalendarIcon className="w-4 h-4 text-gray-500" />
                            <span>
                                {dateRange.from && dateRange.to
                                    ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
                                    : t('reports.chooseDatePlaceholder')}
                            </span>
                        </button>
                        {isPickerOpen && (
                             <div className="absolute top-full mt-2 w-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg z-20">
                                <style>{`.rdp-day_selected { background-color: #4f46e5 !important; }`}</style>
                                <DayPicker
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    onDayClick={handleDayClick}
                                    numberOfMonths={1}
                                    pagedNavigation
                                    footer={footer}
                                    locale={i18n.language === 'vi' ? vi : enUS}
                                />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={!dateRange.from || !dateRange.to}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileDown className="w-5 h-5" />
                        {t('reports.exportPdf')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceReportPage;
