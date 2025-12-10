const STORAGE_KEY = 'recentViews';
const MAX_ITEMS = 5; // 最大5件まで保持

// 閲覧履歴をLocalStorageから取得
export const getRecentViews = (): number[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

// 閲覧履歴に商品IDを追加
export const addRecentView = (itemId: number): void => {
    let views = getRecentViews();

    // 既存のIDを削除
    views = views.filter(id => id !== itemId);

    // リストの先頭に追加
    views.unshift(itemId);

    // 最大件数に制限
    if (views.length > MAX_ITEMS) {
        views = views.slice(0, MAX_ITEMS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
};