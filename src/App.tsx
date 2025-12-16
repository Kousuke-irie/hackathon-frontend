import { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useParams, useNavigate, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "./firebase";
import * as api from "./services/api";
// MUI
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// --- コンポーネントインポート ---
import { SellItem } from "./components/SellItem";
import { SwipeDeck } from "./components/SwipeDeck";
import { ItemList } from "./components/ItemList";
import { ItemDetail } from "./components/ItemDetail";
import { CommunityList } from './components/CommunityList';
import { CommunityBoard } from './components/CommunityBoard';
import { MyItems } from './components/MyItems';
import { Navbar } from './components/Navbar';
import { UserProfile } from './components/UserProfile';
import { LikedItems } from './components/LikedItems';
import { DraftsList } from './components/DraftList';
import { PurchaseHistory} from "./components/PurchaseHistory";
import { InProgressPurchases} from "./components/InProgressPurchases";
import { NotFound} from "./components/NotFound";
import {MyPageLayout} from "./components/MyPageLayout.tsx";
import {NotificationsPage} from "./components/NotificationsPage.tsx";

import type { User } from './types/user';

// ★ モダン・モノトーンテーマの定義
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1a1a1a', // ほぼ黒
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#e91e63', // アクセントカラー（いいね等）は維持、または落ち着いたグレーにするなら #757575
        },
        background: {
            default: '#ffffff',
            paper: '#ffffff',
        },
        text: {
            primary: '#1a1a1a',
            secondary: '#666666',
        },
    },
    typography: {
        fontFamily: [
            '"Helvetica Neue"',
            'Arial',
            '"Hiragino Kaku Gothic ProN"',
            '"Hiragino Sans"',
            'Meiryo',
            'sans-serif',
        ].join(','),
        button: {
            textTransform: 'none', // ボタンの英字大文字変換を無効化
            fontWeight: 600,
        },
        h6: {
            fontWeight: 700,
            fontSize: '1rem',
        },
        h5: {
            fontWeight: 700,
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px', // 少し丸みを持たせる
                    padding: '10px 20px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#ffffff',
                    color: '#1a1a1a',
                    boxShadow: 'none',
                    borderBottom: '1px solid #eeeeee',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: 'none', // カードの影を消してフラットに
                    borderRadius: '0px',
                }
            }
        },
        MuiInputBase: {
            styleOverrides: {
                root: {
                    backgroundColor: '#f5f5f5', // 入力欄を薄いグレーに
                    borderRadius: '8px',
                }
            }
        }
    },
});

const ItemDetailWrapper = ({ user }: { user: User | null }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    return <ItemDetail itemId={Number(id)} currentUser={user} onBack={() => navigate(-1)} />;
};

const CommunityWrapper = ({ user }: { user: User | null }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    if (!user) return <Navigate to="/"/>
    return <CommunityBoard communityId={Number(id)} currentUser={user} onBack={() => navigate("/communities")} onItemClick={(itemId) => navigate(`/items/${itemId}`)} />;
};

const SellItemWrapper = ({ user }: { user: User }) => {
    const { id } = useParams();
    const itemId = id ? Number(id) : undefined;
    return <SellItem user={user} editingItemId={itemId} />;
};

function AppContent() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();
            const response = await api.loginUser(idToken);
            setUser(response.user);
        } catch (e) {
            console.error("Login failed:", e);
            alert("ログインに失敗しました");
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            alert("ログアウトしました");
        } catch (e) {
            console.error("Logout failed:", e);
            alert("ログアウトに失敗しました");
        }
    };

    const handleUserUpdate = (updatedUser: User) => {
        setUser(updatedUser);
    };

    const handleEditDraft = (id: number) => {
        navigate(`/sell/edit/${id}`);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const idToken = await firebaseUser.getIdToken();
                    const response = await api.loginUser(idToken);
                    setUser(response.user);
                } catch (e) {
                    console.error("Backend sync failed:", e);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <div style={{textAlign: "center", marginTop: "100px"}}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Wish</div>
                </div>
            </ThemeProvider>
        );
    }

    return (
        <>
                {/* Navbar にログアウト関数を渡すように修正 */}
                <Navbar currentUser={user} onLogin={handleLogin} onLogout={handleLogout} />

                <div style={{
                    padding: "20px",
                    maxWidth: "1024px",
                    margin: "0 auto",
                    marginTop: "120px",
                    minHeight: 'calc(100vh - 120px)'
                }}>
                    <Routes>
                        {/* 画面遷移に window.location.href を使用 */}
                        <Route path="/" element={<ItemList user={user} onItemClick={(id) => navigate(`/items/${id}`)} />}/>
                        <Route path="/items/:id" element={<ItemDetailWrapper user={user}/>}/>

                        {user ? (
                            <>
                                <Route path="/mypage" element={<MyPageLayout />}>
                                    <Route index element={<InProgressPurchases user={user} onItemClick={(id) => navigate(`/items/${id}`)} />} />
                                    <Route path="listings" element={<MyItems user={user} onItemClick={(id) => navigate(`/items/${id}`)} />} />
                                    <Route path="purchases" element={<PurchaseHistory user={user} onItemClick={(id) => navigate(`/items/${id}`)} />} />
                                    <Route path="drafts" element={<DraftsList user={user} onEditDraft={handleEditDraft} />} />
                                </Route>

                                <Route path="/profile" element={<UserProfile user={user} onUserUpdate={handleUserUpdate} onLogout={handleLogout}/>}/>
                                <Route path="/mylikes" element={<LikedItems user={user} onItemClick={(id:number) => navigate(`/items/${id}`)} />}/>
                                <Route path="/sell" element={<SellItemWrapper user={user} />}/>
                                <Route path="/sell/edit/:id" element={<SellItemWrapper user={user} />}/>
                                <Route path="/swipe" element={<SwipeDeck user={user!} />}/>
                                <Route path="/communities" element={<CommunityList onSelectCommunity={(id) => navigate(`/communities/${id}`)} />}/>
                                <Route path="/communities/:id" element={<CommunityWrapper user={user}/>}/>
                                <Route path="/notifications" element={<NotificationsPage user={user} />} />
                            </>
                        ) : (
                            <Route path="*" element={<Navigate to="/" replace />} />
                        )}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </div>
        </>
    );
}

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;