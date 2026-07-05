import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

function UnauthorizedPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center relative overflow-hidden p-4 font-sans text-gray-900 dark:text-gray-100">
            <div className="absolute inset-0 dot-pattern pointer-events-none"></div>
            
            <div className="relative z-10 w-full max-w-md mx-auto p-8 bg-white dark:bg-slate-900 shadow-2xl border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center text-center gap-6">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center border border-red-100 dark:border-red-900/50">
                    <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>
                
                <div className="flex flex-col gap-2">
                    <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {t("unauthorized.title")}
                    </h1>
                    <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
                        {t("unauthorized.description")}
                    </p>
                </div>

                <div className="w-full flex flex-col gap-3 mt-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors active:scale-[0.98]"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t("unauthorized.backPrevious")}
                    </button>
                    
                    <button
                        onClick={() => navigate("/")}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-[0.98]"
                    >
                        <Home className="w-4 h-4" />
                        {t("unauthorized.backHome")}
                    </button>

                    <div className="w-full border-t border-gray-200 dark:border-gray-800 my-2"></div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-transparent border border-gray-200 dark:border-gray-800 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors active:scale-[0.98]"
                    >
                        <LogOut className="w-4 h-4" />
                        {t("unauthorized.logout")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;