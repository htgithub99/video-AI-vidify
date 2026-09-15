import assert from "node:assert/strict";
import fs from "node:fs";

const constants = fs.readFileSync("src/constants/sunoAutomation.ts", "utf8");
const controller = fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8");
const component = fs.readFileSync("src/components/MusicCreator.tsx", "utf8");

assert.match(constants, /Songwriter\/composer/);
assert.match(constants, /Lyricist:/);
assert.match(constants, /Music producer:/);
assert.match(constants, /source language, regional audience/);
assert.match(constants, /melodic language, phrasing cadence, harmonic movement/);
assert.match(constants, /genre\/subgenre, tempo range, groove, instrumentation/);
assert.match(constants, /source-derived creative blueprint/);
assert.match(constants, /native songwriter for the inferred target region/);
assert.match(constants, /complete performance-ready lyrics with Suno section labels/);
assert.match(constants, /Never copy lyrics, melodies, hooks, titles, signature phrases or artist identity/);
assert.match(controller, /lyrics\.length >= 300/);
assert.match(controller, /_.inRange\(_.toNumber\(song\?\.tempoBpm\), 40, 241\)/);
assert.match(controller, /song\.structure\.length >= 3/);
assert.match(controller, /hasOriginalityNotes/);
assert.match(controller, /Promise\.all\(\[[\s\S]*generatePlaylistSeo\(\)[\s\S]*generateMusicThumbnailAsset/);
assert.match(controller, /data: \{ songs: rankedSongs, sunoSettings: sunoSettingsParsed\.settings, playlistSeoOptions: playlistSeoParsed\.seoOptions, thumbnail, thumbnailWarning \}/);
assert.doesNotMatch(constants, /Primary collection SEO direction/);
assert.match(constants, /buildMusicThumbnailPrompt: \(songs: any\[\], style: string, description: string, hasReference: boolean\)/);
assert.match(component, /setPlaylistSeoOptions\(generatedPlaylistSeo\);[\s\S]{0,200}setGeneratedThumbnail\(generatedThumbnailUrl\)/);

process.stdout.write("Music composition uses source-grounded songwriter, composer, lyricist, and producer roles.\n");
