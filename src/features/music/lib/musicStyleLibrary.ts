import _ from "lodash";
import { MUSIC_STYLE_TITLE_LIMITS } from "../../../constants/musicPlanning.js";
import { MUSIC_CREATION_OPTIONS as O } from "../constants/musicCreationOptions.js";
import type { MusicStyleAnalysis, SavedMusicStyle } from "../../../types/musicPlanning.js";
const compactSunoStyle = (values: string[]): string => {
  const phrases = values.flatMap((value) => value.replace(O.EXPLANATORY_PARENS, O.EMPTY).split(O.STYLE_PHRASE_SEPARATOR)).filter((value) => !O.STYLE_REPORT_TEXT.test(value));
  const tags = _.uniqBy(
    phrases
      .flatMap((value) => value.split(O.STYLE_SEPARATOR))
      .map((value) => value.trim().replace(O.NORMALIZE_SPACE, O.SPACE))
      .filter((value) => value && value.length <= O.MAX_TAG_CHARS),
    (value) => value.toLowerCase(),
  );
  const selected: string[] = [];
  for (const tag of tags) {
    if ([...selected, tag].join(O.VALUE_SEPARATOR).length <= O.MAX_STYLE_CHARS) selected.push(tag);
  }
  return selected.join(O.VALUE_SEPARATOR);
};
export const normalizeAnalyzedMusicStyleContent = (content: string): string => {
  if (!O.LEGACY_PROFILE_SIGNATURE.test(content)) {
    const commentary = content.length > O.MAX_TAG_CHARS ? content.match(O.LEGACY_REPORT_CLAUSE) : undefined;
    return commentary?.index ? compactSunoStyle([content.slice(0, commentary.index)]) || content : content;
  }
  const sections = [...content.matchAll(O.LEGACY_SECTIONS)];
  if (sections.length < 3) return content;
  const prelude = content.slice(0, sections[0].index).trim();
  const values = sections.flatMap((section, index) => ((O.LEGACY_STYLE_LABELS as readonly string[]).includes(section[1]) ? [content.slice(section.index! + section[0].length, sections[index + 1]?.index ?? content.length).trim()] : []));
  const cleaned = compactSunoStyle(prelude ? [prelude, ...values] : values);
  return cleaned || content;
};
export const createAnalyzedMusicStyle = (profile: Partial<MusicStyleAnalysis> | undefined): SavedMusicStyle | undefined => {
  if (!profile) return undefined;
  const prompt = typeof profile.sunoStylePrompt === "string" ? profile.sunoStylePrompt.trim().replace(O.STYLE_PREFIX, O.EMPTY) : O.EMPTY;
  const content = (prompt && !O.LEGACY_PROFILE_SIGNATURE.test(prompt) ? compactSunoStyle([prompt]) : O.EMPTY) || compactSunoStyle(O.STYLE_FIELD_PATHS.flatMap((key) => _.castArray(_.get(profile, key))).filter((value): value is string => typeof value === "string" && !!value.trim()));
  if (!content) return undefined;
  const title = [profile.title, profile.genre?.primary, content.split(O.STYLE_SEPARATOR)[0], O.TITLE_FALLBACK]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().replace(O.TITLE_PREFIX, O.EMPTY).replace(O.TITLE_QUOTES, O.EMPTY).split(O.TITLE_SEPARATOR)[0].replace(O.TITLE_METADATA, O.EMPTY).replace(O.TITLE_COUNTER, O.EMPTY).trim().replace(O.NORMALIZE_SPACE, O.SPACE))
    .map((value) => _.truncate(value.split(O.SPACE).slice(0, MUSIC_STYLE_TITLE_LIMITS.MAX_WORDS).join(O.SPACE), { length: MUSIC_STYLE_TITLE_LIMITS.MAX_CHARS, separator: O.SPACE, omission: O.EMPTY }).trim())
    .find(Boolean)!;
  return { title, content };
};
export const mergeAnalyzedMusicStyle = (styles: SavedMusicStyle[], item: SavedMusicStyle): SavedMusicStyle[] => {
  const normalize = (value: string) => value.trim().replace(O.NORMALIZE_SPACE, O.SPACE).toLowerCase();
  return styles.some((entry) => normalize(entry.content) === normalize(item.content)) ? styles : [...styles, item];
};
