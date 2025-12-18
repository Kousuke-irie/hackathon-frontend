import { useState, useEffect } from "react";
import * as api from "../services/api";
import type { User } from "../types/user";
import { Box, Tabs, Tab, Grid, Card, CardMedia, CardContent, Typography } from '@mui/material';
import { useNavigate } from "react-router-dom";

export const MyItems = ({ user }: { user: User }) => {
    const [items, setItems] = useState<api.Item[]>([]);
    const [tabValue, setTabValue] = useState(0); // 0: 出品中, 1: 取引中, 2: 売却済み
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            const res = await api.fetchMyItems(user.id);
            setItems(res);
        })();
    }, [user.id]);

    const filteredItems = items.filter(item => {
        if (tabValue === 0) return item.status === 'ON_SALE';
        if (tabValue === 1) return item.status === 'SOLD'; // 本来はTransactionの状態を見るべきですが簡易的に
        return item.status === 'SOLD';
    });

    return (
        <Box sx={{ width: '100%' }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} centered sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tab label="出品中" />
                <Tab label="取引中" />
                <Tab label="売却済み" />
            </Tabs>

            <Grid container spacing={2}>
                {filteredItems.map((item) => (
                    <Grid item xs={6} sm={4} key={item.id}>
                        <Card onClick={() => {
                            // 出品中なら詳細、それ以外なら取引画面へ（txIdの取得ロジックが必要）
                            if (tabValue === 0) navigate(`/items/${item.id}`);
                            else alert("取引画面へ遷移します");
                        }} sx={{ cursor: 'pointer' }}>
                            <CardMedia component="img" height="140" image={item.image_url} />
                            <CardContent>
                                <Typography variant="subtitle2" noWrap>{item.title}</Typography>
                                <Typography variant="body2" color="primary">¥{item.price.toLocaleString()}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};