import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, ListItemButton, Tabs, Tab, IconButton, Divider, CircularProgress } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import * as api from '../services/api';
import type { User } from '../types/user';

export const FollowListPage = () => {
    const { userId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // 初期値を関数で計算してセット（これは継続）
    const [tabValue, setTabValue] = useState(() => {
        return searchParams.get('mode') === 'followers' ? 1 : 0;
    });
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        const mode = newValue === 0 ? 'following' : 'followers';
        setSearchParams({ mode });
    };

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (!userId) return;
            const mode = tabValue === 0 ? 'following' : 'followers';
            setLoading(true);
            try {
                const res = await api.fetchFollows(Number(userId), mode);
                if (isMounted) {
                    setUsers(res || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        })();
        return () => {
            isMounted = false;
        };
    }, [userId, tabValue]); // 依存配列

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', py: 2 }}>
            {/* ... ヘッダーエリア省略 ... */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, px: 1 }}>
                <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
                    <ArrowBackIosNewIcon sx={{ fontSize: '1.2rem' }} />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    ユーザー一覧
                </Typography>
            </Box>

            <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
                <Tab label="フォロー中" sx={{ fontWeight: 'bold' }} />
                <Tab label="フォロワー" sx={{ fontWeight: 'bold' }} />
            </Tabs>

            <Box sx={{ px: 2, mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    {users.length} 人
                </Typography>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress size={30} color="inherit" />
                </Box>
            ) : users.length === 0 ? (
                <Box sx={{ py: 10, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        {tabValue === 0 ? "フォロー中のユーザーはいません" : "フォロワーはいません"}
                    </Typography>
                </Box>
            ) : (
                <List sx={{ p: 0 }}>
                    {users.map((u) => (
                        <Box key={u.id}>
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => navigate(`/user/${u.id}`)} sx={{ py: 1.5 }}>
                                    <ListItemAvatar>
                                        <Avatar src={u.icon_url} sx={{ border: '1px solid #eee' }} />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={u.username}
                                        secondary={u.bio || "自己紹介はありません"}
                                        slotProps={{
                                            primary: { sx: { fontWeight: 'bold', fontSize: '0.95rem' } },
                                            secondary: { noWrap: true, sx: { fontSize: '0.8rem' } }
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                            <Divider component="li" />
                        </Box>
                    ))}
                </List>
            )}
        </Box>
    );
};