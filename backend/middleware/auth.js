/**
 * Authentication Middleware
 * Protects analytics endpoints from unauthorized access
 */

const authenticateAdmin = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.ADMIN_API_KEY;

    // Check if API key is configured
    if (!validApiKey) {
        console.error('⚠️  ADMIN_API_KEY not configured in environment variables');
        return res.status(500).json({
            success: false,
            error: 'Server configuration error'
        });
    }

    // Check if API key is provided
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'API key required',
            message: 'Please provide X-API-Key header'
        });
    }

    // Validate API key
    if (apiKey !== validApiKey) {
        return res.status(403).json({
            success: false,
            error: 'Invalid API key',
            message: 'The provided API key is not valid'
        });
    }

    // API key is valid, proceed
    next();
};

/**
 * Optional: Track API key usage for security monitoring
 */
const logApiAccess = (req, res, next) => {
    if (req.headers['x-api-key']) {
        console.log(`[API Access] ${req.method} ${req.path} - ${new Date().toISOString()}`);
    }
    next();
};

module.exports = {
    authenticateAdmin,
    logApiAccess
};
