import { useState,useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper,CircularProgress,List,ListItem,ListItemAvatar,Avatar,ListItemButton,ListItemText } from '@mui/material';
import { LikedItems } from './LikedItems';
import { RecentItemsDisplay } from './RecentItemsDisplay';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types/user';
import * as api from '../services/api';

export const MyListPage = ({ user }: { user: User }) => {
    const [tabValue, setTabValue] = useState(0);
    const [followingUsers, setFollowingUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (tabValue === 2 && user) {
            (async () => {
                setLoading(true);
                try {
                    const users = await api.fetchFollows(user.id, 'following');
                    setFollowingUsers(users || []);
                } catch (error) {
                    console.error("Failed to fetch following users:", error);
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [tabValue, user]);

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, px: 2 }}>マイリスト</Typography>

            <Tabs
                value={tabValue}
                onChange={(_, v) => setTabValue(v)}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
            >
                <Tab label="いいね！一覧" />
                <Tab label="閲覧履歴" />
                <Tab label="フォロー中" />
            </Tabs>

            <Box sx={{ px: 2 }}>
                {tabValue === 0 && <LikedItems user={user} onItemClick={(id) => navigate(`/items/${id}`)} />}
                {tabValue === 1 && (
                    <Box sx={{ mt: -4 }}> {/* 既存コンポーネントの余白調整 */}
                        <RecentItemsDisplay currentUser={user} onItemClick={(id) => navigate(`/items/${id}`)} />
                    </Box>
                )}
                {tabValue === 2 && (
                    <Box>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                                <CircularProgress size={30} color="inherit" />
                            </Box>
                        ) : followingUsers.length === 0 ? (
                            <Paper elevation={0} sx={{ p: 5, textAlign: 'center', bgcolor: '#f9f9f9', borderRadius: 4 }}>
                                <Typography color="text.secondary">フォロー中のアカウントはいません</Typography>
                            </Paper>
                        ) : (
                            <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                                {followingUsers.map((u) => (
                                    <ListItem key={u.id} disablePadding sx={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <ListItemButton onClick={() => navigate(`/user/${u.id}`)}>
                                            <ListItemAvatar>
                                                <Avatar src={u.icon_url} />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={u.username}
                                                secondary={u.bio || "自己紹介はありません"}
                                                slotProps={{
                                                    primary: { sx: { fontWeight: 'bold' } },
                                                    secondary: { noWrap: true }
                                                }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
};