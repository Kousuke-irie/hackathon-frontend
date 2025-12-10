import { useState, useEffect } from "react";
import TinderCard from "react-tinder-card";
import * as api from "../services/api";
import type { User } from "../types/user";

interface Item {
    id: number;
    title: string;
    price: number;
    image_url: string;
    description: string;
}

interface SwipeDeckProps {
    user: User;
}

export const SwipeDeck = ({ user }: SwipeDeckProps) => {
    const [items, setItems] = useState<Item[]>([]);
    const [lastDirection, setLastDirection] = useState<string | undefined>();

    // 1. 未スワイプの商品を取得
    useEffect(() => {
        const fetchItems = async () => {
            if (!user) return;
            try {
                const res = await api.fetchSwipeItems(user.id);
                setItems(res);
            } catch (error) {
                console.error("Failed to fetch swipe items:", error);
            }
        };
        fetchItems();
    }, [user]);

    // 2. スワイプした時の処理
    const swiped = async (direction: string, item: Item) => {
        console.log("removing: " + item.title);
        setLastDirection(direction);

        // Backendに保存
        // right = LIKE, left = NOPE
        const reaction = direction === "right" ? "LIKE" : "NOPE";

        try {
            await api.recordSwipeAction(user.id, item.id, reaction as 'LIKE' | 'NOPE');
            console.log(`Recorded ${reaction} for ${item.title}`);
        } catch (error) {
            console.error("Failed to record swipe:", error);
        }
    };

    const outOfFrame = (name: string) => {
        console.log(name + " left the screen!");
    };

    if (items.length === 0) {
        return (
            <div style={{ textAlign: "center", marginTop: "50px" }}>
                <h3>表示できる商品がありません</h3>
                <p>すべての商品をチェックしました！</p>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h2>Discover Items</h2>
            <div className="cardContainer" style={{ position: "relative", width: "300px", height: "400px" }}>
                {items.map((item) => (
                    <TinderCard
                        className="swipe"
                        key={item.id}
                        onSwipe={(dir) => swiped(dir, item)}
                        onCardLeftScreen={() => outOfFrame(item.title)}
                        preventSwipe={["up", "down"]} // 上下スワイプは無効化
                    >
                        <div
                            style={{
                                position: "absolute",
                                backgroundColor: "#fff",
                                width: "300px",
                                height: "400px",
                                maxWidth: "85vw",
                                maxHeight: "50vh",
                                boxShadow: "0px 0px 60px 0px rgba(0,0,0,0.30)",
                                borderRadius: "20px",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                backgroundImage: `url(${item.image_url})`,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: "0",
                                    width: "100%",
                                    color: "#fff",
                                    padding: "20px",
                                    background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                                    borderRadius: "0 0 20px 20px",
                                    boxSizing: "border-box"
                                }}
                            >
                                <h3 style={{ margin: 0 }}>{item.title}</h3>
                                <h4 style={{ margin: "5px 0" }}>¥{item.price.toLocaleString()}</h4>
                            </div>
                        </div>
                    </TinderCard>
                ))}
            </div>

            {lastDirection && (
                <h3 style={{ marginTop: "20px", color: lastDirection === "right" ? "green" : "red" }}>
                    You swiped {lastDirection}
                </h3>
            )}

            <p style={{ marginTop: "10px", color: "#666" }}>
                ← Nope / Like →
            </p>
        </div>
    );
};