import axios from "axios";
import type { User } from '../types/user';


// --- 1. APIベース設定 ---
const API_URL = import.meta.env.VITE_APP_API_URL || "http://localhost:8080";
export const client = axios.create({
    baseURL: API_URL,
});

/** GCSアップロード用の署名付きURLと最終的な画像URLを取得 */
export const getGcsUploadUrl = async (fileName: string,userId:number,contentType: string): Promise<{ uploadUrl: string, imageUrl: string }> => {
    // バックエンドにファイル名やMIMEタイプなどを渡し、署名付きURLを要求する
    const response = await client.post('/items/upload-url', { file_name: fileName,content_type: contentType }, {
        headers: { 'X-User-ID': userId.toString() }, // 👈 401エラーを防ぐための必須ヘッダー
    });
    return response.data;
};

// --- 2. 共通インターフェース (APIレスポンス型) ---a

// 商品の共通型
export interface Item {
    id: number;
    seller_id: number;
    title: string;
    description: string;
    price: number;
    image_url: string;
    status: 'ON_SALE' | 'SOLD';
    seller: User; // 詳細取得時にPreloadされる

    category_id: number;
    condition: string;
    shipping_payer: string;
    shipping_fee: number;
}

// 既存の Item インターフェースをベースに、出品に必要なメタデータ型を定義
export interface ItemData {
    title: string;
    description: string;
    price: string; // SellItem.tsx からは string で来るため
    seller_id: string; // SellItem.tsx からは string で来るため
    image_url: string; // ★ GCSにアップロードされたURLを追加
    category_id: string; // SellItem.tsx からは string で来るため
    condition: string;
    shipping_payer: 'seller' | 'buyer';
    shipping_fee: string; // SellItem.tsx からは string で来るため
    status: 'ON_SALE' | 'SOLD' | 'DRAFT';
}

// コミュニティの共通型
export interface Community {
    id: number;
    name: string;
    description: string;
    image_url: string;
}

// 投稿の共通型
export interface CommunityPost {
    id: number;
    community_id: number;
    user: User;
    content: string;
    related_item?: Item; // 関連商品（オプショナル）
}

// コメントの共通型
export interface Comment {
    id: number;
    content: string;
    user: User;
    created_at: string;
}

// AI解析のレスポンス型 (GoのAIResponse構造体に対応)
export interface AIAnalysisResult {
    title: string;
    description: string;
    price: number;
    tags: string[];
    category_id: number;
}

export interface CreateCommunityRequest {
    name: string;
    description: string;
    image_url: string;
}

// --- 階層型カテゴリの型定義 ---
export interface Category {
    id: number;
    name: string;
    icon_name: string; // UI表示用
    parent_id: number | null;
}

export interface CategoryTree {
    id: number;
    name: string;
    icon_name: string; // UI表示用
    parent_id: number | null;
    children?: CategoryTree[]; // 子カテゴリも同じ型を持つ
}

export interface ProductCondition {
    id: number;
    name: string;
    rank: number;
}

export interface ItemListParams {
    user_id?: number;
    category_id?: number;
    condition?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    q?: string;
}

// トランザクション（購入履歴）の型定義
export interface Transaction {
    id: number;
    item_id: number;
    buyer_id: number;
    seller_id: number;
    price_snapshot: number;
    created_at: string;
    item: Item; // 紐付いた商品情報
    status: string;
}

export interface ItemListResponse {
    items: Item[];
    // 必要に応じて total_count などを追加
}

// --- 3. API通信関数 ---

// ------------------------------------
// 認証・ユーザー
// ------------------------------------

interface LoginResponse {
    message: string;
    user: User;
}

/** ログイン・ユーザー登録 (Firebaseトークンをバックエンドで検証) */
export const loginUser = async (idToken: string): Promise<LoginResponse> => {
    const response = await client.post('/login', { id_token: idToken });
    return response.data;
};

/** ユーザー情報を取得 (公開プロフィール用) */
export const fetchUserDetail = async (userId: number): Promise<User> => {
    const response = await client.get(`/users/${userId}`);
    return response.data.user;
};

/** プロフィール情報を更新 (住所や生年月日を含む) */
export const updateProfile = async (data: Partial<User> & { id: number }): Promise<User> => {
    const response = await client.put('/users/me', data);
    return response.data.user;
};

export const toggleFollow = async (myId: number, targetId: number) => {
    const response = await client.post(`/users/${targetId}/follow`, {}, {
        headers: { 'X-User-ID': myId.toString() }
    });
    return response.data;
};

export const fetchFollows = async (userId: number, mode: 'following' | 'followers'): Promise<User[]> => {
    const response = await client.get(`/users/${userId}/follows?mode=${mode}`);
    return response.data.users;
};

export const checkIsFollowing = async (myId: number, targetId: number): Promise<{is_following: boolean}> => {
    const response = await client.get(`/users/${targetId}/is-following`, {
        headers: { 'X-User-ID': myId.toString() }
    });
    return response.data;
};

// ------------------------------------
// マイページ
// ------------------------------------

export const fetchLikedItems = async (userId: number) : Promise<Item[]> => {
    const response = await client.get('/my/likes',{
        headers: {'X-User-ID': userId.toString()},
    });
    return response.data.items;
}

// ------------------------------------
// 商品取得・一覧
// ------------------------------------

/** 汎用的な商品一覧を取得 (自分が出品していないON_SALEの商品) */
export const fetchItemList = async (
    params: ItemListParams
): Promise<ItemListResponse> => { // 💡 戻り値を Item[] から ItemListResponse に変更
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 0 && value !== '') {
            searchParams.append(key, String(value));
        }
    });
    const response = await client.get(`/items?${searchParams.toString()}`);
    // 💡 response.data が { items: [...] } であることを想定
    return response.data;
};

/** 自分の出品商品一覧を取得 */
export const fetchMyItems = async (userId: number, status?: string): Promise<Item[]> => {
    const url = status ? `/my/items?status=${status}` : '/my/items';
    const response = await client.get(url, {
        headers: { 'X-User-ID': userId.toString() },
    });
    return response.data.items;
};

/** 自分の下書き商品一覧を取得 */
export const fetchMyDrafts = async (userId: number): Promise<Item[]> => {
    const response = await client.get('/my/drafts', {
        headers: { 'X-User-ID': userId.toString() },
    });
    return response.data.items;
};

/** 商品詳細を取得 */
export const fetchItemDetail = async (itemId: number): Promise<Item> => {
    const response = await client.get(`/items/${itemId}`);
    return response.data.item;
};

export const updateItem = async (itemId: number, data: ItemData): Promise<Item> => {
    const response = await client.put(`/items/${itemId}`, data, {
        headers: { 'X-User-ID': data.seller_id }
    });
    return response.data.item;
};

/** IDの配列に基づき、複数の商品情報を取得 */
export const fetchItemsByIds = async (itemIds: number[]): Promise<Item[]> => {
    if (itemIds.length === 0) {
        return [];
    }
    // GoバックエンドにIDリストをクエリパラメータとして渡す (例: ?ids=1,2,3)
    const idString = itemIds.join(',');

    // 💡 注意: Goバックエンドにはこのエンドポイント（/items/by-ids）が必要
    const response = await client.get(`/items/by-ids?ids=${idString}`);
    return response.data.items;
};

export const checkItemLiked = async (userId: number ,itemId: number): Promise<{ is_liked: boolean }> => {
    const response = await client.get(`/items/${itemId}/liked`,{
        headers: { 'X-User-ID': userId.toString() },
    })
    return response.data;
};

/** 購入履歴を取得 */
export const fetchPurchaseHistory = async (userId: number): Promise<Transaction[]> => {
    const response = await client.get('/my/purchases', {
        headers: { 'X-User-ID': userId.toString() },
    });
    return response.data.transactions;
};

/** 自分が販売し、完了した取引一覧を取得 */
export const fetchMySalesHistory = async (userId: number): Promise<Transaction[]> => {
    const response = await client.get('/my/sales-history', {
        headers: { 'X-User-ID': userId.toString() },
    });
    return response.data.transactions;
};

// ------------------------------------
// 出品・AI解析
// ------------------------------------

/** AIに画像を送信し、解析結果を取得 */
export const analyzeItemImage = async (image: File): Promise<AIAnalysisResult> => {
    const formData = new FormData();
    formData.append('image', image);

    const response = await client.post<{ data: AIAnalysisResult }>('/items/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
};

/** 商品を登録・出品 */
export const createItem = async (data: ItemData): Promise<Item> => {
    const response = await client.post('/items', data);
    return response.data.item;
};
/** 取引ステータスを更新 */
export const updateTransactionStatus = async (
    txId: number,
    newStatus: string
): Promise<void> => {
    await client.put(`/transactions/${txId}/status`, { new_status: newStatus });
};

// ------------------------------------
// 決済・取引
// ------------------------------------

/** 支払いインテントを作成し、clientSecretを取得 */
export const createPaymentIntent = async (itemId: number): Promise<{ clientSecret: string }> => {
    const response = await client.post('/payment/create-payment-intent', { item_id: itemId });
    return response.data;
};

export const completePurchaseAndCreateTransaction = async (
    itemId: number,
    buyerId: number // 👈 Buyer ID を追加
): Promise<{ transaction_id: number, message: string }> => {
    // 💡 routes.go のパス /items/:id/sold と Goハンドラ CompletePurchaseAndCreateTransactionHandler に対応
    const response = await client.post(`/items/${itemId}/sold`, {
        item_id: itemId, // Go側で :id から取れるが、JSONにも含めておく方が安全
        buyer_id: buyerId,
    });
    return response.data;
};

/** 評価を投稿 */
export const postReview = async (
    txId: number,
    raterId: number,
    rating: number,
    comment: string,
    role: 'BUYER' | 'SELLER'
): Promise<void> => {
    await client.post(`/transactions/${txId}/review`, {
        rater_id: raterId,
        rating,
        comment,
        role
    });
};

/** 取引をキャンセル */
export const cancelTransaction = async (txId: number): Promise<void> => {
    await client.post(`/transactions/${txId}/cancel`);
};

/** 取引中の購入履歴を取得 (発送待ち、配送中、受取完了待ち) */
export const fetchInProgressPurchases = async (userId: number): Promise<Transaction[]> => {
    const response = await client.get(`/my/in-progress`, {
        // Go側でX-User-IDで認証を行うため、ヘッダーを渡す
        headers: { 'X-User-ID': userId.toString() },
    });
    return response.data.transactions;
};

/** 特定の取引詳細を取得 */
export const fetchTransactionDetail = async (txId: number): Promise<Transaction> => {
    const response = await client.get(`/transactions/${txId}`);
    return response.data.transaction;
};

/** 自分が販売した取引中の商品一覧を取得 (出品者用) */
export const fetchMySalesInProgress = async (userId: number): Promise<Transaction[]> => {
    const response = await client.get(`/my/sales-in-progress`, {
        headers: { 'X-User-ID': userId.toString() },
    });
    return response.data.transactions;
};

// ------------------------------------
// コメント
// ------------------------------------

/** 商品のコメント一覧を取得 */
export const fetchComments = async (itemId: number): Promise<Comment[]> => {
    const response = await client.get(`/items/${itemId}/comments`);
    return response.data.comments;
};

/** コメントを投稿 */
export const postComment = async (itemId: number, userId: number, content: string): Promise<Comment> => {
    const response = await client.post(`/items/${itemId}/comments`, { user_id: userId, content });
    return response.data.comment;
};


// ------------------------------------
// スワイプ
// ------------------------------------

/** スワイプ用の商品一覧を取得 */
export const fetchSwipeItems = async (userId: number): Promise<Item[]> => {
    const response = await client.get(`/swipe/items`, {
        headers: { 'X-User-ID': userId.toString() },
    });
    return response.data.items;
};

/** スワイプアクションを記録 (Like/Nope) */
export const recordSwipeAction = async (userId: number, itemId: number, reaction: 'LIKE' | 'NOPE'): Promise<void> => {
    await client.post('/swipe/action', { user_id: userId, item_id: itemId, reaction });
};


// ------------------------------------
// コミュニティ
// ------------------------------------

export const createCommunity = async (request: CreateCommunityRequest): Promise<Community> => {
    const response = await client.post('/communities', request);
    return response.data.community; // Go側は {"community": {}} の形式で返す想定
};

/** コミュニティ一覧を取得 */
export const fetchCommunities = async (): Promise<Community[]> => {
    const response = await client.get('/communities');
    return response.data.communities;
};

/** コミュニティの投稿一覧を取得 */
export const fetchCommunityPosts = async (communityId: number): Promise<CommunityPost[]> => {
    const response = await client.get(`/communities/${communityId}/posts`);
    return response.data.posts;
};

/** コミュニティに投稿 */
export const postCommunityPost = async (
    communityId: number,
    userId: number,
    content: string,
    relatedItemId: number | null
): Promise<CommunityPost> => {
    const response = await client.post(`/communities/${communityId}/posts`, {
        user_id: userId,
        content,
        related_item_id: relatedItemId,
    });
    return response.data.post;
};

// ------------------------------------
// メタ情報
// ------------------------------------

export const fetchCategories = async (): Promise<Category[]> => {
    const response = await client.get('/meta/categories');
    // Goの応答は { "categories": [...] } の形式
    return response.data.categories;
};

/** 階層型カテゴリツリー全体を取得 */
export const fetchCategoryTree = async (): Promise<CategoryTree[]> => {
    const response = await client.get('/meta/categories/tree');
    // Goの応答は { "categories": [...] } の形式
    return response.data.categories;
};

/** 商品状態一覧を取得 */
export const fetchConditions = async (): Promise<ProductCondition[]> => {
    const response = await client.get('/meta/conditions');
    return response.data.conditions;
};

export const fetchNotifications = async (userId: number) => {
    const response = await client.get('/my/notifications', {
        headers: {
            'X-User-ID': userId.toString(),
        },
    });
    return response.data;
};