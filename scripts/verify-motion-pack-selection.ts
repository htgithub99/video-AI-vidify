import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PACK_SELECTION_QA as Q } from "./motionPackSelectionVerificationTexts.js";
import { MOTION_PACK_SELECTION as K } from "../src/constants/motionPackSelection.js";
import { MOTION_PACK as PACK } from "../src/constants/motionPack.js";
import { PUPPET as P, PUPPET_TYPES as T } from "../src/constants/motionPuppet.js";
import type { PuppetCharacter, PuppetGen, PuppetObject, PuppetProp, PuppetRead, PuppetSet, PuppetStylePack } from "../src/types/motionPuppet.js";
import type { MotionSpec } from "../src/types/motionVideo.js";
import type { PuppetLine } from "../src/lib/motionPuppet.js";
import { listPuppets, readPuppet, puppetSetForLight } from "../src/features/motion/server/services/puppet/kitLibrary.js";
import { puppetPackAssetAllowed, runWithPuppetPack, capturePuppetPack, withPuppetPackSnapshot, withPuppetAssemblyTrial } from "../src/features/motion/server/services/puppet/packPolicy.js";
import { puppetPackAssetIssues } from "../src/features/motion/server/services/puppet/packInventory.js";
import { puppetPackCapabilities, puppetPackStoryCapabilities } from "../src/features/motion/server/services/puppet/packCatalog.js";
import { createPuppetSceneChoices, composePuppetPackLines } from "../src/features/motion/server/services/puppet/packSceneChoices.js";
import { assertPuppetSceneSelection } from "../src/features/motion/server/services/puppet/packSelectionContract.js";
import { puppetKitSpec, puppetLayoutFrames } from "../src/features/motion/server/services/puppet/compilePuppet.js";
import { openStillSession, rasterizeMotionSvgs } from "../src/features/motion/server/services/motionRenderService.js";
import { layoutPuppetFrame, puppetSetMissingRequirements } from "../src/features/motion/server/services/puppet/layout.js";
import { buildPuppetSets } from "../src/features/motion/server/services/puppet/setComposer.js";
import { puppetFramePlacementIssues } from "../src/features/motion/server/services/puppet/packPlacement.js";
import { puppetSourceQuote } from "../src/lib/motionPuppetValues.js";
import { puppetPackLocationFits } from "../src/features/motion/server/services/puppet/packLocation.js";
import { MOTION_VISUAL_CONTRACT as V } from "../src/constants/motionVisualContract.js";
assert.ok(puppetPackLocationFits({ key: "dining_room_visual", visualBase: "dining_room", name: "Dining Room", interior: true, time: P.NIGHT, desc: "Dining room with table" + P.NL + V.FIXTURES + JSON.stringify({ kitchen_door: "closed" }) }, "Dining room with table and chairs"));
assert.equal(puppetPackLocationFits({ key: "kitchen", name: "Kitchen", interior: true, time: P.NIGHT, desc: "Kitchen" }, "Dining room with table and chairs"), false);
assert.equal(puppetSourceQuote(Q.SOURCE, Q.SOURCE.toLowerCase()), Q.SOURCE);
assert.equal(puppetSourceQuote(Q.SOURCE, Q.SOURCE.normalize("NFD")), Q.SOURCE);
assert.equal(puppetSourceQuote(Q.SOURCE, Q.SOURCE.replaceAll(" ", "\n  ")), Q.SOURCE);
assert.equal(puppetSourceQuote(Q.SOURCE, Q.MISSING), undefined);
assert.equal(puppetSourceQuote(Q.SOURCE, Q.QUOTE_PARTIAL), undefined);
const root = path.resolve(Q.ROOT);
fs.mkdirSync(root, { recursive: true });
const assets = PACK.TYPES.flatMap((type) => listPuppets(type as any));
const audit = Object.entries(PACK.PRESETS).map(([preset, styleId]) => {
  const rows = assets.filter((asset) => (asset.type === T.STYLE ? asset.id === styleId : "styleId" in asset && asset.styleId === styleId));
  return { preset, styleId, count: rows.length, eligible: rows.filter((asset) => puppetPackAssetAllowed(asset, styleId)).length, issues: rows.flatMap((asset) => puppetPackAssetIssues(asset).map((issue) => ({ id: asset.id, type: asset.type, issue }))), visualStatus: K.UNVERIFIED };
});
fs.writeFileSync(path.join(root, Q.AUDIT), JSON.stringify(audit, null, 2));
const results: any[] = [];
const stills: { file: string; caption: string }[] = [];
for (const [preset, styleId] of Object.entries(PACK.PRESETS))
  await runWithPuppetPack(styleId, assets, async () => {
    const style = readPuppet<PuppetStylePack>(T.STYLE, styleId)!;
    const characters = listPuppets<PuppetCharacter>(T.CHARACTER);
    const nam = characters.find((asset) => asset.gender === Q.MALE && asset.age === Q.ADULT)!;
    const grandma = characters.find((asset) => asset.gender !== Q.MALE && asset.age === Q.SENIOR)!;
    assert.ok(nam && grandma);
    const prop = listPuppets<PuppetProp>(T.PROP).find((asset) => asset.key === Q.BOWL)!;
    assert.ok(prop);
    const object: PuppetObject = { key: Q.INSTANCE, identity: Q.INSTANCE, catalogKey: Q.BOWL, word: Q.BOWL, description: prop.desc, type: "small", category: "prop", mount: P.MOUNT_TABLE, support: Q.TABLE, size: prop.size || prop.height, note: Q.SOURCE };
    const read: PuppetRead = {
      place: Q.ROOM,
      who: [Q.NAM, Q.GRANDMA],
      focus: Q.NAM,
      states: [
        { char: Q.NAM, action: "stand", posture: P.POSE_DEFAULT, support: "beside_bed" },
        { char: Q.GRANDMA, action: "talk", posture: P.SPOT_LIE, support: Q.BED },
      ],
      action: "talk",
      emotion: P.EXPR_DEFAULT,
      overlays: [],
      object,
      objects: [object],
      visual: { scene: Q.ROOM, timeline: Q.PRESENT, evidence: [Q.SOURCE], fixtures: [] },
    };
    const place = { key: Q.ROOM, name: Q.ROOM, desc: "Village bedroom with a bed and a table", interior: true, time: P.DAY };
    const validate = (asset: PuppetSet, reads: PuppetRead[]): string[] => {
      const missing = puppetSetMissingRequirements(asset, reads);
      if (missing.length) return missing;
      const trial = { version: P.VERSION, styleId, characters: { [Q.NAM]: nam.id, [Q.GRANDMA]: grandma.id }, sets: {}, props: { [Q.INSTANCE]: prop.id, [Q.SECOND]: prop.id }, frames: {}, places: {} } as PuppetGen;
      for (const read of reads)
        try {
          createPuppetSceneChoices({ key: Q.ROOM, text: Q.SOURCE } as PuppetLine, read, trial, style, undefined, asset);
        } catch {
          return [Q.INVALID];
        }
      return [];
    };
    const findSet = async (reads: PuppetRead[]): Promise<PuppetSet | undefined> =>
      listPuppets<PuppetSet>(T.SET).find((asset) => asset.time === P.DAY && !validate(asset, reads).length) ||
      (
        await buildPuppetSets(
          style,
          [{ place, must: [Q.BED, Q.TABLE], uses: Q.SOURCE, validate: (asset) => validate(asset, reads) }],
          {
            exec: {},
            log() {},
            ai: async () => {
              throw new Error(Q.MISSING);
            },
          },
          Q.TITLE,
        )
      )[Q.ROOM];
    const set = (await findSet([read]))!;
    assert.ok(set);
    const doorSpot = { key: Q.DOOR, kind: P.SPOT_DOOR, x: 1800, y: 750, groundY: 1000, label: Q.DOOR };
    const doorFrame = layoutPuppetFrame({ layoutLocked: true, shot: P.SHOT_DEFAULT, actors: [{ char: Q.NAM, spot: Q.DOOR, pose: P.POSE_DEFAULT, face: P.FACE_DEFAULT, expr: P.EXPR_DEFAULT }] }, { set: { ...set, spots: [doorSpot] }, body: style.body, heights: { [Q.NAM]: nam.height } });
    assert.equal(doorFrame.actors[0].y, doorSpot.groundY);
    const trialDay = { ...set, id: set.id + Q.PRESENT, time: P.DAY };
    const trialNight = { ...set, id: set.id + Q.MEMORY, time: P.NIGHT, variants: { [P.DAY]: trialDay.id } };
    trialDay.variants = { [P.NIGHT]: trialNight.id };
    withPuppetAssemblyTrial([trialDay, trialNight], [set.id], () => {
      assert.equal(puppetSetForLight(trialDay, P.NIGHT).id, trialNight.id);
      assert.equal(puppetSetForLight(trialNight, P.DAY).id, trialDay.id);
    });
    assert.equal(readPuppet(T.SET, trialDay.id), null);
    assert.equal(readPuppet(T.SET, trialNight.id), null);
    const scenery = { ...object, key: Q.INSTANCE, catalogKey: Q.BED, type: "scenery", category: "scene_feature", mount: undefined };
    assert.deepEqual(puppetSetMissingRequirements(set, [{ ...read, object: scenery, objects: [scenery] }]), []);
    assert.ok(puppetSetMissingRequirements(set, [{ ...read, object: { ...scenery, catalogKey: Q.MISSING }, objects: [] }]).length);
    const line: PuppetLine = { key: Q.ROOM, text: Q.SOURCE, beatId: Q.ROOM, chapterId: Q.ROOM, place: Q.ROOM, cast: read.who };
    const gen: PuppetGen = { version: P.VERSION, selectionVersion: K.VERSION, styleId, characters: { [Q.NAM]: nam.id, [Q.GRANDMA]: grandma.id }, sets: { [Q.ROOM]: set.id }, props: { [Q.INSTANCE]: prop.id }, reads: { [line.key]: read }, frames: {}, places: { [Q.ROOM]: { key: Q.ROOM, name: Q.ROOM, desc: set.desc, interior: set.interior, time: set.time } } };
    const choices = createPuppetSceneChoices(line, read, gen, style);
    assert.ok(choices.length >= K.SAFE_SHOTS.length && choices.length <= K.CHOICE_LIMIT);
    assert.ok(choices.every((choice, index) => !index || choice.score! <= choices[index - 1].score!));
    for (const choice of choices) {
      assert.equal(choice.frame.actors.find((actor) => actor.char === Q.GRANDMA)!.pose, P.SPOT_LIE);
      assert.equal(choice.frame.actors.find((actor) => actor.char === Q.NAM)!.pose, P.POSE_DEFAULT);
      assert.equal(choice.frame.propMount, P.MOUNT_TABLE);
      assert.equal(set.spots!.find((spot) => spot.key === choice.frame.propAt)!.kind, P.SPOT_SURFACE);
      assert.deepEqual(choice.frame.actors.map((actor) => actor.char).sort(), choices[0].frame.actors.map((actor) => actor.char).sort());
    }
    let calls = 0;
    const logs: string[] = [];
    const frames = await composePuppetPackLines(
      [line],
      [line],
      gen,
      style,
      {},
      {
        exec: {},
        review: false,
        log: (message) => logs.push(message),
        ai: async (prompt, _artifact, _exec, _signal, _log, images) => {
          assert.equal(images, undefined);
          const scene = JSON.parse(prompt.slice(prompt.lastIndexOf(P.NL) + 1)).scenes[0];
          return ++calls < K.ATTEMPTS ? { choices: [{ i: 0, choiceId: Q.MISSING }] } : { choices: [{ i: 0, choiceId: scene.options[1].choiceId }] };
        },
      },
    );
    assert.equal(calls, 0);
    Object.assign(gen.frames, frames);
    assert.equal(gen.sceneSelections![line.key].source, K.DETERMINISTIC);
    assertPuppetSceneSelection(gen, line.key);
    const compiled = puppetLayoutFrames([{ ...gen.frames[line.key], start: 0, end: 2, line: line.key }], gen)[0];
    assert.deepEqual(compiled.actors, gen.frames[line.key].actors);
    const saved = structuredClone(gen.frames[line.key]);
    gen.frames[line.key].actors[0].x = 0;
    assert.throws(() => assertPuppetSceneSelection(gen, line.key));
    gen.frames[line.key] = saved;
    const originalProp = gen.props[Q.INSTANCE];
    gen.props[Q.INSTANCE] = Q.MISSING;
    assert.throws(() => assertPuppetSceneSelection(gen, line.key));
    gen.props[Q.INSTANCE] = originalProp;
    const next: PuppetLine = { ...line, key: Q.TALK, text: Q.TALK };
    const nextRead = { ...structuredClone(read), visual: { ...read.visual!, evidence: [Q.TALK] } };
    const nextChoices = createPuppetSceneChoices(next, nextRead, gen, style, saved);
    assert.deepEqual(nextChoices[0].frame.actors, saved.actors);
    const missing = { ...read, object: { ...object, key: Q.MISSING }, objects: [{ ...object, key: Q.MISSING }] };
    assert.throws(() => createPuppetSceneChoices(line, missing, gen, style));
    assert.throws(() => createPuppetSceneChoices(line, { ...read, visual: { ...read.visual!, evidence: [Q.MISSING] } }, gen, style));
    const originalRead = gen.reads![line.key];
    gen.reads![line.key] = { ...originalRead, action: Q.MISSING };
    assert.throws(() => assertPuppetSceneSelection(gen, line.key));
    gen.reads![line.key] = originalRead;
    const noTable = { ...set, spots: set.spots!.filter((spot) => spot.kind !== P.SPOT_SURFACE) };
    assert.ok(puppetSetMissingRequirements(noTable, [read]).length);
    assert.equal(puppetPackAssetAllowed({ ...set, id: Q.INVALID, floorY: NaN }, styleId), false);
    const catalogText = puppetPackCapabilities(preset);
    assert.ok(catalogText.length < K.CATALOG_MAX_CHARACTERS);
    const storyText = puppetPackStoryCapabilities(preset);
    assert.ok(storyText.length < Q.STORY_CATALOG_MAX_CHARACTERS && storyText.length < catalogText.length / 2);
    const story = JSON.parse(storyText.slice(storyText.indexOf("{")));
    story.places = story.places.map((row: any[]) => [row[0], row[1], story.supports[row[2]], story.interactions[row[3]]]);
    for (const prop of listPuppets<PuppetProp>(T.PROP, (asset) => puppetPackAssetAllowed(asset, styleId))) assert.ok(story.props.some((row: any) => row[0] === prop.key && row[1] === prop.mount));
    for (const character of listPuppets<PuppetCharacter>(T.CHARACTER, (asset) => puppetPackAssetAllowed(asset, styleId))) assert.ok(story.characters.some((row: any) => JSON.stringify(row) === JSON.stringify([character.archetype, character.age, character.gender])));
    for (const physicalSet of listPuppets<PuppetSet>(T.SET, (asset) => puppetPackAssetAllowed(asset, styleId))) {
      const supports = [...new Set((physicalSet.spots || []).map((spot) => [spot.kind, spot.fixture].filter(Boolean).join(PACK.COLON)))].sort();
      const interactions = [...new Set((physicalSet.compositions || []).map((composition) => composition.kind))].sort();
      assert.ok(story.places.some((row: any) => JSON.stringify(row) === JSON.stringify([physicalSet.locationFamily || physicalSet.group || physicalSet.tags[0], physicalSet.interior, supports, interactions])));
    }
    const focusedText = puppetPackStoryCapabilities(preset, { places: [{ key: "bedroom", name: "Village Bedroom", description: "Bedroom", interior: true, time: "day" }] });
    const focused = JSON.parse(focusedText.slice(focusedText.indexOf("{")));
    focused.places = focused.places.map((row: any[]) => [row[0], row[1], focused.supports[row[2]], focused.interactions[row[3]]]);
    assert.ok(focusedText.length < storyText.length);
    assert.ok(focused.places.length > 0);
    assert.ok(focused.places.every((row: any) => row[0] === "bedroom"));
    assert.deepEqual(focused.props, story.props);
    assert.deepEqual(focused.characters, story.characters);
    for (const row of focused.places) assert.ok(story.places.some((full: any) => JSON.stringify(row) === JSON.stringify(full)));
    assert.equal(puppetPackStoryCapabilities(preset, { places: [{ key: "unclassified_place", name: "Unknown", description: "Unknown", interior: true, time: "day" }] }), storyText);
    const catalog = JSON.parse(catalogText.slice(catalogText.indexOf("{")));
    for (const stage of catalog.stages) for (const id of stage[1]) for (const spot of Object.values(catalog.layouts[id][2])) assert.ok(stage[0].includes(spot));
    const two: PuppetRead = { ...structuredClone(read), object, objects: [object, { ...object, key: Q.SECOND, identity: Q.SECOND }] };
    const twoSet = (await findSet([two]))!;
    assert.ok(twoSet);
    const twoGen = { ...gen, sets: { [Q.ROOM]: twoSet.id }, props: { ...gen.props, [Q.SECOND]: prop.id } };
    const twoFrame = createPuppetSceneChoices(line, two, twoGen, style)[0].frame;
    assert.notEqual(twoFrame.propAt, twoFrame.items![0].propAt);
    assert.notEqual(twoFrame.propX, twoFrame.items![0].propX);
    const hidden = structuredClone(twoFrame);
    hidden.actors[0] = { ...hidden.actors[0], pose: P.POSE_DEFAULT, x: hidden.propX, y: hidden.propY! + 100, k: 1 };
    assert.ok(puppetFramePlacementIssues(hidden, { body: style.body, heights: { [Q.NAM]: nam.height, [Q.GRANDMA]: grandma.height } }).some((issue) => issue === K.PROP_OCCLUDED(hidden.prop!, hidden.actors[0].char)));
    const blocked = structuredClone(twoFrame);
    blocked.actors[0].x = blocked.actors[1].x;
    blocked.actors[0].y = blocked.actors[1].y! + 150;
    assert.ok(puppetFramePlacementIssues(blocked, { body: style.body, heights: { [Q.NAM]: nam.height, [Q.GRANDMA]: grandma.height } }).length);
    const swap = { ...structuredClone(two), object: two.objects![1], visual: { ...two.visual!, evidence: [Q.TALK] } };
    const continued: PuppetGen = { ...twoGen, frames: {}, sceneSelections: {}, reads: { [line.key]: two, [next.key]: swap }, pack: undefined };
    let checkpoints = 0;
    const continuedFrames = await composePuppetPackLines([line, next], [line, next], continued, style, {}, { exec: {}, review: false, log() {}, ai: async (prompt) => ({ choices: JSON.parse(prompt.slice(prompt.lastIndexOf(P.NL) + 1)).scenes.map((scene: any) => ({ i: scene.i, choiceId: scene.options[1].choiceId })) }) }, () => {
      checkpoints++;
      assert.equal(Object.keys(continued.frames).length, 2);
    });
    assert.equal(checkpoints, 1);
    assert.deepEqual(continuedFrames[line.key].actors, continuedFrames[next.key].actors);
    assert.equal(continuedFrames[line.key].propAt, continuedFrames[next.key].items![0].propAt);
    assert.equal(continuedFrames[line.key].items![0].propAt, continuedFrames[next.key].propAt);
    assert.notEqual(continuedFrames[line.key].choiceId, continuedFrames[next.key].choiceId);
    const cancellation = new AbortController();
    cancellation.abort();
    await assert.rejects(
      composePuppetPackLines(
        [line],
        [line],
        continued,
        style,
        {},
        {
          exec: {},
          review: false,
          signal: cancellation.signal,
          log() {},
          ai: async () => {
            cancellation.abort();
            throw new Error(Q.MISSING);
          },
        },
      ),
    );
    let imageCount = 0;
    let invalidCalls = 0;
    const fallback = await composePuppetPackLines(
      [line],
      [line],
      gen,
      style,
      {},
      {
        exec: {},
        review: true,
        log: (message) => logs.push(message),
        ai: async (_prompt, _artifact, _exec, _signal, _log, images) => {
          imageCount += images?.length || 0;
          invalidCalls++;
          return { choices: [{ i: 0, choiceId: Q.MISSING }] };
        },
      },
    );
    assert.equal(invalidCalls, 0);
    assert.equal(imageCount, 0);
    assert.equal(gen.sceneSelections![line.key].source, K.DETERMINISTIC);
    assert.equal(gen.sceneSelections![line.key].preview, undefined);
    Object.assign(gen.frames, fallback);
    gen.pack = capturePuppetPack(gen);
    withPuppetPackSnapshot(gen.pack, () => assertPuppetSceneSelection(gen, line.key));
    const session = await openStillSession();
    try {
      for (const [index, frame] of [...choices.map((choice) => choice.frame), twoFrame].entries()) {
        const selectedGen = index === choices.length ? twoGen : gen;
        const spec: MotionSpec = { title: Q.TITLE, aspect: K.ASPECT, fps: K.FPS, duration: 2, fadeIn: 0, fadeOut: 0, subtitles: [], kit: puppetKitSpec({ ...selectedGen, pack: undefined }, false)!, shots: [{ id: preset, start: 0, end: 2, template: P.TEMPLATE, params: { frames: [{ ...frame, start: 0, end: 2 }] } }] };
        const [image] = await session.render(spec, [{ id: preset + P.VARIANT_SEP + index, t: 1 }], root, { width: 960, height: 540 });
        assert.deepEqual(image.issues, []);
        stills.push({ file: image.file, caption: preset + P.SPACE + frame.shot + P.SPACE + index });
      }
    } finally {
      await session.close();
    }
    results.push({
      preset,
      source: Q.SOURCE,
      choices: choices.map((choice) => ({ id: choice.choiceId, frame: choice.frame, bindings: choice.bindings })),
      catalogCharacters: catalogText.length,
      invalidResponsesRejected: true,
      retries: calls,
      deterministicFallbackLogged: logs.includes(K.FALLBACK_LOG(1)),
      imageReviewRespected: true,
      tamperRejected: true,
      lockedCompileUnchanged: true,
      speechKeepsLying: true,
      independentProps: true,
      propPositionsSurviveFocusChange: true,
      overlapRejected: true,
      acceptedBatchSaved: checkpoints,
      cancellationPreserved: true,
      snapshot: gen.pack?.fingerprint,
      logs,
    });
  });
const width = 960,
  height = Math.ceil(stills.length / 2) * 296;
const cells = stills.map((row, index) => K.PREVIEW_CELL(fs.readFileSync(row.file).toString(K.ENCODING), row.caption, (index % 2) * 480, Math.floor(index / 2) * 296, 480, 270)).join(P.EMPTY);
assert.equal((await rasterizeMotionSvgs([{ svg: K.PREVIEW_SVG(cells, width, height), file: path.join(root, Q.BOARD), width, height }])).length, 1);
fs.writeFileSync(path.join(root, Q.RESULT), JSON.stringify({ liveAi: false, renderedStills: stills.length, audit, results, stills }, null, 2));
process.stdout.write(JSON.stringify({ message: Q.OUTPUT, styles: results.length, stills: stills.length, audit: audit.map(({ preset, count, eligible, issues }) => ({ preset, count, eligible, issues: issues.length })) }) + P.NL);
