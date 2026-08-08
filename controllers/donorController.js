const DonorModel = require('../models/donorModel');
const { validateDonorData } = require('../utils/validator');

const DonorController = {
  async register(req, res) {
    try {
      const validation = validateDonorData(req.body, { isPublic: true });
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.errors.join(' ')
        });
      }

      const { register_number, email } = req.body;

      // Check duplicates
      const dupCheck = await DonorModel.checkDuplicates(register_number, email);
      if (dupCheck.duplicate) {
        const fieldName = dupCheck.field === 'register_number' ? 'University Register Number' : 'Email Address';
        return res.status(409).json({
          success: false,
          message: `A donor with this ${fieldName} is already registered.`
        });
      }

      const donorId = await DonorModel.create(req.body);

      return res.status(201).json({
        success: true,
        message: 'Registration Successful. Thank you for registering with PU Blood Diary.',
        donorId
      });
    } catch (err) {
      console.error('[DonorController.register] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'An internal server error occurred while registering. Please try again.'
      });
    }
  },

  async lookupForUpdate(req, res) {
    try {
      const { identifier } = req.query;
      if (!identifier || identifier.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Please provide either University Register Number or Email Address.'
        });
      }

      const donor = await DonorModel.findByRegisterNumberOrEmail(identifier);
      if (!donor) {
        return res.status(404).json({
          success: false,
          message: 'No registered donor found with the provided Register Number or Email.'
        });
      }

      // Return ONLY non-editable display fields
      return res.json({
        success: true,
        donor: {
          name: donor.name,
          blood_group: donor.blood_group,
          department: donor.department,
          last_donated_date: donor.last_donated_date,
          register_number: donor.register_number,
          email: donor.email
        }
      });
    } catch (err) {
      console.error('[DonorController.lookupForUpdate] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error looking up donor record.'
      });
    }
  },

  async updateDonationDate(req, res) {
    try {
      const { identifier, new_donation_date } = req.body;
      if (!identifier || !new_donation_date) {
        return res.status(400).json({
          success: false,
          message: 'Identifier and new donation date are required.'
        });
      }

      // Date check
      const inputDate = new Date(new_donation_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (isNaN(inputDate.getTime()) || inputDate > today) {
        return res.status(400).json({
          success: false,
          message: 'New donation date cannot be in the future.'
        });
      }

      const updated = await DonorModel.updateLastDonationDate(identifier, new_donation_date);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Donor record not found or update failed.'
        });
      }

      return res.json({
        success: true,
        message: 'Last blood donation date updated successfully.'
      });
    } catch (err) {
      console.error('[DonorController.updateDonationDate] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error updating donation date.'
      });
    }
  },

  async publicSearch(req, res) {
    try {
      const donors = await DonorModel.publicSearch(req.query);
      return res.json({
        success: true,
        count: donors.length,
        donors
      });
    } catch (err) {
      console.error('[DonorController.publicSearch] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching blood donor search results.'
      });
    }
  }
};

module.exports = DonorController;
