import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateSubtitles } from "../src/services/productionQualityService.ts";

const subtitleQa = evaluateSubtitles([{ id: "sc_1", script: "Một câu phụ đề rất dài cần thêm thời gian đọc.", subtitle: "Một câu phụ đề rất dài cần thêm thời gian đọc.", subtitleCues: [{ text: "Một câu phụ đề rất dài cần thêm thời gian đọc.", startOffsetSeconds: 0, durationSeconds: 0.5 }] }] as any);
assert.ok(subtitleQa.warnings.includes("subtitle_reading_time_insufficient"));
assert.ok(!subtitleQa.blockingErrors.includes("subtitle_reading_time_insufficient"));

const pipeline = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
assert.match(pipeline, /AI chưa trả đủ kế hoạch/);
assert.doesNotMatch(pipeline, /createScriptGroundedStoryboard|ensureStoryboardScriptCoverage|compileImagePrompt/);
console.log("History completion repair assertions passed.");
