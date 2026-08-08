import express from "express";
import cors from "cors";

import path from "path";
import { exec } from "child_process";
import _ from "lodash";

import { logger } from "./src/lib/logger.js";
import { initPlaywright, closePlaywright } from "./src/server/services/audioService.js";
import mainRouter from "./src/server/routes/index.js";
import pipelineRouter from "./src/server/controllers/pipelineController.js";
import licenseRouter from "./src/server/routes/licenseRoutes.js";
import { requireLicense } from "./src/server/middlewares/requireLicense.js";
import { API_ROUTES } from "./src/constants/apiRoutes.js";
import { requestContext } from "./src/server/utils/requestContext.js";
import { getDataDirectory } from "./src/server/utils/paths.js";
import { SecurityConstants } from "./src/constants/security.js";
import { getResolvedLicenseKey } from "./src/server/services/apiKeyResolver.js";

const SERVER_CONFIG = {
  PORT: 3002,
  HOST: "0.0.0.0",
  PRODUCTION: "production",
  SIGINT: "SIGINT",
  SIGTERM: "SIGTERM",
  WIN32: "win32",
  ASSETS_ROUTE: "/assets",
  ASSETS_DIR: "assets",
  DIST_DIR: "dist",
  INDEX_FILE: "index.html",
  SPA_TYPE: "spa" as const,
  CORS_ORIGIN: "*",
  CORS_METHODS: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  CORS_HEADERS: [
    "Content-Type",
    "Authorization",
    "x-api-key",
    "x-gemini-api-key",
    "x-cerebras-api-key",
    "x-groq-api-key",
    "x-ai33-api-key",
    SecurityConstants.HEADER_LICENSE_KEY,
    SecurityConstants.HEADER_INTERNAL_TOKEN
  ],
  LIMIT_500MB: "500mb",
  HEADER_GEMINI_KEY: "x-gemini-api-key",
  HEADER_CEREBRAS_KEY: "x-cerebras-api-key",
  HEADER_GROQ_KEY: "x-groq-api-key",
  HEADER_AI33_KEY: "x-ai33-api-key",
  KILL_CHROME_WIN: `wmic process where "name='chrome.exe' and commandline like '%--remote-debugging-port=9222%'" call terminate`,
  KILL_CHROME_UNIX: `pkill -f "chrome.*--remote-debugging-port=9222"`,
  TIMEOUT_SHUTDOWN: 3000,
} as const;

const app = express();

app.use(
  cors({
    origin: SERVER_CONFIG.CORS_ORIGIN,
    methods: [...SERVER_CONFIG.CORS_METHODS],
    allowedHeaders: [...SERVER_CONFIG.CORS_HEADERS],
  }),
);

app.use(express.json({ limit: SERVER_CONFIG.LIMIT_500MB }));
app.use(express.urlencoded({ limit: SERVER_CONFIG.LIMIT_500MB, extended: true }));

app.use((req, res, next) => {
  if (_.startsWith(req.path, SecurityConstants.API_PREFIX)) {
    const serverToken = process.env[SecurityConstants.ENV_INTERNAL_API_TOKEN];
    if (serverToken) {
      const clientToken = _.get(req.headers, SecurityConstants.HEADER_INTERNAL_TOKEN);
      if (!_.isEqual(clientToken, serverToken)) {
        return res.status(SecurityConstants.HTTP_FORBIDDEN).json({ error: SecurityConstants.ACCESS_DENIED_MESSAGE });
      }
    }
  }
  next();
});

app.use((req, res, next) => {
  const geminiKey = (req.headers[SERVER_CONFIG.HEADER_GEMINI_KEY] as string) || SecurityConstants.EMPTY_STRING;
  const cerebrasKey = (req.headers[SERVER_CONFIG.HEADER_CEREBRAS_KEY] as string) || SecurityConstants.EMPTY_STRING;
  const groqKey = (req.headers[SERVER_CONFIG.HEADER_GROQ_KEY] as string) || SecurityConstants.EMPTY_STRING;
  const ai33Key = (req.headers[SERVER_CONFIG.HEADER_AI33_KEY] as string) || SecurityConstants.EMPTY_STRING;
  const licenseKey = getResolvedLicenseKey(req);
  requestContext.run({ geminiKey, cerebrasKey, groqKey, ai33Key, licenseKey }, next);
});

app.use(SERVER_CONFIG.ASSETS_ROUTE, express.static(path.join(getDataDirectory(), SERVER_CONFIG.ASSETS_DIR)));
app.use(API_ROUTES.LICENSE, licenseRouter);

app.use(API_ROUTES.BASE_API, requireLicense(), mainRouter);
app.use(API_ROUTES.PIPELINE, requireLicense(), pipelineRouter);

const startServer = async () => {
  await initPlaywright();

  if (!_.isEqual(process.env.NODE_ENV, SERVER_CONFIG.PRODUCTION)) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: SERVER_CONFIG.SPA_TYPE,
    });
    app.use(vite.middlewares);
  } else {
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get(SecurityConstants.WILDCARD_ROUTE, (req, res) => {
      res.sendFile(path.join(distPath, SERVER_CONFIG.INDEX_FILE));
    });
  }

  app.listen(SERVER_CONFIG.PORT, SERVER_CONFIG.HOST, () => {
    logger.log(SecurityConstants.LOG_SERVER_RUNNING, SERVER_CONFIG.PORT);
  });
};

startServer().catch((error) => {
  logger.error(SecurityConstants.LOG_SERVER_START_ERROR, error);
});

const shutdownGracefully = async () => {
  logger.log(SecurityConstants.LOG_PLAYWRIGHT_CLEANING);
  setTimeout(() => process.exit(0), SERVER_CONFIG.TIMEOUT_SHUTDOWN);
  try {
    await closePlaywright();
  } catch (e) {}

  const killCmd = _.isEqual(process.platform, SERVER_CONFIG.WIN32)
    ? SERVER_CONFIG.KILL_CHROME_WIN
    : SERVER_CONFIG.KILL_CHROME_UNIX;

  exec(killCmd, () => {
    process.exit(0);
  });
};

process.on(SERVER_CONFIG.SIGINT, shutdownGracefully);
process.on(SERVER_CONFIG.SIGTERM, shutdownGracefully);
