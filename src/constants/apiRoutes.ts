export const API_ROUTES = {
  BASE_API: '/api',
  PIPELINE: '/api/pipeline',
  VOICES: '/api/voices',
  PROJECTS: '/api/projects',
  PIPELINE_EXTRACT_STYLE: '/api/pipeline/extract-style',
  PIPELINE_REWRITE_PROMPTS: '/api/pipeline/rewrite-prompts',
  PIPELINE_REWRITE_THUMBNAILS: '/api/pipeline/rewrite-thumbnails',
  PIPELINE_HOOKS: '/api/pipeline/hooks',
  PIPELINE_SCRIPT: '/api/pipeline/script',
  PIPELINE_STORYBOARD: '/api/pipeline/storyboard',
  PIPELINE_SEO: '/api/pipeline/seo',
  PIPELINE_THUMBNAILS: '/api/pipeline/thumbnails',
  PIPELINE_GENERATE_IMAGE: '/api/pipeline/generate-image',
  PIPELINE_GENERATE_BATCH_IMAGES: '/api/pipeline/generate-batch-images',
  PIPELINE_CLEAN_BATCH_IMAGES: '/api/pipeline/clean-batch-images',
  PIPELINE_DETAILED_PROMPT: '/api/pipeline/detailed-prompt',
  PIPELINE_VOICE: '/api/pipeline/voice',
  PIPELINE_ALIGN_VOICE: '/api/pipeline/align-voice',
};

export const EXTERNAL_URLS = {
  GOOGLE_TRANSLATE_API: 'https://translate.googleapis.com/translate_tts',
  GOOGLE_TRANSLATE_WEB_1: 'https://translate.google.com/translate_tts',
  GOOGLE_TRANSLATE_WEB_2: 'https://translate.google.com.vn/translate_tts',
  GOOGLE_TRANSLATE_REFERER: 'https://translate.google.com/',
  PLAYWRIGHT_CDP: 'http://127.0.0.1:9222',
  GOOGLE_LABS: 'https://labs.google/',
  GOOGLE_LABS_FLOW: 'https://labs.google/fx/vi/tools/flow/project',
  GEMINI_CHAT: 'https://gemini.google.com/app',
  GEMINI_CHAT_BASE: 'https://gemini.google.com',
  AI33_VOICES: 'https://api.ai33.pro/v3/voices',
  AI33_TTS: 'https://api.ai33.pro/v3/text-to-speech',
  AI33_TASK: 'https://api.ai33.pro/v1/task',
  LOREM_FLICKR: 'https://loremflickr.com',
  PLACEHOLD_CO: 'https://placehold.co',
};

export const ALIGN_CONFIG = {
  TEMP_DIR: 'temp_align',
  SCRIPT_FILE: 'voice_aligner.py',
};
