import assert from "node:assert/strict";
import fs from "node:fs";

const controller = fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8");
const constants = fs.readFileSync("src/constants/sunoAutomation.ts", "utf8");

assert.match(constants, /EVALUATION_SONGS_PER_CHUNK:\s*5/);
assert.match(controller, /_.chunk\(trackPairs, SUNO_AUTOMATION_CONFIG\.EVALUATION_SONGS_PER_CHUNK\)/);
assert.match(controller, /Promise\.all\(_.map\(pairChunks/);
assert.match(controller, /TRACK_EVALUATION_WORKER_ID}-chunk-\$\{chunkIndex \+ 1\}/);
assert.match(controller, /workerId: chunkWorkerId/);
assert.match(controller, /closeChatPlanningRoom\([\s\S]*workerId: chunkWorkerId/);
assert.match(controller, /suno-curated-download\.jsonl/);
assert.match(controller, /expectedDownloadCount: trackPairs\.length/);
assert.match(controller, /downloadedCount: downloadedPaths\.length/);
assert.match(controller, /all_evaluations_completed/);
assert.match(controller, /download_started/);
assert.match(controller, /downloadSunoTracksToFolder\(selectedTracksForDownload/);
assert.doesNotMatch(controller, /chunkDownloadedPaths/);
assert.match(controller, /chunk_evaluation_retry/);
assert.match(controller, /try \{\s*const response = await generatePlanningWithChatUi/);
assert.match(controller, /Every retry must include the audio again/);
assert.match(controller, /\n\s*attachments,\n\s*artifactType:/);
assert.match(controller, /mkdtemp\(path\.join\(os\.tmpdir\(\), "vidify-suno-evaluation-"\)\)/);
assert.match(controller, /fs\.promises\.rm\(attachmentDirectory, \{ recursive: true, force: true \}\)/);
assert.doesNotMatch(controller, /buildAudioBatchUploadPrompt/);
assert.match(constants, /Listen to every attached audio file before answering/);
assert.match(constants, /quality score from 0 to 100/);
assert.match(controller, /required: \["selectedTrackIds", "qualityScores"\]/);
assert.match(controller, /_.orderBy\(evaluatedTracks[\s\S]*qualityScore[\s\S]*\["desc"\]/);
assert.match(controller, /_.padStart\(_.toString\(rank \+ 1\), 2, "0"\)/);

process.stdout.write("Suno curated download evaluates five-song chunks concurrently, ranks AI winners, and renumbers downloads.\n");
