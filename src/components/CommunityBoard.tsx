import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import {
    Box, Button, Paper, InputBase, Typography, MenuItem, Avatar, IconButton,
    Menu, Dialog, DialogTitle, List, ListItemIcon, ListItemText, ListItemButton, Divider, TextField
} from "@mui/material";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';

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
    onItemClick: (id: number) => void;
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

export const CommunityBoard = ({ communityId, currentUser, onBack, onItemClick }: CommunityBoardProps) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [content, setContent] = useState("");
    const [myItems, setMyItems] = useState<MyItem[]>([]);
    const [likedItems, setLikedItems] = useState<MyItem[]>([]);

    // 共有用State
    const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
    const [itemSelectorOpen, setItemSelectorOpen] = useState(false);
    const [selectorMode, setSelectorMode] = useState<'MY' | 'LIKED'>('MY');
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

    // 管理者メニュー用State
    const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editInfo, setEditInfo] = useState({ name: '', description: '', image_url: '' });

    useEffect(() => {
        (async () => {
            await fetchPostsData(communityId, setPosts);

            // 自分の出品商品（販売中のみ）を取得
            const my = await api.fetchMyItems(currentUser.id);
            setMyItems(my.filter((i) => i.status === "ON_SALE") as MyItem[]);

            // いいねした商品を取得
            const liked = await api.fetchLikedItems(currentUser.id);
            setLikedItems(liked as unknown as MyItem[]);

            // コミュニティ情報の初期化（編集用）
            const communities = await api.fetchCommunities();
            const current = communities.find((c) => c.id === communityId);
            if (current) {
                setEditInfo({
                    name: current.name,
                    description: current.description,
                    image_url: current.image_url
                });
            }
        })();
    }, [communityId, currentUser.id]);

    const handlePost = async () => {
        if (!content) return;
        try {
            await api.postCommunityPost(communityId, currentUser.id, content, selectedItemId);
            setContent("");
            setSelectedItemId(null);
            await fetchPostsData(communityId, setPosts);
        } catch (error) {
            alert("投稿失敗");
        }
    };

    const handleDeleteCommunity = async () => {
        if (!window.confirm("このコミュニティを削除しますか？")) return;
        try {
            // api.client を使用して削除リクエスト
            await api.client.delete(`/communities/${communityId}`, {
                headers: { 'X-User-ID': currentUser.id.toString() }
            });
            alert("削除しました");
            onBack();
        } catch (e) {
            alert("削除に失敗しました（作成者のみ削除可能です）");
        }
    };

    const handleUpdateCommunity = async () => {
        try {
            // api.client を使用して更新リクエスト
            await api.client.put(`/communities/${communityId}`, editInfo, {
                headers: { 'X-User-ID': currentUser.id.toString() }
            });
            alert("設定を更新しました");
            setEditModalOpen(false);
            window.location.reload();
        } catch (e) {
            alert("更新に失敗しました（作成者のみ更新可能です）");
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button onClick={onBack} startIcon={<ArrowBackIosIcon />} sx={{ color: 'text.secondary' }}>
                    コミュニティ一覧
                </Button>

                {/* 管理者用三点リーダーメニュー */}
                <IconButton onClick={(e) => setSettingsAnchorEl(e.currentTarget)}>
                    <MoreVertIcon />
                </IconButton>
                <Menu
                    anchorEl={settingsAnchorEl}
                    open={Boolean(settingsAnchorEl)}
                    onClose={() => setSettingsAnchorEl(null)}
                >
                    <MenuItem onClick={() => { setEditModalOpen(true); setSettingsAnchorEl(null); }}>
                        <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                        設定を変更
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleDeleteCommunity} sx={{ color: 'error.main' }}>
                        <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                        コミュニティを削除
                    </MenuItem>
                </Menu>
            </Box>

            {/* 投稿エリア */}
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #eee', borderRadius: '12px', mb: 4 }}>
                <InputBase
                    multiline
                    minRows={2}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="このコミュニティにメッセージを投稿..."
                    fullWidth
                    sx={{ p: 1, fontSize: '0.95rem' }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: '1px solid #f5f5f5' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* 商品共有ボタン */}
                        <Button
                            variant="outlined"
                            startIcon={<ShareIcon />}
                            onClick={(e) => setShareAnchorEl(e.currentTarget)}
                            sx={{
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                color: selectedItemId ? 'secondary.main' : 'inherit',
                                borderColor: selectedItemId ? 'secondary.main' : '#ddd'
                            }}
                        >
                            {selectedItemId ? "商品を選択済" : "商品を共有"}
                        </Button>
                        <Menu
                            anchorEl={shareAnchorEl}
                            open={Boolean(shareAnchorEl)}
                            onClose={() => setShareAnchorEl(null)}
                        >
                            <MenuItem onClick={() => { setSelectorMode('MY'); setItemSelectorOpen(true); setShareAnchorEl(null); }}>
                                <ListItemIcon><ShoppingBagIcon fontSize="small" /></ListItemIcon>
                                自分の商品を共有
                            </MenuItem>
                            <MenuItem onClick={() => { setSelectorMode('LIKED'); setItemSelectorOpen(true); setShareAnchorEl(null); }}>
                                <ListItemIcon><FavoriteIcon fontSize="small" /></ListItemIcon>
                                いいねした商品を共有
                            </MenuItem>
                        </Menu>
                    </Box>

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

            {/* 商品選択ダイアログ */}
            <Dialog open={itemSelectorOpen} onClose={() => setItemSelectorOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {selectorMode === 'MY' ? '自分の商品を選択' : 'いいねした商品を選択'}
                </DialogTitle>
                <List sx={{ pt: 0 }}>
                    {(selectorMode === 'MY' ? myItems : likedItems).map(item => (
                        <ListItemButton key={item.id} onClick={() => { setSelectedItemId(item.id); setItemSelectorOpen(false); }}>
                            <ListItemText
                                primary={item.title}
                                secondary={`¥${item.price.toLocaleString()}`}
                            />
                        </ListItemButton>
                    ))}
                    {(selectorMode === 'MY' ? myItems : likedItems).length === 0 && (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">対象の商品がありません</Typography>
                        </Box>
                    )}
                </List>
            </Dialog>

            {/* 設定変更モーダル */}
            <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>コミュニティ設定の変更</DialogTitle>
                <Box sx={{ p: 3, display: 'grid', gap: 3 }}>
                    <TextField
                        label="名前"
                        fullWidth
                        value={editInfo.name}
                        onChange={(e) => setEditInfo({...editInfo, name: e.target.value})}
                    />
                    <TextField
                        label="説明"
                        fullWidth
                        multiline
                        rows={3}
                        value={editInfo.description}
                        onChange={(e) => setEditInfo({...editInfo, description: e.target.value})}
                    />
                    <Button
                        variant="contained"
                        onClick={handleUpdateCommunity}
                        fullWidth
                        sx={{ mt: 2, fontWeight: 'bold' }}
                    >
                        変更を保存
                    </Button>
                </Box>
            </Dialog>

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