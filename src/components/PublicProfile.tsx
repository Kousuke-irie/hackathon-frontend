import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Avatar, Typography, Button, Paper, Tabs, Tab, Grid} from "@mui/material";
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
            // ユーザー情報を取得するAPIが必要（backend/handlers/user.goに後述のハンドラを追加予定）
            const response = await api.client.get(`/users/${userId}`);
            setUser(response.data.user);

            // そのユーザーの出品商品を取得
            const userItems = await api.fetchItemList({ user_id: Number(userId) } as any);
            // 💡 fetchItemListを修正し、特定の出品者の商品のみを取れるようにパラメータを調整する必要があります
            setItems(userItems.items || []);
        })();
    }, [userId]);

    if (!user) return <Typography>読み込み中...</Typography>;

    const isOwnProfile = currentUser?.id === user.id;

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
            {/* ヘッダーエリア */}
            <Box sx={{ display: 'flex', alignItems: 'center', px: 2, mb: 4 }}>
                <Avatar src={user.icon_url} sx={{ width: 80, height: 80, mr: 3, border: '1px solid #eee' }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{user.username}</Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        <Typography variant="body2"><b>120</b> 出品</Typography>
                        <Typography variant="body2"><b>450</b> フォロワー</Typography>
                    </Box>
                </Box>
                {isOwnProfile ? (
                    <Button variant="outlined" size="small" onClick={() => navigate('/profile')}>プロフィール編集</Button>
                ) : (
                    <Button variant="contained" color="primary" size="small">フォローする</Button>
                )}
            </Box>

            <Paper elevation={0} sx={{ p: 3, bgcolor: '#f9f9f9', borderRadius: 4, mb: 4 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {user.bio || "自己紹介はまだありません。"}
                </Typography>
            </Paper>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="出品した商品" />
                <Tab label="評価" />
            </Tabs>

            <Grid container spacing={1} sx={{ mt: 2 }}>
                {items.map(item => (
                    <Grid item xs={4} key={item.id} onClick={() => navigate(`/items/${item.id}`)}>
                        <Box sx={{ width: '100%', pt: '100%', position: 'relative', bgcolor: '#f5f5f5' }}>
                            <img src={getFirstImageUrl(item.image_url)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            <Box sx={{ position: 'absolute', bottom: 4, left: 0, bgcolor: 'rgba(0,0,0,0.7)', color: '#fff', px: 1, fontSize: '0.7rem' }}>
                                ¥{item.price.toLocaleString()}
                            </Box>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};