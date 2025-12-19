export interface User {
    id: number;
    username: string;
    email: string;
    icon_url: string;
    bio?: string;
    address?: string;
    birthdate?: string;
    following_count?: number;
    follower_count?: number;
    created_at: string;
    updated_at: string;
}