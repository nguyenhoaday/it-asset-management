import { Navigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuth from "../context/useAuth";

export default function ProtectedRoute({ allowedRoles }) {
    const { t } = useTranslation();
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 font-sans">
                {t("common.loading")}
            </div>
        );
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }
    return <Outlet />;
}