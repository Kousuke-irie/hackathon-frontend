import { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useParams, useNavigate, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth} from "./firebase";
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
import {TransactionScreen} from "./components/TransactionScreen.tsx";
import {MyListPage} from "./components/MyListPage.tsx";
import {CategoryGallery} from "./components/CategoryGallery.tsx";
import {PublicProfile} from "./components/PublicProfile.tsx";
import {LoginModal} from "./components/LoginModal.tsx";
import {ChatList} from "./components/ChatList.tsx";
import {ChatScreen} from "./components/ChatScreen.tsx";
import {AIChatBot} from "./components/AIChatBot.tsx";

import type { User } from './types/user';
import {FollowListPage} from "./components/FollowListPage.tsx";

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
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const navigate = useNavigate();

    // 💡 ログイン成功時の処理を共通化
    const handleLoginSuccess = async (idToken: string) => {
        try {
            const response = await api.loginUser(idToken);
            setUser(response.user);
            setLoginModalOpen(false);
            alert("ログインしました");
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
            <Navbar currentUser={user} onLogin={() => setLoginModalOpen(true)} onLogout={handleLogout} />

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
                        <Route path="/categories" element={<CategoryGallery />} />

                        {user ? (
                            <>
                                <Route path="/mypage" element={<MyPageLayout />}>
                                    <Route index element={<InProgressPurchases user={user} onItemClick={(txId) => navigate(`/transactions/${txId}`)} />} />
                                    <Route path="listings" element={<MyItems user={user} />} />
                                    <Route path="purchases" element={<PurchaseHistory user={user} onItemClick={(txId: number) => navigate(`/transactions/${txId}`)} />} />
                                    <Route path="drafts" element={<DraftsList user={user} onEditDraft={handleEditDraft} />} />
                                    <Route path="likes" element={<LikedItems user={user} onItemClick={(id:number) => navigate(`/items/${id}`)} />}/>
                                    <Route path="profile" element={<UserProfile user={user} onUpdate={handleUserUpdate} />}/>
                                </Route>

                                <Route path="/sell" element={<SellItemWrapper user={user} />}/>
                                <Route path="/sell/edit/:id" element={<SellItemWrapper user={user} />}/>
                                <Route path="/swipe" element={<SwipeDeck user={user!} />}/>
                                <Route path="/communities" element={<CommunityList onSelectCommunity={(id) => navigate(`/communities/${id}`)} currentUser={user} />}/>
                                <Route path="/communities/:id" element={<CommunityWrapper user={user}/>}/>
                                <Route path="/notifications" element={<NotificationsPage user={user} />} />
                                <Route path="/transactions/:txId" element={<TransactionScreen currentUser={user!} />} />
                                <Route path="/mylist" element={<MyListPage user={user!} />} />
                                <Route path="/user/:userId" element={<PublicProfile currentUser={user} />} />
                                <Route path="/user/:userId/follows" element={<FollowListPage />} />
                                <Route path="/messages" element={<ChatList currentUser={user!} />} />
                                <Route path="/chat/:userId" element={<ChatScreen currentUser={user!} />} />
                            </>
                        ) : (
                            <Route path="*" element={<Navigate to="/" replace />} />
                        )}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </div>

            {/* 💡 ログインモーダルコンポーネントを配置 */}
            <LoginModal
                open={loginModalOpen}
                onClose={() => setLoginModalOpen(false)}
                onLoginSuccess={handleLoginSuccess}
            />
            <AIChatBot />
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