import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Avatar, Typography, Button, Paper, Tabs, Tab,List, ListItem,ListItemAvatar,Stack,Divider} from "@mui/material";
import * as api from "../services/api";
import type { User } from "../types/user";
import { getFirstImageUrl } from "../utils/image-helpers";

export const PublicProfile = ({ currentUser }: { currentUser: User | null }) => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [items, setItems] = useState<api.Item[]>([]);
    const [tab, setTab] = useState(0);
    const [reviews, setReviews] = useState<api.Review[]>([]);

    useEffect(() => {
        (async () => {
            if (!userId) return;
            try {
                const userData = await api.fetchUserDetail(Number(userId));
                setUser(userData);
                const response = await api.fetchItemList({
                    seller_id: Number(userId),
                } as any);
                setItems(response.items || []);
                if (currentUser && currentUser.id !== Number(userId)) {
                    const res = await api.checkIsFollowing(currentUser.id, Number(userId));
                    setIsFollowing(res.is_following);
                }
            } catch (error) {
                console.error("Failed to fetch profile data:", error);
            }
        })();
    }, [userId, currentUser]);

    useEffect(() => {
        if (tab === 1 && userId) {
            (async () => {
                try {
                    api.fetchUserReviews(Number(userId)).then(setReviews);
                } catch (error) {
                    console.error("Failed to fetch reviews", error);
                }
            })();
        }
    }, [tab, userId]);

    const handleFollowClick = async () => {
        if (!currentUser) return alert("ログインが必要です");
        if (!user) return;
        try {
            const res = await api.toggleFollow(currentUser.id, user.id);
            setIsFollowing(res.status === 'followed');

            // 💡 画面上のフォロワー数をリアルタイムに更新（再取得）
            const updatedUserData = await api.fetchUserDetail(user.id);
            setUser(updatedUserData);
        } catch (error) {
            console.error("Follow action failed:", error);
        }
    };

    if (!user) return <Typography sx={{ p: 4, textAlign: 'center' }}>読み込み中...</Typography>;

    const isOwnProfile = currentUser?.id === user.id;

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', py: { xs: 2, md: 4 }, px: 2 }}>
            {/* プロフィールヘッダー */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar src={user.icon_url} sx={{ width: 80, height: 80, mr: 2, border: '1px solid #eee' }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{user.username}</Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">出品数 <b>{items.length}</b></Typography>
                        <Typography
                            variant="body2"
                            sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
                            onClick={() => navigate(`/user/${userId}/follows?mode=following`)}
                        >
                            フォロー中 <b>{user.following_count || 0}</b>
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
                            onClick={() => navigate(`/user/${userId}/follows?mode=followers`)}
                        >
                            フォロワー <b>{user.follower_count || 0}</b>
                        </Typography>
                    </Box>
                </Box>

                {/* 💡 ボタン表示ロジックの重複を整理 */}
                {isOwnProfile ? (
                    <Button variant="outlined" sx={{ borderRadius: 20 }} onClick={() => navigate('/mypage/profile')}>
                        編集
                    </Button>
                ) : (
                    <Button
                        variant={isFollowing ? "outlined" : "contained"}
                        sx={{
                            borderRadius: 20,
                            bgcolor: isFollowing ? 'transparent' : '#e91e63',
                            '&:hover': { bgcolor: isFollowing ? 'rgba(0,0,0,0.04)' : '#c2185b' }
                        }}
                        onClick={handleFollowClick}
                    >
                        {isFollowing ? "フォロー中" : "フォローする"}
                    </Button>
                )}
            </Box>

            {/* 自己紹介エリア */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, mb: 4 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {user.bio || "自己紹介はまだありません。"}
                </Typography>
            </Paper>

            {/* タブ */}
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tab label="商品一覧" />
                <Tab label="評価" />
            </Tabs>

            {tab === 0 ? (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 1,
                    }}
                >
                    {items.length === 0 ? (
                        <Typography sx={{ gridColumn: 'span 3', py: 4, textAlign: 'center', color: 'text.secondary' }}>
                            出品中の商品はありません
                        </Typography>
                    ) : (
                        items.map(item => (
                            <Box
                                key={item.id}
                                onClick={() => navigate(`/items/${item.id}`)}
                                sx={{
                                    width: '100%',
                                    pt: '100%',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    bgcolor: '#eee',
                                    '&:hover': { opacity: 0.9 }
                                }}
                            >
                                <img
                                    src={getFirstImageUrl(item.image_url)}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                    alt={item.title}
                                />
                                <Box sx={{
                                    position: 'absolute', bottom: 0, left: 0, bgcolor: 'rgba(0,0,0,0.6)',
                                    color: 'white', px: 1, fontSize: '0.75rem', fontWeight: 'bold'
                                }}>
                                    ¥{item.price.toLocaleString()}
                                </Box>
                            </Box>
                        ))
                    )}
                </Box>
            ) : (
                // 💡 「評価」タブの内容を表示
                <List sx={{ bgcolor: 'background.paper' }}>
                    {reviews.length === 0 ? (
                        <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                            まだ評価はありません
                        </Typography>
                    ) : (
                        reviews.map((review) => (
                            <Box key={review.id}>
                                <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                                    <ListItemAvatar>
                                        <Avatar src={review.reviewer.icon_url} />
                                    </ListItemAvatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                {review.reviewer.username}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="body2" sx={{ my: 0.5, fontWeight: 'bold', color: review.rating === 'GOOD' ? '#ff5252' : 'inherit' }}>
                                            {review.rating === 'GOOD' ? '😆 良かった' : review.rating === 'NORMAL' ? '😐 普通' : '😞 残念'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {review.content}
                                        </Typography>
                                        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#999' }}>
                                            購入した商品: {review.item.title}
                                        </Typography>
                                    </Box>
                                </ListItem>
                                <Divider variant="inset" component="li" />
                            </Box>
                        ))
                    )}
                </List>
            )}
        </Box>
    );
};