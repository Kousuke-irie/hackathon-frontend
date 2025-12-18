import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import * as api from "../services/api";
import {Box,Paper,Typography,Button} from "@mui/material";

interface PaymentModalProps {
    itemId: number;
    buyerId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export const PaymentModal = ({ itemId, buyerId, onClose, onSuccess }: PaymentModalProps) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);

        // 1. Stripeで決済を実行
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // 決済完了後のリダイレクト先（今回はリダイレクトさせない設定にするため、このままでは使いませんが必須パラメータ）
                return_url: window.location.origin,
            },
            redirect: "if_required", // リダイレクトせずにJSで完結させる設定
        });

        if (error) {
            setErrorMessage(error.message ?? "Payment failed");
            setIsProcessing(false);
        } else {
            // 2. 決済成功 -> バックエンドに通知してSOLDにする
            try {
                await api.completePurchaseAndCreateTransaction(itemId, buyerId);
                onSuccess(); // 親コンポーネントに成功を通知
            } catch (err) {
                console.error(err);
                setErrorMessage("Payment succeeded but failed to update item status.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <Box sx={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            bgcolor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000,
            backdropFilter: 'blur(4px)' // 背景をぼかしてモダンに
        }}>
            <Paper sx={{ p: 4, borderRadius: '16px', width: "90%", maxWidth: "450px", border: '1px solid #eee' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>お支払い情報</Typography>

                <form onSubmit={handleSubmit}>
                    <Box sx={{ mb: 3 }}>
                        <PaymentElement />
                    </Box>

                    {errorMessage && (
                        <Typography variant="caption" sx={{ color: 'error.main', mb: 2, display: 'block' }}>
                            {errorMessage}
                        </Typography>
                    )}

                    <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
                        <Button
                            onClick={onClose}
                            sx={{ flex: 1, color: 'text.secondary', fontWeight: 'bold' }}
                        >
                            キャンセル
                        </Button>
                        <Button
                            type="submit"
                            disabled={!stripe || isProcessing}
                            variant="contained"
                            sx={{
                                flex: 2,
                                bgcolor: '#e91e63',
                                fontWeight: 'bold',
                                py: 1.5,
                                '&:hover': { bgcolor: '#c2185b' }
                            }}
                        >
                            {isProcessing ? "処理中..." : "支払いを確定する"}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};