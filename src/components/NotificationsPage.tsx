import { useState, useEffect } from "react";
import { Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, Paper, CircularProgress } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CampaignIcon from '@mui/icons-material/Campaign';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { useNotifications } from '../hooks/useNotifications';
import * as api from "../services/api";
import type { User } from '../types/user';
import type { Notification } from '../types/notification';
import { useNavigate } from "react-router-dom";

interface NotificationsPageProps {
    user: User;
}

export const NotificationsPage = ({ user }: NotificationsPageProps) => {
    const navigate = useNavigate();

    // 1. 通知リストを管理するステートを明示的に作成
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    // 2. WebSocket Hook を使用（unreadCount のリセットも可能）
    const { notifications: wsNotifications, setUnreadCount } = useNotifications({ user });

    // 3. 初期表示時に過去の通知を API から取得
    useEffect(() => {
        const loadInitialNotifications = async () => {
            setLoading(true);
            try {
                const data = await api.fetchNotifications(user.id);
                // バックエンドのレスポンス { notifications: [...] } から配列を取り出す
                setNotifications(data.notifications || []);
                // 画面を開いたら未読数をリセット
                setUnreadCount(0);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            ( async () => {
                await loadInitialNotifications();
            })();
        }
    }, [user.id, setUnreadCount]);

    // 4. 重要：WebSocket で新しい通知が届くたびに、リストの先頭に追加する
    useEffect(() => {
        if (wsNotifications.length > 0) {
            const latest = wsNotifications[0];
            setNotifications(prev => {
                const exists = prev.some(n => n.id === latest.id);
                if (exists) return prev;
                return [latest, ...prev];
            });
        }
    }, [wsNotifications]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'LIKE': return <FavoriteIcon sx={{ color: '#e91e63' }} />;
            case 'COMMENT': return <ChatBubbleIcon sx={{ color: '#1a1a1a' }} />;
            case 'SOLD':
            case 'PURCHASED': return <ShoppingBagIcon sx={{ color: '#ff9800' }} />;
            default: return <CampaignIcon sx={{ color: '#00bcd4' }} />;
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                読み込み中...
            </Box>
        );
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
                            <Box key={noti.id || index}>
                                <ListItem
                                    sx={{
                                        py: 2,
                                        cursor: 'pointer',
                                        bgcolor: noti.is_read ? 'transparent' : 'rgba(0, 188, 212, 0.04)',
                                        '&:hover': { bgcolor: '#fafafa' }
                                    }}
                                    onClick={() => {
                                        if (!noti.related_id) return;

                                        // 💡 修正ポイント: 通知の種類によって遷移先を振り分ける
                                        switch (noti.type) {
                                            case 'COMMUNITY':
                                                navigate(`/communities/${noti.related_id}`);
                                                break;
                                            case 'LIKE':
                                            case 'COMMENT':
                                                navigate(`/items/${noti.related_id}`);
                                                break;
                                            case 'SOLD':
                                            case 'PURCHASED':
                                                navigate(`/transactions/${noti.related_id}`);
                                                break;
                                            default:
                                                console.log("Unknown notification type:", noti.type);
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
                                        slotProps={{
                                            primary: {
                                                sx: {
                                                    fontSize: '0.95rem',
                                                    fontWeight: noti.is_read ? 500 : 800
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