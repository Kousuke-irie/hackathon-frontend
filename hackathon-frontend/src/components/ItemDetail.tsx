import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import { addRecentView } from '../services/recent-views';
import { RecentItemsDisplay } from "./RecentItemsDisplay";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js"
import { PaymentModal } from "./PaymentModal";
import { CommentSection } from "./CommentSection";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'; // アイコン
import FavoriteIcon from '@mui/icons-material/Favorite'; // アイコン (いいね済み)
import { IconButton } from "@mui/material";
import { Box, Typography } from "@mui/material";


// Stripe公開キーの読み込み
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// 詳細画面で使うデータ型（出品者情報を含む）
interface ItemDetailData {
    id: number;
    title: string;
    description: string;
    price: number;
    image_url: string;
    status: string;
    seller: {
        id: number;
        username: string;
        icon_url: string;
    };
    condition: string;
    category_id: number;
    shipping_payer: string;

}

interface ItemDetailProps {
    itemId: number;
    currentUser: User | null;
    onBack: () => void; // 一覧に戻るための関数
}

export const ItemDetail = ({ itemId, currentUser, onBack }: ItemDetailProps) => {
    const [item, setItem] = useState<ItemDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLiked, setIsLiked] = useState(false);

    const currentUserId = currentUser ? currentUser.id : undefined;

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                // ▼ api.fetchItemDetail を使用
                const itemData = await api.fetchItemDetail(itemId);
                setItem(itemData);
                addRecentView(itemId);
                if (currentUser) {
                    const likedStatus = await api.checkItemLiked(currentUser.id, itemId); // ※api.tsにこの関数を定義する
                    setIsLiked(likedStatus.is_liked);
                } else {
                    setIsLiked(false);
                }
            } catch (error) {
                console.error("Failed to fetch item detail:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [itemId,currentUserId, currentUser]);

    const handlePurchaseClick = async () => {
        if (!item) return;
        try {
            // ▼ api.createPaymentIntent を使用
            const { clientSecret } = await api.createPaymentIntent(itemId);
            setClientSecret(clientSecret);
            setShowPaymentModal(true);
        } catch (error) {
            console.error("Failed to init payment:", error);
            alert("購入の準備に失敗しました（既に売り切れの可能性があります）");
        }
    };

    // ▼▼▼ いいねの状態を切り替えるAPIを呼び出す関数 ▼▼▼
    const handleToggleLike = async () => {
        if (!currentUser) return alert('いいねするにはログインが必要です。');

        try {
            const reaction = isLiked ? "NOPE" : "LIKE"; // 現在いいね済みなら解除(NOPE)
            // ▼ recordSwipeAction APIを流用
            await api.recordSwipeAction(currentUser.id, itemId, reaction);
            setIsLiked(!isLiked); // UIの状態を切り替え
            alert(isLiked ? 'いいねを解除しました' : 'いいねしました！');
        } catch (error) {
            console.error("Failed to record like:", error);
            alert('処理に失敗しました。');
        }
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        // UIを更新するため、商品データをリロード
        setItem(prev => prev ? ({ ...prev, status: 'SOLD' }) : null);
        alert("購入が完了しました！");
        onBack();
        window.location.href = '/purchase-in-progress';
    };

    if (loading) return <div style={{ padding: "20px" }}>Loading...</div>;
    if (!item) return <div style={{ padding: "20px" }}>商品が見つかりません</div>;

    const isMyItem = !!currentUser && item.seller.id === currentUser.id;
    const isSold = item.status === "SOLD";

    return (
        <div style={{ textAlign: "left", padding: "10px", maxWidth: "600px", margin: "0 auto" }}>
            {/* 戻るボタン */}
            <button onClick={onBack} style={{ marginBottom: "10px", cursor: "pointer", padding: "5px 10px" }}>
                &lt; 戻る
            </button>

            {/* 商品画像 */}
            <img
                src={item.image_url}
                alt={item.title}
                style={{ width: "100%", maxHeight: "400px", objectFit: "contain", backgroundColor: "#f0f0f0", borderRadius: "8px" }}
            />

            <div style={{ padding: "10px" }}>
                {/* タイトルと価格 */}
                <h2 style={{ margin: "10px 0" }}>{item.title}</h2>
                <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#e91e63", margin: "5px 0" }}>
                    ¥{item.price.toLocaleString()}
                </p>

                {/* ▼▼▼ いいねボタンの配置 ▼▼▼ */}
                {currentUser && !isMyItem && ( // 未ログイン時と自分の商品では表示しない
                    <IconButton
                        onClick={handleToggleLike}
                        color={isLiked ? 'secondary' : 'default'}
                        sx={{ position: 'absolute', top: 90, right: 30 }}
                    >
                        {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                )}

                {/* 出品者情報 */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "15px 0", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
                    <img src={item.seller.icon_url} alt="seller" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
                    <div>
                        <div style={{ fontSize: "0.8rem", color: "#666" }}>出品者</div>
                        <div style={{ fontWeight: "bold" }}>{item.seller.username}</div>
                    </div>
                </div>

                {/* ▼▼▼ 新しい商品情報表示エリア ▼▼▼ */}
                <Box sx={{ my: 2, p: 2, border: '1px solid #ddd', borderRadius: '8px' }}>
                    <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                        商品の情報
                    </Typography>
                    <Typography variant="body2">
                        状態: {item.condition}
                    </Typography>
                    <Typography variant="body2">
                        配送料: {item.shipping_payer === 'seller' ? '送料込み (出品者負担)' : '着払い (購入者負担)'}
                    </Typography>
                    <Typography variant="body2">
                        カテゴリID: {item.category_id} {/* 簡易表示: カテゴリ名は後で別途APIで取得・表示 */}
                    </Typography>
                </Box>

                {/* 説明文 */}
                <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", margin: "20px 0" }}>
                    {item.description}
                </div>

                {/* ▼▼▼ コメント欄 ▼▼▼ */}
                {currentUser && <CommentSection itemId={itemId} currentUser={currentUser} />}

                {/* ▼▼▼ 組み込み: 詳細ページ下部 ▼▼▼ */}
                {!isMyItem && (
                <Box sx={{marginTop: 2, marginBottom: 2, padding: 2, border: '1px solid #ddd', borderRadius: '8px'}}>
                    <RecentItemsDisplay onItemClick={(id) => {
                        // 戻る処理を実行し、その後に navigate に相当する window.location.href を実行
                        onBack();
                        window.location.href = `/items/${id}`;
                    }} />
                </Box>
                )}    

                {/* 購入ボタンエリア */}
                <div style={{ position: "fixed", bottom: "20px", left: "0", right: "0", textAlign: "center" }}>
                    {isMyItem ? (
                        <button disabled style={{ padding: "15px 40px", borderRadius: "30px", border: "none", backgroundColor: "#ccc", color: "white", fontSize: "1.2rem", fontWeight: "bold" }}>
                            自分の商品です
                        </button>
                    ) : isSold ? (
                        // ▼ 売り切れの場合
                        <button disabled style={{ padding: "15px 40px", borderRadius: "30px", border: "none", backgroundColor: "#999", color: "white", fontSize: "1.2rem", fontWeight: "bold" }}>
                            SOLD OUT
                        </button>
                    ) : currentUser ? ( // ▼ ログインしている場合のみ購入ボタンを表示
                        <button
                            onClick={handlePurchaseClick}
                            style={{ /* ... */ }}
                        >
                            購入手続きへ
                        </button>
                    ) : (
                        // ▼ 未ログイン時の代替表示
                        <button disabled style={{ padding: "15px 40px", borderRadius: "30px", border: "none", backgroundColor: "#00BCD4", color: "white", fontSize: "1.2rem", fontWeight: "bold" }}>
                            ログインして購入
                        </button>
                    )}
                </div>
                {/* ボタンの下の余白確保 */}
                <div style={{ height: "100px" }}></div>
            </div>



            {/* ▼▼▼ 決済モーダルの表示 ▼▼▼ */}
            {showPaymentModal && clientSecret && currentUser && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentModal
                        itemId={itemId}
                        buyerId = {currentUser.id}
                        onClose={() => setShowPaymentModal(false)}
                        onSuccess={handlePaymentSuccess}
                    />
                </Elements>
            )}
        </div>
    );
};