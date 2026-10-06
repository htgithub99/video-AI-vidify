import { createHash } from "crypto";
import fs from "fs";
import _ from "lodash";
import path from "path";
import {
  MOTION_TEMPLATE_AI_BO_SOT_KHUNG_HINH_SE_DUNG_HINH,
  MOTION_TEMPLATE_AI_DAO_DIEN_HINH_ANH_VIET_MO_TA,
  MOTION_TEMPLATE_AI_XEM_ANH_DE_KIEM_TRA_CO_KHOP,
  MOTION_TEMPLATE_ART,
  MOTION_TEMPLATE_ART_STYLE,
  MOTION_TEMPLATE_BO_QUA_BUOC_AI_XEM_ANH,
  MOTION_TEMPLATE_CALM_TASTEFUL_HISTORICAL_ILLUSTRATION_FOR_AN_EDUCATIONAL_MUSEUM,
  MOTION_TEMPLATE_CARD,
  MOTION_TEMPLATE_CAST,
  MOTION_TEMPLATE_CHARACTERS_KEEP_EXACTLY_THIS_LOOK,
  MOTION_TEMPLATE_CREATE_ONE_CHARACTER_DESIGN_REFERENCE_IMAGE_A_SINGLE,
  MOTION_TEMPLATE_CREATE_ONE_ILLUSTRATION,
  MOTION_TEMPLATE_DATA_IMAGE_BASE64,
  MOTION_TEMPLATE_FRAMING,
  MOTION_TEMPLATE_HERE_YOU_ONLY_LOOK_AT_ATTACHED_DRAFT_PICTURES,
  MOTION_TEMPLATE_HOLDING,
  MOTION_TEMPLATE_KHONG_VE_DUOC_NHAN_VAT,
  MOTION_TEMPLATE_KHUNG_HINH,
  MOTION_TEMPLATE_KHUNG_HINH_LOI,
  MOTION_TEMPLATE_NHAN_VAT,
  MOTION_TEMPLATE_OBJECT,
  MOTION_TEMPLATE_OBJECTS,
  MOTION_TEMPLATE_PEOPLE,
  MOTION_TEMPLATE_PLACE,
  MOTION_TEMPLATE_P_2,
  MOTION_TEMPLATE_ROLE_ART_DIRECTOR_AND_STORYBOARD_ARTIST_OF_A_2,
  MOTION_TEMPLATE_SYMBOL_30,
  MOTION_TEMPLATE_SYMBOL_35,
  MOTION_TEMPLATE_SYMBOL_36,
  MOTION_TEMPLATE_SYMBOL_37,
  MOTION_TEMPLATE_SYMBOL_39,
  MOTION_TEMPLATE_SYMBOL_40,
  MOTION_TEMPLATE_SYMBOL_41,
  MOTION_TEMPLATE_SYMBOL_42,
  MOTION_TEMPLATE_SYMBOL_43,
  MOTION_TEMPLATE_SYMBOL_44,
  MOTION_TEMPLATE_SYMBOL_45,
  MOTION_TEMPLATE_S_2,
  MOTION_TEMPLATE_THE,
  MOTION_TEMPLATE_THU_VE_LAI_KHUNG_HINH_LOI_VOI_MO,
  MOTION_TEMPLATE_THU_VE_LAI_NHAN_VAT_VOI_MO_TA,
  MOTION_TEMPLATE_VE_ANH_THAM_CHIEU_CHO_NHAN_VAT_GIU,
  MOTION_TEMPLATE_VE_KHUNG_HINH_MINH_HOA_BANG_GEMINI,
  MOTION_TEMPLATE_VE_LAI_KHUNG_HINH_CHUA_KHOP,
  MOTION_TEMPLATE_WORDS_IMAGE_PROMPT_WAS,
  MOTION_TEMPLATE_XONG_KHUNG_HINH_CO_ANH_MINH_HOA,
  MOTION_TEXT_0,
  MOTION_TEXT_1_1,
  MOTION_TEXT_3,
  MOTION_TEXT_4_5,
  MOTION_TEXT_9_16,
  MOTION_TEXT_ART,
  MOTION_TEXT_A_PERSON,
  MOTION_TEXT_BASE64,
  MOTION_TEXT_BG,
  MOTION_TEXT_CANCELLED,
  MOTION_TEXT_CAST,
  MOTION_TEXT_CINEMATIC_DOCUMENTARY_ILLUSTRATION_DETAILED_DIGITAL_PAINTING_IN_THE,
  MOTION_TEXT_DATA_ASSET,
  MOTION_TEXT_DATA_ENV,
  MOTION_TEXT_DATA_TIME,
  MOTION_TEXT_DESC,
  MOTION_TEXT_DESCEND,
  MOTION_TEXT_DONE,
  MOTION_TEXT_DUST,
  MOTION_TEXT_EMBERS,
  MOTION_TEXT_EN,
  MOTION_TEXT_ENDING,
  MOTION_TEXT_ENGLISH,
  MOTION_TEXT_FLICKER,
  MOTION_TEXT_GIU,
  MOTION_TEXT_HEX,
  MOTION_TEXT_HORIZONTAL_16_9,
  MOTION_TEXT_IMAGE,
  MOTION_TEXT_IMAGES,
  MOTION_TEXT_IMAGE_FAILED,
  MOTION_TEXT_JPEG,
  MOTION_TEXT_JPG,
  MOTION_TEXT_JPG_2,
  MOTION_TEXT_KEY,
  MOTION_TEXT_KICH_BAN_CHUA_CO_CANH_NAO_DE_VE,
  MOTION_TEXT_MATCHING_THE_ATTACHED_REFERENCE_IMAGES,
  MOTION_TEXT_MEN,
  MOTION_TEXT_MESSAGE,
  MOTION_TEXT_MOTION_ART_PLAN,
  MOTION_TEXT_MOTION_ART_REVIEW,
  MOTION_TEXT_NONE,
  MOTION_TEXT_NO_TEXT_NO_LETTERS_NO_WORDS_NO_CAPTIONS,
  MOTION_TEXT_OBJECT,
  MOTION_TEXT_OPENING,
  MOTION_TEXT_PAN_LEFT,
  MOTION_TEXT_PAN_RIGHT,
  MOTION_TEXT_PERSON,
  MOTION_TEXT_PLAN,
  MOTION_TEXT_PNG,
  MOTION_TEXT_PORTRAIT_4_5,
  MOTION_TEXT_PULL_OUT,
  MOTION_TEXT_PUSH_IN,
  MOTION_TEXT_RAIN,
  MOTION_TEXT_REVIEW,
  MOTION_TEXT_RISE,
  MOTION_TEXT_SCENE,
  MOTION_TEXT_SHA1,
  MOTION_TEXT_SMOKE,
  MOTION_TEXT_SNOW,
  MOTION_TEXT_SQUARE_1_1,
  MOTION_TEXT_STILL,
  MOTION_TEXT_SYMBOL_14,
  MOTION_TEXT_SYMBOL_15,
  MOTION_TEXT_SYMBOL_27,
  MOTION_TEXT_SYMBOL_30,
  MOTION_TEXT_SYMBOL_33,
  MOTION_TEXT_SYMBOL_40,
  MOTION_TEXT_SYMBOL_41,
  MOTION_TEXT_SYMBOL_42,
  MOTION_TEXT_TEXT_ONLY_TASK_YOU_WRITE_A_WRITTEN_SHOT,
  MOTION_TEXT_THE_PERSON,
  MOTION_TEXT_TITLE,
  MOTION_TEXT_TOOLS,
  MOTION_TEXT_VERTICAL_9_16,
  MOTION_TEXT_VIETNAMESE,
  MOTION_TEXT_WEBP,
  MOTION_TEXT_WEBP_2,
  MOTION_TEXT_WIDE_HORIZONTAL_16_9,
} from "../../constants/motionRuntime.js";
import { GenerateType, ImageGenerationMode } from "../../types.js";
import type { MotionAiExecution, MotionArt, MotionArtCast, MotionArtDirection, MotionBeat, MotionImageOptions, MotionStoryAnalysis, MotionStoryScript } from "../../types/motionVideo.js";
import { generateBatchImagesWithGeminiChat, type BatchImageItem } from "./imageGeneratorService.js";
import { getRealDirectory } from "./motionRealAssetService.js";
import { mapMotionAiPool, runMotionAi, type MotionAiImage } from "./motionStoryService.js";
const ARTIFACT_PLAN = MOTION_TEXT_MOTION_ART_PLAN;
const ARTIFACT_REVIEW = MOTION_TEXT_MOTION_ART_REVIEW;
const SCENE_VISUALS = [MOTION_TEXT_SCENE, MOTION_TEXT_OBJECT];
const BG_VISUALS = [MOTION_TEXT_TITLE, MOTION_TEXT_ENDING];
const MOVES = [MOTION_TEXT_PUSH_IN, MOTION_TEXT_PULL_OUT, MOTION_TEXT_PAN_LEFT, MOTION_TEXT_PAN_RIGHT, MOTION_TEXT_RISE, MOTION_TEXT_DESCEND, MOTION_TEXT_STILL];
const FX = [MOTION_TEXT_DUST, MOTION_TEXT_RAIN, MOTION_TEXT_SMOKE, MOTION_TEXT_EMBERS, MOTION_TEXT_FLICKER, MOTION_TEXT_SNOW, MOTION_TEXT_NONE];
const MAX_REVIEW_IMAGES = 8;
const DEFAULT_STYLE = MOTION_TEXT_CINEMATIC_DOCUMENTARY_ILLUSTRATION_DETAILED_DIGITAL_PAINTING_IN_THE;
const NO_TEXT = MOTION_TEXT_NO_TEXT_NO_LETTERS_NO_WORDS_NO_CAPTIONS;
interface ArtUnit {
  id: string;
  beatId: string;
  shotIndex: number;
  kind: "scene" | "bg";
  words: string;
  hint: string;
}
interface ArtOptions {
  aspect: string;
  exec: MotionAiExecution;
  image?: MotionImageOptions;
  signal?: AbortSignal;
  log?: (line: string) => void;
  progress?: (value: number, stage?: string) => void;
  partial?: (script: MotionStoryScript) => void;
  only?: string[];
}
const stripPrefix = (b64: string): string => _.toString(b64).replace(/^data:[^;]+;base64,/, "");
const extOf = (buf: Buffer): string => (buf[0] === 0x89 && buf[1] === 0x50 ? MOTION_TEXT_PNG : buf[0] === 0xff && buf[1] === 0xd8 ? MOTION_TEXT_JPG : buf.slice(8, 12).toString() === MOTION_TEXT_WEBP ? MOTION_TEXT_WEBP_2 : MOTION_TEXT_PNG);
const dataUrlOf = (rel: string): string | null => {
  try {
    const file = path.join(getRealDirectory(), rel);
    const buf = fs.readFileSync(file);
    const ext = extOf(buf);
    return MOTION_TEMPLATE_DATA_IMAGE_BASE64(`${ext === MOTION_TEXT_JPG ? MOTION_TEXT_JPEG : ext}`, `${buf.toString(MOTION_TEXT_BASE64)}`);
  } catch {
    return null;
  }
};
const artExists = (rel?: string): boolean => {
  if (!rel) return false;
  try {
    return fs.statSync(path.join(getRealDirectory(), rel)).size > 1000;
  } catch {
    return false;
  }
};
const saveImage = (key: string, name: string, base64: string): string => {
  const buf = Buffer.from(stripPrefix(base64), MOTION_TEXT_BASE64);
  const dir = path.join(getRealDirectory(), MOTION_TEXT_ART, key);
  fs.mkdirSync(dir, { recursive: true });
  const file = MOTION_TEMPLATE_SYMBOL_35(`${name.replace(/[^\w-]+/g, MOTION_TEXT_SYMBOL_30)}`, `${Date.now().toString(36)}`, `${extOf(buf)}`);
  fs.writeFileSync(path.join(dir, file), buf);
  return MOTION_TEMPLATE_ART(`${key}`, `${file}`);
};
const beatHint = (b: MotionBeat | (MotionBeat & { text?: string })): string => {
  const parts: string[] = [];
  if (b.env) parts.push(MOTION_TEMPLATE_PLACE(`${b.env}`, `${b.time ? MOTION_TEMPLATE_SYMBOL_36(`${b.time}`) : ""}`));
  if (b.shot) parts.push(MOTION_TEMPLATE_FRAMING(`${b.shot}`));
  if (b.actors?.length) parts.push(MOTION_TEMPLATE_PEOPLE(`${_.map(b.actors, (a) => MOTION_TEMPLATE_SYMBOL_37(`${a.cast}`, `${a.action}`, `${a.hold ? MOTION_TEMPLATE_HOLDING(`${a.hold}`) : ""}`)).join(MOTION_TEXT_SYMBOL_14)}`));
  if (b.props?.length) parts.push(MOTION_TEMPLATE_OBJECTS(`${_.map(b.props, (p) => p.asset).join(MOTION_TEXT_SYMBOL_14)}`));
  if (b.visual === MOTION_TEXT_OBJECT) parts.push(MOTION_TEMPLATE_OBJECT(`${_.get(b, MOTION_TEXT_DATA_ASSET, "")}`));
  return parts.join(MOTION_TEXT_SYMBOL_41);
};
const visualShots = (beat: MotionBeat) =>
  _.take(
    _.filter(
      _.map(beat.shots || [], (sh, raw) => ({ sh, raw })),
      (x) => !!x.sh?.visual,
    ),
    4,
  );
export const artUnits = (script: MotionStoryScript): ArtUnit[] => {
  const units: ArtUnit[] = [];
  for (const beat of script.beats) {
    const shots = visualShots(beat);
    if (shots.length >= 2) {
      shots.forEach(({ sh, raw }, k) => {
        if (_.includes(SCENE_VISUALS, sh.visual)) units.push({ id: MOTION_TEMPLATE_S_2(`${beat.id}`, `${k + 1}`), beatId: beat.id, shotIndex: raw, kind: MOTION_TEXT_SCENE, words: sh.text || beat.narration, hint: beatHint(sh as any) });
      });
      continue;
    }
    const main: MotionBeat = shots.length === 1 ? ({ ...beat, ...shots[0].sh } as MotionBeat) : beat;
    const shotIndex = shots.length === 1 ? shots[0].raw : -1;
    if (_.includes(SCENE_VISUALS, main.visual)) units.push({ id: beat.id, beatId: beat.id, shotIndex, kind: MOTION_TEXT_SCENE, words: beat.narration, hint: beatHint(main) });
    else if (_.includes(BG_VISUALS, main.visual)) units.push({ id: beat.id, beatId: beat.id, shotIndex, kind: MOTION_TEXT_BG, words: beat.narration, hint: MOTION_TEMPLATE_CARD(`${main.visual}`, `${beatHint({ ...main, env: _.get(main, MOTION_TEXT_DATA_ENV) as string, time: _.get(main, MOTION_TEXT_DATA_TIME) as string })}`) });
  }
  return units;
};
const getArt = (script: MotionStoryScript, unit: ArtUnit): MotionArt | undefined => {
  const beat = _.find(script.beats, { id: unit.beatId });
  if (!beat) return undefined;
  return unit.shotIndex >= 0 && beat.shots?.[unit.shotIndex] ? beat.shots[unit.shotIndex].art : beat.art;
};
const setArt = (script: MotionStoryScript, unit: ArtUnit, art: MotionArt): void => {
  const beat = _.find(script.beats, { id: unit.beatId });
  if (!beat) return;
  if (unit.shotIndex >= 0 && beat.shots?.[unit.shotIndex]) beat.shots[unit.shotIndex].art = art;
  else beat.art = art;
};
const ART_PREAMBLE = MOTION_TEXT_TEXT_ONLY_TASK_YOU_WRITE_A_WRITTEN_SHOT;
interface CastAlias {
  key: string;
  alias: string;
  role: string;
  names: string[];
}
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, MOTION_TEXT_SYMBOL_42);
const makeAliases = (analysis: MotionStoryAnalysis): CastAlias[] =>
  _.map(analysis.cast, (c, i) => {
    const words = _.split(_.trim(c.name || ""), /\s+/);
    const proper = words.length > 0 && _.every(words, (w) => /^\p{Lu}/u.test(w));
    const names = _.orderBy(_.uniq(_.compact([c.name, ...(proper ? _.filter(words, (w) => w.length >= 4) : [])])), (n) => n.length, MOTION_TEXT_DESC);
    return { key: c.key, alias: MOTION_TEMPLATE_P_2(`${i + 1}`), role: _.trim(`${c.role || ""}${c.description ? MOTION_TEMPLATE_SYMBOL_39(`${c.description}`) : ""}`), names };
  });
const toAlias = (aliases: CastAlias[], text: string): string => {
  let t = _.toString(text);
  for (const a of _.orderBy(aliases, (x) => x.key.length, MOTION_TEXT_DESC)) t = t.split(a.key).join(a.alias);
  for (const a of aliases) for (const n of a.names) t = t.replace(new RegExp(escapeRe(n), MOTION_TEXT_GIU), a.alias);
  return t;
};
const fromAlias = (aliases: CastAlias[], text: string): string =>
  _.toString(text).replace(/\[?\bP(\d+)\b\]?/g, (m, n) => {
    const a = aliases[_.toNumber(n) - 1];
    return a ? MOTION_TEMPLATE_SYMBOL_41(`${a.key}`) : m;
  });
const keyOfAlias = (aliases: CastAlias[], v: unknown): string | null => {
  const m = /^\[?P(\d+)\]?$/.exec(_.trim(_.toString(v)));
  const a = m ? aliases[_.toNumber(m[1]) - 1] : _.find(aliases, { key: _.toString(v) });
  return a ? a.key : null;
};
const castLine = (aliases: CastAlias[]): string => _.map(aliases, (a) => MOTION_TEMPLATE_SYMBOL_45(`${a.alias}`, `${a.role || MOTION_TEXT_PERSON}`)).join(MOTION_TEXT_SYMBOL_27);
const planPrompt = (script: MotionStoryScript, analysis: MotionStoryAnalysis, units: ArtUnit[], aspect: string, aliases: CastAlias[]): string =>
  MOTION_TEMPLATE_ROLE_ART_DIRECTOR_AND_STORYBOARD_ARTIST_OF_A_2(
    `${ART_PREAMBLE}`,
    `${toAlias(aliases, analysis.title)}`,
    `${toAlias(aliases, analysis.logline)}`,
    `${script.language === MOTION_TEXT_EN ? MOTION_TEXT_ENGLISH : MOTION_TEXT_VIETNAMESE}`,
    `${aspect === MOTION_TEXT_9_16 ? MOTION_TEXT_VERTICAL_9_16 : aspect === MOTION_TEXT_1_1 ? MOTION_TEXT_SQUARE_1_1 : aspect === MOTION_TEXT_4_5 ? MOTION_TEXT_PORTRAIT_4_5 : MOTION_TEXT_HORIZONTAL_16_9}`,
    `${castLine(aliases)}`,
    `${_.map(units, (u) => MOTION_TEMPLATE_SYMBOL_40(`${u.id}`, `${u.kind}`, `${toAlias(aliases, u.words)}`, `${toAlias(aliases, u.hint) || MOTION_TEXT_SYMBOL_33}`)).join(MOTION_TEXT_SYMBOL_27)}`,
    `${DEFAULT_STYLE}`,
    `${MOVES.join(MOTION_TEXT_SYMBOL_40)}`,
    `${FX.join(MOTION_TEXT_SYMBOL_40)}`,
  );
const composeImagePrompt = (direction: MotionArtDirection, art: MotionArt, aspect: string, refNames: string[]): string => {
  const byKey = _.keyBy(direction.cast, MOTION_TEXT_KEY);
  let text = art.prompt;
  for (const key of art.cast || []) {
    const c = byKey[key];
    if (c) text = text.split(MOTION_TEMPLATE_SYMBOL_41(`${key}`)).join(MOTION_TEMPLATE_THE(`${_.first(_.split(c.appearance, MOTION_TEXT_SYMBOL_15))}`));
  }
  text = text.replace(/\[([a-z0-9_]+)\]/gi, MOTION_TEXT_A_PERSON);
  const people = _.compact(_.map(art.cast || [], (key) => byKey[key] && MOTION_TEMPLATE_SYMBOL_30(`${_.first(_.split(byKey[key].appearance, MOTION_TEXT_SYMBOL_15))}`, `${byKey[key].appearance}`)));
  const ratio = aspect === MOTION_TEXT_9_16 ? MOTION_TEXT_VERTICAL_9_16 : aspect === MOTION_TEXT_1_1 ? MOTION_TEXT_SQUARE_1_1 : aspect === MOTION_TEXT_4_5 ? MOTION_TEXT_PORTRAIT_4_5 : MOTION_TEXT_WIDE_HORIZONTAL_16_9;
  return [MOTION_TEMPLATE_CREATE_ONE_ILLUSTRATION(`${ratio}`), text, people.length ? MOTION_TEMPLATE_CHARACTERS_KEEP_EXACTLY_THIS_LOOK(`${refNames.length ? MOTION_TEXT_MATCHING_THE_ATTACHED_REFERENCE_IMAGES : ""}`, `${people.join(MOTION_TEXT_SYMBOL_40)}`) : "", MOTION_TEMPLATE_ART_STYLE(`${direction.style}`), NO_TEXT].filter(Boolean).join(MOTION_TEXT_SYMBOL_27);
};
const SOFT_WORDS: [RegExp, string][] = [
  [/\b(rob(bery|bers?|bing)?|heist|steal(s|ing)?|stole|loot(ing|ed)?|thie(f|ves)|criminals?|crime|burglar(s|y)?)\b/gi, MOTION_TEXT_MEN],
  [/\b(pry(ing)?|prie[sd]|break(ing)? (open|into)|forc(e|ing) open|smash(ing)?|crack(ing)?)\b/gi, MOTION_TEXT_OPENING],
  [/\b(crowbars?|sledgehammers?|weapons?|guns?)\b/gi, MOTION_TEXT_TOOLS],
];
const softenPrompt = (text: string): string => {
  let t = text;
  for (const [re, rep] of SOFT_WORDS) t = t.replace(re, rep);
  return MOTION_TEMPLATE_CALM_TASTEFUL_HISTORICAL_ILLUSTRATION_FOR_AN_EDUCATIONAL_MUSEUM(`${t}`);
};
const characterPrompt = (direction: MotionArtDirection, c: MotionArtCast): string => MOTION_TEMPLATE_CREATE_ONE_CHARACTER_DESIGN_REFERENCE_IMAGE_A_SINGLE(`${c.appearance}`, `${direction.style}`, `${NO_TEXT}`);
const visualConfigOf = (opts: ArtOptions): any => ({
  generationMode: ImageGenerationMode.GeminiChat,
  generateType: GenerateType.Image,
  aspectRatio: opts.aspect,
  chromeHeadless: opts.image?.headless !== false,
  imageGeneratorEngine: opts.image?.engine || undefined,
  geminiChatSpeed: MOTION_TEXT_3,
  preserveAiPromptText: true,
});
const runBatch = async (items: BatchImageItem[], opts: ArtOptions, onDone: (id: string, base64: string | null, warning?: string) => void): Promise<void> => {
  if (!items.length) return;
  await generateBatchImagesWithGeminiChat(items, visualConfigOf(opts), undefined, (r) => {
    const b64 = r.success ? r.base64 || null : null;
    onDone(r.sceneId, b64, r.warning);
  });
};
const normalizeFocus = (f: unknown): number[] | undefined => {
  const arr = _.castArray(f).map(_.toNumber);
  return arr.length >= 2 && _.every(arr.slice(0, 2), _.isFinite) ? [_.clamp(arr[0], 0, 1), _.clamp(arr[1], 0, 1)] : undefined;
};
export const illustrateScript = async (input: MotionStoryScript, analysis: MotionStoryAnalysis, opts: ArtOptions): Promise<MotionStoryScript> => {
  const script: MotionStoryScript = _.cloneDeep(input);
  const log = opts.log || _.noop;
  const aliases = makeAliases(analysis);
  const units = artUnits(script);
  if (!units.length) throw new Error(MOTION_TEXT_KICH_BAN_CHUA_CO_CANH_NAO_DE_VE);
  const wanted = opts.only?.length ? new Set(opts.only) : null;
  const key =
    script.art?.key ||
    createHash(MOTION_TEXT_SHA1)
      .update(MOTION_TEMPLATE_SYMBOL_42(`${analysis.title}`, `${Date.now()}`))
      .digest(MOTION_TEXT_HEX)
      .slice(0, 10);
  const needPlan = !script.art || _.some(units, (u) => !getArt(script, u)?.prompt);
  if (needPlan) {
    opts.progress?.(0.03, MOTION_TEXT_PLAN);
    log(MOTION_TEMPLATE_AI_DAO_DIEN_HINH_ANH_VIET_MO_TA(`${units.length}`));
    const raw = await runMotionAi(planPrompt(script, analysis, units, opts.aspect, aliases), ARTIFACT_PLAN, opts.exec, opts.signal, log);
    const style = _.trim(_.toString(raw?.style)) || DEFAULT_STYLE;
    const castIn = _.castArray(raw?.cast || []);
    const prevCast = _.keyBy(script.art?.cast || [], MOTION_TEXT_KEY);
    const cast: MotionArtCast[] = _.compact(
      _.map(castIn, (c: any) => {
        const k = keyOfAlias(aliases, c?.key);
        const appearance = _.trim(toAlias(aliases, _.toString(c?.appearance)).replace(/\bP\d+\b/g, MOTION_TEXT_THE_PERSON));
        if (!k || !appearance) return null;
        return { key: k, appearance, image: prevCast[k]?.appearance === appearance ? prevCast[k].image : undefined };
      }),
    );
    script.art = { key, style, cast };
    const byId = _.keyBy(_.castArray(raw?.units || []), (u: any) => _.toString(u?.id));
    let missing = 0;
    for (const u of units) {
      const r = byId[u.id];
      if (!r?.prompt) {
        missing++;
        continue;
      }
      const old = getArt(script, u);
      const prompt = _.trim(fromAlias(aliases, _.toString(r.prompt)));
      setArt(script, u, {
        prompt,
        cast: _.filter(_.compact(_.map(_.castArray(r.cast || []), (v) => keyOfAlias(aliases, v))), (k) => _.some(cast, { key: k })),
        move: _.includes(MOVES, r.move) ? r.move : MOTION_TEXT_PUSH_IN,
        focus: normalizeFocus(r.focus),
        fx: _.includes(FX, r.fx) ? r.fx : MOTION_TEXT_DUST,
        image: old?.prompt === prompt ? old.image : undefined,
      });
    }
    if (missing) log(MOTION_TEMPLATE_AI_BO_SOT_KHUNG_HINH_SE_DUNG_HINH(`${missing}`));
    opts.partial?.(script);
  }
  const direction = script.art!;
  const castNeeded = _.uniq(_.flatMap(units, (u) => getArt(script, u)?.cast || []));
  const castTodo = _.filter(direction.cast, (c) => _.includes(castNeeded, c.key) && !artExists(c.image));
  if (castTodo.length) {
    opts.progress?.(0.12, MOTION_TEXT_CAST);
    log(MOTION_TEMPLATE_VE_ANH_THAM_CHIEU_CHO_NHAN_VAT_GIU(`${castTodo.length}`));
    for (const soft of [false, true]) {
      const list = _.filter(castTodo, (c) => !artExists(c.image));
      if (!list.length) break;
      if (soft) log(MOTION_TEMPLATE_THU_VE_LAI_NHAN_VAT_VOI_MO_TA(`${list.length}`));
      await runBatch(
        _.map(list, (c) => ({ sceneId: MOTION_TEMPLATE_CAST(`${c.key}`), prompt: soft ? softenPrompt(characterPrompt(direction, c)) : characterPrompt(direction, c), generateType: GenerateType.Image })),
        { ...opts, aspect: MOTION_TEXT_1_1 },
        (id, b64, warning) => {
          const c = _.find(direction.cast, { key: id.replace(/^cast_/, "") });
          if (!c) return;
          if (b64) {
            c.image = saveImage(key, id, b64);
            log(MOTION_TEMPLATE_NHAN_VAT(`${c.key}`));
          } else log(MOTION_TEMPLATE_KHONG_VE_DUOC_NHAN_VAT(`${c.key}`, `${_.truncate(_.toString(warning || ""), { length: 100 })}`));
        },
      );
    }
    opts.partial?.(script);
  }
  const drawList = (ids: Set<string> | null) => _.filter(units, (u) => (!wanted || wanted.has(u.id)) && (ids ? ids.has(u.id) : true) && !!getArt(script, u)?.prompt);
  const makeItems = (list: ArtUnit[], soft = false): BatchImageItem[] =>
    _.map(list, (u) => {
      const art = getArt(script, u)!;
      const refs = _.compact(_.map(art.cast || [], (k) => _.find(direction.cast, { key: k })));
      const refData = _.compact(_.map(refs, (c) => (c.image ? dataUrlOf(c.image) : null)));
      const refNames = _.map(
        _.filter(refs, (c) => !!c.image),
        (c) => toAlias(aliases, c.key),
      );
      return { sceneId: u.id, prompt: soft ? softenPrompt(composeImagePrompt(direction, art, opts.aspect, refNames)) : composeImagePrompt(direction, art, opts.aspect, refNames), generateType: GenerateType.Image, referenceImages: refData, referenceImageNames: refNames };
    });
  const todo = _.filter(drawList(null), (u) => !artExists(getArt(script, u)?.image));
  let done = 0;
  let total = todo.length;
  const onImage = (id: string, b64: string | null, warning?: string) => {
    const u = _.find(units, { id });
    if (!u) return;
    const art = getArt(script, u);
    if (!art) return;
    done++;
    opts.progress?.(0.2 + 0.6 * (done / Math.max(1, total)), MOTION_TEXT_IMAGES);
    if (b64) {
      setArt(script, u, { ...art, image: saveImage(key, id, b64), failed: undefined });
      log(MOTION_TEMPLATE_KHUNG_HINH(`${id}`, `${done}`, `${total}`));
    } else {
      if (!artExists(art.image)) setArt(script, u, { ...art, failed: _.truncate(_.toString(warning || MOTION_TEXT_IMAGE_FAILED), { length: 160 }) });
      log(MOTION_TEMPLATE_KHUNG_HINH_LOI(`${id}`, `${done}`, `${total}`, `${_.truncate(_.toString(warning || ""), { length: 100 })}`));
    }
    opts.partial?.(script);
  };
  if (total) {
    log(MOTION_TEMPLATE_VE_KHUNG_HINH_MINH_HOA_BANG_GEMINI(`${total}`));
    await runBatch(makeItems(todo), opts, onImage);
    const failed = _.filter(todo, (u) => !artExists(getArt(script, u)?.image));
    if (failed.length) {
      done = 0;
      total = failed.length;
      log(MOTION_TEMPLATE_THU_VE_LAI_KHUNG_HINH_LOI_VOI_MO(`${failed.length}`));
      await runBatch(makeItems(failed, true), opts, onImage);
    }
  }
  if (opts.image?.review !== false) {
    const reviewUnits = _.filter(drawList(null), (u) => u.kind === MOTION_TEXT_SCENE && artExists(getArt(script, u)?.image) && (!wanted || wanted.has(u.id)));
    const redo: string[] = [];
    opts.progress?.(0.85, MOTION_TEXT_REVIEW);
    let reviewStopped = false;
    await mapMotionAiPool(_.chunk(reviewUnits, MAX_REVIEW_IMAGES), async (group) => {
      if (opts.signal?.aborted) throw new Error(MOTION_TEXT_CANCELLED);
      if (reviewStopped) return;
      log(MOTION_TEMPLATE_AI_XEM_ANH_DE_KIEM_TRA_CO_KHOP(`${group.length}`));
      const images: MotionAiImage[] = _.map(group, (u, i) => ({
        name: MOTION_TEMPLATE_SYMBOL_35(`${String(i + 1).padStart(2, MOTION_TEXT_0)}`, `${u.id}`, `${path.extname(getArt(script, u)!.image!).slice(1) || MOTION_TEXT_PNG}`),
        mimeType: MOTION_TEXT_IMAGE + (path.extname(getArt(script, u)!.image!) === MOTION_TEXT_JPG_2 ? MOTION_TEXT_JPEG : path.extname(getArt(script, u)!.image!).slice(1) || MOTION_TEXT_PNG),
        path: path.join(getRealDirectory(), getArt(script, u)!.image!),
      }));
      const prompt = MOTION_TEMPLATE_HERE_YOU_ONLY_LOOK_AT_ATTACHED_DRAFT_PICTURES(
        `${ART_PREAMBLE}`,
        `${toAlias(aliases, analysis.title)}`,
        `${toAlias(aliases, analysis.logline)}`,
        `${_.map(direction.cast, (c) => MOTION_TEMPLATE_SYMBOL_43(`${toAlias(aliases, c.key)}`, `${c.appearance}`)).join(MOTION_TEXT_SYMBOL_40)}`,
        `${_.map(group, (u, i) => MOTION_TEMPLATE_WORDS_IMAGE_PROMPT_WAS(`${i + 1}`, `${u.id}`, `${toAlias(aliases, u.words)}`, `${toAlias(aliases, getArt(script, u)!.prompt)}`)).join(MOTION_TEXT_SYMBOL_27)}`,
      );
      try {
        const raw = await runMotionAi(prompt, ARTIFACT_REVIEW, opts.exec, opts.signal, log, images);
        for (const r of _.castArray(raw?.reviews || [])) {
          const u = _.find(group, { id: _.toString(r?.id) });
          if (!u || r?.ok !== false) continue;
          const art = getArt(script, u)!;
          const prompt2 = _.trim(fromAlias(aliases, _.toString(r?.prompt || "")));
          setArt(script, u, { ...art, prompt: prompt2 || art.prompt, note: _.truncate(_.toString(r?.problems || ""), { length: 200 }) });
          redo.push(u.id);
          log(MOTION_TEMPLATE_SYMBOL_44(`${u.id}`, `${_.truncate(_.toString(r?.problems || ""), { length: 140 })}`));
        }
      } catch (error) {
        if (opts.signal?.aborted) throw error;
        if (!reviewStopped) log(MOTION_TEMPLATE_BO_QUA_BUOC_AI_XEM_ANH(`${_.truncate(_.toString(_.get(error, MOTION_TEXT_MESSAGE, error)), { length: 140 })}`));
        reviewStopped = true;
      }
    });
    if (redo.length) {
      done = 0;
      total = redo.length;
      const list = drawList(new Set(redo));
      log(MOTION_TEMPLATE_VE_LAI_KHUNG_HINH_CHUA_KHOP(`${list.length}`));
      await runBatch(makeItems(list), opts, onImage);
    }
  }
  const ok = _.filter(units, (u) => artExists(getArt(script, u)?.image)).length;
  log(MOTION_TEMPLATE_XONG_KHUNG_HINH_CO_ANH_MINH_HOA(`${ok}`, `${units.length}`));
  opts.progress?.(1, MOTION_TEXT_DONE);
  return script;
};
