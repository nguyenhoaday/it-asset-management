import axios from 'axios';

export const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

// Lấy base URL của API (không kèm prefix) — dùng để build URL cho file/attachment
export const getHostUrl = () => {
    const base = axiosClient.defaults.baseURL || '';
    const idx = base.indexOf(API_PREFIX);
    return idx !== -1 ? base.substring(0, idx) : base;
};

const BASE_URL = import.meta.env.PROD
    ? `${(window.__ENV__?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL)}${API_PREFIX}`
    : API_PREFIX;

const axiosClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
    (response) => {
        return response.data?.data ?? response.data;
    },
    async (error) => {
        const originalRequest = error.config;
        // Nếu lỗi 401 và không phải là request gọi đến API login hoặc refresh
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh') && !originalRequest.url.includes('/auth/login')) {
            
            if (isRefreshing) {
                // Nếu đang có tiến trình refresh chạy rồi, các request sau xếp hàng đợi
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return axiosClient(originalRequest);
                })
                .catch((err) => Promise.reject(err));
            }
            originalRequest._retry = true;
            isRefreshing = true;
            try {
                const response = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
                const { accessToken } = response.data?.data ?? response.data;
                if (accessToken) {
                    localStorage.setItem('accessToken', accessToken);
                    axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    
                    processQueue(null, accessToken);
                    return axiosClient(originalRequest); // Chạy lại request bị lỗi ban đầu
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Refresh thất bại (Refresh Token hết hạn) -> Đăng xuất
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.replace('/login');
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        if (error.response?.status === 403) {
            return Promise.reject(error);
        }
        return Promise.reject(error);
    },
);

export default axiosClient;