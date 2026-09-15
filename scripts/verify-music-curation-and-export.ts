import assert from "node:assert/strict";
import fs from "node:fs";

const controller = fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8");
const component = fs.readFileSync("src/components/MusicCreator.tsx", "utf8");
const constants = fs.readFileSync("src/constants/sunoAutomation.ts", "utf8");
const routes = fs.readFileSync("src/constants/apiRoutes.ts", "utf8");
const service = fs.readFileSync("src/server/services/sunoAutomationService.ts", "utf8");
const chatService = fs.readFileSync("src/server/services/chatUiPlanningService.ts", "utf8");
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
assert.match(controller, /downloadSunoEvaluationAudio\(_.map\(tracks, "songId"\), planningRun\.signal\)/);
assert.match(controller, /evaluationAudioBySongId/);
assert.doesNotMatch(controller, /selectProfessionalSunoTracks[\s\S]{0,2200}const downloadOrigin/);
assert.match(controller, /_.orderBy\(evaluatedTracks, \[\(track\) => track\.qualityScore\], \["desc"\]\)/);
assert.match(controller, /_.padStart\(_.toString\(rank \+ 1\), 2, "0"\)/);
assert.match(controller, /readMediaDurationSeconds/);
assert.match(controller, /startSeconds: cumulativeSeconds/);
assert.match(controller, /curatedTracks/);
assert.match(component, /replaceSeoTracklistWithTimestamps/);
assert.match(component, /formatPlaylistTimestamp/);
assert.match(component, /setSongs\(reorderedSongs\)/);
assert.match(component, /handleCancelSunoDownload/);
assert.match(component, /sunoDownloadAbortControllerRef\.current\?\.abort\(\)/);
assert.match(component, /SUNO_DOWNLOAD_CANCEL_BTN/);
assert.match(controller, /downloadAbortController\.signal/);
assert.match(service, /AbortSignal\.any/);
assert.match(service, /signal\?\.throwIfAborted\(\)/);
assert.match(chatService, /attachmentUploadMutex = new SimpleMutex/);
assert.match(chatService, /releaseAttachmentUpload = await attachmentUploadMutex\.acquire\(\)/);
assert.match(constants, /evaluate these exact pairs again/);
assert.match(constants, /Never return an ID outside its listed pair/);

// SEO TXT includes the active playlist URL and both file actions require Save As.
assert.match(component, /const handleExportText = async/);
assert.match(component, /SEO_PLAYLIST_URL_LABEL/);
assert.match(component, /playlistUrl=\{_.trim\(downloadPlaylistUrl\) \|\| sunoPlaylistUrl\}/);
assert.equal((component.match(/<PlaylistSeoCard seoOptions/g) || []).length, 2);
assert.match(routes, /PIPELINE_SAVE_FILE:\s*"\/api\/pipeline\/save-file"/);
assert.match(controller, /router\.post\(ROUTER_PATHS\.SAVE_FILE/);
assert.match(controller, /execFile\(getPythonCommand\(\)/);
assert.match(pythonDialog, /filedialog\.asksaveasfilename/);
assert.doesNotMatch(component, /showSaveFilePicker/);
assert.match(component, /saveMusicBlobWithDialog\(new Blob\(\[`\\uFEFF\$\{exportText\}`\]/);
assert.match(component, /const handleDownloadThumbnail = async/);
assert.doesNotMatch(component, /anchor\.download/);
assert.match(constants, /SEO_EXPORT_FILENAME:\s*"SEO"/);
assert.match(constants, /THUMBNAIL_EXPORT_FILENAME:\s*"COVER"/);
assert.match(component, /playlistName: playlistSeoOptions\[0\]\?\.title/);
assert.match(controller, /req\.body\?\.playlistName/);
assert.match(constants, /`TUYỂN TẬP \$\{songCount\} CA KHÚC - \$\{firstSongTitle\.toLocaleUpperCase\("vi-VN"\)\}`/);
assert.match(controller, /req\.body\?\.playlistName/);
assert.match(fs.readFileSync("src/server/services/sunoAutomationService.ts", "utf8"), /playlistName[\s\S]*toLocaleUpperCase\("vi-VN"\)/);

process.stdout.write("Music curation gates, ranking, concurrent chunks, SEO TXT export, and Save As dialogs are present.\n");
