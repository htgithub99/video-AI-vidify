export const MOTION_STAGE_CONSTRAINTS = {
  VERSION: 1,
  BUILDING_SLOTS: ["far_left", "far_center", "far_right"],
  AREAS: { courtyard: ["courtyard", "yard"], living: ["room", "living_room"], bedroom: ["room", "bedroom"], porch: ["porch", "veranda"], path: ["path", "road"], field: ["field"] } as Record<string, string[]>,
  ANCHOR_MISSING: (actor: string, anchor: string): string => `${actor}: chưa có vị trí hợp lệ tại ${anchor}`,
  SUPPORT_CONFLICT: "mount identifies the physical support; placement.anchor identifies a nearby fixture. A floor object cannot use a table as its supporting surface. Preserve the actual support and source evidence.",
  PROMPT:
    "Keep physical support separate from proximity: mount=floor uses floor/ground support or omits support; a nearby table/door/gate belongs in placement.anchor. mount=table requires a real supporting surface or a supported parent object. Never use support=table to express beside a table. Area anchors such as courtyard/room refer to the actual location floor; concrete fixtures such as gate/door/table must exist in the selected library composition.",
  ASSEMBLY_LOG: (place: string, requirements: string[]): string => `Kiểm bố cục ${place}: ${requirements.join("; ")}`,
  REPLAN_LOG: (place: string): string => `Bố cục cũ của ${place} chưa đủ vị trí; đang chọn hoặc ghép lại từ cùng gói.`,
} as const;
