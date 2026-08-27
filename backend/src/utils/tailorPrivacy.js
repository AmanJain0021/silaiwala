const Tailor = require("../models/Tailor.js");

/**
 * Attach Tailor.shopName onto populated User tailor refs and hide personal name
 * for customer / delivery / measurement-executive privacy.
 *
 * @param {object|object[]} docs - documents with `.tailor` populated (lean objects)
 * @param {{ hidePersonalName?: boolean }} opts
 */
async function attachTailorShopPrivacy(docs, opts = {}) {
  const hidePersonalName = opts.hidePersonalName !== false;
  const list = (Array.isArray(docs) ? docs : [docs]).filter(Boolean);
  const userIds = [
    ...new Set(
      list
        .map((d) => d.tailor?._id || d.tailor)
        .filter(Boolean)
        .map((id) => String(id))
    ),
  ];

  if (!userIds.length) return docs;

  const profiles = await Tailor.find({ user: { $in: userIds } })
    .select("user shopName")
    .lean();
  const shopByUser = Object.fromEntries(
    profiles.map((p) => [String(p.user), p.shopName || null])
  );

  list.forEach((d) => {
    if (!d.tailor || typeof d.tailor !== "object") return;
    const uid = String(d.tailor._id || d.tailor);
    const shop = shopByUser[uid] || d.tailor.shopName || null;
    d.tailor.shopName = shop;
    if (hidePersonalName) {
      // Keep API shape stable but never expose personal name to these roles
      delete d.tailor.name;
    }
  });

  return docs;
}

module.exports = { attachTailorShopPrivacy };
