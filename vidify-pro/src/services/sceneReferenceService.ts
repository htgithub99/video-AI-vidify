import _ from "lodash";
import { CharacterConfig, StoryboardScene, VisualConfig } from "../types";

export const SCENE_REFERENCE_CONFIG = {
  MAX_IMAGES: 3,
  MIN_IDENTITY_TOKEN_MATCHES: 3,
  MIN_IDENTITY_MATCH_RATIO: 0.18,
  MIN_IDENTITY_ANCHOR_MATCHES: 2,
  MIN_ANCHOR_TOKEN_RATIO: 0.6,
  MIN_TOKEN_LENGTH: 4,
  REFERENCE_DIRECTIVE_PREFIX: "Attached reference roles in upload order:",
  STYLE_ROLE:
    "use image {0} only for art style, proportions, line work, palette, and background treatment",
  CHARACTER_ROLE:
    "use image {0} to preserve the exact identity and outfit of {1}",
  SCENE_ROLE:
    "use image {0} for scene context and composition without copying unwanted text",
  SINGLE_FRAME_DIRECTIVE:
    "one continuous borderless frame, never a collage, split screen, contact sheet, storyboard panel, or duplicated subject",
  SUBJECT_COUNT_DIRECTIVE: "show exactly {0} primary subject{1}",
  NO_BACKGROUND_PEOPLE_DIRECTIVE:
    "no background people, crowd, silhouettes, or extra characters",
  NO_TEXT_DIRECTIVE:
    "no readable text, letters, numbers, signs, logos, signatures, or watermark",
} as const;

export interface SceneGenerationContext {
  characterIds: string[];
  prompt: string;
  referenceImages: string[];
  referenceRoles: string[];
}

const normalizeTokens = (value: string): string[] =>
  _.uniq(
    _.filter(_.words(_.toLower(value)), (token) =>
      _.gte(_.size(token), SCENE_REFERENCE_CONFIG.MIN_TOKEN_LENGTH),
    ),
  );
const getCharacterIdentityText = (character: CharacterConfig): string =>
  _.join(
    _.compact([
      character.name,
      character.prompt,
      character.description,
      character.hair,
      character.signatureClothing,
      character.accessories,
    ]),
    " ",
  );

const isCharacterMentioned = (
  sceneText: string,
  character: CharacterConfig,
): boolean => {
  if (_.includes(_.toLower(sceneText), _.toLower(character.name))) return true;
  const identityTokens = normalizeTokens(getCharacterIdentityText(character));
  const sceneTokens = normalizeTokens(sceneText);
  const identityAnchors = _.compact([
    character.hair,
    character.signatureClothing,
    character.accessories,
  ]);
  const anchorMatches = _.size(
    _.filter(identityAnchors, (anchor) => {
      const anchorTokens = normalizeTokens(anchor);
      return (
        !_.isEmpty(anchorTokens) &&
        _.gte(
          _.divide(
            _.size(_.intersection(anchorTokens, sceneTokens)),
            _.size(anchorTokens),
          ),
          SCENE_REFERENCE_CONFIG.MIN_ANCHOR_TOKEN_RATIO,
        )
      );
    }),
  );
  if (
    _.gte(
      anchorMatches,
      _.min([
        SCENE_REFERENCE_CONFIG.MIN_IDENTITY_ANCHOR_MATCHES,
        _.size(identityAnchors),
      ])!,
    )
  )
    return true;
  if (!_.isEmpty(identityAnchors)) return false;
  const matches = _.size(_.intersection(identityTokens, sceneTokens));
  const matchRatio = _.divide(matches, _.max([_.size(identityTokens), 1])!);
  return (
    _.gte(matches, SCENE_REFERENCE_CONFIG.MIN_IDENTITY_TOKEN_MATCHES) &&
    _.gte(matchRatio, SCENE_REFERENCE_CONFIG.MIN_IDENTITY_MATCH_RATIO)
  );
};

export const resolveSceneCharacterIds = (
  scene: Pick<
    StoryboardScene,
    "characterIds" | "prompt" | "script" | "subtitle"
  >,
  characters: CharacterConfig[],
): string[] => {
  const validIds = new Set(_.map(characters, "id"));
  const explicitIds = _.filter(_.uniq(scene.characterIds), (id) =>
    validIds.has(id),
  );
  if (!_.isEmpty(explicitIds)) return explicitIds;
  const sceneText = _.join(
    _.compact([scene.prompt, scene.script, scene.subtitle]),
    " ",
  );
  return _.map(
    _.filter(characters, (character) =>
      isCharacterMentioned(sceneText, character),
    ),
    "id",
  );
};

const addReference = (
  images: string[],
  roles: string[],
  image: string | undefined,
  roleTemplate: string,
  roleValue?: string,
): void => {
  if (
    _.isEmpty(image) ||
    _.includes(images, image) ||
    _.gte(_.size(images), SCENE_REFERENCE_CONFIG.MAX_IMAGES)
  )
    return;
  images.push(image!);
  const imageNumber = _.toString(_.size(images));
  roles.push(
    _.replace(
      _.replace(roleTemplate, "{0}", imageNumber),
      "{1}",
      roleValue || "character",
    ),
  );
};

const createConstraintDirectives = (scene: StoryboardScene): string[] => {
  const directives: string[] =
    scene.layout === "single_frame"
      ? [SCENE_REFERENCE_CONFIG.SINGLE_FRAME_DIRECTIVE]
      : [];
  if (_.gt(scene.expectedSubjectCount || 0, 0))
    directives.push(
      _.replace(
        _.replace(
          SCENE_REFERENCE_CONFIG.SUBJECT_COUNT_DIRECTIVE,
          "{0}",
          _.toString(scene.expectedSubjectCount),
        ),
        "{1}",
        _.isEqual(scene.expectedSubjectCount, 1) ? "" : "s",
      ),
    );
  if (_.isEqual(scene.allowBackgroundPeople, false))
    directives.push(SCENE_REFERENCE_CONFIG.NO_BACKGROUND_PEOPLE_DIRECTIVE);
  if (_.isEqual(scene.textAllowed, false))
    directives.push(SCENE_REFERENCE_CONFIG.NO_TEXT_DIRECTIVE);
  return directives;
};

export const createSceneGenerationContext = (
  scene: StoryboardScene,
  visualConfig: Pick<
    VisualConfig,
    "characters" | "sceneReferenceImages" | "styleReferenceImages"
  >,
): SceneGenerationContext => {
  const characters = _.defaultTo(visualConfig.characters, []);
  const characterIds = resolveSceneCharacterIds(scene, characters);
  const referencedCharacters = _.filter(characters, (character) =>
    _.includes(characterIds, character.id),
  );
  const images: string[] = [];
  const roles: string[] = [];
  addReference(
    images,
    roles,
    _.first(visualConfig.styleReferenceImages),
    SCENE_REFERENCE_CONFIG.STYLE_ROLE,
  );
  _.forEach(referencedCharacters, (character) =>
    addReference(
      images,
      roles,
      _.first(character.images),
      SCENE_REFERENCE_CONFIG.CHARACTER_ROLE,
      character.name,
    ),
  );
  _.forEach(visualConfig.sceneReferenceImages, (image) =>
    addReference(images, roles, image, SCENE_REFERENCE_CONFIG.SCENE_ROLE),
  );
  const referenceDirective = _.isEmpty(roles)
    ? ""
    : _.join(
        [
          SCENE_REFERENCE_CONFIG.REFERENCE_DIRECTIVE_PREFIX,
          _.join(roles, "; "),
        ],
        " ",
      );
  return {
    characterIds,
    prompt: _.join(
      _.compact([
        scene.prompt || scene.script,
        ...createConstraintDirectives(scene),
        referenceDirective,
      ]),
      ", ",
    ),
    referenceImages: images,
    referenceRoles: roles,
  };
};

export const createCanonicalCharacterPrompt = (
  character: CharacterConfig,
  style: string,
): string =>
  _.join(
    _.compact([
      style,
      `single full-body canonical design of ${character.prompt || character.description}`,
      "neutral standing pose facing camera, complete head, hands, torso, legs, and feet visible",
      "preserve one unambiguous hair silhouette, facial proportions, clothing colors, and accessories",
      "simple reference background compatible with the supplied style",
      SCENE_REFERENCE_CONFIG.SINGLE_FRAME_DIRECTIVE,
      SCENE_REFERENCE_CONFIG.NO_TEXT_DIRECTIVE,
      "full-body front view composition",
    ]),
    ", ",
  );
