import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";

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
        fetchPostsData(communityId, setPosts);
        fetchMyItemsData(currentUser.id, setMyItems);
    }, [communityId, currentUser.id]);

    const handlePost = async () => {
        if (!content) return;
        try {
            const itemIdToPost = selectedItemId === 0 ? null : selectedItemId;
            await api.postCommunityPost(communityId, currentUser.id, content, itemIdToPost)
            setContent("");
            setSelectedItemId(null);
            fetchPostsData(communityId, setPosts);
        } catch (error) {
            alert("投稿失敗");
            console.error(error);
        }
    };

    return (
        <div style={{ padding: "10px", textAlign: "left" }}>
            <button onClick={onBack} style={{ marginBottom: "10px" }}>&lt; 界隈一覧に戻る</button>

            {/* 投稿エリア */}
            <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "8px", marginBottom: "20px" }}>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="メッセージを入力..."
                    style={{ width: "100%", height: "60px", marginBottom: "5px" }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                    {/* ▼ 商品シェアのプルダウンを実装 */}
                    {myItems.length > 0 ? (
                        <select
                            onChange={(e) => {
                                // 選択がない場合は null にする
                                const value = e.target.value;
                                setSelectedItemId(value ? Number(value) : null);
                            }}
                            style={{ padding: "5px", borderRadius: "5px", border: "1px solid #ccc" }}
                        >
                            <option value="">シェアする商品を選ぶ (任意)</option>
                            {myItems.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.title} (¥{item.price.toLocaleString()})
                                </option>
                            ))}
                        </select>
                    ) : (
                        <span style={{ fontSize: "0.8rem", color: "#999" }}>※販売中の商品がありません</span>
                    )}

                    <button
                        onClick={handlePost}
                        style={{ backgroundColor: "#00bcd4", color: "white", border: "none", padding: "5px 15px", borderRadius: "5px", cursor: "pointer" }}
                        disabled={!content}
                    >
                        投稿
                    </button>
                </div>
            </div>

            {/* タイムライン */}
            <div>
                {/* ... (投稿のレンダリング部分: 変更なし) */}
                {posts.map((post) => (
                    <div key={post.id} style={{ marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                            <img src={post.user.icon_url} style={{ width: "30px", height: "30px", borderRadius: "50%" }} />
                            <strong>{post.user.username}</strong>
                        </div>
                        <div>{post.content}</div>

                        {/* シェアされた商品があれば表示 */}
                        {post.related_item && (
                            <div
                                onClick={() => onItemClick(post.related_item!.id)}
                                style={{ marginTop: "5px", padding: "10px", border: "1px solid #ddd", borderRadius: "5px", display: "flex", gap: "10px", cursor: "pointer", backgroundColor: "#f9f9f9" }}
                            >
                                <img src={post.related_item.image_url} style={{ width: "50px", height: "50px", objectFit: "cover" }} />
                                <div>
                                    <div style={{ fontWeight: "bold" }}>{post.related_item.title}</div>
                                    <div style={{ color: "#e91e63" }}>¥{post.related_item.price.toLocaleString()}</div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};