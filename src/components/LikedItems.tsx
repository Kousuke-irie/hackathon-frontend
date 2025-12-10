import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import { Typography, Card, CardContent, CardMedia, Box } from '@mui/material';

interface LikedItemsProps {
    user: User;
    onItemClick: (id: number) => void;
}

export const LikedItems = ({ user, onItemClick }: LikedItemsProps) => {
    const [items, setItems] = useState<api.Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLikedItems = async () => {
            setLoading(true);
            try {
                // api.tsに fetchLikedItems(userId) を追加するのが理想的だが、
                // ここでは services/api.ts の関数が定義済みであると仮定し呼び出す。
                // (もしapi.tsが未修正なら、axios直接呼び出しに置き換えてください)
                const fetchedItems = await api.fetchLikedItems(user.id);
                setItems(fetchedItems);
            } catch (error) {
                console.error("Failed to fetch liked items:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLikedItems();
    }, [user]);

    if (loading) return <Typography align="center" sx={{ mt: 5 }}>Loading...</Typography>;
    if (items.length === 0) {
        return <Typography align="center" sx={{ mt: 5 }}>いいねした商品がありません。</Typography>;
    }

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="h5" gutterBottom>いいねした商品 ({items.length})</Typography>
            <Box
                sx={{
                    display: 'grid',
                    gap: 2, // Gridの間隔 (spacing={2}に相当)
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', // レスポンシブな2〜4列レイアウト
                    mt: 2
                }}
            >
                {items.map((item) => (
                    <Box
                        key={item.id}
                        onClick={() => onItemClick(item.id)}
                        sx={{ cursor: 'pointer', height: '100%' }}
                    >
                        <Card sx={{ height: '100%' }}>
                            <CardMedia
                                component="img"
                                height="140"
                                image={item.image_url}
                                alt={item.title}
                            />
                                <CardContent>
                                    <Typography gutterBottom variant="subtitle2" component="div" noWrap>
                                        {item.title}
                                    </Typography>
                                    <Typography variant="h6" color="primary">
                                        ¥{item.price.toLocaleString()}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>

                    ))}
                </Box>
        </Box>
    );
};