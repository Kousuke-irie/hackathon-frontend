import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import * as api from "../services/api";
import type { User } from "../types/user";
import { Box, TextField, Button, Select, MenuItem, InputLabel, FormControl, CircularProgress, Typography, Paper,Divider } from '@mui/material';
import ImageSearchIcon from '@mui/icons-material/ImageSearch'; // MUIアイコンを追加

// 型の定義（外部ファイルからインポートしている前提）
type CategoryTree = api.CategoryTree;
type ProductCondition = api.ProductCondition;

interface SellItemProps {
    user: User;
    editingItemId?: number;
}

export const SellItem = ({ user, editingItemId }: SellItemProps) => {
    // --- State Management ---
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [existingImageURL, setExistingImageURL] = useState<string | null>(null); // 既存画像URL

    const [categoryId, setCategoryId] = useState<number>(0);
    const [condition, setCondition] = useState<string>('');
    const [shippingPayer, setShippingPayer] = useState<'seller' | 'buyer'>('seller');
    const [shippingFee, setShippingFee] = useState<number>(0);

    const [categoryTree, setCategoryTree] = useState<CategoryTree[]>([]);
    const [conditionsList, setConditionsList] = useState<ProductCondition[]>([]);
    const [parentCategory, setParentCategory] = useState<number | null>(null);

    const [isLoadingMeta, setIsLoadingMeta] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const isEditMode = !!editingItemId;

    // --- Computed States ---
    // 2段階選択ドロップダウンのデータソース
    const subCategories = useMemo(() => {
        if (typeof parentCategory !== 'number' || parentCategory === 0) return [];

        // categoryTree はトップレベルのカテゴリの配列です。
        // まず、選択された parentCategory IDを持つカテゴリを見つける必要があります。
        const findCategory = (id: number, tree: CategoryTree[]): CategoryTree | undefined => {
            for (const cat of tree) {
                if (cat.id === id) {
                    return cat;
                }
                if (cat.children) {
                    const found = findCategory(id, cat.children);
                    if (found) return found;
                }
            }
            return undefined;
        };

        // 選択された親カテゴリを見つけ、その children を返す
        // 💡 修正: children がない場合 (トップレベル選択時) は空の配列を返す
        const parent = findCategory(parentCategory, categoryTree);

        // Parent オブジェクトの children プロパティが、中カテゴリ（子）のリストです
        return parent?.children || [];
    }, [parentCategory, categoryTree]);

    // --- Data Fetching (Promise Warning Fix) ---
    useEffect(() => {
        // 💡 修正: IIFE (即時実行関数)でPromiseを安全に実行し、警告を解消
        (async () => {
            try {
                const [tree, conditions] = await Promise.all([
                    api.fetchCategoryTree(),
                    api.fetchConditions(),
                ]);

                setCategoryTree(tree);
                setConditionsList(conditions);

                if (editingItemId) {
                    const itemData = await api.fetchItemDetail(editingItemId);

                    // ステートにデータをセット
                    setTitle(itemData.title);
                    setDescription(itemData.description);
                    setPrice(itemData.price.toString());
                    setExistingImageURL(itemData.image_url);
                    setCondition(itemData.condition);
                    setShippingPayer(itemData.shipping_payer as 'seller' | 'buyer');
                    setShippingFee(itemData.shipping_fee);
                    setCategoryId(itemData.category_id);

                    const savedCatId = itemData.category_id;
                    const savedCat = tree.find(c => c.id === savedCatId);

                    if (savedCat) {
                        if (savedCat.parent_id) {
                            // 中カテゴリの場合
                            setParentCategory(savedCat.parent_id);
                            setCategoryId(savedCatId);
                        } else {
                            // 大カテゴリの場合（トップレベル）
                            setParentCategory(savedCatId);
                            setCategoryId(savedCatId); // 編集時には大カテゴリIDを子カテゴリIDとしてもセットしておく
                        }
                    }

                } else if (conditions.length > 0) {
                    const topLevelCats = tree.filter(c => !c.parent_id); // 親IDがないものを抽出
                    if (topLevelCats.length > 0) {
                        const firstParentId = topLevelCats[0].id;
                        setParentCategory(firstParentId); // 最初の親IDを選択済みにする
                        setCategoryId(0); // 中カテゴリは未選択 (0)
                    }
                    if (conditions.length > 0) {
                        setCondition(conditions[0].name);
                    }
                }

            } catch (error) {
                console.error("Failed to fetch metadata:", error);
                alert("データのロードに失敗しました。");
            } finally {
                setIsLoadingMeta(false);
            }
        })();
    }, [editingItemId]);


    // --- Handlers ---

    // 画像が変更されたらステートを更新
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    // AI自動入力機能
    const handleAIAnalyze = async () => {
        if (!image) {
            alert("先に画像を選択してください");
            return;
        }

        setIsAnalyzing(true);
        try {
            const aiData = await api.analyzeItemImage(image);

            setTitle(aiData.title);
            setPrice(aiData.price.toString());

            if (aiData.category_id) {
                const selectedCatId = aiData.category_id;

                // カテゴリツリー全体から、AIが提案したIDを持つカテゴリを検索
                const selectedCat = categoryTree.find(c => c.id === selectedCatId);

                // 1. カテゴリが有効で、かつ親IDを持つ（子カテゴリである）ことを確認
                if (selectedCat && selectedCat.parent_id) {
                    const parentId = selectedCat.parent_id;

                    // 💡 最終修正: 同期的に両方をセット
                    setParentCategory(parentId);
                    setCategoryId(aiData.category_id); // AIのIDを直接セット

                } else {
                    // 🚨 無効なIDまたはトップレベルIDが返された場合
                    alert(`AIが提案したID ${selectedCatId} は無効なカテゴリです。手動で選択してください。`);
                    setParentCategory(null);
                    setCategoryId(0);
                }
            }

            const tagsStr = aiData.tags.map(t => `#${t}`).join(" ");
            setDescription(`${aiData.description}\n\n${tagsStr}`);
        } catch (error) {
            console.error("AI Analysis failed:", error);
            alert("AI解析に失敗しました。時間をおいて再試行してください。");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // 💡 修正: 出品と下書き保存の共通ロジック
    const handleSaveLogic = useCallback(async (isDraft: boolean) => {
        if (!title) {
            alert("タイトルは必須です。");
            return;
        }

        // 新規作成かつ画像がない場合、または編集モードで新しい画像がなく既存画像URLもない場合をチェック
        if (!isDraft && !isEditMode && !image) {
            alert("画像を選択してください");
            return;
        }

        // 必須カテゴリチェック
        if (categoryId === 0 || !condition) {
            alert("カテゴリと商品状態を選択してください");
            return;
        }

        setIsSaving(true);
        try {
            let finalImageUrl = existingImageURL; // 既存画像URLを初期値とする

            // 1. 新しい画像ファイル(image)がある場合のみ、GCSにアップロード
            if (image) {
                // 1-1. アップロードURLと最終的な画像URLを取得 (api.tsxに追加した関数)
                const { uploadUrl, imageUrl } = await api.getGcsUploadUrl(image.name,user.id,image.type);

                await axios.put(uploadUrl, image, {
                    headers: {
                        'Content-Type': image.type,
                    },
                    transformRequest: [(data) => data],
                });

                finalImageUrl = imageUrl; // GCSに保存された最終的なURLを更新
            }

            // 画像が未選択なのにexistingImageURLもない場合はエラー (上のチェックで弾かれるはずだが念のため)
            if (!finalImageUrl) {
                throw new Error("画像URLが確定できませんでした。");
            }

            // 2. 商品データJSONの構築 (FormDataの代わり)
            const itemData: api.ItemData = {
                title: title,
                description: description,
                price: price.toString(),
                seller_id: user.id.toString(),
                image_url: finalImageUrl, // 👈 GCSのURLを渡す
                category_id: categoryId.toString(),
                condition: condition,
                shipping_payer: shippingPayer,
                shipping_fee: shippingFee.toString(),
                status: isDraft ? "DRAFT" : "ON_SALE",
            };


            // 3. APIの呼び出し（PUT または POST）
            if (isEditMode && editingItemId) {
                // 編集モード: PUT を使用 (JSONを受け付けるように修正したapi.updateItemを使用)
                await api.updateItem(editingItemId, itemData);
            } else {
                // 新規作成または新規下書き: POST を使用 (JSONを受け付けるように修正したapi.createItemを使用)
                await api.createItem(itemData);
            }

            alert(isDraft ? "下書きを保存しました！" : "出品を完了しました！");

            if (!isEditMode) { // 編集モードでない場合（新規作成/新規下書き）のみフォームをクリア
                setTitle("");
                setDescription("");
                setPrice("");
                setImage(null);
                setExistingImageURL(null); // URLもクリア
                setCategoryId(0);
                setParentCategory(null);
                setShippingFee(0);
                // condition, shippingPayer はリストの初期値に任せる
            }

            if (isEditMode) {
                // 編集完了後、下書きリストに戻るなど、親に通知するロジックが必要
                window.location.href = '/drafts'; // Hard redirect (簡易策)
            }
        } catch (error) {
            console.error("Save/Draft failed:", error);
            alert(isDraft ? "保存に失敗しました" : "出品に失敗しました");
        } finally {
            setIsSaving(false);
        }
    }, [title, description, price, image,existingImageURL, categoryId, condition, shippingPayer, shippingFee, user, isEditMode, editingItemId]);
    // 出品機能 (handleSubmit)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleSaveLogic(false); // isDraft = false で実行
    };

    // 下書き保存ハンドラ
    const handleDraftSave = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleSaveLogic(true); // isDraft = true で実行
    };


    if (isLoadingMeta) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3, pb: 10 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 800, mb: 4, textAlign: 'center' }}>
                {isEditMode ? `商品を編集 #${editingItemId}` : '商品の出品'}
            </Typography>

            <form onSubmit={handleSubmit}>
                <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, border: '1px solid #eee', borderRadius: '8px' }}>

                    {/* 画像セクション */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>出品画像</Typography>
                    <Box sx={{ mb: 4 }}>
                        {(existingImageURL || image) && (
                            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                <Box sx={{ position: 'relative', width: 100, height: 100 }}>
                                    <img
                                        src={image ? URL.createObjectURL(image) : existingImageURL!}
                                        alt="商品画像"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary">画像を変更する場合は再度選択してください</Typography>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <input type="file" accept="image/*" onChange={handleImageChange} id="file-input" style={{ display: 'none' }} />
                            <label htmlFor="file-input" style={{ flexGrow: 1 }}>
                                <Button component="span" variant="outlined" startIcon={<ImageSearchIcon />} fullWidth sx={{ py: 1.5, borderColor: '#eee', color: '#1a1a1a' }}>
                                    {image ? image.name : "画像を選択"}
                                </Button>
                            </label>
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={handleAIAnalyze}
                                disabled={!image || isAnalyzing}
                                sx={{ whiteSpace: 'nowrap', px: 3 }}
                            >
                                {isAnalyzing ? "解析中..." : "✨ AI自動入力"}
                            </Button>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* 商品名・説明セクション */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>商品名</Typography>
                        <TextField
                            fullWidth
                            placeholder="商品名（40文字以内）"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            variant="outlined"
                            sx={{ mb: 3 }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>商品の説明</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={6}
                            placeholder="商品の状態、色、素材、重さ、定価、注意点など"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* 詳細設定セクション */}
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, fontSize: '1rem' }}>商品の詳細</Typography>
                    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, mb: 4 }}>
                        <FormControl fullWidth required variant="standard">
                            <InputLabel>大カテゴリー</InputLabel>
                            <Select
                                value={parentCategory || ''}
                                onChange={(e) => {
                                    setParentCategory(Number(e.target.value));
                                    setCategoryId(0);
                                }}
                            >
                                {categoryTree.map((cat) => (
                                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {parentCategory && (
                            <FormControl fullWidth required variant="standard" disabled={subCategories.length === 0}>
                                <InputLabel>中カテゴリー</InputLabel>
                                <Select value={categoryId || ''} onChange={(e) => setCategoryId(Number(e.target.value))}>
                                    {subCategories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>
                                            {cat.name.replace('レディース ', '').replace('メンズ ', '')}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        <FormControl fullWidth required variant="standard">
                            <InputLabel>商品の状態</InputLabel>
                            <Select value={condition} onChange={(e) => setCondition(e.target.value as string)}>
                                {conditionsList.map((cond) => (
                                    <MenuItem key={cond.id} value={cond.name}>{cond.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* 配送・価格セクション */}
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, fontSize: '1rem' }}>配送・価格</Typography>
                    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, mb: 4 }}>
                        <FormControl fullWidth required variant="standard">
                            <InputLabel>配送料の負担</InputLabel>
                            <Select value={shippingPayer} onChange={(e) => setShippingPayer(e.target.value as 'seller' | 'buyer')}>
                                <MenuItem value="seller">送料込み（出品者負担）</MenuItem>
                                <MenuItem value="buyer">着払い（購入者負担）</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="送料"
                            type="number"
                            variant="standard"
                            value={shippingFee}
                            onChange={(e) => setShippingFee(Number(e.target.value))}
                            required
                        />
                        <TextField
                            label="販売価格 (¥)"
                            type="number"
                            fullWidth
                            variant="standard"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                            sx={{ gridColumn: { md: 'span 2' } }}
                        />
                    </Box>

                    {/* ボタン群 */}
                    <Box sx={{ mt: 6, display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={handleDraftSave}
                            disabled={isSaving}
                            sx={{ flex: 1, py: 2, borderColor: '#1a1a1a', color: '#1a1a1a', fontWeight: 'bold' }}
                        >
                            下書き保存
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isSaving}
                            sx={{ flex: 2, py: 2, bgcolor: '#e91e63', fontWeight: 'bold', '&:hover': { bgcolor: '#c2185b' } }}
                        >
                            {isSaving ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? '変更を保存する' : '出品する')}
                        </Button>
                    </Box>
                </Paper>
            </form>
        </Box>
    );
};