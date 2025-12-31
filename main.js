const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const Database = require('./database');

let mainWindow;
let db;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        frame: false,
        transparent: false,
        backgroundColor: '#0a0a0f',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets', 'icon.png')
    });

    mainWindow.loadFile('index.html');

    // Development: Open DevTools
    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    db = new Database(app.getPath('userData'));
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    // Check for alarms every minute
    setInterval(checkAlarms, 60000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Window controls
ipcMain.on('minimize-window', () => mainWindow.minimize());
ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});
ipcMain.on('close-window', () => mainWindow.close());

// ============ NOTES IPC ============
ipcMain.handle('get-notes', async () => {
    return db.getNotes();
});

ipcMain.handle('add-note', async (event, note) => {
    return db.addNote(note);
});

ipcMain.handle('update-note', async (event, note) => {
    return db.updateNote(note);
});

ipcMain.handle('delete-note', async (event, id) => {
    return db.deleteNote(id);
});

// ============ FINANCE IPC ============
ipcMain.handle('get-transactions', async () => {
    return db.getTransactions();
});

ipcMain.handle('add-transaction', async (event, transaction) => {
    return db.addTransaction(transaction);
});

ipcMain.handle('delete-transaction', async (event, id) => {
    return db.deleteTransaction(id);
});

ipcMain.handle('get-categories', async () => {
    return db.getCategories();
});

ipcMain.handle('add-category', async (event, category) => {
    return db.addCategory(category);
});

ipcMain.handle('delete-category', async (event, id) => {
    return db.deleteCategory(id);
});

// ============ INSTALLMENTS IPC ============
ipcMain.handle('get-installments', async () => {
    return db.getInstallments();
});

ipcMain.handle('add-installment', async (event, installment) => {
    return db.addInstallment(installment);
});

ipcMain.handle('update-installment', async (event, installment) => {
    return db.updateInstallment(installment);
});

ipcMain.handle('delete-installment', async (event, id) => {
    return db.deleteInstallment(id);
});

ipcMain.handle('pay-installment', async (event, id) => {
    return db.payInstallment(id);
});

ipcMain.handle('toggle-installment-month', async (event, id, monthIndex) => {
    return db.toggleInstallmentMonth(id, monthIndex);
});

// ============ SUMMARY IPC ============
ipcMain.handle('get-monthly-summary', async (event, year, month) => {
    return db.getMonthlySummary(year, month);
});

ipcMain.handle('get-balance', async () => {
    return db.getBalance();
});

ipcMain.handle('set-balance', async (event, amount) => {
    return db.setBalance(amount);
});

// ============ ALARMS ============
function checkAlarms() {
    const notes = db.getNotesWithAlarms();
    const now = new Date();

    notes.forEach(note => {
        const alarmTime = new Date(note.alarm_time);
        const diff = alarmTime - now;

        // If alarm is within the next minute
        if (diff >= 0 && diff <= 60000) {
            showNotification(note.title, note.content);
        }
    });
}

function showNotification(title, body) {
    new Notification({
        title: `🔔 Hatırlatıcı: ${title}`,
        body: body.substring(0, 100) + (body.length > 100 ? '...' : ''),
        icon: path.join(__dirname, 'assets', 'icon.png')
    }).show();
}

ipcMain.handle('set-alarm', async (event, noteId, alarmTime) => {
    return db.setAlarm(noteId, alarmTime);
});

ipcMain.handle('clear-alarm', async (event, noteId) => {
    return db.clearAlarm(noteId);
});
