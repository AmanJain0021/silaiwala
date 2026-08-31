/** Resolve banner image URL for display (Cloudinary absolute or API-relative path) */
export function resolveBannerImageUrl(img, apiBase = '') {
  if (!img || typeof img !== 'string') return '';
  const trimmed = img.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  const base = apiBase.replace(/\/$/, '');
  return `${base}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

export const BANNER_LOCATIONS = {
  HOME: 'Home Page - Top Carousel',
  STORE: 'Store Tab - Header Banner',
  POPUP: 'Promotional Popup',
};

export function isUploadedBannerImage(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (['flaticon.com', 'unsplash.com', 'placeholder.com', 'placehold.co', 'picsum.photos'].some((h) => lower.includes(h))) {
    return false;
  }
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/');
}
