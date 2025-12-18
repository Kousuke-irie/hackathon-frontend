import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import { addRecentView } from '../services/recent-views';
import { RecentItemsDisplay } from "./RecentItemsDisplay";
import {useNavigate} from "react-router-dom";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js"
import { PaymentModal } from "./PaymentModal";
import { CommentSection } from "./CommentSection";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
// ★ Chip を削除し、Grid のエラーを解消するため Grid をインポート
import { IconButton, Box, Typography, Button, Grid, Avatar, Divider } from "@mui/material";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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
    onBack: () => void;
}

export const ItemDetail = ({ itemId, currentUser, onBack }: ItemDetailProps) => {
    const [item, setItem] = useState<ItemDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const navigate = useNavigate();


    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const itemData = await api.fetchItemDetail(itemId);
                setItem(itemData);
                addRecentView(itemId);
                if (currentUser) {
                    const likedStatus = await api.checkItemLiked(currentUser.id, itemId);
                    setIsLiked(likedStatus.is_liked);
                }
            } catch (error) {
                console.error("Failed to fetch item detail:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [itemId, currentUser]);

    const handlePurchaseClick = async () => {
        if (!item) return;
        try {
            const { clientSecret } = await api.createPaymentIntent(itemId);
            setClientSecret(clientSecret);
            setShowPaymentModal(true);
        } catch (error) {
            console.error("Failed to init payment:", error);
            alert("購入の準備に失敗しました");
        }
    };

    const handleToggleLike = async () => {
        if (!currentUser) return alert('いいねするにはログインが必要です。');
        try {
            const reaction = isLiked ? "NOPE" : "LIKE";
            await api.recordSwipeAction(currentUser.id, itemId, reaction);
            setIsLiked(!isLiked);
        } catch (error) {
            console.error("Failed to record like:", error);
        }
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setItem(prev => prev ? ({ ...prev, status: 'SOLD' }) : null);
        alert("購入が完了しました！");
        navigate('/mypage');
    };

    if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}>Loading...</Box>;
    if (!item) return <Box sx={{ p: 5, textAlign: 'center' }}>商品が見つかりません</Box>;

    const isMyItem = !!currentUser && item.seller.id === currentUser.id;
    const isSold = item.status === "SOLD";

    return (
        <Box sx={{ py: 2 }}>
            <Button onClick={onBack} sx={{ mb: 2, color: 'text.secondary' }}>
                &lt; 戻る
            </Button>

            <Grid container spacing={4}>
                {/* ★ item プロパティを削除 */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{
                        width: "100%",
                        paddingTop: "100%",
                        position: "relative",
                        bgcolor: "#f9f9f9",
                        borderRadius: "8px",
                        overflow: "hidden"
                    }}>
                        <img
                            src={item.image_url}
                            alt={item.title}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "contain"
                            }}
                        />
                        {isSold && (
                            <Box sx={{
                                position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: '2rem', fontWeight: 'bold'
                            }}>
                                SOLD OUT
                            </Box>
                        )}
                    </Box>
                </Grid>

                {/* ★ item プロパティを削除 */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                            {item.title}
                        </Typography>
                        {currentUser && !isMyItem && (
                            <IconButton onClick={handleToggleLike} color={isLiked ? 'secondary' : 'default'}>
                                {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                            </IconButton>
                        )}
                    </Box>

                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
                        ¥{item.price.toLocaleString()}
                    </Typography>

                    <Box sx={{ mb: 4 }}>
                        {isMyItem ? (
                            <Button variant="outlined" fullWidth disabled>自分の商品です</Button>
                        ) : isSold ? (
                            <Button variant="contained" fullWidth disabled sx={{ bgcolor: 'grey.400' }}>売り切れ</Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                size="large"
                                onClick={handlePurchaseClick}
                                disabled={!currentUser}
                                sx={{ py: 1.5, fontSize: '1.1rem' }}
                            >
                                {currentUser ? "購入手続きへ" : "ログインして購入"}
                            </Button>
                        )}
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8, mb: 4, color: 'text.secondary' }}>
                        {item.description}
                    </Typography>

                    <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>商品の詳細</Typography>
                        <Grid container spacing={1}>
                            {/* ★ すべての Grid から item プロパティを削除し、size プロパティを使用 */}
                            <Grid size={{ xs: 4 }}><Typography variant="caption" color="text.secondary">商品の状態</Typography></Grid>
                            <Grid size={{ xs: 8 }}><Typography variant="body2">{item.condition}</Typography></Grid>

                            <Grid size={{ xs: 4 }}><Typography variant="caption" color="text.secondary">配送料の負担</Typography></Grid>
                            <Grid size={{ xs: 8 }}><Typography variant="body2">{item.shipping_payer === 'seller' ? '送料込み(出品者負担)' : '着払い(購入者負担)'}</Typography></Grid>
                        </Grid>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 4 }}>
                        <Avatar src={item.seller.icon_url} alt={item.seller.username} />
                        <Box>
                            <Typography variant="caption" color="text.secondary">出品者</Typography>
                            <Typography variant="subtitle1" fontWeight="bold">{item.seller.username}</Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {currentUser && <CommentSection itemId={itemId} currentUser={currentUser} />}

            {!isMyItem && (
                <Box sx={{ mt: 8 }}>
                    <RecentItemsDisplay onItemClick={(id) => {
                        onBack();
                        window.location.href = `/items/${id}`;
                    }} />
                </Box>
            )}

            {showPaymentModal && clientSecret && currentUser && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentModal
                        itemId={itemId}
                        buyerId={currentUser.id}
                        onClose={() => setShowPaymentModal(false)}
                        onSuccess={handlePaymentSuccess}
                    />
                </Elements>
            )}
        </Box>
    );
};