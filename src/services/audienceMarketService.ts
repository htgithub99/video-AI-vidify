import _ from "lodash";
import { ProjectLanguage } from "../types";

export interface AudienceMarketProfile {
  id: "vietnam" | "international_english";
  locale: string;
  narration: string;
  retention: string;
  culturalContext: string;
  visualContext: string;
  seoContext: string;
}

const MARKET_PROFILES: Record<AudienceMarketProfile["id"], AudienceMarketProfile> = {
  vietnam: {
    id: "vietnam",
    locale: "Vietnamese audience across Vietnam",
    narration: "Write idiomatic contemporary Vietnamese with complete diacritics, natural Vietnamese word order, stable pronouns and speakable dates, money, percentages and units. Avoid translated syntax, excessive Sino-Vietnamese abstraction, corporate prose and imported slang used as decoration.",
    retention: "Earn attention through a concrete local situation, consequence, contradiction or evidence in the opening seconds. Use culturally recognizable details only when they are factual and relevant; never manufacture a generic shock question.",
    culturalContext: "Explain foreign institutions or references from a Vietnamese listener's frame of knowledge. For Vietnamese topics, preserve correct names, kinship, hierarchy, geography and historical context without nationalist exaggeration.",
    visualContext: "Use accurate Vietnamese geography, architecture, clothing, objects, signage language and social behavior when the story is set in Vietnam. Never substitute generic East Asian imagery.",
    seoContext: "Use natural Vietnamese search intent and compact Vietnamese titles. Avoid translated clickbait, vague secret claims, keyword stuffing and hashtags made from stop words.",
  },
  international_english: {
    id: "international_english",
    locale: "international English-speaking audience",
    narration: "Write clear idiomatic international English with concise context for country-specific names, institutions and history. Avoid unexplained local shorthand, translation-shaped syntax, culture-specific slang and US-only assumptions unless the selected audience requires them.",
    retention: "Open on a concrete globally understandable question, consequence, contradiction or piece of evidence. Create curiosity through specificity and payoff, not generic shock language.",
    culturalContext: "Preserve local names and perspectives while briefly orienting viewers who may not know the country, period, currency, geography or institution. Never flatten cultures into stereotypes.",
    visualContext: "Keep country, ethnicity, geography, architecture, clothing, objects and written language locally accurate. Do not replace a specific culture with generic cinematic imagery.",
    seoContext: "Use globally intelligible English search intent, precise nouns and a clear viewer benefit. Avoid vague secret claims, culture-free titles and keyword stuffing.",
  },
};

export const resolveAudienceMarketProfile = (language?: string): AudienceMarketProfile => (_.isEqual(language, ProjectLanguage.VI) ? MARKET_PROFILES.vietnam : MARKET_PROFILES.international_english);

export const createAudienceMarketDirective = (language?: string, audience: string = "General"): string => {
  const profile = resolveAudienceMarketProfile(language);
  return `[AUDIENCE MARKET CONTRACT — ${profile.id}]
- Primary market: ${profile.locale}.
- Selected audience: ${_.trim(audience) || "General"}.
- Narration: ${profile.narration}
- Retention: ${profile.retention}
- Cultural grounding: ${profile.culturalContext}
- Visual localization: ${profile.visualContext}
- Packaging and SEO: ${profile.seoContext}
Apply these rules across script, voice direction, visual planning, source selection, subtitles, title and thumbnail. Preserve factual cultural specificity; never imitate a creator's signature wording or branding.`;
};
