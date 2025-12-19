import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as api from "../services/api";
import type { User } from "../types/user";
import {
    Box, Typography, Paper, Button, Step, Stepper, StepLabel, Alert,
    Dialog, DialogTitle, DialogContent, Rating, TextField, Chip, Divider
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import StorefrontIcon from '@mui/icons-material/Storefront';

interface TransactionScreenProps {
    currentUser: User;
}

export const TransactionScreen = ({ currentUser }: TransactionScreenProps) => {
    const { txId } = useParams();
    const navigate = useNavigate();
    const [tx, setTx] = useState<api.Transaction | null>(null);
    const [loading, setLoading] = useState(true);

    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewRating, setReviewRating] = useState<number>(5);
    const [reviewComment, setReviewComment] = useState('');

    const steps = ['購入完了', '発送待ち', '受取評価待ち', '取引完了'];

    const getActiveStep = (status: string) => {
        // 💡 statusは大文字小文字どちらが来ても動くように正規化
        const s = status?.toUpperCase();
        switch (s) {
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
            console.error("Failed to fetch transaction detail:", error);
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
            console.error("Failed to update status:", error);
        }
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tx) return;
        try {
            await api.postReview(tx.id, currentUser.id, reviewRating, reviewComment, 'BUYER');
            alert('評価が完了しました！');
            setReviewModalOpen(false);
            await fetchTransactionData();
        } catch (error) {
            alert('評価の投稿に失敗しました。');
            console.error("Failed to update status:", error);
        }
    };

    if (loading) return <Typography align="center" sx={{ mt: 5 }}>読み込み中...</Typography>;
    if (!tx) return <Typography align="center" sx={{ mt: 5 }}>取引情報が見つかりません</Typography>;

    // 💡 判定ロジックを強化: 大文字の 'Status' を優先参照し、確実に大文字に変換する
    const currentStatus = (tx.Status || (tx as any).status || "").toUpperCase();
    const isSeller = Number(tx.seller_id) === Number(currentUser.id);

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>取引画面</Typography>
                <Chip
                    icon={isSeller ? <StorefrontIcon /> : <PersonIcon />}
                    label={isSeller ? "あなたは出品者です" : "あなたは購入者です"}
                    color={isSeller ? "primary" : "secondary"}
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                />
            </Box>

            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #eee', bgcolor: '#fcfcfc' }}>
                <Stepper activeStep={getActiveStep(currentStatus)} alternativeLabel sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}><StepLabel>{label}</StepLabel></Step>
                    ))}
                </Stepper>

                <Divider sx={{ mb: 3 }} />

                {currentStatus === 'CANCELED' ? (
                    <Alert severity="error" variant="outlined">この取引はキャンセルされました</Alert>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                        {isSeller ? (
                            <Box>
                                {currentStatus === 'PURCHASED' && (
                                    <>
                                        <Typography variant="body1" sx={{ mb: 2, fontWeight: 700 }}>
                                            商品が購入されました！<br />発送の準備をして、完了したら通知してください。
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={() => handleAction('SHIPPED')}
                                            startIcon={<LocalShippingIcon />}
                                            sx={{ bgcolor: '#1a1a1a', px: 4 }}
                                        >
                                            商品の発送を通知する
                                        </Button>
                                    </>
                                )}
                                {currentStatus === 'SHIPPED' && (
                                    <Typography color="text.secondary">
                                        商品を発送しました。購入者の受取評価を待っています。
                                    </Typography>
                                )}
                                {(currentStatus === 'RECEIVED' || currentStatus === 'COMPLETED') && (
                                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 800 }}>
                                        <CheckCircleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                                        取引が完了しました
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            <Box>
                                {currentStatus === 'PURCHASED' && (
                                    <Typography color="text.secondary">
                                        支払いが完了しました。出品者からの発送通知をお待ちください。
                                    </Typography>
                                )}
                                {currentStatus === 'SHIPPED' && (
                                    <>
                                        <Typography variant="body1" sx={{ mb: 2, fontWeight: 700 }}>
                                            商品が発送されました！<br />内容を確認し、問題なければ評価を行ってください。
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            size="large"
                                            onClick={() => setReviewModalOpen(true)}
                                            startIcon={<CheckCircleIcon />}
                                            sx={{ px: 4 }}
                                        >
                                            受け取り評価をする
                                        </Button>
                                    </>
                                )}
                                {(currentStatus === 'RECEIVED' || currentStatus === 'COMPLETED') && (
                                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 800 }}>
                                        <CheckCircleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                                        受取評価を完了しました
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>

            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, ml: 1 }}>商品情報</Typography>
            <Paper
                onClick={() => navigate(`/items/${tx.item.id}`)}
                sx={{
                    p: 2, borderRadius: 3, cursor: 'pointer', border: '1px solid #eee',
                    boxShadow: 'none', display: 'flex', gap: 2, transition: '0.2s',
                    '&:hover': { bgcolor: '#f5f5f5', borderColor: '#1a1a1a' }
                }}
            >
                <img
                    src={tx.item.image_url}
                    alt={tx.item.title}
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>{tx.item.title}</Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>
                        ¥{(tx.price_snapshot || tx.item.price).toLocaleString()}
                    </Typography>
                </Box>
            </Paper>

            <Dialog
                open={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                slotProps={{ paper: { sx: { borderRadius: '16px', p: 1, maxWidth: 400, width: '100%' } } }}
            >
                <DialogTitle sx={{ fontWeight: 800, textAlign: 'center' }}>受け取り評価</DialogTitle>
                <Box component="form" onSubmit={handleReviewSubmit}>
                    <DialogContent sx={{ textAlign: 'center' }}>
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