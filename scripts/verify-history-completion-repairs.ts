import assert from "node:assert/strict";
import fs from "node:fs";
import { compileImagePrompt } from "../src/services/imagePromptCompilerService.ts";
import { createScriptGroundedStoryboard } from "../src/services/storyboardFallbackService.ts";
import { evaluateSubtitles } from "../src/services/productionQualityService.ts";
import { SplitStrategy } from "../src/constants/enums.ts";

const scenes = createScriptGroundedStoryboard({
  rewrittenScript: "Đứng trước thử thách lớn của thời đại, triều đình buộc phải thay đổi. Nhà Trần sau đó bước vào giai đoạn suy yếu.",
  splitStrategy: SplitStrategy.MIXED_SENTENCES,
});
assert.ok(scenes.every(scene => /[.!?]$/.test(scene.script)), "Fallback emitted a dangling narration clause");

const staleCharacter = [{ id: "tran", name: "Trần Thủ Độ", description: "statesman", genderPresentation: "male" }] as any;
const prompt = compileImagePrompt({
  id: "late_dynasty", script: "Năm 1400, Hồ Quý Ly lập ra nhà Hồ.", characterIds: [],
  prompt: "Trần Thủ Độ in a court", visibleAction: "Hồ Quý Ly receives the imperial seal", textAllowed: false,
} as any, { characters: staleCharacter, targetStyle: "historical painterly reconstruction", aspectRatio: "16:9" });
assert.doesNotMatch(prompt, /the same recurring person in every scene/i);

const subtitleQa = evaluateSubtitles([{ id: "sc_1", script: "Một câu phụ đề rất dài cần thêm thời gian đọc.", subtitle: "Một câu phụ đề rất dài cần thêm thời gian đọc.", subtitleCues: [{ text: "Một câu phụ đề rất dài cần thêm thời gian đọc.", startOffsetSeconds: 0, durationSeconds: 0.5 }] }] as any);
assert.ok(subtitleQa.warnings.includes("subtitle_reading_time_insufficient"));
assert.ok(!subtitleQa.blockingErrors.includes("subtitle_reading_time_insufficient"));

const pipeline = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
assert.match(pipeline, /AI chưa trả đủ kế hoạch/);
console.log("History completion repair assertions passed.");
