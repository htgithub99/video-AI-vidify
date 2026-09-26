import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";
import { findSunoStyleInput, selectInspoPlaylist } from "../src/server/services/sunoAutomationService.js";

const source = fs.readFileSync("src/server/services/sunoAutomationService.ts", "utf8");
const constants = fs.readFileSync("src/constants/sunoAutomation.ts", "utf8");

assert.match(source, /const ensureSunoStyle = async/);
assert.match(source, /const configureAdvancedOnce[\s\S]*await ensureSunoStyle\(page, style\)/);
assert.match(constants, /placeholder\*="style" i\]:not\(\[placeholder\*="exclude" i\]\)/);
assert.match(constants, /aria-label\*="style" i\]:not\(\[aria-label\*="exclude" i\]\)/);
assert.doesNotMatch(constants, /textarea:below\(:text\("Styles"\)\)/);
assert.match(source, /CREATE_PAGE_NAVIGATION_ATTEMPTS/);
assert.match(source, /waitForURL\(\(url\) => SUNO_AUTOMATION_PATTERNS\.CREATE_PATH\.test\(url\.pathname\)/);
assert.match(source, /SUNO_SETTINGS_APPLY_ATTEMPTS/);
assert.match(source, /formatSettingNotAppliedErr/);
assert.match(source, /aria-valuemin/);
assert.match(source, /aria-valuemax/);
assert.match(source, /targetControlValue - currentValue/);
assert.match(source, /difference >= 0 \? "ArrowRight" : "ArrowLeft"/);
assert.match(source, /getAttribute\("data-selected"\)/);
assert.match(source, /getByRole\("slider", \{ name: label \}\)/);
assert.match(source, /const applySunoSetting = async/);
assert.match(source, /applySunoSetting\(page, "Weirdness"/);
assert.match(source, /applySunoSetting\(page, "Style Influence"/);
assert.match(source, /if \(await audioInfluenceControl\.isVisible\(\)\.catch\(\(\) => false\)\)/);
assert.match(source, /formatConditionalSettingUnavailableLog\("Audio Influence"\)/);
assert.doesNotMatch(source, /_\.every\(\[aiSettings\.weirdness, aiSettings\.styleInfluence, aiSettings\.audioInfluence, aiSettings\.variety\]/);
assert.doesNotMatch(source, /if \(!\(await labelLocator\.isVisible\(\)\.catch\(\(\) => false\)\)\) return/);
assert.doesNotMatch(source, /if \(excludeInput\) await fillEditable/);
assert.equal((source.match(/await selectInspoPlaylist\(page, inspo\)/g) || []).length, 1);

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(`
    <textarea placeholder="Exclude styles">wrong existing exclusion</textarea>
    <section><div><h3>Styles</h3><div><textarea placeholder="Add a style">wrong existing music style</textarea></div></div></section>
  `);
  const styleInput = await findSunoStyleInput(page);
  assert.ok(styleInput, "Main Suno Styles input was not found");
  await styleInput.fill("authentic vietnamese bolero, 76 bpm");
  assert.equal(await page.locator('textarea[placeholder="Add a style"]').inputValue(), "authentic vietnamese bolero, 76 bpm");
  assert.equal(await page.locator('textarea[placeholder="Exclude styles"]').inputValue(), "wrong existing exclusion");

  const inspoName = "BOLERO_HAI_NGOAI";
  await page.setContent(`
    <button id="inspo-button" type="button" onclick="document.querySelector('#inspo-dialog').hidden = false">Inspo</button>
    <div id="inspo-dialog" role="dialog" hidden>
      <input placeholder="Search playlists" oninput="setTimeout(() => {
        const row = document.querySelector('#inspo-result');
        row.hidden = false;
      }, 1500)">
      <div id="inspo-result" class="cursor-pointer" hidden onclick="
        document.querySelector('#inspo-button').textContent = '${inspoName}';
        document.querySelector('#inspo-dialog').hidden = true;
      "><span>${inspoName}</span></div>
    </div>
  `);
  await selectInspoPlaylist(page, inspoName);
  assert.equal(await page.locator("#inspo-button").textContent(), inspoName);

  await page.setContent(`
    <button id="inspo-button" type="button" onclick="document.querySelector('#inspo-dialog').hidden = false">Inspo</button>
    <div id="inspo-dialog" role="dialog" hidden>
      <input placeholder="Search playlists">
      <div class="cursor-pointer" onclick="document.querySelector('#inspo-dialog').hidden = true"><span>${inspoName}</span></div>
    </div>
  `);
  await assert.rejects(selectInspoPlaylist(page, inspoName), /chưa chọn playlist Inspo/);

  await page.setContent('<button type="button">Create</button>');
  await selectInspoPlaylist(page, "");
  assert.equal(await page.getByRole("button", { name: "Create" }).count(), 1);
} finally {
  await browser.close();
}

process.stdout.write("BOLERO is applied only to Suno Styles, never to Exclude styles.\n");
