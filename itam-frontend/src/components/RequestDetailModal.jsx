import { useTranslation } from 'react-i18next';
import { X, FileText, CheckCircle, XCircle, Clock, User, ArrowRight, Calendar, AlertCircle } from 'lucide-react';

const RequestDetailModal = ({ isOpen, onClose, allocation, assetInfo, fromUserName, toUserName, onConfirm, onReject, canAction, formatDate }) => {
  const { t } = useTranslation();

  if (!isOpen || !allocation) return null;

  const isPending = allocation.confirmationStatus === 'PENDING';
  const isConfirmed = allocation.confirmationStatus === 'CONFIRMED';
  const isRejected = allocation.confirmationStatus === 'REJECTED';

  const getStatusBadge = () => {
    if (isConfirmed) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50">
          <CheckCircle className="w-4 h-4" />
          {t('requests.confirmed', 'Đã xác nhận')}
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/50">
          <XCircle className="w-4 h-4" />
          {t('requests.rejected', 'Đã từ chối')}
        </span>
      );
    }
    if (isPending) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50 animate-pulse">
          <Clock className="w-4 h-4" />
          {t('requests.pending', 'Đang chờ')}
        </span>
      );
    }
  };

  const getActionTypeLabel = (type) => {
    switch (type) {
      case 'ASSIGN':
        return <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t('requests.actionAssignDesc', 'Cấp phát mới (Assign)')}</span>;
      case 'TRANSFER':
        return <span className="text-indigo-600 dark:text-indigo-400 font-bold">{t('requests.actionTransferDesc', 'Điều chuyển (Transfer)')}</span>;
      case 'RETURN':
        return <span className="text-amber-600 dark:text-amber-400 font-bold">{t('requests.actionReturnDesc', 'Thu hồi / Trả lại (Return)')}</span>;
      default:
        return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('requests.detailTitle', 'Chi tiết Phiếu Bàn giao / Yêu cầu')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {t('requests.requestCode', 'Mã phiếu')}: #{allocation.id || allocation.allocationId}
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
          
          {/* Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-gray-800">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('requests.confirmStatus', 'Trạng thái xác nhận')}</span>
              <div>{getStatusBadge()}</div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('requests.actionTypeLabel', 'Loại thao tác')}</span>
              <div className="text-sm font-semibold">{getActionTypeLabel(allocation.actionType)}</div>
            </div>
          </div>

          {/* Asset Info */}
          <div className="bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {t('requests.assetSection', 'Thông tin Tài sản & Thiết bị')}
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-base font-bold text-gray-900 dark:text-white">{assetInfo.name || '-'}</div>
                <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">{t('requests.assetCode', 'Mã tài sản')}: {assetInfo.code || allocation.assetCode || '-'}</div>
              </div>
            </div>
          </div>

          {/* Transfer Info */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4 bg-white dark:bg-slate-900">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-500" />
              {t('requests.transferSection', 'Luân chuyển người dùng')}
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-slate-800/40 rounded-xl">
              <div className="text-center sm:text-left w-full sm:w-auto">
                <span className="text-xs text-gray-400 block mb-1">{t('requests.fromUserLabel', 'Người bàn giao (Từ)')}</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{fromUserName}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 hidden sm:block shrink-0" />
              <div className="text-center sm:text-right w-full sm:w-auto">
                <span className="text-xs text-gray-400 block mb-1">{t('requests.toUserLabel', 'Người tiếp nhận (Đến)')}</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">{toUserName}</span>
              </div>
            </div>
          </div>

          {/* Timeline & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                {t('requests.eventTimeLabel', 'Thời gian thực hiện')}
              </span>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatDate(allocation.assignedAt || allocation.createdAt)}
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                {t('requests.lastUpdateLabel', 'Thời gian cập nhật cuối')}
              </span>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatDate(allocation.returnedAt || allocation.updatedAt || allocation.assignedAt)}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-2 bg-gray-50/50 dark:bg-slate-800/30">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block">
              {t('requests.notesSection', 'Ghi chú & Lý do thực hiện')}
            </span>
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed min-h-[40px]">
              {allocation.notes || <span className="italic text-gray-400">{t('requests.noNotes', 'Không có ghi chú nào được để lại.')}</span>}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            {canAction && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-4 h-4" />
                {t('requests.confirmPrompt', 'Vui lòng xác nhận hoặc từ chối phiếu bàn giao này')}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {canAction && (
              <>
                <button
                  onClick={() => { onClose(); onReject(allocation.id); }}
                  className="px-4 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-700 dark:text-rose-400 text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  {t('myAssets.reject', 'Từ chối')}
                </button>
                <button
                  onClick={() => { onClose(); onConfirm(allocation.id); }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t('requests.confirmBtn', 'Xác nhận nhận thiết bị')}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              {t('common.close', 'Đóng')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RequestDetailModal;
