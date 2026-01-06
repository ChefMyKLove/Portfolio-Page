-- ============================================
-- ANALYTICS DATABASE SCHEMA
-- ChefMyKLove Splash Portfolio
-- ============================================

-- Drop existing tables if they exist (be careful in production!)
-- DROP TABLE IF EXISTS time_tracking CASCADE;
-- DROP TABLE IF EXISTS button_clicks CASCADE;
-- DROP TABLE IF EXISTS page_visits CASCADE;
-- DROP TABLE IF EXISTS session_tracking CASCADE;

-- ============================================
-- TABLE: page_visits
-- Tracks every visit to portfolio pages
-- ============================================
CREATE TABLE IF NOT EXISTS page_visits (
    id SERIAL PRIMARY KEY,
    page VARCHAR(100) NOT NULL,
    referrer VARCHAR(500),
    user_agent TEXT,
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    screen_width INTEGER,
    screen_height INTEGER,
    
    -- Indexes for better query performance
    CONSTRAINT valid_page CHECK (page IN ('splash', 'blog', 'portfolio', 'shop'))
);

CREATE INDEX IF NOT EXISTS idx_page_visits_page ON page_visits(page);
CREATE INDEX IF NOT EXISTS idx_page_visits_visited_at ON page_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_page_visits_referrer ON page_visits(referrer);
CREATE INDEX IF NOT EXISTS idx_page_visits_ip ON page_visits(ip_address);

-- ============================================
-- TABLE: button_clicks
-- Tracks which buttons/links users click
-- ============================================
CREATE TABLE IF NOT EXISTS button_clicks (
    id SERIAL PRIMARY KEY,
    button_name VARCHAR(100) NOT NULL,
    page VARCHAR(100) NOT NULL,
    destination VARCHAR(500),
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_button_clicks_button ON button_clicks(button_name);
CREATE INDEX IF NOT EXISTS idx_button_clicks_clicked_at ON button_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_button_clicks_page ON button_clicks(page);

-- ============================================
-- TABLE: time_tracking
-- Tracks how long users spend on pages
-- ============================================
CREATE TABLE IF NOT EXISTS time_tracking (
    id SERIAL PRIMARY KEY,
    page VARCHAR(100) NOT NULL,
    time_spent_seconds INTEGER NOT NULL,
    tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_time_spent CHECK (time_spent_seconds >= 0 AND time_spent_seconds <= 86400)
);

CREATE INDEX IF NOT EXISTS idx_time_tracking_page ON time_tracking(page);
CREATE INDEX IF NOT EXISTS idx_time_tracking_tracked_at ON time_tracking(tracked_at);

-- ============================================
-- TABLE: session_tracking (optional)
-- Tracks user sessions for detailed analytics
-- ============================================
CREATE TABLE IF NOT EXISTS session_tracking (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    first_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_page_views INTEGER DEFAULT 1,
    referrer VARCHAR(500),
    ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_session_tracking_session_id ON session_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_session_tracking_first_visit ON session_tracking(first_visit);

-- ============================================
-- VIEW: daily_visit_stats
-- Aggregated daily visit statistics
-- ============================================
CREATE OR REPLACE VIEW daily_visit_stats AS
SELECT 
    DATE(visited_at) as visit_date,
    page,
    COUNT(*) as total_visits,
    COUNT(DISTINCT ip_address) as unique_visitors,
    AVG(screen_width) as avg_screen_width,
    COUNT(CASE WHEN user_agent LIKE '%Mobile%' THEN 1 END) as mobile_visits,
    COUNT(CASE WHEN user_agent LIKE '%Desktop%' OR user_agent NOT LIKE '%Mobile%' THEN 1 END) as desktop_visits
FROM page_visits
GROUP BY DATE(visited_at), page
ORDER BY visit_date DESC;

-- ============================================
-- VIEW: popular_buttons
-- Most clicked buttons and links
-- ============================================
CREATE OR REPLACE VIEW popular_buttons AS
SELECT 
    button_name,
    page,
    destination,
    COUNT(*) as total_clicks,
    DATE(MAX(clicked_at)) as last_clicked,
    DATE(MIN(clicked_at)) as first_clicked
FROM button_clicks
GROUP BY button_name, page, destination
ORDER BY total_clicks DESC;

-- ============================================
-- VIEW: referrer_analysis
-- Traffic source breakdown
-- ============================================
CREATE OR REPLACE VIEW referrer_analysis AS
SELECT 
    CASE 
        WHEN referrer = 'direct' THEN 'Direct Traffic'
        WHEN referrer LIKE '%google%' THEN 'Google'
        WHEN referrer LIKE '%patreon%' THEN 'Patreon'
        WHEN referrer LIKE '%twitter%' OR referrer LIKE '%x.com%' THEN 'Twitter/X'
        WHEN referrer LIKE '%facebook%' THEN 'Facebook'
        WHEN referrer LIKE '%instagram%' THEN 'Instagram'
        WHEN referrer LIKE '%reddit%' THEN 'Reddit'
        WHEN referrer LIKE '%youtube%' THEN 'YouTube'
        ELSE 'Other'
    END as source,
    COUNT(*) as visits,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage,
    COUNT(DISTINCT ip_address) as unique_visitors
FROM page_visits
GROUP BY source
ORDER BY visits DESC;

-- ============================================
-- VIEW: hourly_traffic
-- Traffic patterns by hour of day
-- ============================================
CREATE OR REPLACE VIEW hourly_traffic AS
SELECT 
    EXTRACT(HOUR FROM visited_at) as hour_of_day,
    COUNT(*) as visits,
    COUNT(DISTINCT ip_address) as unique_visitors,
    ROUND(AVG(screen_width)) as avg_screen_width
FROM page_visits
WHERE visited_at >= NOW() - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM visited_at)
ORDER BY hour_of_day;

-- ============================================
-- VIEW: engagement_metrics
-- Combined engagement statistics
-- ============================================
CREATE OR REPLACE VIEW engagement_metrics AS
SELECT 
    pv.page,
    COUNT(DISTINCT pv.id) as total_visits,
    COUNT(DISTINCT pv.ip_address) as unique_visitors,
    COUNT(bc.id) as total_clicks,
    ROUND(AVG(tt.time_spent_seconds), 2) as avg_time_spent,
    ROUND(COUNT(bc.id)::NUMERIC / COUNT(DISTINCT pv.id), 2) as clicks_per_visit
FROM page_visits pv
LEFT JOIN button_clicks bc ON pv.page = bc.page 
    AND DATE(pv.visited_at) = DATE(bc.clicked_at)
LEFT JOIN time_tracking tt ON pv.page = tt.page
    AND DATE(pv.visited_at) = DATE(tt.tracked_at)
GROUP BY pv.page;

-- ============================================
-- FUNCTION: get_conversion_rate
-- Calculate conversion rate (visits to clicks)
-- ============================================
CREATE OR REPLACE FUNCTION get_conversion_rate(
    target_button VARCHAR(100),
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    date DATE,
    visits BIGINT,
    clicks BIGINT,
    conversion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(pv.visited_at) as date,
        COUNT(DISTINCT pv.id) as visits,
        COUNT(bc.id) as clicks,
        ROUND(
            (COUNT(bc.id)::NUMERIC / NULLIF(COUNT(DISTINCT pv.id), 0)) * 100, 
            2
        ) as conversion_rate
    FROM page_visits pv
    LEFT JOIN button_clicks bc 
        ON DATE(pv.visited_at) = DATE(bc.clicked_at)
        AND bc.button_name = target_button
    WHERE pv.visited_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY DATE(pv.visited_at)
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================
COMMENT ON TABLE page_visits IS 'Tracks all page visits with detailed metadata including referrer, device info, and screen resolution';
COMMENT ON TABLE button_clicks IS 'Tracks user interactions with buttons and links, including destination URLs';
COMMENT ON TABLE time_tracking IS 'Tracks how long users spend on each page (in seconds)';
COMMENT ON TABLE session_tracking IS 'Tracks complete user sessions across multiple page views';
COMMENT ON VIEW daily_visit_stats IS 'Aggregated daily visit statistics broken down by page';
COMMENT ON VIEW popular_buttons IS 'Most clicked buttons and links across the entire site';
COMMENT ON VIEW referrer_analysis IS 'Traffic source breakdown with percentages';
COMMENT ON VIEW hourly_traffic IS 'Traffic patterns by hour of day (last 7 days)';
COMMENT ON VIEW engagement_metrics IS 'Combined engagement statistics including clicks per visit';

-- ============================================
-- PERMISSIONS (Adjust as needed for your setup)
-- ============================================
-- Example: Grant appropriate permissions to your application user
-- GRANT SELECT, INSERT ON page_visits TO splash_app_user;
-- GRANT SELECT, INSERT ON button_clicks TO splash_app_user;
-- GRANT SELECT, INSERT, UPDATE ON session_tracking TO splash_app_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO splash_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO splash_app_user;

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================
-- Uncomment to insert sample data

-- INSERT INTO page_visits (page, referrer, user_agent) VALUES
-- ('splash', 'direct', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
-- ('splash', 'https://google.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)'),
-- ('splash', 'https://patreon.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)');

-- INSERT INTO button_clicks (button_name, page, destination) VALUES
-- ('Members Blog', 'splash', 'https://chefmyklove.com/blog'),
-- ('Join Patreon', 'splash', 'https://patreon.com/chefmyklove'),
-- ('Shop Art', 'splash', 'https://ordinalrainbows.printify.me/');

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Clean up old data (older than 90 days)
-- DELETE FROM page_visits WHERE visited_at < NOW() - INTERVAL '90 days';
-- DELETE FROM button_clicks WHERE clicked_at < NOW() - INTERVAL '90 days';
-- DELETE FROM time_tracking WHERE tracked_at < NOW() - INTERVAL '90 days';

-- Get database size
-- SELECT pg_size_pretty(pg_total_relation_size('page_visits')) as page_visits_size;

-- Vacuum and analyze for performance
-- VACUUM ANALYZE page_visits;
-- VACUUM ANALYZE button_clicks;