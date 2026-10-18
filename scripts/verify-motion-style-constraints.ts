import { MOTION_STYLE_VERIFICATION_TEXTS as ST, MOTION_STYLE_VERIFICATION_FORMATS as SF } from "./motionStyleVerificationTexts.ts";
import assert from "node:assert/strict";
import { motionStyleConstraints } from "../src/lib/motionStyleConstraints.ts";
import { MOTION_STYLE_PRESETS, motionPresetReferenceStyle } from "../src/constants/motionStylePresets.ts";
import { readMotionStyleFixture as kit } from "./helpers/motionStyleFixture.ts";
const mask = motionStyleConstraints(kit(ST.MASK_FLAT), ST.VALUE_2D);
assert.deepEqual([...mask.absent].sort(), [ST.BROWS, ST.EARS, ST.HAIR, ST.HANDS, ST.NOSE].sort(), ST.MASK_FIGURES_PARTS_THE_KIT_SAYS_NONE);
assert.deepEqual(mask.hidden, [ST.LEGS], ST.MASK_FIGURES_LEGS_EXIST_BUT_ARE_NEVER_SHOWN);
assert.equal(mask.sharedFigure, true);
assert.deepEqual(mask.variation, [ST.COLOUR], ST.IDENTICAL_FIGURES_DIFFER_ONLY_BY_COLOUR);
assert.equal(mask.faceFill, ST.EEF3F6);
assert.deepEqual(mask.shading, { kind: ST.FLAT, tones: 1 });
assert.equal(mask.outline.weight, ST.THICK);
assert.ok((mask.outline.width || 0) >= 0.028, ST.A_THICK_OUTLINE_DESCRIPTION_RAISES_THE_WIDTH);
assert.ok(mask.fx.forbidden.includes(ST.FOG) && mask.fx.forbidden.includes(ST.RAIN) && mask.fx.forbidden.includes(ST.GLOW));
assert.equal(mask.night, ST.TINT);
assert.equal(mask.perspective, ST.FRONT);
assert.equal(mask.detail, ST.LOW);
assert.equal(mask.framing, ST.HEADS_TOP_HALF, ST.KIT_CAMERA_NOTES_HEADS_FILL_THE_TOP_HALF_BECOME_A_FRAMING_HINT);
const cel = motionStyleConstraints(kit(ST.CEL_FAMILY), ST.VALUE_2D);
assert.deepEqual(cel.absent, [], ST.THE_CEL_FAMILY_DRAWS_HAIR_NOSE_EARS_HANDS_AND_LEGS);
assert.equal(cel.sharedFigure, false);
assert.ok(cel.variation.includes(ST.HAIR) && cel.variation.includes(ST.CLOTHING) && cel.variation.includes(ST.HEIGHT));
assert.deepEqual(cel.shading, { kind: ST.CEL, tones: 2 }, ST.TWO_TONE_CEL_KEEPS_FACE_SHADING);
assert.ok(cel.fx.allowed.includes(ST.FOG) && cel.fx.allowed.includes(ST.GLOW));
assert.equal(cel.night, ST.LIGHTS);
assert.equal(cel.framing, undefined);
const brief = motionStyleConstraints(kit(ST.CEL_FAMILY_BRIEF), ST.VALUE_2D);
assert.equal(brief.sharedFigure, false);
assert.equal(brief.shading.kind, ST.CEL);
const peg = motionStyleConstraints(kit(ST.PEG_DOLL), ST.VALUE_2D);
assert.ok(
  [ST.ARMS, ST.HANDS, ST.LEGS, ST.NOSE].every((part) => peg.absent.includes(part as never)),
  ST.PEG_DOLLS_HAVE_NO_LIMBS_AND_NO_NOSE,
);
assert.equal(peg.sharedFigure, false, ST.SHARING_SKIN_COLOUR_IS_NOT_SHARING_ONE_FIGURE);
assert.ok(peg.variation.includes(ST.HAIR) && peg.variation.includes(ST.CLOTHING));
assert.ok(peg.fx.forbidden.includes(ST.SHADOWS));
assert.deepEqual(peg.shading, { kind: ST.FLAT, tones: 1 });
assert.equal(motionStyleConstraints(undefined).present, false, ST.NO_KIT_NO_CONSTRAINTS);
assert.equal(motionStyleConstraints({ ...kit(ST.CEL_FAMILY), kit: { ...kit(ST.CEL_FAMILY).kit, render: { mode: ST.CEL, shadingTones: ST.VALUE_1 } } }, ST.VALUE_2D).shading.kind, ST.FLAT, ST.ONE_TONE_CEL_IN_2D_IS_FLAT);
for (const preset of MOTION_STYLE_PRESETS) {
  const constraints = motionStyleConstraints(motionPresetReferenceStyle(preset), preset.mode);
  assert.equal(constraints.present, true, preset.id);
  assert.ok(constraints.variation.length >= 1, SF.CONTEXT(preset.id, ST.ALWAYS_AT_LEAST_ONE_WAY_TO_TELL_CHARACTERS_APART));
  assert.ok(!constraints.absent.includes(ST.EYES), SF.CONTEXT(preset.id, ST.NONE_OR_DOTS_STYLE_OPTIONS_ARE_NOT_TREATED_AS_ABSENT));
}
const blueprint = motionStyleConstraints(motionPresetReferenceStyle(MOTION_STYLE_PRESETS.find((item) => item.id === ST.BLUEPRINT)!), ST.VALUE_2D);
assert.ok(blueprint.absent.includes(ST.MOUTH), ST.A_PRESET_THAT_DRAWS_NO_MOUTH_KEEPS_THAT_CONSTRAINT);
process.stdout.write(ST.STYLE_CONSTRAINTS_PASSED_ABSENT_HIDDEN_PARTS_SHARED_FIGURES_VARIATION_AXES + ST.EMPTY);
