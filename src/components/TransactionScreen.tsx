import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as api from "../services/api";
import type { User } from "../types/user";
import { Box, Typography, Paper, Button, Step, Stepper, StepLabel,Alert, Dialog, DialogTitle, DialogContent, Rating, TextField } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface TransactionScreenProps {
    currentUser: User;
}

export const TransactionScreen = ({ currentUser }: TransactionScreenProps) => {
    const { txId } = useParams();
    const navigate = useNavigate();
    const [tx, setTx] = useState<api.Transaction | null>(null);
    const [loading, setLoading] = useState(true);

    // 評価モーダル用ステート
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewRating, setReviewRating] = useState<number>(5);
    const [reviewComment, setReviewComment] = useState('');

    const steps = ['購入完了', '発送待ち', '受取評価待ち', '取引完了'];

    const getActiveStep = (status: string) => {
        switch (status) {
            case 'PURCHASED': return 1;
            case 'SHIPPED': return 2;
            case 'RECEIVED':
            case 'COMPLETED': return 4;
            default: return 0;
        }
    };

    const fetchTransactionData = useCallback(async () => {
        if (!txId) return;
        try {
            const data = await api.fetchTransactionDetail(Number(txId));
            setTx(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [txId]);

    useEffect(() => {
        (async () => {
            await fetchTransactionData();
        })();
        }, [fetchTransactionData]);

    const handleAction = async (newStatus: string) => {
        if (!tx) return;
        try {
            await api.updateTransactionStatus(tx.id, newStatus);
            alert("ステータスを更新しました");
            await fetchTransactionData();
        } catch (error) {
            alert("更新に失敗しました");
            console.error(error);
        }
    };

    // 受取評価の送信
    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tx) return;

        try {
            await api.postReview(
                tx.id,
                currentUser.id,
                reviewRating,
                reviewComment,
                'BUYER'
            );
            alert('評価が完了しました！');
            setReviewModalOpen(false);
            await fetchTransactionData();
        } catch (error) {
            console.error("Review post failed:", error);
            alert('評価の投稿に失敗しました。');
        }
    };

    if (loading) return <Typography>Loading...</Typography>;
    if (!tx) return <Typography>取引情報が見つかりません</Typography>;

    const isSeller = tx.seller_id === currentUser.id;
    const currentStatus = tx.Status;

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>取引画面</Typography>

            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Stepper activeStep={getActiveStep(currentStatus)} alternativeLabel sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}><StepLabel>{label}</StepLabel></Step>
                    ))}
                </Stepper>

                {currentStatus === 'CANCELED' ? (
                    <Alert severity="error">この取引はキャンセルされました</Alert>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        {isSeller ? (
                            // 出品者側の表示
                            <>
                                {currentStatus === 'PURCHASED' && (
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={() => handleAction('SHIPPED')}
                                        startIcon={<LocalShippingIcon />}
                                        sx={{ bgcolor: '#1a1a1a' }}
                                    >
                                        商品を発送したので連絡する
                                    </Button>
                                )}
                                {currentStatus === 'SHIPPED' && <Typography color="text.secondary">購入者の受取評価待ちです</Typography>}
                                {currentStatus === 'RECEIVED' && <Typography fontWeight="bold">受取評価されました。取引完了です。</Typography>}
                            </>
                        ) : (
                            // 購入者側の表示
                            <>
                                {currentStatus === 'PURCHASED' && <Typography color="text.secondary">出品者からの発送連絡をお待ちください</Typography>}
                                {currentStatus === 'SHIPPED' && (
                                    <Box>
                                        <Typography variant="body1" sx={{ mb: 2 }}>商品が発送されました。到着したら評価をお願いします。</Typography>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            size="large"
                                            onClick={() => setReviewModalOpen(true)} // 💡 モーダルを開く
                                            startIcon={<CheckCircleIcon />}
                                        >
                                            商品を受け取ったので評価する
                                        </Button>
                                    </Box>
                                )}
                                {(currentStatus === 'RECEIVED' || currentStatus === 'COMPLETED') && (
                                    <Typography fontWeight="bold">受取評価を送信しました。取引完了です。</Typography>
                                )}
                            </>
                        )}
                    </Box>
                )}
            </Paper>

            <Paper
                onClick={() => navigate(`/items/${tx.item.id}`)}
                sx={{ p: 2, borderRadius: 2, cursor: 'pointer', '&:hover': { bgcolor: '#fafafa' } }}
            >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>商品情報</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <img src={tx.item.image_url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }} />
                    <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{tx.item.title}</Typography>
                        <Typography variant="h6" color="primary">
                            ¥{tx.price_snapshot?.toLocaleString() || tx.item.price.toLocaleString()}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* 💡 受取評価モーダル */}
            <Dialog
                open={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                slotProps={{ paper: { sx: { borderRadius: '16px', p: 1, maxWidth: 400, width: '100%' } } }}
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
                        <Button onClick={() => setReviewModalOpen(false)} sx={{ flex: 1, color: 'text.secondary' }}>戻る</Button>
                        <Button type="submit" variant="contained" sx={{ flex: 2, fontWeight: 'bold', bgcolor: '#1a1a1a' }}>評価を投稿する</Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
};