const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const viewRoutes = require('./routes/viewRoutes');
const donorRoutes = require('./routes/donorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Enable Trust Proxy for Vercel / Reverse Proxy (Fixes express-rate-limit and secure sessions)
app.set('trust proxy', 1);

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"]
      }
    }
  })
);

// CORS configuration
app.use(cors());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session Configuration
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'pu_blood_directory_nss_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Serve static assets from public/
app.use(express.static(path.join(__dirname, 'public')));

// Global API rate limit
app.use('/api/', apiLimiter);

// Mount API Routes
app.use('/api/donors', donorRoutes);
app.use('/api/admin', adminRoutes);

// Mount View Routes
app.use('/', viewRoutes);

// 404 Handler
app.use((req, res) => {
  if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
  }
  res.status(404).sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[App Error]', err.stack || err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.'
  });
});

module.exports = app;
