export type MotionCatalogFn = "vehicle" | "building" | "animal" | "tree" | "prop" | "wall" | "bridge";
export type MotionCatalogVariant = { from?: number; to?: number; builds?: string[]; kit: [string, string] };
export type MotionCatalogEntry = { id: string; fn: MotionCatalogFn; names: string[]; from?: number; to?: number; builds?: string[]; fit?: "stretch" | "elastic" | "rigid" | "ground"; variants: MotionCatalogVariant[] };
export type MotionCatalogRuntime = { entries: Omit<MotionCatalogEntry, "names">[]; words: Record<string, Record<string, number>> };
