import { useState } from "react";
import type { User } from "../types/user";
import * as api from "../services/api";
import { useNavigate } from "react-router-dom";
import { Button, TextField, Box, Avatar, Typography, Divider } from '@mui/material';

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
        <Box sx={{ maxWidth: 600, mx: 'auto', py: 4, px: 2 }}>
            {/* ヘッダー情報（表示用） */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 6 }}>
                <Avatar
                    src={user.icon_url}
                    alt={user.username}
                    sx={{ width: 100, height: 100, mb: 2, border: '1px solid #eee' }}
                />
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{user.username}</Typography>
                <Typography variant="body2" color="text.secondary">ID: {user.id}</Typography>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>プロフィール設定</Typography>

            <form onSubmit={handleSave}>
                <Box sx={{ display: 'grid', gap: 3 }}>
                    <TextField
                        label="アイコン画像URL"
                        fullWidth
                        variant="standard"
                        value={iconUrl}
                        onChange={(e) => setIconUrl(e.target.value)}
                    />
                    <TextField
                        label="ユーザー名"
                        fullWidth
                        variant="standard"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <TextField
                        label="自己紹介"
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        sx={{ mt: 1 }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={isSaving}
                        sx={{ mt: 2, py: 1.5, fontWeight: 'bold', borderRadius: '8px' }}
                    >
                        {isSaving ? '保存中...' : '変更を保存'}
                    </Button>
                </Box>
            </form>

            <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid #eee' }}>
                <Button
                    onClick={handleLogoutClick}
                    variant="text"
                    fullWidth
                    sx={{ color: '#ff4d4f', fontWeight: 'bold', textTransform: 'none' }}
                >
                    ログアウト
                </Button>
            </Box>
        </Box>
    );
};