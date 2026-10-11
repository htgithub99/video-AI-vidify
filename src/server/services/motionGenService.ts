import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import { createHash } from "crypto";
import _ from "lodash";
import path from "path";
import { MOTION_PRODUCTION_BRIEF, productionBriefFor, productionLocationErrors, productionStaging, productionStagingErrors } from "../../lib/motionProductionDesign.js";
import { bindVideoDnaSettings, sceneExecutionKey, scenePlanPrompt, scenePlanStagingErrors } from "../../lib/motionVideoDna.js";
import { MOTION_LIB_TEXT } from "../../constants/motionAssetLibrary.js";
import { MOTION_GEN_ACTIONS_GUIDE, MOTION_GEN_BIBLE_PROMPT, MOTION_GEN_CONFIG, MOTION_GEN_DSL_EXAMPLE, MOTION_GEN_DSL_GUIDE, MOTION_GEN_GRADES, MOTION_GEN_LOCATION_FIX_PROMPT, MOTION_GEN_LOCATION_PROMPT, MOTION_GEN_LOCATION_REVIEW_PROMPT, MOTION_GEN_PREAMBLE, MOTION_GEN_STAGING_PROMPT, MOTION_GEN_STAGING_REVIEW_PROMPT } from "../../constants/motionGenPrompts.js";
import {
  MOTION_TEMPLATE_A_2,
  MOTION_TEMPLATE_AI_CHAM_BOI_CANH_10,
  MOTION_TEMPLATE_AI_CHINH_BOI_CANH_THEO_NHAN_XET,
  MOTION_TEMPLATE_AI_DAN_DUNG_CANH_VI_TRI_DONG_TAC,
  MOTION_TEMPLATE_AI_DAN_DUNG_LAI_CANH_CON_LOI,
  MOTION_TEMPLATE_AI_SUA_LOI_DINH_DANG_BOI_CANH,
  MOTION_TEMPLATE_AI_SUA_TRANG_PHUC_LAN,
  MOTION_TEMPLATE_AI_VE_BOI_CANH,
  MOTION_TEMPLATE_B_2,
  MOTION_TEMPLATE_BO_QUA_BUOC_AI_CHAM_BOI_CANH,
  MOTION_TEMPLATE_BO_QUA_BUOC_AI_XEM_LAI_CANH,
  MOTION_TEMPLATE_BO_QUA_LOI,
  MOTION_TEMPLATE_BOI_CANH_CO_LOI_DINH_DANG_NHO_AI,
  MOTION_TEMPLATE_BOI_CANH_KHOI_DEN,
  MOTION_TEMPLATE_CAST_2,
  MOTION_TEMPLATE_CAST_IS_MISSING,
  MOTION_TEMPLATE_CENTRE_SIZE_X_Y_Z_TOP_Y,
  MOTION_TEMPLATE_CONTINUITY_THE_SHOT_BEFORE_THIS_GROUP_WAS_AT,
  MOTION_TEMPLATE_DAN_DUNG_LOI,
  MOTION_TEMPLATE_DIEM_CAN_SUA,
  MOTION_TEMPLATE_DUNG_ANH_XEM_TRUOC_CANH,
  MOTION_TEMPLATE_FILM_LOOK_GRADE,
  MOTION_TEMPLATE_FIX_REQUIRED,
  MOTION_TEMPLATE_FORMAT_ERRORS,
  MOTION_TEMPLATE_ID_LOCATION_TIME_SHOT_HINT_S_CAST_NARRATION,
  MOTION_TEMPLATE_KHONG_VE_DUOC_BOI_CANH,
  MOTION_TEMPLATE_LOC,
  MOTION_TEMPLATE_LOCATION_TIME,
  MOTION_TEMPLATE_LOOK,
  MOTION_TEMPLATE_M,
  MOTION_TEMPLATE_MARKS,
  MOTION_TEMPLATE_NARRATION_ACTION_AUTO_CHECK,
  MOTION_TEMPLATE_OBJECTS_2,
  MOTION_TEMPLATE_R,
  MOTION_TEMPLATE_RENDER_ERROR,
  MOTION_TEMPLATE_STAGE_CENTRE_SIZE_X_Z_DEFAULT_CAMERA_POS,
  MOTION_TEMPLATE_SUA_CANH_THEO_NHAN_XET,
  MOTION_TEMPLATE_SYMBOL_23,
  MOTION_TEMPLATE_SYMBOL_50,
  MOTION_TEMPLATE_SYMBOL_51,
  MOTION_TEMPLATE_SYMBOL_52,
  MOTION_TEMPLATE_TRANG_PHUC_CON_LOI_NHO_DA_TU_BO,
  MOTION_TEMPLATE_USER_NOTE,
  MOTION_TEMPLATE_VE_BOI_CANH,
  MOTION_TEXT_141414,
  MOTION_TEXT_151515,
  MOTION_TEXT_16_9,
  MOTION_TEXT_2A2C30,
  MOTION_TEXT_6A6F78,
  MOTION_TEXT_AI_THIET_KE_TRANG_PHUC_MA_NO_CANH,
  MOTION_TEXT_AI_XEM_LAI_TUNG_CANH_CO_KHOP_LOI,
  MOTION_TEXT_BEATS,
  MOTION_TEXT_BIBLE,
  MOTION_TEXT_BODY,
  MOTION_TEXT_BOOTS,
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
  MOTION_TEXT_DRESS,
  MOTION_TEXT_E9EAEC,
  MOTION_TEXT_END,
  MOTION_TEXT_ESTABLISHING_SHOTS,
  MOTION_TEXT_EXTERIOR,
  MOTION_TEXT_EXTRUDE,
  MOTION_TEXT_FOLLOW_THE_NARRATION,
  MOTION_TEXT_GEN3D,
  MOTION_TEXT_GEN_RUNID,
  MOTION_TEXT_GROUP,
  MOTION_TEXT_HEIGHT,
  MOTION_TEXT_HIGH,
  MOTION_TEXT_ID,
  MOTION_TEXT_IMAGE_JPEG,
  MOTION_TEXT_JEANS,
  MOTION_TEXT_LIGHT,
  MOTION_TEXT_LOCATION,
  MOTION_TEXT_LOCATIONS,
  MOTION_TEXT_MALE,
  MOTION_TEXT_MEDIUM,
  MOTION_TEXT_NEUTRAL,
  MOTION_TEXT_NOBODY,
  MOTION_TEXT_NONE,
  MOTION_TEXT_NONE_NAMED,
  MOTION_TEXT_OK,
  MOTION_TEXT_PLACE,
  MOTION_TEXT_PLAIN,
  MOTION_TEXT_PLANE,
  MOTION_TEXT_PREVIEW,
  MOTION_TEXT_REPEAT,
  MOTION_TEXT_REVIEW,
  MOTION_TEXT_RUNID,
  MOTION_TEXT_SCENE,
  MOTION_TEXT_SHIRT,
  MOTION_TEXT_SHOES,
  MOTION_TEXT_SHORTS,
  MOTION_TEXT_SKIRT,
  MOTION_TEXT_SNEAKERS,
  MOTION_TEXT_SPHERE,
  MOTION_TEXT_STAGING,
  MOTION_TEXT_SYMBOL_14,
  MOTION_TEXT_SYMBOL_16,
  MOTION_TEXT_SYMBOL_25,
  MOTION_TEXT_SYMBOL_27,
  MOTION_TEXT_SYMBOL_37,
  MOTION_TEXT_SYMBOL_41,
  MOTION_TEXT_TAT_CA_CANH_DAT,
  MOTION_TEXT_THIS_BEAT_WAS_MISSING_FROM_YOUR_ANSWER,
  MOTION_TEXT_TOON_CAT_INTERIOR,
  MOTION_TEXT_TROUSERS,
  MOTION_TEXT_USE,
  MOTION_TEXT_WIDE,
} from "../../constants/motionRuntime.js";
import { cloneJson, stringifyJson } from "../../lib/jsonStringify.js";
import { planningPrompt, productionPreamble } from "../../lib/motionDirection.js";
import { getMotionErrorSummary } from "../../lib/motionUtils.js";
import type { MotionAiExecution, MotionBeat, MotionGenState, MotionPlace, MotionSpec, MotionStoryAnalysis, MotionStoryScript } from "../../types/motionVideo.js";
import { ensureLibraryModel, ensureMotionLibrary, libraryCandidates, libraryPromptList } from "./motionAssetLibraryService.js";
import { estimateBeatSeconds, sceneShots } from "./motionDirectorService.js";
import { genActionIds, validateGenLocation, validateGenOutfit, validateGenStaging } from "./motionEngineService.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import { openStillSession, type MotionStillSession } from "./motionRenderService.js";
import { mapMotionAiPool, runMotionAi, type MotionAiImage } from "./motionStoryService.js";
export interface GenOptions {
  exec: MotionAiExecution;
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
  customCharacters?: boolean;
  drawingMode?: "2d" | "3d";
  openingBeatId?: string;
  preamble?: string;
  ai?: typeof runMotionAi;
  runId?: string;
  locationRounds?: number;
}
export const emptyGen = (): MotionGenState => ({ style: {}, cast: {}, locations: {}, locationInfo: {}, staging: {}, previews: {}, failed: [] });
export const prepareMotionGen = (previous: MotionGenState | undefined, analysis: MotionStoryAnalysis, customCharacters = false, drawingMode: "2d" | "3d" = MR.MOTION_TEXT_3D): MotionGenState => {
  const characterMode = customCharacters ? MR.MOTION_TEXT_DRAWN : MR.MOTION_TEXT_MANNEQUIN;
  const signature = createHash(MR.MOTION_TEXT_SHA256) .update(JSON.stringify({ previewVersion: 2, blueprint: analysis.videoDna || analysis.creativeBlueprint, cast: analysis.cast, places: analysis.places, era: analysis.era, look: analysis.look, characterMode, drawingMode })) .digest(MR.MOTION_TEXT_HEX);
  const compatible = previous?.creativeSignature === signature || (!analysis.videoDna && !analysis.creativeBlueprint && !previous?.creativeSignature && (previous?.characterMode || MR.MOTION_TEXT_MANNEQUIN) === characterMode && (previous?.drawingMode || MR.MOTION_TEXT_3D) === drawingMode);
  return { ...emptyGen(), ...(compatible ? cloneJson(previous || {}) : {}), creativeSignature: signature, characterMode, drawingMode, videoDna: analysis.videoDna };
};
const previewRoot = (): string => { const dir = path.join(getMotionRootDirectory(), MOTION_GEN_CONFIG.PREVIEW_FOLDER); fs.mkdirSync(dir, { recursive: true }); return dir; };
export const genPreviewRel = (file: string): string => path.relative(previewRoot(), file).split(path.sep).join(MOTION_TEXT_SYMBOL_16);
export const resolveGenPreview = (rel: string): string | null => { const root = path.resolve(previewRoot()); const file = path.resolve(root, _.toString(rel)); if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return null; return file; };
const runId = (script: MotionStoryScript, o?: GenOptions): string => (o && o.runId) || _.toString(_.get(script, MOTION_TEXT_GEN_RUNID)) || MR.MOTION_TEMPLATE_SYMBOL_138(Date.now().toString(36));
const aborted = (o: GenOptions) => { if (o.signal?.aborted) throw new Error(MOTION_TEXT_CANCELLED); };
const storyLine = (a: MotionStoryAnalysis): string => MOTION_TEMPLATE_SYMBOL_50(MR.MOTION_TEMPLATE_SYMBOL_139(a.title), MR.MOTION_TEMPLATE_SYMBOL_140(a.logline));
const castLines = (a: MotionStoryAnalysis): string => _.map(a.cast, (c) => MOTION_TEMPLATE_LOOK(MR.MOTION_TEMPLATE_SYMBOL_141(c.key), MR.MOTION_TEMPLATE_SYMBOL_142(c.gender || MOTION_TEXT_MALE), MR.MOTION_TEMPLATE_SYMBOL_143(c.name), MR.MOTION_TEMPLATE_SYMBOL_144(c.role || ""), MR.MOTION_TEMPLATE_SYMBOL_145(c.look || c.description || MOTION_TEXT_SYMBOL_25))).join(MOTION_TEXT_SYMBOL_27);
const imagesOf = (files: string[]): MotionAiImage[] => _.map(files, (f) => ({ name: path.basename(f), mimeType: MOTION_TEXT_IMAGE_JPEG, path: f }));
export const designBible = async (analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions): Promise<void> => {
  let errors: string[] = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    aborted(o);
    o.log(attempt ? MOTION_TEMPLATE_AI_SUA_TRANG_PHUC_LAN(MR.MOTION_TEMPLATE_SYMBOL_146(attempt + 1)) : MOTION_TEXT_AI_THIET_KE_TRANG_PHUC_MA_NO_CANH);
    const raw = await (o.ai || runMotionAi)(
      MOTION_GEN_BIBLE_PROMPT({ preamble: MR.MOTION_TEMPLATE_SYMBOL_147(o.preamble || MOTION_GEN_PREAMBLE, planningPrompt(analysis), MOTION_PRODUCTION_BRIEF), story: storyLine(analysis), era: analysis.era || "", look: analysis.look, cast: castLines(analysis), errors: errors.join(MOTION_TEXT_SYMBOL_27), customCharacters: o.customCharacters === true }),
      MOTION_GEN_CONFIG.ARTIFACT_BIBLE,
      o.exec,
      o.signal,
      o.log,
    ).catch((e) => {
      errors = [getMotionErrorSummary(e)];
      return null;
    });
    if (!raw) continue;
    const style = raw.style || {};
    gen.style = {
      grade: _.includes(MOTION_GEN_GRADES, style.grade) ? style.grade : MOTION_TEXT_NEUTRAL,
      skin: /^#[0-9a-f]{6}$/i.test(_.toString(style.skin)) ? style.skin : MOTION_TEXT_E9EAEC,
      gloss: _.clamp(_.toNumber(style.gloss) || 0.25, 0.18, 0.32),
      notes: _.truncate(_.toString(style.notes || ""), { length: 200 }),
    };
    errors = [];
    for (const c of analysis.cast) {
      const rawOutfit = _.get(raw, [MOTION_TEXT_CAST, c.key]);
      if (!rawOutfit) { o.log(MR.MOTION_TEMPLATE_CHARACTER_SCHEMA_MISMATCH_ROOT_FIELDS_CAST_KEYS_EXPECTED(Object.keys(raw).join(MR.MOTION_TEXT_SYMBOL_14), Object.keys(raw.cast || {}).join(MR.MOTION_TEXT_SYMBOL_14), c.key)); errors.push(MOTION_TEMPLATE_CAST_IS_MISSING(MR.MOTION_TEMPLATE_SYMBOL_148(c.key))); continue; }
      const selected = { ...rawOutfit, body: rawOutfit.body || c.gender };
      const materials = { ...(raw.materials || {}), ...(rawOutfit.materials || {}) };
      const inlineMaterials = (nodes: any[]) => (nodes || []).map((node) => ({ ...node, ...(typeof node.mat === MR.MOTION_TEXT_STRING && materials[node.mat] ? { mat: materials[node.mat] } : {}), ...(node.children ? { children: inlineMaterials(node.children) } : {}), ...(node.node ? { node: inlineMaterials([node.node])[0] } : {}) }));
      if (selected.accessories) selected.accessories = selected.accessories.map((a: any) => ({ ...a, nodes: inlineMaterials(a.nodes) }));
      if (selected.drawnBody) selected.drawnBody = selected.drawnBody.map((p: any) => ({ ...p, nodes: inlineMaterials(p.nodes) }));
      if (!o.customCharacters) { delete selected.drawnBody; delete selected.customDesign; }
      const v = validateGenOutfit(selected);
      if (o.customCharacters && ((!v.value.drawnBody?.length && !v.value.customDesign) || v.errors.length)) { errors.push(MR.MOTION_TEMPLATE_COMPLETE_VALID_CUSTOM_CHARACTER_DESIGN_REQUIRED(c.key, v.errors.join(MR.MOTION_TEXT_SYMBOL_41))); continue; }
      if (v.errors.length) o.log(MOTION_TEMPLATE_CAST_2(MR.MOTION_TEMPLATE_SYMBOL_149(c.key), MR.MOTION_TEMPLATE_SYMBOL_150(_.take(v.errors, 3).join(MOTION_TEXT_SYMBOL_41))));
      if (!_.some(v.value.layers, (l: any) => _.includes([MOTION_TEXT_TROUSERS, MOTION_TEXT_JEANS, MOTION_TEXT_SHORTS, MOTION_TEXT_SKIRT, MOTION_TEXT_DRESS], l.kind))) v.value.layers.push({ kind: MOTION_TEXT_TROUSERS, color: MOTION_TEXT_2A2C30, pattern: MOTION_TEXT_PLAIN, roughness: 0.85 });
      if (!_.some(v.value.layers, (l: any) => _.includes([MOTION_TEXT_SHOES, MOTION_TEXT_SNEAKERS, MOTION_TEXT_BOOTS], l.kind))) v.value.layers.push({ kind: MOTION_TEXT_SHOES, color: MOTION_TEXT_141414, pattern: MOTION_TEXT_PLAIN, roughness: 0.45 });
      gen.cast[c.key] = v.value;
    }
    if (!errors.length || (attempt === 2 && !o.customCharacters)) { if (errors.length) o.log(MOTION_TEMPLATE_TRANG_PHUC_CON_LOI_NHO_DA_TU_BO(MR.MOTION_TEMPLATE_SYMBOL_151(errors.length))); return; }
  }
  if (o.customCharacters) throw new Error(MR.MOTION_TEMPLATE_CANNOT_BUILD_CUSTOM_CHARACTERS(errors.join(MR.MOTION_TEXT_SYMBOL_41)));
  for (const c of analysis.cast)
    if (!gen.cast[c.key]) gen.cast[c.key] = validateGenOutfit({ body: c.gender, layers: [ { kind: MOTION_TEXT_SHIRT, color: MOTION_TEXT_6A6F78 }, { kind: MOTION_TEXT_TROUSERS, color: MOTION_TEXT_2A2C30 }, { kind: MOTION_TEXT_SHOES, color: MOTION_TEXT_151515 }, ], }).value;
};
const beatSeconds = (b: MotionBeat, lang: string): number => _.clamp(b.duration || estimateBeatSeconds(b, lang) + 0.4, 2.5, 14);
const usesOf = (key: string, script: MotionStoryScript): string => _.map( _.take( _.filter(script.beats, (b) => b.visual === MOTION_TEXT_SCENE && b.place === key), 10, ), (b) => MOTION_TEMPLATE_SYMBOL_23(MR.MOTION_TEMPLATE_SYMBOL_152(b.action || b.narration, scenePlanPrompt(b.scenePlan))), ).join(MOTION_TEXT_SYMBOL_27) || MOTION_TEXT_ESTABLISHING_SHOTS;
const genSpec = (gen: MotionGenState, locations: Record<string, unknown>, shots: MotionSpec["shots"], aspect: string = MOTION_TEXT_16_9): MotionSpec =>
  ({ aspect, fps: 30, fadeIn: 0, fadeOut: 0, look: MOTION_TEXT_CLEAN, gen: { characterMode: gen.characterMode, videoDna: gen.videoDna, drawingMode: gen.drawingMode, style: gen.style, cast: gen.cast, locations }, shots, subtitles: [], duration: _.max(_.map(shots, MOTION_TEXT_END)) || 4 }) as MotionSpec;
const reverseCamera = (L: any) => { const c = L.stage.center; const p = L.camera.pos, t = L.camera.target; const dx = p[0] - t[0], dz = p[2] - t[2]; const d = Math.max(4, Math.hypot(dx, dz)); return { pos: [c[0] - (dx / Math.hypot(dx, dz || 1e-3)) * d * 0.9, Math.max(1.6, p[1]), c[1] - (dz / Math.hypot(dx || 1e-3, dz)) * d * 0.9], target: [c[0], 1.2, c[1]], fov: 50 }; };
const renderLocation = async (
  session: MotionStillSession,
  gen: MotionGenState,
  key: string,
  L: any,
  dir: string,
  tag: string,
): Promise<{ files: string[]; issues: string[]; }> => {
  const shotA = { id: MOTION_TEMPLATE_A_2(MR.MOTION_TEMPLATE_SYMBOL_153(tag)), start: 0, end: 4, template: MOTION_TEXT_GEN3D, params: { location: key, actors: [], cameras: [{ shot: MOTION_TEXT_WIDE, pos: L.camera.pos, target: L.camera.target, fov: L.camera.fov }] } };
  const shotB = { id: MOTION_TEMPLATE_B_2(MR.MOTION_TEMPLATE_SYMBOL_154(tag)), start: 0, end: 4, template: MOTION_TEXT_GEN3D, params: { location: key, actors: [], cameras: [{ shot: MOTION_TEXT_WIDE, ...reverseCamera(L) }] } };
  const out: { files: string[]; issues: string[]; } = { files: [], issues: [] };
  for (const sh of [shotA, shotB]) {
    const r = await session.render(genSpec(gen, { [key]: L }, [sh], MOTION_TEXT_16_9), [{ id: sh.id, t: 1.2 }], dir, { width: MOTION_GEN_CONFIG.REVIEW_WIDTH, height: MOTION_GEN_CONFIG.REVIEW_HEIGHT, quality: MOTION_TEXT_HIGH });
    out.files.push(r[0].file);
    out.issues.push(...r[0].issues);
  }
  return out;
};
const modelRefs = (L: any): string[] => {
  const refs = new Set<string>();
  const visit = (list: any[]) => _.forEach(list, (n: any) => { if (!n) return; if (n.shape === MOTION_LIB_TEXT.MODEL && _.startsWith(n.ref, MOTION_LIB_TEXT.PH_PREFIX)) refs.add(n.ref); if (n.children) visit(n.children); if (n.node) visit([n.node]); });
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
const libraryFor = (place: MotionPlace, uses: string, era: string): string => { const items = libraryCandidates([place.name, place.description, uses, era].join(MOTION_LIB_TEXT.SPACE)); return items.length ? libraryPromptList(items) : MOTION_LIB_TEXT.NO_LIBRARY; };
export const designLocation = async (place: MotionPlace, script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: MotionGenState, session: MotionStillSession, o: GenOptions): Promise<void> => {
  const dir = path.join(previewRoot(), runId(script, o), MOTION_TEMPLATE_LOC(MR.MOTION_TEMPLATE_SYMBOL_155(place.key)));
  const uses = usesOf(place.key, script);
  const productionBrief = MR.MOTION_TEMPLATE_SYMBOL_156(planningPrompt(analysis), productionBriefFor(place, uses));
  const style = MOTION_TEMPLATE_FILM_LOOK_GRADE(MR.MOTION_TEMPLATE_SYMBOL_157(analysis.look), MR.MOTION_TEMPLATE_SYMBOL_158(gen.style.notes || ""), MR.MOTION_TEMPLATE_SYMBOL_159(gen.style.grade || MOTION_TEXT_NEUTRAL));
  const library = libraryFor(place, uses, analysis.era || "");
  let raw: any = o.note && gen.locations[place.key] ? gen.locations[place.key] : null;
  let errors: string[] = [];
  let best: { value: any; score: number; files: string[]; issues: string[]; } | null = null;
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
              era: analysis.era || "",
              story: storyLine(analysis),
              key: place.key,
              name: place.name,
              description: place.description,
              interior: !!place.interior,
              time: place.time || MOTION_TEXT_DAY,
              uses,
              style,
              library,
              note: o.note ? MOTION_TEMPLATE_USER_NOTE(MR.MOTION_TEMPLATE_SYMBOL_161(o.note)) : "",
            })
          : MOTION_GEN_LOCATION_FIX_PROMPT({
              preamble: o.preamble || MOTION_GEN_PREAMBLE,
              guide: MR.MOTION_TEMPLATE_SYMBOL_162(productionBrief, MOTION_GEN_DSL_GUIDE),
              library,
              key: place.key,
              description: place.description,
              previous: stringifyJson(raw || best?.value),
              issues: _.map(issues, (s) => MOTION_TEMPLATE_SYMBOL_23(MR.MOTION_TEMPLATE_SYMBOL_163(s))).join(MOTION_TEXT_SYMBOL_27),
              errors: _.map(_.take(errors, 25), (s) => MOTION_TEMPLATE_SYMBOL_23(MR.MOTION_TEMPLATE_SYMBOL_164(s))).join(MOTION_TEXT_SYMBOL_27),
            });
      o.log(!raw && !best ? MOTION_TEMPLATE_AI_VE_BOI_CANH(MR.MOTION_TEMPLATE_SYMBOL_165(place.name)) : errors.length ? MOTION_TEMPLATE_AI_SUA_LOI_DINH_DANG_BOI_CANH(MR.MOTION_TEMPLATE_SYMBOL_166(place.name)) : MOTION_TEMPLATE_AI_CHINH_BOI_CANH_THEO_NHAN_XET(MR.MOTION_TEMPLATE_SYMBOL_167(place.name)));
      try {
        const res = await (o.ai || runMotionAi)(prompt, MOTION_GEN_CONFIG.ARTIFACT_LOCATION, o.exec, o.signal, o.log);
        raw = res?.location || res;
      } catch (e) {
        if (o.signal?.aborted) throw e;
        errors = [getMotionErrorSummary(e)];
        continue;
      }
      const v = validateGenLocation(raw);
      errors = [...v.errors, ...productionLocationErrors(v.value)];
      if (errors.length) o.log(MR.MOTION_TEMPLATE_GEOMETRY_CORRECTIONS(errors.slice(0, 4).join(MR.MOTION_TEXT_SYMBOL_41)));
      if (!errors.length) { value = await materializeModels(v.value, o); o.log(MOTION_TEMPLATE_BOI_CANH_KHOI_DEN(MR.MOTION_TEMPLATE_SYMBOL_168(place.name), MR.MOTION_TEMPLATE_SYMBOL_169(v.stats?.nodes || 0), MR.MOTION_TEMPLATE_SYMBOL_170(v.stats?.lights || 0), MR.MOTION_TEMPLATE_SYMBOL_171(errors.length ? MOTION_TEMPLATE_BO_QUA_LOI(MR.MOTION_TEMPLATE_SYMBOL_331(errors.length)) : ""))); break; }
      o.log(MOTION_TEMPLATE_BOI_CANH_CO_LOI_DINH_DANG_NHO_AI(MR.MOTION_TEMPLATE_SYMBOL_172(place.name), MR.MOTION_TEMPLATE_SYMBOL_173(errors.length)));
    }
    if (!value) break;
    errors = [];
    const shots = await renderLocation(session, gen, place.key, value, dir, MOTION_TEMPLATE_R(MR.MOTION_TEMPLATE_SYMBOL_174(round + 1)));
    let score = 6;
    issues = [];
    const reviewOn = o.review !== false;
    if (reviewOn)
      try {
        const review = await (o.ai || runMotionAi)(MOTION_GEN_LOCATION_REVIEW_PROMPT({ preamble: o.preamble || MOTION_GEN_PREAMBLE, key: place.key, description: place.description, uses, engineNotes: _.uniq(shots.issues).join(MOTION_TEXT_SYMBOL_41) }), MOTION_GEN_CONFIG.ARTIFACT_LOCATION_REVIEW, o.exec, o.signal, o.log, imagesOf(shots.files));
        score = _.clamp(_.toNumber(review?.score) || 0, 0, 10);
        issues = _.take(_.compact(_.map(_.castArray(review?.issues || []), (s) => _.truncate(_.toString(s), { length: 240 }))), 8);
      } catch (e) {
        if (o.signal?.aborted) throw e;
        o.log(MOTION_TEMPLATE_BO_QUA_BUOC_AI_CHAM_BOI_CANH(MR.MOTION_TEMPLATE_SYMBOL_175(getMotionErrorSummary(e))));
      }
    if (reviewOn) o.log(MOTION_TEMPLATE_AI_CHAM_BOI_CANH_10(MR.MOTION_TEMPLATE_SYMBOL_176(place.name), MR.MOTION_TEMPLATE_SYMBOL_177(score), MR.MOTION_TEMPLATE_SYMBOL_178(issues.length ? MOTION_TEMPLATE_DIEM_CAN_SUA(MR.MOTION_TEMPLATE_SYMBOL_332(issues.length)) : "")));
    if (!best || score >= best.score) best = { value, score, files: shots.files, issues };
    gen.locations[place.key] = best.value;
    gen.locationInfo[place.key] = { score: reviewOn ? best.score : undefined, files: _.map(best.files, genPreviewRel), issues: best.issues, at: new Date().toISOString() };
    o.partial?.(null);
    if (score >= MOTION_GEN_CONFIG.LOCATION_PASS_SCORE || !issues.length) break;
    raw = value;
  }
  if (!best) throw new Error(MOTION_TEMPLATE_KHONG_VE_DUOC_BOI_CANH(MR.MOTION_TEMPLATE_SYMBOL_179(place.name)));
};
const r2 = (v: number) => Math.round(v * 100) / 100;
const nodeBounds = (n: any, L: any, depth = 0): [number, number, number, number, number, number] | null => {
  if (!n || depth > 6) return null;
  let b: [number, number, number, number, number, number] | null = null;
  const merge = (x: [number, number, number, number, number, number] | null) => { if (!x) return; b = b ? [Math.min(b[0], x[0]), Math.min(b[1], x[1]), Math.min(b[2], x[2]), Math.max(b[3], x[3]), Math.max(b[4], x[4]), Math.max(b[5], x[5])] : x; };
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
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
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
      if (inner) { const ex = [(n.count[0] - 1) * n.step[0], (n.count[1] - 1) * n.step[1], (n.count[2] - 1) * n.step[2]]; b = [inner[0] + Math.min(0, ex[0]), inner[1] + Math.min(0, ex[1]), inner[2] + Math.min(0, ex[2]), inner[3] + Math.max(0, ex[0]), inner[4] + Math.max(0, ex[1]), inner[5] + Math.max(0, ex[2])]; }
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
  const corners: [number, number][] = [ [bb[0] * s[0], bb[2] * s[2]], [bb[3] * s[0], bb[2] * s[2]], [bb[0] * s[0], bb[5] * s[2]], [bb[3] * s[0], bb[5] * s[2]], ];
  const rx = _.map(corners, ([x, z]) => x * Math.cos(rad) + z * Math.sin(rad)), rz = _.map(corners, ([x, z]) => -x * Math.sin(rad) + z * Math.cos(rad));
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
        return MOTION_TEMPLATE_CENTRE_SIZE_X_Y_Z_TOP_Y(MR.MOTION_TEMPLATE_SYMBOL_180(n.name || n.ref), MR.MOTION_TEMPLATE_SYMBOL_181(r2((b[0] + b[3]) / 2)), MR.MOTION_TEMPLATE_SYMBOL_182(r2((b[2] + b[5]) / 2)), MR.MOTION_TEMPLATE_SYMBOL_183(r2(b[3] - b[0])), MR.MOTION_TEMPLATE_SYMBOL_184(r2(b[4] - b[1])), MR.MOTION_TEMPLATE_SYMBOL_185(r2(b[5] - b[2])), MR.MOTION_TEMPLATE_SYMBOL_186(r2(b[4])));
      },
    ),
  );
  return [
    MOTION_TEMPLATE_LOCATION_TIME(MR.MOTION_TEMPLATE_SYMBOL_187(key), MR.MOTION_TEMPLATE_SYMBOL_188(place ? MOTION_TEMPLATE_SYMBOL_51(MR.MOTION_TEMPLATE_SYMBOL_333(place.name)) : ""), MR.MOTION_TEMPLATE_SYMBOL_189(L.interior ? MOTION_TEXT_TOON_CAT_INTERIOR : MOTION_TEXT_EXTERIOR), MR.MOTION_TEMPLATE_SYMBOL_190(L.time)),
    MOTION_TEMPLATE_STAGE_CENTRE_SIZE_X_Z_DEFAULT_CAMERA_POS(MR.MOTION_TEMPLATE_SYMBOL_191(L.stage.center), MR.MOTION_TEMPLATE_SYMBOL_192(L.stage.size), MR.MOTION_TEMPLATE_SYMBOL_193(L.camera.pos), MR.MOTION_TEMPLATE_SYMBOL_194(L.camera.target)),
    MOTION_TEMPLATE_MARKS(MR.MOTION_TEMPLATE_SYMBOL_195(_.map(L.marks, (v: number[], k: string) => MOTION_TEMPLATE_SYMBOL_52(MR.MOTION_TEMPLATE_SYMBOL_334(k), MR.MOTION_TEMPLATE_SYMBOL_335(v))).join(MOTION_TEXT_SYMBOL_14) || MOTION_TEXT_NONE)),
    MR.MOTION_TEXT_USE_THE_SUPPLIED_SCENE_GEOMETRY_AND_NAMED_SUPPORT_STATIONS_DERIVE,
    MOTION_TEMPLATE_OBJECTS_2(MR.MOTION_TEMPLATE_SYMBOL_196(_.take(objects, 40).join(MOTION_TEXT_SYMBOL_41) || MOTION_TEXT_NONE_NAMED)),
    MR.MOTION_TEMPLATE_EXACT_SET_GEOMETRY_REUSE_THESE_OBJECTS_AND_THEIR_CHILD_NAMES_TRAN(JSON.stringify({ nodes: L.nodes, defs: L.defs })),
  ].join(MOTION_TEXT_SYMBOL_27);
};
const stagingContext = (gen: MotionGenState) => ({ locations: gen.locations, cast: _.keys(gen.cast) });
const beatLines = (beats: MotionBeat[], lang: string, notes: Record<string, string>): string =>
  _.map(beats, (b) =>
    MOTION_TEMPLATE_ID_LOCATION_TIME_SHOT_HINT_S_CAST_NARRATION(
      MR.MOTION_TEMPLATE_SYMBOL_197(b.id),
      MR.MOTION_TEMPLATE_SYMBOL_198(b.place),
      MR.MOTION_TEMPLATE_SYMBOL_199(b.time || MOTION_TEXT_SYMBOL_25),
      MR.MOTION_TEMPLATE_SYMBOL_200(b.shot || MOTION_TEXT_MEDIUM),
      MR.MOTION_TEMPLATE_SYMBOL_201(beatSeconds(b, lang).toFixed(1)),
      MR.MOTION_TEMPLATE_SYMBOL_202((b.cast || []).join(MOTION_TEXT_SYMBOL_14) || MOTION_TEXT_NOBODY),
      MR.MOTION_TEMPLATE_SYMBOL_203(b.narration),
      MR.MOTION_TEMPLATE_SYMBOL_204(b.action || MOTION_TEXT_FOLLOW_THE_NARRATION, scenePlanPrompt(b.scenePlan)),
      MR.MOTION_TEMPLATE_SYMBOL_205(notes[b.id] ? MOTION_TEMPLATE_FIX_REQUIRED(MR.MOTION_TEMPLATE_SYMBOL_336(notes[b.id])) : ""),
    ),
  ).join(MOTION_TEXT_SYMBOL_27);
export const stageBeats = async (beats: MotionBeat[], script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: MotionGenState, o: GenOptions, notes: Record<string, string> = {}): Promise<string[]> => {
  const lang = script.language;
  const ctx = stagingContext(gen);
  const castInfo = _.map(analysis.cast, (c) =>
    MOTION_TEMPLATE_M(MR.MOTION_TEMPLATE_SYMBOL_206(c.key), MR.MOTION_TEMPLATE_SYMBOL_207(c.name), MR.MOTION_TEMPLATE_SYMBOL_208(c.role || ""), MR.MOTION_TEMPLATE_SYMBOL_209(_.get(gen.cast, [c.key, MOTION_TEXT_BODY]) || c.gender), MR.MOTION_TEMPLATE_SYMBOL_210(_.get(gen.cast, [c.key, MOTION_TEXT_HEIGHT]) || 1.78), MR.MOTION_TEMPLATE_SYMBOL_211(c.look || "")),
  ).join(MOTION_TEXT_SYMBOL_27);
  let todo = beats.slice();
  const localNotes = { ...notes };
  for (let attempt = 0; attempt < MOTION_GEN_CONFIG.STAGING_TRIES && todo.length; attempt++) {
    aborted(o);
    const locKeys = _.uniq(_.compact(_.map(todo, MOTION_TEXT_PLACE)));
    const firstIndex = script.beats.findIndex((b) => b.id === todo[0].id);
    const prev = _.findLast(script.beats.slice(0, firstIndex), (b) => b.visual === MOTION_TEXT_SCENE && !!gen.staging[b.id]);
    const continuity = prev ? MOTION_TEMPLATE_CONTINUITY_THE_SHOT_BEFORE_THIS_GROUP_WAS_AT(MR.MOTION_TEMPLATE_SYMBOL_212(prev.id), MR.MOTION_TEMPLATE_SYMBOL_213(_.get(gen.staging, [prev.id, MOTION_TEXT_LOCATION]))) : "";
    const prompt = MOTION_GEN_STAGING_PROMPT({
      preamble: o.preamble || MOTION_GEN_PREAMBLE,
      story: storyLine(analysis),
      actions: MOTION_GEN_ACTIONS_GUIDE(genActionIds()),
      cast: castInfo,
      locations: _.map(locKeys, (k) => locationSummary(k, gen.locations[k], _.find(analysis.places, { key: k }))).join(MOTION_TEXT_SYMBOL_37),
      beats: beatLines(todo, lang, localNotes),
      continuity,
      notes: MR.MOTION_TEMPLATE_SYMBOL_214(planningPrompt(analysis), locKeys.map((k) => productionBriefFor(gen.locations[k] || {}, usesOf(k, script))).join("\n\n"), o.note ? MOTION_TEMPLATE_USER_NOTE(MR.MOTION_TEMPLATE_SYMBOL_337(o.note)) : ""),
    });
    o.log(attempt ? MOTION_TEMPLATE_AI_DAN_DUNG_LAI_CANH_CON_LOI(MR.MOTION_TEMPLATE_SYMBOL_215(todo.length)) : MOTION_TEMPLATE_AI_DAN_DUNG_CANH_VI_TRI_DONG_TAC(MR.MOTION_TEMPLATE_SYMBOL_216(todo.length)));
    let raw: any;
    try {
      raw = await (o.ai || runMotionAi)(prompt, MOTION_GEN_CONFIG.ARTIFACT_STAGING, o.exec, o.signal, o.log);
    } catch (e) {
      if (o.signal?.aborted) throw e;
      o.log(MOTION_TEMPLATE_DAN_DUNG_LOI(MR.MOTION_TEMPLATE_SYMBOL_217(getMotionErrorSummary(e))));
      continue;
    }
    const list = _.castArray(raw?.beats || []);
    const failed: MotionBeat[] = [];
    for (const b of todo) {
      const item = _.find(list, (x: any) => _.toString(x?.id) === b.id) || (todo.length === 1 && list.length === 1 ? list[0] : null);
      if (!item) { failed.push(b); localNotes[b.id] = MOTION_TEXT_THIS_BEAT_WAS_MISSING_FROM_YOUR_ANSWER; continue; }
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
      const serious = [
        ..._.filter(v.errors, (e) => !/unknown action/.test(e)),
        ...productionStagingErrors(prepared, gen.locations[input.location]),
        ...productionStagingErrors(v.value, gen.locations[input.location]),
        ...scenePlanStagingErrors(b.scenePlan, v.value, gen.locations[input.location]),
        ...(Array.isArray(b.cast) ? (v.value.actors || []).filter((actor: any) => !b.cast!.includes(actor.cast)).map((actor: any) => MR.MOTION_TEMPLATE_ACTOR_IS_NOT_REQUESTED_BY_THIS_BEAT_USE_ONLY_BEAT_CAST_AN_EMPTY_C(actor.cast)) : []),
      ];
      if (serious.length) { failed.push(b); localNotes[b.id] = MOTION_TEMPLATE_FORMAT_ERRORS(MR.MOTION_TEMPLATE_SYMBOL_218(_.take(serious, 6).join(MOTION_TEXT_SYMBOL_41))); continue; }
      gen.staging[b.id] = v.value;
      delete localNotes[b.id];
    }
    todo = failed;
  }
  for (const b of todo) {
    throw new Error(MR.MOTION_TEMPLATE_CANNOT_STAGE_AFTER_CORRECTION_ATTEMPTS(b.id, MOTION_GEN_CONFIG.STAGING_TRIES, localNotes[b.id] || MR.MOTION_TEXT_AI_DID_NOT_RETURN_A_VALID_SCENE));
  }
  return _.map(todo, MOTION_TEXT_ID);
};
export const beatPreviewSpec = (
  beat: MotionBeat,
  gen: MotionGenState,
  lang: string,
  aspect: string,
  beatIndex = 0,
): { spec: MotionSpec; picks: { id: string; t: number; }[]; } => {
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
      const { spec, picks } = beatPreviewSpec( b, gen, script.language, o.aspect || MOTION_TEXT_16_9, script.beats.findIndex((beat) => beat.id === b.id), );
      const [aw, ah] = (o.aspect || MR.MOTION_TEXT_16_9).split(MR.MOTION_TEXT_SYMBOL_39).map(Number);
      const width = Math.round(MOTION_GEN_CONFIG.PREVIEW_WIDTH * Math.min(1, aw / ah));
      const height = Math.round((width * ah) / aw);
      const r = await session.render(spec, picks, dir, { width, height, quality: MOTION_TEXT_DRAFT, label: true });
      gen.previews[b.id] = { ...(gen.previews[b.id] || {}), file: genPreviewRel(r[0].file), files: r.map((frame) => genPreviewRel(frame.file)), issues: _.uniq(r.flatMap((frame) => frame.issues)), score: undefined, at: new Date().toISOString() };
    } catch (e) {
      if (o.signal?.aborted) throw e;
      gen.previews[b.id] = { ...(gen.previews[b.id] || {}), file: undefined, files: [], score: 0, issues: [MOTION_TEMPLATE_RENDER_ERROR(MR.MOTION_TEMPLATE_SYMBOL_219(getMotionErrorSummary(e)))] };
    }
  }
};
export const reviewBeats = async (
  beats: MotionBeat[],
  gen: MotionGenState,
  o: GenOptions,
): Promise<{ staging: Record<string, string>; locations: Record<string, string>; }> => {
  const notes: Record<string, string> = {};
  const locations: Record<string, string> = {};
  const withImg = _.filter(beats, (b) => !!gen.previews[b.id]?.file);
  const chunks: MotionBeat[][] = [];
  for (const beat of withImg) {
    const count = (gen.previews[beat.id].files || [gen.previews[beat.id].file]).length;
    const last = chunks[chunks.length - 1];
    const used = last?.reduce((sum, b) => sum + (gen.previews[b.id].files || [gen.previews[b.id].file]).length, 0) || 0;
    if (!last || used + count > MOTION_GEN_CONFIG.REVIEW_IMAGES_PER_CALL) chunks.push([beat]); else last.push(beat);
  }
  for (const chunk of chunks) {
    aborted(o);
    for (const b of chunk) gen.previews[b.id].score = 0;
    const files = _.compact(chunk.flatMap((b) => (gen.previews[b.id].files || [gen.previews[b.id].file!]).map((file) => resolveGenPreview(file))));
    if (!files.length) continue;
    try {
      const res = await (o.ai || runMotionAi)(
        MOTION_GEN_STAGING_REVIEW_PROMPT({
          preamble: MR.MOTION_TEMPLATE_INSPECT_ALL_ATTACHED_FRAMES_FOR_EACH_BEAT_INCLUDING_EACH_CAMERA_S(o.preamble || MOTION_GEN_PREAMBLE),
          beats: _.map(chunk, (b) =>
            MOTION_TEMPLATE_NARRATION_ACTION_AUTO_CHECK(
              MR.MOTION_TEMPLATE_SYMBOL_220(b.id),
              MR.MOTION_TEMPLATE_SYMBOL_221(b.narration),
              MR.MOTION_TEMPLATE_SYMBOL_222(b.action || "", scenePlanPrompt(b.scenePlan), b.id === o.openingBeatId ? MR.MOTION_TEXT_OPENING_FRAME_APPLY_VIDEO_DNA_OPENING_ACCEPTANCE : ""),
              MR.MOTION_TEMPLATE_SYMBOL_223((gen.previews[b.id].issues || []).join(MOTION_TEXT_SYMBOL_41) || MOTION_TEXT_OK),
            ),
          ).join(MOTION_TEXT_SYMBOL_27),
          sceneData: JSON.stringify({
            scenePlans: _.fromPairs(chunk.map((b) => [b.id, b.scenePlan])),
            staging: _.pick(
              gen.staging,
              chunk.map((b) => b.id),
            ),
            locations: _.pick(gen.locations, _.uniq(chunk.map((b) => b.place || ""))),
          }),
        }),
        MOTION_GEN_CONFIG.ARTIFACT_STAGING_REVIEW,
        o.exec,
        o.signal,
        o.log,
        imagesOf(files),
      );
      for (const it of _.castArray(res?.beats || [])) {
        const id = _.toString(it?.id);
        if (!_.some(chunk, { id })) continue;
        const fix = _.truncate(_.toString(it?.fix || ""), { length: 1200 });
        const renderFailed = gen.previews[id].issues?.some((issue) => /\[motion\] (init|draw) failed/.test(issue));
        gen.previews[id] = { ...gen.previews[id], score: it?.ok === true && !renderFailed ? 8 : 4, note: fix };
        if (it?.ok === false && fix) notes[id] = fix;
        const locationFix = _.truncate(_.toString(it?.locationFix || ""), { length: 900 });
        const place = chunk.find((b) => b.id === id)?.place;
        if (it?.ok === false && locationFix && place) { locations[place] = [locations[place], locationFix].filter(Boolean).join(MR.MOTION_TEXT_SYMBOL_41); notes[id] = fix || locationFix; }
      }
      for (const beat of chunk) {
        if ((gen.previews[beat.id]?.score || 0) < 8 && !notes[beat.id]) { notes[beat.id] = MR.MOTION_TEMPLATE_THIS_BEAT_WAS_NOT_APPROVED_CORRECT_ALL_VISIBLE_FAILURES_AGAINST_I(scenePlanPrompt(beat.scenePlan), (gen.previews[beat.id]?.issues || []).join(MR.MOTION_TEXT_SYMBOL_41)); }
      }
    } catch (e) {
      if (o.signal?.aborted) throw e;
      o.log(MOTION_TEMPLATE_BO_QUA_BUOC_AI_XEM_LAI_CANH(MR.MOTION_TEMPLATE_SYMBOL_224(getMotionErrorSummary(e))));
    }
  }
  return { staging: { ...autoNotes(withImg, gen), ...notes }, locations };
};
const autoNotes = (beats: MotionBeat[], gen: MotionGenState): Record<string, string> => { const notes: Record<string, string> = {}; for (const b of beats) { const auto = _.filter(gen.previews[b.id]?.issues || [], (s) => MOTION_GEN_CONFIG.AUTO_FIX_ISSUES.test(s)); if (auto.length) notes[b.id] = auto.join(MOTION_TEXT_SYMBOL_41); } return notes; };
export const buildScenes = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, o: GenOptions): Promise<MotionStoryScript> => {
  analysis = bindVideoDnaSettings(analysis, { drawingMode: o.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D, characterMode: o.customCharacters ? MR.MOTION_TEXT_DRAWN : MR.MOTION_TEXT_MANNEQUIN, aspect: o.aspect || MR.MOTION_TEXT_16_9 });
  const gen = prepareMotionGen(script.gen, analysis, o.customCharacters === true, o.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D);
  const rid = runId(script, o);
  _.set(gen, MOTION_TEXT_RUNID, rid);
  o = {
    ...o,
    runId: rid,
    openingBeatId: script.beats[0]?.id,
    preamble: MR.MOTION_TEMPLATE_SYMBOL_225(o.preamble || productionPreamble(analysis, MR.MOTION_TEXT_VISUAL), gen.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_USER_DRAWING_MODE_2D_FLAT_ILLUSTRATION_USE_CLEAR_SILHOUETTES_REST : MR.MOTION_TEXT_USER_DRAWING_MODE_3D_USE_DEPTH_MATERIAL_CONTRAST_AND_MOTIVATED_LI),
  };
  const out: MotionStoryScript = { ...script, gen };
  const emit = () => o.partial?.({ ...out, gen: cloneJson(gen) });
  await ensureMotionLibrary(o.log, o.signal).catch(_.noop);
  const progress = o.progress || _.noop;
  const sceneBeats = _.filter(script.beats, (b) => b.visual === MOTION_TEXT_SCENE);
  if (!_.isEmpty(sceneBeats) && _.some(sceneBeats, (b) => !b.place)) _.forEach(sceneBeats, (b) => (b.place = b.place || analysis.places[0]?.key));
  const longVideo = sceneBeats.length > MOTION_GEN_CONFIG.LONG_VIDEO_SCENE_BEATS;
  const reviewPasses = longVideo ? MOTION_GEN_CONFIG.LONG_STAGING_REVIEW_PASSES : MOTION_GEN_CONFIG.STAGING_REVIEW_PASSES;
  if (longVideo) { o = { ...o, locationRounds: o.locationRounds || MOTION_GEN_CONFIG.LONG_LOCATION_ROUNDS }; o.log(MR.MOTION_TEMPLATE_VIDEO_DAI_CANH_GIAM_SO_VONG_VE_LAI_BOI_CANH_VA_XEM_LAI_DE_NHANH_H(sceneBeats.length)); }
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
      if (changedPlaces.has(beat.place || "")) { delete gen.staging[beat.id]; delete gen.previews[beat.id]; }
  }
  const focusBeats = o.onlyBeats?.length ? _.filter(sceneBeats, (b) => _.includes(o.onlyBeats, b.id)) : null;
  const castMissing = _.some(analysis.cast, (c) => !gen.cast[c.key] || (o.customCharacters && !(gen.cast[c.key] as any).customDesign));
  if (o.restyle || castMissing || _.isEmpty(gen.style)) { progress(0.03, MOTION_TEXT_BIBLE); await designBible(analysis, gen, o); emit(); }
  const session = await openStillSession();
  try {
    const neededPlaces = _.uniq(_.compact(_.map(focusBeats || sceneBeats, MOTION_TEXT_PLACE)));
    const toDesign = _.filter(analysis.places, (p) => _.includes(neededPlaces, p.key) && (!gen.locations[p.key] || _.includes(o.onlyLocations || [], p.key)));
    let done = 0;
    if (toDesign.length) { progress(0.08, MOTION_TEXT_LOCATIONS); o.log(MOTION_TEMPLATE_VE_BOI_CANH(MR.MOTION_TEMPLATE_SYMBOL_226(toDesign.length))); await mapMotionAiPool(toDesign, async (place) => { await designLocation(place, script, analysis, gen, session, { ...o, partial: () => emit() }); done++; progress(0.08 + (0.4 * done) / toDesign.length, MOTION_TEXT_LOCATIONS); emit(); }); }
    const placeOk = (b: MotionBeat) => !!b.place && !!gen.locations[b.place];
    const stageList = _.filter(focusBeats || sceneBeats, (b) => placeOk(b) && (!!focusBeats || (o.onlyLocations?.length ? _.includes(o.onlyLocations, b.place) : !gen.staging[b.id])));
    const groups = _.flatMap(_.values(_.groupBy(stageList, MOTION_TEXT_CHAPTERID)), (list) => _.chunk(list, MOTION_GEN_CONFIG.BEATS_PER_STAGING_CALL));
    let g = 0;
    await mapMotionAiPool(groups, async (group) => {
      await stageBeats(group, script, analysis, gen, o, o.note && focusBeats ? _.fromPairs(_.map(group, (b) => [b.id, o.note!])) : {});
      g++;
      progress(0.5 + (0.25 * g) / Math.max(1, groups.length), MOTION_TEXT_STAGING);
      emit();
    });
    progress(0.76, MOTION_TEXT_PREVIEW);
    o.log(MOTION_TEMPLATE_DUNG_ANH_XEM_TRUOC_CANH(MR.MOTION_TEMPLATE_SYMBOL_227(stageList.length)));
    await previewBeats(stageList, script, gen, session, o);
    emit();
    let reviewList = stageList;
    if (o.review === false) {
      o.log(MOTION_GEN_CONFIG.REVIEW_OFF_LOG);
      for (const b of stageList) if (gen.previews[b.id]) gen.previews[b.id] = _.omit(gen.previews[b.id], [MOTION_GEN_CONFIG.SCORE_KEY, MOTION_GEN_CONFIG.NOTE_KEY]);
      const notes = autoNotes(stageList, gen);
      const bad = _.filter(stageList, (b) => !!notes[b.id]);
      if (bad.length) { o.log(MOTION_TEMPLATE_SUA_CANH_THEO_NHAN_XET(MR.MOTION_TEMPLATE_SYMBOL_228(bad.length))); await mapMotionAiPool(_.chunk(bad, MOTION_GEN_CONFIG.BEATS_PER_STAGING_CALL), (group) => stageBeats(group, script, analysis, gen, o, notes)); await previewBeats(bad, script, gen, session, o); emit(); }
    }
    for (let pass = 0; o.review !== false; pass++) {
      progress(0.82, MOTION_TEXT_REVIEW);
      o.log(MOTION_TEXT_AI_XEM_LAI_TUNG_CANH_CO_KHOP_LOI);
      const review = await reviewBeats(reviewList, gen, o);
      const notes = review.staging;
      emit();
      const bad = _.filter(reviewList, (b) => !!notes[b.id]);
      if (!bad.length) { if (reviewList.some((beat) => (gen.previews[beat.id]?.score || 0) < 8)) break; o.log(MOTION_TEXT_TAT_CA_CANH_DAT); break; }
      if (pass >= reviewPasses) break;
      const redraw = _.compact( Object.entries(review.locations).map(([key, note]) => { const place = analysis.places.find((p) => p.key === key); return place ? { place, note } : null; }), );
      await mapMotionAiPool(redraw, ({ place, note }) => designLocation(place, script, analysis, gen, session, { ...o, note, partial: () => emit() }));
      reviewList = sceneBeats.filter((b) => bad.includes(b) || !!review.locations[b.place || ""]);
      o.log(MOTION_TEMPLATE_SUA_CANH_THEO_NHAN_XET(MR.MOTION_TEMPLATE_SYMBOL_229(bad.length)));
      await mapMotionAiPool(_.chunk(reviewList, MOTION_GEN_CONFIG.BEATS_PER_STAGING_CALL), (group) => stageBeats(group, script, analysis, gen, o, notes));
      await previewBeats(reviewList, script, gen, session, o);
      emit();
    }
  } finally {
    await session.close();
  }
  gen.failed = _.map(
    _.filter(sceneBeats, (b) => !gen.staging[b.id] || (o.review !== false && (gen.previews[b.id]?.score || 0) < 8)),
    MOTION_TEXT_ID,
  );
  gen.updatedAt = new Date().toISOString();
  progress(1, MOTION_TEXT_DONE);
  return out;
};
