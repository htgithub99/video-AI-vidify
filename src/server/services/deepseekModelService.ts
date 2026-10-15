import * as SRT from "../../constants/sourceText.js";
import type { Page } from "playwright";
import { DEEPSEEK_CHAT_CONFIG as D, DEEPSEEK_CHAT_MODES } from "../../constants/deepseekChat.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG } from "../../constants/cinematicConstants.js";
import { throwIfPlanningCancelled } from "../../lib/chatPlanningUtils.js";
import { AiPlanningChatModel } from "../../types.js";
export const selectDeepSeekChatModel = async (page: Page, model?: AiPlanningChatModel, signal?: AbortSignal): Promise<void> => {
  throwIfPlanningCancelled(signal);
  if (!model || model === AiPlanningChatModel.DeepSeekAuto) return;
  const mode = DEEPSEEK_CHAT_MODES.find((item) => item.value === model);
  if (!mode) throw new Error(D.MODEL_ERROR);
  try {
    for (const setting of [
      { pattern: D.THINK, enabled: mode.think },
      { pattern: D.SEARCH, enabled: mode.search },
    ]) {
      throwIfPlanningCancelled(signal);
      const toggle = page.locator(D.TOGGLE).filter({ hasText: setting.pattern }).filter({ visible: true }).last();
      await toggle.waitFor({ state: SRT.SOURCE_TEXT_VISIBLE, timeout: CONFIG.MODEL_PICKER_TIMEOUT_MS });
      if (!(await toggle.isEnabled()) || (await toggle.getAttribute(SRT.SOURCE_TEXT_ARIA_DISABLED)) === SRT.SOURCE_TEXT_TRUE) throw new Error(D.MODEL_ERROR);
      if (((await toggle.getAttribute(SRT.SOURCE_TEXT_ARIA_PRESSED)) === SRT.SOURCE_TEXT_TRUE) !== setting.enabled) await toggle.click();
      const deadline = Date.now() + CONFIG.MODEL_PICKER_TIMEOUT_MS;
      while (((await toggle.getAttribute(SRT.SOURCE_TEXT_ARIA_PRESSED)) === SRT.SOURCE_TEXT_TRUE) !== setting.enabled) {
        throwIfPlanningCancelled(signal);
        if (Date.now() >= deadline) throw new Error(D.MODEL_ERROR);
        await page.waitForTimeout(100);
      }
    }
  } catch (error) {
    throwIfPlanningCancelled(signal);
    throw new Error(D.MODEL_ERROR, { cause: error });
  }
};
