import assert from "node:assert/strict";
import { detectVietnameseNarrationStyleWarnings, isSatiricalVideoGenre } from "../src/services/scriptQualityService.ts";
import { getFinalScriptEditorialPrompt } from "../src/constants/prompts.ts";
import { VideoGenre } from "../src/constants/enums.ts";

const grounded = "Hạnh đặt tờ hóa đơn xuống quầy. Con số mới cao hơn hôm qua hai trăm nghìn. Cô kéo ghế ngồi, mở điện thoại và gọi cho mẹ. Đến lúc ấy, tiền phòng không còn là chuyện cuối tháng nữa; nó quyết định cô có về quê hay không.";
assert.deepEqual(detectVietnameseNarrationStyleWarnings(grounded), []);

const synthetic = "Mọi chuyện chưa dừng lại ở đó. Một sợi dây vô hình siết lại. Hắn là con tốt thí. Sự thật phơi bày, và sợi dây vô hình lại xuất hiện.";
assert.ok(detectVietnameseNarrationStyleWarnings(synthetic).includes("script_ai_prose_empty_transition"));
assert.ok(detectVietnameseNarrationStyleWarnings(synthetic).includes("script_trailer_metaphor_overused"));

assert.equal(isSatiricalVideoGenre(VideoGenre.SATIRICAL_LIFE_AUTO), true);
assert.equal(isSatiricalVideoGenre("Education"), false);

const editorialPrompt = getFinalScriptEditorialPrompt(grounded, VideoGenre.SATIRICAL_LIFE_AUTO, true, 120);
assert.match(editorialPrompt, /concrete event -> scene-specific visible or audible evidence -> human reaction/i);
assert.match(editorialPrompt, /hook -> 2-3 setup turns -> 3-4 escalation turns -> reveal -> choice\/payoff/i);

console.log("Narration style regression assertions passed.");
