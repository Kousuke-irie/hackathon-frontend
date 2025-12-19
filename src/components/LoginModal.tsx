import { useState } from "react";
import { auth, provider } from "../firebase";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Box, Button, TextField, Typography, Divider, Dialog, DialogContent, Tab, Tabs, CircularProgress } from "@mui/material";
import GoogleIcon from '@mui/icons-material/Google';

interface LoginModalProps {
    open: boolean;
    onClose: () => void;
    onLoginSuccess: (idToken: string) => void;
}

export const LoginModal = ({ open, onClose, onLoginSuccess }: LoginModalProps) => {
    const [tab, setTab] = useState(0); // 0: ログイン, 1: 新規登録
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState(""); // 新規登録用
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();
            onLoginSuccess(idToken);
        } catch (error: any) {
            console.error(error);
            alert("Googleログインに失敗しました");
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let userCredential;
            if (tab === 0) {
                // 既存ユーザーのログイン
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            } else {
                // 新規ユーザー登録
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Firebase側にも表示名を設定（バックエンドの初期値用）
                if (username) {
                    await updateProfile(userCredential.user, { displayName: username });
                }
            }
            const idToken = await userCredential.user.getIdToken();
            onLoginSuccess(idToken);
        } catch (error: any) {
            alert("認証に失敗しました: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogContent sx={{ p: 4 }}>
                <Typography variant="h6" align="center" sx={{ fontWeight: 800, mb: 3 }}>Wishをはじめる</Typography>

                <Button
                    fullWidth variant="outlined" startIcon={<GoogleIcon />}
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    sx={{ mb: 3, py: 1.5, borderColor: '#ddd', color: '#1a1a1a' }}
                >
                    Googleでログイン
                </Button>

                <Divider sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">または</Typography>
                </Divider>

                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 3 }}>
                    <Tab label="ログイン" sx={{ fontWeight: 'bold' }} />
                    <Tab label="新規登録" sx={{ fontWeight: 'bold' }} />
                </Tabs>

                <Box component="form" onSubmit={handleEmailAuth} sx={{ display: 'grid', gap: 2 }}>
                    {tab === 1 && (
                        <TextField
                            label="ユーザー名"
                            fullWidth
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    )}
                    <TextField
                        label="メールアドレス"
                        type="email"
                        fullWidth
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        label="パスワード"
                        type="password"
                        fullWidth
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading}
                        sx={{ py: 1.5, mt: 1, bgcolor: '#e91e63', fontWeight: 'bold' }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : (tab === 0 ? "ログイン" : "登録する")}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};