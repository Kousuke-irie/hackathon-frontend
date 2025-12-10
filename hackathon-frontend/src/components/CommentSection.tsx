import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";

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
        <div style={{ marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
            <h3>コメント ({comments.length})</h3>

            {/* コメントリスト */}
            <div style={{ marginBottom: "20px" }}>
                {comments.map((comment) => (
                    <div key={comment.id} style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                        <img
                            src={comment.user.icon_url}
                            alt={comment.user.username}
                            style={{ width: "35px", height: "35px", borderRadius: "50%" }}
                        />
                        <div style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "10px", flex: 1 }}>
                            <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: "4px" }}>
                                {comment.user.username} • {new Date(comment.created_at).toLocaleDateString()}
                            </div>
                            <div style={{ whiteSpace: "pre-wrap" }}>{comment.content}</div>
                        </div>
                    </div>
                ))}
                {comments.length === 0 && <p style={{ color: "#999" }}>まだコメントはありません。</p>}
            </div>

            {/* コメント入力フォーム */}
            <form onSubmit={handlePostComment} style={{ display: "flex", gap: "10px" }}>
                <input
                    type="text"
                    placeholder="商品への質問やコメント..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{ flex: 1, padding: "10px", borderRadius: "20px", border: "1px solid #ccc" }}
                    required
                />
                <button
                    type="submit"
                    style={{ padding: "10px 20px", backgroundColor: "#00bcd4", color: "white", border: "none", borderRadius: "20px", cursor: "pointer" }}
                >
                    送信
                </button>
            </form>
        </div>
    );
};