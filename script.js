const STORAGE_KEY = 'bronxFreshCleaningLeads';
const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

const ctaLinks = document.querySelectorAll('a[href="#quote"]:not([data-package]), a[href="#services"]');
const packageLinks = document.querySelectorAll('[data-package]');
const clickMetric = document.querySelector('#clickMetric');
const sourceMetric = document.querySelector('#sourceMetric');
const intentMetric = document.querySelector('#intentMetric');
const quoteForm = document.querySelector('#quoteForm');
const formStatus = document.querySelector('#formStatus');
const leadRows = document.querySelector('#leadRows');
const leadCount = document.querySelector('#leadCount');
const topService = document.querySelector('#topService');
const topSource = document.querySelector('#topSource');
const serviceBreakdown = document.querySelector('#serviceBreakdown');
const propertyBreakdown = document.querySelector('#propertyBreakdown');
const sourceBreakdown = document.querySelector('#sourceBreakdown');
const clearLeadsButton = document.querySelector('#clearLeadsButton');
const serviceSelect = document.querySelector('#service');

const demoLeads = [
  {
    name: 'A. Martinez',
    serviceNeeded: 'Deep cleaning',
    propertyType: 'Apartment',
    zipCode: '10458',
    status: 'New',
    submittedAt: '2026-06-16T14:15:00.000Z',
    utm: { utm_source: 'google', utm_medium: 'paid_search', utm_campaign: 'bronx_deep_cleaning', utm_content: 'headline_a' },
    isDemo: true
  },
  {
    name: 'K. Johnson',
    serviceNeeded: 'Move-in/move-out',
    propertyType: 'House',
    zipCode: '10701',
    status: 'Called',
    submittedAt: '2026-06-15T18:30:00.000Z',
    utm: { utm_source: 'facebook', utm_medium: 'paid_social', utm_campaign: 'move_out_cleaning', utm_content: 'before_after' },
    isDemo: true
  },
  {
    name: 'R. Singh',
    serviceNeeded: 'Office cleaning',
    propertyType: 'Office',
    zipCode: '10454',
    status: 'Quoted',
    submittedAt: '2026-06-14T09:45:00.000Z',
    utm: { utm_source: 'direct/unknown', utm_medium: '', utm_campaign: '', utm_content: '' },
    isDemo: true
  }
];

let ctaClicks = 0;
const savedLeadState = loadSavedLeadState();
let leads = savedLeadState.hasStoredLeads ? savedLeadState.leads : [...demoLeads];

// Capture the visitor's ad campaign data once so every submitted lead gets the same attribution.
function getUtmData() {
  const params = new URLSearchParams(window.location.search);
  const utmData = {};
  let hasUtmData = false;

  UTM_FIELDS.forEach((field) => {
    const value = params.get(field);
    utmData[field] = value || '';
    hasUtmData = hasUtmData || Boolean(value);
  });

  if (!hasUtmData) {
    utmData.utm_source = 'direct/unknown';
  }

  return utmData;
}

function loadSavedLeadState() {
  const savedLeads = localStorage.getItem(STORAGE_KEY);

  if (!savedLeads) {
    return { hasStoredLeads: false, leads: [] };
  }

  try {
    const parsedLeads = JSON.parse(savedLeads);
    return {
      hasStoredLeads: true,
      leads: Array.isArray(parsedLeads) ? parsedLeads : []
    };
  } catch (error) {
    console.warn('Unable to read saved demo leads.', error);
    return { hasStoredLeads: true, leads: [] };
  }
}

function saveLeads() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

function getLeadSource(lead) {
  return lead.utm?.utm_source || 'direct/unknown';
}

function countBy(leadsToCount, getValue) {
  return leadsToCount.reduce((totals, lead) => {
    const value = getValue(lead) || 'Not provided';
    totals[value] = (totals[value] || 0) + 1;
    return totals;
  }, {});
}

function getTopLabel(totals, fallback) {
  const sortedTotals = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  return sortedTotals.length > 0 ? sortedTotals[0][0] : fallback;
}

function renderBreakdown(container, totals) {
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    container.innerHTML = '<p class="empty-dashboard-note">No leads yet.</p>';
    return;
  }

  container.replaceChildren(...entries.map(([label, count]) => {
    const item = document.createElement('div');
    item.className = 'breakdown-item';

    const labelText = document.createElement('span');
    labelText.textContent = label;

    const countText = document.createElement('strong');
    countText.textContent = count;

    item.append(labelText, countText);
    return item;
  }));
}

function createLeadRow(lead) {
  const row = document.createElement('div');
  row.className = 'lead-row';

  const nameCell = document.createElement('span');
  nameCell.textContent = lead.name;

  const serviceCell = document.createElement('span');
  serviceCell.textContent = lead.serviceNeeded;

  const propertyCell = document.createElement('span');
  propertyCell.textContent = lead.propertyType || 'Not provided';

  const sourceCell = document.createElement('span');
  const sourcePill = document.createElement('span');
  sourcePill.className = 'status-pill';
  sourcePill.textContent = getLeadSource(lead);
  sourceCell.append(sourcePill);

  row.append(nameCell, serviceCell, propertyCell, sourceCell);
  return row;
}

function renderDashboard() {
  const serviceTotals = countBy(leads, (lead) => lead.serviceNeeded);
  const propertyTotals = countBy(leads, (lead) => lead.propertyType);
  const sourceTotals = countBy(leads, getLeadSource);
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
    .slice(0, 5);

  leadCount.textContent = leads.length;
  topService.textContent = getTopLabel(serviceTotals, 'No leads yet');
  topSource.textContent = getTopLabel(sourceTotals, 'No leads yet');
  renderBreakdown(serviceBreakdown, serviceTotals);
  renderBreakdown(propertyBreakdown, propertyTotals);
  renderBreakdown(sourceBreakdown, sourceTotals);

  if (recentLeads.length === 0) {
    leadRows.innerHTML = '<div class="lead-row empty-lead-row"><span>No recent leads yet.</span></div>';
  } else {
    leadRows.replaceChildren(...recentLeads.map(createLeadRow));
  }
}

function recordClick() {
  ctaClicks += 1;
  clickMetric.textContent = ctaClicks;
  intentMetric.textContent = ctaClicks >= 3 ? 'Hot lead' : 'Browsing services';
}

function setFieldError(field, hasError) {
  field.classList.toggle('field-error', hasError);
  field.setAttribute('aria-invalid', String(hasError));
}

function validateForm() {
  const requiredFields = ['name', 'phone', 'propertyType', 'service', 'zipCode', 'preferredDate', 'message'];
  const missingFields = requiredFields.filter((fieldName) => {
    const field = quoteForm.elements[fieldName];
    const isMissing = !field.value.trim();
    setFieldError(field, isMissing);
    return isMissing;
  });

  if (missingFields.length > 0) {
    formStatus.className = 'form-status form-status-error';
    formStatus.textContent = 'Please complete all required fields before sending your quote request.';
    quoteForm.elements[missingFields[0]].focus();
    return false;
  }

  return true;
}

function buildLead(formData) {
  return {
    id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `lead-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    status: 'New',
    name: formData.get('name').trim(),
    phone: formData.get('phone').trim(),
    email: formData.get('email').trim(),
    propertyType: formData.get('propertyType'),
    serviceNeeded: formData.get('service'),
    zipCode: formData.get('zipCode').trim(),
    preferredDate: formData.get('preferredDate'),
    message: formData.get('message').trim(),
    utm: getUtmData()
  };
}

ctaLinks.forEach((link) => {
  link.addEventListener('click', recordClick);
});

packageLinks.forEach((link) => {
  link.addEventListener('click', () => {
    const packageName = link.dataset.package;
    recordClick();

    if (packageName.includes('Deep')) {
      serviceSelect.value = 'Deep cleaning';
    } else if (packageName.includes('Move')) {
      serviceSelect.value = 'Move-in/move-out';
    } else {
      serviceSelect.value = 'Standard cleaning';
    }
  });
});

quoteForm.addEventListener('input', (event) => {
  if (event.target.matches('input, select, textarea')) {
    setFieldError(event.target, false);
  }
});

quoteForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const lead = buildLead(new FormData(quoteForm));
  leads = [lead, ...leads];
  saveLeads();
  renderDashboard();

  console.log('Bronx Fresh Cleaning Co. demo lead:', lead);

  intentMetric.textContent = 'Quote submitted';
  formStatus.className = 'form-status form-status-success';
  formStatus.textContent = 'Thanks. Your quote request was received and saved to the demo dashboard.';
  quoteForm.reset();
});

clearLeadsButton.addEventListener('click', () => {
  leads = [];
  saveLeads();
  renderDashboard();
  intentMetric.textContent = 'Dashboard cleared';
});

const activeUtmData = getUtmData();
sourceMetric.textContent = activeUtmData.utm_source || 'direct/unknown';
renderDashboard();
