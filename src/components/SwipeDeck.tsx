import { useState, useEffect } from "react";
import TinderCard from "react-tinder-card";
import * as api from "../services/api";
import type { User } from "../types/user";
import {Box,Typography} from "@mui/material";

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
        (async () => {
            if (!user) return;
            try {
                const res = await api.fetchSwipeItems(user.id);
                setItems(res);
            } catch (error) {
                console.error("Failed to fetch swipe items:", error);
            }
        })();
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
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Discover</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                気になる商品を左右にスワイプ
            </Typography>

            <Box className="cardContainer" sx={{ position: "relative", width: "320px", height: "480px" }}>
                {items.map((item) => (
                    <TinderCard
                        className="swipe"
                        key={item.id}
                        onSwipe={(dir) => swiped(dir, item)}
                        onCardLeftScreen={() => outOfFrame(item.title)}
                        preventSwipe={["up", "down"]}
                    >
                        <Box
                            sx={{
                                position: "absolute",
                                bgcolor: "#fff",
                                width: "320px",
                                height: "480px",
                                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                                borderRadius: "16px",
                                overflow: "hidden",
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <Box sx={{ flex: 1, position: 'relative' }}>
                                <img
                                    src={item.image_url}
                                    alt={item.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <Box sx={{
                                    position: 'absolute',
                                    bottom: 0, left: 0, right: 0,
                                    p: 3,
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                                    color: '#fff'
                                }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{item.title}</Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        ¥{item.price.toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </TinderCard>
                ))}
            </Box>

            <Box sx={{ mt: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#ff4d4f', fontWeight: 'bold' }}>← NOPE</Typography>
                <Typography variant="caption" sx={{ color: '#52c41a', fontWeight: 'bold' }}>LIKE →</Typography>
            </Box>

            {lastDirection && (
                <Typography
                    variant="body2"
                    sx={{
                        mt: 2,
                        fontWeight: 'bold',
                        color: lastDirection === "right" ? "#52c41a" : "#ff4d4f"
                    }}
                >
                    {lastDirection === "right" ? "LIKEしました！" : "スキップしました"}
                </Typography>
            )}
        </Box>
    );
};