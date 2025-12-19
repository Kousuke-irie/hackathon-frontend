import { useState, useRef } from "react";
import { Box, TextField, Button, Avatar, Typography, Paper, Stack, CircularProgress } from "@mui/material";
import * as api from "../services/api";
import type { User } from "../types/user";
import axios from "axios";

interface UserProfileProps {
    user: User;
    onUpdate: (updatedUser: User) => void;
}

export const UserProfile = ({ user, onUpdate }: UserProfileProps) => {
    const [username, setUsername] = useState(user.username || "");
    const [bio, setBio] = useState(user.bio || "");
    const [address, setAddress] = useState(user.address || "");
    const [birthdate, setBirthdate] = useState(user.birthdate || "");
    const [iconUrl, setIconUrl] = useState(user.icon_url || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // 1. 署名付きURLを取得
            const { uploadUrl, imageUrl } = await api.getGcsUploadUrl(file.name, user.id, file.type);

            // 2. GCSへ直接アップロード
            await axios.put(uploadUrl, file, {
                headers: { 'Content-Type': file.type }
            });

            // 3. プレビュー用のURLを更新
            setIconUrl(imageUrl);
        } catch (error) {
            console.error("Image upload failed:", error);
            alert("画像のアップロードに失敗しました");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updated = await api.updateProfile({
                id: user.id,
                username,
                bio,
                address,
                birthdate,
                icon_url: iconUrl
            });
            onUpdate(updated);
            alert("プロフィールを更新しました");
        } catch (error) {
            console.error(error);
            alert("更新に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', py: 4, px: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4 }}>プロフィール設定</Typography>

            <Stack spacing={4}>
                {/* 基本情報セクション */}
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    {/* Gridの代わりにBoxのFlexboxを使用 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar src={user.icon_url} sx={{ width: 80, height: 80, mr: 2 }} />
                        <Box>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? <CircularProgress size={20} /> : "画像を変更"}
                            </Button>
                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </Box>
                    </Box>

                    <Stack spacing={3}>
                        <TextField
                            label="ユーザー名"
                            fullWidth
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <TextField
                            label="自己紹介"
                            fullWidth
                            multiline
                            rows={4}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="趣味や発送方法などについて書きましょう"
                        />
                    </Stack>
                </Paper>

                {/* 個人情報セクション（配送用など） */}
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>個人情報・お届け先</Typography>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Stack spacing={3}>
                        <TextField
                            label="メールアドレス"
                            fullWidth
                            disabled
                            value={user.email}
                            helperText="メールアドレスは変更できません"
                        />
                        <TextField
                            label="生年月日"
                            type="date"
                            fullWidth
                            // 💡 InputLabelProps の非推奨警告を slotProps で修正
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                            value={birthdate}
                            onChange={(e) => setBirthdate(e.target.value)}
                        />
                        <TextField
                            label="住所"
                            fullWidth
                            multiline
                            rows={2}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="東京都渋谷区..."
                        />
                    </Stack>
                </Paper>

                <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={isSaving}
                    onClick={handleSave}
                    sx={{ bgcolor: '#e91e63', fontWeight: 'bold', py: 1.5 }}
                >
                    {isSaving ? "保存中..." : "変更を保存する"}
                </Button>
            </Stack>
        </Box>
    );
};