import { VideoGenre } from "./enums";

const SATIRICAL_LIFE_GUIDELINE = `SATIRICAL / SOCIAL DARKSIDE STORYTELLING (SIGNATURE VIRAL NARRATIVE FORMULA):
- SECOND-PERSON POV ("BẠN" / "YOU") MANDATORY: Always address the viewer directly as "Bạn" (You) throughout the entire story. Put the viewer directly into the shoes of the protagonist, exposing their inner greed, naive justifications, psychological descent, and inevitable downfall ("Bạn trượt ra khỏi bụng mẹ...", "Bạn ngồi trong căn phòng ngột ngạt...", "Bạn nghĩ mình khôn ngoan nhưng thực ra bạn chỉ là món gọi thêm...").
- THE "LOW-STEP TRAP" FORMULA (BẪY BẬC THỀM THẤP):
  + The trap NEVER begins with an obvious cliff or crime. It always starts with a gentle, seemingly harmless lower step ("chỉ ngồi nói chuyện rót nước", "chỉ dự tiệc kín", "chỉ bật livestream tâm sự", "em cứ ở đây anh khác lo").
  + The protagonist always rationalizes their moral compromises: "Mình có làm gì bẩn thỉu đâu, mình chỉ ngồi một lúc", "Tội lỗi thì khó nuốt nhưng nếu được bọc bằng tiền người ta vẫn sẽ cố nuốt cho trôi", "Chỉ cần kiếm đủ một con số rồi biến mất".
- PRECISE TIME ANCHORS & REALISTIC CHRONOLOGICAL FLOW:
  + Open scenes and transitions with realistic, gritty time anchors: "8:00 sáng...", "9:53 sáng, hai ngày sau khi trở về...", "7:40 tối...", "Gần 2:00 sáng...", "Đến ngày thứ bảy...", "Một tuần trước ngày cưới...".
  + TEMPORAL REALISM: Realistic progression across days, weeks, months, or years without illogical jumps.
- ARITHMETICAL & FINANCIAL CONTINUITY:
  + Use exact, cold financial figures: "3 triệu", "20 triệu", "40 triệu", "130 triệu một đêm", "2 tỷ 700 triệu", "100 đô", "món nợ 9 chữ số".
  + Track money with mathematical precision (gross earnings, agent cuts, bribes, scams, lost balance).
- GRITTY VIETNAMESE SATIRE DICTION & CYNICAL METAPHORS:
  + Use sharp, biting, unembellished Vietnamese street-smart diction, dark humor, and vivid real-life metaphors:
    * "Tấm chiếu mới", "bộ não dính đờm", "nội tạng biểu tình", "tiền chưa kịp ấm đít".
    * "Ảnh trên mạng như thần tiên tỷ tỷ, mở cam thường lại biến thành tiểu yêu quái ở núi Yên Lãng".
    * "Hai người nổ ra cuộc cãi vã căng thẳng, bạn cãi còn hắn thì vã".
    * "Đừng để bọn này phải dùng đến kiến thức vật lý".
    * "Cái bẫy lừa người ta bằng dục vọng và trói họ lại bằng sự xấu hổ".
    * "Thời gian trôi qua như chó chạy ngoài đồng".
    * "Người có tên tuổi thì không thiếu, thứ thiếu là người vừa chịu đi vừa chưa bị đám khách này dùng qua".
    * "Có tiền chỉ giúp bạn mua vé để chạy, nó không xóa được tên bạn khỏi những tờ giấy bạn đã ký".
    * "Bạn nghĩ mình đưa camera vào để nắm thóp người giàu, nhưng không biết nó là nhát dao đâm ngược lại chính bạn".
- ESCALATING STAKES & INESCAPABLE COLLAPSE:
  + Vulnerability/Naivety -> Low-step bait & First quick money -> Illusion of mastery/False freedom -> Deeper complicity & Raising stakes -> Sudden reality check / Police raid / Irreversible betrayal -> Cold realization & Moral emptiness.
- STRICTLY FORBIDDEN:
  + No generic fairy-tale endings or preachiness.
  + No "it was just a dream" cop-outs. The consequences (prison, broken family, public shame, being a disposable pawn) must be irreversible.
  + Narrative MUST feel realistic, dark, satirical, and intellectually punchy from start to finish.`;

const getSatiricalLifeGuideline = (structure: string): string => `${SATIRICAL_LIFE_GUIDELINE}\n- Primary sub-genre focus: ${structure}`;

const STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE = `STORY-DRIVEN VIDEO ESSAY & NARRATIVE EXPLAINER (SIGNATURE WITTY STORYTELLER FORMULA):
- ENGAGING WITTY HOST PERSONA (GIỌNG DẪN TRUYỆN THÔNG THÁI, HÓM HỈNH, DÂN DÃ):
  + Conversational, witty, intelligent, and humorous tone. Talk naturally with the audience like a smart, humorous friend explaining a fascinating book, movie, historical event, or concept ("Chào mừng các bạn đã quay trở lại...", "Tôi với các bạn có thể thắc mắc...", "Anh em xem chắc cũng nhận ra...", "Đến đây thì dù ghét nhưng cũng phải thừa nhận là...", "Quay trở lại với mạch truyện chính...").
- ORIGIN, CONTEXT & BACKGROUND HOOKS:
  + Open with an intriguing hook or scene, then seamlessly provide rich contextual backstory (author facts, historical era, original draft names, underlying social dynamics) to enrich the narrative before diving into the core plot.
- MODERN METAPHORS & CLEVER STREET-SMART ANALOGIES (ẨN DỤ SO SÁNH ĐỜI THỰC ĐẮT GIÁ):
  + Ingeniously translate classic, historical, or fantastical concepts into sharp, humorous modern analogies and pop-culture/gaming/social-media terms:
    * "Winner của làng", "out meta", "flex chiến tích", "tẩy trắng", "đăng xuất khỏi server", "bùng kèo", "mắ ping", "chơi bài ngửa", "nước đi khá khôn".
    * "Crow Control - CC (giải tán đám đông)", "combo chiêu thức", "nội tại", "thằng top 1 thì nhót rồi".
    * "Vincom của thế giới phù thủy", "thay vì bắt Grab thì dùng bột dịch chuyển", "chatGPT lên AP", "trái ác quỷ".
    * "Canh điền là từ hoa mỹ cho việc đi cày ruộng".
- DEEP PSYCHOLOGICAL & CAUSAL ANALYSIS (BÓC TÁCH TÂM LÝ & GIẢI THÍCH CƠ CHẾ SÂU SẮC):
  + Do NOT merely summarize events. ALWAYS dissect the hidden motivations, power plays, and psychology behind each action: Why did the villain act so softly? What dual purpose did this move achieve? What unwritten societal rule was at work?
- DYNAMIC PACING, SUBTLE SATIRE & AUDIENCE CONNECTION:
  + Balance rich academic insights with lively storytelling banter, vivid character quotes, and insightful philosophical punchlines.
  + Natural chapter transitions ("Chương 1...", "Ba ngày sau sự kiện chấn động đó...", "Nhưng đời không cho ai tất cả...").
  + Wrap up with an intellectual reflection and conversational CTA ("Các bạn thấy sao về câu chuyện này? Hãy để lại cảm nghĩ bên dưới...").`;

export const VI_GENRE_GUIDELINES: Record<string, string> = {
  [VideoGenre.SATIRICAL_LIFE_AUTO]: getSatiricalLifeGuideline("Automatically orchestrate the optimal satirical narrative formula: Shocking/Grounded Opening ('Bạn...') -> Low-step insidious trap -> Psychological descent & moral rationalizations -> False sense of mastery -> Abrupt reality check & irreversible downfall."),
  [VideoGenre.TRANSFORMATION_TIMELINE]: getSatiricalLifeGuideline("Chronological transformation across days, months, or years; each timestamp triggers an irreversible moral or psychological shift."),
  [VideoGenre.CAREER_SOCIAL_DARKSIDE]: getSatiricalLifeGuideline("Exposing unwritten rules and dark realities of specific industries or underground rings (Pimping, Red-light districts, Live streamers, Shady real-estate, Fake KOLs, Dark finance). Dissect how human dignity is commodified into disposable pawns."),
  [VideoGenre.DOWNFALL_CONSEQUENCE]: getSatiricalLifeGuideline("Downfall and retribution: Small initial ethical compromises inevitably escalate into an inescapable trap and severe life-altering consequences."),
  [VideoGenre.DARK_COMEDY_TRAGEDY]: getSatiricalLifeGuideline("Dark comedy and tragedy: Utilize razor-sharp irony, cynical real-life metaphors, and biting dialogue to expose human greed and social absurdity."),
  [VideoGenre.STORY_DRIVEN_VIDEO_ESSAY]: STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE,
  [VideoGenre.NARRATIVE_EXPLAINER]: STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE,
  [VideoGenre.CHARACTER_PSYCHOLOGY]: `${STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE}\n- Primary sub-genre focus: In-depth character psychology, hidden motivations, power calculations, and moral dilemmas illustrated through vivid real-life scenes.`,
  [VideoGenre.LORE_WORLD_BUILDING]: `${STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE}\n- Primary sub-genre focus: World breakdown, underlying magical/technological rules, historical context, subtle foreshadowing (lore), and deep causal origin of events.`,
  Storytelling: STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE,
  Explanation: STORY_EXPLAINER_VIDEO_ESSAY_GUIDELINE,
  History: "History Genre: Emphasize historical accuracy, realistic chronologies, key historical figures, geopolitical conflicts, and deep cause-effect analysis. Maintain an epic, immersive, and profound narrative tone.",
  Documentary: "Documentary Genre: Authentic, investigative, and objective yet highly engaging. Combine realistic storytelling with concrete evidence, source context, and insightful analysis.",
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
  [VideoGenre.SATIRICAL_LIFE_AUTO]: SATIRICAL_LIFE_GUIDELINE,
  [VideoGenre.TRANSFORMATION_TIMELINE]: SATIRICAL_LIFE_GUIDELINE,
  [VideoGenre.CAREER_SOCIAL_DARKSIDE]: SATIRICAL_LIFE_GUIDELINE,
  [VideoGenre.DOWNFALL_CONSEQUENCE]: SATIRICAL_LIFE_GUIDELINE,
  [VideoGenre.DARK_COMEDY_TRAGEDY]: SATIRICAL_LIFE_GUIDELINE,
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
