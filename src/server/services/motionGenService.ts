import { MOTION_PATTERNS as MP } from "../../constants/motionPatterns.js";
import { MOTION_SOUND_CONFIG, MOTION_SOUND_EXISTING_PROMPT, MOTION_SOUND_PROMPT } from "../../constants/motionSound.js";
import { normalizeSoundEvents } from "../../lib/motionSound.js";
import { motionAudioDirection } from "../../lib/motionAudioDirection.js";
import type { MotionAudioDirection } from "../../types/motionVideo.js";
import { MOTION_AUDIO_DIRECTION } from "../../constants/motionAudioDirection.js";
import { motionSoundCatalogPrompt } from "./motionSfxLibraryService.js";
import { MOTION_REFERENCE_PROMPTS, MOTION_QA_MESSAGES } from "../../constants/motionReference.js";
import { needsMotionPreview } from "../../lib/motionReference.js";
import type { MotionStyleReference } from "../../types/motionVideo.js";
import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import { createHash } from "crypto";
import { motionVideoGenreDirective } from "../../constants/motionGenre.js";
import { MOTION_STYLE_PRESET_KEY, motionStylePreset } from "../../constants/motionStylePresets.js";
import _ from "lodash";
import path from "path";
import { MOTION_PRODUCTION_BRIEF, productionBriefFor, productionLocationErrors, productionStaging, productionStagingErrors } from "../../lib/motionProductionDesign.js";
import { bindVideoDnaSettings, hasAuthoredCharacter, sceneExecutionKey, scenePlanPrompt, scenePlanStagingErrors } from "../../lib/motionVideoDna.js";
import { MOTION_LIB_TEXT } from "../../constants/motionAssetLibrary.js";
import { MOTION_GEN_ACTIONS_GUIDE, MOTION_GEN_BIBLE_PROMPT, MOTION_GEN_CONFIG, MOTION_GEN_DSL_EXAMPLE, MOTION_GEN_DSL_GUIDE, MOTION_GEN_GRADES, MOTION_GEN_LOCATION_FIX_PROMPT, MOTION_GEN_LOCATION_PROMPT, MOTION_GEN_PREAMBLE, MOTION_GEN_STAGING_PROMPT } from "../../constants/motionGenPrompts.js";
import {
  MOTION_TEMPLATE_A_2,
  MOTION_TEMPLATE_AI_CHINH_BOI_CANH_THEO_NHAN_XET,
  MOTION_TEMPLATE_AI_DAN_DUNG_CANH_VI_TRI_DONG_TAC,
  MOTION_TEMPLATE_AI_DAN_DUNG_LAI_CANH_CON_LOI,
  MOTION_TEMPLATE_AI_SUA_LOI_DINH_DANG_BOI_CANH,
  MOTION_TEMPLATE_AI_SUA_TRANG_PHUC_LAN,
  MOTION_TEMPLATE_AI_VE_BOI_CANH,
  MOTION_TEMPLATE_B_2,
  MOTION_TEMPLATE_BO_QUA_LOI,
  MOTION_TEMPLATE_BOI_CANH_CO_LOI_DINH_DANG_NHO_AI,
  MOTION_TEMPLATE_BOI_CANH_KHOI_DEN,
  MOTION_TEMPLATE_CAST_2,
  MOTION_TEMPLATE_CAST_IS_MISSING,
  MOTION_TEMPLATE_CENTRE_SIZE_X_Y_Z_TOP_Y,
  MOTION_TEMPLATE_CONTINUITY_THE_SHOT_BEFORE_THIS_GROUP_WAS_AT,
  MOTION_TEMPLATE_DAN_DUNG_LOI,
  MOTION_TEMPLATE_DUNG_ANH_XEM_TRUOC_CANH,
  MOTION_TEMPLATE_FILM_LOOK_GRADE,
  MOTION_TEMPLATE_FIX_REQUIRED,
  MOTION_TEMPLATE_FORMAT_ERRORS,
  MOTION_TEMPLATE_ID_LOCATION_TIME_SHOT_HINT_S_CAST_NARRATION,
  MOTION_TEMPLATE_KHONG_VE_DUOC_BOI_CANH,
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
import { getMotionErrorSummary } from "../../lib/motionUtils.js";
import type { MotionAiExecution, MotionBeat, MotionCastMember, MotionGenState, MotionPlace, MotionReferenceStyle, MotionSceneCustomItem, MotionSpec, MotionStoryAnalysis, MotionStoryScript } from "../../types/motionVideo.js";
import { ensureLibraryModel, ensureMotionLibrary, libraryCandidates, libraryPromptList } from "./motionAssetLibraryService.js";
import { estimateBeatSeconds, sceneShots } from "./motionDirectorService.js";
import { validateGenLocation, validateGenCharacter, validateGenStaging } from "./motionEngineService.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import { openStillSession, type MotionStillSession } from "./motionRenderService.js";
import { mapMotionAiPool, runMotionAi, type MotionAiImage } from "./motionStoryService.js";
import { MOTION_SCENE_LIBRARY, MOTION_SCENE_LIBRARY_PROMPT } from "../../constants/motionSceneLibrary.js";
import { MOTION_SCENE_CATALOG_PROMPT, MOTION_SCENE_LIBRARY_MODES, MOTION_SCENE_SHOWROOM, motionSceneType, type MotionSeedCast, type MotionSeedPlace, type MotionSeedProp } from "../../constants/motionSceneCatalog.js";
import { applyCharacterVariant } from "../../lib/motionCharacterVariant.js";
import { assignSceneLibrary, readBaseLibrary, attachSceneProps, extractSceneProps, pendingBaseLibrary, getSceneAsset, listSceneAssets, motionAssetStyleKey, readSceneStyle, saveSceneAsset, saveSceneStyle, sceneAssetThumbPath, sceneStyleFits, scenePropCatalog, sharedStyleKeyOf, touchSceneAssets, type MotionBaseLibrary } from "./motionSceneLibraryService.js";
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
  drawingMode?: "2d" | "3d";
  openingBeatId?: string;
  preamble?: string;
  ai?: typeof runMotionAi;
  runId?: string;
  locationRounds?: number;
}
export const emptyGen = (): MotionGenState => ({ style: {}, cast: {}, locations: {}, locationInfo: {}, staging: {}, previews: {}, failed: [] });
export const prepareMotionGen = (previous: MotionGenState | undefined, analysis: MotionStoryAnalysis, drawingMode: "2d" | "3d" = MR.MOTION_TEXT_3D, referenceKey: string = MR.MOTION_TEXT_EMPTY): MotionGenState => {
  const characterMode = MR.MOTION_TEXT_DRAWN;
  const signature = createHash(MR.MOTION_TEXT_SHA256)
    .update(JSON.stringify({ previewVersion: 5, referenceKey, referenceStyle: analysis.referenceStyle, blueprint: analysis.videoDna || analysis.creativeBlueprint, cast: analysis.cast, places: analysis.places, era: analysis.era, look: analysis.look, characterMode, drawingMode }))
    .digest(MR.MOTION_TEXT_HEX);
  const compatible = previous?.creativeSignature === signature;
  return { ...emptyGen(), ...(compatible ? cloneJson(previous || {}) : {}), creativeSignature: signature, referenceKey, characterMode, drawingMode, videoDna: analysis.videoDna };
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
const kitRenderStyle = (analysis: MotionStoryAnalysis): Partial<MotionGenState["style"]> => {
  const render = analysis.referenceStyle?.kit?.render || {},
    outline = _.toLower(render.outline || MR.MOTION_TEXT_EMPTY),
    tones = parseInt(String(render.shadingTones || MR.MOTION_TEXT_EMPTY), 10);
  return {
    ...(MP.SILHOUETTE.test(outline) ? { outlineSilhouette: true } : {}),
    ...(tones >= 2 || MP.FACE_SHADING.test(_.toLower(render.mode || MR.MOTION_TEXT_EMPTY)) ? { faceShading: true } : {}),
  };
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
export const designBible = async (analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions): Promise<void> => {
  o.log(MOTION_TEXT_AI_THIET_KE_TRANG_PHUC_MA_NO_CANH);
  const preamble = MR.MOTION_TEMPLATE_SYMBOL_147(o.preamble || MOTION_GEN_PREAMBLE, planningPrompt(analysis), MOTION_PRODUCTION_BRIEF);
  const failures: string[] = [];
  let styled = false;
  const todo = o.restyle ? analysis.cast : _.filter(analysis.cast, (c) => !hasAuthoredCharacter(gen.cast[c.key]));
  await mapMotionAiPool(
    _.chunk(todo, MOTION_GEN_CONFIG.BIBLE_BATCH),
    async (batch) => {
      let open = batch.slice();
      const errorsOf: Record<string, string[]> = {};
      for (let attempt = 0; attempt < 3 && open.length; attempt++) {
        aborted(o);
        const keys = _.map(open, MR.MOTION_TEXT_KEY);
        if (attempt) o.log(MOTION_TEMPLATE_AI_SUA_TRANG_PHUC_LAN(String(attempt + 1)) + MR.MOTION_TEXT_SYMBOL_13 + keys.join(MR.MOTION_TEXT_SYMBOL_14));
        const others = _.filter(analysis.cast, (other) => !_.includes(keys, other.key));
        const castText = (open.length > 1 ? MOTION_GEN_CONFIG.BATCH_CAST : MR.MOTION_TEXT_EMPTY) + castLines({ ...analysis, cast: open }) + (others.length ? MOTION_TEXT_SYMBOL_27 + MOTION_GEN_CONFIG.OTHER_CAST + castLines({ ...analysis, cast: others }) : MR.MOTION_TEXT_EMPTY);
        const errors = _.flatMap(keys, (key) => errorsOf[key] || []);
        const raw = await (o.ai || runMotionAi)(MOTION_GEN_BIBLE_PROMPT({ preamble, story: storyLine(analysis), era: analysis.era || MR.MOTION_TEXT_EMPTY, look: analysis.look, cast: castText, errors: errors.join(MOTION_TEXT_SYMBOL_27) }) + MOTION_TEXT_SYMBOL_27 + MOTION_SCENE_CATALOG_PROMPT.CHARACTER_SCHEMA, MOTION_GEN_CONFIG.ARTIFACT_BIBLE, o.exec, o.signal, o.log).catch((e) => {
          if (o.signal?.aborted) throw e;
          _.forEach(keys, (key) => (errorsOf[key] = [getMotionErrorSummary(e)]));
          return null;
        });
        if (!raw) continue;
        const failed: typeof open = [];
        for (const c of open) {
          const rawDesign = _.get(raw, [MOTION_TEXT_CAST, c.key]) || (open.length === 1 && _.size(raw.cast) === 1 ? _.values(raw.cast)[0] : undefined);
          if (!rawDesign) {
            o.log(MR.MOTION_TEMPLATE_CHARACTER_SCHEMA_MISMATCH_ROOT_FIELDS_CAST_KEYS_EXPECTED(Object.keys(raw).join(MR.MOTION_TEXT_SYMBOL_14), Object.keys(raw.cast || {}).join(MR.MOTION_TEXT_SYMBOL_14), c.key));
            errorsOf[c.key] = [MOTION_TEMPLATE_CAST_IS_MISSING(String(c.key))];
            failed.push(c);
            continue;
          }
          const legacy = LEGACY_CHARACTER_KEYS.filter((key) => key in rawDesign);
          if (legacy.length && !Array.isArray(rawDesign.parts)) {
            errorsOf[c.key] = [MOTION_GEN_CONFIG.LEGACY_SCHEMA + legacy.join(MR.MOTION_TEXT_SYMBOL_14)];
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
              ...kitRenderStyle(analysis),
            };
          }
          const materials = { ...(raw.materials || {}), ...(rawDesign.materials || {}) };
          const selected = { ...rawDesign, ...(rawDesign.parts ? { parts: rawDesign.parts.map((p: any) => ({ ...p, nodes: characterNodes(p.nodes, materials) })) } : {}) };
          const v = validateGenCharacter(selected);
          if (!hasAuthoredCharacter(v.value)) {
            errorsOf[c.key] = [MR.MOTION_TEMPLATE_COMPLETE_VALID_CUSTOM_CHARACTER_DESIGN_REQUIRED(c.key, v.errors.join(MR.MOTION_TEXT_SYMBOL_41))];
            failed.push(c);
            continue;
          }
          if (v.errors.length) o.log(MOTION_TEMPLATE_CAST_2(String(c.key), String(_.take(v.errors, 3).join(MOTION_TEXT_SYMBOL_41))));
          gen.cast[c.key] = v.value;
          delete errorsOf[c.key];
        }
        open = failed;
      }
      for (const c of open) failures.push(...(errorsOf[c.key] || [MOTION_TEMPLATE_CAST_IS_MISSING(String(c.key))]));
    },
    drawLimit(o),
  );
  if (!styled && _.isEmpty(gen.style)) gen.style = { grade: MOTION_TEXT_NEUTRAL, notes: MR.MOTION_TEXT_EMPTY, outlineColor: analysis.referenceStyle?.outlineColor, outlineWidth: analysis.referenceStyle?.outlineWidth, ...kitRenderStyle(analysis) };
  if (failures.length) throw new Error(MR.MOTION_TEMPLATE_CANNOT_BUILD_CUSTOM_CHARACTERS(failures.join(MR.MOTION_TEXT_SYMBOL_41)));
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
export const designLocation = async (place: MotionPlace, script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: MotionGenState, session: MotionStillSession, o: GenOptions): Promise<void> => {
  const dir = path.join(previewRoot(), runId(script, o), MOTION_TEMPLATE_LOC(String(place.key)));
  const uses = usesOf(place.key, script);
  const productionBrief = MR.MOTION_TEMPLATE_SYMBOL_156(planningPrompt(analysis), productionBriefFor(place, uses));
  const style = MOTION_TEMPLATE_FILM_LOOK_GRADE(String(analysis.look), String(gen.style.notes || MR.MOTION_TEXT_EMPTY), String(gen.style.grade || MOTION_TEXT_NEUTRAL));
  const styleKey = gen.assetStyleKey || MR.MOTION_TEXT_EMPTY;
  const library = _.compact([libraryFor(place, uses, analysis.era || MR.MOTION_TEXT_EMPTY), styleKey ? scenePropCatalog(styleKey, [place.name, place.description, uses].join(MOTION_SCENE_LIBRARY.TEXT.NEWLINE)) : MR.MOTION_TEXT_EMPTY, MOTION_SCENE_LIBRARY_PROMPT.LOCATION_DEFS]).join(MOTION_TEXT_SYMBOL_27);
  if (gen.assetSources) delete gen.assetSources[MOTION_SCENE_LIBRARY.SOURCE_PLACE + place.key];
  let raw: any = o.note && gen.locations[place.key] ? gen.locations[place.key] : null;
  let errors: string[] = [];
  let best: { value: any; score: number; files: string[]; issues: string[] } | null = null;
  let issues: string[] = o.note ? [o.note] : [];
  for (let round = 0; round < (o.locationRounds || MOTION_GEN_CONFIG.LOCATION_ROUNDS); round++) {
    aborted(o);
    let value: any = null;
    for (let fix = 0; fix < 3; fix++) {
      aborted(o);
      const prompt =
        !raw && !best
          ? MOTION_GEN_LOCATION_PROMPT({
              preamble: o.preamble || MOTION_GEN_PREAMBLE,
              guide: MR.MOTION_TEMPLATE_SYMBOL_160(productionBrief, MOTION_GEN_DSL_GUIDE),
              example: MOTION_GEN_DSL_EXAMPLE,
              era: analysis.era || MR.MOTION_TEXT_EMPTY,
              story: storyLine(analysis),
              key: place.key,
              name: place.name,
              description: place.description,
              interior: !!place.interior,
              time: place.time || MOTION_TEXT_DAY,
              uses,
              style,
              library,
              note: o.note ? MOTION_TEMPLATE_USER_NOTE(String(o.note)) : MR.MOTION_TEXT_EMPTY,
            })
          : MOTION_GEN_LOCATION_FIX_PROMPT({
              preamble: o.preamble || MOTION_GEN_PREAMBLE,
              guide: MR.MOTION_TEMPLATE_SYMBOL_162(productionBrief, MOTION_GEN_DSL_GUIDE),
              library,
              key: place.key,
              description: place.description,
              previous: stringifyJson(raw || best?.value),
              issues: _.map(issues, (s) => MOTION_TEMPLATE_SYMBOL_23(String(s))).join(MOTION_TEXT_SYMBOL_27),
              errors: _.map(_.take(errors, 25), (s) => MOTION_TEMPLATE_SYMBOL_23(String(s))).join(MOTION_TEXT_SYMBOL_27),
            });
      o.log(!raw && !best ? MOTION_TEMPLATE_AI_VE_BOI_CANH(String(place.name)) : errors.length ? MOTION_TEMPLATE_AI_SUA_LOI_DINH_DANG_BOI_CANH(String(place.name)) : MOTION_TEMPLATE_AI_CHINH_BOI_CANH_THEO_NHAN_XET(String(place.name)));
      try {
        const res = await (o.ai || runMotionAi)(prompt, MOTION_GEN_CONFIG.ARTIFACT_LOCATION, o.exec, o.signal, o.log);
        raw = res?.location || res;
        const props = styleKey ? attachSceneProps(raw, styleKey) : [];
        if (props.length) o.log(MOTION_SCENE_LIBRARY.LOGS.PROPS_ADDED(props.join(MOTION_SCENE_LIBRARY.TEXT.LIST)));
      } catch (e) {
        if (o.signal?.aborted) throw e;
        errors = [getMotionErrorSummary(e)];
        continue;
      }
      const v = validateGenLocation(raw);
      errors = v.errors;
      const suggestions = productionLocationErrors(v.value);
      if (suggestions.length) o.log(MOTION_QA_MESSAGES.ADVISORY(suggestions));
      if (errors.length) o.log(MR.MOTION_TEMPLATE_GEOMETRY_CORRECTIONS(errors.slice(0, 4).join(MR.MOTION_TEXT_SYMBOL_41)));
      if (!errors.length) {
        value = await materializeModels(v.value, o);
        o.log(MOTION_TEMPLATE_BOI_CANH_KHOI_DEN(String(place.name), String(v.stats?.nodes || 0), String(v.stats?.lights || 0), String(errors.length ? MOTION_TEMPLATE_BO_QUA_LOI(String(errors.length)) : MR.MOTION_TEXT_EMPTY)));
        break;
      }
      o.log(MOTION_TEMPLATE_BOI_CANH_CO_LOI_DINH_DANG_NHO_AI(String(place.name), String(errors.length)));
    }
    if (!value) break;
    errors = [];
    const shots = await renderLocation(session, gen, place.key, value, dir, MOTION_TEMPLATE_R(String(round + 1)));
    const score = 0;
    issues = [];
    if (!best || score >= best.score) best = { value, score, files: shots.files, issues };
    gen.locations[place.key] = best.value;
    gen.locationInfo[place.key] = { files: _.map(best.files, genPreviewRel), issues: best.issues, at: new Date().toISOString() };
    o.partial?.(null);
    if (best) break;
    raw = value;
  }
  if (!best) throw new Error(MOTION_TEMPLATE_KHONG_VE_DUOC_BOI_CANH(String(place.name)));
};
const r2 = (v: number) => Math.round(v * 100) / 100;
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
const beatLines = (beats: MotionBeat[], lang: string, notes: Record<string, string>): string =>
  _.map(beats, (b) =>
    MOTION_TEMPLATE_ID_LOCATION_TIME_SHOT_HINT_S_CAST_NARRATION(
      String(b.id),
      String(b.place),
      String(b.time || MOTION_TEXT_SYMBOL_25),
      String(b.shot || MOTION_TEXT_MEDIUM),
      String(beatSeconds(b, lang).toFixed(1)),
      String((b.cast || []).join(MOTION_TEXT_SYMBOL_14) || MOTION_TEXT_NOBODY),
      String(b.narration),
      MR.MOTION_TEMPLATE_SYMBOL_204(b.action || MOTION_TEXT_FOLLOW_THE_NARRATION, scenePlanPrompt(b.scenePlan)),
      String(notes[b.id] ? MOTION_TEMPLATE_FIX_REQUIRED(String(notes[b.id])) : MR.MOTION_TEXT_EMPTY),
    ),
  ).join(MOTION_TEXT_SYMBOL_27);
export const stageBeats = async (beats: MotionBeat[], script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions, notes: Record<string, string> = {}): Promise<string[]> => {
  const lang = script.language;
  const ctx = stagingContext(gen);
  const castInfo = JSON.stringify(analysis.cast.map((c) => ({ key: c.key, name: c.name, role: c.role, look: c.look, design: gen.cast[c.key] })));
  let todo = beats.slice();
  const localNotes = { ...notes };
  for (let attempt = 0; attempt < MOTION_GEN_CONFIG.STAGING_TRIES && todo.length; attempt++) {
    aborted(o);
    const locKeys = _.uniq(_.compact(_.map(todo, MOTION_TEXT_PLACE)));
    const firstIndex = script.beats.findIndex((b) => b.id === todo[0].id);
    const prev = _.findLast(script.beats.slice(0, firstIndex), (b) => b.visual === MOTION_TEXT_SCENE && !!gen.staging[b.id]);
    const continuity = prev ? MOTION_TEMPLATE_CONTINUITY_THE_SHOT_BEFORE_THIS_GROUP_WAS_AT(String(prev.id), String(_.get(gen.staging, [prev.id, MOTION_TEXT_LOCATION]))) : MR.MOTION_TEXT_EMPTY;
    const prompt = MOTION_GEN_STAGING_PROMPT({
      preamble: o.preamble || MOTION_GEN_PREAMBLE,
      story: storyLine(analysis),
      actions: [MOTION_GEN_ACTIONS_GUIDE(), MOTION_SOUND_PROMPT, MOTION_SCENE_LIBRARY_PROMPT.STAGING_SOUND, await motionSoundCatalogPrompt(beatLines(todo, lang, localNotes)), motionVideoGenreDirective(analysis.videoGenre)].join(MR.MOTION_TEXT_SYMBOL_27),
      cast: castInfo,
      locations: _.map(locKeys, (k) => locationSummary(k, gen.locations[k], _.find(analysis.places, { key: k }))).join(MOTION_TEXT_SYMBOL_37),
      beats: beatLines(todo, lang, localNotes),
      continuity,
      notes: MR.MOTION_TEMPLATE_SYMBOL_214(planningPrompt(analysis), locKeys.map((k) => productionBriefFor(gen.locations[k] || {}, usesOf(k, script))).join(MR.MOTION_TEXT_SYMBOL_37), o.note ? MOTION_TEMPLATE_USER_NOTE(String(o.note)) : MR.MOTION_TEXT_EMPTY),
    });
    o.log(attempt ? MOTION_TEMPLATE_AI_DAN_DUNG_LAI_CANH_CON_LOI(String(todo.length)) : MOTION_TEMPLATE_AI_DAN_DUNG_CANH_VI_TRI_DONG_TAC(String(todo.length)));
    let raw: any;
    try {
      raw = await (o.ai || runMotionAi)(prompt, MOTION_GEN_CONFIG.ARTIFACT_STAGING, talkExec(o), o.signal, o.log);
    } catch (e) {
      if (o.signal?.aborted) throw e;
      o.log(MOTION_TEMPLATE_DAN_DUNG_LOI(String(getMotionErrorSummary(e))));
      continue;
    }
    const list = _.castArray(raw?.beats || []);
    const failed: MotionBeat[] = [];
    for (const b of todo) {
      const item = _.find(list, (x: any) => _.toString(x?.id) === b.id) || (todo.length === 1 && list.length === 1 ? list[0] : null);
      if (!item) {
        failed.push(b);
        localNotes[b.id] = MOTION_TEXT_THIS_BEAT_WAS_MISSING_FROM_YOUR_ANSWER;
        continue;
      }
      const input = { ...item, location: item.location || b.place };
      let prepared: any;
      try {
        prepared = productionStaging(input, gen.locations[input.location]);
      } catch (e) {
        failed.push(b);
        localNotes[b.id] = getMotionErrorSummary(e);
        continue;
      }
      const v = validateGenStaging(prepared, ctx);
      const serious = [..._.filter(v.errors, (e) => !MP.UNKNOWN_ACTION.test(e)), ...(Array.isArray(b.cast) ? (v.value.actors || []).filter((actor: any) => !b.cast!.includes(actor.cast)).map((actor: any) => MR.MOTION_TEMPLATE_ACTOR_IS_NOT_REQUESTED_BY_THIS_BEAT_USE_ONLY_BEAT_CAST_AN_EMPTY_C(actor.cast)) : [])];
      const suggestions = [...productionStagingErrors(v.value, gen.locations[input.location]), ...scenePlanStagingErrors(b.scenePlan, v.value, gen.locations[input.location])];
      if (suggestions.length) o.log(MOTION_QA_MESSAGES.ADVISORY(suggestions));
      if (serious.length) {
        failed.push(b);
        localNotes[b.id] = MOTION_TEMPLATE_FORMAT_ERRORS(String(_.take(serious, 6).join(MOTION_TEXT_SYMBOL_41)));
        continue;
      }
      gen.staging[b.id] = v.value;
      delete localNotes[b.id];
    }
    todo = failed;
  }
  for (const b of todo) o.log(MR.MOTION_TEMPLATE_CANNOT_STAGE_AFTER_CORRECTION_ATTEMPTS(b.id, MOTION_GEN_CONFIG.STAGING_TRIES, localNotes[b.id] || MR.MOTION_TEXT_AI_DID_NOT_RETURN_A_VALID_SCENE));
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
      const width = Math.round(MOTION_GEN_CONFIG.PREVIEW_WIDTH * Math.min(1, aw / ah));
      const height = Math.round((width * ah) / aw);
      const r = await session.render(spec, picks, dir, { width, height, quality: MOTION_TEXT_DRAFT, label: true });
      gen.previews[b.id] = { ...(gen.previews[b.id] || {}), file: genPreviewRel(r[0].file), files: r.map((frame) => genPreviewRel(frame.file)), issues: _.uniq(r.flatMap((frame) => frame.issues)), score: undefined, at: new Date().toISOString() };
    } catch (e) {
      if (o.signal?.aborted) throw e;
      gen.previews[b.id] = { ...(gen.previews[b.id] || {}), file: undefined, files: [], score: 0, issues: [MOTION_TEMPLATE_RENDER_ERROR(String(getMotionErrorSummary(e)))] };
    }
  }
};
const aiGroupSize = (count: number): number => _.clamp(Math.ceil(count / MOTION_STORY_CONFIG.AI_PARALLEL), MOTION_GEN_CONFIG.MIN_BEATS_PER_AI_CALL, MOTION_GEN_CONFIG.BEATS_PER_STAGING_CALL);
const autoNotes = (beats: MotionBeat[], gen: MotionGenState): Record<string, string> => {
  const notes: Record<string, string> = {};
  for (const b of beats) {
    const auto = _.filter(gen.previews[b.id]?.issues || [], (s) => MOTION_QA_MESSAGES.RENDER_FAILURE.test(s));
    if (auto.length) notes[b.id] = auto.join(MOTION_TEXT_SYMBOL_41);
  }
  return notes;
};
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
  await mapMotionAiPool(_.chunk(beats, beats.length > MOTION_GEN_CONFIG.LONG_VIDEO_SCENE_BEATS ? MOTION_GEN_CONFIG.KEY_BEATS_PER_STAGING_CALL : aiGroupSize(beats.length)), async (group) => {
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
  const lower = _.toLower(text);
  const score = (name: string): number =>
    _.sumBy(
      _.filter(name.split(MOTION_GEN_CONFIG.AUTO_WORD_SPLIT), (word) => word.length > 2),
      (word) => (new RegExp(MP.WORD_BOUNDARY(_.escapeRegExp(_.toLower(word)))).test(lower) ? 1 : 0),
    );
  const best = _.maxBy(names, score);
  return best && score(best) > 0 ? best : MOTION_GEN_CONFIG.AUTO_IDLE;
};
const autoExpression = (design: any, b: MotionBeat, cast: string): string | undefined => {
  const emotion = _.toString((_.find(b.utterances || [], (u) => u.speaker === cast) || _.first(b.utterances))?.emotion);
  const names = _.keys(design?.expressions);
  return _.find([emotion, MOTION_GEN_CONFIG.AUTO_EMOTION_EXPRESSION[emotion]], (name) => !!name && _.includes(names, name));
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
const autoStaging = (b: MotionBeat, index: number, script: MotionStoryScript, gen: MotionGenState, names: Record<string, string>): any => {
  const L: any = gen.locations[b.place || MR.MOTION_TEXT_EMPTY];
  const cast = _.filter(b.cast || [], (key) => !!gen.cast[key]);
  const text = [b.action, b.scenePlan?.subject, b.scenePlan?.composition].join(MR.MOTION_TEXT_SYMBOL_27);
  const speaker = beatSpeaker(b);
  const lead = speaker || cast[0];
  const position = script.beats.findIndex((other) => other.id === b.id);
  const prevIndex = position > 0 ? _.findLastIndex(script.beats, (other) => other.visual === MOTION_TEXT_SCENE && !!gen.staging[other.id] && castSetKey(other) === castSetKey(b), position - 1) : -1;
  const reference: any = prevIndex >= 0 ? gen.staging[script.beats[prevIndex].id] : null;
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
const autoStageBeats = (beats: MotionBeat[], script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions): void => {
  const ctx = stagingContext(gen);
  const ordered = _.sortBy(beats, (b) => script.beats.findIndex((other) => other.id === b.id));
  for (const b of ordered) {
    const raw = autoStaging(
      b,
      script.beats.findIndex((other) => other.id === b.id),
      script,
      gen,
      Object.fromEntries(_.map(analysis.cast, (c) => [c.key, c.name])),
    );
    let prepared = raw;
    try {
      prepared = productionStaging(raw, gen.locations[raw.location]);
    } catch (error) {
      o.log(getMotionErrorSummary(error));
    }
    gen.staging[b.id] = validateGenStaging(prepared, ctx).value;
  }
  if (ordered.length) o.log(MOTION_GEN_CONFIG.LOG_AUTO_STAGED(ordered.length));
};
const genPreamble = (analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions, extra: string = MR.MOTION_TEXT_EMPTY): string =>
  MR.MOTION_TEMPLATE_SYMBOL_225(
    _.compact([o.preamble || productionPreamble(analysis, MR.MOTION_TEXT_VISUAL), extra]).join(MR.MOTION_TEXT_SYMBOL_27),
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
const fillSceneLibrary = (analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions): MotionStoryAnalysis => {
  if (o.restyle || !gen.assetStyleKey || analysis.libraryMode === MOTION_SCENE_LIBRARY_MODES.OFF) return analysis;
  const cast = _.filter(analysis.cast, (c) => !c.reuse && !hasAuthoredCharacter(gen.cast[c.key]));
  const places = _.filter(analysis.places, (p) => !p.reuse && !gen.locations[p.key] && !_.includes(o.onlyLocations || [], p.key));
  if (!cast.length && !places.length) return analysis;
  const filled = assignSceneLibrary({ ...analysis, cast, places }, gen.assetStyleKey, MOTION_SCENE_LIBRARY_MODES.AUTO, o.characterMotion);
  const castCount = _.filter(filled.cast, (c) => !!c.reuse).length,
    placeCount = _.filter(filled.places, (p) => !!p.reuse).length;
  if (!castCount && !placeCount) return analysis;
  o.log(MOTION_GEN_CONFIG.LOG_LIBRARY_FILLED(castCount, placeCount));
  return { ...analysis, cast: _.map(analysis.cast, (c) => _.find(filled.cast, { key: c.key }) || c), places: _.map(analysis.places, (p) => _.find(filled.places, { key: p.key }) || p) };
};
const applySceneLibrary = (analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions): void => {
  const styleKey = gen.assetStyleKey || MR.MOTION_TEXT_EMPTY;
  const sources = (gen.assetSources ||= {});
  const used: string[] = [];
  if (_.isEmpty(gen.style)) {
    const stored = readSceneStyle(styleKey)?.genStyle;
    if (stored && !_.isEmpty(stored)) {
      gen.style = cloneJson(stored);
      o.log(MOTION_SCENE_LIBRARY.LOGS.REUSED_STYLE);
    }
  }
  if (o.restyle) _.forEach(analysis.cast, (c) => delete sources[MOTION_SCENE_LIBRARY.SOURCE_CAST + c.key]);
  else
    for (const c of analysis.cast) {
      if (!c.reuse || hasAuthoredCharacter(gen.cast[c.key])) continue;
      const asset = getSceneAsset(c.reuse);
      if (!asset || asset.item.kind !== MOTION_SCENE_LIBRARY.KIND_CHARACTER || !sceneStyleFits(asset.item.styleKey, styleKey) || !hasAuthoredCharacter(asset.data) || (o.characterMotion && !asset.item.motion)) continue;
      gen.cast[c.key] = applyCharacterVariant(asset.data, c.type || asset.item.type, { index: c.variant || 0, colors: c.colors }).design;
      sources[MOTION_SCENE_LIBRARY.SOURCE_CAST + c.key] = asset.item.id;
      used.push(asset.item.id);
      o.log(MOTION_SCENE_LIBRARY.LOGS.REUSED_CHARACTER(c.name, asset.item.name));
    }
  for (const place of analysis.places) {
    if (!place.reuse || gen.locations[place.key] || _.includes(o.onlyLocations || [], place.key)) continue;
    const asset = getSceneAsset(place.reuse);
    if (!asset || asset.item.kind !== MOTION_SCENE_LIBRARY.KIND_LOCATION || !sceneStyleFits(asset.item.styleKey, styleKey) || !asset.data?.stage) continue;
    gen.locations[place.key] = cloneJson(asset.data);
    sources[MOTION_SCENE_LIBRARY.SOURCE_PLACE + place.key] = asset.item.id;
    const rel = libraryPreviewRel(asset.item.id);
    gen.locationInfo[place.key] = { files: rel ? [rel] : [], issues: [], at: new Date().toISOString() };
    used.push(asset.item.id);
    o.log(MOTION_SCENE_LIBRARY.LOGS.REUSED_LOCATION(place.name, asset.item.name));
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
  try {
    saveSceneStyle(styleKey, { references: o.styleReferences, drawingMode: gen.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D, referenceStyle: analysis.referenceStyle, genStyle: gen.style, name: from });
    const dir = path.join(previewRoot(), runId(script, o), MOTION_SCENE_LIBRARY.PREVIEW_FOLDER);
    fs.mkdirSync(dir, { recursive: true });
    const stored = new Map(
      listSceneAssets(styleKey)
        .filter((item) => item.styleKey === styleKey)
        .map((item) => [item.kind + MOTION_SCENE_LIBRARY.TEXT.PIPE + item.name, item.id]),
    );
    const storedId = (kind: string, name: string): string | undefined => stored.get(kind + MOTION_SCENE_LIBRARY.TEXT.PIPE + name);
    for (const c of analysis.cast) {
      const design: any = gen.cast[c.key];
      if (sources[MOTION_SCENE_LIBRARY.SOURCE_CAST + c.key] || !hasAuthoredCharacter(design)) continue;
      const sameCharacter = storedId(MOTION_SCENE_LIBRARY.KIND_CHARACTER, c.name);
      if (sameCharacter) {
        sources[MOTION_SCENE_LIBRARY.SOURCE_CAST + c.key] = sameCharacter;
        continue;
      }
      const thumb = await renderCharacterThumb(session, gen, c.key, dir).catch(() => null);
      const item = saveSceneAsset({ kind: MOTION_SCENE_LIBRARY.KIND_CHARACTER, styleKey, type: c.type, name: c.name, description: _.compact([c.look, c.description]).join(MOTION_SCENE_LIBRARY.TEXT.SEP), tags: c.tags, gender: c.gender, role: c.role, motion: !_.isEmpty(design?.motions), from }, design, thumb);
      sources[MOTION_SCENE_LIBRARY.SOURCE_CAST + c.key] = item.id;
      characters++;
    }
    const knownProps = new Set(listSceneAssets(styleKey, MOTION_SCENE_LIBRARY.KIND_PROP).map((item) => item.name));
    for (const place of analysis.places) {
      const location: any = gen.locations[place.key];
      if (!location || sources[MOTION_SCENE_LIBRARY.SOURCE_PLACE + place.key]) continue;
      const samePlace = storedId(MOTION_SCENE_LIBRARY.KIND_LOCATION, place.name);
      if (samePlace) {
        sources[MOTION_SCENE_LIBRARY.SOURCE_PLACE + place.key] = samePlace;
        continue;
      }
      const preview = gen.locationInfo[place.key]?.files?.[0];
      const item = saveSceneAsset({ kind: MOTION_SCENE_LIBRARY.KIND_LOCATION, styleKey, type: place.type, name: place.name, description: place.description, tags: place.tags, time: location.time || place.time, interior: !!(location.interior ?? place.interior), from }, location, preview ? resolveGenPreview(preview) : null);
      sources[MOTION_SCENE_LIBRARY.SOURCE_PLACE + place.key] = item.id;
      locations++;
      for (const prop of extractSceneProps(location, measureNodes)) {
        if (knownProps.has(prop.name)) continue;
        knownProps.add(prop.name);
        const thumb = await renderPropThumb(session, gen, prop.nodes, prop.size, dir, prop.name).catch(() => null);
        saveSceneAsset({ kind: MOTION_SCENE_LIBRARY.KIND_PROP, styleKey, name: prop.name, description: place.name, tags: [prop.name.replace(MP.UNDERSCORE, MOTION_SCENE_LIBRARY.TEXT.SPACE)], size: prop.size, from: place.name }, prop.nodes, thumb);
        props++;
      }
    }
    if (characters || locations || props) o.log(MOTION_SCENE_LIBRARY.LOGS.SAVED(locations, characters, props));
  } catch (error) {
    o.log(MOTION_SCENE_LIBRARY.LOGS.SAVE_FAILED(getMotionErrorSummary(error)));
  }
};
export const buildScenes = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, o: GenOptions): Promise<MotionStoryScript> => {
  if (o.styleReferences?.length && !o.referenceKey) return buildScenes(script, analysis, { ...o, referenceKey: createHash(MR.MOTION_TEXT_SHA256).update(JSON.stringify(o.styleReferences)).digest(MR.MOTION_TEXT_HEX) });
  analysis = bindVideoDnaSettings({ ...analysis, characterMotion: o.characterMotion === true }, { drawingMode: o.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D, characterMode: MR.MOTION_TEXT_DRAWN, aspect: o.aspect || MR.MOTION_TEXT_16_9 });
  const gen = prepareMotionGen(script.gen, analysis, o.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D, o.referenceKey);
  if (gen.characterMotion !== (o.characterMotion === true)) {
    gen.staging = {};
    gen.previews = {};
  }
  gen.characterMotion = o.characterMotion === true;
  const rid = runId(script, o);
  _.set(gen, MOTION_TEXT_RUNID, rid);
  const drawPreamble = genPreamble(analysis, gen, o);
  o = {
    ...o,
    runId: rid,
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
    o = { ...o, locationRounds: o.locationRounds || MOTION_GEN_CONFIG.LONG_LOCATION_ROUNDS };
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
  analysis = fillSceneLibrary(analysis, gen, o);
  applySceneLibrary(analysis, gen, o);
  const castToDraw = o.restyle ? analysis.cast.length : _.filter(analysis.cast, (c) => !hasAuthoredCharacter(gen.cast[c.key])).length;
  const placesToDraw = _.filter(analysis.places, (p) => _.some(sceneBeats, (b) => b.place === p.key) && (!gen.locations[p.key] || _.includes(o.onlyLocations || [], p.key))).length;
  o.log(MOTION_GEN_CONFIG.LOG_LIBRARY_PLAN(analysis.cast.length - castToDraw, analysis.places.length - placesToDraw, castToDraw, placesToDraw, Math.ceil(castToDraw / MOTION_GEN_CONFIG.BIBLE_BATCH) + placesToDraw));
  const focusBeats = o.onlyBeats?.length ? _.filter(sceneBeats, (b) => _.includes(o.onlyBeats, b.id)) : null;
  const castMissing = _.some(analysis.cast, (c) => !hasAuthoredCharacter(gen.cast[c.key]));
  if (o.restyle || castMissing || (o.characterMotion && script.gen?.characterMotion !== true) || _.isEmpty(gen.style)) {
    progress(0.03, MOTION_TEXT_BIBLE);
    try {
      await designBible(analysis, gen, { ...o, preamble: drawPreamble });
    } catch (error) {
      if (!o.signal?.aborted) {
        const early = await openStillSession().catch(() => null);
        if (early) await recordSceneLibrary(script, { ...analysis, places: [] }, gen, early, o).finally(() => early.close());
      }
      throw error;
    }
    emit();
  }
  const session = await openStillSession();
  try {
    const neededPlaces = _.uniq(_.compact(_.map(focusBeats || sceneBeats, MOTION_TEXT_PLACE)));
    const toDesign = _.filter(analysis.places, (p) => _.includes(neededPlaces, p.key) && (!gen.locations[p.key] || _.includes(o.onlyLocations || [], p.key)));
    let done = 0;
    if (toDesign.length) {
      progress(0.08, MOTION_TEXT_LOCATIONS);
      o.log(MOTION_TEMPLATE_VE_BOI_CANH(String(toDesign.length)));
      await mapMotionAiPool(
        toDesign,
        async (place) => {
          await designLocation(place, script, analysis, gen, session, { ...o, preamble: drawPreamble, partial: () => emit() });
          done++;
          progress(0.08 + (0.4 * done) / toDesign.length, MOTION_TEXT_LOCATIONS);
          emit();
        },
        drawLimit(o),
      );
    }
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
    if (unstaged.length) o.log(MOTION_GEN_CONFIG.LOG_AUTO_FALLBACK(unstaged.length));
    autoStageBeats([...autoList, ..._.filter(keyList, (b) => !gen.staging[b.id])], script, analysis, gen, o);
    emit();
    progress(0.76, MOTION_TEXT_PREVIEW);
    const stale = focusBeats ? [] : _.filter(sceneBeats, (b) => placeOk(b) && !!gen.staging[b.id] && !_.includes(stageList, b) && needsMotionPreview(gen.previews[b.id]));
    const previewList = [...stageList, ...stale];
    o.log(MOTION_TEMPLATE_DUNG_ANH_XEM_TRUOC_CANH(String(previewList.length)));
    await previewBeats(previewList, script, gen, session, o);
    emit();
    const broken = previewList.filter((beat) => needsMotionPreview(gen.previews[beat.id]));
    if (broken.length) {
      const notes = autoNotes(broken, gen);
      await mapMotionAiPool(_.chunk(broken, longVideo ? MOTION_GEN_CONFIG.KEY_BEATS_PER_STAGING_CALL : aiGroupSize(broken.length)), (group) => stageBeats(group, script, analysis, gen, o, notes), poolLimit(talkExec(o)));
      await previewBeats(broken, script, gen, session, o);
      emit();
    }
    await recordSceneLibrary(script, analysis, gen, session, o);
    emit();
  } finally {
    await session.close();
  }
  progress(0.9, MOTION_TEXT_REVIEW);
  await directExistingMotionSound(script, gen, o);
  emit();
  gen.failed = _.map(
    _.filter(sceneBeats, (b) => !gen.staging[b.id] || needsMotionPreview(gen.previews[b.id])),
    MOTION_TEXT_ID,
  );
  gen.updatedAt = new Date().toISOString();
  progress(1, MOTION_TEXT_DONE);
  return out;
};
export interface MotionSceneSeed { cast: MotionSeedCast[]; places: MotionSeedPlace[]; showrooms: MotionSeedProp[][]; }
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
      saveSceneAsset({ kind: MOTION_SCENE_LIBRARY.KIND_CHARACTER, styleKey, type: c.type, name: c.name, description: c.look, tags: c.tags, gender: c.gender, role: c.role, motion: !_.isEmpty(v.value?.motions), from: MOTION_SCENE_LIBRARY.BASE_FROM }, v.value, thumb);
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
      saveSceneAsset({ kind: MOTION_SCENE_LIBRARY.KIND_LOCATION, styleKey, type: l.type, name: l.name, description: l.description, tags: l.tags, time: l.time, interior: l.interior, from: MOTION_SCENE_LIBRARY.BASE_FROM }, v.value, shots.files[0] || null);
      counts.locations++;
      tick();
    }
    for (const p of props) {
      aborted(o);
      const thumb = await renderPropThumb(session, gen, p.nodes, p.size, dir, p.key).catch(() => null);
      saveSceneAsset({ kind: MOTION_SCENE_LIBRARY.KIND_PROP, styleKey, type: p.type, name: p.name, description: p.description, tags: p.tags, size: p.size, from: MOTION_SCENE_LIBRARY.BASE_FROM }, p.nodes, thumb);
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
