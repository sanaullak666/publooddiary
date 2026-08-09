/* ====================================================================
   PU Blood Diary - Admin Dashboard Logic
   ==================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Session Guard Check
  checkAdminSession();

  // Populate Filter & Add Donor Form Dropdowns
  populateAdminFilterDropdowns();
  populateTabAddDonorDropdowns();

  // Initial Donor Load
  loadDonors(1);

  // Filter & Search Form Submit & Reset Handlers
  const filterForm = document.getElementById('adminFilterForm');
  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loadDonors(1);
    });

    filterForm.addEventListener('reset', () => {
      setTimeout(() => {
        loadDonors(1);
      }, 50);
    });
  }

  // Tab Add Donor Form Handler
  const tabForm = document.getElementById('adminTabAddDonorForm');
  if (tabForm) {
    tabForm.addEventListener('submit', handleTabAddDonorSubmit);
  }

  // Tab Navigation Listeners & Back Buttons
  document.getElementById('tabBtnDirectory')?.addEventListener('click', () => switchAdminTab('directory'));
  document.getElementById('tabBtnAddDonor')?.addEventListener('click', () => switchAdminTab('addDonor'));
  document.getElementById('tabBtnLogs')?.addEventListener('click', () => switchAdminTab('logs'));
  document.getElementById('btnNavRegisterDonor')?.addEventListener('click', () => switchAdminTab('addDonor'));
  document.getElementById('btnBackToDirTop')?.addEventListener('click', () => switchAdminTab('directory'));
  document.getElementById('btnBackToDirBottom')?.addEventListener('click', () => switchAdminTab('directory'));
  document.querySelectorAll('.btn-back-directory').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchAdminTab('directory');
    });
  });

  // Export Button Listeners
  document.getElementById('btnExportCsv')?.addEventListener('click', () => triggerExport('csv'));
  document.getElementById('btnExportExcel')?.addEventListener('click', () => triggerExport('excel'));
  document.getElementById('btnPrintReport')?.addEventListener('click', () => triggerExport('print'));

  // Event Delegation for Table Action Buttons (View, Edit, Delete)
  const tbody = document.getElementById('donorsTableBody');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      if (action === 'view') viewDonorDetails(id);
      if (action === 'edit') editDonorRecord(id);
      if (action === 'delete') confirmDeleteDonor(id, name);
    });
  }

  // Pagination Event Delegation Listeners
  const adminPagEl = document.getElementById('adminPagination');
  if (adminPagEl) {
    adminPagEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-page]');
      if (!btn || btn.disabled) return;
      const targetPage = parseInt(btn.dataset.page, 10);
      if (!isNaN(targetPage) && targetPage > 0) {
        loadDonors(targetPage);
        const tableContainer = document.querySelector('.table-responsive');
        if (tableContainer) tableContainer.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  const logsPagEl = document.getElementById('logsPagination');
  if (logsPagEl) {
    logsPagEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-page]');
      if (!btn || btn.disabled) return;
      const targetPage = parseInt(btn.dataset.page, 10);
      if (!isNaN(targetPage) && targetPage > 0) {
        loadAuditLogs(targetPage);
      }
    });
  }

  // Logout Button Handler
  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Initialize 30-Minute Inactivity Session Timeout
  initInactivityTracker();
});

let currentPage = 1;
let currentTotalPages = 1;

function switchAdminTab(tabName) {
  if (typeof closeModal === 'function') closeModal();
  const dirSection = document.getElementById('tabSectionDirectory');
  const addSection = document.getElementById('tabSectionAddDonor');
  const logSection = document.getElementById('tabSectionLogs');

  const btnDir = document.getElementById('tabBtnDirectory');
  const btnAdd = document.getElementById('tabBtnAddDonor');
  const btnLogs = document.getElementById('tabBtnLogs');

  if (dirSection) dirSection.style.display = tabName === 'directory' ? 'block' : 'none';
  if (addSection) addSection.style.display = tabName === 'addDonor' ? 'block' : 'none';
  if (logSection) logSection.style.display = tabName === 'logs' ? 'block' : 'none';

  if (btnDir) btnDir.classList.toggle('active', tabName === 'directory');
  if (btnAdd) btnAdd.classList.toggle('active', tabName === 'addDonor');
  if (btnLogs) btnLogs.classList.toggle('active', tabName === 'logs');

  if (tabName === 'directory') {
    if (typeof loadDonors === 'function') loadDonors(1);
  } else if (tabName === 'logs') {
    if (typeof loadAuditLogs === 'function') loadAuditLogs(1);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadAuditLogs(page = 1) {
  const pageNum = parseInt(page, 10) || 1;
  const tbody = document.getElementById('auditLogsTableBody');
  const paginationEl = document.getElementById('logsPagination');
  if (!tbody) return;

  const search = document.getElementById('logSearchInput')?.value.trim() || '';
  const params = new URLSearchParams({ page: pageNum, limit: 15, search });

  try {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin me-2"></i> Loading activity logs...</td></tr>';
    const res = await fetch(`/api/admin/logs?${params.toString()}`);
    const data = await res.json();

    if (res.ok && data.success) {
      if (!data.logs || data.logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);"><i class="fas fa-info-circle me-2"></i> No activity logs recorded yet.</td></tr>';
        if (paginationEl) paginationEl.innerHTML = '';
        return;
      }

      tbody.innerHTML = data.logs.map(log => `
        <tr>
          <td><small style="font-weight:600;">${formatDateTime(log.created_at)}</small></td>
          <td><span class="badge bg-navy-lighter text-navy" style="font-family:monospace;"><i class="fas fa-user-shield me-1"></i> ${log.admin_username || 'admin'}</span></td>
          <td><strong style="color:var(--primary-red);">${log.action || ''}</strong></td>
          <td>${log.details || ''}</td>
          <td><code>${log.ip_address || '127.0.0.1'}</code></td>
        </tr>
      `).join('');

      if (paginationEl) {
        const curPage = parseInt(data.page, 10) || 1;
        const totPages = Math.max(1, parseInt(data.totalPages, 10) || 1);
        const prevPage = curPage - 1;
        const nextPage = curPage + 1;
        const prevDisabled = curPage <= 1 ? 'disabled' : '';
        const nextDisabled = curPage >= totPages ? 'disabled' : '';

        paginationEl.innerHTML = `
          <div style="font-size:0.88rem; color:var(--text-muted);">
            Showing Log Page <strong>${curPage}</strong> of <strong>${totPages}</strong> (${data.totalCount} Total System Events)
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
            <button type="button" data-page="${prevPage}" onclick="window.loadAuditLogs(${prevPage})" class="btn btn-sm btn-outline-red" ${prevDisabled}>&larr; Previous</button>
            <button type="button" data-page="${nextPage}" onclick="window.loadAuditLogs(${nextPage})" class="btn btn-sm btn-outline-red" ${nextDisabled}>Next &rarr;</button>
          </div>
        `;
      }
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--primary-red); padding:2rem;">${data.message || 'Failed to load logs.'}</td></tr>`;
    }
  } catch (err) {
    console.error('Error loading audit logs:', err);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--primary-red); padding:2rem;">Network error loading activity logs.</td></tr>';
  }
}

function openAddDonorModal() {
  switchAdminTab('addDonor');
}

function getDepts() {
  return window.PU_DEPARTMENTS || (typeof PU_DEPARTMENTS !== 'undefined' ? PU_DEPARTMENTS : []);
}
function getStates() {
  return window.INDIAN_STATES_UTS || (typeof INDIAN_STATES_UTS !== 'undefined' ? INDIAN_STATES_UTS : []);
}
function getLangs() {
  return window.CONSTITUTIONAL_LANGUAGES || (typeof CONSTITUTIONAL_LANGUAGES !== 'undefined' ? CONSTITUTIONAL_LANGUAGES : []);
}

function populateTabAddDonorDropdowns() {
  const tabDept = document.getElementById('tabAddDept');
  if (tabDept) {
    tabDept.innerHTML = '<option value="">-- Select Department --</option>';
    getDepts().forEach(dept => {
      const cleanDept = dept.replace(/^\d+\.\s*/, '');
      const opt = document.createElement('option');
      opt.value = cleanDept;
      opt.textContent = dept;
      tabDept.appendChild(opt);
    });
  }

  const tabState = document.getElementById('tabAddState');
  if (tabState) {
    tabState.innerHTML = '<option value="">-- Select State / UT --</option>';
    getStates().forEach(state => {
      const opt = document.createElement('option');
      opt.value = state;
      opt.textContent = state;
      tabState.appendChild(opt);
    });
  }

  const langContainer = document.getElementById('tabAddLanguagesContainer');
  if (langContainer) {
    langContainer.innerHTML = '';
    getLangs().forEach(lang => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      label.style.fontSize = '0.85rem';
      label.innerHTML = `
        <input type="checkbox" name="tabLanguages" value="${lang}">
        <span>${lang}</span>
      `;
      langContainer.appendChild(label);
    });
  }

  const dateInput = document.getElementById('tabAddDonatedDate');
  if (dateInput) {
    dateInput.setAttribute('max', new Date().toISOString().split('T')[0]);
  }
}

async function handleTabAddDonorSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('tabAddName').value.trim();
  const blood_group = document.getElementById('tabAddBloodGroup').value;
  const department = document.getElementById('tabAddDept').value;
  const register_number = document.getElementById('tabAddRegNo').value.trim();
  const contact_number = document.getElementById('tabAddPhone').value.trim();
  const alt_contact_number = document.getElementById('tabAddAltPhone').value.trim();
  const email = document.getElementById('tabAddEmail').value.trim();
  const state_ut = document.getElementById('tabAddState').value;
  const last_donated_date = document.getElementById('tabAddDonatedDate').value || null;

  const langBoxes = document.querySelectorAll('input[name="tabLanguages"]:checked');
  const languages = Array.from(langBoxes).map(cb => cb.value);

  if (!name || !blood_group || !department || !register_number || !contact_number || !email || !state_ut) {
    showToast('Please complete all required fields (*).', 'error');
    return;
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(contact_number)) {
    showToast('Please enter a valid 10-digit Indian contact number.', 'error');
    return;
  }

  if (alt_contact_number && !phoneRegex.test(alt_contact_number)) {
    showToast('Alternative contact number must be a valid 10-digit Indian mobile number.', 'error');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }

  if (languages.length === 0) {
    showToast('Please select at least one language known.', 'error');
    return;
  }

  const has_health_problem = document.getElementById('tabAddHasHealth').value === '1';
  const health_problem_details = has_health_problem ? document.getElementById('tabAddHealthDetails').value.trim() : null;
  if (has_health_problem && !health_problem_details) {
    showToast('Please specify details for the regular health problem.', 'error');
    return;
  }

  const has_regular_medicine = document.getElementById('tabAddHasMedicine').value === '1';
  const medicine_details = has_regular_medicine ? document.getElementById('tabAddMedicineDetails').value.trim() : null;
  if (has_regular_medicine && !medicine_details) {
    showToast('Please specify details for regular medicine taken.', 'error');
    return;
  }

  const consumes_alcohol_substance = document.getElementById('tabAddSubstance').value === '1';

  const payload = {
    name,
    blood_group,
    department,
    register_number,
    contact_number,
    alt_contact_number: alt_contact_number || null,
    email,
    state_ut,
    last_donated_date,
    languages,
    has_health_problem,
    health_problem_details,
    has_regular_medicine,
    medicine_details,
    consumes_alcohol_substance,
    declaration_agreed: true
  };

  try {
    const res = await fetch('/api/admin/donors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast('New donor record registered successfully!', 'success');
      document.getElementById('adminTabAddDonorForm').reset();
      switchAdminTab('directory');
      loadDonors(1);
    } else {
      showToast(data.message || 'Failed to add new donor.', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Network error creating donor record.', 'error');
  }
}

async function checkAdminSession() {
  try {
    const res = await fetch('/api/admin/session');
    if (res.status === 401) {
      window.location.href = '/admin/login';
      return;
    }
    const data = await res.json();
    if (!data.authenticated) {
      window.location.href = '/admin/login';
    } else {
      const nameEl = document.getElementById('adminNameDisplay');
      if (nameEl) {
        const displayName = (data.admin && data.admin.name && data.admin.name !== 'NSS Administrator') ? data.admin.name : 'Admin';
        nameEl.textContent = displayName;
      }
    }
  } catch (err) {
    console.error('Session check failed:', err);
    window.location.href = '/admin/login';
  }
}

function populateAdminFilterDropdowns() {
  const deptSelect = document.getElementById('adminFilterDept');
  if (deptSelect) {
    deptSelect.innerHTML = '<option value="">All Departments</option>';
    getDepts().forEach(dept => {
      const cleanDept = dept.replace(/^\d+\.\s*/, '');
      const opt = document.createElement('option');
      opt.value = cleanDept;
      opt.textContent = dept;
      deptSelect.appendChild(opt);
    });
  }

  const stateSelect = document.getElementById('adminFilterState');
  if (stateSelect) {
    stateSelect.innerHTML = '<option value="">All States / UTs</option>';
    getStates().forEach(state => {
      const opt = document.createElement('option');
      opt.value = state;
      opt.textContent = state;
      stateSelect.appendChild(opt);
    });
  }
}

function populateInlineAddDonorDropdowns() {
  const inlineDept = document.getElementById('inlineAddDept');
  if (inlineDept) {
    inlineDept.innerHTML = '<option value="">-- Select Department --</option>';
    getDepts().forEach(dept => {
      const cleanDept = dept.replace(/^\d+\.\s*/, '');
      const opt = document.createElement('option');
      opt.value = cleanDept;
      opt.textContent = dept;
      inlineDept.appendChild(opt);
    });
  }

  const inlineState = document.getElementById('inlineAddState');
  if (inlineState) {
    inlineState.innerHTML = '<option value="">-- Select State / UT --</option>';
    getStates().forEach(state => {
      const opt = document.createElement('option');
      opt.value = state;
      opt.textContent = state;
      inlineState.appendChild(opt);
    });
  }

  const langContainer = document.getElementById('inlineAddLanguagesContainer');
  if (langContainer) {
    langContainer.innerHTML = '';
    getLangs().forEach(lang => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      label.style.fontSize = '0.85rem';
      label.innerHTML = `
        <input type="checkbox" name="inlineLanguages" value="${lang}">
        <span>${lang}</span>
      `;
      langContainer.appendChild(label);
    });
  }

  const dateInput = document.getElementById('inlineAddDonatedDate');
  if (dateInput) {
    dateInput.setAttribute('max', new Date().toISOString().split('T')[0]);
  }
}

function toggleAddDonorForm(show) {
  const inlineCard = document.getElementById('inlineAddDonorCard');
  if (!inlineCard) return;

  if (show === undefined) {
    show = inlineCard.style.display === 'none';
  }

  if (show) {
    inlineCard.style.display = 'block';
    inlineCard.scrollIntoView({ behavior: 'smooth' });
  } else {
    inlineCard.style.display = 'none';
    const form = document.getElementById('inlineAddDonorForm');
    if (form) form.reset();
  }
}

async function loadDonors(page = 1) {
  const pageNum = parseInt(page, 10) || 1;
  currentPage = pageNum;
  const tbody = document.getElementById('donorsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin me-2"></i> Loading donor records...</td></tr>';

  const params = new URLSearchParams({
    page: pageNum,
    limit: 10,
    _t: Date.now(),
    search: document.getElementById('adminSearchInput')?.value.trim() || '',
    blood_group: document.getElementById('adminFilterBloodGroup')?.value || '',
    department: document.getElementById('adminFilterDept')?.value || '',
    state_ut: document.getElementById('adminFilterState')?.value || '',
    language: document.getElementById('adminFilterLanguage')?.value.trim() || '',
    last_donated_start: document.getElementById('adminFilterDateStart')?.value || '',
    last_donated_end: document.getElementById('adminFilterDateEnd')?.value || '',
    has_health_problem: document.getElementById('adminFilterHealth')?.value || '',
    has_regular_medicine: document.getElementById('adminFilterMedicine')?.value || '',
    consumes_alcohol_substance: document.getElementById('adminFilterSubstance')?.value || ''
  });

  try {
    const res = await fetch(`/api/admin/donors?${params.toString()}`);
    if (res.status === 401) {
      window.location.href = '/admin/login';
      return;
    }
    const data = await res.json();

    if (res.ok && data.success) {
      renderDonorsTable(data.donors || []);
      renderPagination(data.page || 1, data.totalPages || 1, data.totalCount || 0);
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--primary-red); padding:2rem;">${data.message || 'Failed to load donors.'}</td></tr>`;
    }
  } catch (err) {
    console.error('Error loading donors:', err);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--primary-red); padding:2rem;">Network error loading records. Please refresh the page.</td></tr>';
  }
}

function escapeJsString(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function renderDonorsTable(donors) {
  const tbody = document.getElementById('donorsTableBody');
  if (!tbody) return;

  if (donors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2.5rem; color:var(--text-muted);"><i class="fas fa-info-circle me-2"></i> No donor records found matching your filters.</td></tr>';
    return;
  }

  tbody.innerHTML = donors.map(d => {
    const eligibility = getDonationEligibility(d.last_donated_date);

    return `
    <tr>
      <td><strong>${d.name || ''}</strong></td>
      <td><span class="blood-badge">${d.blood_group || ''}</span></td>
      <td><code>${d.register_number || ''}</code></td>
      <td>${d.department || ''}</td>
      <td><a href="tel:${d.contact_number || ''}"><i class="fas fa-phone me-1"></i> ${d.contact_number || ''}</a></td>
      <td>${eligibility.badgeHtml}</td>
      <td>
        <div style="display:flex; gap:6px; flex-wrap:nowrap; align-items:center;">
          <button type="button" data-action="view" data-id="${d.id}" onclick="window.viewDonorDetails(${d.id})" class="btn btn-sm btn-outline-red" style="padding:0.35rem 0.75rem; white-space:nowrap;" title="View Full Profile"><i class="fas fa-eye me-1"></i> View</button>
          <button type="button" data-action="edit" data-id="${d.id}" onclick="window.editDonorRecord(${d.id})" class="btn btn-sm btn-secondary" style="padding:0.35rem 0.75rem; white-space:nowrap;" title="Edit Donor"><i class="fas fa-edit me-1"></i> Edit</button>
          <button type="button" data-action="delete" data-id="${d.id}" data-name="${escapeJsString(d.name)}" onclick="window.confirmDeleteDonor(${d.id}, '${escapeJsString(d.name)}')" class="btn btn-sm btn-danger" style="padding:0.35rem 0.75rem; white-space:nowrap;" title="Delete Donor"><i class="fas fa-trash me-1"></i> Delete</button>
        </div>
      </td>
    </tr>
  `}).join('');
}

function renderPagination(page, totalPages, totalCount) {
  const curPage = parseInt(page, 10) || 1;
  const totPages = Math.max(1, parseInt(totalPages, 10) || 1);
  const totCount = parseInt(totalCount, 10) || 0;

  currentPage = curPage;
  currentTotalPages = totPages;

  const paginationEl = document.getElementById('adminPagination');
  if (!paginationEl) return;

  const prevPage = curPage - 1;
  const nextPage = curPage + 1;

  const prevDisabled = curPage <= 1 ? 'disabled' : '';
  const nextDisabled = curPage >= totPages ? 'disabled' : '';

  // Generate numbered page buttons (e.g. 1, 2, 3...)
  let pageButtonsHtml = '';
  const maxVisible = 5;
  let startP = Math.max(1, curPage - Math.floor(maxVisible / 2));
  let endP = Math.min(totPages, startP + maxVisible - 1);

  if (endP - startP + 1 < maxVisible) {
    startP = Math.max(1, endP - maxVisible + 1);
  }

  if (startP > 1) {
    pageButtonsHtml += `<button type="button" data-page="1" onclick="window.loadDonors(1)" class="btn btn-sm btn-outline-red">1</button>`;
    if (startP > 2) pageButtonsHtml += `<span style="align-self:center; color:var(--text-muted); font-size:0.85rem;">...</span>`;
  }

  for (let i = startP; i <= endP; i++) {
    const isCurrent = i === curPage;
    const btnStyle = isCurrent ? 'background:var(--primary-red); color:white; border-color:var(--primary-red);' : '';
    const btnClass = isCurrent ? 'btn btn-sm' : 'btn btn-sm btn-outline-red';
    pageButtonsHtml += `<button type="button" data-page="${i}" onclick="window.loadDonors(${i})" class="${btnClass}" style="${btnStyle}">${i}</button>`;
  }

  if (endP < totPages) {
    if (endP < totPages - 1) pageButtonsHtml += `<span style="align-self:center; color:var(--text-muted); font-size:0.85rem;">...</span>`;
    pageButtonsHtml += `<button type="button" data-page="${totPages}" onclick="window.loadDonors(${totPages})" class="btn btn-sm btn-outline-red">${totPages}</button>`;
  }

  paginationEl.innerHTML = `
    <div style="font-size:0.88rem; color:var(--text-muted);">
      Showing Page <strong>${curPage}</strong> of <strong>${totPages}</strong> (${totCount} Total Registered Donors)
    </div>
    <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
      <button type="button" data-page="${prevPage}" onclick="window.loadDonors(${prevPage})" class="btn btn-sm btn-outline-red" ${prevDisabled}>&larr; Previous</button>
      ${pageButtonsHtml}
      <button type="button" data-page="${nextPage}" onclick="window.loadDonors(${nextPage})" class="btn btn-sm btn-outline-red" ${nextDisabled}>Next &rarr;</button>
    </div>
  `;
}

// View Full Donor Profile (including health/substance info)
async function viewDonorDetails(id) {
  try {
    const res = await fetch(`/api/admin/donors/${id}`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast('Error loading donor profile.', 'error');
      return;
    }

    const d = data.donor;
    showModal({
      title: `Donor Profile — ${d.name}`,
      body: `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="background:var(--primary-red-light); padding:1rem; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h3 style="color:var(--primary-red); font-size:1.3rem;">${d.name}</h3>
              <p style="font-size:0.9rem;">Register Number: <strong>${d.register_number}</strong></p>
            </div>
            <span class="blood-badge" style="font-size:1.1rem; padding:0.4rem 1rem;">${d.blood_group}</span>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:0.9rem;">
            <p><strong>Department:</strong> ${d.department}</p>
            <p><strong>State / UT:</strong> ${d.state_ut}</p>
            <p><strong>Primary Phone:</strong> ${d.contact_number}</p>
            <p><strong>Alt Phone:</strong> ${d.alt_contact_number || 'N/A'}</p>
            <p><strong>Email:</strong> ${d.email}</p>
            <p><strong>Last Donated Date:</strong> ${formatDate(d.last_donated_date)}</p>
            <p><strong>Languages Known:</strong> ${Array.isArray(d.languages) ? d.languages.join(', ') : d.languages}</p>
            <p><strong>Registered Date:</strong> ${formatDate(d.created_at)}</p>
          </div>

          <hr style="border:none; border-top:1px solid var(--border-color); margin:8px 0;">

          <h4 style="color:var(--primary-red); font-size:1.1rem;"><i class="fas fa-user-shield me-2"></i> Sensitive Health & Lifestyle Information</h4>
          <div style="background:var(--bg-subtle); padding:1rem; border-radius:10px; font-size:0.9rem; display:flex; flex-direction:column; gap:8px;">
            <p><strong>Regular Health Problem:</strong> ${d.has_health_problem ? '<span style="color:#EF4444; font-weight:bold;">Yes</span> — ' + (d.health_problem_details || 'No details provided') : '<span style="color:#10B981; font-weight:bold;">No</span>'}</p>
            <p><strong>Taking Regular Medicine:</strong> ${d.has_regular_medicine ? '<span style="color:#EF4444; font-weight:bold;">Yes</span> — ' + (d.medicine_details || 'No details provided') : '<span style="color:#10B981; font-weight:bold;">No</span>'}</p>
            <p><strong>Alcohol / Substance Consumption:</strong> ${d.consumes_alcohol_substance ? '<span style="color:#EF4444; font-weight:bold;">Yes</span>' : '<span style="color:#10B981; font-weight:bold;">No</span>'}</p>
          </div>
        </div>
      `,
      footerButtons: [
        {
          text: '<i class="fas fa-edit me-1"></i> Edit Profile',
          class: 'btn-soft-red',
          onClick: (close) => { close(); editDonorRecord(id); }
        },
        { text: '<i class="fas fa-arrow-left me-1"></i> Back to Directory', class: 'btn-secondary', onClick: (close) => close() }
      ]
    });
  } catch (err) {
    console.error(err);
    showToast('Failed to view donor profile.', 'error');
  }
}

// Admin Add Donor Modal & Inline Trigger
function openAddDonorModal() {
  showModal({
    title: '➕ Add New Donor Record',
    body: `
      <form id="adminAddForm" onsubmit="event.preventDefault();" style="display:flex; flex-direction:column; gap:12px; max-height:70vh; overflow-y:auto; padding-right:6px;">
        <div class="form-group">
          <label class="form-label">Full Name <span style="color:var(--primary-red);">*</span></label>
          <input type="text" id="addName" class="form-control" placeholder="Enter your Name" required>
        </div>

        <div class="form-group">
          <label class="form-label">Blood Group <span style="color:var(--primary-red);">*</span></label>
          <select id="addBloodGroup" class="form-select" required>
            <option value="">-- Select Blood Group --</option>
            ${['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Bombay Blood Group (hh)', 'Rh-null (Rare)'].map(bg => `<option value="${bg}">${bg}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Department / Programme <span style="color:var(--primary-red);">*</span></label>
          <select id="addDepartment" class="form-select" required>
            <option value="">-- Select Department --</option>
            ${PU_DEPARTMENTS.map(dept => {
              const clean = dept.replace(/^\d+\.\s*/, '');
              return `<option value="${clean}">${dept}</option>`;
            }).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">University Register Number <span style="color:var(--primary-red);">*</span></label>
          <input type="text" id="addRegNo" class="form-control" placeholder="e.g. 25MCA00PY0085" required>
        </div>

        <div class="form-group">
          <label class="form-label">Contact Number <span style="color:var(--primary-red);">*</span></label>
          <input type="tel" id="addPhone" class="form-control" placeholder="10-digit Indian Mobile" required>
        </div>

        <div class="form-group">
          <label class="form-label">Alternative Contact Number</label>
          <input type="tel" id="addAltPhone" class="form-control" placeholder="Optional 10-digit Mobile">
        </div>

        <div class="form-group">
          <label class="form-label">Email Address <span style="color:var(--primary-red);">*</span></label>
          <input type="email" id="addEmail" class="form-control" placeholder="e.g. name@pondiuni.edu.in" required>
        </div>

        <div class="form-group">
          <label class="form-label">State / Union Territory <span style="color:var(--primary-red);">*</span></label>
          <select id="addState" class="form-select" required>
            <option value="">-- Select State --</option>
            ${INDIAN_STATES_UTS.map(st => `<option value="${st}">${st}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Last Donated Date</label>
          <input type="date" id="addDonatedDate" class="form-control" max="${new Date().toISOString().split('T')[0]}">
        </div>

        <div class="form-group">
          <label class="form-label">Languages Known <span style="color:var(--primary-red);">*</span></label>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:6px; background:var(--bg-subtle); padding:8px; border-radius:8px; max-height:140px; overflow-y:auto;">
            ${CONSTITUTIONAL_LANGUAGES.map(lang => `
              <label class="checkbox-label" style="font-size:0.85rem;">
                <input type="checkbox" name="addLanguages" value="${lang}">
                <span>${lang}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Regular Health Problem?</label>
          <select id="addHasHealth" class="form-select" onchange="document.getElementById('addHealthDetailsBox').style.display = this.value === '1' ? 'block' : 'none'">
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>
          <div id="addHealthDetailsBox" style="display:none; margin-top:6px;">
            <input type="text" id="addHealthDetails" class="form-control" placeholder="Specify health problem...">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Taking Regular Medicine?</label>
          <select id="addHasMedicine" class="form-select" onchange="document.getElementById('addMedicineDetailsBox').style.display = this.value === '1' ? 'block' : 'none'">
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>
          <div id="addMedicineDetailsBox" style="display:none; margin-top:6px;">
            <input type="text" id="addMedicineDetails" class="form-control" placeholder="Specify medicine...">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Consumes Alcohol / Substances?</label>
          <select id="addSubstance" class="form-select">
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>
        </div>
      </form>
    `,
    footerButtons: [
      {
        text: '<i class="fas fa-check-circle me-1"></i> Save & Add Donor',
        class: 'btn-soft-red',
        onClick: async (close) => {
          const name = document.getElementById('addName').value.trim();
          const blood_group = document.getElementById('addBloodGroup').value;
          const department = document.getElementById('addDepartment').value;
          const register_number = document.getElementById('addRegNo').value.trim();
          const contact_number = document.getElementById('addPhone').value.trim();
          const alt_contact_number = document.getElementById('addAltPhone').value.trim();
          const email = document.getElementById('addEmail').value.trim();
          const state_ut = document.getElementById('addState').value;
          const last_donated_date = document.getElementById('addDonatedDate').value || null;

          const langBoxes = document.querySelectorAll('input[name="addLanguages"]:checked');
          const languages = Array.from(langBoxes).map(cb => cb.value);

          if (!name) {
            showToast('Please enter the Full Name.', 'error');
            return;
          }
          if (!blood_group) {
            showToast('Please select a Blood Group.', 'error');
            return;
          }
          if (!department) {
            showToast('Please select a Department.', 'error');
            return;
          }
          if (!register_number) {
            showToast('Please enter the University Register Number.', 'error');
            return;
          }

          const phoneRegex = /^[6-9]\d{9}$/;
          if (!contact_number || !phoneRegex.test(contact_number)) {
            showToast('Please enter a valid 10-digit Indian contact number.', 'error');
            return;
          }

          if (alt_contact_number && !phoneRegex.test(alt_contact_number)) {
            showToast('Alternative contact number must be a valid 10-digit Indian mobile number.', 'error');
            return;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!email || !emailRegex.test(email)) {
            showToast('Please enter a valid Email Address.', 'error');
            return;
          }

          if (!state_ut) {
            showToast('Please select a State / Union Territory.', 'error');
            return;
          }

          if (languages.length === 0) {
            showToast('Please select at least one language known.', 'error');
            return;
          }

          const has_health_problem = document.getElementById('addHasHealth').value === '1';
          const health_problem_details = has_health_problem ? document.getElementById('addHealthDetails').value.trim() : null;
          if (has_health_problem && !health_problem_details) {
            showToast('Please specify details for the regular health problem.', 'error');
            return;
          }

          const has_regular_medicine = document.getElementById('addHasMedicine').value === '1';
          const medicine_details = has_regular_medicine ? document.getElementById('addMedicineDetails').value.trim() : null;
          if (has_regular_medicine && !medicine_details) {
            showToast('Please specify details for regular medicine taken.', 'error');
            return;
          }

          const consumes_alcohol_substance = document.getElementById('addSubstance').value === '1';

          const payload = {
            name,
            blood_group,
            department,
            register_number,
            contact_number,
            alt_contact_number: alt_contact_number || null,
            email,
            state_ut,
            last_donated_date,
            languages,
            has_health_problem,
            health_problem_details,
            has_regular_medicine,
            medicine_details,
            consumes_alcohol_substance,
            declaration_agreed: true
          };

          try {
            const res = await fetch('/api/admin/donors', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok && data.success) {
              showToast('New donor added successfully!', 'success');
              close();
              toggleAddDonorForm(false);
              loadDonors(1);
            } else {
              showToast(data.message || 'Failed to add new donor.', 'error');
            }
          } catch (err) {
            console.error(err);
            showToast('Network error creating donor record.', 'error');
          }
        }
      },
      { text: 'Cancel', class: 'btn-secondary', onClick: (close) => close() }
    ]
  });
}

async function handleInlineAddDonorSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('inlineAddName').value.trim();
  const blood_group = document.getElementById('inlineAddBloodGroup').value;
  const department = document.getElementById('inlineAddDept').value;
  const register_number = document.getElementById('inlineAddRegNo').value.trim();
  const contact_number = document.getElementById('inlineAddPhone').value.trim();
  const alt_contact_number = document.getElementById('inlineAddAltPhone').value.trim();
  const email = document.getElementById('inlineAddEmail').value.trim();
  const state_ut = document.getElementById('inlineAddState').value;
  const last_donated_date = document.getElementById('inlineAddDonatedDate').value || null;

  const langBoxes = document.querySelectorAll('input[name="inlineLanguages"]:checked');
  const languages = Array.from(langBoxes).map(cb => cb.value);

  if (!name || !blood_group || !department || !register_number || !contact_number || !email || !state_ut) {
    showToast('Please complete all required fields.', 'error');
    return;
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(contact_number)) {
    showToast('Please enter a valid 10-digit Indian contact number.', 'error');
    return;
  }

  if (alt_contact_number && !phoneRegex.test(alt_contact_number)) {
    showToast('Alternative contact number must be a valid 10-digit Indian mobile number.', 'error');
    return;
  }

  if (languages.length === 0) {
    showToast('Please select at least one language known.', 'error');
    return;
  }

  const has_health_problem = document.getElementById('inlineAddHasHealth').value === '1';
  const health_problem_details = has_health_problem ? document.getElementById('inlineAddHealthDetails').value.trim() : null;
  if (has_health_problem && !health_problem_details) {
    showToast('Please specify details for the regular health problem.', 'error');
    return;
  }

  const has_regular_medicine = document.getElementById('inlineAddHasMedicine').value === '1';
  const medicine_details = has_regular_medicine ? document.getElementById('inlineAddMedicineDetails').value.trim() : null;
  if (has_regular_medicine && !medicine_details) {
    showToast('Please specify details for regular medicine taken.', 'error');
    return;
  }

  const consumes_alcohol_substance = document.getElementById('inlineAddSubstance').value === '1';

  const payload = {
    name,
    blood_group,
    department,
    register_number,
    contact_number,
    alt_contact_number: alt_contact_number || null,
    email,
    state_ut,
    last_donated_date,
    languages,
    has_health_problem,
    health_problem_details,
    has_regular_medicine,
    medicine_details,
    consumes_alcohol_substance,
    declaration_agreed: true
  };

  try {
    const res = await fetch('/api/admin/donors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast('New donor added successfully!', 'success');
      toggleAddDonorForm(false);
      loadDonors(1);
    } else {
      showToast(data.message || 'Failed to add new donor.', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Network error creating donor record.', 'error');
  }
}

// Edit Donor Record Modal
async function editDonorRecord(id) {
  try {
    const res = await fetch(`/api/admin/donors/${id}`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast('Error loading donor data for edit.', 'error');
      return;
    }

    const d = data.donor;

    showModal({
      title: `Edit Donor Record — ${d.name}`,
      body: `
        <form id="adminEditForm" style="display:flex; flex-direction:column; gap:12px; max-height:70vh; overflow-y:auto; padding-right:6px;">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="editName" class="form-control" value="${d.name}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Blood Group</label>
            <select id="editBloodGroup" class="form-select">
              ${['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Bombay Blood Group (hh)', 'Rh-null (Rare)'].map(bg => `<option value="${bg}" ${d.blood_group === bg ? 'selected' : ''}>${bg}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Department</label>
            <select id="editDepartment" class="form-select">
              ${PU_DEPARTMENTS.map(dept => {
                const clean = dept.replace(/^\d+\.\s*/, '');
                return `<option value="${clean}" ${d.department === clean ? 'selected' : ''}>${dept}</option>`;
              }).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Register Number</label>
            <input type="text" id="editRegNo" class="form-control" value="${d.register_number}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Contact Number</label>
            <input type="text" id="editPhone" class="form-control" value="${d.contact_number}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="editEmail" class="form-control" value="${d.email}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Last Donated Date</label>
            <input type="date" id="editDonatedDate" class="form-control" value="${d.last_donated_date || ''}">
          </div>

          <div class="form-group">
            <label class="form-label">State / UT</label>
            <select id="editState" class="form-select">
              ${INDIAN_STATES_UTS.map(st => `<option value="${st}" ${d.state_ut === st ? 'selected' : ''}>${st}</option>`).join('')}
            </select>
          </div>
        </form>
      `,
      footerButtons: [
        {
          text: '<i class="fas fa-save me-1"></i> Save Changes',
          class: 'btn-soft-red',
          onClick: async (close) => {
            const updatePayload = {
              name: document.getElementById('editName').value.trim(),
              blood_group: document.getElementById('editBloodGroup').value,
              department: document.getElementById('editDepartment').value,
              register_number: document.getElementById('editRegNo').value.trim(),
              contact_number: document.getElementById('editPhone').value.trim(),
              alt_contact_number: d.alt_contact_number,
              email: document.getElementById('editEmail').value.trim(),
              last_donated_date: document.getElementById('editDonatedDate').value || null,
              state_ut: document.getElementById('editState').value,
              languages: d.languages,
              has_health_problem: d.has_health_problem,
              health_problem_details: d.health_problem_details,
              has_regular_medicine: d.has_regular_medicine,
              medicine_details: d.medicine_details,
              consumes_alcohol_substance: d.consumes_alcohol_substance
            };

            const updateRes = await fetch(`/api/admin/donors/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatePayload)
            });

            const updateData = await updateRes.json();
            if (updateRes.ok && updateData.success) {
              showToast('Donor record updated successfully!', 'success');
              close();
              loadDonors(currentPage);
            } else {
              showToast(updateData.message || 'Failed to update donor record.', 'error');
            }
          }
        },
        { text: '<i class="fas fa-arrow-left me-1"></i> Cancel & Back to Directory', class: 'btn-secondary', onClick: (close) => close() }
      ]
    });
  } catch (err) {
    console.error(err);
    showToast('Failed to edit donor.', 'error');
  }
}

// Delete Donor Confirmation
function confirmDeleteDonor(id, name) {
  showModal({
    title: 'Confirm Delete',
    body: `
      <div style="text-align:center; padding:1rem;">
        <div style="font-size:3rem; color:#EF4444;"><i class="fas fa-exclamation-triangle"></i></div>
        <h4 style="margin-top:0.5rem;">Are you sure you want to delete this donor?</h4>
        <p style="color:var(--text-muted); margin-top:0.5rem;">
          Donor: <strong>${name}</strong> (ID: ${id})<br>This action cannot be undone.
        </p>
      </div>
    `,
    footerButtons: [
      {
        text: '<i class="fas fa-trash me-1"></i> Yes, Delete Record',
        class: 'btn-danger',
        onClick: async (close) => {
          try {
            const res = await fetch(`/api/admin/donors/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
              showToast('Donor record deleted successfully.', 'success');
              close();
              loadDonors(currentPage);
            } else {
              showToast(data.message || 'Failed to delete record.', 'error');
            }
          } catch (e) {
            showToast('Network error while deleting.', 'error');
          }
        }
      },
      { text: '<i class="fas fa-times me-1"></i> Cancel & Back to Directory', class: 'btn-secondary', onClick: (close) => close() }
    ]
  });
}

// Export Records Handler (CSV, Excel, Print)
function triggerExport(format) {
  const params = new URLSearchParams({
    format: format,
    search: document.getElementById('adminSearchInput')?.value.trim() || '',
    blood_group: document.getElementById('adminFilterBloodGroup')?.value || '',
    department: document.getElementById('adminFilterDept')?.value || '',
    state_ut: document.getElementById('adminFilterState')?.value || ''
  });

  if (format === 'csv' || format === 'excel') {
    window.location.href = `/api/admin/export?${params.toString()}`;
  } else if (format === 'print') {
    window.print();
  }
}

// Admin Logout
async function handleLogout() {
  try {
    const res = await fetch('/api/admin/logout', { method: 'POST' });
    if (res.ok) {
      window.location.href = '/admin/login';
    }
  } catch (err) {
    window.location.href = '/admin/login';
  }
}

// 30-Minute Inactivity Session Timeout Functions
let inactivityTimer = null;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(autoLogoutDueToInactivity, THIRTY_MINUTES_MS);
}

async function autoLogoutDueToInactivity() {
  if (typeof showToast === 'function') {
    showToast('Session expired due to 30 minutes of inactivity.', 'error');
  }
  setTimeout(async () => {
    await handleLogout();
  }, 1000);
}

function initInactivityTracker() {
  const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
  activityEvents.forEach(event => {
    window.addEventListener(event, resetInactivityTimer, { passive: true });
  });
  resetInactivityTimer();
}

// Global Window Function Attachments for Inline Handlers
window.viewDonorDetails = viewDonorDetails;
window.editDonorRecord = editDonorRecord;
window.confirmDeleteDonor = confirmDeleteDonor;
window.triggerExport = triggerExport;
window.switchAdminTab = switchAdminTab;
window.loadDonors = loadDonors;
window.loadAuditLogs = loadAuditLogs;
