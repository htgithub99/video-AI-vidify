import { MOTION_PATTERNS as MP } from "../../constants/motionPatterns.js";
import { MOTION_SOUND_CONFIG, MOTION_SOUND_EXISTING_PROMPT, MOTION_SOUND_PROMPT } from "../../constants/motionSound.js";
import { normalizeSoundEvents } from "../../lib/motionSound.js";
import { motionAudioDirection } from "../../lib/motionAudioDirection.js";
import type { MotionAudioDirection } from "../../types/motionVideo.js";
import { MOTION_AUDIO_DIRECTION } from "../../constants/motionAudioDirection.js";
import { motionSoundCatalogPrompt } from "./motionSfxLibraryService.js";
import { MOTION_REFERENCE_PROMPTS, MOTION_QA_MESSAGES } from "../../constants/motionReference.js";
import { needsMotionPreview } from "../../lib/motionReference.js";
import type { MotionSceneAssetKind, MotionStyleReference } from "../../types/motionVideo.js";
import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import { spawnSync } from "child_process";
import { createHash } from "crypto";
import { motionVideoGenreDirective } from "../../constants/motionGenre.js";
import { MOTION_STYLE_PRESET_KEY, motionStylePreset } from "../../constants/motionStylePresets.js";
import _ from "lodash";
import { MOTION_DRAW_BUDGET, MOTION_DRAW_KIND, MOTION_DRAW_LOG } from "../../constants/motionDrawBudget.js";
import { MOTION_ECONOMY_FALLBACK } from "../../constants/motionDrawEconomy.js";
import { createMotionDrawBudget, motionDrawLeft, motionDrawSpend, motionDrawSummary, type MotionDrawBudget } from "../../lib/motionDrawBudget.js";
import { motionFallbackCharacter, motionFallbackLocation, motionLocationGroups, motionMatchPlace, motionTrimRepeats, type MotionPlaceRef } from "../../lib/motionDrawEconomy.js";
import path from "path";
import { MOTION_PRODUCTION_BRIEF, productionBriefFor, productionLocationErrors, productionStaging, productionStagingErrors, separateMotionActors, focusMotionCameras } from "../../lib/motionProductionDesign.js";
import { bindVideoDnaSettings, hasAuthoredCharacter, sceneExecutionKey, scenePlanPrompt, scenePlanStagingErrors } from "../../lib/motionVideoDna.js";
import { MOTION_LIB_TEXT } from "../../constants/motionAssetLibrary.js";
import {
  MOTION_GEN_DRAW_MODE,
  MOTION_GEN_POSE_PROMPTS,
  MOTION_GEN_VOICE_TIMING,
  MOTION_GEN_ACTIONS_GUIDE,
  MOTION_GEN_BIBLE_PROMPT,
  MOTION_GEN_CONFIG,
  MOTION_GEN_DSL_EXAMPLE,
  MOTION_GEN_DSL_GUIDE,
  MOTION_GEN_GRADES,
  MOTION_GEN_LOCATION_FIX_PROMPT,
  MOTION_GEN_LOCATION_PROMPT,
  MOTION_GEN_LOCATIONS_ITEM,
  MOTION_GEN_LOCATIONS_PROMPT,
  MOTION_GEN_PREAMBLE,
  MOTION_GEN_STAGING_PROMPT,
} from "../../constants/motionGenPrompts.js";
import {
  MOTION_TEMPLATE_A_2,
  MOTION_TEMPLATE_AI_DAN_DUNG_CANH_VI_TRI_DONG_TAC,
  MOTION_TEMPLATE_AI_DAN_DUNG_LAI_CANH_CON_LOI,
  MOTION_TEMPLATE_AI_VE_BOI_CANH,
  MOTION_TEMPLATE_B_2,
  MOTION_TEMPLATE_BOI_CANH_KHOI_DEN,
  MOTION_TEMPLATE_CAST_2,
  MOTION_TEMPLATE_CENTRE_SIZE_X_Y_Z_TOP_Y,
  MOTION_TEMPLATE_CONTINUITY_THE_SHOT_BEFORE_THIS_GROUP_WAS_AT,
  MOTION_TEMPLATE_DAN_DUNG_LOI,
  MOTION_TEMPLATE_DUNG_ANH_XEM_TRUOC_CANH,
  MOTION_TEMPLATE_FILM_LOOK_GRADE,
  MOTION_TEMPLATE_FIX_REQUIRED,
  MOTION_TEMPLATE_FORMAT_ERRORS,
  MOTION_TEMPLATE_ID_LOCATION_TIME_SHOT_HINT_S_CAST_NARRATION,
  MOTION_TEMPLATE_LOC,
  MOTION_TEMPLATE_LOCATION_TIME,
  MOTION_TEMPLATE_LOOK,
  MOTION_TEMPLATE_MARKS,
  MOTION_TEMPLATE_OBJECTS_2,
  MOTION_TEMPLATE_R,
  MOTION_TEMPLATE_RENDER_ERROR,
  MOTION_TEMPLATE_STAGE_CENTRE_SIZE_X_Z_DEFAULT_CAMERA_POS,
  MOTION_TEMPLATE_SYMBOL_23,
  MOTION_TEMPLATE_SYMBOL_50,
  MOTION_TEMPLATE_SYMBOL_51,
  MOTION_TEMPLATE_SYMBOL_52,
  MOTION_TEMPLATE_USER_NOTE,
  MOTION_TEMPLATE_VE_BOI_CANH,
  MOTION_TEXT_16_9,
  MOTION_TEXT_AI_THIET_KE_TRANG_PHUC_MA_NO_CANH,
  MOTION_TEXT_BEATS,
  MOTION_TEXT_BIBLE,
  MOTION_TEXT_BOX,
  MOTION_TEXT_CANCELLED,
  MOTION_TEXT_CAPSULE,
  MOTION_TEXT_CAST,
  MOTION_TEXT_CHAPTERID,
  MOTION_TEXT_CLEAN,
  MOTION_TEXT_CONE,
  MOTION_TEXT_CYLINDER,
  MOTION_TEXT_DAY,
  MOTION_TEXT_DONE,
  MOTION_TEXT_DRAFT,
  MOTION_TEXT_END,
  MOTION_TEXT_ESTABLISHING_SHOTS,
  MOTION_TEXT_EXTERIOR,
  MOTION_TEXT_EXTRUDE,
  MOTION_TEXT_FOLLOW_THE_NARRATION,
  MOTION_TEXT_GEN3D,
  MOTION_TEXT_GEN_RUNID,
  MOTION_TEXT_GROUP,
  MOTION_TEXT_HIGH,
  MOTION_TEXT_ID,
  MOTION_TEXT_LIGHT,
  MOTION_TEXT_LOCATION,
  MOTION_TEXT_LOCATIONS,
  MOTION_TEXT_MALE,
  MOTION_TEXT_MEDIUM,
  MOTION_TEXT_NEUTRAL,
  MOTION_TEXT_NOBODY,
  MOTION_TEXT_NONE,
  MOTION_TEXT_NONE_NAMED,
  MOTION_TEXT_PLACE,
  MOTION_TEXT_PLANE,
  MOTION_TEXT_PREVIEW,
  MOTION_TEXT_REPEAT,
  MOTION_TEXT_REVIEW,
  MOTION_TEXT_RUNID,
  MOTION_TEXT_SCENE,
  MOTION_TEXT_SPHERE,
  MOTION_TEXT_STAGING,
  MOTION_TEXT_SYMBOL_14,
  MOTION_TEXT_SYMBOL_16,
  MOTION_TEXT_SYMBOL_25,
  MOTION_TEXT_SYMBOL_27,
  MOTION_TEXT_SYMBOL_37,
  MOTION_TEXT_SYMBOL_41,
  MOTION_TEXT_THIS_BEAT_WAS_MISSING_FROM_YOUR_ANSWER,
  MOTION_TEXT_TOON_CAT_INTERIOR,
  MOTION_TEXT_USE,
  MOTION_TEXT_WIDE,
} from "../../constants/motionRuntime.js";
import { cloneJson, stringifyJson } from "../../lib/jsonStringify.js";
import { planningPrompt, productionPreamble } from "../../lib/motionDirection.js";
import { getMotionErrorSummary, roundMotionNumber as r2 } from "../../lib/motionUtils.js";
import type { MotionAiExecution, MotionBeat, MotionCastMember, MotionGenState, MotionPlace, MotionReferenceStyle, MotionSceneCustomItem, MotionSceneStyleSet, MotionSpec, MotionStyleCalibration, MotionStoryAnalysis, MotionStoryScript, MotionVoiceTiming } from "../../types/motionVideo.js";
import { ensureLibraryModel, ensureMotionLibrary, libraryCandidates, libraryPromptList } from "./motionAssetLibraryService.js";
import { estimateBeatSeconds, sceneShots } from "./motionDirectorService.js";
import { validateGenLocation, validateGenCharacter, validateGenStaging } from "./motionEngineService.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import { openStillSession, type MotionStillSession } from "./motionRenderService.js";
import { analyzeMotionReferenceStyleFresh, mapMotionAiPool, releaseMotionAiSession, resolveMotionReferenceStyle, reviewMotionStyleCalibration, runMotionAi, type MotionAiImage } from "./motionStoryService.js";
import { storeMotionReferenceStyle } from "./motionReferenceCacheService.js";
import { getFfmpegPath } from "./shortsPreprocessService.js";
import { runMotionDrawTask } from "./motionDrawRoutingService.js";
import { MOTION_POSES } from "../../constants/motionPoses.js";
import { motionCastNeeds, motionCastSummary, motionPartOutline, motionPoseNamesIn, motionPoseRule, motionProceduralPose, motionSanitizePoses, type MotionCastNeeds } from "../../lib/motionPoses.js";
import { motionEnforceStyle, motionStyleConstraints, motionStyleHasPart, motionStyleRules, type MotionStyleConstraints } from "../../lib/motionStyleConstraints.js";
import { mergeMotionStyleMetrics, motionTemplateFits, motionCalibrationCast, motionCalibrationSet, motionFitCharacter, motionFitFlatLocation, motionFlatCamera, motionMetricsText } from "../../lib/motionStyleMetrics.js";
import { MOTION_STYLE_CALIBRATION, MOTION_STYLE_CALIBRATION_SET, MOTION_STYLE_METRICS_LOG, MOTION_STYLE_METRICS_PROMPT } from "../../constants/motionStyleMetrics.js";
import { MOTION_STYLE_AXIS, MOTION_STYLE_LOG, MOTION_STYLE_PART, MOTION_STYLE_SHADED, MOTION_STYLE_SILHOUETTE } from "../../constants/motionStyleConstraints.js";
import { motionCharacterSchema } from "../../constants/motionSceneCatalog.js";
import { MOTION_SCENE_LIBRARY, MOTION_SCENE_LIBRARY_PROMPT } from "../../constants/motionSceneLibrary.js";
import { MOTION_SCENE_CATALOG_PROMPT, MOTION_SCENE_LIBRARY_MODES, MOTION_SCENE_SHOWROOM, motionSceneType, type MotionSeedCast, type MotionSeedPlace, type MotionSeedProp } from "../../constants/motionSceneCatalog.js";
import { applyCharacterVariant } from "../../lib/motionCharacterVariant.js";
import { MOTION_COSTUME } from "../../constants/motionCostume.js";
import { MOTION_LIBRARY_FIT, MOTION_LIBRARY_LOG } from "../../constants/motionSceneTraits.js";
import { motionApplyCostume } from "../../lib/motionCostume.js";
import { motionRedressLocation } from "../../lib/motionRedress.js";
import { motionTraitsFit, motionTraitsLabel } from "../../lib/motionSceneTraits.js";
import { motionAutoSoundEvents } from "../../lib/motionSound.js";
import { motionQaReport } from "../../lib/motionQa.js";
import {
  assignSceneLibrary,
  baseRedressProps,
  baseWardrobe,
  motionMemberCostume,
  motionMemberTraits,
  motionPlaceFit,
  motionPlaceTraits,
  motionStoryTraits,
  motionStripForeignParts,
  sceneAssetTraits,
  readBaseLibrary,
  attachSceneProps,
  extractSceneProps,
  pendingBaseLibrary,
  findSameSceneAsset,
  findSceneIdentity,
  sceneAssetFingerprint,
  getSceneAsset,
  listSceneAssets,
  motionAssetStyleKey,
  readSceneStyle,
  sceneStyleCalibrationPath,
  sceneStyleReferences,
  saveSceneAsset,
  saveSceneStyle,
  sceneAssetThumbPath,
  sceneStyleFits,
  scenePropCatalog,
  sharedStyleKeyOf,
  touchSceneAssets,
  type MotionBaseLibrary,
} from "./motionSceneLibraryService.js";
import { MOTION_STORY_CONFIG } from "../../constants/motionVideo.js";
import { MOTION_STYLE_PREVIEW, motionStyleFinish } from "../../constants/motionStyleFinish.js";
export interface GenOptions {
  audioDirection?: MotionAudioDirection;
  styleReferences?: MotionStyleReference[];
  referenceKey?: string;
  referenceImages?: MotionAiImage[];
  characterMotion?: boolean;
  exec: MotionAiExecution;
  mainExec?: MotionAiExecution;
  signal?: AbortSignal;
  log: (s: string) => void;
  progress?: (p: number, stage?: string) => void;
  partial?: (r: unknown) => void;
  aspect?: string;
  onlyBeats?: string[];
  onlyLocations?: string[];
  restyle?: boolean;
  note?: string;
  review?: boolean;
  skipPreviews?: boolean;
  drawingMode?: "2d" | "3d";
  openingBeatId?: string;
  preamble?: string;
  ai?: typeof runMotionAi;
  runId?: string;
  voiceTiming?: Promise<MotionVoiceTiming | undefined>;
  drawBudget?: MotionDrawBudget;
}
export const emptyGen = (): MotionGenState => ({ style: {}, cast: {}, locations: {}, locationInfo: {}, staging: {}, previews: {}, failed: [] });
export const prepareMotionGen = (previous: MotionGenState | undefined, analysis: MotionStoryAnalysis, drawingMode: "2d" | "3d" = MR.MOTION_TEXT_3D, referenceKey: string = MR.MOTION_TEXT_EMPTY): MotionGenState => {
  const characterMode = MR.MOTION_TEXT_DRAWN;
  const signature = createHash(MR.MOTION_TEXT_SHA256)
    .update(JSON.stringify({ previewVersion: 5, referenceDrawingVersion: analysis.referenceStyle?.kit ? 1 : undefined, referenceKey, referenceStyle: analysis.referenceStyle, blueprint: analysis.videoDna || analysis.creativeBlueprint, cast: analysis.cast, places: analysis.places, era: analysis.era, look: analysis.look, characterMode, drawingMode }))
    .digest(MR.MOTION_TEXT_HEX);
  const compatible = previous?.creativeSignature === signature;
  return { ...emptyGen(), ...(compatible ? cloneJson(previous || {}) : {}), ...(previous?.voiceCast ? { voiceCast: { ...previous.voiceCast } } : {}), creativeSignature: signature, referenceKey, characterMode, drawingMode, videoDna: analysis.videoDna };
};
const previewRoot = (): string => {
  const dir = path.join(getMotionRootDirectory(), MOTION_GEN_CONFIG.PREVIEW_FOLDER);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
export const genPreviewRel = (file: string): string => path.relative(previewRoot(), file).split(path.sep).join(MOTION_TEXT_SYMBOL_16);
export const resolveGenPreview = (rel: string): string | null => {
  const root = path.resolve(previewRoot());
  const file = path.resolve(root, _.toString(rel));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return null;
  return file;
};
const runId = (script: MotionStoryScript, o?: GenOptions): string => (o && o.runId) || _.toString(_.get(script, MOTION_TEXT_GEN_RUNID)) || String(Date.now().toString(36));
const aborted = (o: GenOptions) => {
  if (o.signal?.aborted) throw new Error(MOTION_TEXT_CANCELLED);
};
const poolLimit = (exec: MotionAiExecution): number => (_.includes(MOTION_GEN_CONFIG.SERIAL_PROVIDERS, exec.provider) ? 1 : MOTION_STORY_CONFIG.AI_PARALLEL);
const drawLimit = (o: GenOptions): number => poolLimit(o.exec);
const talkExec = (o: GenOptions): MotionAiExecution => o.mainExec || o.exec;
const storyLine = (a: MotionStoryAnalysis): string => MOTION_TEMPLATE_SYMBOL_50(String(a.title), String(a.logline));
const castLines = (a: MotionStoryAnalysis): string => _.map(a.cast, (c) => MOTION_TEMPLATE_LOOK(String(c.key), String(c.gender || MOTION_TEXT_MALE), String(c.name), String(c.role || MR.MOTION_TEXT_EMPTY), String(c.look || c.description || MOTION_TEXT_SYMBOL_25))).join(MOTION_TEXT_SYMBOL_27);
const kitRenderStyle = (analysis: MotionStoryAnalysis, drawingMode?: string): Partial<MotionGenState["style"]> => {
  if (!analysis.referenceStyle?.kit) return {};
  const constraints = motionStyleConstraints(analysis.referenceStyle, drawingMode);
  return _.omitBy({ outlineSilhouette: constraints.outline.kind === MOTION_STYLE_SILHOUETTE, faceShading: _.includes(MOTION_STYLE_SHADED, constraints.shading.kind), outlineWidth: constraints.outline.width, framing: constraints.framing, flatCamera: motionFlatCamera(analysis.referenceStyle, drawingMode) }, _.isUndefined) as Partial<MotionGenState["style"]>;
};
const applyReferenceRenderStyle = (analysis: MotionStoryAnalysis, gen: MotionGenState): void => {
  if (!analysis.referenceStyle) return;
  gen.style = { ...gen.style, grade: MOTION_TEXT_NEUTRAL, notes: _.truncate(analysis.referenceStyle.description, { length: 200 }), palette: [...(analysis.referenceStyle.palette || [])], outlineColor: analysis.referenceStyle.outlineColor, outlineWidth: analysis.referenceStyle.outlineWidth, ...kitRenderStyle(analysis, gen.drawingMode) };
};
const fitStyledCharacter = (design: any, name: string, analysis: MotionStoryAnalysis, gen: MotionGenState, constraints: MotionStyleConstraints, log: (line: string) => void, type?: string): any => {
  const fit = motionFitCharacter(design, analysis.referenceStyle, constraints, gen.drawingMode, !!motionSceneType(type)?.animal);
  if (!fit.template && !fit.changes.length) return design;
  const checked = validateGenCharacter(fit.design).value;
  if (!hasAuthoredCharacter(checked) || _.isEqual(checked, design)) return design;
  log(fit.template ? MOTION_STYLE_METRICS_LOG.TEMPLATE(name) : MOTION_STYLE_METRICS_LOG.FACE_FIT(name, fit.changes.join(MR.MOTION_TEXT_SYMBOL_41)));
  return checked;
};
const fitStyledLocation = (location: any, name: string, referenceStyle: MotionReferenceStyle | undefined, drawingMode: string | undefined, log: (line: string) => void): any => {
  const fit = motionFitFlatLocation(location, referenceStyle, drawingMode);
  if (!fit.changes.length) return location;
  const checked = validateGenLocation(fit.location);
  if (!checked.value?.nodes?.length) return location;
  log(MOTION_STYLE_METRICS_LOG.LOCATION_FIT(name, fit.changes.join(MR.MOTION_TEXT_SYMBOL_41)));
  return checked.value;
};
const restyleExistingDesigns = (script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: MotionGenState, log: (line: string) => void): void => {
  if (!analysis.referenceStyle?.metrics) return;
  applyReferenceRenderStyle(analysis, gen);
  const constraints = motionStyleConstraints(analysis.referenceStyle, gen.drawingMode);
  for (const c of analysis.cast) if (hasAuthoredCharacter(gen.cast[c.key])) gen.cast[c.key] = fitStyledCharacter(gen.cast[c.key], c.name, analysis, gen, constraints, log, c.type);
  for (const place of analysis.places) {
    const before = gen.locations[place.key];
    if (!before) continue;
    const after = fitStyledLocation(before, place.name, analysis.referenceStyle, gen.drawingMode, log);
    if (after === before) continue;
    gen.locations[place.key] = after;
    for (const beat of script.beats) if (beat.place === place.key) delete gen.previews[beat.id];
  }
};
const LEGACY_CHARACTER_KEYS = [MR.MOTION_TEXT_DRAWNBODY, MR.MOTION_TEXT_SOCKET, MR.MOTION_TEXT_LAYERS, MR.MOTION_TEXT_BUILD, MR.MOTION_TEXT_BODY];
const characterNodes = (nodes: any[], materials: Record<string, any>): any[] =>
  (Array.isArray(nodes) ? nodes : []).map((node) => ({
    ...node,
    ...(!node?.shape && typeof node?.type === MR.MOTION_TEXT_STRING ? { shape: node.type } : {}),
    ...(typeof node?.mat === MR.MOTION_TEXT_STRING && materials[node.mat] ? { mat: materials[node.mat], ...(node.name ? {} : { name: node.mat }) } : {}),
    ...(node?.children ? { children: characterNodes(node.children, materials) } : {}),
    ...(node?.node ? { node: characterNodes([node.node], materials)[0] } : {}),
  }));
export const designBible = async (analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions, needs: Record<string, MotionCastNeeds> = {}): Promise<void> => {
  applyReferenceRenderStyle(analysis, gen);
  o.log(MOTION_TEXT_AI_THIET_KE_TRANG_PHUC_MA_NO_CANH);
  const preamble = o.preamble ? MR.MOTION_TEMPLATE_SYMBOL_147(o.preamble, MR.MOTION_TEXT_EMPTY, MOTION_PRODUCTION_BRIEF) : MR.MOTION_TEMPLATE_SYMBOL_147(MOTION_GEN_PREAMBLE, planningPrompt(analysis), MOTION_PRODUCTION_BRIEF);
  const constraints = motionStyleConstraints(analysis.referenceStyle, gen.drawingMode);
  const rules = motionStyleRules(constraints);
  const schema = constraints.present ? motionCharacterSchema({ hair: motionStyleHasPart(constraints, MOTION_STYLE_PART.HAIR), clothing: _.includes(constraints.variation, MOTION_STYLE_AXIS.CLOTHING), accessories: _.includes(constraints.variation, MOTION_STYLE_AXIS.ACCESSORIES) }) : MOTION_SCENE_CATALOG_PROMPT.CHARACTER_SCHEMA;
  const poseRule = motionPoseRule(constraints);
  let styled = false;
  const todo = o.restyle ? analysis.cast : _.filter(analysis.cast, (c) => !hasAuthoredCharacter(gen.cast[c.key]));
  await mapMotionAiPool(
    _.chunk(todo, MOTION_GEN_CONFIG.BIBLE_BATCH),
    async (batch) => {
      let open = batch.slice();
      await runMotionDrawTask({
        task: _.map(batch, MR.MOTION_TEXT_KEY).join(MR.MOTION_TEXT_SYMBOL_14),
        exec: o.exec,
        signal: o.signal,
        log: o.log,
        ...(o.drawBudget ? { maxAttempts: MOTION_DRAW_BUDGET.PER_CHARACTER_BATCH } : {}),
        ...drawGate(o),
        attempt: async (exec) => {
          aborted(o);
          const keys = _.map(open, MR.MOTION_TEXT_KEY);
          const others = _.filter(analysis.cast, (other) => !_.includes(keys, other.key));
          const wanted = _.compact(_.map(open, (c) => (needs[c.key] ? MOTION_GEN_POSE_PROMPTS.NEEDS(c.key, needs[c.key]) : undefined))).join(MOTION_TEXT_SYMBOL_27);
          const castText = (open.length > 1 ? MOTION_GEN_CONFIG.BATCH_CAST : MR.MOTION_TEXT_EMPTY) + castLines({ ...analysis, cast: open }) + (wanted ? MOTION_TEXT_SYMBOL_27 + wanted : MR.MOTION_TEXT_EMPTY) + (others.length ? MOTION_TEXT_SYMBOL_27 + MOTION_GEN_CONFIG.OTHER_CAST + castLines({ ...analysis, cast: others }) : MR.MOTION_TEXT_EMPTY);
          const request = [MOTION_GEN_BIBLE_PROMPT({ preamble, story: storyLine(analysis), era: analysis.era || MR.MOTION_TEXT_EMPTY, look: analysis.look, cast: castText, rules }), poseRule, schema, MOTION_REFERENCE_PROMPTS.DRAW_STYLE(analysis.referenceStyle, MR.MOTION_TEXT_CHARACTER, gen.drawingMode)].filter(Boolean).join(MOTION_TEXT_SYMBOL_27);
          if (!motionDrawSpend(o.drawBudget, MOTION_DRAW_KIND.CHARACTER, request.length)) throw new Error(MOTION_DRAW_LOG.EXHAUSTED(keys.join(MR.MOTION_TEXT_SYMBOL_14)));
          const raw = await (o.ai || runMotionAi)(request, MOTION_GEN_CONFIG.ARTIFACT_BIBLE, exec, o.signal, o.log);
          if (!raw) return undefined;
          const failed: typeof open = [];
          for (const c of open) {
            const rawDesign = _.get(raw, [MOTION_TEXT_CAST, c.key]) || (open.length === 1 && _.size(raw.cast) === 1 ? _.values(raw.cast)[0] : undefined);
            if (!rawDesign) {
              o.log(MR.MOTION_TEMPLATE_CHARACTER_SCHEMA_MISMATCH_ROOT_FIELDS_CAST_KEYS_EXPECTED(Object.keys(raw).join(MR.MOTION_TEXT_SYMBOL_14), Object.keys(raw.cast || {}).join(MR.MOTION_TEXT_SYMBOL_14), c.key));
              failed.push(c);
              continue;
            }
            const legacy = LEGACY_CHARACTER_KEYS.filter((key) => key in rawDesign);
            if (legacy.length && !Array.isArray(rawDesign.parts)) {
              o.log(MOTION_TEMPLATE_CAST_2(String(c.key), MOTION_GEN_CONFIG.LEGACY_SCHEMA + legacy.join(MR.MOTION_TEXT_SYMBOL_14)));
              failed.push(c);
              continue;
            }
            if (!styled && raw.style && (o.restyle || _.isEmpty(gen.style))) {
              styled = true;
              gen.style = {
                grade: !analysis.referenceStyle?.kit && _.includes(MOTION_GEN_GRADES, raw.style.grade) ? raw.style.grade : MOTION_TEXT_NEUTRAL,
                notes: _.truncate(_.toString(raw.style.notes || MR.MOTION_TEXT_EMPTY), { length: 200 }),
                outlineColor: analysis.referenceStyle?.outlineColor,
                outlineWidth: analysis.referenceStyle?.outlineWidth,
                ...kitRenderStyle(analysis, gen.drawingMode),
              };
            }
            const materials = { ...(raw.materials || {}), ...(rawDesign.materials || {}) };
            const selected = { ...rawDesign, ...(rawDesign.parts ? { parts: rawDesign.parts.map((p: any) => ({ ...p, nodes: characterNodes(p.nodes, materials) })) } : {}) };
            const v = validateGenCharacter(selected);
            if (!hasAuthoredCharacter(v.value)) {
              o.log(MOTION_TEMPLATE_CAST_2(String(c.key), String(_.take(v.errors, 3).join(MOTION_TEXT_SYMBOL_41))));
              failed.push(c);
              continue;
            }
            if (v.errors.length) o.log(MOTION_TEMPLATE_CAST_2(String(c.key), String(_.take(v.errors, 3).join(MOTION_TEXT_SYMBOL_41))));
            const enforced = motionEnforceStyle(v.value, constraints);
            if (enforced.changes.length) o.log(MOTION_STYLE_LOG.ENFORCED(c.name, enforced.changes.join(MR.MOTION_TEXT_SYMBOL_41)));
            gen.cast[c.key] = fitStyledCharacter(enforced.design, c.name, analysis, gen, constraints, o.log, c.type);
          }
          open = failed;
          return open.length ? undefined : true;
        },
      }).catch((error) => {
        if (o.signal?.aborted || !o.drawBudget) throw error;
        const bodies = _.toString(analysis.referenceStyle?.kit?.character?.clothing).match(MOTION_ECONOMY_FALLBACK.CLOTHING_HEX) || [];
        for (const c of open) {
          o.log(MOTION_DRAW_LOG.FALLBACK_CAST(c.name));
          const design = validateGenCharacter(motionFallbackCharacter(constraints, _.findIndex(analysis.cast, { key: c.key }), gen.style.palette || analysis.referenceStyle?.palette, bodies, gen.drawingMode)).value;
          gen.cast[c.key] = fitStyledCharacter(motionEnforceStyle(design, constraints).design, c.name, analysis, gen, constraints, o.log, c.type);
        }
      });
    },
    drawLimit(o),
  );
  if (!styled && _.isEmpty(gen.style)) gen.style = { grade: MOTION_TEXT_NEUTRAL, notes: MR.MOTION_TEXT_EMPTY, outlineColor: analysis.referenceStyle?.outlineColor, outlineWidth: analysis.referenceStyle?.outlineWidth, ...kitRenderStyle(analysis, gen.drawingMode) };
};
const beatSeconds = (b: MotionBeat, lang: string): number => _.clamp(b.duration || estimateBeatSeconds(b, lang) + 0.4, 2.5, 14);
const usesOf = (key: string, script: MotionStoryScript): string =>
  _.map(
    _.take(
      _.filter(script.beats, (b) => b.visual === MOTION_TEXT_SCENE && b.place === key),
      10,
    ),
    (b) => MOTION_TEMPLATE_SYMBOL_23(MR.MOTION_TEMPLATE_SYMBOL_152(b.action || b.narration, scenePlanPrompt(b.scenePlan))),
  ).join(MOTION_TEXT_SYMBOL_27) || MOTION_TEXT_ESTABLISHING_SHOTS;
const genSpec = (gen: MotionGenState, locations: Record<string, unknown>, shots: MotionSpec["shots"], aspect: string = MOTION_TEXT_16_9): MotionSpec =>
  ({ aspect, fps: 30, fadeIn: 0, fadeOut: 0, look: MOTION_TEXT_CLEAN, gen: { characterMotion: gen.characterMotion, characterMode: gen.characterMode, videoDna: gen.videoDna, drawingMode: gen.drawingMode, style: gen.style, cast: gen.cast, locations }, shots, subtitles: [], duration: _.max(_.map(shots, MOTION_TEXT_END)) || 4 }) as MotionSpec;
const reverseCamera = (L: any) => {
  const c = L.stage.center;
  const p = L.camera.pos,
    t = L.camera.target;
  const dx = p[0] - t[0],
    dz = p[2] - t[2];
  const d = Math.max(4, Math.hypot(dx, dz));
  return { pos: [c[0] - (dx / Math.hypot(dx, dz || 1e-3)) * d * 0.9, Math.max(1.6, p[1]), c[1] - (dz / Math.hypot(dx || 1e-3, dz)) * d * 0.9], target: [c[0], 1.2, c[1]], fov: 50 };
};
const renderLocation = async (session: MotionStillSession, gen: MotionGenState, key: string, L: any, dir: string, tag: string): Promise<{ files: string[]; issues: string[] }> => {
  const shotA = { id: MOTION_TEMPLATE_A_2(String(tag)), start: 0, end: 4, template: MOTION_TEXT_GEN3D, params: { location: key, actors: [], cameras: [{ shot: MOTION_TEXT_WIDE, pos: L.camera.pos, target: L.camera.target, fov: L.camera.fov }] } };
  const shotB = { id: MOTION_TEMPLATE_B_2(String(tag)), start: 0, end: 4, template: MOTION_TEXT_GEN3D, params: { location: key, actors: [], cameras: [{ shot: MOTION_TEXT_WIDE, ...reverseCamera(L) }] } };
  const out: { files: string[]; issues: string[] } = { files: [], issues: [] };
  for (const sh of [shotA, shotB]) {
    const r = await session.render(genSpec(gen, { [key]: L }, [sh], MOTION_TEXT_16_9), [{ id: sh.id, t: 1.2 }], dir, { width: MOTION_GEN_CONFIG.REVIEW_WIDTH, height: MOTION_GEN_CONFIG.REVIEW_HEIGHT, quality: MOTION_TEXT_HIGH });
    out.files.push(r[0].file);
    out.issues.push(...r[0].issues);
  }
  return out;
};
const modelRefs = (L: any): string[] => {
  const refs = new Set<string>();
  const visit = (list: any[]) =>
    _.forEach(list, (n: any) => {
      if (!n) return;
      if (n.shape === MOTION_LIB_TEXT.MODEL && _.startsWith(n.ref, MOTION_LIB_TEXT.PH_PREFIX)) refs.add(n.ref);
      if (n.children) visit(n.children);
      if (n.node) visit([n.node]);
    });
  visit(L?.nodes || []);
  _.forEach(L?.defs || {}, (d: any[]) => visit(d));
  return [...refs];
};
const materializeModels = async (L: any, o: GenOptions): Promise<any> => {
  const failed = new Set<string>();
  for (const ref of modelRefs(L)) {
    aborted(o);
    try {
      await ensureLibraryModel(ref, o.log, o.signal);
    } catch (e) {
      failed.add(ref);
      o.log(MOTION_LIB_TEXT.PH_DROPPED(ref, getMotionErrorSummary(e)));
    }
  }
  if (!failed.size) return L;
  const prune = (list: any[]): any[] => _.compact(_.map(list, (n: any) => (n?.shape === MOTION_LIB_TEXT.MODEL && failed.has(n.ref) ? null : n?.children ? { ...n, children: prune(n.children) } : n)));
  return { ...L, nodes: prune(L.nodes || []), defs: _.mapValues(L.defs || {}, prune) };
};
const libraryFor = (place: MotionPlace, uses: string, era: string): string => {
  const items = libraryCandidates([place.name, place.description, uses, era].join(MOTION_LIB_TEXT.SPACE));
  return items.length ? libraryPromptList(items) : MOTION_LIB_TEXT.NO_LIBRARY;
};
const locationSetup = (place: MotionPlace, script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions) => {
  const uses = usesOf(place.key, script);
  const flat = gen.drawingMode === MR.MOTION_TEXT_2D;
  const styleKey = gen.assetStyleKey || MR.MOTION_TEXT_EMPTY;
  const useLibrary = analysis.libraryMode !== MOTION_SCENE_LIBRARY_MODES.OFF;
  return {
    dir: path.join(previewRoot(), runId(script, o), MOTION_TEMPLATE_LOC(String(place.key))),
    uses,
    productionBrief: o.preamble ? productionBriefFor(place, uses) : MR.MOTION_TEMPLATE_SYMBOL_156(planningPrompt(analysis), productionBriefFor(place, uses)),
    flat,
    dslGuide: flat ? MOTION_GEN_DSL_GUIDE.replace(MOTION_GEN_DRAW_MODE.GUIDE_HEAD_3D, MOTION_GEN_DRAW_MODE.GUIDE_HEAD_2D) : MOTION_GEN_DSL_GUIDE,
    precedence: motionStyleRules(motionStyleConstraints(analysis.referenceStyle, gen.drawingMode)).precedence,
    style: MOTION_TEMPLATE_FILM_LOOK_GRADE(String(analysis.look), String(gen.style.notes || MR.MOTION_TEXT_EMPTY), String(gen.style.grade || MOTION_TEXT_NEUTRAL)),
    styleKey,
    useLibrary,
    referenceStyle: analysis.referenceStyle,
    drawingMode: gen.drawingMode,
    library: _.compact([useLibrary ? libraryFor(place, uses, analysis.era || MR.MOTION_TEXT_EMPTY) : MR.MOTION_TEXT_EMPTY, useLibrary && styleKey ? scenePropCatalog(styleKey, [place.name, place.description, uses].join(MOTION_SCENE_LIBRARY.TEXT.NEWLINE)) : MR.MOTION_TEXT_EMPTY, MOTION_SCENE_LIBRARY_PROMPT.LOCATION_DEFS]).join(MOTION_TEXT_SYMBOL_27),
  };
};
type LocationSetup = ReturnType<typeof locationSetup>;
const locationExample = (setup: LocationSetup): string => (setup.flat ? MOTION_GEN_DRAW_MODE.EXAMPLE_NOTE_2D + MOTION_TEXT_SYMBOL_27 + MOTION_GEN_DSL_EXAMPLE : MOTION_GEN_DSL_EXAMPLE);
const locationRequest = (prompt: string, setup: LocationSetup, analysis: MotionStoryAnalysis, gen: MotionGenState): string => [prompt, setup.precedence, MOTION_REFERENCE_PROMPTS.DRAW_STYLE(analysis.referenceStyle, MR.MOTION_TEXT_LOCATION, gen.drawingMode)].filter(Boolean).join(MOTION_TEXT_SYMBOL_27);
const acceptLocation = async (place: MotionPlace, raw: any, setup: LocationSetup, o: GenOptions): Promise<any> => {
  const props = setup.useLibrary && setup.styleKey ? attachSceneProps(raw, setup.styleKey) : [];
  if (props.length) o.log(MOTION_SCENE_LIBRARY.LOGS.PROPS_ADDED(props.join(MOTION_SCENE_LIBRARY.TEXT.LIST)));
  const first = validateGenLocation(raw);
  const instances = first.stats?.instances || 0;
  const fitted = motionTrimRepeats(raw, instances);
  let v = _.isEqual(fitted, raw) ? first : validateGenLocation(fitted);
  if (v.stats?.instances !== instances || v.errors.length < first.errors.length) o.log(MOTION_DRAW_LOG.REPEATS_TRIMMED(place.name, instances, v.stats?.instances || 0));
  if (v.errors.length > first.errors.length) v = first;
  const suggestions = productionLocationErrors(v.value);
  if (suggestions.length) o.log(MOTION_QA_MESSAGES.ADVISORY(suggestions));
  if (v.errors.length) o.log(MR.MOTION_TEMPLATE_GEOMETRY_CORRECTIONS(v.errors.slice(0, 4).join(MR.MOTION_TEXT_SYMBOL_41)));
  if (!v.value?.nodes?.length || (v.stats?.instances || 0) > MOTION_DRAW_BUDGET.MAX_INSTANCES) return undefined;
  if (v.errors.length) o.log(MOTION_DRAW_LOG.SALVAGED(place.name, v.errors.length));
  const ready = await materializeModels(fitStyledLocation(v.value, place.name, setup.referenceStyle, setup.drawingMode, o.log), o);
  o.log(MOTION_TEMPLATE_BOI_CANH_KHOI_DEN(String(place.name), String(v.stats?.nodes || 0), String(v.stats?.lights || 0), MR.MOTION_TEXT_EMPTY));
  return ready;
};
const storeLocation = async (place: MotionPlace, value: any, setup: LocationSetup, gen: MotionGenState, session: MotionStillSession, o: GenOptions): Promise<void> => {
  const shots = await renderLocation(session, gen, place.key, value, setup.dir, MOTION_TEMPLATE_R(String(1)));
  gen.locations[place.key] = value;
  gen.locationInfo[place.key] = { files: _.map(shots.files, genPreviewRel), issues: [], at: new Date().toISOString() };
  o.partial?.(null);
};
const fallbackLocation = (place: MotionPlace, analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions): any => {
  o.log(MOTION_DRAW_LOG.EXHAUSTED(place.name));
  return validateGenLocation(motionFallbackLocation(place, gen.style.palette || analysis.referenceStyle?.palette)).value;
};
const drawGate = (o: GenOptions) => (o.drawBudget ? { canAttempt: () => motionDrawLeft(o.drawBudget) > 0 } : {});
export const designLocation = async (place: MotionPlace, script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: MotionGenState, session: MotionStillSession, o: GenOptions): Promise<void> => {
  const setup = locationSetup(place, script, analysis, gen, o);
  if (gen.assetSources) delete gen.assetSources[MOTION_SCENE_LIBRARY.SOURCE_PLACE + place.key];
  const previous = o.note && gen.locations[place.key] ? gen.locations[place.key] : null;
  const prompt = previous
    ? MOTION_GEN_LOCATION_FIX_PROMPT({
        preamble: o.preamble || MOTION_GEN_PREAMBLE,
        guide: MR.MOTION_TEMPLATE_SYMBOL_162(setup.productionBrief, setup.dslGuide),
        kind: setup.flat ? MOTION_GEN_DRAW_MODE.KIND_2D : MOTION_GEN_DRAW_MODE.KIND_3D,
        library: setup.library,
        key: place.key,
        description: place.description,
        previous: stringifyJson(previous),
        issues: MOTION_TEMPLATE_SYMBOL_23(String(o.note)),
      })
    : MOTION_GEN_LOCATION_PROMPT({
        preamble: o.preamble || MOTION_GEN_PREAMBLE,
        guide: MR.MOTION_TEMPLATE_SYMBOL_160(setup.productionBrief, setup.dslGuide),
        example: locationExample(setup),
        role: setup.flat ? MOTION_GEN_DRAW_MODE.ROLE_2D : MOTION_GEN_DRAW_MODE.ROLE_3D,
        era: analysis.era || MR.MOTION_TEXT_EMPTY,
        story: storyLine(analysis),
        key: place.key,
        name: place.name,
        description: place.description,
        interior: !!place.interior,
        time: place.time || MOTION_TEXT_DAY,
        uses: setup.uses,
        style: setup.style,
        library: setup.library,
        note: o.note ? MOTION_TEMPLATE_USER_NOTE(String(o.note)) : MR.MOTION_TEXT_EMPTY,
      });
  const request = locationRequest(prompt, setup, analysis, gen);
  let value: any;
  try {
    value = await runMotionDrawTask({
      task: place.name,
      exec: o.exec,
      signal: o.signal,
      log: o.log,
      ...(o.drawBudget ? { maxAttempts: MOTION_DRAW_BUDGET.PER_LOCATION } : {}),
      ...drawGate(o),
      attempt: async (exec) => {
        aborted(o);
        if (!motionDrawSpend(o.drawBudget, MOTION_DRAW_KIND.LOCATION, request.length)) throw new Error(MOTION_DRAW_LOG.EXHAUSTED(place.name));
        o.log(MOTION_TEMPLATE_AI_VE_BOI_CANH(String(place.name)));
        const res = await (o.ai || runMotionAi)(request, MOTION_GEN_CONFIG.ARTIFACT_LOCATION, exec, o.signal, o.log);
        return acceptLocation(place, res?.location || res, setup, o);
      },
    });
  } catch (error) {
    if (o.signal?.aborted || !o.drawBudget) throw error;
    value = fallbackLocation(place, analysis, gen, o);
  }
  await storeLocation(place, value, setup, gen, session, o);
};
export const designLocationGroup = async (places: MotionPlace[], script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: MotionGenState, session: MotionStillSession, o: GenOptions): Promise<void> => {
  if (places.length < 2 || o.note) {
    for (const place of places) await designLocation(place, script, analysis, gen, session, o);
    return;
  }
  const setups = _.map(places, (place) => locationSetup(place, script, analysis, gen, o));
  for (const place of places) if (gen.assetSources) delete gen.assetSources[MOTION_SCENE_LIBRARY.SOURCE_PLACE + place.key];
  const first = setups[0];
  const prompt = MOTION_GEN_LOCATIONS_PROMPT({
    preamble: o.preamble || MOTION_GEN_PREAMBLE,
    role: first.flat ? MOTION_GEN_DRAW_MODE.ROLE_2D : MOTION_GEN_DRAW_MODE.ROLE_3D,
    story: storyLine(analysis),
    era: analysis.era || MR.MOTION_TEXT_EMPTY,
    style: first.style,
    locations: _.map(places, (place, i) => MOTION_GEN_LOCATIONS_ITEM({ key: place.key, name: place.name, description: place.description, interior: !!place.interior, time: place.time || MOTION_TEXT_DAY, uses: setups[i].uses, brief: setups[i].productionBrief })).join(MOTION_TEXT_SYMBOL_27),
    guide: first.dslGuide,
    library: _.uniq(_.flatMap(setups, (setup) => setup.library.split(MOTION_SCENE_LIBRARY.TEXT.NEWLINE))).join(MOTION_SCENE_LIBRARY.TEXT.NEWLINE),
    example: locationExample(first),
  });
  const request = locationRequest(prompt, first, analysis, gen);
  const names = _.map(places, MR.MOTION_TEXT_NAME).join(MR.MOTION_TEXT_SYMBOL_14);
  const done: Record<string, any> = {};
  await runMotionDrawTask({
    task: names,
    exec: o.exec,
    signal: o.signal,
    log: o.log,
    maxAttempts: MOTION_DRAW_BUDGET.LOCATION_BATCH_ATTEMPTS,
    ...drawGate(o),
    attempt: async (exec) => {
      aborted(o);
      if (!motionDrawSpend(o.drawBudget, MOTION_DRAW_KIND.LOCATION, request.length)) throw new Error(MOTION_DRAW_LOG.EXHAUSTED(names));
      o.log(MOTION_DRAW_LOG.BATCH(places.length, names));
      const res = await (o.ai || runMotionAi)(request, MOTION_DRAW_BUDGET.ARTIFACT_LOCATIONS, exec, o.signal, o.log);
      for (const [i, place] of places.entries()) {
        if (done[place.key]) continue;
        const raw = _.get(res, [MOTION_TEXT_LOCATIONS, place.key]);
        const value = raw ? await acceptLocation(place, raw, setups[i], o) : undefined;
        if (value) done[place.key] = value;
      }
      return _.size(done) ? true : undefined;
    },
  }).catch((error) => {
    if (o.signal?.aborted) throw error;
  });
  for (const [i, place] of places.entries()) if (done[place.key]) await storeLocation(place, done[place.key], setups[i], gen, session, o);
  const missing = _.filter(places, (place) => !done[place.key]);
  if (missing.length) o.log(MOTION_DRAW_LOG.BATCH_MISSING(_.map(missing, MR.MOTION_TEXT_NAME).join(MR.MOTION_TEXT_SYMBOL_14)));
  for (const place of missing) await designLocation(place, script, analysis, gen, session, o);
};
const nodeBounds = (n: any, L: any, depth = 0): [number, number, number, number, number, number] | null => {
  if (!n || depth > 6) return null;
  let b: [number, number, number, number, number, number] | null = null;
  const merge = (x: [number, number, number, number, number, number] | null) => {
    if (!x) return;
    b = b ? [Math.min(b[0], x[0]), Math.min(b[1], x[1]), Math.min(b[2], x[2]), Math.max(b[3], x[3]), Math.max(b[4], x[4]), Math.max(b[5], x[5])] : x;
  };
  const half = (w: number, h: number, d: number): [number, number, number, number, number, number] => [-w / 2, -h / 2, -d / 2, w / 2, h / 2, d / 2];
  switch (n.shape) {
    case MOTION_TEXT_BOX:
      b = half(n.size[0], n.size[1], n.size[2]);
      break;
    case MOTION_TEXT_CYLINDER:
    case MOTION_TEXT_CONE:
      b = half(2 * Math.max(n.radius, n.radiusTop || 0, n.radiusBottom || 0), n.height, 2 * Math.max(n.radius, n.radiusTop || 0, n.radiusBottom || 0));
      break;
    case MOTION_TEXT_SPHERE:
      b = half(2 * n.radius, 2 * n.radius, 2 * n.radius);
      break;
    case MOTION_TEXT_CAPSULE:
      b = half(2 * n.radius, n.height, 2 * n.radius);
      break;
    case MOTION_TEXT_PLANE:
      b = half(n.size[0], n.size[1], 0.01);
      break;
    case MOTION_TEXT_EXTRUDE: {
      const pts = (n.points || []) as number[][];
      const xs = pts.map((q) => q[0]),
        ys = pts.map((q) => q[1]);
      b = [Math.min(...xs), Math.min(...ys), -n.depth / 2, Math.max(...xs), Math.max(...ys), n.depth / 2];
      break;
    }
    case MOTION_TEXT_GROUP:
      _.forEach(n.children, (c) => merge(nodeBounds(c, L, depth + 1)));
      break;
    case MOTION_TEXT_USE:
      _.forEach(L.defs?.[n.ref] || [], (c: any) => merge(nodeBounds(c, L, depth + 1)));
      break;
    case MOTION_TEXT_REPEAT: {
      const inner = nodeBounds(n.node, L, depth + 1);
      if (inner) {
        const ex = [(n.count[0] - 1) * n.step[0], (n.count[1] - 1) * n.step[1], (n.count[2] - 1) * n.step[2]];
        b = [inner[0] + Math.min(0, ex[0]), inner[1] + Math.min(0, ex[1]), inner[2] + Math.min(0, ex[2]), inner[3] + Math.max(0, ex[0]), inner[4] + Math.max(0, ex[1]), inner[5] + Math.max(0, ex[2])];
      }
      break;
    }
    case MOTION_LIB_TEXT.MODEL: {
      const sz: number[] = n._size || [1, 1, 1];
      const k = n.height ? n.height / sz[1] : n.length ? n.length / Math.max(sz[0], sz[2]) : n.width ? n.width / Math.min(sz[0], sz[2]) : 1;
      b = [(-sz[0] * k) / 2, 0, (-sz[2] * k) / 2, (sz[0] * k) / 2, sz[1] * k, (sz[2] * k) / 2];
      break;
    }
    default:
      return null;
  }
  if (!b) return null;
  const bb: [number, number, number, number, number, number] = b;
  const s = n.scale || [1, 1, 1];
  const yaw = (((n.rot?.[1] || 0) % 360) + 360) % 360;
  const rad = (yaw * Math.PI) / 180;
  const corners: [number, number][] = [
    [bb[0] * s[0], bb[2] * s[2]],
    [bb[3] * s[0], bb[2] * s[2]],
    [bb[0] * s[0], bb[5] * s[2]],
    [bb[3] * s[0], bb[5] * s[2]],
  ];
  const rx = _.map(corners, ([x, z]) => x * Math.cos(rad) + z * Math.sin(rad)),
    rz = _.map(corners, ([x, z]) => -x * Math.sin(rad) + z * Math.cos(rad));
  const p = n.pos || [0, 0, 0];
  return [p[0] + _.min(rx)!, p[1] + bb[1] * s[1], p[2] + _.min(rz)!, p[0] + _.max(rx)!, p[1] + bb[4] * s[1], p[2] + _.max(rz)!];
};
export const locationSummary = (key: string, L: any, place?: MotionPlace): string => {
  const objects = _.compact(
    _.map(
      _.filter(L.nodes, (n: any) => (n.name || n.shape === MOTION_LIB_TEXT.MODEL) && n.shape !== MOTION_TEXT_LIGHT),
      (n: any) => {
        const b = nodeBounds(n, L);
        if (!b) return null;
        return MOTION_TEMPLATE_CENTRE_SIZE_X_Y_Z_TOP_Y(String(n.name || n.ref), String(r2((b[0] + b[3]) / 2)), String(r2((b[2] + b[5]) / 2)), String(r2(b[3] - b[0])), String(r2(b[4] - b[1])), String(r2(b[5] - b[2])), String(r2(b[4])));
      },
    ),
  );
  return [
    MOTION_TEMPLATE_LOCATION_TIME(String(key), String(place ? MOTION_TEMPLATE_SYMBOL_51(String(place.name)) : MR.MOTION_TEXT_EMPTY), String(L.interior ? MOTION_TEXT_TOON_CAT_INTERIOR : MOTION_TEXT_EXTERIOR), String(L.time)),
    MOTION_TEMPLATE_STAGE_CENTRE_SIZE_X_Z_DEFAULT_CAMERA_POS(String(L.stage.center), String(L.stage.size), String(L.camera.pos), String(L.camera.target)),
    MOTION_TEMPLATE_MARKS(String(_.map(L.marks, (v: number[], k: string) => MOTION_TEMPLATE_SYMBOL_52(String(k), String(v))).join(MOTION_TEXT_SYMBOL_14) || MOTION_TEXT_NONE)),
    MR.MOTION_TEXT_USE_THE_SUPPLIED_SCENE_GEOMETRY_AND_NAMED_SUPPORT_STATIONS_DERIVE,
    MOTION_TEMPLATE_OBJECTS_2(String(_.take(objects, 40).join(MOTION_TEXT_SYMBOL_41) || MOTION_TEXT_NONE_NAMED)),
    MR.MOTION_TEMPLATE_EXACT_SET_GEOMETRY_REUSE_THESE_OBJECTS_AND_THEIR_CHILD_NAMES_TRAN(JSON.stringify({ nodes: L.nodes, defs: L.defs })),
  ].join(MOTION_TEXT_SYMBOL_27);
};
const stagingContext = (gen: MotionGenState) => ({ locations: gen.locations, cast: _.keys(gen.cast) });
const beatLines = (beats: MotionBeat[], lang: string, notes: Record<string, string>, timing?: MotionVoiceTiming): string =>
  _.map(beats, (b) =>
    MOTION_TEMPLATE_ID_LOCATION_TIME_SHOT_HINT_S_CAST_NARRATION(
      String(b.id),
      String(b.place),
      String(b.time || MOTION_TEXT_SYMBOL_25),
      String(b.shot || MOTION_TEXT_MEDIUM),
      String((timing?.beats[b.id]?.duration ?? beatSeconds(b, lang)).toFixed(1)),
      String((b.cast || []).join(MOTION_TEXT_SYMBOL_14) || MOTION_TEXT_NOBODY),
      String(b.narration),
      MR.MOTION_TEMPLATE_SYMBOL_204(b.action || MOTION_TEXT_FOLLOW_THE_NARRATION, scenePlanPrompt(b.scenePlan)),
      MOTION_GEN_VOICE_TIMING.LINE(timing?.beats[b.id]?.lines || []) + String(notes[b.id] ? MOTION_TEMPLATE_FIX_REQUIRED(String(notes[b.id])) : MR.MOTION_TEXT_EMPTY),
    ),
  ).join(MOTION_TEXT_SYMBOL_27);
const applyVoiceAnchors = (staging: any, beat: MotionVoiceTiming["beats"][string] | undefined): void => {
  if (!beat?.duration) return;
  const at = (id: unknown, edge?: string, offset = 0): number | undefined => {
    const line = _.find(beat.lines, { id: _.toString(id) });
    return line ? _.clamp(((edge === MOTION_SOUND_CONFIG.EDGE_END ? line.to : line.from) + offset) / beat.duration, 0, 0.95) : undefined;
  };
  _.forEach(staging.cameras, (camera: any, index: number) => {
    const cut = index ? at(camera.utterance) : undefined;
    if (cut !== undefined) camera.at = _.clamp(cut, 0.15, 0.9);
  });
  if (Array.isArray(staging.cameras) && staging.cameras.length) {
    staging.cameras = _.sortBy(staging.cameras, MR.MOTION_TEXT_AT);
    staging.cameras[0].at = 0;
    staging.camera = staging.cameras[0];
  }
  _.forEach(staging.soundEvents, (event: any) => {
    const fraction = event.utterance ? at(event.utterance, event.edge, event.t || 0) : undefined;
    if (fraction !== undefined) event.at = fraction;
  });
};
export const stageBeats = async (beats: MotionBeat[], script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions, notes: Record<string, string> = {}): Promise<string[]> => {
  const lang = script.language;
  const timing = o.voiceTiming ? await o.voiceTiming : undefined;
  const stagingRules = motionStyleRules(motionStyleConstraints(analysis.referenceStyle, gen.drawingMode));
  const stagingStyle = _.compact([stagingRules.precedence, stagingRules.limits]);
  const ctx = stagingContext(gen);
  const castInfo = (group: MotionBeat[]): string => {
    const keys = _.some(group, (b) => !Array.isArray(b.cast)) ? null : _.uniq(_.flatMap(group, (b) => b.cast || []));
    return JSON.stringify(_.filter(analysis.cast, (c) => !keys || _.includes(keys, c.key)).map((c) => ({ key: c.key, name: c.name, role: c.role, look: c.look, ...motionCastSummary(gen.cast[c.key], gen.characterMotion === true) })));
  };
  let todo = beats.slice();
  const reasons: Record<string, string> = {};
  for (let attempt = 0; attempt < MOTION_GEN_CONFIG.STAGING_TRIES && todo.length; attempt++) {
    aborted(o);
    const locKeys = _.uniq(_.compact(_.map(todo, MOTION_TEXT_PLACE)));
    const firstIndex = script.beats.findIndex((b) => b.id === todo[0].id);
    const prev = _.findLast(script.beats.slice(0, firstIndex), (b) => b.visual === MOTION_TEXT_SCENE && !!gen.staging[b.id]);
    const continuity = prev ? MOTION_TEMPLATE_CONTINUITY_THE_SHOT_BEFORE_THIS_GROUP_WAS_AT(String(prev.id), String(_.get(gen.staging, [prev.id, MOTION_TEXT_LOCATION]))) : MR.MOTION_TEXT_EMPTY;
    const prompt = MOTION_GEN_STAGING_PROMPT({
      preamble: o.preamble || MOTION_GEN_PREAMBLE,
      story: storyLine(analysis),
      actions: [MOTION_GEN_ACTIONS_GUIDE(), MOTION_GEN_POSE_PROMPTS.STAGING, ...stagingStyle, MOTION_SOUND_PROMPT, MOTION_SCENE_LIBRARY_PROMPT.STAGING_SOUND, ...(timing ? [MOTION_GEN_VOICE_TIMING.RULE] : []), await motionSoundCatalogPrompt(beatLines(todo, lang, notes, timing)), motionVideoGenreDirective(analysis.videoGenre)].join(MR.MOTION_TEXT_SYMBOL_27),
      cast: castInfo(todo),
      locations: _.map(locKeys, (k) => locationSummary(k, gen.locations[k], _.find(analysis.places, { key: k }))).join(MOTION_TEXT_SYMBOL_37),
      beats: beatLines(todo, lang, notes, timing),
      continuity,
      notes: MR.MOTION_TEMPLATE_SYMBOL_214(planningPrompt(analysis), locKeys.map((k) => productionBriefFor(gen.locations[k] || {}, usesOf(k, script))).join(MR.MOTION_TEXT_SYMBOL_37), o.note ? MOTION_TEMPLATE_USER_NOTE(String(o.note)) : MR.MOTION_TEXT_EMPTY),
    });
    o.log(attempt ? MOTION_TEMPLATE_AI_DAN_DUNG_LAI_CANH_CON_LOI(String(todo.length)) : MOTION_TEMPLATE_AI_DAN_DUNG_CANH_VI_TRI_DONG_TAC(String(todo.length)));
    let raw: any;
    try {
      raw = await (o.ai || runMotionAi)(prompt, MOTION_GEN_CONFIG.ARTIFACT_STAGING, talkExec(o), o.signal, o.log);
    } catch (e) {
      if (o.signal?.aborted) throw e;
      for (const beat of todo) reasons[beat.id] = getMotionErrorSummary(e);
      o.log(MOTION_TEMPLATE_DAN_DUNG_LOI(String(getMotionErrorSummary(e))));
      continue;
    }
    const list = _.castArray(raw?.beats || []);
    const failed: MotionBeat[] = [];
    for (const b of todo) {
      const item = _.find(list, (x: any) => _.toString(x?.id) === b.id) || (todo.length === 1 && list.length === 1 ? list[0] : null);
      if (!item) {
        failed.push(b);
        reasons[b.id] = MOTION_TEXT_THIS_BEAT_WAS_MISSING_FROM_YOUR_ANSWER;
        continue;
      }
      const own = b.place && gen.locations[b.place] ? b.place : undefined;
      if (own && item.location && item.location !== own) o.log(MOTION_GEN_CONFIG.LOG_LOCATION_KEPT(b.id, item.location, own));
      const input = { ...item, location: own || item.location || b.place };
      let prepared: any;
      try {
        prepared = productionStaging(input, gen.locations[input.location]);
        separateMotionActors(prepared, gen.locations[input.location]);
        focusMotionCameras(prepared);
      } catch (e) {
        failed.push(b);
        reasons[b.id] = getMotionErrorSummary(e);
        continue;
      }
      const v = validateGenStaging(prepared, ctx);
      const serious = [..._.filter(v.errors, (e) => !MP.UNKNOWN_ACTION.test(e)), ...(Array.isArray(b.cast) ? (v.value.actors || []).filter((actor: any) => !b.cast!.includes(actor.cast)).map((actor: any) => MR.MOTION_TEMPLATE_ACTOR_IS_NOT_REQUESTED_BY_THIS_BEAT_USE_ONLY_BEAT_CAST_AN_EMPTY_C(actor.cast)) : [])];
      const suggestions = [...(v.warnings || []), ...productionStagingErrors(v.value, gen.locations[input.location]), ...scenePlanStagingErrors(b.scenePlan, v.value, gen.locations[input.location])];
      if (suggestions.length) o.log(MOTION_QA_MESSAGES.ADVISORY(suggestions));
      if (serious.length) {
        failed.push(b);
        reasons[b.id] = MOTION_TEMPLATE_FORMAT_ERRORS(String(_.take(serious, 6).join(MOTION_TEXT_SYMBOL_41)));
        continue;
      }
      const settled = settleActors(v.value, b, gen);
      if (settled.length) o.log(MOTION_GEN_CONFIG.LOG_ACTION_FALLBACK(b.id, settled.join(MR.MOTION_TEXT_SYMBOL_41)));
      applyVoiceAnchors(v.value, timing?.beats[b.id]);
      gen.staging[b.id] = v.value;
      delete reasons[b.id];
    }
    _.forEach(failed, (b) => o.log(MOTION_TEMPLATE_DAN_DUNG_LOI(String(b.id + MR.MOTION_TEXT_SYMBOL_41 + reasons[b.id]))));
    todo = failed;
  }
  for (const b of todo) o.log(MR.MOTION_TEMPLATE_CANNOT_STAGE_AFTER_CORRECTION_ATTEMPTS(b.id, MOTION_GEN_CONFIG.STAGING_TRIES, reasons[b.id] || MR.MOTION_TEXT_AI_DID_NOT_RETURN_A_VALID_SCENE));
  return _.map(todo, MOTION_TEXT_ID);
};
export const beatPreviewSpec = (beat: MotionBeat, gen: MotionGenState, lang: string, aspect: string, beatIndex = 0): { spec: MotionSpec; picks: { id: string; t: number }[] } => {
  const staging: any = gen.staging[beat.id];
  const dur = beatSeconds(beat, lang);
  const shots = sceneShots(beat, gen, 0, dur, 0, beatIndex);
  const picks = [{ id: MR.MOTION_TEMPLATE_OPENING(beat.id), t: 0.04 }, ...shots.map((shot, i) => ({ id: MR.MOTION_TEMPLATE_CAMERA(beat.id, i + 1), t: shot.start + (shot.end - shot.start) * 0.55 })), { id: MR.MOTION_TEMPLATE_ENDING(beat.id), t: Math.max(0.05, dur - 0.05) }];
  return { spec: genSpec(gen, { [staging.location]: gen.locations[staging.location] }, shots, aspect), picks };
};
export const previewBeats = async (beats: MotionBeat[], script: MotionStoryScript, gen: MotionGenState, session: MotionStillSession, o: GenOptions): Promise<void> => {
  const dir = path.join(previewRoot(), runId(script, o), MOTION_TEXT_BEATS);
  for (const b of beats) {
    aborted(o);
    if (!gen.staging[b.id]) continue;
    try {
      const { spec, picks } = beatPreviewSpec(
        b,
        gen,
        script.language,
        o.aspect || MOTION_TEXT_16_9,
        script.beats.findIndex((beat) => beat.id === b.id),
      );
      const [aw, ah] = (o.aspect || MR.MOTION_TEXT_16_9).split(MR.MOTION_TEXT_SYMBOL_39).map(Number);
      const width = Math.round((o.skipPreviews ? MOTION_GEN_CONFIG.THUMBNAIL_WIDTH : MOTION_GEN_CONFIG.PREVIEW_WIDTH) * Math.min(1, aw / ah));
      const height = Math.round((width * ah) / aw);
      const r = await session.render(spec, o.skipPreviews ? picks.slice(1, 2) : picks, dir, { width, height, quality: MOTION_TEXT_DRAFT, label: true });
      gen.previews[b.id] = { ...(gen.previews[b.id] || {}), file: genPreviewRel(r[0].file), files: r.map((frame) => genPreviewRel(frame.file)), issues: _.uniq(r.flatMap((frame) => frame.issues)), score: undefined, at: new Date().toISOString() };
    } catch (e) {
      if (o.signal?.aborted) throw e;
      gen.previews[b.id] = { ...(gen.previews[b.id] || {}), file: undefined, files: [], score: 0, issues: [MOTION_TEMPLATE_RENDER_ERROR(String(getMotionErrorSummary(e)))] };
    }
    o.partial?.(null);
  }
};
const aiGroupSize = (count: number): number => _.clamp(Math.ceil(count / MOTION_STORY_CONFIG.AI_PARALLEL), MOTION_GEN_CONFIG.MIN_BEATS_PER_AI_CALL, MOTION_GEN_CONFIG.BEATS_PER_STAGING_CALL);
export const directExistingMotionSound = async (script: MotionStoryScript, gen: MotionGenState, o: GenOptions): Promise<void> => {
  const direction = o.audioDirection || motionAudioDirection(script, null);
  const key = createHash(MR.MOTION_TEXT_SHA256)
    .update(JSON.stringify([MOTION_SOUND_CONFIG.VERSION, direction.mode, direction.factual, direction.soundStyle, gen.characterMotion]))
    .digest(MR.MOTION_TEXT_HEX);
  const outdated = gen.soundPlanVersion !== undefined && (gen.soundPlanVersion !== MOTION_SOUND_CONFIG.VERSION || gen.soundDirectionKey !== key);
  const beats = script.beats.filter((beat) => (beat.visual === MOTION_TEXT_SCENE ? gen.staging[beat.id] && (outdated || !(gen.staging[beat.id] as any).soundDirected) : outdated || !beat.data?.soundDirected));
  if (!beats.length) {
    gen.soundPlanVersion = MOTION_SOUND_CONFIG.VERSION;
    gen.soundDirectionKey = key;
    return;
  }
  o.log(MOTION_SOUND_CONFIG.PLANNING);
  const long = beats.length > MOTION_GEN_CONFIG.LONG_VIDEO_SCENE_BEATS;
  const openers = new Set(_.map(_.values(_.groupBy(script.beats, MOTION_TEXT_CHAPTERID)), (list) => list[0].id));
  const aiBeats = long ? _.filter(beats, (b) => !!b.emphasis || openers.has(b.id)) : beats;
  const autoBeats = _.difference(beats, aiBeats);
  for (const beat of autoBeats) {
    const staging: any = beat.visual === MOTION_TEXT_SCENE ? gen.staging[beat.id] : (beat.data ||= {});
    staging.soundEvents = motionAutoSoundEvents([beat.narration, beat.action, ..._.map(staging.actors || [], (actor: any) => actor.action)]);
    staging.soundDirected = true;
  }
  if (long) o.log(MOTION_SOUND_CONFIG.AUTO_LOG(aiBeats.length, autoBeats.length));
  await mapMotionAiPool(_.chunk(aiBeats, long ? MOTION_GEN_CONFIG.KEY_BEATS_PER_STAGING_CALL : aiGroupSize(aiBeats.length)), async (group) => {
    aborted(o);
    const castKeys = _.uniq(group.flatMap((beat) => ((gen.staging[beat.id] as any)?.actors || []).map((actor: any) => actor.cast)));
    const cast = Object.fromEntries(
      castKeys.map((key) => {
        const design: any = gen.cast[key];
        return [
          key,
          {
            anchors: design?.anchors,
            parts: design?.parts?.map((part: any) => ({ id: part.id, parent: part.parent, pos: part.pos, rot: part.rot, nodes: part.nodes?.map((node: any) => _.pick(node, [MR.MOTION_TEXT_SHAPE, MR.MOTION_TEXT_NAME, MR.MOTION_TEXT_SIZE, MR.MOTION_TEXT_RADIUS, MR.MOTION_TEXT_HEIGHT, MR.MOTION_TEXT_POS, MR.MOTION_TEXT_ROT])) })),
            poses: design?.poses,
            motions: design?.motions,
          },
        ];
      }),
    );
    const context = JSON.stringify(group.map((beat) => ({ id: beat.id, visual: beat.visual, data: beat.data, visualAction: beat.action, scenePlan: beat.scenePlan, staging: gen.staging[beat.id] })));
    try {
      const prompt = [
        o.preamble || MOTION_GEN_PREAMBLE,
        MOTION_SOUND_PROMPT,
        MOTION_AUDIO_DIRECTION.CONTEXT + JSON.stringify(direction),
        await motionSoundCatalogPrompt(context),
        JSON.stringify({
          beats: JSON.parse(context),
          cast,
          locations: _.uniq(group.map((beat) => beat.place || MR.MOTION_TEXT_EMPTY)).map((key) => {
            const location: any = gen.locations[key] || {};
            const objects: any[] = [];
            const collect = (nodes: any[], parent?: string) => {
              for (const node of Array.isArray(nodes) ? nodes : []) {
                if (node.name && objects.length < 160) objects.push({ ..._.pick(node, [MR.MOTION_TEXT_NAME, MR.MOTION_TEXT_SHAPE, MR.MOTION_TEXT_POS, MR.MOTION_TEXT_ROT, MR.MOTION_TEXT_SIZE, MR.MOTION_TEXT_RADIUS, MR.MOTION_TEXT_HEIGHT, MR.MOTION_TEXT_MAT]), parent });
                if (node.children) collect(node.children, node.name || parent);
              }
            };
            collect(location.nodes);
            return { key, ..._.pick(location, [MR.MOTION_TEXT_NAME, MR.MOTION_TEXT_TOON_CAT_INTERIOR, MR.MOTION_TEXT_TIME, MR.MOTION_TEXT_GROUND, MR.MOTION_TEXT_MARKS, MR.MOTION_TEXT_STAGE]), objects };
          }),
        }),
        MOTION_SOUND_EXISTING_PROMPT,
      ].join(MR.MOTION_TEXT_SYMBOL_27);
      const response = await (o.ai || runMotionAi)(prompt, MOTION_SOUND_CONFIG.ARTIFACT, talkExec(o), o.signal, o.log);
      for (const item of Array.isArray(response?.beats) ? response.beats : []) {
        if (!group.some((beat) => beat.id === item?.id)) continue;
        const beat = group.find((entry) => entry.id === item.id)!;
        const staging: any = beat.visual === MOTION_TEXT_SCENE ? gen.staging[item.id] : (beat.data ||= {});
        staging.soundEvents = normalizeSoundEvents(item.soundEvents);
        staging.soundSilence = item.soundSilence === true;
      }
      for (const item of Array.isArray(response?.motionEvents) ? response.motionEvents : []) {
        const design: any = gen.cast[item?.cast],
          motion = design?.motions?.[item?.action];
        if (!motion || !Array.isArray(motion.tracks)) continue;
        motion.events = normalizeSoundEvents(item.events)
          .filter((event) => !event.part || design.parts?.some((part: any) => part.id === event.part))
          .map((event) => ({ ...event, t: Math.min(motion.duration, event.t ?? (event.at || 0) * motion.duration) }));
      }
    } catch (error) {
      if (o.signal?.aborted) throw error;
      o.log(MOTION_SOUND_CONFIG.SKIPPED);
    }
    for (const beat of group) {
      const staging: any = beat.visual === MOTION_TEXT_SCENE ? gen.staging[beat.id] : (beat.data ||= {});
      staging.soundDirected = true;
    }
  });
  gen.soundPlanVersion = MOTION_SOUND_CONFIG.VERSION;
  gen.soundDirectionKey = key;
};
const cycleOf = <T>(list: readonly T[], index: number): T => list[index % list.length];
const castSetKey = (b: MotionBeat): string => [b.place || MR.MOTION_TEXT_EMPTY, ..._.sortBy(b.cast || [])].join(MR.MOTION_TEXT_SYMBOL_14);
const beatSpeaker = (b: MotionBeat): string | undefined => _.find(b.utterances || [], (u) => _.includes(b.cast || [], u.speaker))?.speaker;
const autoAction = (design: any, text: string, motion: boolean): string => {
  const names = _.uniq([...(motion ? _.keys(design?.motions) : []), ..._.keys(design?.poses)]);
  const standard = _.find(motionPoseNamesIn(text), (name) => _.includes(names, name));
  if (standard) return standard;
  const lower = _.toLower(text);
  const score = (name: string): number =>
    _.sumBy(
      _.filter(name.split(MOTION_GEN_CONFIG.AUTO_WORD_SPLIT), (word) => word.length > 2),
      (word) => (new RegExp(MP.WORD_BOUNDARY(_.escapeRegExp(_.toLower(word)))).test(lower) ? 1 : 0),
    );
  const best = _.maxBy(names, score);
  return best && score(best) > 0 ? best : MOTION_GEN_CONFIG.AUTO_IDLE;
};
export const completeCastPoses = async (analysis: MotionStoryAnalysis, gen: MotionGenState, needs: Record<string, MotionCastNeeds>, o: GenOptions): Promise<void> => {
  const motion = gen.characterMotion === true;
  const has = (key: string, name: string) => _.has((gen.cast[key] as any)?.poses, name) || (motion && _.has((gen.cast[key] as any)?.motions, name));
  const jobs = _.filter(analysis.cast, (c) => hasAuthoredCharacter(gen.cast[c.key]) && !!needs[c.key]);
  await mapMotionAiPool(
    jobs,
    async (c) => {
      const need = needs[c.key];
      let poses = _.filter(need.poses, (name) => !has(c.key, name));
      let expressions = _.filter(need.expressions, (name) => !_.has((gen.cast[c.key] as any)?.expressions, name));
      const coded = _.every(poses, (name) => !!motionProceduralPose(gen.cast[c.key], name));
      if (poses.length + expressions.length && (expressions.length || !coded)) {
        o.log(MOTION_POSES.LOG.PATCH(c.name, [...poses, ...expressions].join(MR.MOTION_TEXT_SYMBOL_14)));
        await runMotionDrawTask({
          task: c.name,
          exec: o.exec,
          signal: o.signal,
          log: o.log,
          maxAttempts: MOTION_POSES.PATCH_MAX_ATTEMPTS,
          ...drawGate(o),
          attempt: async (exec) => {
            aborted(o);
            const design: any = gen.cast[c.key];
            const request = MOTION_GEN_POSE_PROMPTS.PATCH({ name: c.name, summary: JSON.stringify(motionPartOutline(design)), poses, expressions, lines: need.lines, motion });
            if (!motionDrawSpend(o.drawBudget, MOTION_DRAW_KIND.POSE, request.length)) throw new Error(MOTION_DRAW_LOG.EXHAUSTED(c.name));
            const raw = await (o.ai || runMotionAi)(request, MOTION_POSES.PATCH_ARTIFACT, exec, o.signal, o.log);
            const v = validateGenCharacter({ ...design, poses: { ...design.poses, ..._.pick(raw?.poses || {}, poses) }, expressions: { ...design.expressions, ..._.pick(raw?.expressions || {}, expressions) } });
            const gotPoses = _.filter(poses, (name) => !_.isEmpty(v.value?.poses?.[name]));
            const gotExpressions = _.filter(expressions, (name) => !_.isEmpty(v.value?.expressions?.[name]));
            if (!gotPoses.length && !gotExpressions.length) return undefined;
            gen.cast[c.key] = { ...design, poses: { ...design.poses, ..._.pick(v.value.poses, gotPoses) }, expressions: { ...design.expressions, ..._.pick(v.value.expressions, gotExpressions) } };
            poses = _.difference(poses, gotPoses);
            expressions = _.difference(expressions, gotExpressions);
            return poses.length || expressions.length ? undefined : true;
          },
        }).catch((error) => {
          if (o.signal?.aborted) throw error;
          o.log(MOTION_POSES.LOG.PATCH_FAILED(c.name));
        });
      }
      const generated: string[] = [];
      for (const name of need.poses) {
        if (has(c.key, name)) continue;
        const pose = motionProceduralPose(gen.cast[c.key], name);
        if (!pose) continue;
        gen.cast[c.key] = { ...(gen.cast[c.key] as any), poses: { ...(gen.cast[c.key] as any).poses, [name]: pose } };
        generated.push(name);
      }
      if (generated.length) o.log(MOTION_POSES.LOG.GENERATED(c.name, generated.join(MR.MOTION_TEXT_SYMBOL_14)));
    },
    drawLimit(o),
  );
  for (const c of analysis.cast) {
    if (!hasAuthoredCharacter(gen.cast[c.key])) continue;
    const checked = motionSanitizePoses(gen.cast[c.key]);
    if (checked.changes.length) o.log(MOTION_POSES.LOG.FIXED(c.name, _.take(checked.changes, 6).join(MR.MOTION_TEXT_SYMBOL_41)));
    gen.cast[c.key] = checked.design;
  }
};
const autoExpression = (design: any, b: MotionBeat, cast: string): string | undefined => {
  const own = _.find(b.utterances || [], (u) => u.speaker === cast && u.emotion !== MR.MOTION_TEXT_NEUTRAL)?.emotion;
  const names = _.keys(design?.expressions);
  const pick = (emotion?: string) => _.find([emotion, MOTION_GEN_CONFIG.AUTO_EMOTION_EXPRESSION[emotion || MR.MOTION_TEXT_EMPTY]], (name) => !!name && _.includes(names, name));
  return pick(own) || pick(b.sceneMood?.mood) || pick(_.first(b.utterances)?.emotion);
};
const settleActors = (staging: any, b: MotionBeat, gen: MotionGenState): string[] => {
  const changed: string[] = [];
  const text = [b.action, b.narration, b.scenePlan?.subject].join(MR.MOTION_TEXT_SYMBOL_27);
  for (const actor of Array.isArray(staging.actors) ? staging.actors : []) {
    const design: any = gen.cast[actor.cast];
    if (!design) continue;
    const known = (name?: string) => !!name && (name === MOTION_GEN_CONFIG.AUTO_IDLE || _.has(design.poses, name) || (gen.characterMotion === true && _.has(design.motions, name)));
    if (!known(actor.action)) {
      const next = autoAction(design, text, gen.characterMotion === true);
      changed.push(MOTION_GEN_CONFIG.ACTION_FALLBACK_ITEM(actor.cast, actor.action, next));
      actor.action = next;
    }
    if (actor.then && !known(actor.then)) delete actor.then;
    if (!actor.expression || !_.has(design.expressions, actor.expression)) {
      const expression = autoExpression(design, b, actor.cast);
      if (expression) actor.expression = expression;
      else delete actor.expression;
    }
  }
  return changed;
};
const autoPoints = (L: any, count: number, seated: boolean, taken: number[][]): (string | number[])[] => {
  const center: number[] = L?.stage?.center || [0, 0],
    size: number[] = L?.stage?.size || [6, 6];
  const camera: number[] = L?.camera?.pos || [0, 0, 1],
    target: number[] = L?.camera?.target || [0, 0, 0];
  const forward = [camera[0] - target[0], camera[2] - target[2]],
    length = Math.hypot(forward[0], forward[1]) || 1;
  const side = [forward[1] / length, -forward[0] / length],
    depth = [forward[0] / length, forward[1] / length];
  const lateral = (p: number[]) => (p[0] - center[0]) * side[0] + (p[1] - center[1]) * side[1];
  const free = (p: number[]) => _.every(taken, (q) => Math.abs(lateral(q) - lateral(p)) >= MOTION_GEN_CONFIG.AUTO_MIN_GAP);
  const inside = (p: number[]) => [_.clamp(p[0], center[0] - size[0] / 2, center[0] + size[0] / 2), _.clamp(p[1], center[1] - size[1] / 2, center[1] + size[1] / 2)];
  const picked: (string | number[])[] = [];
  const marks = _.sortBy(
    _.filter(_.toPairs(L?.marks || {}), ([name, at]) => Array.isArray(at) && at.length >= 2 && MOTION_GEN_CONFIG.AUTO_SEAT_MARK_RE.test(name) === seated),
    ([, at]) => Math.hypot((at as number[])[0] - center[0], (at as number[])[1] - center[1]),
  );
  for (const [name, at] of marks) {
    if (picked.length >= count) break;
    if (!free(at as number[])) continue;
    picked.push(name);
    taken.push(at as number[]);
  }
  const slots = _.times(count * 3, (i) => {
    const offset = (i - (count * 3 - 1) / 2) * MOTION_GEN_CONFIG.AUTO_SPACING,
      back = -MOTION_GEN_CONFIG.AUTO_ARC * Math.abs(offset);
    return inside([center[0] + side[0] * offset + depth[0] * back, center[1] + side[1] * offset + depth[1] * back]);
  });
  for (const at of _.sortBy(slots, (at) => Math.abs(lateral(at)))) {
    if (picked.length >= count) break;
    if (!free(at)) continue;
    picked.push(at);
    taken.push(at);
  }
  while (picked.length < count) picked.push(center.slice());
  return picked;
};
const actorText = (text: string, key: string, name: string, lead: boolean): string => {
  const words = _.filter(_.toLower(String(key) + MR.MOTION_TEXT_SYMBOL_13 + String(name)).split(MOTION_GEN_CONFIG.AUTO_WORD_SPLIT), (word) => word.length > 1);
  const own = _.filter(text.split(MOTION_GEN_CONFIG.AUTO_CLAUSE_SPLIT), (clause) => _.some(words, (word) => _.includes(_.toLower(clause), word)));
  return own.length ? own.join(MR.MOTION_TEXT_SYMBOL_27) : lead ? text : MR.MOTION_TEXT_EMPTY;
};
const autoStaging = (b: MotionBeat, index: number, script: MotionStoryScript, gen: MotionGenState, names: Record<string, string>, fresh = false): any => {
  const L: any = gen.locations[b.place || MR.MOTION_TEXT_EMPTY];
  const cast = _.filter(b.cast || [], (key) => !!gen.cast[key]);
  const text = [b.action, b.scenePlan?.subject, b.scenePlan?.composition].join(MR.MOTION_TEXT_SYMBOL_27);
  const speaker = beatSpeaker(b);
  const lead = speaker || cast[0];
  const position = script.beats.findIndex((other) => other.id === b.id);
  const prevIndex = position > 0 ? _.findLastIndex(script.beats, (other) => other.visual === MOTION_TEXT_SCENE && !!gen.staging[other.id] && castSetKey(other) === castSetKey(b), position - 1) : -1;
  const reference: any = prevIndex >= 0 && !fresh ? gen.staging[script.beats[prevIndex].id] : null;
  const shared = !_.some(cast, (key) => !!actorText(text, key, names[key] || key, false));
  const actions = Object.fromEntries(_.map(cast, (key) => [key, autoAction(gen.cast[key], actorText(text, key, names[key] || key, shared), gen.characterMotion === true)]));
  const taken: number[][] = [];
  const seatedKeys = _.filter(cast, (key) => MOTION_GEN_CONFIG.AUTO_SEATED_RE.test(actions[key]));
  const standingKeys = _.difference(cast, seatedKeys);
  const spots = { ...(_.zipObject(seatedKeys, autoPoints(L, seatedKeys.length, true, taken)) as Record<string, string | number[]>), ...(_.zipObject(standingKeys, autoPoints(L, standingKeys.length, false, taken)) as Record<string, string | number[]>) };
  const actors = _.map(cast, (key) => {
    const kept = _.find(reference?.actors || [], (actor: any) => actor.cast === key);
    const other = _.find(cast, (x) => x !== key);
    const face = kept ? (kept.faceActor ?? kept.face ?? kept.faceAt) : cast.length === 2 ? other : cast.length > 2 && speaker && speaker !== key ? speaker : MOTION_GEN_CONFIG.AUTO_FACE_CAMERA;
    const expression = autoExpression(gen.cast[key], b, key);
    return _.omitBy({ cast: key, action: actions[key], at: kept ? kept.at : spots[key], face, y: kept?.y, ghost: kept?.ghost, expression }, _.isUndefined);
  });
  const focus = lead;
  const listener = _.find(cast, (key) => key !== focus) || focus;
  const shotAt = (i: number): string => {
    const shot = cast.length ? cycleOf(MOTION_GEN_CONFIG.AUTO_SHOTS, i) : MOTION_GEN_CONFIG.AUTO_EMPTY_SHOT;
    return shot === MOTION_GEN_CONFIG.AUTO_TWO_SHOT && cast.length < 2 ? MOTION_GEN_CONFIG.AUTO_FALLBACK_SHOT : cast.length > 3 && i % 2 ? MOTION_GEN_CONFIG.AUTO_GROUP_SHOT : shot;
  };
  const camera = (at: number, shot: string, turn: number, move: string, subject?: string) => _.omitBy({ at, shot, angle: _.includes(MOTION_GEN_CONFIG.AUTO_STRAIGHT_SHOTS, shot) ? 0 : cycleOf(MOTION_GEN_CONFIG.AUTO_ANGLES, turn), move, amount: MOTION_GEN_CONFIG.AUTO_MOVE_AMOUNT, focus: _.includes(MOTION_GEN_CONFIG.AUTO_FOCUS_SHOTS, shot) ? subject : undefined }, _.isUndefined);
  const cameras: any[] = [camera(0, b.shot || shotAt(index), index, b.emphasis ? MOTION_GEN_CONFIG.AUTO_EMPHASIS_MOVE : cycleOf(MOTION_GEN_CONFIG.AUTO_MOVES, index), focus)];
  if (beatSeconds(b, script.language) >= MOTION_GEN_CONFIG.AUTO_SECOND_CAMERA_SECONDS) cameras.push(camera(MOTION_GEN_CONFIG.AUTO_SECOND_CAMERA_AT, shotAt(index + 2), index + 3, cycleOf(MOTION_GEN_CONFIG.AUTO_MOVES, index + 1), listener));
  return { id: b.id, location: b.place, ...(b.time ? { time: b.time } : {}), ...(b.weather ? { weather: b.weather } : {}), actors, cameras };
};
const autoStageBeats = (beats: MotionBeat[], script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions, offset = 0): void => {
  const ctx = stagingContext(gen);
  const ordered = _.sortBy(beats, (b) => script.beats.findIndex((other) => other.id === b.id));
  for (const b of ordered) {
    const raw = autoStaging(b, script.beats.findIndex((other) => other.id === b.id) + offset, script, gen, Object.fromEntries(_.map(analysis.cast, (c) => [c.key, c.name])), offset > 0);
    let prepared = raw;
    try {
      prepared = productionStaging(raw, gen.locations[raw.location]);
    } catch (error) {
      o.log(getMotionErrorSummary(error));
    }
    gen.staging[b.id] = validateGenStaging(prepared, ctx).value;
    if (offset > 0) Object.assign(gen.staging[b.id] as any, { soundEvents: motionAutoSoundEvents([b.narration, b.action]), soundDirected: true });
  }
  if (ordered.length) o.log(offset > 0 ? MOTION_GEN_CONFIG.LOG_AUTO_RESTAGED(ordered.length) : MOTION_GEN_CONFIG.LOG_AUTO_STAGED(ordered.length));
};
const genPreamble = (analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions, extra: string = MR.MOTION_TEXT_EMPTY, withKit = true): string =>
  MR.MOTION_TEMPLATE_SYMBOL_225(
    _.compact([o.preamble || productionPreamble(analysis, MR.MOTION_TEXT_VISUAL, withKit), extra]).join(MR.MOTION_TEXT_SYMBOL_27),
    [gen.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_USER_DRAWING_MODE_2D_FLAT_ILLUSTRATION_USE_CLEAR_SILHOUETTES_REST : MR.MOTION_TEXT_USER_DRAWING_MODE_3D_USE_DEPTH_MATERIAL_CONTRAST_AND_MOTIVATED_LI, o.characterMotion ? MOTION_REFERENCE_PROMPTS.MOTION_ON : MOTION_REFERENCE_PROMPTS.MOTION_OFF, MOTION_REFERENCE_PROMPTS.QA].join(MR.MOTION_TEXT_SYMBOL_27),
  );
const libraryPreviewRel = (id: string): string | null => {
  const thumb = sceneAssetThumbPath(id);
  if (!thumb) return null;
  const file = path.join(previewRoot(), MOTION_SCENE_LIBRARY.PREVIEW_FOLDER, id + MOTION_SCENE_LIBRARY.THUMB_EXT);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.copyFileSync(thumb, file);
  return genPreviewRel(file);
};
export const withBeatPlaces = (analysis: MotionStoryAnalysis, beats: MotionBeat[], o: GenOptions): MotionStoryAnalysis => {
  const merged: string[] = [];
  const pool: MotionPlaceRef[] = [...analysis.places];
  for (const b of beats) {
    if (!b.place || _.some(pool, { key: b.place })) continue;
    const into = motionMatchPlace({ key: b.place, name: b.placeName }, pool);
    if (into) {
      merged.push(MOTION_DRAW_LOG.MERGED_PAIR(b.placeName || b.place, into));
      b.place = into;
    } else pool.push({ key: b.place, name: b.placeName });
  }
  if (merged.length) o.log(MOTION_DRAW_LOG.MERGED_PLACES(_.uniq(merged).join(MR.MOTION_TEXT_SYMBOL_14)));
  const known = new Set(_.map(analysis.places, MR.MOTION_TEXT_KEY));
  const extra: MotionPlace[] = _.map(
    _.uniqBy(
      _.filter(beats, (b) => !!b.place && !known.has(b.place)),
      MOTION_TEXT_PLACE,
    ),
    (b) => ({ key: b.place!, name: b.placeName || b.place!, description: _.compact([b.placeName || b.place, b.action]).join(MOTION_SCENE_LIBRARY.TEXT.SEP), interior: _.includes([MR.MOTION_TEXT_TOON_CAT_INTERIOR, MR.MOTION_TEXT_INTERIOR_DARK], b.time), time: b.time || MOTION_TEXT_DAY }),
  );
  if (!extra.length) return analysis;
  o.log(MOTION_GEN_CONFIG.LOG_PLACES_ADDED(_.map(extra, MR.MOTION_TEXT_NAME).join(MR.MOTION_TEXT_SYMBOL_14)));
  return { ...analysis, places: [...analysis.places, ...extra] };
};
const fillSceneLibrary = (analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions, beats: MotionBeat[] = []): MotionStoryAnalysis => {
  if (o.restyle || !gen.assetStyleKey || analysis.libraryMode === MOTION_SCENE_LIBRARY_MODES.OFF) return analysis;
  const cast = _.filter(analysis.cast, (c) => !c.reuse && !hasAuthoredCharacter(gen.cast[c.key]));
  const places = _.filter(analysis.places, (p) => !p.reuse && !gen.locations[p.key] && !_.includes(o.onlyLocations || [], p.key));
  if (!cast.length && !places.length) return analysis;
  const weights = _.countBy(beats, (b) => b.place);
  const filled = assignSceneLibrary({ ...analysis, cast, places }, gen.assetStyleKey, MOTION_SCENE_LIBRARY_MODES.AUTO, o.characterMotion, { drawBudget: MOTION_LIBRARY_FIT.DRAW_MAX, weight: (place) => weights[place.key] || 0, log: o.log });
  const castCount = _.filter(filled.cast, (c) => !!c.reuse).length,
    placeCount = _.filter(filled.places, (p) => !!p.reuse).length;
  if (!castCount && !placeCount) return analysis;
  o.log(MOTION_GEN_CONFIG.LOG_LIBRARY_FILLED(castCount, placeCount));
  return { ...analysis, cast: _.map(analysis.cast, (c) => _.find(filled.cast, { key: c.key }) || c), places: _.map(analysis.places, (p) => _.find(filled.places, { key: p.key }) || p) };
};
const applySceneLibrary = (analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions): void => {
  if (analysis.libraryMode === MOTION_SCENE_LIBRARY_MODES.OFF) {
    applyReferenceRenderStyle(analysis, gen);
    return;
  }
  const styleKey = gen.assetStyleKey || MR.MOTION_TEXT_EMPTY;
  const story = motionStoryTraits(analysis);
  const constraints = motionStyleConstraints(analysis.referenceStyle, gen.drawingMode);
  const clothesAllowed = !constraints.present || _.includes(constraints.variation, MOTION_STYLE_AXIS.CLOTHING);
  const sources = (gen.assetSources ||= {});
  const used: string[] = [];
  if (_.isEmpty(gen.style)) {
    const stored = readSceneStyle(styleKey)?.genStyle;
    if (stored && !_.isEmpty(stored)) {
      gen.style = cloneJson(stored);
      o.log(MOTION_SCENE_LIBRARY.LOGS.REUSED_STYLE);
    }
  }
  applyReferenceRenderStyle(analysis, gen);
  if (o.restyle) _.forEach(analysis.cast, (c) => delete sources[MOTION_SCENE_LIBRARY.SOURCE_CAST + c.key]);
  else
    for (const c of analysis.cast) {
      if (!c.reuse || hasAuthoredCharacter(gen.cast[c.key])) continue;
      const asset = getSceneAsset(c.reuse);
      if (!asset || asset.item.kind !== MOTION_SCENE_LIBRARY.KIND_CHARACTER || !sceneStyleFits(asset.item.styleKey, styleKey) || !hasAuthoredCharacter(asset.data) || (o.characterMotion && !asset.item.motion)) continue;
      const traits = c.traits || motionMemberTraits(c, story);
      const costume = clothesAllowed ? c.costume || motionMemberCostume(c, analysis, traits) : undefined;
      const variant = applyCharacterVariant(asset.data, costume ? MOTION_COSTUME.RANK_TYPES[costume.rank] : c.type || asset.item.type, { index: c.variant || 0, colors: c.colors }).design;
      const fitted = motionEnforceStyle(costume ? motionApplyCostume(variant, costume, baseWardrobe()) : motionStripForeignParts(variant, traits), constraints);
      if (fitted.changes.length) o.log(MOTION_STYLE_LOG.ENFORCED(c.name, fitted.changes.join(MR.MOTION_TEXT_SYMBOL_41)));
      gen.cast[c.key] = fitStyledCharacter(fitted.design, c.name, analysis, gen, constraints, o.log, c.type || asset.item.type);
      sources[MOTION_SCENE_LIBRARY.SOURCE_CAST + c.key] = asset.item.id;
      used.push(asset.item.id);
      o.log(MOTION_LIBRARY_LOG.CAST(c.name, asset.item.name, costume?.label || MR.MOTION_TEXT_EMPTY));
    }
  for (const place of analysis.places) {
    if (!place.reuse || gen.locations[place.key] || _.includes(o.onlyLocations || [], place.key)) continue;
    const asset = getSceneAsset(place.reuse);
    if (!asset || asset.item.kind !== MOTION_SCENE_LIBRARY.KIND_LOCATION || !sceneStyleFits(asset.item.styleKey, styleKey) || !asset.data?.stage) continue;
    const traits = place.traits || motionPlaceTraits(place, story);
    const fits = motionTraitsFit(sceneAssetTraits(asset.item), traits);
    const dressed = fits ? { location: cloneJson(asset.data), swapped: [], removed: [] } : motionRedressLocation(asset.data, traits, baseRedressProps());
    gen.locations[place.key] = fitStyledLocation(dressed.location, place.name, analysis.referenceStyle, gen.drawingMode, o.log);
    if (dressed.swapped.length || dressed.removed.length) o.log(MOTION_LIBRARY_LOG.REDRESS(place.name, dressed.swapped.length, dressed.removed.length));
    sources[MOTION_SCENE_LIBRARY.SOURCE_PLACE + place.key] = asset.item.id;
    const rel = libraryPreviewRel(asset.item.id);
    gen.locationInfo[place.key] = { files: rel ? [rel] : [], issues: [], at: new Date().toISOString() };
    used.push(asset.item.id);
    o.log(MOTION_LIBRARY_LOG.PLACE(place.name, asset.item.name, motionPlaceFit(asset.item, place), fits ? MR.MOTION_TEXT_EMPTY : motionTraitsLabel(traits)));
  }
  touchSceneAssets(used);
};
const measureNodes = (nodes: any[]): number[] | null => {
  const b = nodeBounds({ shape: MOTION_TEXT_GROUP, children: nodes }, {});
  return b ? [b[3] - b[0], b[4] - b[1], b[5] - b[2]] : null;
};
const renderCharacterThumb = async (session: MotionStillSession, gen: MotionGenState, key: string, dir: string): Promise<string | null> => {
  const L = MOTION_SCENE_LIBRARY.CHARACTER_STAGE;
  const stage = validateGenLocation(L).value;
  const shot = { id: MOTION_SCENE_LIBRARY.CHARACTER_SHOT_ID + key, start: 0, end: 2, template: MOTION_TEXT_GEN3D, params: { location: L.name, actors: [{ cast: key, action: MOTION_SCENE_LIBRARY.CHARACTER_ACTION, at: [0, 0], face: MOTION_SCENE_LIBRARY.CHARACTER_FACE }], cameras: [{ shot: MOTION_SCENE_LIBRARY.CHARACTER_SHOT, pos: L.camera.pos, target: L.camera.target, fov: L.camera.fov }] } };
  const r = await session.render(genSpec(gen, { [L.name]: stage }, [shot], MOTION_TEXT_16_9), [{ id: shot.id, t: MOTION_SCENE_LIBRARY.CHARACTER_THUMB_AT }], dir, { width: MOTION_SCENE_LIBRARY.CHARACTER_THUMB_WIDTH, height: MOTION_SCENE_LIBRARY.CHARACTER_THUMB_HEIGHT, quality: MOTION_TEXT_HIGH });
  return r[0]?.file || null;
};
const renderPropThumb = async (session: MotionStillSession, gen: MotionGenState, nodes: any[], size: number[], dir: string, tag: string): Promise<string | null> => {
  const base = MOTION_SCENE_LIBRARY.CHARACTER_STAGE;
  const span = Math.max(size[0] || 1, size[1] || 1, size[2] || 1);
  const distance = span * 1.5 + 1.5;
  const L = validateGenLocation({
    ...base,
    name: MOTION_SCENE_SHOWROOM.THUMB_LOCATION,
    ground: { size: [span * 6 + 6, span * 6 + 6], mat: base.ground.mat },
    defs: { [MOTION_SCENE_SHOWROOM.THUMB_KEY]: nodes },
    nodes: [...base.nodes, { shape: MOTION_TEXT_USE, ref: MOTION_SCENE_SHOWROOM.THUMB_KEY, pos: [0, 0, 0] }],
    camera: { pos: [distance * 0.55, (size[1] || 1) * 0.75 + 0.6, distance], target: [0, (size[1] || 1) / 2, 0], fov: 40 },
  }).value;
  const shot = { id: MOTION_SCENE_SHOWROOM.THUMB_SHOT + tag, start: 0, end: 2, template: MOTION_TEXT_GEN3D, params: { location: MOTION_SCENE_SHOWROOM.THUMB_LOCATION, actors: [], cameras: [{ shot: MOTION_TEXT_WIDE, pos: L.camera.pos, target: L.camera.target, fov: L.camera.fov }] } };
  const r = await session.render(genSpec(gen, { [MOTION_SCENE_SHOWROOM.THUMB_LOCATION]: L }, [shot], MOTION_TEXT_16_9), [{ id: shot.id, t: MOTION_SCENE_LIBRARY.CHARACTER_THUMB_AT }], dir, { width: MOTION_SCENE_LIBRARY.CHARACTER_THUMB_WIDTH, height: MOTION_SCENE_LIBRARY.CHARACTER_THUMB_HEIGHT, quality: MOTION_TEXT_HIGH });
  return r[0]?.file || null;
};
const recordSceneLibrary = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: MotionGenState, session: MotionStillSession, o: GenOptions): Promise<void> => {
  const styleKey = gen.assetStyleKey;
  if (!styleKey) return;
  const sources = (gen.assetSources ||= {});
  const from = _.truncate(analysis.title || script.title, { length: MOTION_SCENE_LIBRARY.NAME_MAX });
  let characters = 0,
    locations = 0,
    props = 0;
  const replaced: string[] = [];
  const runIds = new Set<string>();
  const savedThisRun = (kind: MotionSceneAssetKind, name: string): string | undefined => {
    const id = findSceneIdentity(kind, styleKey, name, from);
    return id && runIds.has(id) ? id : undefined;
  };
  try {
    saveSceneStyle(styleKey, { references: o.styleReferences, drawingMode: gen.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D, referenceStyle: analysis.referenceStyle, genStyle: gen.style, name: from });
    const dir = path.join(previewRoot(), runId(script, o), MOTION_SCENE_LIBRARY.PREVIEW_FOLDER);
    fs.mkdirSync(dir, { recursive: true });
    for (const c of analysis.cast) {
      const design: any = gen.cast[c.key];
      if (sources[MOTION_SCENE_LIBRARY.SOURCE_CAST + c.key] || !hasAuthoredCharacter(design)) continue;
      const sameCharacter = findSameSceneAsset(MOTION_SCENE_LIBRARY.KIND_CHARACTER, styleKey, c.name, design);
      if (sameCharacter) {
        sources[MOTION_SCENE_LIBRARY.SOURCE_CAST + c.key] = sameCharacter;
        continue;
      }
      const takenCharacter = savedThisRun(MOTION_SCENE_LIBRARY.KIND_CHARACTER, c.name);
      if (takenCharacter) {
        sources[MOTION_SCENE_LIBRARY.SOURCE_CAST + c.key] = takenCharacter;
        continue;
      }
      const thumb = await renderCharacterThumb(session, gen, c.key, dir).catch(() => null);
      const item = saveSceneAsset({ kind: MOTION_SCENE_LIBRARY.KIND_CHARACTER, styleKey, type: c.type, name: c.name, description: _.compact([c.look, c.description]).join(MOTION_SCENE_LIBRARY.TEXT.SEP), tags: c.tags, gender: c.gender, role: c.role, motion: !_.isEmpty(design?.motions), from, story: from }, design, thumb);
      runIds.add(item.id);
      sources[MOTION_SCENE_LIBRARY.SOURCE_CAST + c.key] = item.id;
      if (item.updatedAt) replaced.push(item.name);
      characters++;
    }
    const savedProps = new Set<string>();
    for (const place of analysis.places) {
      const location: any = gen.locations[place.key];
      if (!location || sources[MOTION_SCENE_LIBRARY.SOURCE_PLACE + place.key]) continue;
      const samePlace = findSameSceneAsset(MOTION_SCENE_LIBRARY.KIND_LOCATION, styleKey, place.name, location);
      if (samePlace) {
        sources[MOTION_SCENE_LIBRARY.SOURCE_PLACE + place.key] = samePlace;
        continue;
      }
      const takenPlace = savedThisRun(MOTION_SCENE_LIBRARY.KIND_LOCATION, place.name);
      if (takenPlace) {
        sources[MOTION_SCENE_LIBRARY.SOURCE_PLACE + place.key] = takenPlace;
        continue;
      }
      const preview = gen.locationInfo[place.key]?.files?.[0];
      const item = saveSceneAsset({ kind: MOTION_SCENE_LIBRARY.KIND_LOCATION, styleKey, type: place.type, name: place.name, description: place.description, tags: place.tags, time: location.time || place.time, interior: !!(location.interior ?? place.interior), from, story: from }, location, preview ? resolveGenPreview(preview) : null);
      runIds.add(item.id);
      sources[MOTION_SCENE_LIBRARY.SOURCE_PLACE + place.key] = item.id;
      if (item.updatedAt) replaced.push(item.name);
      locations++;
      for (const prop of extractSceneProps(location, measureNodes)) {
        const print = sceneAssetFingerprint(prop.nodes);
        if (savedProps.has(print) || findSameSceneAsset(MOTION_SCENE_LIBRARY.KIND_PROP, styleKey, prop.name, prop.nodes) || savedThisRun(MOTION_SCENE_LIBRARY.KIND_PROP, prop.name)) continue;
        savedProps.add(print);
        const thumb = await renderPropThumb(session, gen, prop.nodes, prop.size, dir, prop.name).catch(() => null);
        const saved = saveSceneAsset({ kind: MOTION_SCENE_LIBRARY.KIND_PROP, styleKey, name: prop.name, description: place.name, tags: [prop.name.replace(MP.UNDERSCORE, MOTION_SCENE_LIBRARY.TEXT.SPACE)], size: prop.size, from: place.name, story: from }, prop.nodes, thumb);
        runIds.add(saved.id);
        if (saved.updatedAt) replaced.push(saved.name);
        props++;
      }
    }
    if (characters || locations || props) o.log(MOTION_SCENE_LIBRARY.LOGS.SAVED(locations, characters, props));
    if (replaced.length) o.log(MOTION_SCENE_LIBRARY.LOGS.REPLACED(_.uniq(replaced).join(MOTION_SCENE_LIBRARY.TEXT.LIST)));
  } catch (error) {
    o.log(MOTION_SCENE_LIBRARY.LOGS.SAVE_FAILED(getMotionErrorSummary(error)));
  }
};
export const buildScenes = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, o: GenOptions): Promise<MotionStoryScript> => {
  if (o.styleReferences?.length && !o.referenceKey) return buildScenes(script, analysis, { ...o, referenceKey: createHash(MR.MOTION_TEXT_SHA256).update(JSON.stringify(o.styleReferences)).digest(MR.MOTION_TEXT_HEX) });
  if (o.styleReferences?.length) {
    analysis = { ...analysis, referenceStyle: await resolveMotionReferenceStyle(o.styleReferences, { exec: talkExec(o), signal: o.signal, log: o.log, ai: o.ai }) };
  }
  analysis = bindVideoDnaSettings({ ...analysis, characterMotion: o.characterMotion === true }, { drawingMode: o.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D, characterMode: MR.MOTION_TEXT_DRAWN, aspect: o.aspect || MR.MOTION_TEXT_16_9 });
  const gen = prepareMotionGen(script.gen, analysis, o.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D, o.referenceKey);
  if (gen.characterMotion !== (o.characterMotion === true)) {
    gen.staging = {};
    gen.previews = {};
  }
  gen.characterMotion = o.characterMotion === true;
  restyleExistingDesigns(script, analysis, gen, o.log);
  const rid = runId(script, o);
  _.set(gen, MOTION_TEXT_RUNID, rid);
  const drawPreamble = genPreamble(analysis, gen, o, MR.MOTION_TEXT_EMPTY, false);
  o = {
    ...o,
    runId: rid,
    drawBudget: o.drawBudget || createMotionDrawBudget(),
    openingBeatId: script.beats[0]?.id,
    audioDirection: o.audioDirection || motionAudioDirection(script, analysis),
    preamble: genPreamble(analysis, gen, o, MOTION_AUDIO_DIRECTION.CONTEXT + JSON.stringify(o.audioDirection || motionAudioDirection(script, analysis))),
  };
  const out: MotionStoryScript = { ...script, gen };
  const emit = () => o.partial?.({ ...out, gen: cloneJson(gen) });
  await ensureMotionLibrary(o.log, o.signal).catch(_.noop);
  const progress = o.progress || _.noop;
  const sceneBeats = _.filter(script.beats, (b) => b.visual === MOTION_TEXT_SCENE);
  if (!_.isEmpty(sceneBeats) && _.some(sceneBeats, (b) => !b.place)) _.forEach(sceneBeats, (b) => (b.place = b.place || analysis.places[0]?.key));
  const longVideo = sceneBeats.length > MOTION_GEN_CONFIG.LONG_VIDEO_SCENE_BEATS;
  if (longVideo) {
    o.log(MR.MOTION_TEMPLATE_VIDEO_DAI_CANH_GIAM_SO_VONG_VE_LAI_BOI_CANH_VA_XEM_LAI_DE_NHANH_H(sceneBeats.length));
  }
  if (analysis.videoDna) {
    gen.scenePlanKeys ||= {};
    const changedPlaces = new Set<string>();
    for (const beat of sceneBeats) {
      const key = sceneExecutionKey(beat);
      if (gen.scenePlanKeys[beat.id] && gen.scenePlanKeys[beat.id] !== key && beat.place) changedPlaces.add(beat.place);
      gen.scenePlanKeys[beat.id] = key;
    }
    for (const key of changedPlaces) {
      delete gen.locations[key];
      delete gen.locationInfo[key];
    }
    for (const beat of sceneBeats)
      if (changedPlaces.has(beat.place || MR.MOTION_TEXT_EMPTY)) {
        delete gen.staging[beat.id];
        delete gen.previews[beat.id];
      }
  }
  gen.assetStyleKey = !o.styleReferences?.length && motionStylePreset(analysis.stylePreset) ? MOTION_STYLE_PRESET_KEY(analysis.stylePreset!, gen.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D) : motionAssetStyleKey(o.styleReferences, gen.drawingMode);
  analysis = withBeatPlaces(analysis, sceneBeats, o);
  analysis = fillSceneLibrary(analysis, gen, o, sceneBeats);
  applySceneLibrary(analysis, gen, o);
  const castToDraw = o.restyle ? analysis.cast.length : _.filter(analysis.cast, (c) => !hasAuthoredCharacter(gen.cast[c.key])).length;
  const placesToDraw = _.filter(analysis.places, (p) => _.some(sceneBeats, (b) => b.place === p.key) && (!gen.locations[p.key] || _.includes(o.onlyLocations || [], p.key))).length;
  o.log(MOTION_GEN_CONFIG.LOG_LIBRARY_PLAN(analysis.cast.length - castToDraw, analysis.places.length - placesToDraw, castToDraw, placesToDraw, Math.ceil(castToDraw / MOTION_GEN_CONFIG.BIBLE_BATCH) + placesToDraw));
  const focusBeats = o.onlyBeats?.length ? _.filter(sceneBeats, (b) => _.includes(o.onlyBeats, b.id)) : null;
  const castMissing = _.some(analysis.cast, (c) => !hasAuthoredCharacter(gen.cast[c.key]));
  const needs = motionCastNeeds(sceneBeats, analysis.cast, MOTION_GEN_CONFIG.AUTO_EMOTION_EXPRESSION, motionStyleConstraints(analysis.referenceStyle, gen.drawingMode));
  const needy = _.filter(_.values(needs), (need) => need.poses.length + need.expressions.length > 0).length;
  if (needy) o.log(MOTION_POSES.LOG.NEEDS(needy));
  if (o.restyle || castMissing || (o.characterMotion && script.gen?.characterMotion !== true) || _.isEmpty(gen.style)) {
    progress(0.03, MOTION_TEXT_BIBLE);
    try {
      await designBible(analysis, gen, { ...o, preamble: drawPreamble }, needs);
    } catch (error) {
      if (!o.signal?.aborted) {
        const early = await openStillSession().catch(() => null);
        if (early) await recordSceneLibrary(script, { ...analysis, places: [] }, gen, early, o).finally(() => early.close());
      }
      throw error;
    }
    emit();
  }
  await completeCastPoses(analysis, gen, needs, o);
  emit();
  const session = await openStillSession();
  try {
    const neededPlaces = _.uniq(_.compact(_.map(focusBeats || sceneBeats, MOTION_TEXT_PLACE)));
    const toDesign = _.filter(analysis.places, (p) => _.includes(neededPlaces, p.key) && (!gen.locations[p.key] || _.includes(o.onlyLocations || [], p.key)));
    let done = 0;
    if (toDesign.length) {
      progress(0.08, MOTION_TEXT_LOCATIONS);
      o.log(MOTION_TEMPLATE_VE_BOI_CANH(String(toDesign.length)));
      const weights = _.countBy(sceneBeats, MOTION_TEXT_PLACE);
      await mapMotionAiPool(
        o.note ? _.map(toDesign, (place) => [place]) : motionLocationGroups(toDesign, (place) => weights[place.key] || 0),
        async (group) => {
          await designLocationGroup(group, script, analysis, gen, session, { ...o, preamble: drawPreamble, partial: () => emit() });
          done += group.length;
          progress(0.08 + (0.4 * done) / toDesign.length, MOTION_TEXT_LOCATIONS);
          emit();
        },
        drawLimit(o),
      );
    }
    if (o.drawBudget) o.log(motionDrawSummary(o.drawBudget));
    await recordSceneLibrary(script, analysis, gen, session, o);
    emit();
    const placeOk = (b: MotionBeat) => !!b.place && !!gen.locations[b.place];
    const stageList = _.filter(focusBeats || sceneBeats, (b) => placeOk(b) && (!!focusBeats || (o.onlyLocations?.length ? _.includes(o.onlyLocations, b.place) : !gen.staging[b.id])));
    const chapterOpeners = new Set(_.map(_.values(_.groupBy(sceneBeats, MOTION_TEXT_CHAPTERID)), (list) => list[0].id));
    const keyList = focusBeats || !longVideo ? stageList : _.filter(stageList, (b) => !!b.emphasis || chapterOpeners.has(b.id));
    const autoList = _.difference(stageList, keyList);
    if (stageList.length) o.log(MOTION_GEN_CONFIG.LOG_KEY_STAGING(keyList.length, autoList.length));
    const groups = longVideo && !focusBeats ? _.chunk(keyList, MOTION_GEN_CONFIG.KEY_BEATS_PER_STAGING_CALL) : _.flatMap(_.values(_.groupBy(keyList, MOTION_TEXT_CHAPTERID)), (list) => _.chunk(list, aiGroupSize(keyList.length)));
    const unstaged: string[] = [];
    let g = 0;
    if (groups.length) progress(0.5, MOTION_TEXT_STAGING);
    await mapMotionAiPool(
      groups,
      async (group) => {
        unstaged.push(...(await stageBeats(group, script, analysis, gen, o, o.note && focusBeats ? _.fromPairs(_.map(group, (b) => [b.id, o.note!])) : {})));
        g++;
        progress(0.5 + (0.25 * g) / Math.max(1, groups.length), MOTION_TEXT_STAGING);
        emit();
      },
      poolLimit(talkExec(o)),
    );
    if (unstaged.length) o.log(MOTION_GEN_CONFIG.LOG_AUTO_FALLBACK(unstaged.length, unstaged));
    autoStageBeats([...autoList, ..._.filter(keyList, (b) => !gen.staging[b.id])], script, analysis, gen, o);
    emit();
    progress(0.76, MOTION_TEXT_REVIEW);
    await directExistingMotionSound(script, gen, o);
    emit();
    await releaseMotionAiSession(o.log);
    progress(0.8, MOTION_TEXT_PREVIEW);
    const stale = focusBeats ? [] : _.filter(sceneBeats, (b) => placeOk(b) && !!gen.staging[b.id] && !_.includes(stageList, b) && needsMotionPreview(gen.previews[b.id]));
    const previewList = [...stageList, ...stale];
    const previewOptions = { ...o, partial: () => emit() };
    if (o.skipPreviews) o.log(MOTION_GEN_CONFIG.LOG_PREVIEWS_SKIPPED);
    else o.log(MOTION_TEMPLATE_DUNG_ANH_XEM_TRUOC_CANH(String(previewList.length)));
    await previewBeats(previewList, script, gen, session, previewOptions);
    emit();
    if (!o.skipPreviews) {
      for (let attempt = 1; attempt <= MOTION_GEN_CONFIG.AUTO_RESTAGE_ATTEMPTS; attempt++) {
        const broken = previewList.filter((beat) => needsMotionPreview(gen.previews[beat.id]));
        if (!broken.length) break;
        autoStageBeats(broken, script, analysis, gen, o, attempt * MOTION_GEN_CONFIG.AUTO_RESTAGE_OFFSET);
        await previewBeats(broken, script, gen, session, previewOptions);
        emit();
      }
    }
    await recordSceneLibrary(script, analysis, gen, session, o);
    emit();
  } finally {
    await session.close();
  }
  progress(0.95, MOTION_TEXT_REVIEW);
  gen.failed = _.map(
    _.filter(sceneBeats, (b) => !gen.staging[b.id] || (!o.skipPreviews && needsMotionPreview(gen.previews[b.id]))),
    MOTION_TEXT_ID,
  );
  gen.updatedAt = new Date().toISOString();
  _.forEach(motionQaReport(out, analysis), (line) => o.log(line));
  progress(1, MOTION_TEXT_DONE);
  return out;
};
export interface MotionSceneSeed {
  cast: MotionSeedCast[];
  places: MotionSeedPlace[];
  showrooms: MotionSeedProp[][];
}
export const customSceneSeed = (items: MotionSceneCustomItem[]): MotionSceneSeed => {
  const groupOf = (item: MotionSceneCustomItem) => motionSceneType(item.type)?.group || item.group;
  const key = (item: MotionSceneCustomItem, index: number) => MOTION_SCENE_SHOWROOM.KEY_PREFIX + index + MOTION_SCENE_LIBRARY.TEXT.DASH + item.type;
  const cast = items.filter((item) => groupOf(item) === MOTION_SCENE_LIBRARY.KIND_CHARACTER).map((item) => ({ type: item.type, name: item.name, gender: item.gender === MR.MOTION_TEXT_FEMALE ? MR.MOTION_TEXT_FEMALE : MR.MOTION_TEXT_MALE, role: motionSceneType(item.type)?.vi || item.name, look: item.description, tags: [] }));
  const places = items.filter((item) => groupOf(item) === MOTION_SCENE_LIBRARY.KIND_LOCATION).map((item) => ({ type: item.type, name: item.name, time: item.time || MOTION_TEXT_DAY, interior: !!item.interior, description: item.description, tags: [] }));
  const props = items.filter((item) => ![MOTION_SCENE_LIBRARY.KIND_CHARACTER, MOTION_SCENE_LIBRARY.KIND_LOCATION].includes(groupOf(item) as never)).map((item, index) => ({ type: item.type, def: key(item, index).replace(MP.IDENTIFIER_INVALID, MOTION_SCENE_LIBRARY.TEXT.UNDERSCORE), name: item.name, description: item.description, tags: [] }));
  return { cast, places, showrooms: _.chunk(props, MOTION_SCENE_LIBRARY.SHOWROOM_SIZE) };
};
export const seedSceneLibrary = async (seed: MotionSceneSeed, referenceStyle: MotionReferenceStyle | undefined, o: GenOptions): Promise<{ characters: number; locations: number; props: number }> => {
  const drawingMode = o.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D;
  const styleKey = motionAssetStyleKey(o.styleReferences, drawingMode);
  const known = new Set(listSceneAssets(styleKey).map((item) => item.name));
  const fresh = <T extends { name: string }>(list: readonly T[]): T[] =>
    list.filter((entry) => {
      if (!known.has(entry.name)) return true;
      o.log(MOTION_SCENE_LIBRARY.LOGS.SEED_SKIP(entry.name));
      return false;
    });
  const cast: MotionCastMember[] = fresh(seed.cast).map((c, index) => ({ key: MOTION_SCENE_LIBRARY.SEED_CAST_PREFIX + index, name: c.name, role: c.role, description: c.role, look: c.look, gender: c.gender, type: c.type, tags: [...c.tags] }));
  const places: MotionPlace[] = fresh(seed.places).map((p, index) => ({ key: MOTION_SCENE_LIBRARY.SEED_PLACE_PREFIX + index, name: p.name, description: p.description, interior: p.interior, time: p.time, type: p.type, tags: [...p.tags] }));
  const showrooms = seed.showrooms.map((group) => fresh(group)).filter((group) => group.length);
  if (!cast.length && !places.length && !showrooms.length) return { characters: 0, locations: 0, props: 0 };
  const analysis: MotionStoryAnalysis = { title: MOTION_SCENE_LIBRARY.SEED_TITLE, logline: MOTION_SCENE_LIBRARY.SEED_TITLE, look: MOTION_SCENE_LIBRARY.SEED_LOOK, era: MOTION_SCENE_LIBRARY.SEED_ERA, chapters: [], cast, places, facts: [], referenceStyle, characterMotion: o.characterMotion === true };
  const script: MotionStoryScript = { title: MOTION_SCENE_LIBRARY.SEED_TITLE, language: MR.MOTION_TEXT_VI, beats: [] };
  const gen = prepareMotionGen(undefined, analysis, drawingMode, styleKey);
  gen.characterMotion = o.characterMotion === true;
  gen.assetStyleKey = styleKey;
  const rid = MOTION_SCENE_LIBRARY.SEED_RUN_PREFIX + Date.now().toString(36);
  _.set(gen, MOTION_TEXT_RUNID, rid);
  o = { ...o, runId: rid, review: false };
  o = { ...o, preamble: genPreamble(analysis, gen, o) };
  applySceneLibrary(analysis, gen, o);
  o.log(
    MOTION_SCENE_LIBRARY.LOGS.SEED_START(
      cast.length,
      places.length,
      _.sumBy(showrooms, (group) => group.length),
    ),
  );
  const progress = o.progress || _.noop;
  const session = await openStillSession();
  const total = places.length + showrooms.length;
  let done = 0;
  let props = 0;
  const dir = path.join(previewRoot(), rid, MOTION_SCENE_LIBRARY.PREVIEW_FOLDER);
  fs.mkdirSync(dir, { recursive: true });
  try {
    if (cast.length) {
      progress(0.05, MOTION_TEXT_BIBLE);
      await designBible(analysis, gen, o).catch((error) => {
        if (o.signal?.aborted) throw error;
        o.log(getMotionErrorSummary(error));
      });
      await recordSceneLibrary(script, { ...analysis, places: [] }, gen, session, o);
    }
    progress(0.3, MOTION_TEXT_LOCATIONS);
    const tick = () => progress(0.3 + (0.65 * ++done) / Math.max(1, total), MOTION_TEXT_LOCATIONS);
    await mapMotionAiPool(
      [...places.map((place) => ({ place })), ...showrooms.map((group, index) => ({ group, index }))],
      async (job) => {
        try {
          if (MR.MOTION_TEXT_PLACE in job) {
            await designLocation(job.place, script, analysis, gen, session, o);
            await recordSceneLibrary(script, { ...analysis, cast: [], places: [job.place] }, gen, session, o);
          } else {
            const showroom: MotionPlace = { key: MOTION_SCENE_SHOWROOM.KEY_PREFIX + job.index, name: MOTION_SCENE_SHOWROOM.NAME, time: MOTION_SCENE_SHOWROOM.TIME, interior: false, description: MOTION_SCENE_SHOWROOM.DESCRIPTION(job.group.map((item) => MOTION_SCENE_SHOWROOM.ITEM(item.def, item.description)).join(MOTION_SCENE_LIBRARY.TEXT.NEWLINE)) };
            await designLocation(showroom, script, analysis, gen, session, o);
            const location: any = gen.locations[showroom.key];
            delete gen.locations[showroom.key];
            for (const item of job.group) {
              const extracted = location ? _.find(extractSceneProps(location, measureNodes, true), { name: item.def }) : undefined;
              if (!extracted) {
                o.log(MOTION_SCENE_LIBRARY.LOGS.PROP_MISSING(item.name));
                continue;
              }
              const thumb = await renderPropThumb(session, gen, extracted.nodes, extracted.size, dir, item.def).catch(() => null);
              saveSceneAsset({ kind: MOTION_SCENE_LIBRARY.KIND_PROP, styleKey, type: item.type, name: item.name, description: item.description, tags: item.tags, size: extracted.size, from: MOTION_SCENE_LIBRARY.SEED_TITLE }, extracted.nodes, thumb);
              props++;
            }
          }
        } catch (error) {
          if (o.signal?.aborted) throw error;
          o.log(getMotionErrorSummary(error));
        }
        tick();
      },
      drawLimit(o),
    );
  } finally {
    await session.close();
  }
  return { characters: _.filter(cast, (c) => hasAuthoredCharacter(gen.cast[c.key])).length, locations: _.filter(places, (p) => !!gen.locations[p.key]).length, props };
};
export const importBaseLibrary = async (o: GenOptions, pack?: MotionBaseLibrary): Promise<{ characters: number; locations: number; props: number }> => {
  const drawingMode = o.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D;
  const styleKey = sharedStyleKeyOf(drawingMode);
  const { characters, locations, props } = pendingBaseLibrary(drawingMode, pack);
  o.log(MOTION_SCENE_LIBRARY.LOGS.IMPORT_START(characters.length, locations.length, props.length));
  const stored = readSceneStyle(styleKey)?.genStyle;
  const gen: MotionGenState = { ...emptyGen(), drawingMode, characterMode: MR.MOTION_TEXT_DRAWN, style: stored && !_.isEmpty(stored) ? cloneJson(stored) : { ...MOTION_SCENE_LIBRARY.DEFAULT_GEN_STYLE }, assetStyleKey: styleKey };
  const rid = MOTION_SCENE_LIBRARY.SEED_RUN_PREFIX + Date.now().toString(36);
  const dir = path.join(previewRoot(), rid, MOTION_SCENE_LIBRARY.PREVIEW_FOLDER);
  fs.mkdirSync(dir, { recursive: true });
  const progress = o.progress || _.noop;
  const total = Math.max(1, characters.length + locations.length + props.length);
  let done = 0;
  const counts = { characters: 0, locations: 0, props: 0 };
  const tick = () => progress((++done / total) * 0.98);
  const session = await openStillSession();
  try {
    for (const c of characters) {
      aborted(o);
      const v = validateGenCharacter(c.design);
      if (!hasAuthoredCharacter(v.value)) {
        o.log(MOTION_SCENE_LIBRARY.LOGS.IMPORT_INVALID(c.name, v.errors.slice(0, 2).join(MOTION_TEXT_SYMBOL_41)));
        tick();
        continue;
      }
      const key = MOTION_SCENE_LIBRARY.BASE_PREFIX + done;
      gen.cast = { [key]: v.value };
      const thumb = await renderCharacterThumb(session, gen, key, dir).catch(() => null);
      saveSceneAsset({ kind: MOTION_SCENE_LIBRARY.KIND_CHARACTER, styleKey, type: c.type, name: c.name, description: c.look, tags: c.tags, gender: c.gender, role: c.role, motion: !_.isEmpty(v.value?.motions), from: MOTION_SCENE_LIBRARY.BASE_FROM, sourceFingerprint: sceneAssetFingerprint(c.design) }, v.value, thumb);
      counts.characters++;
      tick();
    }
    gen.cast = {};
    for (const l of locations) {
      aborted(o);
      const v = validateGenLocation(l.location);
      if (v.errors.length) {
        o.log(MOTION_SCENE_LIBRARY.LOGS.IMPORT_INVALID(l.name, v.errors.slice(0, 2).join(MOTION_TEXT_SYMBOL_41)));
        tick();
        continue;
      }
      const key = MOTION_SCENE_LIBRARY.BASE_PREFIX + done;
      const shots = await renderLocation(session, gen, key, v.value, dir, key).catch(() => ({ files: [] as string[], issues: [] as string[] }));
      saveSceneAsset({ kind: MOTION_SCENE_LIBRARY.KIND_LOCATION, styleKey, type: l.type, name: l.name, description: l.description, tags: l.tags, time: l.time, interior: l.interior, from: MOTION_SCENE_LIBRARY.BASE_FROM, sourceFingerprint: sceneAssetFingerprint(l.location) }, v.value, shots.files[0] || null);
      counts.locations++;
      tick();
    }
    for (const p of props) {
      aborted(o);
      const thumb = await renderPropThumb(session, gen, p.nodes, p.size, dir, p.key).catch(() => null);
      saveSceneAsset({ kind: MOTION_SCENE_LIBRARY.KIND_PROP, styleKey, type: p.type, name: p.name, description: p.description, tags: p.tags, size: p.size, from: MOTION_SCENE_LIBRARY.BASE_FROM, sourceFingerprint: sceneAssetFingerprint(p.nodes) }, p.nodes, thumb);
      counts.props++;
      tick();
    }
  } finally {
    await session.close();
  }
  return counts;
};
let stylePreviewChain: Promise<unknown> = Promise.resolve();
export const renderStylePreview = (presetId: string): Promise<string | null> => {
  const preset = motionStylePreset(presetId);
  if (!preset) return Promise.resolve(null);
  const P = MOTION_STYLE_PREVIEW;
  const dir = path.join(previewRoot(), P.FOLDER);
  const file = path.join(dir, P.FILE(preset.id, P.VERSION) + P.EXT);
  if (fs.existsSync(file)) return Promise.resolve(file);
  const run = stylePreviewChain.then(async () => {
    if (fs.existsSync(file)) return file;
    const base = readBaseLibrary();
    const place = _.find(base.locations, (item) => item.type === P.LOCATION_TYPE && item.time === P.LOCATION_TIME) || base.locations[0];
    const people = _.compact(_.map(P.CAST_TYPES, (type) => _.find(base.characters, { type })));
    const keys = _.map(people, (_person, index) => P.CAST_NAMES[index]);
    const gen: MotionGenState = { ...emptyGen(), cast: _.fromPairs(_.map(people, (person, index) => [keys[index], person.design])), locations: { [P.PLACE]: place.location }, characterMotion: false, drawingMode: preset.mode };
    const beat: MotionBeat = { id: P.BEAT, chapterId: P.BEAT, narration: P.SUBTITLE, visual: MOTION_TEXT_SCENE, place: P.PLACE, cast: keys, action: P.ACTION, shot: P.SHOT };
    const script = { language: MR.MOTION_TEXT_VI, beats: [beat] } as unknown as MotionStoryScript;
    autoStageBeats([beat], script, { cast: _.map(keys, (key) => ({ key, name: key })) } as unknown as MotionStoryAnalysis, gen, { exec: {}, log: _.noop } as unknown as GenOptions);
    const { spec } = beatPreviewSpec(beat, gen, MR.MOTION_TEXT_VI, MOTION_TEXT_16_9, 0);
    const finish = motionStyleFinish(preset.id);
    const full: MotionSpec = { ...spec, ...(finish ? { finish } : {}), subtitles: [{ start: 0, end: spec.duration || 5, text: P.SUBTITLE }] };
    fs.mkdirSync(dir, { recursive: true });
    const session = await openStillSession();
    try {
      const frames = await session.render(full, [{ id: P.FILE(preset.id, P.VERSION), t: P.AT }], dir, { width: P.WIDTH, height: P.HEIGHT, quality: MOTION_TEXT_HIGH });
      return frames[0]?.file && fs.existsSync(frames[0].file) ? frames[0].file : null;
    } finally {
      await session.close();
    }
  });
  stylePreviewChain = run.catch(_.noop);
  return run;
};

export const renderStyleCalibration = async (referenceStyle: MotionReferenceStyle, drawingMode: MotionGenState["drawingMode"], file: string): Promise<string> => {
  const K = MOTION_STYLE_CALIBRATION,
    CS = MOTION_STYLE_CALIBRATION_SET;
  const constraints = motionStyleConstraints(referenceStyle, drawingMode);
  const bodies = _.toString(referenceStyle.kit?.character?.clothing).match(MOTION_ECONOMY_FALLBACK.CLOTHING_HEX) || [];
  const shared = motionTemplateFits(constraints, drawingMode);
  const base = shared ? [] : _.compact(_.map(MOTION_STYLE_PREVIEW.CAST_TYPES, (type) => _.find(readBaseLibrary().characters, { type })?.design));
  const designs = shared || base.length < K.CAST.length ? motionCalibrationCast(referenceStyle, constraints, bodies) : _.map(base, (design) => motionFitCharacter(motionEnforceStyle(validateGenCharacter(design).value, constraints).design, referenceStyle, constraints, drawingMode).design);
  const analysis = { referenceStyle, cast: _.map(K.CAST, (key, index) => ({ key, name: K.CAST_NAMES[index] })) } as unknown as MotionStoryAnalysis;
  const gen: MotionGenState = { ...emptyGen(), cast: _.fromPairs(_.map(K.CAST, (key, index) => [key, validateGenCharacter(designs[index]).value])), locations: { [K.PLACE]: validateGenLocation(motionCalibrationSet(referenceStyle)).value }, characterMotion: false, drawingMode };
  applyReferenceRenderStyle(analysis, gen);
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const frames: string[] = [];
  const session = await openStillSession();
  try {
    for (const [id, shot] of [
      [K.BEAT_WIDE, CS.SHOT_WIDE],
      [K.BEAT_TWO, CS.SHOT_TWO],
    ]) {
      const beat: MotionBeat = { id, chapterId: id, narration: MR.MOTION_TEXT_EMPTY, visual: MOTION_TEXT_SCENE, place: K.PLACE, cast: [...K.CAST], action: CS.ACTION, shot };
      const script = { language: MR.MOTION_TEXT_VI, beats: [beat] } as unknown as MotionStoryScript;
      autoStageBeats([beat], script, analysis, gen, { exec: {}, log: _.noop } as unknown as GenOptions);
      const { spec } = beatPreviewSpec(beat, gen, MR.MOTION_TEXT_VI, MOTION_TEXT_16_9, 0);
      const out = await session.render({ ...spec, subtitles: [] }, [{ id, t: K.AT }], dir, { width: K.WIDTH, height: K.HEIGHT, quality: MOTION_TEXT_HIGH });
      if (out[0]?.file) frames.push(out[0].file);
    }
  } finally {
    await session.close();
  }
  if (frames.length < 2) throw new Error(MOTION_STYLE_METRICS_LOG.CALIBRATE_RENDER);
  const joined = spawnSync(getFfmpegPath(), [K.FLAG_Y, K.FLAG_I, frames[0], K.FLAG_I, frames[1], MR.MOTION_TEXT_FILTER_COMPLEX, K.SHEET_FILTER, file], { windowsHide: true });
  if (joined.status !== 0 || !fs.existsSync(file)) fs.copyFileSync(frames[0], file);
  return file;
};
export const calibrateSceneStyle = async (key: string, o: GenOptions): Promise<MotionSceneStyleSet> => {
  const set = readSceneStyle(key);
  const target = sceneStyleCalibrationPath(key);
  if (!set || !target) throw new Error(MOTION_SCENE_LIBRARY.ERRORS.NOT_FOUND);
  const references = sceneStyleReferences(key);
  const log = o.log;
  log(MOTION_STYLE_METRICS_LOG.CALIBRATE_START(set.name));
  let style = await analyzeMotionReferenceStyleFresh(references, { exec: o.exec, signal: o.signal, log });
  if (!style) throw new Error(MOTION_REFERENCE_PROMPTS.STYLE_FAILED);
  aborted(o);
  log(MOTION_STYLE_METRICS_LOG.CALIBRATE_RENDER);
  const draft = path.join(path.dirname(target), MOTION_STYLE_CALIBRATION.NAME + MOTION_STYLE_CALIBRATION.EXT);
  await renderStyleCalibration(style, set.drawingMode, draft);
  aborted(o);
  log(MOTION_STYLE_METRICS_LOG.CALIBRATE_REVIEW);
  let changes: string[] = [];
  let notes: string = MR.MOTION_TEXT_EMPTY;
  try {
    const raw = await reviewMotionStyleCalibration(references, { name: MOTION_STYLE_CALIBRATION.NAME + MOTION_STYLE_CALIBRATION.EXT, mimeType: MOTION_STYLE_CALIBRATION.MIME, path: draft }, MOTION_STYLE_METRICS_PROMPT.CALIBRATE(motionMetricsText(style.metrics)), MOTION_STYLE_METRICS_PROMPT.CALIBRATE_ARTIFACT, { exec: o.exec, signal: o.signal, log });
    const merged = mergeMotionStyleMetrics(style.metrics, raw?.metrics);
    changes = merged.changes;
    notes = _.truncate(_.toString(raw?.notes || MR.MOTION_TEXT_EMPTY), { length: MOTION_SCENE_LIBRARY.DESCRIPTION_MAX });
    style = { ...style, metrics: merged.metrics };
    log(changes.length ? MOTION_STYLE_METRICS_LOG.CALIBRATE_CHANGES(changes.join(MR.MOTION_TEXT_SYMBOL_14)) : MOTION_STYLE_METRICS_LOG.CALIBRATE_NONE);
  } catch (error) {
    if (o.signal?.aborted) throw error;
    log(MOTION_STYLE_METRICS_LOG.CALIBRATE_REVIEW_FAILED(getMotionErrorSummary(error)));
  }
  style = { ...style, metrics: { ...(style.metrics || {}), calibrated: true } };
  await renderStyleCalibration(style, set.drawingMode, target);
  fs.rmSync(draft, { force: true });
  storeMotionReferenceStyle(references, style);
  const saved = saveSceneStyle(key, { drawingMode: set.drawingMode, referenceStyle: style, calibration: _.omitBy({ at: Date.now(), image: true, notes: notes || undefined, changes: changes.length ? changes : undefined }, _.isUndefined) as unknown as MotionStyleCalibration });
  log(MOTION_STYLE_METRICS_LOG.CALIBRATE_DONE(set.name));
  return saved;
};
