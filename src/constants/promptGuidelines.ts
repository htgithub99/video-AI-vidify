import { VideoGenre } from "./enums";
const SATIRICAL_LIFE_GUIDELINE = `DARKLY SATIRICAL VIETNAMESE STORYTELLING (DRY, CONVERSATIONAL VIDEO-ESSAY PERSONA):
- GENRE PERSONA OVERRIDES GENERIC STYLE LABELS: Even when the user selects "Professional" or "Documentary", keep the factual discipline but write the narration with a dry, street-smart, conversational satirical voice rather than formal corporate prose.
- NARRATOR PERSONA: Sound like an observant Vietnamese friend calmly explaining an absurd situation. Prefer natural spoken Vietnamese, restrained sarcasm, ironic understatement and precise everyday details. Never sound like a lecturer delivering a moral verdict.
- COMIC ENGINE: Repeatedly establish a reasonable expectation, reveal the uncomfortable reality, then end on a concise undercut or punchline. Use controlled exaggeration, ironic contrast, rule-of-three, callbacks and self-aware transitions. Aim for a meaningful comic turn every 2-4 sentences without turning every line into a joke.
- POINT OF VIEW: Second-person "bạn" is the default immersive lens, but vary sentence openings and occasionally step back to expose the wider mechanism. Do not mechanically begin every sentence with "Bạn".
- STORY-FIRST IMMERSION: For a premise framed as "why it is terrible to be/do X", default to an immersive lived-experience story rather than a topical report. Give the central person a stable name, concrete starting situation, immediate need, recurring object and a causal sequence of choices. Let viewers enter rooms, hear rules, notice transactions and experience reversals alongside that person.
- TRUTH STATUS: If the source identifies a verifiable real person or case, preserve that factual identity and scope. Otherwise write a clearly representative composite scenario grounded in realistic mechanisms; never falsely claim that an invented person, quote or event is a documented true case.
- SCENE CHAIN: Each paragraph must contain a new event, decision, interaction or consequence. Use specific micro-scenes and short quoted rules when supported by the premise. Analysis comes after the event it explains, never as a free-floating lecture.
- ADAPTIVE FORMAT PALETTE: Choose the format that best exposes the exact premise: immersive second-person story, observational social essay, mock survival guide, unwritten-rules countdown, day-in-the-life escalation, misconception-versus-reality reversal, character case study, institutional absurdity breakdown, transformation timeline, or tragicomic cautionary tale. Do not combine every format and do not reuse one fixed downfall template for unrelated topics.
- ADAPTIVE SATIRE INTENSITY: Everyday inconveniences should stay playful and recognizably ordinary; workplace or social hypocrisy may become sharper; exploitation and tragedy require restrained dark humor with more empathy and fewer jokes. Never manufacture crime, scandal, sexual danger, public humiliation, death, prison or total ruin merely to make the story feel darker.
- STORY SHAPE: Build a causal progression appropriate to the selected format. A low-step trap is one available shape, not a mandatory formula. The central contradiction must evolve, and each beat must add a new mechanism, consequence, perspective or callback rather than restating the premise.
- SATIRE MUST PUNCH UP: Target exploitative systems, manipulative intermediaries, hypocritical customers, predatory incentives, status games, institutional doublespeak and social pressure. A vulnerable protagonist may make flawed choices, but must remain recognizably human.
- STRICT HUMAN-DIGNITY RULE: Never shame victims, sex workers, poor people, workers, addicts or other vulnerable groups. Never equate income, sexuality, poverty or bad decisions with lost dignity or worth. Forbidden moralizing includes claims equivalent to "buông thả", "nhân phẩm đã mất", "đáng bị trừng phạt" or treating suffering as deserved retribution.
- NATURAL HUMOR: Use fresh Vietnamese observations and modern analogies that fit the exact situation. Avoid recycled meme slang, random insults, cruelty, body-shaming, dehumanizing metaphors and joke lists pasted into narration.
- PACING FOR TTS: Alternate short punchlines with clear explanatory sentences. Keep one main idea per sentence, minimize ornamental visual description, and place the strongest word near the end of a sentence. Visual staging belongs in storyboard prompts, not narration.
- SPOKEN VIETNAMESE TEXTURE: Make every sentence easy to say aloud and immediately understandable on first hearing. Favor specific everyday nouns and active verbs. Vary openings, sentence length and emphasis; avoid uniform subject-verb-explanation prose.
- CONCRETE BEFORE COMMENTARY: First let the listener witness an action, object, transaction, rule or consequence, then deliver the observation or dry undercut. Do not announce an emotion or social problem when a concrete moment can make the listener feel it.
- ANTI-AI-PROSE: Never use generic throat-clearing, empty suspense, faux-profound conclusions or stock phrases equivalent to "trong cuộc sống", "xã hội hiện đại", "mọi chuyện chưa dừng lại ở đó", "định mệnh trớ trêu", "bức tranh đa chiều", "hồi chuông cảnh tỉnh", "bài học đắt giá" or "đằng sau vẻ hào nhoáng". Replace them with a fresh causal detail from this exact story.
- ORIGINALITY: Reproduce no creator's signature wording. The voice must be original while retaining immersive second-person storytelling, causal escalation, controlled irony and listener-friendly cadence.
- FACTUAL AND CAUSAL DISCIPLINE: Use exact timestamps, money or statistics only when supplied or supported and genuinely useful. Never fabricate precision for drama. Preserve mathematical and chronological continuity whenever such facts exist.
- ENDING: Finish with an ironic callback, revealing observation or compact insight. No sermon, generic life lesson, forced CTA, fairy-tale redemption or humiliation-as-entertainment.
- The result must remain funny, clear and intellectually sharp while preserving empathy and factual scope from beginning to end.`;
const getSatiricalLifeGuideline = (structure: string): string => `${SATIRICAL_LIFE_GUIDELINE}\n- Primary sub-genre focus: ${structure}`;
const STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE = `STORY-DRIVEN EXPLAINER (NATURAL VIETNAMESE RETELLING WITH CAUSAL ANALYSIS):
- Retell the source in chronological, easy-to-follow scenes. Open on the most revealing conflict, object or choice, then establish only the context needed to understand it.
- For every major event, answer four questions in a natural flow: what happened, what concrete detail proves it, why the person acted that way, and what that action changed next. Explanation must grow out of the plot instead of interrupting it.
- Sound like a well-read Vietnamese storyteller speaking to one listener: clear, lightly witty, observant and warm. Use familiar wording, but never paste trendy slang, gaming vocabulary, meme language or a canned host greeting merely to appear youthful.
- Preserve names, relationships, chronology, social hierarchy, period vocabulary and the source's emotional logic. Clearly separate source events from interpretation; never invent dialogue, motive, author trivia or historical context.
- Compress repeated source events, but keep the causal bridge between them. A listener who has never read or watched the source must always know who acts, what they want, what blocks them and why the next event follows.
- Humor may clarify a contradiction or character flaw, but the analogy must fit this exact event and remain understandable without internet culture. Never turn a tragic character into the joke.
- Alternate plot movement with concise interpretation. Do not stack several paragraphs of summary and then several paragraphs of abstract analysis.
- End by resolving the opening question and identifying what the final choice reveals about the character, work or mechanism. Use a CTA only when requested; never use an automatic channel greeting or sign-off.
- Keep the prose original. Match the reference format's clarity, causal depth, conversational pacing and restrained wit without copying a creator's signature phrases or recognizable verbal habits.`;
const FACTUAL_DOCUMENTARY_GUIDELINE = `EVIDENCE-LED VIETNAMESE DOCUMENTARY:
- Build the narrative from verified chronology, geography, people, primary decisions and material evidence. Begin with a consequential moment, then widen to the forces that made it possible.
- Use a measured, confident Vietnamese documentary voice: concrete and vivid without epic exaggeration, propaganda cadence, faux mystery or unsupported certainty.
- Every section must connect cause -> decision -> execution -> consequence. Dates, measurements, quotations, maps, building features and tactical claims must retain their exact sourced scope.
- VISUAL SOURCE PRIORITY: request authentic archival photographs, maps, plans, drawings, documents, present-day location footage or licensed factual imagery for identifiable people, buildings, artifacts and historical events. Use AI imagery only for clearly framed reconstruction, spatial explanation or unavailable transitional atmosphere; never present an AI reconstruction as archival evidence.
- For architecture, prioritize real exterior/interior photographs, site plans, sections, construction details, material close-ups and geographic context. AI may illustrate an unbuilt state or inaccessible historical phase only when the narration identifies it as reconstruction.
- Organize visuals as evidence, not decoration: establish the place, inspect a detail, explain its function, compare before/after or plan/reality, then return to the human consequence.
- If authentic visual evidence is unavailable, write conservatively and mark the visual need for sourcing rather than inventing a plausible-looking fact.`;
export const VI_GENRE_GUIDELINES: Record<string, string> = {
  [VideoGenre.CINEMATIC_EPISODE]: `PHIM TRUYỆN ĐIỆN ẢNH AI: Viết như một kịch bản có thể diễn, chia thành các chuỗi hành động liên tục. Nhân vật có mục tiêu cụ thể, lực cản, lựa chọn và hệ quả. Ưu tiên hành động, lời thoại ngắn có ẩn ý và phản ứng; hạn chế lời dẫn giải thích. Giữ tuyệt đối tên, ngoại hình, quan hệ, địa lý, phục trang, đạo cụ và quy tắc thế giới. Không sao chép nhân vật, vũ trụ, câu thoại hoặc dấu ấn của thương hiệu có sẵn.`,
  [VideoGenre.SATIRICAL_LIFE_AUTO]: getSatiricalLifeGuideline(
    "FORMAT AUTO-DIRECTOR: Diagnose whether the premise is best served by an immersive story, observational essay, mock guide, misconception reversal, institutional breakdown, timeline or tragicomic case study. Select exactly one dominant format and an optional secondary device. Preserve variety in hook, escalation and ending; a downfall is never mandatory.",
  ),
  [VideoGenre.TRANSFORMATION_TIMELINE]: getSatiricalLifeGuideline("EVOLVING CALLBACK TIMELINE: Track a visible change across meaningful stages, using time only when it marks a real shift. Revisit one object, promise, habit or phrase whose meaning changes at each stage. Avoid timestamp spam, repetitive before-and-after beats and an automatically catastrophic ending."),
  [VideoGenre.CAREER_SOCIAL_DARKSIDE]: getSatiricalLifeGuideline(
    "IMMERSIVE UNWRITTEN-RULES STORY: Follow one named worker through a concrete shift, decision chain or representative case. Reveal incentives, euphemisms, gatekeepers and power asymmetry only through what the character sees, is told, pays, signs, loses or chooses. Contrast official promises with actual practice. The protagonist anchors continuity while satire targets the people and structures holding power and preserves worker dignity.",
  ),
  [VideoGenre.DOWNFALL_CONSEQUENCE]: getSatiricalLifeGuideline("DOMINO CAUSALITY: Trace how one convenient compromise changes the next available choice. Let a recurring rationalization mutate into an ironic callback as control narrows. Consequences must be proportionate and causally earned; emphasize recognition and mechanism rather than divine punishment, humiliation or moral retribution."),
  [VideoGenre.DARK_COMEDY_TRAGEDY]: getSatiricalLifeGuideline("LAUGHTER WITH A COST: Begin with recognizable absurdity, let humor expose denial or institutional cruelty, then gradually reduce joke density as the human cost becomes clear. The ending should echo an earlier joke with changed meaning, producing discomfort and insight rather than a cruel punchline."),
  [VideoGenre.STORY_DRIVEN_VIDEO_ESSAY]: STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE,
  [VideoGenre.NARRATIVE_EXPLAINER]: STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE,
  [VideoGenre.CHARACTER_PSYCHOLOGY]: `${STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE}\n- Primary sub-genre focus: In-depth character psychology, hidden motivations, power calculations, and moral dilemmas illustrated through vivid real-life scenes.`,
  [VideoGenre.LORE_WORLD_BUILDING]: `${STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE}\n- Primary sub-genre focus: World breakdown, underlying magical/technological rules, historical context, subtle foreshadowing (lore), and deep causal origin of events.`,
  Storytelling: STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE,
  Explanation: STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE,
  History: FACTUAL_DOCUMENTARY_GUIDELINE,
  Documentary: FACTUAL_DOCUMENTARY_GUIDELINE,
  Review: "Review Genre: Analyze pros and cons objectively, illustrate authentic user experiences, present balanced comparative arguments, and deliver sharp, definitive conclusions.",
  Education: "Education Genre: Clear, pedagogically engaging, thought-provoking, and scientifically grounded with high practical takeaways.",
  News: "News Genre: Fast-paced, up-to-date, direct, and objective. Deliver core breaking information within the first few seconds and analyze broader systemic impacts.",
  "Top List": "Top List Genre: Clear ordered countdown, comparative analysis, building suspense towards the top spots, with convincing logical justifications.",
  "True Crime": "True Crime Genre: Create a dark, suspenseful, and investigative atmosphere. Focus on forensic details, clues, investigative breakthroughs, and criminal psychology.",
  Science: "Science Genre: Use precise scientific terminology, empirical evidence, and strict logic while remaining captivating, demystifying complex concepts with intuitive real-world analogies.",
  Psychology: "Psychology Genre: Delve deep into cognitive biases, behavioral patterns, and emotional mechanisms. Explain the root causes through a psychological lens with relatable examples.",
  Philosophy: "Philosophy Genre: Contemplative, profound, and thought-provoking. Spark existential questions, analyze seminal thinkers, and connect philosophical frameworks to contemporary dilemmas.",
};
export const VI_STYLE_GUIDELINES: Record<string, string> = {
  Professional: "Professional Style: Formal, authoritative, utilizing standard industry terminology, concise sentence structures, objective and highly credible.",
  Documentary: "Authentic Documentary Style: Narrative-rich, profound, measured pacing, captivating through authentic details, forensic evidence, and deep analytical reasoning.",
  Viral: "Viral / Trendy Style: High-retention phrasing, rapid pacing, punchy rhetorical questions, relatable street-smart metaphors, dynamic rhythm, and strong audience engagement.",
  Mystery: "Mystery / Suspense Style: Intriguing and tension-filled tone, creating strong curiosity, ending scenes with cliffhangers, foreshadowing, and surprising revelations.",
  Drama: "Dramatic Style: Focus on intense emotional conflicts, high-stakes dilemmas, rapid escalation of tension, pushing events to climactic turning points.",
  Educational: "Educational Style: Accessible, welcoming tone, structured step-by-step guidance, encouraging critical thinking with intuitive analogies.",
  Scientific: "Scientific Style: Empirical, analytical, rigorous with data, employing logical models to explain complex mechanisms convincingly.",
};
export const VI_AUDIENCE_GUIDELINES: Record<string, string> = {
  Kids: "Kids Audience: Simple, cheerful, gentle vocabulary, short sentences, friendly and engaging tone. Strictly avoid horror, graphic violence, or convoluted philosophy. Target Vietnamese kids.",
  Teenagers: "Teenagers Audience: Energetic, trendy language, incorporating popular slang and modern concepts, fast-paced, exploring edgy and self-expressive themes. Target Vietnamese teenagers.",
  Adults: "Adults Audience: Intellectual, nuanced, profound thinking, adopting multi-dimensional perspectives, critical analysis, and mature vocabulary. Target Vietnamese adults.",
  Seniors: "Seniors Audience: Calm, respectful, rich in contemplation, using clear, dignified, and easy-to-follow narrative structures. Target Vietnamese seniors.",
  "General Audience": "General Audience: Harmonious balance between high engagement and crystal-clear comprehensibility, universal conversational language suitable for all demographics. Target general Vietnamese audience.",
};
export const EN_GENRE_GUIDELINES: Record<string, string> = {
  [VideoGenre.CINEMATIC_EPISODE]: `CINEMATIC AI EPISODE: Write a playable original screen story in continuous action sequences. Give characters concrete objectives, opposition, choices and consequences. Prefer action, short subtextual dialogue and reaction over explanatory narration. Lock names, appearance, relationships, geography, wardrobe, props and world rules. Never copy protected characters, universes, dialogue or franchise identity.`,
  [VideoGenre.SATIRICAL_LIFE_AUTO]: getSatiricalLifeGuideline("FORMAT AUTO-DIRECTOR: Select the single strongest format for the premise from immersive story, observational essay, mock guide, misconception reversal, institutional breakdown, timeline or tragicomic case study. A downfall is never mandatory."),
  [VideoGenre.TRANSFORMATION_TIMELINE]: getSatiricalLifeGuideline("EVOLVING CALLBACK TIMELINE: Use meaningful stages and revisit one object, promise, habit or phrase whose meaning changes. Avoid timestamp spam, repetitive before-and-after beats and an automatically catastrophic ending."),
  [VideoGenre.CAREER_SOCIAL_DARKSIDE]: getSatiricalLifeGuideline("UNWRITTEN-RULES FIELD GUIDE: Contrast official promises with actual incentives, euphemisms, gatekeepers and power asymmetry. A single protagonist is optional; preserve worker dignity and target the structures holding power."),
  [VideoGenre.DOWNFALL_CONSEQUENCE]: getSatiricalLifeGuideline("DOMINO CAUSALITY: Show how each convenient compromise changes the next available choice. Use a mutating rationalization as callback and keep consequences proportionate, causal and free of moral retribution."),
  [VideoGenre.DARK_COMEDY_TRAGEDY]: getSatiricalLifeGuideline("LAUGHTER WITH A COST: Start from recognizable absurdity, reduce joke density as the human cost becomes clear, and end by changing the meaning of an earlier joke. Never make suffering itself the punchline."),
  [VideoGenre.STORY_DRIVEN_VIDEO_ESSAY]: STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE,
  [VideoGenre.NARRATIVE_EXPLAINER]: STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE,
  [VideoGenre.CHARACTER_PSYCHOLOGY]: `${STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE}\n- Primary sub-genre focus: Character psychology and hidden motivations breakdown.`,
  [VideoGenre.LORE_WORLD_BUILDING]: `${STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE}\n- Primary sub-genre focus: Deep lore, world building rules, and contextual origins breakdown.`,
  Storytelling: STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE,
  Explanation: STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE,
  History: "History Genre: Emphasize historical accuracy, timelines, historical figures, and cause-effect analysis. Maintain an epic, majestic, and deep narrative tone.",
  Documentary: "Documentary Genre: Authentic and objective yet engaging. Combine realistic narration with actual source materials and expert analysis.",
  Review: "Review Genre: Analyze pros and cons fairly, provide real-world experiences, present clear comparative arguments, and deliver convincing conclusions.",
  Education: "Education Genre: Clear, pedagogical but engaging, encouraging critical thinking, and presenting knowledge scientifically with high instructional value.",
  News: "News Genre: Fast-paced, up-to-date, direct, and objective. Deliver core information in the first few seconds and analyze broader impacts.",
  "Top List": "Top List Genre: Clear ordered structure, highly comparative, building curiosity towards top positions, and convincingly explaining the rankings.",
  "True Crime": "True Crime Genre: Create a dark, suspenseful, and thrilling atmosphere. Focus on case details, clues, investigation processes, and criminal psychology.",
  Science: "Science Genre: Use precise scientific terminology, empirical evidence, and strict logic while remaining fascinating and inspiring curiosity about the universe, tech, or nature.",
  Psychology: "Psychology Genre: Delve into human behavior, cognitive mechanisms, and real-life psychological effects. Analyze causes through a scientific lens with relatable examples.",
  Philosophy: "Philosophy Genre: Contemplative, profound, and highly reflective. Provoke existential questions, analyze great thinkers, and connect to real-life applications.",
};
export const EN_STYLE_GUIDELINES: Record<string, string> = {
  Professional: "Professional Style: Standard, formal, using official terminology, tight sentence structures, objective and reliable.",
  Documentary: "Authentic Documentary Style: Narrative-rich, deep, slow-paced, captivating through real details and profound reasoning.",
  Viral: "Viral/Trendy Style: Extremely catchy phrasing, fast-paced, using rhetorical questions to spark curiosity, relatable to youth, and highly interactive.",
  Mystery: "Mystery/Suspense Style: Intriguing and mysterious tone, creating high curiosity, often ending scenes with cliffhangers or surprising revelations.",
  Drama: "Dramatic Style: Focus on intense emotional conflicts, rapid pacing, pushing events to extreme climaxes.",
  Educational: "Educational Style: Mild tone, accessible, detailed guidance, encouraging learning with clear step-by-step explanations.",
  Scientific: "Scientific Style: Empirical, realistic, strictly accurate with data, using logical theories to explain phenomena convincingly.",
};
export const EN_AUDIENCE_GUIDELINES: Record<string, string> = {
  Kids: "Kids Audience: Use simple, pure vocabulary, short sentences, cheerful and friendly tone. Avoid violence, horror, or overly deep philosophy.",
  Teenagers: "Teenagers Audience: Energetic language, using popular slang and trends, fast-paced, discussing edgy and personality-driven topics.",
  Adults: "Adults Audience: Intellectual, profound, deep thinking, using multidimensional perspectives, critical analysis, and professional vocabulary.",
  Seniors: "Seniors Audience: Calm, respectful, rich in contemplation, using clear and easy-to-follow structures.",
  "General Audience": "General Audience: Balance between engaging and easy to understand, universal language, suitable for all ages and social classes.",
};
export const PROMPT_CONTEXT = {
  VI_IDEA_INPUT: "The user has provided a brief IDEA. Your job is to invent, brainstorm, and write a FULL STORY/SCRIPT completely from scratch based on this idea, strictly following the genre, style guidelines, and target duration. Write the output in 100% natural, expressive Vietnamese with complete diacritics and tones.",
  VI_DRAFT_INPUT: "The user has provided an existing SCRIPT/DRAFT. Your job is to rewrite, vastly expand, and polish it into a highly professional production script. Write the output in 100% natural, expressive Vietnamese with complete diacritics and tones.",
  VI_FACT_CHECK_ON: "Perform strict fact verification and generate analytical fact-checking notes regarding chronological, historical, and numerical accuracy.",
  VI_FACT_CHECK_OFF: "Provide standard approval confirmation.",
  VI_GENRE_DEFAULT: (genre: string) => `Genre ${genre}: Focus on the narrative plot, analyze specific themes, and deliver engaging narration tailored to this genre. Output in 100% natural, expressive Vietnamese with complete diacritics.`,
  VI_STYLE_DEFAULT: (style: string) => `Style ${style}: Apply narrative tone and pacing fitting the nature of the content to be conveyed. Output in 100% natural, expressive Vietnamese with complete diacritics.`,
  VI_AUDIENCE_DEFAULT: (audience: string) => `Audience ${audience}: Calibrate vocabulary, depth, and resonance specifically for the target demographic group. Output in 100% natural, expressive Vietnamese with complete diacritics.`,
  EN_GENRE_DEFAULT: (genre: string) => `Genre ${genre}: Focus on the plot, analyze specific themes, and provide engaging narration suitable for this genre.`,
  EN_STYLE_DEFAULT: (style: string) => `Style ${style}: Suitable for the nature of the content to be conveyed.`,
  EN_AUDIENCE_DEFAULT: (audience: string) => `Audience ${audience}: Balance between engaging and easy to understand, universal language, suitable for the target age group.`,
  VI_COEFFICIENTS: (creativity: any, rewrite: any, similarity: any) => `IMPACT OF CONFIGURATION METRICS (TARGET OUTPUT: NATURAL VIETNAMESE):
1. Creativity Level: ${creativity}/10. 
   - Modulate artistic associative depth. Higher levels (8-10) inject rich metaphors, unique twists, and vivid colloquial imagery. Lower levels (1-4) maintain straightforward, factual clarity. Output in Vietnamese.
2. Rewrite Level: ${rewrite}%.
   - Degree of structural transformation from original draft. At ${rewrite}%, restructure and enrich approximately ${rewrite}% of the core content to produce a cohesive, broadcast-grade script in Vietnamese while preserving the underlying thematic core.
3. Similarity Reduction: ${similarity}/10.
   - At ${similarity}/10, aggressively diversify vocabulary, vary sentence rhythms, and avoid repetitive keyword chaining to achieve fluid, professional spoken Vietnamese.`,
  EN_COEFFICIENTS: (creativity: any, rewrite: any, similarity: any) => `IMPACT OF CONFIGURATION METRICS:
1. Creativity Level: ${creativity}/10.
   - Show corresponding artistic and associative abilities. Higher levels (8-10) use more metaphors, unique, and unexpected expressions. Lower levels (1-4) stick to facts, straightforward, and direct.
2. Rewrite Level: ${rewrite}%.
   - This is the percentage of change from the original plot/idea. At ${rewrite}%, you need to change and restructure about ${rewrite}% of the original content to create a complete, much more professional script, while still keeping the true soul of the plot.
3. Similarity Reduction: ${similarity}/10.
   - At ${similarity}/10, actively diversify vocabulary, avoid repeating sentence structures, and avoid repeating main keywords continuously to create a rich, fluent rhythm.`,
};
