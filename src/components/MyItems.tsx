import { useState, useEffect } from "react";
import {useNavigate} from "react-router-dom";
import * as api from "../services/api";
import type { User } from "../types/user";
import { Box, Tabs, Tab, Card, CardMedia, CardContent, Typography, Button } from '@mui/material';
import {getStatusChipProps} from "../utils/transaction-helpers.tsx";

interface MyItemsProps {
    user: User;
}

export const MyItems = ({ user}: MyItemsProps) => {
    const [items, setItems] = useState<api.Item[]>([]);
    const [transactions, setTransactions] = useState<api.Transaction[]>([]);
    const [tabValue, setTabValue] = useState(0); // 0: 出品中, 1: 取引中, 2: 売却済み
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                if (tabValue === 0) {
                    // 出品中: status=ON_SALE
                    const res = await api.fetchMyItems(user.id, 'ON_SALE');
                    setItems(res);
                    setTransactions([]);
                } else if (tabValue === 1) {
                    // 取引中: 既存の販売中取引取得
                    const res = await api.fetchMySalesInProgress(user.id);
                    setTransactions(res);
                    setItems([]);
                } else if (tabValue === 2) {
                    const res = await api.fetchMySalesHistory(user.id);
                    setTransactions(res);
                    setItems([]);
                }
            } catch (error) {
                console.error("Failed to fetch my items/transactions:", error);
                setTransactions([]);
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
                        <Box key={item.id} sx={{ position: 'relative' }}>
                            <Card
                                onClick={() => navigate(`/items/${item.id}`)} // 商品詳細画面へ
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
                                        ¥{(item.price || 0).toLocaleString()}
                                    </Typography>
                                </CardContent>
                            </Card>
                            <Button
                                size="small"
                                variant="contained"
                                onClick={(e) => {
                                    e.stopPropagation(); // 詳細への遷移を阻止
                                    navigate(`/sell/edit/${item.id}`);
                                }}
                                sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    bgcolor: 'rgba(255,255,255,0.9)',
                                    color: '#1a1a1a',
                                    fontSize: '0.7rem',
                                    minWidth: 'auto',
                                    px: 1,
                                    '&:hover': { bgcolor: '#fff' }
                                }}
                            >
                                編集
                            </Button>
                        </Box>
                    ))}

                    {/* 取引中・売却済みタブの場合: api.Transaction を表示 */}
                    {tabValue !== 0 && transactions.map((tx) => (
                        <Box key={tx.id}>
                            <Card
                                onClick={() => navigate(`/transactions/${tx.id}`)} // 取引画面 (TransactionScreen) へ
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
                                        ¥{(tx.price_snapshot || tx.item.price).toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {getStatusChipProps(tx.status).label}
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