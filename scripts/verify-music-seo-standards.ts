import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8");
const component = fs.readFileSync("src/components/MusicCreator.tsx", "utf8");
const constants = fs.readFileSync("src/constants/sunoAutomation.ts", "utf8");

assert.match(constants, /Title: 55-85 characters/);
assert.match(constants, /natural Vietnamese sentence case/);
assert.match(constants, /never ALL CAPS/);
assert.match(constants, /primary searchable genre\/collection phrase within the first 45 characters/);
assert.match(constants, /Read every existing title, lyric, mood and genre/);
assert.match(constants, /Do not repeat the same first four meaningful words/);
assert.match(constants, /Description: 1,000-3,000 Vietnamese characters/);
assert.match(constants, /DANH SÁCH CA KHÚC:/);
assert.match(constants, /PHÙ HỢP KHI:/);
assert.match(constants, /Hashtags: exactly 8-12 unique/);
assert.match(constants, /Tags: 20-30 unique/);
assert.match(source, /_.inRange\(_.size\(title\), 55, 86\)/);
assert.match(source, /titleCaseRatio < 0\.6/);
assert.match(source, /SEO_TITLE_MISLEADING_CLAIMS/);
assert.match(source, /songCountMatches\.length === 1/);
assert.match(source, /_.uniq\(openingKeys\)\.length/);
assert.match(source, /_.inRange\(hashtags\.length, 8, 13\)/);
assert.match(source, /_.inRange\(tags\.length, 20, 31\)/);
assert.match(source, /_.every\(songs, \(song\) => _.includes/);
assert.doesNotMatch(source, /3-5 relevant hashtags/);
assert.match(component, /initialState\.seoSchemaVersion === SUNO_AUTOMATION_CONFIG\.MUSIC_SEO_SCHEMA_VERSION/);
assert.match(component, /saveMusicBlobWithDialog/);
assert.match(component, /PIPELINE_SAVE_FILE/);

process.stdout.write("Music SEO enforces YouTube-safe sentence case, list fidelity, distinct search intent, and complete metadata.\n");
