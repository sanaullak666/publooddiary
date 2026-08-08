/* ====================================================================
   PU Blood Diary - Public Donor Search Script
   ==================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('publicSearchForm');
  const resultsContainer = document.getElementById('searchResultsContainer');
  const searchCountEl = document.getElementById('searchCount');

  const depts = window.PU_DEPARTMENTS || (typeof PU_DEPARTMENTS !== 'undefined' ? PU_DEPARTMENTS : []);
  const states = window.INDIAN_STATES_UTS || (typeof INDIAN_STATES_UTS !== 'undefined' ? INDIAN_STATES_UTS : []);

  // Populate Dropdowns
  const deptSelect = document.getElementById('filterDept');
  if (deptSelect) {
    deptSelect.innerHTML = '<option value="">All Departments</option>';
    depts.forEach(dept => {
      const cleanDept = dept.replace(/^\d+\.\s*/, '');
      const opt = document.createElement('option');
      opt.value = cleanDept;
      opt.textContent = dept;
      deptSelect.appendChild(opt);
    });
  }

  const stateSelect = document.getElementById('filterState');
  if (stateSelect) {
    stateSelect.innerHTML = '<option value="">All States / UTs</option>';
    states.forEach(state => {
      const opt = document.createElement('option');
      opt.value = state;
      opt.textContent = state;
      stateSelect.appendChild(opt);
    });
  }

  // Perform Initial Load & Search
  fetchSearchResults();

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      fetchSearchResults();
    });
  }

  async function fetchSearchResults() {
    const bloodGroup = document.getElementById('filterBloodGroup')?.value || '';
    const department = document.getElementById('filterDept')?.value || '';
    const state = document.getElementById('filterState')?.value || '';
    const search = document.getElementById('filterKeyword')?.value || '';

    const queryParams = new URLSearchParams({
      blood_group: bloodGroup,
      department: department,
      state_ut: state,
      search: search
    });

    try {
      resultsContainer.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-muted);"><i class="fas fa-spinner fa-spin fa-2x mb-3 text-primary-red"></i><p style="margin-top:10px;">Searching voluntary blood donors...</p></div>';

      const res = await fetch(`/api/donors/search?${queryParams.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        renderResults(data.donors || []);
      } else {
        resultsContainer.innerHTML = `<div class="card" style="text-align:center;"><p>${data.message || 'Error loading search results.'}</p></div>`;
      }
    } catch (err) {
      console.error('Search Fetch Error:', err);
      resultsContainer.innerHTML = '<div class="card" style="text-align:center; color:var(--primary-red);"><p>Error connecting to server. Please try again.</p></div>';
    }
  }

  function renderResults(donors) {
    const list = Array.isArray(donors) ? donors : [];
    if (searchCountEl) {
      searchCountEl.textContent = `Found ${list.length} matching blood donor${list.length === 1 ? '' : 's'}`;
    }

    if (list.length === 0) {
      resultsContainer.innerHTML = `
        <div class="card" style="text-align:center; padding:3rem;">
          <div style="font-size:2.5rem; color:var(--text-muted); margin-bottom:1rem;">🩸</div>
          <h3>No Matching Donors Found</h3>
          <p style="color:var(--text-muted); margin-top:0.5rem;">Try adjusting your blood group, department, or location filters.</p>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:1.25rem;">
        ${donors.map(donor => {
          const eligibility = getDonationEligibility(donor.last_donated_date);

          return `
          <div class="donor-card" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:1rem;">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div style="width:50px; height:50px; border-radius:50%; background:var(--primary-red-light); display:flex; align-items:center; justify-content:center; font-size:1.4rem; color:var(--primary-red);">
                    <i class="fas fa-user"></i>
                  </div>
                  <div>
                    <h4 style="font-size:1.1rem; margin-bottom:2px;">${donor.name}</h4>
                    <span class="blood-badge">${donor.blood_group}</span>
                  </div>
                </div>
                <div>${eligibility.badgeHtml}</div>
              </div>
              
              <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:0.4rem;">
                <i class="fas fa-building me-2 text-primary-red"></i> <strong>${donor.department}</strong>
              </p>
              <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:0.4rem;">
                <i class="fas fa-map-marker-alt me-2 text-primary-red"></i> ${donor.state_ut}
              </p>
              <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:0.4rem;">
                <i class="fas fa-language me-2 text-primary-red"></i> ${Array.isArray(donor.languages) ? donor.languages.join(', ') : donor.languages}
              </p>
              <p style="font-size:0.88rem; color:var(--text-muted);">
                <i class="fas fa-calendar-check me-2 text-primary-red"></i> Last Donated: <strong>${formatDate(donor.last_donated_date)}</strong>
              </p>
            </div>

            <div style="margin-top:1.25rem; padding-top:0.8rem; border-top:1px solid var(--border-color); display:flex; gap:8px;">
              <a href="tel:${donor.contact_number}" class="btn btn-sm btn-outline-red" style="flex:1;"><i class="fas fa-phone"></i> Call</a>
              <a href="mailto:${donor.email}" class="btn btn-sm btn-secondary"><i class="fas fa-envelope"></i> Email</a>
            </div>
          </div>
        `}).join('')}
      </div>
    `;
  }
});
