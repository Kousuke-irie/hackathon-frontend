import { useState, useEffect } from "react";
import * as api from "../services/api";
import { getRecentViews } from '../services/recent-views'; // LocalStorageからIDを取得
import { Box, Typography, CircularProgress } from '@mui/material';
import type {User} from "../types/user";
import {getFirstImageUrl} from "../utils/image-helpers.tsx";

interface RecentItemsDisplayProps {
    onItemClick: (id: number) => void;
    currentUser: User;
}

export const RecentItemsDisplay = ({ onItemClick, currentUser }: RecentItemsDisplayProps) => {
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
                const filteredItems = currentUser
                    ? fetchedItems.filter(item => item.seller_id !== currentUser.id)
                    : fetchedItems;
                setRecentItems(filteredItems);
            } catch (error) {
                console.error("Failed to fetch recent views data:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [currentUser]);

    if (loading) {
        return <CircularProgress size={20} sx={{ mt: 1 }} />;
    }

    if (recentItems.length === 0) {
        return null; // 履歴がない場合は非表示
    }

    return (
        <Box sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1rem' }}>
                最近チェックした商品
            </Typography>
            <Box sx={{
                display: 'flex',
                overflowX: 'auto',
                gap: 2,
                pb: 1,
                '&::-webkit-scrollbar': { display: 'none' } // 横スクロールバーを隠す
            }}>
                {recentItems.map((item) => (
                    <Box
                        key={item.id}
                        onClick={() => onItemClick(item.id)}
                        sx={{
                            minWidth: 120,
                            maxWidth: 150,
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)' } // 軽い浮遊エフェクト
                        }}
                    >
                        <Box sx={{
                            width: '100%',
                            aspectRatio: '1/1',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            bgcolor: '#f5f5f5',
                            mb: 1
                        }}>
                            <img src={getFirstImageUrl(item.image_url)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                        <Typography variant="caption" noWrap sx={{ display: 'block', fontWeight: 600 }}>
                            {item.title}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                            ¥{item.price.toLocaleString()}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};