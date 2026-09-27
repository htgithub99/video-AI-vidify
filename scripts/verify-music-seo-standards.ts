import assert from "node:assert/strict";
import fs from "node:fs";
import { SUNO_AUTOMATION_TEXTS } from "../src/constants/sunoAutomation.ts";

const source = fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8");
const component = fs.readFileSync("src/components/MusicCreator.tsx", "utf8");
const constants = fs.readFileSync("src/constants/sunoAutomation.ts", "utf8");

for (const market of [
  { language: "Tiếng Việt", country: "Việt Nam", region: "Miền Nam" },
  { language: "English", country: "United Kingdom", region: "London" },
]) {
  const analysis = { market };
  const seo = SUNO_AUTOMATION_TEXTS.buildMusicPlaylistSeoPrompt(1, "Pop", "market-test", 5, [{ title: "Sample Song" }], analysis);
  const retry = SUNO_AUTOMATION_TEXTS.buildMusicPlaylistSeoCorrectionPrompt([], "Pop", 5, "market-test", [], analysis);
  const cover = SUNO_AUTOMATION_TEXTS.buildMusicThumbnailPrompt([], "Pop", "", false, "", analysis);
  const evaluation = SUNO_AUTOMATION_TEXTS.buildTrackBatchEvaluationPrompt("Pop", [], "{}", analysis);
  for (const prompt of [seo, retry, cover, evaluation]) {
    assert.match(prompt, new RegExp(market.country));
    assert.match(prompt, new RegExp(market.language));
  }
}

assert.match(constants, /SELECTED MUSIC STYLE/);
assert.match(constants, /Make a real music listener feel the atmosphere immediately and want to press play/);
assert.match(constants, /Stay completely honest to the actual song titles, lyrics, genre, mood/);
assert.match(constants, /do not follow a rigid title formula/);
assert.match(constants, /Capitalize the first letter of every word/);
assert.match(constants, /surprise, curiosity or mild shock/);
assert.match(constants, /buildMusicPlaylistSeoRegenerationPrompt/);
assert.match(constants, /title uses the approved listener language with native spelling/);
assert.match(constants, /description starts with exactly one emoji plus one space/);
assert.match(constants, /ONLY hashtags are unaccented ASCII/);
assert.match(constants, /ONLY tags are unaccented ASCII/);
assert.match(constants, /hashtags: exactly 10 unique values/);
assert.match(constants, /tags: exactly 12 unique values/);
assert.match(constants, /ASCII_HASHTAG_VALIDATION/);
assert.match(source, /_.inRange\(_.size\(title\), 15, 100\)/);
assert.match(source, /hasTitleCase/);
assert.doesNotMatch(source, /hasVietnameseDiacritics/);
assert.match(source, /startsWithIcon/);
assert.match(source, /SEO_TITLE_MISLEADING_CLAIMS/);
assert.match(source, /_.uniq\(normalizedTitles\)\.length/);
assert.doesNotMatch(source, /openingKeys/);
assert.match(source, /buildMusicPlaylistSeoPrompt\(requestedSongCount, creativeStyle, seoRequestId/);
assert.match(source, /buildMusicPlaylistSeoCorrectionPrompt\(rankedSongs, creativeStyle/);
assert.match(source, /ROUTER_PATHS\.MUSIC_SEO_REGENERATE/);
assert.match(source, /buildMusicPlaylistSeoRegenerationPrompt\(songs, style \|\|/);
assert.match(source, /buildMusicPlaylistSeoCorrectionPrompt\(songs, style[\s\S]*requestId, seoIssues, styleAnalysis\)/);
assert.match(source, /\[MusicSeoRegenerate\] contract attempt=/);
assert.match(source, /if \(!isRetryableMusicRoomError\(error\) \|\| attempt >= SUNO_AUTOMATION_CONFIG\.MUSIC_ROOM_RESPONSE_ATTEMPTS - 1\) throw error/);
assert.match(source, /_.isEqual\(hashtags\.length, 10\)/);
assert.match(source, /ASCII_HASHTAG_VALIDATION/);
assert.match(source, /_.isEqual\(tags\.length, 12\)/);
assert.match(source, /\^\[a-z0-9 \]\+\$\/i\.test\(value\)/);
assert.doesNotMatch(source, /SEO_HEADING_OCCASIONS/);
assert.match(component, /initialState\.seoSchemaVersion === SUNO_AUTOMATION_CONFIG\.MUSIC_SEO_SCHEMA_VERSION/);
assert.match(component, /saveMusicBlobWithDialog/);
assert.match(component, /PIPELINE_SAVE_FILE/);
assert.match(component, /PIPELINE_MUSIC_SEO_REGENERATE/);
assert.match(component, /handleRegenerateSeo/);
assert.match(component, /MUSIC_RECOMPOSE_BTN/);
assert.match(component, /setViewMode\("seo"\);\s*setIsRegeneratingSeo\(true\)/);
assert.match(component, /isRegeneratingSeo && viewMode === MUSIC_VIEW_MODES\.SEO/);
assert.match(component, /BLOCK_SEO_LOADING/);
assert.match(component, /setViewMode\("lyrics"\);\s*setIsLoading\(true\)/);

process.stdout.write("Music SEO uses the selected style and requests five varied choices without rigid similarity QA.\n");
