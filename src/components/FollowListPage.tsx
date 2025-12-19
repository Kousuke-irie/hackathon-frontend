import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, ListItemButton } from '@mui/material';
import * as api from '../services/api';
import type { User } from '../types/user';

export const FollowListPage = () => {
    const { userId } = useParams();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') as 'following' | 'followers';
    const [users, setUsers] = useState<User[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (userId && mode) {
            api.fetchFollows(Number(userId), mode).then(setUsers);
        }
    }, [userId, mode]);

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', py: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, px: 2 }}>
                {mode === 'following' ? 'フォロー中' : 'フォロワー'}
            </Typography>
            <List>
                {users.map((u) => (
                    <ListItem key={u.id} disablePadding>
                        <ListItemButton onClick={() => navigate(`/user/${u.id}`)}>
                            <ListItemAvatar>
                                <Avatar src={u.icon_url} />
                            </ListItemAvatar>
                            <ListItemText
                                primary={u.username}
                                secondary={u.bio}
                                // 💡 slotProps を使用して内部の Typography に noWrap を適用
                                slotProps={{
                                    primary: { noWrap: true },
                                    secondary: { noWrap: true }
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};