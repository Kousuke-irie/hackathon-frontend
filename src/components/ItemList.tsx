import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import {Box, FormControl, InputLabel, Select, MenuItem, Card} from "@mui/material";
import { useSearchParams} from "react-router-dom";
import { RecentItemsDisplay} from "./RecentItemsDisplay.tsx";

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
    const [categoriesMeta, setCategoriesMeta] = useState<api.Category[]>([]); // フラットリスト
    const [conditionsMeta, setConditionsMeta] = useState<api.ProductCondition[]>([]);
    const [sortBy, setSortBy] = useState<'created_at' | 'price'>('created_at');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [searchParams] = useSearchParams(); // URLのクエリを取得
    const keyword = searchParams.get('q') || ''; // qパラメータを取得

    const currentUserID = user ? user.id : 0;

    useEffect(() => {
        (async () => {
            try {
                const [categories, conditions] = await Promise.all([
                    api.fetchCategories(), // フラットリストを取得
                    api.fetchConditions(),
                ]);
                setCategoriesMeta(categories);
                setConditionsMeta(conditions);
            } catch (error) {
                console.error("Failed to fetch metadata:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            // 未ログイン時、ItemDetailWrapperがユーザー情報を必要とするため、ここではnullチェックはしないか、
            // ItemDetailWrapper側でUser.idの有無を判定すべきですが、API側で0を許容している前提で進めます。
            const currentUserID = user ? user.id : 0;
            if (currentUserID === 0 && !user) return; // 未ログインでIDが0の場合、APIを叩かない

            setLoading(true);
            try {
                // 💡 API呼び出しロジックの実装: フィルタリングパラメータを渡す
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
    }, [user,currentUserID, selectedCategory, selectedCondition, sortBy, sortOrder,keyword]);

    if (loading) {
        return <div style={{ textAlign: "center", marginTop: "50px" }}>Loading...</div>;
    }

    if (items.length === 0) {
        return <div style={{ textAlign: "center", marginTop: "50px" }}>表示できる商品がありません。</div>;
    }

    return (
        <Box sx={{ mt: 3, p: 1 }}>
            {/* ▼▼▼ 組み込み: トップページ上部 ▼▼▼ */}
            <RecentItemsDisplay onItemClick={onItemClick} />
            {/* ▼▼▼ 追加: フィルタリング UI ▼▼▼ */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>カテゴリ</InputLabel>
                    <Select
                        label="カテゴリ"
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(Number(e.target.value))}
                    >
                        <MenuItem value="">すべて</MenuItem>
                        {/* メタデータで取得したカテゴリを表示 (api.fetchCategoriesを使用) */}
                        {categoriesMeta.map((cat) => (
                            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>状態</InputLabel>
                    <Select
                        label="状態"
                        value={selectedCondition}
                        onChange={(e) => setSelectedCondition(e.target.value as string)}
                    >
                        <MenuItem value="">すべて</MenuItem>
                        {/* メタデータで取得した状態を表示 (api.fetchConditionsを使用) */}
                        {conditionsMeta.map((cond) => (
                            <MenuItem key={cond.id} value={cond.name}>{cond.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>並び替え</InputLabel>
                    <Select
                        label="並び替え"
                        // sortByとsortOrderを組み合わせた値を管理
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

            <Box
                sx={{
                    display: 'grid',
                    gap: 2, // アイテム間の間隔
                    // レスポンシブな2〜4列レイアウトをCSS Gridで定義
                    gridTemplateColumns: {
                        xs: '1fr 1fr',          // 画面が小さいときは2列 (xs=6 に相当)
                        sm: '1fr 1fr 1fr',      // 中程度のときは3列 (sm=4 に相当)
                        md: '1fr 1fr 1fr 1fr',  // 大きいときは4列 (md=3 に相当)
                    },
                    mt: 2
                }}
            >
                {items.map((item) => (
                    // ▼ Grid item を Box に置き換え、onClickを適用
                    <Box
                        key={item.id}
                        onClick={() => onItemClick(item.id)}
                        sx={{
                            cursor: 'pointer',
                            height: '100%',
                            border: "1px solid #eee",
                            borderRadius: "8px",
                            overflow: "hidden",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                        }}
                    >
                        {/* Cardコンポーネントはそのまま内部に残します */}
                        <Card sx={{ height: '100%', boxShadow: 'none' }}>
                            <img
                                src={item.image_url}
                                alt={item.title}
                                style={{ width: "100%", height: "150px", objectFit: "cover" }}
                            />
                            <Box sx={{ padding: "8px" }}>
                                {/* ... タイトルと価格 ... */}
                                <h4 style={{ margin: "0 0 5px 0", fontSize: "14px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                                    {item.title}
                                </h4>
                                <p style={{ margin: 0, fontWeight: "bold", color: "#e91e63" }}>
                                    ¥{item.price.toLocaleString()}
                                </p>
                            </Box>
                        </Card>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};