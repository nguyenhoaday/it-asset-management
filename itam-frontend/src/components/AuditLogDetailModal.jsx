import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ShieldAlert, User, Globe, Laptop, Clock, ArrowRight, Copy, Check, FileText, Hash } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AuditLogDetailModal = ({ isOpen, onClose, log, getActionBadge, getEntityTypeLabel, formatDate }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen || !log) return null;

  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(t('auditLogs.copySuccess', 'Đã sao chép vào clipboard!'), 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const payloadDiff = log.payloadDiff || {};
  const hasDiff = Object.keys(payloadDiff).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('auditLogs.detailTitle', 'Chi tiết Nhật ký Kiểm toán (Audit Log)')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {t('auditLogs.detailId', 'ID')}: {log.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Section 1: Actor & Session */}
          <div className="bg-gray-50/50 dark:bg-slate-800/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              {t('auditLogs.actorInfo', 'Thông tin Người thực hiện & Phiên kết nối')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('auditLogs.actorLabel', 'Người thực hiện')}</span>
                <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{log.userFullName || log.username || 'N/A'}</span>
                  <span className="text-xs text-gray-500 font-normal">(@{log.username || 'unknown'})</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('auditLogs.timeLabel', 'Thời gian ghi nhận')}</span>
                <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {formatDate(log.createdAt)}
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('auditLogs.ipLabel', 'Địa chỉ IP (IP Address)')}</span>
                <div className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 inline-flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{log.ipAddress || t('auditLogs.unknownIp', 'Không xác định')}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('auditLogs.userIdLabel', 'ID Người dùng (User ID)')}</span>
                <div className="font-mono text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 truncate" title={log.userId}>
                  {log.userId || log.user || 'N/A'}
                </div>
              </div>
            </div>

            {/* User Agent */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700/50">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                {t('auditLogs.userAgentLabel', 'Thiết bị / Trình duyệt (User-Agent)')}
              </span>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-700 dark:text-gray-300 break-all leading-relaxed">
                {log.userAgent || t('auditLogs.noUserAgent', 'Không có thông tin User-Agent')}
              </div>
            </div>
          </div>

          {/* Section 2: Action & Target */}
          <div className="bg-gray-50/50 dark:bg-slate-800/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              {t('auditLogs.actionTargetSection', 'Thao tác & Đối tượng tác động')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('auditLogs.actionLabel', 'Hành động (Action)')}</span>
                <div>{getActionBadge ? getActionBadge(log.action) : log.action}</div>
              </div>

              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('auditLogs.entityTypeLabel', 'Loại đối tượng (Entity Type)')}</span>
                <span className="font-semibold text-gray-900 dark:text-white px-2.5 py-1 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs">
                  {getEntityTypeLabel ? getEntityTypeLabel(log.entityType) : log.entityType}
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('auditLogs.entityNameLabel', 'Tên đối tượng')}</span>
                <div className="font-medium text-gray-900 dark:text-white truncate" title={log.entityName}>
                  {log.entityName || 'N/A'}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700/50">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1 flex items-center justify-between">
                <span>{t('auditLogs.entityIdLabel', 'Mã định danh đối tượng (Entity ID)')}</span>
                {log.entityId && (
                  <button
                    onClick={() => handleCopy(log.entityId, 'entityId')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    {copiedField === 'entityId' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">{t('auditLogs.copied', 'Đã chép')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{t('auditLogs.copyId', 'Sao chép ID')}</span>
                      </>
                    )}
                  </button>
                )}
              </span>
              <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 font-mono text-xs text-gray-800 dark:text-gray-200 select-all">
                {log.entityId || 'N/A'}
              </div>
            </div>
          </div>

          {/* Section 3: Payload Diff */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-500" />
                {t('auditLogs.diffSection', 'Chi tiết thay đổi dữ liệu (Payload Diff)')}
              </span>
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                {t('auditLogs.fieldsChanged', { count: Object.keys(payloadDiff).length })}
              </span>
            </h3>

            {!hasDiff ? (
              <div className="p-8 text-center bg-gray-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-gray-500 text-sm">
                {t('auditLogs.noDiff', 'Không có dữ liệu thay đổi hoặc hành động này không ghi nhận chi tiết payload.')}
              </div>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(payloadDiff).map(([key, value]) => {
                  let oldVal = '-';
                  let newVal;
                  if (value && typeof value === 'object') {
                    oldVal = value.old !== null && value.old !== undefined ? String(value.old) : '-';
                    newVal = value.new !== null && value.new !== undefined ? String(value.new) : '-';
                  } else {
                    newVal = String(value);
                  }

                  return (
                    <div
                      key={key}
                      className="p-3.5 bg-gray-50/80 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-gray-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                    >
                      <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm min-w-[140px] font-mono">
                        {key}
                      </span>
                      
                      <div className="flex flex-wrap items-center gap-2.5 text-sm font-mono flex-1 justify-end">
                        <span className="px-2.5 py-1 bg-rose-100/80 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-lg line-through decoration-rose-500/50 text-xs max-w-[250px] truncate" title={oldVal}>
                          {oldVal}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="px-2.5 py-1 bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg font-semibold text-xs max-w-[250px] truncate" title={newVal}>
                          {newVal}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-gray-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            {t('auditLogs.closeWindow', 'Đóng cửa sổ')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuditLogDetailModal;
