import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeMotionJsonAtomic } from "../src/features/motion/server/services/motionFileUtils.js";
import { MOTION_PRODUCTION as P } from "../src/constants/motionProduction.js";
import { PRODUCTION_QA as Q } from "./motionProductionVerificationTexts.js";
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "motion-atomic-"));
const file = path.join(directory, Q.READ + P.EXT);
const rename = fs.renameSync;
try {
  writeMotionJsonAtomic(file, { value: Q.READ });
  let calls = 0;
  fs.renameSync = (from, to) => {
    calls++;
    assert.equal(JSON.parse(fs.readFileSync(file, P.ENCODING)).value, Q.READ);
    if (calls < 3) throw Object.assign(new Error(P.ATOMIC_RETRY_CODES[0]), { code: P.ATOMIC_RETRY_CODES[0] });
    rename(from, to);
  };
  writeMotionJsonAtomic(file, { value: Q.WRITE });
  assert.equal(calls, 3);
  assert.equal(JSON.parse(fs.readFileSync(file, P.ENCODING)).value, Q.WRITE);
  calls = 0;
  fs.renameSync = () => {
    calls++;
    throw Object.assign(new Error(P.ATOMIC_RETRY_CODES[0]), { code: P.ATOMIC_RETRY_CODES[0] });
  };
  assert.throws(() => writeMotionJsonAtomic(file, { value: Q.CANCEL }));
  assert.equal(calls, P.ATOMIC_RETRY_DELAYS.length + 1);
  assert.equal(JSON.parse(fs.readFileSync(file, P.ENCODING)).value, Q.WRITE);
  const temporary = fs.readdirSync(directory).filter((name) => name !== path.basename(file));
  assert.equal(temporary.length, 1);
  assert.equal(JSON.parse(fs.readFileSync(path.join(directory, temporary[0]), P.ENCODING)).value, Q.CANCEL);
  calls = 0;
  fs.renameSync = () => {
    calls++;
    throw Object.assign(new Error(P.LOCK_MISSING), { code: P.LOCK_MISSING });
  };
  assert.throws(() => writeMotionJsonAtomic(file, { value: Q.LOG }));
  assert.equal(calls, 1);
  process.stdout.write(Q.ATOMIC_PASSED);
} finally {
  fs.renameSync = rename;
  assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep));
  fs.rmSync(directory, { recursive: true, force: true });
}
