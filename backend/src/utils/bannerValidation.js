/** Reject stock/placeholder URLs — banners must be admin-uploaded images only */
const BLOCKED_IMAGE_HOSTS = [
  "flaticon.com",
  "unsplash.com",
  "placeholder.com",
  "placehold.co",
  "via.placeholder.com",
  "picsum.photos",
];

function isValidBannerImage(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  if (BLOCKED_IMAGE_HOSTS.some((host) => lower.includes(host))) return false;

  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("data:image/")
  );
}

function normalizeBannerPayload(body = {}) {
  const image = String(body.image || "").trim();
  return {
    title: String(body.title || "").trim(),
    subtitle: String(body.subtitle || "").trim(),
    badge: String(body.badge || "").trim(),
    image,
    targetLocation: body.targetLocation || "Home Page - Top Carousel",
    status: body.status || "Active",
    color: body.color || "bg-gradient-to-br from-[#843D9B] to-[#ff85a2]",
    startDate: body.startDate ? new Date(body.startDate) : undefined,
    endDate: body.endDate ? new Date(body.endDate) : undefined,
  };
}

function validateBannerPayload(payload) {
  if (!payload.title) return "Banner title is required";
  if (!isValidBannerImage(payload.image)) {
    return "Please upload a banner image. Default or external placeholder URLs are not allowed.";
  }
  const allowedLocations = [
    "Home Page - Top Carousel",
    "Store Tab - Header Banner",
    "Promotional Popup",
  ];
  if (!allowedLocations.includes(payload.targetLocation)) {
    return "Invalid banner placement location";
  }
  return null;
}

module.exports = {
  isValidBannerImage,
  normalizeBannerPayload,
  validateBannerPayload,
  BLOCKED_IMAGE_HOSTS,
};
