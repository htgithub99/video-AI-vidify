import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { MOTION_VOICE } from "../src/constants/motionVoice.ts";
import { listVieneuVoices, registerVieneuVoice, synthesizeVieneuSpeech, closeVieneuWorker, vieneuRoot } from "../src/server/services/vieneuTtsService.ts";
const root = vieneuRoot(),
  saved = path.join(root, VT.VOICES_V3_TURBO_JSON),
  backup = fs.existsSync(saved) ? fs.readFileSync(saved) : undefined;
const sample = path.join(root, VT.SMOKE_WAV),
  id = VT.CUSTOM + createHash(VT.SHA256).update(VT.MOTION_RUNTIME_TEST).digest(VT.HEX).slice(0, 32);
const output = path.join(root, VT.RUNTIME_CHECK_WAV);
try {
  if (!fs.existsSync(sample)) await synthesizeVieneuSpeech(VT.CAC_CHAU_CU_BINH_TINH_CHAC_CHI_LA_TIENG_GIO_NGOAI_CUA_THOI, MOTION_VOICE.DEFAULT, sample);
  const catalogue = await listVieneuVoices();
  assert.ok(catalogue.some((voice) => voice.gender === VT.FEMALE) && catalogue.some((voice) => voice.gender === VT.MALE));
  const registered = await registerVieneuVoice(id, VT.RUNTIME_VERIFICATION, VT.MALE, sample);
  assert.equal(registered.id, id);
  closeVieneuWorker();
  assert.ok(
    (await listVieneuVoices()).some((voice) => voice.id === id),
    VT.REFERENCE_VOICES_PERSIST_ACROSS_WORKER_RESTART,
  );
  const result = await synthesizeVieneuSpeech(VT.CAC_CHAU_CU_BINH_TINH_MOI_VIEC_DEU_SE_ON_THOI, id, output);
  assert.ok(result.seconds > 1 && result.sampleRate === 48000);
  assert.ok(fs.statSync(output).size > 48000);
  const first = synthesizeVieneuSpeech(VT.DAY_LA_PHAN_KIEM_TRA_HUY_TAC_VU_DANG_CHAY, id, output);
  const abort = new AbortController();
  const queued = listVieneuVoices(abort.signal);
  abort.abort();
  await assert.rejects(queued, /cancelled/);
  await first;
  const activeAbort = new AbortController();
  const interrupted = synthesizeVieneuSpeech(VT.MOT_DOAN_LOI_THOAI_RAT_DAI_DANG_DUOC_DOC_DE_KIEM_TRA_VIEC_HU, id, output, activeAbort.signal);
  setTimeout(() => activeAbort.abort(), 150);
  await assert.rejects(interrupted, /cancelled/);
  assert.ok(
    (await listVieneuVoices()).some((voice) => voice.id === id),
    VT.CANCELLED_WORKER_RESTARTS_FOR_THE_NEXT_OPERATION,
  );
  process.stdout.write(VT.VIENEU_RUNTIME_PASSED_REAL_REFERENCE_REGISTRATION_PERSISTED_);
} finally {
  closeVieneuWorker();
  if (backup) fs.writeFileSync(saved, backup);
  else fs.rmSync(saved, { force: true });
  fs.rmSync(output, { force: true });
}
