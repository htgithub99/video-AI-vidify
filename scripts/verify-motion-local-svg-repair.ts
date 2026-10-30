import assert from "node:assert/strict";
import { closeMotionSvgTags, normalizeMotionVector, parseRemotionAssetReply } from "../src/lib/motionVectorAsset.js";
import { chatResponseIdentity } from "../src/server/services/chatResponseIdentity.js";
import { extractJson } from "../src/features/motion/server/services/motionStoryService.js";
const svg = '<svg viewBox="0 0 1280 720"><g id="room"><rect width="1280" height="720" fill="#202327"/></g><g id="person"><path d="M0 0L40 0L40 200Z"/></g></svg>';
const reply = { artifactType: "motion_remotion_composition", requestId: "current-scene", layers: [], animations: [], svg };
const valid = JSON.stringify(reply);
const missingQuote = valid.replace(/"\}$/, "\n}");
for (const raw of [valid, missingQuote, missingQuote.replaceAll("<", "\\u003c"), "```json\n" + missingQuote + "\n```"]) {
  assert.deepEqual(parseRemotionAssetReply(raw), reply);
  assert.deepEqual(extractJson(raw), reply);
  assert.deepEqual(chatResponseIdentity(raw), { artifactType: reply.artifactType, requestId: reply.requestId });
}
const multiline = { ...reply, svg: svg.replace("<g", "\n<g") };
assert.deepEqual(parseRemotionAssetReply(JSON.stringify(multiline).replace("\\n", "\n")), multiline);
assert.deepEqual(chatResponseIdentity('{"nested":{"requestId":"wrong"},"artifactType":"drawing","requestId":"right","svg":"broken'), { artifactType: "drawing", requestId: "right" });
assert.equal(closeMotionSvgTags(svg), svg);
for (const broken of [svg.replace(/<\/g><\/svg>$/, "</svg>"), svg.replace(/<\/g><\/svg>$/, ""), svg.replace("/><\/g></svg>", "></g></svg>")]) {
  const fixed = normalizeMotionVector(broken, "scene", "input", "local repair", true);
  assert.ok(fixed.svg.includes('id="person"'));
  assert.ok(fixed.svg.includes('fill="#202327"'));
  assert.ok(fixed.svg.endsWith("</svg>"));
  assert.equal(closeMotionSvgTags(fixed.svg), fixed.svg, "Repair is idempotent");
}
assert.throws(() => normalizeMotionVector(svg.replace(/<\/g><\/svg>$/, "</svg>"), "asset", "input", "library"));
for (const broken of [
  svg.replace("</svg>", "</unknown></svg>"),
  svg.replace('d="M0 0L40 0L40 200Z"/>', 'd="M0 0'),
  svg.replace("</svg>", '<script onload="alert(1)">'),
  svg.replace("</svg>", '<image href="https://example.com/p.png">'),
  svg.replace("</svg>", '<g style="fill:url(https://example.com/p.svg)">'),
  svg.replace("</svg>", '<g id="broken>'),
  svg.replace("</svg>", '<defs><linearGradient id="broken"><stop offset="0"/>'),
])
  assert.throws(() => normalizeMotionVector(broken, "bad", "bad", "unsafe or incomplete", true));
assert.equal(parseRemotionAssetReply('{"svg":"unterminated'), undefined);
assert.equal(parseRemotionAssetReply('{"artifactType":"drawing","svg":"<svg><path d=\\"M0'), undefined);
console.log("Local recovery: terminal JSON quote, raw whitespace, escaped SVG, missing closing tags, identity, idempotence, truncated markup and security checks passed; no live AI.");
