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

let ctaClicks = 0;
let leads = [
  { name: 'A. Martinez', service: 'Deep Cleaning', area: 'Fordham', status: 'New' },
  { name: 'K. Johnson', service: 'Move-Out Shine', area: 'Yonkers', status: 'Called' },
  { name: 'R. Singh', service: 'Office Cleaning', area: 'Mott Haven', status: 'Quoted' }
];

function getTrafficSource() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('utm_source');

  if (source) {
    return source.charAt(0).toUpperCase() + source.slice(1);
  }

  if (document.referrer) {
    return 'Referral';
  }

  return 'Direct Visit';
}

function renderDashboard() {
  leadRows.innerHTML = leads.map((lead) => `
    <div class="lead-row">
      <span>${lead.name}</span>
      <span>${lead.service}</span>
      <span>${lead.area}</span>
      <span><span class="status-pill">${lead.status}</span></span>
    </div>
  `).join('');

  leadCount.textContent = leads.length;
  leadValue.textContent = `$${leads.length * 299}`;

  const serviceTotals = leads.reduce((totals, lead) => {
    totals[lead.service] = (totals[lead.service] || 0) + 1;
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

ctaLinks.forEach((link) => {
  link.addEventListener('click', recordClick);
});

packageLinks.forEach((link) => {
  link.addEventListener('click', () => {
    const packageName = link.dataset.package;
    recordClick();

    if (packageName.includes('Deep')) {
      serviceSelect.value = 'Deep Cleaning';
    } else if (packageName.includes('Move')) {
      serviceSelect.value = 'Move-In / Move-Out Cleaning';
    } else {
      serviceSelect.value = 'Residential Cleaning';
    }
  });
});

quoteForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(quoteForm);
  const name = formData.get('name').trim();
  const service = formData.get('service');
  const area = formData.get('location').trim();

  leads = [
    { name, service, area, status: 'New' },
    ...leads
  ];

  renderDashboard();
  intentMetric.textContent = 'Quote submitted';
  formStatus.textContent = 'Thanks. Your demo quote request was added to the owner dashboard.';
  quoteForm.reset();
});

sourceMetric.textContent = getTrafficSource();
renderDashboard();
