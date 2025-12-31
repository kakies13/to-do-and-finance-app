const fs = require('fs');
const path = require('path');

class AppDatabase {
    constructor(userDataPath) {
        this.dataPath = path.join(userDataPath, 'app-data.json');
        this.data = this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(this.dataPath)) {
                const content = fs.readFileSync(this.dataPath, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }

        // Default data structure
        return {
            notes: [],
            transactions: [],
            installments: [],
            categories: [
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
            ],
            balance: 0,
            nextId: 100
        };
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2), 'utf8');
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    getNextId() {
        const id = this.data.nextId;
        this.data.nextId++;
        this.saveData();
        return id;
    }

    // ============ NOTES ============
    getNotes() {
        return this.data.notes.sort((a, b) => b.importance - a.importance || new Date(b.updated_at) - new Date(a.updated_at));
    }

    getNotesWithAlarms() {
        return this.data.notes.filter(n => n.alarm_time);
    }

    addNote(note) {
        const newNote = {
            id: this.getNextId(),
            title: note.title,
            content: note.content,
            importance: note.importance,
            alarm_time: note.alarmTime || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        this.data.notes.push(newNote);
        this.saveData();
        return newNote;
    }

    updateNote(note) {
        const index = this.data.notes.findIndex(n => n.id === note.id);
        if (index !== -1) {
            this.data.notes[index] = {
                ...this.data.notes[index],
                title: note.title,
                content: note.content,
                importance: note.importance,
                alarm_time: note.alarmTime || null,
                updated_at: new Date().toISOString()
            };
            this.saveData();
        }
        return note;
    }

    deleteNote(id) {
        this.data.notes = this.data.notes.filter(n => n.id !== id);
        this.saveData();
        return { success: true };
    }

    setAlarm(noteId, alarmTime) {
        const note = this.data.notes.find(n => n.id === noteId);
        if (note) {
            note.alarm_time = alarmTime;
            this.saveData();
        }
        return { success: true };
    }

    clearAlarm(noteId) {
        const note = this.data.notes.find(n => n.id === noteId);
        if (note) {
            note.alarm_time = null;
            this.saveData();
        }
        return { success: true };
    }

    // ============ CATEGORIES ============
    getCategories() {
        return this.data.categories.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    }

    addCategory(category) {
        const newCategory = {
            id: this.getNextId(),
            ...category
        };
        this.data.categories.push(newCategory);
        this.saveData();
        return newCategory;
    }

    deleteCategory(id) {
        this.data.categories = this.data.categories.filter(c => c.id !== id);
        this.saveData();
        return { success: true };
    }

    // ============ TRANSACTIONS ============
    getTransactions() {
        return this.data.transactions.map(t => {
            const category = this.data.categories.find(c => c.id === t.category_id);
            return {
                ...t,
                category_name: category?.name || 'Kategorisiz',
                category_color: category?.color || '#64748b',
                category_icon: category?.icon || '📦'
            };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    addTransaction(transaction) {
        const newTransaction = {
            id: this.getNextId(),
            type: transaction.type,
            amount: transaction.amount,
            category_id: transaction.categoryId,
            description: transaction.description,
            date: transaction.date || new Date().toISOString()
        };
        this.data.transactions.push(newTransaction);

        // Update balance
        const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
        this.data.balance += balanceChange;

        this.saveData();
        return newTransaction;
    }

    deleteTransaction(id) {
        const transaction = this.data.transactions.find(t => t.id === id);
        if (transaction) {
            const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
            this.data.balance += balanceChange;
        }
        this.data.transactions = this.data.transactions.filter(t => t.id !== id);
        this.saveData();
        return { success: true };
    }

    // ============ INSTALLMENTS ============
    getInstallments() {
        return this.data.installments.map(i => {
            const category = this.data.categories.find(c => c.id === i.category_id);
            return {
                ...i,
                category_name: category?.name || 'Kategorisiz',
                category_color: category?.color || '#64748b',
                category_icon: category?.icon || '📦'
            };
        }).sort((a, b) => new Date(a.next_payment_date) - new Date(b.next_payment_date));
    }

    addInstallment(installment) {
        const monthlyAmount = installment.totalAmount / installment.installmentCount;

        // Her ay için ödeme durumunu tutan array (false = ödenmedi, true = ödendi)
        const paidMonths = new Array(installment.installmentCount).fill(false);

        const newInstallment = {
            id: this.getNextId(),
            title: installment.title,
            total_amount: installment.totalAmount,
            installment_count: installment.installmentCount,
            paid_count: 0,
            paid_months: paidMonths,
            monthly_amount: monthlyAmount,
            start_date: installment.startDate,
            next_payment_date: installment.startDate,
            category_id: installment.categoryId,
            description: installment.description,
            created_at: new Date().toISOString()
        };

        this.data.installments.push(newInstallment);
        this.saveData();
        return newInstallment;
    }

    updateInstallment(installment) {
        const index = this.data.installments.findIndex(i => i.id === installment.id);
        if (index !== -1) {
            const oldInst = this.data.installments[index];
            const newCount = installment.installmentCount;
            const oldCount = oldInst.installment_count;

            // paid_months array'ini yeni taksit sayısına göre ayarla
            let paidMonths = oldInst.paid_months || [];
            if (newCount > oldCount) {
                // Yeni aylar ekle
                paidMonths = [...paidMonths, ...new Array(newCount - oldCount).fill(false)];
            } else if (newCount < oldCount) {
                // Fazla ayları sil
                paidMonths = paidMonths.slice(0, newCount);
            }

            const paidCount = paidMonths.filter(p => p).length;

            this.data.installments[index] = {
                ...oldInst,
                title: installment.title,
                total_amount: installment.totalAmount,
                installment_count: newCount,
                monthly_amount: installment.totalAmount / newCount,
                category_id: installment.categoryId,
                description: installment.description,
                paid_months: paidMonths,
                paid_count: paidCount
            };
            this.saveData();
        }
        return installment;
    }

    deleteInstallment(id) {
        this.data.installments = this.data.installments.filter(i => i.id !== id);
        this.saveData();
        return { success: true };
    }

    // Belirli bir ayın ödeme durumunu toggle et
    toggleInstallmentMonth(id, monthIndex) {
        const installment = this.data.installments.find(i => i.id === id);

        if (!installment) {
            return { success: false, message: 'Taksit bulunamadı' };
        }

        // paid_months array yoksa oluştur
        if (!installment.paid_months) {
            installment.paid_months = new Array(installment.installment_count).fill(false);
        }

        // Ay geçerli mi?
        if (monthIndex < 0 || monthIndex >= installment.installment_count) {
            return { success: false, message: 'Geçersiz ay' };
        }

        // Durumu toggle et
        const wasPayd = installment.paid_months[monthIndex];
        installment.paid_months[monthIndex] = !wasPayd;

        // paid_count güncelle
        installment.paid_count = installment.paid_months.filter(p => p).length;

        // next_payment_date güncelle - ilk ödenmemiş ayın tarihini bul
        const startDate = new Date(installment.start_date);
        let nextPaymentFound = false;
        for (let i = 0; i < installment.installment_count; i++) {
            if (!installment.paid_months[i]) {
                const nextDate = new Date(startDate);
                nextDate.setMonth(nextDate.getMonth() + i);
                installment.next_payment_date = nextDate.toISOString().split('T')[0];
                nextPaymentFound = true;
                break;
            }
        }
        // Eğer hepsi ödenmişse, son aydan sonraki tarihi göster
        if (!nextPaymentFound) {
            const lastDate = new Date(startDate);
            lastDate.setMonth(lastDate.getMonth() + installment.installment_count);
            installment.next_payment_date = lastDate.toISOString().split('T')[0];
        }

        // Eğer ödeme yapılıyorsa (yeşil -> kırmızı) işlem ekle
        if (!wasPayd) {
            this.addTransaction({
                type: 'expense',
                amount: installment.monthly_amount,
                categoryId: installment.category_id,
                description: `Taksit Ödemesi: ${installment.title} (${monthIndex + 1}. ay)`,
                date: new Date().toISOString()
            });
        }

        this.saveData();
        return {
            success: true,
            paid: installment.paid_months[monthIndex],
            paidCount: installment.paid_count,
            remaining: installment.installment_count - installment.paid_count
        };
    }

    payInstallment(id) {
        const installment = this.data.installments.find(i => i.id === id);

        if (installment && installment.paid_count < installment.installment_count) {
            installment.paid_count += 1;

            // paid_months array varsa güncelle
            if (installment.paid_months) {
                const firstUnpaid = installment.paid_months.findIndex(p => !p);
                if (firstUnpaid !== -1) {
                    installment.paid_months[firstUnpaid] = true;
                }
            }

            // Calculate next payment date
            const currentDate = new Date(installment.next_payment_date);
            currentDate.setMonth(currentDate.getMonth() + 1);
            installment.next_payment_date = currentDate.toISOString().split('T')[0];

            // Add transaction for the payment
            this.addTransaction({
                type: 'expense',
                amount: installment.monthly_amount,
                categoryId: installment.category_id,
                description: `Taksit Ödemesi: ${installment.title} (${installment.paid_count}/${installment.installment_count})`,
                date: new Date().toISOString()
            });

            this.saveData();
            return { success: true, paidCount: installment.paid_count, remaining: installment.installment_count - installment.paid_count };
        }

        return { success: false, message: 'Tüm taksitler ödenmiş' };
    }

    // ============ SUMMARY ============
    getMonthlySummary(year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const monthlyTransactions = this.data.transactions.filter(t => {
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
        const categoryTotals = {};
        monthlyTransactions.forEach(t => {
            const key = `${t.category_id}-${t.type}`;
            if (!categoryTotals[key]) {
                const category = this.data.categories.find(c => c.id === t.category_id);
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

        const byCategory = Object.values(categoryTotals).sort((a, b) => b.total - a.total);

        // Add category info to transactions
        const transactionsWithCategories = monthlyTransactions.map(t => {
            const category = this.data.categories.find(c => c.id === t.category_id);
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
        return this.data.balance;
    }

    setBalance(amount) {
        this.data.balance = amount;
        this.saveData();
        return { success: true, balance: amount };
    }
}

module.exports = AppDatabase;
