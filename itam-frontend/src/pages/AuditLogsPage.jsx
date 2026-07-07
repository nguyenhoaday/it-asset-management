import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, ChevronLeft, ChevronRight, User, Eye } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { useToast } from '../context/ToastContext';
import AuditLogDetailModal from '../components/AuditLogDetailModal';

const AuditLogsPage = () => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('');

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(15);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get('/audit-logs', {
          params: { action: selectedAction || undefined, entityType: selectedEntityType || undefined, page, size: pageSize }
        });
        
        const data = response.data || response;
        if (data.content) {
          setLogs(data.content);
          setTotalPages(data.totalPages || 0);
        } else if (Array.isArray(data)) {
          setLogs(data);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        showToast(t('auditLogs.noData'), 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [selectedAction, selectedEntityType, page, pageSize, showToast, t]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Intl.DateTimeFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  const getEntityTypeLabel = (entityType) => {
    if (!entityType) return '-';
    switch (entityType) {
      case 'ASSET': return t('auditLogs.entityAsset');
      case 'USER': return t('auditLogs.entityUser');
      case 'LICENSE': return t('auditLogs.entityLicense');
      case 'CATEGORY': return t('auditLogs.entityCategory');
      case 'ALLOCATION': return t('auditLogs.entityAllocation', 'Bàn giao');
      case 'POLICY': return t('auditLogs.entityPolicy', 'Chính sách');
      default: return entityType;
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
      case 'CONFIRM':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">{t(`auditLogs.action${action.charAt(0) + action.slice(1).toLowerCase()}`)}</span>;
      case 'DELETE':
      case 'REJECT':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">{t(`auditLogs.action${action.charAt(0) + action.slice(1).toLowerCase()}`)}</span>;
      case 'UPDATE':
      case 'TRANSFER':
      case 'ALLOCATE':
      case 'RETURN':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">{t(`auditLogs.action${action.charAt(0) + action.slice(1).toLowerCase()}`)}</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{action}</span>;
    }
  };

  const renderDiffSummary = (payloadDiff) => {
    if (!payloadDiff || Object.keys(payloadDiff).length === 0) {
      return <span className="text-gray-400 dark:text-gray-500">-</span>;
    }

    const count = Object.keys(payloadDiff).length;
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
        <span>{t('auditLogs.fieldsChanged', { count: count })}</span>
      </span>
    );
  };

  const handleExport = async () => {
    try {
      showToast(t('exporting', 'Đang xuất báo cáo...'), 'info');
      const res = await axiosClient.get('/audit-logs/export', {
        params: { entityType: selectedEntityType || undefined, action: selectedAction || undefined, lang: i18n.language },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(res);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AuditLogs_${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast(t('exportSuccess', 'Tải báo cáo thành công!'), 'success');
    } catch (e) {
      console.error("Export failed", e);
      showToast(t('exportFailed', 'Xuất báo cáo thất bại!'), 'error');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 sm:p-6">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full min-h-0">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col h-full min-h-0 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 px-6 bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-800 shrink-0">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {t('auditLogs.title')}
              </h1>
              <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('auditLogs.subtitle')}
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedEntityType}
                onChange={(e) => { setSelectedEntityType(e.target.value); setPage(0); }}
                className="flex-1 sm:flex-none text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">{t('auditLogs.filterAll')} ({t('auditLogs.tableEntity', 'Đối tượng')})</option>
                <option value="ASSET">{t('auditLogs.entityAsset')}</option>
                <option value="USER">{t('auditLogs.entityUser')}</option>
                <option value="ALLOCATION">{t('auditLogs.entityAllocation', 'Bàn giao')}</option>
                <option value="POLICY">{t('auditLogs.entityPolicy', 'Chính sách')}</option>
                <option value="CATEGORY">{t('auditLogs.entityCategory', 'Danh mục')}</option>
                <option value="LICENSE">{t('auditLogs.entityLicense', 'Bản quyền')}</option>
              </select>
              
              <select
                value={selectedAction}
                onChange={(e) => { setSelectedAction(e.target.value); setPage(0); }}
                className="flex-1 sm:flex-none text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">{t('auditLogs.filterAll')} ({t('auditLogs.tableAction', 'Hành động')})</option>
                <option value="CREATE">{t('auditLogs.actionCreate')}</option>
                <option value="UPDATE">{t('auditLogs.actionUpdate')}</option>
                <option value="DELETE">{t('auditLogs.actionDelete')}</option>
                <option value="ALLOCATE">{t('auditLogs.actionAllocate')}</option>
                <option value="RETURN">{t('auditLogs.actionReturn')}</option>
                <option value="TRANSFER">{t('auditLogs.actionTransfer')}</option>
                <option value="CONFIRM">{t('auditLogs.actionConfirm')}</option>
                <option value="REJECT">{t('auditLogs.actionReject')}</option>
              </select>

              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                {t('exportExcel', 'Xuất Excel')}
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0 flex flex-col gap-4">
            <div className="flex-1 border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4">{t('auditLogs.tableUser')}</th>
                      <th className="px-6 py-4">{t('auditLogs.tableAction')}</th>
                      <th className="px-6 py-4">{t('auditLogs.tableEntity')}</th>
                      <th className="px-6 py-4">{t('auditLogs.tableName')}</th>
                      <th className="px-6 py-4">{t('auditLogs.tableDiff')}</th>
                      <th className="px-6 py-4">{t('auditLogs.tableDate')}</th>
                      <th className="px-6 py-4 text-right">{t('auditLogs.tableDetails', 'Chi tiết')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {logs.map(log => (
                      <tr 
                        key={log.id} 
                        onClick={() => { setSelectedLog(log); setIsDetailModalOpen(true); }}
                        className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                              <User className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-white">{log.userFullName || log.username || '-'}</span>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span>@{log.username || 'unknown'}</span>
                                {log.ipAddress && (
                                  <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]" title={log.userAgent}>
                                    IP: {log.ipAddress}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                          {getEntityTypeLabel(log.entityType)}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {log.entityName || log.entityId}
                        </td>
                        <td className="px-6 py-4">
                          {renderDiffSummary(log.payloadDiff)}
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedLog(log); setIsDetailModalOpen(true); }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                            title={t('auditLogs.viewDetails', 'Xem chi tiết')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          {t('auditLogs.noData')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex items-center justify-between shrink-0 pt-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('common.pageInfo', { page: page + 1, totalPages })}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
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

      <AuditLogDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        log={selectedLog}
        getActionBadge={getActionBadge}
        getEntityTypeLabel={getEntityTypeLabel}
        formatDate={formatDate}
      />
    </div>
  );
};

export default AuditLogsPage;

