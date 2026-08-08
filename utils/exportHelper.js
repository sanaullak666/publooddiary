function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function generateCSV(donors) {
  const headers = [
    'ID',
    'Name',
    'Blood Group',
    'Register Number',
    'Department',
    'Contact Number',
    'Alt Contact Number',
    'Email',
    'State/UT',
    'Languages',
    'Last Donated Date',
    'Has Health Problem',
    'Health Problem Details',
    'Has Regular Medicine',
    'Medicine Details',
    'Consumes Alcohol/Substance',
    'Registered Date'
  ];

  const rows = donors.map(d => [
    d.id,
    d.name,
    d.blood_group,
    d.register_number,
    d.department,
    d.contact_number,
    d.alt_contact_number || 'N/A',
    d.email,
    d.state_ut,
    Array.isArray(d.languages) ? d.languages.join('; ') : d.languages,
    d.last_donated_date || 'Never',
    d.has_health_problem ? 'Yes' : 'No',
    d.health_problem_details || 'N/A',
    d.has_regular_medicine ? 'Yes' : 'No',
    d.medicine_details || 'N/A',
    d.consumes_alcohol_substance ? 'Yes' : 'No',
    d.created_at
  ]);

  const csvLines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map(row => row.map(escapeCsvField).join(','))
  ];

  return '\uFEFF' + csvLines.join('\n');
}

module.exports = {
  generateCSV
};
