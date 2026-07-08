const Banner = require("../../../models/Banner");
const CMSContent = require("../../../models/CMSContent");
const Settings = require("../../../models/Settings");
const { getCached } = require("../../../utils/cache");

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
