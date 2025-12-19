export const parseImageUrls = (urlData: string | undefined | null): string[] => {
    if (!urlData) return ['https://placehold.jp/400x400.png?text=No+Image'];
    try {
        const parsed = JSON.parse(urlData);
        if (Array.isArray(parsed)) return parsed.length > 0 ? parsed : ['https://placehold.jp/400x400.png?text=No+Image'];
        return [urlData];
    } catch {
        // JSONでない場合は単一のURL文字列として扱う
        return [urlData];
    }
};

export const getFirstImageUrl = (urlData: string | undefined | null): string => {
    return parseImageUrls(urlData)[0];
};