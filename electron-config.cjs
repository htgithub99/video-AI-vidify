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
  LOG_START_CHROME: "Đang khởi chạy Chrome browser cho tạo ảnh...",
  CHROME_ERR: "Lỗi mở Chrome:",
};

const PLATFORMS = {
  WIN: "win32",
  MAC: "darwin",
};

const COMMANDS = {
  CHROME_WIN: 'start chrome.exe --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir="C:\\chrome_debug_profile"',
  CHROME_MAC: 'open -a "Google Chrome" --args --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir="/tmp/chrome_debug_profile"',
};

const ENV_VALUES = {
  TRUE: "true",
};

module.exports = {
  APP_CONFIG,
  MESSAGES,
  PLATFORMS,
  COMMANDS,
  ENV_VALUES,
};
