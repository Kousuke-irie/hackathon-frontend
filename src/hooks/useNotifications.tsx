import { useState, useEffect, useCallback } from 'react';
import type {Notification}  from '../types/notification';

export const useNotifications = (userId: number | undefined) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const connect = useCallback(() => {
        if (!userId) return;

        // バックエンドのURL (例: ws://localhost:8080/ws/notifications?user_id=1)
        const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}/ws/notifications?user_id=${userId}`;
        const socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
            const newNotification: Notification = JSON.parse(event.data);
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected. Reconnecting...');
            setTimeout(connect, 3000); // 3秒後に再接続
        };

        return socket;
    }, [userId]);

    useEffect(() => {
        const socket = connect();
        return () => socket?.close();
    }, [connect]);

    return { notifications, unreadCount, setUnreadCount };
};