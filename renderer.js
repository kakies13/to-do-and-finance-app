// ============ STATE ============
let currentView = 'dashboard';
let notes = [];
let transactions = [];
let installments = [];
let categories = [];
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', async () => {
  initWindowControls();
  initNavigation();
  initModals();
  await loadAllData();
  initEventListeners();
});

function initWindowControls() {
  document.getElementById('minimize-btn').onclick = () => window.electronAPI.minimizeWindow();
  document.getElementById('maximize-btn').onclick = () => window.electronAPI.maximizeWindow();
  document.getElementById('close-btn').onclick = () => window.electronAPI.closeWindow();
}

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      switchView(view);
    });
  });
}

function switchView(viewName) {
  currentView = viewName;

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });

  // Update views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(`${viewName}-view`).classList.add('active');

  // Refresh view data
  refreshCurrentView();
}

async function loadAllData() {
  try {
    notes = await window.electronAPI.getNotes();
    transactions = await window.electronAPI.getTransactions();
    installments = await window.electronAPI.getInstallments();
    categories = await window.electronAPI.getCategories();
    await updateBalance();
    refreshCurrentView();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function refreshCurrentView() {
  switch (currentView) {
    case 'dashboard': renderDashboard(); break;
    case 'notes': renderNotes(); break;
    case 'transactions': renderTransactions(); break;
    case 'installments': renderInstallments(); break;
    case 'summary': renderSummary(); break;
    case 'categories': renderCategories(); break;
  }
}

async function updateBalance() {
  const balance = await window.electronAPI.getBalance();
  document.getElementById('sidebar-balance').textContent = formatCurrency(balance);
  document.getElementById('dash-balance').textContent = formatCurrency(balance);
}

// ============ FORMATTERS ============
function formatCurrency(amount) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('tr-TR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const importanceLabels = {
  1: { icon: '🟢', label: 'Düşük' },
  2: { icon: '🟡', label: 'Orta' },
  3: { icon: '🟠', label: 'Yüksek' },
  4: { icon: '🔴', label: 'Kritik' }
};

// ============ DASHBOARD ============
async function renderDashboard() {
  const now = new Date();
  const summary = await window.electronAPI.getMonthlySummary(now.getFullYear(), now.getMonth() + 1);

  document.getElementById('dash-income').textContent = formatCurrency(summary.income);
  document.getElementById('dash-expense').textContent = formatCurrency(summary.expense);

  const pendingInstallments = installments.filter(i => i.paid_count < i.installment_count);
  document.getElementById('dash-pending').textContent = pendingInstallments.length;

  // Recent notes
  const recentNotesEl = document.getElementById('recent-notes-list');
  const recentNotes = notes.slice(0, 5);

  if (recentNotes.length === 0) {
    recentNotesEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><p class="empty-state-text">Henüz not eklenmedi</p></div>';
  } else {
    recentNotesEl.innerHTML = recentNotes.map(note => `
      <div class="mini-note">
        <div class="mini-icon">${importanceLabels[note.importance].icon}</div>
        <div class="mini-info">
          <div class="mini-title">${escapeHtml(note.title)}</div>
          <div class="mini-subtitle">${formatDate(note.created_at)}</div>
        </div>
        <span class="mini-badge importance-${note.importance}">${importanceLabels[note.importance].label}</span>
      </div>
    `).join('');
  }

  // Upcoming payments
  const upcomingEl = document.getElementById('upcoming-payments-list');
  const upcoming = pendingInstallments.slice(0, 5);

  if (upcoming.length === 0) {
    upcomingEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><p class="empty-state-text">Yaklaşan ödeme yok</p></div>';
  } else {
    upcomingEl.innerHTML = upcoming.map(inst => `
      <div class="mini-payment">
        <div class="mini-icon">${inst.category_icon || '📅'}</div>
        <div class="mini-info">
          <div class="mini-title">${escapeHtml(inst.title)}</div>
          <div class="mini-subtitle">${formatDate(inst.next_payment_date)} • ${inst.paid_count}/${inst.installment_count}</div>
        </div>
        <span class="mini-amount">${formatCurrency(inst.monthly_amount)}</span>
      </div>
    `).join('');
  }
}

// ============ NOTES ============
let currentNoteFilter = 'all';

function initNotesFilters() {
  document.querySelectorAll('.notes-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.notes-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentNoteFilter = btn.dataset.filter;
      renderNotes();
    });
  });
}

function renderNotes() {
  const container = document.getElementById('notes-grid');
  let filteredNotes = notes;

  if (currentNoteFilter !== 'all') {
    filteredNotes = notes.filter(n => n.importance == currentNoteFilter);
  }

  if (filteredNotes.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">📝</div>
        <p class="empty-state-text">Henüz not eklenmedi. "Yeni Not" butonuna tıklayarak başlayın.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredNotes.map(note => `
    <div class="note-card importance-${note.importance}" data-id="${note.id}">
      <div class="note-header">
        <h3 class="note-title">${escapeHtml(note.title)}</h3>
        <div class="note-actions">
          ${note.alarm_time ?
      `<button class="note-action-btn" onclick="clearAlarm(${note.id})" title="Alarmı Kaldır">🔕</button>` :
      `<button class="note-action-btn" onclick="showSetAlarmModal(${note.id})" title="Alarm Ekle">🔔</button>`
    }
          <button class="note-action-btn" onclick="showEditNoteModal(${note.id})" title="Düzenle">✏️</button>
          <button class="note-action-btn delete" onclick="deleteNote(${note.id})" title="Sil">🗑️</button>
        </div>
      </div>
      <p class="note-content">${escapeHtml(note.content || '')}</p>
      <div class="note-footer">
        <span>${formatDate(note.updated_at)}</span>
        ${note.alarm_time ? `<span class="note-alarm">🔔 ${formatDateTime(note.alarm_time)}</span>` : ''}
      </div>
    </div>
  `).join('');
}

async function deleteNote(id) {
  if (confirm('Bu notu silmek istediğinize emin misiniz?')) {
    await window.electronAPI.deleteNote(id);
    notes = await window.electronAPI.getNotes();
    renderNotes();
  }
}

async function clearAlarm(noteId) {
  await window.electronAPI.clearAlarm(noteId);
  notes = await window.electronAPI.getNotes();
  renderNotes();
}

// ============ TRANSACTIONS ============
function renderTransactions() {
  const container = document.getElementById('transactions-list');

  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💳</div>
        <p class="empty-state-text">Henüz işlem eklenmedi. Gelir veya gider ekleyerek başlayın.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = transactions.map(t => `
    <div class="transaction-item" data-id="${t.id}">
      <div class="transaction-icon" style="background: ${t.category_color}20">
        ${t.category_icon || (t.type === 'income' ? '💰' : '💸')}
      </div>
      <div class="transaction-info">
        <div class="transaction-desc">${escapeHtml(t.description || (t.type === 'income' ? 'Gelir' : 'Gider'))}</div>
        <div class="transaction-category">${t.category_name || 'Kategorisiz'}</div>
      </div>
      <div>
        <div class="transaction-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</div>
        <div class="transaction-date">${formatDate(t.date)}</div>
      </div>
      <button class="transaction-delete" onclick="deleteTransaction(${t.id})">🗑️</button>
    </div>
  `).join('');
}

async function deleteTransaction(id) {
  if (confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
    await window.electronAPI.deleteTransaction(id);
    transactions = await window.electronAPI.getTransactions();
    await updateBalance();
    renderTransactions();
  }
}

// ============ INSTALLMENTS ============
function renderInstallments() {
  const container = document.getElementById('installments-grid');

  // Toplam hesaplamalar
  let totalMonthlyPayment = 0;
  let totalRemainingDebt = 0;

  installments.forEach(inst => {
    const remaining = inst.installment_count - inst.paid_count;
    if (remaining > 0) {
      totalMonthlyPayment += inst.monthly_amount;
      totalRemainingDebt += inst.monthly_amount * remaining;
    }
  });

  // Özet kartlarını güncelle
  document.getElementById('total-monthly-installment').textContent = formatCurrency(totalMonthlyPayment);
  document.getElementById('total-remaining-debt').textContent = formatCurrency(totalRemainingDebt);

  if (installments.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">📅</div>
        <p class="empty-state-text">Henüz taksit eklenmedi. "Yeni Taksit" butonuna tıklayarak başlayın.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = installments.map(inst => {
    const remaining = inst.installment_count - inst.paid_count;
    const progress = (inst.paid_count / inst.installment_count) * 100;

    return `
      <div class="installment-card" data-id="${inst.id}">
        <div class="installment-header">
          <div>
            <h3 class="installment-title">${escapeHtml(inst.title)}</h3>
            <div class="installment-category">${inst.category_icon || '📦'} ${inst.category_name || 'Kategorisiz'}</div>
          </div>
          <div class="installment-header-actions">
            <button class="btn-icon-small" onclick="showEditInstallmentModal(${inst.id})" title="Düzenle & Ödemeler">✏️</button>
            <button class="btn-icon-small delete" onclick="deleteInstallment(${inst.id})" title="Sil">🗑️</button>
          </div>
        </div>
        
        <div class="installment-dates">
          <div class="date-info">
            <span class="date-icon">📅</span>
            <span class="date-text">Başlangıç: <strong>${formatDate(inst.start_date)}</strong></span>
          </div>
          <div class="date-info next-payment">
            <span class="date-icon">⏳</span>
            <span class="date-text">Sonraki Ödeme: <strong>${remaining > 0 ? formatDate(inst.next_payment_date) : 'Tamamlandı ✅'}</strong></span>
          </div>
        </div>
        
        <div class="installment-details">
          <div class="detail-item">
            <span class="detail-label">Aylık Taksit</span>
            <span class="detail-value">${formatCurrency(inst.monthly_amount)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Toplam Kalan Borç</span>
            <span class="detail-value">${formatCurrency(inst.monthly_amount * remaining)}</span>
          </div>
        </div>
        
        <div class="installment-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
        </div>
        
        <div class="installment-summary">
          <span class="paid-info">✓ ${inst.paid_count} ödendi</span>
          <span class="remaining-info">${remaining} kaldı</span>
        </div>
      </div>
    `;
  }).join('');
}

// Ay durumunu toggle et
async function toggleMonth(installmentId, monthIndex) {
  const result = await window.electronAPI.toggleInstallmentMonth(installmentId, monthIndex);
  if (result.success) {
    installments = await window.electronAPI.getInstallments();
    transactions = await window.electronAPI.getTransactions();
    await updateBalance();
    renderInstallments();
  } else {
    alert(result.message);
  }
}

async function payInstallment(id) {
  const result = await window.electronAPI.payInstallment(id);
  if (result.success) {
    installments = await window.electronAPI.getInstallments();
    transactions = await window.electronAPI.getTransactions();
    await updateBalance();
    renderInstallments();
  } else {
    alert(result.message);
  }
}

async function deleteInstallment(id) {
  if (confirm('Bu taksiti silmek istediğinize emin misiniz?')) {
    await window.electronAPI.deleteInstallment(id);
    installments = await window.electronAPI.getInstallments();
    renderInstallments();
  }
}

// Taksit Düzenleme Modalı
function showEditInstallmentModal(id) {
  const inst = installments.find(i => i.id === id);
  if (!inst) return;

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const paidMonths = inst.paid_months || new Array(inst.installment_count).fill(false);
  const startDate = new Date(inst.start_date);

  // Aylık kutucukları oluştur
  const monthBoxes = paidMonths.map((paid, index) => {
    const monthDate = new Date(startDate);
    monthDate.setMonth(monthDate.getMonth() + index);
    const monthName = monthDate.toLocaleDateString('tr-TR', { month: 'short' });
    const yearShort = monthDate.getFullYear().toString().slice(-2);

    return `
      <div class="month-box ${paid ? 'paid' : 'unpaid'}" 
           onclick="toggleMonthInModal(${inst.id}, ${index})" 
           title="${paid ? 'Ödendi - İptal etmek için tıklayın' : 'Ödenmedi - Ödemek için tıklayın'}">
        <span class="month-label">${monthName}</span>
        <span class="month-year">'${yearShort}</span>
        <span class="month-status">${paid ? '✓' : ''}</span>
      </div>
    `;
  }).join('');

  openModal('Taksit Düzenle - ' + escapeHtml(inst.title), `
    <div class="modal-section">
      <h4 class="section-title">📅 Ödeme Durumu</h4>
      <p class="section-hint">Kutucuklara tıklayarak ödeme durumunu değiştirin</p>
      <div class="months-grid modal-months">
        ${monthBoxes}
      </div>
      <div class="payment-summary">
        <span class="paid-info">✓ ${inst.paid_count} ödendi</span>
        <span class="remaining-info">${inst.installment_count - inst.paid_count} kaldı</span>
      </div>
    </div>
    
    <hr class="modal-divider">
    
    <form id="edit-installment-form" onsubmit="updateInstallment(event, ${id})">
      <h4 class="section-title">⚙️ Taksit Bilgileri</h4>
      <div class="form-group">
        <label>Başlık</label>
        <input type="text" class="form-control" name="title" value="${escapeHtml(inst.title)}" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Toplam Tutar (€)</label>
          <input type="number" step="0.01" class="form-control" name="totalAmount" value="${inst.total_amount}" required>
        </div>
        <div class="form-group">
          <label>Taksit Sayısı</label>
          <input type="number" class="form-control" name="installmentCount" value="${inst.installment_count}" required min="1" max="60">
        </div>
      </div>
      <div class="form-group">
        <label>Kategori</label>
        <select class="form-control" name="categoryId">
          <option value="">Kategori seç...</option>
          ${expenseCategories.map(c => `<option value="${c.id}" ${c.id === inst.category_id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Açıklama</label>
        <input type="text" class="form-control" name="description" value="${escapeHtml(inst.description || '')}">
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="closeModal()">Kapat</button>
        <button type="submit" class="btn-primary">Bilgileri Güncelle</button>
      </div>
    </form>
  `);
}

// Modal içinde ay durumunu toggle et
async function toggleMonthInModal(installmentId, monthIndex) {
  const result = await window.electronAPI.toggleInstallmentMonth(installmentId, monthIndex);
  if (result.success) {
    installments = await window.electronAPI.getInstallments();
    transactions = await window.electronAPI.getTransactions();
    await updateBalance();
    // Modalı yeniden aç
    showEditInstallmentModal(installmentId);
    // Ana listeyi de güncelle
    renderInstallments();
  } else {
    alert(result.message);
  }
}

async function updateInstallment(event, id) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const installmentData = {
    id: id,
    title: formData.get('title'),
    totalAmount: parseFloat(formData.get('totalAmount')),
    installmentCount: parseInt(formData.get('installmentCount')),
    categoryId: formData.get('categoryId') ? parseInt(formData.get('categoryId')) : null,
    description: formData.get('description')
  };

  await window.electronAPI.updateInstallment(installmentData);
  installments = await window.electronAPI.getInstallments();
  closeModal();
  renderInstallments();
}


// ============ SUMMARY ============
function initSummaryControls() {
  document.getElementById('prev-month').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
    renderSummary();
  });

  document.getElementById('next-month').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    renderSummary();
  });
}

async function renderSummary() {
  document.getElementById('current-month').textContent = `${monthNames[currentMonth - 1]} ${currentYear}`;

  const summary = await window.electronAPI.getMonthlySummary(currentYear, currentMonth);

  document.getElementById('summary-income').textContent = formatCurrency(summary.income);
  document.getElementById('summary-expense').textContent = formatCurrency(summary.expense);
  document.getElementById('summary-net').textContent = formatCurrency(summary.net);
  document.getElementById('summary-net').style.color = summary.net >= 0 ? 'var(--success)' : 'var(--danger)';

  // Category breakdown
  const categoryBreakdown = document.getElementById('category-breakdown');
  const expenseCategories = summary.byCategory.filter(c => c.type === 'expense');
  const maxExpense = Math.max(...expenseCategories.map(c => c.total), 1);

  if (expenseCategories.length === 0) {
    categoryBreakdown.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">Bu ayda harcama yok</p>';
  } else {
    categoryBreakdown.innerHTML = expenseCategories.map(cat => `
      <div class="category-bar">
        <span class="category-bar-icon">${cat.icon || '📦'}</span>
        <div class="category-bar-info">
          <div class="category-bar-name">${cat.name}</div>
          <div class="category-bar-visual">
            <div class="category-bar-fill" style="width: ${(cat.total / maxExpense) * 100}%; background: ${cat.color}"></div>
          </div>
        </div>
        <span class="category-bar-amount">${formatCurrency(cat.total)}</span>
      </div>
    `).join('');
  }

  // Monthly transactions
  const monthlyTransactions = document.getElementById('monthly-transactions');
  if (summary.transactions.length === 0) {
    monthlyTransactions.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">Bu ayda işlem yok</p>';
  } else {
    monthlyTransactions.innerHTML = summary.transactions.slice(0, 10).map(t => `
      <div class="transaction-item" style="padding: 10px 12px; margin-bottom: 6px;">
        <div class="transaction-icon" style="width: 36px; height: 36px; font-size: 16px; background: ${t.category_color}20">
          ${t.category_icon || (t.type === 'income' ? '💰' : '💸')}
        </div>
        <div class="transaction-info">
          <div class="transaction-desc" style="font-size: 13px;">${escapeHtml(t.description || (t.type === 'income' ? 'Gelir' : 'Gider'))}</div>
        </div>
        <div class="transaction-amount ${t.type}" style="font-size: 14px;">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</div>
      </div>
    `).join('');
  }
}

// ============ CATEGORIES ============
function renderCategories() {
  const incomeContainer = document.getElementById('income-categories');
  const expenseContainer = document.getElementById('expense-categories');

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  incomeContainer.innerHTML = incomeCategories.map(cat => `
    <div class="category-chip">
      <div class="category-icon" style="background: ${cat.color}20">${cat.icon}</div>
      <span class="category-name">${cat.name}</span>
      <button class="category-delete" onclick="deleteCategory(${cat.id})">×</button>
    </div>
  `).join('');

  expenseContainer.innerHTML = expenseCategories.map(cat => `
    <div class="category-chip">
      <div class="category-icon" style="background: ${cat.color}20">${cat.icon}</div>
      <span class="category-name">${cat.name}</span>
      <button class="category-delete" onclick="deleteCategory(${cat.id})">×</button>
    </div>
  `).join('');
}

async function deleteCategory(id) {
  if (confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
    await window.electronAPI.deleteCategory(id);
    categories = await window.electronAPI.getCategories();
    renderCategories();
  }
}

// ============ MODALS ============
const modalOverlay = document.getElementById('modal-overlay');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');

function initModals() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

function openModal(title, content) {
  modalTitle.textContent = title;
  modalContent.innerHTML = content;
  modalOverlay.classList.add('active');
}

function closeModal() {
  modalOverlay.classList.remove('active');
}

// Note Modal
function showAddNoteModal() {
  openModal('Yeni Not', getNoteFormHTML());
  initImportanceSelect();
}

function showEditNoteModal(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;

  openModal('Notu Düzenle', getNoteFormHTML(note));
  initImportanceSelect(note.importance);
}

function getNoteFormHTML(note = null) {
  return `
  < form id = "note-form" onsubmit = "saveNote(event, ${note?.id || 'null'})" >
      <div class="form-group">
        <label>Başlık</label>
        <input type="text" class="form-control" name="title" value="${note?.title || ''}" required placeholder="Not başlığı...">
      </div>
      <div class="form-group">
        <label>İçerik</label>
        <textarea class="form-control" name="content" placeholder="Not içeriği...">${note?.content || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Önem Derecesi</label>
        <div class="importance-select">
          <div class="importance-option" data-value="1">🟢 Düşük</div>
          <div class="importance-option" data-value="2">🟡 Orta</div>
          <div class="importance-option" data-value="3">🟠 Yüksek</div>
          <div class="importance-option" data-value="4">🔴 Kritik</div>
        </div>
        <input type="hidden" name="importance" value="${note?.importance || 1}">
      </div>
      <div class="form-group">
        <label>Alarm (Opsiyonel)</label>
        <input type="datetime-local" class="form-control" name="alarmTime" value="${note?.alarm_time ? note.alarm_time.slice(0, 16) : ''}">
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="closeModal()">İptal</button>
        <button type="submit" class="btn-primary">${note ? 'Güncelle' : 'Kaydet'}</button>
      </div>
    </form >
  `;
}

function initImportanceSelect(selected = 1) {
  const options = document.querySelectorAll('.importance-option');
  const hiddenInput = document.querySelector('input[name="importance"]');

  options.forEach(opt => {
    if (parseInt(opt.dataset.value) === selected) {
      opt.classList.add('active');
    }

    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      hiddenInput.value = opt.dataset.value;
    });
  });
}

async function saveNote(event, id = null) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const noteData = {
    title: formData.get('title'),
    content: formData.get('content'),
    importance: parseInt(formData.get('importance')),
    alarmTime: formData.get('alarmTime') || null
  };

  if (id) {
    noteData.id = id;
    await window.electronAPI.updateNote(noteData);
  } else {
    await window.electronAPI.addNote(noteData);
  }

  notes = await window.electronAPI.getNotes();
  closeModal();
  renderNotes();
}

// Set Alarm Modal
function showSetAlarmModal(noteId) {
  openModal('Alarm Ayarla', `
  < form id = "alarm-form" onsubmit = "setAlarm(event, ${noteId})" >
      <div class="form-group">
        <label>Alarm Zamanı</label>
        <input type="datetime-local" class="form-control" name="alarmTime" required>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="closeModal()">İptal</button>
        <button type="submit" class="btn-primary">Ayarla</button>
      </div>
    </form >
  `);
}

async function setAlarm(event, noteId) {
  event.preventDefault();
  const alarmTime = event.target.alarmTime.value;
  await window.electronAPI.setAlarm(noteId, alarmTime);
  notes = await window.electronAPI.getNotes();
  closeModal();
  renderNotes();
}

// Transaction Modal
function showTransactionModal(type) {
  const isIncome = type === 'income';
  openModal(isIncome ? 'Gelir Ekle' : 'Gider Ekle', getTransactionFormHTML(type));
}

function getTransactionFormHTML(type) {
  const typeCategories = categories.filter(c => c.type === type);

  return `
  < form id = "transaction-form" onsubmit = "saveTransaction(event, '${type}')" >
      <div class="form-group">
        <label>Tutar (€)</label>
        <input type="number" step="0.01" class="form-control" name="amount" required placeholder="0.00">
      </div>
      <div class="form-group">
        <label>Kategori</label>
        <select class="form-control" name="categoryId" required>
          <option value="">Kategori seç...</option>
          ${typeCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Açıklama</label>
        <input type="text" class="form-control" name="description" placeholder="${type === 'income' ? 'Gelir açıklaması...' : 'Gider açıklaması...'}">
      </div>
      <div class="form-group">
        <label>Tarih</label>
        <input type="date" class="form-control" name="date" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="closeModal()">İptal</button>
        <button type="submit" class="${type === 'income' ? 'btn-success' : 'btn-danger'}">${type === 'income' ? 'Gelir Ekle' : 'Gider Ekle'}</button>
      </div>
    </form >
  `;
}

async function saveTransaction(event, type) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const transactionData = {
    type: type,
    amount: parseFloat(formData.get('amount')),
    categoryId: parseInt(formData.get('categoryId')),
    description: formData.get('description'),
    date: formData.get('date')
  };

  await window.electronAPI.addTransaction(transactionData);
  transactions = await window.electronAPI.getTransactions();
  await updateBalance();
  closeModal();
  renderTransactions();
}

// Installment Modal
function showAddInstallmentModal() {
  const expenseCategories = categories.filter(c => c.type === 'expense');

  openModal('Yeni Taksit', `
  < form id = "installment-form" onsubmit = "saveInstallment(event)" >
      <div class="form-group">
        <label>Başlık</label>
        <input type="text" class="form-control" name="title" required placeholder="Örn: iPhone 15 Pro">
      </div>
      <div class="form-group">
        <label>Toplam Tutar (€)</label>
        <input type="number" step="0.01" class="form-control" name="totalAmount" required placeholder="0.00">
      </div>
      <div class="form-group">
        <label>Taksit Sayısı</label>
        <input type="number" class="form-control" name="installmentCount" required min="2" max="60" placeholder="12">
      </div>
      <div class="form-group">
        <label>Kategori</label>
        <select class="form-control" name="categoryId">
          <option value="">Kategori seç...</option>
          ${expenseCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Başlangıç Tarihi</label>
        <input type="date" class="form-control" name="startDate" value="${new Date().toISOString().split('T')[0]}" required>
      </div>
      <div class="form-group">
        <label>Açıklama</label>
        <input type="text" class="form-control" name="description" placeholder="Ek bilgi...">
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="closeModal()">İptal</button>
        <button type="submit" class="btn-primary">Taksit Oluştur</button>
      </div>
    </form >
  `);
}

async function saveInstallment(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const installmentData = {
    title: formData.get('title'),
    totalAmount: parseFloat(formData.get('totalAmount')),
    installmentCount: parseInt(formData.get('installmentCount')),
    categoryId: formData.get('categoryId') ? parseInt(formData.get('categoryId')) : null,
    startDate: formData.get('startDate'),
    description: formData.get('description')
  };

  await window.electronAPI.addInstallment(installmentData);
  installments = await window.electronAPI.getInstallments();
  closeModal();
  renderInstallments();
}

// Category Modal
function showAddCategoryModal() {
  openModal('Yeni Kategori', `
  < form id = "category-form" onsubmit = "saveCategory(event)" >
      <div class="form-group">
        <label>Kategori Adı</label>
        <input type="text" class="form-control" name="name" required placeholder="Kategori adı...">
      </div>
      <div class="form-group">
        <label>Tür</label>
        <select class="form-control" name="type" required>
          <option value="expense">💸 Gider</option>
          <option value="income">💰 Gelir</option>
        </select>
      </div>
      <div class="form-group">
        <label>İkon</label>
        <input type="text" class="form-control" name="icon" value="📁" maxlength="2" placeholder="Emoji...">
      </div>
      <div class="form-group">
        <label>Renk</label>
        <input type="color" class="form-control" name="color" value="#6366f1" style="height: 48px; padding: 4px;">
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="closeModal()">İptal</button>
        <button type="submit" class="btn-primary">Kategori Ekle</button>
      </div>
    </form >
  `);
}

async function saveCategory(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const categoryData = {
    name: formData.get('name'),
    type: formData.get('type'),
    icon: formData.get('icon') || '📁',
    color: formData.get('color')
  };

  await window.electronAPI.addCategory(categoryData);
  categories = await window.electronAPI.getCategories();
  closeModal();
  renderCategories();
}

// ============ EVENT LISTENERS ============
function initEventListeners() {
  // Notes
  document.getElementById('add-note-btn').addEventListener('click', showAddNoteModal);
  initNotesFilters();

  // Transactions
  document.getElementById('add-income-btn').addEventListener('click', () => showTransactionModal('income'));
  document.getElementById('add-expense-btn').addEventListener('click', () => showTransactionModal('expense'));

  // Installments
  document.getElementById('add-installment-btn').addEventListener('click', showAddInstallmentModal);

  // Summary
  initSummaryControls();

  // Categories
  document.getElementById('add-category-btn').addEventListener('click', showAddCategoryModal);
}

// ============ UTILITY ============
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============ BALANCE EDIT ============
async function showEditBalanceModal() {
  const currentBalance = await window.electronAPI.getBalance();

  openModal('Bakiye Düzenle', `
    <form id="balance-form" onsubmit="saveBalance(event)">
      <div class="form-group">
        <label>Mevcut Bakiye</label>
        <p style="font-size: 24px; font-weight: 700; color: var(--accent-primary); margin: 8px 0;">${formatCurrency(currentBalance)}</p>
      </div>
      <div class="form-group">
        <label>Yeni Bakiye (€)</label>
        <input type="number" step="0.01" class="form-control" name="balance" value="${currentBalance}" required placeholder="0.00">
      </div>
      <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
        ⚠️ Bu işlem bakiyeyi doğrudan değiştirir. Gelir/gider işlemleri etkilenmez.
      </p>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="closeModal()">İptal</button>
        <button type="submit" class="btn-primary">Bakiyeyi Güncelle</button>
      </div>
    </form>
  `);
}

async function saveBalance(event) {
  event.preventDefault();
  const form = event.target;
  const newBalance = parseFloat(form.balance.value);

  await window.electronAPI.setBalance(newBalance);
  await updateBalance();
  closeModal();

  // Dashboard'daki bakiyeyi de güncelle
  if (currentView === 'dashboard') {
    renderDashboard();
  }
}
