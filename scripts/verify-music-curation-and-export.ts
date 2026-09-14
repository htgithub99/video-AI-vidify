import assert from "node:assert/strict";
import fs from "node:fs";

const controller = fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8");
const component = fs.readFileSync("src/components/MusicCreator.tsx", "utf8");
const constants = fs.readFileSync("src/constants/sunoAutomation.ts", "utf8");
const routes = fs.readFileSync("src/constants/apiRoutes.ts", "utf8");
const pythonDialog = fs.readFileSync("python_scripts/capcut_ultra_tool.py", "utf8");

// Curated mode may download only after every AI selection and score validates.
assert.match(controller, /if \(shouldEvaluateTracks\)[\s\S]*selectProfessionalSunoTracks/);
assert.match(controller, /required: \["selectedTrackIds", "qualityScores"\]/);
assert.match(controller, /Number\.isInteger\(qualityScore\)/);
assert.match(controller, /if \(!_.isEqual\(selectedTracksForDownload\.length, trackPairs\.length\)\)[\s\S]*throw createAppError/);
assert.match(controller, /downloadSunoTracksToFolder\(selectedTracksForDownload/);
assert.doesNotMatch(controller, /catch[\s\S]{0,300}downloadSunoTracksToFolder\(selectedTracksForDownload/);

// Five-song chunks run concurrently, then AI scores define download order and names.
assert.match(constants, /EVALUATION_SONGS_PER_CHUNK:\s*5/);
assert.match(controller, /Promise\.all\(_.map\(pairChunks/);
assert.match(controller, /_.orderBy\(evaluatedTracks, \[\(track\) => track\.qualityScore\], \["desc"\]\)/);
assert.match(controller, /_.padStart\(_.toString\(rank \+ 1\), 2, "0"\)/);

// SEO TXT includes the active playlist URL and both file actions require Save As.
assert.match(component, /const handleExportText = async/);
assert.match(component, /SEO_PLAYLIST_URL_LABEL/);
assert.match(component, /playlistUrl=\{_.trim\(downloadPlaylistUrl\) \|\| sunoPlaylistUrl\}/);
assert.equal((component.match(/<PlaylistSeoCard seoOptions/g) || []).length, 2);
assert.match(routes, /PIPELINE_SAVE_FILE:\s*"\/api\/pipeline\/save-file"/);
assert.match(controller, /router\.post\("\/save-file"/);
assert.match(controller, /execFile\(getPythonCommand\(\)/);
assert.match(pythonDialog, /filedialog\.asksaveasfilename/);
assert.doesNotMatch(component, /showSaveFilePicker/);
assert.match(component, /saveMusicBlobWithDialog\(new Blob\(\[`\\uFEFF\$\{exportText\}`\]/);
assert.match(component, /const handleDownloadThumbnail = async/);
assert.doesNotMatch(component, /anchor\.download/);

process.stdout.write("Music curation gates, ranking, concurrent chunks, SEO TXT export, and Save As dialogs are present.\n");
