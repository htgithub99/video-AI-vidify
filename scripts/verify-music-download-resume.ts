import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createMusicDownloadCheckpointKey, deleteMusicDownloadCheckpoint, deleteMusicEvaluationAudio, readMusicDownloadCheckpoint, readMusicEvaluationAudio, readMusicEvaluationWav, writeMusicDownloadCheckpoint, writeMusicEvaluationAudio, writeMusicEvaluationWav } from "../src/server/services/musicDownloadCheckpointService.ts";
import { downloadSunoTracksToFolder } from "../src/server/services/sunoAutomationService.ts";
const folder = await fs.mkdtemp(path.join(os.tmpdir(), "vidify-download-resume-test-"));
const candidateIds = [randomUUID(), randomUUID()];
const key = createMusicDownloadCheckpointKey(`https://suno.com/playlist/${randomUUID()}`, candidateIds, "Bolero", "gemini-flash-lite");
const filePath = path.join(folder, "01. Bài Hát.wav");
try {
  const sourceWav = path.join(folder, "source.wav");
  execFileSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", "-ac", "1", "-y", sourceWav]);
  const previewMp3 = path.join(folder, "preview.mp3");
  execFileSync("ffmpeg", ["-v", "error", "-i", sourceWav, "-codec:a", "libmp3lame", "-b:a", "128k", "-y", previewMp3]);
  const wavBytes = await fs.readFile(sourceWav);
  await writeMusicEvaluationWav(key, candidateIds[1], wavBytes);
  assert.ok(await readMusicEvaluationWav(key, candidateIds[1]));
  const sampleAudio = await fs.readFile(previewMp3);
  await writeMusicEvaluationAudio(key, candidateIds[1], sampleAudio);
  assert.deepEqual(await readMusicEvaluationAudio(key, candidateIds[1]), sampleAudio);
  assert.equal(await readMusicEvaluationAudio(key, candidateIds[0]), null);
  await fs.writeFile(filePath, Buffer.from("existing-audio-file"));
  await writeMusicDownloadCheckpoint({ version: 2, key, candidateIds, selectedTracks: [{ songId: candidateIds[0], title: "01. Bài Hát", qualityScore: 90 }], folderPath: folder, format: "wav", downloadedPaths: { [candidateIds[0]]: filePath }, sourceWavRequired: true, updatedAt: Date.now() });
  const saved = await readMusicDownloadCheckpoint(key, candidateIds);
  assert.ok(saved);
  assert.equal(saved.selectedTracks[0].songId, candidateIds[0]);
  assert.equal(await readMusicDownloadCheckpoint(key, [candidateIds[1], candidateIds[0]]), null);
  const downloaded = await downloadSunoTracksToFolder(saved.selectedTracks, folder, "wav", undefined, "resume-test", {
    existingPaths: saved.downloadedPaths,
    onTrackDownloaded: async () => {
      throw new Error("Existing audio was downloaded again");
    },
  });
  assert.deepEqual(downloaded, [filePath]);
  assert.equal((await fs.readFile(filePath)).toString(), "existing-audio-file");
  const localTrack = { songId: candidateIds[1], title: "02. Bài Mới" };
  const wavOutput = await downloadSunoTracksToFolder([localTrack], folder, "wav", undefined, "local-wav-test", { sourceWavPaths: { [localTrack.songId]: sourceWav } });
  const mp3Output = await downloadSunoTracksToFolder([localTrack], folder, "mp3", undefined, "local-mp3-test", { sourceWavPaths: { [localTrack.songId]: sourceWav } });
  assert.ok((await fs.stat(wavOutput[0])).size > 10_000);
  assert.ok((await fs.stat(mp3Output[0])).size > 1_000);
  assert.ok(Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", mp3Output[0]]).toString()) > 0);
} finally {
  await deleteMusicDownloadCheckpoint(key);
  await deleteMusicEvaluationAudio(key);
  await fs.rm(folder, { recursive: true, force: true });
}
console.log("Music download resumes saved selections and skips completed files.");
