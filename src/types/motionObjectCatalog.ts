// A thing the standard figure kit can draw, by the FIG call that draws it.
export type MotionCatalogFn = "vehicle" | "building" | "animal" | "tree" | "prop" | "wall" | "bridge";

// One way the thing is drawn: for the years from..to (inclusive, negative = BC) or when the scene builds it of one of
// builds; kit is [kit function, kit kind] (a bridge's kind is its build).
export type MotionCatalogVariant = { from?: number; to?: number; builds?: string[]; kit: [string, string] };

export type MotionCatalogEntry = {
  id: string;
  fn: MotionCatalogFn;
  // Other words for exactly the same thing (never for something only like it).
  names: string[];
  // The years the thing existed in; outside them the scene's own drawing shows it.
  from?: number;
  to?: number;
  // What it can be built of (FIG option build).
  builds?: string[];
  // How the drawing fills the scene's box: stretch (the default: exactly the box, its length following the box), elastic
  // (a thing with round parts, a vehicle: its length follows the box only within a small stretch so wheels stay round,
  // then it keeps that shape, as large as fits and centred) or rigid (a thing whose shape must not change, an animal, a
  // barrel: as large as fits the box, centred, never stretched).
  // ground: a flat thing lying on the ground (a crater, a stretcher): stretched like stretch, never stood up as a long
  // thing when its box is taller than wide.
  fit?: "stretch" | "elastic" | "rigid" | "ground";
  variants: MotionCatalogVariant[];
};

// What the figure runtime receives: each FIG function's words (ids and names, lower case without separators) to the
// index of their entry.
export type MotionCatalogRuntime = { entries: Omit<MotionCatalogEntry, "names">[]; words: Record<string, Record<string, number>> };
