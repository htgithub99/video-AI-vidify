import { exec } from "child_process";
import cors from "cors";
import "dotenv/config";
import express from "express";
import _ from "lodash";
import { createServer, type Server } from "node:http";
import path from "path";
import type { ViteDevServer } from "vite";
import {
  MOTION_TEXT_0_0_0_0,
  MOTION_TEXT_500MB,
  MOTION_TEXT_AIEXECUTION,
  MOTION_TEXT_ASSETS,
  MOTION_TEXT_ASSETS_2,
  MOTION_TEXT_AUTHORIZATION,
  MOTION_TEXT_CHROMEHEADLESS,
  MOTION_TEXT_CONFIG,
  MOTION_TEXT_CONTENT_TYPE,
  MOTION_TEXT_DELETE,
  MOTION_TEXT_DIST,
  MOTION_TEXT_EADDRINUSE,
  MOTION_TEXT_ERROR,
  MOTION_TEXT_GET,
  MOTION_TEXT_INDEX_HTML,
  MOTION_TEXT_LISTENING,
  MOTION_TEXT_LOCALHOST,
  MOTION_TEXT_LOCALPROJECTID,
  MOTION_TEXT_MODE,
  MOTION_TEXT_MODEL,
  MOTION_TEXT_OPTIONS,
  MOTION_TEXT_PIPELINE_ROOM,
  MOTION_TEXT_PKILL_F_CHROME_REMOTE_DEBUGGING_PORT_9222,
  MOTION_TEXT_PLANNINGCHATMODEL,
  MOTION_TEXT_PLANNINGCHROMEHEADLESS,
  MOTION_TEXT_PLANNINGEXECUTIONMODE,
  MOTION_TEXT_PLANNINGFALLBACKPROVIDER,
  MOTION_TEXT_POST,
  MOTION_TEXT_PRODUCTION,
  MOTION_TEXT_PROJECTID,
  MOTION_TEXT_PROVIDER,
  MOTION_TEXT_PUT,
  MOTION_TEXT_SIGINT,
  MOTION_TEXT_SIGTERM,
  MOTION_TEXT_SPA,
  MOTION_TEXT_SYMBOL_34,
  MOTION_TEXT_TRUE,
  MOTION_TEXT_VISUALCONFIG,
  MOTION_TEXT_WIN32,
  MOTION_TEXT_WMIC_PROCESS_WHERE_NAME_CHROME_EXE_AND_COMMANDLINE,
  MOTION_TEXT_WS,
  MOTION_TEXT_X_AI33_API_KEY,
  MOTION_TEXT_X_API_KEY,
  MOTION_TEXT_X_CEREBRAS_API_KEY,
  MOTION_TEXT_X_GEMINI_API_KEY,
  MOTION_TEXT_X_GROQ_API_KEY,
} from "./src/constants/motionRuntime.js";
import "./src/server/storageBootstrap.js";
import { API_ROUTES } from "./src/constants/apiRoutes.js";
import { SecurityConstants } from "./src/constants/security.js";
import { SHORTS_CONSTANTS } from "./src/constants/shorts.js";
import { logger } from "./src/lib/logger.js";
import pipelineRouter from "./src/server/controllers/pipelineController.js";
import { requireLicense } from "./src/server/middlewares/requireLicense.js";
import mainRouter from "./src/server/routes/index.js";
import licenseRouter from "./src/server/routes/licenseRoutes.js";
import { getResolvedLicenseKey } from "./src/server/services/apiKeyResolver.js";
import { closePlaywright, initPlaywright } from "./src/server/services/audioService.js";
import { closeActiveBrowser } from "./src/server/services/imageGeneratorService.js";
import { getDataDirectory } from "./src/server/utils/paths.js";
import { requestContext } from "./src/server/utils/requestContext.js";
import { AiPlanningExecutionMode, AiPlanningFallbackProvider } from "./src/types.js";
const SERVER_CONFIG = {
  PORT: 3002,
  HOST: MOTION_TEXT_0_0_0_0,
  PRODUCTION: MOTION_TEXT_PRODUCTION,
  SIGINT: MOTION_TEXT_SIGINT,
  SIGTERM: MOTION_TEXT_SIGTERM,
  WIN32: MOTION_TEXT_WIN32,
  ASSETS_ROUTE: MOTION_TEXT_ASSETS,
  ASSETS_DIR: MOTION_TEXT_ASSETS_2,
  DIST_DIR: MOTION_TEXT_DIST,
  INDEX_FILE: MOTION_TEXT_INDEX_HTML,
  SPA_TYPE: MOTION_TEXT_SPA,
  CORS_ORIGIN: MOTION_TEXT_SYMBOL_34,
  CORS_METHODS: [MOTION_TEXT_GET, MOTION_TEXT_POST, MOTION_TEXT_PUT, MOTION_TEXT_DELETE, MOTION_TEXT_OPTIONS],
  CORS_HEADERS: [MOTION_TEXT_CONTENT_TYPE, MOTION_TEXT_AUTHORIZATION, MOTION_TEXT_X_API_KEY, MOTION_TEXT_X_GEMINI_API_KEY, MOTION_TEXT_X_CEREBRAS_API_KEY, MOTION_TEXT_X_GROQ_API_KEY, MOTION_TEXT_X_AI33_API_KEY, SecurityConstants.HEADER_LICENSE_KEY, SecurityConstants.HEADER_INTERNAL_TOKEN],
  LIMIT_500MB: MOTION_TEXT_500MB,
  HEADER_GEMINI_KEY: MOTION_TEXT_X_GEMINI_API_KEY,
  HEADER_CEREBRAS_KEY: MOTION_TEXT_X_CEREBRAS_API_KEY,
  HEADER_GROQ_KEY: MOTION_TEXT_X_GROQ_API_KEY,
  HEADER_AI33_KEY: MOTION_TEXT_X_AI33_API_KEY,
  KILL_CHROME_WIN: MOTION_TEXT_WMIC_PROCESS_WHERE_NAME_CHROME_EXE_AND_COMMANDLINE,
  KILL_CHROME_UNIX: MOTION_TEXT_PKILL_F_CHROME_REMOTE_DEBUGGING_PORT_9222,
  TIMEOUT_SHUTDOWN: 3000,
  LISTEN_RETRY_ATTEMPTS: 15,
  LISTEN_RETRY_DELAY_MS: 1000,
  ADDRESS_IN_USE_ERROR: MOTION_TEXT_EADDRINUSE,
  HMR_HOST: MOTION_TEXT_LOCALHOST,
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
          httpServer?.removeListener(MOTION_TEXT_LISTENING, handleListening);
          reject(error);
        };
        const handleListening = () => {
          httpServer?.removeListener(MOTION_TEXT_ERROR, handleError);
          logger.log(SecurityConstants.LOG_SERVER_RUNNING, SERVER_CONFIG.PORT);
          resolve();
        };
        httpServer?.once(MOTION_TEXT_ERROR, handleError);
        httpServer?.once(MOTION_TEXT_LISTENING, handleListening);
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
  const executionSource = _.get(req.body, MOTION_TEXT_AIEXECUTION, {});
  const configSource = _.get(req.body, MOTION_TEXT_CONFIG, {});
  const visualSource = _.get(req.body, MOTION_TEXT_VISUALCONFIG, {});
  const aiExecutionMode = _.get(executionSource, MOTION_TEXT_MODE) || _.get(req.body, MOTION_TEXT_PLANNINGEXECUTIONMODE) || _.get(configSource, MOTION_TEXT_PLANNINGEXECUTIONMODE) || _.get(visualSource, MOTION_TEXT_PLANNINGEXECUTIONMODE);
  const aiRoomProvider = _.get(executionSource, MOTION_TEXT_PROVIDER) || _.get(req.body, MOTION_TEXT_PLANNINGFALLBACKPROVIDER) || _.get(configSource, MOTION_TEXT_PLANNINGFALLBACKPROVIDER) || _.get(visualSource, MOTION_TEXT_PLANNINGFALLBACKPROVIDER);
  const aiRoomModel = _.get(executionSource, MOTION_TEXT_MODEL) || _.get(req.body, MOTION_TEXT_PLANNINGCHATMODEL) || _.get(configSource, MOTION_TEXT_PLANNINGCHATMODEL) || _.get(visualSource, MOTION_TEXT_PLANNINGCHATMODEL);
  const aiRoomProjectId = _.toString(_.get(executionSource, MOTION_TEXT_PROJECTID) || _.get(req.body, MOTION_TEXT_PROJECTID) || _.get(req.body, MOTION_TEXT_LOCALPROJECTID) || MOTION_TEXT_PIPELINE_ROOM);
  const aiRoomChromeHeadless = Boolean(_.get(executionSource, MOTION_TEXT_CHROMEHEADLESS) ?? _.get(req.body, MOTION_TEXT_PLANNINGCHROMEHEADLESS) ?? _.get(configSource, MOTION_TEXT_PLANNINGCHROMEHEADLESS) ?? _.get(visualSource, MOTION_TEXT_PLANNINGCHROMEHEADLESS));
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
          process.env.DISABLE_HMR === MOTION_TEXT_TRUE
            ? false
            : {
                server: httpServer,
                host: SERVER_CONFIG.HMR_HOST,
                port: SERVER_CONFIG.PORT,
                clientPort: SERVER_CONFIG.PORT,
                protocol: MOTION_TEXT_WS,
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
