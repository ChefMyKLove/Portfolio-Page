# ChefMyKLove - Splash Portfolio

A beautiful, minimalist splash page for ChefMyKLove's portfolio featuring animated rainbow backgrounds, glassmorphism design, and built-in analytics tracking.

## ✨ Features

- 🌈 **Animated Rainbow Backgrounds** - Smooth cycling through 13 custom artwork images
- 🎨 **Glassmorphism Design** - Modern frosted glass aesthetic with purple glow effects
- 📊 **Built-in Analytics** - Track visits, clicks, time spent, and user engagement
- ⌨️ **Keyboard Shortcuts** - Quick navigation (M for blog, P for Patreon, F for portfolio)
- 📱 **Fully Responsive** - Optimized for mobile, tablet, and desktop
- 🎯 **Clear CTAs** - Direct links to Members Blog and Patreon

## 🗂️ Project Structure

```
new-splash-portfolio/
├── index.html              # Main splash page
├── styles.css              # All styling (glassmorphism + animations)
├── script.js               # Analytics tracking & interactivity
├── images/                 # 13 rainbow background images
│   ├── IMG_1.JPEG
│   └── ...
├── backend/                # Express.js API
│   ├── server.js          # Main server file
│   ├── package.json       # Dependencies
│   ├── .env               # Environment variables (not in git)
│   ├── .env.example       # Template for environment variables
│   ├── routes/
│   │   └── analytics.js   # Analytics endpoints
│   └── db/
│       ├── db.js          # PostgreSQL connection
│       └── migrations/
│           └── analytics.sql  # Database schema
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ 
- PostgreSQL 14+
- 13 background images (IMG_1.JPEG through IMG_13.JPEG)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd new-splash-portfolio

# Install backend dependencies
cd backend
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb chefmyklove_splash
```

Run the migrations:

```bash
# Option 1: Using npm script
npm run setup-db

# Option 2: Manual
psql chefmyklove_splash -f db/migrations/analytics.sql
```

This creates:
- `page_visits` table - Track page visits
- `button_clicks` table - Track button/link clicks  
- `time_tracking` table - Track time spent on pages
- `session_tracking` table - Track user sessions
- Several views for easy analytics queries

### 3. Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
PORT=3002
NODE_ENV=development
FRONTEND_URL=http://localhost:8000
DATABASE_URL=postgresql://postgres:password@localhost:5432/chefmyklove_splash
```

### 4. Add Background Images

Copy your 13 background images into the `images/` folder:

```
images/
├── IMG_1.JPEG
├── IMG_2.JPEG
├── IMG_3.JPEG
...
└── IMG_13.JPEG
```

### 5. Start Development Servers

**Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:3002
```

**Frontend:**
```bash
# From project root
npx http-server -p 8000
# Or use any static file server
# Frontend runs on http://localhost:8000
```

### 6. Open in Browser

Visit: `http://localhost:8000`

You should see:
- ✅ Animated cycling backgrounds
- ✅ Glassmorphism splash card
- ✅ "Members Blog" and "Join Patreon" buttons
- ✅ Footer links

## 📊 Analytics Dashboard

View your analytics:

```bash
# Get comprehensive stats
curl http://localhost:3002/analytics/stats

# Get live activity (last 24 hours)
curl http://localhost:3002/analytics/live

# Check server health
curl http://localhost:3002/health
```

Or query the database directly:

```sql
-- Recent visits
SELECT * FROM page_visits ORDER BY visited_at DESC LIMIT 10;

-- Button click stats
SELECT * FROM popular_buttons;

-- Traffic sources
SELECT * FROM referrer_analysis;

-- Daily statistics
SELECT * FROM daily_visit_stats;
```

## ⌨️ Keyboard Shortcuts

- **M** - Navigate to Members Blog
- **P** - Navigate to Patreon
- **F** - Navigate to Full Portfolio

## 🎨 Customization

### Change Background Animation Speed

In `styles.css`, line 32:

```css
animation: cycleBackgrounds 104s linear infinite;
                          /* ^^^ adjust this value */
```

### Customize Colors

Main gradient (line 143):

```css
.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    /* Change these hex values */
}
```

### Update Links

Edit `index.html`:

```html
<a href="https://your-blog-url.com" class="btn btn-primary">Members Blog</a>
<a href="https://patreon.com/yourname" class="btn btn-secondary">Join Patreon</a>
```

### Modify Button Text

In `index.html`, find the `.button-group` section and update button text.

## 🚢 Production Deployment

### Backend (Railway/Render/Fly.io)

1. Create a PostgreSQL database in your hosting service
2. Update environment variables:

```bash
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@host:port/db
```

3. Deploy backend code
4. Run migrations in production database

### Frontend (Vercel/Netlify/GitHub Pages)

1. Update `script.js` line 6:

```javascript
API_BASE_URL: 'https://your-backend.railway.app',
```

2. Deploy frontend files
3. Verify CORS settings in backend match your frontend domain

### Update Links

Once deployed, update the links in `index.html` to point to your actual URLs:

```html
<a href="https://chefmyklove.com/blog/blook.html">Members Blog</a>
```

## 🔒 Security Notes

⚠️ **Important:** In production, add authentication to these endpoints:

- `GET /analytics/stats` - Should require admin auth
- `DELETE /analytics/clear` - Should require admin auth

Example middleware:

```javascript
// In backend/routes/analytics.js
const requireAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

router.get('/stats', requireAuth, async (req, res) => {
    // ... stats code
});
```

## 📦 API Endpoints

### Analytics

- `POST /analytics/visit` - Track page visit
- `POST /analytics/click` - Track button click
- `POST /analytics/time-spent` - Track time on page
- `GET /analytics/stats` - Get comprehensive statistics
- `GET /analytics/live` - Get real-time activity (24hrs)
- `DELETE /analytics/clear` - Clear old data

### Utility

- `GET /health` - Health check
- `GET /` - API info

## 🧪 Testing

Test the analytics:

```bash
# Track a visit
curl -X POST http://localhost:3002/analytics/visit \
  -H "Content-Type: application/json" \
  -d '{
    "page": "splash",
    "referrer": "https://google.com",
    "userAgent": "Test Browser"
  }'

# Track a click
curl -X POST http://localhost:3002/analytics/click \
  -H "Content-Type: application/json" \
  -d '{
    "button": "Members Blog",
    "page": "splash",
    "destination": "https://chefmyklove.com/blog"
  }'

# Get stats
curl http://localhost:3002/analytics/stats
```

## 🐛 Troubleshooting

### Images not loading

- Check that images are in `images/` folder
- Verify image filenames match exactly: `IMG_1.JPEG` through `IMG_13.JPEG`
- Check browser console for 404 errors

### Database connection failed

- Verify PostgreSQL is running: `pg_isready`
- Check `DATABASE_URL` in `.env`
- Test connection: `psql $DATABASE_URL`

### CORS errors

- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check browser console for specific CORS error messages

### Analytics not working

- Check backend logs: `npm run dev`
- Verify backend is running on correct port
- Check browser console for API errors
- Update `API_BASE_URL` in `script.js` if needed

## 🔄 Future Enhancements

- [ ] Admin dashboard for viewing analytics
- [ ] Email capture form
- [ ] A/B testing capabilities
- [ ] Social media feed integration
- [ ] Visitor heatmaps
- [ ] Real-time visitor counter
- [ ] Export analytics to CSV

## 📝 License

MIT

## 🔗 Links

- **Live Site:** [chefmyklove.com](https://chefmyklove.com)
- **Patreon:** [patreon.com/chefmyklove](https://patreon.com/chefmyklove)
- **Shop:** [ordinalrainbows.printify.me](https://ordinalrainbows.printify.me)

## 💬 Support

For questions or issues, reach out at: contact@chefmyklove.com

---

Made with 💜 by ChefMyKLove