import assert from "node:assert/strict";
import { calculateStoryboardScriptCoverage } from "../src/services/storyboardQualityService.ts";

const script = "Minh bước vào căn phòng tối. Anh đặt chiếc chìa khóa lên bàn. Cánh cửa phía sau bất ngờ khép lại.";
const completeScenes = [{ script: "Minh bước vào căn phòng tối." }, { script: "Anh đặt chiếc chìa khóa lên bàn." }, { script: "Cánh cửa phía sau bất ngờ khép lại." }];
assert.equal(calculateStoryboardScriptCoverage(script, completeScenes), 1);
assert.ok(calculateStoryboardScriptCoverage(script, completeScenes.slice(0, 1)) < 1);

process.stdout.write("Strict storyboard coverage assertions passed.\n");
