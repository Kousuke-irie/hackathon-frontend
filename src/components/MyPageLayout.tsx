import { Box, List, ListItem, ListItemText, ListItemButton, Typography } from '@mui/material';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

export const MyPageLayout = () => {
    const location = useLocation();

    const menuItems = [
        { label: 'マイページトップ', path: '/mypage' },
        { label: 'いいね！一覧', path: '/mylikes' },
        { label: '出品した商品', path: '/mypage/listings' },
        { label: '購入した商品', path: '/mypage/purchases' },
        { label: '下書き一覧', path: '/mypage/drafts' },
    ];

    const settingItems = [
        { label: 'プロフィール設定', path: '/profile' },
        { label: '発送元・お届け先住所', path: '#' },
        { label: '支払い方法', path: '#' },
    ];

    const NavItem = ({ label, path }: { label: string, path: string }) => (
        <ListItem disablePadding>
            <ListItemButton
                component={RouterLink}
                to={path}
                selected={location.pathname === path}
                sx={{ borderBottom: '1px solid #f5f5f5', py: 1.5 }}
            >
                <ListItemText primary={label} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: location.pathname === path ? 700 : 500 }} />
                <ArrowForwardIosIcon sx={{ fontSize: '0.7rem', color: '#ccc' }} />
            </ListItemButton>
        </ListItem>
    );

    return (
        <Box sx={{ display: 'flex', gap: 4, mt: 4 }}>
            {/* サイドバー（PCのみ表示） */}
            <Box sx={{ width: 280, display: { xs: 'none', md: 'block' }, flexShrink: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, ml: 2 }}>マイページ</Typography>
                <List sx={{ bgcolor: 'background.paper', mb: 4 }}>
                    {menuItems.map((item) => <NavItem key={item.label} {...item} />)}
                </List>

                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, ml: 2 }}>設定</Typography>
                <List sx={{ bgcolor: 'background.paper' }}>
                    {settingItems.map((item) => <NavItem key={item.label} {...item} />)}
                </List>
            </Box>

            {/* メインコンテンツ */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Outlet />
            </Box>
        </Box>
    );
};