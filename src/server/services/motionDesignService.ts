import {
  MOTION_TEMPLATE_AI_THIET_KE_TRA_LOI_THU_LAI,
  MOTION_TEMPLATE_APPROXIMATE_SIZE_UNITS,
  MOTION_TEMPLATE_BAN_VE_LAI_CHI_DAT_10_THAP_HON,
  MOTION_TEMPLATE_BO_THIET_KE_CHUA_DAT_DUNG_DO_CO,
  MOTION_TEMPLATE_BRIEF,
  MOTION_TEMPLATE_BRIEF_DESIGN_THE_ID,
  MOTION_TEMPLATE_CAN_THEM_DO_RIENG,
  MOTION_TEMPLATE_CHARACTERS_WILL_USE_IT_TO,
  MOTION_TEMPLATE_CURRENT_DESIGN_JSON,
  MOTION_TEMPLATE_DA_THEM_VAO_THU_VIEN_10,
  MOTION_TEMPLATE_EXAMPLES_OF_APPROVED_DESIGNS_FROM_THIS_LIBRARY,
  MOTION_TEMPLATE_ISO,
  MOTION_TEMPLATE_LOI_THIET_KE,
  MOTION_TEMPLATE_MED,
  MOTION_TEMPLATE_PLACE_FURNITURE_PROPS_AND_LAYER_ELEMENTS_MAY_USE,
  MOTION_TEMPLATE_PREVIOUS_DESIGN_JSON,
  MOTION_TEMPLATE_R,
  MOTION_TEMPLATE_REF,
  MOTION_TEMPLATE_RETURN_ONLY_THE_DESIGN_JSON_OBJECT_WITH_KIND,
  MOTION_TEMPLATE_REVISION_THE_FIRST_ATTACHED_IMAGES_ARE_RENDERS_OF,
  MOTION_TEMPLATE_SCALE,
  MOTION_TEMPLATE_STORY_CONTEXT,
  MOTION_TEMPLATE_SYMBOL_29,
  MOTION_TEMPLATE_SYMBOL_47,
  MOTION_TEMPLATE_SYMBOL_48,
  MOTION_TEMPLATE_SYMBOL_49,
  MOTION_TEMPLATE_SYMBOL_5,
  MOTION_TEMPLATE_THIET_KE_CHUA_HOP_LE_NHO_AI_SUA,
  MOTION_TEMPLATE_THIET_KE_MOI_DAO_CU_BOI_CANH_CON,
  MOTION_TEMPLATE_THIET_KE_VONG_10,
  MOTION_TEMPLATE_VALIDATOR_WARNINGS,
  MOTION_TEMPLATE_VE_LAI,
  MOTION_TEMPLATE_WIDE,
  MOTION_TEXT_16_9,
  MOTION_TEXT_AFFORD_HOW_CHARACTERS_USE_IT_ONLY_WHAT_APPLIES,
  MOTION_TEXT_ANIMATED_PARAMS_ANY_GROUP_X_Y_ROT_SX,
  MOTION_TEXT_ART_DIRECTOR_REVIEW_YOU_SEE_RENDERS_OF_THE,
  MOTION_TEXT_ASSET,
  MOTION_TEXT_ATTACHED_IMAGE_REFERENCE_SHEET_OF_THE_EXISTING_LIBRARY,
  MOTION_TEXT_BANH_MI_CART_JSON,
  MOTION_TEXT_BARREL,
  MOTION_TEXT_BENCH,
  MOTION_TEXT_BICYCLE,
  MOTION_TEXT_BOOKSHELF,
  MOTION_TEXT_CAFE_TABLE,
  MOTION_TEXT_CAR_SEDAN,
  MOTION_TEXT_CHAIR,
  MOTION_TEXT_CITY_STREET,
  MOTION_TEXT_CLASSROOM,
  MOTION_TEXT_COLOUR_4_8_NAMED_PALETTE_COLOURS_EACH_MATERIAL,
  MOTION_TEXT_CRAFT_OVERLAP_SHAPES_SLIGHTLY_SO_THERE_ARE_NO,
  MOTION_TEXT_CRATE,
  MOTION_TEXT_D,
  MOTION_TEXT_DAY,
  MOTION_TEXT_DESC,
  MOTION_TEXT_DESIGN_EXAMPLES,
  MOTION_TEXT_DESIGN_JSON_ASSETS_KIND_ASSET_ID_SNAKE_CASE,
  MOTION_TEXT_DESIGN_JSON_PLACES_KIND_ENV_ID_SNAKE_CASE,
  MOTION_TEXT_DESIGN_PROCESS_1_BLOCK_THE_SILHOUETTE_WITH_2,
  MOTION_TEXT_DESIGN_STUDIO,
  MOTION_TEXT_DESK,
  MOTION_TEXT_DOCUMENTARY,
  MOTION_TEXT_DOOR,
  MOTION_TEXT_D_2,
  MOTION_TEXT_ENV_2,
  MOTION_TEXT_EXTERIOR,
  MOTION_TEXT_FRONT,
  MOTION_TEXT_FURNITURE,
  MOTION_TEXT_HOSPITAL_BED,
  MOTION_TEXT_HOUSE,
  MOTION_TEXT_ID,
  MOTION_TEXT_IMAGE_JPEG,
  MOTION_TEXT_INTERIOR,
  MOTION_TEXT_JUDGE_BENCH_VN_JSON,
  MOTION_TEXT_LEFT,
  MOTION_TEXT_LIST_AT_MOST_6_ISSUES_EACH_A_CONCRETE,
  MOTION_TEXT_MAN_CASUAL,
  MOTION_TEXT_NAME,
  MOTION_TEXT_NATURE,
  MOTION_TEXT_NFD,
  MOTION_TEXT_OBJECT,
  MOTION_TEXT_PLACE,
  MOTION_TEXT_PLACEMENT_ADD_PLACE_FLOOR_STANDS_ON_THE_GROUND,
  MOTION_TEXT_PLACE_COMPOSITION_AROUND_THE_CENTRE_OF_THE_ROOM,
  MOTION_TEXT_PLACE_RULES_LAYER_ELEMENTS_ARE_DRAWN_RELATIVE_TO,
  MOTION_TEXT_PROP,
  MOTION_TEXT_RADIO,
  MOTION_TEXT_RAISE_OVERALL_CRAFTSMANSHIP,
  MOTION_TEXT_RETURN_ONLY_SCORE_N_ISSUES_FIX_INSTRUCTION,
  MOTION_TEXT_RETURN_THE_IMPROVED_FULL_DESIGN_JSON_SAME_ID,
  MOTION_TEXT_RIGHT,
  MOTION_TEXT_SCENE,
  MOTION_TEXT_SCORE_0_10_8_READY_FOR_BROADCAST_ON,
  MOTION_TEXT_SHAPES_DRAWN_IN_ORDER_LATER_SHAPES_ON_TOP,
  MOTION_TEXT_SHAPE_STYLE_KEYS_FILL_PALETTE_NAME_OR_HEX,
  MOTION_TEXT_SHOP_FRONT,
  MOTION_TEXT_SOFA,
  MOTION_TEXT_STAND,
  MOTION_TEXT_STREET,
  MOTION_TEXT_STREET_LAMP,
  MOTION_TEXT_STREET_VENDOR_CART,
  MOTION_TEXT_STRUCTURE,
  MOTION_TEXT_SUITCASE,
  MOTION_TEXT_SYMBOL_14,
  MOTION_TEXT_SYMBOL_27,
  MOTION_TEXT_SYMBOL_37,
  MOTION_TEXT_SYMBOL_41,
  MOTION_TEXT_SYMBOL_48,
  MOTION_TEXT_TALK,
  MOTION_TEXT_TENT,
  MOTION_TEXT_TYPEWRITER,
  MOTION_TEXT_UTF8,
  MOTION_TEXT_VAN,
  MOTION_TEXT_VEHICLE,
  MOTION_TEXT_VIEW_AND_SCALE_STRAIGHT_FRONT_ELEVATION_LIKE_A,
  MOTION_TEXT_VN_COURTROOM_JSON,
  MOTION_TEXT_WINDOW,
  MOTION_TEXT_WOMAN_CASUAL,
  MOTION_TEXT_X_2,
  MOTION_TEXT_YOU_ARE_THE_LEAD_2D_PROP_AND_SET,
} from "../../constants/motionRuntime.js";
import fs from "fs";
import _ from "lodash";
import path from "path";
import { randomUUID } from "crypto";
import { stringifyJson } from "../../lib/jsonStringify.js";
import { MOTION_DESIGN } from "../../constants/motionVideo.js";
import type { MotionAiExecution, MotionDesignRequest, MotionSpec } from "../../types/motionVideo.js";
import { listDesigns, saveDesign, type MotionDesignRecord } from "./motionDesignStore.js";
export type { MotionDesignRecord };
import { getMotionEngineDir, loadMotionEngine } from "./motionEngineService.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import { renderMotionStills } from "./motionRenderService.js";
import { mapMotionAiPool, runMotionAi, TEXT_ONLY_PREAMBLE, type MotionAiImage } from "./motionStoryService.js";
interface DesignContext {
  nested?: boolean;
  minScore?: number;
  exec: MotionAiExecution;
  signal?: AbortSignal;
  log?: (s: string) => void;
  story?: string;
}
type Design = Record<string, any>;
const EXAMPLES_DIR = MOTION_TEXT_DESIGN_EXAMPLES;
const STYLE_GUIDE = [MOTION_TEXT_YOU_ARE_THE_LEAD_2D_PROP_AND_SET, MOTION_TEXT_VIEW_AND_SCALE_STRAIGHT_FRONT_ELEVATION_LIKE_A, MOTION_TEXT_DESIGN_PROCESS_1_BLOCK_THE_SILHOUETTE_WITH_2, MOTION_TEXT_COLOUR_4_8_NAMED_PALETTE_COLOURS_EACH_MATERIAL, MOTION_TEXT_CRAFT_OVERLAP_SHAPES_SLIGHTLY_SO_THERE_ARE_NO].join(MOTION_TEXT_SYMBOL_27);
const DSL_GUIDE = [
  MOTION_TEXT_DESIGN_JSON_ASSETS_KIND_ASSET_ID_SNAKE_CASE,
  MOTION_TEXT_SHAPES_DRAWN_IN_ORDER_LATER_SHAPES_ON_TOP,
  MOTION_TEXT_SHAPE_STYLE_KEYS_FILL_PALETTE_NAME_OR_HEX,
  MOTION_TEXT_ANIMATED_PARAMS_ANY_GROUP_X_Y_ROT_SX,
  MOTION_TEXT_AFFORD_HOW_CHARACTERS_USE_IT_ONLY_WHAT_APPLIES,
  MOTION_TEXT_DESIGN_JSON_PLACES_KIND_ENV_ID_SNAKE_CASE,
  MOTION_TEXT_PLACE_RULES_LAYER_ELEMENTS_ARE_DRAWN_RELATIVE_TO,
].join(MOTION_TEXT_SYMBOL_27);
const REVIEW_GUIDE = [MOTION_TEXT_ART_DIRECTOR_REVIEW_YOU_SEE_RENDERS_OF_THE, MOTION_TEXT_SCORE_0_10_8_READY_FOR_BROADCAST_ON, MOTION_TEXT_LIST_AT_MOST_6_ISSUES_EACH_A_CONCRETE, MOTION_TEXT_RETURN_ONLY_SCORE_N_ISSUES_FIX_INSTRUCTION].join(MOTION_TEXT_SYMBOL_27);
const PLACE_FILL = MOTION_TEXT_PLACE_COMPOSITION_AROUND_THE_CENTRE_OF_THE_ROOM;
const placeAssetsGuide = (exterior: boolean): string => {
  const reg = engine().registry.assets;
  const ids = _.keys(_.pickBy(reg, (a: any) => _.includes(exterior ? [MOTION_TEXT_STREET, MOTION_TEXT_NATURE, MOTION_TEXT_STRUCTURE] : [MOTION_TEXT_FURNITURE, MOTION_TEXT_INTERIOR], a.category)));
  return MOTION_TEMPLATE_PLACE_FURNITURE_PROPS_AND_LAYER_ELEMENTS_MAY_USE(`${ids.join(MOTION_TEXT_SYMBOL_14)}`);
};
const examplesFor = (kind: "asset" | "env"): string => {
  const dir = path.join(getMotionEngineDir(), EXAMPLES_DIR);
  const files = kind === MOTION_TEXT_ENV_2 ? [MOTION_TEXT_VN_COURTROOM_JSON] : [MOTION_TEXT_BANH_MI_CART_JSON, MOTION_TEXT_JUDGE_BENCH_VN_JSON];
  return _.compact(
    _.map(files, (f) => {
      try {
        return fs.readFileSync(path.join(dir, f), MOTION_TEXT_UTF8).replace(/\s*\n\s*/g, "");
      } catch {
        return null;
      }
    }),
  ).join(MOTION_TEXT_SYMBOL_27);
};
const engine = () => loadMotionEngine().engine as { validateDesign: (d: unknown) => { ok: boolean; def?: Design; issues: string[] }; registry: { assets: Record<string, any>; environments: Record<string, any> } };
const REF_ASSETS: Record<string, string[]> = {
  furniture: [MOTION_TEXT_DESK, MOTION_TEXT_CHAIR, MOTION_TEXT_SOFA, MOTION_TEXT_BOOKSHELF, MOTION_TEXT_HOSPITAL_BED],
  prop: [MOTION_TEXT_CRATE, MOTION_TEXT_BARREL, MOTION_TEXT_TYPEWRITER, MOTION_TEXT_SUITCASE, MOTION_TEXT_RADIO],
  street: [MOTION_TEXT_BENCH, MOTION_TEXT_STREET_LAMP, MOTION_TEXT_STREET_VENDOR_CART, MOTION_TEXT_CAFE_TABLE],
  structure: [MOTION_TEXT_HOUSE, MOTION_TEXT_SHOP_FRONT, MOTION_TEXT_TENT],
  vehicle: [MOTION_TEXT_CAR_SEDAN, MOTION_TEXT_VAN, MOTION_TEXT_BICYCLE],
  interior: [MOTION_TEXT_DOOR, MOTION_TEXT_WINDOW, MOTION_TEXT_BOOKSHELF],
};
const previewShots = (d: Design, start = 0): any[] => {
  if (d.kind === MOTION_TEXT_ENV_2) {
    const W = d.width || 2600;
    const time = d.time || (d.category === MOTION_TEXT_EXTERIOR ? MOTION_TEXT_DAY : MOTION_TEXT_INTERIOR);
    return [
      { id: MOTION_TEMPLATE_WIDE(`${d.id}`), template: MOTION_TEXT_SCENE, start, end: start + 3, params: { env: d.id, time, camera: { x: W / 2, zoom: 1.35 }, actors: [], items: [] } },
      {
        id: MOTION_TEMPLATE_MED(`${d.id}`),
        template: MOTION_TEXT_SCENE,
        start: start + 3,
        end: start + 6,
        params: {
          env: d.id,
          time,
          camera: { x: W / 2, zoom: 2 },
          actors: [
            { who: MOTION_TEXT_MAN_CASUAL, x: W / 2 - 160, lane: MOTION_TEXT_FRONT, action: MOTION_TEXT_TALK, facing: MOTION_TEXT_RIGHT },
            { who: MOTION_TEXT_WOMAN_CASUAL, x: W / 2 + 140, lane: MOTION_TEXT_FRONT, action: MOTION_TEXT_STAND, facing: MOTION_TEXT_LEFT },
          ],
          items: [],
        },
      },
    ];
  }
  const w = _.toNumber(d.size?.[0]) || 150,
    h = _.toNumber(d.size?.[1]) || 150;
  const zoom = _.clamp(560 / Math.max(h, w * 0.55), 1.2, 4.5);
  const params = d.params ? _.mapValues(d.params, () => 0) : {};
  return [
    { id: MOTION_TEMPLATE_ISO(`${d.id}`), template: MOTION_TEXT_SCENE, start, end: start + 3, params: { env: MOTION_TEXT_DESIGN_STUDIO, time: MOTION_TEXT_INTERIOR, camera: { x: 1200, zoom, y: -h * 0.5 }, actors: [], items: [{ asset: d.id, x: 1200, lane: MOTION_TEXT_FRONT, params }] } },
    {
      id: MOTION_TEMPLATE_SCALE(`${d.id}`),
      template: MOTION_TEXT_SCENE,
      start: start + 3,
      end: start + 6,
      params: { env: MOTION_TEXT_DESIGN_STUDIO, time: MOTION_TEXT_INTERIOR, camera: { x: 1200, zoom: 2.1 }, actors: [{ who: MOTION_TEXT_MAN_CASUAL, x: 1200 - w / 2 - 70, lane: MOTION_TEXT_FRONT, action: MOTION_TEXT_STAND, facing: MOTION_TEXT_RIGHT }], items: [{ asset: d.id, x: 1200, lane: MOTION_TEXT_FRONT, params }] },
    },
  ];
};
const renderShots = async (shots: any[], designs: Design[], dir: string): Promise<MotionAiImage[]> => {
  const spec = { aspect: MOTION_TEXT_16_9, look: MOTION_TEXT_DOCUMENTARY, fps: 30, shots, subtitles: [], designs } as unknown as MotionSpec;
  const stills = await renderMotionStills(
    spec,
    _.map(shots, (s) => ({ id: s.id, t: s.start + 1.5 })),
    dir,
  );
  return _.map(stills, (s) => ({ name: path.basename(s.file), mimeType: MOTION_TEXT_IMAGE_JPEG, path: s.file }));
};
const referenceSheet = async (kind: "asset" | "env", category: string, dir: string): Promise<MotionAiImage[]> => {
  const reg = engine().registry;
  if (kind === MOTION_TEXT_ENV_2) {
    const env = category === MOTION_TEXT_EXTERIOR ? MOTION_TEXT_CITY_STREET : MOTION_TEXT_CLASSROOM;
    const shot = {
      id: MOTION_TEMPLATE_REF(`${env}`),
      template: MOTION_TEXT_SCENE,
      start: 0,
      end: 3,
      params: { env, time: category === MOTION_TEXT_EXTERIOR ? MOTION_TEXT_DAY : MOTION_TEXT_INTERIOR, camera: { x: (reg.environments[env]?.width || 2400) / 2, zoom: 1.6 }, actors: [{ who: MOTION_TEXT_MAN_CASUAL, x: (reg.environments[env]?.width || 2400) / 2, lane: MOTION_TEXT_FRONT, action: MOTION_TEXT_STAND, facing: MOTION_TEXT_RIGHT }], items: [] },
    };
    return renderShots([shot], [], dir);
  }
  const ids = _.filter(REF_ASSETS[category] || REF_ASSETS.prop, (id) => !!reg.assets[id]);
  let x = 700;
  const items = _.map(ids, (id) => {
    const w = _.toNumber(reg.assets[id]?.size?.[0]) || 150;
    const it = { asset: id, x: x + w / 2, lane: MOTION_TEXT_FRONT };
    x += w + 60;
    return it;
  });
  const shot = { id: MOTION_TEMPLATE_REF(`${category}`), template: MOTION_TEXT_SCENE, start: 0, end: 3, params: { env: MOTION_TEXT_DESIGN_STUDIO, time: MOTION_TEXT_INTERIOR, camera: { x: (700 + x) / 2, zoom: _.clamp(1700 / (x - 600), 1, 2.4) }, actors: [{ who: MOTION_TEXT_MAN_CASUAL, x: 640, lane: MOTION_TEXT_FRONT, action: MOTION_TEXT_STAND, facing: MOTION_TEXT_RIGHT }], items } };
  return renderShots([shot], [], dir);
};
const designPrompt = (req: MotionDesignRequest, story: string | undefined, kind: "asset" | "env"): string =>
  [
    TEXT_ONLY_PREAMBLE,
    STYLE_GUIDE,
    DSL_GUIDE,
    MOTION_TEMPLATE_EXAMPLES_OF_APPROVED_DESIGNS_FROM_THIS_LIBRARY(`${examplesFor(kind)}`),
    MOTION_TEXT_ATTACHED_IMAGE_REFERENCE_SHEET_OF_THE_EXISTING_LIBRARY,
    MOTION_TEMPLATE_BRIEF_DESIGN_THE_ID(
      `${kind === MOTION_TEXT_ENV_2 ? MOTION_TEXT_PLACE : MOTION_TEXT_OBJECT}`,
      `${req.name}`,
      `${req.id}`,
      `${req.brief}`,
      `${req.size ? MOTION_TEMPLATE_APPROXIMATE_SIZE_UNITS(`${req.size.join(MOTION_TEXT_X_2)}`) : ""}`,
      `${req.use ? MOTION_TEMPLATE_CHARACTERS_WILL_USE_IT_TO(`${req.use}`) : ""}`,
      `${story ? MOTION_TEMPLATE_STORY_CONTEXT(`${_.truncate(story, { length: 400 })}`) : ""}`,
    ),
    kind === MOTION_TEXT_ENV_2 ? MOTION_TEMPLATE_SYMBOL_29(`${PLACE_FILL}`, `${placeAssetsGuide(/(street|outdoor|ngoài|phố|chợ|sân|field|forest|road|beach|exterior)/i.test(req.brief))}`) : MOTION_TEXT_PLACEMENT_ADD_PLACE_FLOOR_STANDS_ON_THE_GROUND,
    MOTION_TEMPLATE_RETURN_ONLY_THE_DESIGN_JSON_OBJECT_WITH_KIND(`${kind}`, `${req.id}`),
  ]
    .filter(Boolean)
    .join(MOTION_TEXT_SYMBOL_37);
const reviewPrompt = (req: MotionDesignRequest, design: Design, validationIssues: string[]): string =>
  [TEXT_ONLY_PREAMBLE, REVIEW_GUIDE, STYLE_GUIDE, MOTION_TEMPLATE_BRIEF(`${req.name}`, `${req.brief}`), validationIssues.length ? MOTION_TEMPLATE_VALIDATOR_WARNINGS(`${validationIssues.join(MOTION_TEXT_SYMBOL_41)}`) : "", MOTION_TEMPLATE_CURRENT_DESIGN_JSON(`${stringifyJson(design)}`)].filter(Boolean).join(MOTION_TEXT_SYMBOL_37);
const revisePrompt = (req: MotionDesignRequest, story: string | undefined, kind: "asset" | "env", design: Design, score: number, issues: string[]): string =>
  [designPrompt(req, story, kind), MOTION_TEMPLATE_REVISION_THE_FIRST_ATTACHED_IMAGES_ARE_RENDERS_OF(`${score}`, `${issues.join(MOTION_TEXT_SYMBOL_48)}`), MOTION_TEMPLATE_PREVIOUS_DESIGN_JSON(`${stringifyJson(design)}`), MOTION_TEXT_RETURN_THE_IMPROVED_FULL_DESIGN_JSON_SAME_ID].join(MOTION_TEXT_SYMBOL_37);
const askAi = async (prompt: string, artifact: string, ctx: DesignContext, images: MotionAiImage[]): Promise<any> => {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (ctx.signal?.aborted) return null;
    try {
      const r = await runMotionAi(prompt, artifact, ctx.exec, ctx.signal, ctx.log, images);
      if (r && _.isPlainObject(r)) return r;
    } catch (e: any) {
      if (ctx.signal?.aborted) return null;
      ctx.log?.(MOTION_TEMPLATE_AI_THIET_KE_TRA_LOI_THU_LAI(`${_.truncate(_.toString(e?.message), { length: 80 })}`));
    }
  }
  return null;
};
const designOne = async (req: MotionDesignRequest, ctx: DesignContext): Promise<MotionDesignRecord | null> => {
  const kind = req.kind === MOTION_TEXT_ENV_2 ? MOTION_TEXT_ENV_2 : MOTION_TEXT_ASSET;
  const dir = path.join(getMotionRootDirectory(), MOTION_DESIGN.PREVIEW_FOLDER, MOTION_TEMPLATE_SYMBOL_5(`${req.id}`, `${randomUUID().slice(0, 6)}`));
  fs.mkdirSync(dir, { recursive: true });
  const category = kind === MOTION_TEXT_ENV_2 ? (/(street|outdoor|ngoài|phố|chợ|sân|field|forest|road|beach|exterior)/i.test(req.brief) ? MOTION_TEXT_EXTERIOR : MOTION_TEXT_INTERIOR) : MOTION_TEXT_PROP;
  const refs: MotionAiImage[] = await referenceSheet(kind, category, dir).catch(() => []);
  const first = designPrompt(req, ctx.story, kind);
  let raw: Design | null = await askAi(first, MOTION_DESIGN.ARTIFACT, ctx, refs);
  if (kind === MOTION_TEXT_ENV_2 && raw && _.isArray(raw.needs) && !ctx.nested) {
    const needs = _.take(normalizeDesignRequests(_.map(raw.needs, (n: any) => ({ ...n, kind: MOTION_TEXT_ASSET }))), 3);
    if (needs.length) ctx.log?.(MOTION_TEMPLATE_CAN_THEM_DO_RIENG(`${req.name}`, `${_.map(needs, MOTION_TEXT_NAME).join(MOTION_TEXT_SYMBOL_14)}`));
    for (const n of needs) await designOne({ ...n, kind: MOTION_TEXT_ASSET }, { ...ctx, nested: true }).catch(() => null);
  }
  let best: { design: Design; score: number } | null = null;
  let rounds = 0;
  const maxRounds = ctx.nested ? 2 : MOTION_DESIGN.MAX_ROUNDS;
  for (let round = 1; round <= maxRounds && raw; round++) {
    if (ctx.signal?.aborted) break;
    rounds = round;
    const candidate: Design = { ...raw, id: req.id, kind };
    const v = engine().validateDesign(candidate);
    if (!v.ok || !v.def) {
      ctx.log?.(MOTION_TEMPLATE_THIET_KE_CHUA_HOP_LE_NHO_AI_SUA(`${req.name}`, `${_.truncate(v.issues.join(MOTION_TEXT_SYMBOL_41), { length: 120 })}`));
      raw = await askAi(revisePrompt(req, ctx.story, kind, candidate, 0, v.issues), MOTION_DESIGN.ARTIFACT, ctx, refs);
      continue;
    }
    if (kind === MOTION_TEXT_ASSET && !_.includes([MOTION_TEXT_FURNITURE, MOTION_TEXT_PROP, MOTION_TEXT_INTERIOR, MOTION_TEXT_STRUCTURE, MOTION_TEXT_STREET, MOTION_TEXT_VEHICLE, MOTION_TEXT_NATURE], v.def.category)) v.def.category = MOTION_TEXT_PROP;
    const images = await renderShots(previewShots(v.def), [v.def], path.join(dir, MOTION_TEMPLATE_R(`${round}`)));
    const review: any = await askAi(reviewPrompt(req, v.def, v.issues), MOTION_DESIGN.ARTIFACT_REVIEW, ctx, [...images, ...refs]);
    if (!review) break;
    const score = _.clamp(_.toNumber(review.score) || 0, 0, 10);
    const issues = _.take(
      _.map(_.castArray(review.issues || []), (x) => _.truncate(_.toString(x), { length: 200 })),
      6,
    );
    ctx.log?.(MOTION_TEMPLATE_THIET_KE_VONG_10(`${req.name}`, `${round}`, `${score}`, `${issues.length ? MOTION_TEMPLATE_SYMBOL_47(`${_.truncate(issues.join(MOTION_TEXT_SYMBOL_41), { length: 160 })}`) : ""}`));
    if (!best || score > best.score) best = { design: v.def, score };
    if (score >= MOTION_DESIGN.PASS_SCORE || round === maxRounds) break;
    raw = await askAi(revisePrompt(req, ctx.story, kind, v.def, score, issues.length ? issues : [MOTION_TEXT_RAISE_OVERALL_CRAFTSMANSHIP]), MOTION_DESIGN.ARTIFACT, ctx, [...images, ...refs]);
  }
  if (best && ctx.minScore && best.score < ctx.minScore) {
    ctx.log?.(MOTION_TEMPLATE_BAN_VE_LAI_CHI_DAT_10_THAP_HON(`${req.name}`, `${best.score}`, `${ctx.minScore}`));
    return null;
  }
  if (!best || best.score < MOTION_DESIGN.KEEP_SCORE) {
    ctx.log?.(MOTION_TEMPLATE_BO_THIET_KE_CHUA_DAT_DUNG_DO_CO(`${req.name}`));
    return null;
  }
  const record: MotionDesignRecord = { id: req.id, kind, name: req.name, design: best.design, score: best.score, brief: req.brief, story: ctx.story ? _.truncate(ctx.story, { length: 120 }) : undefined, createdAt: new Date().toISOString(), rounds };
  saveDesign(record);
  ctx.log?.(MOTION_TEMPLATE_DA_THEM_VAO_THU_VIEN_10(`${req.name}`, `${best.score}`));
  return record;
};
export const normalizeDesignRequests = (raw: unknown): MotionDesignRequest[] => {
  const reg = engine().registry;
  const existing = new Set(_.map(listDesigns(), MOTION_TEXT_ID));
  return _.take(
    _.uniqBy(
      _.compact(
        _.map(_.castArray(raw || []), (r: any) => {
          const id = _.snakeCase(
            _.toString(r?.id || r?.name)
              .normalize(MOTION_TEXT_NFD)
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/đ/g, MOTION_TEXT_D)
              .replace(/Đ/g, MOTION_TEXT_D_2),
          ).slice(0, 40);
          if (!/^[a-z][a-z0-9_]{2,40}$/.test(id)) return null;
          const kind = r?.kind === MOTION_TEXT_ENV_2 || r?.kind === MOTION_TEXT_PLACE ? MOTION_TEXT_ENV_2 : MOTION_TEXT_ASSET;
          if (kind === MOTION_TEXT_ENV_2 ? reg.environments[id] && !reg.environments[id].designed : reg.assets[id] && !reg.assets[id].designed) return null;
          if (existing.has(id)) return null;
          const size = _.isArray(r?.size) ? _.map(_.take(r.size, 2), (n) => _.clamp(_.toNumber(n) || 100, 10, 4000)) : undefined;
          return { kind, id, name: _.truncate(_.toString(r?.name || id), { length: 60 }), brief: _.truncate(_.toString(r?.brief || r?.description || r?.name || id), { length: 500 }), size, use: r?.use ? _.truncate(_.toString(r.use), { length: 80 }) : undefined } as MotionDesignRequest;
        }),
      ),
      MOTION_TEXT_ID,
    ),
    MOTION_DESIGN.MAX_REQUESTS,
  );
};
export const designMissing = async (requests: MotionDesignRequest[], ctx: DesignContext): Promise<MotionDesignRecord[]> => {
  if (!requests.length) return [];
  ctx.log?.(MOTION_TEMPLATE_THIET_KE_MOI_DAO_CU_BOI_CANH_CON(`${requests.length}`, `${_.map(requests, MOTION_TEXT_NAME).join(MOTION_TEXT_SYMBOL_14)}`));
  const assets = _.filter(requests, { kind: MOTION_TEXT_ASSET });
  const envs = _.filter(requests, { kind: MOTION_TEXT_ENV_2 });
  const done = _.compact(await mapMotionAiPool(assets, (r) => designOne(r, ctx).catch((e) => (ctx.log?.(MOTION_TEMPLATE_LOI_THIET_KE(`${r.name}`, `${_.truncate(_.toString(e?.message), { length: 120 })}`)), null))));
  const doneEnvs = _.compact(await mapMotionAiPool(envs, (r) => designOne(r, ctx).catch((e) => (ctx.log?.(MOTION_TEMPLATE_LOI_THIET_KE(`${r.name}`, `${_.truncate(_.toString(e?.message), { length: 120 })}`)), null))));
  return [...done, ...doneEnvs];
};
export const redesign = async (record: MotionDesignRecord, ctx: DesignContext & { brief?: string }): Promise<MotionDesignRecord | null> => {
  const brief = _.trim(ctx.brief || "") || record.brief;
  const size = record.kind === MOTION_TEXT_ASSET && _.isArray(record.design?.size) ? (record.design.size as number[]) : undefined;
  const req: MotionDesignRequest = { kind: record.kind, id: record.id, name: record.name, brief, size };
  ctx.log?.(MOTION_TEMPLATE_VE_LAI(`${record.name}`));
  return designOne(req, { ...ctx, minScore: brief === record.brief ? record.score : undefined });
};
export const designPreviews = (id: string): { round: string; files: string[] }[] => {
  const root = path.join(getMotionRootDirectory(), MOTION_DESIGN.PREVIEW_FOLDER);
  if (!fs.existsSync(root)) return [];
  const dirs = _.orderBy(
    _.filter(fs.readdirSync(root), (d) => d.startsWith(MOTION_TEMPLATE_SYMBOL_48(`${id}`)) && fs.statSync(path.join(root, d)).isDirectory()),
    (d) => fs.statSync(path.join(root, d)).mtimeMs,
    MOTION_TEXT_DESC,
  );
  const latest = _.find(dirs, (d) => _.some(fs.readdirSync(path.join(root, d)), (r) => /^r\d+$/.test(r)));
  if (!latest) return [];
  const rounds = _.sortBy(
    _.filter(fs.readdirSync(path.join(root, latest)), (r) => /^r\d+$/.test(r)),
    (r) => _.toNumber(r.slice(1)),
  );
  return _.map(rounds, (r) => ({
    round: r,
    files: _.map(
      _.filter(fs.readdirSync(path.join(root, latest, r)), (f) => /\.jpe?g$/i.test(f)),
      (f) => MOTION_TEMPLATE_SYMBOL_49(`${latest}`, `${r}`, `${f}`),
    ),
  }));
};
export const designPreviewFile = (rel: string): string | null => {
  const root = path.resolve(getMotionRootDirectory(), MOTION_DESIGN.PREVIEW_FOLDER);
  const file = path.resolve(root, _.toString(rel));
  if (!file.startsWith(root + path.sep) || !/\.jpe?g$/i.test(file) || !fs.existsSync(file)) return null;
  return file;
};
