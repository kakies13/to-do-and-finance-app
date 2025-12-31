// ============ LOCAL STORAGE DATABASE ============
class LocalDatabase {
  constructor() {
    this.init();
  }

  init() {
    // Initialize data structures if they don't exist
    if (!localStorage.getItem('notes')) {
      localStorage.setItem('notes', JSON.stringify([]));
    }
    if (!localStorage.getItem('transactions')) {
      localStorage.setItem('transactions', JSON.stringify([]));
    }
    if (!localStorage.getItem('installments')) {
      localStorage.setItem('installments', JSON.stringify([]));
    }
    if (!localStorage.getItem('categories')) {
      const defaultCategories = [
        { id: 1, name: 'Maaş', type: 'income', color: '#10b981', icon: '💰' },
        { id: 2, name: 'Ek Gelir', type: 'income', color: '#22c55e', icon: '💵' },
        { id: 3, name: 'Yatırım Geliri', type: 'income', color: '#14b8a6', icon: '📈' },
        { id: 4, name: 'Market', type: 'expense', color: '#f43f5e', icon: '🛒' },
        { id: 5, name: 'Kira', type: 'expense', color: '#ef4444', icon: '🏠' },
        { id: 6, name: 'Faturalar', type: 'expense', color: '#f97316', icon: '📄' },
        { id: 7, name: 'Ulaşım', type: 'expense', color: '#eab308', icon: '🚗' },
        { id: 8, name: 'Sağlık', type: 'expense', color: '#ec4899', icon: '🏥' },
        { id: 9, name: 'Eğlence', type: 'expense', color: '#8b5cf6', icon: '🎬' },
        { id: 10, name: 'Giyim', type: 'expense', color: '#a855f7', icon: '👕' },
        { id: 11, name: 'Teknoloji', type: 'expense', color: '#6366f1', icon: '💻' },
        { id: 12, name: 'Diğer', type: 'expense', color: '#64748b', icon: '📦' }
      ];
      localStorage.setItem('categories', JSON.stringify(defaultCategories));
    }
    if (!localStorage.getItem('balance')) {
      localStorage.setItem('balance', '0');
    }
    if (!localStorage.getItem('nextId')) {
      localStorage.setItem('nextId', '100');
    }
  }

  getNextId() {
    const id = parseInt(localStorage.getItem('nextId'));
    localStorage.setItem('nextId', String(id + 1));
    return id;
  }

  // Notes
  getNotes() {
    const notes = JSON.parse(localStorage.getItem('notes'));
    return notes.sort((a, b) => b.importance - a.importance || new Date(b.updated_at) - new Date(a.updated_at));
  }

  addNote(note) {
    const notes = this.getNotes();
    const newNote = {
      id: this.getNextId(),
      title: note.title,
      content: note.content,
      importance: note.importance,
      alarm_time: note.alarmTime || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    notes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    return newNote;
  }

  updateNote(note) {
    const notes = this.getNotes();
    const index = notes.findIndex(n => n.id === note.id);
    if (index !== -1) {
      notes[index] = {
        ...notes[index],
        title: note.title,
        content: note.content,
        importance: note.importance,
        alarm_time: note.alarmTime || null,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('notes', JSON.stringify(notes));
    }
    return note;
  }

  deleteNote(id) {
    const notes = this.getNotes().filter(n => n.id !== id);
    localStorage.setItem('notes', JSON.stringify(notes));
    return { success: true };
  }

  setAlarm(noteId, alarmTime) {
    const notes = this.getNotes();
    const note = notes.find(n => n.id === noteId);
    if (note) {
      note.alarm_time = alarmTime;
      localStorage.setItem('notes', JSON.stringify(notes));
    }
    return { success: true };
  }

  clearAlarm(noteId) {
    const notes = this.getNotes();
    const note = notes.find(n => n.id === noteId);
    if (note) {
      note.alarm_time = null;
      localStorage.setItem('notes', JSON.stringify(notes));
    }
    return { success: true };
  }

  // Categories
  getCategories() {
    return JSON.parse(localStorage.getItem('categories'));
  }

  addCategory(category) {
    const categories = this.getCategories();
    const newCategory = {
      id: this.getNextId(),
      ...category
    };
    categories.push(newCategory);
    localStorage.setItem('categories', JSON.stringify(categories));
    return newCategory;
  }

  deleteCategory(id) {
    const categories = this.getCategories().filter(c => c.id !== id);
    localStorage.setItem('categories', JSON.stringify(categories));
    return { success: true };
  }

  // Transactions
  getTransactions() {
    const transactions = JSON.parse(localStorage.getItem('transactions'));
    const categories = this.getCategories();

    return transactions.map(t => {
      const category = categories.find(c => c.id === t.category_id);
      return {
        ...t,
        category_name: category?.name || 'Kategorisiz',
        category_color: category?.color || '#64748b',
        category_icon: category?.icon || '📦'
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  addTransaction(transaction) {
    const transactions = JSON.parse(localStorage.getItem('transactions'));
    const newTransaction = {
      id: this.getNextId(),
      type: transaction.type,
      amount: transaction.amount,
      category_id: transaction.categoryId,
      description: transaction.description,
      date: transaction.date || new Date().toISOString()
    };
    transactions.push(newTransaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Update balance
    const currentBalance = parseFloat(localStorage.getItem('balance'));
    const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
    localStorage.setItem('balance', String(currentBalance + balanceChange));

    return newTransaction;
  }

  deleteTransaction(id) {
    const transactions = JSON.parse(localStorage.getItem('transactions'));
    const transaction = transactions.find(t => t.id === id);

    if (transaction) {
      const currentBalance = parseFloat(localStorage.getItem('balance'));
      const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
      localStorage.setItem('balance', String(currentBalance + balanceChange));
    }

    const filtered = transactions.filter(t => t.id !== id);
    localStorage.setItem('transactions', JSON.stringify(filtered));
    return { success: true };
  }

  // Installments
  getInstallments() {
    const installments = JSON.parse(localStorage.getItem('installments'));
    const categories = this.getCategories();

    return installments.map(i => {
      const category = categories.find(c => c.id === i.category_id);
      return {
        ...i,
        category_name: category?.name || 'Kategorisiz',
        category_color: category?.color || '#64748b',
        category_icon: category?.icon || '📦'
      };
    }).sort((a, b) => new Date(a.next_payment_date) - new Date(b.next_payment_date));
  }

  addInstallment(installment) {
    const installments = JSON.parse(localStorage.getItem('installments'));
    const monthlyAmount = installment.totalAmount / installment.installmentCount;

    const newInstallment = {
      id: this.getNextId(),
      title: installment.title,
      total_amount: installment.totalAmount,
      installment_count: installment.installmentCount,
      paid_count: 0,
      monthly_amount: monthlyAmount,
      start_date: installment.startDate,
      next_payment_date: installment.startDate,
      category_id: installment.categoryId,
      description: installment.description,
      created_at: new Date().toISOString()
    };

    installments.push(newInstallment);
    localStorage.setItem('installments', JSON.stringify(installments));
    return newInstallment;
  }

  deleteInstallment(id) {
    const installments = JSON.parse(localStorage.getItem('installments')).filter(i => i.id !== id);
    localStorage.setItem('installments', JSON.stringify(installments));
    return { success: true };
  }

  payInstallment(id) {
    const installments = JSON.parse(localStorage.getItem('installments'));
    const installment = installments.find(i => i.id === id);

    if (installment && installment.paid_count < installment.installment_count) {
      installment.paid_count += 1;

      // Calculate next payment date
      const currentDate = new Date(installment.next_payment_date);
      currentDate.setMonth(currentDate.getMonth() + 1);
      installment.next_payment_date = currentDate.toISOString().split('T')[0];

      localStorage.setItem('installments', JSON.stringify(installments));

      // Add transaction
      this.addTransaction({
        type: 'expense',
        amount: installment.monthly_amount,
        categoryId: installment.category_id,
        description: `Taksit Ödemesi: ${installment.title} (${installment.paid_count}/${installment.installment_count})`,
        date: new Date().toISOString()
      });

      return { success: true, paidCount: installment.paid_count, remaining: installment.installment_count - installment.paid_count };
    }

    return { success: false, message: 'Tüm taksitler ödenmiş' };
  }

  // Summary
  getMonthlySummary(year, month) {
    const transactions = JSON.parse(localStorage.getItem('transactions'));
    const categories = this.getCategories();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= startDate && date <= endDate;
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Group by category
    const byCategory = [];
    const categoryTotals = {};

    monthlyTransactions.forEach(t => {
      const key = `${t.category_id}-${t.type}`;
      if (!categoryTotals[key]) {
        const category = categories.find(c => c.id === t.category_id);
        categoryTotals[key] = {
          name: category?.name || 'Kategorisiz',
          color: category?.color || '#64748b',
          icon: category?.icon || '📦',
          type: t.type,
          total: 0
        };
      }
      categoryTotals[key].total += t.amount;
    });

    Object.values(categoryTotals).forEach(cat => byCategory.push(cat));
    byCategory.sort((a, b) => b.total - a.total);

    // Add category info to transactions
    const transactionsWithCategories = monthlyTransactions.map(t => {
      const category = categories.find(c => c.id === t.category_id);
      return {
        ...t,
        category_name: category?.name || 'Kategorisiz',
        category_color: category?.color || '#64748b',
        category_icon: category?.icon || '📦'
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      income,
      expense,
      net: income - expense,
      byCategory,
      transactions: transactionsWithCategories
    };
  }

  getBalance() {
    return parseFloat(localStorage.getItem('balance'));
  }
}

// ============ INITIALIZE DATABASE ============
const db = new LocalDatabase();

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
  initNavigation();
  initModals();
  loadAllData();
  initEventListeners();
  startAlarmChecker();
});

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

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });

  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(`${viewName}-view`).classList.add('active');

  refreshCurrentView();
}

function loadAllData() {
  notes = db.getNotes();
  transactions = db.getTransactions();
  installments = db.getInstallments();
  categories = db.getCategories();
  updateBalance();
  refreshCurrentView();
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

function updateBalance() {
  const balance = db.getBalance();
  document.getElementById('header-balance').textContent = formatCurrency(balance);
  document.getElementById('dash-balance').textContent = formatCurrency(balance);
}

// ============ ALARM CHECKER ============
function startAlarmChecker() {
  setInterval(() => {
    const now = new Date();
    notes.forEach(note => {
      if (note.alarm_time) {
        const alarmTime = new Date(note.alarm_time);
        const diff = alarmTime - now;
        if (diff >= 0 && diff <= 60000) {
          showToast(`🔔 Hatırlatıcı: ${note.title}`, 'warning');
          // Request notification permission and show
          if (Notification.permission === 'granted') {
            new Notification(`🔔 Hatırlatıcı: ${note.title}`, {
              body: note.content?.substring(0, 100) || '',
              icon: '📝'
            });
          }
        }
      }
    });
  }, 60000);

  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ============ TOAST ============
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', warning: '⚠️' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastSlide 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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
function renderDashboard() {
  const now = new Date();
  const summary = db.getMonthlySummary(now.getFullYear(), now.getMonth() + 1);

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

function deleteNote(id) {
  if (confirm('Bu notu silmek istediğinize emin misiniz?')) {
    db.deleteNote(id);
    notes = db.getNotes();
    renderNotes();
    showToast('Not silindi');
  }
}

function clearAlarm(noteId) {
  db.clearAlarm(noteId);
  notes = db.getNotes();
  renderNotes();
  showToast('Alarm kaldırıldı');
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

function deleteTransaction(id) {
  if (confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
    db.deleteTransaction(id);
    transactions = db.getTransactions();
    updateBalance();
    renderTransactions();
    showToast('İşlem silindi');
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
    const progress = (inst.paid_count / inst.installment_count) * 100;
    const remaining = inst.installment_count - inst.paid_count;

    return `
      <div class="installment-card" data-id="${inst.id}">
        <div class="installment-header">
          <div>
            <h3 class="installment-title">${escapeHtml(inst.title)}</h3>
            <div class="installment-category">${inst.category_icon || '📦'} ${inst.category_name || 'Kategorisiz'}</div>
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
          <div class="progress-text">
            <span>✓ ${inst.paid_count} ödendi</span>
            <span>${remaining} kaldı</span>
          </div>
        </div>
        
        <div class="installment-actions">
          ${remaining > 0 ? `<button class="btn-success" onclick="payInstallment(${inst.id})">💳 Taksit Öde</button>` : ''}
          <button class="btn-secondary" onclick="deleteInstallment(${inst.id})">🗑️ Sil</button>
        </div>
      </div>
    `;
  }).join('');
}

function payInstallment(id) {
  const result = db.payInstallment(id);
  if (result.success) {
    installments = db.getInstallments();
    transactions = db.getTransactions();
    updateBalance();
    renderInstallments();
    showToast(`Taksit ödendi! Kalan: ${result.remaining}`);
  } else {
    showToast(result.message, 'error');
  }
}

function deleteInstallment(id) {
  if (confirm('Bu taksiti silmek istediğinize emin misiniz?')) {
    db.deleteInstallment(id);
    installments = db.getInstallments();
    renderInstallments();
    showToast('Taksit silindi');
  }
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

function renderSummary() {
  document.getElementById('current-month').textContent = `${monthNames[currentMonth - 1]} ${currentYear}`;

  const summary = db.getMonthlySummary(currentYear, currentMonth);

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

function deleteCategory(id) {
  if (confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
    db.deleteCategory(id);
    categories = db.getCategories();
    renderCategories();
    showToast('Kategori silindi');
  }
}

// ============ MODALS ============
const modalOverlay = document.getElementById('modal-overlay');
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
    <form id="note-form" onsubmit="saveNote(event, ${note?.id || 'null'})">
      <div class="form-group">
        <label>Başlık</label>
        <input type="text" class="form-control" name="title" value="${escapeHtml(note?.title || '')}" required placeholder="Not başlığı...">
      </div>
      <div class="form-group">
        <label>İçerik</label>
        <textarea class="form-control" name="content" placeholder="Not içeriği...">${escapeHtml(note?.content || '')}</textarea>
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
    </form>
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

function saveNote(event, id = null) {
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
    db.updateNote(noteData);
    showToast('Not güncellendi');
  } else {
    db.addNote(noteData);
    showToast('Not eklendi');
  }

  notes = db.getNotes();
  closeModal();
  renderNotes();
}

// Set Alarm Modal
function showSetAlarmModal(noteId) {
  openModal('Alarm Ayarla', `
    <form id="alarm-form" onsubmit="setAlarm(event, ${noteId})">
      <div class="form-group">
        <label>Alarm Zamanı</label>
        <input type="datetime-local" class="form-control" name="alarmTime" required>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="closeModal()">İptal</button>
        <button type="submit" class="btn-primary">Ayarla</button>
      </div>
    </form>
  `);
}

function setAlarm(event, noteId) {
  event.preventDefault();
  const alarmTime = event.target.alarmTime.value;
  db.setAlarm(noteId, alarmTime);
  notes = db.getNotes();
  closeModal();
  renderNotes();
  showToast('Alarm ayarlandı');
}

// Transaction Modal
function showTransactionModal(type) {
  openModal(type === 'income' ? 'Gelir Ekle' : 'Gider Ekle', getTransactionFormHTML(type));
}

function getTransactionFormHTML(type) {
  const typeCategories = categories.filter(c => c.type === type);

  return `
    <form id="transaction-form" onsubmit="saveTransaction(event, '${type}')">
      <div class="form-group">
        <label>Tutar (₺)</label>
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
    </form>
  `;
}

function saveTransaction(event, type) {
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

  db.addTransaction(transactionData);
  transactions = db.getTransactions();
  updateBalance();
  closeModal();
  renderTransactions();
  showToast(type === 'income' ? 'Gelir eklendi' : 'Gider eklendi');
}

// Installment Modal
function showAddInstallmentModal() {
  const expenseCategories = categories.filter(c => c.type === 'expense');

  openModal('Yeni Taksit', `
    <form id="installment-form" onsubmit="saveInstallment(event)">
      <div class="form-group">
        <label>Başlık</label>
        <input type="text" class="form-control" name="title" required placeholder="Örn: iPhone 15 Pro">
      </div>
      <div class="form-group">
        <label>Toplam Tutar (₺)</label>
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
    </form>
  `);
}

function saveInstallment(event) {
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

  db.addInstallment(installmentData);
  installments = db.getInstallments();
  closeModal();
  renderInstallments();
  showToast('Taksit oluşturuldu');
}

// Category Modal
function showAddCategoryModal() {
  openModal('Yeni Kategori', `
    <form id="category-form" onsubmit="saveCategory(event)">
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
    </form>
  `);
}

function saveCategory(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const categoryData = {
    name: formData.get('name'),
    type: formData.get('type'),
    icon: formData.get('icon') || '📁',
    color: formData.get('color')
  };

  db.addCategory(categoryData);
  categories = db.getCategories();
  closeModal();
  renderCategories();
  showToast('Kategori eklendi');
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
