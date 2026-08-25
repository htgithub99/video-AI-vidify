import assert from "node:assert/strict";
import fs from "node:fs";

const pipeline = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
const generator = fs.readFileSync("src/components/AutoVideoGenerator.tsx", "utf8");

assert.match(pipeline, /let currentLogs: string\[\] = config\.resumeMode \? _\.clone\(logs\) : \[\]/);
assert.match(pipeline, /if \(!config\.resumeMode\) \{[\s\S]*KEY_AUTO_PIPELINE_CURRENT_LOGS[\s\S]*safeStringify\(\[\]\)/);
assert.match(pipeline, /let currentLogProjectId = config\.resumeMode/);
assert.doesNotMatch(pipeline, /const targetId = activeCreatedProject\?\.id \|\| config\.selectedProjectId/);
assert.match(pipeline, /currentLogProjectId = newProjectId;[\s\S]*KEY_AUTO_PIPELINE_PROJECT_LOGS_PREFIX/);
assert.match(generator, /(?:pipelineActions\.)?setLogs\(projectLogs \|\| \[\]\)/);
assert.doesNotMatch(generator, /if \(!_\.isEmpty\(projectLogs\)\) \{\s*pipelineActions\.setLogs/);
assert.match(pipeline, /const resetDerivedPresentation = !config\.resumeMode \|\| startsDifferentContent/);
assert.match(pipeline, /if \(resetDerivedPresentation\) setActiveCreatedProject\(null\)/);
assert.match(pipeline, /seo: invalidationState\.regenerateSeo \? undefined : existingTargetProj\.seo/);

console.log("New-project log isolation assertions passed.");
