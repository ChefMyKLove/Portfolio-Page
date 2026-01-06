require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Import routes
const analyticsRoutes = require('./routes/analytics');

// ============================================
// MIDDLEWARE
// ============================================

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'ChefMyKLove Splash Portfolio API',
        version: '1.0.0',
        endpoints: {
            analytics: {
                visit: 'POST /analytics/visit',
                click: 'POST /analytics/click',
                timeSpent: 'POST /analytics/time-spent',
                stats: 'GET /analytics/stats',
                live: 'GET /analytics/live',
                clear: 'DELETE /analytics/clear'
            },
            health: 'GET /health'
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

app.listen(PORT, () => {
    console.log('');
    console.log('🚀 =============================================');
    console.log(`   ChefMyKLove Splash Portfolio API`);
    console.log('   =============================================');
    console.log(`   🌐 Server running on port ${PORT}`);
    console.log(`   📊 Analytics enabled`);
    console.log(`   🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   ⏰ Started: ${new Date().toISOString()}`);
    console.log('   =============================================');
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});