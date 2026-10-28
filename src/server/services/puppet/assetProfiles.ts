import { stringifyJson, parseJson } from "../../../lib/jsonStringify.js";
import { isPuppetString } from "../../../lib/motionPuppetValues.js";
import { PA } from "../../../constants/motionPuppetAssets.js";
import fs from "node:fs";
import path from "node:path";
import { puppetEnglish } from "../../../lib/motionPuppetAssets.js";
import type { MotionStoryAnalysis } from "../../../types/motionVideo.js";
import { runMotionAi } from "../motionStoryService.js";
import { puppetHash, puppetLibDir } from "./kitLibrary.js";
import { writeMotionJsonAtomic } from "../motionFileUtils.js";
import type { PuppetRunOptions } from "./stylePack.js";
type ProfileRow = { key: string; name?: string; role?: string; look?: string; description?: string };
type Profiles = { title?: string; logline?: string; era?: string; look?: string; cast: ProfileRow[]; places: ProfileRow[] };
const englishValue = (value: unknown): string | undefined => {
  if (!isPuppetString(value)) return undefined;
  const normalized = PA.PROFILE_PUNCTUATION.reduce((s, rule) => s.replace(rule.pattern, rule.replacement), value).trim();
  return puppetEnglish(normalized) ? normalized : undefined;
};
const mergeProfiles = (input: Profiles, previous: Profiles | undefined, raw: any): { profiles: Profiles; issues: string[] } => {
  const profiles: Profiles = { cast: [], places: [] },
    issues: string[] = [];
  const fieldValue = (source: string | undefined, before: unknown, value: unknown, field: string, required = false): string | undefined => {
    if (!source && !required) return source;
    const result = englishValue(before) || englishValue(value) || englishValue(source);
    if (!result) issues.push(field);
    return result;
  };
  for (const field of PA.PROFILE_FIELDS) profiles[field] = fieldValue(input[field], previous?.[field], raw?.[field], field);
  for (const group of PA.PROFILE_GROUPS) {
    const fields = group === PA.CAST ? PA.PROFILE_CAST_FIELDS : PA.PROFILE_PLACE_FIELDS;
    profiles[group] = input[group].map((source) => {
      const matches = Array.isArray(raw?.[group]) ? raw[group].filter((row: any) => row?.key === source.key) : [];
      const row = matches.length === 1 ? matches[0] : undefined;
      const before = previous?.[group].find((item) => item.key === source.key);
      const item: ProfileRow = { key: source.key };
      for (const field of fields) item[field] = fieldValue(source[field], before?.[field], row?.[field], PA.PROFILE_PATH(group, source.key, field), field === PA.PROFILE_CAST_FIELDS[0]);
      return item;
    });
  }
  return { profiles, issues };
};
export const englishPuppetAnalysis = async (analysis: MotionStoryAnalysis, o: PuppetRunOptions): Promise<MotionStoryAnalysis> => {
  o.signal?.throwIfAborted();
  const input = { title: analysis.title, logline: analysis.logline, era: analysis.era, look: analysis.look, cast: analysis.cast.map((c) => ({ key: c.key, name: c.name, role: c.role, look: c.look || c.description, gender: c.gender, age: c.age })), places: analysis.places.map((p) => ({ key: p.key, name: p.name, description: p.description, interior: p.interior, time: p.time })) };
  const signature = puppetHash(PA.ARTIFACT + PA.VERSION + PA.PROFILE_VERSION + stringifyJson(input));
  const directory = puppetLibDir(PA.PROFILES_DIR),
    file = path.join(directory, signature + PA.JSON);
  let cached: unknown;
  try {
    cached = parseJson(fs.readFileSync(file, PA.UTF8));
  } catch {}
  let { profiles, issues } = mergeProfiles(input, undefined, cached);
  if (issues.length) {
    o.log(PA.LOG);
    const attempts: { attempt: number; response: unknown; issues: string[] }[] = [];
    for (let attempt = 0; issues.length && attempt < PA.PROFILE_ATTEMPTS; attempt++) {
      o.signal?.throwIfAborted();
      if (attempt) o.log(PA.PROFILE_REPAIR_LOG(issues, attempt));
      const prompt = attempt ? PA.PROFILE_REPAIR_PROMPT(stringifyJson(input), stringifyJson(profiles), issues) : PA.PROFILE_PROMPT(stringifyJson(input));
      const response = await (o.ai || runMotionAi)(prompt, PA.ARTIFACT, o.exec, o.signal, o.log);
      o.signal?.throwIfAborted();
      ({ profiles, issues } = mergeProfiles(input, profiles, response));
      attempts.push({ attempt: attempt + 1, response, issues });
      if (issues.length || attempts.length > 1) {
        try {
          const diagnosticDirectory = path.join(directory, PA.PROFILE_DIAGNOSTICS);
          fs.mkdirSync(diagnosticDirectory, { recursive: true });
          writeMotionJsonAtomic(path.join(diagnosticDirectory, signature + PA.JSON), { input, attempts });
        } catch {
          o.log(PA.PROFILE_DIAGNOSTIC_ERROR);
        }
      }
    }
    if (issues.length) throw new Error(PA.PROFILE_ERROR(issues));
    writeMotionJsonAtomic(file, profiles);
  }
  return {
    ...analysis,
    title: profiles.title!,
    logline: profiles.logline!,
    era: profiles.era,
    look: profiles.look,
    cast: analysis.cast.map((c) => {
      const translated = profiles.cast.find((it) => it.key === c.key)!;
      const look = c.look || c.description ? translated.look : undefined;
      return { ...c, name: translated.name!, role: c.role ? translated.role : c.role, look, description: look };
    }),
    places: analysis.places.map((p) => {
      const translated = profiles.places.find((it) => it.key === p.key)!;
      return { ...p, name: translated.name!, description: p.description ? translated.description! : p.description };
    }),
  };
};
