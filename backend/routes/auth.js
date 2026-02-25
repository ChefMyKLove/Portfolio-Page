/**
 * Authentication Routes - Patreon OAuth 2.0 Flow
 * Handles authentication through Patreon for blog access
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

// ============================================
// ROUTES
// ============================================

/**
 * GET /auth/patreon
 * Initiates Patreon OAuth flow
 * Redirects user to Patreon authorization endpoint
 */
// Debug endpoint — remove after testing
router.get('/debug', (req, res) => {
    const clientId = process.env.PATREON_CLIENT_ID;
    const redirectUri = process.env.PATREON_REDIRECT_URI;
    const frontendUrl = process.env.FRONTEND_URL;
    const authUrl = new URL('https://www.patreon.com/oauth2/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'identity identity.memberships');
    authUrl.searchParams.append('state', 'debugstate');
    res.json({
        clientId_preview: clientId?.substring(0, 12) + '...',
        redirectUri,
        frontendUrl,
        authUrl: authUrl.toString()
    });
});

router.get('/patreon', (req, res) => {
    const clientId = process.env.PATREON_CLIENT_ID;
    const redirectUri = process.env.PATREON_REDIRECT_URI;

    if (!clientId || !redirectUri) {
        return res.status(500).json({
            error: 'Server configuration error',
            message: 'Patreon credentials not configured'
        });
    }

    const authUrl = new URL('https://www.patreon.com/oauth2/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'identity identity.memberships');
    authUrl.searchParams.append('state', Math.random().toString(36).substring(7));

    const finalUrl = authUrl.toString();
    console.log('🔐 Patreon auth URL:', finalUrl);
    console.log('🔐 Client ID:', clientId?.substring(0, 10) + '...');
    console.log('🔐 Redirect URI:', redirectUri);

    res.redirect(finalUrl);
});

/**
 * GET /auth/patreon/callback
 * Handles Patreon OAuth callback
 * Exchanges authorization code for access token
 * Verifies membership and creates session
 */
router.get('/patreon/callback', async (req, res) => {
    console.log('📥 Callback query params:', JSON.stringify(req.query));
    const { code, error } = req.query;

    // Handle user denying access
    if (error) {
        console.log('❌ Patreon returned error:', error, req.query.error_description);
        return res.redirect(`${process.env.FRONTEND_URL}?auth=denied&reason=${encodeURIComponent(error)}`);
    }

    if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL}?auth=error&message=No+authorization+code`);
    }

    try {
        // Exchange code for access token — Patreon requires form-encoded body
        const tokenParams = new URLSearchParams();
        tokenParams.append('client_id', process.env.PATREON_CLIENT_ID);
        tokenParams.append('client_secret', process.env.PATREON_CLIENT_SECRET);
        tokenParams.append('code', code);
        tokenParams.append('grant_type', 'authorization_code');
        tokenParams.append('redirect_uri', process.env.PATREON_REDIRECT_URI);

        const tokenResponse = await axios.post('https://www.patreon.com/api/oauth2/token', tokenParams, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenResponse.data.access_token;

        // Fetch user data from Patreon API
        const userResponse = await axios.get('https://www.patreon.com/api/oauth2/v2/identity', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            params: {
                'include': 'memberships',
                'fields[user]': 'full_name,vanity',
                'fields[member]': 'patron_status,currently_entitled_amount_cents,pledge_relationship_start'
            }
        });
        console.log('👤 Identity response:', JSON.stringify(userResponse.data, null, 2));

        const user = userResponse.data.data;
        const memberships = userResponse.data.included || [];

        // Verify if user is an active patron
        // Check for at least one active membership with non-zero pledge
        console.log('🎭 Memberships found:', memberships.length);
        memberships.forEach(m => console.log(' -', m.type, JSON.stringify(m.attributes)));

        const isPatron = memberships.some(membership => 
            membership.type === 'member' &&
            membership.attributes.patron_status === 'active_patron'
        );

        if (!isPatron) {
            return res.redirect(`${process.env.FRONTEND_URL}?auth=notpatron`);
        }

        // Store user session
        req.session.user = {
            id: user.id,
            fullName: user.attributes.full_name,
            isPatron: true,
            accessToken: accessToken,
            authenticatedAt: new Date().toISOString()
        };

        console.log(`✅ Patreon auth successful: ${user.attributes.full_name} (${user.id})`);

        // Redirect to blog with token
        res.redirect(`${process.env.FRONTEND_URL}/blog/blook.html?patron=true&token=${Buffer.from(JSON.stringify(req.session.user)).toString('base64')}`);

    } catch (error) {
        console.error('❌ Patreon auth error:', error.response?.data || error.message);
        
        const errorMessage = error.response?.data?.error_description || error.message;
        res.redirect(`${process.env.FRONTEND_URL}?auth=error&message=${encodeURIComponent(errorMessage)}`);
    }
});

/**
 * GET /auth/verify
 * Verifies current session status
 * Returns user data and patron status
 */
router.get('/verify', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({
            authenticated: true,
            user: req.session.user,
            isPatron: req.session.user.isPatron
        });
    }

    res.json({
        authenticated: false,
        isPatron: false
    });
});

/**
 * GET /auth/logout
 * Destroys session and logs out user
 */
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
        }
        res.redirect(process.env.FRONTEND_URL);
    });
});

module.exports = router;
