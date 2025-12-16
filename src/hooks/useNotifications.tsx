import { useState, useEffect, useCallback, useRef } from 'react';
import type { Notification } from '../types/notification';
import * as api from '../services/api';
import type { User } from '../types/user';

export const useNotifications = ({ user }: { user: User | undefined | null }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef<WebSocket | null>(null);
    const [loading, setLoading] = useState(false);

    // 💡 過去の通知取得ロジックの修正
    useEffect(() => {
        // ユーザーが存在しない、または ID がない場合はリセットして終了
        if (!user?.id) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        (async () => {
            setLoading(true);
            try {
                const data = await api.fetchNotifications(user.id);
                // 🚨 エラー対策: data.notifications が null や undefined の場合に備えて空配列をデフォルトにする
                const fetchedList = data?.notifications || [];
                setNotifications(fetchedList);
            } catch (error) {
                console.error("通知の取得に失敗しました:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [user?.id]); // 依存配列を user.id に限定して安定させる

    // 💡 WebSocket接続ロジックの修正
    const connect = useCallback(() => {
        if (!user?.id) return;

        // 既存の接続があればクリーンアップ
        if (socketRef.current) {
            socketRef.current.close();
        }

        const apiBaseUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:8080';
        const defaultWsUrl = apiBaseUrl.replace(/^http/, 'ws');
        const wsUrl = `${import.meta.env.VITE_WS_URL || defaultWsUrl}/ws/notifications?user_id=${user.id}`;

        console.log("Connecting to WS:", wsUrl);

        try {
            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;

            socket.onmessage = (event) => {
                try {
                    const newNotification: Notification = JSON.parse(event.data);
                    setNotifications((prev) => [newNotification, ...(prev || [])]);
                    setUnreadCount((prev) => prev + 1);
                } catch (err) {
                    console.error("Failed to parse notification:", err);
                }
            };

            socket.onclose = (e) => {
                if (e.wasClean) {
                    console.log('WebSocket closed cleanly.');
                } else {
                    console.log('WebSocket connection lost. Reconnecting in 5s...');
                    // 切断された場合の再接続（無限ループ防止のため5秒空ける）
                    setTimeout(() => {
                        if (user?.id) connect();
                    }, 5000);
                }
            };

            socket.onerror = (err) => {
                console.error("WebSocket Error:", err);
            };
        } catch (e) {
            console.error("WebSocket setup failed:", e);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user?.id) {
            connect();
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [user?.id, connect]);

    return { notifications, unreadCount, setUnreadCount, loading };
};