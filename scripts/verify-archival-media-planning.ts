import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeVisualShotPlan } from "../src/services/visualPlanningService.ts";

const base = { id: "sc_1", script: "The historic building opened in 1911" } as any;
const archival = normalizeVisualShotPlan({
  assetStrategy: "archival",
  archivalSearchQuery: "Hanoi Opera House historic photograph exterior",
  archivalRationale: "The named building requires authentic visual evidence",
} as any, base);
assert.equal(archival.assetStrategy, "archival");
assert.equal(archival.archivalSearchQuery, "Hanoi Opera House historic photograph exterior");

const generated = normalizeVisualShotPlan({
  assetStrategy: "ai_generated",
  archivalSearchQuery: "must be removed",
  archivalRationale: "An illustrative reconstruction is sufficient",
} as any, base);
assert.equal(generated.assetStrategy, "ai_generated");
assert.equal(generated.archivalSearchQuery, "");

const pipeline = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
const archivalSearch = fs.readFileSync("src/server/services/archivalImageSearchService.ts", "utf8");
assert.match(pipeline, /PIPELINE_SEARCH_ARCHIVAL_IMAGE/);
assert.match(pipeline, /archivalScene\.assetStrategy = "ai_generated"/);
assert.match(pipeline, /await persistImageCheckpoint\(\)/);
assert.ok(archivalSearch.indexOf("await searchGoogleImages") < archivalSearch.indexOf("await searchWikimediaCommons"), "Google Images must be attempted before Wikimedia Commons");
assert.match(archivalSearch, /License not verified; review the original source page before publication/);

console.log("Archival media planning assertions passed.");
