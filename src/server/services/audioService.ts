import fs from "fs";
import { Page } from "playwright";
import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { EXTERNAL_URLS } from "../../constants";

import { appLog, appError } from "../../lib/logger.js";
chromium.use(stealthPlugin());

export let globalPlaywrightPage: Page | null = null;
export let globalBearerToken: string | null = null;

export const ensureDirectoryExists = (dir: string): void => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export async function initPlaywright() {
  if (globalPlaywrightPage) {
    try {
      await globalPlaywrightPage.evaluate("1");
      return;
    } catch {
      globalPlaywrightPage = null;
    }
  }

  try {
    appLog("PLAYWRIGHT_CONNECTING");
    const browser = await chromium.connectOverCDP(EXTERNAL_URLS.PLAYWRIGHT_CDP);
    const ctx = browser.contexts()[0];
    const page = ctx.pages()[0] || (await ctx.newPage());

    await page.addInitScript(`
      if (typeof window !== 'undefined') {
        if (!window.__name) {
          window.__name = (t, v) => {
            try { Object.defineProperty(t, "name", { value: v, configurable: true }); } catch {}
            return t;
          };
        }
        window.__getImgId = (url) => {
          if (!url) return "";
          try {
            const u = new URL(url);
            const id = u.searchParams.get("id") || u.searchParams.get("docid");
            if (id) return id;
            u.searchParams.delete("token");
            u.searchParams.delete("sig");
            u.searchParams.delete("signature");
            u.searchParams.delete("expires");
            u.searchParams.delete("t");
            return u.toString();
          } catch (e) {
            return url;
          }
        };
      }
    `);

    page.on("request", (req) => {
      const auth = req.headers()["authorization"];
      if (auth && req.url().includes("aisandbox-pa.googleapis.com")) {
        globalBearerToken = auth;
        (global as any).globalGoogleHeaders = req.headers();
      }
    });

    appLog("PLAYWRIGHT_ACCESSING_LABS");
    await page.goto(EXTERNAL_URLS.GOOGLE_LABS, { waitUntil: "networkidle" });

    if (!globalBearerToken) {
      appLog("PLAYWRIGHT_LOGIN_PROMPT");
      page
        .waitForResponse((res) => res.url().includes("googleapis.com"), { timeout: 300000 })
        .then(() => appLog("PLAYWRIGHT_TOKEN_CAPTURED"))
        .catch(() => appLog("PLAYWRIGHT_TOKEN_TIMEOUT"));
    } else {
      appLog("PLAYWRIGHT_TOKEN_CAPTURED");
    }

    globalPlaywrightPage = page;
  } catch (e: any) {
    appError("PLAYWRIGHT_CONNECT_ERR", e?.message || e);
    ["PLAYWRIGHT_BORDER", "PLAYWRIGHT_CHROME_MANDATE", "PLAYWRIGHT_CHROME_COMMAND", "PLAYWRIGHT_BORDER_BOTTOM"].forEach((k) => appLog(k));
  }
}

export async function closePlaywright() {
  if (globalPlaywrightPage) {
    try {
      await globalPlaywrightPage.close();
    } catch (e) {}
    globalPlaywrightPage = null;
  }
}
