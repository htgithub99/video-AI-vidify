import { MOTION_HORROR_CHARACTER as H } from "../constants/motionHorrorCharacter.js";
import { MOTION_REMOTION_LAYOUT as L } from "../constants/motionRemotionLayout.js";
import { MOTION_REMOTION_STAGING as S } from "../constants/motionRemotionStaging.js";
import { normalizeMotionVector } from "./motionVectorAsset.js";
import type { MotionVectorAsset } from "../types/motionVisual.js";
export type HorrorCharacterIdentity = { name?: string; gender?: string; age?: string; look?: string; description?: string; role?: string };
type Character = HorrorCharacterIdentity;
export const horrorCharacterSupported = (member?: Character): boolean => !!member && ["male", "female"].includes(member.gender || "") && H.SIMPLE_CLOTHES.test(member.look || "") && !H.SPECIAL_CLOTHES.test(member.look || "") && !H.NON_HUMAN.test([member.look, member.description, member.role].join(" "));
export const horrorCharacterAsset = (key: string, inputKey: string, member: Character, pose = "standing"): MotionVectorAsset => {
  const identity = [member.look, member.description, member.role].join(" ");
  const ghost = H.GHOST.test(identity),
    female = member.gender === "female",
    child = member.age === "child",
    elder = member.age === "senior";
  const seated = H.SEATED.test(pose),
    lying = H.LYING.test(pose),
    back = H.BACK.test(pose),
    sleep = H.SLEEP.test(pose),
    fear = H.FEAR.test(pose);
  const c = H.COLORS,
    skin = ghost ? c.ghost : c.skin,
    hair = elder && !ghost ? c.grayHair : c.hair;
  const clothing = member.look?.split(/[,;]/).find((clause) => H.SIMPLE_CLOTHES.test(clause)) || "";
  const namedColor = Object.entries(H.NAMED_COLORS).find(([name]) => new RegExp(`\\b${name}\\b`, "i").test(clothing))?.[1];
  const shirt = H.WHITE.test(identity) ? c.white : member.look?.match(H.CLOTHES_COLOR)?.[1] || namedColor || (female ? c.blouse : c.shirt);
  const face = back
    ? `<path d="M83 44Q87 10 124 14Q162 14 166 48L160 96Q126 119 88 93Z" fill="${hair}"/>`
    : `<path d="M86 46Q84 18 120 17Q158 15 164 47L158 91Q149 115 126 116Q99 115 88 91Z" fill="${skin}"/>
    ${ghost ? `<path d="M99 62Q111 49 120 64L117 80Q106 86 100 76ZM135 62Q147 51 154 67L150 80Q139 84 135 75Z" fill="${c.ink}"/><path d="M105 83L109 95M145 84L144 97" fill="none" opacity=".4"/>` : sleep ? `<path d="M99 69Q108 75 118 69M137 69Q145 75 154 68" fill="none"/>` : `<g id="horror-eyes"><path d="M98 65Q107 58 119 65Q120 79 109 81Q99 79 98 65ZM135 65Q144 59 154 66Q155 79 145 81Q135 79 135 65Z" fill="${c.eyes}"/><ellipse cx="${fear ? 110 : 113}" cy="70" rx="${fear ? 3 : 4}" ry="5" fill="${c.ink}"/><ellipse cx="147" cy="70" rx="${fear ? 3 : 4}" ry="5" fill="${c.ink}"/></g><g id="horror-lids" opacity="0"><path d="M99 71Q109 75 119 70M136 70Q146 75 154 70" fill="none"/></g><path d="M97 ${fear ? 49 : 55}L119 57M135 57L155 ${fear ? 49 : 54}" fill="none"/>`}
    <path d="M128 68L124 87L132 89M118 102Q127 ${fear ? 97 : 99} 136 102" fill="none"/>
    ${elder ? '<path d="M98 87L113 88M140 88L153 86M105 95L110 101M145 95L140 102" fill="none" opacity=".55"/>' : ""}
    ${female ? `<path d="M85 52Q78 18 110 12Q142 3 164 36L164 64Q152 38 137 30Q109 43 85 52Z" fill="${hair}"/>` : `<path d="M84 51L86 29Q102 6 128 13Q153 9 165 36L163 54L150 36L141 40L130 32L119 40L109 35L95 48Z" fill="${hair}"/>`}`;
  const torso = `<path d="M108 112L107 126L91 132L76 147L80 234Q122 244 165 232L170 147L150 132L140 126L140 113" fill="${shirt}"/><path d="M107 127L124 140L140 127M124 141L125 230" fill="none" opacity=".65"/>`;
  const arms = seated
    ? `<path d="M83 140Q67 151 69 179L86 211L108 209L92 174L98 145M160 140Q178 149 179 179L162 212L142 209L157 174L149 145" fill="${shirt}"/><path d="M85 205Q96 201 107 208L107 217Q95 223 86 215ZM142 207Q154 202 165 209L164 218Q152 224 142 217Z" fill="${skin}"/>`
    : `<path d="M82 139Q65 151 68 182L73 228L87 226L85 179L97 146M159 139Q176 152 175 183L170 228L156 226L158 178L148 146" fill="${shirt}"/><path d="M74 224Q70 234 76 243Q85 246 88 236L86 225ZM157 225Q153 235 159 244Q169 245 172 235L169 225Z" fill="${skin}"/>`;
  const legs = seated
    ? `<path d="M84 223Q104 216 123 228L94 250L93 287L76 288L72 246ZM124 228Q144 218 164 224L178 245L174 288L157 288L155 251Z" fill="${c.trousers}"/><path d="M75 283L93 284L96 295L65 296L65 290ZM158 284L175 283L185 291L183 296L156 295Z" fill="${c.ink}"/>`
    : `<path d="M83 232Q124 241 163 231L157 359L136 360L129 269L122 267L114 360L91 359Z" fill="${c.trousers}"/><path d="M91 353L114 354L114 371L79 371L80 364ZM136 354L157 352L168 365L166 371L136 371Z" fill="${c.ink}"/><path d="M126 244L126 266M96 280L98 338M150 280L147 339" fill="none" opacity=".45"/>`;
  const bun = female ? `<path d="M83 50Q57 52 64 75Q69 91 88 85" fill="${hair}"/>` : "";
  const drawing = `<g stroke="${c.ink}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">${legs}${torso}${arms}${bun}${face}</g>`;
  const height = seated ? 310 : 385;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lying ? height : 250} ${lying ? 250 : height}">${lying ? `<g transform="translate(0 250) rotate(-90)">${drawing}</g>` : child ? `<g transform="translate(-7 0) scale(1.05 1)">${drawing}</g>` : drawing}</svg>`;
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
  if (!enabled || !asset.svg.includes('id="horror-eyes"')) return asset.svg;
  const seed = Array.from(identity).reduce((hash, c) => (hash * 31 + c.charCodeAt(0)) >>> 0, 0);
  const phase = (Math.max(0, seconds) + (seed % 997) / 173) % H.BLINK.PERIOD;
  return phase < H.BLINK.SECONDS ? asset.svg.replace('id="horror-eyes"', 'id="horror-eyes" opacity="0"').replace('id="horror-lids" opacity="0"', 'id="horror-lids" opacity="1"') : asset.svg;
};
