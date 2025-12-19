import { useState, useEffect } from "react";
import { Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, Paper, CircularProgress, ListItemButton } from '@mui/material';
import { useNavigate } from "react-router-dom";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import * as api from "../services/api";
import type { User } from '../types/user';

// 💡 Props の型定義に onItemClick を追加
interface InProgressPurchasesProps {
    user: User;
    onItemClick: (txId: number) => void;
}

export const InProgressPurchases = ({ user, onItemClick }: InProgressPurchasesProps) => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<api.Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await api.fetchInProgressPurchases(user.id);
                setTransactions(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [user.id]);

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', pb: 10 }}>
            {/* プロフィールヘッダー */}
            <Paper
                elevation={0}
                onClick={() => navigate(`/user/${user.id}`)}
                sx={{
                    display: 'flex', alignItems: 'center', p: 3, mb: 3,
                    cursor: 'pointer', '&:hover': { bgcolor: '#f8f8f8' },
                    borderBottom: '1px solid #eee'
                }}
            >
                <Avatar src={user.icon_url} sx={{ width: 64, height: 64, mr: 2, border: '1px solid #eee' }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{user.username}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        プロフィールを見る
                    </Typography>
                </Box>
                <ArrowForwardIosIcon sx={{ fontSize: '1rem', color: '#ccc' }} />
            </Paper>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, px: 2 }}>
                進行中の取引
            </Typography>

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mx: 2 }}>
                {loading ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
                ) : transactions.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">進行中の取引はありません</Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {transactions.map((tx, index) => (
                            <Box key={tx.id}>
                                <ListItem disablePadding>
                                    {/* 💡 navigate を直接呼ぶのではなく、 Props で渡された onItemClick を使用するように変更 */}
                                    <ListItemButton onClick={() => onItemClick(tx.id)}>
                                        <ListItemAvatar>
                                            <Avatar variant="rounded" src={tx.item?.image_url} />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={tx.item?.title}
                                            secondary={`ステータス: ${tx.status}`}
                                        />
                                    </ListItemButton>
                                </ListItem>
                                {index < transactions.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </List>
                )}
            </Paper>
        </Box>
    );
};