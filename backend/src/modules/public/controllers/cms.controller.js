const Banner = require("../../../models/Banner.js");
const CMSContent = require("../../../models/CMSContent.js");
const Settings = require("../../../models/Settings.js");
const { getCached } = require("../../../utils/cache.js");

// --- PUBLIC CMS CONTROLLERS ---

exports.getSettings = async (req, res) => {
  try {
    const settings = await getCached("cache:public:settings", 300, async () => {
      return await Settings.getSettings();
    });
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActiveBanners = async (req, res) => {
  try {
    const { location } = req.query;
    const cacheKey = `cache:public:banners${location ? ':' + location : ''}`;
    const banners = await getCached(cacheKey, 300, async () => {
      const query = { status: "Active" };
      if (location) query.targetLocation = location;
      return await Banner.find(query).sort("-createdAt");
    });
    res.status(200).json({ success: true, count: banners.length, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCMSContent = async (req, res) => {
  try {
    const { type, category } = req.query;
    const cacheKey = `cache:public:cms-content:${type || 'all'}:${category || 'all'}`;
    const content = await getCached(cacheKey, 300, async () => {
      const query = { isActive: true };
      if (type) query.type = type;
      if (category) {
        query.category = { $in: [category, "general"] };
      }
      return await CMSContent.find(query).sort("title");
    });
    res.status(200).json({ success: true, count: content.length, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCMSContentBySlug = async (req, res) => {
  try {
    const content = await CMSContent.findOne({ slug: req.params.slug, isActive: true });
    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found" });
    }
    res.status(200).json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Real customer testimonials for the landing page (well-rated reviews with a
 *          meaningful comment). Only a first name + last initial is exposed.
 * @route   GET /api/v1/cms/testimonials
 * @access  Public
 */
exports.getTestimonials = async (req, res) => {
  try {
    const Review = require("../../../models/Review.js");
    const items = await getCached("cache:public:testimonials", 600, async () => {
      const reviews = await Review.find({
        rating: { $gte: 4 },
        targetType: { $in: ["Tailor", "Order", "Product"] },
        $expr: { $gte: [{ $strLenCP: { $ifNull: ["$comment", ""] } }, 24] },
      })
        .sort({ rating: -1, createdAt: -1 })
        .limit(9)
        .select("name rating comment targetType createdAt")
        .lean();

      const shortName = (full = "") => {
        const parts = String(full).trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return "SewZella customer";
        return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
      };

      return reviews.map((r) => ({
        id: String(r._id),
        name: shortName(r.name),
        rating: r.rating,
        comment: String(r.comment).trim().slice(0, 280),
        context: r.targetType === "Product" ? "Store order" : "Custom stitching",
        date: r.createdAt,
      }));
    });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLandingCategories = async (req, res) => {
  try {
    const categories = await getCached("cache:public:landing-categories", 300, async () => {
      const settings = await Settings.getSettings();
      const list = settings.landingCategories && settings.landingCategories.length > 0
        ? settings.landingCategories
        : Settings.DEFAULT_LANDING_CATEGORIES;
      return list.filter((c) => c.isActive !== false);
    });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

