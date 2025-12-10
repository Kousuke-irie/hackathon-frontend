import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import { Grid, Typography, Box, Card, CardMedia, CardContent, Button } from '@mui/material';

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
        <Box sx={{ mt: 3 }}>
            <Typography variant="h5" gutterBottom>下書き ({items.length})</Typography>
            <Grid container spacing={2}>
                {items.map((item) => (
                    <Box
                        key={item.id}
                        onClick={() => onEditDraft(item.id)}
                        sx={{
                            cursor: 'pointer',
                            height: '100%',
                            border: "1px solid #eee",
                            borderRadius: "8px",
                            overflow: "hidden",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                        }}
                    >
                        <Card sx={{ display: 'flex', height: '100%' }}>
                            <CardMedia
                                component="img"
                                sx={{ width: 100 }}
                                image={item.image_url || 'https://placehold.jp/100x100.png'}
                                alt={item.title}
                            />
                            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                <CardContent sx={{ flex: '1 0 auto', p: 1 }}>
                                    <Typography component="div" variant="h6" noWrap>
                                        {item.title || "タイトル未設定"}
                                    </Typography>
                                    <Typography variant="subtitle1" color="text.secondary" component="div">
                                        ¥{item.price.toLocaleString() || '---'}
                                    </Typography>
                                </CardContent>
                                <Box sx={{ display: 'flex', p: 1, justifyContent: 'flex-end' }}>
                                    <Button size="small" onClick={() => onEditDraft(item.id)} color="primary">
                                        編集再開
                                    </Button>
                                </Box>
                            </Box>
                        </Card>
                    </Box>
                ))}
            </Grid>
        </Box>
    );
};