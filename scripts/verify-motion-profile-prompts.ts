import assert from "node:assert/strict";
import { MOTION_ILLUSTRATION_PROFILES as profiles } from "../src/constants/motionIllustrationProfiles.js";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.js";
import { MOTION_SCENE_COMPOSITION as C } from "../src/constants/motionSceneComposition.js";
import { motionIllustrationDirection } from "../src/lib/motionIllustrationProfile.js";
import { motionIdentityMemory, motionStaticAppearance } from "../src/lib/motionIdentityMemory.js";
import { motionCastIdentity } from "../src/lib/motionCastIdentity.js";
import { MOTION_CHARACTER_FRAMES } from "../src/constants/motionProfiles/characterFrames/index.js";
import { normalizeFirstSceneComposition, compositionFrameSvg } from "../src/lib/motionSceneComposition.js";
import { normalizeMotionSceneDesign } from "../src/lib/motionSceneDesign.js";
import type { MotionRemotionProfile, MotionRemotionScene } from "../src/types/motionVisual.js";
// "explainer" is an alias of "history" (one round-head family); sketch and comic share its grammar.
assert.equal(profiles.history.grammar, profiles.sketch.grammar);
assert.notEqual(profiles.horror.grammar, profiles.history.grammar);
const behavior = { version: 1 as const, actors: "fixed" as const, sceneEffects: "off" as const, camera: "fixed" as const };
const node = { id: "person", kind: "character", entityId: "traveller", description: "elderly woman in a violet cloak", posture: "seated", support: "bench", x: 900, y: 0, width: 20, height: 20, slot: "right", layoutX: 0.95 };
const cast = [{ key: "traveller", name: "Mai", look: "elderly woman; silver braid; violet cloak" }];
assert.deepEqual(motionCastIdentity(cast), cast);
assert.deepEqual(motionCastIdentity([{ key: "unknown" }]), [{ key: "unknown" }], "Do not invent seeded hairstyles");
for (const id of Object.keys(profiles) as MotionRemotionProfile[]) {
  // The drawing request is a scene brief: what the moment shows and who is in it, the style's own character frame and
  // rules, and the canvas. Positions, sizes and earlier drawings are never sent; the AI lays the scene out itself.
  const prompt = C.PROMPT({
    width: 1280,
    height: 720,
    viewBox: "0 0 1280 720",
    artDirection: motionIllustrationDirection(id, "drawing"),
    scene: { text: "Mai sits on a bench beside the river.", nodes: [node] },
    cast,
    renderBehavior: behavior,
    drawingReference: "OLD_SVG_SENTINEL",
    poseConstruction: "OLD_POSE_SENTINEL",
    continuity: { placeSvg: "OLD_PLACE_SENTINEL", design: { placements: [node] }, notes: "river on the left" },
  } as any);
  assert.ok(prompt.startsWith("TEXT CODING TASK"), "one drawing task per scene");
  assert.match(prompt, /SCENE BRIEF\nTHIS MOMENT:/);
  assert.match(prompt, /Narration being illustrated: "Mai sits on a bench beside the river\."/);
  assert.doesNotMatch(prompt, /undefined/, "a missing field never shows as undefined");
  assert.match(prompt, /- person = Mai: Skin #[0-9a-f]{6}/i, "the person line names who it is and the skin colour");
  assert.match(prompt, /Wears: elderly woman; silver braid; violet cloak\./, "the cast look is the costume");
  assert.match(prompt, /Posture: seated\. Support: bench\./, "posture and support come from the scene");
  assert.ok(!/OLD_(?:SVG|POSE|PLACE)_SENTINEL|PROPORTION REFERENCE|poseConstruction/.test(prompt), "no earlier drawing or pose reference");
  assert.ok(!/"x":900|layoutX|"slot"/.test(prompt), "no fixed positions or slots");
  assert.match(prompt, /CHARACTER SVG FRAMES[\s\S]*STAND FRAME:\n<svg[\s\S]*END CHARACTER SVG FRAMES/, "the style's own character frame");
  for (const rule of profiles[id].brief.rules) assert.ok(prompt.includes(rule), "every style rule is in the brief");
  assert.match(prompt, id === "horror" ? /Skin #ffffff/ : /Skin #(?!ffffff)/i, "horror masks are white, other styles use a skin colour");
  assert.equal(/_legs/.test(prompt), id !== "horror", "only styles with legs ask for a legs group");
  const technical = JSON.parse(prompt.split("Technical context (canvas, behaviour): ")[1].split("\n")[0]);
  assert.deepEqual(technical, { viewBox: "0 0 1280 720", width: 1280, height: 720, renderBehavior: behavior });
  assert.match(prompt, /SCENE MOTION IS OFF/, "fixed behaviour asks for no animation");
  assert.match(prompt, /OUTPUT: one fenced JSON object \{design,svg,layers,animations,continuityNotes\}/);
  assert.ok(prompt.length < 16000, "the request stays compact: " + prompt.length);
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'><g id='land'><rect width='1280' height='720' fill='#aacccc'/><path d='M0 250L1280 250L1280 720L0 720Z' fill='#bbaa88'/></g><g id='person' transform='translate(430 300)'><path d='M0 0Q25 -30 50 0L50 120L0 120Z' fill='#9977aa' stroke='#28221f' stroke-width='4'/></g><g id='fog'><ellipse cx='300' cy='600' rx='100' ry='25' fill='#cccccc'/></g></svg>";
  const built = normalizeFirstSceneComposition(
    {
      svg,
      design: { camera: "wide", format: "illustration" },
      layers: [
        { id: "land", kind: "background" },
        { id: "person", kind: "character", entityId: "traveller", description: cast[0].look },
        { id: "fog", kind: "effect" },
      ],
      animations: [],
    },
    id,
    id,
    "scene",
    [node as any],
    new Set(["traveller"]),
    1280,
    720,
  );
  assert.deepEqual(built.composition.design?.placements, []);
  assert.ok(built.asset.svg.includes("transform='translate(430 300)'"));
  assert.ok(built.asset.svg.includes("stroke='#28221f' stroke-width='4'"));
  assert.equal((built.asset.svg.match(/<rect\b/g) || []).length, 1, "No generated floor underlay");
  assert.equal(compositionFrameSvg(built.asset, built.composition, 3, behavior, new Set(), id), built.asset.svg, "Playback preserves artwork without blur/body correction");
  const scene = { id: "next", nodes: [node] } as unknown as MotionRemotionScene;
  const accepted = { id: "first", nodes: [node], build: { status: "accepted" }, composition: { ...built.composition, profileId: id, profileRevision: V.PROFILES[id].revision, continuityNotes: "traveller: silver braid and violet cloak; river left" } } as MotionRemotionScene;
  const memory = motionIdentityMemory(scene, [accepted], id);
  assert.equal(memory[0].entityId, "traveller");
  assert.equal(memory[0].appearance, cast[0].look);
  assert.match(prompt, /appearance lists only static traits actually drawn/, "appearance never carries pose or placement");
  assert.match(profiles[id].identity, /Current scene text\/nodes alone determine pose/);
  const posed = structuredClone(accepted);
  posed.composition!.layers.find((layer) => layer.entityId === "traveller")!.description = "elderly woman; silver braid; violet cloak; standing quietly with arms down; facing left";
  assert.deepEqual(motionIdentityMemory(scene, [posed], id), [{ entityId: "traveller", appearance: cast[0].look }], "Legacy identity must exclude old posture, arms and gaze in every profile");
  posed.composition!.layers.find((layer) => layer.entityId === "traveller")!.description = "seated leaning slightly forward toward the filter";
  assert.deepEqual(motionIdentityMemory(scene, [posed], id), [], "Do not recover pose from free-form continuity notes when static traits are unavailable");
  const explicit = normalizeFirstSceneComposition({ svg, layers: [{ id: "person", kind: "character", entityId: "traveller", description: "kneeling by the bench", appearance: "silver braid; violet cloak" }], animations: [] }, id, id, "explicit identity", [node as any], new Set(["traveller"]), 1280, 720);
  assert.equal(explicit.composition.layers.find((layer) => layer.entityId === "traveller")!.appearance, "silver braid; violet cloak");
  posed.composition!.layers = explicit.composition.layers;
  assert.deepEqual(motionIdentityMemory(scene, [posed], id), [{ entityId: "traveller", appearance: "silver braid; violet cloak" }], "Dedicated appearance metadata takes precedence over scene description");
  assert.ok(!JSON.stringify(memory).includes("<svg"));
  const changed = structuredClone(accepted);
  changed.id = "changed";
  changed.nodes[0].appearanceChanged = true;
  changed.composition!.layers.find((layer) => layer.entityId === "traveller")!.description = "silver braid; red cloak after changing clothes";
  assert.equal(motionIdentityMemory(scene, [accepted, changed, scene], id)[0].appearance, "silver braid; red cloak after changing clothes", "Use the most recent accepted appearance after a story costume change");
  assert.deepEqual(motionIdentityMemory({ ...scene, nodes: [{ ...scene.nodes[0], appearanceChanged: true }] }, [accepted], id), [], "An explicit current costume change must not be locked to prior clothes");
  const old = structuredClone(accepted);
  old.composition!.profileRevision!--;
  assert.deepEqual(motionIdentityMemory(scene, [old], id), [], "Old character grammar cannot become identity reference");
  old.composition!.profileRevision = V.PROFILES[id].revision;
  old.composition!.profileId = id === "horror" ? "history" : "horror";
  assert.deepEqual(motionIdentityMemory(scene, [old], id), [], "Do not mix styles");
}
assert.equal(motionStaticAppearance("black hair in a low bun; standing-collar shirt; knee-length robe; short shins; seated on a stool"), "black hair in a low bun; standing-collar shirt; knee-length robe; short shins");
assert.equal(motionStaticAppearance("red hair bow; standing collar; bowed toward the king"), "red hair bow; standing collar");
assert.equal(motionStaticAppearance("tóc búi thấp; áo xanh; ngồi trên ghế; quỳ bên bàn; bên trái khung"), "tóc búi thấp; áo xanh");
assert.match(profiles.history.grammar, /OUTER borders/);
assert.match(profiles.history.grammar, /head approximately 70 wide by 80 high/);
assert.match(profiles.horror.grammar, /1.05-1.15 head diameters/);
assert.match(profiles.horror.grammar, /solid black vertical oval eyes/);
assert.deepEqual(normalizeMotionSceneDesign({ camera: "wide" }, []), { camera: "wide", placements: [] });
assert.equal(MOTION_CHARACTER_FRAMES.history, MOTION_CHARACTER_FRAMES.sketch, "the round-head styles share one character frame");
assert.notEqual(MOTION_CHARACTER_FRAMES.history, MOTION_CHARACTER_FRAMES.horror);
assert.ok(!C.PROMPT({ width: 1280, height: 720, viewBox: "0 0 1280 720", artDirection: motionIllustrationDirection("history", "drawing"), scene: { nodes: [{ id: "diagram", kind: "prop" }] } }).includes("END CHARACTER SVG FRAME"), "A diagram without people must not acquire a character frame");
console.log("Three text-only scene profiles: shared outlined people, isolated horror proportions, story-driven identity, free SVG layout, lightweight metadata and unmodified artwork passed.");
