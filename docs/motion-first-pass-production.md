# Input-derived Video Motion production

The reference implementation is Music Creator: `buildMusicStyleAnalysisPrompt` derives a Music DNA and synthetic creative profile from input; the music-plan controller validates that contract, saves it in its checkpoint and passes it to every composition batch. Video Motion now applies that pattern to writing and visual production, without selecting production rules from a genre catalogue.

Flow: input → validated `creativeBlueprint` in the story analysis → narration and storyboard → cast/style, scene geometry and staging → rendering. The blueprint records intent, audience, narration voice/structure/pacing, visual style/composition/camera/lighting/palette/materials/subject hierarchy, a synthetic creative role and craft principles, mustPreserve/mustVary/mustNotCopy, uncertainty and source clues. Missing required fields trigger bounded analysis correction; an invalid blueprint does not proceed to new scene generation. The analysis persists through the existing project state/API.

Plain input paragraphs are preserved and short briefs do not require a transcript. A brief's word count does not truncate an explicitly requested five/ten-minute video. Timestamped transcripts retain source-duration behaviour.

Genre fields remain optional descriptive metadata. They do not determine factuality, narration, story arc, art direction or camera. A shared technical contract checks geometry, supported positions, non-overlapping actors and camera coordinates; it does not prescribe a universal aesthetic. Every set is AI-designed from its description and project blueprint. The cabin fixture is an explicit test/library example, never automatically selected from a location name.

Authored camera counts, timings, positions and deliberate stillness are retained. Legacy missing coverage can receive supported fallback views. Static human poses remain a renderer constraint requested by the user; object-only and abstract scenes need no people. Automatic explanatory captions remain disabled.

Generated assets carry a creative-plan signature. A changed blueprint, cast or environment plan invalidates incompatible generated style/scene assets, preventing a previous project's look from leaking into a new one. Matching signatures reuse checkpoints.

Characters are always authored as scene-graph geometry from the input-derived visual direction. The AI supplies complete visible geometry for sixteen pose anchors, including clothing, facial features, colours and materials. The shared skeleton provides pose anchors only; its surface and template wardrobe are hidden. The former customDesign implementation cloned the mannequin surface and is no longer accepted for production. Cached characters without authored geometry must be rebuilt before preview/export. This supports the renderer's geometry vocabulary; reference-image upload and style extraction are not implemented yet.
