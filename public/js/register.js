/* ====================================================================
   PU Blood Diary - Donor Registration Dynamic Script
   ==================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const regForm = document.getElementById('donorRegistrationForm');
  if (!regForm) return;

  // 1. Populate Departments
  const deptSelect = document.getElementById('department');
  if (deptSelect) {
    deptSelect.innerHTML = '<option value="">-- Select Department / Programme --</option>';
    PU_DEPARTMENTS.forEach(dept => {
      const cleanDept = dept.replace(/^\d+\.\s*/, '');
      const opt = document.createElement('option');
      opt.value = cleanDept;
      opt.textContent = dept;
      deptSelect.appendChild(opt);
    });
  }

  // 2. Populate States / UTs
  const stateSelect = document.getElementById('state_ut');
  if (stateSelect) {
    stateSelect.innerHTML = '<option value="">-- Select State / Union Territory --</option>';
    INDIAN_STATES_UTS.forEach(state => {
      const opt = document.createElement('option');
      opt.value = state;
      opt.textContent = state;
      stateSelect.appendChild(opt);
    });
  }

  // 3. Populate Languages Multi-Select Checkboxes (No default selection)
  const langContainer = document.getElementById('languagesContainer');
  if (langContainer) {
    langContainer.innerHTML = '';
    CONSTITUTIONAL_LANGUAGES.forEach(lang => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      label.innerHTML = `
        <input type="checkbox" name="languages" value="${lang}">
        <span>${lang}</span>
      `;
      langContainer.appendChild(label);
    });
  }

  // 4. Set Max Date for Last Donated Date to Today
  const dateInput = document.getElementById('last_donated_date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('max', today);
  }

  // 5. Conditional Health Problem Box
  const healthRadios = document.getElementsByName('has_health_problem');
  const healthBox = document.getElementById('healthProblemBox');
  healthRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === '1' || e.target.value === 'true') {
        healthBox.classList.add('active');
      } else {
        healthBox.classList.remove('active');
        document.getElementById('health_problem_details').value = '';
      }
    });
  });

  // 6. Conditional Regular Medicine Box
  const medicineRadios = document.getElementsByName('has_regular_medicine');
  const medicineBox = document.getElementById('medicineBox');
  medicineRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === '1' || e.target.value === 'true') {
        medicineBox.classList.add('active');
      } else {
        medicineBox.classList.remove('active');
        document.getElementById('medicine_details').value = '';
      }
    });
  });

  // 7. Form Submission Handler
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = regForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    // Collect Languages
    const langCheckboxes = document.querySelectorAll('input[name="languages"]:checked');
    const selectedLanguages = Array.from(langCheckboxes).map(cb => cb.value);

    if (selectedLanguages.length === 0) {
      showToast('Please select at least one language known.', 'error');
      return;
    }

    // Contact Number Check (10-digit Indian Mobile)
    const phoneRegex = /^[6-9]\d{9}$/;
    const contactNum = document.getElementById('contact_number').value.trim();
    if (!phoneRegex.test(contactNum)) {
      showToast('Please enter a valid 10-digit Indian mobile number.', 'error');
      return;
    }

    const altContactNum = document.getElementById('alt_contact_number').value.trim();
    if (altContactNum && !phoneRegex.test(altContactNum)) {
      showToast('Alternative contact number must be a valid 10-digit Indian mobile number.', 'error');
      return;
    }

    // Health / Medicine Values
    const hasHealthProblem = document.querySelector('input[name="has_health_problem"]:checked')?.value === '1';
    const healthProblemDetails = hasHealthProblem ? document.getElementById('health_problem_details').value.trim() : null;
    if (hasHealthProblem && !healthProblemDetails) {
      showToast('Please specify the details for your regular health problem.', 'error');
      return;
    }

    const hasMedicine = document.querySelector('input[name="has_regular_medicine"]:checked')?.value === '1';
    const medicineDetails = hasMedicine ? document.getElementById('medicine_details').value.trim() : null;
    if (hasMedicine && !medicineDetails) {
      showToast('Please specify the details of regular medicine taken.', 'error');
      return;
    }

    const consumesSubstance = document.querySelector('input[name="consumes_alcohol_substance"]:checked')?.value === '1';

    // Declaration Check
    const declaration = document.getElementById('declaration_agreed');
    if (!declaration || !declaration.checked) {
      showToast('You must agree to the declaration before registering.', 'error');
      return;
    }

    const formData = {
      name: document.getElementById('name').value.trim(),
      blood_group: document.getElementById('blood_group').value,
      last_donated_date: document.getElementById('last_donated_date').value || null,
      department: document.getElementById('department').value,
      register_number: document.getElementById('register_number').value.trim(),
      contact_number: contactNum,
      alt_contact_number: altContactNum || null,
      email: document.getElementById('email').value.trim(),
      state_ut: document.getElementById('state_ut').value,
      languages: selectedLanguages,
      has_health_problem: hasHealthProblem,
      health_problem_details: healthProblemDetails,
      has_regular_medicine: hasMedicine,
      medicine_details: medicineDetails,
      consumes_alcohol_substance: consumesSubstance,
      declaration_agreed: true
    };

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Registering Donor...';

      const response = await fetch('/api/donors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast('Registration Successful!', 'success');
        showModal({
          title: 'Registration Successful',
          body: `
            <div style="text-align:center; padding:1rem;">
              <div style="font-size:3rem; color:var(--primary-red); margin-bottom:0.5rem;"><i class="fas fa-check-circle"></i></div>
              <h4 style="font-size:1.3rem; margin-bottom:0.5rem;">Thank You, ${formData.name}!</h4>
              <p style="color:var(--text-muted);">Thank you for registering with PU Blood Diary — An initiative by NSS Pondicherry University.</p>
              <div style="background:var(--bg-subtle); padding:1rem; border-radius:12px; margin-top:1rem; text-align:left;">
                <p><strong>Register Number:</strong> <code>${formData.register_number}</code></p>
                <p><strong>Blood Group:</strong> <span class="blood-badge">${formData.blood_group}</span></p>
                <p><strong>Department:</strong> ${formData.department}</p>
              </div>
            </div>
          `,
          footerButtons: [
            {
              text: 'Go to Home',
              class: 'btn-soft-red',
              onClick: () => { window.location.href = '/'; }
            }
          ]
        });
        regForm.reset();
        document.querySelectorAll('.conditional-box').forEach(b => b.classList.remove('active'));
      } else {
        showToast(result.message || 'Registration failed.', 'error');
      }
    } catch (err) {
      console.error('Registration Error:', err);
      showToast('Network error while registering. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
});
