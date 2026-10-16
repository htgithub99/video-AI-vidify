import { STUDIO_RUNTIME as XRT } from "../constants/studioRuntime.js";
import * as SRT from "../constants/sourceText.js";
import { MOTION_CHARACTER_FACE_PARTS as FACE, MOTION_CHARACTER_OPTIONAL_PREFIX, MOTION_CHARACTER_PALETTE, MOTION_CHARACTER_ROLES, MOTION_CHARACTER_SENIOR_HAIR, MOTION_CHARACTER_SKIP, MOTION_CHARACTER_VARIANT as V, motionSceneType, type MotionCharacterRole } from "../constants/motionSceneCatalog.js";
export interface MotionCharacterVariant { index: number; colors?: Partial<Record<MotionCharacterRole, string>>; }
const ROLES = Object.keys(MOTION_CHARACTER_ROLES) as MotionCharacterRole[];
const HEX = /^#[0-9a-f]{6}$/i;
const roleOf = (label: unknown): MotionCharacterRole | null => {
  const text = String(label || XRT.EMPTY).toLowerCase();
  if (!text || MOTION_CHARACTER_SKIP.some((word) => text.includes(word))) return null;
  return ROLES.find((role) => MOTION_CHARACTER_ROLES[role].some((word) => text.includes(word))) || null;
};
const pick = <T>(list: readonly T[], index: number, offset: number): T => list[(index - 1 + offset) % list.length];
export const cleanCharacterColors = (value: unknown): Partial<Record<MotionCharacterRole, string>> | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const entries = ROLES.flatMap((role) => {
    const hex = (value as Record<string, unknown>)[role];
    return typeof hex === "string" && HEX.test(hex.trim()) ? [[role, hex.trim().toLowerCase()]] : [];
  });
  return entries.length ? Object.fromEntries(entries) : undefined;
};
const chooseColors = (type: string | undefined, variant: MotionCharacterVariant): { hex: Partial<Record<MotionCharacterRole, string>>; names: string[] } => {
  const def = motionSceneType(type);
  if (def?.uniform) return { hex: {}, names: [] };
  const hex: Partial<Record<MotionCharacterRole, string>> = { ...(variant.colors || {}) };
  const names: string[] = Object.entries(variant.colors || {}).map(([role, value]) => V.COLOUR(role, value as string));
  const recolour = variant.index > 0 && !def?.animal && !String(type || XRT.EMPTY).startsWith(SRT.SOURCE_TEXT_GHOST) && type !== XRT.MONSTER;
  if (!recolour) return { hex, names };
  ROLES.forEach((role, offset) => {
    if (hex[role]) return;
    const palette = role === SRT.SOURCE_TEXT_HAIR && def?.senior ? MOTION_CHARACTER_SENIOR_HAIR : MOTION_CHARACTER_PALETTE[role];
    const choice = pick(palette, variant.index, offset);
    hex[role] = choice.hex;
    names.push(V.COLOUR(role, choice.en));
  });
  return { hex, names };
};
const scaleOf = (value: unknown): number[] => (Array.isArray(value) && value.length === 3 ? value.map(Number) : [1, 1, 1]);
export const applyCharacterVariant = (source: any, type: string | undefined, variant: MotionCharacterVariant): { design: any; look: string } => {
  const design = JSON.parse(JSON.stringify(source || {}));
  const index = Math.max(0, Math.floor(variant.index || 0));
  const { hex, names } = chooseColors(type, { ...variant, index });
  const materials: Record<string, any> = design.materials || {};
  const recoloured = new Set<string>();
  const paint = (node: any, label: string) => {
    if (!node || typeof node !== "object") return;
    const matName = typeof node.mat === "string" ? node.mat : XRT.EMPTY;
    const role = roleOf(node.name) || roleOf(matName) || roleOf(label);
    const colour = role ? hex[role] : undefined;
    if (colour) {
      if (node.mat && typeof node.mat === "object") node.mat = { ...node.mat, color: colour };
      else if (matName && materials[matName] && !recoloured.has(matName)) {
        materials[matName] = { ...materials[matName], color: colour };
        recoloured.add(matName);
      }
    }
    (Array.isArray(node.children) ? node.children : []).forEach((child: any) => paint(child, label));
    if (node.node) paint(node.node, label);
  };
  const parts: any[] = Array.isArray(design.parts) ? design.parts : [];
  const optional = parts.filter((part) => String(part.id || XRT.EMPTY).startsWith(MOTION_CHARACTER_OPTIONAL_PREFIX));
  const slot = index % V.HEIGHT.length;
  parts.forEach((part) => {
    const id = String(part.id || XRT.EMPTY).toLowerCase();
    (Array.isArray(part.nodes) ? part.nodes : []).forEach((node: any) => paint(node, id));
    if (index > 0 && optional.length && optional.includes(part)) part.visible = optional.indexOf(part) === (index - 1) % (optional.length + 1);
    if (index > 0 && !part.parent) {
      const s = scaleOf(part.scale);
      part.scale = [s[0] * V.WIDTH[slot], s[1] * V.HEIGHT[slot], s[2] * V.WIDTH[slot]];
      if (Array.isArray(part.pos)) part.pos = [part.pos[0] * V.WIDTH[slot], part.pos[1] * V.HEIGHT[slot], part.pos[2] * V.WIDTH[slot]];
    }
    if (index > 0 && FACE.brow.some((word) => id.includes(word))) {
      const r = Array.isArray(part.rot) ? part.rot.map(Number) : [0, 0, 0];
      part.rot = [r[0] || 0, r[1] || 0, (r[2] || 0) + V.BROW_ROT[slot]];
    }
    if (index > 0 && FACE.mouth.some((word) => id.includes(word))) {
      const s = scaleOf(part.scale);
      part.scale = [s[0] * V.MOUTH_SCALE[slot], s[1], s[2]];
    }
    if (index > 0 && FACE.eye.some((word) => id.includes(word)) && !FACE.brow.some((word) => id.includes(word))) {
      const s = scaleOf(part.scale);
      part.scale = [s[0] * V.EYE_SCALE[slot], s[1] * V.EYE_SCALE[slot], s[2]];
    }
  });
  if (Object.keys(materials).length) design.materials = materials;
  return { design, look: names.length ? V.LOOK(names.join(V.JOIN)) : XRT.EMPTY };
};
export const characterVariantLook = (type: string | undefined, variant: MotionCharacterVariant): string => {
  const { names } = chooseColors(type, { ...variant, index: Math.max(0, Math.floor(variant.index || 0)) });
  return names.length ? V.LOOK(names.join(V.JOIN)) : XRT.EMPTY;
};
