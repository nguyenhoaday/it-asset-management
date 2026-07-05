import { NavLink } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const SidebarMenuItem = ({ icon: Icon, label, to, onClick, isCollapsed }) => (
    <NavLink
        to={to}
        onClick={onClick}
        title={isCollapsed ? label : undefined}
        className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100'
            } ${isCollapsed ? 'justify-center px-0' : ''}`
        }
    >
        <Icon className="w-5 h-5 shrink-0" />
        {!isCollapsed && <span className="truncate">{label}</span>}
    </NavLink>
);

export default function Sidebar({ isOpen, isDesktopOpen, onClose, onDesktopToggle, menuItems }) {
    return (
        <>
            {/* Mobile */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />
            )}

            <div className={`hidden md:block relative shrink-0 transition-all duration-300 ease-in-out ${isDesktopOpen ? 'w-64' : 'w-[72px]'}`}>
                {/* Desktop sidebar */}
                <aside className="fixed inset-y-0 left-0 flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out overflow-hidden z-30 h-full" style={{ width: 'inherit' }}>
                    {/* Logo */}
                    <div className={`h-16 flex items-center border-b border-gray-200 dark:border-gray-800 shrink-0 ${isDesktopOpen ? 'px-6' : 'justify-center'}`}>
                        <span className={`text-xl font-display font-bold text-indigo-600 dark:text-indigo-400 transition-all duration-200 ${isDesktopOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                            ITAM SYSTEM
                        </span>
                        {!isDesktopOpen && (
                            <span className="text-xl font-display font-bold text-indigo-600 dark:text-indigo-400">IT</span>
                        )}
                    </div>

                    {/* Nav items */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {menuItems.map((item) => (
                            <SidebarMenuItem
                                key={item.path}
                                to={item.path}
                                icon={item.icon}
                                label={item.label}
                                isCollapsed={!isDesktopOpen}
                            />
                        ))}
                    </nav>
                </aside>

                {/* Nút toggle desktop */}
                <button
                    onClick={onDesktopToggle}
                    title={isDesktopOpen ? 'Thu gọn sidebar' : 'Mở rộng sidebar'}
                    className="absolute top-[72px] -right-3.5 z-40 hidden md:flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow-md text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-indigo-100 dark:hover:shadow-indigo-900/30 transition-all duration-200 cursor-pointer"
                >
                    {isDesktopOpen
                        ? <ChevronLeft className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />
                    }
                </button>
            </div>

            {/* Mobile sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800 transform transition-all duration-300 ease-in-out md:hidden overflow-hidden ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}`}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
                    <span className="text-xl font-display font-bold text-indigo-600 dark:text-indigo-400">ITAM SYSTEM</span>
                    <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {menuItems.map((item) => (
                        <SidebarMenuItem
                            key={item.path}
                            to={item.path}
                            icon={item.icon}
                            label={item.label}
                            onClick={onClose}
                            isCollapsed={false}
                        />
                    ))}
                </nav>
            </aside>
        </>
    );
}
