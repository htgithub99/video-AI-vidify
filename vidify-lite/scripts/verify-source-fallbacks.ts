import assert from "node:assert/strict";
import { SEO_FALLBACK_CONFIG } from "../src/constants/config.ts";
import { createSourceGroundedSeo } from "../src/services/seoFallbackService.ts";

const script = "A mechanic finds an old photograph. He follows its clues through the city. The final address changes what he believes about his family.";
const seo = createSourceGroundedSeo(script, {
  numTitles: 3,
  numDescriptions: 1,
  numHashtags: 4,
  numTags: 5,
});

assert.equal(seo.titles.length, 3);
assert.equal(seo.descriptions.length, 1);
assert.equal(seo.hashtags.length, 4);
assert.equal(seo.tags.length, 5);
assert.equal(seo.titles.every(title => title.seoScore === SEO_FALLBACK_CONFIG.UNKNOWN_SCORE), true);
assert.equal(seo.titles.every(title => script.includes(title.text)), true);
assert.equal(seo.descriptions[0].text, script);

process.stdout.write("Source fallback assertions passed.\n");
