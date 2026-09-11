import assert from "node:assert/strict";
import fs from "node:fs";
import { safeParseJSON, tryParseJSON } from "../src/server/utils/helpers.ts";

const sourceFiles = [
  "src/server/controllers/pipelineController.ts",
  "src/hooks/useAutoVideoPipeline.ts",
  "src/components/pipeline/usePipelineWizard.ts",
].map((file) => fs.readFileSync(file, "utf8")).join("\n");

assert.doesNotMatch(sourceFiles, /createSourceGroundedSeo|createSourceGroundedStoryboard|ensureStoryboardScriptCoverage|ensureScriptGroundedSceneDetails|compileImagePrompt/);
assert.equal(tryParseJSON('{"complete":true} trailing prose'), undefined);
assert.equal(tryParseJSON('```json\n{"complete":true}\n```'), undefined);
assert.equal(tryParseJSON('{"complete":true'), undefined);
assert.throws(() => safeParseJSON('{"complete":true} trailing prose', {}), /invalid_ai_json_response/);
assert.deepEqual(safeParseJSON('{"complete":true}', {}), { complete: true });

process.stdout.write("Strict AI artifact assertions passed.\n");
