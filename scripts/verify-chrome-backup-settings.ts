import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import express from "express";
import { build } from "esbuild";
import { chromium } from "playwright";
import { readChromeBackupSettings } from "../src/server/services/chromeBackupService.ts";
import { getChromeBackup, updateChromeBackup } from "../src/features/settings/server/controllers/chromeBackupController.ts";
import { CHROME_BACKUP as C } from "../src/constants/chromeBackup.ts";
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
const previousData = process.env.APP_DATA_DIR;
const root = await fs.mkdtemp(path.join(os.tmpdir(), "chrome-settings-"));
process.env.VIDIFY_STORAGE_DIR = root;
delete process.env.APP_DATA_DIR;
const app = express();
app.use(express.json());
app.get(C.API, getChromeBackup);
app.put(C.API, updateChromeBackup);
const bundle = await build({
  stdin: { contents: 'import React from "react";import{createRoot}from"react-dom/client";import{ChromeBackupSettings}from"./src/features/settings/components/ChromeBackupSettings.tsx";createRoot(document.getElementById("fixture-root")).render(<ChromeBackupSettings language={new URLSearchParams(location.search).get("lang")||"vi"}/>);', loader: "tsx", resolveDir: process.cwd() },
  bundle: true,
  platform: "browser",
  format: "esm",
  write: false,
});
const assets = await fs.readdir("dist/assets");
const css = await fs.readFile(path.join("dist/assets", assets.find((file) => /^index-.*\.css$/u.test(file))!), "utf8");
app.get("/fixture.js", (_req, res) => res.type("js").send(bundle.outputFiles[0].text));
app.get("/fixture.css", (_req, res) => res.type("css").send(css));
app.get("/", (_req, res) => res.type("html").send('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body style="background:#020617;padding:20px"><main style="max-width:800px;margin:auto"><div id="fixture-root"></div></main><script type="module" src="/fixture.js"></script></body></html>'));
const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", resolve));
const url = `http://127.0.0.1:${(server.address() as any).port}`;
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", headless: false });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  const toggle = page.getByRole("switch", { name: C.LABEL.vi });
  const forceToggle = page.getByRole("switch", { name: C.FORCE_LABEL.vi });
  await toggle.waitFor();
  await forceToggle.waitFor();
  await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>('[role="switch"]')?.disabled);
  assert.equal(await toggle.getAttribute("aria-checked"), "false");
  await toggle.click();
  await page.waitForFunction(() => document.querySelector('[role="switch"]')?.getAttribute("aria-checked") === "true");
  assert.equal(readChromeBackupSettings().enabled, true);
  await page.reload();
  await page.waitForFunction(() => document.querySelector('[role="switch"]')?.getAttribute("aria-checked") === "true");
  await fs.mkdir("docs/qa", { recursive: true });
  await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>('[role="switch"]')?.disabled);
  assert.ok(await toggle.evaluate((node) => node.getBoundingClientRect().right <= innerWidth));
  await page.screenshot({ path: "docs/qa/chrome-backup-settings-desktop.png" });
  await page.setViewportSize({ width: 360, height: 800 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: "docs/qa/chrome-backup-settings-mobile.png" });
  await toggle.click();
  await page.waitForFunction(() => document.querySelector('[role="switch"]')?.getAttribute("aria-checked") === "false");
  assert.equal(readChromeBackupSettings().enabled, false);
  assert.equal(await forceToggle.getAttribute("aria-checked"), "false");
  await forceToggle.click();
  await page.waitForFunction(() => document.querySelectorAll('[role="switch"]')[1]?.getAttribute("aria-checked") === "true");
  assert.equal(readChromeBackupSettings().useBackup, true);
  assert.equal(readChromeBackupSettings().active, true);
  await forceToggle.click();
  await page.waitForFunction(() => document.querySelectorAll('[role="switch"]')[1]?.getAttribute("aria-checked") === "false");
  assert.equal(readChromeBackupSettings().useBackup, false);
  assert.equal(readChromeBackupSettings().active, false);
  const invalid = await fetch(url + C.API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: "true" }) });
  assert.equal(invalid.status, 400);
  assert.equal(readChromeBackupSettings().enabled, false);
  await page.goto(url + "/?lang=en");
  await page.getByRole("switch", { name: C.LABEL.en }).waitFor();
  await page.getByRole("switch", { name: C.FORCE_LABEL.en }).waitFor();
  assert.deepEqual(errors, []);
  console.log("PASS: visible installed Chrome, production Settings card and controller, shared setting persistence across reload, on/off, invalid API input, English and mobile layout.");
} finally {
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  if (previousData === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = previousData;
  await fs.rm(root, { recursive: true, force: true });
}
