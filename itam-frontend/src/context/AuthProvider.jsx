import { useEffect, useState } from "react";
import AuthContext from "./AuthContext";

function parseJwt(token) {
    try {
        return JSON.parse(
            atob(
                token
                    .split(".")[1]
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
            )
        );
    } catch {
        return null;
    }
}

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setLoading(false);
                return;
            }

            const decoded = parseJwt(token);

            if (decoded && decoded.exp * 1000 > Date.now()) {
                const rawRole = decoded.role || "";
                const role = rawRole.startsWith("ROLE_") ? rawRole.replace("ROLE_", "") : rawRole;
                const userData = {
                    username: decoded.sub,
                    userId: decoded.userId,
                    role: role,
                };
                setUser(userData);
                localStorage.setItem("user", JSON.stringify(userData));
                setLoading(false);
                return;
            }

            // Refresh
            try {
                const BASE_URL = import.meta.env.PROD
                    ? `${(window.__ENV__?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL)}/api/v1`
                    : '/api/v1';
                const response = await fetch(`${BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!response.ok) throw new Error('refresh_failed');
                const json = await response.json();
                const newToken = json?.data?.accessToken ?? json?.accessToken;
                if (!newToken) throw new Error('no_token');

                localStorage.setItem("accessToken", newToken);
                const newDecoded = parseJwt(newToken);
                const rawRole = newDecoded?.role || "";
                const role = rawRole.startsWith("ROLE_") ? rawRole.replace("ROLE_", "") : rawRole;
                const userData = {
                    username: newDecoded?.sub,
                    userId: newDecoded?.userId,
                    role: role,
                };
                setUser(userData);
                localStorage.setItem("user", JSON.stringify(userData));
            } catch {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    const login = (accessToken) => {
        const decoded = parseJwt(accessToken);

        if (!decoded) return false;

        const rawRole = decoded.role || "";
        const role = rawRole.startsWith("ROLE_") ? rawRole.replace("ROLE_", "") : rawRole;

        const userData = {
            username: decoded.sub,
            userId: decoded.userId,
            role: role,
        };

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("user", JSON.stringify(userData));

        setUser(userData);

        return true;
    };

    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}