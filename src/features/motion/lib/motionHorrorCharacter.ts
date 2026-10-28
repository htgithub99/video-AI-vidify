import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { MOTION_HORROR_CHARACTER as H } from "../constants/motionHorrorCharacter.js";
import { MOTION_REMOTION_LAYOUT as L } from "../../../constants/motionRemotionLayout.js";
import { MOTION_REMOTION_STAGING as S } from "../../../constants/motionRemotionStaging.js";
import { normalizeMotionVector } from "../../../lib/motionVectorAsset.js";
import type { MotionVectorAsset } from "../../../types/motionVisual.js";
export type HorrorCharacterIdentity = { name?: string; gender?: string; age?: string; look?: string; description?: string; role?: string };
type Character = HorrorCharacterIdentity;
export const horrorCharacterSupported = (member?: Character): boolean => !!member && ([RT_SHARED.MALE, RT_SHARED.FEMALE] as string[]).includes(member.gender || "") && H.SIMPLE_CLOTHES.test(member.look || "") && !H.SPECIAL_CLOTHES.test(member.look || "") && !H.NON_HUMAN.test([member.look, member.description, member.role].join(RT_SHARED.SYMBOL_36A9E7));
export const horrorCharacterAsset = (key: string, inputKey: string, member: Character, pose: string = RT_SHARED.STANDING): MotionVectorAsset => {
  const identity = [member.look, member.description, member.role].join(RT_SHARED.SYMBOL_36A9E7);
  const ghost = H.GHOST.test(identity),
    female = member.gender === RT_SHARED.FEMALE,
    child = member.age === RT_SHARED.CHILD,
    elder = member.age === RT_SHARED.SENIOR;
  const seated = H.SEATED.test(pose),
    lying = H.LYING.test(pose),
    back = H.BACK.test(pose),
    sleep = H.SLEEP.test(pose),
    fear = H.FEAR.test(pose);
  const c = H.COLORS,
    skin = ghost ? c.ghost : c.skin,
    hair = elder && !ghost ? c.grayHair : c.hair;
  const clothing = member.look?.split(/[,;]/).find((clause) => H.SIMPLE_CLOTHES.test(clause)) || "";
  const namedColor = Object.entries(H.NAMED_COLORS).find(([name]) => new RegExp(`${RT_SHARED.B}${name}${RT_SHARED.B}`, RT_SHARED.I).test(clothing))?.[1];
  const shirt = H.WHITE.test(identity) ? c.white : member.look?.match(H.CLOTHES_COLOR)?.[1] || namedColor || (female ? c.blouse : c.shirt);
  const face = back
    ? `${RT_MOTION.PATH_D_M83_44Q87_10_124_14Q162_14_166_48L160}${hair}${RT_MOTION.SYMBOL_5AB2E3}`
    : `${RT_MOTION.PATH_D_M86_46Q84_18_120_17Q158_15_164_47L158}${skin}${RT_MOTION.SYMBOL_EEF42C}${ghost ? `${RT_MOTION.PATH_D_M99_62Q111_49_120_64L117_80Q106_86_100}${c.ink}${RT_MOTION.PATH_D_M105_83L109_95M145_84L144_97_FILL_NONE_OPACITY}` : sleep ? RT_MOTION.PATH_D_M99_69Q108_75_118_69M137_69Q145_75_154 : `${RT_MOTION.G_ID_HORROR_EYES_PATH_D_M98_65Q107_58_119}${c.eyes}${RT_MOTION.ELLIPSE_CX}${fear ? 110 : 113}${RT_MOTION.CY_70_RX}${fear ? 3 : 4}${RT_MOTION.RY_5_FILL}${c.ink}${RT_MOTION.ELLIPSE_CX_147_CY_70_RX}${fear ? 3 : 4}${RT_MOTION.RY_5_FILL}${c.ink}${RT_MOTION.G_G_ID_HORROR_LIDS_OPACITY_0_PATH_D_M99}${fear ? 49 : 55}${RT_MOTION.L119_57M135_57L155}${fear ? 49 : 54}${RT_MOTION.FILL_NONE}`}${RT_MOTION.PATH_D_M128_68L124_87L132_89M118_102Q127}${fear ? 97 : 99}${RT_MOTION.VALUE_136_102_FILL_NONE}${elder ? RT_MOTION.PATH_D_M98_87L113_88M140_88L153_86M105_95L110_101M145_95L140 : ""}${RT_MOTION.SYMBOL_4DC501}${female ? `${RT_MOTION.PATH_D_M85_52Q78_18_110_12Q142_3_164_36L164}${hair}${RT_MOTION.SYMBOL_5AB2E3}` : `${RT_MOTION.PATH_D_M84_51L86_29Q102_6_128_13Q153_9_165}${hair}${RT_MOTION.SYMBOL_5AB2E3}`}`;
  const torso = `${RT_MOTION.PATH_D_M108_112L107_126L91_132L76_147L80_234Q122_244_165}${shirt}${RT_MOTION.PATH_D_M107_127L124_140L140_127M124_141L125_230_FILL_NONE}`;
  const arms = seated ? `${RT_MOTION.PATH_D_M83_140Q67_151_69_179L86_211L108_209L92_174L98}${shirt}${RT_MOTION.PATH_D_M85_205Q96_201_107_208L107_217Q95_223_86}${skin}${RT_MOTION.SYMBOL_5AB2E3}` : `${RT_MOTION.PATH_D_M82_139Q65_151_68_182L73_228L87_226L85_179L97}${shirt}${RT_MOTION.PATH_D_M74_224Q70_234_76_243Q85_246_88_236L86}${skin}${RT_MOTION.SYMBOL_5AB2E3}`;
  const legs = seated
    ? `${RT_MOTION.PATH_D_M84_223Q104_216_123_228L94_250L93_287L76_288L72}${c.trousers}${RT_MOTION.PATH_D_M75_283L93_284L96_295L65_296L65_290ZM158_284L175_283L185}${c.ink}${RT_MOTION.SYMBOL_5AB2E3}`
    : `${RT_MOTION.PATH_D_M83_232Q124_241_163_231L157_359L136_360L129_269L122}${c.trousers}${RT_MOTION.PATH_D_M91_353L114_354L114_371L79_371L80_364ZM136_354L157_352L168}${c.ink}${RT_MOTION.PATH_D_M126_244L126_266M96_280L98_338M150_280L147_339_FILL}`;
  const bun = female ? `${RT_MOTION.PATH_D_M83_50Q57_52_64_75Q69_91_88_85}${hair}${RT_MOTION.SYMBOL_5AB2E3}` : "";
  const drawing = `${RT_MOTION.G_STROKE}${c.ink}${RT_MOTION.STROKE_WIDTH_2_4_STROKE_LINEJOIN_ROUND_STROKE_LINECAP_ROUND}${legs}${torso}${arms}${bun}${face}${RT_MOTION.G}`;
  const height = seated ? 310 : 385;
  const svg = `${RT_MOTION.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG_VIEWBOX_0}${lying ? height : 250}${RT_SHARED.SYMBOL_36A9E7}${lying ? 250 : height}${RT_MOTION.SYMBOL_AB2CD7}${lying ? `${RT_MOTION.G_TRANSFORM_TRANSLATE_0_250_ROTATE_90}${drawing}${RT_MOTION.G}` : child ? `${RT_MOTION.G_TRANSFORM_TRANSLATE_7_0_SCALE_1_05_1}${drawing}${RT_MOTION.G}` : drawing}${RT_MOTION.SVG}`;
  const asset = normalizeMotionVector(svg, key, inputKey, member.look || member.name || "");
  const point = (x: number, y: number) => (lying ? { x: y / height, y: 1 - x / 250 } : { x: x / 250, y: y / height });
  return {
    ...asset,
    characterRevision: H.REVISION,
    characterScale: seated ? 310 / 385 : 1,
    layerRevision: L.REVISION,
    stagingRevision: S.REVISION,
    anchors: { base: point(125, seated ? 296 : 371), seat: point(125, 233), body: point(125, 200), grip: point(166, seated ? 211 : 235), inside: point(125, 180), surface: point(125, 143), emitter: point(125, 102), flame: point(125, 102), pivot: point(125, seated ? 233 : 371) },
    bounds: lying ? { x: 0.02, y: 0.23, width: 0.95, height: 0.53 } : { x: 0.23, y: 0.02, width: 0.53, height: seated ? 0.94 : 0.95 },
  };
};
export const horrorCharacterFrame = (asset: MotionVectorAsset, seconds: number, enabled: boolean, identity: string): string => {
  if (!enabled || !asset.svg.includes(RT_MOTION.ID_HORROR_EYES)) return asset.svg;
  const seed = Array.from(identity).reduce((hash, c) => (hash * 31 + c.charCodeAt(0)) >>> 0, 0);
  const phase = (Math.max(0, seconds) + (seed % 997) / 173) % H.BLINK.PERIOD;
  return phase < H.BLINK.SECONDS ? asset.svg.replace(RT_MOTION.ID_HORROR_EYES, RT_MOTION.ID_HORROR_EYES_OPACITY_0).replace(RT_MOTION.ID_HORROR_LIDS_OPACITY_0, RT_MOTION.ID_HORROR_LIDS_OPACITY_1) : asset.svg;
};
