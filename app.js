// ===== LAWN CRM APP =====

const STORAGE_KEY = 'lawn_crm_v1';

// ===== STATE =====
let state = {
  view: 'dashboard',
  activeClientId: null,
  paymentsFilter: 'all',
  clientTypeFilter: 'active',
  clientSort: 'alpha',
  searchQuery: '',
  modal: null,
  calendarMonth: new Date().getMonth(),
  calendarYear: new Date().getFullYear(),
  calendarSelectedDay: null,
  expensesPeriod: '3M',
  expensesFilter: 'expenses',
  expensesTab: 'cashflow',
  catDrilldownPeriod: '3M',
  reportsPeriod: 'YTD',
  editingExpenseId: null,
  dashCalMonth: new Date().getMonth(),
  dashCalYear: new Date().getFullYear(),
};

// ===== DATA =====
const EXPENSE_CATEGORIES = [
  { id: 'equipment', label: 'Equipment & Tools', emoji: '🔧' },
  { id: 'fuel', label: 'Fuel & Transportation', emoji: '⛽' },
  { id: 'labor', label: 'Labor / Subcontractors', emoji: '👷' },
  { id: 'insurance', label: 'Insurance', emoji: '🛡️' },
  { id: 'software', label: 'Software & Apps', emoji: '💻' },
  { id: 'supplies', label: 'Supplies & Materials', emoji: '🧰' },
  { id: 'marketing', label: 'Marketing', emoji: '📣' },
  { id: 'other', label: 'Other', emoji: '📦' },
];

const EXPENSE_CAT_COLORS = {
  equipment: '#6366f1',
  fuel:      '#f59e0b',
  labor:     '#10b981',
  insurance: '#3b82f6',
  software:  '#8b5cf6',
  supplies:  '#ec4899',
  marketing: '#f97316',
  other:     '#94a3b8',
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (!d.expenses) d.expenses = [];
      if (!d.scheduledJobs) d.scheduledJobs = [];
      if (!d.timeEntries) d.timeEntries = [];
      if (d.activeClockIn === undefined) d.activeClockIn = null;
      // activeClockIn shape: { startTime: ISO string, clientId: string|null } | null
      return d;
    }
  } catch (e) {}
  return { clients: [], expenses: [], scheduledJobs: [] };
}

function saveData(data) {
  data.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getData() {
  return loadData();
}

// ===== HELPERS =====
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const AVATAR_COLORS = [
  '#2d6a4f','#40916c','#52b788','#e76f51','#264653','#e9c46a'
];

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function initials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatCurrency(n) {
  return '$' + Number(n || 0).toFixed(2).replace(/\.00$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso.slice(0, 10) + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const FREQ_LABELS = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  'one-time': 'One-time',
};

const FREQ_MULTIPLIERS = {
  weekly: 4.33,
  biweekly: 2.17,
  monthly: 1,
  'one-time': 0,
};

const SERVICE_TYPES = [
  { id: 'mowing',        label: 'Mowing',        emoji: '🌿' },
  { id: 'mulch',         label: 'Mulch',         emoji: '🍂' },
  { id: 'cleanup',       label: 'Cleanup',       emoji: '🧹' },
  { id: 'shrubs',        label: 'Shrubs',        emoji: '🌳' },
  { id: 'trash-can',     label: 'Trash Can',     emoji: '🗑️' },
  { id: 'junk-removal',  label: 'Junk Removal',  emoji: '🚛' },
  { id: 'other',         label: 'Other',         emoji: '🔧' },
];

// Per-service SVG icons (viewBox 0 0 24 24)
const SERVICE_ICON_SVG = {
  mowing: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="9" width="13" height="5" rx="1.5"/>
    <circle cx="5.5" cy="16.5" r="2"/>
    <circle cx="11.5" cy="16.5" r="2"/>
    <line x1="15" y1="9" x2="20.5" y2="3.5"/>
    <path d="M2 9 C3 6 6 4.5 9 5"/>
    <path d="M7 9 L7 5.5"/>
  </svg>`,
  mulch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="2" x2="12" y2="13"/>
    <path d="M8.5 13 Q8 20 12 21 Q16 20 15.5 13 Z"/>
    <line x1="9.5" y1="2" x2="14.5" y2="2"/>
  </svg>`,
  cleanup: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="3" x2="12" y2="14"/>
    <line x1="5.5" y1="14" x2="18.5" y2="14"/>
    <line x1="7"  y1="14" x2="5.5" y2="20"/>
    <line x1="10" y1="14" x2="9"   y2="20"/>
    <line x1="12" y1="14" x2="12"  y2="20"/>
    <line x1="14" y1="14" x2="15"  y2="20"/>
    <line x1="17" y1="14" x2="18.5" y2="20"/>
  </svg>`,
  shrubs: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 15 C4 9.5 7.5 6 12 6 C16.5 6 20 9.5 20 15"/>
    <line x1="3.5" y1="15" x2="20.5" y2="15"/>
    <line x1="12" y1="15" x2="12" y2="20"/>
    <line x1="8.5" y1="20" x2="15.5" y2="20"/>
  </svg>`,
  'trash-can': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 3h6v3H9z"/>
    <line x1="4" y1="6" x2="20" y2="6"/>
    <path d="M6 6l1.5 14a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9L18 6"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>`,
  'junk-removal': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1" y="12" width="22" height="7" rx="1.5"/>
    <path d="M4 12V9a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3"/>
    <line x1="8" y1="8" x2="8" y2="12"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="16" y1="8" x2="16" y2="12"/>
    <circle cx="6.5" cy="19.5" r="1.5"/>
    <circle cx="17.5" cy="19.5" r="1.5"/>
  </svg>`,
  other: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>`,
};

// Per-service color theming  { bg, color }
const SERVICE_ICON_COLORS = {
  mowing:      { bg: '#dcfce7', color: '#15803d' },
  mulch:       { bg: '#fef3c7', color: '#92400e' },
  cleanup:     { bg: '#dbeafe', color: '#1d4ed8' },
  shrubs:      { bg: '#d1fae5', color: '#065f46' },
  'trash-can':    { bg: '#f1f5f9', color: '#475569' },
  'junk-removal': { bg: '#fce7f3', color: '#9d174d' },
  other:          { bg: '#ede9fe', color: '#6d28d9' },
};

function serviceIconSvg(type) {
  return SERVICE_ICON_SVG[type] || SERVICE_ICON_SVG.other;
}

function serviceIconColors(type) {
  return SERVICE_ICON_COLORS[type] || SERVICE_ICON_COLORS.other;
}

function serviceEmoji(type) {
  return SERVICE_TYPES.find(s => s.id === type)?.emoji || '🔧';
}

function serviceLabel(type) {
  return SERVICE_TYPES.find(s => s.id === type)?.label || type;
}

// ===== COMPUTED STATS =====
function computeStats(data) {
  let monthlyRevenue = 0;
  let unpaidTotal = 0;
  let activeClients = 0;
  let paidThisMonth = 0;
  let ytdRevenue = 0;
  let monthlyExpenses = 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const yearStart = `${now.getFullYear()}-01-01`;

  for (const client of data.clients) {
    const clientStatus = client.status || 'active';
    let clientHasActive = false;
    for (const svc of (client.services || [])) {
      if (svc.active && clientStatus === 'active') {
        clientHasActive = true;
        monthlyRevenue += svc.price * (FREQ_MULTIPLIERS[svc.frequency] || 0);
      }
    }
    if (clientHasActive) activeClients++;

    for (const p of (client.payments || [])) {
      if (p.status === 'unpaid') unpaidTotal += p.amount;
      if (p.status === 'paid' && p.date >= monthStart.slice(0, 7)) paidThisMonth += p.amount;
      if (p.status === 'paid' && p.date >= yearStart) ytdRevenue += p.amount;
    }
  }

  // Monthly expense estimate from recurring expenses
  for (const exp of (data.expenses || [])) {
    if (exp.recurring && exp.type !== 'income') {
      monthlyExpenses += exp.amount;
    }
  }

  return { monthlyRevenue, unpaidTotal, activeClients, paidThisMonth, ytdRevenue, monthlyExpenses };
}

function getRecentPayments(data, limit = 8) {
  const all = [];
  for (const client of data.clients) {
    for (const p of (client.payments || [])) {
      all.push({ ...p, clientName: client.name, clientId: client.id });
    }
  }
  return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

function computeUpcomingJobs(data) {
  // Days-since thresholds: show client once they hit this mark
  const THRESHOLDS = { weekly: 4.5, biweekly: 10, monthly: 20 };
  // Full cycle length: used to determine overdue vs just due
  const CYCLE_DAYS  = { weekly: 7,   biweekly: 14, monthly: 30 };
  const now = new Date();
  const seen = new Set(); // deduplicate: one entry per client
  const results = [];

  for (const client of data.clients) {
    if ((client.status || 'active') !== 'active') continue;
    // Only track services that are active, have a threshold, and are not excluded
    const activeSvcs = (client.services || []).filter(s =>
      s.active &&
      THRESHOLDS[s.frequency] !== undefined &&
      s.trackSchedule !== false
    );
    if (!activeSvcs.length) continue;

    // Use the most recent payment of any kind as "last serviced" date
    const payments = (client.payments || []).filter(p => p.date).sort((a, b) => b.date.localeCompare(a.date));
    const lastPayment = payments[0] || null;
    const lastDate = lastPayment ? new Date(lastPayment.date + 'T12:00:00') : null;
    const daysSinceRaw = lastDate ? (now - lastDate) / 86400000 : null;

    // Pick the single most urgent qualifying service for this client
    let best = null;
    for (const svc of activeSvcs) {
      const threshold = THRESHOLDS[svc.frequency];
      const cycleDays  = CYCLE_DAYS[svc.frequency];
      if (daysSinceRaw === null || daysSinceRaw >= threshold) {
        const daysSince = daysSinceRaw !== null ? Math.floor(daysSinceRaw) : null;
        const isOverdue = daysSinceRaw !== null && daysSinceRaw >= cycleDays;
        const ratio = daysSince !== null ? daysSince / cycleDays : 999;
        if (!best || ratio > best.ratio) {
          best = { client, svc, daysSince, lastDate: lastPayment?.date, isOverdue, threshold, cycleDays, ratio };
        }
      }
    }
    if (best && !seen.has(client.id)) {
      seen.add(client.id);
      results.push(best);
    }
  }

  // Sort: never-serviced clients first, then most overdue by ratio
  results.sort((a, b) => {
    if (a.daysSince === null && b.daysSince !== null) return -1;
    if (a.daysSince !== null && b.daysSince === null) return 1;
    if (a.daysSince === null && b.daysSince === null) return a.client.name.localeCompare(b.client.name);
    return b.ratio - a.ratio;
  });
  return results;
}

// ===== NAVIGATE =====
function navigate(view, params = {}) {
  state.view = view;
  state.activeClientId = params.clientId || null;
  if (view === 'clients') state.clientTypeFilter = 'active';
  render();
  document.getElementById('main-content').scrollTop = 0;
  // update both bottom nav and sidebar active states
  document.querySelectorAll('.nav-btn[data-view], .sidebar-btn[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

// ===== MODAL =====
function openModal(type, data = {}) {
  state.modal = { type, data };
  renderModal();
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-sheet').classList.remove('hidden');
}

function closeModal() {
  state.modal = null;
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-sheet').classList.add('hidden');
  document.getElementById('modal-content').innerHTML = '';
}

// ===== UNDO =====
let _undoSnapshot = null;
let _undoTimer    = null;

function captureUndo() {
  _undoSnapshot = JSON.stringify(getData());
}

function performUndo() {
  if (!_undoSnapshot) return;
  saveData(JSON.parse(_undoSnapshot));
  _undoSnapshot = null;
  clearTimeout(_undoTimer);
  hideToast();
  render();
  showToast('Undone ✓');
}

function hideToast() {
  document.getElementById('toast').classList.add('hidden');
  _undoSnapshot = null;
}

// ===== TOAST =====
function showToast(msg, undoable = false) {
  clearTimeout(_undoTimer);
  const toast   = document.getElementById('toast');
  const msgEl   = document.getElementById('toast-msg');
  const undoBtn = document.getElementById('toast-undo');
  msgEl.textContent = msg;
  undoBtn.classList.toggle('hidden', !undoable);
  toast.classList.remove('hidden');
  _undoTimer = setTimeout(hideToast, undoable ? 5000 : 2200);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('toast-undo')?.addEventListener('click', performUndo);
});

// ===== CONFIRM DIALOG =====
function showConfirm(title, message, onOk) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-overlay').classList.remove('hidden');
  document.getElementById('confirm-ok').onclick = () => {
    document.getElementById('confirm-overlay').classList.add('hidden');
    onOk();
  };
  document.getElementById('confirm-cancel').onclick = () => {
    document.getElementById('confirm-overlay').classList.add('hidden');
  };
}

// ===== RENDER =====
function render() {
  checkAutoDebtPayments();
  const content = document.getElementById('main-content');
  if (state.view === 'dashboard') content.innerHTML = renderDashboard();
  else if (state.view === 'clients') content.innerHTML = renderClients();
  else if (state.view === 'client-detail') content.innerHTML = renderClientDetail();
  else if (state.view === 'today') content.innerHTML = renderToday();
  else if (state.view === 'reports') content.innerHTML = renderReports();
  else if (state.view === 'calendar') content.innerHTML = renderCalendar();
  else if (state.view === 'expenses') content.innerHTML = renderExpenses();
  else if (state.view === 'tools') content.innerHTML = renderTools();
  else if (state.view === 'settings') content.innerHTML = renderSettings();
  bindContentEvents();
}

// ===== DASHBOARD =====
function renderDashboard() {
  const data = getData();
  const stats = computeStats(data);
  const now = new Date();
  const today = todayISO();

  // ===== Dashboard Calendar =====
  const calYear  = state.dashCalYear;
  const calMonth = state.dashCalMonth;
  const calFirst = new Date(calYear, calMonth, 1);
  const calDays  = new Date(calYear, calMonth + 1, 0).getDate();
  const calStartDow = calFirst.getDay();
  const calMonthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const calMonthName = calFirst.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build payment map: date -> [{clientName, clientId, amount, status}]
  const jobMap = {};
  for (const client of data.clients) {
    for (const p of (client.payments || [])) {
      const key = (p.date || '').slice(0, 10);
      if (!key.startsWith(calMonthPrefix)) continue;
      if (!jobMap[key]) jobMap[key] = [];
      jobMap[key].push({ clientName: client.name, clientId: client.id, amount: p.amount, status: p.status, kind: 'payment' });
    }
  }

  // Build scheduled job map: date -> [{sjId, clientId, clientName, status, price}]
  const schedMap = {};
  for (const sj of (data.scheduledJobs || [])) {
    const key = (sj.date || '').slice(0, 10);
    if (!key.startsWith(calMonthPrefix)) continue;
    const client = data.clients.find(c => c.id === sj.clientId);
    if (!client) continue;
    // Projected price: use stored estimate if set, else sum recurring services
    const price = sj.estimatedPrice ||
      (client.services || [])
        .filter(s => s.frequency !== 'one-time')
        .reduce((s, svc) => s + (svc.price || 0), 0);
    if (!schedMap[key]) schedMap[key] = [];
    schedMap[key].push({ sjId: sj.id, clientId: sj.clientId, clientName: client.name, status: sj.status, kind: 'sched', price });
  }

  // Build calendar weeks
  const calWeeks = [];
  let calWeek = [];
  for (let i = 0; i < calStartDow; i++) calWeek.push(null);
  for (let d = 1; d <= calDays; d++) {
    calWeek.push(d);
    if (calWeek.length === 7) { calWeeks.push(calWeek); calWeek = []; }
  }
  if (calWeek.length) { while (calWeek.length < 7) calWeek.push(null); calWeeks.push(calWeek); }

  const dowLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const calGridHTML = calWeeks.map(wk => {
    let weekBilled     = 0;
    let weekCollected  = 0;
    let weekJobs       = 0;
    let weekProjected  = 0;

    const cells = wk.map(d => {
      if (!d) return `<div class="dcal-cell dcal-empty"></div>`;
      const key = `${calMonthPrefix}-${String(d).padStart(2, '0')}`;
      const payments  = jobMap[key] || [];
      const scheduled = schedMap[key] || [];
      const isToday   = key === today;

      const dayBilled    = payments.reduce((s, j) => s + j.amount, 0);
      const dayCollected = payments.filter(j => j.status === 'paid').reduce((s, j) => s + j.amount, 0);
      const dayUnpaid    = dayBilled - dayCollected;
      const dayProjected = scheduled.filter(s => s.status === 'scheduled').reduce((s, j) => s + (j.price || 0), 0);
      weekBilled     += dayBilled;
      weekCollected  += dayCollected;
      weekJobs       += payments.length;
      weekProjected  += dayProjected;

      // Merge: upcoming scheduled first, then done scheduled, then payments
      const upcoming   = scheduled.filter(s => s.status === 'scheduled');
      const doneScheds = scheduled.filter(s => s.status === 'done');
      const combined   = [...upcoming, ...doneScheds, ...payments];
      const MAX_SHOW   = 3;
      const shown      = combined.slice(0, MAX_SHOW);
      const extra      = combined.length - MAX_SHOW;
      const hasAny     = combined.length > 0;
      const hasUpcoming = upcoming.length > 0;

      const chips = shown.map(j => {
        const color = avatarColor(j.clientName);
        const name  = escHtml(j.clientName.split(' ')[0]);
        if (j.kind === 'sched' && j.status === 'scheduled') {
          return `<div class="dcal-chip dcal-chip-sched" data-client-id="${j.clientId}" style="border-color:${color}99;color:${color}">
            <span class="dcal-chip-dot dcal-chip-dot-sched" style="border:2px solid ${color}"></span>
            <span class="dcal-chip-name">${name}</span>
          </div>`;
        }
        return `<div class="dcal-chip" data-client-id="${j.clientId}" style="background:${color}18;border-color:${color}55">
          <span class="dcal-chip-dot" style="background:${color}${j.kind === 'sched' ? '88' : ''}"></span>
          <span class="dcal-chip-name">${name}</span>
        </div>`;
      }).join('');

      const extraChip = extra > 0
        ? `<div class="dcal-chip dcal-chip-more">+${extra}</div>`
        : '';

      // Day total
      let dayTotalHtml = '';
      if (dayBilled > 0) {
        if (dayUnpaid > 0 && dayCollected > 0) {
          dayTotalHtml = `<div class="dcal-total dcal-total-split">
            <span class="dcal-total-collected">${formatCurrency(dayCollected)}</span>
            <span class="dcal-total-billed">/${formatCurrency(dayBilled)}</span>
          </div>`;
        } else if (dayCollected === dayBilled) {
          dayTotalHtml = `<div class="dcal-total dcal-total-all-paid">${formatCurrency(dayBilled)}</div>`;
        } else {
          dayTotalHtml = `<div class="dcal-total dcal-total-unpaid">${formatCurrency(dayBilled)}</div>`;
        }
        // If there are ALSO pending scheduled jobs, append projected
        if (dayProjected > 0) {
          dayTotalHtml += `<div class="dcal-total dcal-total-proj">+~${formatCurrency(dayProjected)}</div>`;
        }
      } else if (dayProjected > 0) {
        // Only scheduled jobs — show projected P&L
        dayTotalHtml = `<div class="dcal-total dcal-total-proj">~${formatCurrency(dayProjected)}</div>`;
      } else if (hasUpcoming) {
        dayTotalHtml = `<div class="dcal-total dcal-sched-label">${upcoming.length} sched</div>`;
      }

      return `
        <div class="dcal-cell ${isToday ? 'dcal-today' : ''} ${hasAny ? 'dcal-has-jobs' : ''} ${hasUpcoming ? 'dcal-has-sched' : ''}" data-dcal-day="${key}">
          <div class="dcal-day-num ${isToday ? 'dcal-today-num' : ''}">${d}</div>
          ${dayTotalHtml}
          <div class="dcal-chips">${chips}${extraChip}</div>
        </div>`;
    }).join('');

    // Week summary: actual billed/collected + projected from scheduled
    let weekSummaryInner;
    if (weekBilled > 0) {
      const allCollected = weekCollected === weekBilled;
      const pct = Math.round((weekCollected / weekBilled) * 100);
      weekSummaryInner = `
        <div class="dcal-wk-billed">${formatCurrency(weekBilled)}</div>
        <div class="dcal-wk-collected ${allCollected ? 'dcal-wk-all-paid' : ''}">
          ${formatCurrency(weekCollected)} coll'd
        </div>
        ${!allCollected ? `<div class="dcal-wk-pct">${pct}%</div>` : ''}
        ${weekProjected > 0 ? `<div class="dcal-wk-proj">+~${formatCurrency(weekProjected)}</div>` : ''}`;
    } else if (weekProjected > 0) {
      weekSummaryInner = `
        <div class="dcal-wk-proj-main">~${formatCurrency(weekProjected)}</div>
        <div class="dcal-wk-proj-label">projected</div>`;
    } else {
      weekSummaryInner = `<div class="dcal-week-empty">—</div>`;
    }

    const weekSummary = `<div class="dcal-week-summary">${weekSummaryInner}</div>`;

    return `<div class="dcal-week">${cells}${weekSummary}</div>`;
  }).join('');

  // ===== Upcoming Jobs (computed early — used in both stat cards and panel) =====
  const upcomingJobs = computeUpcomingJobs(data);
  const jobsDueCount = upcomingJobs.length;
  const hasOverdue = upcomingJobs.some(j => j.isOverdue);

  // Progress toward monthly projected
  const collectedPct = stats.monthlyRevenue > 0
    ? Math.min(Math.round((stats.paidThisMonth / stats.monthlyRevenue) * 100), 100)
    : 0;

  // ===== Build HTML =====
  const upcomingHTML = upcomingJobs.length === 0
    ? `<div class="dash-empty">All clients are up to date.</div>`
    : upcomingJobs.map(({ client, svc, daysSince, isOverdue }) => {
        const urgency = daysSince === null ? 'new' : isOverdue ? 'overdue' : 'due';
        const badge = daysSince === null ? 'New client' : `${daysSince}d ago`;
        return `
          <div class="dash-upcoming-row" data-client-id="${client.id}">
            <div class="client-avatar" style="background:${avatarColor(client.name)};width:36px;height:36px;font-size:12px;flex-shrink:0">${initials(client.name)}</div>
            <div class="dash-list-info">
              <div class="dash-list-name">${escHtml(client.name)}</div>
              <div class="dash-list-sub">${serviceLabel(svc.type)} · ${FREQ_LABELS[svc.frequency]} · ${formatCurrency(svc.price)}</div>
            </div>
            <div class="dash-due-chip dash-due-${urgency}">${badge}</div>
          </div>`;
      }).join('');

  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return `
    <div class="dashboard-header">
      <div>
        <h1>${greeting}</h1>
        <p>${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card success" data-stat-card="ytd" style="cursor:pointer">
        <div class="stat-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          YTD Revenue
        </div>
        <div class="stat-value">${formatCurrency(stats.ytdRevenue)}</div>
        <div class="stat-sub">collected Jan – ${now.toLocaleDateString('en-US', { month: 'short' })}</div>
      </div>
      <div class="stat-card ${stats.unpaidTotal > 0 ? 'danger' : ''}" data-stat-card="unpaid" style="cursor:pointer">
        <div class="stat-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Unpaid Balance
        </div>
        <div class="stat-value">${formatCurrency(stats.unpaidTotal)}</div>
        <div class="stat-sub">${stats.unpaidTotal > 0 ? 'outstanding' : 'all clear'}</div>
      </div>
      <div class="stat-card ${jobsDueCount > 0 ? (hasOverdue ? 'danger' : 'warning') : ''}" data-stat-card="jobs-due" style="cursor:pointer">
        <div class="stat-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Jobs Due
        </div>
        <div class="stat-value">${jobsDueCount}</div>
        <div class="stat-sub">${jobsDueCount === 0 ? 'all up to date' : jobsDueCount === 1 ? 'client needs service' : 'clients need service'}</div>
      </div>
      <div class="stat-card" data-stat-card="this-month" style="cursor:pointer">
        <div class="stat-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          This Month
        </div>
        <div class="stat-value success">${formatCurrency(stats.paidThisMonth)}</div>
        <div class="stat-sub">
          <span class="stat-progress-bar" style="--pct:${collectedPct}%"></span>
          ${collectedPct}% of ${formatCurrency(stats.monthlyRevenue)} projected
        </div>
      </div>
    </div>

    <div class="dash-body">

      <div class="dash-left">
        <div class="dash-panel">
          <div class="dash-panel-header">
            <span>Schedule</span>
            <div class="dcal-nav">
              <button class="cal-nav-btn" id="dash-cal-prev">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span class="cal-month-label">${calMonthName}</span>
              <button class="cal-nav-btn" id="dash-cal-next">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
          <div class="dcal-grid">
            <div class="dcal-dow">
              ${dowLabels.map(h => `<div>${h}</div>`).join('')}
              <div class="dcal-dow-week-label">Week</div>
            </div>
            ${calGridHTML}
          </div>
        </div>
      </div>

      <div class="dash-right">

        <div class="dash-panel">
          <div class="dash-panel-header">
            <span>Upcoming Jobs</span>
            ${upcomingJobs.length > 0 ? `<span class="dash-panel-meta" style="color:${upcomingJobs.some(j=>j.isOverdue)?'var(--danger)':'var(--warning)'}">
              ${upcomingJobs.length} client${upcomingJobs.length !== 1 ? 's' : ''}
            </span>` : ''}
          </div>
          ${upcomingHTML}
        </div>

      </div>

    </div>

    <div class="spacer"></div>
  `;
}

// ===== CLIENT LIST =====
function renderClients() {
  const data = getData();
  const q = state.searchQuery.toLowerCase();
  const tf = state.clientTypeFilter;

  const clients = data.clients.filter(c => {
    const matchesSearch = !q || c.name.toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q);
    const clientStatus = c.status || 'active';
    const isOneTime = c.type === 'one-time';
    let matchesFilter;
    if (q)                 matchesFilter = true;  // searching → ignore tab filter
    else if (tf === 'all') matchesFilter = true;
    else if (tf === 'one-off') matchesFilter = isOneTime;
    else                   matchesFilter = !isOneTime && clientStatus === tf;
    return matchesSearch && matchesFilter;
  });

  const allCount      = data.clients.length;
  const oneOffCount   = data.clients.filter(c => c.type === 'one-time').length;
  const activeCount   = data.clients.filter(c => c.type !== 'one-time' && (c.status || 'active') === 'active').length;
  const pausedCount   = data.clients.filter(c => c.type !== 'one-time' && c.status === 'paused').length;
  const onCallCount   = data.clients.filter(c => c.type !== 'one-time' && c.status === 'on-call').length;
  const inactiveCount = data.clients.filter(c => c.type !== 'one-time' && c.status === 'inactive').length;

  const sort = state.clientSort || 'alpha';
  const sorted = [...clients].sort((a, b) => {
    if (sort === 'alpha') return a.name.localeCompare(b.name);
    if (sort === 'unpaid') {
      const ua = (a.payments || []).filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);
      const ub = (b.payments || []).filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);
      return ub - ua;
    }
    if (sort === 'most-paid') {
      const pa = (a.payments || []).filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
      const pb = (b.payments || []).filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
      return pb - pa;
    }
    if (sort === 'last-serviced') {
      const da = [...(a.payments || [])].filter(p => p.date && p.status === 'paid').sort((x, y) => y.date.localeCompare(x.date))[0]?.date || '0000';
      const db = [...(b.payments || [])].filter(p => p.date && p.status === 'paid').sort((x, y) => y.date.localeCompare(x.date))[0]?.date || '0000';
      return db.localeCompare(da);
    }
    return 0;
  });

  const sortLabels = { alpha: 'A–Z', unpaid: 'Unpaid', 'most-paid': 'Most Paid', 'last-serviced': 'Last Serviced' };

  const listHTML = sorted.length === 0
    ? `<div class="empty-state">
        <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
        <h3>${q ? 'No clients found' : 'No clients yet'}</h3>
        <p>${q ? 'Try a different search term.' : 'Tap the + button to add your first client.'}</p>
      </div>`
    : `<div class="clients-list-rows">${sorted.map(renderClientRow).join('')}</div>`;

  return `
    <div class="page-header">
      <div class="header-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
      <h1>Clients</h1>
    </div>
    <div class="search-bar">
      <div class="search-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="search" class="search-input" id="client-search" placeholder="Search clients..." value="${escHtml(state.searchQuery)}" autocomplete="off" />
        <button class="search-clear ${state.searchQuery ? '' : 'hidden'}" id="search-clear"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
    </div>
    <div class="client-filter-bar">
      <div class="client-filter-tabs">
        <button class="client-filter-tab ${tf === 'active' ? 'active' : ''}" data-client-filter="active">Active <span class="filter-count">${activeCount}</span></button>
        <button class="client-filter-tab ${tf === 'paused' ? 'active' : ''}" data-client-filter="paused">Paused <span class="filter-count">${pausedCount}</span></button>
        <button class="client-filter-tab ${tf === 'on-call' ? 'active' : ''}" data-client-filter="on-call">On-Call <span class="filter-count">${onCallCount}</span></button>
        <button class="client-filter-tab ${tf === 'inactive' ? 'active' : ''}" data-client-filter="inactive">Inactive <span class="filter-count">${inactiveCount}</span></button>
        <button class="client-filter-tab ${tf === 'one-off' ? 'active' : ''}" data-client-filter="one-off">One-Off <span class="filter-count">${oneOffCount}</span></button>
        <button class="client-filter-tab ${tf === 'all' ? 'active' : ''}" data-client-filter="all">All <span class="filter-count">${allCount}</span></button>
      </div>
      <div class="client-sort-dropdown">
        <button class="client-sort-btn" id="client-sort-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
          ${sortLabels[sort]}
        </button>
        <div class="client-sort-menu hidden" id="client-sort-menu">
          ${Object.entries(sortLabels).map(([val, label]) => `
            <button class="client-sort-option ${sort === val ? 'active' : ''}" data-sort="${val}">${label}</button>
          `).join('')}
        </div>
      </div>
    </div>
    ${listHTML}
    <div class="spacer"></div>
  `;
}

const CLIENT_STATUS_LABELS = { active: 'Active', paused: 'Paused', 'on-call': 'On-Call', inactive: 'Inactive' };

function clientStatusBadge(status) {
  const map = {
    paused:   `<span class="badge badge-paused">Paused</span>`,
    'on-call':`<span class="badge badge-on-call">On-Call</span>`,
    inactive: `<span class="badge badge-inactive">Inactive</span>`,
  };
  return map[status] || '';
}

function renderClientRow(client) {
  const clientStatus = client.status || 'active';
  const isOneOff = client.type === 'one-time';
  const activeSvcs = (client.services || []).filter(s => s.active);
  const primarySvc = activeSvcs[0];
  const unpaid = (client.payments || []).filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);
  const paidCount = (client.payments || []).filter(p => p.status === 'paid').length;

  const notes = client.clientNotes || [];
  const hasPinned = notes.some(n => n.pinned);
  const hasNotes  = notes.length > 0;
  const notesBadge = hasNotes
    ? `<span class="cn-job-badge ${hasPinned ? 'cn-job-badge-pin' : ''}" title="${hasPinned ? 'Has pinned note' : 'Has notes'}">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:10px;height:10px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
         ${notes.length}
       </span>`
    : '';

  const svcLine = isOneOff
    ? `${paidCount} job${paidCount !== 1 ? 's' : ''} on record`
    : primarySvc
      ? `${serviceLabel(primarySvc.type)} · ${FREQ_LABELS[primarySvc.frequency]} · ${formatCurrency(primarySvc.price)}${activeSvcs.length > 1 ? ` <span class="row-extra">+${activeSvcs.length - 1}</span>` : ''}`
      : 'No active services';

  return `
    <div class="client-row ${hasNotes ? 'client-row-has-notes' : ''} ${hasPinned ? 'client-row-has-pinned' : ''}" data-client-id="${client.id}">
      <div class="client-row-avatar" style="background:${avatarColor(client.name)}">${initials(client.name)}</div>
      <div class="client-row-main">
        <div class="client-row-name">${escHtml(client.name)}${clientStatusBadge(clientStatus)}${notesBadge}</div>
        <div class="client-row-sub">${svcLine}</div>
      </div>
      <div class="client-row-right">
        ${unpaid > 0
          ? `<span class="client-row-unpaid">${formatCurrency(unpaid)}</span>`
          : `<span class="client-row-paid">Paid up</span>`}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="client-row-chevron"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>`;
}

// ===== CLIENT DETAIL =====
function renderClientDetail() {
  const data = getData();
  const client = data.clients.find(c => c.id === state.activeClientId);
  if (!client) { navigate('clients'); return ''; }

  const allPayments   = client.payments || [];
  const paidPayments  = allPayments.filter(p => p.status === 'paid');
  const unpaid        = allPayments.filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);
  const totalPaid     = paidPayments.reduce((s, p) => s + p.amount, 0);
  const timesServiced = paidPayments.length;
  const avgPerVisit   = timesServiced > 0 ? totalPaid / timesServiced : 0;

  const sortedPaid = [...paidPayments].filter(p => p.date).sort((a, b) => b.date.localeCompare(a.date));
  const lastServiceDate = sortedPaid[0]?.date || null;
  const daysSinceLast   = lastServiceDate
    ? Math.floor((new Date() - new Date(lastServiceDate + 'T12:00:00')) / 86400000)
    : null;

  const clientSinceDate = allPayments.filter(p => p.date).sort((a, b) => a.date.localeCompare(b.date))[0]?.date || null;
  const clientSinceLabel = clientSinceDate
    ? new Date(clientSinceDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'No history';

  const monthlyValue = (client.services || [])
    .filter(s => s.frequency && s.frequency !== 'one-time')
    .reduce((s, svc) => {
      const price = svc.price || 0;
      if (svc.frequency === 'weekly')    return s + price * 4;
      if (svc.frequency === 'biweekly')  return s + price * 2;
      if (svc.frequency === 'monthly')   return s + price;
      return s;
    }, 0);

  const isOneTime = client.type === 'one-time';

  function renderServiceItem(svc) {
    const tracked = svc.trackSchedule !== false;
    const hasThreshold = ['weekly','biweekly','monthly'].includes(svc.frequency);
    const ic = serviceIconColors(svc.type);
    return `
      <div class="service-item">
        <div class="service-icon" style="background:${ic.bg};color:${ic.color}">${serviceIconSvg(svc.type)}</div>
        <div class="service-details">
          <div class="service-name">${serviceLabel(svc.type)}${svc.type === 'mowing' && svc.propertySize ? `<span class="svc-acreage-chip">${svc.propertySize} ac</span>` : ''}</div>
          <div class="service-meta">${FREQ_LABELS[svc.frequency] || svc.frequency}${svc.notes ? ' · ' + escHtml(svc.notes) : ''}</div>
          ${hasThreshold ? `
            <button class="svc-schedule-toggle ${tracked ? 'tracked' : 'untracked'}" data-toggle-schedule="${svc.id}" data-client-id="${client.id}" title="${tracked ? 'Exclude from upcoming jobs' : 'Include in upcoming jobs'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${tracked ? 'Tracking schedule' : 'Not tracking'}
            </button>` : ''}
        </div>
        <div class="service-price">${formatCurrency(svc.price)}</div>
        <div class="service-actions">
          <button class="edit-btn" data-quick-pay="${svc.id}" data-quick-pay-amount="${svc.price}" data-quick-pay-label="${serviceLabel(svc.type)}" title="Record payment" style="color:var(--green-primary)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></button>
          <button class="edit-btn" data-edit-service="${svc.id}" title="Edit service"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        </div>
      </div>`;
  }

  const allSvcs = client.services || [];
  const recurringServices = allSvcs.filter(s => s.frequency !== 'one-time');
  const oneTimeServices = allSvcs.filter(s => s.frequency === 'one-time');

  const recurringHTML = recurringServices.length === 0
    ? `<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px">No recurring services yet.</div>`
    : recurringServices.map(renderServiceItem).join('');

  const oneTimeAccordion = oneTimeServices.length > 0 ? `
    <div class="svc-history-section">
      <div class="svc-history-header">
        Service History <span class="svc-history-count">${oneTimeServices.length}</span>
      </div>
      ${oneTimeServices.map(renderServiceItem).join('')}
    </div>` : '';

  const servicesHTML = `${recurringHTML}${oneTimeAccordion}`;

  const sortedPayments = [...(client.payments || [])].sort((a, b) => b.date.localeCompare(a.date));
  const payGroups = {};
  sortedPayments.forEach(p => {
    const key = (p.date || 'unknown').slice(0, 7);
    if (!payGroups[key]) payGroups[key] = [];
    payGroups[key].push(p);
  });
  const payGroupKeys = Object.keys(payGroups).sort((a, b) => b.localeCompare(a));

  const paymentsHTML = sortedPayments.length === 0
    ? `<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px">No payments recorded yet.</div>`
    : payGroupKeys.map((key, idx) => {
        const [yr, mo] = key.split('-');
        const monthLabel = key === 'unknown' ? 'Unknown Date' : new Date(parseInt(yr), parseInt(mo) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const grpPayments = payGroups[key];
        const grpTotal = grpPayments.reduce((s, p) => s + p.amount, 0);
        const grpUnpaid = grpPayments.filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);
        return `
        <details class="pay-month-group" ${idx === 0 ? 'open' : ''}>
          <summary class="pay-month-header">
            <svg class="pay-month-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            <span class="pay-month-label">${monthLabel}</span>
            <span class="pay-month-count">${grpPayments.length} payment${grpPayments.length !== 1 ? 's' : ''}</span>
            ${grpUnpaid > 0 ? `<span class="pay-month-unpaid">${formatCurrency(grpUnpaid)} unpaid</span>` : ''}
            <span class="pay-month-total">${formatCurrency(grpTotal)}</span>
          </summary>
          <div class="pay-month-body">
            ${grpPayments.map(p => `
              <div class="payment-item">
                <div class="payment-dot ${p.status}"></div>
                <div class="payment-info">
                  <div class="payment-desc">${escHtml(p.description || 'Payment')}</div>
                  <div class="payment-date">${formatDate(p.date)}</div>
                </div>
                <div class="payment-right">
                  <div class="payment-amount ${p.status}">${formatCurrency(p.amount)}</div>
                  <div style="display:flex;gap:4px;margin-top:4px;justify-content:flex-end">
                    ${p.status === 'unpaid'
                      ? `<button class="btn btn-sm btn-secondary" data-mark-paid="${p.id}" style="padding:4px 10px;min-height:28px;font-size:12px">Mark Paid</button>`
                      : `<button class="btn btn-sm btn-outline" data-mark-unpaid="${p.id}" style="padding:4px 10px;min-height:28px;font-size:12px">Undo</button>`
                    }
                    <button class="edit-btn" data-edit-payment="${p.id}" title="Edit payment"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </details>`;
      }).join('');

  return `
    <div class="page-header">
      <button class="back-btn" data-nav="clients"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
      <h1 style="font-size:17px">${escHtml(client.name)}</h1>
      <button class="back-btn" data-edit-client="${client.id}" style="background:var(--green-pale);color:var(--green-primary)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
    </div>

    <div class="detail-hero">
      <div class="detail-avatar" style="background:${avatarColor(client.name)}">${initials(client.name)}</div>
      <div class="detail-hero-info">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <h2>${escHtml(client.name)}</h2>
          ${clientStatusBadge(client.status || 'active')}
        </div>
        <p>${escHtml(client.address || 'No address')}</p>
      </div>
    </div>

    <div class="client-stats-grid">
      <div class="client-stat-card">
        <div class="client-stat-label">Monthly Value</div>
        <div class="client-stat-value" style="color:var(--green-primary)">${monthlyValue > 0 ? formatCurrency(monthlyValue) : '—'}</div>
        <div class="client-stat-sub">recurring/mo</div>
      </div>
      <div class="client-stat-card">
        <div class="client-stat-label">All-Time Revenue</div>
        <div class="client-stat-value" style="color:var(--green-primary)">${formatCurrency(totalPaid)}</div>
        <div class="client-stat-sub">collected</div>
      </div>
      <div class="client-stat-card">
        <div class="client-stat-label">Times Serviced</div>
        <div class="client-stat-value">${timesServiced}</div>
        <div class="client-stat-sub">paid visit${timesServiced !== 1 ? 's' : ''}</div>
      </div>
      <div class="client-stat-card ${daysSinceLast !== null && daysSinceLast > 14 ? 'client-stat-warning' : ''}">
        <div class="client-stat-label">Last Service</div>
        <div class="client-stat-value" style="font-size:18px">${daysSinceLast === null ? '—' : daysSinceLast === 0 ? 'Today' : `${daysSinceLast}d ago`}</div>
        <div class="client-stat-sub">${lastServiceDate ? formatDate(lastServiceDate) : 'No visits yet'}</div>
      </div>
      <div class="client-stat-card ${unpaid > 0 ? 'client-stat-danger' : ''}">
        <div class="client-stat-label">Unpaid Balance</div>
        <div class="client-stat-value" style="color:${unpaid > 0 ? 'var(--danger)' : 'var(--text-muted)'}">${formatCurrency(unpaid)}</div>
        <div class="client-stat-sub">${unpaid > 0 ? 'outstanding' : 'all clear'}</div>
      </div>
      <div class="client-stat-card">
        <div class="client-stat-label">Client Since</div>
        <div class="client-stat-value" style="font-size:16px;font-weight:700">${clientSinceLabel}</div>
        <div class="client-stat-sub">first payment</div>
      </div>
    </div>

    <div class="client-control-bar">
      <div class="client-control-group">
        <span class="client-control-label">Status</span>
        <div class="client-status-pills">
          ${[['active','Active'],['paused','Paused'],['on-call','On-Call'],['inactive','Inactive']].map(([val, label]) => `
            <button class="client-status-pill ${(client.status || 'active') === val ? 'selected' : ''}" data-set-status="${val}" data-client-id="${client.id}">${label}</button>
          `).join('')}
        </div>
      </div>
      <div class="client-control-divider"></div>
      <div class="client-control-group">
        <span class="client-control-label">Type</span>
        <div class="client-status-pills">
          <button class="client-status-pill ${!isOneTime ? 'selected' : ''}" data-set-type="regular" data-client-id="${client.id}">Recurring</button>
          <button class="client-status-pill ${isOneTime ? 'selected' : ''}" data-set-type="one-time" data-client-id="${client.id}">One-Off</button>
        </div>
      </div>
      <div class="client-control-spacer"></div>
      <div class="client-control-actions">
        ${client.phone ? `<a class="contact-chip contact-chip-sm" href="tel:${escHtml(client.phone)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.36C1.6 2.18 2.52 1 3.72 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.45-1.45a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call</a>` : ''}
        ${client.phone ? `<a class="contact-chip contact-chip-sm" href="sms:${escHtml(client.phone)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Text</a>` : ''}
      </div>
    </div>

    <div class="detail-columns">
      <div class="detail-col">
        <div class="detail-section">
          <div class="detail-section-title">
            Services
            <button data-add-service="${client.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Service
            </button>
          </div>
          ${servicesHTML}
        </div>

        ${(() => {
          // Migrate legacy plain-text notes field into clientNotes array
          const clientNotes = client.clientNotes || [];
          const pinnedNotes = clientNotes.filter(n => n.pinned).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
          const otherNotes  = clientNotes.filter(n => !n.pinned).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
          const sortedNotes = [...pinnedNotes, ...otherNotes];

          const pinIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path d="M12 2l3 7h5l-4 4 1.5 7L12 17l-5.5 3L8 13 4 9h5z"/></svg>`;
          const trashIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;

          const notesList = sortedNotes.length === 0
            ? `<div class="cn-empty">No notes yet — add one above</div>`
            : sortedNotes.map(n => {
                const ts = new Date(n.createdAt);
                const dateStr = ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: ts.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
                const timeStr = ts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                return `
                  <div class="cn-note ${n.pinned ? 'cn-pinned' : ''}" data-note-id="${n.id}">
                    ${n.pinned ? `<div class="cn-pin-indicator">${pinIcon} Pinned</div>` : ''}
                    <div class="cn-note-text">${escHtml(n.text)}</div>
                    <div class="cn-note-foot">
                      <span class="cn-note-date">${dateStr} · ${timeStr}</span>
                      <div class="cn-note-actions">
                        <button class="cn-action-btn ${n.pinned ? 'cn-action-active' : ''}" data-cn-pin="${n.id}" data-client-id="${client.id}" title="${n.pinned ? 'Unpin' : 'Pin note'}">${pinIcon}</button>
                        <button class="cn-action-btn cn-action-del" data-cn-del="${n.id}" data-client-id="${client.id}" title="Delete note">${trashIcon}</button>
                      </div>
                    </div>
                  </div>`;
              }).join('');

          return `
          <div class="detail-section cn-section">
            <div class="detail-section-title">
              Notes${sortedNotes.length > 0 ? ` <span class="cn-count">${sortedNotes.length}</span>` : ''}
            </div>
            <div class="cn-compose">
              <textarea class="cn-input" id="cn-input-${client.id}" placeholder="Add a note or reminder…" rows="2"></textarea>
              <button class="cn-add-btn" data-cn-add="${client.id}">Add</button>
            </div>
            <div class="cn-list">${notesList}</div>
          </div>`;
        })()}

      </div>

      <div class="detail-col">
        <div class="detail-section">
          <div class="detail-section-title">
            Payment History
            <button data-add-payment="${client.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Record
            </button>
          </div>
          ${paymentsHTML}
        </div>
      </div>
    </div>

    <div class="spacer"></div>
  `;
}

// ===== TODAY VIEW =====
function renderToday() {
  const data = getData();
  const today = todayISO();
  const now = new Date();
  const timeLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Selected day (defaults to today)
  const selectedDate = state.todaySelectedDate || today;

  // Build the current week (Mon → Sun)
  const weekDays = [];
  const todayD = new Date(today + 'T12:00:00');
  const dow = todayD.getDay(); // 0=Sun
  const weekStart = new Date(todayD);
  weekStart.setDate(todayD.getDate() - ((dow + 6) % 7)); // back to Monday
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const scheduled = (data.scheduledJobs || []).filter(sj => sj.date === iso);
    const doneCount = scheduled.filter(sj => sj.status === 'done').length;
    weekDays.push({
      iso,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: iso === today,
      isSelected: iso === selectedDate,
      total: scheduled.length,
      done: doneCount,
      hasPast: iso < today,
    });
  }

  // Week strip HTML
  const weekStripHTML = weekDays.map(wd => `
    <button class="week-day-btn ${wd.isSelected ? 'selected' : ''} ${wd.isToday ? 'is-today' : ''} ${wd.hasPast && wd.total === 0 ? 'past-empty' : ''}"
      data-select-day="${wd.iso}">
      <span class="week-day-name">${wd.dayName}</span>
      <span class="week-day-num">${wd.dayNum}</span>
      ${wd.total > 0
        ? `<span class="week-day-jobs ${wd.done === wd.total ? 'all-done' : ''}">${wd.done}/${wd.total}</span>`
        : `<span class="week-day-jobs empty">—</span>`}
    </button>`).join('');

  // Clock state
  const clockedIn = !!data.activeClockIn;
  let clockDuration = '';
  if (clockedIn && data.activeClockIn.startTime) {
    const elapsed = Math.floor((Date.now() - new Date(data.activeClockIn.startTime).getTime()) / 60000);
    const h = Math.floor(elapsed / 60);
    const m = elapsed % 60;
    clockDuration = h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  const clockClient = clockedIn && data.activeClockIn.clientId
    ? data.clients.find(c => c.id === data.activeClockIn.clientId)
    : null;

  // Today's time entries
  const todayEntries = (data.timeEntries || []).filter(e => e.date === today);
  const todayMins = todayEntries.reduce((s, e) => s + (e.durationMins || 0), 0);
  const todayH = Math.floor(todayMins / 60);
  const todayM = todayMins % 60;
  const todayTimeLabel = todayMins > 0 ? (todayH > 0 ? `${todayH}h ${todayM}m` : `${todayM}m`) : '0m';

  // Selected day scheduled jobs
  const selDate = new Date(selectedDate + 'T12:00:00');
  const selLabel = selDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const selScheduled = (data.scheduledJobs || []).filter(sj => sj.date === selectedDate);

  const activeClients = data.clients.filter(c => {
    const status = c.status || 'active';
    return status === 'active' && c.type !== 'one-time';
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Clock section HTML
  const clockHTML = `
    <div class="today-clock-section ${clockedIn ? 'clocked-in' : ''}">
      <div class="today-clock-meta">
        <div class="today-date-label">${timeLabel}</div>
        <div class="today-time-worked">Today: <strong>${todayTimeLabel}</strong> logged</div>
      </div>
      ${clockedIn ? `
        <div class="today-clock-running">
          <div class="today-clock-pulse"></div>
          <div>
            <div class="today-clock-elapsed">${clockDuration}</div>
            <div class="today-clock-since">${clockClient ? escHtml(clockClient.name) : 'General work'}</div>
          </div>
        </div>
        <button class="today-clockout-btn" id="clock-out-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          Clock Out
        </button>
      ` : `
        <button class="today-clockin-btn" id="clock-in-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Clock In
        </button>
      `}
      <button class="today-log-time-btn" id="log-time-btn" title="Manually add time">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><line x1="12" y1="2" x2="12" y2="4"/></svg>
        + Log Time
      </button>
    </div>`;

  // Selected day jobs HTML
  const selJobsHTML = selScheduled.length === 0
    ? `<div class="today-empty-hint">No jobs scheduled — click <strong>+ Add Jobs</strong> to schedule clients.</div>`
    : selScheduled.map(sj => {
        const client = data.clients.find(c => c.id === sj.clientId);
        if (!client) return '';
        const isDone = sj.status === 'done';
        const color = avatarColor(client.name);
        const notes = client.clientNotes || [];
        const hasPinned = notes.some(n => n.pinned);
        const hasNotes  = notes.length > 0;
        const notesBadge = hasNotes
          ? `<span class="cn-job-badge ${hasPinned ? 'cn-job-badge-pin' : ''}" title="${hasPinned ? 'Has pinned note' : 'Has notes'}">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:10px;height:10px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
               ${notes.length}
             </span>`
          : '';
        return `
          <div class="today-route-row ${isDone ? 'today-route-done' : ''} ${hasNotes ? 'today-route-has-notes' : ''}" data-today-nav-client="${client.id}">
            <div class="sched-avatar" style="background:${color}">${initials(client.name)}</div>
            <div class="today-route-info">
              <div class="today-route-name">${escHtml(client.name)}${notesBadge}</div>
              <div class="today-route-addr">${escHtml(client.address || 'No address')}</div>
            </div>
            <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
              ${isDone
                ? `<span class="sched-status-badge">Done</span>`
                : `<button class="sched-btn sched-btn-done" data-sched-done="${sj.id}" data-sched-client="${sj.clientId}" data-date="${selectedDate}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Done
                  </button>`}
              <button class="sched-btn sched-btn-remove" data-sched-remove="${sj.id}" data-date="${selectedDate}" title="Remove">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>`;
      }).join('');

  // Quick log - all active clients
  const quickLogHTML = activeClients.map(client => {
    const unpaid = (client.payments || []).filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);
    const lastPaid = [...(client.payments || [])].filter(p => p.status === 'paid').sort((a,b) => b.date.localeCompare(a.date))[0];
    const daysSince = lastPaid ? Math.floor((Date.now() - new Date(lastPaid.date + 'T12:00:00').getTime()) / 86400000) : null;
    const firstSvc = (client.services || []).find(s => s.frequency && s.frequency !== 'one-time');
    return `
      <div class="today-client-row">
        <div class="sched-avatar" style="background:${avatarColor(client.name)}">${initials(client.name)}</div>
        <div class="today-route-info">
          <div class="today-route-name">${escHtml(client.name)}</div>
          <div class="today-route-addr">${firstSvc ? `${firstSvc.type} · ${FREQ_LABELS[firstSvc.frequency] || firstSvc.frequency}` : 'No service'}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          ${unpaid > 0 ? `<div class="today-unpaid-badge">${formatCurrency(unpaid)} owed</div>` : ''}
          ${daysSince !== null ? `<div class="today-days-since">${daysSince}d ago</div>` : '<div class="today-days-since">No visits</div>'}
        </div>
        <button class="today-pay-btn" data-quick-log="${client.id}" data-svc-type="${firstSvc ? firstSvc.type : ''}" data-svc-amount="${firstSvc ? firstSvc.price || '' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Log
        </button>
      </div>`;
  }).join('');

  return `
    <div class="page-header">
      <h1>Today</h1>
    </div>

    ${clockHTML}

    <div class="today-section">
      <div class="today-week-strip">${weekStripHTML}</div>
    </div>

    <div class="today-section">
      <div class="today-section-title">
        ${selLabel}
        <span class="today-section-count">${selScheduled.length}</span>
        <button class="today-add-jobs-btn" data-open-day="${selectedDate}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Jobs
        </button>
      </div>
      <div class="today-route-list">${selJobsHTML}</div>
    </div>

    <div class="today-section">
      <div class="today-section-title">Quick Log <span class="today-section-count">${activeClients.length}</span></div>
      <div class="today-route-list">${quickLogHTML}</div>
    </div>`;
}

// ===== REPORTS VIEW =====
function renderReports() {
  const data  = getData();
  const period = state.reportsPeriod || 'YTD';
  const now   = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // ── Date range ──────────────────────────────────────────────────────────────
  let startStr;
  if      (period === '1M')  startStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  else if (period === '3M')  { const d = new Date(now); d.setMonth(d.getMonth() - 3);  startStr = d.toISOString().slice(0, 10); }
  else if (period === '6M')  { const d = new Date(now); d.setMonth(d.getMonth() - 6);  startStr = d.toISOString().slice(0, 10); }
  else if (period === 'YTD') startStr = `${now.getFullYear()}-01-01`;
  else                       startStr = '2000-01-01';

  const inRange = date => { const d = (date || '').slice(0, 10); return d >= startStr && d <= todayStr; };

  // ── Collect payments ────────────────────────────────────────────────────────
  const paidPmts = [], unpaidPmts = [];
  for (const c of data.clients) {
    for (const p of (c.payments || [])) {
      if (!inRange(p.date)) continue;
      const obj = { ...p, clientId: c.id, clientName: c.name };
      (p.status === 'paid' ? paidPmts : unpaidPmts).push(obj);
    }
  }

  // ── Collect expenses & time ──────────────────────────────────────────────────
  const periodExpenses  = (data.expenses   || []).filter(e => inRange(e.date));
  const periodTime      = (data.timeEntries|| []).filter(e => inRange(e.date));
  const hasTime         = periodTime.length > 0;

  // ── Core KPIs ───────────────────────────────────────────────────────────────
  const totalRevenue    = paidPmts.reduce((s, p) => s + p.amount, 0);
  const totalOutstanding= unpaidPmts.reduce((s, p) => s + p.amount, 0);
  const totalExpenses   = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit       = totalRevenue - totalExpenses;
  const margin          = totalRevenue > 0 ? netProfit / totalRevenue * 100 : null;
  const jobsCount       = paidPmts.length;
  const avgPerJob       = jobsCount > 0 ? totalRevenue / jobsCount : 0;
  const totalMins       = periodTime.reduce((s, e) => s + (e.durationMins || 0), 0);
  const totalHours      = totalMins / 60;
  const effectiveRate   = totalHours > 0 ? totalRevenue / totalHours : 0;
  const avgJobMins      = hasTime && jobsCount > 0 ? totalMins / jobsCount : 0;
  const activeClientSet = new Set(paidPmts.map(p => p.clientId));
  const collectionPct   = (totalRevenue + totalOutstanding) > 0
    ? Math.round(totalRevenue / (totalRevenue + totalOutstanding) * 100) : 100;

  // ── Previous period delta (revenue) ─────────────────────────────────────────
  let prevRevenue = 0;
  if (period !== 'all') {
    const rangeMs  = new Date(todayStr).getTime() - new Date(startStr).getTime();
    const prevEnd  = new Date(new Date(startStr).getTime() - 86400000).toISOString().slice(0, 10);
    const prevStart= new Date(new Date(startStr).getTime() - rangeMs - 86400000).toISOString().slice(0, 10);
    for (const c of data.clients)
      for (const p of (c.payments || []))
        if ((p.date || '').slice(0, 10) >= prevStart && (p.date || '').slice(0, 10) <= prevEnd && p.status === 'paid')
          prevRevenue += p.amount;
  }
  const revGrowth = prevRevenue > 0 ? Math.round((totalRevenue - prevRevenue) / prevRevenue * 100) : null;

  // ── Monthly trend buckets (last 12 months always) ──────────────────────────
  const monthBuckets = [];
  for (let i = 11; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthBuckets.push({ key, label: d.toLocaleDateString('en-US', { month: 'short' }), revenue: 0, expenses: 0 });
  }
  for (const p of paidPmts)      { const b = monthBuckets.find(m => m.key === (p.date || '').slice(0, 7)); if (b) b.revenue  += p.amount; }
  for (const e of periodExpenses) { const b = monthBuckets.find(m => m.key === (e.date || '').slice(0, 7)); if (b) b.expenses += e.amount; }
  const maxMonthVal = Math.max(...monthBuckets.map(b => Math.max(b.revenue, b.expenses)), 1);

  // ── Day-of-week buckets ─────────────────────────────────────────────────────
  const dowRev = [0, 0, 0, 0, 0, 0, 0];
  const dowJobs= [0, 0, 0, 0, 0, 0, 0];
  for (const p of paidPmts) {
    const dow = new Date((p.date || '').slice(0, 10) + 'T12:00:00').getDay();
    dowRev[dow]  += p.amount;
    dowJobs[dow] += 1;
  }
  const maxDowRev = Math.max(...dowRev, 1);
  const bestDow   = dowRev.indexOf(Math.max(...dowRev));

  // ── Per-client stats ────────────────────────────────────────────────────────
  const clientMap = {};
  for (const p of paidPmts) {
    if (!clientMap[p.clientId]) clientMap[p.clientId] = { clientId: p.clientId, name: p.clientName, revenue: 0, jobs: 0, lastDate: '', hours: 0 };
    const cs = clientMap[p.clientId];
    cs.revenue += p.amount; cs.jobs++;
    if (!cs.lastDate || p.date > cs.lastDate) cs.lastDate = p.date.slice(0, 10);
  }
  for (const e of periodTime)
    if (e.clientId && clientMap[e.clientId]) clientMap[e.clientId].hours += (e.durationMins || 0) / 60;

  const clientStats  = Object.values(clientMap).sort((a, b) => b.revenue - a.revenue);
  const maxClientRev = clientStats.length > 0 ? clientStats[0].revenue : 1;
  const repeatClients= clientStats.filter(c => c.jobs >= 2).length;
  const avgVisitsPerClient = clientStats.length > 0 ? (jobsCount / clientStats.length).toFixed(1) : '—';

  // ── Hours per client ────────────────────────────────────────────────────────
  const hoursMap = {};
  let generalMins = 0;
  for (const e of periodTime) {
    if (e.clientId) hoursMap[e.clientId] = (hoursMap[e.clientId] || 0) + (e.durationMins || 0);
    else            generalMins += (e.durationMins || 0);
  }
  const hoursRows = Object.entries(hoursMap)
    .map(([id, mins]) => { const c = data.clients.find(x => x.id === id); return { name: c ? c.name : 'Unknown', mins, clientId: id }; })
    .sort((a, b) => b.mins - a.mins);
  if (generalMins > 0) hoursRows.push({ name: 'General / No client', mins: generalMins, clientId: null });
  const maxHoursMins = Math.max(...hoursRows.map(r => r.mins), 1);

  // ── Expense by category ─────────────────────────────────────────────────────
  const expByCat = {};
  for (const e of periodExpenses) {
    if (!expByCat[e.category]) expByCat[e.category] = { catId: e.category, cat: EXPENSE_CATEGORIES.find(c => c.id === e.category) || { label: 'Other', emoji: '📦' }, total: 0, count: 0 };
    expByCat[e.category].total += e.amount;
    expByCat[e.category].count++;
  }
  const expCatList   = Object.values(expByCat).sort((a, b) => b.total - a.total);
  const maxExpCatVal = expCatList.length > 0 ? expCatList[0].total : 1;

  // ── Format helpers ───────────────────────────────────────────────────────────
  const fmtMins = mins => { const h = Math.floor(mins / 60), m = mins % 60; return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : `${m}m`; };
  const recencyLabel = dateStr => {
    if (!dateStr) return '—';
    const days = Math.floor((Date.now() - new Date(dateStr + 'T12:00:00').getTime()) / 86400000);
    if (days === 0) return 'Today'; if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`; if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`; return `${Math.floor(days / 365)}y ago`;
  };
  const recencyColor = dateStr => {
    if (!dateStr) return 'var(--text-muted)';
    const days = Math.floor((Date.now() - new Date(dateStr + 'T12:00:00').getTime()) / 86400000);
    return days <= 14 ? 'var(--green-primary)' : days <= 45 ? '#d97706' : 'var(--danger)';
  };

  // ── HTML: KPI cards ─────────────────────────────────────────────────────────
  const revGrowthHtml = revGrowth !== null
    ? `<div class="rpt-kpi-delta ${revGrowth >= 0 ? 'up' : 'down'}">${revGrowth >= 0 ? '↑' : '↓'} ${Math.abs(revGrowth)}% vs prev period</div>` : '';

  const kpiCards = [
    { label: 'Revenue',        value: formatCurrency(totalRevenue),    cls: totalRevenue > 0 ? 'green' : '', extra: revGrowthHtml },
    { label: 'Outstanding',    value: formatCurrency(totalOutstanding), cls: totalOutstanding > 0 ? 'amber' : '' },
    { label: 'Net Profit',     value: formatCurrency(netProfit),        cls: netProfit >= 0 ? 'green' : 'red' },
    { label: 'Profit Margin',  value: margin !== null ? `${margin.toFixed(0)}%` : '—', cls: margin !== null && margin >= 50 ? 'green' : margin !== null && margin >= 0 ? 'amber' : 'red' },
    { label: 'Jobs Done',      value: jobsCount || '—' },
    { label: 'Avg / Job',      value: avgPerJob > 0 ? formatCurrency(avgPerJob) : '—', cls: 'green' },
    { label: 'Hours Worked',   value: totalMins > 0 ? fmtMins(totalMins) : '—' },
    { label: 'Effective $/hr', value: effectiveRate > 0 ? formatCurrency(effectiveRate) : '—', cls: effectiveRate > 0 ? 'green' : '' },
  ].map(k => `
    <div class="rpt-kpi">
      <div class="rpt-kpi-label">${k.label}</div>
      <div class="rpt-kpi-value ${k.cls || ''}">${k.value}</div>
      ${k.extra || ''}
    </div>`).join('');

  // ── HTML: Monthly trend chart ────────────────────────────────────────────────
  const trendHTML = monthBuckets.map(b => {
    const rPct = Math.round(b.revenue  / maxMonthVal * 100);
    const ePct = Math.round(b.expenses / maxMonthVal * 100);
    return `
      <div class="rpt-trend-col" data-month="${b.label}" data-rev="${b.revenue}" data-exp="${b.expenses}">
        <div class="rpt-trend-bars">
          <div class="rpt-trend-bar rpt-bar-rev" style="height:${rPct}%"></div>
          <div class="rpt-trend-bar rpt-bar-exp" style="height:${ePct}%"></div>
        </div>
        <div class="rpt-trend-label">${b.label}</div>
      </div>`;
  }).join('');

  // ── HTML: Client leaderboard ─────────────────────────────────────────────────
  const leaderHTML = clientStats.length === 0
    ? `<div class="rpt-empty-sm">No revenue recorded this period.</div>`
    : clientStats.slice(0, 10).map((cs, i) => {
        const avg    = cs.jobs > 0 ? cs.revenue / cs.jobs : 0;
        const barPct = Math.round(cs.revenue / maxClientRev * 100);
        const rateStr= cs.hours > 0 ? ` · ${formatCurrency(cs.revenue / cs.hours)}/hr` : '';
        return `
          <div class="rpt-client-row" data-nav-client-page="${cs.clientId}">
            <div class="rpt-client-rank">#${i + 1}</div>
            <div class="sched-avatar" style="background:${avatarColor(cs.name)};width:32px;height:32px;font-size:12px;flex-shrink:0">${initials(cs.name)}</div>
            <div class="rpt-client-info">
              <div class="rpt-client-name-row">
                <span class="rpt-client-name">${escHtml(cs.name)}</span>
                <span class="rpt-client-revenue">${formatCurrency(cs.revenue)}</span>
              </div>
              <div class="rpt-client-bar-track"><div class="rpt-client-bar-fill" style="width:${barPct}%"></div></div>
              <div class="rpt-client-meta">${cs.jobs} job${cs.jobs !== 1 ? 's' : ''} · avg ${formatCurrency(avg)}${cs.hours > 0 ? ` · ${cs.hours.toFixed(1)}h` : ''}${rateStr}</div>
            </div>
            <div class="rpt-client-recency" style="color:${recencyColor(cs.lastDate)}">${recencyLabel(cs.lastDate)}</div>
          </div>`;
      }).join('');

  // ── HTML: Expense breakdown ──────────────────────────────────────────────────
  const expHTML = expCatList.length === 0
    ? `<div class="rpt-empty-sm">No expenses logged this period.</div>`
    : expCatList.map(e => {
        const color  = EXPENSE_CAT_COLORS[e.catId] || '#94a3b8';
        const barPct = Math.round(e.total / maxExpCatVal * 100);
        return `
          <div class="rpt-exp-row">
            <div class="rpt-exp-icon" style="background:${color}1a;color:${color}">${e.cat.emoji}</div>
            <div class="rpt-exp-info">
              <div class="rpt-exp-name">${escHtml(e.cat.label)}</div>
              <div class="rpt-exp-bar-track"><div class="rpt-exp-bar-fill" style="width:${barPct}%;background:${color}"></div></div>
            </div>
            <div class="rpt-exp-amount">${formatCurrency(e.total)}</div>
          </div>`;
      }).join('');

  // ── HTML: Day-of-week chart ──────────────────────────────────────────────────
  const DOW_LABELS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DOW_ORDER    = [1, 2, 3, 4, 5, 6, 0]; // Mon→Sun display order
  const dowHTML = DOW_ORDER.map(i => {
    const pct    = Math.round(dowRev[i] / maxDowRev * 100);
    const isBest = i === bestDow && dowRev[i] > 0;
    return `
      <div class="rpt-dow-col">
        <div class="rpt-dow-jobs">${dowJobs[i] > 0 ? dowJobs[i] + (dowJobs[i] === 1 ? ' job' : ' jobs') : ''}</div>
        <div class="rpt-dow-bar-wrap">
          <div class="rpt-dow-bar${isBest ? ' best' : ''}" style="height:${Math.max(pct, 2)}%"></div>
        </div>
        <div class="rpt-dow-label">${DOW_LABELS[i]}</div>
        <div class="rpt-dow-rev">${dowRev[i] > 0 ? formatCurrency(dowRev[i]) : '—'}</div>
      </div>`;
  }).join('');

  // ── HTML: Time per client ────────────────────────────────────────────────────
  const timeHTML = !hasTime
    ? `<div class="rpt-empty-sm">No time logged this period. Use Clock In/Out on the Today page to track hours worked.</div>`
    : hoursRows.slice(0, 10).map(r => {
        const barPct   = Math.round(r.mins / maxHoursMins * 100);
        const cRev     = r.clientId ? (clientMap[r.clientId]?.revenue || 0) : 0;
        const rate     = r.mins > 0 && cRev > 0 ? cRev / (r.mins / 60) : 0;
        return `
          <div class="rpt-time-row">
            ${r.clientId
              ? `<div class="sched-avatar" style="background:${avatarColor(r.name)};width:32px;height:32px;font-size:12px;flex-shrink:0">${initials(r.name)}</div>`
              : `<div class="rpt-time-gen-dot"></div>`}
            <div class="rpt-time-client">
              <div class="rpt-time-name">${escHtml(r.name)}</div>
              <div class="rpt-time-bar-track"><div class="rpt-time-bar-fill" style="width:${barPct}%"></div></div>
            </div>
            <div class="rpt-time-stats">
              <div class="rpt-time-dur">${fmtMins(r.mins)}</div>
              ${rate > 0 ? `<div class="rpt-time-rate">${formatCurrency(rate)}/hr</div>` : ''}
            </div>
          </div>`;
      }).join('');

  // ── HTML: Business health grid ───────────────────────────────────────────────
  const healthCards = [
    { value: `${collectionPct}%`, label: 'Collection Rate', sub: '% of invoices collected', cls: collectionPct >= 80 ? 'green' : collectionPct >= 60 ? 'amber' : 'red' },
    { value: activeClientSet.size || '0', label: 'Active Clients', sub: 'paying this period' },
    { value: repeatClients || '0', label: 'Repeat Clients', sub: '2+ jobs this period', cls: repeatClients > 0 ? 'green' : '' },
    { value: avgVisitsPerClient, label: 'Avg Jobs / Client', sub: 'this period' },
    { value: formatCurrency(totalRevenue + totalOutstanding), label: 'Total Invoiced', sub: 'paid + outstanding' },
    { value: revGrowth !== null ? (revGrowth >= 0 ? '+' : '') + revGrowth + '%' : '—', label: 'Revenue Growth', sub: 'vs previous period', cls: revGrowth !== null && revGrowth >= 0 ? 'green' : revGrowth !== null ? 'red' : '' },
  ].map(h => `
    <div class="rpt-health-card">
      <div class="rpt-health-value ${h.cls || ''}">${h.value}</div>
      <div class="rpt-health-label">${h.label}</div>
      <div class="rpt-health-sub">${h.sub}</div>
    </div>`).join('');

  // ── Assemble ─────────────────────────────────────────────────────────────────
  const PERIOD_LABELS = { '1M': 'This Month', '3M': 'Last 3M', '6M': 'Last 6M', 'YTD': 'YTD', 'all': 'All Time' };

  return `
    <div class="rpt-page">

      <div class="rpt-page-header">
        <div>
          <h1 class="rpt-page-title">Reports</h1>
          <p class="rpt-page-sub">Business performance & insights</p>
        </div>
        <div class="rpt-period-tabs">
          ${Object.entries(PERIOD_LABELS).map(([k, l]) =>
            `<button class="rpt-period-tab${period === k ? ' active' : ''}" data-rpt-period="${k}">${l}</button>`
          ).join('')}
        </div>
      </div>

      <div class="rpt-kpi-grid">${kpiCards}</div>

      <div class="rpt-card rpt-chart-card">
        <div class="rpt-chart-tt" id="rpt-chart-tt" aria-hidden="true"></div>
        <div class="rpt-card-head">
          <div class="rpt-card-title">Revenue vs. Expenses — Last 12 Months</div>
          <div class="rpt-trend-legend">
            <span class="rpt-legend-item"><span class="rpt-legend-dot" style="background:var(--green-primary)"></span>Revenue</span>
            <span class="rpt-legend-item"><span class="rpt-legend-dot" style="background:#f87171"></span>Expenses</span>
          </div>
        </div>
        <div class="rpt-trend-chart">${trendHTML}</div>
      </div>

      <div class="rpt-two-col">
        <div class="rpt-card">
          <div class="rpt-card-head">
            <div class="rpt-card-title">Client Leaderboard</div>
            <div class="rpt-card-sub">by revenue · tap to open</div>
          </div>
          ${leaderHTML}
        </div>
        <div class="rpt-card">
          <div class="rpt-card-head">
            <div class="rpt-card-title">Expense Breakdown</div>
            <div class="rpt-card-sub">${formatCurrency(totalExpenses)} total</div>
          </div>
          ${expHTML}
          ${expCatList.length > 0 ? `
            <div class="rpt-exp-net">
              <span>Net profit</span>
              <strong style="color:${netProfit >= 0 ? 'var(--green-primary)' : 'var(--danger)'}">${formatCurrency(netProfit)}</strong>
            </div>` : ''}
        </div>
      </div>

      <div class="rpt-card">
        <div class="rpt-card-head">
          <div class="rpt-card-title">Revenue by Day of Week</div>
          <div class="rpt-card-sub">${jobsCount > 0 ? `best day: <strong>${DOW_LABELS[bestDow]}</strong> — ${formatCurrency(dowRev[bestDow])}` : 'no jobs this period'}</div>
        </div>
        <div class="rpt-dow-grid">${dowHTML}</div>
      </div>

      <div class="rpt-card">
        <div class="rpt-card-head">
          <div class="rpt-card-title">Time Worked</div>
          <div class="rpt-card-sub">${totalMins > 0 ? `${fmtMins(totalMins)} total${effectiveRate > 0 ? ' · ' + formatCurrency(effectiveRate) + '/hr effective' : ''}` : 'no time logged'}</div>
        </div>
        ${timeHTML}
      </div>

      <div class="rpt-card">
        <div class="rpt-card-head">
          <div class="rpt-card-title">Business Health</div>
          <div class="rpt-card-sub">${period === 'all' ? 'all time' : PERIOD_LABELS[period]}</div>
        </div>
        <div class="rpt-health-grid">${healthCards}</div>
      </div>

      <div class="spacer"></div>
    </div>`;
}

// ===== PAYMENTS VIEW =====
function renderPayments() {
  const data = getData();
  const filter = state.paymentsFilter;

  let all = [];
  for (const client of data.clients) {
    for (const p of (client.payments || [])) {
      if (filter === 'all' || p.status === filter) {
        all.push({ ...p, clientName: client.name, clientId: client.id });
      }
    }
  }
  all.sort((a, b) => b.date.localeCompare(a.date));

  const total = all.reduce((s, p) => s + p.amount, 0);

  const listHTML = all.length === 0
    ? `<div class="empty-state">
        <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
        <h3>No payments yet</h3>
        <p>Go to a client to record a payment.</p>
      </div>`
    : all.map(p => `
      <div class="payment-card">
        <div class="payment-card-header">
          <span class="payment-card-client" data-client-id="${p.clientId}" style="cursor:pointer">${escHtml(p.clientName)}</span>
          <span class="payment-card-date">${formatDate(p.date)}</span>
        </div>
        <div class="payment-card-body">
          <span class="payment-card-desc">${escHtml(p.description || 'Payment')}</span>
          <span class="payment-card-amount ${p.status}">${formatCurrency(p.amount)}</span>
        </div>
        <div class="payment-card-actions">
          ${p.status === 'unpaid'
            ? `<button class="btn btn-sm btn-secondary" data-mark-paid-global="${p.id}" data-client-id="${p.clientId}">Mark Paid</button>`
            : `<button class="btn btn-sm btn-outline" data-mark-unpaid-global="${p.id}" data-client-id="${p.clientId}">Mark Unpaid</button>`
          }
          <span class="badge ${p.status === 'paid' ? 'badge-paid' : 'badge-unpaid'}">${p.status === 'paid' ? 'Paid' : 'Unpaid'}</span>
        </div>
      </div>
    `).join('');

  return `
    <div class="page-header">
      <div class="header-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
      <h1>Payments</h1>
    </div>
    <div class="filter-tabs">
      <button class="filter-tab ${filter === 'all' ? 'active' : ''}" data-filter="all">All (${data.clients.reduce((s, c) => s + (c.payments||[]).length, 0)})</button>
      <button class="filter-tab ${filter === 'unpaid' ? 'active' : ''}" data-filter="unpaid" style="color:${filter !== 'unpaid' ? 'var(--danger)' : ''}">Unpaid</button>
      <button class="filter-tab ${filter === 'paid' ? 'active' : ''}" data-filter="paid">Paid</button>
    </div>
    ${all.length > 0 ? `<div style="padding:0 16px 8px;font-size:13px;color:var(--text-muted)">Total: <strong style="color:var(--text-primary)">${formatCurrency(total)}</strong> across ${all.length} records</div>` : ''}
    <div class="payments-list">${listHTML}</div>
    <div class="spacer"></div>
  `;
}

// ===== CALENDAR VIEW =====
function renderCalendar() {
  const data = getData();
  const year = state.calendarYear;
  const month = state.calendarMonth;

  // Build map: 'YYYY-MM-DD' -> [jobs]
  const jobMap = {};
  for (const client of data.clients) {
    for (const p of (client.payments || [])) {
      const key = p.date ? p.date.slice(0, 10) : null;
      if (!key) continue;
      if (!jobMap[key]) jobMap[key] = [];
      jobMap[key].push({ ...p, clientName: client.name, clientId: client.id });
    }
  }

  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startDow = firstDay.getDay();
  const today = todayISO();
  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const monthJobs = Object.entries(jobMap)
    .filter(([d]) => d.startsWith(monthPrefix))
    .flatMap(([, jobs]) => jobs);
  const monthRevenue = monthJobs.reduce((s, j) => s + j.amount, 0);
  const monthUnpaid = monthJobs.filter(j => j.status === 'unpaid').reduce((s, j) => s + j.amount, 0);
  const monthPaid = monthJobs.filter(j => j.status === 'paid').reduce((s, j) => s + j.amount, 0);

  // Build weeks array
  const weeks = [];
  let week = [];
  for (let i = 0; i < startDow; i++) week.push(null);
  for (let d = 1; d <= totalDays; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  // Build grid rows
  const isMobile = window.innerWidth < 768;
  const dowHeaders = isMobile
    ? ['S','M','T','W','T','F','S']
    : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let gridRows = '';
  weeks.forEach((wk, wi) => {
    let weekRevenue = 0;
    let weekJobCount = 0;
    let dayCells = '';

    wk.forEach(d => {
      if (!d) { dayCells += `<div class="cal2-cell cal2-cell-empty"></div>`; return; }
      const key = `${monthPrefix}-${String(d).padStart(2, '0')}`;
      const jobs = jobMap[key] || [];
      const isToday = key === today;
      const dayRevenue = jobs.reduce((s, j) => s + j.amount, 0);
      weekRevenue += dayRevenue;
      weekJobCount += jobs.length;

      dayCells += `
        <div class="cal2-cell ${isToday ? 'cal2-today' : ''}" data-cal-day="${key}">
          <span class="cal2-day-num">${d}</span>
          ${jobs.length > 0 ? `
            <div class="cal2-day-revenue ${dayRevenue >= 0 ? 'cal2-positive' : 'cal2-negative'}">+${formatCurrency(dayRevenue)}</div>
            <div class="cal2-day-count">${jobs.length} job${jobs.length !== 1 ? 's' : ''}</div>
          ` : ''}
        </div>`;
    });

    const weekRevenueStr = weekRevenue > 0 ? `+${formatCurrency(weekRevenue)}` : formatCurrency(weekRevenue);
    gridRows += `
      <div class="cal2-week-row">
        ${dayCells}
        <div class="cal2-week-summary">
          <div class="cal2-week-label">Week ${wi + 1}</div>
          <div class="cal2-week-revenue ${weekRevenue > 0 ? 'cal2-positive' : weekRevenue < 0 ? 'cal2-negative' : ''}">${weekRevenueStr}</div>
          <div class="cal2-week-count">${weekJobCount} job${weekJobCount !== 1 ? 's' : ''}</div>
        </div>
      </div>`;
  });


  return `
    <div class="page-header">
      <div class="header-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
      <h1>Calendar</h1>
    </div>

    <div class="cal2-stat-row">
      <div class="cal2-stat-card">
        <div class="cal2-stat-label">Jobs This Month</div>
        <div class="cal2-stat-value">${monthJobs.length}</div>
      </div>
      <div class="cal2-stat-card">
        <div class="cal2-stat-label">Total Revenue</div>
        <div class="cal2-stat-value cal2-positive">${formatCurrency(monthRevenue)}</div>
      </div>
      <div class="cal2-stat-card">
        <div class="cal2-stat-label">Collected</div>
        <div class="cal2-stat-value cal2-positive">${formatCurrency(monthPaid)}</div>
      </div>
      <div class="cal2-stat-card">
        <div class="cal2-stat-label">Unpaid</div>
        <div class="cal2-stat-value ${monthUnpaid > 0 ? 'cal2-negative' : ''}">${formatCurrency(monthUnpaid)}</div>
      </div>
    </div>

    <div class="cal2-nav">
      <button class="cal-nav-btn" id="cal-prev">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="cal-month-label">${monthName}</div>
      <button class="cal-nav-btn" id="cal-next">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>

    <div class="cal2-grid-wrap">
      <div class="cal2-dow-row">
        ${dowHeaders.map(h => `<div class="cal2-dow-cell">${h}</div>`).join('')}
        <div class="cal2-dow-cell cal2-week-col-header">Week</div>
      </div>
      ${gridRows}
    </div>

    <div class="spacer"></div>
  `;
}

// ===== EXPENSES VIEW =====
function getMonthExpenses(expenses, monthPrefix) {
  const result = [];
  const seen = new Set();
  for (const exp of expenses) {
    const expMonthStr = (exp.date || '').slice(0, 7);
    if (expMonthStr === monthPrefix) {
      result.push(exp);
      seen.add(exp.id);
    } else if (exp.recurring && expMonthStr < monthPrefix && !seen.has(exp.id + monthPrefix)) {
      const day = (exp.date || '').slice(8, 10) || '01';
      result.push({ ...exp, date: `${monthPrefix}-${day}`, isRecurringInstance: true, baseId: exp.id });
      seen.add(exp.id + monthPrefix);
    }
  }
  return result;
}

function renderExpenseFormPanel(exp = {}) {
  const isEdit  = !!exp.id;
  const type    = exp.type || 'expense';
  const cat     = exp.category || 'equipment';
  const isIncome = type === 'income';

  const catPills = EXPENSE_CATEGORIES.map(c => `
    <button type="button" class="ef-cat-pill${cat === c.id ? ' active' : ''}" data-ef-cat="${c.id}">
      <span class="ef-cat-emoji">${c.emoji}</span>
      <span class="ef-cat-name">${c.label}</span>
    </button>`).join('');

  return `
    <div class="ef-wrap">

      <!-- Header -->
      <div class="ef-head">
        <div>
          <div class="ef-head-title">${isEdit ? 'Edit Transaction' : 'Add Transaction'}</div>
          <div class="ef-head-sub">${isEdit ? 'Update this record' : 'Log an expense or income'}</div>
        </div>
        <button class="ef-close" id="sheet-close-btn" type="button">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="14" y1="4" x2="4" y2="14"/><line x1="4" y1="4" x2="14" y2="14"/></svg>
        </button>
      </div>

      <!-- Type toggle -->
      <div class="ef-section">
        <div class="ef-label">Type</div>
        <div class="ef-type-toggle">
          <button type="button" class="ef-type-btn${!isIncome ? ' active expense' : ''}" data-ef-type="expense">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>
            Expense
          </button>
          <button type="button" class="ef-type-btn${isIncome ? ' active income' : ''}" data-ef-type="income">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="2,11 8,5 14,11"/></svg>
            Income
          </button>
        </div>
        <input type="hidden" id="ef-type" value="${type}" />
      </div>

      <!-- Amount + Date -->
      <div class="ef-section ef-row">
        <div class="ef-field ef-field--amount">
          <div class="ef-label">Amount</div>
          <div class="ef-amount-wrap">
            <span class="ef-amount-pre">$</span>
            <input class="ef-amount-input" type="number" id="ef-amount"
              placeholder="0.00" value="${exp.amount || ''}"
              inputmode="decimal" min="0" step="0.01" />
          </div>
        </div>
        <div class="ef-field ef-field--date">
          <div class="ef-label">Date</div>
          <input class="ef-date-input" type="date" id="ef-date" value="${exp.date || todayISO()}" />
        </div>
      </div>

      <!-- Description -->
      <div class="ef-section">
        <div class="ef-label">Description <span class="ef-optional">optional</span></div>
        <input class="ef-text-input" type="text" id="ef-desc"
          placeholder="e.g. Mower blade sharpening"
          value="${escHtml(exp.description || '')}" />
      </div>

      <!-- Category (hidden for income) -->
      <div class="ef-section" id="ef-cat-section"${isIncome ? ' style="display:none"' : ''}>
        <div class="ef-label">Category</div>
        <div class="ef-cat-grid">${catPills}</div>
        <input type="hidden" id="ef-category" value="${cat}" />
      </div>

      <!-- Notes -->
      <div class="ef-section">
        <div class="ef-label">Notes <span class="ef-optional">optional</span></div>
        <textarea class="ef-textarea" id="ef-notes"
          placeholder="Any extra details...">${escHtml(exp.notes || '')}</textarea>
      </div>

      <!-- Repeat monthly -->
      <div class="ef-section">
        <label class="ef-recurring">
          <input type="checkbox" id="ef-recurring" ${exp.recurring ? 'checked' : ''} />
          <div class="ef-recurring-icon">
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="1,4 1,10 7,10"/><path d="M3.51,15a9,9,0,1,0,.49-4.48"/></svg>
          </div>
          <div class="ef-recurring-text">
            <span class="ef-recurring-title">Repeat monthly</span>
            <span class="ef-recurring-sub">Auto-add this expense each month</span>
          </div>
        </label>
      </div>

      <!-- Footer actions -->
      <div class="ef-footer">
        ${isEdit ? `<button class="ef-delete-btn" id="delete-expense-modal-btn" data-expense-id="${exp.id}" type="button">Delete</button>` : ''}
        <button class="ef-save-btn" id="save-expense-btn" data-expense-id="${exp.id || ''}" type="button">
          ${isEdit ? 'Save Changes' : 'Add Transaction'}
        </button>
      </div>

    </div>`;
}

// ===== CASH FLOW DATA HELPER =====
function computeExpensesData() {
  const data   = getData();
  const period = state.expensesPeriod || '3M';
  const now    = new Date();

  // Build month list going back from current month
  let monthCount;
  if      (period === '1M')  monthCount = 1;
  else if (period === '3M')  monthCount = 3;
  else if (period === '6M')  monthCount = 6;
  else if (period === 'YTD') monthCount = now.getMonth() + 1;
  else                       monthCount = 12; // 1Y

  const months = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label:  d.toLocaleDateString('en-US', { month: 'short' }),
      prefix: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }

  const startISO = months[0].prefix + '-01';
  const endISO   = todayISO();

  // Payments → inflow
  const allPayments = [];
  for (const c of data.clients || []) {
    for (const p of c.payments || []) {
      if (p.date >= startISO && p.date <= endISO)
        allPayments.push({ ...p, clientName: c.name, clientId: c.id });
    }
  }

  // Expense records
  const expRec = (data.expenses || []).filter(e => e.date >= startISO && e.date <= endISO && e.type !== 'income');
  const incRec = (data.expenses || []).filter(e => e.date >= startISO && e.date <= endISO && e.type === 'income');

  // Monthly sums for chart
  const inflowByMo = {}, outflowByMo = {};
  for (const m of months) { inflowByMo[m.prefix] = 0; outflowByMo[m.prefix] = 0; }
  for (const p of allPayments) {
    const k = (p.date || '').slice(0, 7);
    if (k in inflowByMo) inflowByMo[k] += p.amount || 0;
  }
  for (const e of incRec) {
    const k = (e.date || '').slice(0, 7);
    if (k in inflowByMo) inflowByMo[k] += e.amount || 0;
  }
  for (const e of expRec) {
    const k = (e.date || '').slice(0, 7);
    if (k in outflowByMo) outflowByMo[k] += e.amount || 0;
  }

  const chartLabels  = months.map(m => m.label);
  const chartInflow  = months.map(m => inflowByMo[m.prefix]);
  const chartOutflow = months.map(m => outflowByMo[m.prefix]);
  const chartNet     = chartInflow.map((v, i) => v - chartOutflow[i]);

  const totalInflow  = chartInflow.reduce((s, v) => s + v, 0);
  const totalOutflow = chartOutflow.reduce((s, v) => s + v, 0);
  const net          = totalInflow - totalOutflow;
  const avgBurn      = monthCount > 0 ? totalOutflow / monthCount : 0;

  // Previous period for deltas
  const prevStart = new Date(now.getFullYear(), now.getMonth() - monthCount * 2, 1).toISOString().slice(0, 10);
  const prevEnd   = new Date(now.getFullYear(), now.getMonth() - monthCount, 0).toISOString().slice(0, 10);
  let prevIn = 0, prevOut = 0;
  for (const c of data.clients || [])
    for (const p of c.payments || [])
      if (p.date >= prevStart && p.date <= prevEnd) prevIn += p.amount || 0;
  for (const e of data.expenses || []) {
    if (e.date >= prevStart && e.date <= prevEnd) {
      if (e.type === 'income') prevIn += e.amount || 0;
      else prevOut += e.amount || 0;
    }
  }
  const pctΔ = (curr, prev) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;
  const deltas = {
    inflow:  pctΔ(totalInflow,  prevIn),
    outflow: pctΔ(totalOutflow, prevOut),
    net:     pctΔ(net, prevIn - prevOut),
    avgBurn: pctΔ(avgBurn, prevOut / monthCount),
  };

  // Category breakdown
  const catTotals = {};
  for (const e of expRec) {
    const k = e.category || 'other';
    catTotals[k] = (catTotals[k] || 0) + e.amount;
  }
  const catRows  = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const donutData = catRows.map(([catId, total]) => ({
    catId,
    total,
    pct:   totalOutflow > 0 ? Math.round((total / totalOutflow) * 100) : 0,
    cat:   EXPENSE_CATEGORIES.find(c => c.id === catId),
    color: EXPENSE_CAT_COLORS[catId] || '#94a3b8',
  }));

  // All transactions sorted desc
  const transactions = [
    ...allPayments.map(p => ({
      date: p.date, isInflow: true,
      description: p.description || p.clientName || 'Payment',
      category: 'Revenue',
      amount: p.amount,
      status: p.status === 'paid' ? 'cleared' : 'pending',
      id: p.id, clientId: p.clientId, source: 'payment',
    })),
    ...expRec.map(e => ({
      date: e.date, isInflow: false,
      description: e.description || EXPENSE_CATEGORIES.find(c => c.id === e.category)?.label || 'Expense',
      category: EXPENSE_CATEGORIES.find(c => c.id === e.category)?.label || e.category || 'Other',
      amount: e.amount,
      status: 'paid',
      id: e.id, source: 'expense',
    })),
    ...incRec.map(e => ({
      date: e.date, isInflow: true,
      description: e.description || 'Income',
      category: 'Revenue',
      amount: e.amount,
      status: 'cleared',
      id: e.id, source: 'expense',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return { totalInflow, totalOutflow, net, avgBurn, deltas, chartLabels, chartInflow, chartOutflow, chartNet, donutData, transactions, monthCount };
}

// ===== DELETE TRANSACTION =====
function deleteTx(id, source, clientId) {
  if (!id) return false;
  captureUndo();
  const d = getData();
  if (source === 'payment' && clientId) {
    const client = d.clients.find(c => c.id === clientId);
    if (client) client.payments = (client.payments || []).filter(p => p.id !== id);
  } else {
    d.expenses = (d.expenses || []).filter(e => e.id !== id);
  }
  saveData(d);
  return true;
}

// ===== CATEGORY DRILLDOWN DATA =====
function computeCatDrilldown(catId, period) {
  const data        = getData();
  const allExpenses = (data.expenses || []).filter(e => e.type !== 'income' && e.category === catId);
  const now         = new Date();

  let monthCount;
  if      (period === '1M')  monthCount = 1;
  else if (period === '3M')  monthCount = 3;
  else if (period === '6M')  monthCount = 6;
  else if (period === 'YTD') monthCount = now.getMonth() + 1;
  else                       monthCount = 12;

  // Build ordered month array
  const months = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  const firstMo  = months[0];
  const lastMo   = months[months.length - 1];
  const startISO = `${firstMo.year}-${String(firstMo.month + 1).padStart(2,'0')}-01`;
  const lastDay  = new Date(lastMo.year, lastMo.month + 1, 0).getDate();
  const endISO   = `${lastMo.year}-${String(lastMo.month + 1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;

  const periodExps = allExpenses.filter(e => e.date >= startISO && e.date <= endISO);
  const total      = periodExps.reduce((s, e) => s + e.amount, 0);

  // Time denominators
  const startDate = new Date(startISO + 'T12:00:00');
  const endDate   = new Date(endISO   + 'T12:00:00');
  const days      = Math.max(1, Math.round((endDate - startDate) / 86400000) + 1);
  const weeks     = days / 7;

  const avgWeek   = total / weeks;
  const avgMonth  = total / monthCount;
  const projAnnual = avgMonth * 12;

  // Monthly breakdown for bar chart
  const monthlyTotals = months.map(mo => {
    const prefix  = `${mo.year}-${String(mo.month + 1).padStart(2,'0')}`;
    const moTotal = periodExps
      .filter(e => (e.date || '').startsWith(prefix))
      .reduce((s, e) => s + e.amount, 0);
    const label   = new Date(mo.year, mo.month, 1)
      .toLocaleDateString('en-US', { month: 'short' });
    return { label, total: moTotal };
  });

  const maxMonthly   = Math.max(...monthlyTotals.map(m => m.total), 1);
  const transactions = [...periodExps].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const cat = EXPENSE_CATEGORIES.find(c => c.id === catId);
  return { total, avgWeek, avgMonth, projAnnual, monthlyTotals, maxMonthly, transactions, catId, cat };
}

// ===== CHART INIT (Cash Flow page) =====
function initCfCharts(cd) {
  if (typeof Chart === 'undefined') return;
  if (window._cfLine)  { window._cfLine.destroy();  window._cfLine  = null; }
  if (window._cfDonut) { window._cfDonut.destroy(); window._cfDonut = null; }

  const lineEl  = document.getElementById('cf-line-canvas');
  const donutEl = document.getElementById('cf-donut-canvas');

  const gridColor  = 'rgba(0,0,0,0.04)';
  const tickColor  = '#94a3b8';
  const ttBg       = '#ffffff';
  const ttBorder   = 'rgba(0,0,0,0.08)';
  const ttTitle    = '#1a2e1a';
  const ttBody     = '#4a5568';

  if (lineEl && cd.chartLabels.length) {
    window._cfLine = new Chart(lineEl, {
      type: 'line',
      data: {
        labels: cd.chartLabels,
        datasets: [
          {
            label: 'Inflow',
            data: cd.chartInflow,
            borderColor: '#0d9488', backgroundColor: 'rgba(13,148,136,0.07)',
            fill: true, tension: 0.42, borderWidth: 1.5,
            pointRadius: 3, pointHoverRadius: 5, pointBackgroundColor: '#0d9488', pointBorderWidth: 0,
          },
          {
            label: 'Outflow',
            data: cd.chartOutflow,
            borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.06)',
            fill: true, tension: 0.42, borderWidth: 1.5,
            pointRadius: 3, pointHoverRadius: 5, pointBackgroundColor: '#f97316', pointBorderWidth: 0,
          },
          {
            label: 'Net',
            data: cd.chartNet,
            borderColor: '#3b82f6', backgroundColor: 'transparent',
            fill: false, tension: 0.42, borderWidth: 1.5, borderDash: [5, 4],
            pointRadius: 3, pointHoverRadius: 5, pointBackgroundColor: '#3b82f6', pointBorderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: ttBg, borderColor: ttBorder, borderWidth: 0.5,
            titleColor: ttTitle, bodyColor: ttBody,
            padding: { x: 12, y: 10 },
            callbacks: { label: ctx => `  ${ctx.dataset.label}  $${ctx.parsed.y.toLocaleString()}` },
          },
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 }, color: tickColor, maxRotation: 0 } },
          y: { grid: { color: gridColor }, border: { display: false }, ticks: { font: { size: 11 }, color: tickColor, callback: v => '$' + (Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) } },
        },
        interaction: { intersect: false, mode: 'index' },
      },
    });
  }

  if (donutEl && cd.donutData.length) {
    window._cfDonut = new Chart(donutEl, {
      type: 'doughnut',
      data: {
        labels: cd.donutData.map(d => d.cat?.label || d.catId),
        datasets: [{ data: cd.donutData.map(d => d.pct), backgroundColor: cd.donutData.map(d => d.color), borderWidth: 0, hoverOffset: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: ttBg, borderColor: ttBorder, borderWidth: 0.5,
            titleColor: ttTitle, bodyColor: ttBody,
            padding: { x: 12, y: 10 },
            callbacks: { label: ctx => `  ${ctx.label}  ${ctx.parsed}%` },
          },
        },
      },
    });
  }
}

// ===== DEBT TRACKER =====
const DEBT_CATEGORIES = [
  { id: 'vehicle',   label: 'Vehicle',        emoji: '🚛' },
  { id: 'equipment', label: 'Equipment',       emoji: '🔧' },
  { id: 'loan',      label: 'Business Loan',  emoji: '🏦' },
  { id: 'credit',    label: 'Credit Card',    emoji: '💳' },
  { id: 'property',  label: 'Property',       emoji: '🏠' },
  { id: 'other',     label: 'Other',          emoji: '📋' },
];

function debtMonthsLeft(balance, monthlyPayment, annualRate) {
  if (!balance || !monthlyPayment || monthlyPayment <= 0) return null;
  if (!annualRate || annualRate <= 0) {
    return Math.ceil(balance / monthlyPayment);
  }
  const r = (annualRate / 100) / 12;
  if (monthlyPayment <= balance * r) return Infinity; // payment doesn't cover interest
  return Math.ceil(-Math.log(1 - (balance * r) / monthlyPayment) / Math.log(1 + r));
}

function debtPayoffDate(monthsLeft) {
  if (!monthsLeft || !isFinite(monthsLeft)) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + monthsLeft);
  return d;
}

function renderDebtView() {
  const data  = getData();
  const debts = (data.debts || []).sort((a, b) => b.balance - a.balance);

  const totalOwed    = debts.reduce((s, d) => s + (d.balance || 0), 0);
  const totalMonthly = debts.reduce((s, d) => s + (d.monthlyPayment || 0), 0);

  // Earliest payoff date = latest payoff date among all debts (you're still paying all until then)
  let latestMonths = 0;
  for (const d of debts) {
    const m = debtMonthsLeft(d.balance, d.monthlyPayment, d.interestRate);
    if (m && isFinite(m) && m > latestMonths) latestMonths = m;
  }
  const debtFreeDate = latestMonths > 0 ? debtPayoffDate(latestMonths) : null;
  const debtFreeLabel = debtFreeDate
    ? debtFreeDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : debts.length === 0 ? '—' : 'N/A';

  const debtCards = debts.length === 0
    ? `<div class="debt-empty">No debts tracked yet — add one to get started.</div>`
    : debts.map(debt => {
        const cat      = DEBT_CATEGORIES.find(c => c.id === debt.category) || DEBT_CATEGORIES[5];
        const months   = debtMonthsLeft(debt.balance, debt.monthlyPayment, debt.interestRate);
        const payoff   = debtPayoffDate(months);
        const paidOff  = (debt.originalBalance || debt.balance) - debt.balance;
        const pct      = debt.originalBalance > 0
          ? Math.min(Math.round((paidOff / debt.originalBalance) * 100), 100) : 0;

        const payoffLabel = !months ? '—'
          : !isFinite(months) ? 'Never (payment < interest)'
          : months === 1 ? '1 month'
          : months < 12 ? `${months} months`
          : `${Math.floor(months / 12)}y ${months % 12}m`;
        const payoffDate = payoff
          ? payoff.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : '';

        // Total interest if rate provided
        let totalInterestLabel = '';
        if (debt.interestRate > 0 && months && isFinite(months)) {
          const totalPaid = months * debt.monthlyPayment;
          const interest  = totalPaid - debt.balance;
          if (interest > 0) totalInterestLabel = `~${formatCurrency(interest)} interest`;
        }

        const autoPayBadge = debt.autoPayDay
          ? `<span class="debt-auto-badge">⚡ Auto day ${debt.autoPayDay}</span>`
          : '';

        return `
          <div class="debt-card">
            <div class="debt-card-head">
              <span class="debt-cat-badge">${cat.emoji} ${cat.label}</span>
              <div class="debt-card-actions">
                ${autoPayBadge}
                <button class="debt-action-btn debt-log-pay-sm" data-debt-log-pay="${debt.id}" title="Log payment">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <button class="debt-action-btn" data-debt-edit="${debt.id}" title="Edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="debt-action-btn debt-action-del" data-debt-del="${debt.id}" title="Delete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                </button>
              </div>
            </div>
            <div class="debt-card-name">${escHtml(debt.name)}</div>
            <div class="debt-card-balance">
              <span class="debt-balance-num">${formatCurrency(debt.balance)}</span>
              <span class="debt-balance-of">of ${formatCurrency(debt.originalBalance || debt.balance)} owed</span>
            </div>
            <div class="debt-progress-track">
              <div class="debt-progress-fill" style="width:${pct}%"></div>
            </div>
            <div class="debt-progress-label">${pct}% paid off</div>
            <div class="debt-stats">
              <div class="debt-stat">
                <div class="debt-stat-label">Monthly payment</div>
                <div class="debt-stat-value">${formatCurrency(debt.monthlyPayment)}</div>
              </div>
              <div class="debt-stat">
                <div class="debt-stat-label">Time left</div>
                <div class="debt-stat-value">${payoffLabel}</div>
              </div>
              <div class="debt-stat">
                <div class="debt-stat-label">Payoff estimate</div>
                <div class="debt-stat-value">${payoffDate || '—'}</div>
              </div>
              ${debt.interestRate > 0 ? `
              <div class="debt-stat">
                <div class="debt-stat-label">APR</div>
                <div class="debt-stat-value">${debt.interestRate}%${totalInterestLabel ? ` · ${totalInterestLabel}` : ''}</div>
              </div>` : ''}
            </div>
            ${debt.notes ? `<div class="debt-notes">${escHtml(debt.notes)}</div>` : ''}
          </div>`;
      }).join('');

  return `
    <div class="cf-wrap">
      <div class="cf-header">
        <div class="cf-header-left">
          <h1 class="cf-title">Debt Tracker</h1>
          <p class="cf-subtitle">Loans, payments &amp; payoff estimates</p>
        </div>
        <div class="cf-header-right">
          <div class="cf-tab-group">
            <button class="cf-tab-btn" data-exp-tab="cashflow">Cash Flow</button>
            <button class="cf-tab-btn active" data-exp-tab="debt">Debt</button>
          </div>
          <button class="cf-add-btn" id="debt-add-btn">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;flex-shrink:0"><line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/></svg>
            Add debt
          </button>
        </div>
      </div>

      <div class="debt-summary-grid">
        <div class="cf-metric">
          <span class="cf-metric-label">Total owed</span>
          <span class="cf-metric-value" style="color:var(--danger)">${formatCurrency(totalOwed)}</span>
        </div>
        <div class="cf-metric">
          <span class="cf-metric-label">Monthly payments</span>
          <span class="cf-metric-value">${formatCurrency(totalMonthly)}</span>
        </div>
        <div class="cf-metric">
          <span class="cf-metric-label">Debt-free estimate</span>
          <span class="cf-metric-value" style="font-size:18px">${debtFreeLabel}</span>
        </div>
        <div class="cf-metric">
          <span class="cf-metric-label">Active debts</span>
          <span class="cf-metric-value">${debts.length}</span>
        </div>
      </div>

      <div class="debt-cards-grid">${debtCards}</div>
      <div class="spacer"></div>
    </div>`;
}

function renderDebtForm(debt = {}) {
  const isEdit = !!debt.id;
  const selCat = debt.category || 'vehicle';
  return `
    <div class="sheet-header">
      <div>
        <h2>${isEdit ? 'Edit Debt' : 'Add Debt'}</h2>
        <p class="sheet-header-sub">Track a loan, payment plan, or liability</p>
      </div>
      <button class="sheet-close" id="sheet-close-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="form-body">

      <div class="form-group">
        <label class="form-label">Name *</label>
        <input class="form-input" id="df-name" type="text" placeholder="e.g. Truck Payment" value="${escHtml(debt.name || '')}" autocomplete="off" />
      </div>

      <div class="form-group">
        <label class="form-label">Category</label>
        <div class="df-cat-grid" id="df-cat-select">
          ${DEBT_CATEGORIES.map(c => `
            <button class="df-cat-tile ${selCat === c.id ? 'selected' : ''}" data-df-cat="${c.id}">
              <span class="df-cat-tile-emoji">${c.emoji}</span>
              <span class="df-cat-tile-label">${c.label}</span>
            </button>`).join('')}
        </div>
        <input type="hidden" id="df-cat" value="${selCat}" />
      </div>

      <div class="form-group">
        <label class="form-label">Current balance owed *</label>
        <div class="form-prefix-wrap">
          <span class="form-prefix">$</span>
          <input class="form-input" id="df-balance" type="number" placeholder="11,500" min="0" step="1" inputmode="decimal" value="${debt.balance || ''}" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Original balance <span class="form-label-opt">optional</span></label>
        <div class="form-prefix-wrap">
          <span class="form-prefix">$</span>
          <input class="form-input" id="df-original" type="number" placeholder="Same as current" min="0" step="1" inputmode="decimal" value="${debt.originalBalance || ''}" />
        </div>
      </div>

      <div class="df-two-col">
        <div class="form-group">
          <label class="form-label">Monthly payment *</label>
          <div class="form-prefix-wrap">
            <span class="form-prefix">$</span>
            <input class="form-input" id="df-payment" type="number" placeholder="1,500" min="0" step="1" inputmode="decimal" value="${debt.monthlyPayment || ''}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Interest rate <span class="form-label-opt">APR</span></label>
          <div class="form-suffix-wrap">
            <input class="form-input" id="df-rate" type="number" placeholder="0" min="0" max="100" step="0.1" inputmode="decimal" value="${debt.interestRate || ''}" />
            <span class="form-suffix">%</span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Notes <span class="form-label-opt">optional</span></label>
        <input class="form-input" id="df-notes" type="text" placeholder="e.g. refinanced Mar 2025" value="${escHtml(debt.notes || '')}" />
      </div>

      <div class="form-group">
        <label class="form-label">Auto-pay day <span class="form-label-opt">optional</span></label>
        <div class="df-autopay-row">
          <input class="form-input df-autopay-input" id="df-autopay-day" type="number" placeholder="e.g. 1" min="1" max="31" step="1" inputmode="numeric" value="${debt.autoPayDay || ''}" />
          <span class="df-autopay-hint">of each month — auto-logs payment &amp; expense</span>
        </div>
      </div>

      <div class="df-eta-wrap" id="df-eta-preview"></div>

    </div>
    <div class="sheet-footer" style="${isEdit ? 'display:flex;gap:8px' : ''}">
      ${isEdit ? `<button class="btn btn-danger-outline" id="df-delete-btn" data-debt-id="${debt.id}">Delete</button>` : ''}
      <button class="btn btn-primary ${isEdit ? '' : 'btn-full'}" style="${isEdit ? 'flex:1' : ''}" id="df-save-btn" data-debt-id="${debt.id || ''}">
        ${isEdit ? 'Save Changes' : 'Add Debt'}
      </button>
    </div>`;
}

function renderDebtPaymentForm(debt = {}) {
  return `
    <div class="sheet-header">
      <div>
        <h2>Log Payment</h2>
        <p class="sheet-header-sub">${escHtml(debt.name || '')} · ${formatCurrency(debt.balance || 0)} remaining</p>
      </div>
      <button class="sheet-close" id="sheet-close-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="form-body">

      <div class="form-group">
        <label class="form-label">Payment amount *</label>
        <div class="form-prefix-wrap">
          <span class="form-prefix">$</span>
          <input class="form-input" id="dp-amount" type="number" placeholder="0.00"
            value="${debt.monthlyPayment || ''}" min="0" step="0.01" inputmode="decimal" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Date</label>
        <input class="form-input" id="dp-date" type="date" value="${todayISO()}" />
      </div>

      <div class="form-group">
        <label class="form-label">Note <span class="form-label-opt">optional</span></label>
        <input class="form-input" id="dp-note" type="text" placeholder="e.g. June payment" autocomplete="off" />
      </div>

      <label class="dp-expense-toggle">
        <input type="checkbox" id="dp-log-expense" checked />
        <span>Also log as business expense</span>
      </label>

    </div>
    <div class="sheet-footer">
      <button class="btn btn-primary btn-full" id="dp-save-btn" data-debt-id="${debt.id || ''}">Log Payment</button>
    </div>`;
}

// ===== AUTO DEBT PAYMENTS =====
function checkAutoDebtPayments() {
  const d = getData();
  const today = todayISO();
  const todayDay = new Date().getDate();
  const monthKey = today.slice(0, 7); // YYYY-MM

  let autoLogged = [];
  for (const debt of (d.debts || [])) {
    const payDay = parseInt(debt.autoPayDay);
    if (!payDay || payDay !== todayDay) continue;
    if (!debt.payments) debt.payments = [];
    // Already auto-logged this month?
    const alreadyDone = debt.payments.some(p => p.autoLogged && p.date && p.date.startsWith(monthKey));
    if (alreadyDone) continue;
    const amount = debt.monthlyPayment || 0;
    if (!amount) continue;

    const expId = generateId();
    debt.payments.unshift({
      id: generateId(), amount, date: today,
      note: 'Auto-payment', autoLogged: true, expenseId: expId,
    });
    debt.balance = Math.max(0, (debt.balance || 0) - amount);

    if (!d.expenses) d.expenses = [];
    d.expenses.push({
      id: expId, type: 'expense', category: 'other',
      description: `${debt.name} — auto payment`,
      amount, date: today,
      notes: 'Auto-logged from debt tracker', recurring: false,
    });
    autoLogged.push(debt.name);
  }

  if (autoLogged.length > 0) {
    saveData(d);
    setTimeout(() => showToast(`⚡ Auto-payment logged: ${autoLogged.join(', ')}`), 400);
  }
}

// ===== TOOLS VIEW =====
function computeToolResult(toolId, vals, card) {
  const fmt  = n => Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
  const fmt2 = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtC = n => '$' + fmt2(n);

  const statBlock = (items) => `
    <div class="tool-result-stats">
      ${items.map(s => `
        <div class="tool-result-stat${s.green ? ' green' : ''}${s.amber ? ' amber' : ''}">
          <div class="tool-result-val">${s.val}</div>
          <div class="tool-result-lbl">${s.lbl}</div>
        </div>`).join('')}
    </div>`;

  // ── Mulch & Topsoil ──────────────────────────────────────────────────────────
  if (toolId === 'mulch' || toolId === 'topsoil') {
    const { length: L, width: W, depth: D } = vals;
    if (!L || !W || !D) return '';
    const cuYds      = (L * W * (D / 12)) / 27;
    const cuYdsWaste = cuYds * 1.10;
    const bags2      = Math.ceil(cuYdsWaste * 13.5);
    const bags3      = Math.ceil(cuYdsWaste * 9);
    const area       = L * W;
    return statBlock([
      { val: fmt(cuYds),      lbl: 'cubic yards' },
      { val: fmt(cuYdsWaste), lbl: 'cu yds +10% waste' },
      { val: bags2,           lbl: '2 cu ft bags', green: true },
      { val: bags3,           lbl: '3 cu ft bags', green: true },
    ]) + `<div class="tool-result-note">Coverage: ${fmt(area)} sq ft at ${D}" deep</div>`;
  }

  // ── Gravel / Rock ────────────────────────────────────────────────────────────
  if (toolId === 'gravel') {
    const { length: L, width: W, depth: D } = vals;
    if (!L || !W || !D) return '';
    const cuYds  = (L * W * (D / 12)) / 27;
    const waste  = cuYds * 1.10;
    const typeEl = card.querySelector('select[data-field="gtype"]');
    const gtype  = typeEl ? typeEl.value : 'gravel';
    const density = { gravel: 1.4, pea: 1.2, limestone: 1.35, river: 1.3 }[gtype] || 1.4;
    const tons = waste * density;
    return statBlock([
      { val: fmt(cuYds), lbl: 'cubic yards' },
      { val: fmt(waste), lbl: 'cu yds +10% waste' },
      { val: fmt(tons),  lbl: 'tons approx.', green: true },
    ]) + `<div class="tool-result-note">${fmt(L * W)} sq ft · ≈${density} tons/yd³ for selected type</div>`;
  }

  // ── Sod ──────────────────────────────────────────────────────────────────────
  if (toolId === 'sod') {
    const { length: L, width: W } = vals;
    if (!L || !W) return '';
    const sqFt    = L * W;
    const waste   = sqFt * 1.05;
    const pallets = Math.ceil(waste / 450);
    const rolls   = Math.ceil(waste / 9);
    return statBlock([
      { val: fmt(sqFt),   lbl: 'sq ft' },
      { val: pallets,     lbl: 'pallets (450 sq ft)', green: true },
      { val: rolls,       lbl: 'rolls (9 sq ft)',     green: true },
    ]) + `<div class="tool-result-note">5% waste included · 1 pallet ≈ 450 sq ft</div>`;
  }

  // ── Lawn Area ────────────────────────────────────────────────────────────────
  if (toolId === 'area') {
    const shape = card.querySelector('.tool-shape-tab.active')?.dataset.shape || 'rect';
    if (shape === 'rect') {
      const { length: L, width: W } = vals;
      if (!L || !W) return '';
      const sqFt = L * W;
      return statBlock([
        { val: fmt(sqFt),          lbl: 'sq ft',    green: true },
        { val: fmt(sqFt / 9),      lbl: 'sq yards' },
        { val: fmt(sqFt * 0.0929), lbl: 'sq meters' },
      ]);
    }
    if (shape === 'circle') {
      const { radius: R } = vals;
      if (!R) return '';
      const sqFt = Math.PI * R * R;
      return statBlock([
        { val: fmt(sqFt),     lbl: 'sq ft',    green: true },
        { val: fmt(sqFt / 9), lbl: 'sq yards' },
        { val: fmt(R * 2 * Math.PI), lbl: 'ft circumference' },
      ]);
    }
    if (shape === 'triangle') {
      const { base: B, height: H } = vals;
      if (!B || !H) return '';
      const sqFt = 0.5 * B * H;
      return statBlock([
        { val: fmt(sqFt),     lbl: 'sq ft',    green: true },
        { val: fmt(sqFt / 9), lbl: 'sq yards' },
      ]);
    }
    if (shape === 'lshape') {
      const { l1, w1, l2, w2 } = vals;
      if (!l1 || !w1 || !l2 || !w2) return '';
      const sqFt = (l1 * w1) + (l2 * w2);
      return statBlock([
        { val: fmt(sqFt),     lbl: 'sq ft',    green: true },
        { val: fmt(sqFt / 9), lbl: 'sq yards' },
      ]) + `<div class="tool-result-note">Section A: ${fmt(l1*w1)} sq ft · Section B: ${fmt(l2*w2)} sq ft</div>`;
    }
  }

  // ── Grass Seed ───────────────────────────────────────────────────────────────
  if (toolId === 'seed') {
    const { area } = vals;
    const typeEl = card.querySelector('select[data-field="stype"]');
    const stype  = typeEl ? typeEl.value : 'fescue';
    if (!area) return '';
    const RATES = {
      fescue:   { new: 8,   over: 4,   label: 'Tall Fescue'         },
      bermuda:  { new: 2,   over: 0.75,label: 'Bermuda'             },
      kentucky: { new: 3,   over: 1.5, label: 'Kentucky Bluegrass'  },
      zoysia:   { new: 2,   over: 1,   label: 'Zoysia'              },
      rye:      { new: 8,   over: 4,   label: 'Perennial Rye'       },
      st_aug:   { new: 0,   over: 0,   label: 'St. Augustine (plugs/sod only)' },
    };
    const rate = RATES[stype] || RATES.fescue;
    if (rate.new === 0) return `<div class="tool-result-note" style="color:var(--amber)">${rate.label} is typically installed via plugs or sod — not seed.</div>`;
    const lbsNew  = area / 1000 * rate.new;
    const lbsOver = area / 1000 * rate.over;
    return statBlock([
      { val: fmt(lbsNew),  lbl: 'lbs — new lawn',   green: true },
      { val: fmt(lbsOver), lbl: 'lbs — overseeding' },
    ]) + `<div class="tool-result-note">${rate.label} · ${fmt(area)} sq ft</div>`;
  }

  // ── Fertilizer ───────────────────────────────────────────────────────────────
  if (toolId === 'fert') {
    const { area, coverage } = vals;
    if (!area || !coverage) return '';
    const bags     = Math.ceil(area / coverage);
    const partBag  = (area / coverage) % 1;
    return statBlock([
      { val: bags,             lbl: 'bags needed', green: true },
      { val: fmt(area / coverage), lbl: 'exact bags' },
      { val: partBag > 0 ? `${fmt(partBag * 100)}%` : '—', lbl: 'partial bag leftover' },
    ]) + `<div class="tool-result-note">${fmt(area)} sq ft ÷ ${fmt(coverage)} sq ft/bag</div>`;
  }

  // ── Mow Time ─────────────────────────────────────────────────────────────────
  if (toolId === 'mow') {
    const { area, deck, speed } = vals;
    if (!area || !deck || !speed) return '';
    const deckFt     = deck / 12;
    const effWidth   = deckFt * 0.85;           // 15% overlap
    const linearFt   = area / effWidth;          // total linear feet to cover
    const timeHrs    = (linearFt / (speed * 5280)) * 1.20; // 20% turn buffer
    const totalMins  = timeHrs * 60;
    const h          = Math.floor(totalMins / 60);
    const m          = Math.round(totalMins % 60);
    const passes     = Math.ceil(Math.sqrt(area) / effWidth);
    const miles      = linearFt / 5280;
    return statBlock([
      { val: h > 0 ? `${h}h ${m}m` : `${m}m`, lbl: 'est. mow time',  green: true },
      { val: passes,                            lbl: 'passes'                      },
      { val: fmt(miles),                        lbl: 'miles walked'                },
    ]) + `<div class="tool-result-note">15% deck overlap · 20% buffer for turns & trimming</div>`;
  }

  // ── Job Quote ────────────────────────────────────────────────────────────────
  if (toolId === 'quote') {
    const { hours, rate, materials, markup } = vals;
    if (!hours || !rate) return '';
    const labor       = hours * rate;
    const matCharged  = materials * (1 + (markup || 0) / 100);
    const matProfit   = materials * ((markup || 0) / 100);
    const total       = labor + matCharged;
    const grossProfit = labor + matProfit;
    const margin      = total > 0 ? (grossProfit / total * 100) : 0;
    return `
      <div class="tool-quote-breakdown">
        <div class="tool-quote-row"><span>Labor (${fmt(hours)}h × ${fmtC(rate)}/hr)</span><strong>${fmtC(labor)}</strong></div>
        ${materials > 0 ? `<div class="tool-quote-row"><span>Materials + ${markup || 0}% markup</span><strong>${fmtC(matCharged)}</strong></div>` : ''}
        <div class="tool-quote-divider"></div>
        <div class="tool-quote-row total"><span>Total Quote</span><strong>${fmtC(total)}</strong></div>
        ${materials > 0 ? `<div class="tool-quote-row profit"><span>Est. gross profit</span><strong>${fmtC(grossProfit)} (${fmt(margin)}%)</strong></div>` : ''}
      </div>`;
  }

  // ── Mowing Job Estimator ─────────────────────────────────────────────────────
  if (toolId === 'mowquote') {
    const { acres, rate } = vals;
    if (!acres || !rate) return '';
    const scopeEl = card.querySelector('select[data-field="scope"]');
    const scope   = scopeEl ? parseFloat(scopeEl.value) : 1.4;  // time multiplier

    const mowMins   = acres * 60;           // 1 hr/acre base mow time
    const totalMins = mowMins * scope;      // add trim/edge/blow multiplier
    const totalHrs  = totalMins / 60;
    const perJob    = totalHrs * rate;

    const h = Math.floor(totalMins / 60);
    const m = Math.round(totalMins % 60);
    const timeLabel = h > 0 ? `${h}h ${m}m` : `${m}m`;

    const weeklyMo   = perJob * 4.33;
    const biwklyMo   = perJob * 2.17;
    const monthlyMo  = perJob;

    return statBlock([
      { val: timeLabel,           lbl: 'est. job time',   green: true },
      { val: fmtC(perJob),        lbl: 'per job',         green: true },
      { val: fmtC(weeklyMo),      lbl: 'weekly · /month'              },
      { val: fmtC(biwklyMo),      lbl: 'bi-weekly · /month'           },
      { val: fmtC(monthlyMo),     lbl: 'monthly · /month'             },
    ]) + `<div class="tool-result-note">${acres} acres · ${totalHrs.toFixed(2)} hrs · ${fmtC(rate)}/hr</div>`;
  }

  // ── Bags vs. Bulk ─────────────────────────────────────────────────────────────
  if (toolId === 'bagsvbulk') {
    const { yards, bagprice, bulkprice } = vals;
    if (!yards) return '';
    const bags2     = Math.ceil(yards * 13.5);
    const bags3     = Math.ceil(yards * 9);
    const costBag2  = bags2  * (bagprice  || 5.99);
    const costBag3  = bags3  * (bagprice  || 5.99);
    const costBulk  = yards  * (bulkprice || 35);
    const minBag    = Math.min(costBag2, costBag3);
    const bulkWins  = costBulk < minBag;
    const savings   = Math.abs(minBag - costBulk);
    return `
      <div class="tool-quote-breakdown">
        <div class="tool-quote-row"><span>2 cu ft bags (${bags2} bags)</span><strong>${fmtC(costBag2)}</strong></div>
        <div class="tool-quote-row"><span>3 cu ft bags (${bags3} bags)</span><strong>${fmtC(costBag3)}</strong></div>
        <div class="tool-quote-row"><span>Bulk by the yard (${fmt(yards)} yd³)</span><strong>${fmtC(costBulk)}</strong></div>
        <div class="tool-quote-divider"></div>
        <div class="tool-quote-row total ${bulkWins ? 'green' : 'amber'}">
          <span>${bulkWins ? '✓ Bulk is cheaper' : '✓ Bags are cheaper'} — save</span>
          <strong>${fmtC(savings)}</strong>
        </div>
      </div>`;
  }

  return '';
}

function renderTools() {
  const toolCard = ({ id, emoji, title, desc, body }) => `
    <div class="tool-card" data-tool="${id}">
      <div class="tool-card-head">
        <div class="tool-emoji">${emoji}</div>
        <div class="tool-card-title-wrap">
          <div class="tool-title">${title}</div>
          <div class="tool-desc">${desc}</div>
        </div>
      </div>
      <div class="tool-body">
        ${body}
        <div class="tool-result" id="result-${id}"></div>
      </div>
    </div>`;

  const depthPresets = (vals = ['2','3','4'], dflt = '3') => `
    <div class="tool-preset-row">
      ${vals.map(v => `<button class="tool-preset${v === dflt ? ' active' : ''}" data-preset="depth" data-val="${v}">${v}"</button>`).join('')}
      <input class="tool-input tool-input-xs" type="number" data-field="depth" value="${dflt}" min="0.5" step="0.5" inputmode="decimal" />
    </div>`;

  const shapePanel = (shape, fields) => `
    <div class="tool-shape-panel" data-shape="${shape}">${fields}</div>`;

  const field = (label, id, placeholder, unit = '') => `
    <div class="tool-group">
      <label class="tool-label">${label}</label>
      <div class="tool-input-wrap">
        <input class="tool-input" type="number" data-field="${id}" placeholder="${placeholder}" min="0" inputmode="decimal" />
        ${unit ? `<span class="tool-input-unit">${unit}</span>` : ''}
      </div>
    </div>`;

  const row2 = (...fields) => `<div class="tool-row-2">${fields.join('')}</div>`;

  // ── Material calculators ───────────────────────────────────────────────────
  const mulch = toolCard({ id: 'mulch', emoji: '🍂', title: 'Mulch Calculator', desc: 'Area + depth → cu yards & bags',
    body: `
      ${row2(field('Length', 'length', '20', 'ft'), field('Width', 'width', '10', 'ft'))}
      <div class="tool-group">
        <label class="tool-label">Depth</label>
        ${depthPresets(['2','3','4'], '3')}
      </div>` });

  const topsoil = toolCard({ id: 'topsoil', emoji: '🌱', title: 'Topsoil / Fill Dirt', desc: 'Area + depth → cubic yards',
    body: `
      ${row2(field('Length', 'length', '20', 'ft'), field('Width', 'width', '10', 'ft'))}
      <div class="tool-group">
        <label class="tool-label">Depth</label>
        ${depthPresets(['2','4','6'], '4')}
      </div>` });

  const gravel = toolCard({ id: 'gravel', emoji: '🪨', title: 'Gravel / Rock', desc: 'Area + depth → cubic yards & tons',
    body: `
      ${row2(field('Length', 'length', '20', 'ft'), field('Width', 'width', '10', 'ft'))}
      <div class="tool-group">
        <label class="tool-label">Depth</label>
        ${depthPresets(['2','3','4'], '3')}
      </div>
      <div class="tool-group">
        <label class="tool-label">Stone type</label>
        <select class="tool-select" data-field="gtype">
          <option value="gravel">Crushed Gravel (~1.4 t/yd³)</option>
          <option value="limestone">Crushed Limestone (~1.35 t/yd³)</option>
          <option value="pea">Pea Gravel (~1.2 t/yd³)</option>
          <option value="river">River Rock (~1.3 t/yd³)</option>
        </select>
      </div>` });

  const sod = toolCard({ id: 'sod', emoji: '🟩', title: 'Sod Calculator', desc: 'Area → pallets & rolls',
    body: row2(field('Length', 'length', '30', 'ft'), field('Width', 'width', '20', 'ft')) });

  // ── Lawn calculators ────────────────────────────────────────────────────────
  const area = toolCard({ id: 'area', emoji: '📐', title: 'Lawn Area', desc: 'Rectangle, circle, triangle, or L-shape',
    body: `
      <div class="tool-shape-tabs">
        <button class="tool-shape-tab active" data-shape="rect">Rectangle</button>
        <button class="tool-shape-tab" data-shape="circle">Circle</button>
        <button class="tool-shape-tab" data-shape="triangle">Triangle</button>
        <button class="tool-shape-tab" data-shape="lshape">L-Shape</button>
      </div>
      ${shapePanel('rect',     row2(field('Length', 'length', '50', 'ft'), field('Width', 'width', '30', 'ft')))}
      ${shapePanel('circle',   field('Radius', 'radius', '15', 'ft'))}
      ${shapePanel('triangle', row2(field('Base', 'base', '40', 'ft'), field('Height', 'height', '25', 'ft')))}
      ${shapePanel('lshape',   row2(field('Section A length', 'l1', '40', 'ft'), field('Section A width', 'w1', '20', 'ft')) + row2(field('Section B length', 'l2', '20', 'ft'), field('Section B width', 'w2', '15', 'ft')))}
    ` });

  const seed = toolCard({ id: 'seed', emoji: '🌾', title: 'Grass Seed', desc: 'Area + grass type → pounds needed',
    body: `
      ${field('Lawn area', 'area', '5000', 'sq ft')}
      <div class="tool-group">
        <label class="tool-label">Grass type</label>
        <select class="tool-select" data-field="stype">
          <option value="fescue">Tall Fescue</option>
          <option value="rye">Perennial Rye</option>
          <option value="kentucky">Kentucky Bluegrass</option>
          <option value="bermuda">Bermuda</option>
          <option value="zoysia">Zoysia</option>
          <option value="st_aug">St. Augustine</option>
        </select>
      </div>` });

  const fert = toolCard({ id: 'fert', emoji: '🧪', title: 'Fertilizer', desc: 'How many bags for your lawn size',
    body: `
      ${field('Lawn area', 'area', '5000', 'sq ft')}
      <div class="tool-group">
        <label class="tool-label">Bag coverage</label>
        <div class="tool-preset-row">
          <button class="tool-preset active" data-preset="coverage" data-val="5000">5,000 sq ft</button>
          <button class="tool-preset" data-preset="coverage" data-val="10000">10,000 sq ft</button>
          <button class="tool-preset" data-preset="coverage" data-val="15000">15,000 sq ft</button>
          <input class="tool-input tool-input-xs" type="number" data-field="coverage" value="5000" min="100" inputmode="decimal" />
        </div>
      </div>` });

  const mow = toolCard({ id: 'mow', emoji: '🚜', title: 'Mow Time Estimator', desc: 'Area + mower size → estimated time',
    body: `
      ${field('Lawn area', 'area', '8000', 'sq ft')}
      <div class="tool-group">
        <label class="tool-label">Mower deck width</label>
        <div class="tool-preset-row">
          <button class="tool-preset" data-preset="deck" data-val="21">21"</button>
          <button class="tool-preset active" data-preset="deck" data-val="42">42"</button>
          <button class="tool-preset" data-preset="deck" data-val="52">52"</button>
          <button class="tool-preset" data-preset="deck" data-val="60">60"</button>
          <input class="tool-input tool-input-xs" type="number" data-field="deck" value="42" min="10" inputmode="decimal" />
        </div>
      </div>
      <div class="tool-group">
        <label class="tool-label">Ground speed</label>
        <div class="tool-preset-row">
          <button class="tool-preset" data-preset="speed" data-val="2.5">2.5 mph</button>
          <button class="tool-preset active" data-preset="speed" data-val="4">4 mph</button>
          <button class="tool-preset" data-preset="speed" data-val="6">6 mph</button>
          <input class="tool-input tool-input-xs" type="number" data-field="speed" value="4" min="0.5" step="0.5" inputmode="decimal" />
        </div>
      </div>` });

  // ── Business calculators ────────────────────────────────────────────────────
  const mowquote = toolCard({ id: 'mowquote', emoji: '🌿', title: 'Mowing Job Estimator', desc: 'Acreage → time & quote per job',
    body: `
      ${row2(field('Property size', 'acres', '0.42', 'acres'), field('Your rate', 'rate', '65', '/hr'))}
      <div class="tool-group">
        <label class="tool-label">Scope of work</label>
        <select class="tool-select" data-field="scope">
          <option value="1.0">Mow only</option>
          <option value="1.4" selected>Mow + trim &amp; edge</option>
          <option value="1.8">Full service (mow, trim, blow, haul)</option>
        </select>
      </div>` });

  const quote = toolCard({ id: 'quote', emoji: '💰', title: 'Job Quote Builder', desc: 'Labor + materials → total quote',
    body: `
      ${row2(field('Hours on job', 'hours', '2', 'hrs'), field('Your hourly rate', 'rate', '75', '/hr'))}
      ${row2(field('Material cost', 'materials', '0', '$'), field('Markup %', 'markup', '20', '%'))}` });

  const bagsvbulk = toolCard({ id: 'bagsvbulk', emoji: '⚖️', title: 'Bags vs. Bulk', desc: 'Compare bagged vs. bulk delivery cost',
    body: `
      ${field('Mulch needed', 'yards', '3', 'cu yds')}
      ${row2(field('Price per bag', 'bagprice', '5.99', '$'), field('Bulk price/yard', 'bulkprice', '35', '$'))}` });

  return `
    <div class="tools-page">
      <div class="tools-page-header">
        <div>
          <h1 class="tools-page-title">Tools</h1>
          <p class="tools-page-sub">Calculators & estimators for the field</p>
        </div>
      </div>

      <div class="tools-cat-label"><span class="tools-cat-icon">🧱</span> Material Calculators</div>
      <div class="tools-grid">
        ${mulch}
        ${topsoil}
        ${gravel}
        ${sod}
      </div>

      <div class="tools-cat-label"><span class="tools-cat-icon">🌿</span> Lawn Calculators</div>
      <div class="tools-grid">
        ${area}
        ${seed}
        ${fert}
        ${mow}
      </div>

      <div class="tools-cat-label"><span class="tools-cat-icon">💼</span> Business Calculators</div>
      <div class="tools-grid">
        ${mowquote}
        ${quote}
        ${bagsvbulk}
      </div>

      <div class="spacer"></div>
    </div>`;
}

// ===== EXPENSES VIEW =====
function renderExpenses() {
  const tab = state.expensesTab || 'cashflow';
  if (tab === 'debt') return renderDebtView();

  const cd     = computeExpensesData();
  const period = state.expensesPeriod || '3M';
  const PERIODS = ['1M', '3M', '6M', 'YTD', '1Y'];

  const fmtC = v => {
    const abs = Math.abs(v);
    const str = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(abs);
    return (v < 0 ? '−' : '') + str;
  };

  const deltaHtml = (d) => {
    if (d === null || d === undefined) return '';
    const up = d >= 0;
    return `<span class="cf-metric-delta ${up ? 'up' : 'down'}">${up ? '↑' : '↓'} ${Math.abs(d)}% vs prev period</span>`;
  };

  const statusBadge = (s) => {
    const MAP = {
      cleared: { label: 'Cleared', color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
      paid:    { label: 'Paid',    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
      pending: { label: 'Pending', color: '#d97706', bg: 'rgba(217,119,6,0.1)'   },
      unpaid:  { label: 'Unpaid',  color: '#d97706', bg: 'rgba(217,119,6,0.1)'   },
      overdue: { label: 'Overdue', color: '#dc2626', bg: 'rgba(220,38,38,0.1)'   },
    };
    const cfg = MAP[s] || MAP.pending;
    return `<span class="cf-badge" style="color:${cfg.color};background:${cfg.bg}">${cfg.label}</span>`;
  };

  // Donut legend
  const donutLegendHtml = cd.donutData.length === 0
    ? `<p class="cf-empty">No expenses logged this period.</p>`
    : cd.donutData.map(d => `
        <div class="cf-dl-row">
          <span class="cf-dl-dot" style="background:${d.color}"></span>
          <span class="cf-dl-name">${escHtml(d.cat?.label || d.catId)}</span>
          <span class="cf-dl-pct">${d.pct}%</span>
        </div>`).join('');

  // Expense list
  const expListHtml = cd.donutData.length === 0
    ? `<p class="cf-empty">No expenses this period.</p>`
    : cd.donutData.map((d, i) => `
        <div class="cf-exp-row${i === cd.donutData.length - 1 ? ' cf-exp-row--last' : ''}" data-drilldown-cat="${d.catId}" style="cursor:pointer" title="Click for ${escHtml(d.cat?.label || d.catId)} breakdown">
          <span class="cf-exp-icon" style="background:${d.color}1a;color:${d.color}">${d.cat?.emoji || '📦'}</span>
          <div class="cf-exp-info">
            <span class="cf-exp-name">${escHtml(d.cat?.label || d.catId)}</span>
            <div class="cf-exp-bar-track"><div class="cf-exp-bar-fill" style="width:${d.pct}%;background:${d.color}"></div></div>
          </div>
          <span class="cf-exp-amount">${fmtC(d.total)}</span>
          <span class="cf-exp-pct">${d.pct}%</span>
          <svg class="cf-exp-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`).join('');

  // Transactions — filter
  const txFilter = state.expensesFilter || 'expenses';
  const TX_FILTERS = [
    { id: 'expenses', label: 'Expenses' },
    { id: 'revenue',  label: 'Revenue'  },
    { id: 'all',      label: 'All'      },
  ];
  const filteredTx = txFilter === 'all'      ? cd.transactions
    : txFilter === 'expenses' ? cd.transactions.filter(tx => !tx.isInflow)
    :                           cd.transactions.filter(tx =>  tx.isInflow);

  const txHtml = filteredTx.length === 0
    ? `<tr><td colspan="5" class="cf-td-empty">No ${txFilter === 'all' ? '' : txFilter + ' '}transactions this period.</td></tr>`
    : filteredTx.slice(0, 60).map(tx => `
        <tr class="cf-tx-row-deletable">
          <td class="cf-td-date">${formatDate(tx.date)}</td>
          <td class="cf-td-desc">${escHtml(tx.description)}</td>
          <td class="cf-td-cat">${escHtml(tx.category)}</td>
          <td class="cf-td-amount${tx.isInflow ? ' cf-td-amount--in' : ''}">
            ${tx.isInflow ? '+' : '−'}${fmtC(tx.amount).replace(/^−/, '')}
          </td>
          <td>${statusBadge(tx.status)}</td>
          <td class="cf-td-action">
            ${tx.id ? `<button class="cf-tx-del-btn" data-delete-tx="${tx.id}" data-tx-source="${tx.source}" data-tx-client="${tx.clientId || ''}" title="Delete transaction">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>` : ''}
          </td>
        </tr>`).join('');

  return `
    <div class="cf-wrap">

      <!-- ── Header ── -->
      <div class="cf-header">
        <div class="cf-header-left">
          <h1 class="cf-title">Cash flow &amp; expenses</h1>
          <p class="cf-subtitle">Financial overview — all accounts</p>
        </div>
        <div class="cf-header-right">
          <div class="cf-tab-group">
            <button class="cf-tab-btn active" data-exp-tab="cashflow">Cash Flow</button>
            <button class="cf-tab-btn" data-exp-tab="debt">Debt</button>
          </div>
          <div class="cf-period-group">
            ${PERIODS.map(p => `<button class="cf-period-btn${period === p ? ' active' : ''}" data-cf-period="${p}">${p}</button>`).join('')}
          </div>
          <button class="cf-add-btn" id="exp-add-mobile-btn">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;flex-shrink:0"><line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/></svg>
            Add expense
          </button>
        </div>
      </div>

      <!-- ── Metric cards ── -->
      <div class="cf-metrics-grid">
        <div class="cf-metric">
          <span class="cf-metric-label">Total inflow</span>
          <span class="cf-metric-value">${fmtC(cd.totalInflow)}</span>
          ${deltaHtml(cd.deltas.inflow)}
        </div>
        <div class="cf-metric">
          <span class="cf-metric-label">Total outflow</span>
          <span class="cf-metric-value">${fmtC(cd.totalOutflow)}</span>
          ${deltaHtml(cd.deltas.outflow)}
        </div>
        <div class="cf-metric">
          <span class="cf-metric-label">Net cash flow</span>
          <span class="cf-metric-value" style="color:var(--green-mid)">${fmtC(cd.net)}</span>
          ${deltaHtml(cd.deltas.net)}
        </div>
        <div class="cf-metric">
          <span class="cf-metric-label">Avg monthly burn</span>
          <span class="cf-metric-value">${fmtC(cd.avgBurn)}</span>
          ${deltaHtml(cd.deltas.avgBurn)}
        </div>
      </div>

      <!-- ── Charts grid ── -->
      <div class="cf-charts-grid">

        <!-- Line chart -->
        <div class="cf-card cf-line-card">
          <div class="cf-card-head">
            <span class="cf-card-title">Cash flow over time</span>
            <div class="cf-line-legend">
              <span class="cf-ll-item"><span class="cf-ll-line" style="background:#0d9488"></span>Inflow</span>
              <span class="cf-ll-item"><span class="cf-ll-line" style="background:#f97316"></span>Outflow</span>
              <span class="cf-ll-item"><span class="cf-ll-dashed"></span>Net</span>
            </div>
          </div>
          <div class="cf-chart-body">
            <div class="cf-canvas-wrap" style="height:220px"><canvas id="cf-line-canvas"></canvas></div>
          </div>
        </div>

        <!-- Doughnut chart -->
        <div class="cf-card cf-donut-card">
          <div class="cf-card-head">
            <span class="cf-card-title">Expense breakdown</span>
          </div>
          <div class="cf-chart-body">
            <div class="cf-canvas-wrap" style="height:180px"><canvas id="cf-donut-canvas"></canvas></div>
          </div>
          <div class="cf-donut-legend">${donutLegendHtml}</div>
        </div>

      </div>

      <!-- ── Expense list ── -->
      <div class="cf-card">
        <div class="cf-card-head">
          <span class="cf-card-title">Expenses by category</span>
          <span class="cf-card-meta">${cd.donutData.length} categor${cd.donutData.length === 1 ? 'y' : 'ies'}</span>
        </div>
        <div class="cf-expense-list">
          ${expListHtml}
          ${cd.donutData.length > 0 ? `
          <div class="cf-exp-total">
            <span class="cf-exp-total-label">Total outflow</span>
            <span class="cf-exp-total-value">${fmtC(cd.totalOutflow)}</span>
          </div>` : ''}
        </div>
      </div>

      <!-- ── Transactions table ── -->
      <div class="cf-card">
        <div class="cf-card-head">
          <span class="cf-card-title">Transactions</span>
          <div class="cf-tx-filters">
            ${TX_FILTERS.map(f => `<button class="cf-tx-filter-btn${txFilter === f.id ? ' active' : ''}" data-tx-filter="${f.id}">${f.label}</button>`).join('')}
          </div>
          <span class="cf-card-meta">${filteredTx.length} entr${filteredTx.length === 1 ? 'y' : 'ies'}</span>
        </div>
        <div class="cf-table-scroll">
          <table class="cf-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th style="text-align:right">Amount</th>
                <th>Status</th>
                <th style="width:40px"></th>
              </tr>
            </thead>
            <tbody>${txHtml}</tbody>
          </table>
        </div>
      </div>

      <div class="spacer"></div>
    </div>`;
}

// ── ORIGINAL renderExpenses() removed below — replaced above ──
function _REMOVED_renderExpenses_original() {
  const data = getData();
  const allExpenses = data.expenses || [];
  const now = new Date();
  const period = state.expensesPeriod || 'monthly';
  const year  = state.expensesYear  || now.getFullYear();
  const month = state.expensesMonth !== undefined ? state.expensesMonth : now.getMonth();

  // ── Period bounds ──
  let periodExps = [], periodLabel = '', prevLabel = '', nextLabel = '';
  if (period === 'weekly') {
    const today = new Date(todayISO() + 'T12:00:00');
    const dow = today.getDay();
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - ((dow + 6) % 7));
    const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    const wsISO = weekStart.toISOString().slice(0,10);
    const weISO = weekEnd.toISOString().slice(0,10);
    periodExps = allExpenses.filter(e => e.date >= wsISO && e.date <= weISO);
    periodLabel = `${weekStart.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${weekEnd.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
  } else if (period === 'monthly') {
    const monthPrefix = `${year}-${String(month+1).padStart(2,'0')}`;
    periodExps = allExpenses.filter(e => (e.date||'').slice(0,7) === monthPrefix);
    periodLabel = new Date(year, month, 1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
    const pm = month === 0 ? new Date(year-1,11,1) : new Date(year,month-1,1);
    const nm = month === 11 ? new Date(year+1,0,1) : new Date(year,month+1,1);
    prevLabel = pm.toLocaleDateString('en-US',{month:'short'});
    nextLabel = nm.toLocaleDateString('en-US',{month:'short'});
  } else { // annually
    periodExps = allExpenses.filter(e => (e.date||'').startsWith(String(year)));
    periodLabel = String(year);
    prevLabel = String(year-1);
    nextLabel = String(year+1);
  }

  const income   = periodExps.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0);
  const expenses = periodExps.filter(e=>e.type!=='income').reduce((s,e)=>s+e.amount,0);
  const net = income - expenses;

  // ── Category breakdown ──
  const catTotals = {};
  for (const e of periodExps.filter(e=>e.type!=='income')) {
    const k = e.category || 'other';
    catTotals[k] = (catTotals[k]||0) + e.amount;
  }
  const catRows = Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
  const maxCat  = catRows.length > 0 ? catRows[0][1] : 1;

  // Monthly avg per category (use last 3 months of data for avg)
  const catAvg = {};
  if (period !== 'weekly') {
    const months = period === 'annually' ? 12 : 3;
    for (let i = 0; i < months; i++) {
      let y = year, m2 = month - i;
      if (m2 < 0) { m2 += 12; y--; }
      const pfx = `${y}-${String(m2+1).padStart(2,'0')}`;
      for (const e of allExpenses.filter(e2=>(e2.date||'').slice(0,7)===pfx && e2.type!=='income')) {
        const k = e.category||'other';
        catAvg[k] = (catAvg[k]||0) + e.amount;
      }
    }
    for (const k in catAvg) catAvg[k] = catAvg[k] / (period === 'annually' ? 12 : 3);
  }

  const catBreakdownHTML = catRows.length === 0
    ? `<div class="exp2-empty">No expenses this period.</div>`
    : catRows.map(([catId, total]) => {
        const cat   = EXPENSE_CATEGORIES.find(c=>c.id===catId);
        const color = EXPENSE_CAT_COLORS[catId] || '#94a3b8';
        const pct   = Math.round((total/maxCat)*100);
        const avg   = catAvg[catId];
        return `
          <div class="exp2-cat-row">
            <div class="exp2-cat-dot" style="background:${color}"></div>
            <div class="exp2-cat-info">
              <div class="exp2-cat-top">
                <span class="exp2-cat-name">${cat?.emoji || ''} ${cat?.label || catId}</span>
                <span class="exp2-cat-amt">${formatCurrency(total)}</span>
              </div>
              <div class="exp2-bar-track">
                <div class="exp2-bar-fill" style="width:${pct}%;background:${color}"></div>
              </div>
              ${avg !== undefined ? `<div class="exp2-cat-avg">avg ${formatCurrency(avg)}/mo</div>` : ''}
            </div>
          </div>`;
      }).join('');

  // ── Transaction list ──
  const sorted = [...periodExps].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  // Group by date
  const dateGroups = {};
  for (const e of sorted) {
    const k = (e.date||'').slice(0,10);
    if (!dateGroups[k]) dateGroups[k] = [];
    dateGroups[k].push(e);
  }

  const txHTML = Object.keys(dateGroups).length === 0
    ? `<div class="exp2-empty">No transactions this period.</div>`
    : Object.entries(dateGroups).map(([date, exps]) => {
        const dayTotal = exps.reduce((s,e)=>s+(e.type==='income'?e.amount:-e.amount),0);
        const rows = exps.map(e => {
          const cat   = EXPENSE_CATEGORIES.find(c=>c.id===e.category);
          const color = EXPENSE_CAT_COLORS[e.category] || '#94a3b8';
          return `
            <div class="exp2-tx-row">
              <div class="exp2-tx-dot" style="background:${e.type==='income'?'var(--green-primary)':color}"></div>
              <div class="exp2-tx-info">
                <span class="exp2-tx-name">${escHtml(e.description||cat?.label||'Transaction')}</span>
                <span class="exp2-tx-cat">${cat?.label||''}</span>
              </div>
              <div class="exp2-tx-right">
                <span class="exp2-tx-amt ${e.type==='income'?'income':'expense'}">${e.type==='income'?'+':'−'}${formatCurrency(e.amount)}</span>
                <button class="exp2-tx-edit" data-edit-expense="${e.id}" title="Edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
            </div>`;
        }).join('');
        return `
          <div class="exp2-date-group">
            <div class="exp2-date-header">
              <span class="exp2-date-label">${formatDate(date)}</span>
              <span class="exp2-date-net ${dayTotal>=0?'income':'expense'}">${dayTotal>=0?'+':''}${formatCurrency(dayTotal)}</span>
            </div>
            ${rows}
          </div>`;
      }).join('');

  // ── Nav buttons ──
  const showNav = period !== 'weekly';
  const navHTML = showNav ? `
    <div class="exp2-period-nav">
      <button class="exp2-nav-btn" id="exp-prev">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        ${prevLabel}
      </button>
      <span class="exp2-period-label">${periodLabel}</span>
      <button class="exp2-nav-btn" id="exp-next">
        ${nextLabel}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>` : `<div class="exp2-period-label-center">${periodLabel}</div>`;

  return `
    <div class="page-header">
      <h1>Expenses</h1>
      <button class="btn btn-primary" id="exp-add-mobile-btn" style="padding:8px 16px;font-size:13px">+ Add</button>
    </div>

    <div class="exp2-period-tabs">
      <button class="exp2-tab ${period==='weekly'?'active':''}"  data-exp-period="weekly">Week</button>
      <button class="exp2-tab ${period==='monthly'?'active':''}" data-exp-period="monthly">Month</button>
      <button class="exp2-tab ${period==='annually'?'active':''}" data-exp-period="annually">Year</button>
    </div>

    ${navHTML}

    <div class="exp2-cashflow">
      <div class="exp2-cf-card income">
        <div class="exp2-cf-label">Money In</div>
        <div class="exp2-cf-value">${formatCurrency(income)}</div>
      </div>
      <div class="exp2-cf-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <div class="exp2-cf-card expense">
        <div class="exp2-cf-label">Money Out</div>
        <div class="exp2-cf-value">${formatCurrency(expenses)}</div>
      </div>
      <div class="exp2-cf-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <div class="exp2-cf-card ${net>=0?'net-pos':'net-neg'}">
        <div class="exp2-cf-label">Net</div>
        <div class="exp2-cf-value">${net>=0?'+':''}${formatCurrency(net)}</div>
      </div>
    </div>

    <div class="exp2-section">
      <div class="exp2-section-title">By Category</div>
      <div class="exp2-cat-list">${catBreakdownHTML}</div>
    </div>

    <div class="exp2-section">
      <div class="exp2-section-title">Transactions</div>
      <div class="exp2-tx-list">${txHTML}</div>
    </div>

    <div class="spacer"></div>`;
}

// ===== SETTINGS VIEW =====
function renderSettings() {
  const data = getData();
  return `
    <div class="page-header">
      <div class="header-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
      <h1>Settings</h1>
    </div>
    <div class="settings-list">
      <div style="padding:4px 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted)">Data</div>
      <div class="settings-item" id="export-data-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <div class="settings-text">
          <div class="settings-label">Export Data</div>
          <div class="settings-sub">Download all clients & payments as JSON</div>
        </div>
        <div class="settings-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
      </div>
      <div class="settings-item" id="import-data-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <div class="settings-text">
          <div class="settings-label">Import Data</div>
          <div class="settings-sub">Restore from a previous export</div>
        </div>
        <div class="settings-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
      </div>
      <input type="file" id="import-file-input" accept=".json" style="display:none" />
      <div style="padding:12px 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted)">Info</div>
      <div class="settings-item" style="cursor:default">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div class="settings-text">
          <div class="settings-label">About</div>
          <div class="settings-sub">${data.clients.length} clients · Data stored locally on device</div>
        </div>
      </div>
      <div class="settings-item settings-danger" id="clear-data-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        <div class="settings-text">
          <div class="settings-label">Clear All Data</div>
          <div class="settings-sub">Permanently delete everything</div>
        </div>
      </div>
    </div>
    <div class="spacer"></div>
  `;
}

// ===== DASH DAY MODAL =====
function renderDashDayModal({ date }) {
  const data = getData();
  const d = new Date(date + 'T12:00:00');
  const weekdayName = d.toLocaleDateString('en-US', { weekday: 'long' });
  const dateLabel   = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  // Scheduled jobs for this date
  const dayScheduled = (data.scheduledJobs || []).filter(sj => sj.date === date);

  // Payments for this date
  const dayPayments = [];
  for (const client of data.clients) {
    for (const p of (client.payments || [])) {
      if ((p.date || '').slice(0, 10) === date) {
        dayPayments.push({ client, payment: p });
      }
    }
  }

  // Last-week jobs (same weekday, 7 days prior)
  const lastWeekDate = new Date(d);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekISO = lastWeekDate.toISOString().slice(0, 10);
  const lastWeekJobs = (data.scheduledJobs || []).filter(sj => sj.date === lastWeekISO && sj.status === 'scheduled');

  // Clients already scheduled this day
  const alreadyIds = new Set(dayScheduled.map(sj => sj.clientId));

  // ── Scheduled rows
  const scheduledRows = dayScheduled.length === 0
    ? `<div class="sched-empty-hint">Nothing scheduled — add clients below</div>`
    : dayScheduled.map(sj => {
        const client = data.clients.find(c => c.id === sj.clientId);
        if (!client) return '';
        const color    = avatarColor(client.name);
        const isDone   = sj.status === 'done';
        const notes    = client.clientNotes || [];
        const hasPinned = notes.some(n => n.pinned);
        const hasNotes  = notes.length > 0;
        const notesBadge = hasNotes
          ? `<span class="cn-job-badge ${hasPinned ? 'cn-job-badge-pin' : ''}" title="${hasPinned ? 'Has pinned note' : 'Has notes'}">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:10px;height:10px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
               ${notes.length}
             </span>`
          : '';
        const svcMeta = sj.serviceType
          ? `<span class="sched-job-svc">${serviceEmoji(sj.serviceType)} ${serviceLabel(sj.serviceType)}${sj.estimatedPrice ? ' · ~' + formatCurrency(sj.estimatedPrice) : ''}</span>`
          : (sj.description ? `<span class="sched-job-svc">${escHtml(sj.description)}</span>` : '');
        return `
          <div class="sched-job-row ${isDone ? 'sched-done' : ''} ${hasNotes ? 'sched-job-has-notes' : ''}" data-nav-client="${client.id}">
            <div class="sched-avatar" style="background:${color}">${initials(client.name)}</div>
            <div class="sched-job-info">
              <div class="sched-job-name">${escHtml(client.name)}${notesBadge}</div>
              ${svcMeta}
            </div>
            <div class="sched-job-actions">
              ${isDone
                ? `<span class="sched-status-badge">Done</span>`
                : `<button class="sched-btn sched-btn-done" data-sched-done="${sj.id}" data-sched-client="${sj.clientId}" data-date="${date}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Done
                  </button>`}
              <button class="sched-btn sched-btn-remove" data-sched-remove="${sj.id}" data-date="${date}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>`;
      }).join('');

  // ── Payment rows
  const paymentRows = dayPayments.length === 0 ? '' : `
    <div class="sched-section-label" style="margin-top:14px">Billed &amp; Payments</div>
    <div class="sched-jobs-list">
      ${dayPayments.map(({ client, payment }) => `
        <div class="sched-job-row sched-payment-row" data-nav-client="${client.id}">
          <div class="sched-avatar" style="background:${avatarColor(client.name)}">${initials(client.name)}</div>
          <div class="sched-job-name">${escHtml(client.name)}</div>
          <div class="sched-job-actions">
            <span class="badge ${payment.status === 'paid' ? 'badge-paid' : 'badge-unpaid'}">${formatCurrency(payment.amount)}</span>
          </div>
        </div>`).join('')}
    </div>`;

  // ── Client picker — all clients, grouped: Active → On-Call → Paused → Inactive → One-Off
  const clientGroup = c => {
    if (c.type === 'one-time') return 'one-off';
    return c.status || 'active';
  };
  const GROUP_ORDER  = { active: 0, 'on-call': 1, paused: 2, inactive: 3, 'one-off': 4 };
  const GROUP_LABELS = { active: 'Active', 'on-call': 'On-Call', paused: 'Paused', inactive: 'Inactive', 'one-off': 'One-Off' };

  const sortedClients = [...data.clients].sort((a, b) => {
    const ao = GROUP_ORDER[clientGroup(a)] ?? 5;
    const bo = GROUP_ORDER[clientGroup(b)] ?? 5;
    if (ao !== bo) return ao - bo;
    return (a.name || '').localeCompare(b.name || '');
  });

  let lastGroup = null;
  const clientPickerRows = sortedClients.length === 0
    ? `<div class="sched-pick-empty">No clients yet.</div>`
    : sortedClients.map(c => {
        const grp     = clientGroup(c);
        const divider = grp !== lastGroup
          ? (() => { lastGroup = grp; return `<div class="sched-pick-group">${GROUP_LABELS[grp] || grp}</div>`; })()
          : '';
        const color   = avatarColor(c.name);
        const already = alreadyIds.has(c.id);
        const isDim   = grp === 'paused' || grp === 'inactive';
        return `${divider}
          <div class="sched-pick-row ${already ? 'sched-pick-already' : ''} ${isDim ? 'sched-pick-dim' : ''}" data-pick-client="${c.id}">
            <div class="sched-avatar sched-avatar-sm" style="background:${color}">${initials(c.name)}</div>
            <div class="sched-pick-info">
              <span class="sched-pick-name">${escHtml(c.name)}</span>
            </div>
            <div class="sched-pick-check" id="sched-check-${c.id}">
              ${already ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;color:var(--green-mid)"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
            </div>
          </div>`;
      }).join('');

  const excludedHint = '';

  return `
    <div class="sheet-header">
      <div>
        <h2>${dateLabel}</h2>
        <p class="sheet-subhead">${weekdayName}</p>
      </div>
      <button class="sheet-close" id="sheet-close-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="form-body sched-modal-body">

      <div class="sched-section-label">Scheduled</div>
      <div class="sched-jobs-list" id="sched-jobs-list">
        ${scheduledRows}
      </div>

      ${paymentRows}

      <div class="sched-actions">
        <button class="btn btn-secondary" id="sched-add-toggle" data-date="${date}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Clients
        </button>
        ${lastWeekJobs.length > 0 ? `
        <button class="btn btn-ghost" id="sched-pull-lastweek" data-date="${date}" data-lastweek="${lastWeekISO}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
          Last week (${lastWeekJobs.length})
        </button>` : ''}
      </div>

      <div class="sched-picker-panel hidden" id="sched-picker-panel">
        <input class="form-input" type="search" id="sched-picker-search" placeholder="Search active clients..." autocomplete="off" />
        <div class="sched-pick-list" id="sched-pick-list">
          ${clientPickerRows}
          ${excludedHint}
        </div>
        <div class="sched-picker-footer">
          <button class="btn btn-primary full-width" id="sched-confirm-add" data-date="${date}">
            Schedule Selected
          </button>
        </div>
      </div>

    </div>`;
}

// ===== STAT CARD DETAIL MODAL =====
function renderStatDetailModal(type) {
  const data = getData();
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  const yearStart  = `${now.getFullYear()}-01-01`;

  if (type === 'unpaid') {
    // All clients with unpaid balance, sorted by amount desc
    const rows = data.clients.map(c => {
      const unpaid = (c.payments||[]).filter(p=>p.status==='unpaid').reduce((s,p)=>s+p.amount,0);
      return { client: c, unpaid };
    }).filter(r=>r.unpaid>0).sort((a,b)=>b.unpaid-a.unpaid);

    const total = rows.reduce((s,r)=>s+r.unpaid,0);
    const listHTML = rows.length === 0
      ? `<div class="stat-modal-empty">No unpaid balances 🎉</div>`
      : rows.map(r=>`
          <div class="stat-modal-row" data-nav-client="${r.client.id}">
            <div class="sched-avatar" style="background:${avatarColor(r.client.name)}">${initials(r.client.name)}</div>
            <div class="stat-modal-info">
              <div class="stat-modal-name">${escHtml(r.client.name)}</div>
              <div class="stat-modal-sub">${(r.client.payments||[]).filter(p=>p.status==='unpaid').length} unpaid invoice${(r.client.payments||[]).filter(p=>p.status==='unpaid').length!==1?'s':''}</div>
            </div>
            <div class="stat-modal-amount danger">${formatCurrency(r.unpaid)}</div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:var(--text-muted);flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
          </div>`).join('');

    return `
      <div class="sheet-header">
        <div>
          <h2>Unpaid Balance</h2>
          <div style="font-size:13px;color:var(--text-muted)">${formatCurrency(total)} across ${rows.length} client${rows.length!==1?'s':''}</div>
        </div>
        <button class="sheet-close" id="sheet-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div class="sched-modal-body">${listHTML}</div>`;
  }

  if (type === 'jobs-due') {
    const jobs = computeUpcomingJobs(data);
    const listHTML = jobs.length === 0
      ? `<div class="stat-modal-empty">All clients are up to date ✓</div>`
      : jobs.map(j=>`
          <div class="stat-modal-row" data-nav-client="${j.client.id}">
            <div class="sched-avatar" style="background:${avatarColor(j.client.name)}">${initials(j.client.name)}</div>
            <div class="stat-modal-info">
              <div class="stat-modal-name">${escHtml(j.client.name)}</div>
              <div class="stat-modal-sub">${j.service.type} · ${j.service.frequency}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div class="stat-modal-amount ${j.isOverdue?'danger':'warning'}">${j.isOverdue?'Overdue':'Due now'}</div>
              <div style="font-size:11px;color:var(--text-muted)">${j.daysSince}d since last</div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:var(--text-muted);flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
          </div>`).join('');

    return `
      <div class="sheet-header">
        <div>
          <h2>Jobs Due</h2>
          <div style="font-size:13px;color:var(--text-muted)">${jobs.length} client${jobs.length!==1?'s':''} need service</div>
        </div>
        <button class="sheet-close" id="sheet-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div class="sched-modal-body">${listHTML}</div>`;
  }

  if (type === 'ytd') {
    // Build month-by-month buckets from Jan to current month
    const curMonth = now.getMonth(); // 0-indexed
    const year = now.getFullYear();
    const months = [];
    for (let m = 0; m <= curMonth; m++) {
      const key = `${year}-${String(m+1).padStart(2,'0')}`;
      months.push({ key, label: new Date(year, m, 1).toLocaleDateString('en-US', { month: 'long' }), collected: 0, unpaid: 0, count: 0 });
    }
    const monthMap = Object.fromEntries(months.map(m => [m.key, m]));

    for (const c of data.clients) {
      for (const p of (c.payments||[])) {
        const mk = (p.date||'').slice(0,7);
        if (monthMap[mk]) {
          if (p.status === 'paid')   { monthMap[mk].collected += p.amount; monthMap[mk].count++; }
          if (p.status === 'unpaid') { monthMap[mk].unpaid    += p.amount; }
        }
      }
    }

    const grandTotal   = months.reduce((s,m)=>s+m.collected,0);
    const grandUnpaid  = months.reduce((s,m)=>s+m.unpaid,0);
    const maxCollected = Math.max(...months.map(m=>m.collected), 1);

    const monthRows = months.slice().reverse().map(m => {
      const barPct = Math.round((m.collected / maxCollected) * 100);
      return `
        <div class="ytd-month-row">
          <div class="ytd-month-label">${m.label}</div>
          <div class="ytd-month-bar-wrap">
            <div class="ytd-month-bar" style="width:${barPct}%"></div>
          </div>
          <div class="ytd-month-right">
            <div class="ytd-month-collected">${m.collected > 0 ? formatCurrency(m.collected) : '—'}</div>
            ${m.unpaid > 0 ? `<div class="ytd-month-unpaid">${formatCurrency(m.unpaid)} unpaid</div>` : ''}
            ${m.count > 0 ? `<div class="ytd-month-count">${m.count} payment${m.count!==1?'s':''}</div>` : ''}
          </div>
        </div>`;
    }).join('');

    return `
      <div class="sheet-header">
        <div>
          <h2>YTD Revenue</h2>
          <div style="font-size:13px;color:var(--text-muted)">${formatCurrency(grandTotal)} collected · ${months.length} month${months.length!==1?'s':''}</div>
        </div>
        <button class="sheet-close" id="sheet-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div class="sched-modal-body">
        ${monthRows}
        <div class="ytd-totals-row">
          <span>Year total</span>
          <span class="ytd-totals-collected">${formatCurrency(grandTotal)}</span>
        </div>
        ${grandUnpaid > 0 ? `<div class="ytd-totals-row" style="border-top:none;padding-top:0;color:var(--danger)"><span>Outstanding</span><span>${formatCurrency(grandUnpaid)}</span></div>` : ''}
      </div>`;
  }

  if (type === 'this-month') {
    const monthName = now.toLocaleDateString('en-US',{month:'long'});
    const curMonthKey = monthStart.slice(0,7);

    // ── Collected this month ──
    let paidTotal = 0, unpaidTotal = 0;
    for (const c of data.clients) {
      for (const p of (c.payments||[])) {
        if ((p.date||'').slice(0,7) === curMonthKey) {
          if (p.status==='paid')   paidTotal   += p.amount;
          if (p.status==='unpaid') unpaidTotal += p.amount;
        }
      }
    }

    // ── Projected breakdown per client/service ──
    const FREQ_DISPLAY_MULT = { weekly: 4, biweekly: 2, monthly: 1 };
    const FREQ_DISPLAY_LABEL = { weekly: '× 4 weeks', biweekly: '× 2 visits', monthly: '× 1 month' };
    const projLines = [];
    let projTotal = 0;

    const activeClients = data.clients.filter(c => (c.status||'active') === 'active' && c.type !== 'one-time');
    for (const c of activeClients) {
      for (const svc of (c.services||[])) {
        const mult = FREQ_MULTIPLIERS[svc.frequency];
        if (!mult) continue;
        const monthly = svc.price * mult;
        projTotal += monthly;
        projLines.push({ client: c, svc, monthly });
      }
    }
    projLines.sort((a,b) => b.monthly - a.monthly);

    const pct = projTotal > 0 ? Math.min(Math.round((paidTotal/projTotal)*100),100) : 0;
    const remaining = Math.max(projTotal - paidTotal, 0);

    const projHTML = projLines.length === 0
      ? `<div class="stat-modal-empty">No active recurring services.</div>`
      : projLines.map(({client: c, svc, monthly}) => {
          const mult = FREQ_MULTIPLIERS[svc.frequency];
          const dispMult = FREQ_DISPLAY_MULT[svc.frequency] || mult.toFixed(2);
          const dispLabel = FREQ_DISPLAY_LABEL[svc.frequency] || `× ${mult.toFixed(2)}`;
          const ic = serviceIconColors(svc.type);
          return `
            <div class="proj-line" data-nav-client="${c.id}">
              <span class="proj-line-icon" style="background:${ic.bg};color:${ic.color}">${serviceIconSvg(svc.type)}</span>
              <div class="proj-line-info">
                <span class="proj-line-client">${escHtml(c.name)}</span>
                <span class="proj-line-svc">${serviceLabel(svc.type)} · ${FREQ_LABELS[svc.frequency]||svc.frequency}</span>
              </div>
              <div class="proj-line-math">
                <span class="proj-line-formula">${formatCurrency(svc.price)} ${dispLabel}</span>
                <span class="proj-line-total">${formatCurrency(monthly)}</span>
              </div>
            </div>`;
        }).join('');

    return `
      <div class="sheet-header">
        <div>
          <h2>${monthName}</h2>
          <div style="font-size:13px;color:var(--text-muted)">${formatCurrency(paidTotal)} collected of ${formatCurrency(projTotal)} projected</div>
        </div>
        <button class="sheet-close" id="sheet-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div class="sched-modal-body">
        <div class="proj-progress-wrap">
          <div class="proj-progress-bar-track">
            <div class="proj-progress-bar-fill" style="width:${pct}%"></div>
          </div>
          <div class="proj-progress-labels">
            <span class="proj-progress-pct">${pct}% collected</span>
            <span class="proj-progress-remain">${formatCurrency(remaining)} remaining</span>
          </div>
        </div>
        <div class="proj-section-label">Projected breakdown</div>
        ${projHTML}
        <div class="ytd-totals-row">
          <span>Monthly projected</span>
          <span class="ytd-totals-collected">${formatCurrency(projTotal)}</span>
        </div>
        ${unpaidTotal > 0 ? `
        <div class="ytd-totals-row" style="border-top:none;padding-top:2px">
          <span style="color:var(--danger)">Invoiced / unpaid</span>
          <span style="color:var(--danger)">${formatCurrency(unpaidTotal)}</span>
        </div>` : ''}
      </div>`;
  }

  return '';
}

function calcTimeDur() {
  const startVal = document.getElementById('f-time-start')?.value;
  const endVal   = document.getElementById('f-time-end')?.value;
  const preview  = document.getElementById('time-dur-preview');
  const hidden   = document.getElementById('f-time-dur-mins');
  if (!preview || !hidden) return;
  if (!startVal || !endVal) { preview.style.display = 'none'; return; }

  let [sh, sm] = startVal.split(':').map(Number);
  let [eh, em] = endVal.split(':').map(Number);
  let startMins = sh * 60 + sm;
  let endMins   = eh * 60 + em;

  // If end <= start, assume they meant PM for the end time
  if (endMins <= startMins) endMins += 12 * 60;

  const rawMins = endMins - startMins;
  if (rawMins <= 0) { preview.style.display = 'none'; hidden.value = ''; return; }

  const rounded = Math.round(rawMins / 15) * 15;
  const rawH = Math.floor(rawMins / 60), rawM = rawMins % 60;
  const rH   = Math.floor(rounded / 60), rM   = rounded % 60;

  const rawLabel     = `${rawH > 0 ? rawH + 'h ' : ''}${rawM}m`;
  const roundedLabel = `${rH > 0 ? rH + 'h ' : ''}${rM > 0 ? rM + 'm' : ''}`;

  hidden.value = rounded;
  preview.style.display = 'flex';
  preview.innerHTML = `
    <span class="dur-raw">${rawLabel}</span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0;color:var(--text-muted)"><polyline points="9 18 15 12 9 6"/></svg>
    <span class="dur-rounded">${roundedLabel} <span style="font-size:11px;font-weight:500;color:var(--text-muted)">rounded</span></span>`;
}

function renderLogTimeModal(data = {}) {
  const dbData = getData();
  const activeClients = dbData.clients
    .filter(c => (c.status || 'active') === 'active')
    .sort((a, b) => a.name.localeCompare(b.name));

  return `
    <div class="sheet-header">
      <h2>Log Time</h2>
      <button class="sheet-close" id="sheet-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="form-body">
      <div class="form-group">
        <label class="form-label">Arrived &amp; Left</label>
        <div style="display:flex;gap:10px;align-items:center">
          <input class="form-input" type="time" id="f-time-start" style="flex:1" oninput="calcTimeDur()" />
          <span style="color:var(--text-muted);font-size:13px;flex-shrink:0">to</span>
          <input class="form-input" type="time" id="f-time-end" style="flex:1" oninput="calcTimeDur()" />
        </div>
        <input type="hidden" id="f-time-dur-mins" value="" />
        <div id="time-dur-preview" class="time-dur-preview" style="display:none"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Date</label>
        <input class="form-input" type="date" id="f-time-date" value="${data.date || todayISO()}" />
      </div>
      <div class="form-group">
        <label class="form-label">Client <span style="font-weight:400;color:var(--text-muted)">(optional)</span></label>
        <select class="form-input" id="f-time-client">
          <option value="">— General work —</option>
          ${activeClients.map(c => `<option value="${c.id}" ${data.clientId === c.id ? 'selected' : ''}>${escHtml(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Notes <span style="font-weight:400;color:var(--text-muted)">(optional)</span></label>
        <input class="form-input" type="text" id="f-time-notes" placeholder="e.g. Mowing + edging" value="${data.notes || ''}" />
      </div>
    </div>
    <div class="sheet-footer">
      <button class="btn btn-primary btn-full" id="save-time-btn">Save Entry</button>
    </div>`;
}

// ===== MODAL RENDERERS =====
// ===== EXPENSE CATEGORY DRILLDOWN MODAL =====
// ===== SCHEDULE SERVICE SELECT MODAL =====
function renderSchedServiceSelect({ clients, date }) {
  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const clientForms = clients.map(c => {
    const color = avatarColor(c.name);

    // Pull all services from history (active first, then by most recent)
    const allSvcs = [...(c.services || [])].sort((a, b) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    const hasHistory = allSvcs.length > 0;
    // Auto-select the single service, or the first active one
    const autoSvc = allSvcs.length === 1 ? allSvcs[0]
      : (allSvcs.find(s => s.active) || null);

    // History cards
    const historyHtml = allSvcs.map(svc => {
      const ic = serviceIconColors(svc.type);
      const isAuto = autoSvc && svc.id === autoSvc.id;
      return `<button class="sss-hist-card ${isAuto ? 'active' : ''}"
          data-hist-svc="${svc.id}"
          data-hist-type="${svc.type}"
          data-hist-price="${svc.price || ''}"
          data-hist-notes="${escHtml(svc.notes || '')}"
          data-sss-client-id="${c.id}"
          ${isAuto ? `style="border-color:${ic.color};background:${ic.bg}"` : ''}>
        <span class="sss-hist-icon" style="color:${ic.color};background:${ic.bg}">${serviceIconSvg(svc.type)}</span>
        <span class="sss-hist-info">
          <span class="sss-hist-label">${serviceLabel(svc.type)}</span>
          ${svc.notes ? `<span class="sss-hist-note">${escHtml(svc.notes)}</span>` : ''}
        </span>
        ${svc.price ? `<span class="sss-hist-price">${formatCurrency(svc.price)}</span>` : ''}
        <span class="sss-hist-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
      </button>`;
    }).join('');

    // New-service pills (shown when "different service" is tapped, or always if no history)
    const pillsHtml = SERVICE_TYPES.map(s => {
      const ic = serviceIconColors(s.id);
      return `<button class="sss-pill" data-sss-type="${s.id}" data-sss-client-id="${c.id}">
        <span class="sss-pill-icon" style="color:${ic.color}">${serviceIconSvg(s.id)}</span>
        ${s.label}
      </button>`;
    }).join('');

    const newFormHidden = hasHistory ? 'style="display:none"' : '';

    return `
      <div class="sss-block" data-sss-client="${c.id}">
        <div class="sss-block-head">
          <div class="client-avatar" style="background:${color};width:30px;height:30px;font-size:11px;flex-shrink:0">${initials(c.name)}</div>
          <span class="sss-block-name">${escHtml(c.name)}</span>
        </div>
        ${hasHistory ? `<div class="sss-history">${historyHtml}</div>` : ''}
        ${hasHistory ? `
          <button class="sss-diff-btn" data-sss-diff="${c.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px;height:12px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Use a different service
          </button>` : ''}
        <div class="sss-new-form" id="sss-new-form-${c.id}" ${newFormHidden}>
          <div class="sss-pills">${pillsHtml}</div>
        </div>
        <input type="hidden" class="sss-type-val" id="sss-type-${c.id}" value="${autoSvc ? autoSvc.type : ''}" />
        <div class="sss-inputs">
          <input class="form-input" id="sss-desc-${c.id}" type="text" placeholder="Notes (optional)"
            style="flex:2;min-width:0"
            value="${autoSvc && autoSvc.notes ? escHtml(autoSvc.notes) : ''}" />
          <div class="form-prefix-wrap" style="flex:1;min-width:90px">
            <span class="form-prefix">$</span>
            <input class="form-input" id="sss-price-${c.id}" type="number" placeholder="Est. price"
              min="0" step="1" inputmode="decimal"
              value="${autoSvc && autoSvc.price ? autoSvc.price : ''}" />
          </div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="ef-wrap">
      <div class="ef-head">
        <div>
          <div class="ef-title">What's the job?</div>
          <div class="ef-subtitle">${dateLabel}</div>
        </div>
        <button class="ef-close" id="sheet-close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="sss-body">${clientForms}</div>
      <div class="ef-footer">
        <button class="btn btn-primary btn-full" id="sss-confirm-btn" data-date="${date}">
          Schedule ${clients.length} Job${clients.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>`;
}

// ===== QUICK CLIENT PICKER (for "Log payment" speed dial) =====
function renderQuickClientPay(searchQ = '') {
  const data    = getData();
  const clients = (data.clients || []).filter(c => c.type !== 'archived');
  const q       = searchQ.toLowerCase();
  const filtered = q
    ? clients.filter(c => c.name.toLowerCase().includes(q))
    : clients;

  const rows = filtered.length === 0
    ? `<div class="qcp-empty">${q ? 'No clients match.' : 'No clients yet.'}</div>`
    : filtered.map(c => {
        const unpaid = (c.payments || []).filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);
        const color  = avatarColor(c.name);
        return `
          <div class="qcp-row" data-qcp-client="${c.id}">
            <div class="client-avatar" style="background:${color};width:34px;height:34px;font-size:12px;flex-shrink:0">${initials(c.name)}</div>
            <div class="qcp-info">
              <span class="qcp-name">${escHtml(c.name)}</span>
              ${unpaid > 0 ? `<span class="qcp-unpaid">${formatCurrency(unpaid)} unpaid</span>` : '<span class="qcp-ok">All clear</span>'}
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:var(--text-muted);flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
          </div>`;
      }).join('');

  return `
    <div class="ef-wrap">
      <div class="ef-head">
        <div>
          <div class="ef-title">Log Payment</div>
          <div class="ef-subtitle">Select a client</div>
        </div>
        <button class="ef-close" id="sheet-close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div style="padding:12px 16px 0">
        <input class="form-input" id="qcp-search" type="search" placeholder="Search clients…" value="${escHtml(searchQ)}" autocomplete="off" style="font-size:14px" />
      </div>
      <div class="qcp-list">${rows}</div>
    </div>`;
}

function renderExpenseCatModal(catId, period) {
  const dd      = computeCatDrilldown(catId, period);
  const cat     = dd.cat || { label: catId, emoji: '📦' };
  const color   = EXPENSE_CAT_COLORS[catId] || '#94a3b8';
  const PERIODS = ['1M', '3M', '6M', 'YTD', '1Y'];

  const fmtC = v => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(v);

  // Projection note
  const projNote = dd.avgWeek > 0
    ? `At this rate, you're on track to spend <strong>${fmtC(dd.projAnnual)}</strong> on ${escHtml(cat.label)} this year (~${fmtC(dd.avgWeek)}/wk).`
    : `No ${escHtml(cat.label)} spend recorded this period.`;

  // Monthly bar chart
  const barHtml = dd.monthlyTotals.map(m => {
    const pct  = dd.maxMonthly > 0 ? Math.round((m.total / dd.maxMonthly) * 100) : 0;
    const show = m.total > 0;
    return `
      <div class="cd-bar-col">
        ${show ? `<span class="cd-bar-label">${fmtC(m.total).replace('$', '$')}</span>` : '<span class="cd-bar-label" style="opacity:0">—</span>'}
        <div class="cd-bar-track">
          <div class="cd-bar-fill" style="height:${pct}%;background:${color}"></div>
        </div>
        <span class="cd-bar-mo">${escHtml(m.label)}</span>
      </div>`;
  }).join('');

  // Transaction rows
  const txRows = dd.transactions.length === 0
    ? `<div class="cd-tx-empty">No transactions this period.</div>`
    : dd.transactions.map(e => {
        const desc = e.description || cat.label;
        const dateStr = e.date ? new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
        return `
          <div class="cd-tx-row">
            <div class="cd-tx-left">
              <span class="cd-tx-desc">${escHtml(desc)}</span>
              <span class="cd-tx-date">${dateStr}</span>
            </div>
            <span class="cd-tx-amount">−${fmtC(e.amount)}</span>
            ${e.id ? `<button class="cd-tx-del-btn" data-delete-tx="${e.id}" data-tx-source="expense" data-tx-client="" title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>` : ''}
          </div>`;
      }).join('');

  return `
    <div class="cd-wrap">

      <!-- Header -->
      <div class="cd-head">
        <div class="cd-head-left">
          <span class="cd-cat-icon" style="background:${color}1a;color:${color}">${cat.emoji}</span>
          <div>
            <div class="cd-cat-name">${escHtml(cat.label)}</div>
            <div class="cd-cat-sub">Category breakdown</div>
          </div>
        </div>
        <button class="cd-close" id="sheet-close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Period tabs -->
      <div class="cd-period-row">
        ${PERIODS.map(p => `<button class="cd-period-btn${period === p ? ' active' : ''}" data-cat-period="${p}" style="${period === p ? `color:${color};border-color:${color}30;background:${color}0d` : ''}">${p}</button>`).join('')}
      </div>

      <div class="cd-body">

        <!-- Stat cards -->
        <div class="cd-stats-grid">
          <div class="cd-stat">
            <span class="cd-stat-label">Total spent</span>
            <span class="cd-stat-value" style="color:${color}">${fmtC(dd.total)}</span>
          </div>
          <div class="cd-stat">
            <span class="cd-stat-label">Avg / week</span>
            <span class="cd-stat-value">${fmtC(dd.avgWeek)}</span>
          </div>
          <div class="cd-stat">
            <span class="cd-stat-label">Avg / month</span>
            <span class="cd-stat-value">${fmtC(dd.avgMonth)}</span>
          </div>
          <div class="cd-stat">
            <span class="cd-stat-label">Proj. annual</span>
            <span class="cd-stat-value">${fmtC(dd.projAnnual)}</span>
          </div>
        </div>

        <!-- Projection note -->
        <div class="cd-proj-note">${projNote}</div>

        <!-- Monthly bar chart -->
        ${dd.monthlyTotals.length > 1 ? `
        <div class="cd-section-title">Monthly spend</div>
        <div class="cd-bars">${barHtml}</div>` : ''}

        <!-- Transactions -->
        <div class="cd-section-title">${dd.transactions.length} transaction${dd.transactions.length === 1 ? '' : 's'} this period</div>
        <div class="cd-tx-list">${txRows}</div>

      </div>
    </div>`;
}

function renderModal() {
  if (!state.modal) return;
  const { type, data } = state.modal;
  const el = document.getElementById('modal-content');

  if (type === 'add-client' || type === 'edit-client') {
    el.innerHTML = renderClientForm(data);
  } else if (type === 'add-service') {
    el.innerHTML = renderServiceForm(data);
  } else if (type === 'add-payment') {
    el.innerHTML = renderPaymentForm(data);
  } else if (type === 'add-job') {
    el.innerHTML = renderAddJobForm(data);
  } else if (type === 'edit-service') {
    el.innerHTML = renderServiceForm(data);
  } else if (type === 'edit-payment') {
    el.innerHTML = renderPaymentForm(data);
  } else if (type === 'calendar-day') {
    el.innerHTML = renderCalendarDayModal(data);
  } else if (type === 'dash-day') {
    el.innerHTML = renderDashDayModal(data);
  } else if (type === 'stat-detail') {
    el.innerHTML = renderStatDetailModal(data.statType);
  } else if (type === 'log-time') {
    el.innerHTML = renderLogTimeModal(data);
  } else if (type === 'expense-form') {
    el.innerHTML = renderExpenseFormPanel(data);
  } else if (type === 'expense-cat-detail') {
    el.innerHTML = renderExpenseCatModal(data.catId, state.catDrilldownPeriod);
  } else if (type === 'quick-client-pay') {
    el.innerHTML = renderQuickClientPay(data.searchQ || '');
  } else if (type === 'sched-service-select') {
    el.innerHTML = renderSchedServiceSelect(data);
  } else if (type === 'debt-form') {
    el.innerHTML = renderDebtForm(data);
  } else if (type === 'debt-payment') {
    const d = getData();
    const debt = (d.debts || []).find(x => x.id === data.debtId) || {};
    el.innerHTML = renderDebtPaymentForm(debt);
  }
  bindModalEvents();
}

function renderClientForm(client = {}) {
  const isEdit = !!client.id;
  const clientType = client.type || 'regular';
  return `
    <div class="sheet-header">
      <h2>${isEdit ? 'Edit Client' : 'Add Client'}</h2>
      <button class="sheet-close" id="sheet-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="form-body">
      <div class="form-group">
        <label class="form-label">Client Type</label>
        <div class="client-type-toggle">
          <button class="client-type-btn ${clientType === 'regular' ? 'active' : ''}" data-type="regular">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            Regular Client
          </button>
          <button class="client-type-btn ${clientType === 'one-time' ? 'active' : ''}" data-type="one-time">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            One-Time Job
          </button>
        </div>
        <input type="hidden" id="f-client-type" value="${clientType}" />
      </div>
      <div class="form-group">
        <label class="form-label">Full Name *</label>
        <input class="form-input" type="text" id="f-name" placeholder="e.g. John Smith" value="${escHtml(client.name || '')}" autocomplete="name" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-input" type="tel" id="f-phone" placeholder="(555) 123-4567" value="${escHtml(client.phone || '')}" inputmode="tel" />
      </div>
      <div class="form-group">
        <label class="form-label">Address</label>
        <input class="form-input" type="text" id="f-address" placeholder="123 Oak Street, City, ST" value="${escHtml(client.address || '')}" autocomplete="street-address" />
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="f-notes" placeholder="Gate code, special instructions, dog in backyard...">${escHtml(client.notes || '')}</textarea>
      </div>
      ${!isEdit ? `
      <div class="form-section-divider">
        <span>Service</span>
      </div>
      <div class="form-group">
        <label class="form-label">Service Type *</label>
        <div class="pill-select svc-type-select" id="new-svc-type-select">
          ${SERVICE_TYPES.map(s => {
            const ic = serviceIconColors(s.id);
            return `<button class="pill-option svc-type-pill" data-new-svc-type="${s.id}">
              <span class="svc-pill-icon" style="color:${ic.color}">${serviceIconSvg(s.id)}</span>${s.label}
            </button>`;
          }).join('')}
        </div>
        <input type="hidden" id="f-new-svc-type" value="" />
      </div>
      <div class="form-group">
        <label class="form-label">Frequency *</label>
        <div class="pill-select" id="new-svc-freq-select">
          ${Object.entries(FREQ_LABELS).map(([k, v]) => `<button class="pill-option" data-new-svc-freq="${k}">${v}</button>`).join('')}
        </div>
        <input type="hidden" id="f-new-svc-freq" value="" />
      </div>
      <div class="form-group">
        <label class="form-label">Price per Visit *</label>
        <div class="form-prefix-wrap">
          <span class="form-prefix">$</span>
          <input class="form-input" type="number" id="f-new-svc-price" placeholder="0.00" inputmode="decimal" min="0" step="0.01" />
        </div>
      </div>
      ` : ''}
    </div>
    <div class="sheet-footer" style="${isEdit ? 'display:flex;gap:8px' : ''}">
      ${isEdit ? `<button class="btn btn-danger-outline" id="delete-client-modal-btn" data-client-id="${client.id}">Delete</button>` : ''}
      <button class="btn btn-primary ${isEdit ? '' : 'btn-full'}" style="${isEdit ? 'flex:1' : ''}" id="save-client-btn" data-client-id="${client.id || ''}">${isEdit ? 'Save Changes' : 'Add Client'}</button>
    </div>
  `;
}

function renderServiceForm(data = {}) {
  const isEdit = !!data.serviceId;
  return `
    <div class="sheet-header">
      <h2>${isEdit ? 'Edit Service' : 'Add Service'}</h2>
      <button class="sheet-close" id="sheet-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="form-body">
      <div class="form-group">
        <label class="form-label">Service Type *</label>
        <div class="pill-select svc-type-select" id="svc-type-select">
          ${SERVICE_TYPES.map(s => {
            const ic = serviceIconColors(s.id);
            const sel = data.type === s.id;
            return `<button class="pill-option svc-type-pill ${sel ? 'selected' : ''}" data-pill-type="${s.id}"
              style="${sel ? `background:${ic.bg};border-color:${ic.color};color:${ic.color}` : ''}">
              <span class="svc-pill-icon" style="color:${ic.color}">${serviceIconSvg(s.id)}</span>${s.label}
            </button>`;
          }).join('')}
        </div>
        <input type="hidden" id="f-svc-type" value="${data.type || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Frequency *</label>
        <div class="pill-select" id="svc-freq-select">
          ${Object.entries(FREQ_LABELS).map(([k, v]) => `
            <button class="pill-option ${data.frequency === k ? 'selected' : ''}" data-pill-freq="${k}">${v}</button>
          `).join('')}
        </div>
        <input type="hidden" id="f-svc-freq" value="${data.frequency || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Price per Visit *</label>
        <div class="form-prefix-wrap">
          <span class="form-prefix">$</span>
          <input class="form-input" type="number" id="f-svc-price" placeholder="0.00" value="${data.price || ''}" inputmode="decimal" min="0" step="0.01" />
        </div>
      </div>
      <div class="form-group mowing-only-group" style="${(data.type || '') === 'mowing' ? '' : 'display:none'}">
        <label class="form-label">Property size <span class="form-label-opt">optional</span></label>
        <div class="form-suffix-wrap">
          <input class="form-input" type="number" id="f-svc-prop-size" placeholder="e.g. 0.42" min="0" step="0.01" inputmode="decimal" value="${data.propertySize || ''}" />
          <span class="form-suffix">acres</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes (optional)</label>
        <input class="form-input" type="text" id="f-svc-notes" placeholder="Any special details..." value="${data.notes || ''}" />
      </div>
    </div>
    <div class="sheet-footer" style="${isEdit ? 'display:flex;gap:8px' : ''}">
      ${isEdit ? `<button class="btn btn-danger-outline" id="delete-service-modal-btn" data-service-id="${data.serviceId}" data-client-id="${data.clientId || ''}">Delete</button>` : ''}
      <button class="btn btn-primary ${isEdit ? '' : 'btn-full'}" style="${isEdit ? 'flex:1' : ''}" id="save-service-btn" data-client-id="${data.clientId || ''}" data-service-id="${data.serviceId || ''}">${isEdit ? 'Save Changes' : 'Add Service'}</button>
    </div>
  `;
}

function renderPaymentForm(data = {}) {
  const isEdit = !!data.paymentId;
  const dbData = getData();
  const client = dbData.clients.find(c => c.id === data.clientId);
  const unpaid = client ? (client.payments || []).filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0) : 0;
  const suggestedAmount = data.amount ? data.amount : (unpaid > 0 ? unpaid.toFixed(2) : '');

  return `
    <div class="sheet-header">
      <h2>${isEdit ? 'Edit Payment' : 'Record Payment'}</h2>
      <button class="sheet-close" id="sheet-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="form-body">
      ${client ? `<div style="font-size:14px;color:var(--text-muted);margin-bottom:-6px">Client: <strong style="color:var(--text-primary)">${escHtml(client.name)}</strong>${unpaid > 0 ? ` · <span style="color:var(--danger)">${formatCurrency(unpaid)} outstanding</span>` : ''}</div>` : ''}
      <div class="form-group">
        <label class="form-label">Amount *</label>
        <div class="form-prefix-wrap">
          <span class="form-prefix">$</span>
          <input class="form-input" type="number" id="f-pay-amount" placeholder="0.00" value="${suggestedAmount}" inputmode="decimal" min="0" step="0.01" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input class="form-input" type="text" id="f-pay-desc" placeholder="e.g. Lawn mowing - May" value="${data.description || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Date</label>
        <input class="form-input" type="date" id="f-pay-date" value="${data.date || todayISO()}" />
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <div class="pill-select" id="pay-status-select">
          <button class="pill-option ${(data.status || 'unpaid') === 'unpaid' ? 'selected' : ''}" data-pill-status="unpaid">Unpaid / Invoiced</button>
          <button class="pill-option ${data.status === 'paid' ? 'selected' : ''}" data-pill-status="paid">Paid</button>
        </div>
        <input type="hidden" id="f-pay-status" value="${data.status || 'unpaid'}" />
      </div>
    </div>
    <div class="sheet-footer" style="${isEdit ? 'display:flex;gap:8px' : ''}">
      ${isEdit ? `<button class="btn btn-danger-outline" id="delete-payment-modal-btn" data-payment-id="${data.paymentId}" data-client-id="${data.clientId || ''}">Delete</button>` : ''}
      <button class="btn btn-primary ${isEdit ? '' : 'btn-full'}" style="${isEdit ? 'flex:1' : ''}" id="save-payment-btn" data-client-id="${data.clientId || ''}" data-payment-id="${data.paymentId || ''}" data-sched-job-id="${data.schedJobId || ''}" data-return-date="${data._returnDate || ''}">${isEdit ? 'Save Changes' : 'Save Payment'}</button>
    </div>
  `;
}

function renderCalendarDayModal(data = {}) {
  const dbData = getData();
  const date = data.date;
  const d = new Date(date + 'T12:00:00');
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Collect all jobs on this date across all clients
  const jobs = [];
  for (const client of dbData.clients) {
    for (const p of (client.payments || [])) {
      if ((p.date || '').slice(0, 10) === date) {
        jobs.push({ ...p, clientName: client.name, clientId: client.id });
      }
    }
  }
  jobs.sort((a, b) => a.clientName.localeCompare(b.clientName));

  const totalRevenue = jobs.reduce((s, j) => s + j.amount, 0);
  const paidTotal = jobs.filter(j => j.status === 'paid').reduce((s, j) => s + j.amount, 0);
  const unpaidTotal = jobs.filter(j => j.status === 'unpaid').reduce((s, j) => s + j.amount, 0);

  const jobsHTML = jobs.length === 0
    ? `<div class="cal-modal-empty">No jobs recorded on this day.</div>`
    : jobs.map(j => `
      <div class="cal-modal-job" data-nav-client="${j.clientId}">
        <div class="client-avatar" style="background:${avatarColor(j.clientName)};width:40px;height:40px;font-size:14px;flex-shrink:0">${initials(j.clientName)}</div>
        <div class="cal-modal-job-info">
          <div class="cal-modal-job-name">${escHtml(j.clientName)}</div>
          <div class="cal-modal-job-desc">${escHtml(j.description || 'Service')}</div>
        </div>
        <div class="cal-modal-job-right">
          <div class="cal-modal-job-amount">${formatCurrency(j.amount)}</div>
          <span class="badge ${j.status === 'paid' ? 'badge-paid' : 'badge-unpaid'}">${j.status === 'paid' ? 'Paid' : 'Unpaid'}</span>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:var(--text-muted);flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
      </div>`).join('');

  const summaryHTML = jobs.length > 0 ? `
    <div class="cal-modal-summary">
      <div class="cal-modal-stat">
        <span class="cal-modal-stat-label">Jobs</span>
        <span class="cal-modal-stat-value">${jobs.length}</span>
      </div>
      <div class="cal-modal-stat">
        <span class="cal-modal-stat-label">Revenue</span>
        <span class="cal-modal-stat-value" style="color:var(--green-primary)">${formatCurrency(totalRevenue)}</span>
      </div>
      ${unpaidTotal > 0 ? `<div class="cal-modal-stat">
        <span class="cal-modal-stat-label">Unpaid</span>
        <span class="cal-modal-stat-value" style="color:var(--danger)">${formatCurrency(unpaidTotal)}</span>
      </div>` : ''}
    </div>` : '';

  return `
    <div class="sheet-header">
      <div>
        <h2>${dateLabel}</h2>
        ${jobs.length > 0 ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px">${jobs.length} job${jobs.length !== 1 ? 's' : ''} · ${formatCurrency(totalRevenue)}</div>` : ''}
      </div>
      <button class="sheet-close" id="sheet-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    ${summaryHTML}
    <div class="cal-modal-jobs">${jobsHTML}</div>
    <div class="sheet-footer">
      <button class="btn btn-primary btn-full" id="cal-modal-add-job" data-date="${date}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Job for This Day
      </button>
    </div>
  `;
}

function renderAddJobForm(data = {}) {
  const dbData = getData();
  const d = data.date || todayISO();
  const dateLabel = new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const clientOptions = dbData.clients.map(c =>
    `<option value="${c.id}">${escHtml(c.name)}</option>`
  ).join('');

  return `
    <div class="sheet-header">
      <h2>Add Job</h2>
      <button class="sheet-close" id="sheet-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="form-body">
      <div style="font-size:13px;color:var(--text-muted);background:var(--green-xpale);padding:8px 12px;border-radius:var(--radius-sm)">
        📅 ${dateLabel}
      </div>
      <div class="form-group">
        <label class="form-label">Client *</label>
        ${dbData.clients.length === 0
          ? `<div style="color:var(--text-muted);font-size:13px;padding:8px 0">No clients yet. Add a client first.</div>`
          : `<select class="form-input" id="f-job-client">${clientOptions}</select>`
        }
      </div>
      <div class="form-group">
        <label class="form-label">Amount *</label>
        <div class="form-prefix-wrap">
          <span class="form-prefix">$</span>
          <input class="form-input" type="number" id="f-job-amount" placeholder="0.00" inputmode="decimal" min="0" step="0.01" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input class="form-input" type="text" id="f-job-desc" placeholder="e.g. Lawn mowing, trimming..." />
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <div class="pill-select">
          <button class="pill-option selected" data-pill-status="unpaid">Unpaid / Invoiced</button>
          <button class="pill-option" data-pill-status="paid">Paid</button>
        </div>
        <input type="hidden" id="f-pay-status" value="unpaid" />
      </div>
    </div>
    <div class="sheet-footer">
      <button class="btn btn-primary btn-full" id="save-job-btn" data-date="${d}">Save Job</button>
    </div>
  `;
}

// ===== BIND EVENTS =====
function bindContentEvents() {
  const content = document.getElementById('main-content');

  // Client card click -> detail
  // Dashboard calendar chip clicks
  content.querySelectorAll('.dcal-chip[data-client-id]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      navigate('client-detail', { clientId: chip.dataset.clientId });
    });
  });

  content.querySelectorAll('.client-row[data-client-id], .client-card[data-client-id], .activity-item[data-client-id], .dash-list-row[data-client-id], .dash-activity-row[data-client-id], .dash-upcoming-row[data-client-id], .dash-recent-row[data-client-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      navigate('client-detail', { clientId: el.dataset.clientId });
    });
  });

  // Payment card client name click -> detail
  content.querySelectorAll('[data-client-id][style*="cursor:pointer"]').forEach(el => {
    el.addEventListener('click', () => navigate('client-detail', { clientId: el.dataset.clientId }));
  });

  // Stat card navigation
  content.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      const view = el.dataset.nav;
      const filter = el.dataset.filter;
      if (filter) state.paymentsFilter = filter;
      navigate(view);
    });
  });

  // Back button
  content.querySelectorAll('[data-nav="clients"]').forEach(el => {
    el.addEventListener('click', () => navigate('clients'));
  });

  // Edit client
  content.querySelectorAll('[data-edit-client]').forEach(el => {
    el.addEventListener('click', () => {
      const data = getData();
      const client = data.clients.find(c => c.id === el.dataset.editClient);
      if (client) openModal('edit-client', client);
    });
  });

  // Add service
  content.querySelectorAll('[data-add-service]').forEach(el => {
    el.addEventListener('click', () => openModal('add-service', { clientId: el.dataset.addService }));
  });

  // Add payment
  content.querySelectorAll('[data-add-payment]').forEach(el => {
    el.addEventListener('click', () => openModal('add-payment', { clientId: el.dataset.addPayment }));
  });


  // Edit service
  content.querySelectorAll('[data-edit-service]').forEach(el => {
    el.addEventListener('click', () => {
      const d = getData();
      const client = d.clients.find(c => c.id === state.activeClientId);
      if (!client) return;
      const svc = client.services.find(s => s.id === el.dataset.editService);
      if (svc) openModal('edit-service', { ...svc, serviceId: svc.id, clientId: client.id });
    });
  });

  // Edit payment
  content.querySelectorAll('[data-edit-payment]').forEach(el => {
    el.addEventListener('click', () => {
      const d = getData();
      const client = d.clients.find(c => c.id === state.activeClientId);
      if (!client) return;
      const p = client.payments.find(p => p.id === el.dataset.editPayment);
      if (p) openModal('edit-payment', { ...p, paymentId: p.id, clientId: client.id });
    });
  });


  // Quick pay from service row
  content.querySelectorAll('[data-quick-pay]').forEach(el => {
    el.addEventListener('click', () => {
      const d = getData();
      const client = d.clients.find(c => c.id === state.activeClientId);
      if (!client) return;
      const payment = {
        id: generateId(),
        amount: parseFloat(el.dataset.quickPayAmount),
        description: el.dataset.quickPayLabel,
        date: todayISO(),
        status: 'paid',
        createdAt: new Date().toISOString(),
      };
      client.payments.push(payment);
      saveData(d);
      render();
      showToast(`${formatCurrency(payment.amount)} recorded as paid`);
    });
  });

  // Mark paid (detail view)
  content.querySelectorAll('[data-mark-paid]').forEach(el => {
    el.addEventListener('click', () => {
      captureUndo();
      const d = getData();
      const client = d.clients.find(c => c.id === state.activeClientId);
      if (client) {
        const p = client.payments.find(p => p.id === el.dataset.markPaid);
        if (p) { p.status = 'paid'; saveData(d); render(); showToast('Marked as paid', true); }
      }
    });
  });

  // Mark unpaid (detail view)
  content.querySelectorAll('[data-mark-unpaid]').forEach(el => {
    el.addEventListener('click', () => {
      captureUndo();
      const d = getData();
      const client = d.clients.find(c => c.id === state.activeClientId);
      if (client) {
        const p = client.payments.find(p => p.id === el.dataset.markUnpaid);
        if (p) { p.status = 'unpaid'; saveData(d); render(); showToast('Marked as unpaid', true); }
      }
    });
  });

  // Mark paid/unpaid (payments global view)
  content.querySelectorAll('[data-mark-paid-global]').forEach(el => {
    el.addEventListener('click', () => {
      captureUndo();
      const d = getData();
      const client = d.clients.find(c => c.id === el.dataset.clientId);
      if (client) {
        const p = client.payments.find(p => p.id === el.dataset.markPaidGlobal);
        if (p) { p.status = 'paid'; saveData(d); render(); showToast('Marked as paid', true); }
      }
    });
  });

  content.querySelectorAll('[data-mark-unpaid-global]').forEach(el => {
    el.addEventListener('click', () => {
      captureUndo();
      const d = getData();
      const client = d.clients.find(c => c.id === el.dataset.clientId);
      if (client) {
        const p = client.payments.find(p => p.id === el.dataset.markUnpaidGlobal);
        if (p) { p.status = 'unpaid'; saveData(d); render(); showToast('Marked as unpaid', true); }
      }
    });
  });

  // Delete payment
  content.querySelectorAll('[data-delete-payment]').forEach(el => {
    el.addEventListener('click', () => {
      captureUndo();
      const d = getData();
      const client = d.clients.find(c => c.id === state.activeClientId);
      if (client) {
        client.payments = client.payments.filter(p => p.id !== el.dataset.deletePayment);
        saveData(d); render(); showToast('Payment deleted', true);
      }
    });
  });

  // Payment filter tabs
  content.querySelectorAll('.filter-tab[data-filter]').forEach(el => {
    el.addEventListener('click', () => {
      state.paymentsFilter = el.dataset.filter;
      render();
    });
  });

  // Search input
  const searchInput = content.querySelector('#client-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      render();
      // restore focus
      const newInput = document.getElementById('client-search');
      if (newInput) { newInput.focus(); newInput.setSelectionRange(newInput.value.length, newInput.value.length); }
    });
  }

  const clearBtn = content.querySelector('#search-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.searchQuery = '';
      render();
    });
  }

  // Client type filter tabs
  content.querySelectorAll('[data-client-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.clientTypeFilter = btn.dataset.clientFilter;
      render();
    });
  });

  // Sort dropdown toggle
  content.querySelector('#client-sort-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    content.querySelector('#client-sort-menu')?.classList.toggle('hidden');
  });

  // Sort option select
  content.querySelectorAll('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.clientSort = btn.dataset.sort;
      content.querySelector('#client-sort-menu')?.classList.add('hidden');
      render();
    });
  });

  // Close sort menu when clicking elsewhere
  document.addEventListener('click', () => {
    content.querySelector('#client-sort-menu')?.classList.add('hidden');
  }, { once: true });

  // Client status pills (on detail page)
  content.querySelectorAll('[data-set-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      const newStatus = btn.dataset.setStatus;
      const clientId = btn.dataset.clientId;
      const d = getData();
      const client = d.clients.find(c => c.id === clientId);
      if (client) {
        client.status = newStatus;
        saveData(d);
        const labels = { active: 'Active', paused: 'Paused', 'on-call': 'On-Call', inactive: 'Inactive' };
        showToast(`Marked as ${labels[newStatus]}`);
        render();
      }
    });
  });

  // Client type toggle (Recurring / One-Off)
  content.querySelectorAll('[data-set-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      const newType = btn.dataset.setType;
      const clientId = btn.dataset.clientId;
      const d = getData();
      const client = d.clients.find(c => c.id === clientId);
      if (client) {
        client.type = newType;
        saveData(d);
        showToast(newType === 'one-time' ? 'Marked as One-Off' : 'Marked as Recurring');
        render();
      }
    });
  });

  // Service schedule tracking toggle
  content.querySelectorAll('[data-toggle-schedule]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const svcId = btn.dataset.toggleSchedule;
      const clientId = btn.dataset.clientId;
      const d = getData();
      const client = d.clients.find(c => c.id === clientId);
      if (!client) return;
      const svc = (client.services || []).find(s => s.id === svcId);
      if (!svc) return;
      svc.trackSchedule = svc.trackSchedule === false ? true : false;
      saveData(d);
      showToast(svc.trackSchedule ? 'Added to upcoming jobs' : 'Excluded from upcoming jobs');
      render();
    });
  });

  // Client notes — add
  content.querySelectorAll('[data-cn-add]').forEach(btn => {
    const clientId = btn.dataset.cnAdd;
    const textarea = document.getElementById(`cn-input-${clientId}`);
    const doAdd = () => {
      const text = textarea?.value.trim();
      if (!text) return;
      const d = getData();
      const client = d.clients.find(c => c.id === clientId);
      if (!client) return;
      if (!client.clientNotes) client.clientNotes = [];
      client.clientNotes.push({ id: generateId(), text, pinned: false, createdAt: new Date().toISOString() });
      saveData(d);
      render();
      showToast('Note added');
    };
    btn.addEventListener('click', doAdd);
    textarea?.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); doAdd(); }
    });
  });

  // Client notes — pin/unpin
  content.querySelectorAll('[data-cn-pin]').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = getData();
      const client = d.clients.find(c => c.id === btn.dataset.clientId);
      if (!client) return;
      const note = (client.clientNotes || []).find(n => n.id === btn.dataset.cnPin);
      if (!note) return;
      note.pinned = !note.pinned;
      saveData(d);
      render();
      showToast(note.pinned ? 'Note pinned' : 'Note unpinned');
    });
  });

  // Client notes — delete
  content.querySelectorAll('[data-cn-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      captureUndo();
      const d = getData();
      const client = d.clients.find(c => c.id === btn.dataset.clientId);
      if (!client) return;
      client.clientNotes = (client.clientNotes || []).filter(n => n.id !== btn.dataset.cnDel);
      saveData(d);
      render();
      showToast('Note deleted', true);
    });
  });

  // Dashboard stat cards — click to drill down
  content.querySelectorAll('[data-stat-card]').forEach(card => {
    card.addEventListener('click', () => {
      openModal('stat-detail', { statType: card.dataset.statCard });
    });
  });

  // Dashboard calendar — click a day to open schedule modal
  content.querySelectorAll('[data-dcal-day]').forEach(cell => {
    cell.addEventListener('click', (e) => {
      // Don't open modal if a chip name was clicked (let chip navigate instead)
      if (e.target.closest('.dcal-chip[data-client-id]')) return;
      openModal('dash-day', { date: cell.dataset.dcalDay });
    });
  });

  // Dashboard calendar navigation
  content.querySelector('#dash-cal-prev')?.addEventListener('click', () => {
    state.dashCalMonth--;
    if (state.dashCalMonth < 0) { state.dashCalMonth = 11; state.dashCalYear--; }
    render();
  });
  content.querySelector('#dash-cal-next')?.addEventListener('click', () => {
    state.dashCalMonth++;
    if (state.dashCalMonth > 11) { state.dashCalMonth = 0; state.dashCalYear++; }
    render();
  });

  // Calendar navigation
  content.querySelector('#cal-prev')?.addEventListener('click', () => {
    state.calendarMonth--;
    if (state.calendarMonth < 0) { state.calendarMonth = 11; state.calendarYear--; }
    state.calendarSelectedDay = null;
    render();
  });

  content.querySelector('#cal-next')?.addEventListener('click', () => {
    state.calendarMonth++;
    if (state.calendarMonth > 11) { state.calendarMonth = 0; state.calendarYear++; }
    state.calendarSelectedDay = null;
    render();
  });

  // Calendar day click — open modal
  content.querySelectorAll('[data-cal-day]').forEach(cell => {
    cell.addEventListener('click', () => {
      openModal('calendar-day', { date: cell.dataset.calDay });
    });
  });

  // Add Job from calendar (opens payment modal with date pre-filled)
  content.querySelectorAll('[data-add-job-date]').forEach(btn => {
    btn.addEventListener('click', () => {
      const date = btn.dataset.addJobDate;
      openModal('add-job', { date });
    });
  });

  // Calendar job item -> client detail
  content.querySelectorAll('.cal-job-item[data-client-id]').forEach(el => {
    el.addEventListener('click', () => navigate('client-detail', { clientId: el.dataset.clientId }));
  });

  // Settings buttons
  const exportBtn = content.querySelector('#export-data-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }

  const importBtn = content.querySelector('#import-data-btn');
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      document.getElementById('import-file-input')?.click();
    });
  }

  const importFileInput = content.querySelector('#import-file-input');
  if (importFileInput) {
    importFileInput.addEventListener('change', importData);
  }

  const clearBtn2 = content.querySelector('#clear-data-btn');
  if (clearBtn2) {
    clearBtn2.addEventListener('click', () => {
      showConfirm('Clear All Data', 'This will permanently delete all clients, services, and payments. This cannot be undone.', () => {
        localStorage.removeItem(STORAGE_KEY);
        navigate('dashboard');
        showToast('All data cleared');
      });
    });
  }

  // ===== EXPENSE EVENTS =====

  // Period selector buttons (1M / 3M / 6M / YTD / 1Y)
  // Expenses / Debt tab toggle
  content.querySelectorAll('[data-exp-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.expensesTab = btn.dataset.expTab;
      render();
    });
  });

  // Add debt button
  content.querySelector('#debt-add-btn')?.addEventListener('click', () => {
    openModal('debt-form', {});
  });

  // Log payment on a debt
  content.querySelectorAll('[data-debt-log-pay]').forEach(btn => {
    btn.addEventListener('click', () => {
      openModal('debt-payment', { debtId: btn.dataset.debtLogPay });
    });
  });

  // Edit debt
  content.querySelectorAll('[data-debt-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = getData();
      const debt = (d.debts || []).find(x => x.id === btn.dataset.debtEdit) || {};
      openModal('debt-form', debt);
    });
  });

  // Delete debt
  content.querySelectorAll('[data-debt-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      captureUndo();
      const d = getData();
      d.debts = (d.debts || []).filter(x => x.id !== btn.dataset.debtDel);
      saveData(d); render(); showToast('Debt removed', true);
    });
  });

  content.querySelectorAll('[data-cf-period]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.expensesPeriod = btn.dataset.cfPeriod;
      render();
    });
  });

  // Transaction filter pills (Expenses / Revenue / All)
  content.querySelectorAll('[data-tx-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.expensesFilter = btn.dataset.txFilter;
      render();
    });
  });

  // Add expense button
  content.querySelector('#exp-add-mobile-btn')?.addEventListener('click', () => {
    openModal('expense-form', {});
  });

  // Edit expense row → open modal
  content.querySelectorAll('[data-edit-expense]').forEach(btn => {
    btn.addEventListener('click', () => {
      const exp = getData().expenses.find(e => e.id === btn.dataset.editExpense) || {};
      openModal('expense-form', exp);
    });
  });

  // Delete expense
  content.querySelectorAll('[data-delete-expense]').forEach(btn => {
    btn.addEventListener('click', () => {
      captureUndo();
      const d = getData();
      d.expenses = (d.expenses || []).filter(e => e.id !== btn.dataset.deleteExpense);
      saveData(d); render(); showToast('Transaction deleted', true);
    });
  });

  // Delete transaction (from transactions table)
  content.querySelectorAll('[data-delete-tx]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const txId  = btn.dataset.deleteTx;
      const src   = btn.dataset.txSource;
      const cId   = btn.dataset.txClient;
      if (deleteTx(txId, src, cId)) { render(); showToast('Transaction deleted', true); }
    });
  });

  // Category drilldown — click expense row
  content.querySelectorAll('[data-drilldown-cat]').forEach(row => {
    row.addEventListener('click', () => {
      state.catDrilldownPeriod = state.expensesPeriod || '3M';
      openModal('expense-cat-detail', { catId: row.dataset.drilldownCat });
    });
  });

  // Init Chart.js charts (must run after DOM is painted)
  if (state.view === 'expenses') {
    requestAnimationFrame(() => {
      const cd = computeExpensesData();
      initCfCharts(cd);
    });
  }

  // Log Time manually
  content.querySelector('#log-time-btn')?.addEventListener('click', () => {
    openModal('log-time', {});
  });

  // Clock In
  content.querySelector('#clock-in-btn')?.addEventListener('click', () => {
    const d = getData();
    d.activeClockIn = { startTime: new Date().toISOString(), clientId: null };
    saveData(d);
    showToast('Clocked in!');
    render();
  });

  // Clock Out
  content.querySelector('#clock-out-btn')?.addEventListener('click', () => {
    const d = getData();
    if (!d.activeClockIn) return;
    const startTime = new Date(d.activeClockIn.startTime);
    const durationMins = Math.max(1, Math.round((Date.now() - startTime.getTime()) / 60000));
    d.timeEntries = d.timeEntries || [];
    d.timeEntries.push({
      id: generateId(),
      date: todayISO(),
      clockIn: d.activeClockIn.startTime,
      clockOut: new Date().toISOString(),
      durationMins,
      clientId: d.activeClockIn.clientId || null,
      notes: '',
    });
    d.activeClockIn = null;
    saveData(d);
    const h = Math.floor(durationMins/60);
    const m = durationMins%60;
    showToast(`Clocked out — ${h>0?h+'h ':''}${m}m logged`);
    render();
  });

  // Quick log from Today page
  content.querySelectorAll('[data-quick-log]').forEach(btn => {
    btn.addEventListener('click', () => {
      openModal('add-payment', {
        clientId: btn.dataset.quickLog,
        date: todayISO(),
        description: btn.dataset.svcType || '',
        amount: btn.dataset.svcAmount || '',
      });
    });
  });

  // Delete time entry
  content.querySelectorAll('[data-delete-entry]').forEach(btn => {
    btn.addEventListener('click', () => {
      captureUndo();
      const d = getData();
      d.timeEntries = (d.timeEntries||[]).filter(e => e.id !== btn.dataset.deleteEntry);
      saveData(d); render(); showToast('Entry deleted', true);
    });
  });

  // ── Tools page calculators ───────────────────────────────────────────────────
  content.querySelectorAll('.tool-card').forEach(card => {
    const toolId   = card.dataset.tool;
    const resultEl = card.querySelector('.tool-result');

    const getVals = () => {
      const vals = {};
      card.querySelectorAll('.tool-input[data-field]').forEach(inp => {
        vals[inp.dataset.field] = parseFloat(inp.value) || 0;
      });
      return vals;
    };

    const recalc = () => {
      const html = computeToolResult(toolId, getVals(), card);
      resultEl.classList.toggle('has-result', !!html);
      resultEl.innerHTML = html;
    };

    // Preset buttons (depth, deck, speed, coverage, etc.)
    card.querySelectorAll('.tool-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        card.querySelectorAll(`.tool-preset[data-preset="${preset}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const inp = card.querySelector(`.tool-input[data-field="${preset}"]`);
        if (inp) inp.value = btn.dataset.val;
        recalc();
      });
    });

    // Shape tabs (area calculator)
    card.querySelectorAll('.tool-shape-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        card.querySelectorAll('.tool-shape-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        card.querySelectorAll('.tool-shape-panel').forEach(p => p.style.display = 'none');
        const panel = card.querySelector(`.tool-shape-panel[data-shape="${tab.dataset.shape}"]`);
        if (panel) panel.style.display = '';
        recalc();
      });
      // Hide non-active panels on init
      if (!tab.classList.contains('active')) {
        const panel = card.querySelector(`.tool-shape-panel[data-shape="${tab.dataset.shape}"]`);
        if (panel) panel.style.display = 'none';
      }
    });

    // All inputs + selects trigger recalc
    card.querySelectorAll('.tool-input, .tool-select').forEach(inp => {
      inp.addEventListener('input', recalc);
    });

    // Run initial calculation
    recalc();
  });

  // Reports — period tabs
  content.querySelectorAll('[data-rpt-period]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.reportsPeriod = btn.dataset.rptPeriod;
      render();
    });
  });

  // Reports — trend chart hover tooltip
  const chartTt = content.querySelector('#rpt-chart-tt');
  if (chartTt) {
    content.querySelectorAll('.rpt-trend-col[data-month]').forEach(col => {
      col.addEventListener('mouseenter', () => {
        const month = col.dataset.month;
        const rev   = parseFloat(col.dataset.rev) || 0;
        const exp   = parseFloat(col.dataset.exp) || 0;
        const net   = rev - exp;
        const hasExp = exp > 0;
        chartTt.innerHTML = `
          <div class="rpt-tt-month">${month}</div>
          <div class="rpt-tt-row">
            <span class="rpt-tt-dot" style="background:#4ade80"></span>
            <span>Revenue</span>
            <strong style="color:#4ade80">${formatCurrency(rev)}</strong>
          </div>
          ${hasExp ? `<div class="rpt-tt-row">
            <span class="rpt-tt-dot" style="background:#f87171"></span>
            <span>Expenses</span>
            <strong style="color:#f87171">${formatCurrency(exp)}</strong>
          </div>
          <div class="rpt-tt-divider"></div>
          <div class="rpt-tt-row">
            <span class="rpt-tt-dot" style="background:transparent"></span>
            <span>Net</span>
            <strong style="color:${net >= 0 ? '#4ade80' : '#f87171'}">${formatCurrency(net)}</strong>
          </div>` : ''}
        `;
        chartTt.style.display = 'block';

        // Horizontal position: centre tooltip on hovered column, clamped within card
        const cardEl  = col.closest('.rpt-chart-card');
        const colRect = col.getBoundingClientRect();
        const cardRect= cardEl.getBoundingClientRect();
        const ttW     = chartTt.offsetWidth;
        const cardW   = cardRect.width;
        const idealLeft = colRect.left - cardRect.left + colRect.width / 2;
        const clampedLeft = Math.max(ttW / 2 + 10, Math.min(cardW - ttW / 2 - 10, idealLeft));
        chartTt.style.left = `${clampedLeft}px`;
      });

      col.addEventListener('mouseleave', () => {
        chartTt.style.display = 'none';
      });
    });
  }

  // Navigate to client from reports
  content.querySelectorAll('[data-nav-client-page]').forEach(el => {
    el.addEventListener('click', () => navigate('client-detail', { clientId: el.dataset.navClientPage }));
  });

  // Today page — week strip day select
  content.querySelectorAll('[data-select-day]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.todaySelectedDate = btn.dataset.selectDay;
      render();
    });
  });

  // Today page — open day scheduling modal (Add Jobs)
  content.querySelectorAll('[data-open-day]').forEach(btn => {
    btn.addEventListener('click', () => {
      openModal('dash-day', { date: btn.dataset.openDay });
    });
  });

  // Today page — click client row (not buttons) to open client detail
  content.querySelectorAll('[data-today-nav-client]').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('button')) return; // don't fire when tapping Done/Remove
      navigate('client-detail', { clientId: row.dataset.todayNavClient });
    });
  });

  // Today page — remove scheduled job
  content.querySelectorAll('[data-sched-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = getData();
      d.scheduledJobs = (d.scheduledJobs || []).filter(j => j.id !== btn.dataset.schedRemove);
      saveData(d); render(); showToast('Removed');
    });
  });

  // Today page — mark scheduled job done (opens payment form pre-filled from job)
  content.querySelectorAll('[data-sched-done]').forEach(btn => {
    btn.addEventListener('click', () => {
      const d      = getData();
      const jobId  = btn.dataset.schedDone;
      const sj     = (d.scheduledJobs || []).find(j => j.id === jobId);
      const client = d.clients.find(c => c.id === btn.dataset.schedClient);
      const unpaid = (client?.payments || []).filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);

      let desc = '';
      if (sj?.description) {
        desc = sj.description;
      } else if (sj?.serviceType) {
        desc = serviceLabel(sj.serviceType);
      } else {
        const firstSvc = (client?.services || []).find(s => s.active && s.frequency && s.frequency !== 'one-time')
                      || (client?.services || [])[0];
        desc = firstSvc ? serviceLabel(firstSvc.type) : 'Lawn service';
      }

      const amount = sj?.estimatedPrice || (unpaid > 0 ? unpaid : '');

      openModal('add-payment', {
        clientId: btn.dataset.schedClient,
        date: btn.dataset.date,
        description: desc,
        amount,
        schedJobId: jobId,
      });
    });
  });

}

// ===== EXPENSE SAVE HELPER =====
function saveExpenseFromForm(expenseId) {
  const amount = parseFloat(document.getElementById('ef-amount')?.value);
  if (!amount || amount <= 0) { alert('Please enter a valid amount.'); return false; }

  const d = getData();
  if (!d.expenses) d.expenses = [];

  const expData = {
    type: document.getElementById('ef-type').value || 'expense',
    category: document.getElementById('ef-category').value || 'other',
    description: document.getElementById('ef-desc').value.trim(),
    amount,
    date: document.getElementById('ef-date').value || todayISO(),
    notes: document.getElementById('ef-notes').value.trim(),
    recurring: document.getElementById('ef-recurring').checked,
  };

  if (expenseId) {
    const exp = d.expenses.find(e => e.id === expenseId);
    if (exp) Object.assign(exp, expData);
    showToast('Transaction updated');
  } else {
    d.expenses.push({ id: generateId(), ...expData, createdAt: new Date().toISOString() });
    showToast('Transaction added!');
  }

  saveData(d);
  state.editingExpenseId = null;
  return true;
}

function bindModalEvents() {
  const sheet = document.getElementById('modal-sheet');

  // Close btn
  sheet.querySelector('#sheet-close-btn')?.addEventListener('click', closeModal);

  // ── Expense form events ──

  // Type toggle pills (Expense / Income)
  sheet.querySelectorAll('[data-ef-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.efType;
      sheet.querySelector('#ef-type').value = t;
      // Update pill active states
      sheet.querySelectorAll('[data-ef-type]').forEach(b => {
        b.classList.remove('active', 'expense', 'income');
      });
      btn.classList.add('active', t);
      // Show/hide category section
      const catSection = sheet.querySelector('#ef-cat-section');
      if (catSection) catSection.style.display = t === 'income' ? 'none' : '';
    });
  });

  // Category pills
  sheet.querySelectorAll('[data-ef-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      sheet.querySelectorAll('[data-ef-cat]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sheet.querySelector('#ef-category').value = btn.dataset.efCat;
    });
  });

  // Save expense
  sheet.querySelector('#save-expense-btn')?.addEventListener('click', () => {
    const expId = sheet.querySelector('#save-expense-btn').dataset.expenseId;
    if (saveExpenseFromForm(expId || '')) { closeModal(); render(); }
  });

  // Delete expense (from edit modal)
  sheet.querySelector('#delete-expense-modal-btn')?.addEventListener('click', () => {
    const btn = sheet.querySelector('#delete-expense-modal-btn');
    const expId = btn?.dataset.expenseId;
    if (!expId) return;
    captureUndo();
    const d = getData();
    d.expenses = (d.expenses || []).filter(e => e.id !== expId);
    saveData(d); closeModal(); render(); showToast('Transaction deleted', true);
  });

  // ── Sched service select — history card click ──
  sheet.querySelectorAll('[data-hist-svc]').forEach(card => {
    card.addEventListener('click', () => {
      const clientId = card.dataset.sssClientId;
      // Deselect all history cards for this client
      sheet.querySelectorAll(`[data-sss-client-id="${clientId}"][data-hist-svc]`).forEach(c => {
        c.classList.remove('active');
        c.style.background = ''; c.style.borderColor = '';
      });
      // Select this card
      card.classList.add('active');
      const ic = serviceIconColors(card.dataset.histType);
      card.style.background = ic.bg; card.style.borderColor = ic.color;
      // Write to hidden type input
      sheet.querySelector(`#sss-type-${clientId}`).value = card.dataset.histType;
      // Pre-fill desc + price inputs
      const descEl  = sheet.querySelector(`#sss-desc-${clientId}`);
      const priceEl = sheet.querySelector(`#sss-price-${clientId}`);
      if (descEl)  descEl.value  = card.dataset.histNotes || '';
      if (priceEl) priceEl.value = card.dataset.histPrice || '';
      // Collapse the new-service form and clear its pills
      const newForm = sheet.querySelector(`#sss-new-form-${clientId}`);
      if (newForm) newForm.style.display = 'none';
      const diffBtn = sheet.querySelector(`[data-sss-diff="${clientId}"]`);
      if (diffBtn) diffBtn.classList.remove('active');
      sheet.querySelectorAll(`[data-sss-client-id="${clientId}"][data-sss-type]`).forEach(p => {
        p.classList.remove('active');
        p.style.background = ''; p.style.borderColor = ''; p.style.color = '';
      });
    });
  });

  // ── Sched service select — "Use a different service" toggle ──
  sheet.querySelectorAll('[data-sss-diff]').forEach(btn => {
    btn.addEventListener('click', () => {
      const clientId = btn.dataset.sssDiff;
      const newForm  = sheet.querySelector(`#sss-new-form-${clientId}`);
      if (!newForm) return;
      const opening = newForm.style.display === 'none';
      newForm.style.display = opening ? '' : 'none';
      btn.classList.toggle('active', opening);
      if (opening) {
        // Deselect history cards and clear type so a pill must be chosen
        sheet.querySelectorAll(`[data-sss-client-id="${clientId}"][data-hist-svc]`).forEach(c => {
          c.classList.remove('active');
          c.style.background = ''; c.style.borderColor = '';
        });
        sheet.querySelector(`#sss-type-${clientId}`).value = '';
        const descEl  = sheet.querySelector(`#sss-desc-${clientId}`);
        const priceEl = sheet.querySelector(`#sss-price-${clientId}`);
        if (descEl)  descEl.value  = '';
        if (priceEl) priceEl.value = '';
      }
    });
  });

  // ── Sched service select — new-service pill click ──
  sheet.querySelectorAll('[data-sss-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      const clientId = btn.dataset.sssClientId;
      sheet.querySelectorAll(`[data-sss-client-id="${clientId}"][data-sss-type]`).forEach(b => {
        b.classList.remove('active');
        b.style.background = ''; b.style.borderColor = ''; b.style.color = '';
      });
      btn.classList.add('active');
      const ic = serviceIconColors(btn.dataset.sssType);
      btn.style.background = ic.bg; btn.style.borderColor = ic.color; btn.style.color = ic.color;
      sheet.querySelector(`#sss-type-${clientId}`).value = btn.dataset.sssType;
    });
  });

  // ── Sched service select — confirm ──
  sheet.querySelector('#sss-confirm-btn')?.addEventListener('click', () => {
    const date = sheet.querySelector('#sss-confirm-btn').dataset.date;
    const d = getData();
    if (!d.scheduledJobs) d.scheduledJobs = [];
    const alreadyIds = new Set(d.scheduledJobs.filter(j => j.date === date).map(j => j.clientId));
    let added = 0;
    sheet.querySelectorAll('[data-sss-client]').forEach(block => {
      const clientId       = block.dataset.sssClient;
      if (alreadyIds.has(clientId)) return;
      const serviceType    = block.querySelector('.sss-type-val')?.value || '';
      const desc           = block.querySelector(`#sss-desc-${clientId}`)?.value.trim() || '';
      const estimatedPrice = parseFloat(block.querySelector(`#sss-price-${clientId}`)?.value) || 0;
      d.scheduledJobs.push({
        id: generateId(), clientId, date, status: 'scheduled',
        serviceType:    serviceType    || undefined,
        description:    desc           || undefined,
        estimatedPrice: estimatedPrice || undefined,
        createdAt: new Date().toISOString(),
      });
      added++;
    });
    saveData(d);
    closeModal();
    render();
    showToast(`Scheduled ${added} job${added !== 1 ? 's' : ''}!`);
  });

  // ── Debt form ──
  // Category pills
  sheet.querySelectorAll('[data-df-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      sheet.querySelectorAll('[data-df-cat]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      sheet.querySelector('#df-cat').value = btn.dataset.dfCat;
    });
  });

  // Live ETA preview (recalculates when balance or payment changes)
  const updateEtaPreview = () => {
    const balance  = parseFloat(sheet.querySelector('#df-balance')?.value) || 0;
    const payment  = parseFloat(sheet.querySelector('#df-payment')?.value) || 0;
    const rate     = parseFloat(sheet.querySelector('#df-rate')?.value)    || 0;
    const preview  = sheet.querySelector('#df-eta-preview');
    if (!preview) return;
    if (!balance || !payment) { preview.innerHTML = ''; return; }
    const months = debtMonthsLeft(balance, payment, rate);
    if (!months || !isFinite(months)) {
      preview.innerHTML = `<div class="debt-eta-chip debt-eta-warn">⚠️ Payment doesn't cover interest</div>`;
      return;
    }
    const payoff = debtPayoffDate(months);
    const dateStr = payoff.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const yrs  = Math.floor(months / 12);
    const mos  = months % 12;
    const dur  = yrs > 0 ? `${yrs}y ${mos}m` : `${mos} month${mos !== 1 ? 's' : ''}`;
    let interestNote = '';
    if (rate > 0) {
      const totalPaid = months * payment;
      const interest  = Math.max(totalPaid - balance, 0);
      interestNote = ` · ~${formatCurrency(interest)} interest`;
    }
    preview.innerHTML = `<div class="debt-eta-chip">✓ Paid off in <strong>${dur}</strong> · Est. <strong>${dateStr}</strong>${interestNote}</div>`;
  };
  sheet.querySelector('#df-balance')?.addEventListener('input', updateEtaPreview);
  sheet.querySelector('#df-payment')?.addEventListener('input', updateEtaPreview);
  sheet.querySelector('#df-rate')?.addEventListener('input', updateEtaPreview);
  updateEtaPreview();

  // Save debt
  sheet.querySelector('#df-save-btn')?.addEventListener('click', () => {
    const name    = sheet.querySelector('#df-name')?.value.trim();
    const balance = parseFloat(sheet.querySelector('#df-balance')?.value);
    const payment = parseFloat(sheet.querySelector('#df-payment')?.value);
    if (!name)                     { showToast('Please enter a name'); return; }
    if (!balance || balance <= 0)  { showToast('Please enter a balance'); return; }
    if (!payment || payment <= 0)  { showToast('Please enter a monthly payment'); return; }

    const original   = parseFloat(sheet.querySelector('#df-original')?.value) || balance;
    const rate       = parseFloat(sheet.querySelector('#df-rate')?.value)    || 0;
    const cat        = sheet.querySelector('#df-cat')?.value || 'other';
    const notes      = sheet.querySelector('#df-notes')?.value.trim() || '';
    const autoPayDay = parseInt(sheet.querySelector('#df-autopay-day')?.value) || null;
    const debtId     = sheet.querySelector('#df-save-btn')?.dataset.debtId;

    const d = getData();
    if (!d.debts) d.debts = [];

    if (debtId) {
      const existing = d.debts.find(x => x.id === debtId);
      if (existing) {
        existing.name = name; existing.balance = balance;
        existing.originalBalance = Math.max(original, balance);
        existing.monthlyPayment = payment; existing.interestRate = rate;
        existing.category = cat; existing.notes = notes;
        existing.autoPayDay = autoPayDay;
      }
    } else {
      d.debts.push({
        id: generateId(), name, balance,
        originalBalance: Math.max(original, balance),
        monthlyPayment: payment, interestRate: rate,
        category: cat, notes, autoPayDay,
        payments: [],
        createdAt: new Date().toISOString(),
      });
    }
    saveData(d);
    closeModal();
    state.expensesTab = 'debt';
    render();
    showToast(debtId ? 'Debt updated' : 'Debt added!');
  });

  // Delete debt (edit mode)
  sheet.querySelector('#df-delete-btn')?.addEventListener('click', () => {
    const debtId = sheet.querySelector('#df-delete-btn').dataset.debtId;
    const d = getData();
    if (!d.debts) return;
    captureUndo();
    d.debts = d.debts.filter(x => x.id !== debtId);
    saveData(d);
    closeModal();
    state.expensesTab = 'debt';
    render();
    showToast('Debt removed');
  });

  // Save debt payment
  sheet.querySelector('#dp-save-btn')?.addEventListener('click', () => {
    const debtId = sheet.querySelector('#dp-save-btn')?.dataset.debtId;
    const amount = parseFloat(sheet.querySelector('#dp-amount')?.value);
    if (!amount || amount <= 0) { showToast('Enter a valid amount'); return; }

    const date       = sheet.querySelector('#dp-date')?.value || todayISO();
    const note       = sheet.querySelector('#dp-note')?.value.trim() || '';
    const logExpense = sheet.querySelector('#dp-log-expense')?.checked !== false;

    const d = getData();
    const debt = (d.debts || []).find(x => x.id === debtId);
    if (!debt) return;

    if (!debt.payments) debt.payments = [];
    const expId = generateId();
    debt.payments.unshift({ id: generateId(), amount, date, note, expenseId: logExpense ? expId : null });
    debt.balance = Math.max(0, (debt.balance || 0) - amount);

    if (logExpense) {
      if (!d.expenses) d.expenses = [];
      d.expenses.push({
        id: expId, type: 'expense', category: 'other',
        description: `${debt.name} payment${note ? ' — ' + note : ''}`,
        amount, date, notes: 'Logged from debt tracker', recurring: false,
      });
    }

    saveData(d);
    closeModal();
    state.expensesTab = 'debt';
    render();
    showToast(`Payment of ${formatCurrency(amount)} logged!`);
  });

  // Quick client pay — search filter
  sheet.querySelector('#qcp-search')?.addEventListener('input', (e) => {
    const el = document.getElementById('modal-content');
    el.innerHTML = renderQuickClientPay(e.target.value);
    bindModalEvents();
  });

  // Quick client pay — pick a client → open payment form
  sheet.querySelectorAll('[data-qcp-client]').forEach(row => {
    row.addEventListener('click', () => {
      const clientId = row.dataset.qcpClient;
      openModal('add-payment', { clientId, date: todayISO() });
    });
  });

  // Delete transaction (from drilldown modal)
  sheet.querySelectorAll('[data-delete-tx]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const txId = btn.dataset.deleteTx;
      const src  = btn.dataset.txSource;
      const cId  = btn.dataset.txClient;
      if (!deleteTx(txId, src, cId)) return;
      // Re-render modal content in-place so user stays in drilldown
      if (state.modal?.type === 'expense-cat-detail') {
        document.getElementById('modal-content').innerHTML =
          renderExpenseCatModal(state.modal.data.catId, state.catDrilldownPeriod);
        bindModalEvents();
      }
      showToast('Transaction deleted', true);
    });
  });

  // Category drilldown — period tabs (in-place re-render, no animation flicker)
  sheet.querySelectorAll('[data-cat-period]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state.modal || state.modal.type !== 'expense-cat-detail') return;
      state.catDrilldownPeriod = btn.dataset.catPeriod;
      const el = document.getElementById('modal-content');
      el.innerHTML = renderExpenseCatModal(state.modal.data.catId, state.catDrilldownPeriod);
      bindModalEvents();
    });
  });

  // Calendar day modal — Add Job button
  sheet.querySelector('#cal-modal-add-job')?.addEventListener('click', (e) => {
    const date = e.currentTarget.dataset.date;
    closeModal();
    openModal('add-job', { date });
  });

  // Day modal & dash-day — tap a job row (not its buttons) to go to client
  sheet.querySelectorAll('[data-nav-client]').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      closeModal();
      navigate('client-detail', { clientId: row.dataset.navClient });
    });
  });

  // ── Dash Day modal ──

  // Mark scheduled job done → open payment form pre-filled from the scheduled job
  sheet.querySelectorAll('[data-sched-done]').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = getData();
      const jobId  = btn.dataset.schedDone;
      const sj     = (d.scheduledJobs || []).find(j => j.id === jobId);
      const client = d.clients.find(c => c.id === btn.dataset.schedClient);
      const unpaid = (client?.payments || []).filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);

      // Build description: prefer job's stored description → service type label → first client service → fallback
      let desc = '';
      if (sj?.description) {
        desc = sj.description;
      } else if (sj?.serviceType) {
        desc = serviceLabel(sj.serviceType);
      } else {
        const firstSvc = (client?.services || []).find(s => s.active && s.frequency && s.frequency !== 'one-time')
                      || (client?.services || [])[0];
        desc = firstSvc ? serviceLabel(firstSvc.type) : 'Lawn service';
      }

      // Amount: prefer job's estimated price → outstanding unpaid → blank
      const amount = sj?.estimatedPrice || (unpaid > 0 ? unpaid : '');

      openModal('add-payment', {
        clientId: btn.dataset.schedClient,
        date: btn.dataset.date,
        description: desc,
        amount,
        schedJobId: jobId,
        _returnDate: btn.dataset.date,
      });
    });
  });

  // Remove scheduled job
  sheet.querySelectorAll('[data-sched-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = getData();
      d.scheduledJobs = (d.scheduledJobs || []).filter(j => j.id !== btn.dataset.schedRemove);
      saveData(d);
      openModal('dash-day', { date: btn.dataset.date });
      showToast('Removed');
    });
  });

  // Toggle client picker panel
  sheet.querySelector('#sched-add-toggle')?.addEventListener('click', () => {
    const panel = sheet.querySelector('#sched-picker-panel');
    panel?.classList.toggle('hidden');
    if (!panel?.classList.contains('hidden')) {
      sheet.querySelector('#sched-picker-search')?.focus();
    }
  });

  // Search / filter client picker list
  sheet.querySelector('#sched-picker-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    sheet.querySelectorAll('.sched-pick-row:not(.sched-pick-already)').forEach(row => {
      const name = row.querySelector('.sched-pick-name')?.textContent.toLowerCase() || '';
      row.style.display = name.includes(q) ? '' : 'none';
    });
  });

  // Select / deselect a client in the picker
  sheet.querySelectorAll('.sched-pick-row:not(.sched-pick-already)').forEach(row => {
    row.addEventListener('click', () => {
      row.classList.toggle('sched-pick-selected');
      const check = row.querySelector('.sched-pick-check');
      if (check) {
        if (row.classList.contains('sched-pick-selected')) {
          check.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;color:var(--green-mid)"><polyline points="20 6 9 17 4 12"/></svg>`;
        } else {
          check.innerHTML = '';
        }
      }
      // Update button label
      const selected = sheet.querySelectorAll('.sched-pick-row.sched-pick-selected').length;
      const confirmBtn = sheet.querySelector('#sched-confirm-add');
      if (confirmBtn) {
        confirmBtn.textContent = selected > 0
          ? `Schedule ${selected} Client${selected !== 1 ? 's' : ''}`
          : 'Schedule Selected';
      }
    });
  });

  // Confirm: route all selected clients through service-select for confirmation
  sheet.querySelector('#sched-confirm-add')?.addEventListener('click', () => {
    const date = sheet.querySelector('#sched-confirm-add').dataset.date;
    const selected = [...sheet.querySelectorAll('.sched-pick-row.sched-pick-selected')];
    if (!selected.length) { showToast('Select at least one client'); return; }
    const d = getData();
    if (!d.scheduledJobs) d.scheduledJobs = [];
    const alreadyIds = new Set(d.scheduledJobs.filter(j => j.date === date).map(j => j.clientId));

    const clients = [];
    for (const row of selected) {
      const clientId = row.dataset.pickClient;
      if (alreadyIds.has(clientId)) continue;
      const client = d.clients.find(c => c.id === clientId);
      if (client) clients.push(client);
    }

    if (!clients.length) { showToast('All selected clients are already scheduled'); return; }

    // Always open the service-select modal — history cards auto-select the obvious
    // service for recurring clients so they can just tap "Schedule" immediately
    openModal('sched-service-select', { clients, date });
  });

  // Pull from last week
  sheet.querySelector('#sched-pull-lastweek')?.addEventListener('click', () => {
    const btn = sheet.querySelector('#sched-pull-lastweek');
    const date = btn.dataset.date;
    const lastWeekISO = btn.dataset.lastweek;
    const d = getData();
    if (!d.scheduledJobs) d.scheduledJobs = [];
    const lastWeekJobs = d.scheduledJobs.filter(j => j.date === lastWeekISO && j.status === 'scheduled');
    const alreadyIds = new Set(d.scheduledJobs.filter(j => j.date === date).map(j => j.clientId));
    let added = 0;
    for (const sj of lastWeekJobs) {
      if (!alreadyIds.has(sj.clientId)) {
        d.scheduledJobs.push({ id: generateId(), clientId: sj.clientId, date, status: 'scheduled', createdAt: new Date().toISOString() });
        added++;
      }
    }
    saveData(d);
    render();
    openModal('dash-day', { date });
    showToast(`Pulled ${added} job${added !== 1 ? 's' : ''} from last week`);
  });

  // Client type toggle
  sheet.querySelectorAll('.client-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sheet.querySelectorAll('.client-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('f-client-type').value = btn.dataset.type;
    });
  });

  // Pill selectors
  sheet.querySelectorAll('[data-pill-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      sheet.querySelectorAll('[data-pill-type]').forEach(b => {
        b.classList.remove('selected');
        b.style.background = ''; b.style.borderColor = ''; b.style.color = '';
      });
      btn.classList.add('selected');
      const ic = serviceIconColors(btn.dataset.pillType);
      btn.style.background = ic.bg; btn.style.borderColor = ic.color; btn.style.color = ic.color;
      document.getElementById('f-svc-type').value = btn.dataset.pillType;
      // Show/hide property size field for mowing only
      const mowGroup = sheet.querySelector('.mowing-only-group');
      if (mowGroup) mowGroup.style.display = btn.dataset.pillType === 'mowing' ? '' : 'none';
    });
  });

  sheet.querySelectorAll('[data-pill-freq]').forEach(btn => {
    btn.addEventListener('click', () => {
      sheet.querySelectorAll('[data-pill-freq]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('f-svc-freq').value = btn.dataset.pillFreq;
    });
  });

  // New client inline service pills
  sheet.querySelectorAll('[data-new-svc-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      sheet.querySelectorAll('[data-new-svc-type]').forEach(b => {
        b.classList.remove('selected');
        b.style.background = ''; b.style.borderColor = ''; b.style.color = '';
      });
      btn.classList.add('selected');
      const ic = serviceIconColors(btn.dataset.newSvcType);
      btn.style.background = ic.bg; btn.style.borderColor = ic.color; btn.style.color = ic.color;
      document.getElementById('f-new-svc-type').value = btn.dataset.newSvcType;
    });
  });

  sheet.querySelectorAll('[data-new-svc-freq]').forEach(btn => {
    btn.addEventListener('click', () => {
      sheet.querySelectorAll('[data-new-svc-freq]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('f-new-svc-freq').value = btn.dataset.newSvcFreq;
    });
  });

  sheet.querySelectorAll('[data-pill-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      sheet.querySelectorAll('[data-pill-status]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('f-pay-status').value = btn.dataset.pillStatus;
    });
  });

  // Delete client (from edit modal)
  sheet.querySelector('#delete-client-modal-btn')?.addEventListener('click', () => {
    const btn = sheet.querySelector('#delete-client-modal-btn');
    const clientId = btn.dataset.clientId;
    const d = getData();
    const client = d.clients.find(c => c.id === clientId);
    showConfirm('Delete Client', `Delete ${client?.name}? All their services and payment history will be permanently removed.`, () => {
      const d2 = getData();
      d2.clients = d2.clients.filter(c => c.id !== clientId);
      saveData(d2); closeModal(); showToast('Client deleted'); navigate('clients');
    });
  });

  // Save client
  sheet.querySelector('#save-client-btn')?.addEventListener('click', () => {
    const name = document.getElementById('f-name').value.trim();
    if (!name) { alert('Please enter a client name.'); return; }
    const clientId = sheet.querySelector('#save-client-btn').dataset.clientId;
    const d = getData();
    if (clientId) {
      const client = d.clients.find(c => c.id === clientId);
      if (client) {
        client.name = name;
        client.phone = document.getElementById('f-phone').value.trim();
        client.address = document.getElementById('f-address').value.trim();
        client.notes = document.getElementById('f-notes').value.trim();
        client.type = document.getElementById('f-client-type').value || 'regular';
      }
      saveData(d);
      closeModal();
      showToast('Client updated');
      render();
    } else {
      const svcType = document.getElementById('f-new-svc-type')?.value;
      const svcFreq = document.getElementById('f-new-svc-freq')?.value;
      const svcPrice = parseFloat(document.getElementById('f-new-svc-price')?.value);
      if (!svcType) { alert('Please select a service type.'); return; }
      if (!svcFreq) { alert('Please select a frequency.'); return; }
      if (!svcPrice || svcPrice <= 0) { alert('Please enter a valid price.'); return; }

      const client = {
        id: generateId(),
        name,
        status: 'active',
        type: document.getElementById('f-client-type').value || 'regular',
        phone: document.getElementById('f-phone').value.trim(),
        address: document.getElementById('f-address').value.trim(),
        notes: document.getElementById('f-notes').value.trim(),
        services: [{
          id: generateId(),
          type: svcType,
          frequency: svcFreq,
          price: svcPrice,
          active: true,
          createdAt: new Date().toISOString(),
        }],
        payments: [],
        createdAt: new Date().toISOString(),
      };
      d.clients.push(client);
      saveData(d);
      closeModal();
      showToast('Client added!');
      navigate('client-detail', { clientId: client.id });
    }
  });

  // Save service
  sheet.querySelector('#save-service-btn')?.addEventListener('click', () => {
    const type = document.getElementById('f-svc-type').value;
    const freq = document.getElementById('f-svc-freq').value;
    const price = parseFloat(document.getElementById('f-svc-price').value);
    const btn = sheet.querySelector('#save-service-btn');
    const clientId = btn.dataset.clientId;
    const serviceId = btn.dataset.serviceId;

    if (!type) { alert('Please select a service type.'); return; }
    if (!freq) { alert('Please select a frequency.'); return; }
    if (!price || price <= 0) { alert('Please enter a valid price.'); return; }

    const d = getData();
    const client = d.clients.find(c => c.id === clientId);
    if (!client) return;

    if (serviceId) {
      const svc = client.services.find(s => s.id === serviceId);
      if (svc) {
        svc.type = type;
        svc.frequency = freq;
        svc.price = price;
        svc.notes = document.getElementById('f-svc-notes').value.trim();
        svc.propertySize = parseFloat(document.getElementById('f-svc-prop-size')?.value) || null;
      }
      saveData(d); closeModal(); showToast('Service updated'); render();
    } else {
      client.services.push({
        id: generateId(),
        type,
        frequency: freq,
        price,
        active: true,
        notes: document.getElementById('f-svc-notes').value.trim(),
        propertySize: parseFloat(document.getElementById('f-svc-prop-size')?.value) || null,
        startDate: new Date().toISOString(),
      });
      saveData(d); closeModal(); showToast('Service added!'); render();
    }
  });

  // Delete service (from edit modal)
  sheet.querySelector('#delete-service-modal-btn')?.addEventListener('click', () => {
    const btn = sheet.querySelector('#delete-service-modal-btn');
    captureUndo();
    const d = getData();
    const client = d.clients.find(c => c.id === btn.dataset.clientId);
    if (client) {
      client.services = client.services.filter(s => s.id !== btn.dataset.serviceId);
      saveData(d); closeModal(); render(); showToast('Service deleted', true);
    }
  });

  // Delete payment (from edit modal)
  sheet.querySelector('#delete-payment-modal-btn')?.addEventListener('click', () => {
    const btn = sheet.querySelector('#delete-payment-modal-btn');
    captureUndo();
    const d = getData();
    const client = d.clients.find(c => c.id === btn.dataset.clientId);
    if (client) {
      client.payments = client.payments.filter(p => p.id !== btn.dataset.paymentId);
      saveData(d); closeModal(); render(); showToast('Payment deleted', true);
    }
  });

  // Save payment
  sheet.querySelector('#save-payment-btn')?.addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('f-pay-amount').value);
    const btn = sheet.querySelector('#save-payment-btn');
    const clientId = btn.dataset.clientId;
    const paymentId = btn.dataset.paymentId;

    if (!amount || amount <= 0) { alert('Please enter a valid amount.'); return; }

    const d = getData();
    const client = d.clients.find(c => c.id === clientId);
    if (!client) return;

    if (paymentId) {
      const p = client.payments.find(p => p.id === paymentId);
      if (p) {
        p.amount = amount;
        p.description = document.getElementById('f-pay-desc').value.trim();
        p.date = document.getElementById('f-pay-date').value || todayISO();
        p.status = document.getElementById('f-pay-status').value || 'unpaid';
      }
      saveData(d); closeModal(); showToast('Payment updated'); render();
      return;
    }

    const schedJobId = btn.dataset.schedJobId;
    const returnDate = btn.dataset.returnDate;

    client.payments.push({
      id: generateId(),
      amount,
      description: document.getElementById('f-pay-desc').value.trim(),
      date: document.getElementById('f-pay-date').value || todayISO(),
      status: document.getElementById('f-pay-status').value || 'unpaid',
    });

    // If triggered from a scheduled job, mark it done
    if (schedJobId) {
      const sj = (d.scheduledJobs || []).find(j => j.id === schedJobId);
      if (sj) sj.status = 'done';
    }

    saveData(d);
    showToast('Payment recorded!');

    // Return to the day modal if we came from the schedule
    if (schedJobId && returnDate) {
      openModal('dash-day', { date: returnDate });
    } else {
      closeModal();
      state.activeClientId = clientId;
      navigate('client-detail', { clientId });
    }
  });

  // Save manual time entry
  sheet.querySelector('#save-time-btn')?.addEventListener('click', () => {
    const durationMins = parseInt(document.getElementById('f-time-dur-mins')?.value) || 0;
    if (durationMins <= 0) { alert('Please enter an arrival and departure time.'); return; }
    const date     = document.getElementById('f-time-date')?.value || todayISO();
    const clientId = document.getElementById('f-time-client')?.value || null;
    const notes    = document.getElementById('f-time-notes')?.value.trim() || '';
    const d = getData();
    d.timeEntries = d.timeEntries || [];
    d.timeEntries.push({
      id: generateId(),
      date,
      clockIn: date + 'T00:00:00.000Z',
      clockOut: date + 'T00:00:00.000Z',
      durationMins,
      clientId: clientId || null,
      notes,
      manual: true,
    });
    saveData(d);
    const h = Math.floor(durationMins / 60), m = durationMins % 60;
    closeModal(); render(); showToast(`${h > 0 ? h + 'h ' : ''}${m}m logged`);
  });

  // Save job (from calendar)
  sheet.querySelector('#save-job-btn')?.addEventListener('click', () => {
    const clientId = document.getElementById('f-job-client')?.value;
    const amount = parseFloat(document.getElementById('f-job-amount')?.value);
    const date = sheet.querySelector('#save-job-btn').dataset.date;

    if (!clientId) { alert('Please select a client.'); return; }
    if (!amount || amount <= 0) { alert('Please enter a valid amount.'); return; }

    const d = getData();
    const client = d.clients.find(c => c.id === clientId);
    if (!client) return;

    client.payments.push({
      id: generateId(),
      amount,
      description: document.getElementById('f-job-desc')?.value.trim() || '',
      date,
      status: document.getElementById('f-pay-status')?.value || 'unpaid',
    });

    saveData(d);
    closeModal();
    showToast('Job recorded!');
    // Stay on calendar and refresh the selected day
    state.calendarSelectedDay = date;
    render();
  });
}

// ===== EXPORT / IMPORT =====
function exportData() {
  const data = getData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lawn-crm-export-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported!');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data.clients)) throw new Error('Invalid format');
      showConfirm('Import Data', `This will replace all current data with ${data.clients.length} clients from the file. Continue?`, () => {
        saveData(data);
        navigate('dashboard');
        showToast('Data imported!');
      });
    } catch (err) {
      alert('Invalid file format. Please use a file exported from this app.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ===== XSS PROTECTION =====
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== INIT =====
function init() {
  // Bottom nav buttons
  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });

  // Sidebar nav buttons
  document.querySelectorAll('.sidebar-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });

  // ── Quick Actions speed dial ──
  const quickMenu     = document.getElementById('quick-menu');
  const quickBackdrop = document.getElementById('quick-menu-backdrop');
  const fab           = document.getElementById('fab-add');
  const fabIconPlus   = document.getElementById('fab-icon-plus');
  const fabIconClose  = document.getElementById('fab-icon-close');
  const sidebarBtn    = document.getElementById('sidebar-add-btn');

  let qmOpen = false;

  function openQuickMenu(anchorEl) {
    if (qmOpen) { closeQuickMenu(); return; }
    qmOpen = true;

    // Position menu above the anchor
    const rect = anchorEl.getBoundingClientRect();
    quickMenu.style.bottom  = (window.innerHeight - rect.top + 8) + 'px';
    quickMenu.style.left    = rect.left + 'px';
    quickMenu.style.width   = Math.max(rect.width, 240) + 'px';

    quickMenu.classList.remove('qm-hidden');
    quickMenu.classList.add('qm-open');
    quickBackdrop.classList.remove('qm-hidden');

    // FAB: swap icon
    if (fabIconPlus)  fabIconPlus.style.display  = 'none';
    if (fabIconClose) fabIconClose.style.display = '';
    fab.classList.add('qm-fab-open');
  }

  function closeQuickMenu() {
    if (!qmOpen) return;
    qmOpen = false;
    quickMenu.classList.remove('qm-open');
    quickMenu.classList.add('qm-hidden');
    quickBackdrop.classList.add('qm-hidden');
    if (fabIconPlus)  fabIconPlus.style.display  = '';
    if (fabIconClose) fabIconClose.style.display = 'none';
    fab.classList.remove('qm-fab-open');
  }

  fab.addEventListener('click', () => openQuickMenu(fab));
  sidebarBtn.addEventListener('click', () => openQuickMenu(sidebarBtn));
  quickBackdrop.addEventListener('click', closeQuickMenu);

  // Speed dial actions
  document.getElementById('qm-schedule').addEventListener('click', () => {
    closeQuickMenu();
    openModal('dash-day', { date: todayISO() });
  });
  document.getElementById('qm-payment').addEventListener('click', () => {
    closeQuickMenu();
    openModal('quick-client-pay', {});
  });
  document.getElementById('qm-expense').addEventListener('click', () => {
    closeQuickMenu();
    openModal('expense-form', {});
  });
  document.getElementById('qm-add-client').addEventListener('click', () => {
    closeQuickMenu();
    openModal('add-client');
  });

  // Modal overlay click to close
  document.getElementById('modal-overlay').addEventListener('click', closeModal);

  // Initial render
  render();
}

document.addEventListener('DOMContentLoaded', init);
