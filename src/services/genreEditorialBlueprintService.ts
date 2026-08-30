import _ from "lodash";
import { VideoGenre } from "../constants/enums";

export interface GenreEditorialBlueprint {
  id: string;
  narrativeEngine: string;
  visualGrammar: string;
  pacing: string;
  sourcePolicy: string;
  voiceDirection: string;
  audioDirection: string;
  motionPolicy: string;
  thumbnailPromise: string;
  musicProfile: string;
}

const BLUEPRINTS: Record<string, GenreEditorialBlueprint> = {
  cinematic_episode: {
    id: "cinematic_episode",
    narrativeEngine:
      "Write an original screen story in playable sequences: a concrete objective, opposing force, escalating choices, irreversible turn, climax and earned aftermath. Let character action and dialogue carry meaning instead of explanatory narration.",
    visualGrammar:
      "Direct sequence-level geography, master/coverage/reaction/insert shots, stable eyelines and screen direction, motivated blocking, action handoffs and exact location, wardrobe and prop continuity.",
    pacing:
      "Alternate tension, release and discovery at sequence level; enter late, leave after the consequence, and preserve performance holds instead of cutting on every sentence.",
    sourcePolicy:
      "Use original fictional world assets or supplied canon. Never imitate protected characters, franchises, logos, costumes or a living creator's signature world design.",
    voiceDirection: "Prefer short playable dialogue, subtext and character-specific rhythm. Use narration only when the chosen story form genuinely requires it.",
    audioDirection:
      "Build scene-specific room tone, footsteps, cloth, machinery, weapons, vehicles and selective silence; music follows the dramatic arc and never replaces production sound.",
    motionPolicy:
      "One coherent action and at most one motivated camera move per shot; preserve start/end pose, axis, eyeline, identity, geometry and prop ownership across coverage.",
    thumbnailPromise: "One original protagonist, one immediate threat or objective and one unmistakable world detail without copying an existing franchise.",
    musicProfile: "cinematic_episode",
  },
  satirical_story: {
    id: "satirical_story",
    narrativeEngine:
      "Follow one concrete contradiction through escalating choices, observable consequences and a changed-meaning callback; humor must reveal the mechanism and punch up.",
    visualGrammar: "Stage lived interactions, transactions, rules, reactions and ironic evidence; avoid generic sad portraits and detachable visual jokes.",
    pacing: "Alternate compact setups, medium consequence beats and short landings; give serious human-cost moments room to breathe.",
    sourcePolicy: "Use authentic evidence for factual institutions, places and documents; use clearly illustrative scenes for representative characters.",
    voiceDirection: "Dry, conversational, culturally natural and empathetic; reduce joke density as harm increases.",
    audioDirection: "Light editorial pulse, restrained comic punctuation, then thinner ambience at consequence beats; never use novelty sounds on victims.",
    motionPolicy: "Mostly clean cuts and gentle push-ins; one motivated reaction accent per sequence, no shake, glitch or repeated punch zoom.",
    thumbnailPromise: "One concrete absurd rule, transaction or consequence with restrained irony, never victim humiliation.",
    musicProfile: "satirical_editorial",
  },
  evidence_documentary: {
    id: "evidence_documentary",
    narrativeEngine: "Build from a consequential question through chronology, material evidence, competing explanations and a sourced conclusion.",
    visualGrammar: "Move from place to artifact/document/map/detail to consequence; distinguish authentic evidence from reconstruction.",
    pacing: "Measured but progressive; use chapter turns when evidence changes the viewer's understanding, not artificial cliffhangers.",
    sourcePolicy:
      "Prioritize licensed photographs, footage, maps, plans, documents, artifacts and present-day locations; AI only for labeled reconstruction or unavailable transitions.",
    voiceDirection: "Confident, precise and vivid without propaganda, faux mystery or unsupported certainty.",
    audioDirection: "Restrained documentary bed, location ambience where meaningful, sparse impacts only on evidence reveals.",
    motionPolicy: "Clean cuts, slow map/detail moves and subtle push-ins; dissolves only for genuine time or location transitions.",
    thumbnailPromise: "A verifiable person, place, artifact or decision plus one unresolved factual tension.",
    musicProfile: "documentary_editorial",
  },
  causal_explainer: {
    id: "causal_explainer",
    narrativeEngine: "Open with a counterintuitive outcome, expose the hidden mechanism step by step, test it with a concrete example and resolve the initial question.",
    visualGrammar: "Alternate real examples, process stages, scale comparisons, diagrams and human consequences; every analogy must be visibly distinguishable from fact.",
    pacing: "Fast question setup, controlled explanatory middle, visual reset at each mechanism change and a concise synthesis.",
    sourcePolicy: "Use authentic demonstrations and data-grounded diagrams when facts are identifiable; use AI for conceptual illustration, not fake evidence.",
    voiceDirection: "Curious, exact and conversational; define technical terms at first use and let examples precede abstraction.",
    audioDirection: "Clean modern pulse with subtle mechanism ticks and reveal accents; protect explanation clarity.",
    motionPolicy: "Motivated pans across processes and restrained scale changes; avoid decorative floating UI and constant motion.",
    thumbnailPromise: "Show the surprising outcome or mechanism in one immediately testable visual question.",
    musicProfile: "curious_explainer",
  },
  investigation: {
    id: "investigation",
    narrativeEngine: "Establish the known timeline, separate allegation from verified fact, follow evidence and uncertainty, then explain what remains unresolved.",
    visualGrammar: "Use real locations, public records, timelines, maps and non-graphic evidence; do not fabricate case files, quotes, suspects or police imagery.",
    pacing: "Controlled tension from information gaps, with pauses around victims and decisive evidence; no sensational reveal spam.",
    sourcePolicy: "Authentic and legally usable sources are mandatory for identifiable cases; reconstruction must be clearly non-evidentiary and dignity-preserving.",
    voiceDirection: "Calm, forensic and compassionate; use legally accurate attribution and never imply guilt beyond sources.",
    audioDirection: "Low restrained tension bed, factual room tone and sparse evidence accents; no horror stingers or exploitative heartbeat loops.",
    motionPolicy: "Stable frames, clean timeline moves and slow evidence inspection; no handheld simulation, flash, glitch or jump-scare editing.",
    thumbnailPromise: "One verified clue or contradiction without gore, invented menace or victim exploitation.",
    musicProfile: "forensic_restraint",
  },
  review_comparison: {
    id: "review_comparison",
    narrativeEngine: "State the use case and verdict criterion, demonstrate real trade-offs, compare alternatives under equal conditions and deliver a buyer-specific conclusion.",
    visualGrammar: "Use authentic product views, hands-on tests, interface details, measured comparisons and failure cases; avoid unrelated luxury B-roll.",
    pacing: "Front-load the practical verdict, then alternate proof, counterpoint and use-case resets; reserve slower holds for decisive details.",
    sourcePolicy: "Prefer authentic product/media assets and demonstrable tests; AI may support neutral diagrams but never impersonate product evidence.",
    voiceDirection: "Direct, specific and independent; separate observation, measurement and opinion.",
    audioDirection: "Minimal modern bed, tactile product sounds and restrained section markers.",
    motionPolicy: "Clean match cuts, controlled macro moves and side-by-side comparisons; no cinematic effects that obscure evidence.",
    thumbnailPromise: "One product, one decisive trade-off and one buyer-relevant consequence.",
    musicProfile: "clean_review",
  },
  ranked_list: {
    id: "ranked_list",
    narrativeEngine: "Define ranking criteria before the list, make each entry earn its position through a distinct proof point and reserve the strongest comparison for the top.",
    visualGrammar: "Give every entry a unique identifying scene, comparable evidence and clear progression; avoid repeating the same product/person pose.",
    pacing: "Brisk entries with periodic comparison resets; vary reveal length by importance instead of identical countdown beats.",
    sourcePolicy: "Use authentic assets for real ranked subjects; do not invent scores or evidence.",
    voiceDirection: "Concise, comparative and energetic without arbitrary hype.",
    audioDirection: "Light rhythmic momentum with sparse rank-change markers; no sound on every number.",
    motionPolicy: "Clean cuts and motivated comparison moves; avoid identical zooms at every rank.",
    thumbnailPromise: "Feature the strongest contrast or unexpected winner without revealing the entire ranking.",
    musicProfile: "countdown_momentum",
  },
  human_story: {
    id: "human_story",
    narrativeEngine: "Follow a named person's goal through choices, obstacles, reversals and an emotionally earned payoff; every scene must change their situation.",
    visualGrammar: "Preserve identity, geography, props, screen direction and wardrobe timeline while varying interaction, scale and point of view.",
    pacing: "Let decisions and reactions breathe, accelerate through consequence chains and hold on the emotional turn.",
    sourcePolicy: "Use authentic media for real people or cases; use prompt-consistent illustration for fictional or representative stories without false documentary claims.",
    voiceDirection: "Intimate, concrete and emotionally truthful; never narrate feelings that actions can reveal.",
    audioDirection: "Character-led motif, location ambience and selective silence at the emotional turn.",
    motionPolicy: "Gentle motivated movement, clean continuity cuts and occasional reflective dissolves; no automatic shake or constant zoom.",
    thumbnailPromise: "One decisive human choice and its visible emotional or practical cost.",
    musicProfile: "human_story_arc",
  },
  reflective_analysis: {
    id: "reflective_analysis",
    narrativeEngine:
      "Begin with a relatable dilemma, introduce the framework through a concrete case, test its limits and end with a precise reframing rather than a generic lesson.",
    visualGrammar: "Ground ideas in behavior, environments, objects and observable experiments; use symbolism sparingly and never repeat mirror/maze imagery by default.",
    pacing: "Calm but purposeful, alternating examples and interpretation with visual resets before dense concepts.",
    sourcePolicy: "Use authentic thinkers, studies, artworks and contexts where identifiable; conceptual AI imagery must remain clearly illustrative.",
    voiceDirection: "Thoughtful, accessible and specific; distinguish evidence, interpretation and speculation.",
    audioDirection: "Warm restrained ambience with space for thought; minimal accents.",
    motionPolicy: "Stable compositions, slow lateral movement and clean cuts; avoid hypnotic drift or excessive dissolves.",
    thumbnailPromise: "A recognizable human dilemma expressed through one concrete visual contradiction.",
    musicProfile: "reflective_ambient",
  },
  world_lore: {
    id: "world_lore",
    narrativeEngine: "Anchor the viewer in one rule, trace its origin and consequences, connect clues across the world and pay off the governing question.",
    visualGrammar: "Maintain canon geography, factions, costumes, artifacts and scale; alternate maps, locations, mechanisms and character consequences.",
    pacing: "Curiosity-led reveals with orientation resets so depth never becomes information fog.",
    sourcePolicy: "Use supplied canon/source assets when available; never present fan inference as confirmed canon.",
    voiceDirection: "Enthusiastic but disciplined, clearly separating canon, implication and theory.",
    audioDirection: "World-appropriate motif and restrained reveal accents without trailer-boom repetition.",
    motionPolicy: "Map moves, environmental reveals and clean match cuts; avoid random spectacle disconnected from the explained rule.",
    thumbnailPromise: "One iconic rule, artifact or unresolved canon connection.",
    musicProfile: "world_discovery",
  },
};

const GENRE_BLUEPRINT_IDS: Record<string, string> = {
  [VideoGenre.CINEMATIC_EPISODE]: "cinematic_episode",
  [VideoGenre.SATIRICAL_LIFE_AUTO]: "satirical_story",
  [VideoGenre.TRANSFORMATION_TIMELINE]: "satirical_story",
  [VideoGenre.CAREER_SOCIAL_DARKSIDE]: "satirical_story",
  [VideoGenre.DOWNFALL_CONSEQUENCE]: "satirical_story",
  [VideoGenre.DARK_COMEDY_TRAGEDY]: "satirical_story",
  [VideoGenre.HISTORY]: "evidence_documentary",
  Documentary: "evidence_documentary",
  News: "evidence_documentary",
  Architecture: "evidence_documentary",
  [VideoGenre.NARRATIVE_EXPLAINER]: "causal_explainer",
  Education: "causal_explainer",
  [VideoGenre.SCIENCE]: "causal_explainer",
  [VideoGenre.TRUE_CRIME]: "investigation",
  Review: "review_comparison",
  "Top List": "ranked_list",
  [VideoGenre.STORY_DRIVEN_VIDEO_ESSAY]: "human_story",
  [VideoGenre.STORYTELLING]: "human_story",
  [VideoGenre.CHARACTER_PSYCHOLOGY]: "reflective_analysis",
  [VideoGenre.PSYCHOLOGY]: "reflective_analysis",
  [VideoGenre.PHILOSOPHY]: "reflective_analysis",
  [VideoGenre.LORE_WORLD_BUILDING]: "world_lore",
};

export const resolveGenreEditorialBlueprint = (genre: string = ""): GenreEditorialBlueprint => BLUEPRINTS[GENRE_BLUEPRINT_IDS[genre] || "human_story"];

export const createGenreEditorialDirective = (genre: string = ""): string => {
  const blueprint = resolveGenreEditorialBlueprint(genre);
  return `[GLOBAL GENRE EDITORIAL BLUEPRINT — ${blueprint.id}]
- Narrative engine: ${blueprint.narrativeEngine}
- Visual grammar: ${blueprint.visualGrammar}
- Pacing: ${blueprint.pacing}
- Authentic-source policy: ${blueprint.sourcePolicy}
- Voice direction: ${blueprint.voiceDirection}
- Sound direction: ${blueprint.audioDirection}
- Motion and transition policy: ${blueprint.motionPolicy}
- Thumbnail promise: ${blueprint.thumbnailPromise}
Apply this blueprint to the exact topic and audience. Learn only transferable editorial principles from successful channels; never copy a creator's wording, recurring jokes, signature format, branding or visual identity.`;
};

export const listCoveredEditorialGenres = (): string[] => _.keys(GENRE_BLUEPRINT_IDS);
