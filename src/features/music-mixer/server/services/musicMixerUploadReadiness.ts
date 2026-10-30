import { stringifyJson } from "../../../../lib/jsonStringify.js";
import {
  SOURCE_TEXT_INPUT_AREA_INPUT_AREA_FORM_DATA_TESTID,
  SOURCE_TEXT_HIDDEN,
  SOURCE_TEXT_ARIA_DESCRIBEDBY,
  SOURCE_TEXT_ARIA_DESCRIBEDBY_2,
  SOURCE_TEXT_TITLE_ARIA_LABEL,
  SOURCE_TEXT_TITLE,
  SOURCE_TEXT_ARIA_LABEL,
  SOURCE_TEXT_SYMBOL_52,
  SOURCE_TEXT_INPUT_COMPANION_CHIP_UPLOADER_FILE_PREVIEW_GEM,
  SOURCE_TEXT_BUTTON_ARIA_LABEL_REMOVE_FILE_I_BUTTON,
  SOURCE_TEXT_ASYNC_PROCESSING_CHIP_ROLE_PROGRESSBAR_PROGRESS_MAT,
  SOURCE_TEXT_ROLE_STATUS_UPLOAD_STATUS_PROCESSING_STATUS,
  SOURCE_TEXT_ROLE_PROGRESSBAR_ARIA_VALUENOW_PROGRESS_VALUE,
  SOURCE_TEXT_ARIA_VALUENOW,
  SOURCE_TEXT_VALUE,
  SOURCE_TEXT_SYMBOL_53,
  SOURCE_TEXT_UPLOAD_ERROR_DATA_STATE_ERROR_DATA_STATUS,
  SOURCE_TEXT_ROLE_ALERT,
  SOURCE_TEXT_LOI_TAI_TEP,
  SOURCE_TEXT_NFC,
  SOURCE_TEXT_TIMEOUTERROR,
  SOURCE_TEMPLATE_TRON_NHAC_TAI_TEP_THAT_BAI,
  SOURCE_TEXT_SYMBOL_54,
  SOURCE_TEMPLATE_P_L_P_N_P_L,
  SOURCE_TEXT_U_2,
  SOURCE_TEMPLATE_TRON_NHAC_TIEN_O_TAI_TEP,
  SOURCE_TEXT_ABORT,
  SOURCE_TEXT_MUSIC_MIXER_UPLOAD_CANCELLED,
  SOURCE_TEXT_CO_2,
  SOURCE_TEXT_KHONG,
  SOURCE_TEMPLATE_TRON_NHAC_CHUA_XAC_NHAN_TAI,
} from "../../../../constants/sourceText.js";
import type { Locator } from "playwright";
import { MUSIC_MIXER_UPLOAD_POLICY } from "../../../../constants/musicMixer.js";
type Attachment = { name: string; path?: string };
type UploadState = { labels: string[]; busy: boolean; error: string; progress: string };
type WaitPolicy = { maxWaitMs?: number; stallTimeoutMs?: number; pollMs?: number };
export const readMusicMixerUploadState = (input: Locator): Promise<UploadState> =>
  input.evaluate(
    (element, sharedBrowserPayload) => {
      const {
        SOURCE_TEXT_INPUT_AREA_INPUT_AREA_FORM_DATA_TESTID,
        SOURCE_TEXT_HIDDEN,
        SOURCE_TEXT_ARIA_DESCRIBEDBY,
        SOURCE_TEXT_ARIA_DESCRIBEDBY_2,
        SOURCE_TEXT_TITLE_ARIA_LABEL,
        SOURCE_TEXT_TITLE,
        SOURCE_TEXT_ARIA_LABEL,
        SOURCE_TEXT_SYMBOL_52,
        SOURCE_TEXT_INPUT_COMPANION_CHIP_UPLOADER_FILE_PREVIEW_GEM,
        SOURCE_TEXT_BUTTON_ARIA_LABEL_REMOVE_FILE_I_BUTTON,
        SOURCE_TEXT_ASYNC_PROCESSING_CHIP_ROLE_PROGRESSBAR_PROGRESS_MAT,
        SOURCE_TEXT_ROLE_STATUS_UPLOAD_STATUS_PROCESSING_STATUS,
        SOURCE_TEXT_ROLE_PROGRESSBAR_ARIA_VALUENOW_PROGRESS_VALUE,
        SOURCE_TEXT_ARIA_VALUENOW,
        SOURCE_TEXT_VALUE,
        SOURCE_TEXT_SYMBOL_53,
        SOURCE_TEXT_UPLOAD_ERROR_DATA_STATE_ERROR_DATA_STATUS,
        SOURCE_TEXT_ROLE_ALERT,
        SOURCE_TEXT_LOI_TAI_TEP,
      } = sharedBrowserPayload.texts;
      const scope = element.closest(SOURCE_TEXT_INPUT_AREA_INPUT_AREA_FORM_DATA_TESTID);
      if (!scope) return { labels: [], busy: false, error: "", progress: "" };
      const helpers = {
        visible(node: Element) {
          return node.getClientRects().length > 0 && getComputedStyle(node).visibility !== SOURCE_TEXT_HIDDEN;
        },
        label(node: Element) {
          const described = [node, ...Array.from(node.querySelectorAll(SOURCE_TEXT_ARIA_DESCRIBEDBY))].flatMap((child) =>
            (child.getAttribute(SOURCE_TEXT_ARIA_DESCRIBEDBY_2) || "")
              .split(/\s+/)
              .filter(Boolean)
              .map((id) => document.getElementById(id)?.textContent),
          );
          return [node.textContent, ...described, ...Array.from(node.querySelectorAll(SOURCE_TEXT_TITLE_ARIA_LABEL)).map((child) => child.getAttribute(SOURCE_TEXT_TITLE) || child.getAttribute(SOURCE_TEXT_ARIA_LABEL)), node.getAttribute(SOURCE_TEXT_TITLE), node.getAttribute(SOURCE_TEXT_ARIA_LABEL)].filter(Boolean).join(SOURCE_TEXT_SYMBOL_52);
        },
      };
      const selector = SOURCE_TEXT_INPUT_COMPANION_CHIP_UPLOADER_FILE_PREVIEW_GEM;
      const chips = Array.from(scope.querySelectorAll(selector)).filter((node) => helpers.visible(node) && !node.querySelector(selector));
      const removes = Array.from(scope.querySelectorAll(SOURCE_TEXT_BUTTON_ARIA_LABEL_REMOVE_FILE_I_BUTTON)).filter(helpers.visible);
      const labels = removes.length > chips.length ? removes.map((node) => helpers.label(node.closest(selector) || node.parentElement || node)) : chips.map(helpers.label);
      const busySelector = SOURCE_TEXT_ASYNC_PROCESSING_CHIP_ROLE_PROGRESSBAR_PROGRESS_MAT;
      const statusText = Array.from(scope.querySelectorAll(SOURCE_TEXT_ROLE_STATUS_UPLOAD_STATUS_PROCESSING_STATUS)).filter(helpers.visible).map(helpers.label).join(SOURCE_TEXT_SYMBOL_52);
      const busy = Array.from(scope.querySelectorAll(busySelector)).some(helpers.visible) || /uploading|processing|đang tải|đang xử lý/i.test(statusText);
      const progressValues = Array.from(scope.querySelectorAll(SOURCE_TEXT_ROLE_PROGRESSBAR_ARIA_VALUENOW_PROGRESS_VALUE))
        .filter(helpers.visible)
        .map((node) => node.getAttribute(SOURCE_TEXT_ARIA_VALUENOW) || node.getAttribute(SOURCE_TEXT_VALUE) || "");
      const percentages = statusText.match(/\d+(?:[.,]\d+)?\s*%/g) || [];
      const progress = [...progressValues, ...percentages].join(SOURCE_TEXT_SYMBOL_53);
      const failure = /upload failed|failed to upload|could(?:n't| not) upload|unsupported file|file too large|tải (?:tệp )?(?:lên )?(?:thất bại|không thành công)|không thể tải|tệp.*(?:không (?:được )?hỗ trợ|quá lớn)|lỗi tải/i;
      const explicitError = Array.from(scope.querySelectorAll(SOURCE_TEXT_UPLOAD_ERROR_DATA_STATE_ERROR_DATA_STATUS)).find(helpers.visible);
      const alerts = Array.from(document.querySelectorAll(SOURCE_TEXT_ROLE_ALERT)).filter(helpers.visible).map(helpers.label);
      const error = explicitError ? helpers.label(explicitError) || SOURCE_TEXT_LOI_TAI_TEP : [...labels, ...alerts].find((text) => failure.test(text)) || "";
      return { labels, busy, error, progress };
    },
    {
      texts: {
        SOURCE_TEXT_INPUT_AREA_INPUT_AREA_FORM_DATA_TESTID,
        SOURCE_TEXT_HIDDEN,
        SOURCE_TEXT_ARIA_DESCRIBEDBY,
        SOURCE_TEXT_ARIA_DESCRIBEDBY_2,
        SOURCE_TEXT_TITLE_ARIA_LABEL,
        SOURCE_TEXT_TITLE,
        SOURCE_TEXT_ARIA_LABEL,
        SOURCE_TEXT_SYMBOL_52,
        SOURCE_TEXT_INPUT_COMPANION_CHIP_UPLOADER_FILE_PREVIEW_GEM,
        SOURCE_TEXT_BUTTON_ARIA_LABEL_REMOVE_FILE_I_BUTTON,
        SOURCE_TEXT_ASYNC_PROCESSING_CHIP_ROLE_PROGRESSBAR_PROGRESS_MAT,
        SOURCE_TEXT_ROLE_STATUS_UPLOAD_STATUS_PROCESSING_STATUS,
        SOURCE_TEXT_ROLE_PROGRESSBAR_ARIA_VALUENOW_PROGRESS_VALUE,
        SOURCE_TEXT_ARIA_VALUENOW,
        SOURCE_TEXT_VALUE,
        SOURCE_TEXT_SYMBOL_53,
        SOURCE_TEXT_UPLOAD_ERROR_DATA_STATE_ERROR_DATA_STATUS,
        SOURCE_TEXT_ROLE_ALERT,
        SOURCE_TEXT_LOI_TAI_TEP,
      },
    },
  );
export const waitForMusicMixerUploads = async (input: Locator, attachments: Attachment[], timeoutMs: number, signal?: AbortSignal, stableMs = 1000, policy: WaitPolicy = {}): Promise<void> => {
  const normalize = (value: string) => value.normalize(SOURCE_TEXT_NFC).toLowerCase().replace(/\s+/g, SOURCE_TEXT_SYMBOL_52);
  const expectedNames = attachments.map((attachment) => normalize(attachment.path?.split(/[\\/]/).pop() || attachment.name));
  const startedAt = Date.now();
  const maxWaitMs = policy.maxWaitMs ?? MUSIC_MIXER_UPLOAD_POLICY.MAX_WAIT_MS;
  const stallTimeoutMs = policy.stallTimeoutMs ?? MUSIC_MIXER_UPLOAD_POLICY.STALL_TIMEOUT_MS;
  let lastChangedAt = startedAt;
  let previousSnapshot = "";
  let readySince = 0;
  let lastState: UploadState = { labels: [], busy: false, error: "", progress: "" };
  while (Date.now() - startedAt < maxWaitMs) {
    signal?.throwIfAborted();
    try {
      lastState = await readMusicMixerUploadState(input);
    } catch (error) {
      signal?.throwIfAborted();
      if (!(error instanceof Error) || error.name !== SOURCE_TEXT_TIMEOUTERROR) throw error;
      readySince = 0;
      continue;
    }
    if (lastState.error) throw new Error(SOURCE_TEMPLATE_TRON_NHAC_TAI_TEP_THAT_BAI(`${lastState.error}`));
    const snapshot = stringifyJson([lastState.labels, lastState.busy, lastState.progress]);
    if (snapshot !== previousSnapshot) {
      previousSnapshot = snapshot;
      lastChangedAt = Date.now();
    }
    const remaining = lastState.labels.map(normalize);
    const namesMatch = expectedNames.every((name) => {
      const names = [name, name.replace(/\.(mp3|wav|m4a|aac|flac|ogg|opus|webm)$/i, "")];
      const filenames = names.map((displayName) => new RegExp(SOURCE_TEMPLATE_P_L_P_N_P_L(`${displayName.replace(/[.*+?^${}()|[\]\\]/g, SOURCE_TEXT_SYMBOL_54)}`), SOURCE_TEXT_U_2));
      const index = remaining.findIndex((text) => filenames.some((filename) => filename.test(text)));
      if (index < 0) return false;
      remaining.splice(index, 1);
      return true;
    });
    if (!lastState.busy && namesMatch && lastState.labels.length === attachments.length) {
      if (!readySince) readySince = Date.now();
      if (Date.now() - readySince >= stableMs) {
        signal?.throwIfAborted();
        return;
      }
    } else {
      readySince = 0;
      if (lastState.busy && lastState.progress && Date.now() - lastChangedAt >= stallTimeoutMs) {
        throw new Error(SOURCE_TEMPLATE_TRON_NHAC_TIEN_O_TAI_TEP(`${Math.round(stallTimeoutMs / 60000)}`));
      }
      if (!lastState.busy && Date.now() - lastChangedAt >= timeoutMs) break;
    }
    await new Promise<void>((resolve, reject) => {
      const cancel = () => {
        clearTimeout(timer);
        signal?.removeEventListener(SOURCE_TEXT_ABORT, cancel);
        reject(signal?.reason || new Error(SOURCE_TEXT_MUSIC_MIXER_UPLOAD_CANCELLED));
      };
      const timer = setTimeout(
        () => {
          signal?.removeEventListener(SOURCE_TEXT_ABORT, cancel);
          resolve();
        },
        Math.max(1, Math.min(policy.pollMs ?? 250, maxWaitMs - (Date.now() - startedAt))),
      );
      signal?.addEventListener(SOURCE_TEXT_ABORT, cancel, { once: true });
      if (signal?.aborted) cancel();
    });
  }
  throw new Error(SOURCE_TEMPLATE_TRON_NHAC_CHUA_XAC_NHAN_TAI(`${attachments.length}`, `${lastState.labels.length}`, `${lastState.busy ? SOURCE_TEXT_CO_2 : SOURCE_TEXT_KHONG}`));
};
