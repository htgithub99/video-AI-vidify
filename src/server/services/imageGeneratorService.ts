import { globalPlaywrightPage, initPlaywright, closePlaywright } from "./audioService.js";
import { EXTERNAL_URLS } from "../../constants/apiRoutes.js";
import { BACKEND_MESSAGES } from "../../constants/messages.js";
import { appLog, appError, createAppError } from "../../lib/logger.js";
import { STICKMAN_KEYWORDS } from "../../constants/data.js";
import { GenerateType, ImageGeneratorEngine, PromptInputMethod } from "../../types.js";
import { Locator, Page } from "playwright";

export async function smoothMouseMove(page: Page, locator: Locator) {
  try {
    const box = await locator.boundingBox();
    if (!box) return;

    const startX = Math.floor(Math.random() * 800 + 100);
    const startY = Math.floor(Math.random() * 600 + 100);
    const targetX = Math.floor(box.x + box.width / 2 + (Math.random() - 0.5) * 10);
    const targetY = Math.floor(box.y + box.height / 2 + (Math.random() - 0.5) * 5);

    await page.mouse.move(startX, startY);
    
    const steps = Math.floor(Math.random() * 5 + 8);
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const currentX = startX + (targetX - startX) * t;
      const currentY = startY + (targetY - startY) * t + Math.sin(t * Math.PI) * (Math.random() - 0.5) * 15;
      await page.mouse.move(currentX, currentY);
      await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 10 + 5)));
    }
    
    await page.mouse.move(targetX, targetY);
    await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 150 + 100)));
  } catch (e) {
    await locator.hover().catch(() => {});
  }
}

export async function humanType(page: Page, text: string) {
  const chars = text.split("");
  const pauseChars = [" ", ",", "."];
  for (const char of chars) {
    await page.keyboard.type(char);
    let delay = Math.floor(Math.random() * 25 + 10);
    if (pauseChars.includes(char)) {
      delay += Math.floor(Math.random() * 50 + 30);
    }
    await new Promise((r) => setTimeout(r, delay));
  }
}

export const getImgIdSafe = (url: string): string => {
  if (!url) return "";
  try {
    const u = new URL(url);
    const id = u.searchParams.get("id") || u.searchParams.get("docid");
    if (id) return id;
    ["token", "sig", "signature", "expires", "t"].forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch (e) {
    return url;
  }
};

export class SimpleMutex {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const release = () => {
        if (this.queue.length > 0) {
          const next = this.queue.shift();
          if (next) next();
        } else {
          this.locked = false;
        }
      };

      if (this.locked) {
        this.queue.push(() => resolve(release));
      } else {
        this.locked = true;
        resolve(release);
      }
    });
  }
}

export const imageGenMutex = new SimpleMutex();

export interface ImageGeneratorOptions {
  prompt: string;
  style?: string;
  visualConfig?: {
    chromeHeadless?: boolean;
    generateType?: GenerateType;
    aspectRatio?: string;
    generateCount?: number;
    imageGeneratorEngine?: ImageGeneratorEngine;
    promptInputMethod?: PromptInputMethod;
  };
  sandboxConfig?: {
    projectId?: string;
  };
}

export interface ImageGeneratorResult {
  success: boolean;
  base64: string | null;
  fallbackUrl: string;
  warning?: string;
}

export const extractKeywords = (text: string): string => {
  if (!text) return "aesthetic,cinematic";
  const clean = text.replace(/[^a-zA-Z0-9\s]/g, " ");
  const words = clean
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 3);
  const fillerWords = [
    "beautiful",
    "detailed",
    "artistic",
    "image",
    "generation",
    "prompt",
    "describing",
    "characters",
    "clothes",
    "historical",
    "accuracy",
    "weather",
    "camera",
    "angle",
    "lighting",
    "based",
    "style",
    "with",
    "what",
    "where",
    "photo",
    "shot",
    "highly",
    "ultra",
    "dramatic",
    "gorgeous",
    "scene",
    "rendering",
  ];
  const filtered = words.filter((w) => !fillerWords.includes(w));
  return filtered.slice(0, 3).join(",");
};

let lastPlaywrightConfigState: string | null = null;

export async function generateImageWithPlaywright(
  options: ImageGeneratorOptions
): Promise<ImageGeneratorResult> {
  const { prompt, style, visualConfig, sandboxConfig = {} } = options;

  const isStickman = !!(
    (style && STICKMAN_KEYWORDS.some((kw) => style.toLowerCase().includes(kw))) ||
    (prompt && STICKMAN_KEYWORDS.some((kw) => prompt.toLowerCase().includes(kw)))
  );

  let finalPrompt = prompt || "";
  if (isStickman) {
    const stickmanStyleModifiers =
      "stickman cartoon style, simple black-outline stickman body with oversized head and face, extremely detailed exaggerated facial expressions, big eyes with black pupils, hand-drawn thick black outlines, flat solid colors, no gradients, no shading, simple rustic color palette, minimalist sketch art background";
    finalPrompt = `${finalPrompt}, ${stickmanStyleModifiers}`;
  }

  const kws = extractKeywords(prompt);
  const fallbackUrl = isStickman
    ? `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/stickman,cartoon`
    : `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/${encodeURIComponent(
      kws || "cinematic,landscape"
    )}`;

  const projectId = sandboxConfig.projectId || "cbcf7518-13d7-4eab-b59d-952d5814de53";
  let cleanProjectId = projectId;
  if (cleanProjectId.startsWith("projects/")) {
    cleanProjectId = cleanProjectId.replace("projects/", "");
  }

  const release = await imageGenMutex.acquire();

  let responseText = "";
  let success = false;
  let attempts = 0;
  const maxAttempts = 2;

  try {
    if (!globalPlaywrightPage || globalPlaywrightPage.isClosed()) {
      appLog(BACKEND_MESSAGES.PLAYWRIGHT_PAGE_CLOSED_REINIT);
      await initPlaywright();
    }
    if (!globalPlaywrightPage) {
      throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_REQUIRED);
    }

    try {
      await globalPlaywrightPage.evaluate(({ getImgIdStr }) => {
        if (typeof window !== 'undefined') {
          if (!(window as any).__name) {
            (window as any).__name = (target: any, value: any) => {
              try {
                Object.defineProperty(target, "name", { value, configurable: true });
              } catch (e) {}
              return target;
            };
          }
          if (!(window as any).__getImgId) {
            (window as any).__getImgId = new Function("return " + getImgIdStr)();
          }
        }
      }, { getImgIdStr: getImgIdSafe.toString() });
    } catch (err) {
      appError("Failed to inject helpers on current page context:", err);
    }

    const targetUrl = `${EXTERNAL_URLS.GOOGLE_LABS_FLOW}/${cleanProjectId}`;

    while (attempts < maxAttempts && !success) {
      attempts++;
      appLog(
        `${BACKEND_MESSAGES.IMAGE_RENDER_ATTEMPT}${attempts}/${maxAttempts}${BACKEND_MESSAGES.IMAGE_RENDER_STARTING}`
      );
      try {
        if (!globalPlaywrightPage || globalPlaywrightPage.isClosed()) {
          appLog(BACKEND_MESSAGES.PLAYWRIGHT_PAGE_CLOSED_PREV_ATTEMPT);
          await initPlaywright();
        }
        if (!globalPlaywrightPage) {
          throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_REQUIRED);
        }
        const SELECTOR_INPUT = '[contenteditable="true"]';
        const submitBtnLocator = globalPlaywrightPage
          .locator("button")
          .filter({
            has: globalPlaywrightPage.locator("i", {
              hasText: "arrow_forward",
            }),
          })
          .first();

        let isAlreadyOnFlowPage = false;
        try {
          const currentUrl = globalPlaywrightPage.url();
          if ([cleanProjectId, "labs.google"].every(kw => currentUrl.includes(kw))) {
            isAlreadyOnFlowPage = true;
          }
        } catch (e) {
          isAlreadyOnFlowPage = false;
        }

        if (!isAlreadyOnFlowPage) {
          appLog(
            `${BACKEND_MESSAGES.PLAYWRIGHT_REDIRECT_LOG}${cleanProjectId} (Attempt ${attempts})...`
          );
          await globalPlaywrightPage.goto(targetUrl, {
            waitUntil: "domcontentloaded",
          });
        }

        appLog(`${BACKEND_MESSAGES.PLAYWRIGHT_INPUT_LOG}"${finalPrompt || prompt}"`);

        const inputEl = await globalPlaywrightPage.waitForSelector(SELECTOR_INPUT, {
          timeout: 30000,
        });
        if (!inputEl) throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_INPUT_NOT_FOUND);

        try {
          const currentConfigState = JSON.stringify({
            generateType: visualConfig?.generateType || "image",
            aspectRatio: visualConfig?.aspectRatio || "16:9",
            generateCount: visualConfig?.generateCount || 1,
            imageGeneratorEngine: visualConfig?.imageGeneratorEngine || "veo3",
          });

          if (currentConfigState !== lastPlaywrightConfigState || attempts > 1) {
            appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_NEW);
            const submitBtnWrapper = submitBtnLocator.locator("xpath=..");
            const configBtnLoc = submitBtnWrapper.locator('button[aria-haspopup="menu"]').first();

            if (await configBtnLoc.isVisible()) {
              await configBtnLoc.click();
              await globalPlaywrightPage.waitForTimeout(1000);

              const isVideo = visualConfig?.generateType === "video";
              const typeLabel = isVideo ? BACKEND_MESSAGES.LABS_VIDEO : BACKEND_MESSAGES.LABS_IMAGE;
              const typeBtn = globalPlaywrightPage
                .locator('[role="menu"] button[role="tab"]')
                .filter({ hasText: typeLabel })
                .first();
              if (await typeBtn.isVisible()) await typeBtn.click();

              const targetRatio = visualConfig?.aspectRatio || "16:9";
              const ratioBtn = globalPlaywrightPage
                .locator('[role="menu"] button[role="tab"]')
                .filter({ hasText: new RegExp(`^${targetRatio}$`, "i") })
                .first();
              if (await ratioBtn.isVisible()) await ratioBtn.click();

              const targetCount = visualConfig?.generateCount || 1;
              const countLabel = targetCount === 1 ? "1x" : `x${targetCount}`;
              const countBtn = globalPlaywrightPage
                .locator('[role="menu"] button[role="tab"]')
                .filter({ hasText: new RegExp(`^${countLabel}$`, "i") })
                .first();
              if (await countBtn.isVisible()) await countBtn.click();

              const targetEngineKey = visualConfig?.imageGeneratorEngine || "veo3";
              const engineMap: Record<string, string> = {
                imagen: BACKEND_MESSAGES.LABS_IMAGEN,
                veo3: BACKEND_MESSAGES.LABS_VEO,
              };
              const targetEngine = engineMap[targetEngineKey];
              if (targetEngine) {
                const engineDropdownBtn = globalPlaywrightPage
                  .locator('[role="menu"] button[aria-haspopup="menu"]')
                  .filter({ hasText: /Banana|Imagen/i })
                  .first();
                if (await engineDropdownBtn.isVisible()) {
                  const currentEngineText = await engineDropdownBtn.textContent();
                  if (currentEngineText && !currentEngineText.includes(targetEngine)) {
                    await engineDropdownBtn.click();
                    await globalPlaywrightPage.waitForTimeout(500);
                    const optionBtn = globalPlaywrightPage
                      .locator('[role="menuitem"]')
                      .filter({ hasText: new RegExp(targetEngine, "i") })
                      .first();
                    if (await optionBtn.isVisible()) await optionBtn.click();
                  }
                }
              }

              await globalPlaywrightPage.keyboard.press("Escape");
              await globalPlaywrightPage.waitForTimeout(500);

              lastPlaywrightConfigState = currentConfigState;
              appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_SUCCESS);
            }
          }
        } catch (configErr) {
          appError(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_SKIP, configErr);
        }

        const targetPrompt = finalPrompt || prompt;
        if (targetPrompt && targetPrompt.length > 0) {
          const inputMethod = visualConfig?.promptInputMethod || PromptInputMethod.Paste;
          appLog(inputMethod === PromptInputMethod.Type ? BACKEND_MESSAGES.PLAYWRIGHT_TYPE_LOG : BACKEND_MESSAGES.PLAYWRIGHT_PASTE_LOG);

          const inputLoc = globalPlaywrightPage.locator(SELECTOR_INPUT);
          const delayFn = (ms: number) => new Promise((r) => setTimeout(r, ms));
          const randomDelay = (min: number, max: number) =>
            delayFn(Math.floor(Math.random() * (max - min + 1) + min));

          await smoothMouseMove(globalPlaywrightPage, inputLoc);
          await inputLoc.click();
          await randomDelay(200, 400);

          await globalPlaywrightPage.keyboard.press("Control+A");
          await randomDelay(150, 300);
          await globalPlaywrightPage.keyboard.press("Backspace");
          await randomDelay(200, 400);

          if (inputMethod === PromptInputMethod.Type) {
            await humanType(globalPlaywrightPage, targetPrompt);
          } else {
            await globalPlaywrightPage.keyboard.insertText(targetPrompt);
          }
          await randomDelay(400, 800);

          await globalPlaywrightPage.keyboard.press("Space");
          await randomDelay(100, 200);
          await globalPlaywrightPage.keyboard.press("Backspace");
          
          await randomDelay(1500, 3000);
        }

        const oldIds = await globalPlaywrightPage.evaluate((getImgIdStr) => {
          const getImgId = new Function("return " + getImgIdStr)();
          const imgs = Array.from(document.querySelectorAll("img"));
          return imgs
            .filter((img) => img.src && img.src.includes("getMediaUrlRedirect"))
            .map((img) => {
              if (typeof (window as any).__getImgId === "function") {
                return (window as any).__getImgId(img.src);
              }
              return getImgId(img.src);
            })
            .filter(Boolean);
        }, getImgIdSafe.toString());

        let isBtnDisabled = true;
        for (let i = 0; i < 6; i++) {
          try {
            isBtnDisabled = await submitBtnLocator.evaluate((btn) => {
              return (
                !btn ||
                btn.hasAttribute("disabled") ||
                btn.getAttribute("aria-disabled") === "true"
              );
            });
          } catch (e) {
            isBtnDisabled = true;
          }
          if (!isBtnDisabled) break;
          await new Promise((r) => setTimeout(r, 500));
        }

        appLog(BACKEND_MESSAGES.PLAYWRIGHT_SUBMIT_LOG);
        await submitBtnLocator.waitFor({ state: "visible", timeout: 5000 });
        await submitBtnLocator.scrollIntoViewIfNeeded();

        await smoothMouseMove(globalPlaywrightPage, submitBtnLocator);
        const delayFnSubmit = (ms: number) => new Promise((r) => setTimeout(r, ms));
        await delayFnSubmit(Math.floor(Math.random() * 400 + 400));
        await submitBtnLocator.click();

        appLog(BACKEND_MESSAGES.PLAYWRIGHT_WAITING_GEN);
        const base64Data = await globalPlaywrightPage.waitForFunction(
          ([oldIdsList, getImgIdStr]) => {
            const getImgId = new Function("return " + getImgIdStr)();
            const imgs = Array.from(document.querySelectorAll("img"));
            const genImgs = imgs.filter(
              (img) => img.src && img.src.includes("getMediaUrlRedirect")
            );

            const newImg = [...genImgs]
              .reverse()
              .find((img) => {
                const imgId = getImgId(img.src);
                return imgId && !oldIdsList.includes(imgId);
              });

            if (newImg) {
              try {
                newImg.scrollIntoView({
                  behavior: "instant",
                  block: "center",
                });
              } catch (e) { }

              if (!newImg.complete || newImg.naturalWidth === 0) return null;

              const canvas = document.createElement("canvas");
              canvas.width = newImg.naturalWidth;
              canvas.height = newImg.naturalHeight;
              canvas.getContext("2d")?.drawImage(newImg, 0, 0);
              try {
                const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
                if (dataUrl.length > 1000) return dataUrl;
              } catch (e) { }
            }
            return null;
          },
          [oldIds, getImgIdSafe.toString()] as const,
          { timeout: 150000 }
        );

        const finalBase64 = await base64Data.jsonValue();
        appLog(BACKEND_MESSAGES.PLAYWRIGHT_BASE64_SUCCESS);

        responseText = JSON.stringify({ directBase64: finalBase64 });
        success = true;
      } catch (err: any) {
        appError(`[Image Render] Attempt ${attempts} failed: ${err.message}`);
        
        const closedKeywords = ["closed", "close", "context"];
        const isClosedError = closedKeywords.some((kw) =>
          err.message?.toLowerCase().includes(kw)
        );
        if (isClosedError) {
          appLog(BACKEND_MESSAGES.PLAYWRIGHT_CLOSED_DETECTED_RESET);
          await closePlaywright().catch(() => {});
        }

        if (attempts < maxAttempts) {
          try {
            if (globalPlaywrightPage && !globalPlaywrightPage.isClosed()) {
              appLog(BACKEND_MESSAGES.IMAGE_RENDER_RELOAD);
              await globalPlaywrightPage.reload({ waitUntil: "domcontentloaded" });
              await globalPlaywrightPage.waitForTimeout(5000);
            }
          } catch (reloadErr: any) {
            appError("FAILED_RELOAD_PAGE_RETRY", reloadErr);
            if (closedKeywords.some((kw) => reloadErr.message?.toLowerCase().includes(kw))) {
              await closePlaywright().catch(() => {});
            }
          }
        } else {
          throw err;
        }
      }
    }
  } catch (axiosErr: any) {
    const status = axiosErr.response?.status || 500;
    const errText = axiosErr.response?.data || axiosErr.message;
    appError(`[Labs Sandbox Error] returned status ${status}: ${errText}`);

    let warnReason = `${BACKEND_MESSAGES.PLAYWRIGHT_SANDBOX_ERR} (HTTP ${status}). ${BACKEND_MESSAGES.PLAYWRIGHT_RECAPTCHA}`;
    try {
      const errorJson = typeof errText === "string" ? JSON.parse(errText) : errText;
      if (errorJson?.error?.details?.[0]?.reason) {
        warnReason += ` ${BACKEND_MESSAGES.PLAYWRIGHT_REASON}${errorJson.error.details[0].reason}`;
      }
    } catch (e) { }

    return {
      success: false,
      base64: null,
      fallbackUrl,
      warning: warnReason,
    };
  } finally {
    release();
  }

  try {
    const parsed = JSON.parse(responseText);
    if (parsed.directBase64) {
      let cleanBase64 = parsed.directBase64;
      if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1];
      }

      return {
        success: true,
        base64: cleanBase64,
        fallbackUrl: parsed.directBase64,
      };
    }
  } catch (e) { }

  return {
    success: false,
    base64: null,
    fallbackUrl,
    warning: BACKEND_MESSAGES.PLAYWRIGHT_DECODE_ERR,
  };
}
