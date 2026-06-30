export const NO_FRAME_RULE = `CRITICAL RULE - NO FRAMES OR BORDERS: The generated image must be a direct, full-bleed view of the scene. NEVER use words like "framed", "painting in a frame", "picture frame", "canvas border", or "museum display". Explicitly append the keywords "borderless, no frame, no borders" at the very end of every image prompt you generate.`;

export const getSceneStyleRewritePrompt = (
  promptText: string,
  newStyle: string,
  isThumbnail: boolean = false,
): string => `You are an elite AI Image Prompt Designer.
Your task is to take the original ${isThumbnail ? "thumbnail" : "image"} generation prompt and rewrite it so that it perfectly aligns with the new visual style provided, while STRICTLY keeping the original meaning, setting, characters, and actions intact. 
DO NOT change the core narrative or semantic meaning${!isThumbnail ? " of the scene" : ""}. ONLY adapt the artistic/stylistic descriptors to match the requested style.

Original Prompt: "${promptText}"
New Target Style: "${newStyle}"

Combine the core meaning of the original prompt with the visual aesthetics of the new target style.
${NO_FRAME_RULE}
${!isThumbnail ? "IMPORTANT MANDATE: The rewritten image generation prompt MUST BE ENTIRELY IN ENGLISH, regardless of the language of the original prompt. Do not use Vietnamese in the output.\n" : ""}DO NOT include any commentary, prefixes, or markdown. Output ONLY the raw rewritten prompt string${!isThumbnail ? " in English" : ""}.`;

export const getStyleRewriteBatchPrompt = (
  newStyle: string,
  chunkJson: string,
): string => `You are an elite AI Image Prompt Designer.
Your task is to take a list of original image generation prompts and rewrite them so that they perfectly align with the new visual style provided, while STRICTLY keeping the original meaning, setting, characters, and actions intact. 
DO NOT change the core narrative or semantic meaning of the scenes. ONLY adapt the artistic/stylistic descriptors to match the requested style.

New Target Style: "${newStyle}"

Combine the core meaning of the original prompts with the visual aesthetics of the new target style.
${NO_FRAME_RULE}
IMPORTANT MANDATE: The rewritten image generation prompts MUST BE ENTIRELY IN ENGLISH, regardless of the language of the original prompts. Do not use Vietnamese in the output.

Output ONLY a valid JSON array matching the structure: [{"id": "scene_id", "prompt": "rewritten prompt in English"}]. Do not include markdown tags, code blocks, or explanatory text.

Input scenes:
${chunkJson}`;

export const getHookGeneratorPrompt = (
  count: number,
  originalInput: string,
  genre: string,
  hookType: string,
  duration: number,
  language: string,
): string => `You are a professional Youtube and TikTok script writer specializing in video layouts.
Generate ${count || 3} different hooks based on this input: "${originalInput}".
Genre/Category context: ${genre || "Storytelling"}.
Hook Style desired: ${hookType || "Auto"} (options: Auto, Mystery, Shock, Drama, Curiosity, Emotional, Historical, Statistical, Question, Story).
Duration context: ${duration || 10} seconds.
Output Language: ${language === "vi" ? "Vietnamese" : "English"}.

You must return a raw JSON Array matching this format perfectly. No markdown code wraps, no introductory text, just the raw JSON:
[
  { "id": "hk_unique_1", "content": "The Hook Line...", "type": "StyleName", "selected": true }
]`;

export const getChapterWriterPrompt = (
  chapterTitle: string,
  chapterDescription: string,
  genre: string,
  writingStyle: string,
  isVi: boolean,
  genreGuideline: string,
  styleGuideline: string,
  chapterWordTarget: number,
): string => `You are writing ONE CHAPTER of a larger script.
[Chapter Info]:
- Title: ${chapterTitle}
- Description: ${chapterDescription}

[System Configuration]:
- Video Category/Genre: ${genre || "Storytelling"}
- Writing Style: ${writingStyle || "Documentary"}
- Language: ${isVi ? "Vietnamese" : "English"}

[Genre Guideline]:
${genreGuideline}

[Writing Style Guideline]:
${styleGuideline}

[CRITICAL REQUIREMENT - LENGTH & TTS SAFE]:
${
  isVi
    ? `Hãy viết [${chapterTitle}] của kịch bản dựa trên dàn ý trên. Yêu cầu bắt buộc: Phần này phải đạt tối thiểu ${chapterWordTarget} từ. Viết lời thoại chi tiết, triển khai sâu nội dung, không tóm tắt chung chung. ĐÂY LÀ VĂN BẢN ĐỂ ĐỌC TTS, TUYỆT ĐỐI KHÔNG DÙNG: ký tự đặc biệt (*, #, _, -, [, ], /), emoji, hay markdown phức tạp. Chỉ dùng chữ cái và dấu câu cơ bản.`
    : `Write [${chapterTitle}] based on the outline. MANDATORY: This section must be at least ${chapterWordTarget} words. Write detailed narration and expand deeply. THIS IS FOR TTS VOICE SYNTHESIS, DO NOT USE: special characters (*, #, _, -, [, ], /), emojis, or complex markdown. Use only basic letters and punctuation.`
}

Provide strict output complying EXACTLY with this JSON structure:
{
  "scriptSegment": "Massive, extensive script lines for this chapter contributing to the ${chapterWordTarget}+ word count requirement."
}`;

export const getImagePromptDesignerPrompt = (
  genre: string,
  rewrittenScript: string,
): string => `You are an elite AI Image Prompt Designer.
Based on the genre "${genre}" and the provided full story script below:
---
${rewrittenScript}
---
Your task is to write ONE highly detailed, standalone image prompt that captures the MOST ICONIC, DEFINING MOMENT of this entire story. This image will be used as a master reference storyboard visual.

CRITICAL VISUAL DIRECTIVE (For ${genre} genre):
If the genre is Historical, Documentary, or Science, you MUST prioritize ultra-realistic, historically accurate, or scientifically precise depictions. Emphasize era-specific clothing, authentic environments, and correct anatomical or physical proportions. Avoid cartoonish, overly stylized, or fantasy elements unless the genre explicitly demands it. Include keywords like "cinematic realism", "historical accuracy", "photorealistic", and "authentic textures".

DO NOT use character names (like "John" or "Sarah"). Describe their physical appearance instead (e.g., "a tall man with short blonde hair wearing a red jacket").
${NO_FRAME_RULE}
Focus on lighting, camera angle, subject, action, background, and cinematic mood.
Return ONLY the prompt text, no explanations, no quotes.`;

export const getVideoDirectorSceneSplitPrompt = (
  chunkIndex: number,
  totalChunks: number,
  genre: string,
  genreVisualGuideline: string,
  splitInstruction: string,
  visualStyle: string,
  referenceStyle: string,
  customSplitRules: string,
  isVi: boolean,
  chunkScript: string,
  chaptersStr: string,
  referenceCharacters?: string,
): string => `You are an elite AI Video Director. Your mission is to split the rewritten script into semantic storytelling scenes.

[MULTI-STEP SYSTEM FLOW MANDATE]
You are processing chunk ${chunkIndex} of ${totalChunks}.
Video Genre Theme: ${genre}.
${genreVisualGuideline}
You MUST process EVERY SINGLE WORD of this script chunk. DO NOT SKIP, DROP, OR SUMMARIZE ANY PART OF THE NARRATION. The output scenes must perfectly re-assemble into the full script without missing a single word.

${splitInstruction}

Requirements:
1. Strict Sequencing: Traverse the ENTIRE script segment from beginning to end. DO NOT STOP until the segment is translated into scenes. Every word must be covered.
2. Highly Descriptive Prompts & Hard Contextual Alignment: Generate optimized, highly descriptive image prompts for text-to-image generators using the visual style: "${visualStyle || "Cinematic"}". ${referenceStyle ? 'CRITICAL STYLE REQUIREMENT: The user has extracted a specific art style: "' + referenceStyle + '". You MUST deeply integrate and blend these exact stylistic keywords into every single prompt you generate.' : ""} ${referenceCharacters ? "CRITICAL CHARACTER CONSISTENCY: The main characters have specific visual references: " + referenceCharacters + ". For each scene, if a character is present in the scene script, you MUST weave their exact physical characteristics and outfit description into the prompt." : ""}
   - STRICT PROMPT RICHNESS & DETAIL MANDATE: To prevent AI laziness and ensure highly immersive, gorgeous images, the "prompt" field MUST be extremely detailed and descriptive (minimum of 35-50 words). Do NOT write simple prompts like "realistic style, beautiful room" or "a person walking". Describe the focal subject (face, facial expression, clothing, posture, detailed action), the precise setting/background environment, the lighting (chiaroscuro, dramatic rim lighting, soft volumetric rays), the atmosphere/mood, and camera specifications (close-up, medium shot, extremely sharp focus, blurry depth of field, 8k resolution, cinematic style).
   - CRITICAL HARD CONTEXTUAL ALIGNMENT DIRECTIVE: What is written in the scene's script segment MUST be displayed exactly in the generated image. Do not use generic descriptions.
   - PROMPT MIXING RULE: When combining the visual art style with the image creation prompt, do NOT wash out, dilute, or lose the core narrative plot details of the scene.
   - KEYWORD WEIGHTING RULE: The core entities from the scene script (such as specific characters, actions, objects, setting of time and space) MUST be prioritized and placed at the very beginning of the image generation prompt with high weight. Absolutely prevent off-topic images, incorrect context, or missing entities compared to the narration segment.
   - ${NO_FRAME_RULE}
3. Dynamic Motion: Specify camera motion (options: Zoom In, Zoom Out, Pan Left, Pan Right, Static), video effects, and transitions.
${customSplitRules ? "4. CUSTOM USER RULE: " + customSplitRules : ""}

Language: ${isVi ? "Vietnamese" : "English"}.

Output must comply EXACTLY with this JSON schema (return only raw JSON, no markdown enclosing code blocks):
{
  "scenes": [
    {
      "id": "sc_1",
      "chapterId": "ch_unique_chapter_id",
      "startTime": "MM:SS",
      "endTime": "MM:SS",
      "duration": 5,
      "script": "The exact single sentence from the rewritten script.",
      "subtitle": "The exact single sentence from the rewritten script.",
      "prompt": "Highly detailed artistic image generation prompt matching this specific sentence's context, based on style: ${visualStyle} ${referenceStyle ? "and style keywords: " + referenceStyle : ""} ${referenceCharacters ? "and character details: " + referenceCharacters : ""}. THIS PROMPT MUST BE WRITTEN ENTIRELY IN ENGLISH, regardless of the script's language.",
      "cameraMotion": "Zoom In",
      "effects": "Lighting details matching style and mood",
      "transition": "Fade out to black"
    }
  ]
}

Script segment to divide (Part ${chunkIndex} of ${totalChunks}):
${chunkScript}

Chapters structure context:
${chaptersStr}`;

export const getSeoMarketerPrompt = (
  rewrittenScript: string,
  numTitles: number,
  numDescriptions: number,
  numHashtags: number,
  numTags: number,
  isVi: boolean,
): string => `You are a professional SEO marketer. Based on this rewritten story: "${rewrittenScript}",
generate ${numTitles} high-impact Video Titles and ${numDescriptions} Descriptions. Give each title and description key metrics from 0 to 100: searchability score, CTR score, competition score, and overall SEO score.
Include ${numHashtags} relevant hashtags and ${numTags} relevant search tags optimized for high reach.
Importantly, the descriptions, hashtags, and tags should be written in a general, versatile way so that they fit and apply perfectly to ALL of the generated titles (as they will be used together).
Language: ${isVi ? "Vietnamese" : "English"}.

Output must comply EXACTLY with this JSON structure. MAKE SURE YOU GENERATE THE EXACT REQUESTED AMOUNTS (${numTitles} titles, ${numDescriptions} descriptions, ${numHashtags} hashtags, ${numTags} tags):
{
  "titles": [
    { "text": "Draft title text", "searchScore": 95, "ctrScore": 90, "compScore": 30, "seoScore": 92 }
  ],
  "descriptions": [
    { "text": "Draft description text with hooks...", "searchScore": 85, "ctrScore": 80, "compScore": 40, "seoScore": 82 }
  ],
  "hashtags": ["tag1", "tag2"],
  "tags": ["tag1", "tag2", "tag3"]
}`;

export const getThumbnailLayoutPrompt = (
  rewrittenScript: string,
  thumbnailCount: number,
  refImageStr: string,
  isVi: boolean,
): string => `You are an elite, viral YouTube and social media thumbnail layout director. Based on this script: "${rewrittenScript}",
generate exactly ${thumbnailCount} distinct creative thumbnail designs that follow professional layout standards for maximum Click-Through Rate (CTR) on platforms like YouTube and Facebook.

${refImageStr}

CRITICAL THUMBNAIL LAYOUT DIRECTIVES (conforming to modern platform standards for maximum clickability):
1. STRICT PROMPT RICHNESS & DETAIL MANDATE: To prevent AI laziness and ensure highly engaging, click-worthy covers, the "prompt" field MUST be incredibly detailed, vivid, and descriptive (minimum of 35-50 words). Do NOT write simple or generic prompts. Describe the expressive focal subject in high detail, the dramatic lighting (such as strong neon rim-lights, backlight glowing effects), the high-contrast color scheme, the blurred bokeh background, and the intense cinematic composition that triggers instant curiosity.
2. Aspect Ratio & Composition: Always design with a 16:9 full-bleed cinematic landscape canvas in mind.
3. High CTR Focal Subject: Visual designs must trigger immediate curiosity, surprise, awe, or tension. A single, dominant, extreme focal subject (such as a close-up of a highly expressive/shocked face, or a glowing mysterious object) must stand out. Backgrounds must be heavily blurred (extreme shallow depth of field) to make the subject pop instantly.
4. Strict Minimal Text Rule (Avoid Clutter): The cover image must NOT contain excessive text.
   - For designs with text, "textText" MUST BE A MAXIMUM OF 1 TO 3 WORDS ONLY (e.g., "SỰ THẬT!", "CẢNH BÁO!", "BÍ MẬT!"). Long sentences or dense descriptions are strictly forbidden as they degrade click-through rates.
   - The image "prompt" itself should focus entirely on visual details. Do NOT ask the AI image generator to render written text or words inside the picture to avoid garbled/gibberish letters. Describe the scene purely visually.
5. Timestamp Blocking Prevention: NEVER place any critical subject details, facial features, or text overlays in the bottom-right corner. The platform's video duration badge (time stamp overlay) is located there and will block any visual element or text in that zone. Keep the bottom-right corner empty or neutral.
6. Rule of Thirds or Splits: Position key focal subjects on either the left-third or right-third line to leave clean space for visual balance or typography on the opposite side. Alternatively, suggest a clean vertical split-screen comparing two high-contrast scenes.
7. High Contrast & Saturation: Emphasize rich, highly saturated color contrasts, dramatic backlight/rim light, or vivid glows to make the thumbnail readable at a very small size on mobile devices.

MANDATORY TITLE OVERLAY REQUIREMENT:
- OUT OF THE ${thumbnailCount} DESIGNS, AT LEAST ONE DESIGN MUST BE ENTIRELY WITHOUT A TEXT OVERLAY.
- For this non-text design:
  * "hasText" must be FALSE.
  * "textText" must be an empty string "".
  * "layout", "typography", and "colorSuggestion" must be empty strings "".
  * "prompt" should focus entirely on a pure visual story with maximum dramatic impact, standard 16:9 composition, and clear focal subject.
- For the other designs (where "hasText" is TRUE):
  * "textText" must be a highly clickable, short, punchy hook consisting of 1-3 words max (written in ${isVi ? "Vietnamese" : "English"}).
  * Suggest a highly readable font ("typography") and high-contrast color scheme ("colorSuggestion" e.g., neon yellow, electric red, or white text with thick black stroke outlines).
  * The text overlay layout ("layout") must specify placement (e.g., "Left-third vertical stacked overlay" or "Top-left angled banner") that complements the focal subject and strictly avoids the bottom-right corner.

IMPORTANT MANDATE: The "prompt" field MUST ALWAYS BE IN ENGLISH, regardless of overall language settings.

Output must comply EXACTLY with this JSON structure:
[
  {
    "id": "th_unique_id",
    "prompt": "Detailed 16:9 artwork prompt describing high-contrast composition, lighting, focal subject, and blurred background for high click-through rate, in English",
    "style": "MrBeast",
    "hasText": true,
    "textText": "BÍ MẬT!",
    "layout": "Left-third vertical stacked overlay",
    "typography": "High-contrast thick Sans-Serif",
    "colorSuggestion": "Neon yellow with heavy black outline",
    "subjectFocus": "Focal character with shocked face on the right third"
  }
]`;

export const getOutlineWriterPrompt = (
  inputTypeContext: string,
  durationText: string,
  targetWordCount: number,
  genre: string,
  writingStyle: string,
  isVi: boolean,
  targetWordCountMin: number,
): string => `CRITICAL MANDATE: You MUST strictly adhere to all of the following [System Configuration] constraints and guidelines.

${inputTypeContext}

[System Configuration]:
- Target Duration: EXACTLY ${durationText}.
- Target Word Count: EXACTLY ${targetWordCount} words.
- Video Category/Genre: ${genre || "Storytelling"}
- Writing Style: ${writingStyle || "Documentary"}
- Language: ${isVi ? "Vietnamese (Tiếng Việt)" : "English (Tiếng Anh)"}

[Language Constraint - CRITICAL]:
The language requested is ${isVi ? "Vietnamese" : "English"}. 
You MUST write all titles and descriptions in ${isVi ? "Vietnamese" : "English"}.

Your task is to generate ONLY an OUTLINE for a script that will be exactly ${targetWordCount} words long.
Divide the outline into EXACTLY ${Math.max(4, Math.floor(targetWordCountMin / 300))} chapters.
Each chapter will later be expanded to approximately ${Math.ceil(targetWordCount / Math.max(4, Math.floor(targetWordCountMin / 300)))} words.

Provide strict output complying EXACTLY with this JSON structure:
{
  "factCheckNotes": "Fact checking notes based on the original input.",
  "chapters": [
    { "id": "ch_1", "title": "Chapter title", "description": "Brief description of what happens in this chapter to guide the detailed writing later" }
  ]
}`;

export const getDetailedPromptBuilderPrompt = (
  sceneScript: string,
  setting: string,
  time: string,
  character: string,
  costume: string,
  camera: string,
  style: string,
): string => `You are an elite AI Image Prompt Designer.
Your task is to take the user's inputs and create a highly detailed, cinematic image generation prompt.
Base Narrative: "${sceneScript}"
Setting/Environment: "${setting || "Not specified"}"
Time/Lighting: "${time || "Not specified"}"
Characters/Expression: "${character || "Not specified"}"
Costumes/Props: "${costume || "Not specified"}"
Camera Angle/Composition: "${camera || "Not specified"}"
Visual Style: "${style || "Cinematic"}"

Combine all these elements smoothly into a single, highly descriptive prompt optimized for Midjourney or Veo.
IMPORTANT MANDATE: The final output prompt MUST BE ENTIRELY IN ENGLISH, regardless of the language of the inputs.
DO NOT include any commentary, prefixes, or markdown. Output ONLY the raw prompt string in English.`;

export const getHookAnalysisPrompt = (
  originalInput: string,
  genre: string,
): string => `You are an expert content strategist. Analyze the following topic/idea: "${originalInput}".
Genre context: ${genre || "Storytelling"}.
Identify the primary target audience, core emotional triggers (curiosity, fear, nostalgia, shock, etc.), and outline 3 completely different narrative angles or hooks that would grab attention in the first 3 seconds on social media.
Output a raw JSON object with this format (no markdown):
{
  "audience": "Description of target audience",
  "triggers": ["trigger 1", "trigger 2"],
  "angles": [
    { "name": "Angle Name (e.g. Mystery)", "rationale": "Why this works" }
  ]
}`;

export const getHookPolishPrompt = (
  draftsJson: string,
  language: string,
): string => `You are a viral copywriting editor. Polish and refine the following draft hooks to make them extremely punchy, catchy, and optimized for TTS text-to-speech voice generation.
Draft Hooks JSON:
${draftsJson}

Rules:
1. Keep the hooks short, highly engaging, and smooth to read out loud.
2. Remove any special characters, emojis, hashtags or markdown.
3. Language of output content: ${language === "vi" ? "Vietnamese" : "English"}.
4. Return ONLY a raw JSON Array matching this schema perfectly (no markdown wrapping):
[
  { "id": "hk_unique_1", "content": "Polished Hook Line...", "type": "Angle Name", "selected": true }
]`;

export const getScriptConceptPrompt = (
  originalInput: string,
  genre: string,
  writingStyle: string,
  language: string,
): string => `You are an expert researcher and creative director.
Create a "Concept & Terminology Sheet" for a video script based on:
Input Idea: "${originalInput}"
Genre: "${genre}"
Style: "${writingStyle}"
Language: "${language === "vi" ? "Vietnamese" : "English"}"

Your task is to outline:
1. Concept details and historical/scientific settings.
2. Character Profiles: If characters exist, define their key traits, visual descriptions (clothing, age, style), and consistent naming.
3. Forbidden Terms vs Preferred Terminology: Recommend terms to use and terms to avoid to fit the genre and TTS engines.
Output a raw JSON object matching this schema perfectly (no markdown wrapping):
{
  "theme": "Core theme details",
  "characterSpecs": "Detailed visual descriptions of main characters or entities",
  "keywords": ["keyword1", "keyword2"],
  "preferredTerms": ["term1", "term2"]
}`;

export const getOutlineVerifyPrompt = (
  outlineJson: string,
  targetWordCount: number,
  genre: string,
): string => `You are a senior script editor. Review this draft outline:
${outlineJson}

Constraints:
- Genre: ${genre}
- Target Word Count: ${targetWordCount}

Critique the outline for:
1. Pacing & Flow: Is there a clear progression?
2. Redundancy: Are there chapters that repeat similar points?
3. Narrative Arc: Does it fit the ${genre} genre?

If there are issues, modify and improve the outline. If it is already perfect, keep it as is.
Output a raw JSON object matching this schema (no markdown wrapping):
{
  "factCheckNotes": "Fact checking notes, updated if needed",
  "chapters": [
    { "id": "ch_1", "title": "Chapter title", "description": "Polished chapter description" }
  ]
}`;

export const getScriptSanitizePrompt = (
  rawScript: string,
  isVi: boolean,
): string => `You are an AI TTS Normalization Service. Your job is to take the raw script and clean it so it can be synthesized by TTS engines flawlessly.
Raw Script:
"""
${rawScript}
"""

Rules:
1. REMOVE all markdown formatting, including bold (**), italics (*), headers (#), lists (-), blockquotes (>), brackets ([]), backticks (\`), and slashes.
2. REMOVE all emojis and special symbols.
3. SCRIPT EXPANSION: Expand any abbreviation or numeric figure into its full spoken word equivalent in ${isVi ? "Vietnamese" : "English"} (e.g. "100%" to "một trăm phần trăm" or "one hundred percent", "AI" to "trí tuệ nhân tạo" or "artificial intelligence" depending on context, "vs" to "với" or "versus").
4. Maintain the exact flow and paragraph structure.
Output a raw JSON object matching this schema (no markdown wrapping):
{
  "cleanedScript": "The fully cleaned, TTS-safe script text"
}`;

export const getGlobalVisualBiblePrompt = (
  script: string,
  genre: string,
  visualStyle: string,
  referenceStyle?: string,
  referenceCharacters?: string,
): string => {
  let prompt = `You are a cinematic concept artist. Analyze the video script to establish a cohesive Visual Bible.
Script:
"""
${script}
"""
Target Visual Style: "${visualStyle}"
Genre: "${genre}"`;

  if (referenceStyle) {
    prompt += `\n\nCRITICAL STYLE REFERENCE TO ADHERE TO:\nThe user has extracted/analyzed a specific visual style from reference images: "${referenceStyle}". You MUST deeply align the Color Palette, Environment, and Lighting mood of this Visual Bible with this style reference to ensure consistency.`;
  }

  if (referenceCharacters) {
    prompt += `\n\nCRITICAL CHARACTER REFERENCE TO ADHERE TO:\nThe characters have specific visual/physical appearance guidelines: ${referenceCharacters}. You MUST use these exact visual specifications when defining the character appearance and specs in the Visual Bible.`;
  }

  prompt += `\n\nEstablish:
1. Color Palette: A harmonious color palette (e.g., "dark obsidian tones with accents of electric amber").
2. Character/Subject Appearance: Specific, detailed, consistent descriptions of key characters, objects, or subjects mentioned (e.g. "an old man with thick silver hair, a weathered brown leather vest, round spectacles").
3. Environment & Lighting: Unified lighting style (e.g., "dramatic chiaroscuro lighting, soft volumetric dust particles").
Output a raw JSON object matching this schema (no markdown wrapping):
{
  "colorPalette": "Description of color palette",
  "characterSpecs": "Consistent appearance descriptors of main subjects (no proper names, just descriptions)",
  "lightingMood": "Volumetric lighting, environment mood descriptions"
}`;

  return prompt;
};

export const getScenePromptRefinePrompt = (
  scenesJson: string,
  visualBibleJson: string,
): string => `You are an elite Image Prompt Refiner. Your goal is to apply a global Visual Bible to individual scene prompts to ensure perfect character and visual consistency across the entire storyboard.

Visual Bible:
${visualBibleJson}

Scenes list to refine (JSON):
${scenesJson}

Rules:
1. For each scene, refine the "prompt" field to integrate the Visual Bible's color palette, character appearance, and lighting.
2. Put core entities (like characters, key actions) at the very beginning of the prompt with high weight, followed by style/bible details.
3. ${NO_FRAME_RULE}
4. Keep the prompt entirely in English.
4. Do not alter the script or timings.
5. Return ONLY the raw JSON array matching this format (no markdown code blocks):
[
  {
    "id": "sc_1",
    "prompt": "Refined English prompt..."
  }
]`;

export const getSeoKeywordAnalysisPrompt = (
  script: string,
  isVi: boolean,
): string => `You are an SEO analyst. Analyze this script:
"""
${script}
"""

Identify the top 10 search terms, including highly searched long-tail keywords, related to this content.
Output a raw JSON object (no markdown wrapping):
{
  "keywords": ["keyword 1", "keyword 2"]
}`;

export const getSeoRefinementPrompt = (
  draftSeoJson: string,
  keywordsJson: string,
  isVi: boolean,
): string => `You are a high-CTR SEO Optimizer. Take the draft SEO metadata and optimize it using the analyzed keywords list.
Draft SEO:
${draftSeoJson}

Keywords:
${keywordsJson}

Rules:
1. Keep titles highly click-worthy (CTR optimized), under 60 characters if possible.
2. Ensure descriptions naturally integrate at least 3 high-volume keywords.
3. Optimize tags and hashtags.
4. Output language: ${isVi ? "Vietnamese" : "English"}.
5. Return ONLY a raw JSON matching the original schema (no markdown wrapping):
{
  "titles": [
    { "text": "Optimized title", "searchScore": 95, "ctrScore": 95, "compScore": 25, "seoScore": 96 }
  ],
  "descriptions": [
    { "text": "Optimized description...", "searchScore": 92, "ctrScore": 90, "compScore": 30, "seoScore": 91 }
  ],
  "hashtags": ["tag1", "tag2"],
  "tags": ["tag1", "tag2"]
}`;

export const getThumbnailConceptPrompt = (
  script: string,
  count: number,
  isVi: boolean,
): string => `You are a viral YouTube thumbnail strategist. Brainstorm ${count || 3} high-CTR thumbnail composition concepts for a video based on this script.
Script:
"""
${script}
"""

Each concept should detail:
1. Core focal subject with extreme emotional triggers (shock, extreme curiosity, mystery, fear, awe) to maximize Click-Through Rate (CTR).
2. High-contrast elements, dramatic backlighting, or mysterious glows.
3. Best text hook overlay to place on the thumbnail. This text hook MUST be extremely short, clean, and punchy (strictly 1 to 3 words max, written in ${isVi ? "Vietnamese" : "English"}). For example, "BÍ MẬT!", "SỰ THẬT!", "CẢNH BÁO!", "TRÁNH XA!". Never use full sentences or long phrases to avoid layout clutter.
Output a raw JSON object (no markdown wrapping):
{
  "concepts": [
    { "composition": "Visual description", "textHook": "TEXT OVERLAY" }
  ]
}`;

export const getThumbnailPromptRefinePrompt = (
  draftThumbsJson: string,
  conceptsJson: string,
): string => `You are an expert thumbnail layout editor. Refine the draft thumbnail generation prompts using the high-CTR composition concepts to meet professional YouTube and Facebook thumbnail layout standards.

Draft Thumbnails:
${draftThumbsJson}

Concepts:
${conceptsJson}

Rules:
1. For each draft thumbnail, refine the "prompt" field to describe a highly engaging, high-contrast, professional 16:9 design that maximizes click-through rate (CTR). It must specify a clear, dominant focal subject (such as a highly expressive shocked/afraid face or glowing/mysterious object), blurred background (shallow depth of field), and high-contrast dramatic lighting (like backlighting or glowing accents).
2. STRICTOR TEXT MINIMALISM: Do NOT include excessive text on the cover. Any text overlay ("textText") must strictly be 1 to 3 words maximum (no full sentences, no clutter). The "prompt" itself must NOT describe rendering written text or letters to prevent generating garbled text.
3. DO NOT place any key visual detail, text overlay, or main subject in the bottom-right corner of the image because that is where video platform timestamps are overlayed.
4. At least one design in the array MUST remain completely WITHOUT a text overlay (where 'hasText' is false, 'textText' is "", and layout/typography/colorSuggestion are ""). Do not add text parameters to it.
5. ${NO_FRAME_RULE}
6. Prompts MUST be in English.
7. Return ONLY a raw JSON array matching this format (no markdown wrapping, no extra brackets, do not duplicate curly braces):
[
  {
    "id": "th_unique_id",
    "prompt": "Refined English 16:9 thumbnail prompt...",
    "style": "Style Name",
    "hasText": true,
    "textText": "Clickable text",
    "layout": "Layout description",
    "typography": "Font description",
    "colorSuggestion": "Color suggestion",
    "subjectFocus": "Focal element"
  }
]`;

export const getCharacterAnalysisPrompt = (
  script: string,
): string => `Analyze the following script and identify the main characters (maximum 3 characters, ordered by importance). For each character, identify their name, gender, age group, appearance details mentioned (like hair color, clothing style, facial features), and write a concise description in English.
Output ONLY a valid JSON array matching the structure: [{"name": "Character Name", "description": "Character description (1-2 sentences) in English"}], containing at most 3 elements. Do not include markdown tags, code blocks, or explanatory text.
Script:
${script}`;

export const getCharacterExtractPrompt = (
  characterDescription: string,
): string => `You are an expert prompt engineer. Analyze the provided image(s) showing the same main character, along with their text description: "${characterDescription || ""}".
Extract a highly detailed character design prompt in English that describes this character consistently. Focus on:
- Gender, ethnicity, and approximate age
- Facial features (eyes, nose, expression style)
- Hair style and color
- Wearing apparel/clothing details
- Distinguishing style features

Keep the output as a set of keywords or descriptive phrases separated by commas, max 30 words in total. Only return the English character prompt keywords, with no introductory text or markdown.`;

export const getCharacterRewriteBatchPrompt = (
  charactersJson: string,
  chunkJson: string,
): string => `You are an expert prompt engineer for AI image generators.
We have a list of scene prompts and a list of characters with their visual design prompts:
${charactersJson}

For each scene, identify which characters are present (by their names or descriptions in the scene text/script), and rewrite the scene prompt to naturally incorporate their specific visual design prompts.
Rules:
1. Ensure the characters' physical descriptions, clothing, and details from their prompt are woven naturally into each scene prompt where they appear.
2. Keep the scene's original action, background, setting, lighting, camera angle, and mood.
3. Do NOT change the overall style.
4. ${NO_FRAME_RULE}
5. Output ONLY a valid JSON array matching the structure: [{"id": "scene_id", "prompt": "rewritten prompt"}]. Do not include markdown tags, code blocks, or explanatory text.

Input scenes:
${chunkJson}`;

export const STYLE_EXTRACTION_PROMPT = `Analyze the provided image(s) and extract ONLY the core art style and visual aesthetic keywords.
Ignore and DO NOT describe the subject, specific characters, objects, or actions happening in the image.
Focus entirely on visual elements:
- Character Anatomy
- Line art & Expression
- Coloring & Shading

SPECIAL RULE:
If the image shows a stick figure character style (simple sketch with black outlines, large head, exaggerated expressions, flat colors): You MUST return exactly the following style keywords in English:
"Stick figure animation, thin black outline stick figure body, enlarged head and face, thick black outline strokes, highly detailed exaggerated facial expressions, large round eyes showing irises, flat color shading, no shadows, no gradient effects, minimalist rustic color palette"

For other images: Extract and describe the style entirely in English, using short phrases separated by commas, max 3 words per phrase (e.g., "3D animation, bright colors, thick black outlines, flat colors").
Only return the list of English style keywords, with no introductory text or markdown.`;

export const STICKMAN_STYLE_MODIFIERS =
  "stickman cartoon style, simple black-outline stickman body with oversized head and face, extremely detailed exaggerated facial expressions, big eyes with black pupils, hand-drawn thick black outlines, flat solid colors, no gradients, no shading, simple rustic color palette, minimalist sketch art background";

export const getMultiStepHookPrompt = (
  originalInput: string,
  genre: string,
  hookType: string,
  duration: number,
  language: string,
  count: number,
): string => `You are an elite YouTube/TikTok viral content strategist and copywriting script writer.
Your mission is to perform a highly strategic 3-step pipeline for the topic: "${originalInput}".

[Genre Context]: ${genre || "Storytelling"}
[Desired Hook Style]: ${hookType || "Auto"} (options: Auto, Mystery, Shock, Drama, Curiosity, Emotional, Historical, Statistical, Question, Story)
[Target Duration Context]: ${duration || 10} seconds
[Output Language]: ${language === "vi" ? "Vietnamese" : "English"}.

Your process MUST complete all 3 steps internally:
STEP 1: Strategic Audience & Angle Analysis
Identify the primary target audience, core emotional triggers (curiosity, fear, nostalgia, shock, etc.), and 3 completely different narrative angles or hooks that grab attention in the first 3 seconds on social media.

STEP 2: Drafting Hooks
Generate exactly ${count || 3} different hooks based on the strategic insights and the topic.

STEP 3: Polish and TTS Normalization
Polish and refine the draft hooks to make them extremely punchy, catchy, smooth to read out loud, and perfect for TTS voice generation. Do NOT use special characters (*, #, _, -, [, ], /), emojis, hashtags, or markdown. Use only basic letters and punctuation.

You MUST return a valid JSON object matching this schema perfectly. Output ONLY raw JSON, with no markdown code wraps, no introductory text, and no backticks:
{
  "audience": "Description of target audience",
  "triggers": ["trigger 1", "trigger 2"],
  "angles": [
    { "name": "Angle Name", "rationale": "Why this works" }
  ],
  "versions": [
    { "id": "hk_1", "content": "Polished, extremely high-retention hook line", "type": "Style/Angle Name" }
  ]
}`;

export const getCombinedScriptPrompt = (
  originalInput: string,
  durationText: string,
  targetWordCount: number,
  genre: string,
  writingStyle: string,
  isVi: boolean,
  selectedHookText: string,
  genreGuideline: string,
  styleGuideline: string,
  audienceGuideline: string,
  targetChapterCount: number,
  hookConfig?: { type: string; duration: number; positions: string },
): string => `You are an elite, professional research director and script outline planner.
Your mission is to perform a highly unified script outline and research process for this input: "${originalInput}".

[System Configuration]:
- Target Duration: ${durationText}
- Target Word Count: EXACTLY ${targetWordCount} words total.
- Video Genre: ${genre || "Storytelling"}
- Writing Style: ${writingStyle || "Documentary"}
- Language: ${isVi ? "Vietnamese (Tiếng Việt)" : "English (Tiếng Anh)"}

[Selected Opening Hook (MANDATORY PRE-PENDED)]: "${selectedHookText || ""}"
${
  hookConfig
    ? `[Hook Retention Strategy]:
- Hook Type: ${hookConfig.type}
- Hook Duration: ${hookConfig.duration}s
- Hook Positions: ${
        hookConfig.positions === "start"
          ? "The hook is placed only at the very beginning of the script."
          : hookConfig.positions === "mid"
          ? "There must be an opening hook, and a transitional mid-roll retention hook at the beginning of the middle chapters."
          : "Add retention hooks at the opening, the middle chapters, and a suspenseful/cliffhanger hook at the ending chapter."
      }`
    : ""
}

[Guidelines]:
- Genre Guidelines: ${genreGuideline}
- Writing Style Guidelines: ${styleGuideline}
- Audience: ${audienceGuideline}

Your workflow MUST execute the following steps internally:
STEP 1: Research & Concept sheet formulation. Determine theme details, main characters visual profiles, core keywords, and preferred terms.
STEP 2: Outline creation. Plan a pacing-optimized structure split into exactly ${targetChapterCount} chapters. Provide a clear title and description for each chapter detailing what narration must cover.

You MUST return a valid JSON object matching this schema perfectly. Output ONLY raw JSON, with no markdown code wraps or backticks:
{
  "theme": "Core theme details",
  "characterSpecs": "Detailed visual descriptions of main characters",
  "preferredTerms": ["preferredTerm1", "preferredTerm2"],
  "factCheckNotes": "Polished fact checking notes of the topic",
  "chapters": [
    {
      "id": "ch_1",
      "title": "Chapter I: Title of chapter",
      "description": "Detailed description of what this chapter must cover, scenes, events, and emotional arc"
    }
  ]
}`;

export const getSceneDensityPrompt = (
  chunkLength: number,
  label: string,
  maxChars: number,
  minScenes: number,
  maxScenes: number,
): string => `
The provided script chunk has a total length of ${chunkLength} characters.
The user has selected the [${label}] density (equivalent to a maximum of ${maxChars} characters per scene).
STRICT MATHEMATICAL TARGET: You MUST generate a total number of scenes that falls strictly between ${minScenes} and ${maxScenes} scenes.
If the returned result contains fewer than ${minScenes} scenes, the system will evaluate it as a critical failure and reject the response.
`.trim();

