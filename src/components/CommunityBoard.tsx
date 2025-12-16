import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import {Box, Button, Paper, InputBase, FormControl, Typography,MenuItem,Avatar,Select} from "@mui/material";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

interface Post {
    id: number;
    content: string;
    user: { username: string; icon_url: string };
    related_item?: { id: number; title: string; image_url: string; price: number };
}

interface MyItem {
    id: number;
    title: string;
    price: number;
    status: string;
}

interface CommunityBoardProps {
    communityId: number;
    currentUser: User;
    onBack: () => void;
    onItemClick: (id: number) => void; // 商品詳細へ飛ぶ用
}

const fetchPostsData = async (
    communityId: number,
    setPosts: React.Dispatch<React.SetStateAction<Post[]>>
) => {
    try {
        const res = await api.fetchCommunityPosts(communityId);
        setPosts(res as Post[]);
    } catch (error) {
        console.error("Failed to fetch posts:", error);
    }
};

const fetchMyItemsData = async (
    userId: number,
    setMyItems: React.Dispatch<React.SetStateAction<MyItem[]>>
) => {
    try {
        const res = await api.fetchMyItems(userId);

        // 販売中の商品のみをフィルタリング
        const onSaleItems = res.filter((item: MyItem) => item.status === "ON_SALE");
        setMyItems(onSaleItems as MyItem[]);
    } catch (_error) { // unused-vars 対策
        console.error("Failed to fetch my items:", _error);
        setMyItems([]);
    }
};

export const CommunityBoard = ({ communityId, currentUser, onBack, onItemClick }: CommunityBoardProps) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [content, setContent] = useState("");

    // 商品シェア用
    const [myItems, setMyItems] = useState<MyItem[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            await fetchPostsData(communityId, setPosts);
            await fetchMyItemsData(currentUser.id, setMyItems);
        })();
    }, [communityId, currentUser.id]);

    const handlePost = async () => {
        if (!content) return;
        try {
            const itemIdToPost = selectedItemId === 0 ? null : selectedItemId;
            await api.postCommunityPost(communityId, currentUser.id, content, itemIdToPost)
            setContent("");
            setSelectedItemId(null);
            await fetchPostsData(communityId, setPosts);
        } catch (error) {
            alert("投稿失敗");
            console.error(error);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
            <Button
                onClick={onBack}
                startIcon={<ArrowBackIosIcon />}
                sx={{ mb: 3, color: 'text.secondary', fontSize: '0.8rem' }}
            >
                界隈一覧に戻る
            </Button>

            {/* 投稿エリア: メルカリのコメント欄のような清潔感 */}
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #eee', borderRadius: '12px', mb: 4 }}>
                <InputBase
                    multiline
                    minRows={2}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="この界隈にメッセージを投稿..."
                    fullWidth
                    sx={{ p: 1, fontSize: '0.95rem' }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: '1px solid #f5f5f5' }}>
                    {myItems.length > 0 ? (
                        <FormControl size="small" variant="standard" sx={{ minWidth: 200 }}>
                            <Select
                                value={selectedItemId || ''}
                                displayEmpty
                                onChange={(e) => setSelectedItemId(e.target.value ? Number(e.target.value) : null)}
                                renderValue={(selected) => {
                                    if (!selected) return <Typography variant="caption" color="text.secondary">商品をシェアする (任意)</Typography>;
                                    const item = myItems.find(i => i.id === selected);
                                    return <Typography variant="caption">{item?.title}</Typography>;
                                }}
                            >
                                <MenuItem value="">選択しない</MenuItem>
                                {myItems.map(item => (
                                    <MenuItem key={item.id} value={item.id}>
                                        <Typography variant="caption">{item.title} (¥{item.price.toLocaleString()})</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ) : (
                        <Typography variant="caption" color="text.secondary">販売中の商品がありません</Typography>
                    )}

                    <Button
                        onClick={handlePost}
                        variant="contained"
                        disabled={!content}
                        sx={{ borderRadius: '20px', px: 3, fontWeight: 'bold' }}
                    >
                        投稿
                    </Button>
                </Box>
            </Paper>

            {/* タイムライン */}
            <Box>
                {posts.map((post) => (
                    <Box key={post.id} sx={{ mb: 4, pb: 4, borderBottom: '1px solid #f5f5f5' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            <Avatar src={post.user.icon_url} sx={{ width: 32, height: 32 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{post.user.username}</Typography>
                        </Box>

                        <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#333', mb: 2 }}>
                            {post.content}
                        </Typography>

                        {post.related_item && (
                            <Box
                                onClick={() => onItemClick(post.related_item!.id)}
                                sx={{
                                    display: 'flex',
                                    gap: 2,
                                    p: 1.5,
                                    border: '1px solid #eee',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    '&:hover': { bgcolor: '#fafafa' }
                                }}
                            >
                                <Box sx={{ width: 60, height: 60, borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                                    <img src={post.related_item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }} noWrap>
                                        {post.related_item.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#e91e63', fontWeight: 700 }}>
                                        ¥{post.related_item.price.toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
};