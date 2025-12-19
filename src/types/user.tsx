export interface User {
    id: number;
    username: string;
    email: string;       // 💡 追加
    icon_url: string;
    bio?: string;        // 💡 追加（自己紹介）
    address?: string;    // 💡 追加（住所）
    birthdate?: string;  // 💡 追加（生年月日）
    created_at: string;
    updated_at: string;
}