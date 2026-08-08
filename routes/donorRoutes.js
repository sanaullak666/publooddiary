const express = require('express');
const router = express.Router();
const DonorController = require('../controllers/donorController');
const { validateDonorRegistration } = require('../middleware/validation');
const { registrationLimiter } = require('../middleware/rateLimiter');

// Donor Registration
router.post('/register', registrationLimiter, validateDonorRegistration, DonorController.register);

// Update Last Donation Date lookup
router.get('/lookup', DonorController.lookupForUpdate);

// Update Last Donation Date submit
router.post('/update-donation-date', registrationLimiter, DonorController.updateDonationDate);

// Public Donor Search
router.get('/search', DonorController.publicSearch);

module.exports = router;
