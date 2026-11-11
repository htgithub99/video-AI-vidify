import { RUNTIME_VALUES } from "../../../../constants/runtime/values.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../constants/runtime/shared.js";
import type { Locator, Page } from "playwright";
import { SUNO_AUTOMATION_CONFIG } from "../../../../constants/sunoAutomation.js";
import { writeMusicDiagnostic } from "../../../../server/services/musicDiagnosticService.js";
export interface SunoBulkSelection {
  nameInput: Locator;
  selectedIds: string[];
}
const setClipRowSelected = async (clip: Locator, shouldSelect: boolean): Promise<void> => {
  const legacyButton = clip.getByRole(RT_SHARED.BUTTON, { name: shouldSelect ? RT_SERVER.SELECT_CLIP : RT_SERVER.DESELECT_CLIP, exact: true });
  if (await legacyButton.count()) {
    await legacyButton.click();
    return;
  }
  await clip.hover().catch(() => undefined);
  const checkbox = clip.locator(RT_SERVER.ROLE_CHECKBOX).first();
  if (await checkbox.isVisible().catch(() => false)) {
    await checkbox.click({ timeout: 2000 }).catch(async () => {
      await checkbox.evaluate((element: HTMLElement) => element.click());
    });
  } else {
    await checkbox.evaluate((element: HTMLElement) => element.click());
  }
};
export const openSunoBulkPlaylistDialog = async (page: Page, songIds: string[], runId: string, ensureActive: () => void = () => {}): Promise<SunoBulkSelection> => {
  const wanted = new Set(songIds);
  if (!wanted.size) throw new Error(RT_SERVER.KHONG_CO_BAN_NHAC_CAN_THEM_PLAYLIST);
  await page.goto(`${SUNO_AUTOMATION_CONFIG.SUNO_BASE_URL}${RT_SERVER.CREATE}`, { waitUntil: RT_SERVER.DOMCONTENTLOADED, timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS });
  const scroller = page.locator(RT_SERVER.CLIP_BROWSER_LIST_SCROLLER);
  await scroller.waitFor({ state: RT_SERVER.VISIBLE, timeout: SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS });
  const search = page.getByRole(RT_SERVER.TEXTBOX, { name: RT_SERVER.SEARCH_CLIPS, exact: true });
  if ((await search.isVisible().catch(() => false)) && (await search.inputValue())) await search.fill("");
  for (let pageIndex = 0; pageIndex < 100; pageIndex++) {
    ensureActive();
    const selected = new Set<string>();
    let checkedBottom = false;
    await scroller.evaluate((element) => {
      element.scrollTop = 0;
    });
    await page.getByTestId(RT_SERVER.CLIP_ROW).locator(RT_SERVER.A_HREF_SONG).first().waitFor({ state: RT_SERVER.ATTACHED, timeout: SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS });
    for (let scan = 0; scan < 100; scan++) {
      ensureActive();
      await page.waitForTimeout(100);
      const previousSelectionCount = selected.size;
      const rows = await page.getByTestId(RUNTIME_VALUES.CLIP_ROW_D9C21895).evaluateAll(
        (elements, __runtimePayload) => {
          const { RT_SERVER } = __runtimePayload.texts;
          return elements.map((element) => ({
            id: element
              .querySelector(RT_SERVER.A_HREF_SONG)
              ?.getAttribute(RT_SERVER.HREF)
              ?.match(/\/song\/([a-z0-9-]+)/i)?.[1],
            selected: Boolean(element.querySelector(RT_SERVER.BUTTON_ARIA_LABEL_DESELECT_CLIP)),
          }));
        },
        { value: undefined, texts: { RT_SERVER: { A_HREF_SONG: RT_SERVER.A_HREF_SONG, HREF: RT_SERVER.HREF, BUTTON_ARIA_LABEL_DESELECT_CLIP: RT_SERVER.BUTTON_ARIA_LABEL_DESELECT_CLIP } } },
      );
      for (const row of rows) {
        if (!row.id) continue;
        const clip = page.getByTestId(RT_SERVER.CLIP_ROW).filter({ has: page.locator(`${RT_SERVER.A_HREF_SONG_0428E3}${row.id}${RT_SERVER.SYMBOL_9980A6}`) });
        if (row.selected && !wanted.has(row.id)) await setClipRowSelected(clip, false);
        if (!wanted.has(row.id) || selected.has(row.id)) continue;
        if (!row.selected) await setClipRowSelected(clip, true);
        await clip.locator(RT_SERVER.BUTTON_ARIA_LABEL_DESELECT_CLIP).first().waitFor({ state: RT_SERVER.ATTACHED });
        selected.add(row.id);
      }
      if (selected.size === wanted.size) break;
      const metrics = await scroller.evaluate((element) => ({ top: element.scrollTop, height: element.clientHeight, total: element.scrollHeight }));
      if (metrics.top + metrics.height >= metrics.total - 3) {
        if (checkedBottom && previousSelectionCount === selected.size) break;
        checkedBottom = true;
        continue;
      }
      checkedBottom = false;
      await scroller.evaluate(
        (element, top) => {
          element.scrollTop = top;
        },
        metrics.top + metrics.height * 0.65,
      );
      await page.waitForTimeout(100);
    }
    if (selected.size) {
      const verified = new Set<string>();
      await scroller.evaluate((element) => {
        element.scrollTop = 0;
      });
      await page.waitForTimeout(100);
      for (let scan = 0; scan < 100; scan++) {
        ensureActive();
        await page.waitForTimeout(100);
        const checked = await page
          .getByTestId(RUNTIME_VALUES.CLIP_ROW_D9C21895)
          .filter({ has: page.locator(RT_SERVER.BUTTON_ARIA_LABEL_DESELECT_CLIP) })
          .evaluateAll(
            (elements, __runtimePayload) => {
              const { RT_SERVER } = __runtimePayload.texts;
              return elements.map(
                (element) =>
                  element
                    .querySelector(RT_SERVER.A_HREF_SONG)
                    ?.getAttribute(RT_SERVER.HREF)
                    ?.match(/\/song\/([a-z0-9-]+)/i)?.[1],
              );
            },
            { value: undefined, texts: { RT_SERVER: { A_HREF_SONG: RT_SERVER.A_HREF_SONG, HREF: RT_SERVER.HREF } } },
          );
        for (const id of checked) {
          if (!id || !selected.has(id)) throw new Error(RT_SERVER.NHOM_NHAC_DANG_CHON_CO_BAN_NGOAI_DANH_SACH_YEU);
          verified.add(id);
        }
        if (verified.size === selected.size) break;
        const metrics = await scroller.evaluate((element) => ({ top: element.scrollTop, height: element.clientHeight, total: element.scrollHeight }));
        if (metrics.top + metrics.height >= metrics.total - 3) break;
        await scroller.evaluate(
          (element, top) => {
            element.scrollTop = top;
          },
          metrics.top + metrics.height * 0.65,
        );
        await page.waitForTimeout(100);
      }
      if (verified.size !== selected.size) throw new Error(RT_SERVER.SUNO_CHUA_GIU_DU_CAC_BAN_DA_CHON_DUNG_DE);
      await scroller.evaluate((element) => {
        element.scrollTop = 0;
      });
      await page.waitForTimeout(100);
      for (let scan = 0; scan < 100; scan++) {
        const chosen = page
          .getByTestId(RT_SERVER.CLIP_ROW)
          .filter({ has: page.locator(RT_SERVER.BUTTON_ARIA_LABEL_DESELECT_CLIP) })
          .first();
        if (await chosen.count()) {
          await chosen.hover().catch(() => undefined);
          const moreOptions = chosen.getByRole(RT_SHARED.BUTTON, { name: RT_SERVER.MORE_OPTIONS, exact: true });
          if (await moreOptions.isVisible().catch(() => false)) await moreOptions.click();
          else await moreOptions.evaluate((element: HTMLElement) => element.click());
          break;
        }
        await scroller.evaluate((element) => {
          element.scrollTop += element.clientHeight * 0.65;
        });
        await page.waitForTimeout(100);
      }
      await page.getByRole(RT_SERVER.MENUITEM, { name: /^Add to Playlist$/i }).click();
      const nameInput = page.getByRole(RT_SERVER.DIALOG, { name: /^Add to Playlist$/i }).getByPlaceholder(RT_SERVER.PLAYLIST_NAME);
      await nameInput.waitFor({ state: RT_SERVER.VISIBLE, timeout: SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS });
      await writeMusicDiagnostic(RT_SERVER.SUNO_PLAYLIST_BULK_SELECTED, { runId, selectedCount: selected.size, songCount: wanted.size, batch: pageIndex + 1 });
      return { nameInput, selectedIds: [...selected] };
    }
    const next = page.getByRole(RT_SHARED.BUTTON, { name: RT_SERVER.NEXT_PAGE, exact: true });
    if (!(await next.count()) || !(await next.isEnabled())) break;
    const current = page.getByRole(RT_SERVER.TEXTBOX, { name: RT_SERVER.CURRENT_PAGE_NUMBER, exact: true });
    const previous = await current.inputValue();
    await next.click();
    await page.waitForFunction(
      (__runtimePayload) => {
        const { RT_SERVER } = __runtimePayload.texts;
        const previousPage = __runtimePayload.value;
        return (document.querySelector(RT_SERVER.INPUT_ARIA_LABEL_CURRENT_PAGE_NUMBER) as HTMLInputElement | null)?.value !== previousPage;
      },
      { value: previous, texts: { RT_SERVER: { INPUT_ARIA_LABEL_CURRENT_PAGE_NUMBER: RT_SERVER.INPUT_ARIA_LABEL_CURRENT_PAGE_NUMBER } } },
    );
    await page.waitForTimeout(200);
  }
  throw new Error(`${RT_SERVER.KHONG_TIM_THAY_NHOM}${wanted.size}${RT_SERVER.BAN_CAN_THEM_TRONG_DANH_SACH_SUNO_TIEN_DO_DA}`);
};
export const addSunoClipsThroughBulkUi = async (page: Page, songIds: string[], playlistName: string, runId: string, ensureActive?: () => void, onSelected?: (count: number) => void): Promise<void> => {
  let remaining = [...new Set(songIds)];
  while (remaining.length) {
    ensureActive?.();
    const { nameInput, selectedIds } = await openSunoBulkPlaylistDialog(page, remaining, runId, ensureActive);
    onSelected?.(selectedIds.length);
    const dialog = nameInput.locator(RT_SERVER.XPATH_ANCESTOR_ROLE_DIALOG_1);
    await dialog.getByText(playlistName, { exact: true }).click();
    await dialog.waitFor({ state: RT_SHARED.HIDDEN, timeout: SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS });
    await writeMusicDiagnostic(RT_SERVER.SUNO_PLAYLIST_BULK_ADDED_UI, { runId, songCount: selectedIds.length });
    remaining = remaining.filter((id) => !selectedIds.includes(id));
  }
};
