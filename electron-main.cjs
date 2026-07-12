const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const _ = require("lodash");

const APP_CONFIG = {
  PORT: 3002,
  HOST_URL: "http://localhost:3002",
  APP_TITLE: "AI Video Factory",
  DB_NAME: "database.db",
  DATA_DIR: "data",
  SINGLE_INSTANCE_KEY: "ai-video-factory-desktop",
  SIGINT: "SIGINT",
  SERVER_FILE: "./dist/server.cjs",
  ICON_PATH: "assets/icon.png",
  USER_DATA: "userData",
  PRODUCTION: "production",
  TIMEOUT_BOOT: 1500,
  TIMEOUT_RETRY: 1000,
  TIMEOUT_QUIT: 1000,
  WIDTH: 1280,
  HEIGHT: 800,
  ENV_APP_DATA_DIR: "APP_DATA_DIR",
  ENV_ELECTRON_RUNNING: "ELECTRON_RUNNING",
  ENV_NODE_ENV: "NODE_ENV",
  WINDOW_ALL_CLOSED: "window-all-closed",
  SECOND_INSTANCE: "second-instance",
  CLOSED: "closed",
  ACTIVATE: "activate",
};

const MESSAGES = {
  INIT_DB_ERR: "Lỗi sao chép database.db:",
  START_SERVER_ERR: "Lỗi khởi động Express server:",
  SERVER_START_FAIL_TITLE: "Lỗi Khởi Động Hệ Thống",
  SERVER_START_FAIL_MSG: "Không thể khởi động máy chủ nội bộ. Chi tiết lỗi:\n",
  CONNECT_FAIL_TITLE: "Lỗi Kết Nối",
  CONNECT_FAIL_MSG: "Không thể kết nối đến máy chủ ứng dụng nội bộ (port 3002). Vui lòng thử khởi động lại ứng dụng.",
  RETRY_MSG: "Thử tải lại trang do server chưa sẵn sàng...",
  LOG_STARTING: "Khởi động Express server từ dist/server.cjs...",
  LOG_COPYING_DB: "Sao chép cơ sở dữ liệu gốc sang thư mục AppData...",
  LOG_SHUTDOWN: "Tất cả cửa sổ đã đóng. Đang dọn dẹp tiến trình...",
};

const userDataPath = app.getPath(APP_CONFIG.USER_DATA);
process.env[APP_CONFIG.ENV_APP_DATA_DIR] = userDataPath;
process.env[APP_CONFIG.ENV_ELECTRON_RUNNING] = "true";
process.env[APP_CONFIG.ENV_NODE_ENV] = APP_CONFIG.PRODUCTION;

let mainWindow = null;
let serverStarted = false;

function appLog(...args) {
  console.log(...args);
}

function appLogError(...args) {
  console.error(...args);
}

function setupInitialDatabase() {
  const dataDir = path.join(userDataPath, APP_CONFIG.DATA_DIR);
  const destDbPath = path.join(dataDir, APP_CONFIG.DB_NAME);
  
  if (_.isEqual(fs.existsSync(destDbPath), false)) {
    if (_.isEqual(fs.existsSync(dataDir), false)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const srcDbPath = path.join(__dirname, APP_CONFIG.DB_NAME);
    if (fs.existsSync(srcDbPath)) {
      appLog(MESSAGES.LOG_COPYING_DB);
      try {
        fs.copyFileSync(srcDbPath, destDbPath);
      } catch (err) {
        appLogError(MESSAGES.INIT_DB_ERR, err);
      }
    }
  }
}

function startBackendServer() {
  if (_.isEqual(serverStarted, true)) {
    return;
  }
  try {
    setupInitialDatabase();
    appLog(MESSAGES.LOG_STARTING);
    require(APP_CONFIG.SERVER_FILE);
    serverStarted = true;
  } catch (error) {
    appLogError(MESSAGES.START_SERVER_ERR, error);
    dialog.showErrorBox(
      MESSAGES.SERVER_START_FAIL_TITLE,
      MESSAGES.SERVER_START_FAIL_MSG + error.message
    );
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: APP_CONFIG.WIDTH,
    height: APP_CONFIG.HEIGHT,
    title: APP_CONFIG.APP_TITLE,
    icon: path.join(__dirname, APP_CONFIG.ICON_PATH),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  setTimeout(() => {
    mainWindow.loadURL(APP_CONFIG.HOST_URL).catch((err) => {
      appLog(MESSAGES.RETRY_MSG, err.message);
      setTimeout(() => {
        mainWindow.loadURL(APP_CONFIG.HOST_URL).catch((reloadErr) => {
          dialog.showErrorBox(
            MESSAGES.CONNECT_FAIL_TITLE,
            MESSAGES.CONNECT_FAIL_MSG
          );
        });
      }, APP_CONFIG.TIMEOUT_RETRY);
    });
  }, APP_CONFIG.TIMEOUT_BOOT);

  mainWindow.on(APP_CONFIG.CLOSED, () => {
    mainWindow = null;
  });
}

const additionalData = { myKey: APP_CONFIG.SINGLE_INSTANCE_KEY };
const gotTheLock = app.requestSingleInstanceLock(additionalData);

if (_.isEqual(gotTheLock, false)) {
  app.quit();
} else {
  app.on(APP_CONFIG.SECOND_INSTANCE, (event, commandLine, workingDirectory, additionalData) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    startBackendServer();
    createWindow();

    app.on(APP_CONFIG.ACTIVATE, () => {
      if (_.isEqual(BrowserWindow.getAllWindows().length, 0)) {
        createWindow();
      }
    });
  });
}

app.on(APP_CONFIG.WINDOW_ALL_CLOSED, () => {
  appLog(MESSAGES.LOG_SHUTDOWN);
  process.emit(APP_CONFIG.SIGINT);
  
  setTimeout(() => {
    app.quit();
  }, APP_CONFIG.TIMEOUT_QUIT);
});
