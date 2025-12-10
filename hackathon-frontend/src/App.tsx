import { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useParams, useNavigate, Navigate } from 'react-router-dom'; // useNavigate, useParamsを追加
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
import { PurchaseHistory} from "./components/PurchaseHistory.tsx";
import { InProgressPurchases} from "./components/InProgressPurchases.tsx";
import { NotFound} from "./components/NotFound";

import type { User } from './types/user';

const theme = createTheme({
    palette: {
        primary: { main: '#6200ea' }, // パープル
        secondary: { main: '#ff4081' }, // ピンク
    },
});

//const PrivateRouteWrapper = ({ user, Component }: { user: User, Component: React.FC<any> }) => {
//    return <Component user={user} />;
//};

const ItemDetailWrapper = ({ user }: { user: User | null }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    // ユーザーがnullの場合、ItemDetailコンポーネント内でcurrentUserがUser型であることを保証できないため、nullチェックを強化
    // ItemDetail コンポーネントの props 型が変更されている可能性があるため、userがnullの場合でもアクセスできるように修正
    return <ItemDetail itemId={Number(id)} currentUser={user} onBack={() => navigate(-1)} />;
};

const CommunityWrapper = ({ user }: { user: User | null }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    if (!user) return <Navigate to="/"/> // 未ログインならトップへリダイレクト

    // CommunityBoard は user が必要
    return <CommunityBoard communityId={Number(id)} currentUser={user} onBack={() => navigate("/communities")} onItemClick={(itemId) => navigate(`/items/${itemId}`)} />;
};

const SellItemWrapper = ({ user }: { user: User }) => {
    const { id } = useParams();
    const itemId = id ? Number(id) : undefined;

    // SellItemに編集対象のIDを渡す
    return <SellItem user={user} editingItemId={itemId} />;
};

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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

    // ▼▼▼ ログアウト処理 ▼▼▼
    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null); // ステートをクリア
            alert("ログアウトしました");
        } catch (e) {
            console.error("Logout failed:", e);
            alert("ログアウトに失敗しました");
        }
    };

    const handleUserUpdate = (updatedUser: User) => {
        setUser(updatedUser); // App.tsxのuserステートを更新
    };

    const handleEditDraft = (id: number) => {
        window.location.href = `/sell/edit/${id}`;
    };

    // ▼▼▼ 認証の永続化ロジック (最重要) ▼▼▼
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Firebaseセッションがあれば、IDトークンを取得してバックエンドに問い合わせる
                try {
                    const idToken = await firebaseUser.getIdToken();
                    const response = await api.loginUser(idToken); // バックエンドで再検証＆DB同期
                    setUser(response.user);
                } catch (e) {
                    console.error("Backend sync failed:", e);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false); // 認証状態の確認が完了
        });
        return () => unsubscribe(); // クリーンアップ関数
    }, []);
    // ▲▲▲ 認証の永続化ロジック ▲▲▲


    // 1. ロード中の画面
    if (loading) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <div style={{textAlign: "center", marginTop: "100px"}}>
                    アプリ起動中...
                </div>
            </ThemeProvider>
        );
    }

        // 2. 未ログイン状態（公開ビューを許可し、特定ルートのみログインを要求する）
        // ルートで制御するため、ここではルーティング骨格を返す。

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <BrowserRouter>
                {/* Navbarはログイン状態とログイン関数を渡す */}
                <Navbar currentUser={user} onLogin={handleLogin} />

                <div style={{padding: "1rem", maxWidth: "800px", margin: "0 auto", marginTop: "70px"}}>
                    <Routes>

                        {/* 公開ルート（未ログインでもアクセス可能） */}
                        {/* ItemList, ItemDetail は user が null でも動くように調整が必要です */}
                        <Route path="/" element={<ItemList user={user} onItemClick={(id) => window.location.href = `/items/${id}`} />}/>
                        <Route path="/items/:id" element={<ItemDetailWrapper user={user}/>}/>


                        {/* 認証が必要なルート (Private Routes) */}
                        {user ? (
                            <>
                                <Route path="/swipe" element={<SwipeDeck user={user!} />}/>
                                <Route path="/communities" element={<CommunityList onSelectCommunity={(id) => window.location.href = `/communities/${id}`} />}/>
                                <Route path="/communities/:id" element={<CommunityWrapper user={user}/>}/>
                                <Route path="/myitems" element={<MyItems user={user} onItemClick={(id) => window.location.href = `/items/${id}`} />}/>
                                <Route path="/drafts" element={<DraftsList user={user} onEditDraft={handleEditDraft} />}/>
                                <Route path="/purchases" element={<PurchaseHistory user={user} onItemClick={(id) => window.location.href = `/items/${id}`} />}/>
                                <Route path="/mylikes" element={<LikedItems user={user} onItemClick={(id:number) => window.location.href = `/items/${id}`} />}/>
                                <Route path="/sell" element={<SellItemWrapper user={user} />}/>
                                <Route path="/sell/edit/:id" element={<SellItemWrapper user={user} />}/>
                                <Route path="/profile" element={<UserProfile user={user} onUserUpdate={handleUserUpdate} onLogout={handleLogout}/>}/>
                                <Route path="/purchase-in-progress" element={<InProgressPurchases user={user} onItemClick={(id) => window.location.href=`/items/${id}`} />}/>
                            </>
                        ) : (
                            // 未ログインでアクセスした場合、ログインが必要なパスはトップにリダイレクト
                            <Route path="*" element={<Navigate to="/" replace />} />
                            // ★ Public View のため、認証が必要なパスは Navigate で弾き、公開パスはそのまま
                        )}

                        <Route path="*" element={<NotFound />} />

                    </Routes>
                </div>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;