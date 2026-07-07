/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../services/axiosClient';
import useAuth from './useAuth';
import * as ReactUseWebSocket from 'react-use-websocket';
const useWebSocket = ReactUseWebSocket.default;
const { ReadyState } = ReactUseWebSocket;

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

const getWsUrl = (token) => {
    if (!token) return null;
    const apiBase = window.__ENV__?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const wsBase = apiBase.replace(/^http/, 'ws');
    return `${wsBase}/api/v1/ws/notifications?token=${token}`;
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const wsUrl = useCallback(() => {
        if (!user) return null;
        const currentToken = localStorage.getItem('accessToken');
        return currentToken ? getWsUrl(currentToken) : null;
    }, [user]);

    const { lastJsonMessage, readyState } = useWebSocket(wsUrl, {
        shouldReconnect: () => true,
        reconnectAttempts: 10,
        reconnectInterval: 5000,
        share: true,
    });

    useEffect(() => {
        if (!user) return;
        const fetchNotifications = async () => {
            try {
                const [listRes, countRes] = await Promise.all([
                    axiosClient.get('/notifications/my'),
                    axiosClient.get('/notifications/unread-count')
                ]);
                if (listRes?.data) setNotifications(listRes.data);
                if (countRes?.data !== undefined) setUnreadCount(countRes.data);
            } catch (err) {
                console.error('Failed to fetch notifications', err);
            }
        };
        fetchNotifications();
    }, [user]);

    useEffect(() => {
        if (!lastJsonMessage) return;
        const newNotif = lastJsonMessage;
        setNotifications(prev => {
            const exists = prev.some(n => n.id === newNotif.id);
            if (exists) return prev;
            return [newNotif, ...prev].slice(0, 20);
        });
        if (newNotif.status === 'SENT') {
            setUnreadCount(prev => prev + 1);
        }
    }, [lastJsonMessage]);

    useEffect(() => {
        const statusMap = {
            [ReadyState.CONNECTING]: 'Connecting',
            [ReadyState.OPEN]: 'Connected',
            [ReadyState.CLOSING]: 'Closing',
            [ReadyState.CLOSED]: 'Closed',
        };
        console.debug(`[WS Notifications] ${statusMap[readyState] ?? 'Unknown'}`);
    }, [readyState]);

    const markAsRead = async (id) => {
        try {
            await axiosClient.post(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'READ' } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            await axiosClient.post('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllRead,
            readyState
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
