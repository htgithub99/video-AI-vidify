# Editorial renderer visual QA

Run `npx tsx scripts/render-motion-editorial-qa.ts --video` to render the committed `motion-engine/demo/editorial-qa.json` through the production renderer. It produces wide, medium and close stills plus a 9-second clip.

Characters use authored geometry, free part hierarchies, named poses and optional local keyframe tracks. The renderer retains authored dimensions and attachment pivots. Clothing and facial details belong to the geometry. Camera framing uses actual mesh bounds and authored anchors. No bundled character models or external action clips are required.

Validation:

- `npm run test:motion-controls`: reference input, advisory QA, static/moving characters, 2D/3D output and deterministic seeking.
- `npx tsx scripts/verify-motion-characters.ts`: free proportions, hierarchy, authored poses/keyframes, invalid-parent recovery and obsolete cache rejection.
- `npx tsx scripts/verify-motion-camera.ts`: narrow-room camera clearance, profile/rear views and exact named prop focus.

The demo uses explicit illustrative character designs for testing only; these are never injected into production generation. Real AI output depends on the supplied references and story, and style similarity still requires viewing the produced frames.
