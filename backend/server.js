require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db/db');

const app = express();
const PORT = process.env.PORT || 3002;

// Import routes
const analyticsRoutes = require('./routes/analytics');

// ============================================
// STARTUP VALIDATION
// ============================================

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'FRONTEND_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('\u274c Missing required environment variables:');
    missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease check your .env file.');
    process.exit(1);
}

// Warn about missing optional security variables
if (!process.env.ADMIN_API_KEY) {
    console.warn('\u26a0\ufe0f  ADMIN_API_KEY not set. Protected endpoints will not work.');
    console.warn('   Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
}

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('\u274c Failed to connect to database:', err.message);
        console.error('\nPlease check your DATABASE_URL in .env file.');
        process.exit(1);
    } else {
        console.log('\u2705 Database connection established');
    }
});

// ============================================
// MIDDLEWARE
// ============================================

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL.split(',').map(url => url.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`\u26a0\ufe0f  CORS blocked request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// ============================================
// ROUTES
// ============================================

// Analytics routes
app.use('/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        database: 'connected'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'ChefMyKLove Splash Portfolio API',
        version: '1.0.0',
        endpoints: {
            analytics: {
                visit: 'POST /analytics/visit - Track page visits',
                click: 'POST /analytics/click - Track button clicks',
                timeSpent: 'POST /analytics/time-spent - Track time on page',
                stats: 'GET /analytics/stats - Get analytics statistics (\ud83d\udd12 Admin)',
                live: 'GET /analytics/live - Get live activity (\ud83d\udd12 Admin)',
                clear: 'DELETE /analytics/clear - Clear old data (\ud83d\udd12 Admin)'
            },
            health: 'GET /health - Server health check'
        },
        security: {
            note: 'Protected endpoints require X-API-Key header',
            documentation: 'See README.md for setup instructions'
        }
    });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        path: req.path,
        message: 'The requested endpoint does not exist'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // CORS errors
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            error: 'CORS Error',
            message: 'Origin not allowed'
        });
    }
    
    // Don't leak error details in production
    const errorResponse = {
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    };
    
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }
    
    res.status(err.status || 500).json(errorResponse);
});

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, () => {
    console.log('');
    console.log('\ud83d\ude80 =============================================');
    console.log(`   ChefMyKLove Splash Portfolio API`);
    console.log('   =============================================');
    console.log(`   \ud83c\udf10 Server running on port ${PORT}`);
    console.log(`   \ud83d\udcca Analytics enabled`);
    console.log(`   \ud83d\udd12 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   \ud83d\udd11 API Key protection: ${process.env.ADMIN_API_KEY ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   \u23f0 Started: ${new Date().toISOString()}`);
    console.log('   =============================================');
    console.log('');
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} signal received: closing HTTP server`);
    
    server.close(() => {
        console.log('HTTP server closed');
        
        // Close database pool
        pool.end(() => {
            console.log('Database pool closed');
            process.exit(0);
        });
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        console.error('Forcing shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('\u274c Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\u274c Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});
