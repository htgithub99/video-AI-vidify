import { Request, Response } from 'express';

import { EXTERNAL_URLS } from '../../constants/apiRoutes.js';
import { getBackendMsg } from '../../constants/messages.js';
import { requestContext } from '../utils/requestContext.js';
import { appError, appWarn, createAppError } from '../../lib/logger.js';

const FALLBACK_VOICES = [
  // Vietnamese Voices (Northern & Southern, Male & Female)
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
    preview_url: "https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=Chào+bạn,+đây+là+giọng+nữ+miền+Nam+Hoài+My+ấm+áp."
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
    preview_url: "https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=Kính+chào+quý+vị,+đây+là+bản+tin+thử+nghiệm+từ+Nam+Minh."
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
    preview_url: "https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=Chào+mừng+bạn+đến+với+trình+tạo+video+tự+động+Thùy+Vy."
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
    preview_url: "https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=Khám+phá+những+câu+chuyện+lịch+sử+kỳ+bí+cùng+giọng+đọc+Duy+Linh."
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
    preview_url: "https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=Em+xin+gửi+lời+chào+thân+thương+nhất+tới+mọi+người+từ+Khánh+Chi."
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
    preview_url: "https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=Con+chào+ông+bà,+chào+các+bạn!+Con+là+Bé+Mai+đây+ạ."
  },

  // English Voices
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
    preview_url: "https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=Hello!+This+is+Aria,+your+conversational+narrator."
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
    preview_url: "https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=Welcome+to+the+automated+news+and+media+studio.+I+am+Guy."
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
    preview_url: "https://translate.google.com/translate_tts?ie=UTF-8&tl=en-gb&client=tw-ob&q=Good+day.+This+is+Sonia,+providing+an+elegant+British+narration."
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
    preview_url: "https://translate.google.com/translate_tts?ie=UTF-8&tl=en-gb&client=tw-ob&q=Hello.+My+name+is+Ryan,+a+warm+and+authoritative+voice+from+the+UK."
  }
];

export const getVoices = async (req: Request, res: Response) => {
  const isVi = req.query.lang !== 'en';
  try {
    const queryParams = new URLSearchParams(req.query as any).toString();
    const targetUrl = `${EXTERNAL_URLS.AI33_VOICES}?${queryParams}`;
    const store = requestContext.getStore();
    const apiKey = store?.ai33Key || process.env.AI33_API_KEY || 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImZ0UTF2dE1kNHArNG41SUYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3hwa2NhcHFxYnJraHNwcmJxb2NiLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIxYTFlZjhjOC1hN2Q4LTRkYzMtYmRjMy1kYmZjODI1MGMzZmMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgyOTc1MDQyLCJpYXQiOjE3ODIzNzAyNDIsImVtYWlsIjoibGVldm90aWkxMjM0QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSXhxOHJVNXlTU0NuRDJxLU15TEtfZ2NJcm5wNkRTUkNDZXZHbjFmRW9SVUhHXzNuTVhQQT1zOTYtYyIsImVtYWlsIjoibGVldm90aWkxMjM0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJUb8OgbiBMZW8iLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiVG_DoG4gTGVvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSXhxOHJVNXlTU0NuRDJxLU15TEtfZ2NJcm5wNkRTUkNDZXZHbjFmRW9SVUhHXzNuTVhQQT1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTE0MjcxMzQ3Mzk5OTQ1MjYwMzkxIiwic3ViIjoiMTE0MjcxMzQ3Mzk5OTQ1MjYwMzkxIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib2F1dGgiLCJ0aW1lc3RhbXAiOjE3NjQ5OTMyNzB9XSwic2Vzc2lvbl9pZCI6IjY0ZjhjZDllLTMzNTItNDI5Zi1hYTYyLWZhMjg5OWNhNWUzNCIsImlzX2Fub255bW91cyI6ZmFsc2V9.Rsut9S1qJEUqimObZXDTd4a7QLwMVhHTBvfxWy9FjY0';

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
    
    // Graceful fallback logic matching filter query parameters
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
      filtered = filtered.filter(v => 
        v.name.toLowerCase().includes(q) || 
        v.description.toLowerCase().includes(q) ||
        v.voice_id.toLowerCase().includes(q) ||
        v.tags.some(t => t.toLowerCase().includes(q))
      );
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
