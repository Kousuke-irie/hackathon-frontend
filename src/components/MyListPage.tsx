import { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import { LikedItems } from './LikedItems';
import { RecentItemsDisplay } from './RecentItemsDisplay';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types/user';

export const MyListPage = ({ user }: { user: User }) => {
    const [tabValue, setTabValue] = useState(0);
    const navigate = useNavigate();

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, px: 2 }}>マイリスト</Typography>

            <Tabs
                value={tabValue}
                onChange={(_, v) => setTabValue(v)}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
            >
                <Tab label="いいね！一覧" />
                <Tab label="閲覧履歴" />
                <Tab label="フォロー中" />
            </Tabs>

            <Box sx={{ px: 2 }}>
                {tabValue === 0 && <LikedItems user={user} onItemClick={(id) => navigate(`/items/${id}`)} />}
                {tabValue === 1 && (
                    <Box sx={{ mt: -4 }}> {/* 既存コンポーネントの余白調整 */}
                        <RecentItemsDisplay onItemClick={(id) => navigate(`/items/${id}`)} />
                    </Box>
                )}
                {tabValue === 2 && (
                    <Paper elevation={0} sx={{ p: 5, textAlign: 'center', bgcolor: '#f9f9f9', borderRadius: 4 }}>
                        <Typography color="text.secondary">フォロー中のアカウントはいません（機能準備中）</Typography>
                    </Paper>
                )}
            </Box>
        </Box>
    );
};