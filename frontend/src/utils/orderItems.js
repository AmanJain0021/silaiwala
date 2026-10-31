/**
 * Helpers for multi-item marketplace orders (Order.items[]).
 */

const FASHION_FALLBACKS = {
  suit: 'https://res.cloudinary.com/dfpnrwpib/image/upload/v1790608227/tailor_platform/z9cukm3gosnibmiv3ysk.jpg',
  shalwar: 'https://res.cloudinary.com/dfpnrwpib/image/upload/v1790608227/tailor_platform/z9cukm3gosnibmiv3ysk.jpg',
  kurta: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
  shirt: 'https://res.cloudinary.com/dfpnrwpib/image/upload/v1785407618/tailor_platform/wjnknck60wqe0gkxwqar.png',
  blouse: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
  pajama: 'https://res.cloudinary.com/dfpnrwpib/image/upload/v1787729637/tailor_platform/al3uieaqqxl78hfhspyh.jpg',
  pant: 'https://res.cloudinary.com/dfpnrwpib/image/upload/v1788547397/tailor_platform/k5wx0ejo5znsn5wjrxac.jpg',
  trouser: 'https://res.cloudinary.com/dfpnrwpib/image/upload/v1788547397/tailor_platform/k5wx0ejo5znsn5wjrxac.jpg',
  lehenga: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
  default: 'https://res.cloudinary.com/dfpnrwpib/image/upload/v1790608227/tailor_platform/z9cukm3gosnibmiv3ysk.jpg'
};

function toTitleCase(str) {
  if (!str) return '';
  return str
    .replace(/[_-]/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function getItemLabel(item) {
  if (!item) return 'Custom Tailoring';
  
  const explicit = (
    item.service?.title ||
    item.service?.name ||
    item.product?.name ||
    item.serviceDetails?.title ||
    item.serviceDetails?.name ||
    item.measurements?.garmentType ||
    item.selectedStyle?.name ||
    item.garmentType
  );

  if (explicit && typeof explicit === 'string' && explicit.trim()) {
    const raw = explicit.trim();
    const lower = raw.toLowerCase();
    if (lower === 'custom garment' || lower === 'custom garment order') {
      if (item.customizations?.bottom?.name) return toTitleCase(item.customizations.bottom.name);
      if (item.styleAddons?.[0]?.name) return toTitleCase(item.styleAddons[0].name);
      if (item.measurements?.garmentType) return toTitleCase(item.measurements.garmentType);
    }
    return toTitleCase(raw);
  }

  if (item.customizations && typeof item.customizations === 'object') {
    for (const val of Object.values(item.customizations)) {
      if (val && val.name && typeof val.name === 'string') {
        return toTitleCase(val.name);
      }
    }
  }

  if (Array.isArray(item.styleAddons) && item.styleAddons.length > 0) {
    if (item.styleAddons[0].name) return toTitleCase(item.styleAddons[0].name);
    if (item.styleAddons[0].category && item.styleAddons[0].category !== 'All') {
      return toTitleCase(item.styleAddons[0].category);
    }
  }

  return 'Custom Tailoring Outfit';
}

export function getItemImage(item) {
  if (!item) return FASHION_FALLBACKS.default;

  // 1. Direct image properties
  const direct = (
    item.service?.image ||
    item.product?.images?.[0] ||
    item.product?.image ||
    item.selectedFabric?.image ||
    item.selectedFabric?.images?.[0] ||
    item.selectedStyle?.image ||
    item.measurements?.slipImage ||
    item.measurements?.image ||
    item.serviceDetails?.image
  );
  if (direct && typeof direct === 'string' && direct.trim() && !direct.includes('no-photo') && !direct.includes('placehold.co')) {
    return direct.trim();
  }

  // 2. Customizations images
  if (item.customizations && typeof item.customizations === 'object') {
    for (const val of Object.values(item.customizations)) {
      if (val && (val.refImage || val.image)) {
        const img = val.refImage || val.image;
        if (typeof img === 'string' && img.trim() && !img.includes('no-photo') && !img.includes('placehold.co')) {
          return img.trim();
        }
      }
    }
  }

  // 3. Style Addons image
  if (Array.isArray(item.styleAddons)) {
    for (const addon of item.styleAddons) {
      if (addon && addon.image && typeof addon.image === 'string' && addon.image.trim() && !addon.image.includes('no-photo') && !addon.image.includes('placehold.co')) {
        return addon.image.trim();
      }
    }
  }

  // 4. Smart Fashion garment fallback
  const label = (
    item.service?.title ||
    item.service?.name ||
    item.measurements?.garmentType ||
    item.garmentType ||
    ''
  ).toLowerCase();

  for (const [key, fallbackUrl] of Object.entries(FASHION_FALLBACKS)) {
    if (key !== 'default' && label.includes(key)) {
      return fallbackUrl;
    }
  }

  return FASHION_FALLBACKS.default;
}

/**
 * Compact title for lists/banners.
 * 1 item → its name; 2 → "A + B"; 3+ → "A + N more"
 */
export function formatOrderItemsTitle(items, { fallback = 'Custom Stitching Order', maxNamed = 2 } = {}) {
  if (!Array.isArray(items) || items.length === 0) return fallback;

  const labels = items.map(getItemLabel);
  if (labels.length === 1) return labels[0];
  if (labels.length <= maxNamed) return labels.join(' + ');

  const named = labels.slice(0, 1).join('');
  const rest = labels.length - 1;
  return `${named} + ${rest} more`;
}

export function getOrderItemCount(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
}

export function orderHasTailorAtHome(items) {
  return Array.isArray(items) && items.some(
    (item) => item.measurements?.type === 'home' || item.measurements?.option === 'visit'
  );
}
