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
    authUrl.searchParams.append('scope', 'identity identity.email campaigns.members campaigns.members.address');
    authUrl.searchParams.append('state', Math.random().toString(36).substring(7));

    res.redirect(authUrl.toString());
});

/**
 * GET /auth/patreon/callback
 * Handles Patreon OAuth callback
 * Exchanges authorization code for access token
 * Verifies membership and creates session
 */
router.get('/patreon/callback', async (req, res) => {
    const { code, error } = req.query;

    // Handle user denying access
    if (error) {
        return res.redirect(`${process.env.FRONTEND_URL}?auth=denied`);
    }

    if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL}?auth=error&message=No+authorization+code`);
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://www.patreon.com/api/oauth2/token', {
            client_id: process.env.PATREON_CLIENT_ID,
            client_secret: process.env.PATREON_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: process.env.PATREON_REDIRECT_URI,
            scope: 'identity identity.email campaigns.members campaigns.members.address'
        });

        const accessToken = tokenResponse.data.access_token;

        // Fetch user data from Patreon API
        const userResponse = await axios.get('https://www.patreon.com/api/oauth2/v2/identity', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            params: {
                'include': 'memberships',
                'fields[user]': 'email,first_name,last_name,full_name,social_connections',
                'fields[member]': 'currently_entitled_amount_cents,pledge_relationship_start,status'
            }
        });

        const user = userResponse.data.data;
        const memberships = userResponse.data.included || [];

        // Verify if user is an active patron
        // Check for at least one active membership with non-zero pledge
        const isPatron = memberships.some(membership => 
            membership.type === 'member' &&
            membership.attributes.status === 'active_patron' &&
            membership.attributes.currently_entitled_amount_cents > 0
        );

        if (!isPatron) {
            return res.redirect(`${process.env.FRONTEND_URL}?auth=notpatron`);
        }

        // Store user session
        req.session.user = {
            id: user.id,
            email: user.attributes.email,
            firstName: user.attributes.first_name,
            lastName: user.attributes.last_name,
            fullName: user.attributes.full_name,
            isPatron: true,
            accessToken: accessToken,
            authenticatedAt: new Date().toISOString()
        };

        console.log(`✅ Patreon auth successful: ${user.attributes.email}`);

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
