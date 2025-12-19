import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as api from "../services/api";
import type { User } from "../types/user";
import { Box, Typography, Paper, Button, Step, Stepper, StepLabel,Alert } from '@mui/material';
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
                                    <Button variant="contained" size="large" onClick={() => handleAction('SHIPPED')} startIcon={<LocalShippingIcon />}>
                                        商品を発送したので連絡する
                                    </Button>
                                )}
                                {currentStatus === 'SHIPPED' && <Typography>購入者の受取評価待ちです</Typography>}
                                {currentStatus === 'RECEIVED' && <Typography>受取評価されました。取引完了です。</Typography>}
                            </>
                        ) : (
                            // 購入者側の表示
                            <>
                                {currentStatus === 'PURCHASED' && <Typography>出品者からの発送連絡をお待ちください</Typography>}
                                {currentStatus === 'SHIPPED' && (
                                    <Button variant="contained" color="success" size="large" onClick={() => navigate(`/purchases`)} startIcon={<CheckCircleIcon />}>
                                        商品を受け取ったので評価する
                                    </Button>
                                )}
                            </>
                        )}
                    </Box>
                )}
            </Paper>

            <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>商品情報</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <img src={tx.item.image_url} alt={"商品画像"} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }} />
                    <Box>
                        <Typography variant="body1">{tx.item.title}</Typography>
                        <Typography variant="h6">¥{tx.price_snapshot.toLocaleString()}</Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};