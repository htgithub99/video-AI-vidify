import { STUDIO_RUNTIME as XRT } from "../../constants/studioRuntime.js";
import * as SRT from "../../constants/sourceText.js";
import { BROWSER_LIFECYCLE_TEXTS, isDisposableChatBrowserUrl } from "../../constants/browserLifecycle.js";
import {
  SOURCE_BROWSER_TEXT_2D,
  SOURCE_BROWSER_TEXT_ARIA_BUSY,
  SOURCE_BROWSER_TEXT_ARIA_CHECKED,
  SOURCE_BROWSER_TEXT_ARIA_LABEL_TITLE_DATA_PROMPT,
  SOURCE_BROWSER_TEXT_A_HREF_EDIT,
  SOURCE_BROWSER_TEXT_BARD_SIDENAV_CONTAINER_BARD_SIDENAV_SIDE,
  SOURCE_BROWSER_TEXT_BLOB,
  SOURCE_BROWSER_TEXT_BUTTON_TYPE_SUBMIT,
  SOURCE_BROWSER_TEXT_CURRENTSRC,
  SOURCE_BROWSER_TEXT_DATA_IMAGE,
  SOURCE_BROWSER_TEXT_DATA_PROMPT,
  SOURCE_BROWSER_TEXT_DATA_SRC,
  SOURCE_BROWSER_TEXT_DATA_STATE,
  SOURCE_BROWSER_TEXT_DATA_URL,
  SOURCE_BROWSER_TEXT_DISABLED,
  SOURCE_BROWSER_TEXT_EDIT,
  SOURCE_BROWSER_TEXT_FLOW_GRID_TILE_CONTAINER,
  SOURCE_BROWSER_TEXT_GETMEDIAURLREDIRECT,
  SOURCE_BROWSER_TEXT_HTTP,
  SOURCE_BROWSER_TEXT_IMG_ALT_H_NH_NH_TH,
  SOURCE_BROWSER_TEXT_IMG_ALT_VIDEO_I,
  SOURCE_BROWSER_TEXT_IMG_SRC_DATA_TESTID_ATTACHMENT_I,
  SOURCE_BROWSER_TEXT_INSTANT,
  SOURCE_BROWSER_TEXT_LOADING,
  SOURCE_BROWSER_TEXT_QUERYSELECTOR,
  SOURCE_BROWSER_TEXT_RESOURCE,
  SOURCE_BROWSER_TEXT_RETURN,
  SOURCE_BROWSER_TEXT_ROLE_PROGRESSBAR_PROGRESS_ARIA_VALUENOW,
  SOURCE_BROWSER_TEXT_SOURCE,
  SOURCE_BROWSER_TEXT_SRC,
  SOURCE_BROWSER_TEXT_SYMBOL,
  SOURCE_BROWSER_TEXT_SYMBOL_2,
  SOURCE_BROWSER_TEXT_VIDEO_IMG_SOURCE,
  SOURCE_TEMPLATE_ATTEMPT,
  SOURCE_TEMPLATE_CHROME_GRACEFUL_CLOSE_FAILED,
  SOURCE_TEMPLATE_CROP_S,
  SOURCE_TEMPLATE_CROP_S_S,
  SOURCE_TEMPLATE_DATA_BASE64,
  SOURCE_TEMPLATE_EDIT,
  SOURCE_TEMPLATE_FLOW_CHARACTER_ATTEMPT,
  SOURCE_TEMPLATE_FUNCTION_URL_IF_URL_RETURN_TRY,
  SOURCE_TEMPLATE_GEMINICHAT,
  SOURCE_TEMPLATE_GEMINICHAT_BATCH_SCENE,
  SOURCE_TEMPLATE_GROK_CHROME_GRACEFUL_CLOSE_FAILED,
  SOURCE_TEMPLATE_HD_S_S_INFO,
  SOURCE_TEMPLATE_JSON_VERSION,
  SOURCE_TEMPLATE_PROFILE_DIRECTORY,
  SOURCE_TEMPLATE_PROJECT,
  SOURCE_TEMPLATE_REFERENCE_ATTACHED_WITHOUT_COUNT,
  SOURCE_TEMPLATE_REFERENCE_NOT_READY,
  SOURCE_TEMPLATE_REFERENCE_UPLOAD_UNVERIFIED_ATTEMPT,
  SOURCE_TEMPLATE_SCHEDULE_S_S_S_SEC_OND,
  SOURCE_TEMPLATE_SYMBOL,
  SOURCE_TEMPLATE_SYMBOL_20,
  SOURCE_TEMPLATE_SYMBOL_33,
  SOURCE_TEMPLATE_SYMBOL_41,
  SOURCE_TEMPLATE_SYMBOL_62,
  SOURCE_TEMPLATE_SYMBOL_63,
  SOURCE_TEMPLATE_SYMBOL_64,
  SOURCE_TEMPLATE_USER_DATA_DIR,
  SOURCE_TEMPLATE_VISIBLE,
  SOURCE_TEMPLATE_X,
  SOURCE_TEMPLATE_X_2,
  SOURCE_TEXT_0_2,
  SOURCE_TEXT_1,
  SOURCE_TEXT_16_9,
  SOURCE_TEXT_1A45DFA3,
  SOURCE_TEXT_1X,
  SOURCE_TEXT_1_3,
  SOURCE_TEXT_2_2,
  SOURCE_TEXT_9_16,
  SOURCE_TEXT_ABOUT_BLANK,
  SOURCE_TEXT_ARIA_DISABLED,
  SOURCE_TEXT_ARIA_LABEL,
  SOURCE_TEXT_ARIA_PRESSED,
  SOURCE_TEXT_ARIA_SELECTED,
  SOURCE_TEXT_ASC,
  SOURCE_TEXT_ASCII,
  SOURCE_TEXT_ATTACHED,
  SOURCE_TEXT_BACKSPACE,
  SOURCE_TEXT_BASE64,
  SOURCE_TEXT_BODY,
  SOURCE_TEXT_BROWSER_CLOSE,
  SOURCE_TEXT_BUTTON,
  SOURCE_TEXT_BUTTON_ARIA_HASPOPUP_MENU,
  SOURCE_TEXT_BUTTON_ARIA_LABEL_CLOSE_BUTTON_MAT,
  SOURCE_TEXT_BUTTON_ARIA_LABEL_CLOSE_I_BUTTON,
  SOURCE_TEXT_C,
  SOURCE_TEXT_CANVAS,
  SOURCE_TEXT_CENTER,
  SOURCE_TEXT_CHROME,
  SOURCE_TEXT_CLIPBOARD_READ,
  SOURCE_TEXT_CLIPBOARD_WRITE,
  SOURCE_TEXT_CLOSE_2,
  SOURCE_TEXT_CONTENTEDITABLE_TRUE,
  SOURCE_TEXT_CONTENTEDITABLE_TRUE_ROLE_TEXTBOX,
  SOURCE_TEXT_CONTENT_TYPE_2,
  SOURCE_TEXT_CONTROL_A,
  SOURCE_TEXT_CONTROL_V,
  SOURCE_TEXT_DISCOVERYORDER,
  SOURCE_TEXT_DOM,
  SOURCE_TEXT_DOMCONTENTLOADED,
  SOURCE_TEXT_DOWNLOAD,
  SOURCE_TEXT_DOWNLOAD_GENERATED_IMAGE_BUTTON,
  SOURCE_TEXT_EDIT,
  SOURCE_TEXT_ENABLE_AUTOMATION,
  SOURCE_TEXT_ENTER,
  SOURCE_TEXT_ERROR_2,
  SOURCE_TEXT_ESCAPE,
  SOURCE_TEXT_FILECHOOSER,
  SOURCE_TEXT_FLOW,
  SOURCE_TEXT_FLOW_HOME_NEW_PROJECT_MISSING,
  SOURCE_TEXT_FLOW_HOME_NEW_PROJECT_MISSING_PNG,
  SOURCE_TEXT_FLOW_PROMPT_INPUT_MISSING,
  SOURCE_TEXT_FLOW_PROMPT_INPUT_MISSING_PNG,
  SOURCE_TEXT_FLOW_PROMPT_NOT_APPLIED,
  SOURCE_TEXT_FLOW_SUBMIT_DISABLED_AFTER_PROMPT,
  SOURCE_TEXT_FLOW_VIDEO_CONFIG_MISMATCH,
  SOURCE_TEXT_FTYP,
  SOURCE_TEXT_GEMINI_GOOGLE_COM,
  SOURCE_TEXT_GEM_BUTTON_DATA_TEST_ID_DESELECT,
  SOURCE_TEXT_GI,
  SOURCE_TEXT_GLOBALTHIS_NAME_GLOBALTHIS_NAME_TARGET_TARGET,
  SOURCE_TEXT_GROK,
  SOURCE_TEXT_GROK_COM,
  SOURCE_TEXT_GROK_COM_IMAGINE,
  SOURCE_TEXT_GROK_IMAGINE_GENERATION_FAILED,
  SOURCE_TEXT_HEADING,
  SOURCE_TEXT_HEX,
  SOURCE_TEXT_HIDDEN,
  SOURCE_TEXT_HORIZONTAL,
  SOURCE_TEXT_HREF,
  SOURCE_TEXT_ID,
  SOURCE_TEXT_IFRAME_SRC_RECAPTCHA_IFRAME_SRC_CHALLENGE,
  SOURCE_TEXT_IF_TYPEOF_WINDOW_UNDEFINED_IF_WINDOW_2,
  SOURCE_TEXT_IGNORE,
  SOURCE_TEXT_IMAGE,
  SOURCE_TEXT_IMAGEN,
  SOURCE_TEXT_IMAGE_GENERATION_REJECTED,
  SOURCE_TEXT_IMAGE_JPEG,
  SOURCE_TEXT_IMAGE_LOADING,
  SOURCE_TEXT_IMAGE_READY,
  SOURCE_TEXT_IMAGE_TEXT_ONLY_RESPONSE,
  SOURCE_TEXT_IMAGE_TIMEOUT,
  SOURCE_TEXT_IMAGE_TYPE_CHIP_MISSING,
  SOURCE_TEXT_IMAGE_TYPE_MENU_OPEN,
  SOURCE_TEXT_IMAGE_TYPE_OPTION_MISSING,
  SOURCE_TEXT_IMAGE_TYPE_SELECTED,
  SOURCE_TEXT_IMG,
  SOURCE_TEXT_INPUT_AREA_CHAT_INPUT_INPUT_AREA,
  SOURCE_TEXT_INPUT_TYPE_TEXT_VISIBLE,
  SOURCE_TEXT_INVALID_AI_CHARACTER_ARTIFACT,
  SOURCE_TEXT_INVALID_FLOW_VIDEO_PROMPT_BATCH,
  SOURCE_TEXT_I_2,
  SOURCE_TEXT_I_MAT_ICON,
  SOURCE_TEXT_LABS_SANDBOX,
  SOURCE_TEXT_MEDIATYPE,
  SOURCE_TEXT_MENUITEM,
  SOURCE_TEXT_MENUITEMRADIO,
  SOURCE_TEXT_MESSAGE,
  SOURCE_TEXT_NAME,
  SOURCE_TEXT_NETWORK,
  SOURCE_TEXT_NFKC,
  SOURCE_TEXT_NONE,
  SOURCE_TEXT_PNG,
  SOURCE_TEXT_PROMPT,
  SOURCE_TEXT_RADIO,
  SOURCE_TEXT_RECAPTCHA,
  SOURCE_TEXT_REMOTE_ALLOW_ORIGINS,
  SOURCE_TEXT_RESPONSE,
  SOURCE_TEXT_RESPONSE_DETECTED,
  SOURCE_TEXT_ROLE_MENUITEM,
  SOURCE_TEXT_ROLE_MENUITEM_ROLE_MENUITEMRADIO_ROLE_OPTION,
  SOURCE_TEXT_ROLE_MENU_DATA_STATE_OPEN,
  SOURCE_TEXT_ROLE_RADIO_ARIA_CHECKED_TRUE_BUTTON,
  SOURCE_TEXT_ROLE_RADIO_ROLE_TAB_ROLE_OPTION,
  SOURCE_TEXT_ROLE_TAB,
  SOURCE_TEXT_SCENEID,
  SOURCE_TEXT_SHA256,
  SOURCE_TEXT_SHARED_CHROME_SESSION,
  SOURCE_TEXT_SYMBOL,
  SOURCE_TEXT_SYMBOL_10,
  SOURCE_TEXT_SYMBOL_23,
  SOURCE_TEXT_SYMBOL_4,
  SOURCE_TEXT_SYMBOL_41,
  SOURCE_TEXT_SYMBOL_6,
  SOURCE_TEXT_TAB,
  SOURCE_TEXT_TABLIST,
  SOURCE_TEXT_TAB_2,
  SOURCE_TEXT_TEXTAREA,
  SOURCE_TEXT_TEXTAREA_PLACEHOLDER_MO_TA_I,
  SOURCE_TEXT_TEXTAREA_PLACEHOLDER_PROMPT_I,
  SOURCE_TEXT_TH,
  SOURCE_TEXT_THUMB,
  SOURCE_TEXT_THUMBNAIL_2,
  SOURCE_TEXT_TITLE,
  SOURCE_TEXT_TRUE,
  SOURCE_TEXT_UNUSUAL_TRAFFIC,
  SOURCE_TEXT_VEO3_FAST,
  SOURCE_TEXT_VEO3_LITE,
  SOURCE_TEXT_VEO3_QUALITY,
  SOURCE_TEXT_VERIFY_YOU_ARE_HUMAN,
  SOURCE_TEXT_VERTICAL,
  SOURCE_TEXT_VIDEO_2,
  SOURCE_TEXT_VIDEO_3,
  SOURCE_TEXT_VIDEO_4,
  SOURCE_TEXT_VIDEO_GENERATION_REJECTED,
  SOURCE_TEXT_VIDEO_LOADING,
  SOURCE_TEXT_VIDEO_MP4,
  SOURCE_TEXT_VIDEO_READY,
  SOURCE_TEXT_VIDEO_TIMEOUT,
  SOURCE_TEXT_VIDEO_TYPE_CHIP_MISSING,
  SOURCE_TEXT_VIDEO_TYPE_MENU_OPEN,
  SOURCE_TEXT_VIDEO_TYPE_OPTION_MISSING,
  SOURCE_TEXT_VIDEO_TYPE_SELECTED,
  SOURCE_TEXT_VISIBLE,
  SOURCE_TEXT_VISIBLE_2,
  SOURCE_TEXT_WAITING_FOR_RESPONSE,
  SOURCE_TEXT_WARNING,
  SOURCE_TEXT_WIN32,
  SOURCE_TEXT_XAC_MINH_BAN_LA_NGUOI,
  SOURCE_TEXT_XPATH_FOLLOWING_SIBLING_1,
} from "../../constants/sourceText";
import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "node:fs";
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
  GEMINI_IMAGES_ASPECT_CONFIG,
  GEMINI_CHAT_PACING_CONFIG,
  PIPELINE_CONFIG,
  GEMINI_DOM_DIAGNOSTICS_CONFIG,
  GEMINI_MEDIA_EXTRACTION_CONFIG,
  GEMINI_MEDIA_ERRORS,
  GEMINI_MODEL_SELECTION_CONFIG,
  GEMINI_ACTIVE_VIDEO_MODE_REGEX,
  GEMINI_ACTIVE_IMAGE_MODE_REGEX,
  FLOW_AGENT_UI_CONFIG,
  FLOW_DIRECT_VIDEO_CONFIG,
  FLOW_VIDEO_MEDIA_CONFIG,
  VIDEO_MODEL_CAPABILITY_CONFIG,
  PROVIDER_REFERENCE_UPLOAD_CONFIG,
  PROVIDER_REFERENCE_UPLOAD_MESSAGES,
  FLOW_CHARACTER_CONFIG,
  CINEMATIC_CHARACTER_PACK_CONFIG,
  ASSETS_DIR_NAME,
  PROJECTS_DIR_NAME,
  PROJECT_VISUAL_ASSET_CONFIG,
  REFERENCE_ASSET_GROUP,
} from "../../constants";
import { jsonUtils } from "../../lib/json.js";
import { FLOW_AUTOMATION_MESSAGES, GROK_AUTOMATION_MESSAGES } from "../../constants/messages.js";
import { appError, appLog, createAppError } from "../../lib/logger.js";
import { randomDelay, getBatchDelayMs, delayAsync } from "../../lib/shared-utils.js";
import { GenerateType, ImageGeneratorEngine, PromptInputMethod, ImageGenerationMode, GeminiChatModelName, GeminiChatSelector, GeminiChatTextOption, GeminiChatSpeed, GEMINI_CHAT_SPEED_TAB_COUNT, AspectRatio, ProjectLanguage, GEMINI_CHAT_MEDIA_SELECTORS, VisualConfig } from "../../types.js";
import { Browser, BrowserContext, Locator, Page } from "playwright";
import { spawn } from "child_process";
import _ from "lodash";
import { waitForFlowReferenceReadiness } from "./flowReferenceReadinessService.js";
import { inspectGeneratedVideoBuffer, removeVideoAudioTrack } from "../utils/videoAssetProcessor.js";
import { captureDomDiagnostics } from "./domDiagnosticsService.js";
import { getErrorMessage } from "../utils/errorUtils.js";
import { readEncodedProjectImage } from "./imageAssetService.js";
import { resolveBatchTabCount } from "../../services/batchGenerationPolicy.js";
import { isImageAspectRatioCompatible } from "../utils/imageAspectRatio.js";
import { removeConflictingStyleTerms } from "../../services/styleReferenceService.js";
import { distributeItemsByContinuity } from "../../services/imageGenerationContinuityService.js";
import { normalizeVideoModelSettings } from "../../services/videoModelCapabilityService.js";
interface BrowserSession {
  context: BrowserContext;
  page: Page;
  account: GoogleAccount;
  ownsContext?: boolean;
  preserveExternalPages?: boolean;
}
type GeminiVisualConfig = Partial<VisualConfig>;
const FLOW_PROMPT_SELECTORS = [SOURCE_TEXT_CONTENTEDITABLE_TRUE_ROLE_TEXTBOX, SOURCE_TEXT_TEXTAREA_PLACEHOLDER_PROMPT_I, SOURCE_TEXT_TEXTAREA_PLACEHOLDER_MO_TA_I, SOURCE_TEXT_TEXTAREA, SOURCE_TEXT_CONTENTEDITABLE_TRUE];
const flowReferenceSignatureMap = new WeakMap<Page, string>();
const grokReferenceSignatureMap = new WeakMap<Page, string>();
let mediaGenerationRevision = SecurityConstants.ZERO;
const isMediaGenerationCancelled = (revision: number): boolean => !_.isEqual(revision, mediaGenerationRevision);
const getReferenceProviderName = (provider: "flow" | "grok", logName = false): string => {
  if (_.isEqual(provider, SOURCE_TEXT_FLOW)) return logName ? PROVIDER_REFERENCE_UPLOAD_MESSAGES.FLOW_LOG_NAME : PROVIDER_REFERENCE_UPLOAD_MESSAGES.FLOW_NAME;
  return logName ? PROVIDER_REFERENCE_UPLOAD_MESSAGES.GROK_LOG_NAME : PROVIDER_REFERENCE_UPLOAD_MESSAGES.GROK_NAME;
};
const createReferenceUploadMessage = (template: string, provider: "flow" | "grok", count?: number): string => _.replace(_.replace(template, PROVIDER_REFERENCE_UPLOAD_MESSAGES.PROVIDER_TOKEN, getReferenceProviderName(provider, _.isNumber(count))), PROVIDER_REFERENCE_UPLOAD_MESSAGES.COUNT_TOKEN, _.toString(count));
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
  const hash = crypto.createHash(SOURCE_TEXT_SHA256);
  _.forEach(files, (file) => hash.update(file.name).update(file.mimeType).update(file.buffer));
  return hash.digest(SOURCE_TEXT_HEX);
};
const uploadFilesFromButton = async (page: Page, button: Locator, files: ProviderReferenceFile[]): Promise<boolean> => {
  if (!(await button.isVisible().catch(() => false))) return false;
  const chooser = await Promise.all([page.waitForEvent(SOURCE_TEXT_FILECHOOSER, { timeout: PROVIDER_REFERENCE_UPLOAD_CONFIG.FILE_CHOOSER_TIMEOUT_MS }).catch(() => null), button.click().catch(() => undefined)]).then(([fileChooser]) => fileChooser);
  if (!chooser) return false;
  await chooser.setFiles(files);
  return true;
};
const attachFlowReferenceFiles = async (page: Page, files: ProviderReferenceFile[], requireReferenceReady = false): Promise<ProviderReferenceAttachmentResult> => {
  const openMediaDialog = async (): Promise<boolean> => {
    const button = page.getByRole(SOURCE_TEXT_BUTTON, { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_COMPOSER_MEDIA_BUTTON }).last();
    if (!(await button.isVisible().catch(() => false))) return false;
    await button.click();
    await page.waitForTimeout(PROVIDER_REFERENCE_UPLOAD_CONFIG.PROVIDER_PANEL_DELAY_MS);
    return true;
  };
  if (!(await openMediaDialog())) return { attached: false, uploadedCount: SecurityConstants.ZERO };
  await Promise.all(
    _.map(files, (file) =>
      page
        .getByRole(PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_UPLOADED_OPTION_ROLE, { name: new RegExp(_.escapeRegExp(file.name), SOURCE_TEXT_I_2) })
        .last()
        .waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: PROVIDER_REFERENCE_UPLOAD_CONFIG.LIBRARY_LOOKUP_TIMEOUT_MS })
        .catch(() => undefined),
    ),
  );
  const missingFiles: ProviderReferenceFile[] = [];
  for (const file of files) {
    const optionName = new RegExp(_.escapeRegExp(file.name), SOURCE_TEXT_I_2);
    const option = page.getByRole(PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_UPLOADED_OPTION_ROLE, { name: optionName }).last();
    if (!(await option.isVisible().catch(() => false))) missingFiles.push(file);
  }
  if (!_.isEmpty(missingFiles)) {
    const uploadButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_DIALOG_UPLOAD_BUTTON }).last();
    if (!(await uploadFilesFromButton(page, uploadButton, missingFiles))) return { attached: false, uploadedCount: SecurityConstants.ZERO };
    const consentButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_UPLOAD_CONSENT_BUTTON }).last();
    if (await consentButton.isVisible().catch(() => false)) await consentButton.click();
  }
  for (const file of files) {
    const optionName = new RegExp(_.escapeRegExp(file.name), SOURCE_TEXT_I_2);
    let option = page.getByRole(PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_UPLOADED_OPTION_ROLE, { name: optionName }).last();
    if (!(await option.isVisible().catch(() => false))) {
      if (!(await openMediaDialog())) return { attached: false, uploadedCount: missingFiles.length };
      option = page.getByRole(PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_UPLOADED_OPTION_ROLE, { name: optionName }).last();
    }
    await option.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: requireReferenceReady ? PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_REFERENCE_READY_TIMEOUT_MS : PROVIDER_REFERENCE_UPLOAD_CONFIG.UPLOAD_VERIFY_TIMEOUT_MS }).catch(() => undefined);
    if (!(await option.isVisible().catch(() => false))) return { attached: false, uploadedCount: missingFiles.length };
    await option.click({ force: true });
    const addButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_ADD_TO_PROMPT_BUTTON }).last();
    if (await addButton.isVisible().catch(() => false)) await addButton.click();
    await page.waitForTimeout(PROVIDER_REFERENCE_UPLOAD_CONFIG.POST_ACTION_DELAY_MS);
  }
  return { attached: true, uploadedCount: missingFiles.length };
};
const createFlowCharacterSignature = (characterNames: string[]): string => crypto.createHash(SOURCE_TEXT_SHA256).update(_.join(characterNames, SOURCE_TEXT_SYMBOL_41)).digest(SOURCE_TEXT_HEX);
const locateFlowCharacterCard = (page: Page, characterName: string): Locator => {
  const exactName = new RegExp(SOURCE_TEMPLATE_SYMBOL_62(`${_.escapeRegExp(characterName)}`), SOURCE_TEXT_I_2);
  const namedControl = page.locator(FLOW_CHARACTER_CONFIG.CHARACTER_CARD_ROLE_SELECTOR).filter({ hasText: exactName }).last();
  const namedText = page.getByText(exactName, { exact: true }).last();
  return namedControl.or(namedText).first();
};
const openFlowCharacterLibrary = async (page: Page): Promise<boolean> => {
  const addButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_CHARACTER_CONFIG.ADD_INGREDIENT_BUTTON }).last();
  if (!(await addButton.isVisible().catch(() => false))) return false;
  await addButton.click();
  await page.waitForTimeout(FLOW_CHARACTER_CONFIG.ACTION_DELAY_MS);
  const characterFilter = page.getByRole(SOURCE_TEXT_TAB, { name: FLOW_CHARACTER_CONFIG.CHARACTER_FILTER, exact: true }).last();
  if (!(await characterFilter.isVisible().catch(() => false))) return false;
  await characterFilter.click({ force: true });
  await page.waitForTimeout(FLOW_CHARACTER_CONFIG.ACTION_DELAY_MS);
  return true;
};
const countAttachedFlowCharacters = async (page: Page, characterNames: string[]): Promise<number> => {
  if (_.isEmpty(characterNames)) return SecurityConstants.ZERO;
  const attachmentCount = await page
    .locator(PROVIDER_REFERENCE_UPLOAD_CONFIG.ATTACHMENT_PREVIEW)
    .count()
    .catch(() => SecurityConstants.ZERO);
  return attachmentCount;
};
const attachFlowCharactersByName = async (page: Page, characterNames: string[]): Promise<void> => {
  const selectedNames = _.take(_.uniq(_.compact(_.map(characterNames, (name) => _.trim(name)))), GEMINI_CHAT_VIDEO_INPUT_CONFIG.MAX_REFERENCE_IMAGES);
  const nextSignature = createFlowCharacterSignature(selectedNames);
  const currentAttachedCount = await countAttachedFlowCharacters(page, selectedNames);
  if (_.isEqual(flowReferenceSignatureMap.get(page), nextSignature) && _.gte(currentAttachedCount, selectedNames.length)) return;
  await removeProviderReferenceAttachments(page);
  if (_.isEmpty(selectedNames)) {
    flowReferenceSignatureMap.set(page, nextSignature);
    return;
  }
  for (const characterName of selectedNames) {
    if (!(await openFlowCharacterLibrary(page))) {
      throw createAppError(FLOW_CHARACTER_CONFIG.VI_ATTACH_FAILED.replace(FLOW_CHARACTER_CONFIG.NAME_TOKEN, characterName));
    }
    const searchInput = page.getByPlaceholder(FLOW_CHARACTER_CONFIG.SEARCH_PLACEHOLDER).last();
    if (await searchInput.isVisible().catch(() => false)) await searchInput.fill(characterName);
    const characterCard = locateFlowCharacterCard(page, characterName);
    await characterCard.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: FLOW_CHARACTER_CONFIG.ATTACHMENT_VERIFY_TIMEOUT_MS }).catch(() => undefined);
    if (!(await characterCard.isVisible().catch(() => false))) {
      await page.keyboard.press(FLOW_CHARACTER_CONFIG.ESCAPE_KEY || GEMINI_CHAT_VIDEO_INPUT_CONFIG.ESCAPE_KEY).catch(() => undefined);
      throw createAppError(FLOW_CHARACTER_CONFIG.VI_ATTACH_FAILED.replace(FLOW_CHARACTER_CONFIG.NAME_TOKEN, characterName));
    }
    await characterCard.click({ force: true });
    let characterAttached = false;
    for (let attempt = 0; attempt < 5 && !characterAttached; attempt += 1) {
      const addToPrompt = page.getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_CHARACTER_CONFIG.ADD_TO_PROMPT_BUTTON }).last();
      characterAttached = await addToPrompt
        .waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: FLOW_CHARACTER_CONFIG.ACTION_DELAY_MS * 4 })
        .then(() => addToPrompt.click({ force: true, timeout: FLOW_CHARACTER_CONFIG.ACTION_DELAY_MS * 4 }))
        .then(() => true)
        .catch(() => false);
      if (!characterAttached) await page.waitForTimeout(FLOW_CHARACTER_CONFIG.ACTION_DELAY_MS);
    }
    if (!characterAttached) {
      appLog(XRT.JOIN_WITH_SPACE(FLOW_CHARACTER_CONFIG.VI_ATTACH_FAILED.replace(FLOW_CHARACTER_CONFIG.NAME_TOKEN, characterName), FLOW_AUTOMATION_MESSAGES.ATTACH_CONTINUE_IDENTITY));
      await page.keyboard.press(GEMINI_CHAT_VIDEO_INPUT_CONFIG.ESCAPE_KEY).catch(() => undefined);
      continue;
    }
    await page.waitForTimeout(FLOW_CHARACTER_CONFIG.ACTION_DELAY_MS);
    await page.keyboard.press(GEMINI_CHAT_VIDEO_INPUT_CONFIG.ESCAPE_KEY).catch(() => undefined);
  }
  const attachedCount = await countAttachedFlowCharacters(page, selectedNames);
  if (_.lt(attachedCount, selectedNames.length)) appLog(FLOW_AUTOMATION_MESSAGES.FLOW_NOT_ENOUGH_CHARACTERS);
  flowReferenceSignatureMap.set(page, nextSignature);
};
const attachGrokReferenceFiles = async (page: Page, files: ProviderReferenceFile[]): Promise<ProviderReferenceAttachmentResult> => {
  const openUploads = async (): Promise<boolean> => {
    const toolboxButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.GROK_TOOLBOX_BUTTON }).last();
    if (!(await toolboxButton.isVisible().catch(() => false))) return false;
    await toolboxButton.click();
    await page.waitForTimeout(PROVIDER_REFERENCE_UPLOAD_CONFIG.PROVIDER_PANEL_DELAY_MS);
    const uploadsTab = page.getByRole(SOURCE_TEXT_TAB, { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.GROK_UPLOAD_TAB }).last();
    if (await uploadsTab.isVisible().catch(() => false)) await uploadsTab.click();
    return true;
  };
  if (!(await openUploads())) return { attached: false, uploadedCount: SecurityConstants.ZERO };
  await Promise.all(
    _.map(files, (file) =>
      page
        .getByRole(SOURCE_TEXT_BUTTON, { name: new RegExp(_.escapeRegExp(file.name), SOURCE_TEXT_I_2) })
        .last()
        .waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: PROVIDER_REFERENCE_UPLOAD_CONFIG.LIBRARY_LOOKUP_TIMEOUT_MS })
        .catch(() => undefined),
    ),
  );
  const missingFiles: ProviderReferenceFile[] = [];
  for (const file of files) {
    const namedButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: new RegExp(_.escapeRegExp(file.name), SOURCE_TEXT_I_2) }).last();
    if (!(await namedButton.isVisible().catch(() => false))) missingFiles.push(file);
  }
  if (!_.isEmpty(missingFiles)) {
    const uploadButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.GROK_MEDIA_UPLOAD_BUTTON }).last();
    if (!(await uploadFilesFromButton(page, uploadButton, missingFiles))) return { attached: false, uploadedCount: SecurityConstants.ZERO };
    await page.waitForTimeout(PROVIDER_REFERENCE_UPLOAD_CONFIG.PROVIDER_PANEL_DELAY_MS);
    const uploadsTab = page.getByRole(SOURCE_TEXT_TAB, { name: PROVIDER_REFERENCE_UPLOAD_CONFIG.GROK_UPLOAD_TAB }).last();
    if (await uploadsTab.isVisible().catch(() => false)) await uploadsTab.click();
  }
  for (const file of files) {
    const fileNamePattern = new RegExp(_.escapeRegExp(file.name), SOURCE_TEXT_I_2);
    let namedButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: fileNamePattern }).last();
    if (!(await namedButton.isVisible().catch(() => false))) {
      if (!(await openUploads())) return { attached: false, uploadedCount: missingFiles.length };
      namedButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: fileNamePattern }).last();
    }
    await namedButton.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: PROVIDER_REFERENCE_UPLOAD_CONFIG.UPLOAD_VERIFY_TIMEOUT_MS }).catch(() => undefined);
    if (!(await namedButton.isVisible().catch(() => false))) return { attached: false, uploadedCount: missingFiles.length };
    await namedButton.click();
    await page.waitForTimeout(PROVIDER_REFERENCE_UPLOAD_CONFIG.POST_ACTION_DELAY_MS);
  }
  return { attached: true, uploadedCount: missingFiles.length };
};
const countAttachedProviderReferences = async (page: Page, provider: "flow" | "grok", files: ProviderReferenceFile[], strictFlow = false): Promise<number> => {
  if (_.isEqual(provider, SOURCE_TEXT_FLOW)) {
    const legacyCollectionCount = await page
      .getByRole(SOURCE_TEXT_BUTTON, { name: /nội dung nghe nhìn do bạn tạo hoặc tải lên|media.*collection/i })
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
    const visiblePromptInput = page
      .locator(
        _.join(
          _.map(FLOW_PROMPT_SELECTORS, (selector) => SOURCE_TEMPLATE_VISIBLE(`${selector}`)),
          SOURCE_TEXT_SYMBOL_10,
        ),
      )
      .last();
    const composerThumbnailCount = await visiblePromptInput
      .evaluate(
        (input, browserPayload) => {
          const { SOURCE_BROWSER_TEXT_IMG_ALT_H_NH_NH_TH, SOURCE_BROWSER_TEXT_IMG_SRC_DATA_TESTID_ATTACHMENT_I, SOURCE_TEXT_HIDDEN, SOURCE_TEXT_NONE } = browserPayload.texts;
          const strict = browserPayload.payload;
          let current: HTMLElement | null = input as HTMLElement;
          for (let level = 0; level < (strict ? 5 : 8) && current; level++) {
            const visibleThumbnails = Array.from(current.querySelectorAll(strict ? SOURCE_BROWSER_TEXT_IMG_ALT_H_NH_NH_TH : SOURCE_BROWSER_TEXT_IMG_SRC_DATA_TESTID_ATTACHMENT_I)).filter((node) => {
              const element = node as HTMLElement;
              const rect = element.getBoundingClientRect();
              const style = window.getComputedStyle(element);
              return style.visibility !== SOURCE_TEXT_HIDDEN && style.display !== SOURCE_TEXT_NONE && rect.width >= 20 && rect.height >= 20 && rect.width <= 220 && rect.height <= 220;
            }).length;
            if (visibleThumbnails > 0) return visibleThumbnails;
            current = current.parentElement;
          }
          return 0;
        },
        { payload: strictFlow, texts: { SOURCE_BROWSER_TEXT_IMG_ALT_H_NH_NH_TH, SOURCE_BROWSER_TEXT_IMG_SRC_DATA_TESTID_ATTACHMENT_I, SOURCE_TEXT_HIDDEN, SOURCE_TEXT_NONE } },
      )
      .catch(() => SecurityConstants.ZERO);
    return _.max(strictFlow ? [composerThumbnailCount] : [legacyCollectionCount, genericPreviewCount, removeButtonCount, composerThumbnailCount]) || SecurityConstants.ZERO;
  }
  const visibilityChecks = await Promise.all(
    _.map(files, async (file) =>
      page
        .getByRole(SOURCE_TEXT_IMG, { name: new RegExp(_.escapeRegExp(file.name), SOURCE_TEXT_I_2) })
        .last()
        .isVisible()
        .catch(() => false),
    ),
  );
  const namedImageCount = _.compact(visibilityChecks).length;
  const attachmentPreviewCount = await page
    .locator(PROVIDER_REFERENCE_UPLOAD_CONFIG.ATTACHMENT_PREVIEW)
    .count()
    .catch(() => SecurityConstants.ZERO);
  return _.max([namedImageCount, attachmentPreviewCount]) || SecurityConstants.ZERO;
};
const uploadProviderCharacterReferences = async (page: Page, referenceImages: string[] | undefined, provider: "flow" | "grok", referenceImageNames?: string[], requireReferenceReady = false): Promise<void> => {
  const selectedReferences = _.chain(_.castArray(referenceImages || []))
    .map((image, index) => (_.isString(image) ? { image, name: _.toString(_.get(referenceImageNames, index, REFACTOR_CONSTANTS.VD_EMPTY_STRING)) } : undefined))
    .compact()
    .uniqBy(SOURCE_TEXT_IMAGE)
    .take(GEMINI_CHAT_VIDEO_INPUT_CONFIG.MAX_REFERENCE_IMAGES)
    .value();
  const normalizedReferences = _.map(selectedReferences, SOURCE_TEXT_IMAGE);
  const normalizedReferenceNames = _.map(selectedReferences, SOURCE_TEXT_NAME);
  const signatureMap = _.isEqual(provider, SOURCE_TEXT_FLOW) ? flowReferenceSignatureMap : grokReferenceSignatureMap;
  const rawReferenceFiles = createGeminiReferenceFiles(normalizedReferences, normalizedReferenceNames);
  if (!_.isEqual(rawReferenceFiles.length, normalizedReferences.length)) throw createAppError(createReferenceUploadMessage(PROVIDER_REFERENCE_UPLOAD_MESSAGES.READ_FAILED, provider));
  const referenceFiles = _.uniqBy(rawReferenceFiles, SOURCE_TEXT_NAME);
  const nextSignature = createReferenceSignature(referenceFiles);
  const existingPreviewCount = await countAttachedProviderReferences(page, provider, referenceFiles, requireReferenceReady);
  if (!requireReferenceReady && _.isEqual(signatureMap.get(page), nextSignature) && (_.isEmpty(normalizedReferences) || _.gte(existingPreviewCount, normalizedReferences.length))) return;
  await removeProviderReferenceAttachments(page);
  if (_.isEmpty(normalizedReferences)) {
    signatureMap.set(page, nextSignature);
    return;
  }
  let attachmentResult = _.isEqual(provider, SOURCE_TEXT_FLOW) ? await attachFlowReferenceFiles(page, referenceFiles, requireReferenceReady) : await attachGrokReferenceFiles(page, referenceFiles);
  if (!attachmentResult.attached && _.isEqual(attachmentResult.uploadedCount, SecurityConstants.ZERO)) {
    const uploadPattern = _.isEqual(provider, SOURCE_TEXT_FLOW) ? PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_UPLOAD_BUTTON : PROVIDER_REFERENCE_UPLOAD_CONFIG.GROK_UPLOAD_BUTTON;
    const uploadButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: uploadPattern }).last();
    if (await uploadButton.isVisible().catch(() => false)) {
      const fileChooser = await Promise.all([page.waitForEvent(SOURCE_TEXT_FILECHOOSER, { timeout: PROVIDER_REFERENCE_UPLOAD_CONFIG.FILE_CHOOSER_TIMEOUT_MS }).catch(() => null), uploadButton.click().catch(() => undefined)]).then(([chooser]) => chooser);
      if (fileChooser) {
        await fileChooser.setFiles(referenceFiles);
        attachmentResult = { attached: true, uploadedCount: referenceFiles.length };
      }
    }
  }
  if (!attachmentResult.attached) throw createAppError(createReferenceUploadMessage(PROVIDER_REFERENCE_UPLOAD_MESSAGES.CONTROL_MISSING, provider));
  if (requireReferenceReady) {
    const confirmed = await waitForFlowReferenceReadiness(
      referenceFiles.length,
      async () => ({
        count: await countAttachedProviderReferences(page, provider, referenceFiles, true),
        uploadPending: await page
          .locator(PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_ATTACHMENT_PENDING_SELECTOR)
          .filter({ visible: true })
          .count()
          .then((count) => count > 0)
          .catch(() => false),
      }),
      () => page.waitForTimeout(PROVIDER_REFERENCE_UPLOAD_CONFIG.POST_ACTION_DELAY_MS),
    );
    if (!confirmed) {
      await captureGeminiDomState(page, SOURCE_TEMPLATE_REFERENCE_NOT_READY(`${provider}`)).catch(() => undefined);
      throw createAppError(createReferenceUploadMessage(PROVIDER_REFERENCE_UPLOAD_MESSAGES.VERIFY_FAILED, provider));
    }
  } else {
    const verificationStartedAt = Date.now();
    let attachedCount = SecurityConstants.ZERO;
    while (_.lt(Date.now() - verificationStartedAt, PROVIDER_REFERENCE_UPLOAD_CONFIG.UPLOAD_VERIFY_TIMEOUT_MS)) {
      attachedCount = await countAttachedProviderReferences(page, provider, referenceFiles);
      if (_.gte(attachedCount, referenceFiles.length)) break;
      await page.waitForTimeout(PROVIDER_REFERENCE_UPLOAD_CONFIG.POST_ACTION_DELAY_MS);
    }
    if (_.lt(attachedCount, referenceFiles.length)) {
      await captureGeminiDomState(page, SOURCE_TEMPLATE_REFERENCE_ATTACHED_WITHOUT_COUNT(`${provider}`)).catch(() => undefined);
    }
  }
  signatureMap.set(page, nextSignature);
  if (_.gt(attachmentResult.uploadedCount, SecurityConstants.ZERO)) {
    appLog(createReferenceUploadMessage(PROVIDER_REFERENCE_UPLOAD_MESSAGES.SUCCESS, provider, attachmentResult.uploadedCount));
  }
  const reusedCount = _.subtract(referenceFiles.length, attachmentResult.uploadedCount);
  if (_.gt(reusedCount, SecurityConstants.ZERO)) appLog(createReferenceUploadMessage(PROVIDER_REFERENCE_UPLOAD_MESSAGES.REUSED, provider, reusedCount));
};
const normalizeFlowProjectId = (projectId?: string): string => {
  const normalized = _.replace(_.defaultTo(projectId, XRT.EMPTY), /^projects\//, XRT.EMPTY).trim();
  return /^proj_/i.test(normalized) ? XRT.EMPTY : normalized;
};
export const isFlowProjectPageUrl = (value: string, projectId: string): boolean => {
  const normalizedValue = _.trim(value);
  if (!FLOW_DIRECT_VIDEO_CONFIG.PROJECT_URL_PATTERN.test(normalizedValue) || _.isEmpty(projectId)) return false;
  try {
    const pathname = new URL(normalizedValue).pathname.replace(/\/+$/, XRT.EMPTY);
    return new RegExp(SOURCE_TEMPLATE_PROJECT(`${_.escapeRegExp(projectId)}`), SOURCE_TEXT_I_2).test(pathname);
  } catch {
    return false;
  }
};
export const createFlowVideoConfigState = (visualConfig?: ImageGeneratorOptions["visualConfig"]): string =>
  jsonUtils.safeStringify({
    generateType: _.defaultTo(visualConfig?.generateType, GenerateType.Image),
    aspectRatio: _.defaultTo(visualConfig?.aspectRatio, AspectRatio.SixteenNine),
    generateCount: _.isEqual(visualConfig?.generateType, GenerateType.Video) ? FLOW_DIRECT_VIDEO_CONFIG.VIDEO_OUTPUT_COUNT : _.defaultTo(visualConfig?.generateCount, SecurityConstants.DEFAULT_AMOUNT),
    imageGeneratorEngine: _.defaultTo(visualConfig?.imageGeneratorEngine, ImageGeneratorEngine.Veo3),
    videoDuration: _.defaultTo(visualConfig?.videoDuration, FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_DURATION),
    videoResolution: _.defaultTo(visualConfig?.videoResolution, FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_RESOLUTION),
    hasReferences: !_.isEmpty(visualConfig?.referenceImages) || !_.isEmpty(visualConfig?.referenceCharacterNames),
  });
export const createFlowDurationOptionPattern = (duration?: string): RegExp => {
  const seconds = _.replace(_.defaultTo(duration, FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_DURATION), /[^0-9.]/g, XRT.EMPTY);
  return new RegExp(SOURCE_TEMPLATE_SCHEDULE_S_S_S_SEC_OND(`${_.escapeRegExp(seconds)}`), SOURCE_TEXT_I_2);
};
export const isFlowVideoConfigSummaryMatching = (summary: string, visualConfig?: ImageGeneratorOptions["visualConfig"]): boolean => {
  const normalizedSummary = _.replace(_.trim(summary), /\s+/g, SRT.SOURCE_TEXT_SYMBOL_52);
  const normalizedSettings = normalizeVideoModelSettings(_.defaultTo(visualConfig?.imageGeneratorEngine, ImageGeneratorEngine.Veo3), { duration: visualConfig?.videoDuration, resolution: visualConfig?.videoResolution, aspectRatio: visualConfig?.aspectRatio as AspectRatio }, !_.isEmpty(visualConfig?.referenceImages) || !_.isEmpty(visualConfig?.referenceCharacterNames));
  const visibleResolution = _.trim(normalizedSummary.match(/(?:360|720)p/i)?.[0] || XRT.EMPTY);
  const visibleDuration = _.trim(normalizedSummary.match(/\d+\s*(?:s|sec(?:ond)?s?|giây)/i)?.[0] || XRT.EMPTY);
  const visibleAspectRatio = _.trim(normalizedSummary.match(/\d+\s*:\s*\d+/)?.[0] || XRT.EMPTY);
  const resolutionMatches = _.isEmpty(visibleResolution) || _.isEqual(_.lowerCase(visibleResolution), _.lowerCase(normalizedSettings.resolution));
  const aspectRatioMatches = _.isEmpty(visibleAspectRatio) || _.isEqual(_.replace(visibleAspectRatio, /\s+/g, XRT.EMPTY), _.replace(_.toString(normalizedSettings.aspectRatio), /\s+/g, XRT.EMPTY));
  return /Video/i.test(normalizedSummary) && resolutionMatches && aspectRatioMatches && createFlowDurationOptionPattern(normalizedSettings.duration).test(visibleDuration) && /(?:^|\s|·)(?:1x|x1)(?:$|\s|·)/i.test(normalizedSummary);
};
const findFlowChoice = (root: Locator, pattern: RegExp): Locator => root.locator(SOURCE_TEXT_ROLE_RADIO_ROLE_TAB_ROLE_OPTION).filter({ hasText: pattern }).last();
const selectFlowChoice = async (root: Locator, pattern: RegExp): Promise<Locator | null> => {
  const choice = findFlowChoice(root, pattern);
  if (!(await choice.isVisible().catch(() => false))) return null;
  const alreadySelected = await choice
    .evaluate(
      (element, browserPayload) => {
        const { SOURCE_BROWSER_TEXT_ARIA_CHECKED, SOURCE_TEXT_ARIA_SELECTED, SOURCE_TEXT_ARIA_PRESSED, SOURCE_TEXT_TRUE } = browserPayload.texts;
        return [element.getAttribute(SOURCE_BROWSER_TEXT_ARIA_CHECKED), element.getAttribute(SOURCE_TEXT_ARIA_SELECTED), element.getAttribute(SOURCE_TEXT_ARIA_PRESSED)].some((value) => value === SOURCE_TEXT_TRUE);
      },
      { payload: undefined, texts: { SOURCE_BROWSER_TEXT_ARIA_CHECKED, SOURCE_TEXT_ARIA_SELECTED, SOURCE_TEXT_ARIA_PRESSED, SOURCE_TEXT_TRUE } },
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
      .evaluate(
        (element, browserPayload) => {
          const { SOURCE_BROWSER_TEXT_SYMBOL } = browserPayload.texts;
          element.scrollTop = element.scrollHeight;
          const scrollables = Array.from(element.querySelectorAll(SOURCE_BROWSER_TEXT_SYMBOL)).filter((node) => {
            const htmlNode = node as HTMLElement;
            return htmlNode.scrollHeight > htmlNode.clientHeight;
          }) as HTMLElement[];
          scrollables.forEach((node) => {
            node.scrollTop = node.scrollHeight;
          });
        },
        { payload: undefined, texts: { SOURCE_BROWSER_TEXT_SYMBOL } },
      )
      .catch(() => {});
    await page.waitForTimeout(400);
    const continueButton = dialog
      .locator(SOURCE_TEXT_BUTTON)
      .filter({ hasText: /Tiếp tục|Continue|Bắt đầu|Get started|Đã hiểu|Got it|Next|Tiếp theo|Đồng ý|Agree/i })
      .last();
    const closeButton = dialog.locator(SOURCE_TEXT_BUTTON_ARIA_LABEL_CLOSE_I_BUTTON).last();
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
      const locator = page.locator(SOURCE_TEMPLATE_VISIBLE(`${selector}`)).last();
      if (await locator.isVisible().catch(() => false)) return locator;
    }
    await page.waitForTimeout(750);
  } while (Date.now() < deadline);
  return null;
};
const readFlowPromptInput = async (input: Locator): Promise<string> =>
  input
    .evaluate(
      (element, browserData) => {
        const { XRT } = browserData.studioTexts;
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return element.value;
        return (element as HTMLElement).innerText || element.textContent || XRT.EMPTY;
      },
      { studioTexts: { XRT: { EMPTY: XRT.EMPTY } } },
    )
    .catch(() => XRT.EMPTY);
export const normalizeFlowPromptValue = (value: string): string => _.trim(_.replace(_.replace(_.toString(value).normalize(SOURCE_TEXT_NFKC), /[\u200B-\u200D\u2060\uFEFF]/g, XRT.EMPTY), /\s+/g, SRT.SOURCE_TEXT_SYMBOL_52));
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
  await page.keyboard.press(SOURCE_TEXT_CONTROL_A);
  await page.keyboard.press(SOURCE_TEXT_BACKSPACE);
  await page.keyboard.insertText(prompt);
  return waitForFlowPromptApplied(page, input, prompt);
};
export const isFlowProjectUnavailableState = (url: string, pageText: string): boolean => FLOW_DIRECT_VIDEO_CONFIG.PROJECT_ERROR_URL_PATTERN.test(_.trim(url)) || FLOW_DIRECT_VIDEO_CONFIG.PROJECT_ERROR_HEADING.test(pageText);
export const isSharedChromeFlowLoginRequiredState = (url: string, expectedProjectId?: string): boolean => {
  const normalizedUrl = _.trim(url);
  if (_.isEmpty(expectedProjectId) || isFlowProjectPageUrl(normalizedUrl, expectedProjectId)) return false;
  return _.startsWith(normalizedUrl, EXTERNAL_URLS.GOOGLE_ACCOUNTS) || _.startsWith(normalizedUrl, EXTERNAL_URLS.GOOGLE_LABS) || /^https:\/\/flow\.google\.com\/(?:about)?(?:[?#]|$)/i.test(normalizedUrl);
};
const throwIfSharedChromeFlowLoginRequired = async (browserSession: BrowserSession, expectedProjectId?: string): Promise<void> => {
  if (!browserSession.preserveExternalPages) return;
  const loginButtonVisible = await browserSession.page
    .getByRole(SOURCE_TEXT_BUTTON, { name: /Đăng nhập|Log in|Sign in/i })
    .first()
    .isVisible()
    .catch(() => false);
  if (loginButtonVisible || isSharedChromeFlowLoginRequiredState(browserSession.page.url(), expectedProjectId)) {
    throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.SHARED_CHROME_LOGIN_REQUIRED_ERROR);
  }
};
const isFlowProjectUnavailable = async (page: Page): Promise<boolean> => {
  await page.waitForLoadState(FLOW_DIRECT_VIDEO_CONFIG.PAGE_READY_LOAD_STATE, { timeout: FLOW_DIRECT_VIDEO_CONFIG.CONFIG_VERIFY_TIMEOUT_MS }).catch(() => undefined);
  const currentUrl = page.url();
  if (FLOW_DIRECT_VIDEO_CONFIG.PROJECT_ERROR_URL_PATTERN.test(currentUrl)) return true;
  const errorHeadingVisible = await page
    .getByRole(SOURCE_TEXT_HEADING, { name: FLOW_DIRECT_VIDEO_CONFIG.PROJECT_ERROR_HEADING })
    .last()
    .isVisible()
    .catch(() => false);
  if (errorHeadingVisible) return true;
  const pageText = await page
    .locator(FLOW_DIRECT_VIDEO_CONFIG.PROJECT_BODY_SELECTOR)
    .innerText({ timeout: FLOW_DIRECT_VIDEO_CONFIG.CONFIG_VERIFY_TIMEOUT_MS })
    .catch(() => XRT.EMPTY);
  return isFlowProjectUnavailableState(currentUrl, pageText);
};
const parseConfiguredVideoDuration = (duration?: string): number => {
  const parsed = _.toNumber(_.replace(_.defaultTo(duration, FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_DURATION), /[^0-9.]/g, XRT.EMPTY));
  return _.gt(parsed, 0) ? parsed : _.toNumber(_.replace(FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_DURATION, /[^0-9.]/g, XRT.EMPTY));
};
interface FlowDownloadedVideo {
  buffer: Buffer;
  mimeType: string;
  mediaUrl: string;
}
export const normalizeFlowMediaId = (value: string): string => _.defaultTo(_.toString(value).match(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_ID_PATTERN)?.[0], _.trim(value));
export const createFlowMediaRedirectUrl = (mediaId: string): string => new URL(_.replace(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_REDIRECT_PATH, FLOW_VIDEO_MEDIA_CONFIG.MEDIA_ID_TOKEN, encodeURIComponent(normalizeFlowMediaId(mediaId))), EXTERNAL_URLS.GOOGLE_LABS).href;
export const extractFlowMediaIdFromUrl = (mediaUrl: string): string => {
  try {
    const parsedUrl = new URL(mediaUrl, EXTERNAL_URLS.GOOGLE_LABS);
    const namedMediaIds = _.toString(parsedUrl.searchParams.get(SOURCE_TEXT_NAME)).match(new RegExp(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_ID_PATTERN.source, SOURCE_TEXT_GI));
    const namedMediaId = _.last(namedMediaIds);
    if (namedMediaId) return namedMediaId;
    const editMediaId = parsedUrl.pathname.match(/\/edit\/([0-9a-f-]{36})(?:\/|$)/i)?.[1];
    if (editMediaId) return editMediaId;
    const mediaIds = mediaUrl.match(new RegExp(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_ID_PATTERN.source, SOURCE_TEXT_GI));
    return _.defaultTo(_.last(mediaIds), XRT.EMPTY);
  } catch {
    const mediaIds = mediaUrl.match(new RegExp(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_ID_PATTERN.source, SOURCE_TEXT_GI));
    return _.defaultTo(_.last(mediaIds), XRT.EMPTY);
  }
};
export const isReliableFlowVideoResponseUrl = (responseUrl: string): boolean => {
  try {
    const parsedUrl = new URL(responseUrl, EXTERNAL_URLS.GOOGLE_LABS);
    const hasNamedMediaId = FLOW_VIDEO_MEDIA_CONFIG.MEDIA_ID_PATTERN.test(_.toString(parsedUrl.searchParams.get(SOURCE_TEXT_NAME)));
    const isEditMediaUrl = /\/edit\/[0-9a-f-]{36}(?:\/|$)/i.test(parsedUrl.pathname);
    const isDirectVideoUrl = /\.(?:mp4|webm|mov)(?:$|[?#])/i.test(responseUrl) || /flow-content\.google\/video\//i.test(responseUrl);
    return hasNamedMediaId || isEditMediaUrl || isDirectVideoUrl;
  } catch {
    return false;
  }
};
const findFlowMediaCard = async (page: Page, mediaId: string): Promise<Locator | null> => {
  const normalizedMediaId = normalizeFlowMediaId(mediaId);
  const mediaCandidates = page.locator(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_CARD_SOURCE_SELECTOR);
  const mediaCandidateCount = await mediaCandidates.count();
  for (let index = _.subtract(mediaCandidateCount, SecurityConstants.DEFAULT_AMOUNT); index >= SecurityConstants.ZERO; index--) {
    const candidate = mediaCandidates.nth(index);
    const candidateUrl = _.toString(await candidate.getAttribute(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_SOURCE_ATTRIBUTE).catch(() => null));
    if (!_.includes(candidateUrl, normalizedMediaId)) continue;
    const mediaCard = candidate.locator(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_CARD_XPATH);
    if (_.gt(await mediaCard.count(), SecurityConstants.ZERO)) return mediaCard;
  }
  return null;
};
const throwIfFlowMediaCardRejected = async (page: Page, mediaId: string): Promise<void> => {
  const resultContainer = await findFlowMediaCard(page, mediaId);
  const containerText = resultContainer ? await resultContainer.textContent().catch(() => SecurityConstants.EMPTY_STRING) : SecurityConstants.EMPTY_STRING;
  if (FLOW_DIRECT_VIDEO_CONFIG.GENERATION_FAILURE_PATTERN.test(containerText)) {
    throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.GENERATION_REJECTED_ERROR);
  }
};
const waitForFlowMediaCardReady = async (page: Page, mediaId: string, timeoutMs = FLOW_VIDEO_MEDIA_CONFIG.GENERATION_TIMEOUT_MS): Promise<Locator> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await throwIfFlowMediaCardRejected(page, mediaId);
    const resultContainer = await findFlowMediaCard(page, mediaId);
    if (resultContainer && (await resultContainer.isVisible().catch(() => false))) {
      const state = await resultContainer
        .evaluate(
          (element, browserPayload) => {
            const { XRT } = browserPayload.studioTexts;
            const { SOURCE_BROWSER_TEXT_ARIA_BUSY, SOURCE_TEXT_TRUE, SOURCE_BROWSER_TEXT_DATA_STATE, SOURCE_BROWSER_TEXT_LOADING, SOURCE_BROWSER_TEXT_ROLE_PROGRESSBAR_PROGRESS_ARIA_VALUENOW, SOURCE_TEXT_IMG } = browserPayload.texts;
            const mediaConfig = browserPayload.payload;
            const video = element.querySelector(mediaConfig.videoSelector) as HTMLVideoElement | null;
            const videoSource = video?.currentSrc || video?.getAttribute(mediaConfig.sourceAttribute) || video?.querySelector(mediaConfig.nestedSourceSelector)?.getAttribute(mediaConfig.sourceAttribute) || XRT.EMPTY;
            const videoReady = Boolean(video && videoSource && video.readyState >= mediaConfig.readyStateMinimum && Number.isFinite(video.duration) && video.duration && video.videoWidth && video.videoHeight);
            return {
              busy: element.getAttribute(SOURCE_BROWSER_TEXT_ARIA_BUSY) === SOURCE_TEXT_TRUE || element.getAttribute(SOURCE_BROWSER_TEXT_DATA_STATE) === SOURCE_BROWSER_TEXT_LOADING,
              hasProgress: Boolean(element.querySelector(SOURCE_BROWSER_TEXT_ROLE_PROGRESSBAR_PROGRESS_ARIA_VALUENOW)),
              text: element.textContent || XRT.EMPTY,
              videoReady,
              thumbnailReady: Array.from(element.querySelectorAll(SOURCE_TEXT_IMG)).some((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0),
            };
          },
          {
            payload: { nestedSourceSelector: FLOW_VIDEO_MEDIA_CONFIG.MEDIA_NESTED_SOURCE_SELECTOR, readyStateMinimum: FLOW_VIDEO_MEDIA_CONFIG.VIDEO_READY_STATE_MINIMUM, sourceAttribute: FLOW_VIDEO_MEDIA_CONFIG.MEDIA_SOURCE_ATTRIBUTE, videoSelector: FLOW_VIDEO_MEDIA_CONFIG.MEDIA_VIDEO_SELECTOR },
            texts: { SOURCE_BROWSER_TEXT_ARIA_BUSY, SOURCE_TEXT_TRUE, SOURCE_BROWSER_TEXT_DATA_STATE, SOURCE_BROWSER_TEXT_LOADING, SOURCE_BROWSER_TEXT_ROLE_PROGRESSBAR_PROGRESS_ARIA_VALUENOW, SOURCE_TEXT_IMG },
            studioTexts: { XRT: { EMPTY: XRT.EMPTY } },
          },
        )
        .catch(() => null);
      if (state?.videoReady) return resultContainer;
      const hasProgressText = FLOW_VIDEO_MEDIA_CONFIG.PROGRESS_TEXT_PATTERN.test(_.defaultTo(state?.text, XRT.EMPTY));
      const cardSettled = Boolean(state?.thumbnailReady && !state.busy && !state.hasProgress && !hasProgressText);
      const hasCompletionSignal = Boolean(FLOW_VIDEO_MEDIA_CONFIG.COMPLETION_TEXT_PATTERN.test(_.defaultTo(state?.text, XRT.EMPTY)) || cardSettled);
      if (state?.thumbnailReady && hasCompletionSignal && !state.busy && !state.hasProgress && !hasProgressText) return resultContainer;
    }
    await page.waitForTimeout(FLOW_VIDEO_MEDIA_CONFIG.READY_POLL_INTERVAL_MS);
  }
  throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR);
};
const downloadFlowVideoFromCard = async (page: Page, mediaCard: Locator, previousVideoSources: string[], expectedDurationSeconds: number, mediaId: string): Promise<FlowDownloadedVideo | null> => {
  await mediaCard.scrollIntoViewIfNeeded();
  await mediaCard.hover().catch(() => undefined);
  const cardVideo = mediaCard.locator(SOURCE_TEXT_VIDEO_2).first();
  const sourceDeadline = _.add(Date.now(), FLOW_VIDEO_MEDIA_CONFIG.RECOVERY_READY_TIMEOUT_MS);
  while (_.lt(Date.now(), sourceDeadline)) {
    const sourceReady = await cardVideo
      .evaluate(
        (video: HTMLVideoElement, browserPayload) => {
          const { SOURCE_BROWSER_TEXT_SRC, SOURCE_BROWSER_TEXT_SOURCE } = browserPayload.texts;
          return Boolean(video.currentSrc || video.getAttribute(SOURCE_BROWSER_TEXT_SRC) || video.querySelector(SOURCE_BROWSER_TEXT_SOURCE)?.getAttribute(SOURCE_BROWSER_TEXT_SRC));
        },
        { payload: undefined, texts: { SOURCE_BROWSER_TEXT_SRC, SOURCE_BROWSER_TEXT_SOURCE } },
      )
      .catch(() => false);
    if (sourceReady) break;
    await page.waitForTimeout(FLOW_VIDEO_MEDIA_CONFIG.READY_POLL_INTERVAL_MS);
  }
  const readyVideoUrls = await collectFlowVideoUrls(page, mediaId);
  return downloadValidatedVideo(
    page.context(),
    _.filter(readyVideoUrls, (url) => !_.includes(previousVideoSources, url)),
    expectedDurationSeconds,
  ).catch(() => null);
};
const getFlowVideoEditIds = async (page: Page): Promise<string[]> =>
  page.evaluate(
    (browserPayload) => {
      const { XRT } = browserPayload.studioTexts;
      const { SOURCE_BROWSER_TEXT_A_HREF_EDIT, SOURCE_TEXT_HREF, SOURCE_BROWSER_TEXT_EDIT, SOURCE_BROWSER_TEXT_SYMBOL_2, SOURCE_TEXT_I_2 } = browserPayload.texts;
      const mediaIdPatternSource = browserPayload.payload;
      const projectId = location.pathname.match(/\/project\/([^/]+)/)?.[1] || XRT.EMPTY;
      return Array.from(document.querySelectorAll(SOURCE_BROWSER_TEXT_A_HREF_EDIT))
        .map((link) => link.getAttribute(SOURCE_TEXT_HREF)?.match(new RegExp(`${SOURCE_BROWSER_TEXT_EDIT}${mediaIdPatternSource}${SOURCE_BROWSER_TEXT_SYMBOL_2}`, SOURCE_TEXT_I_2))?.[1] || XRT.EMPTY)
        .filter((mediaId) => Boolean(mediaId) && mediaId !== projectId);
    },
    { payload: FLOW_VIDEO_MEDIA_CONFIG.MEDIA_ID_PATTERN.source, texts: { SOURCE_BROWSER_TEXT_A_HREF_EDIT, SOURCE_TEXT_HREF, SOURCE_BROWSER_TEXT_EDIT, SOURCE_BROWSER_TEXT_SYMBOL_2, SOURCE_TEXT_I_2 }, studioTexts: { XRT: { EMPTY: XRT.EMPTY } } },
  );
interface FlowGeneratedMediaCandidate {
  editId?: string | null;
  videoSrc?: string | null;
  thumbnailSrc?: string | null;
  promptText?: string | null;
  evidence?: "dom" | "network";
  discoveryOrder?: number;
}
interface FlowGeneratedMediaBatch {
  media: FlowGeneratedMediaCandidate[];
  rejected: boolean;
  timedOut: boolean;
}
const collectNewFlowGeneratedMedia = async (page: Page, oldEditIds: string[], oldVideoSources: string[], oldVideoThumbnailSources: string[], responseUrls: string[]): Promise<FlowGeneratedMediaCandidate[]> => {
  await page.evaluate(SOURCE_TEXT_GLOBALTHIS_NAME_GLOBALTHIS_NAME_TARGET_TARGET).catch(() => undefined);
  const domCandidates = await page.evaluate(
    (browserPayload) => {
      const { XRT, SRT } = browserPayload.studioTexts;
      const {
        SOURCE_TEXT_I_2,
        SOURCE_BROWSER_TEXT_ARIA_LABEL_TITLE_DATA_PROMPT,
        SOURCE_TEXT_ARIA_LABEL,
        SOURCE_TEXT_TITLE,
        SOURCE_BROWSER_TEXT_DATA_PROMPT,
        SOURCE_BROWSER_TEXT_ARIA_BUSY,
        SOURCE_TEXT_TRUE,
        SOURCE_BROWSER_TEXT_DATA_STATE,
        SOURCE_BROWSER_TEXT_LOADING,
        SOURCE_BROWSER_TEXT_ROLE_PROGRESSBAR_PROGRESS_ARIA_VALUENOW,
        SOURCE_TEXT_VIDEO_2,
        SOURCE_BROWSER_TEXT_SRC,
        SOURCE_BROWSER_TEXT_SOURCE,
        SOURCE_TEXT_DOM,
        SOURCE_TEXT_HREF,
        SOURCE_BROWSER_TEXT_FLOW_GRID_TILE_CONTAINER,
        SOURCE_TEXT_BUTTON,
      } = browserPayload.texts;
      const { completionTextPatternSource, editLinkSelector, editPathMarker, mediaIdPatternSource, oldEditIds: previousEditIds, oldVideoSources: previousVideoSources, oldVideoThumbnailSources: previousThumbnailSources, thumbnailSelector, videoSelector } = browserPayload.payload;
      const candidates = new Map<string, FlowGeneratedMediaCandidate>();
      const projectId = location.pathname.match(/\/project\/([^/]+)/)?.[1] || XRT.EMPTY;
      const extractMediaId = (value: string): string => value.match(new RegExp(mediaIdPatternSource, SOURCE_TEXT_I_2))?.[0] || XRT.EMPTY;
      const readPromptEvidence = (mediaCard: Element | null): string => {
        if (!mediaCard) return XRT.EMPTY;
        const labelledElements = Array.from(mediaCard.querySelectorAll(SOURCE_BROWSER_TEXT_ARIA_LABEL_TITLE_DATA_PROMPT));
        return [
          mediaCard.textContent || XRT.EMPTY,
          mediaCard.getAttribute(SOURCE_TEXT_ARIA_LABEL) || XRT.EMPTY,
          mediaCard.getAttribute(SOURCE_TEXT_TITLE) || XRT.EMPTY,
          mediaCard.getAttribute(SOURCE_BROWSER_TEXT_DATA_PROMPT) || XRT.EMPTY,
          ...labelledElements.flatMap((element) => [element.getAttribute(SOURCE_TEXT_ARIA_LABEL) || XRT.EMPTY, element.getAttribute(SOURCE_TEXT_TITLE) || XRT.EMPTY, element.getAttribute(SOURCE_BROWSER_TEXT_DATA_PROMPT) || XRT.EMPTY]),
        ].join(SRT.SOURCE_TEXT_SYMBOL_52);
      };
      const isCompletedMediaCard = (mediaCard: Element | null): boolean => {
        if (!mediaCard) return false;
        const text = mediaCard.textContent || XRT.EMPTY;
        const busy = mediaCard.getAttribute(SOURCE_BROWSER_TEXT_ARIA_BUSY) === SOURCE_TEXT_TRUE || mediaCard.getAttribute(SOURCE_BROWSER_TEXT_DATA_STATE) === SOURCE_BROWSER_TEXT_LOADING;
        const hasProgress = Boolean(mediaCard.querySelector(SOURCE_BROWSER_TEXT_ROLE_PROGRESSBAR_PROGRESS_ARIA_VALUENOW)) || /(?:^|\s)\d{1,3}\s*%(?:\s|$)/.test(text);
        const video = mediaCard.querySelector(SOURCE_TEXT_VIDEO_2) as HTMLVideoElement | null;
        const hasVideoSource = Boolean(video?.currentSrc || video?.getAttribute(SOURCE_BROWSER_TEXT_SRC) || video?.querySelector(SOURCE_BROWSER_TEXT_SOURCE)?.getAttribute(SOURCE_BROWSER_TEXT_SRC));
        const hasReadyThumbnail = Array.from(mediaCard.querySelectorAll(thumbnailSelector)).some((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0);
        return !busy && !hasProgress && (hasVideoSource || (hasReadyThumbnail && new RegExp(completionTextPatternSource, SOURCE_TEXT_I_2).test(text)));
      };
      const addCandidate = (candidate: FlowGeneratedMediaCandidate): void => {
        const mediaId = candidate.editId || extractMediaId(candidate.videoSrc || XRT.EMPTY) || extractMediaId(candidate.thumbnailSrc || XRT.EMPTY);
        const key = mediaId || candidate.videoSrc || candidate.thumbnailSrc || XRT.EMPTY;
        if (!key || mediaId === projectId || previousEditIds.includes(mediaId)) return;
        candidates.set(key, { ...candidates.get(key), ...candidate, editId: mediaId || candidate.editId, evidence: SOURCE_TEXT_DOM, discoveryOrder: candidates.size });
      };
      Array.from(document.querySelectorAll(editLinkSelector)).forEach((link) => {
        const href = link.getAttribute(SOURCE_TEXT_HREF) || XRT.EMPTY;
        const editId = href.split(editPathMarker).pop() || XRT.EMPTY;
        const mediaCard = link.closest(SOURCE_BROWSER_TEXT_FLOW_GRID_TILE_CONTAINER) || link.closest(SOURCE_TEXT_BUTTON) || link.parentElement;
        const container = link.closest(SOURCE_TEXT_BUTTON) || mediaCard;
        const completionPattern = new RegExp(completionTextPatternSource, SOURCE_TEXT_I_2);
        if (editId && !previousEditIds.includes(editId) && isCompletedMediaCard(mediaCard) && (completionPattern.test(container?.textContent || XRT.EMPTY) || Boolean(mediaCard?.querySelector(thumbnailSelector)))) {
          addCandidate({ editId, promptText: readPromptEvidence(mediaCard) });
        }
      });
      Array.from(document.querySelectorAll(videoSelector)).forEach((element) => {
        const video = element as HTMLVideoElement;
        const videoSrc = video.currentSrc || video.getAttribute(SOURCE_BROWSER_TEXT_SRC) || video.querySelector(SOURCE_BROWSER_TEXT_SOURCE)?.getAttribute(SOURCE_BROWSER_TEXT_SRC) || XRT.EMPTY;
        const mediaCard = video.closest(SOURCE_BROWSER_TEXT_FLOW_GRID_TILE_CONTAINER) || video.closest(SOURCE_TEXT_BUTTON) || video.parentElement;
        if (videoSrc && !previousVideoSources.includes(videoSrc) && isCompletedMediaCard(mediaCard)) {
          addCandidate({ videoSrc, promptText: readPromptEvidence(mediaCard) });
        }
      });
      Array.from(document.querySelectorAll(thumbnailSelector)).forEach((element) => {
        const image = element as HTMLImageElement;
        const thumbnailSrc = image.currentSrc || image.getAttribute(SOURCE_BROWSER_TEXT_SRC) || XRT.EMPTY;
        const mediaCard = image.closest(SOURCE_BROWSER_TEXT_FLOW_GRID_TILE_CONTAINER) || image.closest(SOURCE_TEXT_BUTTON) || image.parentElement;
        if (thumbnailSrc && !previousThumbnailSources.includes(thumbnailSrc) && isCompletedMediaCard(mediaCard)) {
          addCandidate({ thumbnailSrc, promptText: readPromptEvidence(mediaCard) });
        }
      });
      return Array.from(candidates.values());
    },
    {
      payload: {
        completionTextPatternSource: FLOW_VIDEO_MEDIA_CONFIG.COMPLETION_TEXT_PATTERN.source,
        editLinkSelector: FLOW_VIDEO_MEDIA_CONFIG.MEDIA_EDIT_LINK_SELECTOR,
        editPathMarker: FLOW_VIDEO_MEDIA_CONFIG.MEDIA_EDIT_PATH_MARKER,
        mediaIdPatternSource: FLOW_VIDEO_MEDIA_CONFIG.MEDIA_ID_PATTERN.source,
        oldEditIds,
        oldVideoSources,
        oldVideoThumbnailSources,
        thumbnailSelector: FLOW_VIDEO_MEDIA_CONFIG.MEDIA_VIDEO_THUMBNAIL_SELECTOR,
        videoSelector: FLOW_VIDEO_MEDIA_CONFIG.MEDIA_VIDEO_SELECTOR,
      },
      texts: {
        SOURCE_TEXT_I_2,
        SOURCE_BROWSER_TEXT_ARIA_LABEL_TITLE_DATA_PROMPT,
        SOURCE_TEXT_ARIA_LABEL,
        SOURCE_TEXT_TITLE,
        SOURCE_BROWSER_TEXT_DATA_PROMPT,
        SOURCE_BROWSER_TEXT_ARIA_BUSY,
        SOURCE_TEXT_TRUE,
        SOURCE_BROWSER_TEXT_DATA_STATE,
        SOURCE_BROWSER_TEXT_LOADING,
        SOURCE_BROWSER_TEXT_ROLE_PROGRESSBAR_PROGRESS_ARIA_VALUENOW,
        SOURCE_TEXT_VIDEO_2,
        SOURCE_BROWSER_TEXT_SRC,
        SOURCE_BROWSER_TEXT_SOURCE,
        SOURCE_TEXT_DOM,
        SOURCE_TEXT_HREF,
        SOURCE_BROWSER_TEXT_FLOW_GRID_TILE_CONTAINER,
        SOURCE_TEXT_BUTTON,
      },
      studioTexts: { XRT: { EMPTY: XRT.EMPTY }, SRT: { SOURCE_TEXT_SYMBOL_52: SRT.SOURCE_TEXT_SYMBOL_52 } },
    },
  );
  const candidatesByMediaId = new Map<string, FlowGeneratedMediaCandidate>();
  const currentProjectId = normalizeFlowProjectId(page.url().match(/\/project\/([^/?#]+)/)?.[1]);
  _.forEach(domCandidates, (candidate, discoveryOrder) => {
    const mediaId = normalizeFlowMediaId(_.toString(candidate.editId || extractFlowMediaIdFromUrl(candidate.videoSrc || XRT.EMPTY) || extractFlowMediaIdFromUrl(candidate.thumbnailSrc || XRT.EMPTY)));
    if (_.isEqual(mediaId, currentProjectId) || (_.isEmpty(mediaId) && _.isEmpty(candidate.videoSrc) && _.isEmpty(candidate.thumbnailSrc)) || _.includes(oldEditIds, mediaId)) return;
    const candidateKey = mediaId || _.toString(candidate.videoSrc || candidate.thumbnailSrc);
    candidatesByMediaId.set(candidateKey, { ...candidatesByMediaId.get(candidateKey), ...candidate, editId: mediaId || undefined, evidence: SOURCE_TEXT_DOM, discoveryOrder });
  });
  _.forEach(responseUrls, (responseUrl) => {
    if (!isReliableFlowVideoResponseUrl(responseUrl)) return;
    const mediaId = normalizeFlowMediaId(extractFlowMediaIdFromUrl(responseUrl));
    if (_.isEmpty(mediaId) || _.isEqual(mediaId, currentProjectId) || _.includes(oldEditIds, mediaId)) return;
    const existingCandidate = candidatesByMediaId.get(mediaId);
    candidatesByMediaId.set(mediaId, { ...existingCandidate, editId: mediaId, videoSrc: /flow-content\.google\/video\//i.test(responseUrl) ? responseUrl : existingCandidate?.videoSrc, evidence: existingCandidate?.evidence || SOURCE_TEXT_NETWORK, discoveryOrder: _.defaultTo(existingCandidate?.discoveryOrder, candidatesByMediaId.size) });
  });
  return _.orderBy(Array.from(candidatesByMediaId.values()), [(candidate) => !_.isEqual(candidate.evidence, SOURCE_TEXT_DOM), SOURCE_TEXT_DISCOVERYORDER], [SOURCE_TEXT_ASC, SOURCE_TEXT_ASC]);
};
const waitForFlowGeneratedMediaBatch = async (page: Page, oldEditIds: string[], oldVideoSources: string[], oldVideoThumbnailSources: string[], oldGenerationFailureCount: number, responseUrls: string[], expectedOutputCount: number = FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT): Promise<FlowGeneratedMediaBatch> => {
  const deadline = _.add(Date.now(), FLOW_VIDEO_MEDIA_CONFIG.GENERATION_TIMEOUT_MS);
  let media: FlowGeneratedMediaCandidate[] = [];
  while (_.lt(Date.now(), deadline)) {
    media = await collectNewFlowGeneratedMedia(page, oldEditIds, oldVideoSources, oldVideoThumbnailSources, responseUrls);
    const confirmedDomMedia = _.filter(media, (candidate) => _.isEqual(candidate.evidence, SOURCE_TEXT_DOM));
    if (_.gte(_.size(confirmedDomMedia), expectedOutputCount)) {
      return { media: _.take(confirmedDomMedia, expectedOutputCount), rejected: false, timedOut: false };
    }
    const failureCount = await page.evaluate(
      (browserPayload) => {
        const { XRT } = browserPayload.studioTexts;
        const { SOURCE_TEXT_GI } = browserPayload.texts;
        const generationFailurePatternSource = browserPayload.payload;
        return (document.body?.innerText || XRT.EMPTY).match(new RegExp(generationFailurePatternSource, SOURCE_TEXT_GI))?.length || 0;
      },
      { payload: FLOW_DIRECT_VIDEO_CONFIG.GENERATION_FAILURE_PATTERN.source, texts: { SOURCE_TEXT_GI }, studioTexts: { XRT: { EMPTY: XRT.EMPTY } } },
    );
    const newFailureCount = _.max([SecurityConstants.ZERO, _.subtract(failureCount, oldGenerationFailureCount)])!;
    if (_.gte(_.add(_.size(confirmedDomMedia), newFailureCount), expectedOutputCount)) {
      return { media: confirmedDomMedia, rejected: _.gt(newFailureCount, SecurityConstants.ZERO), timedOut: false };
    }
    await page.waitForTimeout(FLOW_VIDEO_MEDIA_CONFIG.READY_POLL_INTERVAL_MS);
  }
  return { media, rejected: false, timedOut: true };
};
const resolveFlowGeneratedMediaDetails = async (page: Page, media: FlowGeneratedMediaCandidate[], flowProjectId: string): Promise<FlowGeneratedMediaCandidate[]> => {
  const projectUrl = SOURCE_TEMPLATE_SYMBOL(`${EXTERNAL_URLS.GOOGLE_LABS_FLOW}`, `${flowProjectId}`);
  const resolved: FlowGeneratedMediaCandidate[] = [];
  for (const candidate of media) {
    const existingId = normalizeFlowMediaId(_.toString(candidate.editId || extractFlowMediaIdFromUrl(candidate.videoSrc || XRT.EMPTY)));
    if (existingId) {
      resolved.push(candidate);
      continue;
    }
    const source = _.toString(candidate.videoSrc || candidate.thumbnailSrc);
    const cardIndex = await page.evaluate(
      (browserPayload) => {
        const { SOURCE_BROWSER_TEXT_VIDEO_IMG_SOURCE, SOURCE_BROWSER_TEXT_SRC } = browserPayload.texts;
        const { selector, targetSource } = browserPayload.payload;
        return Array.from(document.querySelectorAll(selector)).findIndex((card) => Array.from(card.querySelectorAll(SOURCE_BROWSER_TEXT_VIDEO_IMG_SOURCE)).some((element) => (element as HTMLVideoElement).currentSrc === targetSource || element.getAttribute(SOURCE_BROWSER_TEXT_SRC) === targetSource));
      },
      { payload: { selector: FLOW_VIDEO_MEDIA_CONFIG.MEDIA_CARD_SELECTOR, targetSource: source }, texts: { SOURCE_BROWSER_TEXT_VIDEO_IMG_SOURCE, SOURCE_BROWSER_TEXT_SRC } },
    );
    if (cardIndex < 0) {
      resolved.push(candidate);
      continue;
    }
    try {
      const card = page.locator(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_CARD_SELECTOR).nth(cardIndex);
      await card.hover().catch(() => undefined);
      await card
        .locator(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_VIDEO_SELECTOR)
        .first()
        .waitFor({ state: SOURCE_TEXT_ATTACHED, timeout: FLOW_DIRECT_VIDEO_CONFIG.CONFIG_VERIFY_TIMEOUT_MS })
        .catch(() => undefined);
      const videoSrc = await card
        .locator(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_VIDEO_SELECTOR)
        .first()
        .evaluate(
          (video: HTMLVideoElement, browserPayload) => {
            const { XRT } = browserPayload.studioTexts;
            const { SOURCE_BROWSER_TEXT_SRC } = browserPayload.texts;
            return video.currentSrc || video.getAttribute(SOURCE_BROWSER_TEXT_SRC) || XRT.EMPTY;
          },
          { payload: undefined, texts: { SOURCE_BROWSER_TEXT_SRC }, studioTexts: { XRT: { EMPTY: XRT.EMPTY } } },
        )
        .catch(() => XRT.EMPTY);
      await card.locator(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_CARD_OPEN_SELECTOR).click();
      await page.waitForURL(FLOW_VIDEO_MEDIA_CONFIG.EDITOR_URL_PATTERN, { timeout: FLOW_VIDEO_MEDIA_CONFIG.RECOVERY_READY_TIMEOUT_MS });
      const editId = extractFlowMediaIdFromUrl(page.url());
      const promptText = await page
        .locator(FLOW_VIDEO_MEDIA_CONFIG.EDITOR_PROMPT_SELECTOR)
        .first()
        .textContent({ timeout: FLOW_VIDEO_MEDIA_CONFIG.RECOVERY_READY_TIMEOUT_MS })
        .catch(() => null);
      resolved.push({ ...candidate, editId, videoSrc: videoSrc || candidate.videoSrc, promptText: promptText || candidate.promptText });
    } catch {
      resolved.push(candidate);
    } finally {
      await page.goto(projectUrl, { waitUntil: FLOW_DIRECT_VIDEO_CONFIG.PAGE_READY_LOAD_STATE, timeout: FLOW_VIDEO_MEDIA_CONFIG.DOWNLOAD_TIMEOUT_MS }).catch(() => undefined);
      await page
        .locator(FLOW_VIDEO_MEDIA_CONFIG.MEDIA_CARD_SELECTOR)
        .first()
        .waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: FLOW_VIDEO_MEDIA_CONFIG.RECOVERY_READY_TIMEOUT_MS })
        .catch(() => undefined);
    }
  }
  return resolved;
};
export interface FlowVideoRecoveryOptions {
  flowProjectId: string;
  mediaId: string;
  sourceUrl?: string;
  expectedDuration?: string;
  chromeHeadless?: boolean;
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
    browserInstance = await getOrLaunchGlobalBrowser(options.chromeHeadless, true);
    const page = browserInstance.page;
    const targetUrl = SOURCE_TEMPLATE_SYMBOL(`${EXTERNAL_URLS.GOOGLE_LABS_FLOW}`, `${flowProjectId}`);
    if (!isFlowProjectPageUrl(page.url(), flowProjectId) || _.includes(page.url(), SOURCE_TEXT_EDIT)) {
      await page.goto(targetUrl, { waitUntil: SOURCE_TEXT_DOMCONTENTLOADED, timeout: FLOW_VIDEO_MEDIA_CONFIG.DOWNLOAD_TIMEOUT_MS });
    }
    await throwIfSharedChromeFlowLoginRequired(browserInstance, flowProjectId);
    await dismissFlowOnboarding(page);
    if (await isFlowProjectUnavailable(page)) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR);
    await throwIfFlowMediaCardRejected(page, mediaId);
    const expectedDurationSeconds = parseConfiguredVideoDuration(options.expectedDuration);
    let downloadedVideo: FlowDownloadedVideo | null = null;
    if (options.sourceUrl && FLOW_VIDEO_MEDIA_CONFIG.HTML_VIDEO_URL_PATTERN.test(options.sourceUrl)) {
      downloadedVideo = await downloadValidatedVideo(browserInstance.context, [options.sourceUrl], expectedDurationSeconds).catch(() => null);
    }
    const mediaCard = downloadedVideo ? null : await waitForFlowMediaCardReady(page, mediaId, FLOW_VIDEO_MEDIA_CONFIG.RECOVERY_READY_TIMEOUT_MS).catch(() => null);
    if (mediaCard) downloadedVideo = await downloadFlowVideoFromCard(page, mediaCard, [], expectedDurationSeconds, mediaId);
    const projectMediaUrls = downloadedVideo ? [] : await collectFlowVideoUrls(page, mediaId);
    if (!downloadedVideo) downloadedVideo = await downloadValidatedVideo(browserInstance.context, projectMediaUrls, expectedDurationSeconds).catch(() => null);
    if (!downloadedVideo) {
      const directMediaUrl = createFlowMediaRedirectUrl(mediaId);
      downloadedVideo = await downloadValidatedVideo(browserInstance.context, [directMediaUrl], expectedDurationSeconds, FLOW_VIDEO_MEDIA_CONFIG.RECOVERY_REDIRECT_TIMEOUT_MS).catch(() => null);
    }
    if (!downloadedVideo) downloadedVideo = await downloadFlowVideoFromEditor(page, flowProjectId, mediaId, expectedDurationSeconds);
    if (!downloadedVideo) throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR);
    return { success: true, base64: downloadedVideo.buffer.toString(REFACTOR_CONSTANTS.ENCODING_BASE64), fallbackUrl: SecurityConstants.EMPTY_STRING, remoteMediaId: mediaId, remoteMediaCreated: true };
  } catch (error) {
    return { success: false, base64: null, fallbackUrl: SecurityConstants.EMPTY_STRING, warning: getErrorMessage(error), remoteMediaId: mediaId, remoteMediaCreated: true };
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
    (browserPayload) => {
      const { XRT } = browserPayload.studioTexts;
      const { SOURCE_BROWSER_TEXT_BLOB, SOURCE_BROWSER_TEXT_SRC, SOURCE_TEXT_HREF, SOURCE_BROWSER_TEXT_DATA_SRC, SOURCE_BROWSER_TEXT_DATA_URL, SOURCE_BROWSER_TEXT_RESOURCE, SOURCE_TEXT_I_2 } = browserPayload.texts;
      const { downloadableUrlPatternSource, mediaApiPathMarker, mediaSourceSelector, targetMediaId } = browserPayload.payload;
      const normalizeMediaUrl = (value: string | null | undefined): string => {
        if (!value || value.startsWith(SOURCE_BROWSER_TEXT_BLOB)) return XRT.EMPTY;
        try {
          const absoluteUrl = new URL(value, window.location.origin).href;
          const firstApiPathIndex = absoluteUrl.indexOf(mediaApiPathMarker);
          const finalApiPathIndex = absoluteUrl.lastIndexOf(mediaApiPathMarker);
          return finalApiPathIndex > firstApiPathIndex ? new URL(absoluteUrl.slice(finalApiPathIndex), window.location.origin).href : absoluteUrl;
        } catch {
          return XRT.EMPTY;
        }
      };
      const elementUrls = Array.from(document.querySelectorAll(mediaSourceSelector))
        .flatMap((element) => [(element as HTMLVideoElement).currentSrc, element.getAttribute(SOURCE_BROWSER_TEXT_SRC), element.getAttribute(SOURCE_TEXT_HREF), element.getAttribute(SOURCE_BROWSER_TEXT_DATA_SRC), element.getAttribute(SOURCE_BROWSER_TEXT_DATA_URL)])
        .map(normalizeMediaUrl)
        .filter(Boolean);
      const resourceUrls = performance.getEntriesByType(SOURCE_BROWSER_TEXT_RESOURCE).map((entry) => normalizeMediaUrl(entry.name));
      const downloadableUrlPattern = new RegExp(downloadableUrlPatternSource, SOURCE_TEXT_I_2);
      return [...elementUrls, ...resourceUrls].filter((url) => downloadableUrlPattern.test(url) && (!targetMediaId || url.includes(targetMediaId)));
    },
    {
      payload: { downloadableUrlPatternSource: FLOW_VIDEO_MEDIA_CONFIG.DOWNLOADABLE_URL_PATTERN.source, mediaApiPathMarker: FLOW_VIDEO_MEDIA_CONFIG.MEDIA_API_PATH_MARKER, mediaSourceSelector: FLOW_VIDEO_MEDIA_CONFIG.MEDIA_SOURCE_SELECTOR, targetMediaId: mediaId || null },
      texts: { SOURCE_BROWSER_TEXT_BLOB, SOURCE_BROWSER_TEXT_SRC, SOURCE_TEXT_HREF, SOURCE_BROWSER_TEXT_DATA_SRC, SOURCE_BROWSER_TEXT_DATA_URL, SOURCE_BROWSER_TEXT_RESOURCE, SOURCE_TEXT_I_2 },
      studioTexts: { XRT: { EMPTY: XRT.EMPTY } },
    },
  );
  const normalizedDirectUrl = (() => {
    try {
      return directVideoSrc ? new URL(directVideoSrc, EXTERNAL_URLS.GOOGLE_LABS).href : XRT.EMPTY;
    } catch {
      return XRT.EMPTY;
    }
  })();
  return _.uniq(_.compact([normalizedDirectUrl, ...pageUrls]));
};
const downloadValidatedVideo = async (context: BrowserContext, urls: string[], expectedDurationSeconds: number, timeoutMs = FLOW_VIDEO_MEDIA_CONFIG.DOWNLOAD_TIMEOUT_MS): Promise<FlowDownloadedVideo> => {
  for (const mediaUrl of urls) {
    try {
      const response = await context.request.get(mediaUrl, { timeout: timeoutMs });
      if (!response.ok()) continue;
      const buffer = await response.body();
      await inspectGeneratedVideoBuffer(buffer, expectedDurationSeconds);
      const responseMimeType = _.defaultTo(response.headers()[SOURCE_TEXT_CONTENT_TYPE_2], XRT.EMPTY);
      return { buffer, mimeType: _.startsWith(responseMimeType, SOURCE_TEXT_VIDEO_3) ? responseMimeType : SOURCE_TEXT_VIDEO_MP4, mediaUrl };
    } catch (error) {}
  }
  throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR);
};
const downloadFlowVideoFromEditor = async (page: Page, flowProjectId: string, mediaId: string, expectedDurationSeconds: number): Promise<FlowDownloadedVideo | null> => {
  const projectUrl = SOURCE_TEMPLATE_SYMBOL(`${EXTERNAL_URLS.GOOGLE_LABS_FLOW}`, `${flowProjectId}`);
  try {
    await page.goto(SOURCE_TEMPLATE_EDIT(`${projectUrl}`, `${mediaId}`), { waitUntil: FLOW_DIRECT_VIDEO_CONFIG.PAGE_READY_LOAD_STATE, timeout: FLOW_VIDEO_MEDIA_CONFIG.DOWNLOAD_TIMEOUT_MS });
    await page.locator(FLOW_VIDEO_MEDIA_CONFIG.EDITOR_PROMPT_SELECTOR).first().waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: FLOW_VIDEO_MEDIA_CONFIG.RECOVERY_READY_TIMEOUT_MS });
    const downloadPromise = page.waitForEvent(SOURCE_TEXT_DOWNLOAD, { timeout: FLOW_VIDEO_MEDIA_CONFIG.EDITOR_DOWNLOAD_TIMEOUT_MS }).catch(() => null);
    await page.locator(FLOW_VIDEO_MEDIA_CONFIG.EDITOR_DOWNLOAD_BUTTON_SELECTOR).first().click();
    await page.locator(FLOW_VIDEO_MEDIA_CONFIG.EDITOR_DOWNLOAD_MENU_ITEM_SELECTOR).filter({ hasText: FLOW_VIDEO_MEDIA_CONFIG.EDITOR_ORIGINAL_DOWNLOAD_PATTERN }).first().click();
    const download = await downloadPromise;
    if (!download) return null;
    const downloadedPath = await download.path();
    if (!downloadedPath) return null;
    const buffer = await fs.promises.readFile(downloadedPath);
    await inspectGeneratedVideoBuffer(buffer, expectedDurationSeconds);
    return { buffer, mimeType: SOURCE_TEXT_VIDEO_MP4, mediaUrl: download.url() };
  } catch {
    return null;
  } finally {
    if (!isFlowProjectPageUrl(page.url(), flowProjectId) || _.includes(page.url(), SOURCE_TEXT_EDIT)) {
      await page.goto(projectUrl, { waitUntil: FLOW_DIRECT_VIDEO_CONFIG.PAGE_READY_LOAD_STATE, timeout: FLOW_VIDEO_MEDIA_CONFIG.DOWNLOAD_TIMEOUT_MS }).catch(() => undefined);
    }
  }
};
const approveFlowVideoCreditPrompt = async (page: Page, submitButton: Locator, timeoutMs: number = 15000): Promise<boolean> => {
  const approveWithoutAskingPattern = /^(?:Phê duyệt,\s*không hỏi lại|Approve,?\s*(?:do not|don't) ask again|Approve,?\s*don't show again)$/i;
  const approveOncePattern = /^(?:Phê duyệt|Approve)$/i;
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const approveWithoutAsking = page.getByText(approveWithoutAskingPattern, { exact: true }).last();
    if (await approveWithoutAsking.isVisible().catch(() => false)) {
      await approveWithoutAsking.click({ force: true });
      appLog(FLOW_AUTOMATION_MESSAGES.FLOW_APPROVED_COST_PERSIST);
      await page.waitForTimeout(500);
      return true;
    }
    const approveOnce = page.getByText(approveOncePattern, { exact: true }).last();
    if (await approveOnce.isVisible().catch(() => false)) {
      await approveOnce.click({ force: true });
      appLog(FLOW_AUTOMATION_MESSAGES.FLOW_APPROVED_COST);
      await page.waitForTimeout(500);
      return true;
    }
    if (Date.now() - startedAt > 1000) {
      const generationStarted = await submitButton
        .evaluate(
          (button, browserPayload) => {
            const { SOURCE_BROWSER_TEXT_DISABLED, SOURCE_TEXT_ARIA_DISABLED, SOURCE_TEXT_TRUE } = browserPayload.texts;
            return button.hasAttribute(SOURCE_BROWSER_TEXT_DISABLED) || button.getAttribute(SOURCE_TEXT_ARIA_DISABLED) === SOURCE_TEXT_TRUE;
          },
          { payload: undefined, texts: { SOURCE_BROWSER_TEXT_DISABLED, SOURCE_TEXT_ARIA_DISABLED, SOURCE_TEXT_TRUE } },
        )
        .catch(() => false);
      if (generationStarted) return false;
    }
    await page.waitForTimeout(250);
  }
  return false;
};
const createFlowProject = async (page: Page): Promise<string> => {
  await page.goto(EXTERNAL_URLS.GOOGLE_LABS_FLOW_HOME, { waitUntil: SOURCE_TEXT_DOMCONTENTLOADED, timeout: 60000 });
  if (_.startsWith(page.url(), EXTERNAL_URLS.GOOGLE_ACCOUNTS)) {
    throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.SHARED_CHROME_LOGIN_REQUIRED_ERROR);
  }
  await dismissFlowOnboarding(page);
  let newProjectBtn = page.getByRole(SOURCE_TEXT_BUTTON, { name: /Dự án mới|New project/i }).first();
  if (!(await newProjectBtn.isVisible().catch(() => false))) {
    const launchFlow = page.getByText(/Create with Google Flow|Tạo bằng Google Flow/i, { exact: true }).first();
    if (await launchFlow.isVisible().catch(() => false)) {
      await Promise.all([page.waitForLoadState(SOURCE_TEXT_DOMCONTENTLOADED, { timeout: 60000 }).catch(() => {}), launchFlow.click()]);
      await page.waitForTimeout(1500);
      await dismissFlowOnboarding(page);
      newProjectBtn = page.getByRole(SOURCE_TEXT_BUTTON, { name: /Dự án mới|New project/i }).first();
    }
  }
  if (!(await newProjectBtn.isVisible().catch(() => false))) {
    await captureGeminiDomState(page, SOURCE_TEXT_FLOW_HOME_NEW_PROJECT_MISSING);
    await page.screenshot({ path: path.join(getDataDirectory(), SOURCE_TEXT_FLOW_HOME_NEW_PROJECT_MISSING_PNG), fullPage: true }).catch(() => {});
  }
  await newProjectBtn.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: 30000 });
  await newProjectBtn.click();
  await page.waitForURL(/\/project\/[a-zA-Z0-9-]+/, { timeout: 30000 });
  await page.waitForLoadState(SOURCE_TEXT_DOMCONTENTLOADED, { timeout: 30000 }).catch(() => {});
  const match = page.url().match(/\/project\/([a-zA-Z0-9-]+)/);
  if (!match?.[1]) throw createAppError(ImageGenMessages.LABS_CREATE_ERR);
  return match[1];
};
const replaceUnavailableFlowProject = async (page: Page): Promise<string> => {
  appLog(FLOW_DIRECT_VIDEO_CONFIG.PROJECT_UNAVAILABLE_LOG);
  const projectId = await createFlowProject(page);
  lastPlaywrightConfigState = null;
  flowReferenceSignatureMap.delete(page);
  appLog(FLOW_DIRECT_VIDEO_CONFIG.PROJECT_REPLACED_LOG.replace(SOURCE_TEXT_0_2, projectId));
  return projectId;
};
const configureFlowAgentSettings = async (page: Page, visualConfig?: ImageGeneratorOptions["visualConfig"]): Promise<boolean> => {
  const settingsButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_AGENT_UI_CONFIG.SETTINGS_BUTTON }).last();
  if (!(await settingsButton.isVisible().catch(() => false))) return false;
  await settingsButton.click();
  await page.waitForTimeout(FLOW_AGENT_UI_CONFIG.CONFIG_SETTLE_MS);
  const settingsTitle = page.getByText(FLOW_AGENT_UI_CONFIG.SETTINGS_TITLE, { exact: true }).last();
  if (!(await settingsTitle.isVisible().catch(() => false))) return false;
  const neverConfirm = page.getByRole(SOURCE_TEXT_RADIO, { name: FLOW_AGENT_UI_CONFIG.NEVER_CONFIRM }).first();
  if (await neverConfirm.isVisible().catch(() => false)) await neverConfirm.click();
  const isVideo = visualConfig?.generateType === GenerateType.Video;
  const targetRatio = _.defaultTo(visualConfig?.aspectRatio, AspectRatio.SixteenNine);
  const sectionTitle = page.getByText(isVideo ? FLOW_AGENT_UI_CONFIG.VIDEO_SECTION : FLOW_AGENT_UI_CONFIG.IMAGE_SECTION, { exact: true }).last();
  if (!(await sectionTitle.isVisible().catch(() => false))) return false;
  const section = sectionTitle.locator(SOURCE_TEXT_XPATH_FOLLOWING_SIBLING_1);
  const tabLists = section.getByRole(SOURCE_TEXT_TABLIST);
  const ratioTab = tabLists
    .first()
    .getByRole(SOURCE_TEXT_TAB, { name: new RegExp(SOURCE_TEMPLATE_CROP_S(`${_.escapeRegExp(targetRatio)}`), SOURCE_TEXT_I_2) })
    .first();
  if (!(await ratioTab.isVisible().catch(() => false))) return false;
  await ratioTab.click();
  const requestedCount = isVideo ? FLOW_DIRECT_VIDEO_CONFIG.VIDEO_OUTPUT_COUNT : _.clamp(_.defaultTo(visualConfig?.generateCount, SecurityConstants.DEFAULT_AMOUNT), SecurityConstants.DEFAULT_AMOUNT, 4);
  const countTab = tabLists
    .nth(1)
    .getByRole(SOURCE_TEXT_TAB, { name: new RegExp(SOURCE_TEMPLATE_X(`${requestedCount}`), SOURCE_TEXT_I_2) })
    .first();
  if (!(await countTab.isVisible().catch(() => false))) return false;
  await countTab.click();
  let selectedModelPattern: RegExp | undefined;
  if (isVideo) {
    const engine = _.defaultTo(visualConfig?.imageGeneratorEngine, ImageGeneratorEngine.Veo3);
    const targetEngine = engine === ImageGeneratorEngine.Veo3Lite ? FLOW_AGENT_UI_CONFIG.VEO_LITE_MODEL : engine === ImageGeneratorEngine.Veo3Fast ? FLOW_AGENT_UI_CONFIG.VEO_FAST_MODEL : engine === ImageGeneratorEngine.Veo3Quality ? FLOW_AGENT_UI_CONFIG.VEO_QUALITY_MODEL : FLOW_AGENT_UI_CONFIG.OMNI_MODEL;
    selectedModelPattern = targetEngine;
    const modelButton = page.locator(SOURCE_TEXT_BUTTON).filter({ hasText: FLOW_AGENT_UI_CONFIG.MODEL_PATTERN }).last();
    if (!(await modelButton.isVisible().catch(() => false))) return false;
    const currentModel = _.defaultTo(await modelButton.textContent(), XRT.EMPTY);
    if (!targetEngine.test(currentModel)) {
      await modelButton.click();
      const modelItem = page.getByRole(SOURCE_TEXT_MENUITEM, { name: targetEngine }).first();
      if (!(await modelItem.isVisible().catch(() => false))) return false;
      await modelItem.click();
    }
  }
  const ratioSelected = _.isEqual(await ratioTab.getAttribute(SOURCE_TEXT_ARIA_SELECTED), SOURCE_TEXT_TRUE);
  const countSelected = _.isEqual(await countTab.getAttribute(SOURCE_TEXT_ARIA_SELECTED), SOURCE_TEXT_TRUE);
  const modelSelected =
    !isVideo ||
    Boolean(
      selectedModelPattern?.test(
        _.defaultTo(
          await section
            .locator(SOURCE_TEXT_BUTTON)
            .filter({ hasText: FLOW_AGENT_UI_CONFIG.MODEL_PATTERN })
            .last()
            .textContent()
            .catch(() => XRT.EMPTY),
          XRT.EMPTY,
        ),
      ),
    );
  if (!ratioSelected || !countSelected || !modelSelected) return false;
  const saveButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_AGENT_UI_CONFIG.SAVE_BUTTON }).last();
  if (!(await saveButton.isVisible().catch(() => false))) return false;
  await saveButton.click();
  await page.waitForTimeout(FLOW_AGENT_UI_CONFIG.SAVE_SETTLE_MS);
  return !(await settingsTitle.isVisible().catch(() => false));
};
const configureFlowDirectVideoSettings = async (page: Page, visualConfig?: ImageGeneratorOptions["visualConfig"]): Promise<boolean> => {
  const agentButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: /^(?:Tác nhân|Agent)$/i }).last();
  if (_.isEqual(await agentButton.getAttribute(SOURCE_TEXT_ARIA_PRESSED).catch(() => null), SOURCE_TEXT_TRUE)) {
    await agentButton.click();
    await page.waitForTimeout(FLOW_AGENT_UI_CONFIG.CONFIG_SETTLE_MS);
  }
  const engine = _.defaultTo(visualConfig?.imageGeneratorEngine, ImageGeneratorEngine.Veo3);
  const normalizedSettings = normalizeVideoModelSettings(engine, { duration: visualConfig?.videoDuration, resolution: visualConfig?.videoResolution, aspectRatio: visualConfig?.aspectRatio as AspectRatio }, !_.isEmpty(visualConfig?.referenceImages) || !_.isEmpty(visualConfig?.referenceCharacterNames));
  if (!normalizedSettings.supportsReferences) throw createAppError(VIDEO_MODEL_CAPABILITY_CONFIG.REFERENCE_UNSUPPORTED_ERROR);
  const targetRatio = normalizedSettings.aspectRatio;
  const targetResolution = normalizedSettings.resolution;
  const targetDuration = normalizedSettings.duration;
  const targetRatioPattern = new RegExp(SOURCE_TEMPLATE_CROP_S_S(`${_.escapeRegExp(_.toString(targetRatio))}`), SOURCE_TEXT_I_2);
  const targetResolutionPattern = new RegExp(SOURCE_TEMPLATE_HD_S_S_INFO(`${_.escapeRegExp(_.toString(targetResolution))}`), SOURCE_TEXT_I_2);
  const targetDurationPattern = createFlowDurationOptionPattern(targetDuration);
  const targetEngine = engine === ImageGeneratorEngine.Veo3Lite ? FLOW_AGENT_UI_CONFIG.VEO_LITE_MODEL : engine === ImageGeneratorEngine.Veo3Fast ? FLOW_AGENT_UI_CONFIG.VEO_FAST_MODEL : engine === ImageGeneratorEngine.Veo3Quality ? FLOW_AGENT_UI_CONFIG.VEO_QUALITY_MODEL : FLOW_AGENT_UI_CONFIG.OMNI_MODEL;
  const configButton = page.locator(FLOW_DIRECT_VIDEO_CONFIG.CONFIG_BUTTON_SELECTOR).last();
  if (!(await configButton.isVisible().catch(() => false))) return false;
  const currentSummary = _.replace(_.defaultTo(await configButton.textContent().catch(() => XRT.EMPTY), XRT.EMPTY), /\s+/g, SRT.SOURCE_TEXT_SYMBOL_52);
  if (isFlowVideoConfigSummaryMatching(currentSummary, visualConfig)) return true;
  for (let attempt = 0; attempt < FLOW_DIRECT_VIDEO_CONFIG.CONFIG_APPLY_ATTEMPTS; attempt += 1) {
    await configButton.click();
    let menu = page.locator(FLOW_DIRECT_VIDEO_CONFIG.SETTINGS_PANEL).last();
    await menu.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: FLOW_DIRECT_VIDEO_CONFIG.CONFIG_VERIFY_TIMEOUT_MS }).catch(() => undefined);
    if (!(await menu.isVisible().catch(() => false))) return false;
    if (!(await selectFlowChoice(menu, FLOW_DIRECT_VIDEO_CONFIG.VIDEO_TAB))) return false;
    const modelButton = menu.getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_DIRECT_VIDEO_CONFIG.MODEL_BUTTON_LABEL }).last();
    if (!(await modelButton.isVisible().catch(() => false))) return false;
    if (!targetEngine.test(_.defaultTo(await modelButton.textContent(), XRT.EMPTY))) {
      await modelButton.click();
      const modelItem = page.locator(SOURCE_TEXT_ROLE_MENUITEM_ROLE_MENUITEMRADIO_ROLE_OPTION).filter({ hasText: targetEngine }).last();
      if (!(await modelItem.isVisible().catch(() => false))) return false;
      await modelItem.click({ force: true });
      await page.waitForTimeout(FLOW_AGENT_UI_CONFIG.CONFIG_SETTLE_MS);
      menu = page.locator(FLOW_DIRECT_VIDEO_CONFIG.SETTINGS_PANEL).last();
      await menu.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: FLOW_DIRECT_VIDEO_CONFIG.CONFIG_VERIFY_TIMEOUT_MS }).catch(() => undefined);
    }
    if (!_.isEmpty(visualConfig?.referenceImages) || !_.isEmpty(visualConfig?.referenceCharacterNames)) {
      await selectFlowChoice(menu, FLOW_DIRECT_VIDEO_CONFIG.COMPONENTS_TAB);
    }
    for (const pattern of [targetRatioPattern, targetResolutionPattern, targetDurationPattern, FLOW_DIRECT_VIDEO_CONFIG.VIDEO_OUTPUT_PATTERN]) {
      if (!(await selectFlowChoice(menu, pattern))) return false;
      await page.waitForTimeout(FLOW_AGENT_UI_CONFIG.CONFIG_SETTLE_MS);
    }
    const selectedModel = targetEngine.test(
      _.defaultTo(
        await menu
          .getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_DIRECT_VIDEO_CONFIG.MODEL_BUTTON_LABEL })
          .last()
          .textContent()
          .catch(() => XRT.EMPTY),
        XRT.EMPTY,
      ),
    );
    if (!selectedModel) {
      await page.keyboard.press(SOURCE_TEXT_ESCAPE).catch(() => undefined);
      continue;
    }
    await page.keyboard.press(SOURCE_TEXT_ESCAPE);
    await page.waitForTimeout(FLOW_AGENT_UI_CONFIG.CONFIG_SETTLE_MS);
    const appliedSummary = _.replace(_.defaultTo(await configButton.textContent().catch(() => XRT.EMPTY), XRT.EMPTY), /\s+/g, SRT.SOURCE_TEXT_SYMBOL_52);
    if (isFlowVideoConfigSummaryMatching(appliedSummary, visualConfig)) return true;
  }
  const finalSummary = _.replace(_.defaultTo(await configButton.textContent().catch(() => XRT.EMPTY), XRT.EMPTY), /\s+/g, SRT.SOURCE_TEXT_SYMBOL_52);
  return isFlowVideoConfigSummaryMatching(finalSummary, visualConfig);
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
  const chars = text.split(XRT.EMPTY);
  const pauseChars = [SRT.SOURCE_TEXT_SYMBOL_52, SOURCE_TEXT_SYMBOL_4, SOURCE_TEXT_SYMBOL_23];
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
  if (!url) return XRT.EMPTY;
  try {
    const baseUrl = _.startsWith(url, COMMON_STRINGS.SLASH_PREFIX) ? COMMON_STRINGS.RELATIVE_URL_PARSE_BASE : undefined;
    const u = new URL(url, baseUrl);
    let foundId: string = XRT.EMPTY;
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
export const browserGetImgIdSafeStr = SOURCE_TEMPLATE_FUNCTION_URL_IF_URL_RETURN_TRY(`${COMMON_STRINGS.SLASH_PREFIX}`, `${COMMON_STRINGS.RELATIVE_URL_PARSE_BASE}`, `${jsonUtils.safeStringify(URL_CONSTANTS.ID_PARAMS)}`, `${jsonUtils.safeStringify(URL_CONSTANTS.IGNORED_PARAMS)}`, `${IMAGE_ID_URL_REGEX.toString()}`);
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
export const geminiBatchMutex = new SimpleMutex();
const grokGenerationMutex = new SimpleMutex();
const geminiRequestPacingMutex = new SimpleMutex();
let nextGeminiRequestAt = SecurityConstants.ZERO;
const sanitizeNonNegativeInteger = (value: number | undefined): number => _.defaultTo(_.max([value, SecurityConstants.ZERO]), SecurityConstants.ZERO);
const getGeminiRetryBackoff = (attempt: number): number => {
  const retryIndex = sanitizeNonNegativeInteger(_.subtract(attempt, SecurityConstants.DEFAULT_AMOUNT));
  if (!_.gt(retryIndex, SecurityConstants.ZERO)) {
    return SecurityConstants.ZERO;
  }
  return _.defaultTo(_.min([_.multiply(GEMINI_CHAT_PACING_CONFIG.RETRY_BACKOFF_BASE_MS, GEMINI_CHAT_PACING_CONFIG.BACKOFF_MULTIPLIER ** retryIndex), GEMINI_CHAT_PACING_CONFIG.RETRY_BACKOFF_MAX_MS]), SecurityConstants.ZERO);
};
const getGeminiRequestWait = (attempt: number, now: number): number => _.sum([sanitizeNonNegativeInteger(_.subtract(nextGeminiRequestAt, now)), getGeminiRetryBackoff(attempt), _.random(GEMINI_CHAT_PACING_CONFIG.JITTER_MIN_MS, GEMINI_CHAT_PACING_CONFIG.JITTER_MAX_MS)]);
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
  forceNewPage?: boolean;
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
    referenceImageNames?: string[];
    referenceCharacterNames?: string[];
    preserveVideoAudio?: boolean;
  };
  sandboxConfig?: { localProjectId?: string; flowProjectId?: string; projectId?: string; knownVideoMediaIds?: string[] };
}
export interface ImageGeneratorResult {
  success: boolean;
  base64: string | null;
  base64s?: string[];
  fallbackUrl: string;
  fallbackUrls?: string[];
  warning?: string;
  newProjectId?: string;
  remoteMediaId?: string;
  remoteMediaIds?: string[];
  remoteVideoSourceUrl?: string;
  remoteMediaCreated?: boolean;
}
export interface FlowVideoPromptBatchItem {
  sceneId: string;
  prompt: string;
  referenceImages?: string[];
  referenceImageNames?: string[];
  referenceCharacterNames?: string[];
  requireReferenceReady?: boolean;
}
export interface FlowVideoPromptBatchOptions {
  items: FlowVideoPromptBatchItem[];
  visualConfig?: ImageGeneratorOptions["visualConfig"];
  sandboxConfig?: ImageGeneratorOptions["sandboxConfig"];
  retainBrowserSession?: boolean;
}
export interface FlowVideoPromptBatchResult extends ImageGeneratorResult {
  sceneId: string;
}
let lastUsedEmail: string | undefined = undefined;
const connectToSharedChromeBrowser = async (logConnectionError: boolean = true): Promise<BrowserSession | null> => {
  try {
    const browser = await chromium.connectOverCDP(EXTERNAL_URLS.PLAYWRIGHT_CDP);
    const context = _.first(browser.contexts());
    if (!context) return null;
    const existingPages = context.pages();
    const page = _.find(existingPages, (candidate) => FLOW_DIRECT_VIDEO_CONFIG.PROJECT_URL_PATTERN.test(candidate.url())) || _.find(existingPages, (candidate) => _.some([EXTERNAL_URLS.GOOGLE_LABS, EXTERNAL_URLS.GOOGLE_ACCOUNTS], (url) => _.startsWith(candidate.url(), url))) || _.first(existingPages) || (await context.newPage());
    appLog(FLOW_AUTOMATION_MESSAGES.FLOW_NO_ROTATING_ACCOUNT_FALLBACK);
    return { context, page, account: { email: SOURCE_TEXT_SHARED_CHROME_SESSION }, ownsContext: false, preserveExternalPages: true };
  } catch (error) {
    if (logConnectionError) appError(FLOW_AUTOMATION_MESSAGES.FLOW_CONNECT_PORT_FAILED, error);
    return null;
  }
};
let sharedChromeLaunchedByApp = false;
const launchSharedChromeBrowser = async (): Promise<BrowserSession | null> => {
  if (!_.isEqual(process.platform, SOURCE_TEXT_WIN32) || !fs.existsSync(REFACTOR_CONSTANTS.WINDOWS_CHROME_PATH)) return null;
  const sharedProfilePath = path.join(process.env.SystemDrive || SOURCE_TEXT_C, REFACTOR_CONSTANTS.SHARED_CHROME_PROFILE_DIR);
  spawn(
    REFACTOR_CONSTANTS.WINDOWS_CHROME_PATH,
    [
      _.replace(REFACTOR_CONSTANTS.CHROME_REMOTE_DEBUGGING_ARG, SOURCE_TEXT_0_2, _.toString(REFACTOR_CONSTANTS.SHARED_CHROME_DEBUG_PORT)),
      SOURCE_TEXT_REMOTE_ALLOW_ORIGINS,
      SOURCE_TEMPLATE_USER_DATA_DIR(`${sharedProfilePath}`),
      SOURCE_TEMPLATE_PROFILE_DIRECTORY(`${REFACTOR_CONSTANTS.SHARED_CHROME_PROFILE_NAME}`),
      REFACTOR_CONSTANTS.CHROME_NO_FIRST_RUN_ARG,
      REFACTOR_CONSTANTS.CHROME_NO_DEFAULT_BROWSER_ARG,
    ],
    { windowsHide: false, detached: true, stdio: SOURCE_TEXT_IGNORE },
  ).unref();
  for (let attempt = 0; attempt < REFACTOR_CONSTANTS.SHARED_CHROME_READY_ATTEMPTS; attempt += 1) {
    await delayAsync(REFACTOR_CONSTANTS.SHARED_CHROME_READY_INTERVAL_MS);
    const sharedBrowser = await connectToSharedChromeBrowser(false);
    if (sharedBrowser) {
      sharedChromeLaunchedByApp = true;
      return sharedBrowser;
    }
  }
  return null;
};
export async function launchBrowserForAccount(chromeHeadless?: boolean, preferSharedChrome: boolean = true): Promise<BrowserSession> {
  let attempts = 0;
  const maxAttempts = 3;
  let account: GoogleAccount | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  if (preferSharedChrome) {
    const sharedBrowser = (await connectToSharedChromeBrowser()) || (chromeHeadless === false ? await launchSharedChromeBrowser() : null);
    if (sharedBrowser) return sharedBrowser;
  }
  while (attempts < maxAttempts) {
    attempts++;
    account = await getNextAccount(lastUsedEmail);
    if (!account) {
      const sharedBrowser = (await connectToSharedChromeBrowser()) || (chromeHeadless === false ? await launchSharedChromeBrowser() : null);
      if (sharedBrowser) return sharedBrowser;
      throw new Error(REFACTOR_CONSTANTS.MSG_NO_ACC_AVAIL_CONFIG);
    }
    lastUsedEmail = account.email;
    const emailHash = crypto.createHash(REFACTOR_CONSTANTS.HASH_MD5).update(account.email).digest(REFACTOR_CONSTANTS.ENCODING_HEX);
    const profilePath = path.join(getDataDirectory(), REFACTOR_CONSTANTS.DIR_GOOGLE_PROFILES, `${REFACTOR_CONSTANTS.PROFILE_PREFIX}${emailHash}`);
    try {
      try {
        context = await chromium.launchPersistentContext(profilePath, { headless: chromeHeadless !== false, channel: SOURCE_TEXT_CHROME, ignoreDefaultArgs: [SOURCE_TEXT_ENABLE_AUTOMATION], args: [REFACTOR_CONSTANTS.ARG_NO_SANDBOX, REFACTOR_CONSTANTS.ARG_DISABLE_SETUID_SANDBOX, REFACTOR_CONSTANTS.ARG_DISABLE_AUTOMATION_CONTROLLED] });
      } catch (chromeErr) {
        context = await chromium.launchPersistentContext(profilePath, { headless: chromeHeadless !== false, ignoreDefaultArgs: [SOURCE_TEXT_ENABLE_AUTOMATION], args: [REFACTOR_CONSTANTS.ARG_NO_SANDBOX, REFACTOR_CONSTANTS.ARG_DISABLE_SETUID_SANDBOX, REFACTOR_CONSTANTS.ARG_DISABLE_AUTOMATION_CONTROLLED] });
      }
      page = context.pages()[0] || (await context.newPage());
      try {
        await page.addInitScript(SOURCE_TEXT_IF_TYPEOF_WINDOW_UNDEFINED_IF_WINDOW_2);
      } catch (e) {}
      await page.goto(EXTERNAL_URLS.GOOGLE_MY_ACCOUNT, { waitUntil: SOURCE_TEXT_DOMCONTENTLOADED, timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      const isLoggedIn = _.includes(currentUrl, REFACTOR_CONSTANTS.KEYWORD_MY_ACCOUNT);
      if (!isLoggedIn) {
        appLog(REFACTOR_CONSTANTS.MSG_NOT_LOGGED_IN.replace(SOURCE_TEXT_0_2, account.email));
        const loginSuccess = await autoLoginGoogle(page, account, chromeHeadless !== false);
        if (!loginSuccess) {
          throw new Error(REFACTOR_CONSTANTS.MSG_LOGIN_FAILED.replace(SOURCE_TEXT_0_2, account.email));
        }
      } else {
        appLog(REFACTOR_CONSTANTS.MSG_ALREADY_LOGGED_IN.replace(SOURCE_TEXT_0_2, account.email));
      }
      return { context, page, account, ownsContext: true };
    } catch (error: unknown) {
      appError(REFACTOR_CONSTANTS.MSG_LAUNCH_LOGIN_ERR.replace(SOURCE_TEXT_0_2, account.email).replace(SOURCE_TEXT_1_3, getErrorMessage(error)));
      if (context) {
        await context.close().catch(() => {});
      }
    }
  }
  const sharedBrowser = (await connectToSharedChromeBrowser()) || (chromeHeadless === false ? await launchSharedChromeBrowser() : null);
  if (sharedBrowser) return sharedBrowser;
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
const browserRetainers = new Set<symbol>();
export const retainGlobalBrowser = (): (() => void) => {
  const owner = Symbol();
  browserRetainers.add(owner);
  cancelGlobalBrowserCleanup();
  return () => browserRetainers.delete(owner);
};
const isSharedChromeRunning = async (): Promise<boolean> => {
  try {
    const response = await fetch(SOURCE_TEMPLATE_JSON_VERSION(`${EXTERNAL_URLS.LOCALHOST}`, `${REFACTOR_CONSTANTS.SHARED_CHROME_DEBUG_PORT}`), { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
};
const waitForSharedChromeExit = async (): Promise<boolean> => {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (!(await isSharedChromeRunning())) return true;
    await delayAsync(250);
  }
  return false;
};
export async function closeActiveBrowser() {
  if (activeBrowserTimeout) {
    clearTimeout(activeBrowserTimeout);
    activeBrowserTimeout = null;
  }
  if (activeBrowserInstance) {
    appLog(ImageGenMessages.RELEASING_GLOBAL_CHROME);
    try {
      if (activeBrowserInstance.preserveExternalPages) {
        const sharedSession = activeBrowserInstance;
        const hasOtherPages = _.some(sharedSession.context.pages(), (page) => !page.isClosed() && page !== sharedSession.page);
        if (sharedChromeLaunchedByApp && !hasOtherPages && activeFlowVideoGenerationCount === SecurityConstants.ZERO) {
          const page = sharedSession.page.isClosed() ? _.find(sharedSession.context.pages(), (candidate) => !candidate.isClosed()) || (await sharedSession.context.newPage().catch(() => undefined)) : sharedSession.page;
          if (page) {
            const cdp = await sharedSession.context.newCDPSession(page);
            await cdp.send(SOURCE_TEXT_BROWSER_CLOSE as any).catch(() => undefined);
            if (await waitForSharedChromeExit()) sharedChromeLaunchedByApp = false;
            else return;
          }
        } else if (sharedChromeLaunchedByApp) {
          appLog(FLOW_AUTOMATION_MESSAGES.FLOW_KEEP_SHARED_TABS);
          return;
        } else {
          appLog(FLOW_AUTOMATION_MESSAGES.FLOW_KEEP_SHARED_TABS);
        }
      } else if (activeBrowserInstance.ownsContext === false) {
        const geminiPages = _.filter(globalBatchPages, (page) => !page.isClosed() && !_.includes(page.url(), SOURCE_TEXT_GROK_COM));
        await Promise.allSettled(_.map(geminiPages, (page) => page.close()));
        if (!activeBrowserInstance.page.isClosed() && !_.includes(activeBrowserInstance.page.url(), SOURCE_TEXT_GROK_COM)) await activeBrowserInstance.page.close();
      } else {
        await activeBrowserInstance.context.close();
      }
    } catch (e) {}
    activeBrowserInstance = null;
  }
  activeBrowserHeadless = undefined;
}
export async function closeAppBrowserAfterTask(closeOrphanChatTabs: boolean = false): Promise<boolean> {
  if (browserRetainers.size) return false;
  if (activeBrowserLaunchPromise) await activeBrowserLaunchPromise.catch(() => undefined);
  if (_.gt(activeFlowVideoGenerationCount, SecurityConstants.ZERO) || _.some(globalBatchPages, (page) => !page.isClosed())) {
    scheduleGlobalBrowserCleanup();
    return false;
  }
  const session = activeBrowserInstance || (sharedChromeLaunchedByApp ? await connectToSharedChromeBrowser(false) : null);
  if (!session) return !(await isSharedChromeRunning());
  if (session.preserveExternalPages) {
    const isChatOrBlankPage = (page: Page): boolean => isDisposableChatBrowserUrl(page.url());
    const openPages = _.filter(session.context.pages(), (page) => !page.isClosed());
    const canCloseAttachedChatBrowser = closeOrphanChatTabs && openPages.length > 0 && _.every(openPages, isChatOrBlankPage);
    if (!sharedChromeLaunchedByApp && !canCloseAttachedChatBrowser) {
      await closeActiveBrowser();
      return false;
    }
    const otherPages = _.filter(session.context.pages(), (page) => !page.isClosed() && page !== session.page);
    if (otherPages.length) {
      const canCloseOrphanChatTabs = closeOrphanChatTabs && _.every(otherPages, isChatOrBlankPage);
      if (!canCloseOrphanChatTabs) {
        scheduleGlobalBrowserCleanup();
        return false;
      }
      await Promise.allSettled(_.map(otherPages, (page) => page.close()));
    }
    const page = session.page.isClosed() ? _.find(session.context.pages(), (candidate) => !candidate.isClosed()) || (await session.context.newPage().catch(() => undefined)) : session.page;
    if (!page) return false;
    try {
      const cdp = await session.context.newCDPSession(page);
      await cdp.send(SOURCE_TEXT_BROWSER_CLOSE as any).catch(() => undefined);
      if (!(await waitForSharedChromeExit())) {
        scheduleGlobalBrowserCleanup();
        return false;
      }
      activeBrowserInstance = null;
      sharedChromeLaunchedByApp = false;
      activeBrowserHeadless = undefined;
      if (activeBrowserTimeout) clearTimeout(activeBrowserTimeout);
      activeBrowserTimeout = null;
      return true;
    } catch (error) {
      if (await waitForSharedChromeExit()) {
        activeBrowserInstance = null;
        sharedChromeLaunchedByApp = false;
        activeBrowserHeadless = undefined;
        return true;
      }
      appError(SOURCE_TEMPLATE_CHROME_GRACEFUL_CLOSE_FAILED(`${_.toString(_.get(error, SOURCE_TEXT_MESSAGE, error))}`));
      scheduleGlobalBrowserCleanup();
      return false;
    }
  }
  await closeActiveBrowser();
  return true;
}
export async function closeIdleSharedChrome(): Promise<boolean> {
  if (browserRetainers.size) return false;
  if (_.gt(activeFlowVideoGenerationCount, SecurityConstants.ZERO) || _.some(globalBatchPages, (page) => !page.isClosed())) return false;
  if (!(await isSharedChromeRunning())) return true;
  const isIdlePage = (page: Page): boolean => isDisposableChatBrowserUrl(page.url());
  try {
    const browser = await chromium.connectOverCDP(EXTERNAL_URLS.PLAYWRIGHT_CDP);
    const pages = _.filter(
      _.flatMap(browser.contexts(), (context) => context.pages()),
      (page) => !page.isClosed(),
    );
    const busyPages = _.reject(pages, isIdlePage);
    if (busyPages.length) {
      appLog(BROWSER_LIFECYCLE_TEXTS.busyChromeRetained(_.map(busyPages, (page) => page.url()).join(BROWSER_LIFECYCLE_TEXTS.urlSeparator)));
      return false;
    }
    appLog(BROWSER_LIFECYCLE_TEXTS.idleChromeClosed);
    const cdp = await (browser as Browser).newBrowserCDPSession();
    await cdp.send(SOURCE_TEXT_BROWSER_CLOSE as any).catch(() => undefined);
  } catch {
    return false;
  }
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (!(await isSharedChromeRunning())) {
      activeBrowserInstance = null;
      sharedChromeLaunchedByApp = false;
      activeBrowserHeadless = undefined;
      return true;
    }
    await delayAsync(250);
  }
  return false;
}
export function cancelGlobalBrowserCleanup() {
  if (activeBrowserTimeout) clearTimeout(activeBrowserTimeout);
  activeBrowserTimeout = null;
}
export function scheduleGlobalBrowserCleanup() {
  if (activeBrowserTimeout) clearTimeout(activeBrowserTimeout);
  activeBrowserTimeout = null;
  if (browserRetainers.size) return;
  activeBrowserTimeout = setTimeout(async () => {
    if (browserRetainers.size) return;
    if (_.gt(activeFlowVideoGenerationCount, SecurityConstants.ZERO)) {
      scheduleGlobalBrowserCleanup();
      return;
    }
    appLog(ImageGenMessages.AUTO_RELEASE_CHROME_IDLE);
    await closeAppBrowserAfterTask();
  }, FLOW_VIDEO_MEDIA_CONFIG.GLOBAL_BROWSER_IDLE_TIMEOUT_MS);
}
export async function getOrLaunchGlobalBrowser(chromeHeadless?: boolean, preferSharedChrome: boolean = true): Promise<BrowserSession> {
  if (activeBrowserTimeout) {
    clearTimeout(activeBrowserTimeout);
    activeBrowserTimeout = null;
  }
  const requestedHeadless = chromeHeadless !== false;
  if (activeBrowserLaunchPromise) {
    const launchedBrowser = await activeBrowserLaunchPromise;
    if (preferSharedChrome && !launchedBrowser.preserveExternalPages && (await isSharedChromeRunning())) {
      await closeActiveBrowser();
    } else if (activeBrowserHeadless === requestedHeadless) {
      return launchedBrowser;
    }
  }
  if (activeBrowserInstance) {
    if (preferSharedChrome && !activeBrowserInstance.preserveExternalPages && (await isSharedChromeRunning())) {
      appLog(FLOW_AUTOMATION_MESSAGES.FLOW_SWITCH_TO_SHARED_CHROME);
      await closeActiveBrowser();
    } else if (!activeBrowserInstance.preserveExternalPages && activeBrowserHeadless !== requestedHeadless) {
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
    const launchedBrowser = await launchBrowserForAccount(chromeHeadless, preferSharedChrome);
    activeBrowserInstance = launchedBrowser;
    activeBrowserHeadless = requestedHeadless;
    try {
      launchedBrowser.context.on(SOURCE_TEXT_CLOSE_2, () => {
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
export interface FlowCharacterInput {
  id: string;
  name: string;
  prompt: string;
  info?: string;
}
export interface FlowCharacterCreationResult {
  id: string;
  name: string;
  success: boolean;
  warning?: string;
  imageUrl?: string;
}
export interface EnsureFlowCharactersOptions {
  characters: FlowCharacterInput[];
  projectId?: string;
  flowProjectId?: string;
  chromeHeadless?: boolean;
  language?: ProjectLanguage;
  retainBrowserSession?: boolean;
}
export interface EnsureFlowCharactersResult {
  success: boolean;
  newProjectId: string;
  characters: FlowCharacterCreationResult[];
  warning?: string;
}
const getFlowCharacterPageUrl = (projectId: string): string => SOURCE_TEMPLATE_SYMBOL_33(`${EXTERNAL_URLS.GOOGLE_LABS_FLOW}`, `${projectId}`, `${FLOW_CHARACTER_CONFIG.PAGE_PATH}`);
const getFlowProjectUrl = (projectId: string): string => SOURCE_TEMPLATE_SYMBOL(`${EXTERNAL_URLS.GOOGLE_LABS_FLOW}`, `${projectId}`);
const isFlowCharacterAvailable = async (page: Page, projectId: string, characterName: string): Promise<boolean> => {
  const projectUrl = getFlowProjectUrl(projectId).replace(/\/$/, XRT.EMPTY);
  const currentUrl = _.trimEnd(_.trim(page.url()), SOURCE_TEXT_SYMBOL);
  const isSameProjectPage = (() => {
    try {
      const expected = new URL(projectUrl);
      const current = new URL(currentUrl);
      return _.isEqual(expected.origin, current.origin) && _.isEqual(_.trimEnd(expected.pathname, SOURCE_TEXT_SYMBOL), _.trimEnd(current.pathname, SOURCE_TEXT_SYMBOL));
    } catch {
      return _.isEqual(currentUrl, projectUrl);
    }
  })();
  if (!isSameProjectPage) {
    await page.goto(projectUrl, { waitUntil: FLOW_DIRECT_VIDEO_CONFIG.PAGE_READY_LOAD_STATE, timeout: FLOW_CHARACTER_CONFIG.PAGE_TIMEOUT_MS });
  }
  await dismissFlowOnboarding(page);
  const projectCharacterNavigation = page.getByText(FLOW_CHARACTER_CONFIG.CHARACTER_FILTER, { exact: true }).first();
  if (await projectCharacterNavigation.isVisible().catch(() => false)) {
    await projectCharacterNavigation.click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(FLOW_CHARACTER_CONFIG.ACTION_DELAY_MS);
    if (
      await locateFlowCharacterCard(page, characterName)
        .isVisible()
        .catch(() => false)
    )
      return true;
  }
  if (!(await locateFlowPromptInput(page, FLOW_CHARACTER_CONFIG.PAGE_TIMEOUT_MS))) return false;
  if (!(await openFlowCharacterLibrary(page))) return false;
  const searchInput = page.getByPlaceholder(FLOW_CHARACTER_CONFIG.SEARCH_PLACEHOLDER).last();
  if (await searchInput.isVisible().catch(() => false)) await searchInput.fill(characterName);
  const available = await locateFlowCharacterCard(page, characterName)
    .isVisible()
    .catch(() => false);
  await page.keyboard.press(FLOW_CHARACTER_CONFIG.ESCAPE_KEY).catch(() => undefined);
  return available;
};
const locateFlowCharacterNameInput = (page: Page): Locator => page.getByLabel(FLOW_CHARACTER_CONFIG.NAME_LABEL).last().or(page.getByPlaceholder(FLOW_CHARACTER_CONFIG.NAME_PLACEHOLDER).last()).or(page.locator(SOURCE_TEXT_INPUT_TYPE_TEXT_VISIBLE).first()).first();
const finalizeFlowCharacterName = async (page: Page, characterName: string): Promise<boolean> => {
  if (!FLOW_CHARACTER_CONFIG.CHARACTER_DETAIL_URL_PATTERN.test(page.url())) return false;
  const editNameButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_CHARACTER_CONFIG.EDIT_NAME_BUTTON }).last();
  if (await editNameButton.isVisible().catch(() => false)) {
    await editNameButton.click().catch(() => undefined);
    await page.waitForTimeout(FLOW_CHARACTER_CONFIG.ACTION_DELAY_MS);
  }
  const nameInput = locateFlowCharacterNameInput(page);
  if (!(await nameInput.isVisible().catch(() => false))) return false;
  await nameInput.fill(characterName);
  await nameInput.press(FLOW_CHARACTER_CONFIG.NAME_COMMIT_KEY).catch(() => undefined);
  await nameInput.press(SOURCE_TEXT_TAB_2).catch(() => undefined);
  await page.waitForTimeout(FLOW_CHARACTER_CONFIG.ACTION_DELAY_MS);
  const value = _.trim(await readFlowPromptInput(nameInput));
  return _.isEqual(_.toLower(value), _.toLower(_.trim(characterName)));
};
const hasFlowCharacterImage = async (page: Page): Promise<boolean> =>
  Boolean(
    (await page
      .locator(FLOW_CHARACTER_CONFIG.GENERATED_CHARACTER_IMAGE_SELECTOR)
      .last()
      .isVisible()
      .catch(() => false)) ||
      (await page
        .getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_CHARACTER_CONFIG.CHARACTER_IMAGE_READY_BUTTON })
        .last()
        .isVisible()
        .catch(() => false)),
  );
const generateFlowCharacterPortrait = async (page: Page, characterPrompt: string): Promise<boolean> => {
  if (await hasFlowCharacterImage(page)) return true;
  const createPortraitButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_CHARACTER_CONFIG.CREATE_PORTRAIT_BUTTON }).last();
  if (await createPortraitButton.isVisible().catch(() => false)) {
    await createPortraitButton.click();
    await page.waitForTimeout(FLOW_CHARACTER_CONFIG.ACTION_DELAY_MS);
  }
  const promptInput = await locateFlowPromptInput(page, FLOW_CHARACTER_CONFIG.PAGE_TIMEOUT_MS);
  if (promptInput && !_.isEmpty(_.trim(characterPrompt))) {
    if (!(await replaceFlowPromptInput(page, promptInput, characterPrompt))) return false;
    const startButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_CHARACTER_CONFIG.START_GENERATION_BUTTON }).last();
    if ((await startButton.isVisible().catch(() => false)) && (await startButton.isEnabled().catch(() => false))) {
      await startButton.click();
    }
  }
  const deadline = Date.now() + FLOW_CHARACTER_CONFIG.CREATION_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await hasFlowCharacterImage(page)) return true;
    const bodyText = await page
      .locator(FLOW_DIRECT_VIDEO_CONFIG.PROJECT_BODY_SELECTOR)
      .innerText()
      .catch(() => XRT.EMPTY);
    if (FLOW_CHARACTER_CONFIG.GENERATION_ERROR_PATTERN.test(bodyText)) return false;
    await page.waitForTimeout(FLOW_CHARACTER_CONFIG.ACTION_DELAY_MS);
  }
  return false;
};
const ensureFlowCharacterImage = async (page: Page, character: FlowCharacterInput): Promise<boolean> => {
  if (await hasFlowCharacterImage(page)) return true;
  return generateFlowCharacterPortrait(page, character.prompt);
};
const captureFlowCharacterReference = async (page: Page, projectId: string | undefined, character: FlowCharacterInput): Promise<string | undefined> => {
  if (_.isEmpty(_.trim(projectId))) return undefined;
  const imageDirectory = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, _.trim(projectId), PROJECT_VISUAL_ASSET_CONFIG.REFERENCES_DIRECTORY, REFERENCE_ASSET_GROUP.CHARACTER);
  fs.mkdirSync(imageDirectory, { recursive: true });
  const filename = `${GEMINI_CHAT_VIDEO_INPUT_CONFIG.CHARACTER_FILE_PREFIX}${_.kebabCase(character.name)}${REFACTOR_CONSTANTS.FILE_EXT_PNG}`;
  const imagePath = path.join(imageDirectory, filename);
  let imageLocator = page.locator(FLOW_CHARACTER_CONFIG.GENERATED_CHARACTER_IMAGE_SELECTOR).last();
  if (!(await imageLocator.isVisible().catch(() => false))) {
    const characterCard = locateFlowCharacterCard(page, character.name);
    const cardImage = characterCard.locator(SOURCE_TEXT_IMG).last();
    if (await cardImage.isVisible().catch(() => false)) {
      imageLocator = cardImage;
    } else {
      const href = _.trim(_.toString(await characterCard.getAttribute(SOURCE_TEXT_HREF).catch(() => XRT.EMPTY)));
      if (!_.isEmpty(href)) await page.goto(new URL(href, page.url()).toString(), { waitUntil: FLOW_DIRECT_VIDEO_CONFIG.PAGE_READY_LOAD_STATE, timeout: FLOW_CHARACTER_CONFIG.PAGE_TIMEOUT_MS }).catch(() => undefined);
      else await characterCard.click({ force: true }).catch(() => undefined);
      await page.waitForTimeout(FLOW_CHARACTER_CONFIG.ACTION_DELAY_MS);
      imageLocator = page.locator(FLOW_CHARACTER_CONFIG.GENERATED_CHARACTER_IMAGE_SELECTOR).last();
    }
  }
  if (!(await imageLocator.isVisible().catch(() => false))) return undefined;
  await imageLocator.screenshot({ path: imagePath, type: SOURCE_TEXT_PNG });
  if (!fs.existsSync(imagePath) || _.lte(fs.statSync(imagePath).size, SecurityConstants.ZERO)) return undefined;
  return SOURCE_TEMPLATE_SYMBOL_63(`${ASSETS_DIR_NAME}`, `${PROJECTS_DIR_NAME}`, `${_.trim(projectId)}`, `${PROJECT_VISUAL_ASSET_CONFIG.REFERENCES_DIRECTORY}`, `${REFERENCE_ASSET_GROUP.CHARACTER}`, `${filename}`);
};
const createFlowCharacter = async (page: Page, projectId: string, localProjectId: string | undefined, character: FlowCharacterInput): Promise<string> => {
  if (await isFlowCharacterAvailable(page, projectId, character.name)) {
    const existingImageUrl = await captureFlowCharacterReference(page, localProjectId, character);
    if (!_.isEmpty(existingImageUrl)) return existingImageUrl;
    throw createAppError(FLOW_CHARACTER_CONFIG.VI_CREATE_FAILED.replace(FLOW_CHARACTER_CONFIG.NAME_TOKEN, character.name));
  }
  let lastError: unknown;
  let editorOpened = false;
  let savedImageUrl: string = XRT.EMPTY;
  for (let attempt = SecurityConstants.ZERO; attempt < FLOW_CHARACTER_CONFIG.MAX_CREATE_ATTEMPTS; attempt++) {
    try {
      let nameInput = locateFlowCharacterNameInput(page);
      let promptInput = page.locator(SOURCE_TEMPLATE_VISIBLE(`${FLOW_CHARACTER_CONFIG.PROMPT_SELECTOR}`)).last();
      const canReuseGeneratedDraft =
        FLOW_CHARACTER_CONFIG.CHARACTER_DETAIL_URL_PATTERN.test(page.url()) &&
        (await nameInput.isVisible().catch(() => false)) &&
        ((await hasFlowCharacterImage(page)) ||
          (await page
            .getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_CHARACTER_CONFIG.CREATE_PORTRAIT_BUTTON })
            .last()
            .isVisible()
            .catch(() => false)));
      if (!canReuseGeneratedDraft) {
        if (!editorOpened || !FLOW_CHARACTER_CONFIG.CHARACTER_DETAIL_URL_PATTERN.test(page.url())) {
          await page.goto(getFlowCharacterPageUrl(projectId), { waitUntil: FLOW_DIRECT_VIDEO_CONFIG.PAGE_READY_LOAD_STATE, timeout: FLOW_CHARACTER_CONFIG.PAGE_TIMEOUT_MS });
          await dismissFlowOnboarding(page);
          editorOpened = true;
        }
        promptInput = page.locator(SOURCE_TEMPLATE_VISIBLE(`${FLOW_CHARACTER_CONFIG.PROMPT_SELECTOR}`)).last();
        if (!(await promptInput.isVisible().catch(() => false))) {
          const newCharacterButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_CHARACTER_CONFIG.NEW_CHARACTER_BUTTON }).last();
          if (await newCharacterButton.isVisible().catch(() => false)) await newCharacterButton.click();
          promptInput = page.locator(SOURCE_TEMPLATE_VISIBLE(`${FLOW_CHARACTER_CONFIG.PROMPT_SELECTOR}`)).last();
        }
        await promptInput.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: FLOW_CHARACTER_CONFIG.PAGE_TIMEOUT_MS });
        if (!(await replaceFlowPromptInput(page, promptInput, character.prompt))) {
          throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.PROMPT_NOT_READY_ERROR);
        }
        const startButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_CHARACTER_CONFIG.START_GENERATION_BUTTON }).last();
        await startButton.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: FLOW_CHARACTER_CONFIG.PAGE_TIMEOUT_MS });
        await startButton.click();
        const generationDeadline = Date.now() + FLOW_CHARACTER_CONFIG.CREATION_TIMEOUT_MS;
        nameInput = locateFlowCharacterNameInput(page);
        while (Date.now() < generationDeadline) {
          const nameReady = await nameInput.isVisible().catch(() => false);
          const imageReady = await hasFlowCharacterImage(page);
          const portraitCanBeStarted = await page
            .getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_CHARACTER_CONFIG.CREATE_PORTRAIT_BUTTON })
            .last()
            .isVisible()
            .catch(() => false);
          if (nameReady && (imageReady || portraitCanBeStarted)) break;
          const bodyText = await page
            .locator(FLOW_DIRECT_VIDEO_CONFIG.PROJECT_BODY_SELECTOR)
            .innerText()
            .catch(() => XRT.EMPTY);
          if (FLOW_CHARACTER_CONFIG.PROVIDER_REJECTION_PATTERN.test(bodyText)) throw createAppError(FLOW_CHARACTER_CONFIG.PROVIDER_REJECTION_ERROR);
          const nextButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_CHARACTER_CONFIG.NEXT_BUTTON }).last();
          if (!nameReady && (await nextButton.isEnabled().catch(() => false))) {
            await nextButton.click();
            await page.waitForTimeout(FLOW_CHARACTER_CONFIG.ACTION_DELAY_MS);
            nameInput = locateFlowCharacterNameInput(page);
          }
          await page.waitForTimeout(FLOW_CHARACTER_CONFIG.ACTION_DELAY_MS);
        }
      }
      if (!(await nameInput.isVisible().catch(() => false))) {
        throw createAppError(FLOW_CHARACTER_CONFIG.VI_CREATE_FAILED.replace(FLOW_CHARACTER_CONFIG.NAME_TOKEN, character.name));
      }
      if (!(await ensureFlowCharacterImage(page, character))) {
        const bodyText = await page
          .locator(FLOW_DIRECT_VIDEO_CONFIG.PROJECT_BODY_SELECTOR)
          .innerText()
          .catch(() => XRT.EMPTY);
        throw createAppError(FLOW_CHARACTER_CONFIG.PROVIDER_REJECTION_PATTERN.test(bodyText) ? FLOW_CHARACTER_CONFIG.PROVIDER_REJECTION_ERROR : FLOW_CHARACTER_CONFIG.VI_CREATE_FAILED.replace(FLOW_CHARACTER_CONFIG.NAME_TOKEN, character.name));
      }
      if (!(await finalizeFlowCharacterName(page, character.name))) {
        throw createAppError(FLOW_CHARACTER_CONFIG.VI_CREATE_FAILED.replace(FLOW_CHARACTER_CONFIG.NAME_TOKEN, character.name));
      }
      if (!_.isEmpty(_.trim(character.info))) {
        const infoInput = page.getByLabel(FLOW_CHARACTER_CONFIG.INFO_LABEL).last();
        if (await infoInput.isVisible().catch(() => false)) await infoInput.fill(_.trim(character.info));
      }
      savedImageUrl = _.defaultTo(await captureFlowCharacterReference(page, localProjectId, character), XRT.EMPTY);
      if (_.isEmpty(savedImageUrl)) {
        throw createAppError(FLOW_CHARACTER_CONFIG.VI_CREATE_FAILED.replace(FLOW_CHARACTER_CONFIG.NAME_TOKEN, character.name));
      }
      const doneButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: FLOW_CHARACTER_CONFIG.DONE_BUTTON }).last();
      await doneButton.click({ timeout: FLOW_CHARACTER_CONFIG.PAGE_TIMEOUT_MS }).catch(() => undefined);
      return savedImageUrl;
    } catch (error) {
      lastError = error;
      if (!_.isEmpty(savedImageUrl)) return savedImageUrl;
      await captureGeminiDomState(page, SOURCE_TEMPLATE_FLOW_CHARACTER_ATTEMPT(`${_.kebabCase(character.name)}`, `${_.add(attempt, 1)}`)).catch(() => undefined);
      if (_.lt(attempt + SecurityConstants.DEFAULT_AMOUNT, FLOW_CHARACTER_CONFIG.MAX_CREATE_ATTEMPTS)) {
        await page.waitForTimeout(FLOW_CHARACTER_CONFIG.ACTION_DELAY_MS);
      }
    }
  }
  throw lastError instanceof Error ? lastError : createAppError(FLOW_CHARACTER_CONFIG.VI_CREATE_FAILED.replace(FLOW_CHARACTER_CONFIG.NAME_TOKEN, character.name));
};
export const ensureFlowCharacters = async (options: EnsureFlowCharactersOptions): Promise<EnsureFlowCharactersResult> => {
  const selectedCharacters = options.characters;
  if (_.gt(selectedCharacters.length, CINEMATIC_CHARACTER_PACK_CONFIG.MAX_CHARACTERS) || _.uniq(_.map(selectedCharacters, SOURCE_TEXT_ID)).length !== selectedCharacters.length || _.some(selectedCharacters, (character) => _.some([character.id, character.name, character.prompt], (value) => _.isEmpty(_.trim(value))))) {
    throw createAppError(SOURCE_TEXT_INVALID_AI_CHARACTER_ARTIFACT);
  }
  const release = await imageGenMutex.acquire();
  let browserInstance: BrowserSession | null = null;
  let currentProjectId = normalizeFlowProjectId(options.flowProjectId);
  const results: FlowCharacterCreationResult[] = [];
  try {
    browserInstance = await getOrLaunchGlobalBrowser(options.chromeHeadless, true);
    const page = browserInstance.page;
    if (_.isEmpty(currentProjectId)) currentProjectId = await createFlowProject(page);
    else {
      await page.goto(getFlowProjectUrl(currentProjectId), { waitUntil: FLOW_DIRECT_VIDEO_CONFIG.PAGE_READY_LOAD_STATE, timeout: FLOW_CHARACTER_CONFIG.PAGE_TIMEOUT_MS });
      await throwIfSharedChromeFlowLoginRequired(browserInstance, currentProjectId);
      await dismissFlowOnboarding(page);
    }
    if (await isFlowProjectUnavailable(page)) currentProjectId = await replaceUnavailableFlowProject(page);
    for (const character of selectedCharacters) {
      const startMessage = _.isEqual(options.language, ProjectLanguage.EN) ? FLOW_CHARACTER_CONFIG.EN_CREATE_START : FLOW_CHARACTER_CONFIG.VI_CREATE_START;
      appLog(startMessage.replace(FLOW_CHARACTER_CONFIG.NAME_TOKEN, character.name));
      try {
        const imageUrl = await createFlowCharacter(page, currentProjectId, options.projectId, character);
        if (_.isEmpty(imageUrl)) throw createAppError(FLOW_CHARACTER_CONFIG.VI_CREATE_FAILED.replace(FLOW_CHARACTER_CONFIG.NAME_TOKEN, character.name));
        results.push({ id: character.id, name: character.name, success: true, imageUrl });
        const successMessage = _.isEqual(options.language, ProjectLanguage.EN) ? FLOW_CHARACTER_CONFIG.EN_CREATE_SUCCESS : FLOW_CHARACTER_CONFIG.VI_CREATE_SUCCESS;
        appLog(successMessage.replace(FLOW_CHARACTER_CONFIG.NAME_TOKEN, character.name));
      } catch (error) {
        results.push({ id: character.id, name: character.name, success: false, warning: getErrorMessage(error) });
      }
    }
    const failed = _.filter(results, (result) => !result.success);
    return { success: _.isEmpty(failed) && _.isEqual(results.length, selectedCharacters.length), newProjectId: currentProjectId, characters: results, warning: _.join(_.compact(_.map(failed, SOURCE_TEXT_WARNING)), SOURCE_TEXT_SYMBOL_6) || undefined };
  } catch (error) {
    return { success: false, newProjectId: currentProjectId, characters: results, warning: getErrorMessage(error) };
  } finally {
    if (browserInstance) {
      if (options.retainBrowserSession) scheduleGlobalBrowserCleanup();
      else await closeActiveBrowser();
    }
    release();
  }
};
let grokPage: Page | null = null;
let grokBrowser: Browser | null = null;
let grokBrowserLaunchPromise: Promise<{ context: BrowserContext; page: Page }> | null = null;
let activeGrokLocalProjectId: string | null = null;
interface GrokCdpTarget {
  type?: string;
  title?: string;
  url?: string;
}
const getGrokCdpTargets = async (): Promise<GrokCdpTarget[]> => {
  try {
    const response = await fetch(`${REFACTOR_CONSTANTS.GROK_CDP_ENDPOINT}${REFACTOR_CONSTANTS.GROK_CDP_TARGETS_PATH}`);
    if (!response.ok) return [];
    const targets = await response.json();
    return _.isArray(targets) ? targets : [];
  } catch {
    return [];
  }
};
const waitForGrokChrome = async (): Promise<void> => {
  for (let attempt = 0; attempt < REFACTOR_CONSTANTS.GROK_CDP_READY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`${REFACTOR_CONSTANTS.GROK_CDP_ENDPOINT}${REFACTOR_CONSTANTS.GROK_CDP_VERSION_PATH}`);
      if (response.ok) return;
    } catch {}
    await delayAsync(REFACTOR_CONSTANTS.GROK_CDP_READY_INTERVAL_MS);
  }
  throw new Error(GROK_AUTOMATION_MESSAGES.CONNECT_FAILED);
};
const waitForVisibleGrokVerificationBeforeAutomation = async (): Promise<void> => {
  let stableReadyPolls = 0;
  let challengeLogged = false;
  const grokHostname = new URL(EXTERNAL_URLS.GROK_CHAT).hostname;
  for (let attempt = 0; attempt < REFACTOR_CONSTANTS.GROK_CDP_VERIFICATION_ATTEMPTS; attempt++) {
    const grokTarget = _.find(await getGrokCdpTargets(), (target) => _.isEqual(target.type, REFACTOR_CONSTANTS.GROK_CDP_PAGE_TYPE) && _.includes(_.toLower(_.toString(target.url)), grokHostname));
    const readyTitle = REFACTOR_CONSTANTS.GROK_CDP_READY_TITLE_PATTERN.test(_.trim(_.toString(grokTarget?.title)));
    if (readyTitle) {
      stableReadyPolls = _.add(stableReadyPolls, SecurityConstants.DEFAULT_AMOUNT);
      if (stableReadyPolls >= REFACTOR_CONSTANTS.GROK_CDP_PRECONNECT_STABLE_POLLS) return;
    } else {
      stableReadyPolls = SecurityConstants.ZERO;
      if (grokTarget && !challengeLogged) {
        challengeLogged = true;
        appLog(REFACTOR_CONSTANTS.GROK_PRECONNECT_WAIT_LOG);
      }
    }
    await delayAsync(REFACTOR_CONSTANTS.GROK_CDP_READY_INTERVAL_MS);
  }
  throw new Error(REFACTOR_CONSTANTS.GROK_PRECONNECT_TIMEOUT_ERROR);
};
const launchNativeGrokBrowser = async (chromeHeadless?: boolean): Promise<{ context: BrowserContext; page: Page }> => {
  const account = await getNextAccount();
  if (!account) throw new Error(REFACTOR_CONSTANTS.MSG_NO_ACC_AVAIL_CONFIG);
  await closeActiveBrowser();
  const emailHash = crypto.createHash(REFACTOR_CONSTANTS.HASH_MD5).update(account.email).digest(REFACTOR_CONSTANTS.ENCODING_HEX);
  const profilePath = path.join(getDataDirectory(), REFACTOR_CONSTANTS.DIR_GOOGLE_PROFILES, `${REFACTOR_CONSTANTS.PROFILE_PREFIX}${emailHash}`);
  const chromeArgs = [REFACTOR_CONSTANTS.CHROME_REMOTE_DEBUGGING_ARG.replace(SOURCE_TEXT_0_2, _.toString(REFACTOR_CONSTANTS.GROK_REMOTE_DEBUGGING_PORT)), REFACTOR_CONSTANTS.CHROME_USER_DATA_ARG.replace(SOURCE_TEXT_0_2, profilePath), REFACTOR_CONSTANTS.CHROME_NO_FIRST_RUN_ARG, REFACTOR_CONSTANTS.CHROME_NO_DEFAULT_BROWSER_ARG, EXTERNAL_URLS.GROK_CHAT];
  if (chromeHeadless !== false) chromeArgs.push(REFACTOR_CONSTANTS.CHROME_HEADLESS_NEW_ARG);
  spawn(REFACTOR_CONSTANTS.WINDOWS_CHROME_PATH, chromeArgs, { windowsHide: chromeHeadless !== false, stdio: SOURCE_TEXT_IGNORE }).unref();
  await waitForGrokChrome();
  if (chromeHeadless === false) await waitForVisibleGrokVerificationBeforeAutomation();
  else await delayAsync(REFACTOR_CONSTANTS.GROK_CDP_READY_INTERVAL_MS * REFACTOR_CONSTANTS.GROK_CDP_POST_LAUNCH_SETTLE_MULTIPLIER);
  grokBrowser = await chromium.connectOverCDP(REFACTOR_CONSTANTS.GROK_CDP_ENDPOINT);
  const context = _.first(grokBrowser.contexts());
  if (!context) throw new Error(GROK_AUTOMATION_MESSAGES.NO_SESSION_CREATED);
  grokPage = _.find(context.pages(), (candidate) => _.includes(candidate.url(), SOURCE_TEXT_GROK_COM)) || (await context.newPage());
  activeBrowserInstance = { context, page: grokPage, account, ownsContext: false };
  activeBrowserHeadless = chromeHeadless !== false;
  appLog(GROK_AUTOMATION_MESSAGES.USING_ACCOUNT(account.email));
  return { context, page: grokPage };
};
export const getOrLaunchGrokBrowser = async (chromeHeadless?: boolean): Promise<{ context: BrowserContext; page: Page }> => {
  if (grokBrowser?.isConnected() && grokPage && !grokPage.isClosed()) {
    const duplicateGrokPages = _.filter(grokPage.context().pages(), (page) => page !== grokPage && _.includes(page.url(), SOURCE_TEXT_GROK_COM_IMAGINE));
    await Promise.allSettled(_.map(duplicateGrokPages, (page) => page.close()));
    return { context: grokPage.context(), page: grokPage };
  }
  grokBrowser = null;
  grokPage = null;
  try {
    const existingTargets = await getGrokCdpTargets();
    const hasExistingGrokTarget = _.some(existingTargets, (target) => _.includes(_.toLower(_.toString(target.url)), new URL(EXTERNAL_URLS.GROK_CHAT).hostname));
    if (chromeHeadless === false && hasExistingGrokTarget) await waitForVisibleGrokVerificationBeforeAutomation();
    grokBrowser = await chromium.connectOverCDP(REFACTOR_CONSTANTS.GROK_CDP_ENDPOINT);
    const existingContext = _.first(grokBrowser.contexts());
    const existingPage = existingContext && (_.find(existingContext.pages(), (candidate) => _.includes(candidate.url(), SOURCE_TEXT_GROK_COM)) || _.first(existingContext.pages()));
    if (existingContext && existingPage) {
      grokPage = existingPage;
      const duplicateGrokPages = _.filter(existingContext.pages(), (page) => page !== existingPage && _.includes(page.url(), SOURCE_TEXT_GROK_COM_IMAGINE));
      await Promise.allSettled(_.map(duplicateGrokPages, (page) => page.close()));
      return { context: existingContext, page: existingPage };
    }
  } catch {}
  if (!grokBrowserLaunchPromise) {
    grokBrowserLaunchPromise = launchNativeGrokBrowser(chromeHeadless).finally(() => {
      grokBrowserLaunchPromise = null;
    });
  }
  return grokBrowserLaunchPromise;
};
const isGrokChromeRunning = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${REFACTOR_CONSTANTS.GROK_CDP_ENDPOINT}${REFACTOR_CONSTANTS.GROK_CDP_VERSION_PATH}`, { signal: AbortSignal.timeout(1000) });
    return response.ok;
  } catch {
    return false;
  }
};
export async function closeOwnedGrokBrowserIfIdle(allowImaginePage: boolean = false): Promise<boolean> {
  if (browserRetainers.size) return false;
  if (activeFlowVideoGenerationCount > 0) return false;
  if (!grokBrowser?.isConnected()) {
    if (!(await isGrokChromeRunning())) return true;
    grokBrowser = await chromium.connectOverCDP(REFACTOR_CONSTANTS.GROK_CDP_ENDPOINT).catch(() => null);
    if (!grokBrowser) return false;
  }
  const grokContext = grokPage?.context() || _.first(grokBrowser.contexts());
  const pages = _.filter(grokContext?.pages(), (page) => !page.isClosed()) || [];
  if (_.some(pages, (page) => !/(?:grok\.com|about:blank|chrome:\/\/newtab)/i.test(page.url()))) return false;
  if (!allowImaginePage && _.some(pages, (page) => /grok\.com\/imagine/i.test(page.url()))) return false;
  if (allowImaginePage && pages.length > 1) return false;
  const page = pages[0] || (await grokContext?.newPage().catch(() => undefined));
  if (!page) return false;
  try {
    const cdp = await grokContext!.newCDPSession(page);
    await cdp.send(SOURCE_TEXT_BROWSER_CLOSE as any).catch(() => undefined);
    for (let attempt = 0; attempt < 6; attempt += 1) {
      if (!(await isGrokChromeRunning())) break;
      await delayAsync(250);
    }
    if (await isGrokChromeRunning()) return false;
    grokBrowser = null;
    grokPage = null;
    if (activeBrowserInstance?.context === grokContext) activeBrowserInstance = null;
    return true;
  } catch (error) {
    appError(SOURCE_TEMPLATE_GROK_CHROME_GRACEFUL_CLOSE_FAILED(`${getErrorMessage(error)}`));
    return false;
  }
}
const generateMediaWithGrokImagine = async (options: ImageGeneratorOptions): Promise<ImageGeneratorResult> => {
  const generationRevision = mediaGenerationRevision;
  const release = await grokGenerationMutex.acquire();
  try {
    if (isMediaGenerationCancelled(generationRevision)) throw createAppError(GEMINI_CHAT_RECOVERY_CONFIG.CANCELLED_ERROR);
    const { context, page } = await getOrLaunchGrokBrowser(options.visualConfig?.chromeHeadless);
    await page.goto(EXTERNAL_URLS.GROK_IMAGINE, { waitUntil: SOURCE_TEXT_DOMCONTENTLOADED, timeout: 60000 });
    await page.waitForTimeout(1500);
    const loginButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: /Đăng nhập|Log in|Sign in/i }).first();
    if (await loginButton.isVisible().catch(() => false)) {
      if (options.visualConfig?.chromeHeadless === false) {
        await page.bringToFront().catch(() => {});
        await loginButton.click().catch(() => {});
      }
      throw new Error(GROK_AUTOMATION_MESSAGES.NOT_LOGGED_IN);
    }
    const ageGate = page.getByText(/xác nhận tuổi|confirm your age|verify your age/i).first();
    if (await ageGate.isVisible().catch(() => false)) {
      throw new Error(GROK_AUTOMATION_MESSAGES.AGE_GATE_PENDING);
    }
    const localProjectId = _.toString(options.sandboxConfig?.localProjectId || options.sandboxConfig?.projectId);
    if (!_.isEmpty(localProjectId) && !_.isEqual(activeGrokLocalProjectId, localProjectId)) {
      const createNew = page.getByRole(SOURCE_TEXT_BUTTON, { name: /Tạo mới|Dự án mới|Create new|New project/i }).first();
      if (await createNew.isVisible().catch(() => false)) await createNew.click().catch(() => {});
      activeGrokLocalProjectId = localProjectId;
      await page.waitForTimeout(400);
      appLog(GROK_AUTOMATION_MESSAGES.ATTACHED_ROOM(localProjectId));
    }
    const isVideo = options.visualConfig?.generateType === GenerateType.Video;
    const mode = page.getByRole(SOURCE_TEXT_RADIO, { name: isVideo ? /Video/i : /Hình ảnh|Image/i }).first();
    if (await mode.isVisible().catch(() => false)) await mode.click();
    await page.waitForTimeout(300);
    const targetRatio = _.defaultTo(options.visualConfig?.aspectRatio, AspectRatio.SixteenNine);
    const ratioButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: /Tỷ lệ khung hình|Aspect ratio/i }).first();
    if (await ratioButton.isVisible().catch(() => false)) {
      await ratioButton.click();
      const ratioOption = page.getByRole(SOURCE_TEXT_MENUITEMRADIO, { name: new RegExp(_.escapeRegExp(targetRatio), SOURCE_TEXT_I_2) }).first();
      if (await ratioOption.isVisible().catch(() => false)) await ratioOption.click();
    }
    if (isVideo) {
      const requestedDuration = _.includes(REFACTOR_CONSTANTS.GROK_VIDEO_DURATIONS, options.visualConfig?.videoDuration) ? _.toString(options.visualConfig?.videoDuration) : REFACTOR_CONSTANTS.GROK_FREE_VIDEO_DURATION;
      const requestedResolution = _.includes(REFACTOR_CONSTANTS.GROK_VIDEO_RESOLUTIONS, options.visualConfig?.videoResolution) ? _.toString(options.visualConfig?.videoResolution) : REFACTOR_CONSTANTS.GROK_FREE_VIDEO_RESOLUTION;
      const durationButton = page.getByRole(SOURCE_TEXT_RADIO, { name: requestedDuration, exact: true }).first();
      const resolutionButton = page.getByRole(SOURCE_TEXT_RADIO, { name: requestedResolution, exact: true }).first();
      if (await resolutionButton.isVisible().catch(() => false)) await resolutionButton.click().catch(() => {});
      if (await durationButton.isVisible().catch(() => false)) await durationButton.click().catch(() => {});
      const selectedDuration = await page
        .locator(SOURCE_TEXT_ROLE_RADIO_ARIA_CHECKED_TRUE_BUTTON)
        .evaluateAll(
          (nodes, browserData) => {
            const { XRT } = browserData.studioTexts;
            return nodes.map((node) => (node.textContent || XRT.EMPTY).trim()).filter(Boolean);
          },
          { studioTexts: { XRT: { EMPTY: XRT.EMPTY } } },
        )
        .catch(() => []);
      if (!_.some(selectedDuration, (label) => label.includes(requestedDuration))) {
        appLog(GROK_AUTOMATION_MESSAGES.DURATION_NOT_SUPPORTED(requestedDuration));
      }
      if (!_.some(selectedDuration, (label) => label.includes(requestedResolution))) {
        appLog(GROK_AUTOMATION_MESSAGES.RESOLUTION_NOT_SUPPORTED(requestedResolution));
      }
      appLog(GROK_AUTOMATION_MESSAGES.CONFIG_DETAIL(targetRatio, requestedDuration, requestedResolution, options.visualConfig?.chromeHeadless === false));
    }
    await uploadProviderCharacterReferences(page, options.visualConfig?.referenceImages, SOURCE_TEXT_GROK, options.visualConfig?.referenceImageNames);
    const initialImageUrls = await page.locator(SOURCE_TEXT_IMG).evaluateAll((elements) => elements.map((element) => (element as HTMLImageElement).currentSrc || (element as HTMLImageElement).src));
    const initialVideoUrls = await page.locator(SOURCE_TEXT_VIDEO_2).evaluateAll((elements) => elements.map((element) => (element as HTMLVideoElement).currentSrc || (element as HTMLVideoElement).src));
    const editor = page.locator(SOURCE_TEXT_CONTENTEDITABLE_TRUE).last();
    await editor.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: 30000 });
    await editor.fill(_.toString(options.prompt));
    const sendButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: /^(Gửi|Send|Submit)$/i }).last();
    if (await sendButton.isVisible().catch(() => false)) {
      await sendButton.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: 10000 });
      await page.waitForFunction(
        (browserPayload) => {
          const { SOURCE_BROWSER_TEXT_BUTTON_TYPE_SUBMIT } = browserPayload.texts;
          const button = document.querySelector(SOURCE_BROWSER_TEXT_BUTTON_TYPE_SUBMIT) as HTMLButtonElement | null;
          return Boolean(button && !button.disabled);
        },
        { payload: undefined, texts: { SOURCE_BROWSER_TEXT_BUTTON_TYPE_SUBMIT } },
        { timeout: 10000 },
      );
      await sendButton.click();
    } else {
      await editor.press(SOURCE_TEXT_ENTER);
    }
    await page.waitForTimeout(800);
    const submittedPromptStillVisible = _.isEqual(_.trim(await editor.textContent().catch(() => XRT.EMPTY)), _.trim(_.toString(options.prompt)));
    if (submittedPromptStillVisible && (await sendButton.isEnabled().catch(() => false))) {
      await sendButton.click();
    }
    appLog(GROK_AUTOMATION_MESSAGES.SENT_PROMPT(isVideo));
    const mediaUrl = await page
      .waitForFunction(
        (browserPayload) => {
          const { SOURCE_TEXT_VIDEO_2, SOURCE_TEXT_IMG } = browserPayload.texts;
          const { video, oldImages, oldVideos } = browserPayload.payload;
          if (video) {
            const urls = Array.from(document.querySelectorAll(SOURCE_TEXT_VIDEO_2)).map((node) => (node as HTMLVideoElement).currentSrc || (node as HTMLVideoElement).src);
            return urls.find((url) => url && !oldVideos.includes(url) && /assets\.grok\.com\/.+\/generated\/.+\.mp4(?:\?|$)/i.test(url)) || null;
          }
          const urls = Array.from(document.querySelectorAll(SOURCE_TEXT_IMG)).map((node) => (node as HTMLImageElement).currentSrc || (node as HTMLImageElement).src);
          return urls.find((url) => url && !oldImages.includes(url) && /imagine-public\.x\.ai\/.+\/images\/.+\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(url)) || null;
        },
        { payload: { video: isVideo, oldImages: initialImageUrls, oldVideos: initialVideoUrls }, texts: { SOURCE_TEXT_VIDEO_2, SOURCE_TEXT_IMG } },
        { timeout: isVideo ? 360000 : 180000 },
      )
      .then((handle) => handle.jsonValue() as Promise<string | null>);
    if (!mediaUrl) throw new Error(GROK_AUTOMATION_MESSAGES.NO_MEDIA_URL);
    const response = await context.request.get(mediaUrl, { timeout: 120000 });
    if (!response.ok()) throw new Error(GROK_AUTOMATION_MESSAGES.DOWNLOAD_FAILED(response.status()));
    const buffer = await response.body();
    if (isVideo) await inspectGeneratedVideoBuffer(buffer, parseConfiguredVideoDuration(options.visualConfig?.videoDuration));
    else if (buffer.length < 10000) throw new Error(GROK_AUTOMATION_MESSAGES.INVALID_MEDIA_BUFFER);
    const contentType = response.headers()[SOURCE_TEXT_CONTENT_TYPE_2] || (isVideo ? SOURCE_TEXT_VIDEO_MP4 : SOURCE_TEXT_IMAGE_JPEG);
    const dataUrl = SOURCE_TEMPLATE_DATA_BASE64(`${contentType}`, `${buffer.toString(SOURCE_TEXT_BASE64)}`);
    appLog(GROK_AUTOMATION_MESSAGES.DOWNLOAD_DIRECT_SUCCESS(isVideo, buffer.length));
    return { success: true, base64: buffer.toString(SOURCE_TEXT_BASE64), fallbackUrl: dataUrl };
  } catch (error) {
    appError(SOURCE_TEXT_GROK_IMAGINE_GENERATION_FAILED, error);
    return { success: false, base64: null, fallbackUrl: XRT.EMPTY, warning: getErrorMessage(error) };
  } finally {
    await closeOwnedGrokBrowserIfIdle(true);
    release();
  }
};
export async function generateImageWithPlaywright(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {
  const generationRevision = mediaGenerationRevision;
  const { prompt, sandboxConfig = {} } = options;
  const requestedVisualConfig = options.visualConfig;
  const requestedEngine = _.defaultTo(requestedVisualConfig?.imageGeneratorEngine, ImageGeneratorEngine.Veo3);
  const normalizedModelSettings = normalizeVideoModelSettings(requestedEngine, { duration: requestedVisualConfig?.videoDuration, resolution: requestedVisualConfig?.videoResolution, aspectRatio: requestedVisualConfig?.aspectRatio as AspectRatio }, !_.isEmpty(requestedVisualConfig?.referenceImages) || !_.isEmpty(requestedVisualConfig?.referenceCharacterNames));
  if (_.isEqual(requestedVisualConfig?.generateType, GenerateType.Video) && !normalizedModelSettings.supportsReferences) {
    return { success: false, base64: null, fallbackUrl: SecurityConstants.EMPTY_STRING, warning: VIDEO_MODEL_CAPABILITY_CONFIG.REFERENCE_UNSUPPORTED_ERROR };
  }
  const visualConfig = _.isEqual(requestedVisualConfig?.generateType, GenerateType.Video) ? { ...requestedVisualConfig, videoDuration: normalizedModelSettings.duration, videoResolution: normalizedModelSettings.resolution, aspectRatio: normalizedModelSettings.aspectRatio } : requestedVisualConfig;
  const normalizedOptions = { ...options, visualConfig };
  if (visualConfig?.imageGeneratorEngine === ImageGeneratorEngine.GrokImagine) return generateMediaWithGrokImagine(normalizedOptions);
  if (visualConfig?.generationMode === ImageGenerationMode.GeminiChat) return generateImageWithGeminiChat(normalizedOptions);
  const finalPrompt = _.defaultTo(prompt, XRT.EMPTY);
  const cleanProjectId = normalizeFlowProjectId(sandboxConfig.flowProjectId || sandboxConfig.projectId);
  const release = await imageGenMutex.acquire();
  const isFlowVideoGeneration = _.isEqual(visualConfig?.generateType, GenerateType.Video);
  if (isFlowVideoGeneration) activeFlowVideoGenerationCount = _.add(activeFlowVideoGenerationCount, SecurityConstants.DEFAULT_AMOUNT);
  let responseText: string = XRT.EMPTY;
  let lastGenerationError = BACKEND_MESSAGES.PLAYWRIGHT_DECODE_ERR;
  let remoteVideoMediaId: string | undefined;
  let remoteVideoMediaIds: string[] = [];
  let remoteVideoSourceUrl: string | undefined;
  let success = false;
  let attempts = 0;
  const maxAttempts = SecurityConstants.DEFAULT_AMOUNT;
  let currentProjectId = cleanProjectId;
  let browserInstance: BrowserSession | null = null;
  let activePage: Page | null = null;
  try {
    while (attempts < maxAttempts && !success && !isMediaGenerationCancelled(generationRevision)) {
      attempts++;
      appLog(SOURCE_TEMPLATE_SYMBOL_64(`${BACKEND_MESSAGES.IMAGE_RENDER_ATTEMPT}`, `${attempts}`, `${maxAttempts}`, `${BACKEND_MESSAGES.IMAGE_RENDER_STARTING}`));
      const flowResponseUrls: string[] = [];
      let flowResponseListener: ((response: any) => void) | undefined;
      try {
        if (!browserInstance) {
          browserInstance = await getOrLaunchGlobalBrowser(visualConfig?.chromeHeadless, isFlowVideoGeneration);
          activePage = browserInstance.page;
          try {
            await activePage.evaluate(
              (browserPayload) => {
                const { SOURCE_TEXT_NAME, SOURCE_BROWSER_TEXT_RETURN, SOURCE_TEXT_UNDEFINED } = browserPayload.texts;
                const { getImgIdStr } = browserPayload.payload;
                if (typeof window !== SOURCE_TEXT_UNDEFINED) {
                  if (!(window as any).__name) {
                    (window as any).__name = (target: any, value: any) => {
                      try {
                        Object.defineProperty(target, SOURCE_TEXT_NAME, { value, configurable: true });
                      } catch (e) {}
                      return target;
                    };
                  }
                  if (!(window as any).__getImgId) {
                    (window as any).__getImgId = new Function(SOURCE_BROWSER_TEXT_RETURN + getImgIdStr)();
                  }
                }
              },
              { payload: { getImgIdStr: browserGetImgIdSafeStr }, texts: { SOURCE_TEXT_NAME, SOURCE_BROWSER_TEXT_RETURN, SOURCE_TEXT_UNDEFINED: SRT.SOURCE_TEXT_UNDEFINED } },
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
            const targetUrl = SOURCE_TEMPLATE_SYMBOL(`${EXTERNAL_URLS.GOOGLE_LABS_FLOW}`, `${currentProjectId}`);
            appLog(SOURCE_TEMPLATE_ATTEMPT(`${BACKEND_MESSAGES.PLAYWRIGHT_REDIRECT_LOG}`, `${currentProjectId}`, `${attempts}`));
            await activePage.goto(targetUrl, { waitUntil: FLOW_DIRECT_VIDEO_CONFIG.PAGE_READY_LOAD_STATE, timeout: 60000 });
          }
        }
        if (currentProjectId && (await isFlowProjectUnavailable(activePage))) {
          currentProjectId = await replaceUnavailableFlowProject(activePage);
        }
        await dismissFlowOnboarding(activePage);
        appLog(SOURCE_TEMPLATE_SYMBOL_41(`${BACKEND_MESSAGES.PLAYWRIGHT_INPUT_LOG}`, `${_.defaultTo(finalPrompt, prompt)}`));
        let inputEl = await locateFlowPromptInput(activePage);
        if (!inputEl) {
          await captureGeminiDomState(activePage, SOURCE_TEXT_FLOW_PROMPT_INPUT_MISSING);
          await activePage.screenshot({ path: path.join(getDataDirectory(), SOURCE_TEXT_FLOW_PROMPT_INPUT_MISSING_PNG), fullPage: true }).catch(() => {});
          const currentRoomUrl = currentProjectId ? SOURCE_TEMPLATE_SYMBOL(`${EXTERNAL_URLS.GOOGLE_LABS_FLOW}`, `${currentProjectId}`) : activePage.url();
          await activePage.goto(currentRoomUrl, { waitUntil: SOURCE_TEXT_DOMCONTENTLOADED, timeout: 60000 }).catch(() => undefined);
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
          const currentConfigButton = activePage.locator(FLOW_DIRECT_VIDEO_CONFIG.CONFIG_BUTTON_SELECTOR).last();
          const currentConfigSummary = isDirectVideo ? _.defaultTo(await currentConfigButton.textContent().catch(() => XRT.EMPTY), XRT.EMPTY) : XRT.EMPTY;
          const currentVideoConfigMatches = !isDirectVideo || isFlowVideoConfigSummaryMatching(currentConfigSummary, visualConfig);
          if (currentConfigState !== lastPlaywrightConfigState || attempts > 1 || !currentVideoConfigMatches) {
            appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_NEW);
            const configuredAgentUi = _.isEqual(visualConfig?.generateType, GenerateType.Video) ? await configureFlowDirectVideoSettings(activePage, visualConfig) : await configureFlowAgentSettings(activePage, visualConfig);
            if (configuredAgentUi) {
              lastPlaywrightConfigState = currentConfigState;
              appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_SUCCESS);
            }
            if (_.isEqual(visualConfig?.generateType, GenerateType.Video) && !configuredAgentUi) {
              await captureGeminiDomState(activePage, SOURCE_TEXT_FLOW_VIDEO_CONFIG_MISMATCH).catch(() => undefined);
              throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.CONFIG_MISMATCH_ERROR);
            }
            const configBtnLoc = activePage
              .locator(SOURCE_TEXT_BUTTON_ARIA_HASPOPUP_MENU)
              .filter({ hasText: /1x|x2|x3|x4|16:9|4:3|1:1|3:4|9:16|Nano|Veo|Imagen/i })
              .first();
            if (!configuredAgentUi && !_.isEqual(visualConfig?.generateType, GenerateType.Video) && (await configBtnLoc.isVisible())) {
              await configBtnLoc.click();
              await activePage.waitForTimeout(1000);
              const dropdown = activePage.locator(SOURCE_TEXT_ROLE_MENU_DATA_STATE_OPEN).first();
              if (await dropdown.isVisible()) {
                const isVideo = visualConfig?.generateType === GenerateType.Video;
                const targetTypeText = isVideo ? SOURCE_TEXT_VIDEO_4 : /Hình ảnh|Image/i;
                const typeBtn = dropdown.locator(SOURCE_TEXT_ROLE_TAB).filter({ hasText: targetTypeText }).first();
                if (await typeBtn.isVisible()) await typeBtn.click();
                const targetRatio = _.defaultTo(visualConfig?.aspectRatio, AspectRatio.SixteenNine);
                const ratioBtn = dropdown
                  .locator(SOURCE_TEXT_ROLE_TAB)
                  .filter({ hasText: new RegExp(SOURCE_TEMPLATE_SYMBOL_62(`${targetRatio}`), SOURCE_TEXT_I_2) })
                  .first();
                if (await ratioBtn.isVisible()) await ratioBtn.click();
                const targetCount = _.defaultTo(visualConfig?.generateCount, 1);
                const countLabel = targetCount === 1 ? SOURCE_TEXT_1X : SOURCE_TEMPLATE_X_2(`${targetCount}`);
                const countBtn = dropdown
                  .locator(SOURCE_TEXT_ROLE_TAB)
                  .filter({ hasText: new RegExp(SOURCE_TEMPLATE_SYMBOL_62(`${countLabel}`), SOURCE_TEXT_I_2) })
                  .first();
                if (await countBtn.isVisible()) await countBtn.click();
                if (isVideo && visualConfig?.videoDuration) {
                  const durationBtn = dropdown
                    .locator(SOURCE_TEXT_ROLE_TAB)
                    .filter({ hasText: new RegExp(SOURCE_TEMPLATE_SYMBOL_62(`${visualConfig.videoDuration}`), SOURCE_TEXT_I_2) })
                    .first();
                  if (await durationBtn.isVisible()) await durationBtn.click();
                }
                const targetEngineKey = _.defaultTo(visualConfig?.imageGeneratorEngine, ImageGeneratorEngine.Veo3).toLowerCase();
                let exactEngineRegex: RegExp;
                let fallbackEngineRegex: RegExp;
                if (isVideo) {
                  if (targetEngineKey === SOURCE_TEXT_VEO3_LITE) {
                    exactEngineRegex = /veo 3\.1 - lite/i;
                    fallbackEngineRegex = /lite/i;
                  } else if (targetEngineKey === SOURCE_TEXT_VEO3_FAST) {
                    exactEngineRegex = /veo 3\.1 - fast/i;
                    fallbackEngineRegex = /fast/i;
                  } else if (targetEngineKey === SOURCE_TEXT_VEO3_QUALITY) {
                    exactEngineRegex = /veo 3\.1 - quality/i;
                    fallbackEngineRegex = /quality/i;
                  } else {
                    exactEngineRegex = /omni flash/i;
                    fallbackEngineRegex = /omni/i;
                  }
                } else {
                  if (targetEngineKey === SOURCE_TEXT_IMAGEN) {
                    exactEngineRegex = IMAGE_GEN_IMAGEN_EXACT_REGEX;
                    fallbackEngineRegex = IMAGE_GEN_IMAGEN_FALLBACK_REGEX;
                  } else if (targetEngineKey === SOURCE_TEXT_LABS_SANDBOX) {
                    exactEngineRegex = IMAGE_GEN_LABS_EXACT_REGEX;
                    fallbackEngineRegex = IMAGE_GEN_LABS_FALLBACK_REGEX;
                  } else {
                    exactEngineRegex = IMAGE_GEN_VEO_EXACT_REGEX;
                    fallbackEngineRegex = IMAGE_GEN_VEO_FALLBACK_REGEX;
                  }
                }
                const engineDropdownBtn = dropdown.locator(SOURCE_TEXT_BUTTON_ARIA_HASPOPUP_MENU).first();
                if (await engineDropdownBtn.isVisible()) {
                  const currentEngineText = await engineDropdownBtn.textContent();
                  if (currentEngineText && !exactEngineRegex.test(currentEngineText)) {
                    await engineDropdownBtn.click({ force: true });
                    await activePage.waitForTimeout(500);
                    let optionBtn = activePage
                      .locator(SOURCE_TEXT_ROLE_MENUITEM + SOURCE_TEXT_VISIBLE_2)
                      .filter({ hasText: exactEngineRegex })
                      .first();
                    if (!(await optionBtn.isVisible())) {
                      optionBtn = activePage
                        .locator(SOURCE_TEXT_ROLE_MENUITEM + SOURCE_TEXT_VISIBLE_2)
                        .filter({ hasText: fallbackEngineRegex })
                        .first();
                    }
                    if (await optionBtn.isVisible()) await optionBtn.click({ force: true });
                  }
                }
              }
              await activePage.keyboard.press(SOURCE_TEXT_ESCAPE);
              await activePage.waitForTimeout(500);
              lastPlaywrightConfigState = currentConfigState;
              appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_SUCCESS);
            }
          }
        } catch (configErr) {
          appError(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_SKIP, configErr);
          if (_.isEqual(visualConfig?.generateType, GenerateType.Video)) throw configErr;
        }
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
            appLog(FLOW_AUTOMATION_MESSAGES.FLOW_PROMPT_MISMATCH(normalizeFlowPromptValue(targetPrompt).length, normalizeFlowPromptValue(observedPrompt).length));
            await captureGeminiDomState(activePage, SOURCE_TEXT_FLOW_PROMPT_NOT_APPLIED).catch(() => undefined);
            throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.PROMPT_NOT_READY_ERROR);
          }
          await activePage.waitForTimeout(FLOW_AGENT_UI_CONFIG.CONFIG_SETTLE_MS);
        }
        if (!_.isEmpty(visualConfig?.referenceCharacterNames)) {
          await attachFlowCharactersByName(activePage, visualConfig.referenceCharacterNames);
        } else {
          await uploadProviderCharacterReferences(activePage, visualConfig?.referenceImages, SOURCE_TEXT_FLOW, visualConfig?.referenceImageNames);
        }
        inputEl = await locateFlowPromptInput(activePage, FLOW_CHARACTER_CONFIG.ATTACHMENT_VERIFY_TIMEOUT_MS);
        if (!inputEl || !isFlowPromptValueApplied(await readFlowPromptInput(inputEl), targetPrompt)) {
          throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.PROMPT_NOT_READY_ERROR);
        }
        const oldIds = await activePage.evaluate(
          (browserPayload) => {
            const { SOURCE_BROWSER_TEXT_RETURN, SOURCE_TEXT_IMG, SOURCE_BROWSER_TEXT_GETMEDIAURLREDIRECT, functionType } = browserPayload.texts;
            const getImgIdStr = browserPayload.payload;
            const getImgId = new Function(SOURCE_BROWSER_TEXT_RETURN + getImgIdStr)();
            const imgs = Array.from(document.querySelectorAll(SOURCE_TEXT_IMG));
            return imgs
              .filter((img) => img.src && img.src.includes(SOURCE_BROWSER_TEXT_GETMEDIAURLREDIRECT))
              .map((img) => {
                if (typeof (window as any).__getImgId === functionType) {
                  return (window as any).__getImgId(img.src);
                }
                return getImgId(img.src);
              })
              .filter(Boolean);
          },
          { payload: browserGetImgIdSafeStr, texts: { SOURCE_BROWSER_TEXT_RETURN, SOURCE_TEXT_IMG, SOURCE_BROWSER_TEXT_GETMEDIAURLREDIRECT, functionType: SRT.SOURCE_TEXT_FUNCTION } },
        );
        const oldVideoSources = await activePage.evaluate(
          (browserPayload) => {
            const { SOURCE_TEXT_VIDEO_2 } = browserPayload.texts;
            return Array.from(document.querySelectorAll(SOURCE_TEXT_VIDEO_2))
              .map((video) => video.currentSrc || video.src)
              .filter(Boolean);
          },
          { payload: undefined, texts: { SOURCE_TEXT_VIDEO_2 } },
        );
        const oldVideoThumbnailSources = await activePage.evaluate(
          (browserPayload) => {
            const { SOURCE_BROWSER_TEXT_IMG_ALT_VIDEO_I } = browserPayload.texts;
            return Array.from(document.querySelectorAll(SOURCE_BROWSER_TEXT_IMG_ALT_VIDEO_I))
              .map((image) => (image as HTMLImageElement).currentSrc || (image as HTMLImageElement).src)
              .filter(Boolean);
          },
          { payload: undefined, texts: { SOURCE_BROWSER_TEXT_IMG_ALT_VIDEO_I } },
        );
        const oldVideoEditIds = _.isEqual(visualConfig?.generateType, GenerateType.Video) ? _.uniq([...(await getFlowVideoEditIds(activePage)), ..._.compact(_.map([...oldVideoSources, ...oldVideoThumbnailSources], extractFlowMediaIdFromUrl)), ..._.map(sandboxConfig.knownVideoMediaIds || [], normalizeFlowMediaId)]) : [];
        const oldVideoGenerationFailureCount = _.isEqual(visualConfig?.generateType, GenerateType.Video)
          ? await activePage.evaluate(
              (browserPayload) => {
                const { XRT } = browserPayload.studioTexts;
                const { SOURCE_TEXT_GI } = browserPayload.texts;
                const generationFailurePatternSource = browserPayload.payload;
                return (document.body?.innerText || XRT.EMPTY).match(new RegExp(generationFailurePatternSource, SOURCE_TEXT_GI))?.length || 0;
              },
              { payload: FLOW_DIRECT_VIDEO_CONFIG.GENERATION_FAILURE_PATTERN.source, texts: { SOURCE_TEXT_GI }, studioTexts: { XRT: { EMPTY: XRT.EMPTY } } },
            )
          : SecurityConstants.ZERO;
        if (_.isEqual(visualConfig?.generateType, GenerateType.Video)) {
          flowResponseListener = (response: any) => {
            const responseUrl = _.toString(response.url());
            if (/video|media|download|googleusercontent|storage/i.test(responseUrl)) flowResponseUrls.push(responseUrl);
          };
          activePage.on(SOURCE_TEXT_RESPONSE, flowResponseListener);
        }
        const namedSubmitButton = activePage.getByRole(SOURCE_TEXT_BUTTON, { name: PLAYWRIGHT_SUBMIT_TEXT_REGEX }).last();
        const iconSubmitButton = activePage
          .locator(SOURCE_TEXT_BUTTON)
          .filter({ has: activePage.locator(SOURCE_TEXT_I_MAT_ICON).filter({ hasText: PLAYWRIGHT_SUBMIT_ICON_REGEX }) })
          .last();
        const submitBtnLocator = (await namedSubmitButton.isVisible().catch(() => false)) ? namedSubmitButton : iconSubmitButton;
        let isBtnDisabled = true;
        const submitReadyDeadline = Date.now() + FLOW_DIRECT_VIDEO_CONFIG.CONFIG_VERIFY_TIMEOUT_MS;
        while (Date.now() < submitReadyDeadline) {
          try {
            isBtnDisabled = await submitBtnLocator.evaluate(
              (btn, browserPayload) => {
                const { SOURCE_BROWSER_TEXT_DISABLED, SOURCE_TEXT_ARIA_DISABLED, SOURCE_TEXT_TRUE } = browserPayload.texts;
                return !btn || btn.hasAttribute(SOURCE_BROWSER_TEXT_DISABLED) || btn.getAttribute(SOURCE_TEXT_ARIA_DISABLED) === SOURCE_TEXT_TRUE;
              },
              { payload: undefined, texts: { SOURCE_BROWSER_TEXT_DISABLED, SOURCE_TEXT_ARIA_DISABLED, SOURCE_TEXT_TRUE } },
            );
          } catch (e) {
            isBtnDisabled = true;
          }
          if (!isBtnDisabled) break;
          await delayAsync(500);
        }
        if (isBtnDisabled) {
          await captureGeminiDomState(activePage, SOURCE_TEXT_FLOW_SUBMIT_DISABLED_AFTER_PROMPT).catch(() => undefined);
          throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.PROMPT_NOT_READY_ERROR);
        }
        appLog(BACKEND_MESSAGES.PLAYWRIGHT_SUBMIT_LOG);
        await submitBtnLocator.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: 5000 });
        await submitBtnLocator.scrollIntoViewIfNeeded();
        await smoothMouseMove(activePage, submitBtnLocator);
        await randomDelay(400, 800);
        await submitBtnLocator.click();
        if (visualConfig?.generateType === GenerateType.Video) await approveFlowVideoCreditPrompt(activePage, submitBtnLocator);
        appLog(BACKEND_MESSAGES.PLAYWRIGHT_WAITING_GEN);
        let finalBase64: string;
        let finalBase64s: string[] = [];
        if (visualConfig?.generateType === GenerateType.Video) {
          const generatedBatch = await waitForFlowGeneratedMediaBatch(activePage, oldVideoEditIds, oldVideoSources, oldVideoThumbnailSources, oldVideoGenerationFailureCount, flowResponseUrls);
          const resolvedMedia = await resolveFlowGeneratedMediaDetails(activePage, generatedBatch.media, currentProjectId);
          remoteVideoMediaIds = _.uniq(_.compact(_.map(resolvedMedia, (generatedMedia) => normalizeFlowMediaId(_.toString(generatedMedia.editId || extractFlowMediaIdFromUrl(generatedMedia.thumbnailSrc || SecurityConstants.EMPTY_STRING) || extractFlowMediaIdFromUrl(generatedMedia.videoSrc || SecurityConstants.EMPTY_STRING))))));
          remoteVideoMediaId = _.head(remoteVideoMediaIds);
          if (generatedBatch.rejected && _.isEmpty(remoteVideoMediaIds)) throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.GENERATION_REJECTED_ERROR);
          if (generatedBatch.timedOut || _.lt(_.size(remoteVideoMediaIds), FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT)) {
            throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.INCOMPLETE_OUTPUT_BATCH_ERROR);
          }
          const sourceUrl = _.toString(_.find(resolvedMedia, (candidate) => FLOW_VIDEO_MEDIA_CONFIG.HTML_VIDEO_URL_PATTERN.test(_.toString(candidate.videoSrc)))?.videoSrc);
          if (sourceUrl) remoteVideoSourceUrl = sourceUrl;
          if (remoteVideoSourceUrl && browserInstance) {
            const downloaded = await downloadValidatedVideo(browserInstance.context, [remoteVideoSourceUrl], parseConfiguredVideoDuration(normalizedModelSettings.duration)).catch(() => null);
            if (downloaded) finalBase64s = [downloaded.buffer.toString(REFACTOR_CONSTANTS.ENCODING_BASE64)];
          }
          if (!finalBase64s.length && browserInstance && remoteVideoMediaId) {
            const downloaded = await downloadFlowVideoFromEditor(activePage, currentProjectId, remoteVideoMediaId, parseConfiguredVideoDuration(normalizedModelSettings.duration));
            if (downloaded) finalBase64s = [downloaded.buffer.toString(REFACTOR_CONSTANTS.ENCODING_BASE64)];
          }
          finalBase64 = _.head(finalBase64s) || SecurityConstants.EMPTY_STRING;
        } else {
          const base64Data = await activePage.waitForFunction(
            (browserPayload) => {
              const { SOURCE_BROWSER_TEXT_RETURN, SOURCE_TEXT_IMG, SOURCE_BROWSER_TEXT_DATA_IMAGE, SOURCE_BROWSER_TEXT_INSTANT, SOURCE_TEXT_CENTER, SOURCE_TEXT_CANVAS, SOURCE_BROWSER_TEXT_2D } = browserPayload.texts;
              const [oldIdsList, getImgIdStr, jpegMimeType] = browserPayload.payload;
              const getImgIdSafe = new Function(SOURCE_BROWSER_TEXT_RETURN + getImgIdStr)();
              const imgNodes = document.querySelectorAll(SOURCE_TEXT_IMG);
              let newImg: HTMLImageElement | null = null;
              Array.from(imgNodes).some((img) => {
                if (img.src && img.src.includes(SOURCE_BROWSER_TEXT_DATA_IMAGE)) {
                  newImg = img;
                  return true;
                }
                const imgId = getImgIdSafe(img.src);
                return imgId && !oldIdsList.includes(imgId);
              });
              if (newImg) {
                try {
                  newImg.scrollIntoView({ behavior: SOURCE_BROWSER_TEXT_INSTANT, block: SOURCE_TEXT_CENTER });
                } catch (e) {}
                if (!newImg.complete || newImg.naturalWidth === 0) return null;
                const canvas = document.createElement(SOURCE_TEXT_CANVAS);
                canvas.width = newImg.naturalWidth;
                canvas.height = newImg.naturalHeight;
                canvas.getContext(SOURCE_BROWSER_TEXT_2D)?.drawImage(newImg, 0, 0);
                try {
                  const dataUrl = canvas.toDataURL(jpegMimeType, 0.9);
                  if (dataUrl.length > 1000) return dataUrl;
                } catch (e) {}
              }
              return null;
            },
            { payload: [oldIds, browserGetImgIdSafeStr, CONTENT_TYPES.JPEG] as const, texts: { SOURCE_BROWSER_TEXT_RETURN, SOURCE_TEXT_IMG, SOURCE_BROWSER_TEXT_DATA_IMAGE, SOURCE_BROWSER_TEXT_INSTANT, SOURCE_TEXT_CENTER, SOURCE_TEXT_CANVAS, SOURCE_BROWSER_TEXT_2D } },
            { timeout: 150000 },
          );
          finalBase64 = await base64Data.jsonValue();
        }
        appLog(_.isEqual(visualConfig?.generateType, GenerateType.Video) ? FLOW_VIDEO_MEDIA_CONFIG.OUTPUT_BATCH_READY_LOG : BACKEND_MESSAGES.PLAYWRIGHT_BASE64_SUCCESS);
        responseText = jsonUtils.safeStringify({ directBase64: finalBase64, directBase64s: finalBase64s });
        success = true;
      } catch (error: unknown) {
        lastGenerationError = getErrorMessage(error);
        appError(ImageGenMessages.IMAGE_RENDER_ERR.replace(SOURCE_TEXT_0_2, attempts.toString()).replace(SOURCE_TEXT_1_3, getErrorMessage(error)));
        if (attempts >= maxAttempts) throw error;
        const browserSessionUnavailable = !browserInstance || !activePage || activePage.isClosed() || browserInstance.context.pages().length === 0;
        if (browserSessionUnavailable) {
          await closeActiveBrowser();
          browserInstance = null;
          activePage = null;
        } else if (!isFlowVideoGeneration) {
          await activePage.reload({ waitUntil: SOURCE_TEXT_DOMCONTENTLOADED, timeout: 60000 }).catch(() => undefined);
        }
      } finally {
        if (activePage && flowResponseListener) activePage.off(SOURCE_TEXT_RESPONSE, flowResponseListener);
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
    appLog(BACKEND_MESSAGES.PLAYWRIGHT_MUTEX_DELAY.replace(SOURCE_TEXT_0_2, delayTime.toString()));
    release();
  }
  try {
    const parsed = jsonUtils.safeParse<{ directBase64?: string; directBase64s?: string[] }>(responseText, {});
    if (parsed.directBase64) {
      const encodedOutputs = _.isEmpty(parsed.directBase64s) ? [parsed.directBase64] : parsed.directBase64s!;
      const cleanBase64s = _.map(encodedOutputs, (encodedOutput) => (_.includes(encodedOutput, SOURCE_TEXT_SYMBOL_4) ? _.toString(_.last(_.split(encodedOutput, SOURCE_TEXT_SYMBOL_4))) : encodedOutput));
      const cleanBase64 = _.head(cleanBase64s)!;
      return {
        success: true,
        base64: cleanBase64,
        base64s: cleanBase64s,
        fallbackUrl: parsed.directBase64,
        fallbackUrls: encodedOutputs,
        newProjectId: currentProjectId !== cleanProjectId ? currentProjectId : undefined,
        remoteMediaId: remoteVideoMediaId,
        remoteMediaIds: remoteVideoMediaIds,
        remoteVideoSourceUrl,
        remoteMediaCreated: !_.isEmpty(remoteVideoMediaIds) || !_.isEmpty(remoteVideoMediaId),
      };
    }
  } catch (e) {}
  const generationWasRejected = GEMINI_MEDIA_ERRORS.PROVIDER_REJECTION_PATTERN.test(lastGenerationError);
  return {
    success: false,
    base64: null,
    fallbackUrl: SecurityConstants.EMPTY_STRING,
    warning: generationWasRejected && _.isEmpty(remoteVideoMediaIds) ? lastGenerationError : !_.isEmpty(remoteVideoMediaIds) || !_.isEmpty(remoteVideoMediaId) ? FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR : lastGenerationError,
    newProjectId: currentProjectId !== cleanProjectId ? currentProjectId : undefined,
    remoteMediaId: generationWasRejected && _.isEmpty(remoteVideoMediaIds) ? undefined : remoteVideoMediaId,
    remoteMediaIds: generationWasRejected && _.isEmpty(remoteVideoMediaIds) ? [] : remoteVideoMediaIds,
    remoteVideoSourceUrl,
    remoteMediaCreated: !_.isEmpty(remoteVideoMediaIds) || (!generationWasRejected && !_.isEmpty(remoteVideoMediaId)),
  };
}
const isCaptchaOrChallengeActive = async (page: Page): Promise<boolean> => {
  if (page.isClosed()) return false;
  const currentUrl = page.url();
  const isChallengeUrl = _.some([GEMINI_CHAT_RECOVERY_CONFIG.CHALLENGE_URL_KEYWORD, GEMINI_CHAT_RECOVERY_CONFIG.SORRY_URL_KEYWORD, GEMINI_CHAT_RECOVERY_CONFIG.ACCOUNTS_URL_KEYWORD], (kw) => _.includes(currentUrl, kw));
  if (isChallengeUrl) return true;
  try {
    const hasChallengeFrame = (await page.locator(SOURCE_TEXT_IFRAME_SRC_RECAPTCHA_IFRAME_SRC_CHALLENGE).count()) > 0;
    if (hasChallengeFrame) return true;
    const bodyText = await page.evaluate(
      (browserData) => {
        const { XRT } = browserData.studioTexts;
        return document.body?.innerText?.toLowerCase() || XRT.EMPTY;
      },
      { studioTexts: { XRT: { EMPTY: XRT.EMPTY } } },
    );
    return _.includes(bodyText, SOURCE_TEXT_XAC_MINH_BAN_LA_NGUOI) || _.includes(bodyText, SOURCE_TEXT_VERIFY_YOU_ARE_HUMAN) || _.includes(bodyText, SOURCE_TEXT_UNUSUAL_TRAFFIC) || _.includes(bodyText, SOURCE_TEXT_RECAPTCHA);
  } catch {
    return false;
  }
};
const waitForGeminiReadyOrCaptchaSolved = async (page: Page, tabIndex?: number): Promise<boolean> => {
  const startTime = Date.now();
  let warnedCaptcha = false;
  const tabLabel = _.isNumber(tabIndex) ? _.toString(_.add(tabIndex, SecurityConstants.DEFAULT_AMOUNT)) : SOURCE_TEXT_1;
  while (_.lt(_.subtract(Date.now(), startTime), GEMINI_CHAT_RECOVERY_CONFIG.CAPTCHA_WAIT_TIMEOUT_MS)) {
    if (page.isClosed()) return false;
    try {
      const inputLoc = page.locator(GeminiChatSelector.Input).first();
      if ((await inputLoc.count()) > 0 && (await inputLoc.isVisible())) {
        if (warnedCaptcha) {
          appLog(BACKEND_MESSAGES.GEMINI_CAPTCHA_SOLVED_RESUMING.replace(SOURCE_TEXT_0_2, tabLabel));
        }
        return true;
      }
    } catch {}
    const isCaptcha = await isCaptchaOrChallengeActive(page);
    if (isCaptcha && !warnedCaptcha) {
      warnedCaptcha = true;
      appLog(BACKEND_MESSAGES.GEMINI_CAPTCHA_DETECTED.replace(SOURCE_TEXT_0_2, tabLabel));
    }
    await delayAsync(GEMINI_CHAT_RECOVERY_CONFIG.CAPTCHA_POLL_INTERVAL_MS);
  }
  return false;
};
const roomReferenceSignatureMap = new WeakMap<Page, string>();
const geminiAspectControlUnavailablePages = new WeakSet<Page>();
const getFlowBatchCandidateMediaId = (candidate: FlowGeneratedMediaCandidate): string => normalizeFlowMediaId(_.toString(candidate.editId || extractFlowMediaIdFromUrl(candidate.thumbnailSrc || SecurityConstants.EMPTY_STRING) || extractFlowMediaIdFromUrl(candidate.videoSrc || SecurityConstants.EMPTY_STRING)));
const getFlowPromptMatchScore = (prompt: string, candidateText: string | null | undefined, batchPrompts: string[]): number => {
  const normalizedPrompt = _.toLower(normalizeFlowPromptValue(prompt));
  const normalizedCandidateText = _.toLower(normalizeFlowPromptValue(candidateText || SecurityConstants.EMPTY_STRING));
  if (_.isEmpty(normalizedPrompt) || _.isEmpty(normalizedCandidateText)) return SecurityConstants.ZERO;
  if (_.includes(normalizedCandidateText, normalizedPrompt)) return 10000;
  const orderedPromptWords = _.filter(_.words(normalizedPrompt), (word) => _.gte(word.length, 4));
  const promptWords = _.uniq(orderedPromptWords);
  const candidateWords = new Set(_.filter(_.words(normalizedCandidateText), (word) => _.gte(word.length, 4)));
  const batchWordFrequency = _.countBy(_.flatMap(batchPrompts, (batchPrompt) => _.uniq(_.filter(_.words(_.toLower(normalizeFlowPromptValue(batchPrompt))), (word) => _.gte(word.length, 4)))));
  const distinctiveWordScore = _.sumBy(promptWords, (word) => (candidateWords.has(word) && _.isEqual(batchWordFrequency[word], SecurityConstants.DEFAULT_AMOUNT) ? 3 : SecurityConstants.ZERO));
  const promptBigrams = _.filter(
    _.map(_.range(_.subtract(orderedPromptWords.length, 1)), (index) => XRT.JOIN_WITH_SPACE(orderedPromptWords[index], orderedPromptWords[index + 1])),
    (bigram) => _.includes(normalizedCandidateText, bigram),
  );
  return _.add(distinctiveWordScore, _.multiply(promptBigrams.length, 5));
};
export const assignFlowVideoBatchMediaIds = (items: FlowVideoPromptBatchItem[], candidates: FlowGeneratedMediaCandidate[]): Array<{ sceneId: string; mediaId?: string }> => {
  const uniqueCandidates = _.uniqBy(
    _.filter(candidates, (candidate) => !_.isEmpty(getFlowBatchCandidateMediaId(candidate))),
    getFlowBatchCandidateMediaId,
  );
  const batchPrompts = _.map(items, SOURCE_TEXT_PROMPT);
  let bestAssignments = new Map<string, string>();
  let bestMatchedCount = SecurityConstants.ZERO;
  let bestTotalScore = SecurityConstants.ZERO;
  const findBestAssignment = (itemIndex: number, availableCandidateIndexes: number[], assignments: Map<string, string>, totalScore: number): void => {
    if (_.gte(itemIndex, items.length)) {
      if (_.gt(assignments.size, bestMatchedCount) || (_.isEqual(assignments.size, bestMatchedCount) && _.gt(totalScore, bestTotalScore))) {
        bestAssignments = new Map(assignments);
        bestMatchedCount = assignments.size;
        bestTotalScore = totalScore;
      }
      return;
    }
    findBestAssignment(_.add(itemIndex, 1), availableCandidateIndexes, assignments, totalScore);
    const item = items[itemIndex];
    _.forEach(availableCandidateIndexes, (candidateIndex) => {
      const candidate = uniqueCandidates[candidateIndex];
      const score = getFlowPromptMatchScore(item.prompt, candidate.promptText, batchPrompts);
      if (_.lt(score, 3)) return;
      const nextAssignments = new Map(assignments);
      nextAssignments.set(item.sceneId, getFlowBatchCandidateMediaId(candidate));
      findBestAssignment(_.add(itemIndex, 1), _.without(availableCandidateIndexes, candidateIndex), nextAssignments, _.add(totalScore, score));
    });
  };
  findBestAssignment(SecurityConstants.ZERO, _.range(uniqueCandidates.length), new Map(), SecurityConstants.ZERO);
  return _.map(items, (item) => ({ sceneId: item.sceneId, mediaId: bestAssignments.get(item.sceneId) }));
};
export async function generateFlowVideoPromptBatchWithPlaywright(options: FlowVideoPromptBatchOptions): Promise<FlowVideoPromptBatchResult[]> {
  const items = options.items;
  if (_.isEmpty(items)) return [];
  if (_.gt(items.length, FLOW_DIRECT_VIDEO_CONFIG.PROMPTS_PER_BATCH) || _.some(items, (item) => _.isEmpty(_.trim(item.sceneId)) || _.isEmpty(_.trim(item.prompt))) || _.uniq(_.map(items, SOURCE_TEXT_SCENEID)).length !== items.length) {
    throw createAppError(SOURCE_TEXT_INVALID_FLOW_VIDEO_PROMPT_BATCH);
  }
  const requestedVisualConfig = { ...options.visualConfig, generateType: GenerateType.Video, generateCount: FLOW_DIRECT_VIDEO_CONFIG.VIDEO_OUTPUT_COUNT };
  const requestedEngine = _.defaultTo(requestedVisualConfig.imageGeneratorEngine, ImageGeneratorEngine.Veo3);
  const normalizedModelSettings = normalizeVideoModelSettings(
    requestedEngine,
    { duration: requestedVisualConfig.videoDuration, resolution: requestedVisualConfig.videoResolution, aspectRatio: requestedVisualConfig.aspectRatio as AspectRatio },
    _.some(items, (item) => !_.isEmpty(item.referenceImages) || !_.isEmpty(item.referenceCharacterNames)),
  );
  if (!normalizedModelSettings.supportsReferences) {
    return _.map(items, (item) => ({ sceneId: item.sceneId, success: false, base64: null, fallbackUrl: SecurityConstants.EMPTY_STRING, warning: VIDEO_MODEL_CAPABILITY_CONFIG.REFERENCE_UNSUPPORTED_ERROR }));
  }
  const visualConfig = { ...requestedVisualConfig, videoDuration: normalizedModelSettings.duration, videoResolution: normalizedModelSettings.resolution, aspectRatio: normalizedModelSettings.aspectRatio };
  const cleanProjectId = normalizeFlowProjectId(options.sandboxConfig?.flowProjectId || options.sandboxConfig?.projectId);
  let currentProjectId = cleanProjectId;
  let browserInstance: BrowserSession | null = null;
  let activePage: Page | null = null;
  const flowResponseUrls: string[] = [];
  let flowResponseListener: ((response: any) => void) | undefined;
  const release = await imageGenMutex.acquire();
  activeFlowVideoGenerationCount = _.add(activeFlowVideoGenerationCount, items.length);
  try {
    browserInstance = await getOrLaunchGlobalBrowser(visualConfig.chromeHeadless, true);
    activePage = browserInstance.page;
    if (!isFlowProjectPageUrl(activePage.url(), currentProjectId)) {
      if (_.isEmpty(currentProjectId)) currentProjectId = await createFlowProject(activePage);
      else {
        await activePage.goto(SOURCE_TEMPLATE_SYMBOL(`${EXTERNAL_URLS.GOOGLE_LABS_FLOW}`, `${currentProjectId}`), { waitUntil: FLOW_DIRECT_VIDEO_CONFIG.PAGE_READY_LOAD_STATE, timeout: 60000 });
      }
    }
    await throwIfSharedChromeFlowLoginRequired(browserInstance, currentProjectId);
    if (currentProjectId && (await isFlowProjectUnavailable(activePage))) currentProjectId = await replaceUnavailableFlowProject(activePage);
    await dismissFlowOnboarding(activePage);
    const configured = await configureFlowDirectVideoSettings(activePage, visualConfig);
    if (!configured) throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.CONFIG_MISMATCH_ERROR);
    lastPlaywrightConfigState = createFlowVideoConfigState(visualConfig);
    const oldVideoSources = await activePage.evaluate(
      (browserPayload) => {
        const { SOURCE_TEXT_VIDEO_2 } = browserPayload.texts;
        return Array.from(document.querySelectorAll(SOURCE_TEXT_VIDEO_2))
          .map((video) => video.currentSrc || video.src)
          .filter(Boolean);
      },
      { payload: undefined, texts: { SOURCE_TEXT_VIDEO_2 } },
    );
    const oldVideoThumbnailSources = await activePage.evaluate(
      (browserPayload) => {
        const { SOURCE_BROWSER_TEXT_IMG_ALT_VIDEO_I } = browserPayload.texts;
        return Array.from(document.querySelectorAll(SOURCE_BROWSER_TEXT_IMG_ALT_VIDEO_I))
          .map((image) => (image as HTMLImageElement).currentSrc || (image as HTMLImageElement).src)
          .filter(Boolean);
      },
      { payload: undefined, texts: { SOURCE_BROWSER_TEXT_IMG_ALT_VIDEO_I } },
    );
    const oldVideoEditIds = _.uniq([...(await getFlowVideoEditIds(activePage)), ..._.compact(_.map([...oldVideoSources, ...oldVideoThumbnailSources], extractFlowMediaIdFromUrl)), ..._.map(options.sandboxConfig?.knownVideoMediaIds || [], normalizeFlowMediaId)]);
    const oldVideoGenerationFailureCount = await activePage.evaluate(
      (browserPayload) => {
        const { XRT } = browserPayload.studioTexts;
        const { SOURCE_TEXT_GI } = browserPayload.texts;
        const generationFailurePatternSource = browserPayload.payload;
        return (document.body?.innerText || XRT.EMPTY).match(new RegExp(generationFailurePatternSource, SOURCE_TEXT_GI))?.length || 0;
      },
      { payload: FLOW_DIRECT_VIDEO_CONFIG.GENERATION_FAILURE_PATTERN.source, texts: { SOURCE_TEXT_GI }, studioTexts: { XRT: { EMPTY: XRT.EMPTY } } },
    );
    flowResponseListener = (response: any) => {
      const responseUrl = _.toString(response.url());
      if (/video|media|download|googleusercontent|storage/i.test(responseUrl)) flowResponseUrls.push(responseUrl);
    };
    activePage.on(SOURCE_TEXT_RESPONSE, flowResponseListener);
    const item = items[0];
    let input = await locateFlowPromptInput(activePage, 15000);
    if (!input) throw createAppError(BACKEND_MESSAGES.PLAYWRIGHT_INPUT_NOT_FOUND);
    if (!(await replaceFlowPromptInput(activePage, input, item.prompt))) throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.PROMPT_NOT_READY_ERROR);
    if (!_.isEmpty(item.referenceCharacterNames)) await attachFlowCharactersByName(activePage, item.referenceCharacterNames!);
    else await uploadProviderCharacterReferences(activePage, item.referenceImages, SOURCE_TEXT_FLOW, item.referenceImageNames, item.requireReferenceReady);
    input = await locateFlowPromptInput(activePage, FLOW_CHARACTER_CONFIG.ATTACHMENT_VERIFY_TIMEOUT_MS);
    if (!input || !isFlowPromptValueApplied(await readFlowPromptInput(input), item.prompt)) throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.PROMPT_NOT_READY_ERROR);
    const namedSubmitButton = activePage.getByRole(SOURCE_TEXT_BUTTON, { name: PLAYWRIGHT_SUBMIT_TEXT_REGEX }).last();
    const iconSubmitButton = activePage
      .locator(SOURCE_TEXT_BUTTON)
      .filter({ has: activePage.locator(SOURCE_TEXT_I_MAT_ICON).filter({ hasText: PLAYWRIGHT_SUBMIT_ICON_REGEX }) })
      .last();
    const submitButton = (await namedSubmitButton.isVisible().catch(() => false)) ? namedSubmitButton : iconSubmitButton;
    const submitReadyDeadline = _.add(Date.now(), FLOW_DIRECT_VIDEO_CONFIG.CONFIG_VERIFY_TIMEOUT_MS);
    while (_.lt(Date.now(), submitReadyDeadline) && !(await submitButton.isEnabled().catch(() => false))) await activePage.waitForTimeout(500);
    if (!(await submitButton.isEnabled().catch(() => false))) throw createAppError(FLOW_DIRECT_VIDEO_CONFIG.PROMPT_NOT_READY_ERROR);
    await submitButton.scrollIntoViewIfNeeded();
    await smoothMouseMove(activePage, submitButton);
    await submitButton.click();
    await approveFlowVideoCreditPrompt(activePage, submitButton);
    appLog(FLOW_AUTOMATION_MESSAGES.FLOW_SENT_PROMPT_ROOM(SecurityConstants.DEFAULT_AMOUNT, items.length, item.sceneId));
    const generatedBatch = await waitForFlowGeneratedMediaBatch(activePage, oldVideoEditIds, oldVideoSources, oldVideoThumbnailSources, oldVideoGenerationFailureCount, flowResponseUrls, items.length);
    const resolvedMedia = await resolveFlowGeneratedMediaDetails(activePage, generatedBatch.media, currentProjectId);
    const assignments = assignFlowVideoBatchMediaIds(items, resolvedMedia);
    const results: FlowVideoPromptBatchResult[] = [];
    for (const { sceneId, mediaId } of assignments) {
      const candidate = _.find(resolvedMedia, (item) => _.isEqual(getFlowBatchCandidateMediaId(item), mediaId));
      const htmlVideoUrl = _.trim(_.toString(candidate?.videoSrc));
      let downloadedVideo = htmlVideoUrl && FLOW_VIDEO_MEDIA_CONFIG.HTML_VIDEO_URL_PATTERN.test(htmlVideoUrl) ? await downloadValidatedVideo(browserInstance.context, [htmlVideoUrl], parseConfiguredVideoDuration(normalizedModelSettings.duration)).catch(() => null) : null;
      if (!downloadedVideo && mediaId) {
        const mediaCard = await waitForFlowMediaCardReady(activePage, mediaId, FLOW_VIDEO_MEDIA_CONFIG.RECOVERY_READY_TIMEOUT_MS).catch(() => null);
        if (mediaCard) {
          downloadedVideo = await downloadFlowVideoFromCard(activePage, mediaCard, oldVideoSources, parseConfiguredVideoDuration(normalizedModelSettings.duration), mediaId);
        }
      }
      if (!downloadedVideo && mediaId) {
        downloadedVideo = await downloadFlowVideoFromEditor(activePage, currentProjectId, mediaId, parseConfiguredVideoDuration(normalizedModelSettings.duration));
      }
      results.push({
        sceneId,
        success: !_.isEmpty(mediaId),
        base64: downloadedVideo?.buffer.toString(REFACTOR_CONSTANTS.ENCODING_BASE64) || null,
        fallbackUrl: SecurityConstants.EMPTY_STRING,
        warning: _.isEmpty(mediaId) ? (generatedBatch.timedOut ? FLOW_VIDEO_MEDIA_CONFIG.INCOMPLETE_OUTPUT_BATCH_ERROR : FLOW_DIRECT_VIDEO_CONFIG.GENERATION_REJECTED_ERROR) : downloadedVideo ? undefined : FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR,
        newProjectId: currentProjectId !== cleanProjectId ? currentProjectId : undefined,
        remoteMediaId: mediaId,
        remoteMediaIds: _.compact([mediaId]),
        remoteVideoSourceUrl: FLOW_VIDEO_MEDIA_CONFIG.HTML_VIDEO_URL_PATTERN.test(htmlVideoUrl) ? htmlVideoUrl : undefined,
        remoteMediaCreated: !generatedBatch.rejected || !_.isEmpty(generatedBatch.media),
      });
    }
    return results;
  } catch (error) {
    const warning = getErrorMessage(error);
    return _.map(items, (item) => ({ sceneId: item.sceneId, success: false, base64: null, fallbackUrl: SecurityConstants.EMPTY_STRING, warning, remoteMediaCreated: true, newProjectId: currentProjectId !== cleanProjectId ? currentProjectId : undefined }));
  } finally {
    if (activePage && flowResponseListener) activePage.off(SOURCE_TEXT_RESPONSE, flowResponseListener);
    activeFlowVideoGenerationCount = _.max([SecurityConstants.ZERO, _.subtract(activeFlowVideoGenerationCount, items.length)])!;
    if (browserInstance) {
      if (options.retainBrowserSession) scheduleGlobalBrowserCleanup();
      else await closeActiveBrowser();
    }
    release();
  }
}
const getGeminiWorkspaceUrl = (_generateType?: GenerateType): string => EXTERNAL_URLS.GEMINI_CHAT;
export async function generateImageWithGeminiChat(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {
  const generationRevision = mediaGenerationRevision;
  const { prompt, visualConfig } = options;
  const finalPrompt = prompt || XRT.EMPTY;
  const release = await geminiBatchMutex.acquire();
  await randomDelay(1000, 4000);
  let success = false;
  let base64Result: string | null = null;
  let roomAttempts = SecurityConstants.ZERO;
  const maxRoomAttempts = _.isEqual(visualConfig.generateType, GenerateType.Video) ? 2 : GEMINI_CHAT_RECOVERY_CONFIG.MAX_ROOMS_PER_ITEM;
  let browserInstance: BrowserSession | null = null;
  let activePage: Page | null = null;
  let ownsActivePage = false;
  let terminalWarning = BACKEND_MESSAGES.GEMINI_CHAT_FALLBACK_WARNING;
  try {
    while (roomAttempts < maxRoomAttempts && !success && !isMediaGenerationCancelled(generationRevision)) {
      roomAttempts++;
      let detectedRatio = visualConfig?.aspectRatio;
      if (!detectedRatio && finalPrompt) {
        if (_.includes(finalPrompt, SOURCE_TEXT_16_9) || _.includes(finalPrompt.toLowerCase(), SOURCE_TEXT_HORIZONTAL)) {
          detectedRatio = SOURCE_TEXT_16_9;
        } else if (_.includes(finalPrompt, SOURCE_TEXT_9_16) || _.includes(finalPrompt.toLowerCase(), SOURCE_TEXT_VERTICAL)) {
          detectedRatio = SOURCE_TEXT_9_16;
        }
      }
      if (!detectedRatio) detectedRatio = SOURCE_TEXT_9_16;
      const currentConfigState = jsonUtils.safeStringify({ generateType: visualConfig?.generateType || GenerateType.Image, imageGeneratorEngine: visualConfig?.imageGeneratorEngine || ImageGeneratorEngine.Veo3, aspectRatio: detectedRatio });
      const isConfigChanged = currentConfigState !== lastGeminiConfigState;
      let needNewRoom = _.gt(roomAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT);
      try {
        if (!browserInstance) {
          browserInstance = await getOrLaunchGlobalBrowser(visualConfig?.chromeHeadless, true);
          if (options.forceNewPage) {
            activePage = await browserInstance.context.newPage();
            ownsActivePage = true;
          } else {
            activePage = browserInstance.page;
          }
          if (_.includes(activePage.url(), SOURCE_TEXT_GROK_COM)) {
            activePage = await browserInstance.context.newPage();
            ownsActivePage = true;
          }
        }
        const currentUrl = activePage!.url();
        if (!_.includes(currentUrl, SOURCE_TEXT_GEMINI_GOOGLE_COM)) {
          needNewRoom = true;
        } else if (consecutiveGeminiErrors >= GEMINI_CHAT_RECOVERY_CONFIG.MAX_ATTEMPTS_PER_ROOM) {
          needNewRoom = true;
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_ROOM_FORCED);
        } else if (isConfigChanged) {
          needNewRoom = true;
          appLog(ImageGenMessages.CONFIG_CHANGED_FORCE_NEW_ROOM);
        }
        if (needNewRoom) {
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_START_ROOM.replace(SOURCE_TEXT_0_2, roomAttempts.toString()).replace(SOURCE_TEXT_1_3, maxRoomAttempts.toString()));
          await activePage.goto(getGeminiWorkspaceUrl(visualConfig?.generateType), { waitUntil: GEMINI_BATCH_SETUP_CONFIG.WAIT_UNTIL, timeout: GEMINI_BATCH_SETUP_CONFIG.NAVIGATION_TIMEOUT_MS });
          await randomDelay(GEMINI_BATCH_SETUP_CONFIG.DELAY_MIN_MS, GEMINI_BATCH_SETUP_CONFIG.DELAY_MAX_MS);
          roomReferenceSignatureMap.delete(activePage);
          geminiAspectControlUnavailablePages.delete(activePage);
          consecutiveGeminiErrors = 0;
        } else {
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_ROOM_REUSE);
        }
      } catch (error: unknown) {
        appError(BACKEND_MESSAGES.GEMINI_CHAT_INIT_FAILED.replace(SOURCE_TEXT_0_2, getErrorMessage(error)));
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
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_RELOAD.replace(SOURCE_TEXT_0_2, _.toString(_.subtract(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT))));
          try {
            await activePage!.reload({ waitUntil: GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_WAIT_UNTIL, timeout: GEMINI_BATCH_SETUP_CONFIG.NAVIGATION_TIMEOUT_MS });
            await randomDelay(GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_DELAY_MIN_MS, GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_DELAY_MAX_MS);
          } catch (reloadError) {
            consecutiveGeminiErrors++;
            appError(BACKEND_MESSAGES.GEMINI_CHAT_RELOAD_FAILED.replace(SOURCE_TEXT_0_2, getErrorMessage(reloadError)));
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
            throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_NOT_FOUND.replace(SOURCE_TEXT_0_2, _.isEqual(visualConfig.generateType, GenerateType.Video) ? GeminiChatTextOption.CreateVideoVi : GeminiChatTextOption.CreateImageVi));
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
            appError(BACKEND_MESSAGES.GEMINI_CHAT_CLICK_SEND_FAILED.replace(SOURCE_TEXT_0_2, getErrorMessage(error)));
          }
          if (!clicked) {
            await activePage!.keyboard.press(SOURCE_TEXT_ENTER);
            appLog(BACKEND_MESSAGES.GEMINI_CHAT_PRESSED_ENTER);
          }
          base64Result = await waitForDownloadAndGetBase64(activePage!, visualConfig, initialResponseCount);
          if (base64Result) {
            success = true;
            consecutiveGeminiErrors = 0;
          }
          const isAspectRatioMismatch = base64Result && !_.isEqual(visualConfig.generateType, GenerateType.Video) && !isImageAspectRatioCompatible(base64Result, visualConfig.aspectRatio);
          if (isAspectRatioMismatch) {
            appLog(SOURCE_TEMPLATE_GEMINICHAT(`${BACKEND_MESSAGES.ASPECT_RATIO_DIFFERENCE_LOG.replace(SOURCE_TEXT_0_2, visualConfig.aspectRatio || SOURCE_TEXT_16_9)}`));
          }
          if (!base64Result) throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERR_THROW);
        } catch (error: unknown) {
          consecutiveGeminiErrors++;
          const errorMessage = getErrorMessage(error);
          appError(BACKEND_MESSAGES.GEMINI_CHAT_ATTEMPT_FAILED.replace(SOURCE_TEXT_0_2, reloadAttempts.toString()).replace(SOURCE_TEXT_1_3, roomAttempts.toString()).replace(SOURCE_TEXT_2_2, errorMessage));
          if (GEMINI_MEDIA_ERRORS.PROVIDER_REJECTION_PATTERN.test(errorMessage)) {
            terminalWarning = errorMessage;
            throw error;
          }
        }
      }
    }
  } catch (error: unknown) {
    const failureReason = getErrorMessage(error);
    if (GEMINI_MEDIA_ERRORS.PROVIDER_REJECTION_PATTERN.test(failureReason)) terminalWarning = failureReason;
    appError(BACKEND_MESSAGES.GEMINI_CHAT_FAILED_COMPLETELY.replace(SOURCE_TEXT_0_2, failureReason));
  } finally {
    if (ownsActivePage && activePage && !activePage.isClosed()) await activePage.close().catch(() => undefined);
    if (browserInstance) {
      if (options.retainBrowserSession) scheduleGlobalBrowserCleanup();
      else {
        await closeActiveBrowser();
      }
    }
    const delayTime = await randomDelay();
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_MUTEX_DELAY.replace(SOURCE_TEXT_0_2, delayTime.toString()));
    release();
  }
  if (success && base64Result) {
    return { success: true, base64: base64Result, fallbackUrl: `${COMMON_STRINGS.BASE64_JPEG_PREFIX}${base64Result}` };
  }
  return { success: false, base64: null, fallbackUrl: SecurityConstants.EMPTY_STRING, warning: terminalWarning };
}
export interface BatchImageItem {
  sceneId: string;
  prompt: string;
  generateType?: GenerateType;
  referenceImages?: string[];
  referenceImageNames?: string[];
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
const resolveBatchAssetType = (item: BatchImageItem): GenerateType.Image | GenerateType.Video => (_.isEqual(item.generateType, GenerateType.Video) ? GenerateType.Video : GenerateType.Image);
const getBatchItemVisualConfig = (item: BatchImageItem, visualConfig: GeminiVisualConfig): GeminiVisualConfig & { generateType: GenerateType.Image | GenerateType.Video } => {
  const isThumbnail = _.some([SOURCE_TEXT_TH, SOURCE_TEXT_THUMB, SOURCE_TEXT_THUMBNAIL_2], (prefix) => _.startsWith(_.toString(item.sceneId), prefix));
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
    targetReferences = !_.isEmpty(item?.referenceImages) ? (item.referenceImages as any[]) : !_.isEmpty(visualConfig?.sceneReferenceImages) ? (visualConfig.sceneReferenceImages as any[]) : !_.isEmpty(visualConfig?.referenceImages) ? (visualConfig.referenceImages as any[]) : !_.isEmpty(visualConfig?.styleReferenceImages) ? (visualConfig.styleReferenceImages as any[]) : [];
  }
  return {
    ...visualConfig,
    generateType: resolveBatchAssetType(item),
    imageGeneratorEngine: visualConfig.imageGeneratorEngine,
    referenceImages: targetReferences,
    referenceImageNames: item.referenceImageNames || visualConfig.referenceImageNames,
    sceneReferenceImages: visualConfig?.sceneReferenceImages,
    styleReferenceImages: visualConfig?.styleReferenceImages,
    thumbnailReferenceImages: visualConfig?.thumbnailReferenceImages,
  };
};
export async function closeAllBatchPages() {
  const openPageCount = _.size(_.filter(_.uniq(_.compact([...globalBatchPages, activeBrowserInstance?.page, grokPage])), (page) => !page.isClosed()));
  await closeActiveBrowser();
  for (const page of globalBatchPages) {
    try {
      if (!page.isClosed()) {
        await page.close();
      }
    } catch (e) {}
  }
  if (grokPage && !grokPage.isClosed()) await grokPage.close().catch(() => undefined);
  await closeOwnedGrokBrowserIfIdle(true);
  if (grokBrowser?.isConnected()) await grokBrowser.close().catch(() => undefined);
  globalBatchPages = [];
  grokPage = null;
  grokBrowser = null;
  activeGrokLocalProjectId = null;
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_CLOSE_TABS.replace(SOURCE_TEXT_0_2, _.toString(openPageCount)));
}
export async function cancelAllActiveMediaGeneration(): Promise<void> {
  mediaGenerationRevision = _.add(mediaGenerationRevision, SecurityConstants.DEFAULT_AMOUNT);
  if (activeBrowserTimeout) {
    clearTimeout(activeBrowserTimeout);
    activeBrowserTimeout = null;
  }
  const sharedChromePage = activeBrowserInstance?.preserveExternalPages ? activeBrowserInstance.page : undefined;
  const pages = _.reject(_.uniq(_.compact([...globalBatchPages, activeBrowserInstance?.page, grokPage])), (page) => page === sharedChromePage);
  await Promise.allSettled(
    _.map(pages, async (page) => {
      if (!page.isClosed()) await page.close();
    }),
  );
  if (activeBrowserInstance?.ownsContext !== false) {
    await activeBrowserInstance?.context.close().catch(() => undefined);
  }
  await closeOwnedGrokBrowserIfIdle(true);
  if (grokBrowser?.isConnected()) await grokBrowser.close().catch(() => undefined);
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
const createPreparedGeminiBatchPage = async (context: BrowserContext, tabIndex: number, generateType: GenerateType = GenerateType.Image): Promise<Page> => {
  const page = await createGeminiBatchPage(context);
  try {
    await prepareGeminiBatchPage(page, tabIndex, generateType);
    return page;
  } catch (error) {
    await page.close().catch(() => {});
    throw error;
  }
};
const prepareGeminiBatchPage = async (page: Page, index: number, generateType: GenerateType = GenerateType.Image): Promise<void> => {
  const tabNumber = _.add(index, SecurityConstants.DEFAULT_AMOUNT);
  try {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_PREPARE_NEW_ROOM.replace(SecurityConstants.PLACEHOLDER_0, _.toString(tabNumber)));
    await page.goto(getGeminiWorkspaceUrl(generateType), { waitUntil: GEMINI_BATCH_SETUP_CONFIG.WAIT_UNTIL, timeout: GEMINI_BATCH_SETUP_CONFIG.NAVIGATION_TIMEOUT_MS });
    await randomDelay(GEMINI_BATCH_SETUP_CONFIG.DELAY_MIN_MS, GEMINI_BATCH_SETUP_CONFIG.DELAY_MAX_MS);
    roomReferenceSignatureMap.delete(page);
    geminiAspectControlUnavailablePages.delete(page);
    batchPagesErrors.set(page, SecurityConstants.ZERO);
  } catch (error: any) {
    appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_PREPARE_NEW_ROOM_ERR.replace(SecurityConstants.PLACEHOLDER_0, _.toString(tabNumber)).replace(SecurityConstants.PLACEHOLDER_1, error.message));
    throw error;
  }
};
export async function generateBatchImagesWithGeminiChat(items: BatchImageItem[], visualConfig: GeminiVisualConfig, style?: string, onProgress?: (result: BatchImageResult) => void, retainBrowserSession = false): Promise<BatchImageResult[]> {
  const generationRevision = mediaGenerationRevision;
  if (!items || items.length === 0) return [];
  const requestedSpeed = _.toString(visualConfig?.geminiChatSpeed);
  const speed = _.isEqual(requestedSpeed, SOURCE_TEXT_1) ? GeminiChatSpeed.Slow : ((_.includes(_.values(GeminiChatSpeed), requestedSpeed as GeminiChatSpeed) ? requestedSpeed : GeminiChatSpeed.Slow) as GeminiChatSpeed);
  const concurrency = GEMINI_CHAT_SPEED_TAB_COUNT[speed] || 5;
  const maxTabs = resolveBatchTabCount(items.length, concurrency, visualConfig?.batchTabCount);
  if (maxTabs === 1 && !retainBrowserSession) {
    const results: BatchImageResult[] = [];
    try {
      for (let i = 0; i < items.length; i++) {
        if (isMediaGenerationCancelled(generationRevision)) break;
        const item = items[i];
        const itemVisualConfig = getBatchItemVisualConfig(item, visualConfig);
        const result = await generateImageWithGeminiChat({ prompt: item.prompt, style, retainBrowserSession: true, visualConfig: itemVisualConfig });
        const batchRes = { sceneId: item.sceneId, ...result, assetType: itemVisualConfig.generateType };
        results.push(batchRes);
        if (onProgress) onProgress(batchRes);
        if (i < items.length - 1) {
          const delayTime = await applyBatchDelay(visualConfig);
          appLog(BACKEND_MESSAGES.SPAM_PREVENTION_DELAY.replace(SOURCE_TEXT_0_2, delayTime.toString()));
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
    browserInstance = await getOrLaunchGlobalBrowser(visualConfig?.chromeHeadless, true);
    const context = browserInstance.context;
    const reusablePages = _.uniq(_.filter(_.concat(globalBatchPages, context.pages()), (page) => (!retainBrowserSession || page !== browserInstance!.page) && !page.isClosed() && !_.includes(page.url(), SOURCE_TEXT_GROK_COM) && (_.isEqual(page.url(), SOURCE_TEXT_ABOUT_BLANK) || _.includes(page.url(), SOURCE_TEXT_GEMINI_GOOGLE_COM))));
    const candidates = _.take(reusablePages, maxTabs);
    const surplusPages = _.drop(reusablePages, maxTabs);
    await Promise.allSettled(_.map(surplusPages, (page) => page.close()));
    while (_.lt(_.size(candidates), maxTabs)) candidates.push(await createGeminiBatchPage(context));
    const initialBatchGenerateType = _.every(items, (item) => _.isEqual(resolveBatchAssetType(item), GenerateType.Video)) ? GenerateType.Video : GenerateType.Image;
    const prepareExistingTab = async (page: Page, index: number): Promise<Page | null> => {
      for (let attempt = SecurityConstants.ZERO; attempt < GEMINI_CHAT_RECOVERY_CONFIG.MAX_ATTEMPTS_PER_ROOM; attempt++) {
        try {
          await prepareGeminiBatchPage(page, index, initialBatchGenerateType);
          return page;
        } catch (error) {
          appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_INIT_ERROR.replace(SOURCE_TEXT_0_2, getErrorMessage(error)));
        }
      }
      await page.close().catch(() => {});
      return null;
    };
    const preparedPages = await Promise.all(_.map(candidates, prepareExistingTab));
    const readyPages = _.compact(preparedPages);
    if (_.isEmpty(readyPages)) throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_INIT_ERROR.replace(SOURCE_TEXT_0_2, BACKEND_MESSAGES.UNKNOWN_ERROR));
    globalBatchPages = readyPages;
    const activePages = _.slice(readyPages, 0, maxTabs);
    batchWorkerPages = activePages;
    const generateOnTab = async (page: Page, item: BatchImageItem, tabIndex: number): Promise<BatchImageResult> => {
      const itemVisualConfig = getBatchItemVisualConfig(item, visualConfig);
      const hasRefs = !_.isEmpty(itemVisualConfig.referenceImages) || !_.isEmpty(itemVisualConfig.sceneReferenceImages) || !_.isEmpty(itemVisualConfig.styleReferenceImages);
      const finalPrompt = itemVisualConfig.preserveAiPromptText ? item.prompt || XRT.EMPTY : removeConflictingStyleTerms(item.prompt || XRT.EMPTY, hasRefs);
      let success = false;
      let base64Result: string | null = null;
      let roomAttempts = SecurityConstants.ZERO;
      const maxRoomAttempts = _.isEqual(itemVisualConfig.generateType, GenerateType.Video) ? 2 : GEMINI_CHAT_RECOVERY_CONFIG.MAX_ROOMS_PER_ITEM;
      let terminalWarning = BACKEND_MESSAGES.GEMINI_CHAT_FALLBACK_WARNING;
      try {
        while (roomAttempts < maxRoomAttempts && !success) {
          roomAttempts++;
          if (page.isClosed()) {
            throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_PAGE_CLOSED);
          }
          const currentUrl = page.url();
          const consecutiveErrors = batchPagesErrors.get(page) || 0;
          let needNewRoom = false;
          if (!_.includes(currentUrl, SOURCE_TEXT_GEMINI_GOOGLE_COM)) {
            needNewRoom = true;
          } else if (consecutiveErrors >= GEMINI_CHAT_RECOVERY_CONFIG.MAX_ATTEMPTS_PER_ROOM) {
            needNewRoom = true;
            appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_FORCED_NEW_ROOM.replace(SOURCE_TEXT_0_2, (tabIndex + 1).toString()).replace(SOURCE_TEXT_1_3, consecutiveErrors.toString()));
          }
          if (needNewRoom) {
            appLog(
              BACKEND_MESSAGES.GEMINI_CHAT_BATCH_REDIRECT_ATTEMPT.replace(SOURCE_TEXT_0_2, (tabIndex + 1).toString())
                .replace(SOURCE_TEXT_1_3, roomAttempts.toString())
                .replace(SOURCE_TEXT_2_2, maxRoomAttempts.toString()),
            );
            try {
              await page.goto(getGeminiWorkspaceUrl(itemVisualConfig.generateType), { waitUntil: GEMINI_BATCH_SETUP_CONFIG.WAIT_UNTIL, timeout: GEMINI_BATCH_SETUP_CONFIG.NAVIGATION_TIMEOUT_MS });
              await randomDelay(GEMINI_BATCH_SETUP_CONFIG.DELAY_MIN_MS, GEMINI_BATCH_SETUP_CONFIG.DELAY_MAX_MS);
              roomReferenceSignatureMap.delete(page);
              geminiAspectControlUnavailablePages.delete(page);
              batchPagesErrors.set(page, 0);
            } catch (err: any) {
              appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_REDIRECT_FAILED.replace(SOURCE_TEXT_0_2, (tabIndex + 1).toString()).replace(SOURCE_TEXT_1_3, err.message));
              if (roomAttempts >= maxRoomAttempts) throw err;
              continue;
            }
          } else {
            appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_ROOM_REUSE.replace(SOURCE_TEXT_0_2, (tabIndex + 1).toString()));
          }
          let reloadAttempts = SecurityConstants.ZERO;
          const maxReloadAttempts = _.isEqual(itemVisualConfig.generateType, GenerateType.Video) ? 1 : 2;
          while (reloadAttempts < maxReloadAttempts && !success) {
            reloadAttempts++;
            if (_.gt(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT)) {
              appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_RELOAD_ATTEMPT.replace(SOURCE_TEXT_0_2, _.toString(_.add(tabIndex, SecurityConstants.DEFAULT_AMOUNT))).replace(SOURCE_TEXT_1_3, _.toString(_.subtract(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT))));
              try {
                await page.reload({ waitUntil: GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_WAIT_UNTIL, timeout: GEMINI_BATCH_SETUP_CONFIG.NAVIGATION_TIMEOUT_MS });
                await randomDelay(GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_DELAY_MIN_MS, GEMINI_CHAT_RECOVERY_CONFIG.RELOAD_DELAY_MAX_MS);
              } catch (reloadError) {
                batchPagesErrors.set(page, _.add(batchPagesErrors.get(page) || SecurityConstants.ZERO, SecurityConstants.DEFAULT_AMOUNT));
                appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_RELOAD_FAILED.replace(SOURCE_TEXT_0_2, _.toString(_.add(tabIndex, SecurityConstants.DEFAULT_AMOUNT))).replace(SOURCE_TEXT_1_3, getErrorMessage(reloadError)));
                continue;
              }
            }
            try {
              appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace(SOURCE_TEXT_0_2, (tabIndex + 1).toString()).replace(SOURCE_TEXT_1_3, item.sceneId));
              await waitForGeminiPageIdle(page, itemVisualConfig);
              const isPageReady = await waitForGeminiReadyOrCaptchaSolved(page, tabIndex);
              if (!isPageReady) throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_PICKER_NOT_FOUND);
              const currentConfigState = jsonUtils.safeStringify({ generateType: itemVisualConfig.generateType, imageGeneratorEngine: itemVisualConfig.imageGeneratorEngine || ImageGeneratorEngine.Veo3 });
              const lastConfig = batchPagesConfigs.get(page);
              const isConfigChanged = currentConfigState !== lastConfig;
              const forceSetting = needNewRoom || isConfigChanged || _.gt(reloadAttempts, GEMINI_CHAT_RECOVERY_CONFIG.FIRST_ATTEMPT);
              const modelConfigured = await configureGeminiModel(page, itemVisualConfig).catch(() => false);
              if (!modelConfigured) throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_PICKER_NOT_FOUND);
              const generateTypeConfigured = await configureGeminiGenerateType(page, itemVisualConfig);
              if (!generateTypeConfigured) {
                throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_NOT_FOUND.replace(SOURCE_TEXT_0_2, _.isEqual(itemVisualConfig.generateType, GenerateType.Video) ? GeminiChatTextOption.CreateVideoVi : GeminiChatTextOption.CreateImageVi));
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
                  appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace(SOURCE_TEXT_0_2, (tabIndex + 1).toString()).replace(SOURCE_TEXT_1_3, SOURCE_TEMPLATE_SYMBOL_20(`${item.sceneId}`, `${BACKEND_MESSAGES.GEMINI_CHAT_CLICKED_SEND}`)));
                }
              } catch (e: any) {
                appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace(SOURCE_TEXT_0_2, (tabIndex + 1).toString()).replace(SOURCE_TEXT_1_3, SOURCE_TEMPLATE_SYMBOL_20(`${item.sceneId}`, `${BACKEND_MESSAGES.GEMINI_CHAT_CLICK_SEND_FAILED.replace(SOURCE_TEXT_0_2, e.message)}`)));
              }
              if (!clicked) {
                await page.keyboard.press(SOURCE_TEXT_ENTER);
                appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_START.replace(SOURCE_TEXT_0_2, (tabIndex + 1).toString()).replace(SOURCE_TEXT_1_3, SOURCE_TEMPLATE_SYMBOL_20(`${item.sceneId}`, `${BACKEND_MESSAGES.GEMINI_CHAT_PRESSED_ENTER}`)));
              }
              base64Result = await waitForDownloadAndGetBase64(page, itemVisualConfig, initialResponseCount);
              if (base64Result) {
                success = true;
                batchPagesErrors.set(page, 0);
              }
              const isBatchAspectRatioMismatch = base64Result && !_.isEqual(itemVisualConfig.generateType, GenerateType.Video) && !isImageAspectRatioCompatible(base64Result, itemVisualConfig.aspectRatio);
              if (isBatchAspectRatioMismatch) {
                appLog(SOURCE_TEMPLATE_GEMINICHAT_BATCH_SCENE(`${item.sceneId}`, `${BACKEND_MESSAGES.ASPECT_RATIO_DIFFERENCE_LOG.replace(SOURCE_TEXT_0_2, itemVisualConfig.aspectRatio || SOURCE_TEXT_16_9)}`));
              }
              if (!base64Result) throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERR_THROW);
            } catch (err: any) {
              batchPagesErrors.set(page, (batchPagesErrors.get(page) || 0) + 1);
              const errorMessage = getErrorMessage(err);
              appError(
                BACKEND_MESSAGES.GEMINI_CHAT_BATCH_RENDER_ERROR.replace(SOURCE_TEXT_0_2, (tabIndex + 1).toString())
                  .replace(SOURCE_TEXT_1_3, reloadAttempts.toString())
                  .replace(SOURCE_TEXT_2_2, errorMessage),
              );
              if (GEMINI_MEDIA_ERRORS.PROVIDER_REJECTION_PATTERN.test(errorMessage)) {
                terminalWarning = errorMessage;
                throw err;
              }
            }
          }
        }
      } catch (err: any) {
        const failureReason = getErrorMessage(err);
        if (GEMINI_MEDIA_ERRORS.PROVIDER_REJECTION_PATTERN.test(failureReason)) terminalWarning = failureReason;
        appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_FAILED_COMPLETELY.replace(SOURCE_TEXT_0_2, (tabIndex + 1).toString()).replace(SOURCE_TEXT_1_3, err.message));
      }
      if (success && base64Result) {
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_TAB_SUCCESS.replace(SOURCE_TEXT_0_2, (tabIndex + 1).toString()).replace(SOURCE_TEXT_1_3, item.sceneId));
        return { sceneId: item.sceneId, success: true, base64: base64Result, fallbackUrl: `${COMMON_STRINGS.BASE64_JPEG_PREFIX}${base64Result}`, assetType: itemVisualConfig.generateType };
      }
      return { sceneId: item.sceneId, success: false, base64: null, fallbackUrl: SecurityConstants.EMPTY_STRING, warning: terminalWarning, assetType: itemVisualConfig.generateType };
    };
    const workerQueues = distributeItemsByContinuity(items, activePages.length);
    const createReplacementWorkerPage = async (tabIndex: number, generateType: GenerateType): Promise<Page | null> => {
      for (let attempt = SecurityConstants.ZERO; attempt < GEMINI_BATCH_SETUP_CONFIG.WORKER_REPLACEMENT_MAX_ATTEMPTS; attempt++) {
        try {
          return await createPreparedGeminiBatchPage(context, tabIndex, generateType);
        } catch (error) {
          appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_INIT_ERROR.replace(SOURCE_TEXT_0_2, getErrorMessage(error)));
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
          const res = { sceneId: item.sceneId, success: false, base64: null, fallbackUrl: SecurityConstants.EMPTY_STRING, warning: err.message || BACKEND_MESSAGES.UNKNOWN_ERROR, assetType: resolveBatchAssetType(item) };
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
          const replacementPage = await createReplacementWorkerPage(tabIndex, resolveBatchAssetType(workerQueue[SecurityConstants.ZERO]));
          if (!replacementPage) return;
          workerPage = replacementPage;
          globalBatchPages.push(replacementPage);
          continue;
        }
        if (workerQueue.length > 0) {
          const delayTime = await applyBatchDelay(visualConfig);
          appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_NEXT_DELAY.replace(SOURCE_TEXT_0_2, (tabIndex + 1).toString()).replace(SOURCE_TEXT_1_3, delayTime.toString()));
        }
      }
    };
    const workers = _.map(activePages, (page, index) => runWorker(page, index, workerQueues[index] || []));
    await Promise.all(workers);
    _.forEach(
      _.filter(items, (item) => !_.some(results, { sceneId: item.sceneId })),
      (item) => {
        const res = { sceneId: item.sceneId, success: false, base64: null, fallbackUrl: SecurityConstants.EMPTY_STRING, warning: BACKEND_MESSAGES.GEMINI_CHAT_FALLBACK_WARNING, assetType: resolveBatchAssetType(item) };
        results.push(res);
        if (onProgress) onProgress(res);
      },
    );
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_COMPLETE.replace(SOURCE_TEXT_0_2, _.size(_.filter(results, (r) => r.success)).toString()).replace(SOURCE_TEXT_1_3, items.length.toString()));
  } catch (err: any) {
    appError(BACKEND_MESSAGES.GEMINI_CHAT_BATCH_INIT_ERROR.replace(SOURCE_TEXT_0_2, err.message));
    _.forEach(items, (item) => {
      if (!_.find(results, (r) => _.eq(r.sceneId, item.sceneId))) {
        const res = { sceneId: item.sceneId, success: false, base64: null, fallbackUrl: SecurityConstants.EMPTY_STRING, warning: err.message, assetType: resolveBatchAssetType(item) };
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
        if (!browserInstance.page.isClosed() && !_.includes(browserInstance.page.url(), SOURCE_TEXT_GROK_COM)) await browserInstance.page.close().catch(() => {});
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
    .waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: GEMINI_MODEL_SELECTION_CONFIG.MENU_TIMEOUT_MS })
    .then(() => true)
    .catch(() => false);
  return visible ? menu : null;
};
const closeGeminiModelMenu = async (picker: Locator, menu: Locator): Promise<void> => {
  if (!(await menu.isVisible().catch(() => false))) return;
  await picker.click().catch(() => undefined);
  await menu.waitFor({ state: SOURCE_TEXT_HIDDEN, timeout: GEMINI_MODEL_SELECTION_CONFIG.MENU_TIMEOUT_MS }).catch(() => undefined);
};
const isGeminiModelOptionSelected = (option: Locator): Promise<boolean> =>
  option
    .evaluate(
      (element, browserPayload) => {
        const { SOURCE_TEXT_SYMBOL_23 } = browserPayload.texts;
        const selectedClass = browserPayload.payload;
        return element.classList.contains(selectedClass) || Boolean(element.querySelector(`${SOURCE_TEXT_SYMBOL_23}${selectedClass}`));
      },
      { payload: GEMINI_MODEL_SELECTION_CONFIG.SELECTED_CLASS, texts: { SOURCE_TEXT_SYMBOL_23 } },
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
        .catch(() => XRT.EMPTY),
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
          .catch(() => XRT.EMPTY),
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
  const isImageGeneration = !_.isEqual(visualConfig?.generateType, GenerateType.Video);
  if (isImageGeneration) {
    targetModelText = GeminiChatModelName.Flash;
    targetModelRegex = GEMINI_MODEL_FLASH_REGEX;
    fallbackModelRegex = GEMINI_MODEL_FLASH_FAMILY_REGEX;
  } else if (_.includes([ImageGeneratorEngine.LabsSandbox, ImageGeneratorEngine.Veo3Lite], engine)) {
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
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_CONFIG_MODEL.replace(SOURCE_TEXT_0_2, targetModelText));
  for (let attempt = 0; attempt < GEMINI_MODEL_SELECTION_CONFIG.MAX_ATTEMPTS; attempt++) {
    const modelMenu = await openGeminiModelMenu(page, modelPickerBtn);
    if (!modelMenu) continue;
    const currentModelLabel = await getSelectedGeminiModelLabel(modelMenu);
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_CURRENT_MODEL.replace(SOURCE_TEXT_0_2, currentModelLabel));
    const currentModelMatchesTarget = targetModelRegex.test(currentModelLabel);
    targetModelRegex.lastIndex = SecurityConstants.ZERO;
    const currentModelMatchesFallback = Boolean(fallbackModelRegex?.test(currentModelLabel));
    if (fallbackModelRegex) fallbackModelRegex.lastIndex = SecurityConstants.ZERO;
    if (currentModelMatchesTarget || currentModelMatchesFallback) {
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
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_NOT_FOUND.replace(SOURCE_TEXT_0_2, targetModelText));
      await closeGeminiModelMenu(modelPickerBtn, modelMenu);
      continue;
    }
    await matchingOption.click();
    await modelPickerBtn.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: GEMINI_MODEL_SELECTION_CONFIG.OPTION_TIMEOUT_MS });
    const verificationMenu = await openGeminiModelMenu(page, modelPickerBtn);
    if (!verificationMenu) continue;
    const selectedOption = await findGeminiModelOption(verificationMenu, selectedModelRegex);
    const isSelected = Boolean(selectedOption && (await waitForGeminiModelOptionSelected(selectedOption)));
    await closeGeminiModelMenu(modelPickerBtn, verificationMenu);
    if (isSelected) {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_SUCCESS.replace(SOURCE_TEXT_0_2, targetModelText));
      return true;
    }
  }
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_MODEL_NOT_FOUND.replace(SOURCE_TEXT_0_2, targetModelText));
  return false;
}
export async function configureGeminiGenerateType(page: Page, visualConfig: GeminiVisualConfig): Promise<boolean> {
  const isVideo = visualConfig?.generateType === GenerateType.Video;
  const targetText = isVideo ? GeminiChatTextOption.CreateVideoVi : GeminiChatTextOption.CreateImageVi;
  const activeModeRegex = isVideo ? GEMINI_ACTIVE_VIDEO_MODE_REGEX : GEMINI_ACTIVE_IMAGE_MODE_REGEX;
  const hasActiveGenerateType = async (): Promise<boolean> => {
    const selectedModeChip = page.locator(SOURCE_TEXT_GEM_BUTTON_DATA_TEST_ID_DESELECT).first();
    if (await selectedModeChip.isVisible().catch(() => false)) {
      const selectedModeLabel = _.trim(await selectedModeChip.innerText().catch(() => XRT.EMPTY));
      if (activeModeRegex.test(selectedModeLabel)) return true;
    }
    const candidates = page.locator(GeminiChatSelector.ActiveGenerateType);
    const candidateCount = await candidates.count();
    for (let index = SecurityConstants.ZERO; index < candidateCount; index++) {
      const candidate = candidates.nth(index);
      if (!(await candidate.isVisible().catch(() => false))) continue;
      const belongsToNavigation = await candidate
        .evaluate(
          (element: HTMLElement, browserPayload) => {
            const { SOURCE_BROWSER_TEXT_BARD_SIDENAV_CONTAINER_BARD_SIDENAV_SIDE } = browserPayload.texts;
            return Boolean(element.closest(SOURCE_BROWSER_TEXT_BARD_SIDENAV_CONTAINER_BARD_SIDENAV_SIDE));
          },
          { payload: undefined, texts: { SOURCE_BROWSER_TEXT_BARD_SIDENAV_CONTAINER_BARD_SIDENAV_SIDE } },
        )
        .catch(() => false);
      if (belongsToNavigation) continue;
      const label = _.trim(_.join([await candidate.innerText().catch(() => XRT.EMPTY), await candidate.getAttribute(SOURCE_TEXT_ARIA_LABEL).catch(() => XRT.EMPTY)], SRT.SOURCE_TEXT_SYMBOL_52));
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
    await plusBtn.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: selectionTimeout });
  } catch {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_PLUS_NOT_FOUND);
    return false;
  }
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_CONFIG_GEN_TYPE.replace(SOURCE_TEXT_0_2, targetText));
  const pageLoading = page.locator(GEMINI_MODEL_SELECTION_CONFIG.PAGE_LOADING_SELECTOR).filter({ visible: true }).first();
  if (await pageLoading.isVisible().catch(() => false)) {
    appLog(FLOW_AUTOMATION_MESSAGES.GEMINI_WAITING_FOR_UI);
    await pageLoading.waitFor({ state: SOURCE_TEXT_HIDDEN, timeout: GEMINI_MODEL_SELECTION_CONFIG.PAGE_LOADING_TIMEOUT_MS }).catch(() => undefined);
  }
  for (let attempt = 0; attempt < GEMINI_MODEL_SELECTION_CONFIG.MAX_ATTEMPTS; attempt++) {
    await randomDelay(800, 1500);
    await plusBtn.click();
    await randomDelay(500, 900);
    await captureGeminiDomState(page, isVideo ? SOURCE_TEXT_VIDEO_TYPE_MENU_OPEN : SOURCE_TEXT_IMAGE_TYPE_MENU_OPEN);
    const exactOptionRegex = isVideo ? /^\s*(?:Tạo video|Video|Create video|Generate video)\s*$/i : /^\s*(?:Tạo hình ảnh|Tạo ảnh|Vẽ hình ảnh|Create (?:an )?image|Generate (?:an )?image|Create images|Generate images)\s*$/i;
    const findExactVisibleOption = async (locator: Locator): Promise<Locator | null> => {
      const count = await locator.count();
      for (let optionIndex = SecurityConstants.ZERO; optionIndex < count; optionIndex++) {
        const option = locator.nth(optionIndex);
        if (!(await option.isVisible().catch(() => false))) continue;
        const optionLabel = _.trim(_.join([await option.innerText().catch(() => XRT.EMPTY), await option.getAttribute(SOURCE_TEXT_ARIA_LABEL).catch(() => XRT.EMPTY)], SRT.SOURCE_TEXT_SYMBOL_52));
        if (exactOptionRegex.test(optionLabel)) return option;
      }
      return null;
    };
    const optionBtn = await findExactVisibleOption(page.locator(GeminiChatSelector.PlusMenuOptions));
    const optionBtnFallback = await findExactVisibleOption(page.locator(SOURCE_TEXT_BUTTON));
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
      await captureGeminiDomState(page, isVideo ? SOURCE_TEXT_VIDEO_TYPE_SELECTED : SOURCE_TEXT_IMAGE_TYPE_SELECTED);
      appLog((usedFallback ? BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_FALLBACK : BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_SUCCESS).replace(SOURCE_TEXT_0_2, targetText));
      return true;
    }
    await captureGeminiDomState(page, isVideo ? SOURCE_TEXT_VIDEO_TYPE_CHIP_MISSING : SOURCE_TEXT_IMAGE_TYPE_CHIP_MISSING);
  }
  await captureGeminiDomState(page, isVideo ? SOURCE_TEXT_VIDEO_TYPE_OPTION_MISSING : SOURCE_TEXT_IMAGE_TYPE_OPTION_MISSING);
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_GEN_TYPE_NOT_FOUND.replace(SOURCE_TEXT_0_2, targetText));
  await page.keyboard.press(SOURCE_TEXT_ESCAPE);
  await randomDelay(500, 800);
  return false;
}
export const createGeminiReferenceFiles = (referenceImages: unknown, referenceImageNames?: unknown) =>
  _.chain(_.isArray(referenceImages) ? referenceImages : [])
    .filter(_.isString)
    .take(GEMINI_CHAT_VIDEO_INPUT_CONFIG.MAX_REFERENCE_IMAGES)
    .map((source, index) => {
      const match = _.toString(source).match(BASE64_IMAGE_MIME_REGEX);
      const encodedAsset = match ? { mimeType: _.join([GEMINI_CHAT_VIDEO_INPUT_CONFIG.MIME_PREFIX, _.get(match, SecurityConstants.DEFAULT_AMOUNT)], REFACTOR_CONSTANTS.VD_EMPTY_STRING), data: _.get(match, GEMINI_CHAT_VIDEO_INPUT_CONFIG.BASE64_CAPTURE_INDEX) } : readEncodedProjectImage(source);
      if (!encodedAsset?.data || !encodedAsset.mimeType) return null;
      const extension = _.last(_.split(encodedAsset.mimeType, GEMINI_CHAT_VIDEO_INPUT_CONFIG.MIME_PREFIX)) || SOURCE_TEXT_PNG;
      const buffer = Buffer.from(encodedAsset.data, REFACTOR_CONSTANTS.ENCODING_BASE64);
      const contentHash = crypto.createHash(SOURCE_TEXT_SHA256).update(buffer).digest(SOURCE_TEXT_HEX).slice(0, GEMINI_CHAT_VIDEO_INPUT_CONFIG.FILE_HASH_LENGTH);
      const characterName = _.kebabCase(
        _.toString(_.get(referenceImageNames, index, REFACTOR_CONSTANTS.VD_EMPTY_STRING))
          .normalize(GEMINI_CHAT_VIDEO_INPUT_CONFIG.CHARACTER_NAME_NORMALIZATION_FORM)
          .replace(GEMINI_CHAT_VIDEO_INPUT_CONFIG.CHARACTER_NAME_DIACRITIC_PATTERN, REFACTOR_CONSTANTS.VD_EMPTY_STRING)
          .replace(GEMINI_CHAT_VIDEO_INPUT_CONFIG.CHARACTER_NAME_D_PATTERN, GEMINI_CHAT_VIDEO_INPUT_CONFIG.CHARACTER_NAME_D_REPLACEMENT),
      );
      const filePrefix = characterName ? _.join([GEMINI_CHAT_VIDEO_INPUT_CONFIG.CHARACTER_FILE_PREFIX, characterName, GEMINI_CHAT_VIDEO_INPUT_CONFIG.CHARACTER_FILE_SEPARATOR], REFACTOR_CONSTANTS.VD_EMPTY_STRING) : GEMINI_CHAT_VIDEO_INPUT_CONFIG.FILE_PREFIX;
      return { name: _.join([filePrefix, contentHash, GEMINI_CHAT_VIDEO_INPUT_CONFIG.EXTENSION_SEPARATOR, extension], REFACTOR_CONSTANTS.VD_EMPTY_STRING), mimeType: encodedAsset.mimeType, buffer };
    })
    .compact()
    .value();
const readGeminiAspectControlLabel = async (control: Locator): Promise<string> => _.trim(_.join([await control.innerText().catch(() => SecurityConstants.EMPTY_STRING), await control.getAttribute(GEMINI_CHAT_VIDEO_INPUT_CONFIG.ARIA_LABEL_ATTRIBUTE).catch(() => null)], REFACTOR_CONSTANTS.VD_BLANK));
const findGeminiAspectControl = async (page: Page): Promise<Locator | null> => {
  const primaryCandidates = page.locator(GEMINI_IMAGES_ASPECT_CONFIG.BUTTON_SELECTOR);
  const primaryCount = await primaryCandidates.count();
  for (let index = SecurityConstants.ZERO; index < primaryCount; index = _.add(index, SecurityConstants.DEFAULT_AMOUNT)) {
    const candidate = primaryCandidates.nth(index);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  const fallbackCandidates = page.locator(GEMINI_IMAGES_ASPECT_CONFIG.FALLBACK_BUTTON_SELECTOR);
  const fallbackCount = await fallbackCandidates.count();
  for (let index = SecurityConstants.ZERO; index < fallbackCount; index = _.add(index, SecurityConstants.DEFAULT_AMOUNT)) {
    const candidate = fallbackCandidates.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    const candidateLabel = await readGeminiAspectControlLabel(candidate);
    if (GEMINI_IMAGES_ASPECT_CONFIG.CONTROL_LABEL_PATTERN.test(candidateLabel)) return candidate;
  }
  return null;
};
const configureGeminiAspectRatio = async (page: Page, targetRatio: AspectRatio): Promise<boolean> => {
  if (geminiAspectControlUnavailablePages.has(page)) return false;
  const targetPattern = GEMINI_IMAGES_ASPECT_CONFIG.VALUE_PATTERNS[targetRatio];
  const aspectButton = await findGeminiAspectControl(page);
  if (!aspectButton) {
    await delayAsync(GEMINI_IMAGES_ASPECT_CONFIG.CONTROL_TIMEOUT_MS);
    const delayedAspectButton = await findGeminiAspectControl(page);
    if (delayedAspectButton) return configureGeminiAspectRatio(page, targetRatio);
    geminiAspectControlUnavailablePages.add(page);
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_ASPECT_BUTTON_NOT_FOUND);
    return false;
  }
  geminiAspectControlUnavailablePages.delete(page);
  const currentLabel = await readGeminiAspectControlLabel(aspectButton);
  if (targetPattern.test(currentLabel)) return true;
  await aspectButton.click();
  await randomDelay(GEMINI_CHAT_VIDEO_INPUT_CONFIG.ASPECT_DELAY_MIN_MS, GEMINI_CHAT_VIDEO_INPUT_CONFIG.ASPECT_DELAY_MAX_MS);
  const ratioOptions = page.locator(GEMINI_IMAGES_ASPECT_CONFIG.OPTION_SELECTOR);
  let ratioOption: Locator | null = null;
  const optionCount = await ratioOptions.count();
  for (let optionIndex = SecurityConstants.ZERO; optionIndex < optionCount; optionIndex = _.add(optionIndex, SecurityConstants.DEFAULT_AMOUNT)) {
    const candidate = ratioOptions.nth(optionIndex);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    const optionLabel = await readGeminiAspectControlLabel(candidate);
    if (targetPattern.test(optionLabel)) {
      ratioOption = candidate;
      break;
    }
  }
  if (!ratioOption) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_ASPECT_OPTION_NOT_FOUND.replace(SecurityConstants.PLACEHOLDER_0, targetRatio));
    await page.keyboard.press(GEMINI_CHAT_VIDEO_INPUT_CONFIG.ESCAPE_KEY);
    return false;
  }
  await ratioOption.click();
  const verifyDeadline = _.add(Date.now(), GEMINI_IMAGES_ASPECT_CONFIG.VERIFY_TIMEOUT_MS);
  while (_.lt(Date.now(), verifyDeadline)) {
    const updatedLabel = await readGeminiAspectControlLabel(aspectButton);
    const selectedOption = page.locator(GEMINI_IMAGES_ASPECT_CONFIG.SELECTED_STATE_SELECTOR).filter({ hasText: targetPattern }).first();
    if (targetPattern.test(updatedLabel) || (await selectedOption.isVisible().catch(() => false))) {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_ASPECT_SUCCESS.replace(SecurityConstants.PLACEHOLDER_0, targetRatio));
      return true;
    }
    await delayAsync(GEMINI_IMAGES_ASPECT_CONFIG.VERIFY_POLL_MS);
  }
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_ASPECT_OPTION_NOT_FOUND.replace(SecurityConstants.PLACEHOLDER_0, targetRatio));
  return false;
};
async function configureGeminiMediaInput(page: Page, visualConfig: GeminiVisualConfig) {
  await page.bringToFront().catch(() => {});
  await configureGeminiAspectRatio(page, (visualConfig?.aspectRatio || AspectRatio.SixteenNine) as AspectRatio);
  const rawReferences = !_.isEmpty(visualConfig?.referenceImages) ? visualConfig.referenceImages : !_.isEmpty(visualConfig?.sceneReferenceImages) ? visualConfig.sceneReferenceImages : visualConfig?.styleReferenceImages;
  const allReferenceFiles = createGeminiReferenceFiles(rawReferences, visualConfig?.referenceImageNames);
  const nextSignature = createReferenceSignature(allReferenceFiles);
  const currentChipCount = await page
    .locator(GEMINI_CHAT_VIDEO_SELECTORS.REFERENCE_CHIPS)
    .count()
    .catch(() => 0);
  if (_.isEqual(roomReferenceSignatureMap.get(page), nextSignature) && (_.isEmpty(allReferenceFiles) || _.gte(currentChipCount, allReferenceFiles.length))) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_ROOM_REUSE);
    return;
  }
  if (_.gt(currentChipCount, SecurityConstants.ZERO)) await removeProviderReferenceAttachments(page);
  if (_.isEmpty(allReferenceFiles)) {
    roomReferenceSignatureMap.set(page, nextSignature);
    return;
  }
  const referenceFiles = allReferenceFiles;
  for (let attempt = 0; attempt < 3; attempt++) {
    let uploadSuccess = false;
    const plusButton = page.locator(GEMINI_CHAT_VIDEO_SELECTORS.PLUS_BUTTON).first();
    const fallbackPlus = page.locator(SOURCE_TEXT_INPUT_AREA_CHAT_INPUT_INPUT_AREA).locator(SOURCE_TEXT_BUTTON).first();
    const targetPlus = (await plusButton.isVisible().catch(() => false)) ? plusButton : fallbackPlus;
    if (await targetPlus.isVisible().catch(() => false)) {
      await targetPlus.click().catch(() => {});
      await randomDelay(500, 1000);
    }
    const uploadCandidates = page.locator(GEMINI_CHAT_VIDEO_SELECTORS.UPLOAD_MENU_ITEM);
    const uploadCount = await uploadCandidates.count().catch(() => 0);
    for (let index = 0; index < uploadCount && !uploadSuccess; index++) {
      const uploadButton = uploadCandidates.nth(index);
      if (!(await uploadButton.isVisible().catch(() => false))) continue;
      try {
        const [fileChooser] = await Promise.all([page.waitForEvent(SOURCE_TEXT_FILECHOOSER, { timeout: 6000 }).catch(() => null), uploadButton.click()]);
        if (fileChooser) {
          await fileChooser.setFiles(referenceFiles);
          uploadSuccess = true;
        }
      } catch {}
    }
    if (!uploadSuccess) {
      const fileInputs = page.locator(GEMINI_CHAT_VIDEO_SELECTORS.REFERENCE_INPUT);
      const inputCount = await fileInputs.count().catch(() => 0);
      for (let index = 0; index < inputCount && !uploadSuccess; index++) {
        try {
          await fileInputs.nth(index).setInputFiles(referenceFiles);
          uploadSuccess = true;
        } catch {}
      }
    }
    await page.keyboard.press(SOURCE_TEXT_ESCAPE).catch(() => {});
    if (uploadSuccess) {
      try {
        await page.waitForFunction(({ selector, expectedCount }) => document.querySelectorAll(selector).length >= expectedCount, { selector: GEMINI_CHAT_VIDEO_SELECTORS.REFERENCE_CHIPS, expectedCount: referenceFiles.length }, { timeout: GEMINI_CHAT_VIDEO_INPUT_CONFIG.UPLOAD_VERIFY_TIMEOUT_MS });
        await randomDelay(GEMINI_CHAT_VIDEO_INPUT_CONFIG.UPLOAD_DELAY_MIN_MS, GEMINI_CHAT_VIDEO_INPUT_CONFIG.UPLOAD_DELAY_MAX_MS);
        roomReferenceSignatureMap.set(page, nextSignature);
        appLog(BACKEND_MESSAGES.GEMINI_CHAT_REFERENCE_UPLOAD.replace(SecurityConstants.PLACEHOLDER_0, _.toString(referenceFiles.length)));
        return;
      } catch (uploadErr) {
        appError(BACKEND_MESSAGES.GEMINI_CHAT_REFERENCE_UPLOAD_FAILED, uploadErr);
        await captureGeminiDomState(page, SOURCE_TEMPLATE_REFERENCE_UPLOAD_UNVERIFIED_ATTEMPT(`${_.add(attempt, 1)}`)).catch(() => undefined);
      }
    }
    await randomDelay(800, 1500);
  }
  appLog(BACKEND_MESSAGES.GEMINI_CHAT_REFERENCE_INPUT_NOT_FOUND);
  throw createAppError(BACKEND_MESSAGES.GEMINI_CHAT_REFERENCE_UPLOAD_FAILED);
}
async function enterGeminiPrompt(page: Page, promptText: string, visualConfig: GeminiVisualConfig) {
  await page.keyboard.press(SOURCE_TEXT_ESCAPE).catch(() => {});
  const closeButton = page.locator(SOURCE_TEXT_BUTTON_ARIA_LABEL_CLOSE_BUTTON_MAT).first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click().catch(() => {});
    await page.keyboard.press(SOURCE_TEXT_ESCAPE).catch(() => {});
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
      await context.grantPermissions([SOURCE_TEXT_CLIPBOARD_READ, SOURCE_TEXT_CLIPBOARD_WRITE]).catch(() => {});
      const clipboardSuccess = await page.evaluate(async (text) => {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (e) {
          return false;
        }
      }, promptText);
      if (clipboardSuccess) await page.keyboard.press(SOURCE_TEXT_CONTROL_V);
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
      .evaluate(
        (element: HTMLImageElement, browserPayload) => {
          const { XRT } = browserPayload.studioTexts;
          const { SOURCE_BROWSER_TEXT_SRC, SOURCE_BROWSER_TEXT_BLOB, SOURCE_BROWSER_TEXT_HTTP } = browserPayload.texts;
          const minimumDimension = browserPayload.payload;
          const source = element.currentSrc || element.src || element.getAttribute(SOURCE_BROWSER_TEXT_SRC) || XRT.EMPTY;
          if (!source) return false;
          return element.complete || element.naturalWidth >= minimumDimension || source.startsWith(SOURCE_BROWSER_TEXT_BLOB) || source.startsWith(SOURCE_BROWSER_TEXT_HTTP);
        },
        { payload: GEMINI_MEDIA_EXTRACTION_CONFIG.MIN_IMAGE_DIMENSION_PX, texts: { SOURCE_BROWSER_TEXT_SRC, SOURCE_BROWSER_TEXT_BLOB, SOURCE_BROWSER_TEXT_HTTP }, studioTexts: { XRT: { EMPTY: XRT.EMPTY } } },
      )
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
      { responseSelector: GeminiChatSelector.Response, globalBusySelector: GeminiChatSelector.GenerationBusy, responseBusySelector: GeminiChatSelector.ResponseGenerationBusy, lastResponseOffset: SecurityConstants.DEFAULT_AMOUNT },
      { timeout: GEMINI_MEDIA_EXTRACTION_CONFIG.PAGE_IDLE_TIMEOUT_MS },
    )
    .catch(() => {
      throw new Error(GEMINI_MEDIA_ERRORS.GENERATION_TIMEOUT_TEMPLATE.replace(SOURCE_TEXT_MEDIATYPE, mediaType));
    });
};
export const isDownloadedVideoBuffer = (buffer: Buffer): boolean => {
  if (_.lt(buffer.length, 12)) return false;
  const isIsoBaseMedia = _.isEqual(buffer.subarray(4, 8).toString(SOURCE_TEXT_ASCII), SOURCE_TEXT_FTYP);
  const isWebM = _.isEqual(buffer.subarray(0, 4).toString(SOURCE_TEXT_HEX), SOURCE_TEXT_1A45DFA3);
  return isIsoBaseMedia || isWebM;
};
const tryDownloadViaButton = async (page: Page, container: Locator, requireVideo: boolean = false): Promise<string | null> => {
  const downloadButtonSelectors = GEMINI_MEDIA_EXTRACTION_CONFIG.DOWNLOAD_BUTTON_SELECTORS;
  for (const selector of downloadButtonSelectors) {
    const btn = container.locator(selector).first();
    const isVisible = await btn.isVisible().catch(() => false);
    if (isVisible) {
      try {
        const [download] = await Promise.all([page.waitForEvent(SOURCE_TEXT_DOWNLOAD, { timeout: GEMINI_MEDIA_EXTRACTION_CONFIG.BUTTON_DOWNLOAD_TIMEOUT_MS }), btn.click({ force: true }).catch(() => {})]);
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
  await captureGeminiDomState(page, SOURCE_TEXT_WAITING_FOR_RESPONSE);
  if (!_.isUndefined(initialResponseCount)) {
    try {
      await page.waitForFunction(({ expectedResponseCount, responseSelector }) => document.querySelectorAll(responseSelector).length >= expectedResponseCount, { expectedResponseCount: _.add(initialResponseCount, SecurityConstants.DEFAULT_AMOUNT), responseSelector: GeminiChatSelector.Response }, { timeout: GEMINI_MEDIA_EXTRACTION_CONFIG.NEW_RESPONSE_TIMEOUT_MS });
    } catch (e) {
      appError(BACKEND_MESSAGES.GEMINI_CHAT_WAIT_NEW_RESPONSE_TIMEOUT);
      throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_NO_NEW_RESPONSE);
    }
  }
  const latestResponse = page.locator(GeminiChatSelector.Response).last();
  try {
    await latestResponse.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: GEMINI_MEDIA_EXTRACTION_CONFIG.MEDIA_WAIT_TIMEOUT_MS });
  } catch (e) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_NO_RESPONSE);
  }
  await captureGeminiDomState(page, SOURCE_TEXT_RESPONSE_DETECTED);
  const isVideoGeneration = _.isEqual(visualConfig?.generateType, GenerateType.Video);
  const mediaSelector = isVideoGeneration ? GEMINI_CHAT_VIDEO_SELECTORS.GENERATED_VIDEO : GEMINI_CHAT_MEDIA_SELECTORS.image;
  const mediaContainer = latestResponse.locator(mediaSelector).first();
  await captureGeminiDomState(page, isVideoGeneration ? SOURCE_TEXT_VIDEO_LOADING : SOURCE_TEXT_IMAGE_LOADING);
  if (isVideoGeneration && !(await mediaContainer.isVisible().catch(() => false))) {
    const processingIndicator = latestResponse.locator(GEMINI_CHAT_VIDEO_SELECTORS.PROCESSING).first();
    try {
      await processingIndicator.waitFor({ state: SOURCE_TEXT_ATTACHED, timeout: GEMINI_CHAT_VIDEO_INPUT_CONFIG.PROCESSING_APPEAR_TIMEOUT_MS });
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_BUSY_WAIT);
    } catch (error) {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_THINKING_DETACHED);
    }
  }
  const mediaReadyTimeout = isVideoGeneration ? GEMINI_CHAT_VIDEO_INPUT_CONFIG.VIDEO_READY_TIMEOUT_MS : GEMINI_CHAT_VIDEO_INPUT_CONFIG.MEDIA_READY_TIMEOUT_MS;
  const pollIntervalMs = GEMINI_MEDIA_EXTRACTION_CONFIG.FINISH_POLL_INTERVAL_MS;
  const maxAttempts = Math.ceil(mediaReadyTimeout / pollIntervalMs);
  let isMediaFound = false;
  const generationFailurePattern = GEMINI_MEDIA_ERRORS.PROVIDER_REJECTION_PATTERN;
  for (let i = SecurityConstants.ZERO; i < maxAttempts; i++) {
    const hasDownloadBtn = await latestResponse
      .locator(_.join(GEMINI_MEDIA_EXTRACTION_CONFIG.DOWNLOAD_BUTTON_SELECTORS, SOURCE_TEXT_SYMBOL_10))
      .first()
      .isVisible()
      .catch(() => false);
    const hasMedia = await mediaContainer.isVisible().catch(() => false);
    if ((isVideoGeneration && hasMedia) || (!isVideoGeneration && (hasDownloadBtn || hasMedia))) {
      isMediaFound = true;
      break;
    }
    const responseText = await latestResponse.innerText().catch(() => XRT.EMPTY);
    if (generationFailurePattern.test(responseText)) {
      await captureGeminiDomState(page, isVideoGeneration ? SOURCE_TEXT_VIDEO_GENERATION_REJECTED : SOURCE_TEXT_IMAGE_GENERATION_REJECTED);
      throw new Error(GEMINI_MEDIA_ERRORS.GENERATION_REJECTED_TEMPLATE.replace(SOURCE_TEXT_ERROR_2, _.trim(responseText)));
    }
    const isBusy = await latestResponse.evaluate((el: HTMLElement, busySelector: string) => Boolean(el.querySelector(busySelector)), GEMINI_MEDIA_EXTRACTION_CONFIG.BUSY_ELEMENT_SELECTOR).catch(() => false);
    if (!isVideoGeneration && !isBusy && _.gt(i, 5) && !_.isEmpty(_.trim(responseText))) {
      await captureGeminiDomState(page, SOURCE_TEXT_IMAGE_TEXT_ONLY_RESPONSE);
      throw new Error(GEMINI_MEDIA_ERRORS.TEXT_ONLY_RESPONSE_TEMPLATE.replace(SOURCE_TEXT_MEDIATYPE, GEMINI_MEDIA_ERRORS.IMAGE_MEDIA_TYPE).replace(SOURCE_TEXT_ERROR_2, _.truncate(_.trim(responseText), { length: 500 })));
    }
    await delayAsync(pollIntervalMs);
  }
  if (!isMediaFound && !(await mediaContainer.isVisible().catch(() => false))) {
    await captureGeminiDomState(page, isVideoGeneration ? SOURCE_TEXT_VIDEO_TIMEOUT : SOURCE_TEXT_IMAGE_TIMEOUT);
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_NO_CONTAINER);
    const mediaType = isVideoGeneration ? GEMINI_MEDIA_ERRORS.VIDEO_MEDIA_TYPE : GEMINI_MEDIA_ERRORS.IMAGE_MEDIA_TYPE;
    throw new Error(GEMINI_MEDIA_ERRORS.GENERATION_TIMEOUT_TEMPLATE.replace(SOURCE_TEXT_MEDIATYPE, mediaType));
  }
  if (!isVideoGeneration && (await mediaContainer.isVisible().catch(() => false))) {
    await waitForGeneratedImageReady(mediaContainer).catch(() => undefined);
  }
  await captureGeminiDomState(page, isVideoGeneration ? SOURCE_TEXT_VIDEO_READY : SOURCE_TEXT_IMAGE_READY);
}
async function getBase64FromBlobUrl(page: Page, mediaElement: Locator): Promise<string | null> {
  try {
    await captureGeminiDomState(page, GEMINI_MEDIA_EXTRACTION_CONFIG.STATES.EXTRACT_START);
    const tagName = await mediaElement.evaluate((el: HTMLElement) => el.tagName.toLowerCase()).catch(() => GEMINI_MEDIA_EXTRACTION_CONFIG.IMAGE_TAG);
    let src: string = GEMINI_MEDIA_EXTRACTION_CONFIG.EMPTY_VALUE;
    for (let i = SecurityConstants.ZERO; i < GEMINI_CHAT_VIDEO_INPUT_CONFIG.VIDEO_SOURCE_POLL_ATTEMPTS; i = _.add(i, SecurityConstants.DEFAULT_AMOUNT)) {
      src = await mediaElement
        .evaluate(
          (element: HTMLImageElement | HTMLVideoElement | HTMLSourceElement, browserPayload) => {
            const { SOURCE_BROWSER_TEXT_CURRENTSRC, SOURCE_BROWSER_TEXT_SRC, SOURCE_BROWSER_TEXT_QUERYSELECTOR } = browserPayload.texts;
            const sourceSelector = browserPayload.payload;
            return SOURCE_BROWSER_TEXT_CURRENTSRC in element && element.currentSrc
              ? element.currentSrc
              : element.src
                ? element.src
                : element.getAttribute(SOURCE_BROWSER_TEXT_SRC)
                  ? String(element.getAttribute(SOURCE_BROWSER_TEXT_SRC))
                  : SOURCE_BROWSER_TEXT_QUERYSELECTOR in element && element.querySelector<HTMLSourceElement>(sourceSelector)?.src
                    ? String(element.querySelector<HTMLSourceElement>(sourceSelector)?.src)
                    : GEMINI_MEDIA_EXTRACTION_CONFIG.EMPTY_VALUE;
          },
          { payload: GEMINI_MEDIA_EXTRACTION_CONFIG.SOURCE_SELECTOR, texts: { SOURCE_BROWSER_TEXT_CURRENTSRC, SOURCE_BROWSER_TEXT_SRC, SOURCE_BROWSER_TEXT_QUERYSELECTOR } },
        )
        .catch(() => XRT.EMPTY);
      if (_.some(GEMINI_MEDIA_EXTRACTION_CONFIG.URL_PREFIXES, (prefix) => _.startsWith(src, prefix))) {
        break;
      }
      await page.waitForTimeout(GEMINI_CHAT_VIDEO_INPUT_CONFIG.VIDEO_SOURCE_POLL_MS);
    }
    if (src) {
      appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACTING_MEDIA.replace(SOURCE_TEXT_0_2, tagName).replace(SOURCE_TEXT_1_3, src));
      await captureGeminiDomState(page, GEMINI_MEDIA_EXTRACTION_CONFIG.STATES.URL_DETECTED);
    }
    if (_.isEqual(tagName, GEMINI_MEDIA_EXTRACTION_CONFIG.IMAGE_TAG) || tagName === SOURCE_TEXT_DOWNLOAD_GENERATED_IMAGE_BUTTON || !src) {
      const base64Data = await mediaElement
        .evaluate(
          async (imgEl, browserPayload) => {
            const { SOURCE_BROWSER_TEXT_SRC, SOURCE_TEXT_SYMBOL_4, SOURCE_TEXT_CANVAS, SOURCE_BROWSER_TEXT_2D, SOURCE_TEXT_IMAGE_JPEG } = browserPayload.texts;
            const extractionConfig = browserPayload.payload;
            try {
              const imageElement = imgEl as HTMLImageElement;
              const sourceUrl = imageElement.currentSrc ? imageElement.currentSrc : imageElement.src ? imageElement.src : imageElement.getAttribute(SOURCE_BROWSER_TEXT_SRC) ? String(imageElement.getAttribute(SOURCE_BROWSER_TEXT_SRC)) : extractionConfig.emptyValue;
              if (sourceUrl) {
                try {
                  const response = await fetch(sourceUrl);
                  if (response.ok) {
                    const blob = await response.blob();
                    const converted = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve((reader.result as string).split(SOURCE_TEXT_SYMBOL_4)[1]);
                      reader.onerror = reject;
                      reader.readAsDataURL(blob);
                    });
                    if (converted) return converted;
                  }
                } catch {}
              }
              if (imageElement.complete && (imageElement.naturalWidth > 0 || imageElement.width > 0)) {
                const canvas = document.createElement(SOURCE_TEXT_CANVAS);
                canvas.width = imageElement.naturalWidth || imageElement.width;
                canvas.height = imageElement.naturalHeight || imageElement.height;
                const ctx = canvas.getContext(SOURCE_BROWSER_TEXT_2D);
                if (ctx) {
                  ctx.drawImage(imageElement, 0, 0);
                  const dataUrl = canvas.toDataURL(SOURCE_TEXT_IMAGE_JPEG, 0.95);
                  if (dataUrl.includes(SOURCE_TEXT_SYMBOL_4)) {
                    return dataUrl.split(SOURCE_TEXT_SYMBOL_4)[1];
                  }
                }
              }
              return extractionConfig.emptyValue;
            } catch (fetchError: unknown) {
              return extractionConfig.errorPrefix + getErrorMessage(fetchError);
            }
          },
          { payload: { errorPrefix: GEMINI_MEDIA_EXTRACTION_CONFIG.ERROR_PREFIX, emptyValue: GEMINI_MEDIA_EXTRACTION_CONFIG.EMPTY_VALUE, dataSeparator: GEMINI_MEDIA_EXTRACTION_CONFIG.DATA_SEPARATOR, dataIndex: GEMINI_MEDIA_EXTRACTION_CONFIG.DATA_INDEX }, texts: { SOURCE_BROWSER_TEXT_SRC, SOURCE_TEXT_SYMBOL_4, SOURCE_TEXT_CANVAS, SOURCE_BROWSER_TEXT_2D, SOURCE_TEXT_IMAGE_JPEG } },
        )
        .catch(() => null);
      if (base64Data && !_.startsWith(base64Data, GEMINI_MEDIA_EXTRACTION_CONFIG.ERROR_PREFIX) && _.gt(base64Data.length, GEMINI_MEDIA_EXTRACTION_CONFIG.MIN_VALID_MEDIA_LENGTH)) {
        await captureGeminiDomState(page, GEMINI_MEDIA_EXTRACTION_CONFIG.STATES.IMAGE_SUCCESS);
        return base64Data;
      }
    } else if (_.isEqual(tagName, GEMINI_MEDIA_EXTRACTION_CONFIG.VIDEO_TAG)) {
      if (/^https?:\/\//i.test(src)) {
        try {
          const response = await page.context().request.get(src, { headers: { referer: page.url() }, timeout: GEMINI_CHAT_VIDEO_INPUT_CONFIG.VIDEO_READY_TIMEOUT_MS });
          if (response.ok()) {
            const buffer = await response.body();
            const isValidVideoBuffer = _.gt(buffer.length, GEMINI_MEDIA_EXTRACTION_CONFIG.MIN_VALID_MEDIA_LENGTH) && isDownloadedVideoBuffer(buffer);
            if (isValidVideoBuffer) {
              await captureGeminiDomState(page, GEMINI_MEDIA_EXTRACTION_CONFIG.STATES.VIDEO_SUCCESS);
              return buffer.toString(REFACTOR_CONSTANTS.ENCODING_BASE64);
            }
          }
        } catch (requestError: unknown) {
          appError(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERROR.replace(SOURCE_TEXT_0_2, getErrorMessage(requestError)));
        }
      }
      const base64Data = await mediaElement
        .evaluate(
          async (videoEl, browserPayload) => {
            const { SOURCE_BROWSER_TEXT_SRC } = browserPayload.texts;
            const extractionConfig = browserPayload.payload;
            const sourceUrl = (videoEl as HTMLVideoElement).currentSrc || (videoEl as HTMLVideoElement).src || (videoEl as HTMLVideoElement).getAttribute(SOURCE_BROWSER_TEXT_SRC);
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
          { payload: { dataSeparator: GEMINI_MEDIA_EXTRACTION_CONFIG.DATA_SEPARATOR, dataIndex: GEMINI_MEDIA_EXTRACTION_CONFIG.DATA_INDEX }, texts: { SOURCE_BROWSER_TEXT_SRC } },
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
    appError(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERROR.replace(SOURCE_TEXT_0_2, getErrorMessage(error)));
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
  await mediaLoc.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: GEMINI_MEDIA_EXTRACTION_CONFIG.MEDIA_WAIT_TIMEOUT_MS }).catch(() => undefined);
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
        .evaluate(
          async (responseEl, browserPayload) => {
            const { XRT } = browserPayload.studioTexts;
            const { SOURCE_TEXT_CANVAS, SOURCE_BROWSER_TEXT_2D, SOURCE_TEXT_IMAGE_JPEG, SOURCE_TEXT_SYMBOL_4, SOURCE_BROWSER_TEXT_SRC } = browserPayload.texts;
            const excludedSelector = browserPayload.payload;
            const img = responseEl.querySelector(excludedSelector) as HTMLImageElement | null;
            if (!img) return null;
            if (img.complete && (img.naturalWidth > 0 || img.width > 0)) {
              try {
                const canvas = document.createElement(SOURCE_TEXT_CANVAS);
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext(SOURCE_BROWSER_TEXT_2D);
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  const dataUrl = canvas.toDataURL(SOURCE_TEXT_IMAGE_JPEG, 0.95);
                  if (dataUrl.includes(SOURCE_TEXT_SYMBOL_4)) return dataUrl.split(SOURCE_TEXT_SYMBOL_4)[1];
                }
              } catch {}
            }
            const src = img.currentSrc || img.src || img.getAttribute(SOURCE_BROWSER_TEXT_SRC) || XRT.EMPTY;
            if (!src) return null;
            try {
              const resp = await fetch(src);
              const blob = await resp.blob();
              return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const res = reader.result as string;
                  resolve(res.includes(SOURCE_TEXT_SYMBOL_4) ? res.split(SOURCE_TEXT_SYMBOL_4)[1] : res);
                };
                reader.readAsDataURL(blob);
              });
            } catch {
              return null;
            }
          },
          { payload: GEMINI_MEDIA_EXTRACTION_CONFIG.EXCLUDED_IMAGE_SELECTOR, texts: { SOURCE_TEXT_CANVAS, SOURCE_BROWSER_TEXT_2D, SOURCE_TEXT_IMAGE_JPEG, SOURCE_TEXT_SYMBOL_4, SOURCE_BROWSER_TEXT_SRC }, studioTexts: { XRT: { EMPTY: XRT.EMPTY } } },
        )
        .catch(() => null);
  if (secondaryBase64) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_SUCCESS);
    return secondaryBase64;
  }
  const fallbackBtnDownload = isVideoGeneration ? null : await tryDownloadViaButton(page, page.locator(SOURCE_TEXT_BODY), false);
  if (fallbackBtnDownload) {
    appLog(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_SUCCESS);
    return isVideoGeneration ? finalizeVideo(fallbackBtnDownload) : fallbackBtnDownload;
  }
  throw new Error(BACKEND_MESSAGES.GEMINI_CHAT_EXTRACT_ERR_THROW);
}
