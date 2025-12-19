import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import { Box, Tabs, Tab, Card, CardMedia, CardContent, Typography } from '@mui/material';
import {getStatusChipProps} from "../utils/transaction-helpers.tsx";

interface MyItemsProps {
    user: User;
    onItemClick: (id: number) => void;
}

export const MyItems = ({ user, onItemClick }: MyItemsProps) => {
    const [items, setItems] = useState<api.Item[]>([]);
    const [transactions, setTransactions] = useState<api.Transaction[]>([]);
    const [tabValue, setTabValue] = useState(0); // 0: 出品中, 1: 取引中, 2: 売却済み
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                if (tabValue === 0) {
                    // 「出品中」: 自分の出品した ON_SALE 商品を取得
                    const res = await api.fetchMyItems(user.id);
                    setItems(res.filter(i => i.status === 'ON_SALE'));
                    setTransactions([]);
                } else if (tabValue === 1) {
                    const res = await api.fetchMySalesInProgress(user.id);
                    setTransactions(res);
                    setItems([]);
                } else if (tabValue === 2) {
                    // 「売却済み」: 完了した取引履歴を取得
                    const res = await api.fetchPurchaseHistory(user.id);
                    setTransactions(res.filter(tx => tx.seller_id === user.id && (tx.Status === 'COMPLETED' || tx.Status === 'RECEIVED')));
                    setItems([]);
                }
            } catch (error) {
                console.error("Failed to fetch my items/transactions:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [user.id, tabValue]);

    return (
        <Box sx={{ width: '100%' }}>
            {/* タブメニュー */}
            <Tabs
                value={tabValue}
                onChange={(_, v) => setTabValue(v)}
                centered
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
                <Tab label="出品中" />
                <Tab label="取引中" />
                <Tab label="売却済み" />
            </Tabs>

            {loading ? (
                <Typography align="center" sx={{ mt: 4 }}>読み込み中...</Typography>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: {
                            xs: '1fr 1fr',
                            sm: '1fr 1fr 1fr',
                        }
                    }}
                >
                    {/* 出品中タブの場合: api.Item を表示 */}
                    {tabValue === 0 && items.map((item) => (
                        <Box key={item.id}>
                            <Card
                                onClick={() => onItemClick(item.id)} // 商品詳細画面へ
                                sx={{
                                    cursor: 'pointer',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    '&:hover': { boxShadow: 2 }
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={item.image_url}
                                    sx={{ objectFit: 'cover' }}
                                />
                                <CardContent sx={{ p: 1.5, flexGrow: 1 }}>
                                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>
                                        {item.title}
                                    </Typography>
                                    <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                                        ¥{item.price.toLocaleString()}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    ))}

                    {/* 取引中・売却済みタブの場合: api.Transaction を表示 */}
                    {tabValue !== 0 && transactions.map((tx) => (
                        <Box key={tx.id}>
                            <Card
                                onClick={() => onItemClick(tx.id)} // 取引画面 (TransactionScreen) へ
                                sx={{
                                    cursor: 'pointer',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    '&:hover': { boxShadow: 2 }
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={tx.item.image_url}
                                    sx={{ objectFit: 'cover' }}
                                />
                                <CardContent sx={{ p: 1.5, flexGrow: 1 }}>
                                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>
                                        {tx.item.title}
                                    </Typography>
                                    <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                                        ¥{tx.price_snapshot.toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {getStatusChipProps(tx.Status).label}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                </Box>
            )}

            {!loading && (tabValue === 0 ? items.length === 0 : transactions.length === 0) && (
                <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
                    表示できる商品や取引はありません
                </Typography>
            )}
        </Box>
    );
};