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
const leadValue = document.querySelector('#leadValue');
const serviceSelect = document.querySelector('#service');

const demoLeads = [
  { name: 'A. Martinez', serviceNeeded: 'Deep cleaning', zipCode: '10458', status: 'New', isDemo: true },
  { name: 'K. Johnson', serviceNeeded: 'Move-in/move-out', zipCode: '10701', status: 'Called', isDemo: true },
  { name: 'R. Singh', serviceNeeded: 'Office cleaning', zipCode: '10454', status: 'Quoted', isDemo: true }
];

let ctaClicks = 0;
let leads = [...loadSavedLeads(), ...demoLeads];

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

function loadSavedLeads() {
  const savedLeads = localStorage.getItem(STORAGE_KEY);

  if (!savedLeads) {
    return [];
  }

  try {
    const parsedLeads = JSON.parse(savedLeads);
    return Array.isArray(parsedLeads) ? parsedLeads : [];
  } catch (error) {
    console.warn('Unable to read saved demo leads.', error);
    return [];
  }
}

function saveLeads() {
  const submittedLeads = leads.filter((lead) => !lead.isDemo);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submittedLeads));
}

function createLeadRow(lead) {
  const row = document.createElement('div');
  row.className = 'lead-row';

  const nameCell = document.createElement('span');
  nameCell.textContent = lead.name;

  const serviceCell = document.createElement('span');
  serviceCell.textContent = lead.serviceNeeded;

  const zipCell = document.createElement('span');
  zipCell.textContent = lead.zipCode;

  const statusCell = document.createElement('span');
  const statusPill = document.createElement('span');
  statusPill.className = 'status-pill';
  statusPill.textContent = lead.status || 'New';
  statusCell.append(statusPill);

  row.append(nameCell, serviceCell, zipCell, statusCell);
  return row;
}

function renderDashboard() {
  leadRows.replaceChildren(...leads.map(createLeadRow));

  leadCount.textContent = leads.length;
  leadValue.textContent = `$${leads.length * 299}`;

  const serviceTotals = leads.reduce((totals, lead) => {
    totals[lead.serviceNeeded] = (totals[lead.serviceNeeded] || 0) + 1;
    return totals;
  }, {});

  topService.textContent = Object.entries(serviceTotals)
    .sort((a, b) => b[1] - a[1])[0][0];
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
    id: crypto.randomUUID ? crypto.randomUUID() : `lead-${Date.now()}`,
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

const activeUtmData = getUtmData();
sourceMetric.textContent = activeUtmData.utm_source || 'direct/unknown';
renderDashboard();
