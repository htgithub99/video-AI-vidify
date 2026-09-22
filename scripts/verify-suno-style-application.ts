import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";
import { findSunoStyleInput } from "../src/server/services/sunoAutomationService.js";

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
} finally {
  await browser.close();
}

process.stdout.write("BOLERO is applied only to Suno Styles, never to Exclude styles.\n");
