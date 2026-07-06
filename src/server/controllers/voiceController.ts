import { Request, Response } from 'express';

import { EXTERNAL_URLS, DEFAULT_AI33_API_KEY, FALLBACK_VOICES_PREVIEWS } from '../../constants/apiRoutes.js';
import { getBackendMsg } from '../../constants/messages.js';
import { requestContext } from '../utils/requestContext.js';
import { appWarn, createAppError } from '../../lib/logger.js';
import { COMMON_STRINGS } from '../../constants/texts.js';

const FALLBACK_VOICES = [
  
  {
    voice_id: "edge_vi-VN-HoaiMyNeural",
    name: "Hoài My (Southern Female)",
    description: "Giọng nữ miền Nam truyền cảm, dịu dàng, phù hợp đọc truyện, tâm sự.",
    language: "vi",
    locale: "vi-VN",
    gender: "Female",
    age: "Adult",
    accent: "Southern",
    category: "Storytelling",
    use_cases: ["Audiobook", "Podcast", "Storytelling"],
    descriptives: ["Warm", "Soft", "Emotional"],
    tags: ["edge", "female", "vi-VN", "Southern"],
    preview_url: FALLBACK_VOICES_PREVIEWS.HOAI_MY
  },
  {
    voice_id: "edge_vi-VN-NamMinhNeural",
    name: "Nam Minh (Northern Male)",
    description: "Giọng nam miền Bắc dõng dạc, chuyên nghiệp, phù hợp đọc tin tức, phóng sự.",
    language: "vi",
    locale: "vi-VN",
    gender: "Male",
    age: "Adult",
    accent: "Northern",
    category: "News",
    use_cases: ["News", "Documentary", "Education"],
    descriptives: ["Professional", "Clear", "Confident"],
    tags: ["edge", "male", "vi-VN", "Northern"],
    preview_url: FALLBACK_VOICES_PREVIEWS.NAM_MINH
  },
  {
    voice_id: "gcp-vi-female",
    name: "Thùy Vy (Southern Female)",
    description: "Giọng nữ miền Nam trong trẻo, tự nhiên, thích hợp cho quảng cáo, giới thiệu sản phẩm.",
    language: "vi",
    locale: "vi-VN",
    gender: "Female",
    age: "Adult",
    accent: "Southern",
    category: "Conversational",
    use_cases: ["Advertising", "Vlog", "Review"],
    descriptives: ["Bright", "Friendly", "Clear"],
    tags: ["gcp", "female", "vi-VN", "Southern"],
    preview_url: FALLBACK_VOICES_PREVIEWS.THUY_VY
  },
  {
    voice_id: "gcp-vi-male",
    name: "Duy Linh (Northern Male)",
    description: "Giọng nam miền Bắc trầm ấm, sâu lắng, phù hợp với các video kể chuyện lịch sử, kiến thức.",
    language: "vi",
    locale: "vi-VN",
    gender: "Male",
    age: "Adult",
    accent: "Northern",
    category: "Storytelling",
    use_cases: ["Documentary", "History", "Podcast"],
    descriptives: ["Deep", "Warm", "Serious"],
    tags: ["gcp", "male", "vi-VN", "Northern"],
    preview_url: FALLBACK_VOICES_PREVIEWS.DUY_LINH
  },
  {
    voice_id: "preset-vi-trung-female",
    name: "Khánh Chi (Central Female)",
    description: "Giọng nữ miền Trung nhẹ nhàng, mộc mạc và chân thành.",
    language: "vi",
    locale: "vi-VN",
    gender: "Female",
    age: "Adult",
    accent: "Central",
    category: "Conversational",
    use_cases: ["Vlog", "Storytelling", "Poetry"],
    descriptives: ["Soft", "Sincere", "Gentle"],
    tags: ["preset", "female", "vi-VN", "Central"],
    preview_url: FALLBACK_VOICES_PREVIEWS.KHANH_CHI
  },
  {
    voice_id: "preset-vi-kid",
    name: "Bé Mai (Child Female)",
    description: "Giọng trẻ em dễ thương, trong sáng, thích hợp cho video thiếu nhi, hoạt hình.",
    language: "vi",
    locale: "vi-VN",
    gender: "Female",
    age: "Child",
    accent: "Southern",
    category: "Playful",
    use_cases: ["Animation", "Kids", "Games"],
    descriptives: ["Cute", "Cheerful", "Playful"],
    tags: ["preset", "female", "vi-VN", "Child"],
    preview_url: FALLBACK_VOICES_PREVIEWS.BE_MAI
  },

  
  {
    voice_id: "edge_en-US-AriaNeural",
    name: "Aria (US Female)",
    description: "Natural and conversational American English female voice.",
    language: "en",
    locale: "en-US",
    gender: "Female",
    age: "Adult",
    accent: "American",
    category: "Conversational",
    use_cases: ["Podcast", "E-learning", "Assistant"],
    descriptives: ["Natural", "Friendly", "Conversational"],
    tags: ["edge", "female", "en-US"],
    preview_url: FALLBACK_VOICES_PREVIEWS.ARIA
  },
  {
    voice_id: "edge_en-US-GuyNeural",
    name: "Guy (US Male)",
    description: "Professional, confident American English male voice.",
    language: "en",
    locale: "en-US",
    gender: "Male",
    age: "Adult",
    accent: "American",
    category: "News",
    use_cases: ["News", "Presentation", "Documentary"],
    descriptives: ["Confident", "Professional", "Clear"],
    tags: ["edge", "male", "en-US"],
    preview_url: FALLBACK_VOICES_PREVIEWS.GUY
  },
  {
    voice_id: "edge_en-GB-SoniaNeural",
    name: "Sonia (UK Female)",
    description: "Elegant, formal British English female voice.",
    language: "en",
    locale: "en-GB",
    gender: "Female",
    age: "Adult",
    accent: "British",
    category: "Education",
    use_cases: ["E-learning", "Audiobook", "Documentary"],
    descriptives: ["Elegant", "Formal", "Clear"],
    tags: ["edge", "female", "en-GB"],
    preview_url: FALLBACK_VOICES_PREVIEWS.SONIA
  },
  {
    voice_id: "edge_en-GB-RyanNeural",
    name: "Ryan (UK Male)",
    description: "Warm, authoritative British English male voice.",
    language: "en",
    locale: "en-GB",
    gender: "Male",
    age: "Adult",
    accent: "British",
    category: "Storytelling",
    use_cases: ["Audiobook", "Podcast", "Storytelling"],
    descriptives: ["Warm", "Authoritative", "Rich"],
    tags: ["edge", "male", "en-GB"],
    preview_url: FALLBACK_VOICES_PREVIEWS.RYAN
  }
];

export const getVoices = async (req: Request, res: Response) => {
  const isVi = req.query.lang !== COMMON_STRINGS.EN;
  try {
    const queryParams = new URLSearchParams(req.query as any).toString();
    const targetUrl = `${EXTERNAL_URLS.AI33_VOICES}?${queryParams}`;
    const store = requestContext.getStore();
    const apiKey = store?.ai33Key || process.env.AI33_API_KEY || DEFAULT_AI33_API_KEY;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      throw createAppError(`${getBackendMsg('HTTP_STATUS_ERROR', isVi)}${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    appWarn('FETCH_VOICES_ERR', 'External voice registry load failed. Falling back to high-quality local voices database.', error);

    
    let filtered = [...FALLBACK_VOICES];

    const reqLang = req.query.language as string;
    const reqGender = req.query.gender as string;
    const reqAge = req.query.age as string;
    const reqSearch = req.query.search as string;
    const reqPage = parseInt(req.query.page as string || '1', 10);
    const reqPageSize = parseInt(req.query.page_size as string || '30', 10);

    if (reqLang) {
      filtered = filtered.filter(v => v.language.toLowerCase() === reqLang.toLowerCase() || v.locale.toLowerCase().startsWith(reqLang.toLowerCase()));
    }
    if (reqGender) {
      filtered = filtered.filter(v => v.gender.toLowerCase() === reqGender.toLowerCase());
    }
    if (reqAge) {
      filtered = filtered.filter(v => v.age.toLowerCase() === reqAge.toLowerCase());
    }
    if (reqSearch) {
      const q = reqSearch.toLowerCase();
      filtered = filtered.filter(v => [v.name, v.description, v.voice_id].some(field => field.toLowerCase().includes(q)) || v.tags.some(t => t.toLowerCase().includes(q)));
    }

    const startIndex = (reqPage - 1) * reqPageSize;
    const paginated = filtered.slice(startIndex, startIndex + reqPageSize);
    const hasMore = startIndex + reqPageSize < filtered.length;

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: reqPage,
        page_size: reqPageSize,
        total: filtered.length,
        has_more: hasMore
      }
    });
  }
};
