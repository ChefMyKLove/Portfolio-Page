const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Allow extra time for Railway cold starts
});

// Test database connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

// Export query method for easy use
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};

// Test connection on startup
(async () => {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('🕒 Database time:', result.rows[0].now);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
})();