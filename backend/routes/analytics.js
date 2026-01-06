const express = require('express');
const router = express.Router();
const pool = require('../db/db');

/**
 * POST /analytics/visit
 * Track page visits with detailed metadata
 */
router.post('/visit', async (req, res) => {
    try {
        const { 
            page, 
            referrer, 
            userAgent, 
            timestamp,
            screenWidth,
            screenHeight 
        } = req.body;

        // Get IP address (behind proxy support)
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                         req.connection.remoteAddress || 
                         req.socket.remoteAddress;

        const query = `
            INSERT INTO page_visits (
                page, 
                referrer, 
                user_agent, 
                visited_at,
                ip_address,
                screen_width,
                screen_height
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, visited_at
        `;

        const result = await pool.query(query, [
            page,
            referrer || 'direct',
            userAgent,
            timestamp || new Date().toISOString(),
            ipAddress,
            screenWidth || null,
            screenHeight || null
        ]);

        res.status(201).json({
            success: true,
            visitId: result.rows[0].id,
            timestamp: result.rows[0].visited_at
        });
    } catch (error) {
        console.error('Error tracking visit:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track visit'
        });
    }
});

/**
 * POST /analytics/click
 * Track button/link clicks with destination
 */
router.post('/click', async (req, res) => {
    try {
        const { button, page, destination, timestamp } = req.body;

        const query = `
            INSERT INTO button_clicks (
                button_name, 
                page, 
                destination,
                clicked_at
            )
            VALUES ($1, $2, $3, $4)
            RETURNING id, clicked_at
        `;

        const result = await pool.query(query, [
            button,
            page,
            destination || null,
            timestamp || new Date().toISOString()
        ]);

        res.status(201).json({
            success: true,
            clickId: result.rows[0].id,
            timestamp: result.rows[0].clicked_at
        });
    } catch (error) {
        console.error('Error tracking click:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track click'
        });
    }
});

/**
 * POST /analytics/time-spent
 * Track how long users spend on page
 */
router.post('/time-spent', async (req, res) => {
    try {
        const { page, timeSpent, timestamp } = req.body;

        const query = `
            INSERT INTO time_tracking (
                page,
                time_spent_seconds,
                tracked_at
            )
            VALUES ($1, $2, $3)
            RETURNING id
        `;

        const result = await pool.query(query, [
            page,
            timeSpent,
            timestamp || new Date().toISOString()
        ]);

        res.status(201).json({
            success: true,
            trackingId: result.rows[0].id
        });
    } catch (error) {
        console.error('Error tracking time spent:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track time spent'
        });
    }
});

/**
 * GET /analytics/stats
 * Get comprehensive analytics statistics
 * NOTE: Add authentication middleware in production!
 */
router.get('/stats', async (req, res) => {
    try {
        // Total visits
        const totalVisitsQuery = `
            SELECT 
                COUNT(*) as total_visits,
                COUNT(DISTINCT DATE(visited_at)) as unique_days,
                COUNT(DISTINCT ip_address) as unique_visitors
            FROM page_visits
        `;
        const totalVisits = await pool.query(totalVisitsQuery);

        // Visits by page
        const pageVisitsQuery = `
            SELECT 
                page, 
                COUNT(*) as visits,
                COUNT(DISTINCT ip_address) as unique_visitors
            FROM page_visits
            GROUP BY page
            ORDER BY visits DESC
        `;
        const pageVisits = await pool.query(pageVisitsQuery);

        // Top referrers
        const referrersQuery = `
            SELECT 
                CASE 
                    WHEN referrer = 'direct' THEN 'Direct Traffic'
                    WHEN referrer LIKE '%google%' THEN 'Google'
                    WHEN referrer LIKE '%patreon%' THEN 'Patreon'
                    WHEN referrer LIKE '%twitter%' OR referrer LIKE '%x.com%' THEN 'Twitter/X'
                    WHEN referrer LIKE '%facebook%' THEN 'Facebook'
                    WHEN referrer LIKE '%instagram%' THEN 'Instagram'
                    ELSE referrer
                END as source,
                COUNT(*) as count
            FROM page_visits
            GROUP BY source
            ORDER BY count DESC
            LIMIT 10
        `;
        const referrers = await pool.query(referrersQuery);

        // Button clicks
        const clicksQuery = `
            SELECT 
                button_name, 
                destination,
                COUNT(*) as clicks
            FROM button_clicks
            GROUP BY button_name, destination
            ORDER BY clicks DESC
        `;
        const clicks = await pool.query(clicksQuery);

        // Recent activity (last 30 days)
        const recentActivityQuery = `
            SELECT 
                DATE(visited_at) as date, 
                COUNT(*) as visits,
                COUNT(DISTINCT ip_address) as unique_visitors
            FROM page_visits
            WHERE visited_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(visited_at)
            ORDER BY date DESC
        `;
        const recentActivity = await pool.query(recentActivityQuery);

        // Average time spent
        const avgTimeQuery = `
            SELECT 
                page,
                AVG(time_spent_seconds) as avg_seconds,
                MIN(time_spent_seconds) as min_seconds,
                MAX(time_spent_seconds) as max_seconds
            FROM time_tracking
            GROUP BY page
        `;
        const avgTime = await pool.query(avgTimeQuery);

        // Browser/device stats
        const deviceQuery = `
            SELECT 
                CASE 
                    WHEN user_agent LIKE '%Mobile%' THEN 'Mobile'
                    WHEN user_agent LIKE '%Tablet%' THEN 'Tablet'
                    ELSE 'Desktop'
                END as device_type,
                COUNT(*) as count
            FROM page_visits
            GROUP BY device_type
        `;
        const devices = await pool.query(deviceQuery);

        res.json({
            success: true,
            stats: {
                overview: {
                    totalVisits: parseInt(totalVisits.rows[0].total_visits),
                    uniqueDays: parseInt(totalVisits.rows[0].unique_days),
                    uniqueVisitors: parseInt(totalVisits.rows[0].unique_visitors)
                },
                visitsByPage: pageVisits.rows,
                topReferrers: referrers.rows,
                buttonClicks: clicks.rows,
                recentActivity: recentActivity.rows,
                avgTimeSpent: avgTime.rows,
                deviceBreakdown: devices.rows,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

/**
 * GET /analytics/live
 * Get real-time analytics (last 24 hours)
 */
router.get('/live', async (req, res) => {
    try {
        const liveQuery = `
            SELECT 
                page,
                referrer,
                visited_at,
                EXTRACT(EPOCH FROM (NOW() - visited_at)) as seconds_ago
            FROM page_visits
            WHERE visited_at >= NOW() - INTERVAL '24 hours'
            ORDER BY visited_at DESC
            LIMIT 50
        `;
        
        const result = await pool.query(liveQuery);
        
        res.json({
            success: true,
            liveVisits: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching live analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch live analytics'
        });
    }
});

/**
 * DELETE /analytics/clear
 * Clear old analytics data (older than specified days)
 * NOTE: Add authentication middleware in production!
 */
router.delete('/clear', async (req, res) => {
    try {
        const { olderThanDays = 90 } = req.body;
        
        const queries = [
            `DELETE FROM page_visits WHERE visited_at < NOW() - INTERVAL '${olderThanDays} days'`,
            `DELETE FROM button_clicks WHERE clicked_at < NOW() - INTERVAL '${olderThanDays} days'`,
            `DELETE FROM time_tracking WHERE tracked_at < NOW() - INTERVAL '${olderThanDays} days'`
        ];
        
        let totalDeleted = 0;
        for (const query of queries) {
            const result = await pool.query(query);
            totalDeleted += result.rowCount;
        }
        
        res.json({
            success: true,
            deletedRecords: totalDeleted,
            olderThanDays
        });
    } catch (error) {
        console.error('Error clearing old data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear old data'
        });
    }
});

module.exports = router;