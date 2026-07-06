import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { exec } from "child_process";

import { logger } from "./src/lib/logger.js";

import {
  initPlaywright,
  closePlaywright,
} from "./src/server/services/audioService.js";

import mainRouter from "./src/server/routes/index.js";
import pipelineRouter from "./src/server/controllers/pipelineController.js";

import { API_ROUTES } from "./src/constants/apiRoutes.js";

const app = express();
const port = 3002;

import { requestContext } from "./src/server/utils/requestContext.js";

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-api-key",
      "x-gemini-api-key",
      "x-ai33-api-key",
    ],
  }),
);

app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

app.use((req, res, next) => {
  const geminiKey = (req.headers["x-gemini-api-key"] as string) || "";
  const ai33Key = (req.headers["x-ai33-api-key"] as string) || "";
  requestContext.run({ geminiKey, ai33Key }, next);
});

app.use('/assets', express.static(path.join(process.cwd(), 'assets')));
app.use(API_ROUTES.BASE_API, mainRouter);
app.use(API_ROUTES.PIPELINE, pipelineRouter);

const startServer = async () => {
  await initPlaywright();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    logger.log("SERVER_RUNNING", port);
  });
};

startServer().catch((error) => {
  logger.error("SERVER_START_ERROR", error);
});

// npx kill-port 3000
process.on("SIGINT", async () => {
  logger.log("PLAYWRIGHT_CLEANING");
  setTimeout(() => process.exit(0), 3000);
  try { await closePlaywright(); } catch (e) { }
  if (process.platform === "win32") {
    exec(`wmic process where "name='chrome.exe' and commandline like '%--remote-debugging-port=9222%'" call terminate`, () => {
      process.exit(0);
    });
  } else {
    exec(`pkill -f "chrome.*--remote-debugging-port=9222"`, () => {
      process.exit(0);
    });
  }
});
process.on("SIGTERM", async () => {
  logger.log("PLAYWRIGHT_CLEANING");
  setTimeout(() => process.exit(0), 3000);
  try { await closePlaywright(); } catch (e) { }
  if (process.platform === "win32") {
    exec(`wmic process where "name='chrome.exe' and commandline like '%--remote-debugging-port=9222%'" call terminate`, () => {
      process.exit(0);
    });
  } else {
    exec(`pkill -f "chrome.*--remote-debugging-port=9222"`, () => {
      process.exit(0);
    });
  }
});
