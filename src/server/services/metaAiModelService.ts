import type { Locator, Page } from "playwright";
import { META_AI_CHAT_CONFIG, META_AI_CHAT_MODES } from "../../constants/metaAiChat";
import { AiPlanningChatModel } from "../../types";

const normalizeMetaAiModel = (rawModel?: string): AiPlanningChatModel => {
  const normalized = String(rawModel || "").trim().toLowerCase();
  if (normalized === META_AI_CHAT_MODES.INSTANT) {
    return AiPlanningChatModel.MetaAiInstant;
  }
  if (normalized === META_AI_CHAT_MODES.THINKING) {
    return AiPlanningChatModel.MetaAiThinking;
  }
  return AiPlanningChatModel.MetaAiAuto;
};

const isOptionSelected = async (locator: Locator): Promise<boolean> =>
  locator
    .evaluate((element, selectedValues: string[]) => {
      const selected = new Set(selectedValues);
      const candidates = [
        element,
        element.closest('[role="menuitemradio"], [role="menuitem"], [role="option"], button'),
      ].filter((node): node is Element => Boolean(node));

      return candidates.some((node) => {
        const attrs = ["aria-checked", "aria-selected", "data-state", "data-selected"];
        if (
          attrs.some((attr) =>
            selected.has((node.getAttribute(attr) || "").trim().toLowerCase()),
          )
        ) {
          return true;
        }
        return Boolean(node.querySelector('svg[data-testid*="check" i], [data-selected="true"]'));
      });
    }, Array.from(META_AI_CHAT_CONFIG.SELECTED_VALUES))
    .catch(() => false);

export const selectMetaAiChatModel = async (
  page: Page,
  rawModel?: string,
): Promise<boolean> => {
  const desired = normalizeMetaAiModel(rawModel);
  if (desired === AiPlanningChatModel.MetaAiAuto) {
    return true;
  }

  const dropdownBtn = page.locator(META_AI_CHAT_CONFIG.MODE_DROPDOWN_BUTTON).first();
  const isDropdownVisible = await dropdownBtn
    .isVisible({ timeout: META_AI_CHAT_CONFIG.SELECT_TIMEOUT_MS })
    .catch(() => false);
  if (!isDropdownVisible) {
    return false;
  }

  const targetPatterns =
    desired === AiPlanningChatModel.MetaAiThinking
      ? META_AI_CHAT_CONFIG.THINKING_PATTERNS
      : META_AI_CHAT_CONFIG.INSTANT_PATTERNS;

  const currentLabel = ((await dropdownBtn.innerText().catch(() => "")) || "").trim();
  if (targetPatterns.some((pattern) => pattern.test(currentLabel))) {
    return true;
  }

  await dropdownBtn.click({ timeout: META_AI_CHAT_CONFIG.SELECT_TIMEOUT_MS }).catch(() => null);
  await page.waitForTimeout(META_AI_CHAT_CONFIG.MENU_WAIT_MS);

  const optionSelector =
    desired === AiPlanningChatModel.MetaAiThinking
      ? META_AI_CHAT_CONFIG.OPTION_THINKING
      : META_AI_CHAT_CONFIG.OPTION_INSTANT;
  const option = page.locator(optionSelector).first();
  const optionVisible = await option
    .isVisible({ timeout: META_AI_CHAT_CONFIG.SELECT_TIMEOUT_MS })
    .catch(() => false);

  if (optionVisible) {
    const alreadySelected = await isOptionSelected(option);
    if (!alreadySelected) {
      await option.click({ timeout: META_AI_CHAT_CONFIG.SELECT_TIMEOUT_MS }).catch(() => null);
      await page.waitForTimeout(META_AI_CHAT_CONFIG.SETTLE_WAIT_MS);
    } else {
      await page.keyboard.press("Escape").catch(() => null);
    }
    return true;
  }

  await page.keyboard.press("Escape").catch(() => null);
  return false;
};

