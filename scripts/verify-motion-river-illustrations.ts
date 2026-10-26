import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { PUPPET as P } from "../src/constants/motionPuppet.js";
import { motionIllustrationNeedsErrors } from "../src/lib/motionIllustrationNeeds.js";
import { checkPuppetPlanReadiness } from "../src/server/services/puppet/planReadiness.js";
import { puppetKitSpec } from "../src/server/services/puppet/compilePuppet.js";
import { layoutPuppetFrame, puppetSetMissingRequirements } from "../src/server/services/puppet/layout.js";
import { openStillSession } from "../src/server/services/motionRenderService.js";
import { listPuppets } from "../src/server/services/puppet/kitLibrary.js";
const output = path.resolve("scratch/motion-root-illustrations-20261026");
fs.mkdirSync(output, { recursive: true });
const inventory = () => JSON.stringify(K.TYPES.flatMap((type) => listPuppets(type as any)));
const before = inventory();
const session = await openStillSession();
const results: any[] = [];
try {
  for (const preset of Object.keys(K.PRESETS)) {
    for (const example of ["river", "nested", "bedside"]) {
      const river = example === "river",
        nested = example === "nested";
      const words = river ? "Nam và Bà đứng ở bến sông trước nhà. Mâm cúng và bát cơm ở trên bàn. Thuyền giấy ở trên bờ." : nested ? "Nam đứng bên bàn. Bát cơm ở trên khay gỗ, khay gỗ ở trên bàn." : "Bà nằm trên giường. Nam đứng cạnh giường.";
      const objects: any[] = river
        ? [
            { key: "tray", catalogKey: "offering_tray", word: "Mâm cúng", type: "other", mount: "table", support: "table" },
            { key: "rice", catalogKey: "plain_rice_bowl", word: "bát cơm", type: "other", mount: "table", support: "table" },
            { key: "boat", catalogKey: "spirit_paper_boat", word: "Thuyền giấy", type: "other", mount: "floor" },
          ]
        : nested
          ? [
              { key: "tray", catalogKey: "wooden_tray", word: "khay gỗ", type: "other", mount: "table", support: "table" },
              { key: "rice", catalogKey: "plain_rice_bowl", word: "Bát cơm", type: "other", mount: "table", support: "tray" },
            ]
          : [];
      const states: any[] = [{ char: "nam", action: "stand", posture: "idle" }, ...(!nested ? [{ char: "ba", action: river ? "stand" : "lie", posture: river ? "idle" : "lie", ...(!river ? { support: "bed" } : {}) }] : [])];
      const analysis: any = {
        title: "Minh họa kho đóng",
        logline: words,
        stylePreset: preset,
        cast: [
          { key: "nam", name: "Nam", role: "villager", gender: "male", age: "adult" },
          { key: "ba", name: "Bà", role: "villager", gender: "female", age: "senior" },
        ],
        chapters: [{ id: "c1", summary: words }],
        places: [{ key: "place", name: river ? "Bến sông trước nhà" : "Buồng ngủ", description: river ? "River landing in front of the village house" : "Village bedroom", interior: !river, time: "day" }],
        illustrationNeeds: [{ id: "n1", chapterId: "c1", place: "place", evidence: words, states, objects }],
      };
      assert.deepEqual(motionIllustrationNeedsErrors(analysis), []);
      const ready = (await checkPuppetPlanReadiness(analysis))!;
      const assets = ready.pack!.assets;
      const set: any = assets[ready.places.place];
      const style: any = assets[ready.pack!.styleId];
      const props = Object.fromEntries(Object.entries(ready.props || {}).map(([key, id]) => [key, assets[id]]));
      assert.deepEqual(puppetSetMissingRequirements(set, [{ states, objects } as any]), []);
      const actors = states.map((state) => ({ char: state.char, pose: state.posture, support: state.support, face: "right", expr: "neutral" }));
      const primary = objects[0];
      const frame: any = layoutPuppetFrame(
        { shot: "people", set: "place", actors, prop: primary?.key, propMount: primary?.mount, propSupport: primary?.support, items: objects.slice(1).map((object) => ({ prop: object.key, propMount: object.mount, propSupport: object.support })) },
        { set, body: style.body, heights: Object.fromEntries(Object.entries(ready.characters).map(([key, id]) => [key, (assets[id] as any).height])), props: props as any, prop: props[primary?.key] as any },
      );
      if (river) assert.notEqual(frame.propAt, frame.items.find((item: any) => item.prop === "rice").propAt);
      if (nested) assert.equal(frame.items.find((item: any) => item.prop === "rice").propParent, "tray");
      if (example === "bedside") {
        const caregiver = frame.actors.find((actor: any) => actor.char === "nam");
        const patient = frame.actors.find((actor: any) => actor.char === "ba");
        assert.ok(caregiver.y > patient.y + 20);
        assert.equal(set.spots.find((spot: any) => spot.key === caregiver.spot)?.relation, "beside");
      }
      const kit = puppetKitSpec({ styleId: ready.pack!.styleId, characters: ready.characters, sets: ready.places, props: ready.props, pack: ready.pack } as any, false)!;
      assert.ok(kit);
      const spec: any = { aspect: "16:9", fadeIn: 0, fadeOut: 0, duration: 10, kit, shots: [{ id: example, start: 0, end: 10, template: P.TEMPLATE, params: { frames: [{ ...frame, start: 0, end: 10 }], actors: actors.map((actor) => ({ cast: actor.char, at: P.ACTOR_AT })), props: objects.map((object) => ({ name: object.key })), location: "place" } }], subtitles: [] };
      const id = preset + "-" + example;
      const [image] = await session.render(spec, [{ id, t: 1 }], output, { width: 960, height: 540, quality: "high" });
      assert.deepEqual(image.issues, []);
      assert.ok(fs.statSync(image.file).size > 10000);
      results.push({ preset, example, words, file: image.file, setId: set.id, recipe: !!set.recipe, assembly: !!set.plan, frame });
    }
  }
} finally {
  await session.close();
}
assert.equal(inventory(), before);
fs.writeFileSync(path.join(output, "report.json"), JSON.stringify({ passed: true, videoCreated: false, libraryUnchanged: true, results }, null, 2));
console.log(JSON.stringify({ passed: true, examples: results.length, libraryUnchanged: true, videoCreated: false, output }));
