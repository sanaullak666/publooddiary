const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');

// Admin Auth Routes
router.post('/login', loginLimiter, AdminController.login);
router.post('/logout', AdminController.logout);
router.get('/session', AdminController.getSessionStatus);

// Admin Donor Management (Protected)
router.get('/donors', requireAdmin, AdminController.getDonors);
router.post('/donors', requireAdmin, AdminController.createDonor);
router.get('/donors/:id', requireAdmin, AdminController.getDonorById);
router.put('/donors/:id', requireAdmin, AdminController.updateDonor);
router.delete('/donors/:id', requireAdmin, AdminController.deleteDonor);

// Admin Export & Activity Logs (Protected)
router.get('/export', requireAdmin, AdminController.exportDonors);
router.get('/logs', requireAdmin, AdminController.getActivityLogs);

module.exports = router;
