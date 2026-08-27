/**
 * Public-facing tailor label for customer, delivery, and measurement-executive.
 * Never expose personal name (user.name / tailor.name) — shop name only.
 */
export const getTailorShopName = (tailorLike, fallback = 'Tailor Partner') => {
    if (!tailorLike) return fallback;
    if (typeof tailorLike === 'string') {
        // Already a display string from store (should already be shop name)
        return tailorLike.trim() || fallback;
    }
    const shop =
        tailorLike.shopName ||
        tailorLike.tailorName ||
        tailorLike.tailor?.shopName ||
        tailorLike.user?.shopName ||
        null;
    return (typeof shop === 'string' && shop.trim()) ? shop.trim() : fallback;
};
