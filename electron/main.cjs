const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const { exec } = require("child_process");
const { APP_CONFIG, MESSAGES, PLATFORMS, COMMANDS, ENV_VALUES } = require("./config.cjs");

const userDataPath = app.getPath(APP_CONFIG.USER_DATA);
process.env[APP_CONFIG.ENV_APP_DATA_DIR] = userDataPath;
process.env[APP_CONFIG.ENV_ELECTRON_RUNNING] = ENV_VALUES.TRUE;
process.env[APP_CONFIG.ENV_NODE_ENV] = APP_CONFIG.PRODUCTION;

if (app.isPackaged) {
  process.env.PATH = `${process.resourcesPath}${path.delimiter}${process.env.PATH}`;
}

let mainWindow = null;
let serverStarted = false;

function appLog(...args) {
  console.log(...args);
}

function appLogError(...args) {
  console.error(...args);
  try {
    const logPath = path.join(userDataPath, APP_CONFIG.CRASH_LOG);
    const logData = _.join(args, APP_CONFIG.SPACE) + APP_CONFIG.NEWLINE;
    fs.appendFileSync(logPath, logData);
  } catch (error) {
    _.noop(error);
  }
}

function handleUncaughtException(err) {
  appLogError(MESSAGES.UNCAUGHT_ERR, err.stack || err);
}

function handleUnhandledRejection(reason, promise) {
  appLogError(MESSAGES.UNHANDLED_REJECT, promise, MESSAGES.REASON, reason);
}

process.on(APP_CONFIG.UNCAUGHT_EXCEPTION, handleUncaughtException);
process.on(APP_CONFIG.UNHANDLED_REJECTION, handleUnhandledRejection);

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function isFileMissing(filePath) {
  return !fs.existsSync(filePath);
}

function setupInitialDatabase() {
  const dataDir = path.join(userDataPath, APP_CONFIG.DATA_DIR);
  const destDbPath = path.join(dataDir, APP_CONFIG.DB_NAME);
  
  const isDev = _.isEqual(app.isPackaged, false);
  const rootPath = isDev ? path.join(__dirname, "..") : process.resourcesPath;
  const srcDbPath = path.join(rootPath, APP_CONFIG.DB_NAME);

  if (_.every([destDbPath], isFileMissing)) {
    ensureDirectoryExists(dataDir);
    
    if (_.some([srcDbPath], fs.existsSync)) {
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

function executeChromeCommand(command) {
  exec(command, (err) => {
    if (err) appLogError(MESSAGES.CHROME_ERR, err);
  });
}

function startChromeBrowser() {
  appLog(MESSAGES.LOG_START_CHROME);
  
  const validPlatforms = [PLATFORMS.WIN, PLATFORMS.MAC];
  
  if (_.includes(validPlatforms, process.platform)) {
    const isWindows = _.isEqual(process.platform, PLATFORMS.WIN);
    const command = isWindows ? COMMANDS.CHROME_WIN : COMMANDS.CHROME_MAC;
    executeChromeCommand(command);
  }
}

function handleLoadError(err) {
  appLog(MESSAGES.RETRY_MSG, err.message);
  setTimeout(() => {
    mainWindow.loadURL(APP_CONFIG.HOST_URL).catch(() => {
      dialog.showErrorBox(MESSAGES.CONNECT_FAIL_TITLE, MESSAGES.CONNECT_FAIL_MSG);
    });
  }, APP_CONFIG.TIMEOUT_RETRY);
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
    mainWindow.loadURL(APP_CONFIG.HOST_URL).catch(handleLoadError);
  }, APP_CONFIG.TIMEOUT_BOOT);

  mainWindow.on(APP_CONFIG.CLOSED, () => {
    mainWindow = null;
  });
}

function handleSecondInstance() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
}

function handleActivate() {
  const allWindows = BrowserWindow.getAllWindows();
  if (_.isEqual(allWindows.length, 0)) {
    createWindow();
  }
}

function initializeApp() {
  startBackendServer();
  startChromeBrowser();
  createWindow();
  app.on(APP_CONFIG.ACTIVATE, handleActivate);
}

function handleWindowAllClosed() {
  appLog(MESSAGES.LOG_SHUTDOWN);
  process.emit(APP_CONFIG.SIGINT);
  
  setTimeout(() => {
    app.quit();
  }, APP_CONFIG.TIMEOUT_QUIT);
}

const lockData = { myKey: APP_CONFIG.SINGLE_INSTANCE_KEY };
const hasLock = app.requestSingleInstanceLock(lockData);

if (_.isEqual(hasLock, false)) {
  app.quit();
} else {
  app.on(APP_CONFIG.SECOND_INSTANCE, handleSecondInstance);
  app.whenReady().then(initializeApp);
}

app.on(APP_CONFIG.WINDOW_ALL_CLOSED, handleWindowAllClosed);
