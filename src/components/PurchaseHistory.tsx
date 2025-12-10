import { useState, useEffect, useCallback } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import { Box, Typography, Card, CardContent, CardMedia, Grid, Chip, Button, Dialog, DialogTitle, DialogContent, Rating, TextField } from '@mui/material';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';
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
        <Box sx={{ mt: 3, p: 2 }}>
            <Typography variant="h5" gutterBottom>取引履歴</Typography>

            {/* ▼ 修正: Gridコンテナ内に tx.map を配置 ▼ */}
            <Grid container spacing={2}>
                {transactions.map((tx) => {
                    // tx.Status が string | undefined の可能性があるため、'PURCHASED'をデフォルトに
                    const txStatus = tx.Status || 'PURCHASED';
                    const chipProps = getStatusChipProps(txStatus);
                    const isSeller = tx.item.seller.id === user.id;

                    return (
                        // Grid item は map の内部でレンダリングする
                        <Box
                            key={tx.id}
                            // Grid item の代わりに Box を使用し、直接スタイルを適用
                            sx={{
                                width: '100%',
                                cursor: 'pointer',
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                            }}
                            // クリックで詳細へ遷移
                            onClick={() => onItemClick(tx.item.id)}
                        >
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

                                {/* 商品画像と基本情報エリア */}
                                <Box sx={{ display: 'flex', cursor: 'pointer' }} onClick={() => onItemClick(tx.item.id)}>
                                    <CardMedia
                                        component="img"
                                        sx={{ width: 100, height: 100, objectFit: 'cover' }}
                                        image={tx.item.image_url}
                                        alt={tx.item.title}
                                    />
                                    <CardContent sx={{ flex: '1 0 auto', p: 2, pb: 1 }}>
                                        <Typography component="div" variant="subtitle1" noWrap>
                                            {tx.item.title}
                                        </Typography>
                                        <Typography variant="subtitle1" color="text.secondary" component="div">
                                            ¥{tx.price_snapshot.toLocaleString()}
                                        </Typography>
                                    </CardContent>
                                </Box>

                                {/* ステータスとアクションエリア */}
                                <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
                                    <Chip label={chipProps.label} size="small" color={chipProps.color} variant="outlined" />

                                    <Typography variant="caption" sx={{ ml: 1, color: isSeller ? 'green' : 'inherit' }}>
                                        {isSeller ? '出品した取引' : '購入した取引'}
                                    </Typography>

                                    {/* 発送完了ボタン (出品者かつ発送待ちの場合のみ) */}
                                    {isSeller && txStatus === 'PURCHASED' && (
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="primary"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Card全体のクリックイベントを無効化
                                                (async ()=> {
                                                    await handleShipment(tx.id);
                                                })();
                                            }}
                                            sx={{ mt: 1, display: 'block' }}
                                        >
                                            発送完了
                                        </Button>
                                    )}
                                    // ステータスが「配送中」の場合、購入者に評価ボタンを表示
                                    {!isSeller && txStatus === 'SHIPPED' && (
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="success"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTxId(tx.id);
                                                setReviewModalOpen(true); // モーダルを開く
                                            }}
                                            sx={{ mt: 1, display: 'block' }}
                                        >
                                            受け取り評価
                                        </Button>
                                    )}
                                    {!isSeller && txStatus === 'PURCHASED' && (
                                        <Button
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                            startIcon={<DoNotDisturbAltIcon />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                (async ()=> {
                                                    await handleCancel(tx.id);
                                                })();
                                            }}
                                        >
                                            キャンセル
                                        </Button>
                                    )}
                                </Box>
                            </Card>
                        </Box>
                    );
                })}
            </Grid>
            {/* ▲ 修正終わり ▲ */}
            {/* ▼▼▼ 評価モーダル ▼▼▼ */}
            <Dialog open={reviewModalOpen} onClose={() => setReviewModalOpen(false)}>
                <DialogTitle>受け取り評価</DialogTitle>
                <Box component="form" onSubmit={handleReviewSubmit}>
                    <DialogContent>
                        <Typography component="legend" sx={{mb: 1}}>評価 (5段階)</Typography>
                        <Rating
                            name="rating"
                            value={reviewRating}
                            onChange={(_e, newValue) => setReviewRating(newValue || 5)}
                            sx={{mb: 2}}
                        />
                        <TextField
                            autoFocus
                            margin="dense"
                            label="コメント"
                            type="text"
                            fullWidth
                            multiline
                            rows={4}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                        />
                    </DialogContent>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={() => setReviewModalOpen(false)} color="secondary">
                            キャンセル
                        </Button>
                        <Button type="submit" variant="contained" color="primary">
                            評価を送信
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
};