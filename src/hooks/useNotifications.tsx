import { useState, useEffect, useCallback, useRef } from 'react';
import type {Notification}  from '../types/notification';
import * as api from '../services/api';
import type { User } from '../types/user';

export const useNotifications = ({ user }: { user: User | undefined }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef<WebSocket | null>(null);
    const [_loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const loadNotifications = async () => {
            setLoading(true);
            try {
                const data = await api.fetchNotifications(user.id);
                // バックエンドが { notifications: [...] } の形式で返す場合
                setNotifications(data.notifications);
            } catch (error) {
                console.error("通知の取得に失敗しました:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            (async ()=> {
                await loadNotifications();
            })();
        }
    }, [user]);

    const connect = useCallback(() => {
        if (!user?.id) return;

        if (socketRef.current) {
            socketRef.current.close();
        }

        // VITE_WS_URL があれば使い、なければ API_URL の http を ws に置換して作る例
        const apiBaseUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:8080';
        const defaultWsUrl = apiBaseUrl.replace(/^http/, 'ws');
        const wsUrl = `${import.meta.env.VITE_WS_URL || defaultWsUrl}/ws/notifications?user_id=${user.id}`;

        console.log("Connecting to WS:", wsUrl);

        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onmessage = (event) => {
            try {
                const newNotification: Notification = JSON.parse(event.data);
                setNotifications((prev) => [newNotification, ...prev]);
                setUnreadCount((prev) => prev + 1);
            } catch (err) {
                console.error("Failed to parse notification:", err);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected. Reconnecting...');
        };
        socket.onerror = (err) => {
            console.error("WebSocket Error:", err);
        };
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        if (user.id) {
            connect();
        }

        // クリーンアップ関数
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [user?.id, connect]);

    return { notifications, unreadCount, setUnreadCount };
};