import fs from "node:fs";
import path from "node:path";
import { editScript, runInMotionAiSession } from "../src/features/motion/server/services/motionStoryService.js";
import { motionScriptFindings } from "../src/lib/motionScriptFindings.js";
import { normalizeMotionSpokenBeat } from "../src/lib/motionSpokenNumbers.js";
import { requestContext } from "../src/server/utils/requestContext.js";
import { getResolvedLicenseKey } from "../src/server/services/apiKeyResolver.js";
import { closeActiveBrowser } from "../src/server/services/imageGeneratorService.js";
import type { MotionGenreReviewFinding } from "../src/lib/motionGenreReview.js";
const out = path.resolve("scratch/motion-writing-live-20261101");
const read = (file: string) => JSON.parse(fs.readFileSync(path.join(out, file + ".json"), "utf8"));
const save = (file: string, value: unknown) => fs.writeFileSync(path.join(out, file + ".json"), JSON.stringify(value, null, 2));
let failures = 0;
for (const genre of process.argv.slice(2)) {
  const request = read(genre + "-request"),
    analysis = read(genre + "-analyze"),
    script = read(genre + "-script"),
    manual = read(genre + "-manual-review");
  const findings: MotionGenreReviewFinding[] = manual.issues.map((item: { id: string; issue: string }) => ({ ...item, kind: "source" }));
  const logs: string[] = [];
  const log = (line: string) => {
    logs.push(line);
    save(genre + "-focused-logs", logs);
    process.stdout.write(genre + ": " + line + "\n");
  };
  const runId = "writing-focused-" + genre + "-" + Date.now();
  save(genre + "-before-focused", script);
  try {
    const result = await requestContext.run({ licenseKey: getResolvedLicenseKey() }, () => runInMotionAiSession(runId, () => editScript(request.source, analysis, script.beats, { language: request.language, exec: request.aiExecution, scope: runId, focusIds: findings.map((item) => item.id), reviewFindings: findings, supplemental: true, log }), log));
    save(genre + "-focused-result", result);
    const names = analysis.cast.map((member: { name: string }) => member.name);
    const beats = result.beats.map((beat) => normalizeMotionSpokenBeat(beat, request.language, names));
    const qa = motionScriptFindings(beats, analysis, request.language, request.source.text);
    const updated = {
      ...script,
      beats,
      edit: {
        ...script.edit,
        reviewed: (script.edit?.reviewed || 0) + result.edit.reviewed,
        rewritten: (script.edit?.rewritten || 0) + result.edit.rewritten,
        requests: (script.edit?.requests || 0) + (result.edit.requests || 0),
        extraRequests: (script.edit?.extraRequests || 0) + (result.edit.requests || 0),
        notes: [...(script.edit?.notes || []), ...result.edit.notes],
        remaining: [...qa.review, ...qa.overlap, ...qa.style, ...qa.stage, ...qa.echo, ...qa.repeat],
      },
    };
    save(genre + "-script", updated);
    save(genre + "-audit", {
      completed: true,
      targetSeconds: analysis.chapters.reduce((sum: number, chapter: { targetSeconds: number }) => sum + chapter.targetSeconds, 0),
      spokenUnits: beats
        .map((beat) => beat.narration)
        .join(" ")
        .split(/\s+/u).length,
      findings: { ...qa, dropIds: [...qa.dropIds], dropRefs: [...qa.dropRefs] },
      edit: updated.edit,
    });
    save(
      genre + "-focused-comparison",
      findings.map((item) => ({ ...item, before: script.beats.find((beat: { id: string }) => beat.id === item.id), after: beats.find((beat) => beat.id === item.id) })),
    );
  } catch (error) {
    failures++;
    save(genre + "-focused-error", { error: String(error) });
    process.stdout.write(genre + ": FAILED " + String(error) + "\n");
  }
}
await closeActiveBrowser();
process.exit(failures ? 1 : 0);
