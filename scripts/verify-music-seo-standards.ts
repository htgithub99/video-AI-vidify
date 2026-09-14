import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8");
const component = fs.readFileSync("src/components/MusicCreator.tsx", "utf8");

assert.match(source, /Title: 60-95 characters/);
assert.match(source, /Description: 1,000-3,000 Vietnamese characters/);
assert.match(source, /DANH SÁCH CA KHÚC:/);
assert.match(source, /PHÙ HỢP KHI:/);
assert.match(source, /Hashtags: exactly 8-12 unique/);
assert.match(source, /Tags: 20-30 unique/);
assert.match(source, /_.inRange\(hashtags\.length, 8, 13\)/);
assert.match(source, /_.inRange\(tags\.length, 20, 31\)/);
assert.match(source, /_.every\(songs, \(song\) => _.includes/);
assert.doesNotMatch(source, /3-5 relevant hashtags/);
assert.match(component, /const MUSIC_SEO_SCHEMA_VERSION = 2/);
assert.match(component, /_.isEqual\(initialState\.seoSchemaVersion, MUSIC_SEO_SCHEMA_VERSION\)/);
assert.match(component, /saveMusicBlobWithDialog/);
assert.match(component, /showSaveFilePicker/);
assert.match(component, /await saveMusicBlobWithDialog\(blob, `\$\{baseName\}\.txt`/);
assert.match(component, /await saveMusicBlobWithDialog\(blob, `music-cover-/);
assert.doesNotMatch(component, /link\.download = `\$\{baseName\}\.txt`/);

process.stdout.write("Music SEO contract and save-location dialogs are enforced.\n");
