import { useState, useEffect, useCallback } from "react";
import {useNavigate} from "react-router-dom";
import * as api from "../services/api";
import type { User } from "../types/user";
import { Box, Typography, Chip, Avatar } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { getStatusChipProps } from '../utils/transaction-helpers.tsx'
import {getFirstImageUrl} from "../utils/image-helpers.tsx";

interface InProgressPurchasesProps {
    user: User;
    onItemClick: (id: number) => void;
}

export const InProgressPurchases = ({ user, onItemClick }: InProgressPurchasesProps) => {
    const [transactions, setTransactions] = useState<api.Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchInProgressHistory = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.fetchInProgressPurchases(user.id);
            setTransactions(data);
        } catch (error) {
            console.error("Failed to fetch in-progress history:", error);
        } finally {
            setLoading(false);
        }
    }, [user.id]); // user.id を依存配列に追加

    useEffect(() => {
        if (user) {
            (async () => {
                await fetchInProgressHistory();
            })();
        }
    }, [user, fetchInProgressHistory]);

    if (!user) return <Typography align="center" sx={{ mt: 5 }}>ログインしてください。</Typography>;
    if (loading) return <Typography align="center" sx={{ mt: 5 }}>Loading...</Typography>;
    if (transactions.length === 0) {
        return <Typography align="center" sx={{ mt: 5 }}>取引中の商品はありません。</Typography>;
    }

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', pb: 10 }}>
            {/* 💡 メルカリ風マイページヘッダーを追加 */}
            <Box
                onClick={() => navigate(`/user/${user.id}`)}
                sx={{
                    display: 'flex', alignItems: 'center', p: 3, mb: 3,
                    cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' }
                }}
            >
                <Avatar src={user.icon_url} sx={{ width: 64, height: 64, mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{user.username}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        出品数 0 ・ フォロワー 0
                    </Typography>
                </Box>
                <ArrowForwardIosIcon sx={{ fontSize: '1rem', color: '#ccc' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
                取引中の商品
            </Typography>

            <Box sx={{ display: 'grid', gap: 2 }}>
                {transactions.map((tx) => (
                    <Box
                        key={tx.id}
                        onClick={() => onItemClick(tx.id)}
                        sx={{
                            display: 'flex',
                            p: 2,
                            border: '1px solid #eee',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: '#fafafa', borderColor: '#1a1a1a' }
                        }}
                    >
                        <Box sx={{ width: 70, height: 70, borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                            <img src={getFirstImageUrl(tx.item.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                        <Box sx={{ flex: 1, ml: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }} noWrap>
                                {tx.item.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    ¥{(tx.price_snapshot || tx.item.price).toLocaleString()}
                                </Typography>
                                <Chip
                                    label={getStatusChipProps(tx.status).label}
                                    size="small"
                                    variant="filled"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        fontWeight: 'bold',
                                        bgcolor: '#1a1a1a', // モノトーンに変更
                                        color: '#fff'
                                    }}
                                />
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                            <ArrowForwardIosIcon sx={{ fontSize: '0.8rem', color: '#ccc' }} />
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};