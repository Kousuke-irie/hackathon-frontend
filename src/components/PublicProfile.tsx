import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Avatar, Typography, Button, Paper, Tabs, Tab } from "@mui/material"; // Gridを削除
import * as api from "../services/api";
import type { User } from "../types/user";
import { getFirstImageUrl } from "../utils/image-helpers";

export const PublicProfile = ({ currentUser }: { currentUser: User | null }) => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [items, setItems] = useState<api.Item[]>([]);
    const [tab, setTab] = useState(0);

    useEffect(() => {
        (async () => {
            if (!userId) return;
            try {
                const userData = await api.fetchUserDetail(Number(userId));
                setUser(userData);
                const response = await api.fetchItemList({ seller_id: Number(userId) } as any);
                setItems(response.items || []);
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            }
        })();
    }, [userId]);

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
                        <Typography variant="body2" color="text.secondary">フォロワー <b>0</b></Typography>
                    </Box>
                </Box>
                {isOwnProfile ? (
                    <Button variant="outlined" sx={{ borderRadius: 20 }} onClick={() => navigate('/profile')}>
                        編集
                    </Button>
                ) : (
                    <Button variant="contained" sx={{ borderRadius: 20, bgcolor: '#e91e63' }}>
                        フォロー
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

            {/* 商品一覧グリッド（Gridの代わりにBoxを使用） */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)', // 1列3等分 (xs=4に相当)
                    gap: 1, // spacing={1}に相当
                }}
            >
                {items.map(item => (
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
                ))}
            </Box>
        </Box>
    );
};