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
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import GroupsIcon from '@mui/icons-material/Groups';
import { IconButton, Box, Typography, Button, Grid, Avatar, Divider , Menu, MenuItem, ListItemIcon, Dialog, DialogTitle, List, ListItem, ListItemText, ListItemButton} from "@mui/material";

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
    const [images, setImages] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);


    const [communities, setCommunities] = useState<api.Community[]>([]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);


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
            } catch (error: any) {
                console.error("Failed to fetch item detail:", error);
                if (error.response?.status === 404) {
                    alert("この商品は削除されたか、存在しません。");
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [itemId, currentUser, navigate]);

    useEffect(() => {
        if (item?.image_url) {
            try {
                const parsed = JSON.parse(item.image_url);
                setImages(Array.isArray(parsed) ? parsed : [item.image_url]);
            } catch {
                setImages([item.image_url]);
            }
        }
    }, [item]);

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

    const handleOpenShareMenu = async (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleOpenCommunityDialog = async () => {
        setAnchorEl(null); // メニューを閉じる
        try {
            const res = await api.fetchCommunities();
            setCommunities(res);
            setShareModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch communities:", error);
        }
    };

    const handleCopyUrl = () => {
        (async () => {
            await navigator.clipboard.writeText(window.location.href);
        })();
        alert("URLをコピーしました！");
        setAnchorEl(null);
    };

    const handleShareToCommunity = async (communityId: number) => {
        if (!currentUser) return;
        try {
            await api.postCommunityPost(communityId, currentUser.id, "商品を共有しました", itemId);
            alert("コミュニティに共有しました");
            setShareModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("共有に失敗しました");
        }
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
                <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{
                        width: "100%",
                        paddingTop: "100%",
                        position: "relative",
                        bgcolor: "#f9f9f9",
                        borderRadius: "8px",
                        overflow: "hidden"
                    }}>
                        {images.map((url, i) => (
                            <img  alt={"商品画像"} key={i} src={url} style={{ display: i === activeIndex ? 'block' : 'none' }} />
                        ))}
                        {images.length > 1 && (
                            <Box sx={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1 }}>
                                {images.map((_, i) => (
                                    <Box
                                        key={i}
                                        onClick={() => setActiveIndex(i)}
                                        sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: i === activeIndex ? 'primary.main' : 'grey.400', cursor: 'pointer' }}
                                    />
                                ))}
                            </Box>
                        )}
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

                <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                            {item.title}
                        </Typography>
                        <Box sx={{ display: 'flex' }}>
                            {/* 💡 共有ボタンをタイトルの横に配置 */}
                            <IconButton onClick={handleOpenShareMenu}>
                                <ShareIcon />
                            </IconButton>
                            {currentUser && !isMyItem && (
                                <IconButton onClick={handleToggleLike} color={isLiked ? 'secondary' : 'default'}>
                                    {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                </IconButton>
                            )}
                        </Box>
                    </Box>

                    {/* 💡 共有メニュー (ドロップダウン) */}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        <MenuItem onClick={handleCopyUrl}>
                            <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
                            URLを取得
                        </MenuItem>
                        <MenuItem onClick={handleOpenCommunityDialog}>
                            <ListItemIcon><GroupsIcon fontSize="small" /></ListItemIcon>
                            コミュニティに共有
                        </MenuItem>
                    </Menu>

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

            {!isMyItem && currentUser && (
                <Box sx={{ mt: 8 }}>
                    <RecentItemsDisplay currentUser={currentUser} onItemClick={(id) => {
                        onBack();
                        navigate(`/items/${id}`);
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

            {/* 💡 共有ダイアログ */}
            <Dialog open={shareModalOpen} onClose={() => setShareModalOpen(false)}>
                <DialogTitle sx={{ fontWeight: 800 }}>共有先のコミュニティを選択</DialogTitle>
                <List sx={{ pt: 0 }}>
                    {communities.map((c) => (
                        <ListItem key={c.id} disablePadding>
                            <ListItemButton onClick={() => handleShareToCommunity(c.id)}>
                                <ListItemText primary={c.name} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Dialog>
        </Box>
    );
};