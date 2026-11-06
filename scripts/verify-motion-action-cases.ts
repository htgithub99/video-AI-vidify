import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { remotionPlanGroups, remotionGroupKey, remotionBeatKey, remotionGroupPlanCurrent } from "../src/features/motion/server/services/remotion/sceneKeys.ts";
const root = path.resolve("storage/output/motion-video/productions");
const out = path.resolve("scratch/motion-all-styles-20261106");
await fs.mkdir(out, { recursive: true });
const cases: any[] = [], files: any[] = [];
for (const name of await fs.readdir(root)) {
  if (!name.endsWith(".json")) continue;
  const file = path.join(root, name);
  try {
    const bytes = await fs.readFile(file), p = JSON.parse(bytes.toString());
    const script = p.result?.script, analysis = p.result?.analysis;
    const state = script?.gen?.remotion;
    if (!state || !analysis) continue;
    const profile = state.settings?.profileId, genre = analysis.videoGenre || p.input?.videoGenre || "pov";
    const compatible = new Set<string>();
    for (const group of remotionPlanGroups(script, analysis, state)) {
      for (const beat of group.beats) state.inputKeys[beat.id] = remotionBeatKey(beat, analysis, "", state);
      for (const scene of state.scenes[group.id] || []) scene.sourceKey = remotionGroupKey(group.beats, analysis, state);
      if (remotionGroupPlanCurrent(group.beats, analysis, state)) for (const scene of state.scenes[group.id] || []) compatible.add(scene.id);
    }
    let count = 0;
    for (const scene of Object.values(state.scenes || {}).flat() as any[]) {
      if (!scene.nodes?.length && !scene.environment) continue;
      const timed = p.result?.compiled?.spec?.scenes?.find((s: any) => s.id === scene.id);
      cases.push({ file, productionId: p.id || path.basename(name, ".json"), title: p.title || analysis.title, sceneId: scene.id, beatId: scene.beatId, profile, genre, format: scene.format || "illustration", view: scene.view, units: [...new Set(scene.nodes.map((n: any) => n.unit).filter(Boolean))], animals: [...new Set(scene.nodes.map((n: any) => n.animal).filter(Boolean))], objectClasses: [...new Set((scene.objects || []).map((n: any) => n.class))], purpose: scene.purpose, text: scene.text, hasComposition: !!scene.composition, hasTimedSpec: !!timed, planSourceCompatible: compatible.has(scene.id), sourceHash: createHash("sha256").update(bytes).digest("hex") });
      count++;
    }
    files.push({ file, profile, genre, scenes: count });
  } catch (error) { files.push({ file, error: String(error) }); }
}
const counts: Record<string, number> = {};
for (const c of cases) counts[`${c.profile}/${c.genre}`] = (counts[`${c.profile}/${c.genre}`] || 0) + 1;
await fs.writeFile(path.join(out, "source-manifest.json"), JSON.stringify({ at: new Date().toISOString(), files, counts, cases }, null, 2));
console.log(JSON.stringify({ files: files.length, scenes: cases.length, counts, formats: [...new Set(cases.map((c) => c.format))], units: [...new Set(cases.flatMap((c) => c.units))], out }, null, 2));
