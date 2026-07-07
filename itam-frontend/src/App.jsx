import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import useAuth from "./context/useAuth";
import LoginPage from "./pages/LoginPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import AssetListPage from "./pages/AssetListPage";
import AssetDetailPage from "./pages/AssetDetailPage";
import AssetFormPage from "./pages/AssetFormPage";
import DashboardPage from "./pages/DashboardPage";
import CategoryListPage from "./pages/CategoryListPage";
import LicenseListPage from "./pages/LicenseListPage";
import LicenseDetailPage from "./pages/LicenseDetailPage";
import MyAssetListPage from "./pages/MyAssetListPage";
import RequestListPage from "./pages/RequestListPage";
import RequestAssetPage from "./pages/RequestAssetPage";
import InventoryListPage from "./pages/InventoryListPage";
import InventoryScanPage from "./pages/InventoryScanPage";
import InventoryReportPage from "./pages/InventoryReportPage";
import UserManagementPage from "./pages/UserManagementPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import SettingsPage from "./pages/SettingsPage";
import SystemConfigPage from "./pages/SystemConfigPage";
import { ToastProvider } from "./context/ToastContext";
import { NotificationProvider } from "./context/NotificationContext";

function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <ToastProvider>
                    <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/unauthorized" element={<UnauthorizedPage />} />
                        <Route element={<ProtectedRoute />}>
                            <Route element={<AppLayout />}>
                                {/* Route trang chủ dựa vào quyền của từng role */}
                                <Route path="/" element={<RoleBasedIndexRedirect />} />

                                {/* Route chung (SUPER_ADMIN, IT_STAFF, EMPLOYEE) */}
                                <Route path="/my-assets" element={<MyAssetListPage />} />
                                <Route path="/request-asset" element={<RequestAssetPage />} />
                                <Route path="/inventory/scan" element={<InventoryScanPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                                <Route path="/assets/:id" element={<AssetDetailPage />} />

                                {/* Route quản lý (SUPER_ADMIN, IT_STAFF) */}
                                <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_STAFF']} />}>
                                    <Route path="/assets" element={<AssetListPage />} />
                                    <Route path="/assets/new" element={<AssetFormPage />} />
                                    <Route path="/assets/:id/edit" element={<AssetFormPage />} />
                                    <Route path="/categories" element={<CategoryListPage />} />
                                    <Route path="/licenses" element={<LicenseListPage />} />
                                    <Route path="/licenses/:id" element={<LicenseDetailPage />} />
                                    <Route path="/requests" element={<RequestListPage />} />
                                    <Route path="/inventory" element={<InventoryListPage />} />
                                    <Route path="/inventory/:id/report" element={<InventoryReportPage />} />
                                </Route>

                                {/* Route quản trị (SUPER_ADMIN) */}
                                <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                                    <Route path="/users" element={<UserManagementPage />} />
                                    <Route path="/audit-logs" element={<AuditLogsPage />} />
                                    <Route path="/system-config" element={<SystemConfigPage />} />
                                </Route>
                            </Route>
                        </Route>
                        {/* Route chuyển hướng khi không tìm thấy trang */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </ToastProvider>
            </NotificationProvider>
        </AuthProvider>
    );
}

const RoleBasedIndexRedirect = () => {
    const { user } = useAuth();
    if (user?.role === 'EMPLOYEE') {
        return <Navigate to="/my-assets" replace />;
    }
    return <DashboardPage />;
};

export default App;