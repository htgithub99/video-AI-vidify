import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { getNextAccount, GoogleAccount } from "./accountRotatorService.js";
import { autoLoginGoogle } from "./autoLoginGoogle.js";
import path from "path";
import crypto from "crypto";
import { getDataDirectory } from "../utils/paths.js";
import { ImageGenMessages, SecurityConstants } from "../../constants/security.js";

chromium.use(stealthPlugin());
import {
  EXTERNAL_URLS,
  BACKEND_MESSAGES,
  PROMPT_FILLER_WORDS,
  NON_ALPHANUMERIC_SPACE_REGEX,
  PLAYWRIGHT_SUBMIT_ICON_REGEX,
  PLAYWRIGHT_SUBMIT_TEXT_REGEX,
  IMAGE_GEN_IMAGEN_EXACT_REGEX,
  IMAGE_GEN_IMAGEN_FALLBACK_REGEX,
  IMAGE_GEN_LABS_EXACT_REGEX,
  IMAGE_GEN_LABS_FALLBACK_REGEX,
  IMAGE_GEN_VEO_EXACT_REGEX,
  IMAGE_GEN_VEO_FALLBACK_REGEX,
  GEMINI_MODEL_PRO_REGEX,
  GEMINI_MODEL_FLASH_REGEX,
  GEMINI_MODEL_FLASH_FAMILY_REGEX,
  GEMINI_MODEL_FLASH_LITE_REGEX,
  CONTENT_TYPES,
  COMMON_STRINGS,
  URL_CONSTANTS,
  IMAGE_ID_URL_REGEX,
  REFACTOR_CONSTANTS,
  BASE64_IMAGE_MIME_REGEX,
  GEMINI_BATCH_SETUP_CONFIG,
  GEMINI_CHAT_RECOVERY_CONFIG,
  GEMINI_CHAT_VIDEO_INPUT_CONFIG,
  GEMINI_CHAT_VIDEO_SELECTORS,
  GEMINI_CHAT_PACING_CONFIG,
  PIPELINE_CONFIG,
  GEMINI_DOM_DIAGNOSTICS_CONFIG,
  GEMINI_MEDIA_EXTRACTION_CONFIG,
  GEMINI_MEDIA_ERRORS,
  GEMINI_MODEL_SELECTION_CONFIG,
  GEMINI_ACTIVE_VIDEO_MODE_REGEX,
  GEMINI_ACTIVE_IMAGE_MODE_REGEX,
  FLOW_AGENT_UI_CONFIG,
  FLOW_AGENT_VIDEO_ASPECT_RATIOS,
  FLOW_DIRECT_VIDEO_CONFIG,
  FLOW_VIDEO_MEDIA_CONFIG,
  PROVIDER_REFERENCE_UPLOAD_CONFIG,
  PROVIDER_REFERENCE_UPLOAD_MESSAGES,
} from "../../constants";
import { jsonUtils } from "../../lib/json.js";
import { appLog, appError, createAppError } from "../../lib/logger.js";
import { randomDelay, getBatchDelayMs, delayAsync } from "../../lib/shared-utils.js";
import {
  GenerateType,
  ImageGeneratorEngine,
  PromptInputMethod,
  ImageGenerationMode,
  GeminiChatModelName,
  GeminiChatSelector,
  GeminiChatTextOption,
  GeminiChatSpeed,
  GEMINI_CHAT_SPEED_TAB_COUNT,
  AspectRatio,
  GEMINI_CHAT_MEDIA_SELECTORS,
  VisualConfig,
} from "../../types.js";
import { Browser, BrowserContext, Locator, Page } from "playwright";
import { spawn } from "child_process";
import _ from "lodash";
import { inspectGeneratedVideoBuffer, removeVideoAudioTrack } from "../utils/videoAssetProcessor.js";
import { captureDomDiagnostics } from "./domDiagnosticsService.js";
import { getErrorMessage } from "../utils/errorUtils.js";
import { readEncodedProjectImage } from "./imageAssetService.js";
import { resolveBatchTabCount } from "../../services/batchGenerationPolicy.js";
import { isImageAspectRatioCompatible } from "../utils/imageAspectRatio.js";
import { removeConflictingStyleTerms } from "../../services/styleReferenceService.js";
import { distributeItemsByContinuity } from "../../services/imageGenerationContinuityService.js";

interface BrowserSession {
  context: BrowserContext;
  page: Page;
  account: GoogleAccount;
  ownsContext?: boolean;
}

type GeminiVisualConfig = Partial<VisualConfig>;

const FLOW_PROMPT_SELECTORS = [
  '[contenteditable="true"][role="textbox"]',
  'textarea[placeholder*="prompt" i]',
  'textarea[placeholder*="mô tả" i]',
  "textarea",
  '[contenteditable="true"]',
];

const flowReferenceSignatureMap = new WeakMap<Page, string>();
const grokReferenceSignatureMap = new WeakMap<Page, string>();
let mediaGenerationRevision = SecurityConstants.ZERO;

const isMediaGenerationCancelled = (revision: number): boolean => !_.isEqual(revision, mediaGenerationRevision);

const getReferenceProviderName = (provider: "flow" | "grok", logName = false): string => {
  if (_.isEqual(provider, "flow")) return logName ? PROVIDER_REFERENCE_UPLOAD_MESSAGES.FLOW_LOG_NAME : PROVIDER_REFERENCE_UPLOAD_MESSAGES.FLOW_NAME;
  return logName ? PROVIDER_REFERENCE_UPLOAD_MESSAGES.GROK_LOG_NAME : PROVIDER_REFERENCE_UPLOAD_MESSAGES.GROK_NAME;
};

const createReferenceUploadMessage = (template: string, provider: "flow" | "grok", count?: number): string =>
  _.replace(
    _.replace(template, PROVIDER_REFERENCE_UPLOAD_MESSAGES.PROVIDER_TOKEN, getReferenceProviderName(provider, _.isNumber(count))),
    PROVIDER_REFERENCE_UPLOAD_MESSAGES.COUNT_TOKEN,
    _.toString(count),
  );

const removeProviderReferenceAttachments = async (page: Page): Promise<void> => {
  const removeButtons = page.locator(PROVIDER_REFERENCE_UPLOAD_CONFIG.ATTACHMENT_REMOVE_BUTTON);
  const count = await removeButtons.count().catch(() => SecurityConstants.ZERO);
  for (let index = _.subtract(count, SecurityConstants.DEFAULT_AMOUNT); index >= SecurityConstants.ZERO; index--) {
    const button = removeButtons.nth(index);
    if (await button.isVisible().catch(() => false)) {
      await button.click().catch(() => undefined);
      await page.waitForTimeout(PROVIDER_REFERENCE_UPLOAD_CONFIG.POST_ACTION_DELAY_MS);
    }
  }
};

type ProviderReferenceFile = { name: string; mimeType: string; buffer: Buffer };
type ProviderReferenceAttachmentResult = { attached: boolean; uploadedCount: number };

const createReferenceSignature = (files: ProviderReferenceFile[]): string => {
  const hash = crypto.createHash("sha256");
  _.forEach(files, (file) => hash.update(file.name).update(file.mimeType).update(file.buffer));
  return hash.digest("hex");
};

const uploadFilesFromButton = async (page: Page, button: Locator, files: ProviderReferenceFile[]): Promise<boolean> => {
  if (!(await button.isVisible().catch(() => false))) return false;
  const chooser = await Promise.all([
    page.waitForEvent("filechooser", { timeout: PROVIDER_REFERENCE_UPLOAD_CONFIG.FILE_CHOOSER_TIMEOUT_MS }).catch(() => null),
    button.click().catch(() => undefined),
  ]).then(([fileChooser]) => fileChooser);
  if (!chooser) return false;
  await chooser.setFiles(files);
  return true;
};

const attachFlowReferenceFiles = async (page: Page, files: ProviderReferenceFile[]): Promise<ProviderReferenceAttachmentResult> => {
  const openMediaDialog = async (): Promise<boolean> => {
    const button = page.getByRole("button", { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_COMPOSER_MEDIA_BUTTON }).last();
    if (!(await button.isVisible().catch(() => false))) return false;
    await button.click();
    await page.waitForTimeout(PROVIDER_REFERENCE_UPLOAD_CONFIG.PROVIDER_PANEL_DELAY_MS);
    return true;
  };

  if (!(await openMediaDialog())) return { attached: false, uploadedCount: SecurityConstants.ZERO };
  await Promise.all(
    _.map(files, (file) =>
      page
        .getByRole(PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_UPLOADED_OPTION_ROLE, { name: new RegExp(_.escapeRegExp(file.name), "i") })
        .last()
        .waitFor({ state: "visible", timeout: PROVIDER_REFERENCE_UPLOAD_CONFIG.LIBRARY_LOOKUP_TIMEOUT_MS })
        .catch(() => undefined),
    ),
  );
  const missingFiles: ProviderReferenceFile[] = [];
  for (const file of files) {
    const optionName = new RegExp(_.escapeRegExp(file.name), "i");
    const option = page.getByRole(PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_UPLOADED_OPTION_ROLE, { name: optionName }).last();
    if (!(await option.isVisible().catch(() => false))) missingFiles.push(file);
  }
  if (!_.isEmpty(missingFiles)) {
    const uploadButton = page.getByRole("button", { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_DIALOG_UPLOAD_BUTTON }).last();
    if (!(await uploadFilesFromButton(page, uploadButton, missingFiles))) return { attached: false, uploadedCount: SecurityConstants.ZERO };
    const consentButton = page.getByRole("button", { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_UPLOAD_CONSENT_BUTTON }).last();
    if (await consentButton.isVisible().catch(() => false)) await consentButton.click();
  }

  for (const file of files) {
    const optionName = new RegExp(_.escapeRegExp(file.name), "i");
    let option = page.getByRole(PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_UPLOADED_OPTION_ROLE, { name: optionName }).last();
    if (!(await option.isVisible().catch(() => false))) {
      if (!(await openMediaDialog())) return { attached: false, uploadedCount: missingFiles.length };
      option = page.getByRole(PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_UPLOADED_OPTION_ROLE, { name: optionName }).last();
    }
    await option.waitFor({ state: "visible", timeout: PROVIDER_REFERENCE_UPLOAD_CONFIG.UPLOAD_VERIFY_TIMEOUT_MS }).catch(() => undefined);
    if (!(await option.isVisible().catch(() => false))) return { attached: false, uploadedCount: missingFiles.length };
    await option.click({ force: true });
    const addButton = page.getByRole("button", { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_ADD_TO_PROMPT_BUTTON }).last();
    if (await addButton.isVisible().catch(() => false)) await addButton.click();
    await page.waitForTimeout(PROVIDER_REFERENCE_UPLOAD_CONFIG.POST_ACTION_DELAY_MS);
  }
  return { attached: true, uploadedCount: missingFiles.length };
};

const attachGrokReferenceFiles = async (page: Page, files: ProviderReferenceFile[]): Promise<ProviderReferenceAttachmentResult> => {
  const openUploads = async (): Promise<boolean> => {
    const toolboxButton = page.getByRole("button", { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.GROK_TOOLBOX_BUTTON }).last();
    if (!(await toolboxButton.isVisible().catch(() => false))) return false;
    await toolboxButton.click();
    await page.waitForTimeout(PROVIDER_REFERENCE_UPLOAD_CONFIG.PROVIDER_PANEL_DELAY_MS);
    const uploadsTab = page.getByRole("tab", { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.GROK_UPLOAD_TAB }).last();
    if (await uploadsTab.isVisible().catch(() => false)) await uploadsTab.click();
    return true;
  };

  if (!(await openUploads())) return { attached: false, uploadedCount: SecurityConstants.ZERO };
  await Promise.all(
    _.map(files, (file) =>
      page
        .getByRole("button", { name: new RegExp(_.escapeRegExp(file.name), "i") })
        .last()
        .waitFor({ state: "visible", timeout: PROVIDER_REFERENCE_UPLOAD_CONFIG.LIBRARY_LOOKUP_TIMEOUT_MS })
        .catch(() => undefined),
    ),
  );
  const missingFiles: ProviderReferenceFile[] = [];
  for (const file of files) {
    const namedButton = page.getByRole("button", { name: new RegExp(_.escapeRegExp(file.name), "i") }).last();
    if (!(await namedButton.isVisible().catch(() => false))) missingFiles.push(file);
  }
  if (!_.isEmpty(missingFiles)) {
    const uploadButton = page.getByRole("button", { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.GROK_MEDIA_UPLOAD_BUTTON }).last();
    if (!(await uploadFilesFromButton(page, uploadButton, missingFiles))) return { attached: false, uploadedCount: SecurityConstants.ZERO };
    await page.waitForTimeout(PROVIDER_REFERENCE_UPLOAD_CONFIG.PROVIDER_PANEL_DELAY_MS);
    const uploadsTab = page.getByRole("tab", { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.GROK_UPLOAD_TAB }).last();
    if (await uploadsTab.isVisible().catch(() => false)) await uploadsTab.click();
  }
  for (const file of files) {
    const fileNamePattern = new RegExp(_.escapeRegExp(file.name), "i");
    let namedButton = page.getByRole("button", { name: fileNamePattern }).last();
    if (!(await namedButton.isVisible().catch(() => false))) {
      if (!(await openUploads())) return { attached: false, uploadedCount: missingFiles.length };
      namedButton = page.getByRole("button", { name: fileNamePattern }).last();
    }
    await namedButton.waitFor({ state: "visible", timeout: PROVIDER_REFERENCE_UPLOAD_CONFIG.UPLOAD_VERIFY_TIMEOUT_MS }).catch(() => undefined);
    if (!(await namedButton.isVisible().catch(() => false))) return { attached: false, uploadedCount: missingFiles.length };
    await namedButton.click();
    await page.waitForTimeout(PROVIDER_REFERENCE_UPLOAD_CONFIG.POST_ACTION_DELAY_MS);
  }
  return { attached: true, uploadedCount: missingFiles.length };
};

const countAttachedProviderReferences = async (page: Page, provider: "flow" | "grok", files: ProviderReferenceFile[]): Promise<number> => {
  if (_.isEqual(provider, "flow")) {
    const legacyCollectionCount = await page
      .getByRole("button", { name: /nội dung nghe nhìn do bạn tạo hoặc tải lên|media.*collection/i })
      .count()
      .catch(() => SecurityConstants.ZERO);
    const genericPreviewCount = await page
      .locator(PROVIDER_REFERENCE_UPLOAD_CONFIG.ATTACHMENT_PREVIEW)
      .count()
      .catch(() => SecurityConstants.ZERO);
    const removeButtonCount = await page
      .locator(PROVIDER_REFERENCE_UPLOAD_CONFIG.ATTACHMENT_REMOVE_BUTTON)
      .count()
      .catch(() => SecurityConstants.ZERO);
    const visiblePromptInput = page.locator(_.join(_.map(FLOW_PROMPT_SELECTORS, (selector) => `${selector}:visible`), ", ")).last();
    const composerThumbnailCount = await visiblePromptInput
      .evaluate((input) => {
        let current: HTMLElement | null = input as HTMLElement;
        for (let level = 0; level < 8 && current; level++) {
          const visibleThumbnails = Array.from(
            current.querySelectorAll('img[src], [data-testid*="attachment" i], [data-test-id*="attachment" i], [data-testid*="ingredient" i], [data-test-id*="ingredient" i]'),
          ).filter((node) => {
            const element = node as HTMLElement;
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return style.visibility !== "hidden" && style.display !== "none" && rect.width >= 20 && rect.height >= 20 && rect.width <= 220 && rect.height <= 220;
          }).length;
          if (visibleThumbnails > 0) return visibleThumbnails;
          current = current.parentElement;
        }
        return 0;
      })
      .catch(() => SecurityConstants.ZERO);
    return _.max([legacyCollectionCount, genericPreviewCount, removeButtonCount, composerThumbnailCount]) || SecurityConstants.ZERO;
  }
  const visibilityChecks = await Promise.all(
    _.map(files, async (file) =>
      page
        .getByRole("img", { name: new RegExp(_.escapeRegExp(file.name), "i") })
        .last()
        .isVisible()
        .catch(() => false),
    ),
  );
  const namedImageCount = _.filter(visibilityChecks, Boolean).length;
  const attachmentPreviewCount = await page
    .locator(PROVIDER_REFERENCE_UPLOAD_CONFIG.ATTACHMENT_PREVIEW)
    .count()
    .catch(() => SecurityConstants.ZERO);
  return _.max([namedImageCount, attachmentPreviewCount]) || SecurityConstants.ZERO;
};

const uploadProviderCharacterReferences = async (page: Page, referenceImages: string[] | undefined, provider: "flow" | "grok"): Promise<void> => {
  const normalizedReferences = _.take(_.uniq(_.filter(_.castArray(referenceImages || []), _.isString)), GEMINI_CHAT_VIDEO_INPUT_CONFIG.MAX_REFERENCE_IMAGES);
  const signatureMap = _.isEqual(provider, "flow") ? flowReferenceSignatureMap : grokReferenceSignatureMap;
  const rawReferenceFiles = createGeminiReferenceFiles(normalizedReferences);
  if (!_.isEqual(rawReferenceFiles.length, normalizedReferences.length))
    throw createAppError(createReferenceUploadMessage(PROVIDER_REFERENCE_UPLOAD_MESSAGES.READ_FAILED, provider));
  const referenceFiles = _.uniqBy(rawReferenceFiles, "name");
  const nextSignature = createReferenceSignature(referenceFiles);
  const existingPreviewCount = await countAttachedProviderReferences(page, provider, referenceFiles);
  if (_.isEqual(signatureMap.get(page), nextSignature) && (_.isEmpty(normalizedReferences) || _.gte(existingPreviewCount, normalizedReferences.length))) return;

  await removeProviderReferenceAttachments(page);
  if (_.isEmpty(normalizedReferences)) {
    signatureMap.set(page, nextSignature);
    return;
  }

  let attachmentResult = _.isEqual(provider, "flow") ? await attachFlowReferenceFiles(page, referenceFiles) : await attachGrokReferenceFiles(page, referenceFiles);

  if (!attachmentResult.attached && _.isEqual(attachmentResult.uploadedCount, SecurityConstants.ZERO)) {
    const uploadPattern = _.isEqual(provider, "flow") ? PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_UPLOAD_BUTTON : PROVIDER_REFERENCE_UPLOAD_CONFIG.GROK_UPLOAD_BUTTON;
    const uploadButton = page.getByRole("button", { name: uploadPattern }).last();
    if (await uploadButton.isVisible().catch(() => false)) {
      const fileChooser = await Promise.all([
        page.waitForEvent("filechooser", { timeout: PROVIDER_REFERENCE_UPLOAD_CONFIG.FILE_CHOOSER_TIMEOUT_MS }).catch(() => null),
        uploadButton.click().catch(() => undefined),
      ]).then(([chooser]) => chooser);
      if (fileChooser) {
        await fileChooser.setFiles(referenceFiles);
        attachmentResult = { attached: true, uploadedCount: referenceFiles.length };
      }
    }
  }

  if (!attachmentResult.attached) throw createAppError(createReferenceUploadMessage(PROVIDER_REFERENCE_UPLOAD_MESSAGES.CONTROL_MISSING, provider));
  const verificationStartedAt = Date.now();
  let attachedCount = SecurityConstants.ZERO;
  while (_.lt(Date.now() - verificationStartedAt, PROVIDER_REFERENCE_UPLOAD_CONFIG.UPLOAD_VERIFY_TIMEOUT_MS)) {
    attachedCount = await countAttachedProviderReferences(page, provider, referenceFiles);
    if (_.gte(attachedCount, referenceFiles.length)) break;
    await page.waitForTimeout(PROVIDER_REFERENCE_UPLOAD_CONFIG.POST_ACTION_DELAY_MS);
  }
  if (_.lt(attachedCount, referenceFiles.length)) {
    if (!attachmentResult.attached) throw createAppError(createReferenceUploadMessage(PROVIDER_REFERENCE_UPLOAD_MESSAGES.VERIFY_FAILED, provider));
    await captureGeminiDomState(page, `${provider}-reference-attached-without-count`).catch(() => undefined);
  }
  signatureMap.set(page, nextSignature);
  if (_.gt(attachmentResult.uploadedCount, SecurityConstants.ZERO)) {
    appLog(createReferenceUploadMessage(PROVIDER_REFERENCE_UPLOAD_MESSAGES.SUCCESS, provider, attachmentResult.uploadedCount));
  }
  const reusedCount = _.subtract(referenceFiles.length, attachmentResult.uploadedCount);
  if (_.gt(reusedCount, SecurityConstants.ZERO)) appLog(createReferenceUploadMessage(PROVIDER_REFERENCE_UPLOAD_MESSAGES.REUSED, provider, reusedCount));
};

const normalizeFlowProjectId = (projectId?: string): string => {
  const normalized = _.replace(_.defaultTo(projectId, ""), /^projects\//, "").trim();
  return /^proj_/i.test(normalized) ? "" : normalized;
};

export const isFlowProjectPageUrl = (value: string, projectId: string): boolean =>
  FLOW_DIRECT_VIDEO_CONFIG.PROJECT_URL_PATTERN.test(_.trim(value)) && !_.isEmpty(projectId) && _.includes(value, `/project/${projectId}`);

export const createFlowVideoConfigState = (visualConfig?: ImageGeneratorOptions["visualConfig"]): string =>
  jsonUtils.safeStringify({
    generateType: _.defaultTo(visualConfig?.generateType, GenerateType.Image),
    aspectRatio: _.defaultTo(visualConfig?.aspectRatio, AspectRatio.SixteenNine),
    generateCount: _.defaultTo(visualConfig?.generateCount, 1),
    imageGeneratorEngine: _.defaultTo(visualConfig?.imageGeneratorEngine, ImageGeneratorEngine.Veo3),
    videoDuration: _.defaultTo(visualConfig?.videoDuration, FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_DURATION),
    videoResolution: _.defaultTo(visualConfig?.videoResolution, FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_RESOLUTION),
  });

export const createFlowDurationOptionPattern = (duration?: string): RegExp => {
  const seconds = _.replace(_.defaultTo(duration, FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_DURATION), /[^0-9.]/g, "");
  return new RegExp(`^(?:schedule\\s*)?${_.escapeRegExp(seconds)}\\s*(?:s|sec(?:ond)?s?|giây)?$`, "i");
};

const FLOW_SINGLE_OUTPUT_PATTERN = /^(?:x1|1x)$/i;

export const isFlowVideoConfigSummaryMatching = (summary: string, visualConfig?: ImageGeneratorOptions["visualConfig"]): boolean => {
  const normalizedSummary = _.replace(_.trim(summary), /\s+/g, " ");
  const targetResolution = _.includes(FLOW_DIRECT_VIDEO_CONFIG.RESOLUTIONS, visualConfig?.videoResolution as (typeof FLOW_DIRECT_VIDEO_CONFIG.RESOLUTIONS)[number])
    ? visualConfig?.videoResolution
    : FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_RESOLUTION;
  const targetDuration = _.includes(FLOW_DIRECT_VIDEO_CONFIG.DURATIONS, visualConfig?.videoDuration as (typeof FLOW_DIRECT_VIDEO_CONFIG.DURATIONS)[number])
    ? visualConfig?.videoDuration
    : FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_DURATION;
  const visibleResolution = _.trim(normalizedSummary.match(/(?:360|720)p/i)?.[0] || "");
  const visibleDuration = _.trim(normalizedSummary.match(/\d+\s*(?:s|sec(?:ond)?s?|giây)/i)?.[0] || "");
  return (
    /Video/i.test(normalizedSummary) &&
    _.isEqual(_.lowerCase(visibleResolution), _.lowerCase(_.toString(targetResolution))) &&
    createFlowDurationOptionPattern(targetDuration).test(visibleDuration) &&
    /(?:^|\s|·)(?:x1|1x)(?:$|\s|·)/i.test(normalizedSummary)
  );
};

const findFlowChoice = (root: Locator, pattern: RegExp): Locator =>
  root.locator('[role="radio"], [role="tab"], [role="option"], [role="menuitemradio"], button').filter({ hasText: pattern }).last();

const selectFlowChoice = async (root: Locator, pattern: RegExp): Promise<Locator | null> => {
  const choice = findFlowChoice(root, pattern);
  if (!(await choice.isVisible().catch(() => false))) return null;
  const alreadySelected = await choice
    .evaluate((element) =>
      [element.getAttribute("aria-checked"), element.getAttribute("aria-selected"), element.getAttribute("aria-pressed")].some((value) => value === "true"),
    )
    .catch(() => false);
  if (!alreadySelected) await choice.click({ force: true });
  return choice;
};

const dismissFlowOnboarding = async (page: Page): Promise<void> => {
  for (let pass = 0; pass < 5; pass++) {
    const dialog = page.locator(`${REFACTOR_CONSTANTS.PLAYWRIGHT_DIALOG_SELECTOR}${REFACTOR_CONSTANTS.PLAYWRIGHT_VISIBLE_PSEUDO}`).last();
    if (!(await dialog.isVisible().catch(() => false))) return;

    await dialog
      .evaluate((element) => {
        element.scrollTop = element.scrollHeight;
        const scrollables = Array.from(element.querySelectorAll("*")).filter((node) => {
          const htmlNode = node as HTMLElement;
          return htmlNode.scrollHeight > htmlNode.clientHeight;
        }) as HTMLElement[];
        scrollables.forEach((node) => {
          node.scrollTop = node.scrollHeight;
        });
      })
      .catch(() => {});
    await page.waitForTimeout(400);

    const continueButton = dialog
      .locator("button")
      .filter({
        hasText: /Tiếp tục|Continue|Bắt đầu|Get started|Đã hiểu|Got it|Next|Tiếp theo|Đồng ý|Agree/i,
      })
      .last();
    const closeButton = dialog.locator('button[aria-label*="close" i], button[aria-label*="đóng" i]').last();
    if (await continueButton.isEnabled().catch(() => false)) {
      await continueButton.click();
    } else if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    } else {
      return;
    }
    await page.waitForTimeout(700);
  }
};

const locateFlowPromptInput = async (page: Page, timeoutMs = 60000): Promise<Locator | null> => {
  const deadline = Date.now() + timeoutMs;
  do {
    await dismissFlowOnboarding(page);
    for (const selector of FLOW_PROMPT_SELECTORS) {
      const locator = page.locator(`${selector}:visible`).last();
      if (await locator.isVisible().catch(() => false)) return locator;
    }
    await page.waitForTimeout(750);
  } while (Date.now() < deadline);
  return null;
};

const readFlowPromptInput = async (input: Locator): Promise<string> =>
  input
    .evaluate((element) => {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return element.value;
      return (element as HTMLElement).innerText || element.textContent || "";
    })
    .catch(() => "");

export const normalizeFlowPromptValue = (value: string): string =>
  _.trim(_.replace(_.replace(_.toString(value).normalize("NFKC"), /[\u200B-\u200D\u2060\uFEFF]/g, ""), /\s+/g, " "));

export const isFlowPromptValueApplied = (currentValue: string, targetPrompt: string): boolean => {
  const current = normalizeFlowPromptValue(currentValue);
  const target = normalizeFlowPromptValue(targetPrompt);
  return !_.isEmpty(target) && (_.isEqual(current, target) || _.includes(current, target));
};

const waitForFlowPromptApplied = async (page: Page, input: Locator, prompt: string): Promise<boolean> => {
  const deadline = Date.now() + FLOW_DIRECT_VIDEO_CONFIG.PROMPT_APPLY_TIMEOUT_MS;
  do {
    if (isFlowPromptValueApplied(await readFlowPromptInput(input), prompt)) return true;
    await page.waitForTimeout(100);
  } while (Date.now() < deadline);
  return false;
};

const replaceFlowPromptInput = async (page: Page, input: Locator, prompt: string): Promise<boolean> => {
  await input.click({ force: true });
  await input.fill(prompt, { timeout: FLOW_DIRECT_VIDEO_CONFIG.PROMPT_ACTION_TIMEOUT_MS }).catch(() => undefined);
  if (await waitForFlowPromptApplied(page, input, prompt)) return true;
  await input.click({ force: true });
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(prompt);
  return waitForFlowPromptApplied(page, input, prompt);
};

const isFlowProjectUnavailable = async (page: Page): Promise<boolean> =>
  page
    .getByRole("heading", { name: FLOW_DIRECT_VIDEO_CONFIG.PROJECT_ERROR_HEADING })
    .last()
    .isVisible()
    .catch(() => false);

const parseConfiguredVideoDuration = (duration?: string): number => {
  const parsed = _.toNumber(_.replace(_.defaultTo(duration, FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_DURATION), /[^0-9.]/g, ""));
  return _.gt(parsed, 0) ? parsed : _.toNumber(_.replace(FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_DURATION, /[^0-9.]/g, ""));
};

interface FlowDownloadedVideo {
  buffer: Buffer;
  mimeType: string;
  mediaUrl: string;
}

export const normalizeFlowMediaId = (value: string): string => _.defaultTo(_.toString(value).match(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_ID_PATTERN)?.[0], _.trim(value));

export const createFlowMediaRedirectUrl = (mediaId: string): string =>
  new URL(
    _.replace(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_REDIRECT_PATH, FLOW_VIDEO_MEDIA_CONFIG.MEDIA_ID_TOKEN, encodeURIComponent(normalizeFlowMediaId(mediaId))),
    EXTERNAL_URLS.GOOGLE_LABS,
  ).href;

const extractFlowMediaIdFromUrl = (mediaUrl: string): string => {
  try {
    const parsedUrl = new URL(mediaUrl, EXTERNAL_URLS.GOOGLE_LABS);
    return _.defaultTo(_.toString(parsedUrl.searchParams.get("name") || mediaUrl).match(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_ID_PATTERN)?.[0], "");
  } catch {
    return _.defaultTo(mediaUrl.match(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_ID_PATTERN)?.[0], "");
  }
};

const waitForFlowMediaCardReady = async (page: Page, mediaId: string): Promise<Locator> => {
  const resultThumb = page.locator(`img[src*="name=${mediaId}"]`).last();
  const resultButton = resultThumb.locator("xpath=ancestor::button[1]");
  const deadline = Date.now() + FLOW_VIDEO_MEDIA_CONFIG.GENERATION_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await resultButton.isVisible().catch(() => false)) {
      const state = await resultButton
        .evaluate((element) => ({
          busy: element.getAttribute("aria-busy") === "true" || element.getAttribute("data-state") === "loading",
          hasProgress: Boolean(element.querySelector('[role="progressbar"], progress, [aria-valuenow]')),
          text: element.textContent || "",
          thumbnailReady: Array.from(element.querySelectorAll("img")).some((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0),
        }))
        .catch(() => null);
      const hasProgressText = FLOW_VIDEO_MEDIA_CONFIG.PROGRESS_TEXT_PATTERN.test(_.defaultTo(state?.text, ""));
      if (state?.thumbnailReady && !state.busy && !state.hasProgress && !hasProgressText) return resultButton;
    }
    await page.waitForTimeout(FLOW_VIDEO_MEDIA_CONFIG.READY_POLL_INTERVAL_MS);
  }
  throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR);
};

const downloadFlowVideoFromCard = async (page: Page, mediaCard: Locator, previousVideoSources: string[], expectedDurationSeconds: number): Promise<FlowDownloadedVideo | null> => {
  await mediaCard.scrollIntoViewIfNeeded();
  await mediaCard.click({ force: true });
  await page.waitForTimeout(FLOW_VIDEO_MEDIA_CONFIG.READY_POLL_INTERVAL_MS);
  const videoUrls = await collectFlowVideoUrls(page);
  return downloadValidatedVideo(
    page.context(),
    _.filter(videoUrls, (url) => !_.includes(previousVideoSources, url)),
    expectedDurationSeconds,
  ).catch(() => null);
};

const getFlowVideoEditIds = async (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/edit/"]'))
      .filter((link) => {
        const container = link.closest("button") || link.parentElement;
        const text = container?.textContent || "";
        return /play_circle|360p|720p/i.test(text) || Boolean(link.querySelector('img[alt*="video" i], img[alt*="Hình thu nhỏ video" i]'));
      })
      .map((link) => link.getAttribute("href")?.split("/edit/").pop() || "")
      .filter(Boolean),
  );

const downloadFlowVideoFromEdit = async (page: Page, flowProjectId: string, editId: string, expectedDurationSeconds: number): Promise<FlowDownloadedVideo | null> => {
  await page.goto(`${EXTERNAL_URLS.GOOGLE_LABS_FLOW}/${flowProjectId}/edit/${editId}`, {
    waitUntil: "domcontentloaded",
    timeout: FLOW_VIDEO_MEDIA_CONFIG.DOWNLOAD_TIMEOUT_MS,
  });
  await dismissFlowOnboarding(page);
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("video")).some((video) => Boolean(video.currentSrc || video.getAttribute("src") || video.querySelector("source")?.getAttribute("src"))),
    undefined,
    { timeout: FLOW_VIDEO_MEDIA_CONFIG.DOWNLOAD_TIMEOUT_MS },
  );
  const videoUrls = await collectFlowVideoUrls(page);
  return downloadValidatedVideo(page.context(), videoUrls, expectedDurationSeconds).catch(() => null);
};

export interface FlowVideoRecoveryOptions {
  flowProjectId: string;
  mediaId: string;
  expectedDuration?: string;
  retainBrowserSession?: boolean;
}

export const recoverExistingFlowVideo = async (options: FlowVideoRecoveryOptions): Promise<ImageGeneratorResult> => {
  const flowProjectId = normalizeFlowProjectId(options.flowProjectId);
  const mediaId = normalizeFlowMediaId(options.mediaId);
  if (_.some([flowProjectId, mediaId], _.isEmpty)) {
    return { success: false, base64: null, fallbackUrl: SecurityConstants.EMPTY_STRING, warning: FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR };
  }

  const release = await imageGenMutex.acquire();
  let browserInstance: BrowserSession | null = null;
  try {
    browserInstance = await getOrLaunchGlobalBrowser();
    const page = browserInstance.page;
    const targetUrl = `${EXTERNAL_URLS.GOOGLE_LABS_FLOW}/${flowProjectId}`;
    if (!_.includes(page.url(), flowProjectId)) {
      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: FLOW_VIDEO_MEDIA_CONFIG.DOWNLOAD_TIMEOUT_MS });
    }
    await dismissFlowOnboarding(page);
    if (await isFlowProjectUnavailable(page)) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR);

    const expectedDurationSeconds = parseConfiguredVideoDuration(options.expectedDuration);
    const directMediaUrl = createFlowMediaRedirectUrl(mediaId);
    let downloadedVideo = await downloadValidatedVideo(browserInstance.context, [directMediaUrl], expectedDurationSeconds).catch(() => null);
    if (!downloadedVideo) downloadedVideo = await downloadFlowVideoFromEdit(page, flowProjectId, mediaId, expectedDurationSeconds).catch(() => null);
    if (!downloadedVideo) {
      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: FLOW_VIDEO_MEDIA_CONFIG.DOWNLOAD_TIMEOUT_MS });
      const availableEditIds = await getFlowVideoEditIds(page);
      for (const editId of _.uniq([mediaId, ...availableEditIds])) {
        downloadedVideo = await downloadFlowVideoFromEdit(page, flowProjectId, editId, expectedDurationSeconds).catch(() => null);
        if (downloadedVideo) break;
      }
      if (!downloadedVideo) {
        await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: FLOW_VIDEO_MEDIA_CONFIG.DOWNLOAD_TIMEOUT_MS });
        const mediaCard = await waitForFlowMediaCardReady(page, mediaId);
        downloadedVideo = await downloadFlowVideoFromCard(page, mediaCard, [], expectedDurationSeconds);
      }
    }
    if (!downloadedVideo) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR);
    return {
      success: true,
      base64: downloadedVideo.buffer.toString(REFACTOR_CONSTANTS.ENCODING_BASE64),
      fallbackUrl: SecurityConstants.EMPTY_STRING,
      remoteMediaId: mediaId,
      remoteMediaCreated: true,
    };
  } catch (error) {
    return {
      success: false,
      base64: null,
      fallbackUrl: SecurityConstants.EMPTY_STRING,
      warning: getErrorMessage(error),
      remoteMediaId: mediaId,
      remoteMediaCreated: true,
    };
  } finally {
    if (browserInstance) {
      if (options.retainBrowserSession) scheduleGlobalBrowserCleanup();
      else await closeActiveBrowser();
    }
    release();
  }
};

const collectFlowVideoUrls = async (page: Page, mediaId?: string | null, directVideoSrc?: string | null): Promise<string[]> => {
  const pageUrls = await page.evaluate(
    ({ targetMediaId, mediaApiPathMarker }) => {
      const normalizeMediaUrl = (value: string | null | undefined): string => {
        if (!value || value.startsWith("blob:")) return "";
        try {
          const absoluteUrl = new URL(value, window.location.origin).href;
          const firstApiPathIndex = absoluteUrl.indexOf(mediaApiPathMarker);
          const finalApiPathIndex = absoluteUrl.lastIndexOf(mediaApiPathMarker);
          return finalApiPathIndex > firstApiPathIndex ? new URL(absoluteUrl.slice(finalApiPathIndex), window.location.origin).href : absoluteUrl;
        } catch {
          return "";
        }
      };
      const elementUrls = Array.from(document.querySelectorAll("video, source, a[href]"))
        .flatMap((element) => [
          (element as HTMLVideoElement).currentSrc,
          element.getAttribute("src"),
          element.getAttribute("href"),
          element.getAttribute("data-src"),
          element.getAttribute("data-url"),
        ])
        .map(normalizeMediaUrl)
        .filter(Boolean);
      const resourceUrls = performance.getEntriesByType("resource").map((entry) => normalizeMediaUrl(entry.name));
      return [...elementUrls, ...resourceUrls].filter(
        (url) =>
          /media\.getMediaUrlRedirect|googleusercontent|storage|\.(?:mp4|webm|mov)(?:\?|$)/i.test(url) &&
          (!targetMediaId || url.includes(targetMediaId) || /media\.getMediaUrlRedirect/i.test(url)),
      );
    },
    { targetMediaId: mediaId || null, mediaApiPathMarker: FLOW_VIDEO_MEDIA_CONFIG.MEDIA_API_PATH_MARKER },
  );
  const normalizedDirectUrl = (() => {
    try {
      return directVideoSrc ? new URL(directVideoSrc, EXTERNAL_URLS.GOOGLE_LABS).href : "";
    } catch {
      return "";
    }
  })();
  return _.uniq(_.compact([normalizedDirectUrl, ...pageUrls]));
};

const downloadValidatedVideo = async (context: BrowserContext, urls: string[], expectedDurationSeconds: number): Promise<FlowDownloadedVideo> => {
  for (const mediaUrl of _.reverse(_.clone(urls))) {
    try {
      const response = await context.request.get(mediaUrl, { timeout: FLOW_VIDEO_MEDIA_CONFIG.DOWNLOAD_TIMEOUT_MS });
      if (!response.ok()) continue;
      const buffer = await response.body();
      await inspectGeneratedVideoBuffer(buffer, expectedDurationSeconds);
      const responseMimeType = _.defaultTo(response.headers()["content-type"], "");
      return { buffer, mimeType: _.startsWith(responseMimeType, "video/") ? responseMimeType : "video/mp4", mediaUrl };
    } catch (error) {}
  }
  throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR);
};

const approveFlowVideoCreditPrompt = async (page: Page, submitButton: Locator, timeoutMs: number = 15000): Promise<boolean> => {
  const approveWithoutAskingPattern = /^(?:Phê duyệt,\s*không hỏi lại|Approve,?\s*(?:do not|don't) ask again|Approve,?\s*don't show again)$/i;
  const approveOncePattern = /^(?:Phê duyệt|Approve)$/i;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const approveWithoutAsking = page.getByText(approveWithoutAskingPattern, { exact: true }).last();
    if (await approveWithoutAsking.isVisible().catch(() => false)) {
      await approveWithoutAsking.click({ force: true });
      appLog("[Google Flow] Đã phê duyệt chi phí tạo video và tắt hỏi lại.");
      await page.waitForTimeout(500);
      return true;
    }

    const approveOnce = page.getByText(approveOncePattern, { exact: true }).last();
    if (await approveOnce.isVisible().catch(() => false)) {
      await approveOnce.click({ force: true });
      appLog("[Google Flow] Đã phê duyệt chi phí tạo video.");
      await page.waitForTimeout(500);
      return true;
    }

    if (Date.now() - startedAt > 1000) {
      const generationStarted = await submitButton.evaluate((button) => button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true").catch(() => false);
      if (generationStarted) return false;
    }

    await page.waitForTimeout(250);
  }

  return false;
};

const createFlowProject = async (page: Page): Promise<string> => {
  await page.goto(EXTERNAL_URLS.GOOGLE_LABS_FLOW_HOME, { waitUntil: "domcontentloaded", timeout: 60000 });
  await dismissFlowOnboarding(page);
  let newProjectBtn = page.getByRole("button", { name: /Dự án mới|New project/i }).first();
  if (!(await newProjectBtn.isVisible().catch(() => false))) {
    const launchFlow = page.getByText(/Create with Google Flow|Tạo bằng Google Flow/i, { exact: true }).first();
    if (await launchFlow.isVisible().catch(() => false)) {
      await Promise.all([page.waitForLoadState("domcontentloaded", { timeout: 60000 }).catch(() => {}), launchFlow.click()]);
      await page.waitForTimeout(1500);
      await dismissFlowOnboarding(page);
      newProjectBtn = page.getByRole("button", { name: /Dự án mới|New project/i }).first();
    }
  }
  if (!(await newProjectBtn.isVisible().catch(() => false))) {
    await captureGeminiDomState(page, "flow-home-new-project-missing");
    await page
      .screenshot({
        path: path.join(getDataDirectory(), "flow-home-new-project-missing.png"),
        fullPage: true,
      })
      .catch(() => {});
  }
  await newProjectBtn.waitFor({ state: "visible", timeout: 30000 });
  await newProjectBtn.click();
  await page.waitForURL(/\/project\/[a-zA-Z0-9-]+/, { timeout: 30000 });
  await page.waitForLoadState("domcontentloaded", { timeout: 30000 }).catch(() => {});
  const match = page.url().match(/\/project\/([a-zA-Z0-9-]+)/);
  if (!match?.[1]) throw createAppError(ImageGenMessages.LABS_CREATE_ERR);
  return match[1];
};

const replaceUnavailableFlowProject = async (page: Page): Promise<string> => {
  appLog(FLOW_DIRECT_VIDEO_CONFIG.PROJECT_UNAVAILABLE_LOG);
  const projectId = await createFlowProject(page);
  lastPlaywrightConfigState = null;
  flowReferenceSignatureMap.delete(page);
  appLog(FLOW_DIRECT_VIDEO_CONFIG.PROJECT_REPLACED_LOG.replace("{0}", projectId));
  return projectId;
};

const configureFlowAgentSettings = async (page: Page, visualConfig?: ImageGeneratorOptions["visualConfig"]): Promise<boolean> => {
  const settingsButton = page.getByRole("button", { name: FLOW_AGENT_UI_CONFIG.SETTINGS_BUTTON }).last();
  if (!(await settingsButton.isVisible().catch(() => false))) return false;
  await settingsButton.click();
  await page.waitForTimeout(FLOW_AGENT_UI_CONFIG.CONFIG_SETTLE_MS);
  const settingsTitle = page.getByText(FLOW_AGENT_UI_CONFIG.SETTINGS_TITLE, { exact: true }).last();
  if (!(await settingsTitle.isVisible().catch(() => false))) return false;

  const neverConfirm = page.getByRole("radio", { name: FLOW_AGENT_UI_CONFIG.NEVER_CONFIRM }).first();
  if (await neverConfirm.isVisible().catch(() => false)) await neverConfirm.click();

  const isVideo = visualConfig?.generateType === GenerateType.Video;
  const targetRatio = _.defaultTo(visualConfig?.aspectRatio, AspectRatio.SixteenNine);
  const sectionTitle = page.getByText(isVideo ? FLOW_AGENT_UI_CONFIG.VIDEO_SECTION : FLOW_AGENT_UI_CONFIG.IMAGE_SECTION, { exact: true }).last();
  if (!(await sectionTitle.isVisible().catch(() => false))) return false;
  const section = sectionTitle.locator("xpath=following-sibling::*[1]");
  const tabLists = section.getByRole("tablist");
  const ratioTab = tabLists
    .first()
    .getByRole("tab", { name: new RegExp(`(?:crop_[^ ]+\\s*)?${_.escapeRegExp(targetRatio)}$`, "i") })
    .first();
  if (!(await ratioTab.isVisible().catch(() => false))) return false;
  await ratioTab.click();

  const requestedCount = isVideo ? 1 : _.clamp(_.defaultTo(visualConfig?.generateCount, 1), 1, 4);
  const countTab = tabLists
    .nth(1)
    .getByRole("tab", { name: new RegExp(`^x${requestedCount}$`, "i") })
    .first();
  if (!(await countTab.isVisible().catch(() => false))) return false;
  await countTab.click();

  let selectedModelPattern: RegExp | undefined;
  if (isVideo) {
    const engine = _.defaultTo(visualConfig?.imageGeneratorEngine, ImageGeneratorEngine.Veo3);
    const targetEngine =
      engine === ImageGeneratorEngine.Veo3Lite
        ? FLOW_AGENT_UI_CONFIG.VEO_LITE_MODEL
        : engine === ImageGeneratorEngine.Veo3Fast
          ? FLOW_AGENT_UI_CONFIG.VEO_FAST_MODEL
          : engine === ImageGeneratorEngine.Veo3Quality
            ? FLOW_AGENT_UI_CONFIG.VEO_QUALITY_MODEL
            : FLOW_AGENT_UI_CONFIG.OMNI_MODEL;
    selectedModelPattern = targetEngine;
    const modelButton = page.locator("button").filter({ hasText: FLOW_AGENT_UI_CONFIG.MODEL_PATTERN }).last();
    if (!(await modelButton.isVisible().catch(() => false))) return false;
    const currentModel = _.defaultTo(await modelButton.textContent(), "");
    if (!targetEngine.test(currentModel)) {
      await modelButton.click();
      const modelItem = page.getByRole("menuitem", { name: targetEngine }).first();
      if (!(await modelItem.isVisible().catch(() => false))) return false;
      await modelItem.click();
    }
  }

  const ratioSelected = _.isEqual(await ratioTab.getAttribute("aria-selected"), "true");
  const countSelected = _.isEqual(await countTab.getAttribute("aria-selected"), "true");
  const modelSelected =
    !isVideo ||
    Boolean(
      selectedModelPattern?.test(
        _.defaultTo(
          await section
            .locator("button")
            .filter({ hasText: FLOW_AGENT_UI_CONFIG.MODEL_PATTERN })
            .last()
            .textContent()
            .catch(() => ""),
          "",
        ),
      ),
    );
  if (!ratioSelected || !countSelected || !modelSelected) return false;
  const saveButton = page.getByRole("button", { name: FLOW_AGENT_UI_CONFIG.SAVE_BUTTON }).last();
  if (!(await saveButton.isVisible().catch(() => false))) return false;
  await saveButton.click();
  await page.waitForTimeout(FLOW_AGENT_UI_CONFIG.SAVE_SETTLE_MS);
  return !(await settingsTitle.isVisible().catch(() => false));
};

const configureFlowDirectVideoSettings = async (page: Page, visualConfig?: ImageGeneratorOptions["visualConfig"]): Promise<boolean> => {
  const agentButton = page.getByRole("button", { name: /^(?:Tác nhân|Agent)$/i }).last();
  if (_.isEqual(await agentButton.getAttribute("aria-pressed").catch(() => null), "true")) {
    await agentButton.click();
    await page.waitForTimeout(FLOW_AGENT_UI_CONFIG.CONFIG_SETTLE_MS);
  }

  const configButton = page.locator("button").filter({ hasText: FLOW_DIRECT_VIDEO_CONFIG.CONFIG_BUTTON }).last();
  if (!(await configButton.isVisible().catch(() => false))) return false;
  await configButton.click();
  const menu = page.locator(FLOW_DIRECT_VIDEO_CONFIG.SETTINGS_PANEL).last();
  await menu.waitFor({ state: "visible", timeout: FLOW_DIRECT_VIDEO_CONFIG.CONFIG_VERIFY_TIMEOUT_MS }).catch(() => undefined);
  if (!(await menu.isVisible().catch(() => false))) return false;

  if (!(await selectFlowChoice(menu, FLOW_DIRECT_VIDEO_CONFIG.VIDEO_TAB))) return false;
  if (!_.isEmpty(visualConfig?.referenceImages)) await selectFlowChoice(menu, FLOW_DIRECT_VIDEO_CONFIG.COMPONENTS_TAB);

  const targetRatio = _.includes(FLOW_AGENT_VIDEO_ASPECT_RATIOS, visualConfig?.aspectRatio as (typeof FLOW_AGENT_VIDEO_ASPECT_RATIOS)[number])
    ? visualConfig?.aspectRatio
    : AspectRatio.SixteenNine;
  const targetResolution = _.includes(FLOW_DIRECT_VIDEO_CONFIG.RESOLUTIONS, visualConfig?.videoResolution as (typeof FLOW_DIRECT_VIDEO_CONFIG.RESOLUTIONS)[number])
    ? visualConfig?.videoResolution
    : FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_RESOLUTION;
  const targetDuration = _.includes(FLOW_DIRECT_VIDEO_CONFIG.DURATIONS, visualConfig?.videoDuration as (typeof FLOW_DIRECT_VIDEO_CONFIG.DURATIONS)[number])
    ? visualConfig?.videoDuration
    : FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_DURATION;
  const targetRatioPattern = new RegExp(`^(?:crop_[^\\s]+\\s*)?${_.escapeRegExp(_.toString(targetRatio))}$`, "i");
  const targetResolutionPattern = new RegExp(`^(?:hd\\s*)?${_.escapeRegExp(_.toString(targetResolution))}(?:\\s*info)?$`, "i");
  const targetDurationPattern = createFlowDurationOptionPattern(targetDuration);
  for (const pattern of [targetRatioPattern, targetResolutionPattern, targetDurationPattern, FLOW_SINGLE_OUTPUT_PATTERN]) {
    if (!(await selectFlowChoice(menu, pattern))) return false;
    await page.waitForTimeout(FLOW_AGENT_UI_CONFIG.CONFIG_SETTLE_MS);
  }

  const engine = _.defaultTo(visualConfig?.imageGeneratorEngine, ImageGeneratorEngine.Veo3);
  const targetEngine =
    engine === ImageGeneratorEngine.Veo3Lite
      ? FLOW_AGENT_UI_CONFIG.VEO_LITE_MODEL
      : engine === ImageGeneratorEngine.Veo3Fast
        ? FLOW_AGENT_UI_CONFIG.VEO_FAST_MODEL
        : engine === ImageGeneratorEngine.Veo3Quality
          ? FLOW_AGENT_UI_CONFIG.VEO_QUALITY_MODEL
          : FLOW_AGENT_UI_CONFIG.OMNI_MODEL;
  const modelButton = menu.locator("button").filter({ hasText: FLOW_AGENT_UI_CONFIG.MODEL_PATTERN }).last();
  if (!(await modelButton.isVisible().catch(() => false))) return false;
  if (!targetEngine.test(_.defaultTo(await modelButton.textContent(), ""))) {
    await modelButton.click();
    const modelItem = page.locator('[role="menuitem"], [role="menuitemradio"], [role="option"]').filter({ hasText: targetEngine }).last();
    if (!(await modelItem.isVisible().catch(() => false))) return false;
    await modelItem.click({ force: true });
  }

  const selectedModel = targetEngine.test(
    _.defaultTo(
      await menu
        .locator("button")
        .filter({ hasText: FLOW_AGENT_UI_CONFIG.MODEL_PATTERN })
        .last()
        .textContent()
        .catch(() => ""),
      "",
    ),
  );
  if (!selectedModel) return false;
  await page.keyboard.press("Escape");
  await page.waitForTimeout(FLOW_AGENT_UI_CONFIG.CONFIG_SETTLE_MS);
  const appliedSummary = _.replace(_.defaultTo(await configButton.textContent().catch(() => ""), ""), /\s+/g, " ");
  return isFlowVideoConfigSummaryMatching(appliedSummary, visualConfig);
};

const captureGeminiDomState = (page: Page, state: string): Promise<void> =>
  captureDomDiagnostics(page, state, {
    fileName: GEMINI_DOM_DIAGNOSTICS_CONFIG.FILE_NAME,
    selector: GEMINI_DOM_DIAGNOSTICS_CONFIG.SELECTOR,
    prioritySelector: GEMINI_DOM_DIAGNOSTICS_CONFIG.PRIORITY_SELECTOR,
    maxElements: GEMINI_DOM_DIAGNOSTICS_CONFIG.MAX_ELEMENTS,
    maxClassNameLength: GEMINI_DOM_DIAGNOSTICS_CONFIG.MAX_CLASS_NAME_LENGTH,
    maxTextLength: GEMINI_DOM_DIAGNOSTICS_CONFIG.MAX_TEXT_LENGTH,
    maxHtmlLength: GEMINI_DOM_DIAGNOSTICS_CONFIG.MAX_HTML_LENGTH,
    errorMessageTemplate: GEMINI_DOM_DIAGNOSTICS_CONFIG.ERROR_MESSAGE,
    maxFileBytes: GEMINI_DOM_DIAGNOSTICS_CONFIG.MAX_FILE_BYTES,
    retainedFileBytes: GEMINI_DOM_DIAGNOSTICS_CONFIG.RETAINED_FILE_BYTES,
    detailedStatePattern: GEMINI_DOM_DIAGNOSTICS_CONFIG.DETAILED_STATE_PATTERN,
    minimalMaxElements: GEMINI_DOM_DIAGNOSTICS_CONFIG.MINIMAL_MAX_ELEMENTS,
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
    await locator.hover().catch(() => {});
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

      if (this.locked) this.queue.push(() => resolve(release));
      else {
        this.locked = true;
        resolve(release);
      }
    });
  }
}

export const imageGenMutex = new SimpleMutex();
const geminiBatchMutex = new SimpleMutex();
const grokGenerationMutex = new SimpleMutex();
const geminiRequestPacingMutex = new SimpleMutex();
let nextGeminiRequestAt = SecurityConstants.ZERO;

const sanitizeNonNegativeInteger = (value: number | undefined): number => _.defaultTo(_.max([value, SecurityConstants.ZERO]), SecurityConstants.ZERO);

const getGeminiRetryBackoff = (attempt: number): number => {
  const retryIndex = sanitizeNonNegativeInteger(_.subtract(attempt, SecurityConstants.DEFAULT_AMOUNT));
  if (!_.gt(retryIndex, SecurityConstants.ZERO)) {
    return SecurityConstants.ZERO;
  }
  return _.defaultTo(
    _.min([
      _.multiply(GEMINI_CHAT_PACING_CONFIG.RETRY_BACKOFF_BASE_MS, GEMINI_CHAT_PACING_CONFIG.BACKOFF_MULTIPLIER ** retryIndex),
      GEMINI_CHAT_PACING_CONFIG.RETRY_BACKOFF_MAX_MS,
    ]),
    SecurityConstants.ZERO,
  );
};

const getGeminiRequestWait = (attempt: number, now: number): number =>
  _.sum([
    sanitizeNonNegativeInteger(_.subtract(nextGeminiRequestAt, now)),
    getGeminiRetryBackoff(attempt),
    _.random(GEMINI_CHAT_PACING_CONFIG.JITTER_MIN_MS, GEMINI_CHAT_PACING_CONFIG.JITTER_MAX_MS),
  ]);

async function waitForGeminiRequestSlot(attempt: number): Promise<number> {
  const release = await geminiRequestPacingMutex.acquire();
  try {
    const waitMs = getGeminiRequestWait(attempt, Date.now());
    if (_.gt(waitMs, SecurityConstants.ZERO)) {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_REQUEST_PACING.replace(SecurityConstants.PLACEHOLDER_0, _.toString(waitMs)));
      await delayAsync(waitMs);
    }
    nextGeminiRequestAt = _.add(Date.now(), GEMINI_CHAT_PACING_CONFIG.MIN_REQUEST_INTERVAL_MS);
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
    videoResolution?: string;
    referenceImages?: string[];
    preserveVideoAudio?: boolean;
  };
  sandboxConfig?: {
    localProjectId?: string;
    flowProjectId?: string;
    projectId?: string;
  };
}

export interface ImageGeneratorResult {
  success: boolean;
  base64: string | null;
  fallbackUrl: string;
  warning?: string;
  newProjectId?: string;
  remoteMediaId?: string;
  remoteMediaCreated?: boolean;
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
    if (!account) throw new Error(REFACTOR_CONSTANTS.MSG_NO_ACC_AVAIL_CONFIG);
    lastUsedEmail = account.email;

    const emailHash = crypto.createHash(REFACTOR_CONSTANTS.HASH_MD5).update(account.email).digest(REFACTOR_CONSTANTS.ENCODING_HEX);
    const profilePath = path.join(getDataDirectory(), REFACTOR_CONSTANTS.DIR_GOOGLE_PROFILES, `${REFACTOR_CONSTANTS.PROFILE_PREFIX}${emailHash}`);

    try {
      try {
        context = await chromium.launchPersistentContext(profilePath, {
          headless: chromeHeadless !== false,
          channel: "chrome",
          ignoreDefaultArgs: ["--enable-automation"],
          args: [REFACTOR_CONSTANTS.ARG_NO_SANDBOX, REFACTOR_CONSTANTS.ARG_DISABLE_SETUID_SANDBOX, REFACTOR_CONSTANTS.ARG_DISABLE_AUTOMATION_CONTROLLED],
        });
      } catch (chromeErr) {
        context = await chromium.launchPersistentContext(profilePath, {
          headless: chromeHeadless !== false,
          ignoreDefaultArgs: ["--enable-automation"],
          args: [REFACTOR_CONSTANTS.ARG_NO_SANDBOX, REFACTOR_CONSTANTS.ARG_DISABLE_SETUID_SANDBOX, REFACTOR_CONSTANTS.ARG_DISABLE_AUTOMATION_CONTROLLED],
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

      return { context, page, account, ownsContext: true };
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
let activeBrowserLaunchPromise: Promise<BrowserSession> | null = null;
let activeFlowVideoGenerationCount = SecurityConstants.ZERO;

export async function closeActiveBrowser() {
  if (activeBrowserTimeout) {
    clearTimeout(activeBrowserTimeout);
    activeBrowserTimeout = null;
  }
  if (activeBrowserInstance) {
    appLog(ImageGenMessages.RELEASING_GLOBAL_CHROME);
    try {
      if (activeBrowserInstance.ownsContext === false) {
        const geminiPages = _.filter(globalBatchPages, (page) => !page.isClosed() && !_.includes(page.url(), "grok.com"));
        await Promise.allSettled(_.map(geminiPages, (page) => page.close()));
        if (!activeBrowserInstance.page.isClosed() && !_.includes(activeBrowserInstance.page.url(), "grok.com")) await activeBrowserInstance.page.close();
      } else {
        await activeBrowserInstance.context.close();
      }
    } catch (e) {}
    activeBrowserInstance = null;
  }
  activeBrowserHeadless = undefined;
}

export function scheduleGlobalBrowserCleanup() {
  if (activeBrowserTimeout) clearTimeout(activeBrowserTimeout);
  activeBrowserTimeout = setTimeout(async () => {
    if (_.gt(activeFlowVideoGenerationCount, SecurityConstants.ZERO)) {
      scheduleGlobalBrowserCleanup();
      return;
    }
    appLog(ImageGenMessages.AUTO_RELEASE_CHROME_IDLE);
    await closeActiveBrowser();
  }, FLOW_VIDEO_MEDIA_CONFIG.GLOBAL_BROWSER_IDLE_TIMEOUT_MS);
}

export async function getOrLaunchGlobalBrowser(chromeHeadless?: boolean): Promise<BrowserSession> {
  if (activeBrowserTimeout) {
    clearTimeout(activeBrowserTimeout);
    activeBrowserTimeout = null;
  }

  const requestedHeadless = chromeHeadless !== false;

  if (activeBrowserLaunchPromise) {
    const launchedBrowser = await activeBrowserLaunchPromise;
    if (activeBrowserHeadless === requestedHeadless) return launchedBrowser;
  }

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
  activeBrowserLaunchPromise = (async () => {
    const launchedBrowser = await launchBrowserForAccount(chromeHeadless);
    activeBrowserInstance = launchedBrowser;
    activeBrowserHeadless = requestedHeadless;
    try {
      launchedBrowser.context.on("close", () => {
        if (!_.isEqual(activeBrowserInstance, launchedBrowser)) return;
        appLog(ImageGenMessages.GLOBAL_CHROME_CLOSED_EXTERNAL);
        activeBrowserInstance = null;
        activeBrowserHeadless = undefined;
      });
    } catch (err) {}
    return launchedBrowser;
  })();
  try {
    return await activeBrowserLaunchPromise;
  } finally {
    activeBrowserLaunchPromise = null;
  }
}

let grokPage: Page | null = null;
let grokBrowser: Browser | null = null;
let activeGrokLocalProjectId: string | null = null;

const waitForGrokChrome = async (): Promise<void> => {
  for (let attempt = 0; attempt < REFACTOR_CONSTANTS.GROK_CDP_READY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`${REFACTOR_CONSTANTS.GROK_CDP_ENDPOINT}/json/version`);
      if (response.ok) return;
    } catch {}
    await delayAsync(REFACTOR_CONSTANTS.GROK_CDP_READY_INTERVAL_MS);
  }
  throw new Error("Không thể kết nối với cửa sổ Chrome dành cho Grok. Hãy đóng cửa sổ Grok cũ rồi thử lại.");
};

const launchNativeGrokBrowser = async (chromeHeadless?: boolean): Promise<{ context: BrowserContext; page: Page }> => {
  const account = await getNextAccount();
  if (!account) throw new Error(REFACTOR_CONSTANTS.MSG_NO_ACC_AVAIL_CONFIG);
  await closeActiveBrowser();
  const emailHash = crypto.createHash(REFACTOR_CONSTANTS.HASH_MD5).update(account.email).digest(REFACTOR_CONSTANTS.ENCODING_HEX);
  const profilePath = path.join(getDataDirectory(), REFACTOR_CONSTANTS.DIR_GOOGLE_PROFILES, `${REFACTOR_CONSTANTS.PROFILE_PREFIX}${emailHash}`);
  const chromeArgs = [
    REFACTOR_CONSTANTS.CHROME_REMOTE_DEBUGGING_ARG.replace("{0}", _.toString(REFACTOR_CONSTANTS.GROK_REMOTE_DEBUGGING_PORT)),
    REFACTOR_CONSTANTS.CHROME_USER_DATA_ARG.replace("{0}", profilePath),
    REFACTOR_CONSTANTS.CHROME_NO_FIRST_RUN_ARG,
    REFACTOR_CONSTANTS.CHROME_NO_DEFAULT_BROWSER_ARG,
    EXTERNAL_URLS.GROK_IMAGINE,
  ];
  if (chromeHeadless !== false) chromeArgs.push(REFACTOR_CONSTANTS.CHROME_HEADLESS_NEW_ARG);
  spawn(REFACTOR_CONSTANTS.WINDOWS_CHROME_PATH, chromeArgs, { windowsHide: chromeHeadless !== false, stdio: "ignore" });
  await waitForGrokChrome();
  await delayAsync(REFACTOR_CONSTANTS.GROK_CDP_READY_INTERVAL_MS * 8);
  grokBrowser = await chromium.connectOverCDP(REFACTOR_CONSTANTS.GROK_CDP_ENDPOINT);
  const context = _.first(grokBrowser.contexts());
  if (!context) throw new Error("Chrome Grok chưa tạo được phiên làm việc. Hãy thử lại.");
  grokPage = _.find(context.pages(), (candidate) => _.includes(candidate.url(), "grok.com")) || (await context.newPage());
  activeBrowserInstance = { context, page: grokPage, account, ownsContext: false };
  activeBrowserHeadless = chromeHeadless !== false;
  appLog(`[Grok Imagine] Sử dụng Chrome của tài khoản ${account.email}.`);
  return { context, page: grokPage };
};

export const getOrLaunchGrokBrowser = async (chromeHeadless?: boolean): Promise<{ context: BrowserContext; page: Page }> => {
  if (grokBrowser?.isConnected() && grokPage && !grokPage.isClosed()) {
    const duplicateGrokPages = _.filter(grokPage.context().pages(), (page) => page !== grokPage && _.includes(page.url(), "grok.com/imagine"));
    await Promise.allSettled(_.map(duplicateGrokPages, (page) => page.close()));
    return { context: grokPage.context(), page: grokPage };
  }
  grokBrowser = null;
  grokPage = null;
  try {
    grokBrowser = await chromium.connectOverCDP(REFACTOR_CONSTANTS.GROK_CDP_ENDPOINT);
    const existingContext = _.first(grokBrowser.contexts());
    const existingPage = existingContext && (_.find(existingContext.pages(), (candidate) => _.includes(candidate.url(), "grok.com")) || _.first(existingContext.pages()));
    if (existingContext && existingPage) {
      grokPage = existingPage;
      const duplicateGrokPages = _.filter(existingContext.pages(), (page) => page !== existingPage && _.includes(page.url(), "grok.com/imagine"));
      await Promise.allSettled(_.map(duplicateGrokPages, (page) => page.close()));
      return { context: existingContext, page: existingPage };
    }
  } catch {}
  return launchNativeGrokBrowser(chromeHeadless);
};

const generateMediaWithGrokImagine = async (options: ImageGeneratorOptions): Promise<ImageGeneratorResult> => {
  const generationRevision = mediaGenerationRevision;
  const release = await grokGenerationMutex.acquire();
  try {
    if (isMediaGenerationCancelled(generationRevision)) throw createAppError(GEMINI_CHAT_RECOVERY_CONFIG.CANCELLED_ERROR);
    const { context, page } = await getOrLaunchGrokBrowser(options.visualConfig?.chromeHeadless);
    await page.goto(EXTERNAL_URLS.GROK_IMAGINE, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1500);

    const loginButton = page.getByRole("button", { name: /Đăng nhập|Log in|Sign in/i }).first();
    if (await loginButton.isVisible().catch(() => false)) {
      if (options.visualConfig?.chromeHeadless === false) {
        await page.bringToFront().catch(() => {});
        await loginButton.click().catch(() => {});
      }
      throw new Error("Tài khoản Chrome hiện tại chưa đăng nhập Grok. Hãy bật Chrome Hiển thị và đăng nhập Grok một lần trong cửa sổ của tài khoản này.");
    }

    const ageGate = page.getByText(/xác nhận tuổi|confirm your age|verify your age/i).first();
    if (await ageGate.isVisible().catch(() => false)) {
      throw new Error("Grok Imagine đang chờ xác nhận tuổi trong hồ sơ Chrome của tài khoản hiện tại.");
    }

    const localProjectId = _.toString(options.sandboxConfig?.localProjectId || options.sandboxConfig?.projectId);
    if (!_.isEmpty(localProjectId) && !_.isEqual(activeGrokLocalProjectId, localProjectId)) {
      const createNew = page.getByRole("button", { name: /Tạo mới|Dự án mới|Create new|New project/i }).first();
      if (await createNew.isVisible().catch(() => false)) await createNew.click().catch(() => {});
      activeGrokLocalProjectId = localProjectId;
      await page.waitForTimeout(400);
      appLog(`[Grok Imagine] Đã gắn một room duy nhất cho dự án ${localProjectId}.`);
    }

    const isVideo = options.visualConfig?.generateType === GenerateType.Video;
    const mode = page.getByRole("radio", { name: isVideo ? /Video/i : /Hình ảnh|Image/i }).first();
    if (await mode.isVisible().catch(() => false)) await mode.click();
    await page.waitForTimeout(300);

    const targetRatio = _.defaultTo(options.visualConfig?.aspectRatio, AspectRatio.SixteenNine);
    const ratioButton = page.getByRole("button", { name: /Tỷ lệ khung hình|Aspect ratio/i }).first();
    if (await ratioButton.isVisible().catch(() => false)) {
      await ratioButton.click();
      const ratioOption = page.getByRole("menuitemradio", { name: new RegExp(_.escapeRegExp(targetRatio), "i") }).first();
      if (await ratioOption.isVisible().catch(() => false)) await ratioOption.click();
    }

    if (isVideo) {
      const requestedDuration = _.includes(REFACTOR_CONSTANTS.GROK_VIDEO_DURATIONS, options.visualConfig?.videoDuration)
        ? _.toString(options.visualConfig?.videoDuration)
        : REFACTOR_CONSTANTS.GROK_FREE_VIDEO_DURATION;
      const requestedResolution = _.includes(REFACTOR_CONSTANTS.GROK_VIDEO_RESOLUTIONS, options.visualConfig?.videoResolution)
        ? _.toString(options.visualConfig?.videoResolution)
        : REFACTOR_CONSTANTS.GROK_FREE_VIDEO_RESOLUTION;
      const durationButton = page.getByRole("radio", { name: requestedDuration, exact: true }).first();
      const resolutionButton = page.getByRole("radio", { name: requestedResolution, exact: true }).first();
      if (await resolutionButton.isVisible().catch(() => false)) await resolutionButton.click().catch(() => {});
      if (await durationButton.isVisible().catch(() => false)) await durationButton.click().catch(() => {});
      const selectedDuration = await page
        .locator('[role="radio"][aria-checked="true"], button[aria-pressed="true"]')
        .evaluateAll((nodes) => nodes.map((node) => (node.textContent || "").trim()).filter(Boolean))
        .catch(() => [] as string[]);
      if (!selectedDuration.some((label) => label.includes(requestedDuration))) {
        appLog(`[Grok Imagine] Thời lượng ${requestedDuration} không được tài khoản áp dụng; Grok sẽ dùng cấu hình khả dụng hiện tại.`);
      }
      if (!selectedDuration.some((label) => label.includes(requestedResolution))) {
        appLog(`[Grok Imagine] Độ phân giải ${requestedResolution} không được tài khoản áp dụng; Grok sẽ dùng cấu hình khả dụng hiện tại.`);
      }
      appLog(
        `[Grok Imagine] Cấu hình yêu cầu: video, ${targetRatio}, ${requestedDuration}, ${requestedResolution}, Chrome ${options.visualConfig?.chromeHeadless === false ? "hiển thị" : "chạy ngầm"}.`,
      );
    }

    await uploadProviderCharacterReferences(page, options.visualConfig?.referenceImages, "grok");

    const initialImageUrls = await page
      .locator("img")
      .evaluateAll((elements) => elements.map((element) => (element as HTMLImageElement).currentSrc || (element as HTMLImageElement).src));
    const initialVideoUrls = await page
      .locator("video")
      .evaluateAll((elements) => elements.map((element) => (element as HTMLVideoElement).currentSrc || (element as HTMLVideoElement).src));
    const editor = page.locator('[contenteditable="true"]').last();
    await editor.waitFor({ state: "visible", timeout: 30000 });
    await editor.fill(_.toString(options.prompt));
    const sendButton = page.getByRole("button", { name: /^(Gửi|Send|Submit)$/i }).last();
    if (await sendButton.isVisible().catch(() => false)) {
      await sendButton.waitFor({ state: "visible", timeout: 10000 });
      await page.waitForFunction(
        () => {
          const button = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
          return Boolean(button && !button.disabled);
        },
        undefined,
        { timeout: 10000 },
      );
      await sendButton.click();
    } else {
      await editor.press("Enter");
    }
    await page.waitForTimeout(800);
    const submittedPromptStillVisible = _.isEqual(_.trim(await editor.textContent().catch(() => "")), _.trim(_.toString(options.prompt)));
    if (submittedPromptStillVisible && (await sendButton.isEnabled().catch(() => false))) {
      await sendButton.click();
    }
    appLog(`[Grok Imagine] Đã gửi prompt tạo ${isVideo ? "video" : "ảnh"}.`);

    const mediaUrl = await page
      .waitForFunction(
        ({ video, oldImages, oldVideos }) => {
          if (video) {
            const urls = Array.from(document.querySelectorAll("video")).map((node) => (node as HTMLVideoElement).currentSrc || (node as HTMLVideoElement).src);
            return urls.find((url) => url && !oldVideos.includes(url) && /assets\.grok\.com\/.+\/generated\/.+\.mp4(?:\?|$)/i.test(url)) || null;
          }
          const urls = Array.from(document.querySelectorAll("img")).map((node) => (node as HTMLImageElement).currentSrc || (node as HTMLImageElement).src);
          return urls.find((url) => url && !oldImages.includes(url) && /imagine-public\.x\.ai\/.+\/images\/.+\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(url)) || null;
        },
        { video: isVideo, oldImages: initialImageUrls, oldVideos: initialVideoUrls },
        { timeout: isVideo ? 360000 : 180000 },
      )
      .then((handle) => handle.jsonValue() as Promise<string | null>);

    if (!mediaUrl) throw new Error("Grok Imagine không trả về URL media mới.");
    const response = await context.request.get(mediaUrl, { timeout: 120000 });
    if (!response.ok()) throw new Error(`Không tải được media Grok (${response.status()}).`);
    const buffer = await response.body();
    if (isVideo) await inspectGeneratedVideoBuffer(buffer, parseConfiguredVideoDuration(options.visualConfig?.videoDuration));
    else if (buffer.length < 10000) throw new Error("Media Grok tải về không hợp lệ.");
    const contentType = response.headers()["content-type"] || (isVideo ? "video/mp4" : "image/jpeg");
    const dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
    appLog(`[Grok Imagine] Đã tải trực tiếp ${isVideo ? "video" : "ảnh"} từ URL media (${buffer.length} bytes).`);
    return { success: true, base64: buffer.toString("base64"), fallbackUrl: dataUrl };
  } catch (error) {
    appError("[Grok Imagine] Generation failed", error);
    return { success: false, base64: null, fallbackUrl: "", warning: getErrorMessage(error) };
  } finally {
    release();
  }
};

export async function generateImageWithPlaywright(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {
  const generationRevision = mediaGenerationRevision;
  const { prompt, visualConfig, sandboxConfig = {} } = options;

  if (visualConfig?.imageGeneratorEngine === ImageGeneratorEngine.GrokImagine) return generateMediaWithGrokImagine(options);
  if (visualConfig?.generationMode === ImageGenerationMode.GeminiChat) return generateImageWithGeminiChat(options);

  const finalPrompt = _.defaultTo(prompt, "");

  const cleanProjectId = normalizeFlowProjectId(sandboxConfig.flowProjectId || sandboxConfig.projectId);

  const release = await imageGenMutex.acquire();
  const isFlowVideoGeneration = _.isEqual(visualConfig?.generateType, GenerateType.Video);
  if (isFlowVideoGeneration) activeFlowVideoGenerationCount = _.add(activeFlowVideoGenerationCount, SecurityConstants.DEFAULT_AMOUNT);

  let responseText = "";
  let lastGenerationError = BACKEND_MESSAGES.PLAYWRIGHT_DECODE_ERR;
  let remoteVideoMediaId: string | undefined;
  let success = false;
  let attempts = 0;
  const maxAttempts = SecurityConstants.DEFAULT_AMOUNT;
  let currentProjectId = cleanProjectId;

  let browserInstance: BrowserSession | null = null;
  let activePage: Page | null = null;

  try {
    while (attempts < maxAttempts && !success && !isMediaGenerationCancelled(generationRevision)) {
      attempts++;
      appLog(`${BACKEND_MESSAGES.IMAGE_RENDER_ATTEMPT}${attempts}/${maxAttempts}${BACKEND_MESSAGES.IMAGE_RENDER_STARTING}`);
      const flowResponseUrls: string[] = [];
      let flowResponseListener: ((response: any) => void) | undefined;
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
                      } catch (e) {}
                      return target;
                    };
                  }
                  if (!(window as any).__getImgId) {
                    (window as any).__getImgId = new Function("return " + getImgIdStr)();
                  }
                }
              },
              { getImgIdStr: browserGetImgIdSafeStr },
            );
          } catch (err) {
            appError(ImageGenMessages.INJECT_HELPERS_ERR, err);
          }
        }

        let isAlreadyOnFlowPage = false;
        try {
          const currentUrl = activePage.url();
          if (isFlowProjectPageUrl(currentUrl, currentProjectId)) {
            isAlreadyOnFlowPage = true;
          }
        } catch (e) {
          isAlreadyOnFlowPage = false;
        }

        if (!isAlreadyOnFlowPage) {
          if (!currentProjectId) {
            appLog(ImageGenMessages.LABS_NO_PROJECT);
            currentProjectId = await createFlowProject(activePage);
            appLog(`${ImageGenMessages.LABS_CREATED_PROJECT}${currentProjectId}`);
          } else {
            const targetUrl = `${EXTERNAL_URLS.GOOGLE_LABS_FLOW}/${currentProjectId}`;
            appLog(`${BACKEND_MESSAGES.PLAYWRIGHT_REDIRECT_LOG}${currentProjectId} (Attempt ${attempts})...`);
            await activePage.goto(targetUrl, {
              waitUntil: "commit",
              timeout: 60000,
            });
          }
        }

        if (currentProjectId && (await isFlowProjectUnavailable(activePage))) {
          currentProjectId = await replaceUnavailableFlowProject(activePage);
        }

        await dismissFlowOnboarding(activePage);

        appLog(`${BACKEND_MESSAGES.PLAYWRIGHT_INPUT_LOG}"${_.defaultTo(finalPrompt, prompt)}"`);
        let inputEl = await locateFlowPromptInput(activePage);
        if (!inputEl) {
          await captureGeminiDomState(activePage, "flow-prompt-input-missing");
          await activePage
            .screenshot({
              path: path.join(getDataDirectory(), "flow-prompt-input-missing.png"),
              fullPage: true,
            })
            .catch(() => {});
          const currentRoomUrl = currentProjectId ? `${EXTERNAL_URLS.GOOGLE_LABS_FLOW}/${currentProjectId}` : activePage.url();
          await activePage.goto(currentRoomUrl, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => undefined);
          await dismissFlowOnboarding(activePage);
          inputEl = await locateFlowPromptInput(activePage);
          if (!inputEl && currentProjectId) {
            currentProjectId = await replaceUnavailableFlowProject(activePage);
            await dismissFlowOnboarding(activePage);
            inputEl = await locateFlowPromptInput(activePage);
          }
        }
        if (!inputEl) throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_INPUT_NOT_FOUND);

        try {
          const currentConfigState = createFlowVideoConfigState(visualConfig);
          const isDirectVideo = _.isEqual(visualConfig?.generateType, GenerateType.Video);
          const currentConfigButton = activePage.locator("button").filter({ hasText: FLOW_DIRECT_VIDEO_CONFIG.CONFIG_BUTTON }).last();
          const currentConfigSummary = isDirectVideo
            ? _.defaultTo(await currentConfigButton.textContent().catch(() => ""), "")
            : "";
          const currentVideoConfigMatches = !isDirectVideo || isFlowVideoConfigSummaryMatching(currentConfigSummary, visualConfig);

          if (currentConfigState !== lastPlaywrightConfigState || attempts > 1 || !currentVideoConfigMatches) {
            appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_NEW);
            const configuredAgentUi = _.isEqual(visualConfig?.generateType, GenerateType.Video)
              ? await configureFlowDirectVideoSettings(activePage, visualConfig)
              : await configureFlowAgentSettings(activePage, visualConfig);
            if (configuredAgentUi) {
              lastPlaywrightConfigState = currentConfigState;
              appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_SUCCESS);
            }
            if (_.isEqual(visualConfig?.generateType, GenerateType.Video) && !configuredAgentUi) {
              await captureGeminiDomState(activePage, "flow-video-config-mismatch").catch(() => undefined);
              throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.CONFIG_MISMATCH_ERROR);
            }
            const configBtnLoc = activePage
              .locator('button[aria-haspopup="menu"]')
              .filter({
                hasText: /1x|x2|x3|x4|16:9|4:3|1:1|3:4|9:16|Nano|Veo|Imagen/i,
              })
              .first();

            if (!configuredAgentUi && !_.isEqual(visualConfig?.generateType, GenerateType.Video) && (await configBtnLoc.isVisible())) {
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

                const targetEngineKey = _.defaultTo(visualConfig?.imageGeneratorEngine, ImageGeneratorEngine.Veo3).toLowerCase();

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

                    let optionBtn = activePage
                      .locator('[role="menuitem"]' + ":visible")
                      .filter({ hasText: exactEngineRegex })
                      .first();
                    if (!(await optionBtn.isVisible())) {
                      optionBtn = activePage
                        .locator('[role="menuitem"]' + ":visible")
                        .filter({ hasText: fallbackEngineRegex })
                        .first();
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
          if (_.isEqual(visualConfig?.generateType, GenerateType.Video)) throw configErr;
        }

        await uploadProviderCharacterReferences(activePage, visualConfig?.referenceImages, "flow");
        inputEl = await locateFlowPromptInput(activePage, 15000);
        if (!inputEl) throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_INPUT_NOT_FOUND);

        const targetPrompt = finalPrompt || prompt;
        if (targetPrompt && targetPrompt.length > 0) {
          appLog(BACKEND_MESSAGES.PLAYWRIGHT_PASTE_LOG);

          const inputLoc = inputEl;

          await smoothMouseMove(activePage, inputLoc);
          const promptApplied = await replaceFlowPromptInput(activePage, inputLoc, targetPrompt);
          if (!promptApplied) {
            const observedPrompt = await readFlowPromptInput(inputLoc);
            appLog(
              `[Google Flow] Ô prompt chưa xác nhận nội dung sau hai phương thức nhập (expected=${normalizeFlowPromptValue(targetPrompt).length}, observed=${normalizeFlowPromptValue(observedPrompt).length}).`,
            );
            await captureGeminiDomState(activePage, "flow-prompt-not-applied").catch(() => undefined);
            throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.PROMPT_NOT_READY_ERROR);
          }
          await activePage.waitForTimeout(FLOW_AGENT_UI_CONFIG.CONFIG_SETTLE_MS);
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
        const oldVideoSources = await activePage.evaluate(() =>
          Array.from(document.querySelectorAll("video"))
            .map((video) => video.currentSrc || video.src)
            .filter(Boolean),
        );
        const oldVideoEditIds = _.isEqual(visualConfig?.generateType, GenerateType.Video) ? await getFlowVideoEditIds(activePage) : [];
        if (_.isEqual(visualConfig?.generateType, GenerateType.Video)) {
          flowResponseListener = (response: any) => {
            const responseUrl = _.toString(response.url());
            if (/video|media|download|googleusercontent|storage/i.test(responseUrl)) flowResponseUrls.push(responseUrl);
          };
          activePage.on("response", flowResponseListener);
        }

        const namedSubmitButton = activePage.getByRole("button", { name: PLAYWRIGHT_SUBMIT_TEXT_REGEX }).last();
        const iconSubmitButton = activePage
          .locator("button")
          .filter({ has: activePage.locator("i, mat-icon").filter({ hasText: PLAYWRIGHT_SUBMIT_ICON_REGEX }) })
          .last();
        const submitBtnLocator = (await namedSubmitButton.isVisible().catch(() => false)) ? namedSubmitButton : iconSubmitButton;
        let isBtnDisabled = true;
        const submitReadyDeadline = Date.now() + FLOW_DIRECT_VIDEO_CONFIG.CONFIG_VERIFY_TIMEOUT_MS;
        while (Date.now() < submitReadyDeadline) {
          try {
            isBtnDisabled = await submitBtnLocator.evaluate((btn) => !btn || btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true");
          } catch (e) {
            isBtnDisabled = true;
          }
          if (!isBtnDisabled) break;
          await delayAsync(500);
        }
        if (isBtnDisabled) {
          await captureGeminiDomState(activePage, "flow-submit-disabled-after-prompt").catch(() => undefined);
          throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.PROMPT_NOT_READY_ERROR);
        }

        appLog(BACKEND_MESSAGES.PLAYWRIGHT_SUBMIT_LOG);
        await submitBtnLocator.waitFor({ state: "visible", timeout: 5000 });
        await submitBtnLocator.scrollIntoViewIfNeeded();

        await smoothMouseMove(activePage, submitBtnLocator);
        await randomDelay(400, 800);
        await submitBtnLocator.click();

        if (visualConfig?.generateType === GenerateType.Video) await approveFlowVideoCreditPrompt(activePage, submitBtnLocator);

        appLog(BACKEND_MESSAGES.PLAYWRIGHT_WAITING_GEN);
        let finalBase64: string;
        if (visualConfig?.generateType === GenerateType.Video) {
          const mediaHandle = await activePage.waitForFunction(
            ([oldEditIds, oldVideoSourcesList]) => {
              const generatedEditId = Array.from(document.querySelectorAll('a[href*="/edit/"]'))
                .filter((link) => {
                  const container = link.closest("button") || link.parentElement;
                  const text = container?.textContent || "";
                  return /play_circle|360p|720p/i.test(text) || Boolean(link.querySelector('img[alt*="video" i], img[alt*="Hình thu nhỏ video" i]'));
                })
                .map((link) => link.getAttribute("href")?.split("/edit/").pop() || "")
                .find((editId) => editId && !oldEditIds.includes(editId));
              const generatedVideo = Array.from(document.querySelectorAll("video"))
                .map((video) => ({ video, src: video.currentSrc || video.src }))
                .find(({ video, src }) => src && !oldVideoSourcesList.includes(src) && video.readyState >= 1);
              if (generatedEditId) return { editId: generatedEditId, videoSrc: null };
              return generatedVideo ? { editId: null, videoSrc: generatedVideo.src } : null;
            },
            [oldVideoEditIds, oldVideoSources] as const,
            { timeout: 300000 },
          );
          const generatedMedia = (await mediaHandle.jsonValue()) as { editId?: string | null; videoSrc?: string | null } | null;
          if (!generatedMedia) throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_DECODE_ERR);

          let downloadedVideoFromCard: FlowDownloadedVideo | null = null;
          if (generatedMedia.editId) {
            remoteVideoMediaId = generatedMedia.editId;
            downloadedVideoFromCard = await downloadFlowVideoFromEdit(
              activePage,
              currentProjectId,
              generatedMedia.editId,
              parseConfiguredVideoDuration(visualConfig?.videoDuration),
            );
          } else {
            const expectedDurationSeconds = parseConfiguredVideoDuration(visualConfig?.videoDuration);
            await activePage.waitForFunction(
              ({ directVideoSrc, previousVideoSources, expectedDuration }) => {
                const video =
                  Array.from(document.querySelectorAll("video")).find((item) => (item.currentSrc || item.src) === directVideoSrc) ||
                  Array.from(document.querySelectorAll("video")).find((item) => !previousVideoSources.includes(item.currentSrc || item.src));
                return Boolean(video && video.readyState >= HTMLMediaElement.HAVE_METADATA && video.duration >= Math.max(0.1, expectedDuration * 0.7));
              },
              { directVideoSrc: generatedMedia.videoSrc || null, previousVideoSources: oldVideoSources, expectedDuration: expectedDurationSeconds },
              { timeout: FLOW_VIDEO_MEDIA_CONFIG.GENERATION_TIMEOUT_MS },
            );
          }
          if (!browserInstance) throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_DECODE_ERR);
          const videoUrls = _.uniq(_.concat(await collectFlowVideoUrls(activePage, generatedMedia.editId, generatedMedia.videoSrc), flowResponseUrls));
          const downloadedVideo =
            downloadedVideoFromCard || (await downloadValidatedVideo(browserInstance.context, videoUrls, parseConfiguredVideoDuration(visualConfig?.videoDuration)));
          remoteVideoMediaId = extractFlowMediaIdFromUrl(downloadedVideo.mediaUrl) || generatedMedia.editId || undefined;
          finalBase64 = `data:${downloadedVideo.mimeType};base64,${downloadedVideo.buffer.toString("base64")}`;
        } else {
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
                } catch (e) {}

                if (!newImg.complete || newImg.naturalWidth === 0) return null;

                const canvas = document.createElement("canvas");
                canvas.width = newImg.naturalWidth;
                canvas.height = newImg.naturalHeight;
                canvas.getContext("2d")?.drawImage(newImg, 0, 0);
                try {
                  const dataUrl = canvas.toDataURL(jpegMimeType, 0.9);
                  if (dataUrl.length > 1000) return dataUrl;
                } catch (e) {}
              }
              return null;
            },
            [oldIds, browserGetImgIdSafeStr, CONTENT_TYPES.JPEG] as const,
            { timeout: 150000 },
          );
          finalBase64 = await base64Data.jsonValue();
        }
        appLog(BACKEND_MESSAGES.PLAYWRIGHT_BASE64_SUCCESS);

        responseText = jsonUtils.safeStringify({ directBase64: finalBase64 });
        success = true;
      } catch (error: unknown) {
        lastGenerationError = getErrorMessage(error);
        appError(ImageGenMessages.IMAGE_RENDER_ERR.replace("{0}", attempts.toString()).replace("{1}", getErrorMessage(error)));

        if (attempts >= maxAttempts) throw error;

        const browserSessionUnavailable = !browserInstance || !activePage || activePage.isClosed() || browserInstance.context.pages().length === 0;
        if (browserSessionUnavailable) {
          await closeActiveBrowser();
          browserInstance = null;
          activePage = null;
        } else {
          await activePage.reload({ waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => undefined);
        }
      } finally {
        if (activePage && flowResponseListener) activePage.off("response", flowResponseListener);
      }
    }
  } catch (error: unknown) {
    lastGenerationError = getErrorMessage(error);
    appError(`${ImageGenMessages.IMAGE_RENDER_GLOBAL_ERR}${getErrorMessage(error)}`);
  } finally {
    if (isFlowVideoGeneration) activeFlowVideoGenerationCount = _.max([SecurityConstants.ZERO, _.subtract(activeFlowVideoGenerationCount, SecurityConstants.DEFAULT_AMOUNT)])!;
    if (browserInstance) {
      if (options.retainBrowserSession) scheduleGlobalBrowserCleanup();
      else {
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

      return { success: true, base64: cleanBase64, fallbackUrl: parsed.directBase64, newProjectId: currentProjectId !== cleanProjectId ? currentProjectId : undefined };
    }
  } catch (e) {}

  return {
    success: false,
    base64: null,
    fallbackUrl: SecurityConstants.EMPTY_STRING,
    warning: remoteVideoMediaId ? FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR : lastGenerationError,
    newProjectId: currentProjectId !== cleanProjectId ? currentProjectId : undefined,
    remoteMediaId: remoteVideoMediaId,
    remoteMediaCreated: !_.isEmpty(remoteVideoMediaId),
  };
}

const isCaptchaOrChallengeActive = async (page: Page): Promise<boolean> => {
  if (page.isClosed()) return false;
  const currentUrl = page.url();
  const isChallengeUrl = _.some(
    [GEMINI_CHAT_RECOVERY_CONFIG.CHALLENGE_URL_KEYWORD, GEMINI_CHAT_RECOVERY_CONFIG.SORRY_URL_KEYWORD, GEMINI_CHAT_RECOVERY_CONFIG.ACCOUNTS_URL_KEYWORD],
    (kw) => _.includes(currentUrl, kw),
  );
  if (isChallengeUrl) return true;
  try {
    const hasChallengeFrame = (await page.locator('iframe[src*="recaptcha"], iframe[src*="challenge"], iframe[src*="arkose"], #captcha, div[class*="captcha"]').count()) > 0;
    if (hasChallengeFrame) return true;
    const bodyText = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "");
    return (
      _.includes(bodyText, "xác minh bạn là người") || _.includes(bodyText, "verify you are human") || _.includes(bodyText, "unusual traffic") || _.includes(bodyText, "recaptcha")
    );
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
  const generationRevision = mediaGenerationRevision;
  const { prompt, visualConfig } = options;

  const finalPrompt = prompt || "";

  const release = await geminiBatchMutex.acquire();
  await randomDelay(1000, 4000);
  let success = false;
  let base64Result: string | null = null;
  let roomAttempts = SecurityConstants.ZERO;
  const maxRoomAttempts = _.isEqual(visualConfig.generateType, GenerateType.Video) ? 2 : GEMINI_CHAT_RECOVERY_CONFIG.MAX_ROOMS_PER_ITEM;
  let browserInstance: BrowserSession | null = null;
  let activePage: Page | null = null;

  try {
    while (roomAttempts < maxRoomAttempts && !success && !isMediaGenerationCancelled(generationRevision)) {
      roomAttempts++;

      let detectedRatio = visualConfig?.aspectRatio;
      if (!detectedRatio && finalPrompt) {
        if (_.includes(finalPrompt, "16:9") || _.includes(finalPrompt.toLowerCase(), "horizontal")) {
          detectedRatio = "16:9";
        } else if (_.includes(finalPrompt, "9:16") || _.includes(finalPrompt.toLowerCase(), "vertical")) {
          detectedRatio = "9:16";
        }
      }
      if (!detectedRatio) detectedRatio = "9:16";

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
          if (_.includes(activePage.url(), "grok.com")) {
            activePage = await browserInstance.context.newPage();
            activeBrowserInstance = { ...browserInstance, page: activePage };
          }
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
          await randomDelay(GEMINI_BATCH_SETUP_CONFIG.DELAY_MIN_MS, GEMINI_BATCH_SETUP_CONFIG.DELAY_MAX_MS);
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
        if (roomAttempts >= maxRoomAttempts) throw error;
        continue;
      }

      let reloadAttempts = SecurityConstants.ZERO;
      const maxReloadAttempts = _.isEqual(visualConfig.generateType, GenerateType.Video) ? 1 : 2;

      while (reloadAttempts < maxReloadAttempts && !success) {
        reloadAttempts++;

        if (_.gt(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT)) {
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_RELOAD.replace("{0}", _.toString(_.subtract(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT))));
          try {
            await activePage!.reload({
              waitUntil: GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_WAIT_UNTIL,
              timeout: GEMINI_BATCH_SETUP_CONFIG.NAVIGATION_TIMEOUT_MS,
            });
            await randomDelay(GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_DELAY_MIN_MS, GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_DELAY_MAX_MS);
          } catch (reloadError) {
            consecutiveGeminiErrors++;
            appError(BACKEND_MESSAGES.GEMINI_CHAT_RELOAD_FAILED.replace("{0}", getErrorMessage(reloadError)));
            continue;
          }
        }

        try {
          await waitForGeminiPageIdle(activePage!, visualConfig);
          const isPageReady = await waitForGeminiReadyOrCaptchaSolved(activePage!);
          if (!isPageReady) throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_PICKER_NOT_FOUND);

          const forceSetting = needNewRoom || isConfigChanged || _.gt(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT);

          const modelConfigured = await configureGeminiModel(activePage!, visualConfig);
          if (!modelConfigured) throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_PICKER_NOT_FOUND);

          const generateTypeConfigured = await configureGeminiGenerateType(activePage!, visualConfig);
          if (!generateTypeConfigured) {
            throw new Error(
              BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_NOT_FOUND.replace(
                "{0}",
                _.isEqual(visualConfig.generateType, GenerateType.Video) ? GeminiChatTextOption.CreateVideoVi : GeminiChatTextOption.CreateImageVi,
              ),
            );
          }
          await configureGeminiMediaInput(activePage!, visualConfig);

          if (forceSetting) lastGeminiConfigState = currentConfigState;

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
          if (base64Result) {
            success = true;
            consecutiveGeminiErrors = 0;
          }
          const isAspectRatioMismatch =
            base64Result && !_.isEqual(visualConfig.generateType, GenerateType.Video) && !isImageAspectRatioCompatible(base64Result, visualConfig.aspectRatio);
          if (isAspectRatioMismatch) {
            appLog(`[GeminiChat] ${BACKEND_MESSAGES.ASPECT_RATIO_DIFFERENCE_LOG.replace("{0}", visualConfig.aspectRatio || "16:9")}`);
          }
          if (!base64Result) throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERR_THROW);
        } catch (error: unknown) {
          consecutiveGeminiErrors++;
          appError(
            BACKEND_MESSAGES.GEMINI_CHAT_ATTEMPT_FAILED.replace("{0}", reloadAttempts.toString()).replace("{1}", roomAttempts.toString()).replace("{2}", getErrorMessage(error)),
          );
        }
      }
    }
  } catch (error: unknown) {
    appError(BACKEND_MESSAGES.GEMINI_CHAT_FAILED_COMPLETELY.replace("{0}", getErrorMessage(error)));
  } finally {
    if (browserInstance) {
      if (options.retainBrowserSession) scheduleGlobalBrowserCleanup();
      else {
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

  return { success: false, base64: null, fallbackUrl: SecurityConstants.EMPTY_STRING, warning: BACKEND_MESSAGES.GEMINI_CHAT_FALLBACK_WARNING };
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

const resolveBatchAssetType = (item: BatchImageItem): GenerateType.Image | GenerateType.Video =>
  _.isEqual(item.generateType, GenerateType.Video) ? GenerateType.Video : GenerateType.Image;

const getBatchItemVisualConfig = (item: BatchImageItem, visualConfig: GeminiVisualConfig): GeminiVisualConfig & { generateType: GenerateType.Image | GenerateType.Video } => {
  const isThumbnail = _.some(["th_", "thumb_", "thumbnail_"], (prefix) => _.startsWith(_.toString(item.sceneId), prefix));

  let targetReferences: any[] = [];
  if (isThumbnail)
    targetReferences = !_.isEmpty(item?.referenceImages)
      ? (item.referenceImages as any[])
      : !_.isEmpty(visualConfig?.thumbnailReferenceImages)
        ? (visualConfig.thumbnailReferenceImages as any[])
        : !_.isEmpty(visualConfig?.thumbnailSceneReferenceImages)
          ? (visualConfig.thumbnailSceneReferenceImages as any[])
          : !_.isEmpty(visualConfig?.styleReferenceImages)
            ? (visualConfig.styleReferenceImages as any[])
            : [];
  else {
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
    imageGeneratorEngine: visualConfig.imageGeneratorEngine,
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
    } catch (e) {}
  }
  globalBatchPages = [];
}

export async function cancelAllActiveMediaGeneration(): Promise<void> {
  mediaGenerationRevision = _.add(mediaGenerationRevision, SecurityConstants.DEFAULT_AMOUNT);
  if (activeBrowserTimeout) {
    clearTimeout(activeBrowserTimeout);
    activeBrowserTimeout = null;
  }
  const pages = _.uniq(_.compact([...globalBatchPages, activeBrowserInstance?.page, grokPage]));
  await Promise.allSettled(
    _.map(pages, async (page) => {
      if (!page.isClosed()) await page.close();
    }),
  );
  if (activeBrowserInstance?.ownsContext !== false) {
    await activeBrowserInstance?.context.close().catch(() => undefined);
  }
  globalBatchPages = [];
  activeBrowserInstance = null;
  activeBrowserHeadless = undefined;
  grokPage = null;
  grokBrowser = null;
  activeGrokLocalProjectId = null;
}

async function applyBatchDelay(visualConfig: GeminiVisualConfig): Promise<number> {
  const ms = getBatchDelayMs(visualConfig?.batchDelay);
  await delayAsync(ms);
  return ms;
}

const createGeminiBatchPage = async (context: BrowserContext): Promise<Page> => context.newPage();

const createPreparedGeminiBatchPage = async (context: BrowserContext, tabIndex: number): Promise<Page> => {
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
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_PREPARE_NEW_ROOM.replace(SecurityConstants.PLACEHOLDER_0, _.toString(tabNumber)));
    await page.goto(EXTERNAL_URLS.GEMINI_CHAT, {
      waitUntil: GEMINI_BATCH_SETUP_CONFIG.WAIT_UNTIL,
      timeout: GEMINI_BATCH_SETUP_CONFIG.NAVIGATION_TIMEOUT_MS,
    });
    await randomDelay(GEMINI_BATCH_SETUP_CONFIG.DELAY_MIN_MS, GEMINI_BATCH_SETUP_CONFIG.DELAY_MAX_MS);
    roomReferenceUploadedMap.set(page, false);
    batchPagesErrors.set(page, SecurityConstants.ZERO);
  } catch (error: any) {
    appError(
      BACKEND_MESSAGES.GEMINI_CHAT_BATCH_PREPARE_NEW_ROOM_ERR.replace(SecurityConstants.PLACEHOLDER_0, _.toString(tabNumber)).replace(
        SecurityConstants.PLACEHOLDER_1,
        error.message,
      ),
    );
    throw error;
  }
};

export async function generateBatchImagesWithGeminiChat(
  items: BatchImageItem[],
  visualConfig: GeminiVisualConfig,
  style?: string,
  onProgress?: (result: BatchImageResult) => void,
  retainBrowserSession = false,
): Promise<BatchImageResult[]> {
  const generationRevision = mediaGenerationRevision;
  if (!items || items.length === 0) return [];

  const speed = visualConfig?.geminiChatSpeed || GeminiChatSpeed.Fast;
  const concurrency = GEMINI_CHAT_SPEED_TAB_COUNT[speed] || 5;
  const maxTabs = resolveBatchTabCount(items.length, concurrency, visualConfig?.batchTabCount);

  if (maxTabs === 1 && !retainBrowserSession) {
    const results: BatchImageResult[] = [];
    try {
      for (let i = 0; i < items.length; i++) {
        if (isMediaGenerationCancelled(generationRevision)) break;
        const item = items[i];
        const itemVisualConfig = getBatchItemVisualConfig(item, visualConfig);
        const result = await generateImageWithGeminiChat({
          prompt: item.prompt,
          style,
          retainBrowserSession: true,
          visualConfig: itemVisualConfig,
        });
        const batchRes = { sceneId: item.sceneId, ...result, assetType: itemVisualConfig.generateType };
        results.push(batchRes);
        if (onProgress) onProgress(batchRes);
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

  const release = await geminiBatchMutex.acquire();
  const results: BatchImageResult[] = [];
  let browserInstance: BrowserSession | null = null;
  let batchWorkerPages: Page[] = [];

  try {
    if (isMediaGenerationCancelled(generationRevision)) return results;
    browserInstance = await getOrLaunchGlobalBrowser(visualConfig?.chromeHeadless);
    const context = browserInstance.context;

    const reusablePages = _.uniq(
      _.filter(
        _.concat(globalBatchPages, context.pages()),
        (page) =>
          (!retainBrowserSession || page !== browserInstance!.page) &&
          !page.isClosed() &&
          !_.includes(page.url(), "grok.com") &&
          (_.isEqual(page.url(), "about:blank") || _.includes(page.url(), "gemini.google.com")),
      ),
    );
    const candidates = _.take(reusablePages, maxTabs);
    const surplusPages = _.drop(reusablePages, maxTabs);
    await Promise.allSettled(_.map(surplusPages, (page) => page.close()));
    while (_.lt(_.size(candidates), maxTabs)) candidates.push(await createGeminiBatchPage(context));

    const prepareExistingTab = async (page: Page, index: number): Promise<Page | null> => {
      for (let attempt = SecurityConstants.ZERO; attempt < GEMINI_CHAT_RECOVERY_CONFIG.MAX_ATTEMPTS_PER_ROOM; attempt++) {
        try {
          await prepareGeminiBatchPage(page, index);
          return page;
        } catch (error) {
          appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_INIT_ERROR.replace("{0}", getErrorMessage(error)));
        }
      }
      await page.close().catch(() => {});
      return null;
    };
    const preparedPages = await Promise.all(_.map(candidates, prepareExistingTab));
    const readyPages = _.compact(preparedPages);
    if (_.isEmpty(readyPages)) throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_INIT_ERROR.replace("{0}", BACKEND_MESSAGES.UNKNOWN_ERROR));
    globalBatchPages = readyPages;
    const activePages = readyPages.slice(0, maxTabs);
    batchWorkerPages = activePages;

    const generateOnTab = async (page: Page, item: BatchImageItem, tabIndex: number): Promise<BatchImageResult> => {
      const itemVisualConfig = getBatchItemVisualConfig(item, visualConfig);
      const hasRefs = !_.isEmpty(itemVisualConfig.referenceImages) || !_.isEmpty(itemVisualConfig.sceneReferenceImages) || !_.isEmpty(itemVisualConfig.styleReferenceImages);
      const finalPrompt = removeConflictingStyleTerms(item.prompt || "", hasRefs);

      let success = false;
      let base64Result: string | null = null;
      let roomAttempts = SecurityConstants.ZERO;
      const maxRoomAttempts = _.isEqual(itemVisualConfig.generateType, GenerateType.Video) ? 2 : GEMINI_CHAT_RECOVERY_CONFIG.MAX_ROOMS_PER_ITEM;

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
              await randomDelay(GEMINI_BATCH_SETUP_CONFIG.DELAY_MIN_MS, GEMINI_BATCH_SETUP_CONFIG.DELAY_MAX_MS);
              roomReferenceUploadedMap.set(page, false);
              batchPagesErrors.set(page, 0);
            } catch (err: any) {
              appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_REDIRECT_FAILED.replace("{0}", (tabIndex + 1).toString()).replace("{1}", err.message));
              if (roomAttempts >= maxRoomAttempts) throw err;
              continue;
            }
          } else {
            appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_ROOM_REUSE.replace("{0}", (tabIndex + 1).toString()));
          }

          let reloadAttempts = SecurityConstants.ZERO;
          const maxReloadAttempts = _.isEqual(itemVisualConfig.generateType, GenerateType.Video) ? 1 : 2;

          while (reloadAttempts < maxReloadAttempts && !success) {
            reloadAttempts++;

            if (_.gt(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT)) {
              appLog(
                BACKEND_MESSAGES.GEMINI_CHAT_BATCH_RELOAD_ATTEMPT.replace("{0}", _.toString(_.add(tabIndex, SecurityConstants.DEFAULT_AMOUNT))).replace(
                  "{1}",
                  _.toString(_.subtract(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT)),
                ),
              );
              try {
                await page.reload({
                  waitUntil: GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_WAIT_UNTIL,
                  timeout: GEMINI_BATCH_SETUP_CONFIG.NAVIGATION_TIMEOUT_MS,
                });
                await randomDelay(GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_DELAY_MIN_MS, GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_DELAY_MAX_MS);
              } catch (reloadError) {
                batchPagesErrors.set(page, _.add(batchPagesErrors.get(page) || SecurityConstants.ZERO, SecurityConstants.DEFAULT_AMOUNT));
                appError(
                  BACKEND_MESSAGES.GEMINI_CHAT_BATCH_RELOAD_FAILED.replace("{0}", _.toString(_.add(tabIndex, SecurityConstants.DEFAULT_AMOUNT))).replace(
                    "{1}",
                    getErrorMessage(reloadError),
                  ),
                );
                continue;
              }
            }

            try {
              appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace("{0}", (tabIndex + 1).toString()).replace("{1}", item.sceneId));

              await waitForGeminiPageIdle(page, itemVisualConfig);
              const isPageReady = await waitForGeminiReadyOrCaptchaSolved(page, tabIndex);
              if (!isPageReady) throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_PICKER_NOT_FOUND);

              const currentConfigState = jsonUtils.safeStringify({
                generateType: itemVisualConfig.generateType,
                imageGeneratorEngine: itemVisualConfig.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
              });

              const lastConfig = batchPagesConfigs.get(page);
              const isConfigChanged = currentConfigState !== lastConfig;
              const forceSetting = needNewRoom || isConfigChanged || _.gt(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT);

              await configureGeminiModel(page, itemVisualConfig).catch(() => false);
              const generateTypeConfigured = await configureGeminiGenerateType(page, itemVisualConfig);
              if (!generateTypeConfigured) {
                throw new Error(
                  BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_NOT_FOUND.replace(
                    "{0}",
                    _.isEqual(itemVisualConfig.generateType, GenerateType.Video) ? GeminiChatTextOption.CreateVideoVi : GeminiChatTextOption.CreateImageVi,
                  ),
                );
              }
              await configureGeminiMediaInput(page, itemVisualConfig);

              if (forceSetting) batchPagesConfigs.set(page, currentConfigState);

              await enterGeminiPrompt(page, finalPrompt, itemVisualConfig);

              const initialResponseCount = await page.locator(GeminiChatSelector.Response).count();
              await waitForGeminiRequestSlot(reloadAttempts);
              const sendBtn = page.locator(GeminiChatSelector.SendButton).first();
              let clicked = false;
              try {
                if ((await sendBtn.isVisible()) && !(await sendBtn.isDisabled())) {
                  await sendBtn.click();
                  clicked = true;
                  appLog(
                    BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace("{0}", (tabIndex + 1).toString()).replace(
                      "{1}",
                      `${item.sceneId} - ${BACKEND_MESSAGES.GEMINI_CHAT_CLICKED_SEND}`,
                    ),
                  );
                }
              } catch (e: any) {
                appError(
                  BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace("{0}", (tabIndex + 1).toString()).replace(
                    "{1}",
                    `${item.sceneId} - ${BACKEND_MESSAGES.GEMINI_CHAT_CLICK_SEND_FAILED.replace("{0}", e.message)}`,
                  ),
                );
              }

              if (!clicked) {
                await page.keyboard.press("Enter");
                appLog(
                  BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace("{0}", (tabIndex + 1).toString()).replace(
                    "{1}",
                    `${item.sceneId} - ${BACKEND_MESSAGES.GEMINI_CHAT_PRESSED_ENTER}`,
                  ),
                );
              }
              base64Result = await waitForDownloadAndGetBase64(page, itemVisualConfig, initialResponseCount);
              if (base64Result) {
                success = true;
                batchPagesErrors.set(page, 0);
              }
              const isBatchAspectRatioMismatch =
                base64Result && !_.isEqual(itemVisualConfig.generateType, GenerateType.Video) && !isImageAspectRatioCompatible(base64Result, itemVisualConfig.aspectRatio);
              if (isBatchAspectRatioMismatch) {
                appLog(`[GeminiChat Batch] Scene ${item.sceneId}: ${BACKEND_MESSAGES.ASPECT_RATIO_DIFFERENCE_LOG.replace("{0}", itemVisualConfig.aspectRatio || "16:9")}`);
              }
              if (!base64Result) throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERR_THROW);
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

    const workerQueues = distributeItemsByContinuity(items, activePages.length);

    const createReplacementWorkerPage = async (tabIndex: number): Promise<Page | null> => {
      for (let attempt = SecurityConstants.ZERO; attempt < GEMINI_BATCH_SETUP_CONFIG.WORKER_REPLACEMENT_MAX_ATTEMPTS; attempt++) {
        try {
          return await createPreparedGeminiBatchPage(context, tabIndex);
        } catch (error) {
          appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_INIT_ERROR.replace("{0}", getErrorMessage(error)));
        }
      }
      return null;
    };

    const runWorker = async (page: Page, tabIndex: number, workerQueue: BatchImageItem[]) => {
      let workerPage = page;
      while (workerQueue.length > 0 && !isMediaGenerationCancelled(generationRevision)) {
        const item = workerQueue.shift();
        if (!item) break;
        let itemSucceeded = false;

        try {
          const res = await generateOnTab(workerPage, item, tabIndex);
          itemSucceeded = res.success;
          results.push(res);
          if (onProgress) onProgress(res);
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
          if (onProgress) onProgress(res);
        }

        if (!itemSucceeded) {
          if (!workerPage.isClosed()) {
            continue;
          }
          const failedPage = workerPage;
          globalBatchPages = _.without(globalBatchPages, failedPage);
          if (_.isEmpty(workerQueue)) return;
          const replacementPage = await createReplacementWorkerPage(tabIndex);
          if (!replacementPage) return;
          workerPage = replacementPage;
          globalBatchPages.push(replacementPage);
          continue;
        }

        if (workerQueue.length > 0) {
          const delayTime = await applyBatchDelay(visualConfig);
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_NEXT_DELAY.replace("{0}", (tabIndex + 1).toString()).replace("{1}", delayTime.toString()));
        }
      }
    };

    const workers = _.map(activePages, (page, index) => runWorker(page, index, workerQueues[index] || []));
    await Promise.all(workers);

    _.forEach(
      _.filter(items, (item) => !_.some(results, { sceneId: item.sceneId })),
      (item) => {
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
      },
    );

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
        if (onProgress) onProgress(res);
      }
    });
  } finally {
    if (browserInstance) {
      if (retainBrowserSession) {
        await Promise.allSettled(_.map(batchWorkerPages, (page) => (page.isClosed() ? Promise.resolve() : page.close())));
        globalBatchPages = _.filter(globalBatchPages, (page) => !page.isClosed());
        scheduleGlobalBrowserCleanup();
      } else if (browserInstance.ownsContext === false) {
        await Promise.allSettled(_.map(batchWorkerPages, (page) => (page.isClosed() ? Promise.resolve() : page.close())));
        globalBatchPages = _.filter(globalBatchPages, (page) => !page.isClosed());
        if (!browserInstance.page.isClosed() && !_.includes(browserInstance.page.url(), "grok.com")) await browserInstance.page.close().catch(() => {});
        activeBrowserInstance = null;
        activeBrowserHeadless = undefined;
      } else {
        await browserInstance.context.close().catch(() => {});
      }
    }
    release();
  }

  return results;
}

const openGeminiModelMenu = async (page: Page, picker: Locator): Promise<Locator | null> => {
  const menu = page.locator(GeminiChatSelector.ModelMenu).first();
  if (!(await menu.isVisible().catch(() => false))) await picker.click();
  const visible = await menu
    .waitFor({
      state: "visible",
      timeout: GEMINI_MODEL_SELECTION_CONFIG.MENU_TIMEOUT_MS,
    })
    .then(() => true)
    .catch(() => false);
  return visible ? menu : null;
};

const closeGeminiModelMenu = async (picker: Locator, menu: Locator): Promise<void> => {
  if (!(await menu.isVisible().catch(() => false))) return;
  await picker.click().catch(() => undefined);
  await menu
    .waitFor({
      state: "hidden",
      timeout: GEMINI_MODEL_SELECTION_CONFIG.MENU_TIMEOUT_MS,
    })
    .catch(() => undefined);
};

const isGeminiModelOptionSelected = (option: Locator): Promise<boolean> =>
  option
    .evaluate(
      (element, selectedClass) => element.classList.contains(selectedClass) || Boolean(element.querySelector(`.${selectedClass}`)),
      GEMINI_MODEL_SELECTION_CONFIG.SELECTED_CLASS,
    )
    .catch(() => false);

const waitForGeminiModelOptionSelected = async (option: Locator): Promise<boolean> => {
  const maximumAttempts = Math.ceil(GEMINI_MODEL_SELECTION_CONFIG.OPTION_TIMEOUT_MS / GEMINI_MODEL_SELECTION_CONFIG.SELECTION_POLL_MS);
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
    const label = _.trim(
      await option
        .locator(GeminiChatSelector.ModelLabel)
        .textContent()
        .catch(() => ""),
    );
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
      return _.trim(
        await option
          .locator(GeminiChatSelector.ModelLabel)
          .textContent()
          .catch(() => ""),
      );
    }
  }
  return REFACTOR_CONSTANTS.VD_EMPTY_STRING;
};

async function configureGeminiModel(page: Page, visualConfig: GeminiVisualConfig): Promise<boolean> {
  const engine = visualConfig?.imageGeneratorEngine || ImageGeneratorEngine.Veo3;
  let targetModelText = GeminiChatModelName.Pro;
  let targetModelRegex = GEMINI_MODEL_PRO_REGEX;
  let fallbackModelRegex: RegExp | null = null;
  if (_.includes([ImageGeneratorEngine.LabsSandbox, ImageGeneratorEngine.Veo3Lite], engine)) {
    targetModelText = GeminiChatModelName.FlashLite;
    targetModelRegex = GEMINI_MODEL_FLASH_LITE_REGEX;
  } else if (_.includes([ImageGeneratorEngine.Veo3, ImageGeneratorEngine.Veo3Fast], engine)) {
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
    const isSelected = Boolean(selectedOption && (await waitForGeminiModelOptionSelected(selectedOption)));
    await closeGeminiModelMenu(modelPickerBtn, verificationMenu);
    if (isSelected) {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_SUCCESS.replace("{0}", targetModelText));
      return true;
    }
  }
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_NOT_FOUND.replace("{0}", targetModelText));
  return false;
}

export async function configureGeminiGenerateType(page: Page, visualConfig: GeminiVisualConfig): Promise<boolean> {
  const isVideo = visualConfig?.generateType === GenerateType.Video;
  const targetText = isVideo ? GeminiChatTextOption.CreateVideoVi : GeminiChatTextOption.CreateImageVi;

  const activeModeRegex = isVideo ? GEMINI_ACTIVE_VIDEO_MODE_REGEX : GEMINI_ACTIVE_IMAGE_MODE_REGEX;
  const hasActiveGenerateType = async (): Promise<boolean> => {
    const selectedModeChip = page.locator('gem-button[data-test-id="deselect-drawer-item-gem-button"]').first();
    if (await selectedModeChip.isVisible().catch(() => false)) {
      const selectedModeLabel = _.trim(await selectedModeChip.innerText().catch(() => ""));
      if (activeModeRegex.test(selectedModeLabel)) return true;
    }

    const candidates = page.locator(GeminiChatSelector.ActiveGenerateType);
    const candidateCount = await candidates.count();
    for (let index = SecurityConstants.ZERO; index < candidateCount; index++) {
      const candidate = candidates.nth(index);
      if (!(await candidate.isVisible().catch(() => false))) continue;
      const belongsToNavigation = await candidate
        .evaluate((element: HTMLElement) =>
          Boolean(element.closest('bard-sidenav-container, bard-sidenav, side-navigation-content, nav, [role="navigation"], [data-test-id="videos-side-nav-entry-button"]')),
        )
        .catch(() => false);
      if (belongsToNavigation) continue;
      const label = _.trim(_.join([await candidate.innerText().catch(() => ""), await candidate.getAttribute("aria-label").catch(() => "")], " "));
      if (activeModeRegex.test(label)) return true;
    }
    return false;
  };
  const waitForActiveGenerateType = async (): Promise<boolean> => {
    const maximumPolls = Math.ceil(GEMINI_MODEL_SELECTION_CONFIG.ACTIVE_MODE_TIMEOUT_MS / GEMINI_MODEL_SELECTION_CONFIG.SELECTION_POLL_MS);
    for (let poll = SecurityConstants.ZERO; poll < maximumPolls; poll++) {
      if (await hasActiveGenerateType()) return true;
      await delayAsync(GEMINI_MODEL_SELECTION_CONFIG.SELECTION_POLL_MS);
    }
    return false;
  };

  if (await hasActiveGenerateType()) return true;

  const plusBtn = page.locator(GeminiChatSelector.PlusButton).first();
  const selectionTimeout = GEMINI_MODEL_SELECTION_CONFIG.OPTION_TIMEOUT_MS;
  try {
    await plusBtn.waitFor({ state: "visible", timeout: selectionTimeout });
  } catch {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_PLUS_NOT_FOUND);
    return false;
  }

  appLog(BACKEND_MESSAGES.GEMINI_CHAT_CONFIG_GEN_TYPE.replace("{0}", targetText));
  const pageLoading = page.locator(GEMINI_MODEL_SELECTION_CONFIG.PAGE_LOADING_SELECTOR).filter({ visible: true }).first();
  if (await pageLoading.isVisible().catch(() => false)) {
    appLog("[Gemini Chat] Đang chờ giao diện tải xong trước khi mở menu tạo nội dung.");
    await pageLoading.waitFor({ state: "hidden", timeout: GEMINI_MODEL_SELECTION_CONFIG.PAGE_LOADING_TIMEOUT_MS }).catch(() => undefined);
  }
  for (let attempt = 0; attempt < GEMINI_MODEL_SELECTION_CONFIG.MAX_ATTEMPTS; attempt++) {
    await randomDelay(800, 1500);
    await plusBtn.click();
    await randomDelay(500, 900);
    await captureGeminiDomState(page, isVideo ? "video_type_menu_open" : "image_type_menu_open");

    const exactOptionRegex = isVideo
      ? /^\s*(?:Tạo video|Video|Create video|Generate video)\s*$/i
      : /^\s*(?:Tạo hình ảnh|Tạo ảnh|Vẽ hình ảnh|Create (?:an )?image|Generate (?:an )?image|Create images|Generate images)\s*$/i;
    const findExactVisibleOption = async (locator: Locator): Promise<Locator | null> => {
      const count = await locator.count();
      for (let optionIndex = SecurityConstants.ZERO; optionIndex < count; optionIndex++) {
        const option = locator.nth(optionIndex);
        if (!(await option.isVisible().catch(() => false))) continue;
        const optionLabel = _.trim(_.join([await option.innerText().catch(() => ""), await option.getAttribute("aria-label").catch(() => "")], " "));
        if (exactOptionRegex.test(optionLabel)) return option;
      }
      return null;
    };
    const optionBtn = await findExactVisibleOption(page.locator(GeminiChatSelector.PlusMenuOptions));
    const optionBtnFallback = await findExactVisibleOption(page.locator("button"));
    let selectedOption = optionBtn;
    let usedFallback = false;
    if (!selectedOption) {
      selectedOption = optionBtnFallback;
      usedFallback = true;
    }
    if (!selectedOption) continue;

    await randomDelay(300, 700);
    await selectedOption.click();
    await randomDelay(800, 1400);
    const menuClosed = await selectedOption.isHidden().catch(() => true);
    const modeActive = menuClosed && (await waitForActiveGenerateType());
    if (modeActive) {
      await captureGeminiDomState(page, isVideo ? "video_type_selected" : "image_type_selected");
      appLog((usedFallback ? BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_FALLBACK : BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_SUCCESS).replace("{0}", targetText));
      return true;
    }
    await captureGeminiDomState(page, isVideo ? "video_type_chip_missing" : "image_type_chip_missing");
  }

  await captureGeminiDomState(page, isVideo ? "video_type_option_missing" : "image_type_option_missing");
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_NOT_FOUND.replace("{0}", targetText));
  await page.keyboard.press("Escape");
  await randomDelay(500, 800);
  return false;
}

export const createGeminiReferenceFiles = (referenceImages: unknown) =>
  _.chain(_.isArray(referenceImages) ? referenceImages : [])
    .filter(_.isString)
    .take(GEMINI_CHAT_VIDEO_INPUT_CONFIG.MAX_REFERENCE_IMAGES)
    .map((source) => {
      const match = _.toString(source).match(BASE64_IMAGE_MIME_REGEX);
      const encodedAsset = match
        ? {
            mimeType: _.join([GEMINI_CHAT_VIDEO_INPUT_CONFIG.MIME_PREFIX, _.get(match, SecurityConstants.DEFAULT_AMOUNT)], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
            data: _.get(match, GEMINI_CHAT_VIDEO_INPUT_CONFIG.BASE64_CAPTURE_INDEX),
          }
        : readEncodedProjectImage(source);
      if (!encodedAsset?.data || !encodedAsset.mimeType) return null;
      const extension = _.last(_.split(encodedAsset.mimeType, GEMINI_CHAT_VIDEO_INPUT_CONFIG.MIME_PREFIX)) || "png";
      const buffer = Buffer.from(encodedAsset.data, REFACTOR_CONSTANTS.ENCODING_BASE64);
      const contentHash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, GEMINI_CHAT_VIDEO_INPUT_CONFIG.FILE_HASH_LENGTH);
      return {
        name: _.join([GEMINI_CHAT_VIDEO_INPUT_CONFIG.FILE_PREFIX, contentHash, GEMINI_CHAT_VIDEO_INPUT_CONFIG.EXTENSION_SEPARATOR, extension], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
        mimeType: encodedAsset.mimeType,
        buffer,
      };
    })
    .compact()
    .value();

async function configureGeminiMediaInput(page: Page, visualConfig: GeminiVisualConfig) {
  await page.bringToFront().catch(() => {});
  const isVideoGeneration = _.some([visualConfig?.generateType], (generateType) => _.isEqual(generateType, GenerateType.Video));
  if (isVideoGeneration) {
    const targetRatio = visualConfig?.aspectRatio || AspectRatio.SixteenNine;
    const aspectButton = page.locator(GEMINI_CHAT_VIDEO_SELECTORS.ASPECT_BUTTON).first();

    if (await aspectButton.isVisible()) {
      const currentLabel = await aspectButton.getAttribute(GEMINI_CHAT_VIDEO_INPUT_CONFIG.ARIA_LABEL_ATTRIBUTE);
      if (!_.includes(currentLabel, targetRatio)) {
        await aspectButton.click();
        await randomDelay(GEMINI_CHAT_VIDEO_INPUT_CONFIG.ASPECT_DELAY_MIN_MS, GEMINI_CHAT_VIDEO_INPUT_CONFIG.ASPECT_DELAY_MAX_MS);
        const ratioOption = page
          .locator(GEMINI_CHAT_VIDEO_SELECTORS.ASPECT_OPTIONS)
          .filter({ hasText: new RegExp(_.escapeRegExp(targetRatio)) })
          .first();
        if (await ratioOption.isVisible()) {
          await ratioOption.click();
          await randomDelay(GEMINI_CHAT_VIDEO_INPUT_CONFIG.ASPECT_DELAY_MIN_MS, GEMINI_CHAT_VIDEO_INPUT_CONFIG.ASPECT_DELAY_MAX_MS);
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_ASPECT_SUCCESS.replace(SecurityConstants.PLACEHOLDER_0, targetRatio));
        } else {
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_ASPECT_OPTION_NOT_FOUND.replace(SecurityConstants.PLACEHOLDER_0, targetRatio));
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

  const currentChipCount = await page
    .locator(GEMINI_CHAT_VIDEO_SELECTORS.REFERENCE_CHIPS)
    .count()
    .catch(() => 0);
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
      const fallbackPlus = page.locator(".input-area, .chat-input, input-area, form").locator("button").first();
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
          const uploadMenuItem = page
            .locator('[role="menuitem"], button')
            .filter({ hasText: /upload|tải|file/i })
            .first();
          if (await uploadMenuItem.isVisible().catch(() => false)) {
            try {
              const [fileChooser] = await Promise.all([page.waitForEvent("filechooser", { timeout: 4000 }).catch(() => null), uploadMenuItem.click().catch(() => {})]);
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
        await page
          .waitForFunction(
            ({ selector, expectedCount }) => document.querySelectorAll(selector).length >= expectedCount,
            { selector: GEMINI_CHAT_VIDEO_SELECTORS.REFERENCE_CHIPS, expectedCount: SecurityConstants.DEFAULT_AMOUNT },
            { timeout: GEMINI_CHAT_VIDEO_INPUT_CONFIG.UPLOAD_VERIFY_TIMEOUT_MS },
          )
          .catch(() => undefined);
        await randomDelay(GEMINI_CHAT_VIDEO_INPUT_CONFIG.UPLOAD_DELAY_MIN_MS, GEMINI_CHAT_VIDEO_INPUT_CONFIG.UPLOAD_DELAY_MAX_MS);
        roomReferenceUploadedMap.set(page, true);
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_REFERENCE_UPLOAD.replace(SecurityConstants.PLACEHOLDER_0, _.toString(SecurityConstants.DEFAULT_AMOUNT)));
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
      await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
      const clipboardSuccess = await page.evaluate(async (text) => {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (e) {
          return false;
        }
      }, promptText);

      if (clipboardSuccess) await page.keyboard.press("Control+V");
      else {
        await page.keyboard.insertText(promptText);
      }
    } catch (pasteErr) {
      await page.keyboard.insertText(promptText);
    }
  }
  await randomDelay(1500, 3000);
}

const waitForGeneratedImageReady = async (media: Locator): Promise<void> => {
  const maximumAttempts = Math.ceil(GEMINI_MEDIA_EXTRACTION_CONFIG.IMAGE_READY_TIMEOUT_MS / GEMINI_MEDIA_EXTRACTION_CONFIG.IMAGE_READY_POLL_MS);
  for (let attempt = SecurityConstants.ZERO; attempt < maximumAttempts; attempt++) {
    const ready = await media
      .evaluate((element: HTMLImageElement, minimumDimension) => {
        const source = element.currentSrc || element.src || element.getAttribute("src") || "";
        if (!source) return false;
        return element.complete || element.naturalWidth >= minimumDimension || source.startsWith("blob:") || source.startsWith("http");
      }, GEMINI_MEDIA_EXTRACTION_CONFIG.MIN_IMAGE_DIMENSION_PX)
      .catch(() => false);
    if (ready) return;
    await delayAsync(GEMINI_MEDIA_EXTRACTION_CONFIG.IMAGE_READY_POLL_MS);
  }
};

const waitForGeminiPageIdle = async (page: Page, visualConfig: GeminiVisualConfig): Promise<void> => {
  const mediaType = _.isEqual(visualConfig.generateType, GenerateType.Video) ? GEMINI_MEDIA_ERRORS.VIDEO_MEDIA_TYPE : GEMINI_MEDIA_ERRORS.IMAGE_MEDIA_TYPE;
  await page
    .waitForFunction(
      ({ responseSelector, globalBusySelector, responseBusySelector, lastResponseOffset }) => {
        const responses = document.querySelectorAll(responseSelector);
        const latestResponse = responses.item(responses.length - lastResponseOffset);
        return !document.querySelector(globalBusySelector) && !latestResponse?.querySelector(responseBusySelector);
      },
      {
        responseSelector: GeminiChatSelector.Response,
        globalBusySelector: GeminiChatSelector.GenerationBusy,
        responseBusySelector: GeminiChatSelector.ResponseGenerationBusy,
        lastResponseOffset: SecurityConstants.DEFAULT_AMOUNT,
      },
      { timeout: GEMINI_MEDIA_EXTRACTION_CONFIG.PAGE_IDLE_TIMEOUT_MS },
    )
    .catch(() => {
      throw new Error(GEMINI_MEDIA_ERRORS.GENERATION_TIMEOUT_TEMPLATE.replace("{mediaType}", mediaType));
    });
};

export const isDownloadedVideoBuffer = (buffer: Buffer): boolean => {
  if (_.lt(buffer.length, 12)) return false;
  const isIsoBaseMedia = _.isEqual(buffer.subarray(4, 8).toString("ascii"), "ftyp");
  const isWebM = _.isEqual(buffer.subarray(0, 4).toString("hex"), "1a45dfa3");
  return isIsoBaseMedia || isWebM;
};

const tryDownloadViaButton = async (page: Page, container: Locator, requireVideo: boolean = false): Promise<string | null> => {
  const downloadButtonSelectors = GEMINI_MEDIA_EXTRACTION_CONFIG.DOWNLOAD_BUTTON_SELECTORS;

  for (const selector of downloadButtonSelectors) {
    const btn = container.locator(selector).first();
    const isVisible = await btn.isVisible().catch(() => false);
    if (isVisible) {
      try {
        const [download] = await Promise.all([
          page.waitForEvent("download", { timeout: GEMINI_MEDIA_EXTRACTION_CONFIG.BUTTON_DOWNLOAD_TIMEOUT_MS }),
          btn.click({ force: true }).catch(() => {}),
        ]);
        if (download) {
          const stream = await download.createReadStream();
          if (stream) {
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
              chunks.push(_.isString(chunk) ? Buffer.from(chunk) : chunk);
            }
            const buffer = Buffer.concat(chunks);
            if (_.gt(buffer.length, GEMINI_MEDIA_EXTRACTION_CONFIG.MIN_VALID_MEDIA_LENGTH)) {
              if (requireVideo && !isDownloadedVideoBuffer(buffer)) {
                appLog(GEMINI_MEDIA_ERRORS.VIDEO_REQUEST_RETURNED_IMAGE);
                continue;
              }
              appLog(GEMINI_MEDIA_EXTRACTION_CONFIG.BUTTON_DOWNLOAD_LOG);
              return buffer.toString(REFACTOR_CONSTANTS.ENCODING_BASE64);
            }
          }
        }
      } catch {}
    }
  }
  return null;
};

async function waitForGeminiFinished(page: Page, visualConfig: GeminiVisualConfig, initialResponseCount?: number) {
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_WAITING_RESPONSE);
  await captureGeminiDomState(page, "waiting_for_response");

  if (!_.isUndefined(initialResponseCount)) {
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
    await latestResponse.waitFor({ state: "visible", timeout: GEMINI_MEDIA_EXTRACTION_CONFIG.MEDIA_WAIT_TIMEOUT_MS });
  } catch (e) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_NO_RESPONSE);
  }
  await captureGeminiDomState(page, "response_detected");

  const isVideoGeneration = _.isEqual(visualConfig?.generateType, GenerateType.Video);
  const mediaSelector = isVideoGeneration ? GEMINI_CHAT_VIDEO_SELECTORS.GENERATED_VIDEO : GEMINI_CHAT_MEDIA_SELECTORS.image;
  const mediaContainer = latestResponse.locator(mediaSelector).first();
  await captureGeminiDomState(page, isVideoGeneration ? "video_loading" : "image_loading");

  if (isVideoGeneration && !(await mediaContainer.isVisible().catch(() => false))) {
    const processingIndicator = latestResponse.locator(GEMINI_CHAT_VIDEO_SELECTORS.PROCESSING).first();
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

  const mediaReadyTimeout = isVideoGeneration ? GEMINI_CHAT_VIDEO_INPUT_CONFIG.VIDEO_READY_TIMEOUT_MS : GEMINI_CHAT_VIDEO_INPUT_CONFIG.MEDIA_READY_TIMEOUT_MS;

  const pollIntervalMs = GEMINI_MEDIA_EXTRACTION_CONFIG.FINISH_POLL_INTERVAL_MS;
  const maxAttempts = Math.ceil(mediaReadyTimeout / pollIntervalMs);
  let isMediaFound = false;
  const generationFailurePattern = /(?:couldn['’]?t generate|unable to generate|generation failed|something went wrong|không thể tạo|tạo video thất bại|đã xảy ra lỗi)/i;

  for (let i = SecurityConstants.ZERO; i < maxAttempts; i++) {
    const hasDownloadBtn = await latestResponse
      .locator(_.join(GEMINI_MEDIA_EXTRACTION_CONFIG.DOWNLOAD_BUTTON_SELECTORS, ", "))
      .first()
      .isVisible()
      .catch(() => false);

    const hasMedia = await mediaContainer.isVisible().catch(() => false);

    if ((isVideoGeneration && hasMedia) || (!isVideoGeneration && (hasDownloadBtn || hasMedia))) {
      isMediaFound = true;
      break;
    }

    const isBusy = await latestResponse
      .evaluate((el: HTMLElement, busySelector: string) => Boolean(el.querySelector(busySelector)), GEMINI_MEDIA_EXTRACTION_CONFIG.BUSY_ELEMENT_SELECTOR)
      .catch(() => false);

    if (isVideoGeneration && !isBusy && _.gt(i, 5)) {
      const responseText = await latestResponse.innerText().catch(() => "");
      if (generationFailurePattern.test(responseText)) {
        await captureGeminiDomState(page, "video_generation_rejected");
        throw new Error(GEMINI_MEDIA_ERRORS.GENERATION_TIMEOUT_TEMPLATE.replace("{mediaType}", GEMINI_MEDIA_ERRORS.VIDEO_MEDIA_TYPE));
      }
    }

    if (!isVideoGeneration && !isBusy && _.gt(i, 5)) {
      const anyImg = await latestResponse
        .locator(GEMINI_MEDIA_EXTRACTION_CONFIG.EXCLUDED_IMAGE_SELECTOR)
        .first()
        .isVisible()
        .catch(() => false);
      if (anyImg) {
        isMediaFound = true;
        break;
      }
    }

    await delayAsync(pollIntervalMs);
  }

  if (!isMediaFound && !(await mediaContainer.isVisible().catch(() => false))) {
    await captureGeminiDomState(page, isVideoGeneration ? "video_timeout" : "image_timeout");
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_NO_CONTAINER);
    const mediaType = isVideoGeneration ? GEMINI_MEDIA_ERRORS.VIDEO_MEDIA_TYPE : GEMINI_MEDIA_ERRORS.IMAGE_MEDIA_TYPE;
    throw new Error(GEMINI_MEDIA_ERRORS.GENERATION_TIMEOUT_TEMPLATE.replace("{mediaType}", mediaType));
  }

  if (!isVideoGeneration && (await mediaContainer.isVisible().catch(() => false))) {
    await waitForGeneratedImageReady(mediaContainer).catch(() => undefined);
  }
  await captureGeminiDomState(page, isVideoGeneration ? "video_ready" : "image_ready");
}

async function getBase64FromBlobUrl(page: Page, mediaElement: Locator): Promise<string | null> {
  try {
    await captureGeminiDomState(page, GEMINI_MEDIA_EXTRACTION_CONFIG.STATES.EXTRACT_START);
    const tagName = await mediaElement.evaluate((el: HTMLElement) => el.tagName.toLowerCase()).catch(() => GEMINI_MEDIA_EXTRACTION_CONFIG.IMAGE_TAG);

    let src: string = GEMINI_MEDIA_EXTRACTION_CONFIG.EMPTY_VALUE;
    for (let i = SecurityConstants.ZERO; i < GEMINI_CHAT_VIDEO_INPUT_CONFIG.VIDEO_SOURCE_POLL_ATTEMPTS; i = _.add(i, SecurityConstants.DEFAULT_AMOUNT)) {
      src = await mediaElement
        .evaluate(
          (element: HTMLImageElement | HTMLVideoElement | HTMLSourceElement, sourceSelector) =>
            "currentSrc" in element && element.currentSrc
              ? element.currentSrc
              : element.src
                ? element.src
                : element.getAttribute("src")
                  ? String(element.getAttribute("src"))
                  : "querySelector" in element && element.querySelector<HTMLSourceElement>(sourceSelector)?.src
                    ? String(element.querySelector<HTMLSourceElement>(sourceSelector)?.src)
                    : GEMINI_MEDIA_EXTRACTION_CONFIG.EMPTY_VALUE,
          GEMINI_MEDIA_EXTRACTION_CONFIG.SOURCE_SELECTOR,
        )
        .catch(() => "");
      if (_.some(GEMINI_MEDIA_EXTRACTION_CONFIG.URL_PREFIXES, (prefix) => _.startsWith(src, prefix))) {
        break;
      }
      await page.waitForTimeout(GEMINI_CHAT_VIDEO_INPUT_CONFIG.VIDEO_SOURCE_POLL_MS);
    }

    if (src) {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACTING_MEDIA.replace("{0}", tagName).replace("{1}", src));
      await captureGeminiDomState(page, GEMINI_MEDIA_EXTRACTION_CONFIG.STATES.URL_DETECTED);
    }

    if (_.isEqual(tagName, GEMINI_MEDIA_EXTRACTION_CONFIG.IMAGE_TAG) || tagName === "download-generated-image-button" || !src) {
      const base64Data = await mediaElement
        .evaluate(
          async (imgEl, extractionConfig) => {
            try {
              const imageElement = imgEl as HTMLImageElement;
              const sourceUrl = imageElement.currentSrc
                ? imageElement.currentSrc
                : imageElement.src
                  ? imageElement.src
                  : imageElement.getAttribute("src")
                    ? String(imageElement.getAttribute("src"))
                    : extractionConfig.emptyValue;

              if (sourceUrl) {
                try {
                  const response = await fetch(sourceUrl);
                  if (response.ok) {
                    const blob = await response.blob();
                    const converted = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
                      reader.onerror = reject;
                      reader.readAsDataURL(blob);
                    });
                    if (converted) return converted;
                  }
                } catch {}
              }

              if (imageElement.complete && (imageElement.naturalWidth > 0 || imageElement.width > 0)) {
                const canvas = document.createElement("canvas");
                canvas.width = imageElement.naturalWidth || imageElement.width;
                canvas.height = imageElement.naturalHeight || imageElement.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(imageElement, 0, 0);
                  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
                  if (dataUrl.includes(",")) {
                    return dataUrl.split(",")[1];
                  }
                }
              }
              return extractionConfig.emptyValue;
            } catch (fetchError: unknown) {
              return extractionConfig.errorPrefix + (fetchError instanceof Error ? fetchError.message : String(fetchError));
            }
          },
          {
            errorPrefix: GEMINI_MEDIA_EXTRACTION_CONFIG.ERROR_PREFIX,
            emptyValue: GEMINI_MEDIA_EXTRACTION_CONFIG.EMPTY_VALUE,
            dataSeparator: GEMINI_MEDIA_EXTRACTION_CONFIG.DATA_SEPARATOR,
            dataIndex: GEMINI_MEDIA_EXTRACTION_CONFIG.DATA_INDEX,
          },
        )
        .catch(() => null);

      if (base64Data && !_.startsWith(base64Data, GEMINI_MEDIA_EXTRACTION_CONFIG.ERROR_PREFIX) && _.gt(base64Data.length, GEMINI_MEDIA_EXTRACTION_CONFIG.MIN_VALID_MEDIA_LENGTH)) {
        await captureGeminiDomState(page, GEMINI_MEDIA_EXTRACTION_CONFIG.STATES.IMAGE_SUCCESS);
        return base64Data;
      }
    } else if (_.isEqual(tagName, GEMINI_MEDIA_EXTRACTION_CONFIG.VIDEO_TAG)) {
      if (/^https?:\/\//i.test(src)) {
        try {
          const response = await page.context().request.get(src, {
            headers: {
              referer: page.url(),
            },
            timeout: GEMINI_CHAT_VIDEO_INPUT_CONFIG.VIDEO_READY_TIMEOUT_MS,
          });
          if (response.ok()) {
            const buffer = await response.body();
            const isValidVideoBuffer = _.gt(buffer.length, GEMINI_MEDIA_EXTRACTION_CONFIG.MIN_VALID_MEDIA_LENGTH) && isDownloadedVideoBuffer(buffer);
            if (isValidVideoBuffer) {
              await captureGeminiDomState(page, GEMINI_MEDIA_EXTRACTION_CONFIG.STATES.VIDEO_SUCCESS);
              return buffer.toString(REFACTOR_CONSTANTS.ENCODING_BASE64);
            }
          }
        } catch (requestError: unknown) {
          appError(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERROR.replace("{0}", getErrorMessage(requestError)));
        }
      }

      const base64Data = await mediaElement
        .evaluate(
          async (videoEl, extractionConfig) => {
            const sourceUrl = (videoEl as HTMLVideoElement).currentSrc || (videoEl as HTMLVideoElement).src || (videoEl as HTMLVideoElement).getAttribute("src");
            if (!sourceUrl) return null;
            try {
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
            } catch {
              return null;
            }
          },
          {
            dataSeparator: GEMINI_MEDIA_EXTRACTION_CONFIG.DATA_SEPARATOR,
            dataIndex: GEMINI_MEDIA_EXTRACTION_CONFIG.DATA_INDEX,
          },
        )
        .catch(() => null);

      if (base64Data) {
        const buffer = Buffer.from(base64Data, REFACTOR_CONSTANTS.ENCODING_BASE64);
        if (!isDownloadedVideoBuffer(buffer)) return null;
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
  const finalizeVideo = (value: string): Promise<string> => (visualConfig?.preserveVideoAudio ? Promise.resolve(value) : removeVideoAudioTrack(value));
  const latestResponse = page.locator(GeminiChatSelector.Response).last();

  const mediaSelector = isVideoGeneration ? GEMINI_CHAT_VIDEO_SELECTORS.GENERATED_VIDEO : GEMINI_CHAT_MEDIA_SELECTORS.image;
  const mediaLoc = latestResponse.locator(mediaSelector).first();

  await mediaLoc.waitFor({ state: "visible", timeout: GEMINI_MEDIA_EXTRACTION_CONFIG.MEDIA_WAIT_TIMEOUT_MS }).catch(() => undefined);

  const base64 = await getBase64FromBlobUrl(page, mediaLoc);
  if (base64) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_SUCCESS);
    return isVideoGeneration ? finalizeVideo(base64) : base64;
  }

  const buttonDownloadedBase64 = isVideoGeneration ? null : await tryDownloadViaButton(page, latestResponse, false);
  if (buttonDownloadedBase64) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_SUCCESS);
    return isVideoGeneration ? finalizeVideo(buttonDownloadedBase64) : buttonDownloadedBase64;
  }

  const secondaryBase64 = isVideoGeneration
    ? null
    : await latestResponse
        .evaluate(async (responseEl, excludedSelector) => {
          const img = responseEl.querySelector(excludedSelector) as HTMLImageElement | null;
          if (!img) return null;
          if (img.complete && (img.naturalWidth > 0 || img.width > 0)) {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = img.naturalWidth || img.width;
              canvas.height = img.naturalHeight || img.height;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
                if (dataUrl.includes(",")) return dataUrl.split(",")[1];
              }
            } catch {}
          }
          const src = img.currentSrc || img.src || img.getAttribute("src") || "";
          if (!src) return null;
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
        }, GEMINI_MEDIA_EXTRACTION_CONFIG.EXCLUDED_IMAGE_SELECTOR)
        .catch(() => null);

  if (secondaryBase64) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_SUCCESS);
    return secondaryBase64;
  }

  const fallbackBtnDownload = isVideoGeneration ? null : await tryDownloadViaButton(page, page.locator("body"), false);
  if (fallbackBtnDownload) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_SUCCESS);
    return isVideoGeneration ? finalizeVideo(fallbackBtnDownload) : fallbackBtnDownload;
  }

  throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERR_THROW);
}
