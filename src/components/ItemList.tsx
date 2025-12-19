import { useState, useEffect, useMemo } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import { Box, Divider, Select, MenuItem, Typography, CircularProgress, Stack } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { RecentItemsDisplay } from "./RecentItemsDisplay";
import {getFirstImageUrl} from "../utils/image-helpers.tsx";

type Item = api.Item;

interface ItemListProps {
    user: User | null;
    onItemClick: (id: number) => void;
}

export const ItemList = ({ user, onItemClick }: ItemListProps) => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCondition, setSelectedCondition] = useState<string>('');
    const [categoriesMeta, setCategoriesMeta] = useState<api.Category[]>([]);
    const [conditionsMeta, setConditionsMeta] = useState<api.ProductCondition[]>([]);
    const [sortBy, setSortBy] = useState<'created_at' | 'price'>('created_at');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const [searchParams] = useSearchParams();
    const keyword = searchParams.get('q') || '';
    const categoryQuery = searchParams.get('cat');

    const currentUserID = user ? user.id : 0;

    const currentCategoryName = useMemo(() => {
        if (!categoryQuery) return keyword ? `「${keyword}」の検索結果` : "おすすめ商品";
        const catId = Number(categoryQuery);
        const cat = categoriesMeta.find(c => c.id === catId);
        return cat ? cat.name : "カテゴリー商品";
    }, [categoryQuery, categoriesMeta, keyword]);

    useEffect(() => {
        (async () => {
            try {
                const [categories, conditions] = await Promise.all([
                    api.fetchCategories(),
                    api.fetchConditions()
                ]);
                setCategoriesMeta(categories);
                setConditionsMeta(conditions);
            } catch (error) {
                console.error("Failed to fetch metadata:", error);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const params = {
                    q: keyword || undefined,
                    category_id: categoryQuery ? Number(categoryQuery) : undefined,
                    condition: selectedCondition || undefined,
                    sort_by: sortBy,
                    sort_order: sortOrder,
                    user_id: currentUserID || undefined
                };
                const res = await api.fetchItemList(params);
                setItems(res.items || []);
            } catch (error) {
                console.error("Failed to fetch items:", error);
                setItems([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [keyword, categoryQuery, selectedCondition, sortBy, sortOrder, currentUserID]);

    const handleSortChange = (value: string) => {
        const [field, order] = value.split('_') as [('created_at' | 'price'), ('desc' | 'asc')];
        setSortBy(field);
        setSortOrder(order);
    };

    return (
        <Box sx={{ pb: 8 }}>
            <Box sx={{ mb: 3, px: { xs: 2, md: 0 } }}>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                    {currentCategoryName}
                </Typography>
                {keyword && categoryQuery && (
                    <Typography variant="caption" color="text.secondary">
                        カテゴリー内検索中
                    </Typography>
                )}
            </Box>

            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: { xs: 1, sm: 3 },
                mb: 4,
                px: { xs: 2, md: 2 },
                py: 1.5,
                bgcolor: '#f8f8f8',
                borderRadius: 2
            }}>
                <Stack direction="row" alignItems="center" gap={1}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>並び替え</Typography>
                    <Select
                        size="small"
                        variant="standard"
                        value={`${sortBy}_${sortOrder}`}
                        onChange={(e) => handleSortChange(e.target.value)}
                        sx={{ fontSize: '0.85rem', fontWeight: 600, minWidth: 100 }}
                        disableUnderline
                    >
                        <MenuItem value="created_at_desc">新着順</MenuItem>
                        <MenuItem value="price_asc">価格の安い順</MenuItem>
                        <MenuItem value="price_desc">価格の高い順</MenuItem>
                    </Select>
                </Stack>

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, mx: 1 }} />

                <Stack direction="row" alignItems="center" gap={1}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>商品の状態</Typography>
                    <Select
                        size="small"
                        variant="standard"
                        value={selectedCondition}
                        onChange={(e) => setSelectedCondition(e.target.value)}
                        displayEmpty
                        sx={{ fontSize: '0.85rem', fontWeight: 600, minWidth: 100 }}
                        disableUnderline
                    >
                        <MenuItem value="">すべて</MenuItem>
                        {conditionsMeta.map(c => (
                            <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
                        ))}
                    </Select>
                </Stack>
            </Box>

            {!keyword && !categoryQuery && user && <RecentItemsDisplay currentUser={user} onItemClick={onItemClick} />}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress color="inherit" size={30} />
                </Box>
            ) : items.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
                    <Typography>該当する商品は見つかりませんでした</Typography>
                </Box>
            ) : (
                <Box sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "repeat(2, 1fr)",
                        sm: "repeat(3, 1fr)",
                        md: "repeat(4, 1fr)",
                        lg: "repeat(5, 1fr)"
                    },
                    gap: { xs: 1.5, sm: 2, md: 3 }
                }}>
                    {items.map((item) => (
                        <Box
                            key={item.id}
                            onClick={() => onItemClick(item.id)}
                            sx={{
                                cursor: "pointer",
                                transition: '0.2s',
                                '&:hover': { opacity: 0.8 }
                            }}
                        >
                            <Box sx={{
                                position: 'relative',
                                width: '100%',
                                pt: '100%',
                                borderRadius: 1.5,
                                overflow: 'hidden',
                                bgcolor: '#f0f0f0',
                                mb: 1
                            }}>
                                <img
                                    src={getFirstImageUrl(item.image_url)} // 💡 修正
                                    alt={item.title}
                                    style={{
                                        position: 'absolute',
                                        top: 0, left: 0,
                                        width: '100%', height: '100%',
                                        objectFit: "cover" // 💡 枠内に収めて切り抜く
                                    }}
                                />
                                {item.status === 'SOLD' && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 0, left: 0, width: '100%', height: '100%',
                                        bgcolor: 'rgba(0,0,0,0.5)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontWeight: 900, letterSpacing: 2, fontSize: '1.2rem'
                                    }}>
                                        SOLD
                                    </Box>
                                )}
                                <Box sx={{
                                    position: 'absolute',
                                    bottom: 8, left: 0,
                                    bgcolor: 'rgba(0,0,0,0.7)',
                                    color: 'white',
                                    px: 1, py: 0.2,
                                    borderTopRightRadius: 4,
                                    borderBottomRightRadius: 4,
                                    fontSize: '0.85rem',
                                    fontWeight: 700
                                }}>
                                    ¥{item.price.toLocaleString()}
                                </Box>
                            </Box>

                            <Typography
                                variant="caption"
                                component="div"
                                noWrap
                                sx={{
                                    fontWeight: 500,
                                    color: 'text.primary',
                                    lineHeight: 1.2
                                }}
                            >
                                {item.title}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};