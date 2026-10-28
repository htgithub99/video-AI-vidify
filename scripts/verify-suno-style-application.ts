import * as SF from "./sunoStyleFixtures.js";
import { resolveSourceTextConstants } from "./sourceTextAssertions";
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";
import { configureAdvancedOnce, ensureAdvancedMode, findSunoStyleInput, selectInspoPlaylist, verifySunoAccount } from "../src/server/services/sunoAutomationService.js";
import { SUNO_AUTOMATION_PATTERNS, SUNO_AUTOMATION_SELECTORS } from "../src/constants/sunoAutomation.js";
const source = resolveSourceTextConstants(fs.readFileSync(SF.TEXT_SRC_SERVER_SERVICES_SUNOAUTOMATIONSERVICE_TS, SF.TEXT_UTF8));
const constants = resolveSourceTextConstants(fs.readFileSync(SF.TEXT_SRC_CONSTANTS_SUNOAUTOMATION_TS, SF.TEXT_UTF8));
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
assert.match(source, /await verifySunoAccount\(page\);[\s\S]*await ensureAdvancedMode\(page\);[\s\S]*await selectInspoPlaylist\(page, inspo\);[\s\S]*await configureAdvancedOnce\(page, style, aiSettings, hasInspo\)/);
assert.ok(SUNO_AUTOMATION_PATTERNS.PLAYLIST_CREATE_API.test(SF.TEXT_HTTPS_STUDIO_API_PROD_SUNO_COM_API_PLAYLIST_CREATE));
assert.ok(!SUNO_AUTOMATION_PATTERNS.PLAYLIST_CREATE_API.test(SF.TEXT_HTTPS_STUDIO_API_PROD_SUNO_COM_API_PLAYLIST_UPDATE_CLIPS));
assert.match(source, /suno_playlist_create_response/);
assert.match(source, /getByRole\("link", \{ name: playlistName, exact: true \}\)/);
assert.match(source, /await ensureSunoPlaylistMembers\(page, requestHeaders, playlistId, uniqueSongIds,/);
assert.match(source, /if \(hasInspo\) \{\s*await audioInfluenceControl\.waitFor/);
assert.match(constants, /button\[aria-label="Add inspiration from a playlist"\]/);
assert.doesNotMatch(constants, /'input\[placeholder\*="Search" i\]'/);
assert.match(source, /INSPO_APPLIED_CONDITION/);
assert.match(source, /INSPO_APPLIED_TRACK/);
assert.match(constants, /\[role="dialog"\] input\[placeholder="Search"\]/);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(SF.ACCOUNT_WORKSPACE_HTML);
  await verifySunoAccount(page);
  await page.setContent(SF.INCORRECT_WORKSPACE_HTML);
  await assert.rejects(verifySunoAccount(page), /chưa đăng nhập đúng workspace Suno/);
  await page.setContent(SF.SEPARATE_STYLES_HTML);
  const styleInput = await findSunoStyleInput(page);
  assert.ok(styleInput, SF.TEXT_MAIN_SUNO_STYLES_INPUT_WAS_NOT_FOUND);
  await styleInput.fill(SF.TEXT_AUTHENTIC_VIETNAMESE_BOLERO_76_BPM);
  assert.equal(await page.locator(SF.TEXT_TEXTAREA_PLACEHOLDER_ADD_A_STYLE).inputValue(), SF.TEXT_AUTHENTIC_VIETNAMESE_BOLERO_76_BPM);
  assert.equal(await page.locator(SF.TEXT_TEXTAREA_PLACEHOLDER_EXCLUDE_STYLES).inputValue(), SF.TEXT_WRONG_EXISTING_EXCLUSION);
  await page.setContent(SF.ADVANCED_FORM_HTML);
  await ensureAdvancedMode(page);
  await ensureAdvancedMode(page);
  const settings = {
    excludeStyles: SF.TEXT_EDM_DISTORTED_GUITARS,
    vocalGender: SF.TEXT_MALE,
    duration: SF.TEXT_AUTO,
    maxMode: false,
    weirdness: 30,
    styleInfluence: 80,
    audioInfluence: 50,
    variety: 75,
    personalize: false,
  } as const;
  await configureAdvancedOnce(page, SF.TEXT_AUTHENTIC_VIETNAMESE_BOLERO_76_BPM, settings);
  const lyricsEditor = page.locator(SUNO_AUTOMATION_SELECTORS.LYRICS_INPUT[0]).locator(SF.TEXT_VISIBLE_TRUE);
  await lyricsEditor.fill(SF.TEXT_VERSE_LOI_HAT_TIENG_VIET_CHORUS_MOT_CAU_HAT_MOI);
  assert.deepEqual((await lyricsEditor.innerText()).split(/\n+/), [SF.TEXT_VERSE, SF.TEXT_LOI_HAT_TIENG_VIET, SF.TEXT_CHORUS, SF.TEXT_MOT_CAU_HAT_MOI]);
  assert.equal(await page.locator(SF.TEXT_STYLES_WRAPPER_TEXTAREA).inputValue(), SF.TEXT_AUTHENTIC_VIETNAMESE_BOLERO_76_BPM);
  assert.equal(await page.locator(SF.TEXT_DIV_HIDDEN_TEXTAREA).first().inputValue(), SF.TEXT_HIDDEN_STYLE);
  assert.equal(await page.getByLabel(SF.TEXT_COWRITER_PROMPT).inputValue(), SF.TEXT_KEEP_COWRITER);
  assert.equal(await page.getByPlaceholder(SF.TEXT_EXCLUDE_STYLES).inputValue(), SF.TEXT_EDM_DISTORTED_GUITARS);
  assert.equal(await page.locator(SF.TEXT_MORE_OPTIONS_ARIA_LABEL_WEIRDNESS).getAttribute(SF.TEXT_ARIA_VALUENOW), SF.TEXT_30);
  assert.equal(await page.locator(SF.TEXT_MORE_OPTIONS_ARIA_LABEL_STYLE_INFLUENCE).getAttribute(SF.TEXT_ARIA_VALUENOW), SF.TEXT_80);
  assert.equal(await page.locator(SF.TEXT_MORE_OPTIONS_ARIA_LABEL_VARIETY).getAttribute(SF.TEXT_ARIA_VALUENOW), SF.TEXT_3);
  assert.equal(
    await page
      .locator(SF.TEXT_MORE_OPTIONS_BUTTON_DATA_SELECTED_TRUE)
      .allTextContents()
      .then((values) => values.join(SF.COMMA_SEPARATOR)),
    SF.TEXT_MALE_AUTO_OFF_OFF,
  );
  await page.locator('#gender').evaluate((element) => { element.addEventListener('click', () => element.setAttribute('data-clicked', 'true')); });
  await configureAdvancedOnce(page, SF.TEXT_AUTHENTIC_VIETNAMESE_BOLERO_76_BPM, settings);
  assert.equal(await page.locator('#gender').getAttribute('data-clicked'), null, 'Applying the same gender twice must not toggle it off');
  await configureAdvancedOnce(page, SF.TEXT_AUTHENTIC_VIETNAMESE_BOLERO_76_BPM, { ...settings, vocalGender: 'female' });
  assert.equal(await page.getByRole('button', { name: 'Female', exact: true }).getAttribute('data-selected'), 'true');
  assert.equal(await page.getByRole('button', { name: 'Male', exact: true }).getAttribute('data-selected'), 'false');
  await configureAdvancedOnce(page, SF.TEXT_AUTHENTIC_VIETNAMESE_BOLERO_76_BPM, { ...settings, vocalGender: 'auto' });
  assert.equal(await page.locator('#gender [data-selected="true"]').count(), 0, 'Auto must clear persisted gender');
  const inspoName = SF.TEXT_BOLERO_HAI_NGOAI;
  await page.setContent(SF.appliedInspoHtml(inspoName));
  await selectInspoPlaylist(page, inspoName);
  assert.equal(await page.locator(SF.TEXT_SELECTED_INSPO_BUTTON_ARIA_LABEL_REMOVE).count(), 1);
  assert.equal(await page.locator(SF.TEXT_INPUT_PLACEHOLDER_SEARCH_CLIPS).inputValue(), SF.EMPTY_TEXT);
  await page.setContent(SF.unappliedInspoHtml(inspoName));
  await assert.rejects(selectInspoPlaylist(page, inspoName), /chưa chọn playlist Inspo/);
  assert.equal(await page.locator(SF.TEXT_INSPO_BUTTON).textContent(), SF.TEXT_INSPO);
  await page.setContent(SF.unselectableInspoHtml(inspoName));
  await assert.rejects(selectInspoPlaylist(page, inspoName), /chưa chọn playlist Inspo/);
  await page.setContent(SF.EMPTY_INSPO_DIALOG_HTML);
  await assert.rejects(selectInspoPlaylist(page, inspoName), /chưa chọn playlist Inspo/);
  await page.setContent(SF.CREATE_BUTTON_HTML);
  await selectInspoPlaylist(page, SF.EMPTY_TEXT);
  assert.equal(await page.getByRole(SF.TEXT_BUTTON, { name: SF.TEXT_CREATE }).count(), 1);
} finally {
  await browser.close();
}
process.stdout.write(SF.TEXT_BOLERO_IS_APPLIED_ONLY_TO_SUNO_STYLES_NEVER_TO_EXCLUDE_STYLES);
