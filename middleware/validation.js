function validateDonorRegistration(req, res, next) {
  const {
    name,
    blood_group,
    last_donated_date,
    department,
    register_number,
    contact_number,
    alt_contact_number,
    email,
    state_ut,
    languages,
    declaration_agreed
  } = req.body;

  const errors = [];

  // Name check
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Full Name is required and must be at least 2 characters.');
  }

  // Blood Group check
  const validBloodGroups = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
    'Bombay Blood Group (hh)', 'Rh-null (Rare)'
  ];
  if (!blood_group || !validBloodGroups.includes(blood_group)) {
    errors.push('Valid Blood Group selection is required.');
  }

  // Last donated date check (no future dates)
  if (last_donated_date && last_donated_date.trim() !== '') {
    const donatedDate = new Date(last_donated_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (isNaN(donatedDate.getTime()) || donatedDate > today) {
      errors.push('Last blood donation date cannot be in the future.');
    }
  }

  // Department check
  if (!department || typeof department !== 'string' || department.trim() === '') {
    errors.push('Department / Programme is required.');
  }

  // Register Number check
  if (!register_number || typeof register_number !== 'string' || register_number.trim().length < 3) {
    errors.push('University Register Number is required.');
  }

  // Contact Number check (10-digit Indian Mobile)
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!contact_number || !phoneRegex.test(contact_number.trim())) {
    errors.push('A valid 10-digit Indian contact number starting with 6, 7, 8, or 9 is required.');
  }

  // Alt Contact Number check if provided
  if (alt_contact_number && alt_contact_number.trim() !== '') {
    if (!phoneRegex.test(alt_contact_number.trim())) {
      errors.push('Alternative contact number must be a valid 10-digit Indian mobile number.');
    }
  }

  // Email check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push('A valid Email address is required.');
  }

  // State / UT check
  if (!state_ut || typeof state_ut !== 'string' || state_ut.trim() === '') {
    errors.push('State / Union Territory selection is required.');
  }

  // Languages check
  if (!languages || (Array.isArray(languages) && languages.length === 0)) {
    errors.push('At least one language must be selected.');
  }

  // Declaration check
  if (!declaration_agreed || (declaration_agreed !== true && declaration_agreed !== 'true' && declaration_agreed !== 1 && declaration_agreed !== '1' && declaration_agreed !== 'on')) {
    errors.push('You must agree to the declaration before registering.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join(' ')
    });
  }

  next();
}

module.exports = {
  validateDonorRegistration
};
