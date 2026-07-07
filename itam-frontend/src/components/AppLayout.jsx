import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard, Package, Key, GitPullRequest, FolderTree, Users, ShieldAlert, Monitor, FileText, QrCode, ClipboardCheck, Sliders
} from 'lucide-react';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import PwaInstallBanner from './PwaInstallBanner';

// Component nút menu mobile ở dưới đáy màn hình
const MobileMenuItem = ({ icon: Icon, label, to, isScanner }) => (
    <NavLink
        to={to}
        aria-label={label}
        className={({ isActive }) =>
            isScanner
                ? `flex flex-col items-center justify-center -mt-7 h-14 w-14 mx-auto rounded-full border-4 border-white dark:border-slate-950 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-200/70 dark:shadow-none transition-transform hover:scale-105 active:scale-95 ${isActive ? 'ring-4 ring-indigo-200/70 dark:ring-indigo-500/20' : ''}`
                : `flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[10px] font-medium transition-colors cursor-pointer ${isActive
                    ? 'text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10'
                    : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300'
                }`
        }
    >
        <Icon className={isScanner ? 'w-6 h-6 shrink-0' : 'w-5 h-5 shrink-0'} />
        {!isScanner && <span className="leading-none truncate max-w-[64px] text-center">{label}</span>}
    </NavLink>
);

export default function AppLayout() {
    const { t, i18n } = useTranslation();
    const [isDark, setIsDark] = useState(() =>
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(() => {
        return localStorage.getItem('desktopMenuOpen') !== 'false';
    });

    const handleMenuToggle = () => {
        if (window.innerWidth >= 768) {
            const nextState = !isDesktopMenuOpen;
            setIsDesktopMenuOpen(nextState);
            localStorage.setItem('desktopMenuOpen', nextState.toString());
        } else {
            setIsMobileMenuOpen(true);
        }
    };

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const role = user?.role || 'SUPER_ADMIN';

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    useEffect(() => {
        const lang = i18n.language || 'vi';
        document.documentElement.lang = lang;
        document.title = lang.startsWith('en') ? 'ITAM — IT Asset Management' : 'ITAM — Quản lý Tài sản CNTT';
    }, [i18n.language]);

    const toggleLanguage = () => {
        const nextLang = i18n.language?.startsWith('vi') ? 'en' : 'vi';
        i18n.changeLanguage(nextLang);
        localStorage.setItem('language', nextLang);
        document.documentElement.lang = nextLang;
    };

    const menuItems = [
        { path: '/', label: t('menu.dashboard'), icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'IT_STAFF'] },
        
        // Personal
        { path: '/my-assets', label: t('menu.myAssets'), icon: Monitor, roles: ['SUPER_ADMIN', 'IT_STAFF', 'EMPLOYEE'] },
        { path: '/request-asset', label: t('menu.requestAsset'), icon: GitPullRequest, roles: ['SUPER_ADMIN', 'IT_STAFF', 'EMPLOYEE'] },

        // Management
        { path: '/assets', label: t('menu.assets'), icon: Package, roles: ['SUPER_ADMIN', 'IT_STAFF'] },
        { path: '/licenses', label: t('menu.licenses'), icon: Key, roles: ['SUPER_ADMIN', 'IT_STAFF'] },
        { path: '/categories', label: t('menu.categories'), icon: FolderTree, roles: ['SUPER_ADMIN', 'IT_STAFF'] },
        { path: '/requests', label: t('menu.requests'), icon: FileText, roles: ['SUPER_ADMIN', 'IT_STAFF'] },
        { path: '/inventory', label: t('menu.inventory'), icon: ClipboardCheck, roles: ['SUPER_ADMIN', 'IT_STAFF'] },

        // System Administration
        { path: '/users', label: t('menu.users'), icon: Users, roles: ['SUPER_ADMIN'] },
        { path: '/audit-logs', label: t('menu.auditLogs'), icon: ShieldAlert, roles: ['SUPER_ADMIN'] },
        { path: '/system-config', label: t('menu.systemConfig', 'Cấu hình Hệ thống'), icon: Sliders, roles: ['SUPER_ADMIN'] },
    ];

    const mobileMenuItems = [
        { path: '/', label: t('menu.dashboard'), icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'IT_STAFF'], showOnMobile: true },
        { path: '/my-assets', label: t('menu.myAssets'), icon: Monitor, roles: ['SUPER_ADMIN', 'IT_STAFF', 'EMPLOYEE'], showOnMobile: true },
        { path: '/inventory/scan?mode=lookup', label: t('menu.scanQR'), icon: QrCode, roles: ['SUPER_ADMIN', 'IT_STAFF', 'EMPLOYEE'], showOnMobile: true, isScanner: true },
        { path: '/request-asset', label: t('menu.requestAsset'), icon: GitPullRequest, roles: ['SUPER_ADMIN', 'IT_STAFF', 'EMPLOYEE'], showOnMobile: true },
        { path: '/inventory', label: t('menu.inventory'), icon: ClipboardCheck, roles: ['SUPER_ADMIN', 'IT_STAFF'], showOnMobile: true },
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(role));
    const filteredMobileMenu = mobileMenuItems.filter(item => item.roles.includes(role) && item.showOnMobile);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
            <Sidebar
                isOpen={isMobileMenuOpen}
                isDesktopOpen={isDesktopMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                onDesktopToggle={() => {
                    const nextState = !isDesktopMenuOpen;
                    setIsDesktopMenuOpen(nextState);
                    localStorage.setItem('desktopMenuOpen', nextState.toString());
                }}
                menuItems={filteredMenu}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    onOpenMenu={handleMenuToggle}
                    isDark={isDark}
                    setIsDark={setIsDark}
                    toggleLanguage={toggleLanguage}
                    user={user}
                />

                <PwaInstallBanner />

                <main className="flex-1 overflow-hidden flex flex-col min-h-0 bg-gray-50 dark:bg-slate-900/50 pb-16 md:pb-0">
                    <Outlet />
                </main>

                {/* Mobile bottom navigation */}
                <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-gray-200/80 dark:border-gray-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.24)] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                    <div className={`grid ${filteredMobileMenu.length === 3 ? 'grid-cols-3' : filteredMobileMenu.length === 4 ? 'grid-cols-4' : 'grid-cols-5'} items-end px-2 pt-2`}>
                        {filteredMobileMenu.map((item) => (
                            <MobileMenuItem
                                key={item.path}
                                to={item.path}
                                icon={item.icon}
                                label={item.label}
                                isScanner={item.isScanner}
                            />
                        ))}
                    </div>
                </nav>
            </div>
        </div>
    );
}
