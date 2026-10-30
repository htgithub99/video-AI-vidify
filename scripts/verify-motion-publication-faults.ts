import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { MOTION_RENDER_VALIDATION as V } from "../src/constants/motionRenderValidation.js";
import { MotionJobStatus as S } from "../src/types/motionVideo.js";
const storage = fs.mkdtempSync(path.join(os.tmpdir(), "motion-publication-faults-"));
delete process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = storage;
const { getMotionRootDirectory, listMotionResults } = await import("../src/features/motion/server/services/motionLibraryService.js");
const { recoverMotionRenderPublications } = await import("../src/features/motion/server/services/motionRenderPublication.js");
const root = getMotionRootDirectory(),
  folder = path.join(root, V.CHECKPOINT_FOLDER);
fs.mkdirSync(folder, { recursive: true });
const add = (id: string, renamed = false, status?: S) => {
  const fileName = id + ".fixture",
    pending = id + ".pending-fixture";
  fs.writeFileSync(path.join(root, renamed ? fileName : pending), "mock data, not video");
  fs.writeFileSync(path.join(folder, id + V.PUBLICATION), JSON.stringify({ version: V.CHECKPOINT_VERSION, pending, item: { id, fileName, durationSeconds: 2, width: 320, height: 180, fps: 24, createdAt: new Date().toISOString() }, audio: true }));
  if (status) fs.writeFileSync(path.join(folder, id + ".json"), JSON.stringify({ job: { status } }));
};
try {
  add("before_rename");
  add("after_rename", true);
  add("invalid_audio");
  add("cancelled", false, S.CANCELLED);
  add("cancel_during_probe");
  const validate: any = async (file: string, expected: any) => {
    assert.equal(expected.audio, true);
    if (file.includes("invalid_audio")) throw new Error("injected missing audio");
    if (file.includes("cancel_during_probe")) fs.writeFileSync(path.join(folder, "cancel_during_probe.json"), JSON.stringify({ job: { status: S.CANCELLED } }));
    return 2;
  };
  await recoverMotionRenderPublications(validate);
  assert.deepEqual(
    listMotionResults()
      .map((item) => item.id)
      .sort(),
    ["after_rename", "before_rename"],
  );
  await recoverMotionRenderPublications(validate);
  assert.equal(listMotionResults().length, 2);
  for (const id of ["before_rename", "after_rename"]) {
    assert.equal(JSON.parse(fs.readFileSync(path.join(folder, id + ".json"), "utf8")).job.status, S.COMPLETED);
    assert.equal(fs.existsSync(path.join(folder, id + V.PUBLICATION)), false);
  }
  for (const id of ["invalid_audio", "cancelled", "cancel_during_probe"]) {
    assert.ok(fs.existsSync(path.join(folder, id + V.PUBLICATION)));
    assert.equal(fs.existsSync(path.join(root, id + ".fixture")), false);
  }
  console.log(JSON.stringify({ passed: true, crashBeforeAfterRename: true, repeatedRecovery: true, cancelDuringProbe: true, invalidMediaUnpublished: true, mockProbe: true, videoCreated: false }));
} finally {
  fs.rmSync(storage, { recursive: true, force: true });
}
