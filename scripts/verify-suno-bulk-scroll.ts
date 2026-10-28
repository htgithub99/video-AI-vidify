import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';
import { sunoBulkPlaylistFixture } from './sunoBulkPlaylistFixtures.js';

const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'vidify-suno-bulk-scroll-'));
process.env.VIDIFY_STORAGE_DIR = scratch;
const { openSunoBulkPlaylistDialog } = await import('../src/server/services/sunoBulkPlaylistService.js');
const ids = Array.from({ length: 50 }, () => randomUUID());
const older = Array.from({ length: 500 }, () => randomUUID());
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.route('https://suno.com/**', route => route.fulfill({ contentType: 'text/html', body: sunoBulkPlaylistFixture([...ids, ...older], 'Existing playlist', 600) }));
  const { selectedIds } = await openSunoBulkPlaylistDialog(page, ids, 'offline-stop-at-required-group');
  assert.deepEqual(new Set(selectedIds), new Set(ids));
  const position = await page.locator('.clip-browser-list-scroller').evaluate(element => ({ top: element.scrollTop, total: element.scrollHeight }));
  assert.ok(position.total > 28000);
  assert.ok(position.top < 4000, 'Stop selecting and verifying once all requested clips are found; never scan the 500 old clips');
  assert.equal(await page.getByRole('dialog', { name: 'Add to Playlist', exact: true }).count(), 1);
  console.log('PASS: all 50 requested clips selected and verified in one group; stops before 500 older clips in a long virtual list.');
} finally { await browser.close(); }
