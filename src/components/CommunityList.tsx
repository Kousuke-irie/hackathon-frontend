import { useState, useEffect } from "react";
import * as api from "../services/api";
import {Box, Typography, Button, Avatar, Paper, InputBase} from "@mui/material";

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
    const [newCommName, setNewCommName] = useState("");

    useEffect( () => {
        (async () => {
            await fetchCommunitiesData(setCommunities);
        })();
    }, []);

    const handleCreate = async () => {
        if (!newCommName) return;
        const description = "誰でも歓迎！";
        const image_url = "https://placehold.jp/150x150.png"; // ダミー画像
        try {
            await api.createCommunity({ name: newCommName , description, image_url})
            setNewCommName("");
            await fetchCommunitiesData(setCommunities);
        } catch (error) {
            alert("作成失敗");
            console.log(error);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4 }}>コミュニティ</Typography>

            {/* 作成フォームセクション */}
            <Paper elevation={0} sx={{ p: 3, mb: 5, bgcolor: '#f9f9f9', borderRadius: '12px' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>新しい界隈を作る</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <InputBase
                        value={newCommName}
                        onChange={(e) => setNewCommName(e.target.value)}
                        placeholder="コミュニティ名を入力..."
                        sx={{
                            flex: 1,
                            bgcolor: '#fff',
                            borderRadius: '8px',
                            px: 2,
                            py: 1,
                            border: '1px solid #eee'
                        }}
                    />
                    <Button
                        onClick={handleCreate}
                        variant="contained"
                        disabled={!newCommName}
                        sx={{ borderRadius: '8px', px: 3, fontWeight: 'bold' }}
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