// Test Electron
const electron = require('electron');
console.log('Electron module:', typeof electron);
console.log('App:', typeof electron.app);
console.log('BrowserWindow:', typeof electron.BrowserWindow);

const { app, BrowserWindow } = electron;
console.log('Destructured app:', app);

if (app) {
    app.whenReady().then(() => {
        console.log('App is ready!');
        const win = new BrowserWindow({ width: 800, height: 600 });
        win.loadFile('index.html');
    });
}
