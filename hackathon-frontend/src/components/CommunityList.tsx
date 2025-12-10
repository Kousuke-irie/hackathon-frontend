import { useState, useEffect } from "react";
import * as api from "../services/api";

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

    useEffect(() => {
        fetchCommunitiesData(setCommunities);
    }, []);

    const handleCreate = async () => {
        if (!newCommName) return;
        const description = "誰でも歓迎！";
        const image_url = "https://placehold.jp/150x150.png"; // ダミー画像
        try {
            await api.createCommunity({ name: newCommName , description, image_url})
            setNewCommName("");
            fetchCommunitiesData(setCommunities);
        } catch (error) {
            alert("作成失敗");
            console.log(error);
        }
    };

    return (
        <div style={{ padding: "10px" }}>
            {/* 作成フォーム */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
                <input
                    value={newCommName}
                    onChange={(e) => setNewCommName(e.target.value)}
                    placeholder="新しい界隈を作る"
                    style={{ padding: "8px", flex: 1 }}
                />
                <button onClick={handleCreate} style={{ padding: "8px 16px" }}>作成</button>
            </div>

            {/* 一覧 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                {communities.map((c) => (
                    <div
                        key={c.id}
                        onClick={() => onSelectCommunity(c.id)}
                        style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "10px", cursor: "pointer", textAlign: "center" }}
                    >
                        <img src={c.image_url} alt="" style={{ width: "50px", height: "50px", borderRadius: "50%", marginBottom: "5px" }} />
                        <div style={{ fontWeight: "bold" }}>{c.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "#666" }}>{c.description}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};