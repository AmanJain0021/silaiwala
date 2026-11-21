/* ─── Design tokens (SewZella premium landing) ─── */
export const SERIF = "'Playfair Display', 'Libre Caslon Text', Georgia, serif";
export const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";

export const C = {
  plum: '#843D9B', // brand purple
  plumDeep: '#4A1560',
  plumInk: '#2A0F38',
  ink: '#1A1523',
  muted: '#6B6575',
  line: '#EDE5F3',
  lavender: '#F6F0FA',
  mist: '#FBF8FD',
};

/* ─── Real app links (unchanged from the previous site) ─── */
export const APP_LINKS = {
  customer: 'https://play.google.com/store/apps/details?id=com.sewzella.user&pcampaignid=web_share',
  tailor: 'https://play.google.com/store/apps/details?id=com.sewzella.tailor&pcampaignid=web_share',
  delivery: 'https://play.google.com/store/apps/details?id=com.sewzella.delivery&pcampaignid=web_share',
};

/* Optimized copies of the default landing photos (public/landing/opt). CMS images are
   used as-is; only the bundled defaults are swapped for their lighter versions. */
const OPTIMIZED = {
  '/landing/category_womens_wear.png': '/landing/opt/womens-wear.jpg',
  '/landing/category_mens_wear.png': '/landing/opt/mens-wear.jpg',
  '/landing/category_kids_wear.png': '/landing/opt/kids-wear.jpg',
  '/landing/category_bridal_wear.png': '/landing/opt/bridal-wear.jpg',
};
export const optimizedImg = (src) => OPTIMIZED[src] || src;

/* ─── Motion presets ─── */
export const EASE = [0.22, 1, 0.36, 1];
export const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: EASE },
  }),
};
export const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };
