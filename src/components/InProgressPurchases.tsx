import { useState, useEffect, useCallback } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import { Box, Typography, Card, CardContent, CardMedia, Chip } from '@mui/material';
// PurchaseHistory.tsx からヘルパー関数をインポートすることを想定
import { getStatusChipProps } from '../utils/transaction-helpers.tsx'

interface InProgressPurchasesProps {
    user: User;
    onItemClick: (id: number) => void;
}

export const InProgressPurchases = ({ user, onItemClick }: InProgressPurchasesProps) => {
    const [transactions, setTransactions] = useState<api.Transaction[]>([]);
    const [loading, setLoading] = useState(true);

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
        <Box sx={{ mt: 3 }}>
            <Typography variant="h5" gutterBottom>取引中の商品</Typography>
            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    // 画面サイズに基づいたレスポンシブな列定義
                    gridTemplateColumns: {
                        xs: '1fr', // 1列
                        sm: '1fr 1fr', // 2列
                        md: '1fr 1fr 1fr', // 3列
                        lg: '1fr 1fr 1fr 1fr', // 4列
                    },
                    justifyContent: 'flex-start'
                }}
            >
                {transactions.map((tx) => (
                    <Box
                        key={tx.id}
                        onClick={() => onItemClick(tx.item.id)}
                        sx={{
                            cursor: 'pointer',
                            borderRadius: '8px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            overflow: 'hidden',
                            '&:hover': { boxShadow: 3 }
                        }}
                    >
                        <Card sx={{ display: 'flex', height: 100, '&:hover': { boxShadow: 3 } }}>
                            <CardMedia
                                component="img"
                                sx={{ width: 100, objectFit: 'cover' }}
                                image={tx.item.image_url}
                                alt={tx.item.title}
                            />
                            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                <CardContent sx={{ flex: '1 0 auto', p: 1, '&:last-child': { pb: 1 } }}>
                                    <Typography component="div" variant="subtitle2" noWrap>
                                        {tx.item.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" component="div">
                                        ¥{tx.price_snapshot.toLocaleString()}
                                    </Typography>
                                    <Box sx={{ mt: 0.5 }}>
                                        {/* PurchaseHistoryからインポートしたヘルパー関数を使用 */}
                                        <Chip
                                            label={getStatusChipProps(tx.Status).label}
                                            size="small"
                                            color={getStatusChipProps(tx.Status).color as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | undefined}
                                            variant="outlined"
                                        />
                                    </Box>
                                </CardContent>
                            </Box>
                        </Card>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};