import { Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, Paper } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CampaignIcon from '@mui/icons-material/Campaign';
import { useNotifications } from '../hooks/useNotifications';
import type { User } from '../types/user';

interface NotificationsPageProps {
    user: User;
}

export const NotificationsPage = ({ user }: NotificationsPageProps) => {
    // WebSocket Hookから現在の通知リストを取得
    const { notifications } = useNotifications(user.id);

    const getIcon = (type: string) => {
        switch (type) {
            case 'LIKE': return <FavoriteIcon sx={{ color: '#e91e63' }} />;
            case 'COMMENT': return <ChatBubbleIcon sx={{ color: '#1a1a1a' }} />;
            default: return <CampaignIcon sx={{ color: '#00bcd4' }} />;
        }
    };

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
                                            window.location.href = `/items/${noti.related_id}`;
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
                                        primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: noti.is_read ? 500 : 700 }}
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