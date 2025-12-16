import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import {Box, FormControl, Select, MenuItem, Typography, CircularProgress} from "@mui/material";
import { useSearchParams} from "react-router-dom";
import { RecentItemsDisplay} from "./RecentItemsDisplay";

type Item = api.Item;

interface ItemListProps {
    user: User | null;
    onItemClick: (id: number) => void;
}

export const ItemList = ({ user, onItemClick }: ItemListProps) => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedCondition, setSelectedCondition] = useState<string>('');
    const [categoriesMeta, setCategoriesMeta] = useState<api.Category[]>([]);
    const [conditionsMeta, setConditionsMeta] = useState<api.ProductCondition[]>([]);
    const [sortBy, setSortBy] = useState<'created_at' | 'price'>('created_at');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [searchParams] = useSearchParams();
    const keyword = searchParams.get('q') || '';

    const currentUserID = user ? user.id : 0;

    useEffect(() => {
        (async () => {
            try {
                const [categories, conditions] = await Promise.all([
                    api.fetchCategories(),
                    api.fetchConditions(),
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
                    user_id: currentUserID,
                    category_id: selectedCategory || undefined,
                    condition: selectedCondition || undefined,
                    sort_by: sortBy,
                    sort_order: sortOrder,
                    q: keyword || undefined,
                };
                const fetchedItems = await api.fetchItemList(params);
                setItems(fetchedItems);
            } catch (error) {
                console.error("Failed to fetch item list:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [user, currentUserID, selectedCategory, selectedCondition, sortBy, sortOrder, keyword]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress color="inherit" /></Box>;

    return (
        <Box>
            <RecentItemsDisplay onItemClick={onItemClick} />

            {/* フィルタリングエリア: シンプルに */}
            <Box sx={{ display: 'flex', gap: 2, mb: 4, overflowX: 'auto', pb: 1 }}>
                <FormControl size="small" variant="standard" sx={{ minWidth: 100 }}>
                    <Select
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(Number(e.target.value))}
                        displayEmpty
                        renderValue={selectedCategory ? undefined : () => "カテゴリ"}
                    >
                        <MenuItem value="">すべて</MenuItem>
                        {categoriesMeta.map((cat) => (
                            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" variant="standard" sx={{ minWidth: 100 }}>
                    <Select
                        value={selectedCondition}
                        onChange={(e) => setSelectedCondition(e.target.value as string)}
                        displayEmpty
                        renderValue={selectedCondition ? undefined : () => "状態"}
                    >
                        <MenuItem value="">すべて</MenuItem>
                        {conditionsMeta.map((cond) => (
                            <MenuItem key={cond.id} value={cond.name}>{cond.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" variant="standard" sx={{ minWidth: 120 }}>
                    <Select
                        value={`${sortBy}_${sortOrder}`}
                        onChange={(e) => {
                            const [by, order] = (e.target.value as string).split('_');
                            setSortBy(by as 'created_at' | 'price');
                            setSortOrder(order as 'asc' | 'desc');
                        }}
                    >
                        <MenuItem value="created_at_desc">新着順</MenuItem>
                        <MenuItem value="price_asc">価格の安い順</MenuItem>
                        <MenuItem value="price_desc">価格の高い順</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {items.length === 0 ? (
                <Typography align="center" color="text.secondary" sx={{ mt: 5 }}>該当する商品が見つかりませんでした。</Typography>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gap: '24px 16px', // 縦横の隙間
                        gridTemplateColumns: {
                            xs: '1fr 1fr',          // スマホ: 2列
                            sm: '1fr 1fr 1fr',      // タブレット: 3列
                            md: '1fr 1fr 1fr 1fr',  // PC: 4列
                        },
                    }}
                >
                    {items.map((item) => (
                        <Box
                            key={item.id}
                            onClick={() => onItemClick(item.id)}
                            sx={{
                                cursor: 'pointer',
                                transition: 'opacity 0.2s',
                                '&:hover': { opacity: 0.8 }
                            }}
                        >
                            {/* 画像コンテナ: アスペクト比を固定（例: 1:1） */}
                            <Box sx={{
                                position: 'relative',
                                width: '100%',
                                paddingTop: '100%', // 1:1 Aspect Ratio
                                backgroundColor: '#f0f0f0',
                                borderRadius: '4px', // ほんの少しだけ角を丸める
                                overflow: 'hidden',
                                mb: 1
                            }}>
                                <img
                                    src={item.image_url}
                                    alt={item.title}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover"
                                    }}
                                />
                                {item.status === 'SOLD' && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 0, left: 0, width: '100%', height: '100%',
                                        bgcolor: 'rgba(0,0,0,0.5)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontWeight: 'bold', letterSpacing: 2
                                    }}>
                                        SOLD
                                    </Box>
                                )}
                            </Box>

                            {/* 商品情報: 最小限に */}
                            <Box>
                                <Typography variant="subtitle2" component="h3" noWrap sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                    {item.title}
                                </Typography>
                                <Typography variant="body2" component="p" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                                    ¥{item.price.toLocaleString()}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};