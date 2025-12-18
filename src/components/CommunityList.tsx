import { useState, useEffect } from "react";
import * as api from "../services/api";
import {Box, Typography, Button, Avatar, Paper,TextField} from "@mui/material";

interface Community {
    id: number;
    name: string;
    description: string;
    image_url: string;
}

// コミュニティ一覧を取得し、setState関数に渡す関数
const fetchCommunitiesData = async (setCommunities: React.Dispatch<React.SetStateAction<Community[]>>) => {
    try {
        // API_URLを使うように修正
        const res = await api.fetchCommunities()
        // 戻り値の型を明示的にキャスト (any警告対策)
        setCommunities(res as Community[]);
    } catch (error) {
        console.error("Failed to fetch communities:", error);
    }
};

interface CommunityListProps {
    onSelectCommunity: (id: number) => void;
}

export const CommunityList = ({ onSelectCommunity }: CommunityListProps) => {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [newComm, setNewComm] = useState({ name: '', description: '', imageUrl: '' });

    useEffect( () => {
        (async () => {
            await fetchCommunitiesData(setCommunities);
        })();
    }, []);

    const handleCreate = async () => {
        if (!newComm.name) return;
        try {
            await api.createCommunity({
                name: newComm.name,
                description: newComm.description || "誰でも歓迎！",
                image_url: newComm.imageUrl || "https://placehold.jp/150x150.png"
            });
            setNewComm({ name: '', description: '', imageUrl: '' }); // リセット
            await fetchCommunitiesData(setCommunities);
        } catch (error) {
            alert("作成失敗");
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4 }}>コミュニティ</Typography>

            {/* 作成フォームセクション */}
            <Paper elevation={0} sx={{ p: 3, mb: 5, bgcolor: '#f9f9f9', borderRadius: '12px' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>新しいコミュニティを作る</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="コミュニティ名"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={newComm.name}
                        onChange={(e) => setNewComm({...newComm, name: e.target.value})}
                    />
                    <TextField
                        label="説明文"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        value={newComm.description}
                        onChange={(e) => setNewComm({...newComm, description: e.target.value})}
                    />
                    <TextField
                        label="アイコン画像URL"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={newComm.imageUrl}
                        onChange={(e) => setNewComm({...newComm, imageUrl: e.target.value})}
                    />
                    <Button
                        onClick={handleCreate}
                        variant="contained"
                        disabled={!newComm.name.trim()}
                        sx={{ borderRadius: '8px', fontWeight: 'bold', alignSelf: 'flex-end' }}
                    >
                        作成
                    </Button>
                </Box>
            </Paper>

            {/* 一覧セクション */}
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
                            '&:hover': {
                                borderColor: '#1a1a1a',
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                                src={c.image_url}
                                variant="rounded"
                                sx={{ width: 48, height: 48, mr: 2, borderRadius: '8px' }}
                            />
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>#{c.name}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, mb: 2, fontSize: '0.8rem' }}>
                            {c.description}
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            fullWidth
                            sx={{ borderRadius: '6px', textTransform: 'none', color: '#1a1a1a', borderColor: '#eee' }}
                        >
                            表示する
                        </Button>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};