const StyleAddon = require('../../../models/StyleAddon');

// @desc    Create new style add-on (Admin)
// @route   POST /api/v1/style-addons
// @access  Admin
exports.createStyleAddon = async (req, res) => {
    try {
        const { name, description, price, image, category, referenceImages, addonType } = req.body;
        
        const addon = await StyleAddon.create({
            name,
            description,
            price,
            image,
            category,
            referenceImages,
            addonType: addonType || 'embellishment'
        });

        res.status(201).json({
            success: true,
            data: addon
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all style add-ons
// @route   GET /api/v1/style-addons
// @access  Public
exports.getStyleAddons = async (req, res) => {
    try {
        const { category, isActive, addonType } = req.query;
        let query = {};
        
        if (category) query.category = category;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (addonType === 'embellishment') {
            query.$or = [
                { addonType: 'embellishment' },
                { addonType: { $exists: false } }
            ];
        } else if (addonType) {
            query.addonType = addonType;
        }

        const addons = await StyleAddon.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: addons.length,
            data: addons
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a style add-on
// @route   PUT /api/v1/style-addons/:id
// @access  Admin
exports.updateStyleAddon = async (req, res) => {
    try {
        let addon = await StyleAddon.findById(req.params.id);

        if (!addon) {
            return res.status(404).json({ success: false, message: 'Style addon not found' });
        }

        addon = await StyleAddon.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: addon
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a style add-on
// @route   DELETE /api/v1/style-addons/:id
// @access  Admin
exports.deleteStyleAddon = async (req, res) => {
    try {
        const addon = await StyleAddon.findById(req.params.id);

        if (!addon) {
            return res.status(404).json({ success: false, message: 'Style addon not found' });
        }

        await addon.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
