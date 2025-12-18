import { useState, useEffect } from "react";
import * as api from "../services/api";
import { Box, Typography, Button, Avatar, Paper, TextField, CircularProgress } from "@mui/material";
import axios from "axios";
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import type { User } from "../types/user";

interface Community {
    id: number;
    name: string;
    description: string;
    image_url: string;
}

interface CommunityListProps {
    onSelectCommunity: (id: number) => void;
    currentUser: User;
}

// 💡 デフォルト値の定義
const DEFAULT_COMMUNITY_IMAGE = "https://placehold.jp/24/003366/ffffff/150x150.png?text=Community";
const DEFAULT_COMMUNITY_DESC = "誰でも参加歓迎のコミュニティです！";

export const CommunityList = ({ onSelectCommunity, currentUser }: CommunityListProps) => {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [newComm, setNewComm] = useState({ name: '', description: '' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchCommunitiesData = async () => {
        try {
            const res = await api.fetchCommunities();
            setCommunities(res as Community[]);
        } catch (error) {
            console.error("Failed to fetch communities:", error);
        }
    };

    useEffect(() => {
        (async () => {
            await fetchCommunitiesData();
        })();
    }, []);

    const handleCreate = async () => {
        // 名前はコミュニティを識別するために必須とします
        if (!newComm.name.trim() || !currentUser) return;

        setIsSaving(true);
        try {
            let finalImageUrl = DEFAULT_COMMUNITY_IMAGE;

            // 💡 画像が選択されている場合のみGCSにアップロード
            if (imageFile) {
                const { uploadUrl, imageUrl } = await api.getGcsUploadUrl(imageFile.name, currentUser.id, imageFile.type);
                await axios.put(uploadUrl, imageFile, {
                    headers: { 'Content-Type': imageFile.type }
                });
                finalImageUrl = imageUrl;
            }

            // 💡 API呼び出し: 説明文が空ならデフォルトを使用
            await api.createCommunity({
                name: newComm.name,
                description: newComm.description.trim() || DEFAULT_COMMUNITY_DESC,
                image_url: finalImageUrl,
                creator_id: currentUser.id
            } as any);

            // フォームリセット
            setNewComm({ name: '', description: '' });
            setImageFile(null);
            await fetchCommunitiesData();
        } catch (error) {
            console.error("Community creation failed:", error);
            alert("作成に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4 }}>コミュニティ</Typography>

            <Paper elevation={0} sx={{ p: 3, mb: 5, bgcolor: '#f9f9f9', borderRadius: '12px' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>新しいコミュニティを作る</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="コミュニティ名 (必須)"
                        variant="outlined"
                        fullWidth
                        size="small"
                        placeholder="例: キャンプ好きの集い"
                        value={newComm.name}
                        onChange={(e) => setNewComm({ ...newComm, name: e.target.value })}
                        required
                    />
                    <TextField
                        label="説明文 (任意)"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        // 💡 placeholder プロパティでデフォルトメッセージを表示
                        placeholder={DEFAULT_COMMUNITY_DESC}
                        value={newComm.description}
                        onChange={(e) => setNewComm({ ...newComm, description: e.target.value })}
                    />

                    {/* 画像選択ボタン (任意) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<ImageSearchIcon />}
                            fullWidth
                            sx={{
                                borderColor: '#ddd',
                                color: '#666',
                                bgcolor: imageFile ? '#f0f7ff' : 'transparent',
                                textTransform: 'none'
                            }}
                        >
                            {imageFile ? `選択済み: ${imageFile.name}` : "アイコン画像を選択 (任意)"}
                            <input type="file" hidden accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                        </Button>
                        {imageFile && (
                            <Button size="small" color="error" onClick={() => setImageFile(null)}>取消</Button>
                        )}
                    </Box>

                    <Button
                        onClick={handleCreate}
                        variant="contained"
                        disabled={!newComm.name.trim() || isSaving}
                        sx={{ borderRadius: '8px', fontWeight: 'bold', alignSelf: 'flex-end', px: 4, minWidth: 120 }}
                    >
                        {isSaving ? <CircularProgress size={24} color="inherit" /> : "作成"}
                    </Button>
                </Box>
            </Paper>

            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>参加可能なコミュニティ</Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                {communities.map((c) => (
                    <Box
                        key={c.id}
                        onClick={() => onSelectCommunity(c.id)}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            p: 2,
                            border: '1px solid #eee',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': { borderColor: '#1a1a1a', transform: 'translateY(-2px)' }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar src={c.image_url} variant="rounded" sx={{ width: 48, height: 48, mr: 2, borderRadius: '8px' }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>#{c.name}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, mb: 2, fontSize: '0.8rem' }}>
                            {c.description}
                        </Typography>
                        <Button variant="outlined" size="small" fullWidth sx={{ borderRadius: '6px', color: '#1a1a1a', borderColor: '#eee' }}>
                            表示する
                        </Button>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};