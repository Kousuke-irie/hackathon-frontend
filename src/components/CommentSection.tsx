import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import {Box, Typography, Button, Avatar, InputBase,Dialog, DialogTitle,DialogContent,TextField,CircularProgress} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

interface Comment {
    id: number;
    content: string;
    created_at: string;
    user: {
        id: number;
        username: string;
        icon_url: string;
    };
}

interface CommentSectionProps {
    itemId: number;
    currentUser: User;
}

export const CommentSection = ({ itemId, currentUser }: CommentSectionProps) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");

    // AI機能用ステート
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiIntent, setAiIntent] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // コメント一覧の取得
    useEffect(() => {
        (async () => {
            try {
                const res = await api.fetchComments(itemId);
                setComments(res);
            } catch (error) {
                console.error("Failed to fetch comments:", error);
            }
        })();
    }, [itemId]);

    // コメント送信
    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await api.postComment(itemId, currentUser.id, newComment);
            setComments([...comments, res]);
            setNewComment("");
        } catch (error) {
            console.error("Failed to post comment:", error);
            alert("コメントの送信に失敗しました");
        }
    };

    const handleGenerateAI = async () => {
        if (!aiIntent.trim()) return;
        setIsGenerating(true);
        try {
            const generated = await api.generateAIMessage(aiIntent);
            setNewComment(generated); // 生成された文章を入力欄にセット
            setAiModalOpen(false);
            setAiIntent("");
        } catch (error) {
            alert("メッセージの生成に失敗しました");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Box sx={{ mt: 5, pt: 4, borderTop: '1px solid #eee' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                コメント ({comments.length})
            </Typography>

            <Box sx={{ mb: 4 }}>
                {comments.map((comment) => (
                    <Box key={comment.id} sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <Avatar src={comment.user.icon_url} sx={{ width: 32, height: 32 }} />
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {comment.user.username}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: '#333', lineHeight: 1.6 }}>
                                {comment.content}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Box>

            {/* 入力フォームをメルカリのようにシンプルに */}
            <Box component="form" onSubmit={handlePostComment} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <InputBase
                        placeholder="質問する"
                        multiline
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        sx={{
                            flex: 1,
                            bgcolor: '#f5f5f5',
                            borderRadius: '4px',
                            px: 2,
                            py: 1,
                            fontSize: '0.9rem'
                        }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={!newComment.trim()}
                        sx={{ borderRadius: '4px', px: 3, height: 'fit-content' }}
                    >
                        送信
                    </Button>
                </Box>

                {/* AI作成ボタン */}
                <Button
                    startIcon={<AutoAwesomeIcon />}
                    size="small"
                    onClick={() => setAiModalOpen(true)}
                    sx={{ alignSelf: 'flex-start', color: '#e91e63', fontWeight: 'bold' }}
                >
                    AIでメッセージを作成
                </Button>
            </Box>

            {/* AI入力ダイアログ */}
            <Dialog open={aiModalOpen} onClose={() => setAiModalOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem' }}>どんなメッセージを作りますか？</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        placeholder="例：1000円に値下げしてほしい、発送はいつになるか聞きたい"
                        variant="outlined"
                        size="small"
                        value={aiIntent}
                        onChange={(e) => setAiIntent(e.target.value)}
                        sx={{ mt: 1, mb: 2 }}
                    />
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleGenerateAI}
                        disabled={isGenerating || !aiIntent.trim()}
                        sx={{ bgcolor: '#1a1a1a' }}
                    >
                        {isGenerating ? <CircularProgress size={20} color="inherit" /> : "文章を作成する"}
                    </Button>
                </DialogContent>
            </Dialog>
        </Box>
    );
};