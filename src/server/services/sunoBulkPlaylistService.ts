import type { Locator, Page } from 'playwright';
import { SUNO_AUTOMATION_CONFIG } from '../../constants/sunoAutomation.js';
import { writeMusicDiagnostic } from './musicDiagnosticService.js';

export interface SunoBulkSelection { nameInput: Locator; selectedIds: string[] }
// A group is bounded by Suno's current list page; never select unrelated rows.
export const openSunoBulkPlaylistDialog = async (page: Page, songIds: string[], runId: string, ensureActive: () => void = () => {}): Promise<SunoBulkSelection> => {
  const wanted = new Set(songIds);
  if (!wanted.size) throw new Error('Không có bản nhạc cần thêm playlist.');
  await page.goto(`${SUNO_AUTOMATION_CONFIG.SUNO_BASE_URL}/create`, { waitUntil: 'domcontentloaded', timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS });
  const search = page.getByRole('textbox', { name: 'Search clips', exact: true });
  await search.waitFor({ state: 'visible', timeout: SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS });
  if (await search.inputValue()) await search.fill('');
  const scroller = page.locator('.clip-browser-list-scroller');
  await scroller.waitFor({ state: 'visible', timeout: SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS });
  for (let pageIndex = 0; pageIndex < 100; pageIndex++) {
    ensureActive();
    const selected = new Set<string>();
    let checkedBottom = false;
    await scroller.evaluate(element => { element.scrollTop = 0; });
    await page.getByTestId('clip-row').locator('a[href*="/song/"]').first().waitFor({ state: 'attached', timeout: SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS });
    for (let scan = 0; scan < 100; scan++) {
      ensureActive();
      await page.waitForTimeout(100);
      const previousSelectionCount = selected.size;
      const rows = await page.getByTestId('clip-row').evaluateAll(elements => elements.map(element => ({
        id: element.querySelector('a[href*="/song/"]')?.getAttribute('href')?.match(/\/song\/([a-z0-9-]+)/i)?.[1],
        selected: Boolean(element.querySelector('button[aria-label="Deselect clip"]')),
      })));
      for (const row of rows) {
        if (!row.id) continue;
        const clip = page.getByTestId('clip-row').filter({ has: page.locator(`a[href="/song/${row.id}"]`) });
        if (row.selected && !wanted.has(row.id)) await clip.getByRole('button', { name: 'Deselect clip', exact: true }).click();
        if (!wanted.has(row.id) || selected.has(row.id)) continue;
        if (!row.selected) await clip.getByRole('button', { name: 'Select clip', exact: true }).click();
        await clip.getByRole('button', { name: 'Deselect clip', exact: true }).waitFor({ state: 'attached' });
        selected.add(row.id);
      }
      if (selected.size === wanted.size) break;
      const metrics = await scroller.evaluate(element => ({ top: element.scrollTop, height: element.clientHeight, total: element.scrollHeight }));
      if (metrics.top + metrics.height >= metrics.total - 3) {
        if (checkedBottom && previousSelectionCount === selected.size) break;
        checkedBottom = true;
        continue;
      }
      checkedBottom = false;
      await scroller.evaluate((element, top) => { element.scrollTop = top; }, metrics.top + metrics.height * 0.65);
      await page.waitForTimeout(100);
    }
    if (selected.size) {
      // Check all selected rows again while scrolling back; selection must survive virtualization.
      const verified = new Set<string>();
      await scroller.evaluate(element => { element.scrollTop = 0; });
      await page.waitForTimeout(100);
      for (let scan = 0; scan < 100; scan++) {
        ensureActive();
        await page.waitForTimeout(100);
        const checked = await page.getByTestId('clip-row').filter({ has: page.getByRole('button', { name: 'Deselect clip', exact: true }) }).evaluateAll(elements => elements.map(element => element.querySelector('a[href*="/song/"]')?.getAttribute('href')?.match(/\/song\/([a-z0-9-]+)/i)?.[1]));
        for (const id of checked) {
          if (!id || !selected.has(id)) throw new Error('Nhóm nhạc đang chọn có bản ngoài danh sách yêu cầu.');
          verified.add(id);
        }
        if (verified.size === selected.size) break;
        const metrics = await scroller.evaluate(element => ({ top: element.scrollTop, height: element.clientHeight, total: element.scrollHeight }));
        if (metrics.top + metrics.height >= metrics.total - 3) break;
        await scroller.evaluate((element, top) => { element.scrollTop = top; }, metrics.top + metrics.height * 0.65);
        await page.waitForTimeout(100);
      }
      if (verified.size !== selected.size) throw new Error('Suno chưa giữ đủ các bản đã chọn; dừng để tránh thêm sai nhóm.');
      // Bring one selected row back into view, then use its group menu once.
      await scroller.evaluate(element => { element.scrollTop = 0; });
      await page.waitForTimeout(100);
      for (let scan = 0; scan < 100; scan++) {
        const chosen = page.getByTestId('clip-row').filter({ has: page.getByRole('button', { name: 'Deselect clip', exact: true }) }).first();
        if (await chosen.count()) {
          await chosen.getByRole('button', { name: 'More options', exact: true }).click();
          break;
        }
        await scroller.evaluate(element => { element.scrollTop += element.clientHeight * 0.65; });
        await page.waitForTimeout(100);
      }
      await page.getByRole('menuitem', { name: 'Add to Playlist', exact: true }).click();
      const nameInput = page.getByRole('dialog', { name: 'Add to Playlist', exact: true }).getByPlaceholder('Playlist name');
      await nameInput.waitFor({ state: 'visible', timeout: SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS });
      await writeMusicDiagnostic('suno_playlist_bulk_selected', { runId, selectedCount: selected.size, songCount: wanted.size, batch: pageIndex + 1 });
      return { nameInput, selectedIds: [...selected] };
    }
    const next = page.getByRole('button', { name: 'Next page', exact: true });
    if (!(await next.isEnabled())) break;
    const current = page.getByRole('textbox', { name: 'Current page number', exact: true });
    const previous = await current.inputValue();
    await next.click();
    await page.waitForFunction(previousPage => (document.querySelector('input[aria-label="Current page number"]') as HTMLInputElement | null)?.value !== previousPage, previous);
    await page.waitForTimeout(200);
  }
  throw new Error(`Không tìm thấy nhóm ${wanted.size} bản cần thêm trong danh sách Suno. Tiến độ đã được giữ.`);
};

export const addSunoClipsThroughBulkUi = async (page: Page, songIds: string[], playlistName: string, runId: string, ensureActive?: () => void, onSelected?: (count: number) => void): Promise<void> => {
  let remaining = [...new Set(songIds)];
  while (remaining.length) {
    ensureActive?.();
    const { nameInput, selectedIds } = await openSunoBulkPlaylistDialog(page, remaining, runId, ensureActive);
    onSelected?.(selectedIds.length);
    const dialog = nameInput.locator('xpath=ancestor::*[@role="dialog"][1]');
    await dialog.getByText(playlistName, { exact: true }).click();
    await dialog.waitFor({ state: 'hidden', timeout: SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS });
    await writeMusicDiagnostic('suno_playlist_bulk_added_ui', { runId, songCount: selectedIds.length });
    remaining = remaining.filter(id => !selectedIds.includes(id));
  }
};
