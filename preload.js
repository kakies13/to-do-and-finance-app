const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),

    // Notes
    getNotes: () => ipcRenderer.invoke('get-notes'),
    addNote: (note) => ipcRenderer.invoke('add-note', note),
    updateNote: (note) => ipcRenderer.invoke('update-note', note),
    deleteNote: (id) => ipcRenderer.invoke('delete-note', id),

    // Alarms
    setAlarm: (noteId, alarmTime) => ipcRenderer.invoke('set-alarm', noteId, alarmTime),
    clearAlarm: (noteId) => ipcRenderer.invoke('clear-alarm', noteId),

    // Finance
    getTransactions: () => ipcRenderer.invoke('get-transactions'),
    addTransaction: (transaction) => ipcRenderer.invoke('add-transaction', transaction),
    deleteTransaction: (id) => ipcRenderer.invoke('delete-transaction', id),

    // Categories
    getCategories: () => ipcRenderer.invoke('get-categories'),
    addCategory: (category) => ipcRenderer.invoke('add-category', category),
    deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),

    // Installments
    getInstallments: () => ipcRenderer.invoke('get-installments'),
    addInstallment: (installment) => ipcRenderer.invoke('add-installment', installment),
    updateInstallment: (installment) => ipcRenderer.invoke('update-installment', installment),
    deleteInstallment: (id) => ipcRenderer.invoke('delete-installment', id),
    payInstallment: (id) => ipcRenderer.invoke('pay-installment', id),
    toggleInstallmentMonth: (id, monthIndex) => ipcRenderer.invoke('toggle-installment-month', id, monthIndex),

    // Summary
    getMonthlySummary: (year, month) => ipcRenderer.invoke('get-monthly-summary', year, month),
    getBalance: () => ipcRenderer.invoke('get-balance'),
    setBalance: (amount) => ipcRenderer.invoke('set-balance', amount)
});
