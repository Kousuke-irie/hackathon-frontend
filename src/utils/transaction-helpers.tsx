interface ChipProps {
    label: string;
    color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

// 状態に応じてチップの色を返すヘルパー関数
export const getStatusChipProps = (status: string): ChipProps => {
    const s = status?.toUpperCase(); // 大文字に統一して判定
    switch (s) {
        case 'PURCHASED':
            return { label: '発送待ち', color: 'warning' };
        case 'SHIPPED':
            return { label: '配送中', color: 'info' };
        case 'RECEIVED':
        case 'COMPLETED': // 💡 いずれも完了として表示
            return { label: '取引完了', color: 'success' };
        case 'CANCELED':
            return { label: 'キャンセル済', color: 'error' };
        default:
            return { label: '購入済み', color: 'default' };
    }
};