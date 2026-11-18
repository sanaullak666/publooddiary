const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { requireAdmin } = require('../middleware/authMiddleware');

function sendView(res, filename) {
  const possiblePaths = [
    path.join(__dirname, '..', 'views', filename),
    path.join(process.cwd(), 'views', filename)
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return res.sendFile(p);
    }
  }
  return res.status(404).send('View file not found');
}

router.get('/', (req, res) => {
  sendView(res, 'index.html');
});

router.get('/register', (req, res) => {
  sendView(res, 'register.html');
});

router.get('/update-donation', (req, res) => {
  sendView(res, 'update-donation.html');
});

router.get('/search', (req, res) => {
  sendView(res, 'search.html');
});

// Admin Login Route
router.get('/adminLogin', (req, res) => {
  if (req.session && req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  sendView(res, 'admin-login.html');
});

// Admin Dashboard Route (Requires Authentication)
router.get('/admin/dashboard', requireAdmin, (req, res) => {
  sendView(res, 'admin-dashboard.html');
});

// Explicitly show 404 Not Found whenever someone accesses /admin or /admin/login
router.get(['/admin', '/admin/', '/admin/login'], (req, res) => {
  res.status(404);
  sendView(res, '404.html');
});

// 404 Not Found Route
router.get('/404', (req, res) => {
  res.status(404);
  sendView(res, '404.html');
});

router.get(['/favicon.ico', '/favicon.png'], (req, res) => {
  const possibleFavicons = [
    path.join(__dirname, '..', 'public', 'images', 'nsslogo.jpg'),
    path.join(process.cwd(), 'public', 'images', 'nsslogo.jpg')
  ];
  for (const p of possibleFavicons) {
    if (fs.existsSync(p)) return res.sendFile(p);
  }
  return res.status(204).end();
});

module.exports = router;
