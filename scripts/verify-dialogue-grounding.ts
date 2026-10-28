import assert from "node:assert/strict";
import { getVisualShotPlanIssues } from "../src/services/visualPlanningService.ts";
const baseScene: any = { id: "sc_21", script: "Những khoản nợ khiến Linh không thể thanh toán tiền thuê nhà.", subtitle: "Những khoản nợ khiến Linh không thể thanh toán tiền thuê nhà." };
const invalidIssues = getVisualShotPlanIssues({ visualIntent: "Linh đang chịu áp lực tài chính.", visibleAction: baseScene.script, reaction: "Linh buồn.", composition: "" }, baseScene);
assert.ok(invalidIssues.some((issue) => issue.includes("must_be_english")));
assert.ok(invalidIssues.some((issue) => issue.includes("copied_from_script")));
assert.ok(invalidIssues.some((issue) => issue.includes("composition:missing")));
const validIssues = getVisualShotPlanIssues(
  {
    visualIntent: "Viewers understand that Linh cannot cover her rent after accumulating debt.",
    visibleAction: "Linh sits at a small table, counts her remaining coins, then places them beside an overdue rent envelope.",
    reaction: "Her shoulders tense and her worried eyes remain fixed on the insufficient money.",
    storyEvidence: "A nearly empty coin pile sits beside a sealed overdue rent envelope.",
    visualHook: "The tiny coin pile occupies the foreground while the much larger rent envelope looms behind it.",
    composition: "Medium side composition keeping Linh, the coins, and the rent envelope in one readable frame.",
  },
  baseScene,
);
assert.deepEqual(validIssues, []);
process.stdout.write("Dialogue-grounded visual planning assertions passed.\n");
