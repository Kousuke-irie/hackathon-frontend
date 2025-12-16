import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import {Box, Typography} from "@mui/material"

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
        (async () => {
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
        })();
    }, [user]);

    if (loading) return <div style={{ textAlign: "center", marginTop: "50px" }}>Loading...</div>;
    if (items.length === 0) {
        return <div style={{ textAlign: "center", marginTop: "50px" }}>出品している商品はありません。</div>;
    }

    return (
        <Box sx={{ maxWidth: 1024, mx: 'auto', p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
                出品した商品
            </Typography>

            <Box
                sx={{
                    display: 'grid',
                    gap: '20px 12px',
                    gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                }}
            >
                {items.map((item) => (
                    <Box
                        key={item.id}
                        onClick={() => onItemClick(item.id)}
                        sx={{ cursor: 'pointer', transition: 'opacity 0.2s', '&:hover': { opacity: 0.8 } }}
                    >
                        <Box sx={{ position: 'relative', width: '100%', pt: '100%', borderRadius: '4px', overflow: 'hidden', bgcolor: '#f5f5f5', mb: 1 }}>
                            <img src={item.image_url} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            {item.status === "SOLD" && (
                                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                    SOLD
                                </Box>
                            )}
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }} noWrap>
                            {item.title}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            ¥{item.price.toLocaleString()}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};