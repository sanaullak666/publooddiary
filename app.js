const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const viewRoutes = require('./routes/viewRoutes');
const donorRoutes = require('./routes/donorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { apiLimiter } = require('./middleware/rateLimiter');
const { statelessSessionMiddleware } = require('./middleware/statelessSession');

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

// Stateless Session Middleware (Vercel Serverless Compatible)
app.use(statelessSessionMiddleware);

// Serve static assets from public/
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(process.cwd(), 'public')));

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
  const indexPath = path.join(__dirname, 'views', 'index.html');
  const altIndexPath = path.join(process.cwd(), 'views', 'index.html');
  if (require('fs').existsSync(indexPath)) {
    return res.status(404).sendFile(indexPath);
  }
  return res.status(404).sendFile(altIndexPath);
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
