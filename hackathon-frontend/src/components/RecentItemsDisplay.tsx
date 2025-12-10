import { useState, useEffect } from "react";
import * as api from "../services/api";
import { getRecentViews } from '../services/recent-views'; // LocalStorageからIDを取得
import { Box, Typography, Card, CardMedia, CardContent, CircularProgress } from '@mui/material';

interface RecentItemsDisplayProps {
    onItemClick: (id: number) => void;
}

export const RecentItemsDisplay = ({ onItemClick }: RecentItemsDisplayProps) => {
    const [recentItems, setRecentItems] = useState<api.Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const itemIds = getRecentViews(); // LocalStorageからIDリストを取得
            if (itemIds.length === 0) {
                setLoading(false);
                return;
            }

            try {
                // ▼ APIで商品情報を取得
                const fetchedItems = await api.fetchItemsByIds(itemIds);
                setRecentItems(fetchedItems);
            } catch (error) {
                console.error("Failed to fetch recent views data:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, []); 

    if (loading) {
        return <CircularProgress size={20} sx={{ mt: 1 }} />;
    }

    if (recentItems.length === 0) {
        return null; // 履歴がない場合は非表示
    }

    return (
        <Box sx={{ mt: 4, mb: 4, borderTop: '1px solid #eee', pt: 2 }}>
            <Typography variant="h6" gutterBottom>最近チェックした商品</Typography>
            <Box sx={{ display: 'flex', overflowX: 'auto', gap: 1.5, pb: 1 }}>
                {recentItems.map((item) => (
                    <Box key={item.id} sx={{ minWidth: 120, cursor: 'pointer' }}>
                    <Card key={item.id} onClick={() => onItemClick(item.id)} sx={{ Width: 120 }}>
                        <CardMedia
                            component="img"
                            height="80"
                            image={item.image_url}
                            alt={item.title}
                        />
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                            <Typography variant="caption" noWrap>{item.title}</Typography>
                            <Typography variant="body2" color="text.secondary">¥{item.price.toLocaleString()}</Typography>
                        </CardContent>
                    </Card>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};