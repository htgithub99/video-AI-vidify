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
