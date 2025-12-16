import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import { Typography, Box,  Button } from '@mui/material';

interface DraftsListProps {
    user: User;
    // 下書きをタップした際に編集画面に遷移させるためのハンドラ
    onEditDraft: (id: number) => void;
}

export const DraftsList = ({ user, onEditDraft }: DraftsListProps) => {
    const [items, setItems] = useState<api.Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        ( async () => {
            setLoading(true);
            try {
                // ▼ api.fetchMyDrafts を使用
                const fetchedItems = await api.fetchMyDrafts(user.id);
                setItems(fetchedItems);
            } catch (error) {
                console.error("Failed to fetch drafts:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    if (loading) return <Typography align="center" sx={{ mt: 5 }}>Loading...</Typography>;
    if (items.length === 0) {
        return <Typography align="center" sx={{ mt: 5 }}>保存された下書きはありません。</Typography>;
    }

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
                下書き一覧 ({items.length})
            </Typography>

            <Box sx={{ display: 'grid', gap: 2 }}>
                {items.map((item) => (
                    <Box
                        key={item.id}
                        onClick={() => onEditDraft(item.id)}
                        sx={{
                            display: 'flex',
                            p: 1.5,
                            border: '1px solid #eee',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s',
                            '&:hover': { borderColor: '#1a1a1a' }
                        }}
                    >
                        <Box sx={{ width: 80, height: 80, borderRadius: '4px', overflow: 'hidden', bgcolor: '#f5f5f5', flexShrink: 0 }}>
                            <img src={item.image_url || 'https://placehold.jp/100x100.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                        <Box sx={{ flex: 1, ml: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                                {item.title || "タイトル未設定"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                ¥{item.price ? item.price.toLocaleString() : '---'}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Button size="small" variant="text" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                編集
                            </Button>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};