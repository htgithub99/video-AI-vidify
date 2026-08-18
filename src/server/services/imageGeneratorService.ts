import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { getNextAccount, GoogleAccount } from "./accountRotatorService.js";
import { autoLoginGoogle } from "./autoLoginGoogle.js";
import path from "path";
import { getDataDirectory } from "../utils/paths.js";
import { ImageGenMessages, SecurityConstants } from "../../constants/security.js";

chromium.use(stealthPlugin());
import { EXTERNAL_URLS, BACKEND_MESSAGES, PROMPT_FILLER_WORDS, NON_ALPHANUMERIC_SPACE_REGEX, PLAYWRIGHT_SUBMIT_ICON_REGEX, PLAYWRIGHT_SUBMIT_TEXT_REGEX, IMAGE_GEN_IMAGEN_EXACT_REGEX, IMAGE_GEN_IMAGEN_FALLBACK_REGEX, IMAGE_GEN_LABS_EXACT_REGEX, IMAGE_GEN_LABS_FALLBACK_REGEX, IMAGE_GEN_VEO_EXACT_REGEX, IMAGE_GEN_VEO_FALLBACK_REGEX, GEMINI_MODEL_PRO_REGEX, GEMINI_MODEL_FLASH_REGEX, GEMINI_MODEL_FLASH_FAMILY_REGEX, GEMINI_MODEL_FLASH_LITE_REGEX, CONTENT_TYPES, COMMON_STRINGS, URL_CONSTANTS, IMAGE_ID_URL_REGEX, REFACTOR_CONSTANTS, BASE64_IMAGE_MIME_REGEX, GEMINI_BATCH_SETUP_CONFIG, GEMINI_CHAT_RECOVERY_CONFIG, GEMINI_CHAT_VIDEO_INPUT_CONFIG, GEMINI_CHAT_VIDEO_SELECTORS, GEMINI_CHAT_PACING_CONFIG, PIPELINE_CONFIG, GEMINI_DOM_DIAGNOSTICS_CONFIG, GEMINI_MEDIA_EXTRACTION_CONFIG, GEMINI_MEDIA_ERRORS, GEMINI_MODEL_SELECTION_CONFIG } from "../../constants";
import { jsonUtils } from "../../lib/json.js";
import { appLog, appError, createAppError } from "../../lib/logger.js";
import { randomDelay, getBatchDelayMs, delayAsync } from "../../lib/shared-utils.js";
import { GenerateType, ImageGeneratorEngine, PromptInputMethod, ImageGenerationMode, GeminiChatModelName, GeminiChatSelector, GeminiChatTextOption, GeminiChatSpeed, GEMINI_CHAT_SPEED_TAB_COUNT, AspectRatio, GEMINI_CHAT_MEDIA_SELECTORS, VisualConfig } from "../../types.js";
import { BrowserContext, Locator, Page } from "playwright";
import _ from "lodash";
import { removeVideoAudioTrack } from "../utils/videoAssetProcessor.js";
import { captureDomDiagnostics } from "./domDiagnosticsService.js";
import { getErrorMessage } from "../utils/errorUtils.js";
import { readEncodedProjectImage } from "./imageAssetService.js";
import { resolveBatchTabCount } from "../../services/batchGenerationPolicy.js";
import { isImageAspectRatioCompatible } from "../utils/imageAspectRatio.js";
import { removeConflictingStyleTerms } from "../../services/styleReferenceService.js";

interface BrowserSession {
  context: BrowserContext;
  page: Page;
  account: GoogleAccount;
}

type GeminiVisualConfig = Partial<VisualConfig>;

const captureGeminiDomState = (page: Page, state: string): Promise<void> => captureDomDiagnostics(page, state, {
  fileName: GEMINI_DOM_DIAGNOSTICS_CONFIG.FILE_NAME,
  selector: GEMINI_DOM_DIAGNOSTICS_CONFIG.SELECTOR,
  prioritySelector: GEMINI_DOM_DIAGNOSTICS_CONFIG.PRIORITY_SELECTOR,
  maxElements: GEMINI_DOM_DIAGNOSTICS_CONFIG.MAX_ELEMENTS,
  maxClassNameLength: GEMINI_DOM_DIAGNOSTICS_CONFIG.MAX_CLASS_NAME_LENGTH,
  maxTextLength: GEMINI_DOM_DIAGNOSTICS_CONFIG.MAX_TEXT_LENGTH,
  maxHtmlLength: GEMINI_DOM_DIAGNOSTICS_CONFIG.MAX_HTML_LENGTH,
  errorMessageTemplate: GEMINI_DOM_DIAGNOSTICS_CONFIG.ERROR_MESSAGE,
});

export async function smoothMouseMove(page: Page, locator: Locator) {
  try {
    const box = await locator.boundingBox();
    if (!box) return;

    const { START_X_BASE, START_X_RANDOM, START_Y_BASE, START_Y_RANDOM, TARGET_OFFSET_X, TARGET_OFFSET_Y } = PIPELINE_CONFIG.MOUSE_MOVE_BOUNDS;
    const startX = Math.floor(Math.random() * START_X_RANDOM + START_X_BASE);
    const startY = Math.floor(Math.random() * START_Y_RANDOM + START_Y_BASE);
    const targetX = Math.floor(box.x + box.width / 2 + (Math.random() - 0.5) * TARGET_OFFSET_X);
    const targetY = Math.floor(box.y + box.height / 2 + (Math.random() - 0.5) * TARGET_OFFSET_Y);

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
    await locator.hover().catch(() => { });
  }
}

export async function humanType(page: Page, text: string) {
  const chars = text.split("");
  const pauseChars = [" ", ",", "."];
  const { BASE, RANDOM, PAUSE_BASE, PAUSE_RANDOM } = PIPELINE_CONFIG.TYPING_DELAYS;
  for (const char of chars) {
    await page.keyboard.type(char);
    let delay = Math.floor(Math.random() * RANDOM + BASE);
    if (_.includes(pauseChars, char)) {
      delay += Math.floor(Math.random() * PAUSE_RANDOM + PAUSE_BASE);
    }
    await delayAsync(delay);
  }
}

export const getImgIdSafe = (url: string): string => {
  if (!url) return "";
  try {
    const baseUrl = _.startsWith(url, COMMON_STRINGS.SLASH_PREFIX) ? COMMON_STRINGS.RELATIVE_URL_PARSE_BASE : undefined;
    const u = new URL(url, baseUrl);

    let foundId = "";
    const hasId = _.some(URL_CONSTANTS.ID_PARAMS, (param) => {
      const idValue = u.searchParams.get(param);
      if (idValue) {
        foundId = idValue;
        return true;
      }
      return false;
    });

    if (hasId) return foundId;

    _.forEach(URL_CONSTANTS.IGNORED_PARAMS, (p) => u.searchParams.delete(p));
    return u.toString();
  } catch (error) {
    appError(BACKEND_MESSAGES.PARSE_URL_ERR, error);
    const match = url.match(IMAGE_ID_URL_REGEX);
    if (match && match[2]) return match[2];
    return url;
  }
};

export const browserGetImgIdSafeStr = `function(url) {
  if (!url) return "";
  try {
    var baseUrl = url.startsWith("${COMMON_STRINGS.SLASH_PREFIX}") ? "${COMMON_STRINGS.RELATIVE_URL_PARSE_BASE}" : undefined;
    var u = new URL(url, baseUrl);
    var idParams = ${jsonUtils.safeStringify(URL_CONSTANTS.ID_PARAMS)};
    var id = "";
    for (var i = 0; i < idParams.length; i++) {
      var val = u.searchParams.get(idParams[i]);
      if (val) { id = val; break; }
    }
    if (id) return id;
    
    var ignoredParams = ${jsonUtils.safeStringify(URL_CONSTANTS.IGNORED_PARAMS)};
    ignoredParams.forEach(function(p) { u.searchParams.delete(p); });
    return u.toString();
  } catch (e) {
    var match = url.match(${IMAGE_ID_URL_REGEX.toString()});
    if (match && match[2]) return match[2];
    return url;
  }
}`;

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
const geminiRequestPacingMutex = new SimpleMutex();
let nextGeminiRequestAt = SecurityConstants.ZERO;

const sanitizeNonNegativeInteger = (value: number | undefined): number => (
  _.defaultTo(_.max([value, SecurityConstants.ZERO]), SecurityConstants.ZERO)
);

const getGeminiRetryBackoff = (attempt: number): number => {
  const retryIndex = sanitizeNonNegativeInteger(
    _.subtract(attempt, SecurityConstants.DEFAULT_AMOUNT),
  );
  if (!_.gt(retryIndex, SecurityConstants.ZERO)) {
    return SecurityConstants.ZERO;
  }
  return _.defaultTo(_.min([
    _.multiply(
      GEMINI_CHAT_PACING_CONFIG.RETRY_BACKOFF_BASE_MS,
      GEMINI_CHAT_PACING_CONFIG.BACKOFF_MULTIPLIER ** retryIndex,
    ),
    GEMINI_CHAT_PACING_CONFIG.RETRY_BACKOFF_MAX_MS,
  ]), SecurityConstants.ZERO);
};

const getGeminiRequestWait = (attempt: number, now: number): number => (
  _.sum([
    sanitizeNonNegativeInteger(_.subtract(nextGeminiRequestAt, now)),
    getGeminiRetryBackoff(attempt),
    _.random(
      GEMINI_CHAT_PACING_CONFIG.JITTER_MIN_MS,
      GEMINI_CHAT_PACING_CONFIG.JITTER_MAX_MS,
    ),
  ])
);

async function waitForGeminiRequestSlot(attempt: number): Promise<number> {
  const release = await geminiRequestPacingMutex.acquire();
  try {
    const waitMs = getGeminiRequestWait(attempt, Date.now());
    if (_.gt(waitMs, SecurityConstants.ZERO)) {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_REQUEST_PACING.replace(
        SecurityConstants.PLACEHOLDER_0,
        _.toString(waitMs),
      ));
      await delayAsync(waitMs);
    }
    nextGeminiRequestAt = _.add(
      Date.now(),
      GEMINI_CHAT_PACING_CONFIG.MIN_REQUEST_INTERVAL_MS,
    );
    return waitMs;
  } finally {
    release();
  }
}

export interface ImageGeneratorOptions {
  prompt: string;
  style?: string;
  retainBrowserSession?: boolean;
  visualConfig?: {
    chromeHeadless?: boolean;
    generateType?: GenerateType;
    aspectRatio?: string;
    generateCount?: number;
    imageGeneratorEngine?: ImageGeneratorEngine;
    promptInputMethod?: PromptInputMethod;
    generationMode?: ImageGenerationMode;
    geminiChatSpeed?: GeminiChatSpeed;
    videoDuration?: string;
    referenceImages?: string[];
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
  newProjectId?: string;
}

export const extractKeywords = (text: string): string => {
  if (!text) return "aesthetic,cinematic";
  const clean = text.replace(NON_ALPHANUMERIC_SPACE_REGEX, " ");
  const words = _.chain(clean.split(/\s+/))
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 3)
    .value();
  const filtered = _.filter(words, (word) => !_.some(PROMPT_FILLER_WORDS, (fillerWord) => _.isEqual(fillerWord, word)));
  return filtered.slice(0, 3).join(",");
};

import crypto from "crypto";

let lastUsedEmail: string | undefined = undefined;

export async function launchBrowserForAccount(chromeHeadless?: boolean): Promise<BrowserSession> {
  let attempts = 0;
  const maxAttempts = 3;
  let account: GoogleAccount | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  while (attempts < maxAttempts) {
    attempts++;
    account = await getNextAccount(lastUsedEmail);
    if (!account) {
      throw new Error(REFACTOR_CONSTANTS.MSG_NO_ACC_AVAIL_CONFIG);
    }
    lastUsedEmail = account.email;

    const emailHash = crypto.createHash(REFACTOR_CONSTANTS.HASH_MD5).update(account.email).digest(REFACTOR_CONSTANTS.ENCODING_HEX);
    const profilePath = path.join(getDataDirectory(), REFACTOR_CONSTANTS.DIR_GOOGLE_PROFILES, `${REFACTOR_CONSTANTS.PROFILE_PREFIX}${emailHash}`);

    try {
      try {
        context = await chromium.launchPersistentContext(profilePath, {
          headless: chromeHeadless !== false,
          channel: "chrome",
          ignoreDefaultArgs: ["--enable-automation"],
          args: [
            REFACTOR_CONSTANTS.ARG_NO_SANDBOX,
            REFACTOR_CONSTANTS.ARG_DISABLE_SETUID_SANDBOX,
            REFACTOR_CONSTANTS.ARG_DISABLE_AUTOMATION_CONTROLLED,
          ],
        });
      } catch (chromeErr) {
        context = await chromium.launchPersistentContext(profilePath, {
          headless: chromeHeadless !== false,
          ignoreDefaultArgs: ["--enable-automation"],
          args: [
            REFACTOR_CONSTANTS.ARG_NO_SANDBOX,
            REFACTOR_CONSTANTS.ARG_DISABLE_SETUID_SANDBOX,
            REFACTOR_CONSTANTS.ARG_DISABLE_AUTOMATION_CONTROLLED,
          ],
        });
      }

      page = context.pages()[0] || (await context.newPage());

      try {
        await page.addInitScript(`
          if (typeof window !== 'undefined') {
            if (!window.__name) {
              window.__name = (t, v) => {
                try { Object.defineProperty(t, "name", { value: v, configurable: true }); } catch {}
                return t;
              };
            }
          }
        `);
      } catch (e) {}

      await page.goto(EXTERNAL_URLS.GOOGLE_MY_ACCOUNT, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const isLoggedIn = _.includes(currentUrl, REFACTOR_CONSTANTS.KEYWORD_MY_ACCOUNT);

      if (!isLoggedIn) {
        appLog(REFACTOR_CONSTANTS.MSG_NOT_LOGGED_IN.replace("{0}", account.email));
        const loginSuccess = await autoLoginGoogle(page, account, chromeHeadless !== false);
        if (!loginSuccess) {
          throw new Error(REFACTOR_CONSTANTS.MSG_LOGIN_FAILED.replace("{0}", account.email));
        }
      } else {
        appLog(REFACTOR_CONSTANTS.MSG_ALREADY_LOGGED_IN.replace("{0}", account.email));
      }

      return { context, page, account };
    } catch (error: unknown) {
      appError(REFACTOR_CONSTANTS.MSG_LAUNCH_LOGIN_ERR.replace("{0}", account.email).replace("{1}", getErrorMessage(error)));
      if (context) {
        await context.close().catch(() => {});
      }
    }
  }

  throw new Error(REFACTOR_CONSTANTS.MSG_ALL_ACC_FAILED);
}

let lastPlaywrightConfigState: string | null = null;
let consecutiveGeminiErrors = 0;
let lastGeminiConfigState: string | null = null;
let globalBatchPages: Page[] = [];
const batchPagesErrors = new WeakMap<Page, number>();
const batchPagesConfigs = new WeakMap<Page, string>();

let activeBrowserInstance: BrowserSession | null = null;
let activeBrowserTimeout: NodeJS.Timeout | null = null;
let activeBrowserHeadless: boolean | undefined = undefined;

export async function closeActiveBrowser() {
  if (activeBrowserTimeout) {
    clearTimeout(activeBrowserTimeout);
    activeBrowserTimeout = null;
  }
  if (activeBrowserInstance) {
    appLog(ImageGenMessages.RELEASING_GLOBAL_CHROME);
    try {
      await activeBrowserInstance.context.close();
    } catch (e) {}
    activeBrowserInstance = null;
  }
  activeBrowserHeadless = undefined;
}

export function scheduleGlobalBrowserCleanup() {
  if (activeBrowserTimeout) {
    clearTimeout(activeBrowserTimeout);
  }
  activeBrowserTimeout = setTimeout(async () => {
    appLog(ImageGenMessages.AUTO_RELEASE_CHROME_IDLE);
    await closeActiveBrowser();
  }, 120000);
}

export async function getOrLaunchGlobalBrowser(chromeHeadless?: boolean): Promise<BrowserSession> {
  if (activeBrowserTimeout) {
    clearTimeout(activeBrowserTimeout);
    activeBrowserTimeout = null;
  }

  const requestedHeadless = chromeHeadless !== false;

  if (activeBrowserInstance) {
    if (activeBrowserHeadless !== requestedHeadless) {
      appLog(ImageGenMessages.CHROME_MODE_CHANGED, activeBrowserHeadless, requestedHeadless);
      await closeActiveBrowser();
    } else {
      try {
        await activeBrowserInstance.page.url();
        appLog(ImageGenMessages.REUSING_GLOBAL_CHROME);
        return activeBrowserInstance;
      } catch (e) {
        appLog(ImageGenMessages.GLOBAL_CHROME_ERROR_REINIT);
        await closeActiveBrowser();
      }
    }
  }

  appLog(ImageGenMessages.LAUNCHING_GLOBAL_CHROME);
  activeBrowserInstance = await launchBrowserForAccount(chromeHeadless);
  activeBrowserHeadless = requestedHeadless;

  try {
    activeBrowserInstance.context.on("close", () => {
      appLog(ImageGenMessages.GLOBAL_CHROME_CLOSED_EXTERNAL);
      activeBrowserInstance = null;
      activeBrowserHeadless = undefined;
    });
  } catch (err) {}

  return activeBrowserInstance;
}

export async function generateImageWithPlaywright(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {
  const { prompt, visualConfig, sandboxConfig = {} } = options;

  if (visualConfig?.generationMode === ImageGenerationMode.GeminiChat) {
    return generateImageWithGeminiChat(options);
  }

  const finalPrompt = _.defaultTo(prompt, "");

  const projectId = sandboxConfig.projectId;
  let cleanProjectId = projectId;
  if (cleanProjectId.startsWith("projects/")) {
    cleanProjectId = cleanProjectId.replace("projects/", "");
  }

  const release = await imageGenMutex.acquire();

  let responseText = "";
  let success = false;
  let attempts = 0;
  const maxAttempts = SecurityConstants.DEFAULT_AMOUNT;
  let currentProjectId = cleanProjectId;

  let browserInstance: BrowserSession | null = null;
  let activePage: Page | null = null;

  try {
    while (attempts < maxAttempts && !success) {
      attempts++;
      appLog(`${BACKEND_MESSAGES.IMAGE_RENDER_ATTEMPT}${attempts}/${maxAttempts}${BACKEND_MESSAGES.IMAGE_RENDER_STARTING}`);
      try {
        if (!browserInstance) {
          browserInstance = await getOrLaunchGlobalBrowser(visualConfig?.chromeHeadless);
          activePage = browserInstance.page;

          try {
            await activePage.evaluate(
              ({ getImgIdStr }) => {
                if (typeof window !== "undefined") {
                  if (!(window as any).__name) {
                    (window as any).__name = (target: any, value: any) => {
                      try {
                        Object.defineProperty(target, "name", {
                          value,
                          configurable: true,
                        });
                      } catch (e) { }
                      return target;
                    };
                  }
                  if (!(window as any).__getImgId) {
                    (window as any).__getImgId = new Function("return " + getImgIdStr)();
                  }
                }
              },
              { getImgIdStr: browserGetImgIdSafeStr }
            );
          } catch (err) {
            appError(ImageGenMessages.INJECT_HELPERS_ERR, err);
          }
        }

        const SELECTOR_INPUT = '[contenteditable="true"]';
        const submitBtnLocator = activePage
          .locator("button")
          .filter({
            has: activePage.locator("i").filter({ hasText: PLAYWRIGHT_SUBMIT_ICON_REGEX }),
          })
          .filter({ hasText: PLAYWRIGHT_SUBMIT_TEXT_REGEX })
          .last();

        let isAlreadyOnFlowPage = false;
        try {
          const currentUrl = activePage.url();
          if (currentProjectId && _.every([currentProjectId, "labs.google"], (kw) => _.includes(currentUrl, kw))) {
            isAlreadyOnFlowPage = true;
          }
        } catch (e) {
          isAlreadyOnFlowPage = false;
        }

        if (!isAlreadyOnFlowPage) {
          if (!currentProjectId) {
            appLog(ImageGenMessages.LABS_NO_PROJECT);
            await activePage.goto(EXTERNAL_URLS.GOOGLE_LABS_FLOW_HOME, {
              waitUntil: "commit",
              timeout: 60000,
            });

            const newProjectBtn = activePage.locator('button').filter({ hasText: /Dự án mới|New project/i }).first();
            await newProjectBtn.waitFor({ state: "visible", timeout: 15000 });
            await newProjectBtn.click();

            await activePage.waitForURL(/\/project\/[a-zA-Z0-9-]+/, { timeout: 30000 });
            const newUrl = activePage.url();
            const match = newUrl.match(/\/project\/([a-zA-Z0-9-]+)/);
            if (match && match[1]) {
              currentProjectId = match[1];
              appLog(`${ImageGenMessages.LABS_CREATED_PROJECT}${currentProjectId}`);
            } else {
              throw createAppError(ImageGenMessages.LABS_CREATE_ERR);
            }
          } else {
            const targetUrl = `${EXTERNAL_URLS.GOOGLE_LABS_FLOW}/${currentProjectId}`;
            appLog(`${BACKEND_MESSAGES.PLAYWRIGHT_REDIRECT_LOG}${currentProjectId} (Attempt ${attempts})...`);
            await activePage.goto(targetUrl, {
              waitUntil: "commit",
              timeout: 60000,
            });
          }
        }

        appLog(`${BACKEND_MESSAGES.PLAYWRIGHT_INPUT_LOG}"${_.defaultTo(finalPrompt, prompt)}"`);

        const inputEl = await activePage.waitForSelector(SELECTOR_INPUT, {
          timeout: 30000,
        });
        if (!inputEl) throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_INPUT_NOT_FOUND);

        try {
          const currentConfigState = jsonUtils.safeStringify({
            generateType: _.defaultTo(visualConfig?.generateType, GenerateType.Image),
            aspectRatio: _.defaultTo(visualConfig?.aspectRatio, AspectRatio.SixteenNine),
            generateCount: _.defaultTo(visualConfig?.generateCount, 1),
            imageGeneratorEngine: _.defaultTo(visualConfig?.imageGeneratorEngine, ImageGeneratorEngine.Veo3),
          });

          if (currentConfigState !== lastPlaywrightConfigState || attempts > 1) {
            appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_NEW);
            const configBtnLoc = activePage
              .locator('button[aria-haspopup="menu"]')
              .filter({
                hasText: /1x|x2|x3|x4|16:9|4:3|1:1|3:4|9:16|Nano|Veo|Imagen/i
              })
              .first();

            if (await configBtnLoc.isVisible()) {
              await configBtnLoc.click();
              await activePage.waitForTimeout(1000);

              const dropdown = activePage.locator('[role="menu"][data-state="open"]').first();

              if (await dropdown.isVisible()) {
                const isVideo = visualConfig?.generateType === GenerateType.Video;
                const targetTypeText = isVideo ? "Video" : /Hình ảnh|Image/i;
                const typeBtn = dropdown.locator('[role="tab"]').filter({ hasText: targetTypeText }).first();
                if (await typeBtn.isVisible()) await typeBtn.click();

                const targetRatio = _.defaultTo(visualConfig?.aspectRatio, AspectRatio.SixteenNine);
                const ratioBtn = dropdown
                  .locator('[role="tab"]')
                  .filter({ hasText: new RegExp(`^${targetRatio}$`, "i") })
                  .first();
                if (await ratioBtn.isVisible()) await ratioBtn.click();

                const targetCount = _.defaultTo(visualConfig?.generateCount, 1);
                const countLabel = targetCount === 1 ? "1x" : `x${targetCount}`;
                const countBtn = dropdown
                  .locator('[role="tab"]')
                  .filter({ hasText: new RegExp(`^${countLabel}$`, "i") })
                  .first();
                if (await countBtn.isVisible()) await countBtn.click();

                if (isVideo && visualConfig?.videoDuration) {
                  const durationBtn = dropdown
                    .locator('[role="tab"]')
                    .filter({ hasText: new RegExp(`^${visualConfig.videoDuration}$`, "i") })
                    .first();
                  if (await durationBtn.isVisible()) await durationBtn.click();
                }

                const targetEngineKey = (_.defaultTo(visualConfig?.imageGeneratorEngine, ImageGeneratorEngine.Veo3)).toLowerCase();

                let exactEngineRegex: RegExp;
                let fallbackEngineRegex: RegExp;

                if (isVideo) {
                  if (targetEngineKey === "veo3-lite") {
                    exactEngineRegex = /veo 3\.1 - lite/i;
                    fallbackEngineRegex = /lite/i;
                  } else if (targetEngineKey === "veo3-fast") {
                    exactEngineRegex = /veo 3\.1 - fast/i;
                    fallbackEngineRegex = /fast/i;
                  } else if (targetEngineKey === "veo3-quality") {
                    exactEngineRegex = /veo 3\.1 - quality/i;
                    fallbackEngineRegex = /quality/i;
                  } else {
                    exactEngineRegex = /omni flash/i;
                    fallbackEngineRegex = /omni/i;
                  }
                } else {
                  if (targetEngineKey === "imagen") {
                    exactEngineRegex = IMAGE_GEN_IMAGEN_EXACT_REGEX;
                    fallbackEngineRegex = IMAGE_GEN_IMAGEN_FALLBACK_REGEX;
                  } else if (targetEngineKey === "labs-sandbox") {
                    exactEngineRegex = IMAGE_GEN_LABS_EXACT_REGEX;
                    fallbackEngineRegex = IMAGE_GEN_LABS_FALLBACK_REGEX;
                  } else {
                    exactEngineRegex = IMAGE_GEN_VEO_EXACT_REGEX;
                    fallbackEngineRegex = IMAGE_GEN_VEO_FALLBACK_REGEX;
                  }
                }
                const engineDropdownBtn = dropdown.locator('button[aria-haspopup="menu"]').first();

                if (await engineDropdownBtn.isVisible()) {
                  const currentEngineText = await engineDropdownBtn.textContent();
                  if (currentEngineText && !exactEngineRegex.test(currentEngineText)) {
                    await engineDropdownBtn.click({ force: true });
                    await activePage.waitForTimeout(500);

                    let optionBtn = activePage.locator('[role="menuitem"]' + ':visible').filter({ hasText: exactEngineRegex }).first();
                    if (!(await optionBtn.isVisible())) {
                      optionBtn = activePage.locator('[role="menuitem"]' + ':visible').filter({ hasText: fallbackEngineRegex }).first();
                    }
                    if (await optionBtn.isVisible()) await optionBtn.click({ force: true });
                  }
                }
              }

              await activePage.keyboard.press("Escape");
              await activePage.waitForTimeout(500);

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

          const inputLoc = activePage.locator(SELECTOR_INPUT);

          await smoothMouseMove(activePage, inputLoc);
          await inputLoc.click();
          await randomDelay(200, 400);

          await activePage.keyboard.press("Control+A");
          await randomDelay(150, 300);
          await activePage.keyboard.press("Backspace");
          await randomDelay(200, 400);

          if (inputMethod === PromptInputMethod.Type) {
            await humanType(activePage, targetPrompt);
          } else {
            await activePage.keyboard.insertText(targetPrompt);
          }
          await randomDelay(400, 800);

          await activePage.keyboard.press("Space");
          await randomDelay(100, 200);
          await activePage.keyboard.press("Backspace");

          await randomDelay(1500, 3000);
        }

        const oldIds = await activePage.evaluate((getImgIdStr) => {
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
        }, browserGetImgIdSafeStr);

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
          await delayAsync(500);
        }

        appLog(BACKEND_MESSAGES.PLAYWRIGHT_SUBMIT_LOG);
        await submitBtnLocator.waitFor({ state: "visible", timeout: 5000 });
        await submitBtnLocator.scrollIntoViewIfNeeded();

        await smoothMouseMove(activePage, submitBtnLocator);
        await randomDelay(400, 800);
        await submitBtnLocator.click();

        appLog(BACKEND_MESSAGES.PLAYWRIGHT_WAITING_GEN);
        const base64Data = await activePage.waitForFunction(
          ([oldIdsList, getImgIdStr, jpegMimeType]) => {
            const getImgIdSafe = new Function("return " + getImgIdStr)();

            const imgNodes = document.querySelectorAll("img");
            let newImg: HTMLImageElement | null = null;
            Array.from(imgNodes).some((img) => {
              if (img.src && img.src.includes("data:image/")) {
                newImg = img;
                return true;
              }
              const imgId = getImgIdSafe(img.src);
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
                const dataUrl = canvas.toDataURL(jpegMimeType, 0.9);
                if (dataUrl.length > 1000) return dataUrl;
              } catch (e) { }
            }
            return null;
          },
          [oldIds, browserGetImgIdSafeStr, CONTENT_TYPES.JPEG] as const,
          { timeout: 150000 },
        );

        const finalBase64 = await base64Data.jsonValue();
        appLog(BACKEND_MESSAGES.PLAYWRIGHT_BASE64_SUCCESS);

        responseText = jsonUtils.safeStringify({ directBase64: finalBase64 });
        success = true;
      } catch (error: unknown) {
        appError(ImageGenMessages.IMAGE_RENDER_ERR.replace('{0}', attempts.toString()).replace('{1}', getErrorMessage(error)));

        if (browserInstance) {
          await closeActiveBrowser();
          browserInstance = null;
          activePage = null;
        }

        if (attempts >= maxAttempts) {
          throw error;
        }
      }
    }
  } catch (error: unknown) {
    appError(`${ImageGenMessages.IMAGE_RENDER_GLOBAL_ERR}${getErrorMessage(error)}`);
  } finally {
    if (browserInstance) {
      if (options.retainBrowserSession) {
        scheduleGlobalBrowserCleanup();
      } else {
        await closeActiveBrowser();
      }
    }
    const delayTime = await randomDelay();
    appLog(BACKEND_MESSAGES.PLAYWRIGHT_MUTEX_DELAY.replace("{0}", delayTime.toString()));
    release();
  }

  try {
    const parsed = jsonUtils.safeParse<{ directBase64?: string }>(responseText, {});
    if (parsed.directBase64) {
      let cleanBase64 = parsed.directBase64;
      if (_.includes(cleanBase64, ",")) {
        cleanBase64 = _.split(cleanBase64, ",")[1];
      }

      return {
        success: true,
        base64: cleanBase64,
        fallbackUrl: parsed.directBase64,
        newProjectId: currentProjectId !== cleanProjectId ? currentProjectId : undefined,
      };
    }
  } catch (e) { }

  return {
    success: false,
    base64: null,
    fallbackUrl: SecurityConstants.EMPTY_STRING,
    warning: BACKEND_MESSAGES.PLAYWRIGHT_DECODE_ERR,
  };
}

const isCaptchaOrChallengeActive = async (page: Page): Promise<boolean> => {
  if (page.isClosed()) return false;
  const currentUrl = page.url();
  if (
    _.includes(currentUrl, GEMINI_CHAT_RECOVERY_CONFIG.CHALLENGE_URL_KEYWORD)
    || _.includes(currentUrl, GEMINI_CHAT_RECOVERY_CONFIG.SORRY_URL_KEYWORD)
    || _.includes(currentUrl, GEMINI_CHAT_RECOVERY_CONFIG.ACCOUNTS_URL_KEYWORD)
  ) {
    return true;
  }
  try {
    const hasChallengeFrame = (await page.locator('iframe[src*="recaptcha"], iframe[src*="challenge"], iframe[src*="arkose"], #captcha, div[class*="captcha"]').count()) > 0;
    if (hasChallengeFrame) return true;
    const bodyText = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "");
    return _.includes(bodyText, "xác minh bạn là người")
      || _.includes(bodyText, "verify you are human")
      || _.includes(bodyText, "unusual traffic")
      || _.includes(bodyText, "recaptcha");
  } catch {
    return false;
  }
};

const waitForGeminiReadyOrCaptchaSolved = async (page: Page, tabIndex?: number): Promise<boolean> => {
  const startTime = Date.now();
  let warnedCaptcha = false;
  const tabLabel = _.isNumber(tabIndex) ? _.toString(_.add(tabIndex, SecurityConstants.DEFAULT_AMOUNT)) : "1";

  while (_.lt(_.subtract(Date.now(), startTime), GEMINI_CHAT_RECOVERY_CONFIG.CAPTCHA_WAIT_TIMEOUT_MS)) {
    if (page.isClosed()) return false;

    try {
      const inputLoc = page.locator(GeminiChatSelector.Input).first();
      if ((await inputLoc.count()) > 0 && (await inputLoc.isVisible())) {
        if (warnedCaptcha) {
          appLog(BACKEND_MESSAGES.GEMINI_CAPTCHA_SOLVED_RESUMING.replace("{0}", tabLabel));
        }
        return true;
      }
    } catch {}

    const isCaptcha = await isCaptchaOrChallengeActive(page);
    if (isCaptcha && !warnedCaptcha) {
      warnedCaptcha = true;
      appLog(BACKEND_MESSAGES.GEMINI_CAPTCHA_DETECTED.replace("{0}", tabLabel));
    }

    await delayAsync(GEMINI_CHAT_RECOVERY_CONFIG.CAPTCHA_POLL_INTERVAL_MS);
  }

  return false;
};

const roomReferenceUploadedMap = new WeakMap<Page, boolean>();

export async function generateImageWithGeminiChat(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {
  const { prompt, visualConfig } = options;

  const finalPrompt = prompt || "";

  const release = await imageGenMutex.acquire();
  await randomDelay(1000, 4000);
  let success = false;
  let base64Result: string | null = null;
  let roomAttempts = SecurityConstants.ZERO;
  const maxRoomAttempts = GEMINI_CHAT_RECOVERY_CONFIG.MAX_ROOMS_PER_ITEM;
  let browserInstance: BrowserSession | null = null;
  let activePage: Page | null = null;

  try {
    while (roomAttempts < maxRoomAttempts && !success) {
      roomAttempts++;

      let detectedRatio = visualConfig?.aspectRatio;
      if (!detectedRatio && finalPrompt) {
        if (_.includes(finalPrompt, "16:9") || _.includes(finalPrompt.toLowerCase(), "horizontal")) {
          detectedRatio = "16:9";
        } else if (_.includes(finalPrompt, "9:16") || _.includes(finalPrompt.toLowerCase(), "vertical")) {
          detectedRatio = "9:16";
        }
      }
      if (!detectedRatio) {
        detectedRatio = "9:16";
      }

      const currentConfigState = jsonUtils.safeStringify({
        generateType: visualConfig?.generateType || GenerateType.Image,
        imageGeneratorEngine: visualConfig?.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
        aspectRatio: detectedRatio,
      });
      const isConfigChanged = currentConfigState !== lastGeminiConfigState;

      let needNewRoom = _.gt(roomAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT);
      try {
        if (!browserInstance) {
          browserInstance = await getOrLaunchGlobalBrowser(visualConfig?.chromeHeadless);
          activePage = browserInstance.page;
        }
        const currentUrl = activePage!.url();
        if (!_.includes(currentUrl, "gemini.google.com")) {
          needNewRoom = true;
        } else if (consecutiveGeminiErrors >= GEMINI_CHAT_RECOVERY_CONFIG.MAX_ATTEMPTS_PER_ROOM) {
          needNewRoom = true;
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_ROOM_FORCED);
        } else if (isConfigChanged) {
          needNewRoom = true;
          appLog(ImageGenMessages.CONFIG_CHANGED_FORCE_NEW_ROOM);
        }

        if (needNewRoom) {
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_START_ROOM.replace("{0}", roomAttempts.toString()).replace("{1}", maxRoomAttempts.toString()));
          await activePage.goto(EXTERNAL_URLS.GEMINI_CHAT, {
            waitUntil: GEMINI_BATCH_SETUP_CONFIG.WAIT_UNTIL,
            timeout: GEMINI_BATCH_SETUP_CONFIG.NAVIGATION_TIMEOUT_MS,
          });
          await randomDelay(
            GEMINI_BATCH_SETUP_CONFIG.DELAY_MIN_MS,
            GEMINI_BATCH_SETUP_CONFIG.DELAY_MAX_MS,
          );
          roomReferenceUploadedMap.set(activePage, false);
          consecutiveGeminiErrors = 0;
        } else {
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_ROOM_REUSE);
        }
      } catch (error: unknown) {
        appError(BACKEND_MESSAGES.GEMINI_CHAT_INIT_FAILED.replace("{0}", getErrorMessage(error)));
        if (browserInstance) {
          await closeActiveBrowser();
          browserInstance = null;
          activePage = null;
        }
        if (roomAttempts >= maxRoomAttempts) {
          throw error;
        }
        continue;
      }

      let reloadAttempts = SecurityConstants.ZERO;
      const maxReloadAttempts = 2;

      while (reloadAttempts < maxReloadAttempts && !success) {
        reloadAttempts++;

        if (_.gt(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT)) {
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_RELOAD.replace(
            "{0}",
            _.toString(_.subtract(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT)),
          ));
          try {
            await activePage!.reload({
              waitUntil: GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_WAIT_UNTIL,
              timeout: GEMINI_BATCH_SETUP_CONFIG.NAVIGATION_TIMEOUT_MS,
            });
            await randomDelay(
              GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_DELAY_MIN_MS,
              GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_DELAY_MAX_MS,
            );
          } catch (reloadError) {
            consecutiveGeminiErrors++;
            appError(BACKEND_MESSAGES.GEMINI_CHAT_RELOAD_FAILED.replace("{0}", getErrorMessage(reloadError)));
            continue;
          }
        }

        try {
          await waitForGeminiPageIdle(activePage!, visualConfig);
          const isPageReady = await waitForGeminiReadyOrCaptchaSolved(activePage!);
          if (!isPageReady) {
            throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_PICKER_NOT_FOUND);
          }

          const forceSetting = needNewRoom
            || isConfigChanged
            || _.gt(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT);

          const modelConfigured = await configureGeminiModel(activePage!, visualConfig);
          if (!modelConfigured) throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_PICKER_NOT_FOUND);

          await configureGeminiGenerateType(activePage!, visualConfig, forceSetting).catch(() => {});
          await configureGeminiMediaInput(activePage!, visualConfig);

          if (forceSetting) {
            lastGeminiConfigState = currentConfigState;
          }

          await enterGeminiPrompt(activePage!, finalPrompt, visualConfig);

          const initialResponseCount = await activePage!.locator(GeminiChatSelector.Response).count();
          await waitForGeminiRequestSlot(reloadAttempts);
          const sendBtn = activePage!.locator(GeminiChatSelector.SendButton).first();
          let clicked = false;
          try {
            if ((await sendBtn.isVisible()) && !(await sendBtn.isDisabled())) {
              await sendBtn.click();
              clicked = true;
              appLog(BACKEND_MESSAGES.GEMINI_CHAT_CLICKED_SEND);
            }
          } catch (error: unknown) {
            appError(BACKEND_MESSAGES.GEMINI_CHAT_CLICK_SEND_FAILED.replace("{0}", getErrorMessage(error)));
          }

          if (!clicked) {
            await activePage!.keyboard.press("Enter");
            appLog(BACKEND_MESSAGES.GEMINI_CHAT_PRESSED_ENTER);
          }
          base64Result = await waitForDownloadAndGetBase64(activePage!, visualConfig, initialResponseCount);
          await waitForGeminiPageIdle(activePage!, visualConfig);
          if (base64Result && !_.isEqual(visualConfig.generateType, GenerateType.Video)
            && !isImageAspectRatioCompatible(base64Result, visualConfig.aspectRatio)) {
            appLog(`[GeminiChat] Ảnh đã tạo có tỉ lệ hơi khác (${visualConfig.aspectRatio || "16:9"}), vẫn chấp nhận sử dụng.`);
          }
          if (base64Result) {
            success = true;
            consecutiveGeminiErrors = 0;
          } else {
            throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERR_THROW);
          }
        } catch (error: unknown) {
          consecutiveGeminiErrors++;
          appError(BACKEND_MESSAGES.GEMINI_CHAT_ATTEMPT_FAILED.replace("{0}", reloadAttempts.toString()).replace("{1}", roomAttempts.toString()).replace("{2}", getErrorMessage(error)));
        }
      }
    }
  } catch (error: unknown) {
    appError(BACKEND_MESSAGES.GEMINI_CHAT_FAILED_COMPLETELY.replace("{0}", getErrorMessage(error)));
  } finally {
    if (browserInstance) {
      if (options.retainBrowserSession) {
        scheduleGlobalBrowserCleanup();
      } else {
        await closeActiveBrowser();
      }
    }
    const delayTime = await randomDelay();
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_MUTEX_DELAY.replace("{0}", delayTime.toString()));
    release();
  }

  if (success && base64Result) {
    return {
      success: true,
      base64: base64Result,
      fallbackUrl: `${COMMON_STRINGS.BASE64_JPEG_PREFIX}${base64Result}`,
    };
  }

  return {
    success: false,
    base64: null,
    fallbackUrl: SecurityConstants.EMPTY_STRING,
    warning: BACKEND_MESSAGES.GEMINI_CHAT_FALLBACK_WARNING,
  };
}

export interface BatchImageItem {
  sceneId: string;
  prompt: string;
  generateType?: GenerateType;
  referenceImages?: string[];
  continuityKey?: string;
}

export interface BatchImageResult {
  sceneId: string;
  success: boolean;
  base64: string | null;
  fallbackUrl: string;
  warning?: string;
  assetType: GenerateType.Image | GenerateType.Video;
}

const resolveBatchAssetType = (
  item: BatchImageItem,
): GenerateType.Image | GenerateType.Video => (
  _.isEqual(item.generateType, GenerateType.Video)
    ? GenerateType.Video
    : GenerateType.Image
);

const getBatchItemVisualConfig = (item: BatchImageItem, visualConfig: GeminiVisualConfig): GeminiVisualConfig & { generateType: GenerateType.Image | GenerateType.Video } => {
  const isThumbnail = _.startsWith(_.toString(item.sceneId), "thumb_") || _.startsWith(_.toString(item.sceneId), "thumbnail_");

  let targetReferences: any[] = [];
  if (isThumbnail) {
    targetReferences = !_.isEmpty(item?.referenceImages)
      ? (item.referenceImages as any[])
      : !_.isEmpty(visualConfig?.thumbnailReferenceImages)
        ? (visualConfig.thumbnailReferenceImages as any[])
        : !_.isEmpty(visualConfig?.thumbnailSceneReferenceImages)
          ? (visualConfig.thumbnailSceneReferenceImages as any[])
          : !_.isEmpty(visualConfig?.styleReferenceImages)
            ? (visualConfig.styleReferenceImages as any[])
            : [];
  } else {
    targetReferences = !_.isEmpty(item?.referenceImages)
      ? (item.referenceImages as any[])
      : !_.isEmpty(visualConfig?.sceneReferenceImages)
        ? (visualConfig.sceneReferenceImages as any[])
        : !_.isEmpty(visualConfig?.referenceImages)
          ? (visualConfig.referenceImages as any[])
          : !_.isEmpty(visualConfig?.styleReferenceImages)
            ? (visualConfig.styleReferenceImages as any[])
            : [];
  }

  return {
    ...visualConfig,
    generateType: resolveBatchAssetType(item),
    referenceImages: targetReferences,
    sceneReferenceImages: visualConfig?.sceneReferenceImages,
    styleReferenceImages: visualConfig?.styleReferenceImages,
    thumbnailReferenceImages: visualConfig?.thumbnailReferenceImages,
  };
};

export async function closeAllBatchPages() {
  await closeActiveBrowser();
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_CLOSE_TABS.replace("{0}", globalBatchPages.length.toString()));
  for (const page of globalBatchPages) {
    try {
      if (!page.isClosed()) {
        await page.close();
      }
    } catch (e) { }
  }
  globalBatchPages = [];
}

async function applyBatchDelay(visualConfig: GeminiVisualConfig): Promise<number> {
  const ms = getBatchDelayMs(visualConfig?.batchDelay);
  await delayAsync(ms);
  return ms;
}

const createGeminiBatchPage = async (context: BrowserContext): Promise<Page> => {
  return context.newPage();
};

const createPreparedGeminiBatchPage = async (
  context: BrowserContext,
  tabIndex: number,
): Promise<Page> => {
  const page = await createGeminiBatchPage(context);
  try {
    await prepareGeminiBatchPage(page, tabIndex);
    return page;
  } catch (error) {
    await page.close().catch(() => {});
    throw error;
  }
};

const prepareGeminiBatchPage = async (page: Page, index: number): Promise<void> => {
  const tabNumber = _.add(index, SecurityConstants.DEFAULT_AMOUNT);
  try {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_PREPARE_NEW_ROOM.replace(
      SecurityConstants.PLACEHOLDER_0,
      _.toString(tabNumber),
    ));
    await page.goto(EXTERNAL_URLS.GEMINI_CHAT, {
      waitUntil: GEMINI_BATCH_SETUP_CONFIG.WAIT_UNTIL,
      timeout: GEMINI_BATCH_SETUP_CONFIG.NAVIGATION_TIMEOUT_MS,
    });
    await randomDelay(
      GEMINI_BATCH_SETUP_CONFIG.DELAY_MIN_MS,
      GEMINI_BATCH_SETUP_CONFIG.DELAY_MAX_MS,
    );
    roomReferenceUploadedMap.set(page, false);
    batchPagesErrors.set(page, SecurityConstants.ZERO);
  } catch (error: any) {
    appError(
      BACKEND_MESSAGES.GEMINI_CHAT_BATCH_PREPARE_NEW_ROOM_ERR
        .replace(SecurityConstants.PLACEHOLDER_0, _.toString(tabNumber))
        .replace(SecurityConstants.PLACEHOLDER_1, error.message),
    );
    throw error;
  }
};

export async function generateBatchImagesWithGeminiChat(items: BatchImageItem[], visualConfig: GeminiVisualConfig, style?: string, onProgress?: (result: BatchImageResult) => void): Promise<BatchImageResult[]> {
  if (!items || items.length === 0) {
    return [];
  }

  const speed = visualConfig?.geminiChatSpeed || GeminiChatSpeed.Fast;
  const concurrency = GEMINI_CHAT_SPEED_TAB_COUNT[speed] || 5;
  const maxTabs = resolveBatchTabCount(items.length, concurrency, visualConfig?.batchTabCount);

  if (maxTabs === 1) {
    const results: BatchImageResult[] = [];
    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemVisualConfig = getBatchItemVisualConfig(item, visualConfig);
        const result = await generateImageWithGeminiChat({
          prompt: item.prompt,
          style,
          retainBrowserSession: true,
          visualConfig: itemVisualConfig,
        });
        const batchRes = {
          sceneId: item.sceneId,
          ...result,
          assetType: itemVisualConfig.generateType,
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
    } finally {
      await closeActiveBrowser();
    }
    return results;
  }

  const release = await imageGenMutex.acquire();
  const results: BatchImageResult[] = [];
  let browserInstance: BrowserSession | null = null;

  try {
    browserInstance = await launchBrowserForAccount(visualConfig?.chromeHeadless);
    const context = browserInstance.context;

    globalBatchPages = _.filter(globalBatchPages, (p) => !p.isClosed());
    if (!_.includes(globalBatchPages, browserInstance.page)) {
      globalBatchPages.unshift(browserInstance.page);
    }

    const readyPages: Page[] = [];
    const candidates = globalBatchPages.slice(0, maxTabs);
    const preparationResults = await Promise.allSettled(_.map(candidates, prepareGeminiBatchPage));
    _.forEach(preparationResults, (result, index) => {
      const page = candidates[index];
      if (_.isEqual(result.status, "fulfilled")) {
        readyPages.push(page);
        return;
      }
      page.close().catch(() => {});
    });

    const maximumReplacementAttempts = _.multiply(maxTabs, 2);
    let replacementAttempts = SecurityConstants.ZERO;
    while (_.lt(_.size(readyPages), maxTabs) && _.lt(replacementAttempts, maximumReplacementAttempts)) {
      replacementAttempts = _.add(replacementAttempts, SecurityConstants.DEFAULT_AMOUNT);
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_START.replace("{0}", _.toString(_.subtract(maxTabs, _.size(readyPages)))));
      try {
        const page = await createPreparedGeminiBatchPage(context, _.size(readyPages));
        readyPages.push(page);
        appLog(
          BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_INIT
            .replace(SecurityConstants.PLACEHOLDER_0, _.toString(_.size(readyPages)))
            .replace(SecurityConstants.PLACEHOLDER_1, _.toString(maxTabs)),
        );
      } catch (error) {
        appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_INIT_ERROR.replace("{0}", getErrorMessage(error)));
      }
    }
    if (_.isEmpty(readyPages)) throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_INIT_ERROR.replace("{0}", BACKEND_MESSAGES.UNKNOWN_ERROR));
    globalBatchPages = readyPages;
    const activePages = readyPages.slice(0, maxTabs);

    const generateOnTab = async (page: Page, item: BatchImageItem, tabIndex: number): Promise<BatchImageResult> => {
      const itemVisualConfig = getBatchItemVisualConfig(item, visualConfig);
      const hasRefs = !_.isEmpty(itemVisualConfig.referenceImages)
        || !_.isEmpty(itemVisualConfig.sceneReferenceImages)
        || !_.isEmpty(itemVisualConfig.styleReferenceImages);
      const finalPrompt = removeConflictingStyleTerms(item.prompt || "", hasRefs);

      let success = false;
      let base64Result: string | null = null;
      let roomAttempts = SecurityConstants.ZERO;
      const maxRoomAttempts = GEMINI_CHAT_RECOVERY_CONFIG.MAX_ROOMS_PER_ITEM;

      try {
        while (roomAttempts < maxRoomAttempts && !success) {
          roomAttempts++;

          if (page.isClosed()) {
            throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_PAGE_CLOSED);
          }

          const currentUrl = page.url();
          const consecutiveErrors = batchPagesErrors.get(page) || 0;
          let needNewRoom = false;

          if (!_.includes(currentUrl, "gemini.google.com")) {
            needNewRoom = true;
          } else if (consecutiveErrors >= GEMINI_CHAT_RECOVERY_CONFIG.MAX_ATTEMPTS_PER_ROOM) {
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
              await page.goto(EXTERNAL_URLS.GEMINI_CHAT, {
                waitUntil: GEMINI_BATCH_SETUP_CONFIG.WAIT_UNTIL,
                timeout: GEMINI_BATCH_SETUP_CONFIG.NAVIGATION_TIMEOUT_MS,
              });
              await randomDelay(
                GEMINI_BATCH_SETUP_CONFIG.DELAY_MIN_MS,
                GEMINI_BATCH_SETUP_CONFIG.DELAY_MAX_MS,
              );
              roomReferenceUploadedMap.set(page, false);
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

          let reloadAttempts = SecurityConstants.ZERO;
          const maxReloadAttempts = 2;

          while (reloadAttempts < maxReloadAttempts && !success) {
            reloadAttempts++;

            if (_.gt(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT)) {
              appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_RELOAD_ATTEMPT
                .replace("{0}", _.toString(_.add(tabIndex, SecurityConstants.DEFAULT_AMOUNT)))
                .replace("{1}", _.toString(_.subtract(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT))));
              try {
                await page.reload({
                  waitUntil: GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_WAIT_UNTIL,
                  timeout: GEMINI_BATCH_SETUP_CONFIG.NAVIGATION_TIMEOUT_MS,
                });
                await randomDelay(
                  GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_DELAY_MIN_MS,
                  GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_DELAY_MAX_MS,
                );
              } catch (reloadError) {
                batchPagesErrors.set(page, _.add(
                  batchPagesErrors.get(page) || SecurityConstants.ZERO,
                  SecurityConstants.DEFAULT_AMOUNT,
                ));
                appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_RELOAD_FAILED
                  .replace("{0}", _.toString(_.add(tabIndex, SecurityConstants.DEFAULT_AMOUNT)))
                  .replace("{1}", getErrorMessage(reloadError)));
                continue;
              }
            }

            try {
              appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace("{0}", (tabIndex + 1).toString()).replace("{1}", item.sceneId));

              await waitForGeminiPageIdle(page, itemVisualConfig);
              const isPageReady = await waitForGeminiReadyOrCaptchaSolved(page, tabIndex);
              if (!isPageReady) {
                throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_PICKER_NOT_FOUND);
              }

              const currentConfigState = jsonUtils.safeStringify({
                generateType: itemVisualConfig.generateType,
                imageGeneratorEngine: itemVisualConfig.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
              });

              const lastConfig = batchPagesConfigs.get(page);
              const isConfigChanged = currentConfigState !== lastConfig;
              const forceSetting = needNewRoom
                || isConfigChanged
                || _.gt(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT);

              await configureGeminiModel(page, itemVisualConfig).catch(() => false);
              await configureGeminiGenerateType(page, itemVisualConfig, forceSetting).catch(() => {});
              await configureGeminiMediaInput(page, itemVisualConfig);

              if (forceSetting) {
                batchPagesConfigs.set(page, currentConfigState);
              }

              await enterGeminiPrompt(page, finalPrompt, itemVisualConfig);

              const initialResponseCount = await page.locator(GeminiChatSelector.Response).count();
              await waitForGeminiRequestSlot(reloadAttempts);
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
              base64Result = await waitForDownloadAndGetBase64(page, itemVisualConfig, initialResponseCount);
              await waitForGeminiPageIdle(page, itemVisualConfig);
              if (base64Result && !_.isEqual(itemVisualConfig.generateType, GenerateType.Video)
                && !isImageAspectRatioCompatible(base64Result, itemVisualConfig.aspectRatio)) {
                appLog(`[GeminiChat Batch] Ảnh đã tạo cho scene ${item.sceneId} có tỉ lệ hơi khác (${itemVisualConfig.aspectRatio || "16:9"}), vẫn chấp nhận sử dụng.`);
              }
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
          fallbackUrl: `${COMMON_STRINGS.BASE64_JPEG_PREFIX}${base64Result}`,
          assetType: itemVisualConfig.generateType,
        };
      }

      return {
        sceneId: item.sceneId,
        success: false,
        base64: null,
        fallbackUrl: SecurityConstants.EMPTY_STRING,
        warning: BACKEND_MESSAGES.GEMINI_CHAT_FALLBACK_WARNING,
        assetType: itemVisualConfig.generateType,
      };
    };

    const sharedQueue = [...items];

    const createReplacementWorkerPage = async (tabIndex: number): Promise<Page | null> => {
      for (
        let attempt = SecurityConstants.ZERO;
        attempt < GEMINI_BATCH_SETUP_CONFIG.WORKER_REPLACEMENT_MAX_ATTEMPTS;
        attempt++
      ) {
        try {
          return await createPreparedGeminiBatchPage(context, tabIndex);
        } catch (error) {
          appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_INIT_ERROR.replace("{0}", getErrorMessage(error)));
        }
      }
      return null;
    };

    const runWorker = async (page: Page, tabIndex: number) => {
      let workerPage = page;
      while (sharedQueue.length > 0) {
        const item = sharedQueue.shift();
        if (!item) break;
        let itemSucceeded = false;

        try {
          const res = await generateOnTab(workerPage, item, tabIndex);
          itemSucceeded = res.success;
          results.push(res);
          if (onProgress) {
            onProgress(res);
          }
        } catch (err: any) {
          const res = {
            sceneId: item.sceneId,
            success: false,
            base64: null,
            fallbackUrl: SecurityConstants.EMPTY_STRING,
            warning: err.message || BACKEND_MESSAGES.UNKNOWN_ERROR,
            assetType: resolveBatchAssetType(item),
          };
          results.push(res);
          if (onProgress) {
            onProgress(res);
          }
        }

        if (!itemSucceeded) {
          if (!workerPage.isClosed()) {
            continue;
          }
          const failedPage = workerPage;
          globalBatchPages = _.without(globalBatchPages, failedPage);
          if (_.isEmpty(sharedQueue)) return;
          const replacementPage = await createReplacementWorkerPage(tabIndex);
          if (!replacementPage) return;
          workerPage = replacementPage;
          globalBatchPages.push(replacementPage);
          continue;
        }

        if (sharedQueue.length > 0) {
          const delayTime = await applyBatchDelay(visualConfig);
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_NEXT_DELAY.replace("{0}", (tabIndex + 1).toString()).replace("{1}", delayTime.toString()));
        }
      }
    };

    const workers = _.map(activePages, (page, idx) => runWorker(page, idx));
    await Promise.all(workers);

    _.forEach(_.filter(items, item => !_.some(results, { sceneId: item.sceneId })), (item) => {
      const res = {
        sceneId: item.sceneId,
        success: false,
        base64: null,
        fallbackUrl: SecurityConstants.EMPTY_STRING,
        warning: BACKEND_MESSAGES.GEMINI_CHAT_FALLBACK_WARNING,
        assetType: resolveBatchAssetType(item),
      };
      results.push(res);
      if (onProgress) onProgress(res);
    });

    appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_COMPLETE.replace("{0}", _.size(_.filter(results, (r) => r.success)).toString()).replace("{1}", items.length.toString()));
  } catch (err: any) {
    appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_INIT_ERROR.replace("{0}", err.message));
    _.forEach(items, (item) => {
      if (!_.find(results, (r) => _.eq(r.sceneId, item.sceneId))) {
        const res = {
          sceneId: item.sceneId,
          success: false,
          base64: null,
          fallbackUrl: SecurityConstants.EMPTY_STRING,
          warning: err.message,
          assetType: resolveBatchAssetType(item),
        };
        results.push(res);
        if (onProgress) {
          onProgress(res);
        }
      }
    });
  } finally {
    if (browserInstance) {
      await browserInstance.context.close().catch(() => {});
    }
    release();
  }

  return results;
}

const openGeminiModelMenu = async (page: Page, picker: Locator): Promise<Locator | null> => {
  const menu = page.locator(GeminiChatSelector.ModelMenu).first();
  if (!(await menu.isVisible().catch(() => false))) await picker.click();
  const visible = await menu.waitFor({
    state: "visible",
    timeout: GEMINI_MODEL_SELECTION_CONFIG.MENU_TIMEOUT_MS,
  }).then(() => true).catch(() => false);
  return visible ? menu : null;
};

const closeGeminiModelMenu = async (picker: Locator, menu: Locator): Promise<void> => {
  if (!(await menu.isVisible().catch(() => false))) return;
  await picker.click().catch(() => undefined);
  await menu.waitFor({
    state: "hidden",
    timeout: GEMINI_MODEL_SELECTION_CONFIG.MENU_TIMEOUT_MS,
  }).catch(() => undefined);
};

const isGeminiModelOptionSelected = (option: Locator): Promise<boolean> => option.evaluate(
  (element, selectedClass) => element.classList.contains(selectedClass)
    || Boolean(element.querySelector(`.${selectedClass}`)),
  GEMINI_MODEL_SELECTION_CONFIG.SELECTED_CLASS,
).catch(() => false);

const waitForGeminiModelOptionSelected = async (option: Locator): Promise<boolean> => {
  const maximumAttempts = Math.ceil(
    GEMINI_MODEL_SELECTION_CONFIG.OPTION_TIMEOUT_MS
      / GEMINI_MODEL_SELECTION_CONFIG.SELECTION_POLL_MS,
  );
  for (let attempt = SecurityConstants.ZERO; attempt < maximumAttempts; attempt++) {
    if (await isGeminiModelOptionSelected(option)) return true;
    await delayAsync(GEMINI_MODEL_SELECTION_CONFIG.SELECTION_POLL_MS);
  }
  return false;
};

const findGeminiModelOption = async (menu: Locator, modelRegex: RegExp): Promise<Locator | null> => {
  const options = menu.locator(GeminiChatSelector.ModelOption);
  const optionCount = await options.count();
  for (let index = SecurityConstants.ZERO; index < optionCount; index++) {
    const option = options.nth(index);
    const label = _.trim(await option.locator(GeminiChatSelector.ModelLabel).textContent().catch(() => ""));
    const matches = modelRegex.test(label);
    modelRegex.lastIndex = SecurityConstants.ZERO;
    if (matches) return option;
  }
  return null;
};

const getSelectedGeminiModelLabel = async (menu: Locator): Promise<string> => {
  const options = menu.locator(GeminiChatSelector.ModelOption);
  const optionCount = await options.count();
  for (let index = SecurityConstants.ZERO; index < optionCount; index++) {
    const option = options.nth(index);
    if (await isGeminiModelOptionSelected(option)) {
      return _.trim(await option.locator(GeminiChatSelector.ModelLabel).textContent().catch(() => ""));
    }
  }
  return REFACTOR_CONSTANTS.VD_EMPTY_STRING;
};

async function configureGeminiModel(page: Page, visualConfig: GeminiVisualConfig): Promise<boolean> {
  const engine = visualConfig?.imageGeneratorEngine || ImageGeneratorEngine.Veo3;
  let targetModelText = GeminiChatModelName.Pro;
  let targetModelRegex = GEMINI_MODEL_PRO_REGEX;
  let fallbackModelRegex: RegExp | null = null;
  if (engine === ImageGeneratorEngine.LabsSandbox) {
    targetModelText = GeminiChatModelName.FlashLite;
    targetModelRegex = GEMINI_MODEL_FLASH_LITE_REGEX;
  } else if (engine === ImageGeneratorEngine.Veo3) {
    targetModelText = GeminiChatModelName.Flash;
    targetModelRegex = GEMINI_MODEL_FLASH_REGEX;
    fallbackModelRegex = GEMINI_MODEL_FLASH_FAMILY_REGEX;
  }

  const modelPickerBtn = page.locator(GeminiChatSelector.ModelPickerButton).first();
  if (!(await modelPickerBtn.isVisible())) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_PICKER_NOT_FOUND);
    return false;
  }

  appLog(BACKEND_MESSAGES.GEMINI_CHAT_CONFIG_MODEL.replace("{0}", targetModelText));
  for (let attempt = 0; attempt < GEMINI_MODEL_SELECTION_CONFIG.MAX_ATTEMPTS; attempt++) {
    const modelMenu = await openGeminiModelMenu(page, modelPickerBtn);
    if (!modelMenu) continue;
    const currentModelLabel = await getSelectedGeminiModelLabel(modelMenu);
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_CURRENT_MODEL.replace("{0}", currentModelLabel));
    const currentModelMatches = targetModelRegex.test(currentModelLabel);
    targetModelRegex.lastIndex = SecurityConstants.ZERO;
    if (currentModelMatches) {
      await closeGeminiModelMenu(modelPickerBtn, modelMenu);
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_CORRECT);
      return true;
    }

    let selectedModelRegex = targetModelRegex;
    let matchingOption = await findGeminiModelOption(modelMenu, selectedModelRegex);
    if (!matchingOption && fallbackModelRegex) {
      selectedModelRegex = fallbackModelRegex;
      matchingOption = await findGeminiModelOption(modelMenu, selectedModelRegex);
    }
    if (!matchingOption) {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_NOT_FOUND.replace("{0}", targetModelText));
      await closeGeminiModelMenu(modelPickerBtn, modelMenu);
      continue;
    }
    await matchingOption.click();
    await modelPickerBtn.waitFor({ state: "visible", timeout: GEMINI_MODEL_SELECTION_CONFIG.OPTION_TIMEOUT_MS });
    const verificationMenu = await openGeminiModelMenu(page, modelPickerBtn);
    if (!verificationMenu) continue;
    const selectedOption = await findGeminiModelOption(verificationMenu, selectedModelRegex);
    const isSelected = Boolean(selectedOption && await waitForGeminiModelOptionSelected(selectedOption));
    await closeGeminiModelMenu(modelPickerBtn, verificationMenu);
    if (isSelected) {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_SUCCESS.replace("{0}", targetModelText));
      return true;
    }
  }
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_NOT_FOUND.replace("{0}", targetModelText));
  return false;
}

export async function configureGeminiGenerateType(page: Page, visualConfig: GeminiVisualConfig, forceSetting: boolean) {
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
    await captureGeminiDomState(page, isVideo ? "video_type_menu_open" : "image_type_menu_open");

    const optionBtn = page.locator(GeminiChatSelector.PlusMenuOptions).filter({ hasText: targetRegex }).first();

    if (await optionBtn.isVisible()) {
      await randomDelay(500, 1000);
      await optionBtn.click();
      await randomDelay(1200, 2000);
      await captureGeminiDomState(page, isVideo ? "video_type_selected" : "image_type_selected");
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_SUCCESS.replace("{0}", targetText));
    } else {
      const optionBtnFallback = page.locator("button").filter({ hasText: targetRegex }).first();
      if (await optionBtnFallback.isVisible()) {
        await randomDelay(500, 1000);
        await optionBtnFallback.click();
        await randomDelay(1200, 2000);
        await captureGeminiDomState(page, isVideo ? "video_type_selected_fallback" : "image_type_selected_fallback");
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_FALLBACK.replace("{0}", targetText));
      } else {
        await captureGeminiDomState(page, isVideo ? "video_type_option_missing" : "image_type_option_missing");
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_NOT_FOUND.replace("{0}", targetText));
        await page.keyboard.press("Escape");
        await randomDelay(500, 800);
      }
    }
  }
}

export const createGeminiReferenceFiles = (referenceImages: unknown) => (
  _.chain(_.isArray(referenceImages) ? referenceImages : [])
    .filter(_.isString)
    .take(GEMINI_CHAT_VIDEO_INPUT_CONFIG.MAX_REFERENCE_IMAGES)
    .map((source, index) => {
      const match = _.toString(source).match(BASE64_IMAGE_MIME_REGEX);
      const encodedAsset = match
        ? {
          mimeType: _.join([GEMINI_CHAT_VIDEO_INPUT_CONFIG.MIME_PREFIX, _.get(match, SecurityConstants.DEFAULT_AMOUNT)], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
          data: _.get(match, GEMINI_CHAT_VIDEO_INPUT_CONFIG.BASE64_CAPTURE_INDEX),
        }
        : readEncodedProjectImage(source);
      if (!encodedAsset?.data || !encodedAsset.mimeType) return null;
      const extension = _.last(_.split(encodedAsset.mimeType, GEMINI_CHAT_VIDEO_INPUT_CONFIG.MIME_PREFIX)) || "png";
      return {
        name: _.join(
          [
            GEMINI_CHAT_VIDEO_INPUT_CONFIG.FILE_PREFIX,
            _.add(index, SecurityConstants.DEFAULT_AMOUNT),
            GEMINI_CHAT_VIDEO_INPUT_CONFIG.EXTENSION_SEPARATOR,
            extension,
          ],
          REFACTOR_CONSTANTS.VD_EMPTY_STRING,
        ),
        mimeType: encodedAsset.mimeType,
        buffer: Buffer.from(encodedAsset.data, REFACTOR_CONSTANTS.ENCODING_BASE64),
      };
    })
    .compact()
    .value()
);

async function configureGeminiMediaInput(page: Page, visualConfig: GeminiVisualConfig) {
  await page.bringToFront().catch(() => {});
  const isVideoGeneration = _.some(
    [visualConfig?.generateType],
    (generateType) => _.isEqual(generateType, GenerateType.Video),
  );
  if (isVideoGeneration) {
    const targetRatio = _.includes(
      [AspectRatio.SixteenNine, AspectRatio.NineSixteen],
      visualConfig?.aspectRatio,
    )
      ? visualConfig.aspectRatio
      : AspectRatio.SixteenNine;
    const aspectButton = page.locator(GEMINI_CHAT_VIDEO_SELECTORS.ASPECT_BUTTON).first();

    if (await aspectButton.isVisible()) {
      const currentLabel = await aspectButton.getAttribute(
        GEMINI_CHAT_VIDEO_INPUT_CONFIG.ARIA_LABEL_ATTRIBUTE,
      );
      if (!_.includes(currentLabel, targetRatio)) {
        await aspectButton.click();
        await randomDelay(
          GEMINI_CHAT_VIDEO_INPUT_CONFIG.ASPECT_DELAY_MIN_MS,
          GEMINI_CHAT_VIDEO_INPUT_CONFIG.ASPECT_DELAY_MAX_MS,
        );
        const ratioOption = page
          .locator(GEMINI_CHAT_VIDEO_SELECTORS.ASPECT_OPTIONS)
          .filter({ hasText: new RegExp(_.escapeRegExp(targetRatio)) })
          .first();
        if (await ratioOption.isVisible()) {
          await ratioOption.click();
          await randomDelay(
            GEMINI_CHAT_VIDEO_INPUT_CONFIG.ASPECT_DELAY_MIN_MS,
            GEMINI_CHAT_VIDEO_INPUT_CONFIG.ASPECT_DELAY_MAX_MS,
          );
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_ASPECT_SUCCESS.replace(
            SecurityConstants.PLACEHOLDER_0,
            targetRatio,
          ));
        } else {
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_ASPECT_OPTION_NOT_FOUND.replace(
            SecurityConstants.PLACEHOLDER_0,
            targetRatio,
          ));
          await page.keyboard.press(GEMINI_CHAT_VIDEO_INPUT_CONFIG.ESCAPE_KEY);
        }
      }
    } else {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_ASPECT_BUTTON_NOT_FOUND);
    }
  }

  if (roomReferenceUploadedMap.get(page)) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_ROOM_REUSE);
    return;
  }

  const rawReferences = !_.isEmpty(visualConfig?.referenceImages)
    ? visualConfig.referenceImages
    : !_.isEmpty(visualConfig?.sceneReferenceImages)
      ? visualConfig.sceneReferenceImages
      : visualConfig?.styleReferenceImages;
  const allReferenceFiles = createGeminiReferenceFiles(rawReferences);
  if (_.isEmpty(allReferenceFiles)) return;

  const currentChipCount = await page.locator(GEMINI_CHAT_VIDEO_SELECTORS.REFERENCE_CHIPS).count().catch(() => 0);
  if (_.gt(currentChipCount, SecurityConstants.ZERO)) {
    roomReferenceUploadedMap.set(page, true);
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_ROOM_REUSE);
    return;
  }

  const referenceFiles = [_.first(allReferenceFiles)!];

  for (let attempt = 0; attempt < 3; attempt++) {
    let uploadSuccess = false;

    const fileInputs = page.locator('input[type="file"]');
    const inputCount = await fileInputs.count().catch(() => 0);
    for (let i = 0; i < inputCount; i++) {
      try {
        await fileInputs.nth(i).setInputFiles(referenceFiles);
        uploadSuccess = true;
        break;
      } catch {}
    }

    if (!uploadSuccess) {
      const plusButton = page.locator(GEMINI_CHAT_VIDEO_SELECTORS.PLUS_BUTTON).first();
      const fallbackPlus = page.locator('.input-area, .chat-input, input-area, form').locator('button').first();
      const targetPlus = (await plusButton.isVisible().catch(() => false)) ? plusButton : fallbackPlus;

      if (await targetPlus.isVisible().catch(() => false)) {
        await targetPlus.click().catch(() => {});
        await randomDelay(500, 1000);

        const newInputs = page.locator('input[type="file"]');
        const newInputCount = await newInputs.count().catch(() => 0);
        for (let i = 0; i < newInputCount; i++) {
          try {
            await newInputs.nth(i).setInputFiles(referenceFiles);
            uploadSuccess = true;
            break;
          } catch {}
        }

        if (!uploadSuccess) {
          const uploadMenuItem = page.locator('[role="menuitem"], button').filter({ hasText: /upload|tải|file/i }).first();
          if (await uploadMenuItem.isVisible().catch(() => false)) {
            try {
              const [fileChooser] = await Promise.all([
                page.waitForEvent('filechooser', { timeout: 4000 }).catch(() => null),
                uploadMenuItem.click().catch(() => {}),
              ]);
              if (fileChooser) {
                await fileChooser.setFiles(referenceFiles);
                uploadSuccess = true;
              }
            } catch {}
          }
        }
        await page.keyboard.press("Escape").catch(() => {});
      }
    }

    if (uploadSuccess) {
      try {
        await page.waitForFunction(
          ({ selector, expectedCount }) => document.querySelectorAll(selector).length >= expectedCount,
          { selector: GEMINI_CHAT_VIDEO_SELECTORS.REFERENCE_CHIPS, expectedCount: SecurityConstants.DEFAULT_AMOUNT },
          { timeout: GEMINI_CHAT_VIDEO_INPUT_CONFIG.UPLOAD_VERIFY_TIMEOUT_MS },
        ).catch(() => undefined);
        await randomDelay(
          GEMINI_CHAT_VIDEO_INPUT_CONFIG.UPLOAD_DELAY_MIN_MS,
          GEMINI_CHAT_VIDEO_INPUT_CONFIG.UPLOAD_DELAY_MAX_MS,
        );
        roomReferenceUploadedMap.set(page, true);
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_REFERENCE_UPLOAD.replace(
          SecurityConstants.PLACEHOLDER_0,
          _.toString(SecurityConstants.DEFAULT_AMOUNT),
        ));
        return;
      } catch (uploadErr) {
        appError(BACKEND_MESSAGES.GEMINI_CHAT_REFERENCE_UPLOAD_FAILED, uploadErr);
      }
    }

    await randomDelay(800, 1500);
  }

  appLog(BACKEND_MESSAGES.GEMINI_CHAT_REFERENCE_INPUT_NOT_FOUND);
}

async function enterGeminiPrompt(page: Page, promptText: string, visualConfig: GeminiVisualConfig) {
  await page.keyboard.press("Escape").catch(() => {});
  const closeButton = page.locator('button[aria-label="Close"], button[mat-dialog-close], .lightbox-close, [role="dialog"] button:has(mat-icon)').first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {});
  }

  const inputLoc = page.locator(GeminiChatSelector.InputTextarea).first();
  await inputLoc.focus().catch(() => {});
  await inputLoc.evaluate((el: HTMLElement) => el.focus()).catch(() => {});
  await randomDelay(300, 600);

  const inputMethod = visualConfig?.promptInputMethod || PromptInputMethod.Paste;
  if (inputMethod === PromptInputMethod.Type) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_TYPING_PROMPT);
    await humanType(page, promptText);
  } else {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_PASTING_PROMPT);
    try {
      const context = page.context();
      await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => { });
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

const waitForGeneratedImageReady = async (media: Locator): Promise<void> => {
  const maximumAttempts = Math.ceil(
    GEMINI_MEDIA_EXTRACTION_CONFIG.IMAGE_READY_TIMEOUT_MS
      / GEMINI_MEDIA_EXTRACTION_CONFIG.IMAGE_READY_POLL_MS,
  );
  for (let attempt = SecurityConstants.ZERO; attempt < maximumAttempts; attempt++) {
    const ready = await media.evaluate((element: HTMLImageElement, minimumDimension) => {
      const source = element.currentSrc || element.src || element.getAttribute("src") || "";
      if (!source) return false;
      return element.complete || element.naturalWidth >= minimumDimension || source.startsWith("blob:") || source.startsWith("http");
    }, GEMINI_MEDIA_EXTRACTION_CONFIG.MIN_IMAGE_DIMENSION_PX).catch(() => false);
    if (ready) return;
    await delayAsync(GEMINI_MEDIA_EXTRACTION_CONFIG.IMAGE_READY_POLL_MS);
  }
};

const waitForGeminiPageIdle = async (page: Page, visualConfig: GeminiVisualConfig): Promise<void> => {
  const mediaType = _.isEqual(visualConfig.generateType, GenerateType.Video)
    ? GEMINI_MEDIA_ERRORS.VIDEO_MEDIA_TYPE
    : GEMINI_MEDIA_ERRORS.IMAGE_MEDIA_TYPE;
  await page.waitForFunction(
    ({ responseSelector, globalBusySelector, responseBusySelector, lastResponseOffset }) => {
      const responses = document.querySelectorAll(responseSelector);
      const latestResponse = responses.item(responses.length - lastResponseOffset);
      return !document.querySelector(globalBusySelector)
        && !latestResponse?.querySelector(responseBusySelector);
    },
    {
      responseSelector: GeminiChatSelector.Response,
      globalBusySelector: GeminiChatSelector.GenerationBusy,
      responseBusySelector: GeminiChatSelector.ResponseGenerationBusy,
      lastResponseOffset: SecurityConstants.DEFAULT_AMOUNT,
    },
    { timeout: GEMINI_MEDIA_EXTRACTION_CONFIG.PAGE_IDLE_TIMEOUT_MS },
  ).catch(() => {
    throw new Error(GEMINI_MEDIA_ERRORS.GENERATION_TIMEOUT_TEMPLATE.replace(
      "{mediaType}",
      mediaType,
    ));
  });
};

async function waitForGeminiFinished(page: Page, visualConfig: GeminiVisualConfig, initialResponseCount?: number) {
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_WAITING_RESPONSE);
  await captureGeminiDomState(page, "waiting_for_response");

  if (initialResponseCount !== undefined) {
    try {
      await page.waitForFunction(
        ({ expectedResponseCount, responseSelector }) => document.querySelectorAll(responseSelector).length >= expectedResponseCount,
        {
          expectedResponseCount: _.add(initialResponseCount, SecurityConstants.DEFAULT_AMOUNT),
          responseSelector: GeminiChatSelector.Response,
        },
        { timeout: GEMINI_MEDIA_EXTRACTION_CONFIG.NEW_RESPONSE_TIMEOUT_MS },
      );
    } catch (e) {
      appError(BACKEND_MESSAGES.GEMINI_CHAT_WAIT_NEW_RESPONSE_TIMEOUT);
      throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_NO_NEW_RESPONSE);
    }
  }

  const latestResponse = page.locator(GeminiChatSelector.Response).last();
  try {
    await latestResponse.waitFor({ state: "visible", timeout: 30000 });
  } catch (e) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_NO_RESPONSE);
  }
  await captureGeminiDomState(page, "response_detected");

  const isVideoGeneration = _.isEqual(visualConfig?.generateType, GenerateType.Video);
  const mediaSelector = isVideoGeneration
    ? GEMINI_CHAT_VIDEO_SELECTORS.GENERATED_VIDEO
    : GEMINI_CHAT_MEDIA_SELECTORS.image;
  let mediaContainer = latestResponse.locator(mediaSelector).first();
  await captureGeminiDomState(page, isVideoGeneration ? "video_loading" : "image_loading");

  if (isVideoGeneration && !(await mediaContainer.isVisible())) {
    const processingIndicator = latestResponse
      .locator(GEMINI_CHAT_VIDEO_SELECTORS.PROCESSING)
      .first();
    try {
      await processingIndicator.waitFor({
        state: "attached",
        timeout: GEMINI_CHAT_VIDEO_INPUT_CONFIG.PROCESSING_APPEAR_TIMEOUT_MS,
      });
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_BUSY_WAIT);
    } catch (error) {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_THINKING_DETACHED);
    }
  }

  const mediaReadyTimeout = isVideoGeneration
    ? GEMINI_CHAT_VIDEO_INPUT_CONFIG.VIDEO_READY_TIMEOUT_MS
    : GEMINI_CHAT_VIDEO_INPUT_CONFIG.MEDIA_READY_TIMEOUT_MS;
  await mediaContainer.waitFor({ state: "visible", timeout: mediaReadyTimeout }).catch(() => undefined);

  if (!(await mediaContainer.isVisible().catch(() => false))) {
    const globalMedia = page.locator(mediaSelector).last();
    if (await globalMedia.isVisible().catch(() => false)) {
      mediaContainer = globalMedia;
    }
  }

  if (!(await mediaContainer.isVisible().catch(() => false))) {
    await captureGeminiDomState(page, isVideoGeneration ? "video_timeout" : "image_timeout");
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_NO_CONTAINER);
    const mediaType = isVideoGeneration ? GEMINI_MEDIA_ERRORS.VIDEO_MEDIA_TYPE : GEMINI_MEDIA_ERRORS.IMAGE_MEDIA_TYPE;
    throw new Error(GEMINI_MEDIA_ERRORS.GENERATION_TIMEOUT_TEMPLATE.replace("{mediaType}", mediaType));
  }
  if (!isVideoGeneration) await waitForGeneratedImageReady(mediaContainer).catch(() => undefined);
  await captureGeminiDomState(page, isVideoGeneration ? "video_ready" : "image_ready");
}

async function getBase64FromBlobUrl(page: Page, mediaElement: Locator): Promise<string | null> {
  try {
    await captureGeminiDomState(page, GEMINI_MEDIA_EXTRACTION_CONFIG.STATES.EXTRACT_START);
    const tagName = await mediaElement.evaluate((el: HTMLElement) => el.tagName.toLowerCase());

    let src: string = GEMINI_MEDIA_EXTRACTION_CONFIG.EMPTY_VALUE;
    for (
      let i = SecurityConstants.ZERO;
      i < GEMINI_CHAT_VIDEO_INPUT_CONFIG.VIDEO_SOURCE_POLL_ATTEMPTS;
      i = _.add(i, SecurityConstants.DEFAULT_AMOUNT)
    ) {
      src = await mediaElement.evaluate((element: HTMLImageElement | HTMLVideoElement | HTMLSourceElement, sourceSelector) => (
        "currentSrc" in element && element.currentSrc
          ? element.currentSrc
          : element.src
            ? element.src
            : element.getAttribute("src")
              ? String(element.getAttribute("src"))
              : "querySelector" in element && element.querySelector<HTMLSourceElement>(sourceSelector)?.src
                ? String(element.querySelector<HTMLSourceElement>(sourceSelector)?.src)
                : GEMINI_MEDIA_EXTRACTION_CONFIG.EMPTY_VALUE
      ), GEMINI_MEDIA_EXTRACTION_CONFIG.SOURCE_SELECTOR);
      if (_.some(GEMINI_MEDIA_EXTRACTION_CONFIG.URL_PREFIXES, (prefix) => _.startsWith(src, prefix))) {
        break;
      }
      await page.waitForTimeout(GEMINI_CHAT_VIDEO_INPUT_CONFIG.VIDEO_SOURCE_POLL_MS);
    }

    if (!src) {
      await captureGeminiDomState(page, GEMINI_MEDIA_EXTRACTION_CONFIG.STATES.SOURCE_MISSING);
      appError(BACKEND_MESSAGES.GEMINI_CHAT_NO_SRC);
      return null;
    }

    if (_.startsWith(src, GEMINI_MEDIA_EXTRACTION_CONFIG.DATA_URL_PREFIX)) {
      const parts = _.split(src, GEMINI_MEDIA_EXTRACTION_CONFIG.DATA_SEPARATOR);
      return _.defaultTo(_.get(parts, SecurityConstants.DEFAULT_AMOUNT), null);
    }

    appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACTING_MEDIA.replace("{0}", tagName).replace("{1}", src));
    await captureGeminiDomState(page, GEMINI_MEDIA_EXTRACTION_CONFIG.STATES.URL_DETECTED);

    if (_.isEqual(tagName, GEMINI_MEDIA_EXTRACTION_CONFIG.IMAGE_TAG)) {
      const base64Data = await mediaElement.evaluate(async (imgEl, extractionConfig) => {
        try {
          const imageElement = imgEl as HTMLImageElement;
          const sourceUrl = imageElement.currentSrc
            ? imageElement.currentSrc
            : imageElement.src
              ? imageElement.src
              : imageElement.getAttribute("src")
                ? String(imageElement.getAttribute("src"))
                : extractionConfig.emptyValue;
          const response = await fetch(sourceUrl);
          if (!response.ok) {
            throw new Error(GEMINI_MEDIA_ERRORS.HTTP_ERROR_TEMPLATE.replace("{status}", _.toString(response.status)));
          }
          const blob = await response.blob();
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (fetchError) {
          try {
            const img = imgEl as HTMLImageElement;
            if (!img.complete || img.naturalWidth === 0) {
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                setTimeout(reject, extractionConfig.imageReadyTimeoutMs);
              });
            }
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width || 800;
            canvas.height = img.naturalHeight || img.height || 450;
            const ctx = canvas.getContext(extractionConfig.canvasContext);
            if (!ctx) return extractionConfig.errorPrefix + extractionConfig.canvasContextError;
            ctx.drawImage(img, 0, 0);
            return canvas.toDataURL(extractionConfig.imageMimeType, extractionConfig.imageQuality).split(extractionConfig.dataSeparator)[extractionConfig.dataIndex];
          } catch (canvasError: unknown) {
            return extractionConfig.errorPrefix + (canvasError instanceof Error ? canvasError.message : String(canvasError));
          }
        }
      }, {
        errorPrefix: GEMINI_MEDIA_EXTRACTION_CONFIG.ERROR_PREFIX,
        emptyValue: GEMINI_MEDIA_EXTRACTION_CONFIG.EMPTY_VALUE,
        canvasContextError: GEMINI_MEDIA_EXTRACTION_CONFIG.CANVAS_CONTEXT_ERROR,
        imageReadyTimeoutMs: GEMINI_MEDIA_EXTRACTION_CONFIG.IMAGE_READY_TIMEOUT_MS,
        canvasContext: GEMINI_MEDIA_EXTRACTION_CONFIG.CANVAS_CONTEXT,
        imageMimeType: GEMINI_MEDIA_EXTRACTION_CONFIG.IMAGE_MIME_TYPE,
        imageQuality: GEMINI_MEDIA_EXTRACTION_CONFIG.IMAGE_QUALITY,
        dataSeparator: GEMINI_MEDIA_EXTRACTION_CONFIG.DATA_SEPARATOR,
        dataIndex: GEMINI_MEDIA_EXTRACTION_CONFIG.DATA_INDEX,
      });

      if (base64Data && !_.startsWith(base64Data, GEMINI_MEDIA_EXTRACTION_CONFIG.ERROR_PREFIX)) {
        await captureGeminiDomState(page, GEMINI_MEDIA_EXTRACTION_CONFIG.STATES.IMAGE_SUCCESS);
        return base64Data;
      }

      try {
        if (await mediaElement.isVisible().catch(() => false)) {
          const screenshotBuf = await mediaElement.screenshot({ type: "jpeg", quality: 95 });
          if (screenshotBuf && screenshotBuf.length > 500) {
            await captureGeminiDomState(page, GEMINI_MEDIA_EXTRACTION_CONFIG.STATES.IMAGE_SUCCESS);
            return screenshotBuf.toString("base64");
          }
        }
      } catch {}

      appError(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_FAILED.replace("{0}", base64Data || "null"));
    } else if (_.isEqual(tagName, GEMINI_MEDIA_EXTRACTION_CONFIG.VIDEO_TAG)) {
      const base64Data = await mediaElement.evaluate(async (videoEl, extractionConfig) => {
        const sourceUrl = (videoEl as HTMLVideoElement).currentSrc
          || (videoEl as HTMLVideoElement).src
          || (videoEl as HTMLVideoElement).getAttribute("src");
        if (!sourceUrl) return null;
        const response = await fetch(sourceUrl);
        if (!response.ok) return null;
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.split(extractionConfig.dataSeparator)[extractionConfig.dataIndex]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }, {
        dataSeparator: GEMINI_MEDIA_EXTRACTION_CONFIG.DATA_SEPARATOR,
        dataIndex: GEMINI_MEDIA_EXTRACTION_CONFIG.DATA_INDEX,
      });

      if (base64Data) {
        await captureGeminiDomState(page, GEMINI_MEDIA_EXTRACTION_CONFIG.STATES.VIDEO_SUCCESS);
        return base64Data;
      }
    }
  } catch (error: unknown) {
    appError(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERROR.replace("{0}", getErrorMessage(error)));
  }
  return null;
}

async function waitForDownloadAndGetBase64(page: Page, visualConfig: GeminiVisualConfig, initialResponseCount?: number): Promise<string | null> {
  await waitForGeminiFinished(page, visualConfig, initialResponseCount);

  const isVideoGeneration = _.isEqual(visualConfig?.generateType, GenerateType.Video);
  const mediaSelector = isVideoGeneration
    ? GEMINI_CHAT_VIDEO_SELECTORS.GENERATED_VIDEO
    : GEMINI_CHAT_MEDIA_SELECTORS.image;

  let mediaLoc = page.locator(GeminiChatSelector.Response).last().locator(mediaSelector).first();
  const isFoundInLatest = await mediaLoc.isVisible().catch(() => false);
  if (!isFoundInLatest) {
    const globalMedia = page.locator(mediaSelector).last();
    if (await globalMedia.isVisible().catch(() => false)) {
      mediaLoc = globalMedia;
    }
  }

  await mediaLoc.waitFor({ state: "visible", timeout: 30000 }).catch(() => undefined);

  const base64 = await getBase64FromBlobUrl(page, mediaLoc);
  if (base64) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_SUCCESS);
    return isVideoGeneration
      ? removeVideoAudioTrack(base64)
      : base64;
  }

  const secondaryBase64 = await page.evaluate(async (selector) => {
    const imgs = document.querySelectorAll(selector);
    const lastImg = imgs[imgs.length - 1] as HTMLImageElement | undefined;
    if (!lastImg) return null;
    const src = lastImg.currentSrc || lastImg.src || lastImg.getAttribute("src") || "";
    if (!src) return null;
    if (src.startsWith("data:image")) return src.split(",")[1];
    try {
      const resp = await fetch(src);
      const blob = await resp.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res.includes(",") ? res.split(",")[1] : res);
        };
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }, mediaSelector).catch(() => null);

  if (secondaryBase64) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_SUCCESS);
    return secondaryBase64;
  }

  try {
    const fallbackElement = page.locator(mediaSelector).last();
    if (await fallbackElement.isVisible().catch(() => false)) {
      const screenshotBuf = await fallbackElement.screenshot({ type: "jpeg", quality: 95 });
      if (screenshotBuf && screenshotBuf.length > 500) {
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_SUCCESS);
        return screenshotBuf.toString("base64");
      }
    }
  } catch {}

  throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERR_THROW);
}
