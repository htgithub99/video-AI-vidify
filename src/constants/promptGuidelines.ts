import { VideoGenre } from "./enums";

const SATIRICAL_LIFE_GUIDELINE = `SATIRICAL / SOCIAL DARKSIDE STORYTELLING (SIGNATURE NARRATIVE FORMULA):
- SECOND-PERSON POV ("YOU") MANDATORY: Always center the narrative around "you" to force extreme viewer immersion into the psychological descent, temptations, and collapse ("At 8:00 AM you plug in the camera...", "At 21, you pawned your wife's wedding gold...", "You thought you were smart...").
- PRECISE TIME ANCHORS & CONCRETE NUMBERS:
  + Open scenes and transitions with exact time stamps: "8:00 AM...", "5:15 PM...", "2:25 AM...", "Three days later...", "One week later...", "9:53 PM...".
  + Use hyper-realistic financial numbers and transactions down to the exact amount: "2 tỷ 800 triệu", "30 triệu", "1000 USDT", "gaining $10, losing $20", "40 million cut".
- STACCATO PACING & CYNICAL IRONIC PUNCHLINES:
  + Short, punchy, unembellished sentences with the gritty urgency of an investigative true-crime exposé.
  + Frequently interweave cynical observations:
    * "Enough money to run, but on paper, enough to run straight into prison."
    * "What kills you in the market isn't a loss, it's the moment you believe you're a genius."
    * "You thought you were setting a trap for the wealthy, but the moment you crossed the gate, you had no idea who was trapping whom."
    * "You didn't just send people into the closed room to make money; you started putting your own eyes in there."
- ESCALATING THREAT & FALSE MASTERY LOOP:
  + Desperation/small temptation -> Short-term profit/first quick win -> Illusion of total control/overconfidence -> Raising the stakes/deeper entanglement -> Inescapable trap snapping shut, realizing you're just an expendable pawn.
- VISIBLE PHYSICAL ACTIONS: Describe concrete physical behaviors (holding a button camera, hiding a phone, trembling hands in front of red candlesticks, staring at a red-stamped contract) instead of abstract psychological lectures.
- STRICTLY FORBIDDEN:
  + No generic moralizing or patronizing lectures.
  + Never use cheap "it was all just a dream" twists. Consequences must be irreversible.
  + No disruptive ad insertions that break narrative immersion.
When writing narration, output in natural spoken Vietnamese suitable for professional voice-over.`;

const getSatiricalLifeGuideline = (structure: string): string => `${SATIRICAL_LIFE_GUIDELINE}\n- Primary sub-genre focus: ${structure}`;

export const VI_GENRE_GUIDELINES: Record<string, string> = {
  [VideoGenre.SATIRICAL_LIFE_AUTO]: getSatiricalLifeGuideline("AI automatically chooses the most fitting satirical narrative structure."),
  [VideoGenre.TRANSFORMATION_TIMELINE]: getSatiricalLifeGuideline("Chronological transformation across days, months, or distinct phases; each anchor must trigger an irreversible shift."),
  [VideoGenre.CAREER_SOCIAL_DARKSIDE]: getSatiricalLifeGuideline("Follow the protagonist entering an industry or social circle, uncovering unwritten rules and the cost of adaptation."),
  [VideoGenre.DOWNFALL_CONSEQUENCE]: getSatiricalLifeGuideline("Moral descent and retribution; each small compromise raises the stakes towards catastrophic ruin."),
  [VideoGenre.DARK_COMEDY_TRAGEDY]: getSatiricalLifeGuideline("Dark comedic tragedy; punchlines expose irony without mocking genuine human vulnerability."),
  [VideoGenre.STORY_DRIVEN_VIDEO_ESSAY]: `Story-driven Video Essay: Open inside a concrete moment of tension, consequence, or abnormality and establish an unresolved question within 15 seconds. Follow one central character through a causal chain of emotional need, opportunity, small boundary crossings, short-term rewards, self-justification, deeper dependence, harm, reversal, consequence, and moral reckoning. Show concrete scenes before explaining the mechanism behind them. Introduce a meaningful decision, revelation, complication, power shift, open loop, or payoff every 30–60 seconds. Foreshadow reversals; never stack arbitrary twists. Use an intimate, intelligent conversational voice with varied rhythm and restrained humor, without imitating an identifiable creator. Distinguish sourced true cases from composites, reconstructions, and fiction. End with changed understanding, irreversible consequence, or a recurring visual motif rather than a list of lessons.`,
  [VideoGenre.NARRATIVE_EXPLAINER]: `Narrative Explainer / Video Essay Genre: Turn a complex topic into an evidence-led unfolding story for a general audience. Open with a concrete paradox, consequence, or unresolved question; follow one person, object, process, or question as the narrative spine; and advance through assumption -> reality -> evidence/example -> consequence -> next question. Explain mechanisms with accurate everyday analogies, cite the scope and uncertainty of evidence, and never invent facts or false precision. Escalate the stakes, introduce one fair counterargument or perspective shift around 60-75%, and resolve the opening question with a broader insight.`,
  Storytelling: "Storytelling Genre: Focus on coherent plot, character development, vivid emotional descriptions, rich imagery, and dramatic narrative arcs.",
  History: "History Genre: Emphasize historical accuracy, timelines, historical figures, and cause-effect analysis. Maintain an epic, majestic, and deep narrative tone.",
  Documentary: "Documentary Genre: Authentic and objective yet engaging. Combine realistic narration with actual source materials and expert analysis.",
  Explanation: "Explanation Genre: Explain complex concepts intuitively and comprehensibly using practical examples, vivid analogies, and step-by-step analysis.",
  Review: "Review Genre: Analyze pros and cons fairly, provide real-world experiences, present clear comparative arguments, and deliver convincing conclusions.",
  Education: "Education Genre: Clear, pedagogical but engaging, encouraging critical thinking, and presenting knowledge scientifically with high instructional value.",
  News: "News Genre: Fast-paced, up-to-date, direct, and objective. Deliver core information in the first few seconds and analyze broader impacts.",
  "Top List": "Top List Genre: Clear ordered structure, highly comparative, building curiosity towards top positions, and convincingly explaining the rankings.",
  "True Crime": "True Crime Genre: Create a dark, suspenseful, and thrilling atmosphere. Focus on case details, clues, investigation processes, and criminal psychology.",
  Science: "Science Genre: Use precise scientific terminology, empirical evidence, and strict logic while remaining fascinating and inspiring curiosity about the universe, tech, or nature.",
  Psychology: "Psychology Genre: Delve into human behavior, cognitive mechanisms, and real-life psychological effects. Analyze causes through a scientific lens with relatable examples.",
  Philosophy: "Philosophy Genre: Contemplative, profound, and highly reflective. Provoke existential questions, analyze great thinkers, and connect to real-life applications.",
};

export const VI_STYLE_GUIDELINES: Record<string, string> = {
  Professional: "Professional Style: Standard, formal, using official terminology, tight sentence structures, objective and reliable.",
  Documentary: "Authentic Documentary Style: Narrative-rich, deep, slow-paced, captivating through real details and profound reasoning.",
  Viral: "Viral/Trendy Style: Extremely catchy phrasing, fast-paced, using rhetorical questions to spark curiosity, relatable to youth, and highly interactive.",
  Mystery: "Mystery/Suspense Style: Intriguing and mysterious tone, creating high curiosity, often ending scenes with cliffhangers or surprising revelations.",
  Drama: "Dramatic Style: Focus on intense emotional conflicts, rapid pacing, pushing events to extreme climaxes.",
  Educational: "Educational Style: Mild tone, accessible, detailed guidance, encouraging learning with clear step-by-step explanations.",
  Scientific: "Scientific Style: Empirical, realistic, strictly accurate with data, using logical theories to explain phenomena convincingly.",
};

export const VI_AUDIENCE_GUIDELINES: Record<string, string> = {
  Kids: "Kids Audience: Use simple, pure vocabulary, short sentences, cheerful and friendly tone. Avoid violence, horror, or overly deep philosophy. Target Vietnamese kids.",
  Teenagers: "Teenagers Audience: Energetic language, using popular slang and trends, fast-paced, discussing edgy and personality-driven topics. Target Vietnamese teenagers.",
  Adults: "Adults Audience: Intellectual, profound, deep thinking, using multidimensional perspectives, critical analysis, and professional vocabulary. Target Vietnamese adults.",
  Seniors: "Seniors Audience: Calm, respectful, rich in contemplation, using clear and easy-to-follow structures. Target Vietnamese seniors.",
  "General Audience": "General Audience: Balance between engaging and easy to understand, universal language, suitable for all ages and social classes. Target general Vietnamese audience.",
};

export const EN_GENRE_GUIDELINES: Record<string, string> = {
  [VideoGenre.SATIRICAL_LIFE_AUTO]: SATIRICAL_LIFE_GUIDELINE,
  [VideoGenre.TRANSFORMATION_TIMELINE]: SATIRICAL_LIFE_GUIDELINE,
  [VideoGenre.CAREER_SOCIAL_DARKSIDE]: SATIRICAL_LIFE_GUIDELINE,
  [VideoGenre.DOWNFALL_CONSEQUENCE]: SATIRICAL_LIFE_GUIDELINE,
  [VideoGenre.DARK_COMEDY_TRAGEDY]: SATIRICAL_LIFE_GUIDELINE,
  [VideoGenre.STORY_DRIVEN_VIDEO_ESSAY]: `Story-driven Video Essay: Open inside a concrete moment of tension, consequence, or abnormality and establish an unresolved question within 15 seconds. Follow one central character through a causal chain of emotional need, opportunity, small boundary crossings, short-term rewards, self-justification, deeper dependence, harm, reversal, consequence, and moral reckoning. Show concrete scenes before explaining the mechanism behind them. Introduce a meaningful decision, revelation, complication, power shift, open loop, or payoff every 30–60 seconds. Foreshadow reversals; never stack arbitrary twists. Use an intimate, intelligent conversational voice with varied rhythm and restrained humor, without imitating an identifiable creator. Distinguish sourced true cases from composites, reconstructions, and fiction. End with changed understanding, irreversible consequence, or a recurring visual motif rather than a list of lessons.`,
  [VideoGenre.NARRATIVE_EXPLAINER]: `Narrative Explainer / Video Essay Genre: Turn a complex topic into an evidence-led unfolding story for a general audience. Open with a concrete paradox, consequence, or unresolved question; follow one person, object, process, or question as the narrative spine; and advance through assumption -> reality -> evidence/example -> consequence -> next question. Explain mechanisms with accurate everyday analogies, cite the scope and uncertainty of evidence, and never invent facts or false precision. Escalate the stakes, introduce one fair counterargument or perspective shift around 60-75%, and resolve the opening question with a broader insight. Use an intelligent conversational voice with controlled humor, varied rhythm, and no imitation of an identifiable creator. Avoid list-like exposition, excessive filler, stacked shock twists, and unsupported claims.`,
  Storytelling: "Storytelling Genre: Focus on coherent plot, character development, vivid emotional descriptions, rich imagery, and dramatic narrative arcs.",
  History: "History Genre: Emphasize historical accuracy, timelines, historical figures, and cause-effect analysis. Maintain an epic, majestic, and deep narrative tone.",
  Documentary: "Documentary Genre: Authentic and objective yet engaging. Combine realistic narration with actual source materials and expert analysis.",
  Explanation: "Explanation Genre: Explain complex concepts intuitively and comprehensibly using practical examples, vivid analogies, and step-by-step analysis.",
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
  VI_IDEA_INPUT: "The user has provided a brief IDEA. Your job is to invent, brainstorm, and write a FULL STORY/SCRIPT completely from scratch based on this idea, strictly following the genre and target duration.",
  VI_DRAFT_INPUT: "The user has provided an existing SCRIPT/DRAFT. Your job is to rewrite, vastly expand, and polish it into a highly professional production script.",
  VI_FACT_CHECK_ON: "Perform a strict information verification and write analytical fact-checking notes regarding information accuracy.",
  VI_FACT_CHECK_OFF: "Write a simple success approval sentence.",
  VI_GENRE_DEFAULT: (genre: string) => `Genre ${genre}: Focus on the plot, analyze specific themes, and provide engaging narration suitable for this genre. Output in Vietnamese.`,
  VI_STYLE_DEFAULT: (style: string) => `Style ${style}: Suitable for the nature of the content to be conveyed. Output in Vietnamese.`,
  VI_AUDIENCE_DEFAULT: (audience: string) => `Audience ${audience}: Balance between engaging and easy to understand, universal language, suitable for the target age group. Output in Vietnamese.`,
  EN_GENRE_DEFAULT: (genre: string) => `Genre ${genre}: Focus on the plot, analyze specific themes, and provide engaging narration suitable for this genre.`,
  EN_STYLE_DEFAULT: (style: string) => `Style ${style}: Suitable for the nature of the content to be conveyed.`,
  EN_AUDIENCE_DEFAULT: (audience: string) => `Audience ${audience}: Balance between engaging and easy to understand, universal language, suitable for the target age group.`,
  VI_COEFFICIENTS: (creativity: any, rewrite: any, similarity: any) => `IMPACT OF OTHER CONFIGURATION METRICS:
1. Creativity Level: ${creativity}/10. 
   - Show corresponding artistic and associative abilities. Higher levels (8-10) use more metaphors, unique, and unexpected expressions. Lower levels (1-4) stick to facts, straightforward, and direct. Write the output in Vietnamese.
2. Rewrite Level: ${rewrite}%.
   - This is the percentage of change from the original plot/idea. At ${rewrite}%, you need to change and restructure about ${rewrite}% of the original content to create a complete, much more professional script in Vietnamese, while still keeping the true soul of the plot.
3. Similarity Reduction: ${similarity}/10.
   - At ${similarity}/10, actively diversify vocabulary, avoid repeating sentence structures, and avoid repeating main keywords continuously to create a rich, fluent rhythm. Write the output in Vietnamese.`,
  EN_COEFFICIENTS: (creativity: any, rewrite: any, similarity: any) => `IMPACT OF OTHER CONFIGURATION METRICS:
1. Creativity Level: ${creativity}/10.
   - Show corresponding artistic and associative abilities. Higher levels (8-10) use more metaphors, unique, and unexpected expressions. Lower levels (1-4) stick to facts, straightforward, and direct.
2. Rewrite Level: ${rewrite}%.
   - This is the percentage of change from the original plot/idea. At ${rewrite}%, you need to change and restructure about ${rewrite}% of the original content to create a complete, much more professional script, while still keeping the true soul of the plot.
3. Similarity Reduction: ${similarity}/10.
   - At ${similarity}/10, actively diversify vocabulary, avoid repeating sentence structures, and avoid repeating main keywords continuously to create a rich, fluent rhythm.`,
};
