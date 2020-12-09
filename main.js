// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const dialog = require('electron').dialog
const { autoUpdater } = require('electron-updater')
let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  mainWindow.setMenu(null)
  // Open the DevTools.
  mainWindow.webContents.openDevTools()
  updateHandle()


  const { globalShortcut } = require('electron')
  globalShortcut.register('f12', (event, arg) => {
    if (mainWindow != null) {
      mainWindow.openDevTools();
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


// 检测更新，在你想要检查更新的时候执行，renderer事件触发后的操作自行编写
function updateHandle() {
  let message = {
    error: '检查更新出错',
    checking: '正在检查更新……',
    updateAva: '检测到新版本，正在下载……',
    updateNotAva: '现在使用的就是最新版本，不用更新',
  };
  const os = require('os')
  autoUpdater.autoDownload = false

  ipcMain.on("checkForUpdate", ()=>{
    //执行自动更新检查
    autoUpdater.checkForUpdates();
  })

  ipcMain.on("isUpdateNow", ()=>{
    //执行自动更新检查
    autoUpdater.quitAndInstall();
  })

  // 手动下载更新文件
  ipcMain.on('confirm-downloadUpdate', () => {
    autoUpdater.downloadUpdate()
  })
 
  const uploadUrl = 'http://172.16.0.34:8888/electron/helloworld/'
  autoUpdater.setFeedURL(uploadUrl);
  autoUpdater.on('error', function (error) {
    sendUpdateMessage(message.error)
  });
  autoUpdater.on('check-for-update', function () {
    sendUpdateMessage(message.checking)
  });
  autoUpdater.on('update-available', function (info) {
    mainWindow.webContents.send('update_available')
    sendUpdateMessage(message.updateAva)
  });
  autoUpdater.on('update-not-available', function (info) {
    sendUpdateMessage(message.updateNotAva)
  });
 
  // 更新下载进度事件
  autoUpdater.on('download-progress', function (progressObj) {
    mainWindow.webContents.send('downloadProgress', progressObj)
    if ( progressObj.percent === 100 ) {
      mainWindow.webContents.send('update_downloaded')
      autoUpdater.quitAndInstall();
    }
  })
   //安装包下载完成
  autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
    // ipcMain.on('isUpdateNow', (e, arg) => {
    //   console.log("开始更新123");
    //   autoUpdater.quitAndInstall();
    // });
    autoUpdater.quitAndInstall();
    mainWindow.webContents.send('update_downloaded')
  });
 

}
 
// 通过main进程发送事件给renderer进程，提示更新信息
function sendUpdateMessage(text) {
  mainWindow.webContents.send('message', text)
}


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
