import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Sun, Moon, Globe, ChevronDown, User as UserIcon, LogOut, QrCode, Bell, CheckCheck } from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import { useNotification } from '../../context/NotificationContext';

const DropdownItem = ({ icon: Icon, onClick, children, danger = false }) => {
    const baseClass = "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors cursor-pointer text-left";
    const colors = danger
        ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800";

    return (
        <button onClick={onClick} className={`${baseClass} ${colors}`}>
            <Icon className="w-4 h-4" />
            {children}
        </button>
    );
};

const IconButton = ({ icon: Icon, onClick, children, title }) => (
    <button
        onClick={onClick}
        title={title}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
    >
        <Icon className="w-5 h-5" />
        {children}
    </button>
);

export default function Header({ onOpenMenu, isDark, setIsDark, toggleLanguage, user }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const profileMenuRef = useRef(null);
    const notifMenuRef = useRef(null);

    const { notifications, unreadCount, markAsRead, markAllRead } = useNotification();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await axiosClient.post('/auth/logout');
        } catch (e) {
            console.error('Logout error', e);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 z-30 shrink-0 relative">
            <div className="flex items-center gap-4">
                {/* Nút mở mobile menu - chỉ hiển thị trên mobile */}
                <button className="md:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" onClick={onOpenMenu}>
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-4">
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'IT_STAFF') && (
                    <IconButton
                        icon={QrCode}
                        onClick={() => navigate('/inventory/scan?mode=lookup')}
                        title="Quét QR tra cứu thiết bị"
                    />
                )}

                <IconButton icon={isDark ? Sun : Moon} onClick={() => setIsDark(!isDark)} />

                <IconButton icon={Globe} onClick={toggleLanguage}>
                    <span className="text-xs font-medium uppercase hidden sm:block">{i18n.language}</span>
                </IconButton>

                {/* Notification */}
                <div className="relative" ref={notifMenuRef}>
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer flex items-center"
                        title={t('notifications.title')}
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                    </button>

                    {isNotifOpen && (
                        <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto right-2 sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 py-3 z-50 overflow-hidden">
                            <div className="px-4 pb-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <span className="font-bold text-sm text-gray-900 dark:text-white">{t('notifications.title')}</span>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        {t('notifications.markAllRead')}
                                    </button>
                                )}
                            </div>

                            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                                {notifications.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
                                        {t('notifications.empty')}
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => { if (n.status === 'SENT') markAsRead(n.id); }}
                                            className={`p-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${n.status === 'SENT' ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1">{n.subject}</p>
                                                {n.status === 'SENT' && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <div
                                                className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 [&>p]:m-0 [&>h3]:hidden [&>table]:hidden"
                                                dangerouslySetInnerHTML={{ __html: n.body }}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 sm:mx-2"></div>

                {/* Profile dropdown */}
                <div className="relative" ref={profileMenuRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 sm:gap-3 p-1 pr-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-medium text-gray-900 dark:text-white leading-none">{user?.username || 'Guest'}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user?.role || 'Guest'}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                            {(user?.username || 'G').charAt(0).toUpperCase()}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 py-1 z-50 overflow-hidden">
                            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 sm:hidden">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.username || 'Guest'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.role || 'Guest'}</p>
                            </div>

                            <DropdownItem icon={UserIcon} onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}>{t('header.accountSettings')}</DropdownItem>

                            <div className="h-px bg-gray-200 dark:bg-gray-800 my-1"></div>

                            <DropdownItem icon={LogOut} onClick={handleLogout} danger>
                                {t('header.logout')}
                            </DropdownItem>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

