import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { normalizeSceneComposition } from "../src/lib/motionSceneComposition.ts";
const out = path.resolve(process.env.QA_ACTION_OUT || "storage/output/motion-video/clip-demo/all-styles-actions-v3-20261106");
const report = JSON.parse(await fs.readFile(path.join(out, "verification.json"), "utf8"));
const latest = new Map<string, any>();
for (const row of report.cases) latest.set(row.id, row);
const cases: any[] = [];
for (const row of latest.values()) {
  const bytes = await fs.readFile(row.source.file), production = JSON.parse(bytes.toString());
  assert.equal(createHash("sha256").update(bytes).digest("hex"), row.sourceHash, "Original production must remain unchanged");
  const scene: any = Object.values(production.result.script.gen.remotion.scenes).flat().find((s: any) => s.id === row.source.sceneId);
  const rawBytes = await fs.readFile(path.join(out, row.id, "raw-response.json")).catch(() => undefined);
  const entry: any = { id: row.id, originalRuntimeStatus: row.technicalStatus, configurationVariant: row.configurationVariant, providerSceneCalls: row.calls.filter((c: any) => c.artifact === "motion_remotion_composition" && c.providerCalled !== false).length, originalProductionUnchanged: true };
  if (rawBytes) {
    const raw = JSON.parse(rawBytes.toString());
    entry.rawHash = createHash("sha256").update(rawBytes).digest("hex");
    entry.tracks = raw.animations?.length;
    try {
      const normalized = normalizeSceneComposition(raw, "audit", "audit", scene.purpose, scene.nodes, new Set<string>(production.result.analysis.cast.map((c: any) => c.key)), 1280, 720, true);
      assert.deepEqual(normalized.composition.animations, raw.animations);
      assert.equal(normalized.composition.layers.length, raw.layers.length);
      entry.currentParserStatus = "passed";
    } catch (error) { entry.currentParserStatus = "failed"; entry.error = String(error); }
  } else entry.currentParserStatus = "no retained response";
  cases.push(entry);
}
await fs.writeFile(path.join(out, "current-parser-audit.json"), JSON.stringify({ at: new Date().toISOString(), providerCallsThisAudit: 0, cases, scope: "Technical audit of retained first responses; no redraw, no animation change and no aesthetic quality verdict" }, null, 2));
console.log(JSON.stringify({ cases: cases.length, currentParserPassed: cases.filter((c) => c.currentParserStatus === "passed").length, remaining: cases.filter((c) => c.currentParserStatus !== "passed").map((c) => ({ id: c.id, error: c.error })), providerCallsThisAudit: 0 }, null, 2));
