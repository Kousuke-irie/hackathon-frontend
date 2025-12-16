export interface Notification {
    id: number;
    user_id: number;
    type: 'LIKE' | 'COMMENT' | 'SYSTEM'; // 通知の種類
    content: string;                    // 通知メッセージ
    related_id?: number;               // 関連する商品IDなど
    is_read: boolean;
    created_at: string;
}