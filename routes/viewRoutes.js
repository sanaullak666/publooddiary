const express = require('express');
const path = require('path');
const router = express.Router();
const { requireAdmin } = require('../middleware/authMiddleware');

const viewsDir = path.join(__dirname, '..', 'views');

router.get('/', (req, res) => {
  res.sendFile(path.join(viewsDir, 'index.html'));
});

router.get('/register', (req, res) => {
  res.sendFile(path.join(viewsDir, 'register.html'));
});

router.get('/update-donation', (req, res) => {
  res.sendFile(path.join(viewsDir, 'update-donation.html'));
});

router.get('/search', (req, res) => {
  res.sendFile(path.join(viewsDir, 'search.html'));
});

router.get('/admin/login', (req, res) => {
  if (req.session && req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  res.sendFile(path.join(viewsDir, 'admin-login.html'));
});

router.get('/admin/dashboard', requireAdmin, (req, res) => {
  res.sendFile(path.join(viewsDir, 'admin-dashboard.html'));
});

module.exports = router;
