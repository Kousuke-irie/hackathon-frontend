import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import * as api from "../services/api";

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
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
            <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "90%", maxWidth: "500px" }}>
                <h2 style={{ marginTop: 0 }}>決済情報の入力</h2>

                <form onSubmit={handleSubmit}>
                    {/* Stripeが提供する安全な入力フォーム */}
                    <PaymentElement />

                    {errorMessage && <div style={{ color: "red", marginTop: "10px" }}>{errorMessage}</div>}

                    <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button type="button" onClick={onClose} style={{ padding: "10px", border: "none", cursor: "pointer" }}>
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={!stripe || isProcessing}
                            style={{ padding: "10px 20px", backgroundColor: "#e91e63", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", opacity: isProcessing ? 0.5 : 1 }}
                        >
                            {isProcessing ? "処理中..." : "支払う"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};