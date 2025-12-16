import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import {Box, Typography, Button, Avatar, InputBase} from "@mui/material";

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
            const newCommentResponse = await api.postComment(
                itemId,
                currentUser.id,
                newComment);
            // 新しいコメントをリストに追加
            setComments([...comments, newCommentResponse]);
            setNewComment("");
        } catch (error) {
            console.error("Failed to post comment:", error);
            alert("コメントの送信に失敗しました");
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
            <Box component="form" onSubmit={handlePostComment} sx={{ display: 'flex', gap: 1 }}>
                <InputBase
                    placeholder="質問する"
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
                    sx={{ borderRadius: '4px', px: 3 }}
                >
                    送信
                </Button>
            </Box>
        </Box>
    );
};