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
for (const extra of ["</g>", "</g></g>", "\n</g>\n</g>\n"]) {
  const broken = svg.replace("</svg>", extra + "</svg>");
  const fixed = closeMotionSvgTags(broken);
  assert.equal(fixed.replace(/>\s+</g, "><"), svg);
  assert.equal(closeMotionSvgTags(fixed), fixed);
  normalizeMotionVector(fixed, "scene", "input", "trailing orphan groups", true);
}
for (const broken of [svg.replace("</svg>", "</path></svg>"), svg.replace('<g id="person">', '</g><g id="person">'), svg.replace("</svg>", "</g>".repeat(33) + "</svg>")]) assert.equal(closeMotionSvgTags(broken), broken, "Ambiguous markup and excessive repairs must remain rejected");
const patterned = svg.replace('<g id="room">', '<defs><pattern id="tiles" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0L8 8" stroke="#303030"/></pattern></defs><g id="room">').replace('fill="#202327"', 'fill="url(#tiles)"');
assert.equal(normalizeMotionVector(patterned, "scene", "input", "local pattern", true).svg.includes('<pattern id="tiles"'), true);
const assertSafeOrRejected = (input: string) => {
  let safe: string;
  try {
    safe = normalizeMotionVector(input, "scene", "input", "unsafe markup", true).svg;
  } catch {
    return;
  }
  assert.doesNotMatch(safe, /<script\b|<image\b|\bonload\s*=|url\(https?:|\bhref\s*=/i);
  assert.ok(safe.includes('id="person"'), "Sanitization must preserve the existing drawing");
};
for (const injected of ['<image href="https://example.com/tile.png"/>', "<script>alert(1)</script>", '<rect onload="alert(1)"/>', '<rect fill="url(https://example.com/tile.svg)"/>']) assertSafeOrRejected(patterned.replace("</pattern>", injected + "</pattern>"));
for (const broken of [svg.replace(/<\/g><\/svg>$/, "</svg>"), svg.replace(/<\/g><\/svg>$/, ""), svg.replace("/><\/g></svg>", "></g></svg>")]) {
  const fixed = normalizeMotionVector(broken, "scene", "input", "local repair", true);
  assert.ok(fixed.svg.includes('id="person"'));
  assert.ok(fixed.svg.includes('fill="#202327"'));
  assert.ok(fixed.svg.endsWith("</svg>"));
  assert.equal(closeMotionSvgTags(fixed.svg), fixed.svg, "Repair is idempotent");
}
assert.throws(() => normalizeMotionVector(svg.replace(/<\/g><\/svg>$/, "</svg>"), "asset", "input", "library"));
for (const broken of [svg.replace('d="M0 0L40 0L40 200Z"/>', 'd="M0 0'), svg.replace("</svg>", '<g id="broken>'), svg.replace("</svg>", '<defs><linearGradient id="broken"><stop offset="0"/>')]) assert.throws(() => normalizeMotionVector(broken, "bad", "bad", "unsafe or incomplete", true));
for (const extra of ['<script onload="alert(1)">', '<image href="https://example.com/p.png">', '<g style="fill:url(https://example.com/p.svg)">']) assertSafeOrRejected(svg.replace("</svg>", extra));
assert.equal(parseRemotionAssetReply('{"svg":"unterminated'), undefined);
assert.equal(parseRemotionAssetReply('{"artifactType":"drawing","svg":"<svg><path d=\\"M0'), undefined);
process.stdout.write("Local recovery: terminal JSON quote, raw whitespace, escaped SVG, missing closing tags, identity, idempotence, truncated markup and security checks passed; no live AI.\n");
