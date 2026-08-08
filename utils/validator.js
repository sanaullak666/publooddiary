const ALLOWED_BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
  'Bombay Blood Group (hh)', 'Rh-null (Rare)'
];

const PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseBool(val) {
  return val === true || val === 1 || val === '1' || val === 'true';
}

function validateDonorData(data, { isPublic = false, isUpdate = false } = {}) {
  const errors = [];

  const {
    name,
    blood_group,
    department,
    register_number,
    contact_number,
    alt_contact_number,
    email,
    state_ut,
    languages,
    last_donated_date,
    has_health_problem,
    health_problem_details,
    has_regular_medicine,
    medicine_details,
    declaration_agreed
  } = data;

  if (!isUpdate || name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      errors.push('Full Name is required.');
    }
  }

  if (!isUpdate || blood_group !== undefined) {
    if (!blood_group || !ALLOWED_BLOOD_GROUPS.includes(blood_group)) {
      errors.push(`Valid Blood Group is required (${ALLOWED_BLOOD_GROUPS.join(', ')}).`);
    }
  }

  if (!isUpdate || department !== undefined) {
    if (!department || typeof department !== 'string' || department.trim() === '') {
      errors.push('Department / Programme is required.');
    }
  }

  if (!isUpdate || register_number !== undefined) {
    if (!register_number || typeof register_number !== 'string' || register_number.trim() === '') {
      errors.push('University Register Number is required.');
    }
  }

  if (!isUpdate || contact_number !== undefined) {
    if (!contact_number || !PHONE_REGEX.test(String(contact_number).trim())) {
      errors.push('Primary Contact Number must be a valid 10-digit Indian mobile number starting with 6-9.');
    }
  }

  if (alt_contact_number && String(alt_contact_number).trim() !== '') {
    if (!PHONE_REGEX.test(String(alt_contact_number).trim())) {
      errors.push('Alternative Contact Number must be a valid 10-digit Indian mobile number starting with 6-9.');
    }
  }

  if (!isUpdate || email !== undefined) {
    if (!email || !EMAIL_REGEX.test(String(email).trim())) {
      errors.push('A valid Email Address is required.');
    }
  }

  if (!isUpdate || state_ut !== undefined) {
    if (!state_ut || typeof state_ut !== 'string' || state_ut.trim() === '') {
      errors.push('State / Union Territory is required.');
    }
  }

  if (!isUpdate || languages !== undefined) {
    const hasLang = Array.isArray(languages)
      ? languages.length > 0
      : (typeof languages === 'string' && languages.trim() !== '');
    if (!hasLang) {
      errors.push('At least one known language must be selected.');
    }
  }

  if (last_donated_date && String(last_donated_date).trim() !== '') {
    const d = new Date(last_donated_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (isNaN(d.getTime())) {
      errors.push('Last Donated Date is invalid.');
    } else if (d > today) {
      errors.push('Last Donated Date cannot be in the future.');
    }
  }

  if (parseBool(has_health_problem)) {
    if (!health_problem_details || typeof health_problem_details !== 'string' || health_problem_details.trim() === '') {
      errors.push('Please specify details for the regular health problem.');
    }
  }

  if (parseBool(has_regular_medicine)) {
    if (!medicine_details || typeof medicine_details !== 'string' || medicine_details.trim() === '') {
      errors.push('Please specify details for regular medicine taken.');
    }
  }

  if (isPublic && (!declaration_agreed || !parseBool(declaration_agreed))) {
    errors.push('You must agree to the declaration before registering.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateDonorData,
  ALLOWED_BLOOD_GROUPS
};
