import { useState, useEffect, useCallback } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import { Box, Typography, Paper,Chip, Button, Dialog, DialogTitle, DialogContent, Rating, TextField } from '@mui/material';
import { getStatusChipProps} from "../utils/transaction-helpers.tsx";

interface PurchaseHistoryProps {
    user: User;
    onItemClick: (id: number) => void;
}

export const PurchaseHistory = ({ user, onItemClick }: PurchaseHistoryProps) => {
    const [transactions, setTransactions] = useState<api.Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedTxId, setSelectedTxId] = useState<number | null>(null);
    const [reviewRating, setReviewRating] = useState<number>(5);
    const [reviewComment, setReviewComment] = useState('');

    // ▼ 修正: データ取得ロジックを外部関数として定義 (再利用のため)
    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            // APIから購入履歴を取得
            const data = await api.fetchPurchaseHistory(user.id);
            setTransactions(data);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    }, [user.id]); // user.idが変わったときのみ関数を再生成

    // ▼ useEffect: 初期ロード時、およびuser.id変更時に実行
    useEffect(() => {
        (async () => {
            await fetchHistory();
        })();
    }, [fetchHistory]); // fetchHistory が useCallback でラップされているため安全

    // ▼ 修正: 発送処理ハンドラ (データ取得ロジックの再実行を含む)
    const handleShipment = async (txId: number) => {
        if (!confirm('商品を発送しましたか？ステータスを「配送中」に変更します。')) return;

        try {
            await api.updateTransactionStatus(txId, 'SHIPPED');
            alert('発送ステータスを更新しました。');

            // リストを再取得して画面をリフレッシュ
            await fetchHistory();
        } catch (error) {
            console.error("Failed to update status:", error);
            alert('ステータス更新に失敗しました。');
        }
    };

    // ▼▼▼ 評価投稿ハンドラ ▼▼▼
    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTxId) return;

        try {
            await api.postReview(
                selectedTxId,
                user.id,
                reviewRating,
                reviewComment,
                'BUYER' // 評価者は常に購入者
            );
            alert('評価が完了しました！');
            setReviewModalOpen(false);
            await fetchHistory(); // リストを更新
        } catch (error) {
            console.error("Review post failed:", error);
            alert('評価の投稿に失敗しました。');
        }
    };

    // ▼▼▼ キャンセル処理ハンドラ ▼▼▼
    const handleCancel = async (txId: number) => {
        if (!confirm('本当にこの取引をキャンセルしますか？発送後はキャンセルできません。')) return;

        try {
            await api.cancelTransaction(txId);
            alert('取引をキャンセルしました。');
            await fetchHistory(); // リストを更新
        } catch (error) {
            console.error("Cancellation failed:", error);
            alert('キャンセルに失敗しました。発送済みの可能性があります。');
        }
    };

    if (loading) return <Typography align="center" sx={{ mt: 5 }}>Loading...</Typography>;
    if (transactions.length === 0) {
        return <Typography align="center" sx={{ mt: 5 }}>購入履歴はありません。</Typography>;
    }

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 2, pb: 10 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>取引履歴</Typography>

            <Box sx={{ display: 'grid', gap: 3 }}>
                {transactions.map((tx) => {
                    const txStatus = tx.Status || 'PURCHASED';
                    const isSeller = tx.item.seller.id === user.id;

                    return (
                        <Paper
                            key={tx.id}
                            elevation={0}
                            sx={{ border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}
                        >
                            <Box sx={{ display: 'flex', p: 2, cursor: 'pointer' }} onClick={() => onItemClick(tx.item.id)}>
                                <Box sx={{ width: 100, height: 100, borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                    <img src={tx.item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </Box>
                                <Box sx={{ flex: 1, ml: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Chip
                                            label={getStatusChipProps(txStatus).label}
                                            size="small"
                                            sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                                        />
                                        <Typography variant="caption" sx={{ color: isSeller ? '#52c41a' : 'text.secondary', fontWeight: 'bold' }}>
                                            {isSeller ? '出品した取引' : '購入した取引'}
                                        </Typography>
                                    </Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>{tx.item.title}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>¥{tx.price_snapshot.toLocaleString()}</Typography>
                                </Box>
                            </Box>

                            {/* アクションエリア: 必要な時だけ表示 */}
                            {( (isSeller && txStatus === 'PURCHASED') || (!isSeller && txStatus === 'SHIPPED') || (!isSeller && txStatus === 'PURCHASED') ) && (
                                <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 1 }}>
                                    {isSeller && txStatus === 'PURCHASED' && (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); handleShipment(tx.id).catch(console.error); }}
                                            sx={{ bgcolor: '#1a1a1a', fontWeight: 'bold' }}
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
                                            sx={{ fontWeight: 'bold' }}
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
                                            sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                                        >
                                            取引をキャンセル
                                        </Button>
                                    )}
                                </Box>
                            )}
                        </Paper>
                    );
                })}
            </Box>

            {/* 評価モーダル（Dialog） */}
            <Dialog open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} slotProps={{
                paper: { sx: { borderRadius: '12px', p: 1 } }
            }}>
                <DialogTitle sx={{ fontWeight: 800 }}>受け取り評価</DialogTitle>
                <Box component="form" onSubmit={handleReviewSubmit}>
                    <DialogContent>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>満足度を選んでください</Typography>
                        <Rating
                            value={reviewRating}
                            onChange={(_e, newValue) => setReviewRating(newValue || 5)}
                            sx={{ mb: 3 }}
                        />
                        <TextField
                            label="コメント（任意）"
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                        />
                    </DialogContent>
                    <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                        <Button onClick={() => setReviewModalOpen(false)} sx={{ flex: 1, color: 'text.secondary' }}>キャンセル</Button>
                        <Button type="submit" variant="contained" sx={{ flex: 2, fontWeight: 'bold' }}>評価を送信</Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
};