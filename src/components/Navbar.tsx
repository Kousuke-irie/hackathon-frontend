import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import {
    AppBar, Toolbar, Button, Box, Typography,
    InputBase, IconButton, Badge, Container, useTheme, useMediaQuery,
    Menu, MenuItem, Divider, Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import type { User } from "../types/user";

interface NavbarProps {
    currentUser: User | null;
    onLogin: () => void;
    onLogout: () => void; // 引数なしの関数として定義
}

const CATEGORY_LINKS = [
    { name: 'おすすめ', path: '/' },
    { name: 'マイリスト', path: '/mylikes' },
    { name: 'レディース', path: '/?cat=1' },
    { name: 'メンズ', path: '/?cat=2' },
    { name: 'インテリア', path: '/?cat=3' },
    { name: '本・音楽・ゲーム', path: '/?cat=4' },
    { name: 'おもちゃ・ホビー', path: '/?cat=5' },
];

export const Navbar = ({ currentUser, onLogin, onLogout }: NavbarProps) => {
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // --- ドロップダウンメニュー制御用の状態 ---
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(`/?q=${encodeURIComponent(searchTerm)}`);
    };

    return (
        <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #eee', bgcolor: '#fff' }}>
            <Container maxWidth="lg">
                <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: 64, gap: 2 }}>

                    <Typography
                        variant="h5"
                        component={RouterLink}
                        to="/"
                        sx={{
                            textDecoration: 'none',
                            color: '#e91e63',
                            fontWeight: 800,
                            letterSpacing: '-0.5px',
                            minWidth: 'fit-content',
                            fontSize: isMobile ? '1.2rem' : '1.5rem'
                        }}
                    >
                        Wish
                    </Typography>

                    <Box
                        component="form"
                        onSubmit={handleSearchSubmit}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            flexGrow: 1,
                            maxWidth: 600,
                            bgcolor: '#f5f5f5',
                            borderRadius: '4px',
                            px: isMobile ? 1 : 2,
                            py: 0.5,
                            mx: isMobile ? 1 : 2
                        }}
                    >
                        <InputBase
                            placeholder={isMobile ? "検索" : "キーワードから探す"}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{ ml: 1, flex: 1, fontSize: '0.95rem' }}
                        />
                        <IconButton type="submit" size="small">
                            <SearchIcon />
                        </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
                        {currentUser ? (
                            <>
                                <IconButton color="inherit" sx={{ display: { xs: 'none', md: 'inline-flex' }, flexDirection: 'column' }}>
                                    <Badge badgeContent={4} color="error">
                                        <NotificationsNoneIcon />
                                    </Badge>
                                    <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>お知らせ</Typography>
                                </IconButton>

                                <IconButton
                                    color="inherit"
                                    component={RouterLink}
                                    to="/mylikes"
                                    sx={{ display: { xs: 'none', md: 'inline-flex' }, flexDirection: 'column' }}
                                >
                                    <FavoriteBorderIcon />
                                    <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>いいね</Typography>
                                </IconButton>

                                {/* プロフィールアイコン（クリックでメニュー開閉） */}
                                <IconButton
                                    color="inherit"
                                    onClick={handleMenuOpen}
                                    sx={{ display: 'inline-flex', flexDirection: 'column' }}
                                >
                                    {currentUser.icon_url ? (
                                        <Avatar src={currentUser.icon_url} sx={{ width: 24, height: 24 }} />
                                    ) : (
                                        <AccountCircleIcon sx={{ width: 24, height: 24 }} />
                                    )}
                                    <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>マイページ</Typography>
                                </IconButton>

                                {/* ドロップダウンメニューの実装 */}
                                <Menu
                                    anchorEl={anchorEl}
                                    open={open}
                                    onClose={handleMenuClose}
                                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                    slotProps={{ paper: { sx: { width: 220, mt: 1.5, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } } }}
                                >
                                    <MenuItem component={RouterLink} to="/mypage" onClick={handleMenuClose}>マイページ</MenuItem>
                                    <MenuItem component={RouterLink} to="/profile" onClick={handleMenuClose}>プロフィール設定</MenuItem>
                                    <Divider />
                                    <MenuItem component={RouterLink} to="/mypage/listings" onClick={handleMenuClose}>出品した商品</MenuItem>
                                    <MenuItem component={RouterLink} to="/mypage/purchases" onClick={handleMenuClose}>購入した商品</MenuItem>
                                    <MenuItem component={RouterLink} to="/mypage/drafts" onClick={handleMenuClose}>下書き一覧</MenuItem>
                                    <Divider />
                                    <MenuItem onClick={() => { handleMenuClose(); onLogout(); }} sx={{ color: 'error.main' }}>
                                        ログアウト
                                    </MenuItem>
                                </Menu>

                                <Button
                                    variant="contained"
                                    color="secondary"
                                    startIcon={<CameraAltIcon />}
                                    component={RouterLink}
                                    to="/sell"
                                    sx={{
                                        fontWeight: 'bold',
                                        borderRadius: '4px',
                                        px: 3,
                                        display: { xs: 'none', md: 'flex' }
                                    }}
                                >
                                    出品
                                </Button>
                            </>
                        ) : (
                            <Button onClick={onLogin} variant="contained" color="secondary" sx={{ fontWeight: 'bold' }}>ログイン</Button>
                        )}
                    </Box>
                </Toolbar>
            </Container>

            {/* カテゴリリンクバー */}
            <Box sx={{ borderTop: '1px solid #eee' }}>
                <Container maxWidth="lg">
                    <Box sx={{
                        display: 'flex',
                        gap: isMobile ? 2 : 3,
                        overflowX: 'auto',
                        py: 1.5,
                        '&::-webkit-scrollbar': { display: 'none' }
                    }}>
                        {CATEGORY_LINKS.map((cat) => (
                            <Typography
                                key={cat.name}
                                component={RouterLink}
                                to={cat.path}
                                variant="body2"
                                sx={{
                                    textDecoration: 'none',
                                    color: '#333',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                                    '&:hover': { color: '#e91e63' }
                                }}
                            >
                                {cat.name}
                            </Typography>
                        ))}
                    </Box>
                </Container>
            </Box>
        </AppBar>
    );
};