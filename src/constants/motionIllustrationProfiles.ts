import type { MotionRemotionProfile } from "../types/motionVisual.js";
export type MotionIllustrationStage = "planning" | "design" | "drawing" | "review";
export const MOTION_ILLUSTRATION_PROFILES: Record<MotionRemotionProfile, Record<MotionIllustrationStage, string> & { motion: string }> = {
  horror: {
    planning:
      "Tell the story through sparse atmospheric illustrations: establish the place, then frame the person or clue actually named. Keep the relevant visible people, objects and essential left/right/on/beside relationships. No diagram labels or arrows. A simple standing pose can represent incidental actions; preserve meaningful lying, confinement, revealed identity and explicit clothing color. Do not fill every shot with all cast members.",
    design:
      "Use a readable rural/interior or outdoor perspective appropriate to the actual place and era. Ground people and furniture on the same floor/terrain plane; one connected silhouette per person. Adults have natural elongated bodies, roughly five heads tall in this cartoon style. Night is dark but faces, white clothing and key clues remain readable. A lying body follows its actual bed/mat support, with the head turned and connected to the shoulders. Draw the construction of a requested oil lamp or coffin accurately only when that object is in the story.",
    drawing:
      "Hand-drawn Vietnamese folk horror: irregular charcoal contours, matte slate/gray-olive surfaces, muted dusty clothing, pale human faces. Use deliberate curved jaw, nose, eyelids, hair, sleeve and hand contours, not rectangles for torso/neck or dots for hands. Ghosts remain unsettling human figures with continuous hair and the stated clothing color, no cute skull eyes or smiling mascots. Keep restrained wood/earth details and a coherent floor edge. Learn the reference's craft without copying its funeral setting into unrelated scenes.",
    motion: "Prefer very subtle breathing, small head/eyelid changes and source-bound flame, rain, fog or smoke. Keep feet, seated hips and lying body contacts planted. No bouncing whole bodies or rhythmic full-scene pulsing. Narration alone never makes a character's mouth move. Quiet static poses are valid.",
    review:
      "Check the requested visible human/ghost identity, clothing colors, important clues, essential positions and readable night contrast. Reject a severely disconnected or flattened main body that no longer reads as the intended person/pose, or a floating subject that breaks an essential support relationship. Tiny folds, optional gestures, exact facial detail and decorative texture must not block a valid illustration.",
  },
  history: {
    planning:
      "Choose a narrative illustration, a source-supported map/timeline, an artifact detail, or a comparison according to what this passage explains. Do not force every passage into an indoor conversation. Establish era and place, then focus on the named person, group, location or object. Show only participants present at that event. Crowds can be readable grouped silhouettes with distinct key people; no need to draw every soldier or action.",
    design:
      "For narrative scenes use one shared ground/perspective and natural adult proportions; keep key faces, dress and artifacts readable. Use costume, buildings, materials and tools supported by the supplied era/region; do not invent factual regalia or national symbols. Maps/timelines may omit a floor and human scale, use clear hierarchy and only supplied locations/dates. Leave space for necessary labels rather than shrinking the illustration. Reference characters and furniture are examples of craft, not fixed historical identities or compulsory inventory.",
    drawing:
      "Editorial historical illustration with expressive three-quarter/profile faces, connected shoulders/arms/hands, natural long legs and shaped garments. Restrained warm parchment, earth and muted regional colors, dark ink contours and simple shadow planes. Distinguish people by supplied face, age, clothing and role. Draw recognizable construction of important tools, ships, buildings or weapons when requested, without arbitrary ornate detail. No default ghost, funeral room, modern prop, compulsory European/Asian costume or fixed protagonist.",
    motion:
      "Use calm breathing and slight cloth or environmental movement only when suitable. Do not simulate battles or complex walking if a strong static illustration conveys the event. Keep support contacts and key artifacts stable. For maps, subtle emphasis may guide attention to a supplied location or route; do not fabricate moving armies, routes or chronology. Speech motion requires actual direct dialogue.",
    review:
      "Check story-supported era/region, identity/count of key people, important artifact construction, event relationships and any supplied map location/date. Block invented contradictory factual labels, wrong essential symbols or unreadable main subjects. Do not block artistic simplification, omitted crowd members without individual roles, optional action poses or decorative costume detail not specified by the source.",
  },
  explainer: {
    planning:
      "Select the clearest format for this idea: process steps, cause/effect, comparison, mechanism/cutaway, map/timeline, or an illustrative real-world example. Keep each shot centered on one idea. Labels/arrows are useful only when they explain a relationship; each label is a short supplied term, never invented narration. Do not force a room, human actor or horror setting into abstract concepts. Keep the actual sequence and causal direction from the source.",
    design:
      "Use a structured readable diagram plane for abstract ideas: aligned steps, balanced comparison panels or a focused mechanism. Floor and perspective are optional; arrows and labels do not require physical supports. For real-world examples use coherent physical contacts and recognizable simplified people/objects. Diagram positions express hierarchy or causality rather than human size. Keep useful negative space, strong separation and readable labels inside safe margins. Avoid decorative inventory and overlapping labels.",
    drawing:
      "Clean educational flat vector illustration with muted blue/cream palette, clear contours, controlled accent color and legible silhouettes. Simple geometric symbols are valid for abstract concepts; people and physical objects must remain recognizable and connected. Use consistent short labels and uncluttered directional arrows at useful scale. Do not import a ghost, parchment battlefield or obligatory character. A cutaway may simplify internal parts while preserving the supplied mechanism and relationships.",
    motion:
      "Prefer slow emphasis of the relevant element, gentle flow or a modest mechanism motion when supported by the explanation. Keep all key information visible and timing compatible with narration; avoid flashing, rapid opacity pulses, distracting bounce and invented causal effects. An entirely static diagram is valid. Optional actor/effect tracks still obey the user's independent playback switches.",
    review:
      "Check that the main idea, step order, labels, arrow direction and source-supported causal relationships are correct and readable. Floor contact is irrelevant to an abstract diagram. Block contradictory/invented factual labels, a reversed causal arrow, missing essential step, or overlapping/cropped main information. Ignore optional decorative shapes, exact character poses, tiny stylistic details and the absence of a physical room.",
  },
};
export const MOTION_ILLUSTRATION_COMMON = {
  REFERENCE: "Craft reference only: use its coherent construction, line hierarchy and spatial relationships. Re-author for the current story, era, subjects and canvas. Do not copy reference identities, furniture, symbols, labels or coordinates unless independently requested. The selected visual profile and actual source facts take priority.",
  ANATOMY:
    "A bounding box is a planning envelope, never a body outline. Where people are visible, join head/neck/shoulders, sleeves/hands and pelvis/legs into a coherent silhouette in the actual view. Prefer a deliberate side or three-quarter head for a reclining person, avoid a frontal standing face pasted on a horizontal torso. A seated body rests on its support; a standing body has stable feet. Use fewer well-formed subjects instead of more crude ones.",
};
