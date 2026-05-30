const xss = require('xss');
const sanitize = require('mongo-sanitize');

/**
 * Middleware to sanitize request payload against XSS and NoSQL injection
 */
const sanitizeRequest = (req, res, next) => {
    try {
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        if (req.params) {
            req.params = sanitizeObject(req.params);
        }
        next();
    } catch (err) {
        console.error('Sanitization Error:', err);
        res.status(400).json({ success: false, message: 'Invalid payload structure' });
    }
};

const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
        // Strip out XSS and remove NoSQL injection operators
        const cleanString = xss(obj.trim());
        return sanitize(cleanString);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
        const cleanObj = {};
        for (const key in obj) {
            // Prevent NoSQL injection through keys (e.g. $gt, $where)
            if (key.startsWith('$')) continue; 
            
            cleanObj[key] = sanitizeObject(obj[key]);
        }
        return cleanObj;
    }
    
    return obj;
};

module.exports = sanitizeRequest;
