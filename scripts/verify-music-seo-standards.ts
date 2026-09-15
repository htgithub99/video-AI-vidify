import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8");
const component = fs.readFileSync("src/components/MusicCreator.tsx", "utf8");
const constants = fs.readFileSync("src/constants/sunoAutomation.ts", "utf8");

assert.match(constants, /Title: 50-90 characters/);
assert.match(constants, /natural Vietnamese sentence case/);
assert.match(constants, /never ALL CAPS/);
assert.match(constants, /USER-SELECTED GLOBAL MUSIC STYLE/);
assert.match(constants, /do not force every title to begin with the same genre phrase/);
assert.match(constants, /Read every existing title, lyric, mood and genre/);
assert.match(constants, /real alternatives, not paraphrases/);
assert.match(constants, /different editorial concept, title opening, emotional promise/);
assert.match(constants, /Natural overlap in essential genre keywords is allowed/);
assert.match(constants, /Description: 500-1,800 Vietnamese characters/);
assert.match(constants, /DANH SÁCH CA KHÚC:/);
assert.match(constants, /PHÙ HỢP KHI:/);
assert.match(constants, /Hashtags: exactly 8-12 unique/);
assert.match(constants, /Tags: 20-30 unique/);
assert.match(source, /_.inRange\(_.size\(title\), 50, 91\)/);
assert.match(source, /titleCaseRatio < 0\.75/);
assert.match(source, /SEO_TITLE_MISLEADING_CLAIMS/);
assert.match(source, /songCountMatches\.length === 1/);
assert.match(source, /_.uniq\(normalizedTitles\)\.length/);
assert.doesNotMatch(source, /openingKeys/);
assert.match(source, /buildMusicPlaylistSeoPrompt\(requestedSongCount, style, seoRequestId/);
assert.match(source, /buildMusicPlaylistSeoCorrectionPrompt\(requestedSongCount, style/);
assert.match(source, /_.inRange\(hashtags\.length, 8, 13\)/);
assert.match(source, /_.inRange\(tags\.length, 20, 31\)/);
assert.match(source, /_.every\(songs, \(song\) => _.includes/);
assert.doesNotMatch(source, /3-5 relevant hashtags/);
assert.match(component, /initialState\.seoSchemaVersion === SUNO_AUTOMATION_CONFIG\.MUSIC_SEO_SCHEMA_VERSION/);
assert.match(component, /saveMusicBlobWithDialog/);
assert.match(component, /PIPELINE_SAVE_FILE/);

process.stdout.write("Music SEO uses the selected style and requests five varied choices without rigid similarity QA.\n");
