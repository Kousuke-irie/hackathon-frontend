import { useState } from "react";
import { auth, provider } from "../firebase";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { Box, Button, TextField, Typography, Divider, Dialog, DialogContent, Tab, Tabs } from "@mui/material";
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

    const handleGoogleLogin = async () => {
        const result = await signInWithPopup(auth, provider);
        onLoginSuccess(await result.user.getIdToken());
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let userCredential;
            if (tab === 0) {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            } else {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            }
            onLoginSuccess(await userCredential.user.getIdToken());
        } catch (error: any) {
            alert("認証に失敗しました: " + error.message);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogContent sx={{ p: 4 }}>
                <Typography variant="h6" align="center" sx={{ fontWeight: 800, mb: 3 }}>Wishをはじめる</Typography>

                <Button
                    fullWidth variant="outlined" startIcon={<GoogleIcon />}
                    onClick={handleGoogleLogin} sx={{ mb: 3, py: 1.5, borderColor: '#ddd', color: '#1a1a1a' }}
                >
                    Googleでログイン
                </Button>

                <Divider sx={{ mb: 3 }}><Typography variant="caption" color="text.secondary">または</Typography></Divider>

                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
                    <Tab label="ログイン" />
                    <Tab label="新規登録" />
                </Tabs>

                <Box component="form" onSubmit={handleEmailAuth} sx={{ display: 'grid', gap: 2 }}>
                    <TextField label="メールアドレス" type="email" fullWidth required value={email} onChange={(e) => setEmail(e.target.value)} />
                    <TextField label="パスワード" type="password" fullWidth required value={password} onChange={(e) => setPassword(e.target.value)} />
                    <Button type="submit" variant="contained" fullWidth sx={{ py: 1.5, bgcolor: '#e91e63', fontWeight: 'bold' }}>
                        {tab === 0 ? "ログイン" : "登録する"}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};