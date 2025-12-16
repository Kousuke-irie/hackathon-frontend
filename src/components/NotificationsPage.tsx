import { useState, useEffect } from "react";
import { Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, Paper } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CampaignIcon from '@mui/icons-material/Campaign';
import { useNotifications } from '../hooks/useNotifications';
import * as api from "../services/api"; // APIをインポート
import type { User } from '../types/user';
import type { Notification } from '../types/notification'; // Notification型をインポート
import { useNavigate } from "react-router-dom";

interface NotificationsPageProps {
    user: User;
}

export const NotificationsPage = ({ user }: NotificationsPageProps) => {
    const navigate = useNavigate();

    // 1. 通知リストを管理するステートを追加 (TS2552, TS7006 の修正)
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    // WebSocket Hookから受信用の通知を取得
    const { notifications: wsNotifications } = useNotifications({user});

    // 2. 初期表示時に API から過去の通知を取得 (fetchNotifications の使用)
    useEffect(() => {
        const loadNotifications = async () => {
            setLoading(true);
            try {
                const data = await api.fetchNotifications(user.id);
                // バックエンドのレスポンス形式に合わせて調整
                setNotifications(data.notifications || []);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            (async () => {
                await loadNotifications();
            })();
        }
    }, [user.id]);

    // 3. WebSocket で新しい通知が来たらリストの先頭に追加
    useEffect(() => {
        if (wsNotifications.length > 0) {
            const latest = wsNotifications[0];
            setNotifications((prev: Notification[]) => [latest, ...prev]);
        }
    }, [wsNotifications]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'LIKE': return <FavoriteIcon sx={{ color: '#e91e63' }} />;
            case 'COMMENT': return <ChatBubbleIcon sx={{ color: '#1a1a1a' }} />;
            default: return <CampaignIcon sx={{ color: '#00bcd4' }} />;
        }
    };

    if (loading) {
        return <Box sx={{ p: 4, textAlign: 'center' }}>読み込み中...</Box>;
    }

    return (
        <Box sx={{ maxWidth: 700, mx: 'auto', py: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, px: 2 }}>
                お知らせ
            </Typography>
            <Paper elevation={0} sx={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                <List sx={{ p: 0 }}>
                    {notifications.length === 0 ? (
                        <ListItem sx={{ py: 4, justifyContent: 'center' }}>
                            <Typography color="text.secondary">新しいお知らせはありません</Typography>
                        </ListItem>
                    ) : (
                        notifications.map((noti, index) => (
                            <Box key={noti.id}>
                                <ListItem
                                    sx={{
                                        py: 2,
                                        cursor: 'pointer',
                                        bgcolor: noti.is_read ? 'transparent' : 'rgba(0, 188, 212, 0.04)',
                                        '&:hover': { bgcolor: '#fafafa' }
                                    }}
                                    onClick={() => {
                                        if (noti.related_id) {
                                            // window.location.href を navigate に変更
                                            navigate(`/items/${noti.related_id}`);
                                        }
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: '#f5f5f5' }}>
                                            {getIcon(noti.type)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={noti.content}
                                        secondary={new Date(noti.created_at).toLocaleString()}
                                        // 4. 非推奨警告 (TS6385) の修正: slotProps を使用
                                        slotProps={{
                                            primary: {
                                                sx: {
                                                    fontSize: '0.95rem',
                                                    fontWeight: noti.is_read ? 500 : 700
                                                }
                                            }
                                        }}
                                    />
                                </ListItem>
                                {index < notifications.length - 1 && <Divider />}
                            </Box>
                        ))
                    )}
                </List>
            </Paper>
        </Box>
    );
};