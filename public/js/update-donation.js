/* ====================================================================
   PU Blood Diary - Update Last Blood Donation Date Script
   ==================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const lookupForm = document.getElementById('donorLookupForm');
  const updateForm = document.getElementById('donationUpdateForm');

  const donorInfoCard = document.getElementById('donorInfoCard');

  if (!lookupForm || !updateForm) return;

  // Set max date on new donation date picker
  const newDateInput = document.getElementById('new_donation_date');
  if (newDateInput) {
    const today = new Date().toISOString().split('T')[0];
    newDateInput.setAttribute('max', today);
  }

  let currentDonor = null;

  // Step 1: Lookup Donor
  lookupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const identifierInput = document.getElementById('identifier');
    const identifier = identifierInput.value.trim();

    if (!identifier) {
      showToast('Please enter your University Register Number or Registered Email.', 'error');
      return;
    }

    const searchBtn = lookupForm.querySelector('button[type="submit"]');
    const originalBtnText = searchBtn.textContent;

    try {
      searchBtn.disabled = true;
      searchBtn.textContent = 'Searching...';

      const res = await fetch(`/api/donors/lookup?identifier=${encodeURIComponent(identifier)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        currentDonor = data.donor;

        // Display donor non-editable details
        document.getElementById('dispName').textContent = currentDonor.name;
        document.getElementById('dispBloodGroup').textContent = currentDonor.blood_group;
        document.getElementById('dispDepartment').textContent = currentDonor.department;
        document.getElementById('dispRegNo').textContent = currentDonor.register_number;
        document.getElementById('dispLastDonated').textContent = formatDate(currentDonor.last_donated_date);

        // Pre-fill current date if available
        if (currentDonor.last_donated_date) {
          newDateInput.value = currentDonor.last_donated_date;
        } else {
          newDateInput.value = '';
        }

        donorInfoCard.style.display = 'block';
        donorInfoCard.scrollIntoView({ behavior: 'smooth' });
        showToast('Donor record found. You can now update your donation date.', 'success');
      } else {
        donorInfoCard.style.display = 'none';
        currentDonor = null;
        showToast(data.message || 'No donor record found.', 'error');
      }
    } catch (err) {
      console.error('Lookup Error:', err);
      showToast('Network error while searching donor record.', 'error');
    } finally {
      searchBtn.disabled = false;
      searchBtn.textContent = originalBtnText;
    }
  });

  // Step 2: Submit New Donation Date
  updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentDonor) {
      showToast('Please search and verify your donor profile first.', 'error');
      return;
    }

    const newDate = newDateInput.value;
    if (!newDate) {
      showToast('Please select a valid new donation date.', 'error');
      return;
    }

    const updateBtn = updateForm.querySelector('button[type="submit"]');
    const originalBtnText = updateBtn.textContent;

    try {
      updateBtn.disabled = true;
      updateBtn.textContent = 'Updating...';

      const res = await fetch('/api/donors/update-donation-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: currentDonor.register_number,
          new_donation_date: newDate
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Last donation date updated successfully!', 'success');
        document.getElementById('dispLastDonated').textContent = formatDate(newDate);
        currentDonor.last_donated_date = newDate;
        
        showModal({
          title: 'Update Successful',
          body: `
            <div style="text-align:center; padding:1rem;">
              <div style="font-size:3rem; color:var(--primary-red);">✔</div>
              <h4 style="margin-top:0.5rem;">Donation Record Updated</h4>
              <p style="color:var(--text-muted); margin-top:0.5rem;">
                Last donation date for <strong>${currentDonor.name}</strong> (${currentDonor.blood_group}) has been updated to <strong>${formatDate(newDate)}</strong>.
              </p>
            </div>
          `,
          footerButtons: [
            {
              text: 'Return to Home',
              class: 'btn-primary',
              onClick: () => { window.location.href = '/'; }
            }
          ]
        });
      } else {
        showToast(data.message || 'Failed to update donation date.', 'error');
      }
    } catch (err) {
      console.error('Update Date Error:', err);
      showToast('Network error while updating donation date.', 'error');
    } finally {
      updateBtn.disabled = false;
      updateBtn.textContent = originalBtnText;
    }
  });
});
