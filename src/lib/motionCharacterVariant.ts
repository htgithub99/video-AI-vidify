import { MOTION_CHARACTER_ROLES, type MotionCharacterRole } from "../constants/motionSceneCatalog.js";
const ROLES = Object.keys(MOTION_CHARACTER_ROLES) as MotionCharacterRole[];
const HEX = /^#[0-9a-f]{6}$/i;
export const cleanCharacterColors = (value: unknown): Partial<Record<MotionCharacterRole, string>> | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const entries = ROLES.flatMap((role) => {
    const hex = (value as Record<string, unknown>)[role];
    return typeof hex === "string" && HEX.test(hex.trim()) ? [[role, hex.trim().toLowerCase()]] : [];
  });
  return entries.length ? Object.fromEntries(entries) : undefined;
};