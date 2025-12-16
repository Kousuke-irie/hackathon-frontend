import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import {
    AppBar, Toolbar, Button, Box, Typography,
    InputBase, IconButton, Badge, Container, useTheme, useMediaQuery // ★ useMediaQuery を復元
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import type { User } from "../types/user";

interface NavbarProps {
    currentUser: User | null;
    onLogin: () => void;
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

export const Navbar = ({ currentUser, onLogin }: NavbarProps) => {
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const navigate = useNavigate();
    const theme = useTheme();

    // ★ isMobile を定義 (画面幅が sm: 600px 未満の場合に true)
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
                            // ★ isMobile を使用してロゴサイズを調整する例
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
                            px: isMobile ? 1 : 2, // ★ モバイル時はパディングを狭くする
                            py: 0.5,
                            mx: isMobile ? 1 : 2
                        }}
                    >
                        <InputBase
                            placeholder={isMobile ? "検索" : "キーワードから探す"} // ★ モバイル時はプレースホルダを短くする
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

                                <IconButton
                                    color="inherit"
                                    component={RouterLink}
                                    to="/profile"
                                    sx={{ display: 'inline-flex', flexDirection: 'column' }}
                                >
                                    {currentUser.icon_url ? (
                                        <img src={currentUser.icon_url} alt="" style={{width: 24, height: 24, borderRadius: '50%'}} />
                                    ) : (
                                        <AccountCircleIcon />
                                    )}
                                    <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>マイページ</Typography>
                                </IconButton>

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
                            <>
                                <Button
                                    onClick={onLogin}
                                    variant="contained"
                                    color="secondary"
                                    size={isMobile ? "small" : "medium"} // ★ モバイル時はボタンを小さくする
                                    sx={{ fontWeight: 'bold', borderRadius: '4px', whiteSpace: 'nowrap' }}
                                >
                                    会員登録
                                </Button>
                                {!isMobile && ( // ★ モバイル時は「ログイン」を隠して「会員登録」のみにする例
                                    <Button
                                        onClick={onLogin}
                                        variant="outlined"
                                        color="inherit"
                                        sx={{ fontWeight: 'bold', borderRadius: '4px', borderColor: '#ccc', ml: 1 }}
                                    >
                                        ログイン
                                    </Button>
                                )}
                            </>
                        )}
                    </Box>
                </Toolbar>
            </Container>

            <Box sx={{ borderTop: '1px solid #eee' }}>
                <Container maxWidth="lg">
                    <Box sx={{
                        display: 'flex',
                        gap: isMobile ? 2 : 3, // ★ 間隔を調整
                        overflowX: 'auto',
                        py: 1.5,
                        '&::-webkit-scrollbar': { display: 'none' } // スクロールバー非表示
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
                                    fontSize: isMobile ? '0.8rem' : '0.9rem', // ★ 文字サイズを微調整
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