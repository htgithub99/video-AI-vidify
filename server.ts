import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { exec } from "child_process";
import { createServer, type Server } from "node:http";
import type { ViteDevServer } from "vite";
import _ from "lodash";

import { logger } from "./src/lib/logger.js";
import { initPlaywright, closePlaywright } from "./src/server/services/audioService.js";
import mainRouter from "./src/server/routes/index.js";
import pipelineRouter from "./src/server/controllers/pipelineController.js";
import licenseRouter from "./src/server/routes/licenseRoutes.js";
import { requireLicense } from "./src/server/middlewares/requireLicense.js";
import { API_ROUTES } from "./src/constants/apiRoutes.js";
import { requestContext } from "./src/server/utils/requestContext.js";
import { AiPlanningExecutionMode, AiPlanningFallbackProvider } from "./src/types.js";
import { getDataDirectory } from "./src/server/utils/paths.js";
import { SecurityConstants } from "./src/constants/security.js";
import { SHORTS_CONSTANTS } from "./src/constants/shorts.js";
import { getResolvedLicenseKey } from "./src/server/services/apiKeyResolver.js";
import { closeActiveBrowser } from "./src/server/services/imageGeneratorService.js";

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
    SecurityConstants.HEADER_INTERNAL_TOKEN,
  ],
  LIMIT_500MB: "500mb",
  HEADER_GEMINI_KEY: "x-gemini-api-key",
  HEADER_CEREBRAS_KEY: "x-cerebras-api-key",
  HEADER_GROQ_KEY: "x-groq-api-key",
  HEADER_AI33_KEY: "x-ai33-api-key",
  KILL_CHROME_WIN: `wmic process where "name='chrome.exe' and commandline like '%--remote-debugging-port=9222%'" call terminate`,
  KILL_CHROME_UNIX: `pkill -f "chrome.*--remote-debugging-port=9222"`,
  TIMEOUT_SHUTDOWN: 3000,
  LISTEN_RETRY_ATTEMPTS: 15,
  LISTEN_RETRY_DELAY_MS: 1000,
  ADDRESS_IN_USE_ERROR: "EADDRINUSE",
  HMR_HOST: "localhost",
} as const;

const app = express();
let httpServer: Server | undefined;
let viteDevServer: ViteDevServer | undefined;
let isShuttingDown = false;

const waitForListenRetry = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, SERVER_CONFIG.LISTEN_RETRY_DELAY_MS));

const listenForRequests = async (): Promise<void> => {
  if (!httpServer) httpServer = createServer(app);
  for (let attempt = 0; attempt < SERVER_CONFIG.LISTEN_RETRY_ATTEMPTS; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const handleError = (error: NodeJS.ErrnoException) => {
          httpServer?.removeListener("listening", handleListening);
          reject(error);
        };
        const handleListening = () => {
          httpServer?.removeListener("error", handleError);
          logger.log(SecurityConstants.LOG_SERVER_RUNNING, SERVER_CONFIG.PORT);
          resolve();
        };
        httpServer?.once("error", handleError);
        httpServer?.once("listening", handleListening);
        httpServer?.listen(SERVER_CONFIG.PORT, SERVER_CONFIG.HOST);
      });
      return;
    } catch (error) {
      const isAddressInUse = _.isEqual((error as NodeJS.ErrnoException).code, SERVER_CONFIG.ADDRESS_IN_USE_ERROR);
      if (!isAddressInUse || _.isEqual(attempt, SERVER_CONFIG.LISTEN_RETRY_ATTEMPTS - 1)) throw error;
      await waitForListenRetry();
    }
  }
};

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

app.use((req, _res, next) => {
  const geminiKey = (req.headers[SERVER_CONFIG.HEADER_GEMINI_KEY] as string) || SecurityConstants.EMPTY_STRING;
  const cerebrasKey = (req.headers[SERVER_CONFIG.HEADER_CEREBRAS_KEY] as string) || SecurityConstants.EMPTY_STRING;
  const groqKey = (req.headers[SERVER_CONFIG.HEADER_GROQ_KEY] as string) || SecurityConstants.EMPTY_STRING;
  const ai33Key = (req.headers[SERVER_CONFIG.HEADER_AI33_KEY] as string) || SecurityConstants.EMPTY_STRING;
  const licenseKey = getResolvedLicenseKey(req);
  const executionSource = _.get(req.body, "aiExecution", {});
  const configSource = _.get(req.body, "config", {});
  const visualSource = _.get(req.body, "visualConfig", {});
  const aiExecutionMode =
    _.get(executionSource, "mode") || _.get(req.body, "planningExecutionMode") || _.get(configSource, "planningExecutionMode") || _.get(visualSource, "planningExecutionMode");
  const aiRoomProvider =
    _.get(executionSource, "provider") ||
    _.get(req.body, "planningFallbackProvider") ||
    _.get(configSource, "planningFallbackProvider") ||
    _.get(visualSource, "planningFallbackProvider");
  const aiRoomModel =
    _.get(executionSource, "model") || _.get(req.body, "planningChatModel") || _.get(configSource, "planningChatModel") || _.get(visualSource, "planningChatModel");
  const aiRoomProjectId = _.toString(_.get(executionSource, "projectId") || _.get(req.body, "projectId") || _.get(req.body, "localProjectId") || "pipeline-room");
  const aiRoomChromeHeadless = Boolean(
    _.get(executionSource, "chromeHeadless") ??
    _.get(req.body, "planningChromeHeadless") ??
    _.get(configSource, "planningChromeHeadless") ??
    _.get(visualSource, "planningChromeHeadless"),
  );
  requestContext.run(
    {
      geminiKey,
      cerebrasKey,
      groqKey,
      ai33Key,
      licenseKey,
      aiExecutionMode: _.includes(Object.values(AiPlanningExecutionMode), aiExecutionMode) ? aiExecutionMode : undefined,
      aiRoomProvider: _.includes(Object.values(AiPlanningFallbackProvider), aiRoomProvider) ? aiRoomProvider : undefined,
      aiRoomModel,
      aiRoomProjectId,
      aiRoomChromeHeadless,
    },
    next,
  );
});

app.use(SERVER_CONFIG.ASSETS_ROUTE, express.static(path.join(getDataDirectory(), SERVER_CONFIG.ASSETS_DIR)));
app.use(SERVER_CONFIG.ASSETS_ROUTE, express.static(path.join(getDataDirectory(), SHORTS_CONSTANTS.OUTPUT_FOLDER, SHORTS_CONSTANTS.SHORTS_FOLDER)));
app.use(SERVER_CONFIG.ASSETS_ROUTE, express.static(path.join(getDataDirectory(), SHORTS_CONSTANTS.OUTPUT_FOLDER)));
app.use(API_ROUTES.LICENSE, licenseRouter);

app.use(API_ROUTES.BASE_API, requireLicense(), mainRouter);
app.use(API_ROUTES.PIPELINE, requireLicense(), pipelineRouter);

const startServer = async () => {
  await initPlaywright();

  httpServer = createServer(app);

  if (!_.isEqual(process.env.NODE_ENV, SERVER_CONFIG.PRODUCTION)) {
    const { createServer: createViteServer } = await import("vite");
    viteDevServer = await createViteServer({
      server: {
        middlewareMode: true,
        host: SERVER_CONFIG.HMR_HOST,
        hmr:
          process.env.DISABLE_HMR === "true"
            ? false
            : {
                server: httpServer,
                host: SERVER_CONFIG.HMR_HOST,
                port: SERVER_CONFIG.PORT,
                clientPort: SERVER_CONFIG.PORT,
                protocol: "ws",
              },
      },
      appType: SERVER_CONFIG.SPA_TYPE,
    });
    app.use(viteDevServer.middlewares);
  } else {
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get(SecurityConstants.WILDCARD_ROUTE, (_req, res) => {
      res.sendFile(path.join(distPath, SERVER_CONFIG.INDEX_FILE));
    });
  }

  await listenForRequests();
};

startServer().catch((error) => {
  logger.error(SecurityConstants.LOG_SERVER_START_ERROR, error);
});

const shutdownGracefully = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.log(SecurityConstants.LOG_PLAYWRIGHT_CLEANING);
  const forcedExitTimer = setTimeout(() => process.exit(0), SERVER_CONFIG.TIMEOUT_SHUTDOWN);
  forcedExitTimer.unref();
  try {
    const closeHttpServer = new Promise<void>((resolve) => {
      if (!httpServer) return resolve();
      httpServer.close(() => resolve());
      httpServer.closeAllConnections();
    });
    await Promise.allSettled([closeHttpServer, viteDevServer?.close(), closePlaywright(), closeActiveBrowser()]);
  } catch (e) {}

  if (!_.isEqual(process.env.NODE_ENV, SERVER_CONFIG.PRODUCTION)) {
    clearTimeout(forcedExitTimer);
    process.exit(0);
    return;
  }

  const killCmd = _.isEqual(process.platform, SERVER_CONFIG.WIN32) ? SERVER_CONFIG.KILL_CHROME_WIN : SERVER_CONFIG.KILL_CHROME_UNIX;

  exec(killCmd, () => {
    clearTimeout(forcedExitTimer);
    process.exit(0);
  });
};

process.on(SERVER_CONFIG.SIGINT, shutdownGracefully);
process.on(SERVER_CONFIG.SIGTERM, shutdownGracefully);
