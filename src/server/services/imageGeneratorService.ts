import { globalPlaywrightPage, initPlaywright, closePlaywright } from "./audioService.js";
import { EXTERNAL_URLS, BACKEND_MESSAGES, STICKMAN_KEYWORDS, DEFAULT_IMAGE_KEYWORDS, PROMPT_FILLER_WORDS, STICKMAN_STYLE_MODIFIERS, DEFAULT_PROJECT_ID, NON_ALPHANUMERIC_SPACE_REGEX, PLAYWRIGHT_SUBMIT_ICON_REGEX, PLAYWRIGHT_SUBMIT_TEXT_REGEX } from "../../constants";
import { appLog, appError, createAppError } from "../../lib/logger.js";
import { randomDelay, getBatchDelayMs } from "../../lib/shared-utils.js";
import { GenerateType, ImageGeneratorEngine, PromptInputMethod, ImageGenerationMode, GeminiChatModelName, GeminiChatSelector, GeminiChatTextOption, GeminiChatSpeed, GEMINI_CHAT_SPEED_TAB_COUNT, AspectRatio } from "../../types.js";
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
      await randomDelay(5, 15);
    }

    await page.mouse.move(targetX, targetY);
    await randomDelay(100, 250);
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
    generationMode?: ImageGenerationMode;
    geminiChatSpeed?: GeminiChatSpeed;
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
  const clean = text.replace(NON_ALPHANUMERIC_SPACE_REGEX, " ");
  const words = clean
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 3);
  const filtered = words.filter((w) => !PROMPT_FILLER_WORDS.includes(w as any));
  return filtered.slice(0, 3).join(",");
};

let lastPlaywrightConfigState: string | null = null;
let consecutiveGeminiErrors = 0;
let lastGeminiConfigState: string | null = null;
let globalBatchPages: Page[] = [];
const batchPagesErrors = new WeakMap<Page, number>();
const batchPagesConfigs = new WeakMap<Page, string>();

export async function generateImageWithPlaywright(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {
  const { prompt, style, visualConfig, sandboxConfig = {} } = options;

  if (visualConfig?.generationMode === ImageGenerationMode.GeminiChat) {
    return generateImageWithGeminiChat(options);
  }

  const isStickman = !![style, prompt].some((str) => str && STICKMAN_KEYWORDS.some((kw) => str.toLowerCase().includes(kw)));

  let finalPrompt = prompt || "";
  if (isStickman) {
    const stickmanStyleModifiers = STICKMAN_STYLE_MODIFIERS;
    finalPrompt = `${finalPrompt}, ${stickmanStyleModifiers}`;
  }

  const kws = extractKeywords(prompt);
  const fallbackUrl = isStickman ? `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/stickman,cartoon` : `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/${encodeURIComponent(kws || "cinematic,landscape")}`;

  const projectId = sandboxConfig.projectId || DEFAULT_PROJECT_ID;
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
      await globalPlaywrightPage.evaluate(
        ({ getImgIdStr }) => {
          if (typeof window !== "undefined") {
            if (!(window as any).__name) {
              (window as any).__name = (target: any, value: any) => {
                try {
                  Object.defineProperty(target, "name", {
                    value,
                    configurable: true,
                  });
                } catch (e) {}
                return target;
              };
            }
            if (!(window as any).__getImgId) {
              (window as any).__getImgId = new Function("return " + getImgIdStr)();
            }
          }
        },
        { getImgIdStr: getImgIdSafe.toString() },
      );
    } catch (err) {
      appError("Failed to inject helpers on current page context:", err);
    }

    const targetUrl = `${EXTERNAL_URLS.GOOGLE_LABS_FLOW}/${cleanProjectId}`;

    while (attempts < maxAttempts && !success) {
      attempts++;
      appLog(`${BACKEND_MESSAGES.IMAGE_RENDER_ATTEMPT}${attempts}/${maxAttempts}${BACKEND_MESSAGES.IMAGE_RENDER_STARTING}`);
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
            has: globalPlaywrightPage.locator("i").filter({ hasText: PLAYWRIGHT_SUBMIT_ICON_REGEX }),
          })
          .filter({ hasText: PLAYWRIGHT_SUBMIT_TEXT_REGEX })
          .last();

        let isAlreadyOnFlowPage = false;
        try {
          const currentUrl = globalPlaywrightPage.url();
          if ([cleanProjectId, "labs.google"].every((kw) => currentUrl.includes(kw))) {
            isAlreadyOnFlowPage = true;
          }
        } catch (e) {
          isAlreadyOnFlowPage = false;
        }

        if (!isAlreadyOnFlowPage) {
          appLog(`${BACKEND_MESSAGES.PLAYWRIGHT_REDIRECT_LOG}${cleanProjectId} (Attempt ${attempts})...`);
          await globalPlaywrightPage.goto(targetUrl, {
            waitUntil: "commit",
            timeout: 60000,
          });
        }

        appLog(`${BACKEND_MESSAGES.PLAYWRIGHT_INPUT_LOG}"${finalPrompt || prompt}"`);

        const inputEl = await globalPlaywrightPage.waitForSelector(SELECTOR_INPUT, {
          timeout: 30000,
        });
        if (!inputEl) throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_INPUT_NOT_FOUND);

        try {
          const currentConfigState = JSON.stringify({
            generateType: visualConfig?.generateType || GenerateType.Image,
            aspectRatio: visualConfig?.aspectRatio || AspectRatio.SixteenNine,
            generateCount: visualConfig?.generateCount || 1,
            imageGeneratorEngine: visualConfig?.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
          });

          if (currentConfigState !== lastPlaywrightConfigState || attempts > 1) {
            appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_NEW);
            const configBtnLoc = globalPlaywrightPage
              .locator("button")
              .filter({
                has: globalPlaywrightPage.locator("i").filter({ hasText: "tune" }),
              })
              .first();

            if (await configBtnLoc.isVisible()) {
              await configBtnLoc.click();
              await globalPlaywrightPage.waitForTimeout(1000);

              const isVideo = visualConfig?.generateType === GenerateType.Video;
              const sectionKeyword = isVideo ? /(tạo video|video generation|video)/i : /(tạo hình ảnh|image generation|image)/i;
              const sectionSpan = globalPlaywrightPage.locator("span").filter({ hasText: sectionKeyword }).last();

              if (await sectionSpan.isVisible()) {
                const sectionDiv = sectionSpan.locator("xpath=..");

                const targetRatio = visualConfig?.aspectRatio || AspectRatio.SixteenNine;
                const ratioBtn = sectionDiv
                  .locator('[role="tab"]')
                  .filter({ hasText: new RegExp(`^${targetRatio}$`, "i") })
                  .first();
                if (await ratioBtn.isVisible()) await ratioBtn.click();

                const targetCount = visualConfig?.generateCount || 1;
                const countLabel = targetCount === 1 ? "1x" : `x${targetCount}`;
                const countBtn = sectionDiv
                  .locator('[role="tab"]')
                  .filter({ hasText: new RegExp(`^${countLabel}$`, "i") })
                  .first();
                if (await countBtn.isVisible()) await countBtn.click();

                const targetEngineKey = (visualConfig?.imageGeneratorEngine || ImageGeneratorEngine.Veo3).toLowerCase();

                let exactEngineRegex: RegExp;
                let fallbackEngineRegex: RegExp;

                if (targetEngineKey === "imagen") {
                  exactEngineRegex = /(imagen|banana pro)/i;
                  fallbackEngineRegex = /(imagen|banana pro|banana)/i;
                } else if (targetEngineKey === "labs-sandbox") {
                  exactEngineRegex = /(labs-sandbox|sandbox|banana 2 lite)/i;
                  fallbackEngineRegex = /(labs-sandbox|sandbox|banana 2 lite|banana)/i;
                } else {
                  exactEngineRegex = /(veo|omni flash|banana 2\b(?!.*lite))/i;
                  fallbackEngineRegex = /(veo|omni flash|banana 2)/i;
                }
                const engineDropdownBtn = sectionDiv.locator('button[aria-haspopup="menu"]').first();

                if (await engineDropdownBtn.isVisible()) {
                  const currentEngineText = await engineDropdownBtn.textContent();
                  if (currentEngineText && !exactEngineRegex.test(currentEngineText)) {
                    await engineDropdownBtn.click({ force: true });
                    await globalPlaywrightPage.waitForTimeout(500);
                    let optionBtn = globalPlaywrightPage.locator('[role="menuitem"]:visible').filter({ hasText: exactEngineRegex }).first();
                    if (!(await optionBtn.isVisible())) {
                      optionBtn = globalPlaywrightPage.locator('[role="menuitem"]:visible').filter({ hasText: fallbackEngineRegex }).first();
                    }
                    if (await optionBtn.isVisible()) await optionBtn.click({ force: true });
                  }
                }
              }

              const saveBtn = globalPlaywrightPage
                .locator("button:visible")
                .filter({ hasText: /^(Lưu|Save)$/i })
                .first();
              if (await saveBtn.isVisible()) {
                await saveBtn.click();
              } else {
                await globalPlaywrightPage.keyboard.press("Escape");
              }
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
              return !btn || btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true";
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
        await randomDelay(400, 800);
        await submitBtnLocator.click();

        appLog(BACKEND_MESSAGES.PLAYWRIGHT_WAITING_GEN);
        const base64Data = await globalPlaywrightPage.waitForFunction(
          ([oldIdsList, getImgIdStr]) => {
            const getImgId = new Function("return " + getImgIdStr)();
            const imgs = Array.from(document.querySelectorAll("img"));
            const genImgs = imgs.filter((img) => img.src && img.src.includes("getMediaUrlRedirect"));

            const newImg = [...genImgs].reverse().find((img) => {
              const imgId = getImgId(img.src);
              return imgId && !oldIdsList.includes(imgId);
            });

            if (newImg) {
              try {
                newImg.scrollIntoView({
                  behavior: "instant",
                  block: "center",
                });
              } catch (e) {}

              if (!newImg.complete || newImg.naturalWidth === 0) return null;

              const canvas = document.createElement("canvas");
              canvas.width = newImg.naturalWidth;
              canvas.height = newImg.naturalHeight;
              canvas.getContext("2d")?.drawImage(newImg, 0, 0);
              try {
                const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
                if (dataUrl.length > 1000) return dataUrl;
              } catch (e) {}
            }
            return null;
          },
          [oldIds, getImgIdSafe.toString()] as const,
          { timeout: 150000 },
        );

        const finalBase64 = await base64Data.jsonValue();
        appLog(BACKEND_MESSAGES.PLAYWRIGHT_BASE64_SUCCESS);

        responseText = JSON.stringify({ directBase64: finalBase64 });
        success = true;
      } catch (err: any) {
        appError(`[Image Render] Attempt ${attempts} failed: ${err.message}`);

        const closedKeywords = ["closed", "close", "context"];
        const isClosedError = closedKeywords.some((kw) => err.message?.toLowerCase().includes(kw));
        if (isClosedError) {
          appLog(BACKEND_MESSAGES.PLAYWRIGHT_CLOSED_DETECTED_RESET);
          await closePlaywright().catch(() => {});
        }

        if (attempts < maxAttempts) {
          try {
            if (globalPlaywrightPage && !globalPlaywrightPage.isClosed()) {
              appLog(BACKEND_MESSAGES.IMAGE_RENDER_RELOAD);
              await globalPlaywrightPage.reload({
                waitUntil: "domcontentloaded",
              });
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
    } catch (e) {}

    return {
      success: false,
      base64: null,
      fallbackUrl,
      warning: warnReason,
    };
  } finally {
    const delayTime = await randomDelay();
    appLog(BACKEND_MESSAGES.PLAYWRIGHT_MUTEX_DELAY.replace("{0}", delayTime.toString()));
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
  } catch (e) {}

  return {
    success: false,
    base64: null,
    fallbackUrl,
    warning: BACKEND_MESSAGES.PLAYWRIGHT_DECODE_ERR,
  };
}

export async function generateImageWithGeminiChat(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {
  const { prompt, style, visualConfig } = options;

  const isStickman = !![style, prompt].some((str) => str && STICKMAN_KEYWORDS.some((kw) => str.toLowerCase().includes(kw)));

  let finalPrompt = prompt || "";
  if (isStickman) {
    finalPrompt = `${finalPrompt}, ${STICKMAN_STYLE_MODIFIERS}`;
  }

  const kws = extractKeywords(prompt);
  const fallbackUrl = isStickman ? `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/stickman,cartoon` : `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/${encodeURIComponent(kws || "cinematic,landscape")}`;

  const release = await imageGenMutex.acquire();
  await randomDelay(1000, 4000);
  let success = false;
  let base64Result: string | null = null;
  let roomAttempts = 0;
  const maxRoomAttempts = 2;

  try {
    while (roomAttempts < maxRoomAttempts && !success) {
      roomAttempts++;

      let needNewRoom = false;
      if (!globalPlaywrightPage || globalPlaywrightPage.isClosed()) {
        needNewRoom = true;
      } else {
        const currentUrl = globalPlaywrightPage.url();
        if (!currentUrl.includes("gemini.google.com")) {
          needNewRoom = true;
        } else if (consecutiveGeminiErrors >= 2) {
          needNewRoom = true;
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_ROOM_FORCED);
        }
      }

      if (needNewRoom) {
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_START_ROOM.replace("{0}", roomAttempts.toString()).replace("{1}", maxRoomAttempts.toString()));
        try {
          if (!globalPlaywrightPage || globalPlaywrightPage.isClosed()) {
            await initPlaywright();
          }
          if (!globalPlaywrightPage) {
            throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_REQUIRED);
          }

          await globalPlaywrightPage.goto(EXTERNAL_URLS.GEMINI_CHAT, {
            waitUntil: "commit",
            timeout: 60000,
          });
          await randomDelay(3000, 5000);
          consecutiveGeminiErrors = 0;
        } catch (err: any) {
          appError(BACKEND_MESSAGES.GEMINI_CHAT_INIT_FAILED.replace("{0}", err.message));
          if (roomAttempts >= maxRoomAttempts) {
            throw err;
          }
          continue;
        }
      } else {
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_ROOM_REUSE);
      }

      let reloadAttempts = 0;
      const maxReloadAttempts = 4;

      while (reloadAttempts < maxReloadAttempts && !success) {
        reloadAttempts++;
        if (reloadAttempts > 1) {
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_RELOAD.replace("{0}", (reloadAttempts - 1).toString()));
          try {
            await globalPlaywrightPage.reload({ waitUntil: "domcontentloaded" });
            await randomDelay(3000, 5000);
          } catch (reloadErr: any) {
            appError(BACKEND_MESSAGES.GEMINI_CHAT_RELOAD_FAILED.replace("{0}", reloadErr.message));
            continue;
          }
        }

        try {
          const inputLoc = globalPlaywrightPage.locator(GeminiChatSelector.Input).first();
          await inputLoc.waitFor({ state: "visible", timeout: 60000 });

          const currentConfigState = JSON.stringify({
            generateType: visualConfig?.generateType || GenerateType.Image,
            imageGeneratorEngine: visualConfig?.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
          });
          const isConfigChanged = currentConfigState !== lastGeminiConfigState;
          const forceSetting = needNewRoom || isConfigChanged;

          await configureGeminiModel(globalPlaywrightPage, visualConfig, forceSetting);
          await configureGeminiGenerateType(globalPlaywrightPage, visualConfig, forceSetting);

          if (forceSetting) {
            lastGeminiConfigState = currentConfigState;
          }

          await enterGeminiPrompt(globalPlaywrightPage, finalPrompt, visualConfig);

          const initialResponseCount = await globalPlaywrightPage.locator("model-response").count();
          const sendBtn = globalPlaywrightPage.locator(GeminiChatSelector.SendButton).first();
          let clicked = false;
          try {
            if ((await sendBtn.isVisible()) && !(await sendBtn.isDisabled())) {
              await sendBtn.click();
              clicked = true;
              appLog(BACKEND_MESSAGES.GEMINI_CHAT_CLICKED_SEND);
            }
          } catch (e: any) {
            appError(BACKEND_MESSAGES.GEMINI_CHAT_CLICK_SEND_FAILED.replace("{0}", e.message));
          }

          if (!clicked) {
            await globalPlaywrightPage.keyboard.press("Enter");
            appLog(BACKEND_MESSAGES.GEMINI_CHAT_PRESSED_ENTER);
          }
          await randomDelay(1200, 2200);

          base64Result = await waitForDownloadAndGetBase64(globalPlaywrightPage, visualConfig, initialResponseCount);
          if (base64Result) {
            success = true;
            consecutiveGeminiErrors = 0;
          } else {
            throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERR_THROW);
          }
        } catch (err: any) {
          consecutiveGeminiErrors++;
          appError(BACKEND_MESSAGES.GEMINI_CHAT_ATTEMPT_FAILED.replace("{0}", reloadAttempts.toString()).replace("{1}", roomAttempts.toString()).replace("{2}", err.message));
        }
      }
    }
  } catch (err: any) {
    appError(BACKEND_MESSAGES.GEMINI_CHAT_FAILED_COMPLETELY.replace("{0}", err.message));
  } finally {
    const delayTime = await randomDelay();
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_MUTEX_DELAY.replace("{0}", delayTime.toString()));
    release();
  }

  if (success && base64Result) {
    return {
      success: true,
      base64: base64Result,
      fallbackUrl: `data:image/jpeg;base64,${base64Result}`,
    };
  }

  return {
    success: false,
    base64: null,
    fallbackUrl,
    warning: BACKEND_MESSAGES.GEMINI_CHAT_FALLBACK_WARNING,
  };
}

export interface BatchImageItem {
  sceneId: string;
  prompt: string;
}

export interface BatchImageResult {
  sceneId: string;
  success: boolean;
  base64: string | null;
  fallbackUrl: string;
  warning?: string;
}

export async function closeAllBatchPages() {
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_CLOSE_TABS.replace("{0}", globalBatchPages.length.toString()));
  for (const page of globalBatchPages) {
    try {
      if (!page.isClosed()) {
        await page.close();
      }
    } catch (e) {}
  }
  globalBatchPages = [];
}

async function applyBatchDelay(visualConfig: any): Promise<number> {
  const ms = getBatchDelayMs(visualConfig?.batchDelay);
  await new Promise((resolve) => setTimeout(resolve, ms));
  return ms;
}

export async function generateBatchImagesWithGeminiChat(items: BatchImageItem[], visualConfig: any, style?: string, onProgress?: (result: BatchImageResult) => void): Promise<BatchImageResult[]> {
  if (!items || items.length === 0) {
    return [];
  }

  const speed = visualConfig?.geminiChatSpeed || GeminiChatSpeed.Slow;
  const concurrency = GEMINI_CHAT_SPEED_TAB_COUNT[speed] || 1;
  const maxTabs = Math.min(items.length, concurrency);

  if (maxTabs === 1) {
    const results: BatchImageResult[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const result = await generateImageWithGeminiChat({
        prompt: item.prompt,
        style,
        visualConfig,
      });
      const batchRes = {
        sceneId: item.sceneId,
        ...result,
      };
      results.push(batchRes);
      if (onProgress) {
        onProgress(batchRes);
      }

      if (i < items.length - 1) {
        const delayTime = await applyBatchDelay(visualConfig);
        appLog(BACKEND_MESSAGES.SPAM_PREVENTION_DELAY.replace("{0}", delayTime.toString()));
      }
    }
    return results;
  }

  const release = await imageGenMutex.acquire();
  const results: BatchImageResult[] = [];

  try {
    if (!globalPlaywrightPage || globalPlaywrightPage.isClosed()) {
      await initPlaywright();
    }
    if (!globalPlaywrightPage) {
      throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_REQUIRED);
    }

    const browser = globalPlaywrightPage.context().browser();
    if (!browser) {
      throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_REQUIRED);
    }

    const context = browser.contexts()[0];
    if (!context) {
      throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_REQUIRED);
    }

    globalBatchPages = globalBatchPages.filter((p) => !p.isClosed());

    if (globalBatchPages.length < maxTabs) {
      const needed = maxTabs - globalBatchPages.length;
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_START.replace("{0}", needed.toString()));
      for (let i = 0; i < needed; i++) {
        const newPage = await context.newPage();
        await newPage.goto(EXTERNAL_URLS.GEMINI_CHAT, { waitUntil: "commit", timeout: 60000 });
        await randomDelay(2000, 4000);
        globalBatchPages.push(newPage);
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_INIT.replace("{0}", globalBatchPages.length.toString()).replace("{1}", maxTabs.toString()));
      }
    }

    const activePages = globalBatchPages.slice(0, maxTabs);

    for (let i = 0; i < activePages.length; i++) {
      const page = activePages[i];
      try {
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_PREPARE_NEW_ROOM.replace("{0}", (i + 1).toString()));
        await page.goto(EXTERNAL_URLS.GEMINI_CHAT, { waitUntil: "commit", timeout: 60000 });
        await randomDelay(2000, 4000);
        batchPagesErrors.set(page, 0);
      } catch (err: any) {
        appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_PREPARE_NEW_ROOM_ERR.replace("{0}", (i + 1).toString()).replace("{1}", err.message));
      }
    }

    const generateOnTab = async (page: Page, item: BatchImageItem, tabIndex: number): Promise<BatchImageResult> => {
      const isStickman = !![style, item.prompt].some((str) => str && STICKMAN_KEYWORDS.some((kw) => str.toLowerCase().includes(kw)));

      let finalPrompt = item.prompt || "";
      if (isStickman) {
        finalPrompt = `${finalPrompt}, ${STICKMAN_STYLE_MODIFIERS}`;
      }

      const kws = extractKeywords(item.prompt);
      const fallbackUrl = isStickman ? `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/stickman,cartoon` : `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/${encodeURIComponent(kws || DEFAULT_IMAGE_KEYWORDS)}`;

      let success = false;
      let base64Result: string | null = null;
      let roomAttempts = 0;
      const maxRoomAttempts = 2;

      try {
        while (roomAttempts < maxRoomAttempts && !success) {
          roomAttempts++;

          if (page.isClosed()) {
            throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_PAGE_CLOSED);
          }

          const currentUrl = page.url();
          const consecutiveErrors = batchPagesErrors.get(page) || 0;
          let needNewRoom = false;

          if (!currentUrl.includes("gemini.google.com")) {
            needNewRoom = true;
          } else if (consecutiveErrors >= 2) {
            needNewRoom = true;
            appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_FORCED_NEW_ROOM.replace("{0}", (tabIndex + 1).toString()).replace("{1}", consecutiveErrors.toString()));
          }

          if (needNewRoom) {
            appLog(
              BACKEND_MESSAGES.GEMINI_CHAT_BATCH_REDIRECT_ATTEMPT.replace("{0}", (tabIndex + 1).toString())
                .replace("{1}", roomAttempts.toString())
                .replace("{2}", maxRoomAttempts.toString()),
            );
            try {
              await page.goto(EXTERNAL_URLS.GEMINI_CHAT, { waitUntil: "commit", timeout: 60000 });
              await randomDelay(2000, 4000);
              batchPagesErrors.set(page, 0);
            } catch (err: any) {
              appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_REDIRECT_FAILED.replace("{0}", (tabIndex + 1).toString()).replace("{1}", err.message));
              if (roomAttempts >= maxRoomAttempts) {
                throw err;
              }
              continue;
            }
          } else {
            appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_ROOM_REUSE.replace("{0}", (tabIndex + 1).toString()));
          }

          let reloadAttempts = 0;
          const maxReloadAttempts = 4;

          while (reloadAttempts < maxReloadAttempts && !success) {
            reloadAttempts++;
            if (reloadAttempts > 1) {
              appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_RELOAD_ATTEMPT.replace("{0}", (tabIndex + 1).toString()).replace("{1}", (reloadAttempts - 1).toString()));
              try {
                await page.reload({ waitUntil: "domcontentloaded" });
                await randomDelay(3000, 5000);
              } catch (reloadErr: any) {
                appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_RELOAD_FAILED.replace("{0}", (tabIndex + 1).toString()).replace("{1}", reloadErr.message));
                continue;
              }
            }

            try {
              appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace("{0}", (tabIndex + 1).toString()).replace("{1}", item.sceneId));

              const inputLoc = page.locator(GeminiChatSelector.Input).first();
              await inputLoc.waitFor({ state: "visible", timeout: 60000 });

              const currentConfigState = JSON.stringify({
                generateType: visualConfig?.generateType || GenerateType.Image,
                imageGeneratorEngine: visualConfig?.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
              });

              const lastConfig = batchPagesConfigs.get(page);
              const isConfigChanged = currentConfigState !== lastConfig;
              const forceSetting = needNewRoom || isConfigChanged;

              await configureGeminiModel(page, visualConfig, forceSetting);
              await configureGeminiGenerateType(page, visualConfig, forceSetting);

              if (forceSetting) {
                batchPagesConfigs.set(page, currentConfigState);
              }

              await enterGeminiPrompt(page, finalPrompt, visualConfig);

              const initialResponseCount = await page.locator("model-response").count();
              const sendBtn = page.locator(GeminiChatSelector.SendButton).first();
              let clicked = false;
              try {
                if ((await sendBtn.isVisible()) && !(await sendBtn.isDisabled())) {
                  await sendBtn.click();
                  clicked = true;
                  appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace("{0}", (tabIndex + 1).toString()).replace("{1}", `${item.sceneId} - ${BACKEND_MESSAGES.GEMINI_CHAT_CLICKED_SEND}`));
                }
              } catch (e: any) {
                appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace("{0}", (tabIndex + 1).toString()).replace("{1}", `${item.sceneId} - ${BACKEND_MESSAGES.GEMINI_CHAT_CLICK_SEND_FAILED.replace("{0}", e.message)}`));
              }

              if (!clicked) {
                await page.keyboard.press("Enter");
                appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace("{0}", (tabIndex + 1).toString()).replace("{1}", `${item.sceneId} - ${BACKEND_MESSAGES.GEMINI_CHAT_PRESSED_ENTER}`));
              }
              await randomDelay(1200, 2200);

              base64Result = await waitForDownloadAndGetBase64(page, visualConfig, initialResponseCount);
              if (base64Result) {
                success = true;
                batchPagesErrors.set(page, 0);
              } else {
                throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERR_THROW);
              }
            } catch (err: any) {
              batchPagesErrors.set(page, (batchPagesErrors.get(page) || 0) + 1);
              appError(
                BACKEND_MESSAGES.GEMINI_CHAT_BATCH_RENDER_ERROR.replace("{0}", (tabIndex + 1).toString())
                  .replace("{1}", reloadAttempts.toString())
                  .replace("{2}", err.message),
              );
            }
          }
        }
      } catch (err: any) {
        appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_FAILED_COMPLETELY.replace("{0}", (tabIndex + 1).toString()).replace("{1}", err.message));
      }

      if (success && base64Result) {
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_SUCCESS.replace("{0}", (tabIndex + 1).toString()).replace("{1}", item.sceneId));
        return {
          sceneId: item.sceneId,
          success: true,
          base64: base64Result,
          fallbackUrl: `data:image/jpeg;base64,${base64Result}`,
        };
      }

      return {
        sceneId: item.sceneId,
        success: false,
        base64: null,
        fallbackUrl,
        warning: BACKEND_MESSAGES.GEMINI_CHAT_FALLBACK_WARNING,
      };
    };

    const queue = [...items];

    const runWorker = async (page: Page, tabIndex: number) => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;

        try {
          const res = await generateOnTab(page, item, tabIndex);
          results.push(res);
          if (onProgress) {
            onProgress(res);
          }
        } catch (err: any) {
          const kws = extractKeywords(item.prompt);
          const res = {
            sceneId: item.sceneId,
            success: false,
            base64: null,
            fallbackUrl: `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/${encodeURIComponent(kws || DEFAULT_IMAGE_KEYWORDS)}`,
            warning: err.message || BACKEND_MESSAGES.UNKNOWN_ERROR,
          };
          results.push(res);
          if (onProgress) {
            onProgress(res);
          }
        }

        if (queue?.length) {
          const delayTime = await applyBatchDelay(visualConfig);
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_NEXT_DELAY.replace("{0}", (tabIndex + 1).toString()).replace("{1}", delayTime.toString()));
        }
      }
    };

    const workers = activePages.map((page, idx) => runWorker(page, idx));
    await Promise.all(workers);

    appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_COMPLETE.replace("{0}", results.filter((r) => r.success).length.toString()).replace("{1}", items.length.toString()));
  } catch (err: any) {
    appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_INIT_ERROR.replace("{0}", err.message));
    for (const item of items) {
      if (!results.find((r) => r.sceneId === item.sceneId)) {
        const kws = extractKeywords(item.prompt);
        const res = {
          sceneId: item.sceneId,
          success: false,
          base64: null,
          fallbackUrl: `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/${encodeURIComponent(kws || DEFAULT_IMAGE_KEYWORDS)}`,
          warning: err.message,
        };
        results.push(res);
        if (onProgress) {
          onProgress(res);
        }
      }
    }
  } finally {
    release();
  }

  return results;
}

async function configureGeminiModel(page: Page, visualConfig: any, forceSetting: boolean) {
  const engine = visualConfig?.imageGeneratorEngine || ImageGeneratorEngine.Veo3;
  let targetModelText = GeminiChatModelName.Pro;
  if (engine === ImageGeneratorEngine.LabsSandbox) {
    targetModelText = GeminiChatModelName.FlashLite;
  } else if (engine === ImageGeneratorEngine.Veo3) {
    targetModelText = GeminiChatModelName.Flash;
  }

  const modelPickerBtn = page.locator(GeminiChatSelector.ModelPickerButton).first();
  if (!(await modelPickerBtn.isVisible())) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_PICKER_NOT_FOUND);
    return;
  }

  if (forceSetting) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_CONFIG_MODEL.replace("{0}", targetModelText));
    const currentText = await modelPickerBtn.textContent();
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_CURRENT_MODEL.replace("{0}", currentText || ""));

    let isCorrect = false;
    if (targetModelText === GeminiChatModelName.FlashLite && currentText?.includes("Lite")) {
      isCorrect = true;
    } else if (targetModelText === GeminiChatModelName.Flash && currentText?.includes("Flash") && !currentText?.includes("Lite")) {
      isCorrect = true;
    } else if (targetModelText === GeminiChatModelName.Pro && currentText?.includes("Pro")) {
      isCorrect = true;
    }

    if (isCorrect) {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_CORRECT);
      return;
    }

    await randomDelay(800, 1500);
    await modelPickerBtn.click();
    await randomDelay(1000, 1800);

    const optionBtn = page
      .locator(GeminiChatSelector.MenuOptions)
      .filter({ hasText: new RegExp(targetModelText, "i") })
      .first();
    if (await optionBtn.isVisible()) {
      await randomDelay(500, 1000);
      await optionBtn.click();
      await randomDelay(1200, 2000);
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_SUCCESS.replace("{0}", targetModelText));
    } else {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_NOT_FOUND.replace("{0}", targetModelText));
      await page.keyboard.press("Escape");
      await randomDelay(500, 800);
    }
  } else {
    if (Math.random() < 0.3) {
      try {
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_MOCK_CHECK);
        await randomDelay(600, 1200);
        await modelPickerBtn.click();
        await randomDelay(1000, 1800);
        await page.keyboard.press("Escape");
        await randomDelay(600, 1200);
      } catch (e) {}
    }
  }
}

async function configureGeminiGenerateType(page: Page, visualConfig: any, forceSetting: boolean) {
  const isVideo = visualConfig?.generateType === GenerateType.Video;
  const targetText = isVideo ? GeminiChatTextOption.CreateVideoVi : GeminiChatTextOption.CreateImageVi;
  const targetRegex = isVideo ? new RegExp(GeminiChatTextOption.CreateVideoRegexStr, "i") : new RegExp(GeminiChatTextOption.CreateImageRegexStr, "i");

  const plusBtn = page.locator(GeminiChatSelector.PlusButton).first();
  if (!(await plusBtn.isVisible())) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_PLUS_NOT_FOUND);
    return;
  }

  if (forceSetting) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_CONFIG_GEN_TYPE.replace("{0}", targetText));
    await randomDelay(800, 1500);
    await plusBtn.click();
    await randomDelay(1000, 1800);

    const optionBtn = page.locator(GeminiChatSelector.PlusMenuOptions).filter({ hasText: targetRegex }).first();

    if (await optionBtn.isVisible()) {
      await randomDelay(500, 1000);
      await optionBtn.click();
      await randomDelay(1200, 2000);
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_SUCCESS.replace("{0}", targetText));
    } else {
      const optionBtnFallback = page.locator("button").filter({ hasText: targetRegex }).first();
      if (await optionBtnFallback.isVisible()) {
        await randomDelay(500, 1000);
        await optionBtnFallback.click();
        await randomDelay(1200, 2000);
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_FALLBACK.replace("{0}", targetText));
      } else {
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_NOT_FOUND.replace("{0}", targetText));
        await page.keyboard.press("Escape");
        await randomDelay(500, 800);
      }
    }
  } else {
    if (Math.random() < 0.3) {
      try {
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_PLUS_MOCK_CHECK);
        await randomDelay(600, 1200);
        await plusBtn.click();
        await randomDelay(1200, 2000);
        await page.keyboard.press("Escape");
        await randomDelay(600, 1200);
      } catch (e) {}
    }
  }
}

async function enterGeminiPrompt(page: Page, promptText: string, visualConfig: any) {
  const inputLoc = page.locator(GeminiChatSelector.InputTextarea).first();
  await smoothMouseMove(page, inputLoc);
  await inputLoc.focus();
  await randomDelay(300, 600);
  await inputLoc.click();
  await randomDelay(400, 800);

  const inputMethod = visualConfig?.promptInputMethod || PromptInputMethod.Paste;
  if (inputMethod === PromptInputMethod.Type) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_TYPING_PROMPT);
    await humanType(page, promptText);
  } else {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_PASTING_PROMPT);
    try {
      const context = page.context();
      await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
      const clipboardSuccess = await page.evaluate(async (text) => {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (e) {
          return false;
        }
      }, promptText);

      if (clipboardSuccess) {
        await page.keyboard.press("Control+V");
      } else {
        await page.keyboard.insertText(promptText);
      }
    } catch (pasteErr) {
      await page.keyboard.insertText(promptText);
    }
  }
  await randomDelay(1500, 3000);
}

async function waitForGeminiFinished(page: Page, timeoutMs = 150000, initialResponseCount?: number) {
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_WAITING_RESPONSE);

  if (initialResponseCount !== undefined) {
    try {
      await page.waitForFunction((expected) => document.querySelectorAll("model-response").length >= expected, initialResponseCount + 1, { timeout: 45000 });
    } catch (e) {
      appError(BACKEND_MESSAGES.GEMINI_CHAT_WAIT_NEW_RESPONSE_TIMEOUT);
      throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_NO_NEW_RESPONSE);
    }
  }

  try {
    await page.locator("thinking-overlay").waitFor({ state: "detached", timeout: 30000 });
  } catch (e) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_THINKING_DETACHED);
  }

  const latestResponse = page.locator("model-response").last();
  try {
    await latestResponse.waitFor({ state: "visible", timeout: 30000 });
  } catch (e) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_NO_RESPONSE);
  }

  try {
    const busyDiv = latestResponse.locator('message-content div[aria-busy="true"]').first();
    if (await busyDiv.isVisible()) {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_BUSY_WAIT);
      await latestResponse.locator('message-content div[aria-busy="false"]').first().waitFor({ state: "attached", timeout: timeoutMs });
    }
  } catch (e) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_BUSY_TIMEOUT);
  }

  try {
    const imageContainer = latestResponse.locator(".attachment-container.generated-images, download-generated-image-button, img.loaded").first();
    await imageContainer.waitFor({ state: "attached", timeout: 45000 });
  } catch (e) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_NO_CONTAINER);
  }

  await page.waitForTimeout(3000);
}

async function getBase64FromBlobUrl(page: Page, mediaElement: Locator): Promise<string | null> {
  try {
    const tagName = await mediaElement.evaluate((el: HTMLElement) => el.tagName.toLowerCase());

    let src = "";
    for (let i = 0; i < 30; i++) {
      src = await mediaElement.evaluate((el: any) => el.src || el.getAttribute("src") || "");
      if (src.startsWith("blob:") || src.startsWith("http") || src.startsWith("data:")) {
        break;
      }
      await page.waitForTimeout(500);
    }

    if (!src) {
      appError(BACKEND_MESSAGES.GEMINI_CHAT_NO_SRC);
      return null;
    }

    if (src.startsWith("data:")) {
      const parts = src.split(",");
      return parts[1] || null;
    }

    appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACTING_MEDIA.replace("{0}", tagName).replace("{1}", src));

    if (tagName === "img") {
      const base64Data = await mediaElement.evaluate(async (imgEl) => {
        try {
          const img = imgEl as HTMLImageElement;
          if (!img.complete || img.naturalWidth === 0) {
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              setTimeout(reject, 15000);
            });
          }
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return "ERROR:Could not get canvas context";
          ctx.drawImage(img, 0, 0);
          return canvas.toDataURL("image/jpeg", 0.95).split(",")[1];
        } catch (e: any) {
          try {
            const res = await fetch((imgEl as HTMLImageElement).src || imgEl.getAttribute("src") || "");
            const blob = await res.blob();
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                resolve((reader.result as string).split(",")[1]);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (fetchErr: any) {
            return "ERROR:" + fetchErr.message;
          }
        }
      });

      if (base64Data && !base64Data.startsWith("ERROR:")) {
        return base64Data;
      } else {
        appError(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_FAILED.replace("{0}", base64Data));
      }
    } else {
      const base64Data = await mediaElement.evaluate(async (videoEl) => {
        try {
          const res = await fetch((videoEl as HTMLVideoElement).src || videoEl.getAttribute("src") || "");
          const blob = await res.blob();
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve((reader.result as string).split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (e: any) {
          return "ERROR:" + e.message;
        }
      });

      if (base64Data && !base64Data.startsWith("ERROR:")) {
        return base64Data;
      } else {
        appError(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_FAILED.replace("{0}", base64Data));
      }
    }
  } catch (e: any) {
    appError(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERROR.replace("{0}", e.message));
  }
  return null;
}

async function waitForDownloadAndGetBase64(page: Page, visualConfig: any, initialResponseCount?: number): Promise<string | null> {
  await waitForGeminiFinished(page, 150000, initialResponseCount);

  const latestResponse = page.locator("model-response").last();
  await latestResponse.waitFor({ state: "visible", timeout: 30000 });

  if (initialResponseCount !== undefined) {
    const currentCount = await page.locator("model-response").count();
    if (currentCount <= initialResponseCount) {
      throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_PREVENT_OLD_IMAGE);
    }
  }

  const mediaLoc = latestResponse.locator("img, video").first();
  await mediaLoc.waitFor({ state: "visible", timeout: 30000 });

  const base64 = await getBase64FromBlobUrl(page, mediaLoc);
  if (base64) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_SUCCESS);
    return base64;
  }

  throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERR_THROW);
}
