/**
 * Rate Limiting Middleware
 * Prevents abuse and spam of analytics endpoints
 */

// Simple in-memory rate limiter
// For production, consider using Redis for distributed rate limiting
const rateLimitStore = new Map();

/**
 * Creates a rate limiter with specified options
 * @param {Object} options - Rate limit configuration
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.message - Error message when limit exceeded
 */
const createRateLimiter = (options = {}) => {
    const {
        windowMs = 60 * 1000, // 1 minute default
        max = 100, // 100 requests per window default
        message = 'Too many requests, please try again later'
    } = options;

    return (req, res, next) => {
        // Get identifier (IP address)
        const identifier = req.headers['x-forwarded-for']?.split(',')[0] || 
                          req.connection.remoteAddress || 
                          req.socket.remoteAddress ||
                          'unknown';

        const now = Date.now();
        const key = `${identifier}:${req.path}`;

        // Get or create rate limit data
        let limitData = rateLimitStore.get(key);

        if (!limitData || now - limitData.resetTime > windowMs) {
            // Create new window
            limitData = {
                count: 0,
                resetTime: now
            };
        }

        // Increment request count
        limitData.count++;
        rateLimitStore.set(key, limitData);

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - limitData.count));
        res.setHeader('X-RateLimit-Reset', new Date(limitData.resetTime + windowMs).toISOString());

        // Check if limit exceeded
        if (limitData.count > max) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message,
                retryAfter: Math.ceil((limitData.resetTime + windowMs - now) / 1000)
            });
        }

        next();
    };
};

/**
 * Cleanup old entries periodically
 * Run this on a timer to prevent memory leaks
 */
const cleanupRateLimitStore = () => {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [key, data] of rateLimitStore.entries()) {
        if (now - data.resetTime > maxAge) {
            rateLimitStore.delete(key);
        }
    }
};

// Run cleanup every 15 minutes
setInterval(cleanupRateLimitStore, 15 * 60 * 1000);

// Preset rate limiters for different use cases
const analyticsRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute (1 per second)
    message: 'Too many analytics events. Please slow down.'
});

const statsRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Too many stats requests. Please try again later.'
});

const strictRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    message: 'This action is rate limited. Please try again later.'
});

module.exports = {
    createRateLimiter,
    analyticsRateLimiter,
    statsRateLimiter,
    strictRateLimiter
};
