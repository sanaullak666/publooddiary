/* ====================================================================
   PU Blood Diary - Blood Request Script (WhatsApp Admin Integration)
   ==================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const bloodGroupSelect = document.getElementById('reqBloodGroup');
  const deptSelect = document.getElementById('reqDepartment');
  const notesInput = document.getElementById('reqNotes');
  const previewText = document.getElementById('requestPreviewText');
  const btnWa1 = document.getElementById('btnWaAdmin1');
  const btnWa2 = document.getElementById('btnWaAdmin2');

  const depts = window.PU_DEPARTMENTS || (typeof PU_DEPARTMENTS !== 'undefined' ? PU_DEPARTMENTS : []);

  // Populate Department Dropdown
  if (deptSelect) {
    deptSelect.innerHTML = '<option value="">All Departments (Optional)</option>';
    depts.forEach(dept => {
      const cleanDept = dept.replace(/^\d+\.\s*/, '');
      const opt = document.createElement('option');
      opt.value = cleanDept;
      opt.textContent = dept;
      deptSelect.appendChild(opt);
    });
  }

  // Update WhatsApp links based on user selections
  function updateWhatsAppButtons() {
    const bloodGroup = bloodGroupSelect ? bloodGroupSelect.value.trim() : '';
    const department = deptSelect ? deptSelect.value.trim() : '';
    const notes = notesInput ? notesInput.value.trim() : '';

    if (!bloodGroup) {
      if (previewText) {
        previewText.innerHTML = 'Please select a blood group above to enable WhatsApp request buttons.';
      }
      if (btnWa1) {
        btnWa1.classList.add('disabled');
        btnWa1.style.opacity = '0.5';
        btnWa1.style.pointerEvents = 'none';
        btnWa1.removeAttribute('href');
      }
      if (btnWa2) {
        btnWa2.classList.add('disabled');
        btnWa2.style.opacity = '0.5';
        btnWa2.style.pointerEvents = 'none';
        btnWa2.removeAttribute('href');
      }
      return;
    }

    let msg = `Hello Admin, I urgently require ${bloodGroup} blood donor assistance at Pondicherry University.`;
    if (department) {
      msg += `\n• Department: ${department}`;
    }
    if (notes) {
      msg += `\n• Details: ${notes}`;
    }
    msg += `\nPlease assist with available voluntary blood donors.`;

    const encodedMsg = encodeURIComponent(msg);
    const waUrl1 = `https://wa.me/919188382205?text=${encodedMsg}`;
    const waUrl2 = `https://wa.me/919444470765?text=${encodedMsg}`;

    if (previewText) {
      previewText.innerHTML = `<strong>Selected Blood Group:</strong> <span class="blood-badge" style="font-size:1.05rem; padding:4px 10px; margin-left:6px;">${bloodGroup}</span> ${department ? `(${department})` : ''}<br><span style="font-size:0.85rem; color:var(--text-muted); display:block; margin-top:6px;"><i class="fas fa-check-circle text-success me-1"></i> Ready to send request to Admin via WhatsApp</span>`;
    }

    if (btnWa1) {
      btnWa1.classList.remove('disabled');
      btnWa1.style.opacity = '1';
      btnWa1.style.pointerEvents = 'auto';
      btnWa1.href = waUrl1;
    }

    if (btnWa2) {
      btnWa2.classList.remove('disabled');
      btnWa2.style.opacity = '1';
      btnWa2.style.pointerEvents = 'auto';
      btnWa2.href = waUrl2;
    }
  }

  // Event Listeners
  if (bloodGroupSelect) bloodGroupSelect.addEventListener('change', updateWhatsAppButtons);
  if (deptSelect) deptSelect.addEventListener('change', updateWhatsAppButtons);
  if (notesInput) notesInput.addEventListener('input', updateWhatsAppButtons);

  // Check URL query parameters (e.g., /search?blood_group=O+)
  const urlParams = new URLSearchParams(window.location.search);
  const bgParam = urlParams.get('blood_group');
  if (bgParam && bloodGroupSelect) {
    bloodGroupSelect.value = bgParam;
  }

  // Initialize
  updateWhatsAppButtons();
});
