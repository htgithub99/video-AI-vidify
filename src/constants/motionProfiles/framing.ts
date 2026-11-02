export const MOTION_SCENE_VIEWS = ["wide", "medium", "close", "detail", "establishing", "over_shoulder", "pov"] as const;
export type MotionSceneView = (typeof MOTION_SCENE_VIEWS)[number];
export const MOTION_SCENE_FORMATS = ["illustration", "diagram", "comparison", "map", "timeline", "process", "cutaway", "card"] as const;
export type MotionSceneFormat = (typeof MOTION_SCENE_FORMATS)[number];
export const SCENE_FRAMING: Record<MotionSceneView, string> = {
  wide: "FRAMING wide: the whole place with its people in the middle ground; a standing person is roughly a third of the frame height; foreground, middle and background all readable.",
  medium: "FRAMING medium: one to three people from about the waist or thigh up, the main person taking roughly half to two thirds of the frame height; the setting is simplified to what sits directly behind and beside them.",
  close: "FRAMING close: one person from the chest up, head and shoulders taking about forty percent of the frame height with clear space above the head; never cut through the chin or the top of the head; the face and head turn carry the emotion; background reduced to a few soft shapes or a plain tone from the place.",
  detail: "FRAMING detail: one object (or an object with the hands that hold it) centred and taking about forty percent of the frame with margin on every side; no full standing person; the surface it rests on and a hint of the place are enough.",
  establishing: "FRAMING establishing: no people; the architecture, terrain, water, sky and weather of the place are the subject, composed so the viewer knows where and when they are.",
  over_shoulder: "FRAMING over_shoulder: the back of one listener's head and shoulder large and soft at one side of the foreground, the person they face in the middle ground turned toward them.",
  pov: "FRAMING pov: seen through the protagonist's own eyes; their hands, tool or held object enter from the bottom edge, the scene they look at fills the rest; the protagonist's face is never drawn.",
};
export const SCENE_FRAMING_PLANNING = `VIEWS: ${MOTION_SCENE_VIEWS.join(" | ")}. wide for a whole place or crowd; medium for one to three people interacting; close for one face carrying the emotion; detail for an object or hands; establishing for a place without people; over_shoulder for a listener and a speaker; pov for what the protagonist sees from their own body. Use the beat's shot as the requested view; one picture may still cover consecutive beats that share the same view and subject.`;
export const SCENE_DEVICES: Record<Exclude<MotionSceneFormat, "illustration">, string> = {
  diagram: "DEVICE diagram: a clear schematic of the idea with few labelled parts and a plain reading order; no room, floor or incidental people.",
  comparison: "DEVICE comparison: the recurring weighing device (a scale, a ledger, stamps, a scoreboard) with the compared candidates or cards placed on or beside it; labels are the exact supplied text.",
  map: "DEVICE map: a simplified map of the named region with the few places that matter marked and the movement drawn as a route; no people unless a small marker figure is requested.",
  timeline: "DEVICE timeline: a horizontal line or ribbon with the named years or eras as markers and the current one highlighted; short exact labels only.",
  process: "DEVICE process: the steps as a left-to-right sequence of small panels or arrows, each step one readable action.",
  cutaway: "DEVICE cutaway: the structure opened to show its inside parts in place, outer shell faded.",
  card: "DEVICE card: a single title, year or quote panel in the profile's materials, with the exact supplied text and at most one small motif drawing.",
};
