import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";

interface Item {
    id: number;
    title: string;
    price: number;
    image_url: string;
    status: string;
}

interface MyItemsProps {
    user: User;
    onItemClick: (id: number) => void;
}

export const MyItems = ({ user, onItemClick }: MyItemsProps) => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyItems = async () => {
            setLoading(true);
            try {
                // X-User-ID ヘッダーを使ってAPIを呼び出す
                const res = await api.fetchMyItems(user.id);
                setItems(res);
            } catch (error) {
                console.error("Failed to fetch my items:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyItems();
    }, [user]);

    if (loading) return <div style={{ textAlign: "center", marginTop: "50px" }}>Loading...</div>;
    if (items.length === 0) {
        return <div style={{ textAlign: "center", marginTop: "50px" }}>出品している商品はありません。</div>;
    }

    return (
        <div style={{ padding: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            {items.map((item) => (
                <div
                    key={item.id}
                    onClick={() => onItemClick(item.id)}
                    style={{
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        overflow: "hidden",
                        cursor: "pointer",
                        opacity: item.status === "SOLD" ? 0.5 : 1
                    }}
                >
                    {item.status === "SOLD" && (
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "red", fontWeight: "bold", fontSize: "1.5rem" }}>SOLD</div>
                    )}
                    <img
                        src={item.image_url}
                        alt={item.title}
                        style={{ width: "100%", height: "150px", objectFit: "cover" }}
                    />
                    <div style={{ padding: "8px" }}>
                        <h4 style={{ margin: "0 0 5px 0", fontSize: "14px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                            {item.title}
                        </h4>
                        <p style={{ margin: 0, fontWeight: "bold", color: "#4CAF50" }}>
                            ¥{item.price.toLocaleString()}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};