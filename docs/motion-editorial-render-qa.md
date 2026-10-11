# Editorial renderer visual QA

Run `npx tsx scripts/render-motion-editorial-qa.ts --video` to render the committed
`motion-engine/demo/editorial-qa.json` fixture through the production renderer.
It outputs wide, three-quarter medium, and close stills plus a 9-second 1080p clip.
The output folder defaults to `scratch/visual-acceptance/after`.

The static wardrobe is built once after the final skeleton pose has been evaluated.
Continuous torso and sleeve surfaces replace the exposed mechanical plates of the
source mannequin. The original bone positions and staged coordinates are retained.
Short sleeves retain bare arm geometry. Curved lapels and shirt inserts are
tessellated to avoid cutting through the torso. Existing garment colors and patterns
are preserved.

Validation:

- `node scripts/verify-motion-static-cast.mjs`: planted positions, stable facing,
  and a skeleton evaluated once across time and camera changes.
- `npx tsx scripts/verify-motion-wardrobe.ts`: real shipped male/female skeletons,
  standing/seated poses, long/short/no sleeves; finite geometry and idempotence.
- TypeScript, JS syntax, lint on the new scripts, and Git whitespace checks.
- Inspect the actual generated stills; runtime success alone does not establish
  visual quality.

This fixture demonstrates an interior wardrobe iteration, not equivalence to the
four reference images or acceptance of the full FlyDubai story. Remaining gaps
include detailed hair, tailored folds, realistic hands, environment/vehicle assets,
and validation of camera clearance in every generated location. Horizontal torso
poses retain the source wardrobe instead of applying the upright torso surface.

## Interior camera and lighting repair

Camera collision now uses leaf mesh bounds instead of aggregate seat-group bounds.
Interior fitting evaluates unobstructed views of actual posed head/chest points,
frame coverage, subject size and camera distance. Camera motion stops along its
safe segment instead of moving through an occluder. Actor staging remains fixed.
Prop-only coverage preserves the supplied target, including named location props.
Point/spot lighting and animated glow respect the same interior attenuation.

`npx tsx scripts/verify-motion-camera.ts` checks an outside camera request in a
narrow room with grouped seats, plus retention of the prop-only narrative target.

The FlyDubai source interval 24–44 seconds was recompiled and rendered with these
repairs. Latest reviewed MP4:
`storage/output/motion-video/flydubai-actual-scene-review-16x9-standard-1791610925514.mp4`.
Decoded sampling shows the seated actor instead of the previous black shot, the
standing actor retains blue clothing, and prop coverage retains the cockpit door.
Lighting is intentionally dim; the room/character assets remain visibly simplified.
This is a 20-second review, not validation of the entire 570-second story.
