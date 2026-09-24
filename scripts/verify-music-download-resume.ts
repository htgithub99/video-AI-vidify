import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createMusicDownloadCheckpointKey, deleteMusicDownloadCheckpoint, deleteMusicEvaluationAudio, readMusicDownloadCheckpoint, readMusicEvaluationAudio, writeMusicDownloadCheckpoint, writeMusicEvaluationAudio } from "../src/server/services/musicDownloadCheckpointService.ts";
import { downloadSunoTracksToFolder } from "../src/server/services/sunoAutomationService.ts";

const folder = await fs.mkdtemp(path.join(os.tmpdir(), "vidify-download-resume-test-"));
const candidateIds = [randomUUID(), randomUUID()];
const key = createMusicDownloadCheckpointKey(`https://suno.com/playlist/${randomUUID()}`, candidateIds, "Bolero", "gemini-flash-lite");
const filePath = path.join(folder, "01. Bài Hát.wav");
try {
  const sampleAudio = Buffer.alloc(10_001, 7);
  await writeMusicEvaluationAudio(key, candidateIds[1], sampleAudio);
  assert.deepEqual(await readMusicEvaluationAudio(key, candidateIds[1]), sampleAudio);
  assert.equal(await readMusicEvaluationAudio(key, candidateIds[0]), null);
  await fs.writeFile(filePath, Buffer.from("existing-audio-file"));
  await writeMusicDownloadCheckpoint({
    version: 1, key, candidateIds, selectedTracks: [{ songId: candidateIds[0], title: "01. Bài Hát", qualityScore: 90 }],
    folderPath: folder, format: "wav", downloadedPaths: { [candidateIds[0]]: filePath }, updatedAt: Date.now(),
  });
  const saved = await readMusicDownloadCheckpoint(key, candidateIds);
  assert.ok(saved);
  assert.equal(saved.selectedTracks[0].songId, candidateIds[0]);
  assert.equal(await readMusicDownloadCheckpoint(key, [candidateIds[1], candidateIds[0]]), null);
  const downloaded = await downloadSunoTracksToFolder(saved.selectedTracks, folder, "wav", undefined, "resume-test", {
    existingPaths: saved.downloadedPaths,
    onTrackDownloaded: async () => { throw new Error("Existing audio was downloaded again"); },
  });
  assert.deepEqual(downloaded, [filePath]);
  assert.equal((await fs.readFile(filePath)).toString(), "existing-audio-file");
} finally {
  await deleteMusicDownloadCheckpoint(key);
  await deleteMusicEvaluationAudio(key);
  await fs.rm(folder, { recursive: true, force: true });
}

console.log("Music download resumes saved selections and skips completed files.");
