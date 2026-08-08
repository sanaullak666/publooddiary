const bcrypt = require('bcryptjs');
const AdminModel = require('../models/adminModel');
const DonorModel = require('../models/donorModel');
const LogModel = require('../models/logModel');
const { generateCSV } = require('../utils/exportHelper');
const { validateDonorData } = require('../utils/validator');

const AdminController = {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const clientIp = req.ip || req.socket.remoteAddress;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and Password are required.'
        });
      }

      const admin = await AdminModel.findByUsername(username.trim());
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid administrator credentials.'
        });
      }

      const passwordMatch = await bcrypt.compare(password, admin.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid administrator credentials.'
        });
      }

      // Set session
      req.session.admin = {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role
      };

      await LogModel.addLog(admin.username, 'Admin Login', `Administrator logged in from IP ${clientIp}`, clientIp);

      return res.json({
        success: true,
        message: 'Login successful. Redirecting to Admin Dashboard...',
        admin: {
          username: admin.username,
          name: admin.name,
          role: admin.role
        }
      });
    } catch (err) {
      console.error('[AdminController.login] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error during admin login.'
      });
    }
  },

  async logout(req, res) {
    try {
      const adminUsername = req.session?.admin?.username || 'admin';
      const clientIp = req.ip || req.socket.remoteAddress;

      req.session.destroy(async (err) => {
        if (err) {
          console.error('[AdminController.logout] Session destruction error:', err);
        }
        await LogModel.addLog(adminUsername, 'Admin Logout', 'Administrator logged out', clientIp);
        res.clearCookie('connect.sid');
        return res.json({
          success: true,
          message: 'Logged out successfully.'
        });
      });
    } catch (err) {
      console.error('[AdminController.logout] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error during logout.'
      });
    }
  },

  async getDonors(req, res) {
    try {
      const data = await DonorModel.findAll(req.query);
      return res.json({
        success: true,
        ...data
      });
    } catch (err) {
      console.error('[AdminController.getDonors] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving donor records.'
      });
    }
  },

  async createDonor(req, res) {
    try {
      const validation = validateDonorData(req.body, { isPublic: false });
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.errors.join(' ')
        });
      }

      const adminUsername = req.session?.admin?.username || 'admin';
      const clientIp = req.ip || req.socket.remoteAddress;
      const { register_number, email } = req.body;

      const dupCheck = await DonorModel.checkDuplicates(register_number, email);
      if (dupCheck.duplicate) {
        const fieldName = dupCheck.field === 'register_number' ? 'University Register Number' : 'Email Address';
        return res.status(409).json({
          success: false,
          message: `A donor with this ${fieldName} is already registered.`
        });
      }

      const donorId = await DonorModel.create(req.body);

      await LogModel.addLog(adminUsername, 'Donor Added by Admin', `Added new donor record ID ${donorId} (${req.body.name}, Reg: ${register_number})`, clientIp);

      return res.status(201).json({
        success: true,
        message: 'New donor added successfully by administrator.',
        donorId
      });
    } catch (err) {
      console.error('[AdminController.createDonor] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error creating donor record.'
      });
    }
  },

  async getDonorById(req, res) {
    try {
      const { id } = req.params;
      const adminUsername = req.session?.admin?.username || 'admin';
      const clientIp = req.ip || req.socket.remoteAddress;

      const donor = await DonorModel.findById(id);
      if (!donor) {
        return res.status(404).json({
          success: false,
          message: 'Donor record not found.'
        });
      }

      await LogModel.addLog(adminUsername, 'Donor Viewed', `Viewed details for donor ID ${id} (${donor.name}, Reg: ${donor.register_number})`, clientIp);

      return res.json({
        success: true,
        donor
      });
    } catch (err) {
      console.error('[AdminController.getDonorById] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving donor details.'
      });
    }
  },

  async updateDonor(req, res) {
    try {
      const { id } = req.params;
      const adminUsername = req.session?.admin?.username || 'admin';
      const clientIp = req.ip || req.socket.remoteAddress;

      const existingDonor = await DonorModel.findById(id);
      if (!existingDonor) {
        return res.status(404).json({
          success: false,
          message: 'Donor record not found.'
        });
      }

      const validation = validateDonorData(req.body, { isPublic: false, isUpdate: true });
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.errors.join(' ')
        });
      }

      // Duplicate check for reg_number and email excluding current id
      const dupCheck = await DonorModel.checkDuplicates(req.body.register_number, req.body.email, id);
      if (dupCheck.duplicate) {
        const fieldName = dupCheck.field === 'register_number' ? 'University Register Number' : 'Email Address';
        return res.status(409).json({
          success: false,
          message: `Another donor with this ${fieldName} already exists.`
        });
      }

      const updated = await DonorModel.update(id, req.body);
      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update donor record.'
        });
      }

      await LogModel.addLog(adminUsername, 'Donor Edited', `Edited donor record ID ${id} (${req.body.name}, Reg: ${req.body.register_number})`, clientIp);

      return res.json({
        success: true,
        message: 'Donor record updated successfully.'
      });
    } catch (err) {
      console.error('[AdminController.updateDonor] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error updating donor record.'
      });
    }
  },

  async deleteDonor(req, res) {
    try {
      const { id } = req.params;
      const adminUsername = req.session?.admin?.username || 'admin';
      const clientIp = req.ip || req.socket.remoteAddress;

      const donor = await DonorModel.findById(id);
      if (!donor) {
        return res.status(404).json({
          success: false,
          message: 'Donor record not found.'
        });
      }

      const deleted = await DonorModel.delete(id);
      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete donor record.'
        });
      }

      await LogModel.addLog(adminUsername, 'Donor Deleted', `Deleted donor ID ${id} (${donor.name}, Reg: ${donor.register_number})`, clientIp);

      return res.json({
        success: true,
        message: 'Donor record deleted successfully.'
      });
    } catch (err) {
      console.error('[AdminController.deleteDonor] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error deleting donor record.'
      });
    }
  },

  async exportDonors(req, res) {
    try {
      const adminUsername = req.session?.admin?.username || 'admin';
      const clientIp = req.ip || req.socket.remoteAddress;
      const format = (req.query.format || 'csv').toLowerCase();

      // Fetch all matching donors without limit
      const options = { ...req.query, limit: 5000, page: 1 };
      const { donors } = await DonorModel.findAll(options);

      await LogModel.addLog(adminUsername, 'Records Exported', `Exported ${donors.length} donor records in ${format.toUpperCase()} format`, clientIp);

      if (format === 'csv' || format === 'excel') {
        const csvData = generateCSV(donors);
        const filename = `PU_Blood_Directory_Donors_${Date.now()}.${format === 'excel' ? 'xls' : 'csv'}`;
        
        res.setHeader('Content-Type', format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(csvData);
      } else {
        return res.json({
          success: true,
          donors
        });
      }
    } catch (err) {
      console.error('[AdminController.exportDonors] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error exporting donor records.'
      });
    }
  },

  async getActivityLogs(req, res) {
    try {
      const logData = await LogModel.getLogs(req.query);
      return res.json({
        success: true,
        ...logData
      });
    } catch (err) {
      console.error('[AdminController.getActivityLogs] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving activity logs.'
      });
    }
  },

  async getSessionStatus(req, res) {
    if (req.session && req.session.admin) {
      return res.json({
        authenticated: true,
        admin: req.session.admin
      });
    }
    return res.json({ authenticated: false });
  }
};

module.exports = AdminController;
