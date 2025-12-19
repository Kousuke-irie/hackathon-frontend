import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import { Typography,Box } from '@mui/material';
import {getFirstImageUrl} from "../utils/image-helpers.tsx";

interface LikedItemsProps {
    user: User;
    onItemClick: (id: number) => void;
}

export const LikedItems = ({ user, onItemClick }: LikedItemsProps) => {
    const [items, setItems] = useState<api.Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
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
        })();
    }, [user]);

    if (loading) return <Typography align="center" sx={{ mt: 5 }}>Loading...</Typography>;
    if (items.length === 0) {
        return <Typography align="center" sx={{ mt: 5 }}>いいねした商品がありません。</Typography>;
    }

    return (
        <Box sx={{ maxWidth: 1024, mx: 'auto', p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
                いいね！した商品 ({items.length})
            </Typography>

            <Box
                sx={{
                    display: 'grid',
                    gap: '20px 12px',
                    gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                }}
            >
                {items.map((item) => (
                    <Box
                        key={item.id}
                        onClick={() => onItemClick(item.id)}
                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                    >
                        <Box sx={{ position: 'relative', width: '100%', pt: '100%', borderRadius: '4px', overflow: 'hidden', bgcolor: '#f5f5f5', mb: 1 }}>
                            <img src={getFirstImageUrl(item.image_url)} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }} noWrap>
                            {item.title}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#e91e63' }}>
                            ¥{item.price.toLocaleString()}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};