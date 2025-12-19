import { useState, useEffect, useCallback } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import {
    Box, Typography, Chip, Button, Dialog, DialogTitle,
    DialogContent, Rating, TextField, CardContent, CardMedia, Card
} from '@mui/material';
import { getStatusChipProps } from "../utils/transaction-helpers.tsx";
import {getFirstImageUrl} from "../utils/image-helpers.tsx";

interface PurchaseHistoryProps {
    user: User;
    onItemClick: (txId: number) => void; // 取引詳細画面(TransactionScreen)へ遷移
}

export const PurchaseHistory = ({ user, onItemClick }: PurchaseHistoryProps) => {
    const [transactions, setTransactions] = useState<api.Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedTxId, setSelectedTxId] = useState<number | null>(null);
    const [reviewRating, setReviewRating] = useState<number>(5);
    const [reviewComment, setReviewComment] = useState('');

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.fetchPurchaseHistory(user.id);
            setTransactions(data);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchHistory().catch(console.error);
    }, [fetchHistory]);

    const handleShipment = async (txId: number) => {
        if (!confirm('商品を発送しましたか？ステータスを「配送中」に変更します。')) return;
        try {
            await api.updateTransactionStatus(txId, 'SHIPPED');
            alert('発送通知を送信しました。');
            await fetchHistory();
        } catch (error) {
            console.error("Failed to update status:", error);
            alert('ステータス更新に失敗しました。');
        }
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTxId) return;
        try {
            await api.postReview(selectedTxId, user.id, reviewRating, reviewComment, 'BUYER');
            alert('評価を送信しました。ご利用ありがとうございました！');
            setReviewModalOpen(false);
            await fetchHistory();
        } catch (error) {
            console.error("Review post failed:", error);
            alert('評価の投稿に失敗しました。');
        }
    };

    const handleCancel = async (txId: number) => {
        if (!confirm('取引をキャンセルしますか？発送後はキャンセルできません。')) return;
        try {
            await api.cancelTransaction(txId);
            alert('取引をキャンセルしました。商品は再出品されます。');
            await fetchHistory();
        } catch (error) {
            console.error("Cancellation failed:", error);
            alert('キャンセルに失敗しました。既に発送されている可能性があります。');
        }
    };

    if (loading) return <Typography align="center" sx={{ mt: 5 }}>読み込み中...</Typography>;
    if (transactions.length === 0) {
        return <Typography align="center" sx={{ mt: 5, color: 'text.secondary' }}>過去の取引履歴はありません。</Typography>;
    }

    return (
        <Box sx={{ maxWidth: 700, mx: 'auto', p: 2, pb: 10 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>取引履歴</Typography>

            <Box sx={{ display: 'grid', gap: 2 }}>
                {transactions.map((tx) => {
                    const txStatus = tx.status || 'PURCHASED';
                    const chip = getStatusChipProps(txStatus);
                    const isSeller = tx.item.seller.id === user.id;
                    const isCanceled = txStatus === 'CANCELED';
                    const isCompleted = txStatus === 'COMPLETED' || txStatus === 'RECEIVED';

                    return (
                        <Card
                            key={tx.id}
                            onClick={() => onItemClick(tx.id)}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                cursor: isCanceled ? 'default' : 'pointer',
                                border: '1px solid #eee',
                                borderRadius: '12px',
                                boxShadow: 'none',
                                opacity: isCanceled ? 0.6 : 1,
                                filter: isCanceled ? 'grayscale(100%)' : 'none',
                                transition: '0.2s',
                                '&:hover': { bgcolor: isCanceled ? 'transparent' : '#fafafa' }
                            }}
                        >
                            <Box sx={{ display: 'flex', p: 2 }}>
                                <CardMedia
                                    component="img"
                                    sx={{ width: 80, height: 80, borderRadius: '8px', objectFit: 'cover' }}
                                    image={getFirstImageUrl(tx.item.image_url)}
                                    alt={tx.item.title}
                                />
                                <CardContent sx={{ flex: '1 0 auto', p: '0 0 0 16px !important' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }} noWrap>
                                        {tx.item.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                                        ¥{(tx.price_snapshot || tx.item.price).toLocaleString()}
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip
                                            label={isCanceled ? 'キャンセル済み' : chip.label}
                                            size="small"
                                            color={isCanceled ? 'default' : chip.color}
                                            variant={isCanceled ? 'filled' : 'outlined'}
                                            sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {isSeller ? '出品した商品' : '購入した商品'}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Box>

                            {/* クイックアクションボタン */}
                            {!isCanceled && !isCompleted && (
                                <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 1 }}>
                                    {isSeller && txStatus === 'PURCHASED' && (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); handleShipment(tx.id).catch(console.error); }}
                                            sx={{ bgcolor: '#1a1a1a', color: '#fff', '&:hover': { bgcolor: '#333' } }}
                                        >
                                            発送を完了する
                                        </Button>
                                    )}
                                    {!isSeller && txStatus === 'SHIPPED' && (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="success"
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); setSelectedTxId(tx.id); setReviewModalOpen(true); }}
                                        >
                                            受け取り評価をする
                                        </Button>
                                    )}
                                    {!isSeller && txStatus === 'PURCHASED' && (
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); handleCancel(tx.id).catch(console.error); }}
                                            sx={{ fontSize: '0.75rem' }}
                                        >
                                            取引をキャンセル
                                        </Button>
                                    )}
                                </Box>
                            )}
                        </Card>
                    );
                })}
            </Box>

            {/* 評価ダイアログ */}
            <Dialog
                open={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                slotProps={{
                    paper: {
                        sx: { borderRadius: '16px', p: 1, maxWidth: 400, width: '100%' }
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, textAlign: 'center' }}>受け取り評価</DialogTitle>
                <Box component="form" onSubmit={handleReviewSubmit}>
                    <DialogContent sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                            商品の到着を確認しましたか？<br />満足度を選択してコメントを送信してください。
                        </Typography>
                        <Rating
                            value={reviewRating}
                            onChange={(_e, newValue) => setReviewRating(newValue || 5)}
                            sx={{ mb: 3, fontSize: '2.5rem' }}
                        />
                        <TextField
                            label="取引の感想（任意）"
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="丁寧な梱包ありがとうございました！"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                        />
                    </DialogContent>
                    <Box sx={{ p: 2, display: 'flex', gap: 1.5 }}>
                        <Button
                            onClick={() => setReviewModalOpen(false)}
                            sx={{ flex: 1, color: 'text.secondary' }}
                        >
                            戻る
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            sx={{ flex: 2, fontWeight: 'bold', bgcolor: '#1a1a1a' }}
                        >
                            評価を投稿する
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
};