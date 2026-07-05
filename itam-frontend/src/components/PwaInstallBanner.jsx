import { useEffect, useMemo, useState } from 'react';
import { Download, X, Smartphone, Share2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const isStandaloneDisplay = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const isIosDevice = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

export default function PwaInstallBanner({ customTitle, customSubtitle }) {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const canNativePrompt = useMemo(() => Boolean(deferredPrompt), [deferredPrompt]);

  useEffect(() => {
    // Kiểm tra nếu app đã cài đặt hoặc người dùng đã tắt trong phiên làm việc
    if (isStandaloneDisplay() || sessionStorage.getItem('pwa_dismissed') === 'true') {
      return;
    }

    // Lắng nghe sự kiện native của Chrome/Edge/Android
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault(); // Ngăn trình duyệt tự động hiện infobar mặc định
      setDeferredPrompt(event);
      setVisible(true);
    };

    // Khi người dùng cài đặt thành công
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setVisible(false);
      setHelpOpen(false);
      sessionStorage.setItem('pwa_dismissed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Hiển thị sau 1.5 giây để gợi ý
    const timer = window.setTimeout(() => {
      if (!isStandaloneDisplay() && sessionStorage.getItem('pwa_dismissed') !== 'true') {
        setVisible(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setHelpOpen((prev) => !prev);
      return;
    }

    // Kích hoạt bảng hỏi cài đặt native của trình duyệt
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setVisible(false);
      sessionStorage.setItem('pwa_dismissed', 'true');
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('pwa_dismissed', 'true');
  };

  if (!visible) return null;

  const title = customTitle || t('pwa.title');
  const subtitle = customSubtitle || t('pwa.subtitle');
  const btnText = canNativePrompt ? t('pwa.installBtn') : t('pwa.guideBtn');

  return (
    <div className="fixed right-4 left-4 sm:right-6 sm:left-auto bottom-20 sm:bottom-6 z-[60] max-w-sm sm:max-w-md ml-auto animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 shadow-2xl shadow-indigo-500/10 dark:shadow-black/40">
        <div className="flex items-start gap-3.5">
          {/* Icon Box */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
            {canNativePrompt ? <Download className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                  {title}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-normal">
                  {subtitle}
                </p>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="shrink-0 -mr-1 -mt-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-white hover:bg-indigo-700 rounded-xl px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-xs shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
              >
                {canNativePrompt ? <Download className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
                {btnText}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t('pwa.laterBtn')}
              </button>
            </div>

            {/* Box hướng dẫn cho iOS hay các trình duyệt không hỗ trợ */}
            {helpOpen && !canNativePrompt && (
              <div className="mt-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/70 dark:bg-indigo-500/10 p-3 text-xs leading-5 text-indigo-950 dark:text-indigo-200 animate-in fade-in zoom-in-95 duration-200">
                {isIosDevice() ? (
                  <div className="flex items-start gap-2">
                    <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>{t('pwa.iosGuide')}</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>{t('pwa.androidGuide')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
