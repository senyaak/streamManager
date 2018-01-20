const electron = require("electron");

const app = electron.app;

const BrowserWindow = electron.BrowserWindow;

let mainWindow;

console.log(`file://${__dirname}/index.html`)

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    //fullscreen:true,
    frame:false,
    resizable:false
  });
  mainWindow.loadURL(`file://${__dirname}/../dist/index.html`);

  // Открываем DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", function() {
    mainWindow = null;
  });
}
app.on("ready", createWindow);
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});
