/* ====================================================================
   PU Blood Diary - Core Utilities & Data Registries
   ==================================================================== */

// Department Registry (All 45 Pondicherry University Departments/Centres)
const PU_DEPARTMENTS = [
  "Department of Computer Science",
  "Department of Electronics Engineering",
  "Centre for Pollution Control and Environmental Engineering",
  "Department of Mathematics",
  "Department of Statistics",
  "Department of Earth Sciences",
  "Department of Physics",
  "Department of Chemistry",
  "Department of Biochemistry and Molecular Biology",
  "Department of Biotechnology",
  "Department of Ecology and Environmental Sciences",
  "Department of Food Science and Technology",
  "Department of Microbiology",
  "Department of Bioinformatics",
  "Department of Green Energy Technology",
  "Centre for Nano Sciences & Technology",
  "Sri Subramania Bharathi School of Tamil Language & Literature",
  "Department of Electronic Media and Mass Communication",
  "Department of Anthropology",
  "Department of Sociology",
  "Department of History",
  "Department of Politics and International Studies",
  "Department of Social Work",
  "Centre for Women’s Studies",
  "Centre for South Asian Studies",
  "Centre for Study of Social Exclusion & Inclusive Policy",
  "Centre for Maritime Studies",
  "SEAL (Social & Economic Administration and Law)",
  "Department of Management Studies",
  "Department of International Business",
  "Department of Banking Technology",
  "Department of Tourism Studies",
  "Department of Commerce",
  "Department of Economics",
  "Department of Library and Information Science",
  "Department of Physical Education and Sports",
  "School of Education",
  "Department of Applied Psychology",
  "School of Performing Arts",
  "Department of English",
  "Department of French",
  "Department of Hindi",
  "Department of Sanskrit",
  "Department of Philosophy",
  "School of Law"
];

// Indian States & Union Territories
const INDIAN_STATES_UTS = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi (NCT)",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

// Eighth Schedule Languages + English, French & Other
const CONSTITUTIONAL_LANGUAGES = [
  "English", "Tamil", "Hindi", "Malayalam", "Telugu", "Kannada", "Bengali", "Marathi", "French",
  "Assamese", "Bodo", "Dogri", "Gujarati", "Kashmiri", "Konkani", "Maithili",
  "Manipuri", "Nepali", "Odia", "Punjabi", "Sanskrit", "Santali", "Sindhi",
  "Urdu", "Other"
];

// Attach registries to window object for global availability
window.PU_DEPARTMENTS = PU_DEPARTMENTS;
window.INDIAN_STATES_UTS = INDIAN_STATES_UTS;
window.CONSTITUTIONAL_LANGUAGES = CONSTITUTIONAL_LANGUAGES;

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });
  }
});

// Global Toast System
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const iconHtml = type === 'success' 
    ? '<i class="fas fa-check-circle text-success" style="font-size:1.2rem;"></i>' 
    : '<i class="fas fa-exclamation-triangle text-danger" style="font-size:1.2rem;"></i>';

  toast.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      ${iconHtml}
      <div>
        <strong style="font-size:0.9rem;">${type === 'success' ? 'Success' : 'Notice'}</strong>
        <p style="margin-top:1px; font-size:0.88rem;">${message}</p>
      </div>
    </div>
    <button onclick="this.parentElement.remove()" style="background:none; border:none; color:inherit; cursor:pointer; font-size:1.1rem; opacity:0.6;">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

// Global Modal System
function showModal({ title, body, footerButtons = [] }) {
  let backdrop = document.getElementById('globalModalBackdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'globalModalBackdrop';
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title" id="globalModalTitle">Modal Title</h3>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body" id="globalModalBody"></div>
        <div class="modal-footer" id="globalModalFooter"></div>
      </div>
    `;
    document.body.appendChild(backdrop);
  }

  document.getElementById('globalModalTitle').textContent = title;
  document.getElementById('globalModalBody').innerHTML = body;

  const footerEl = document.getElementById('globalModalFooter');
  footerEl.innerHTML = '';

  footerButtons.forEach(btn => {
    const b = document.createElement('button');
    b.className = `btn ${btn.class || 'btn-secondary'}`;
    b.innerHTML = btn.text;
    b.onclick = () => btn.onClick(closeModal);
    footerEl.appendChild(b);
  });

  if (footerButtons.length === 0) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-secondary';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = closeModal;
    footerEl.appendChild(closeBtn);
  }

  backdrop.classList.add('active');
}

function closeModal() {
  const backdrop = document.getElementById('globalModalBackdrop');
  if (backdrop) backdrop.classList.remove('active');
}

// Helper Date Format
function formatDate(dateStr) {
  if (!dateStr || dateStr === 'Never') return 'Never';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

// Format full date and time with UTC-to-local timezone conversion
function formatDateTime(dateStr) {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  try {
    let safeStr = String(dateStr).trim();
    // SQLite stores UTC as "YYYY-MM-DD HH:MM:SS" without Z. Append Z so Date parses as UTC and converts to local timezone
    if (!safeStr.endsWith('Z') && !safeStr.includes('+') && !safeStr.includes('T')) {
      safeStr = safeStr.replace(' ', 'T') + 'Z';
    }
    const d = new Date(safeStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateStr;
  }
}

// Calculate 90-day Voluntary Blood Donation Eligibility Status
function getDonationEligibility(lastDonatedDateStr) {
  if (!lastDonatedDateStr || lastDonatedDateStr === 'Never' || lastDonatedDateStr === 'N/A') {
    return {
      eligible: true,
      badgeHtml: '<span class="badge bg-success text-white px-2 py-1 rounded-pill" style="font-size:0.75rem;"><i class="fas fa-check-circle me-1"></i> Eligible to Donate</span>',
      text: 'Eligible to Donate'
    };
  }

  const lastDate = new Date(lastDonatedDateStr);
  if (isNaN(lastDate.getTime())) {
    return {
      eligible: true,
      badgeHtml: '<span class="badge bg-success text-white px-2 py-1 rounded-pill" style="font-size:0.75rem;"><i class="fas fa-check-circle me-1"></i> Eligible to Donate</span>',
      text: 'Eligible to Donate'
    };
  }

  const today = new Date();
  const diffTime = today - lastDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const waitingPeriod = 90; // Standard 90-day voluntary donation window

  if (diffDays >= waitingPeriod) {
    return {
      eligible: true,
      badgeHtml: '<span class="badge bg-success text-white px-2 py-1 rounded-pill" style="font-size:0.75rem;"><i class="fas fa-check-circle me-1"></i> Eligible to Donate</span>',
      text: 'Eligible to Donate'
    };
  } else {
    const daysRemaining = waitingPeriod - diffDays;
    return {
      eligible: false,
      daysRemaining: daysRemaining,
      badgeHtml: `<span class="badge bg-warning text-dark px-2 py-1 rounded-pill" style="font-size:0.75rem;"><i class="fas fa-clock me-1"></i> Eligible in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}</span>`,
      text: `Eligible in ${daysRemaining} days`
    };
  }
}
