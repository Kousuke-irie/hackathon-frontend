import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Divider, Paper, CircularProgress, ListItemButton } from "@mui/material";
import * as api from "../services/api";
import type { User } from "../types/user";

export const ChatList = ({ currentUser }: { currentUser: User }) => {
    const navigate = useNavigate();
    const [threads, setThreads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await api.fetchChatThreads(currentUser.id);
                setThreads(data || []);
            } catch (err) {
                console.error("Failed to fetch threads:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [currentUser.id]);

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', py: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, px: 2 }}>メッセージ</Typography>

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {loading ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
                ) : threads.length === 0 ? (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <Typography color="text.secondary">まだメッセージはありません</Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {threads.map((thread, index) => (
                            <Box key={thread.partner_id}>
                                <ListItem disablePadding>
                                    <ListItemButton onClick={() => navigate(`/chat/${thread.partner_id}`)} sx={{ py: 2 }}>
                                        <ListItemAvatar>
                                            <Avatar src={thread.icon_url} sx={{ border: '1px solid #eee' }} />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={thread.username}
                                            secondary={thread.last_message}
                                            slotProps={{
                                                primary: { sx: { fontWeight: 'bold' } },
                                                secondary: { noWrap: true, sx: { color: 'text.secondary', mt: 0.5 } }
                                            }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                                {index < threads.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </List>
                )}
            </Paper>
        </Box>
    );
};