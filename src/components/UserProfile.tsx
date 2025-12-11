import { useState } from "react";
import type { User } from "../types/user";
import * as api from "../services/api";
import { useNavigate } from "react-router-dom";
import { Button, TextField, Box, Avatar, Typography, Paper, Divider } from '@mui/material';

interface UserProfileProps {
    user: User;
    onUserUpdate: (updatedUser: User) => void;
    onLogout: () => void;
}

export const UserProfile = ({ user, onUserUpdate, onLogout }: UserProfileProps) => {
    // フォームの状態管理 (初期値は現在のユーザー情報)
    const [username, setUsername] = useState(user.username);
    const [bio, setBio] = useState(user.bio || "");
    const [iconUrl, setIconUrl] = useState(user.icon_url)
    const [isSaving, setIsSaving] = useState(false);

    const navigate = useNavigate();

    const handleLogoutClick = () => {
        onLogout();
        navigate("/");
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // ▼ api.tsにupdateUserを定義していないため、一旦ここにロジックを記述します
            // 🚨 注意: api.tsに updateProfile(id: number, name: string, bio: string) を追加するのが理想です

            const response = await api.client.put('/users/me', { // ルートは /users/me のPUTを想定
                id: user.id,
                username: username,
                bio: bio,
                icon_url: iconUrl,
            });

            const data = response.data; // 👈 axiosの応答には .data にJSONボディが含まれる

            onUserUpdate(data.user);

            alert("プロフィールを更新しました！");
            // App.tsxのuser stateも更新が必要ですが、今回は再ログインで対応（本来はプロパティ更新）
        } catch (error) {
            console.error(error);
            alert("更新に失敗しました。");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Paper elevation={3} sx={{ padding: 4, mt: 3 }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{textAlign: 'center'}}>
                マイページ (プロフィール編集)
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                    src={user.icon_url}
                    alt={user.username}
                    sx={{ width: 80, height: 80, mb: 1 }}
                />
                <Typography variant="h6">{user.username}</Typography>
                <Typography variant="body2" color="textSecondary">ID: {user.id}</Typography>
                <Typography variant="body2" color="textSecondary">メールアドレス: {user.email}</Typography>
            </Box>

            <Divider sx={{ my: 3 }}/>
            <Typography variant="h6" component="h2" gutterBottom>プロフィール編集</Typography>
            <form onSubmit={handleSave}>
                <TextField
                    label="アイコン画像URL"
                    fullWidth
                    margin="normal"
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    placeholder="新しいアイコン画像のURL"
                />
                <TextField
                    label="ユーザー名"
                    fullWidth
                    margin="normal"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <TextField
                    label="自己紹介"
                    fullWidth
                    multiline
                    rows={4}
                    margin="normal"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                />

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 3 }}
                    disabled={isSaving}
                >
                    {isSaving ? '保存中...' : '変更を保存'}
                </Button>
            </form>

            <Divider sx={{ my: 4 }}/>

            <Button
                onClick={handleLogoutClick}
                variant="outlined"
                color="error"
                fullWidth
                sx={{ py: 1 }}
            >
                ログアウト
            </Button>

        </Paper>
    );
};