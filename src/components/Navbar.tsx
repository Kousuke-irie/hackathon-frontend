import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useState} from "react";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AccountCircle from '@mui/icons-material/AccountCircle'; // アイコン
import IconButton from '@mui/material/IconButton';
import type { User } from "../types/user";
import InputBase from '@mui/material/InputBase';
import SearchIcon from '@mui/icons-material/Search';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

interface NavbarProps {
    currentUser: User | null;
    onLogin: () => void;
}

interface NavItem { // ★ 新しい型を定義
    name: string;
    path?: string;
    private?: boolean;
    subItems?: NavItem[];
}

export const Navbar = ({ currentUser, onLogin }: NavbarProps) => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const navigate = useNavigate();

    // ★ ドロップダウンメニューの状態管理を追加
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // キーワードをURLにセットし、トップページに遷移（トップページで検索結果が表示される）
        navigate(`/?q=${encodeURIComponent(searchTerm)}`);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, menuName: string) => {
        setAnchorEl(event.currentTarget);
        setOpenMenu(menuName);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setOpenMenu(null);
    };

    const navItems: NavItem[] = [
        { name: '商品一覧', path: '/' },
        { name: 'Swipe', path: '/swipe', private: true },
        { name: '界隈', path: '/communities', private: true },
        {
            name: '出品',
            subItems: [
                { name: '出品', path: '/sell', private: true },
                { name: 'マイ出品', path: '/myitems', private: true }, // 仮のルート
                { name: '下書き', path: '/drafts', private: true },
            ]
        },
        {
            name: '購入履歴',
            subItems: [
                { name: '取引中', path: '/purchase-in-progress', private: true }, // ★ 新しいルート
                { name: '購入履歴', path: '/purchases', private: true },
                { name: 'いいね', path: '/mylikes', private: true }, // 仮のルート
            ]
        },
    ];

    return (
        // position="fixed" で上部に固定
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Typography variant="h6" component="div">
                    フリマアプリ Wish
                </Typography>

                <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', alignItems: 'center', mx: 2, flexGrow: 1, maxWidth: 400 }}>
                    <InputBase
                        placeholder="商品名、カテゴリ、タグで検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ ml: 1, flex: 1, color: 'inherit', borderBottom: '1px solid white' }}
                    />
                    <IconButton type="submit" color="inherit">
                        <SearchIcon />
                    </IconButton>
                </Box>

                {/* 中央のナビゲーションボタン群のレンダリングロジックを更新 */}
                <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
                    {navItems.map((item) => {
                        const showItem = !item.private || currentUser; // ログインチェック

                        if (!showItem) return null;

                        if (item.subItems) {
                            // ドロップダウンメニューを持つアイテムのレンダリング
                            return (
                                <div key={item.name}>
                                    <Button
                                        aria-controls={openMenu === item.name ? 'simple-menu' : undefined}
                                        aria-haspopup="true"
                                        onClick={(e) => handleMenuOpen(e, item.name)}
                                        sx={{ color: 'white' }}
                                    >
                                        {item.name}
                                    </Button>
                                    <Menu
                                        anchorEl={anchorEl}
                                        keepMounted
                                        open={openMenu === item.name}
                                        onClose={handleMenuClose}
                                        onClick={handleMenuClose} // メニュー内でクリックした際も閉じる
                                    >
                                        {item.subItems.map((subItem) => {
                                            const showSubItem = !subItem.private || currentUser;
                                            if (!showSubItem) return null;

                                            return (
                                                <MenuItem
                                                    key={subItem.name}
                                                    component={RouterLink}
                                                    to={subItem.path!}
                                                    // メニューアイテムがアクティブな場合は色を変える
                                                    selected={isActive(subItem.path || '')}
                                                >
                                                    {subItem.name}
                                                </MenuItem>
                                            );
                                        })}
                                    </Menu>
                                </div>
                            );
                        }

                        // パスを持つ通常のアイテムのレンダリング
                        return (
                            <Button
                                key={item.name}
                                component={RouterLink}
                                to={item.path!}
                                sx={{ color: isActive(item.path || '') ? 'yellow' : 'white' }}
                            >
                                {item.name}
                            </Button>
                        );
                    })}
                </Box>

                {/* 右上のユーザー情報 / ログインボタン */}
                <Box>
                    {currentUser ? (
                        <>
                            <IconButton
                                color="inherit"
                                component={RouterLink}
                                to="/profile" // マイページへのリンク (フェーズ2で実装)
                            >
                                <AccountCircle />
                            </IconButton>
                            <Typography variant="body2" sx={{display: 'inline-block', mr: 1}}>
                                {currentUser.username}
                            </Typography>
                        </>
                    ) : (
                        <Button color="inherit" onClick={onLogin} variant="outlined">
                            ログイン
                        </Button>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};