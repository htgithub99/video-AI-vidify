import { VideoGenre } from "./enums";

export const VI_GENRE_GUIDELINES: Record<string, string> = {
  [VideoGenre.NARRATIVE_EXPLAINER]: `Narrative Explainer / Video Essay Genre: Write an evidence-led explanatory video as an unfolding story for a general Vietnamese audience.
- Open with a concrete everyday situation, surprising consequence, paradox, or unresolved question. Do not begin with a dictionary definition, generic greeting, or broad history lesson.
- Choose one clear narrative spine and preserve it throughout: follow a person, object, transaction, question, or process from cause to consequence. Do not write a disconnected list of facts.
- Progress through repeated discovery beats: what people commonly assume -> what actually happens -> evidence or a concrete example -> why it matters -> the next unanswered question. Use transitions such as "nhưng đó mới chỉ là một nửa câu chuyện" naturally and sparingly.
- Explain difficult mechanisms in plain spoken Vietnamese with accurate, memorable everyday analogies. An analogy must clarify the mechanism, not replace the factual explanation.
- Use evidence responsibly: combine a human-scale example, a relevant statistic, and an intuitive comparison. State the source or attribution, scope, timeframe, uncertainty, and distinguish estimates from measured facts. Never invent studies, quotations, people, events, or numbers. If reliable evidence is unavailable, stay qualitative and avoid fabricated precision.
- Escalate stakes or scale in every major section. Around 60-75% of the script, introduce one fair counterargument or perspective shift that complicates the initial assumption; do not stack arbitrary shock twists.
- Narrate conversationally as an intelligent, curious peer: natural Vietnamese, controlled humor, light irony, rhetorical questions, varied sentence rhythm, and occasional first-person observations. Avoid excessive filler words, forced slang, repetitive jokes, melodrama, lecturing, and imitating any identifiable creator's catchphrases.
- End by resolving the opening question and extracting one larger human, economic, technological, or social insight. Do not merely summarize the preceding sections.
- Keep sponsorship or product examples clearly separated and brief; never let them substitute for proof of the central thesis.
Output only original Vietnamese narration suitable for voice-over.`,
  Storytelling: "Storytelling Genre: Focus on coherent plot, character development, vivid emotional descriptions, rich imagery, and dramatic narrative arcs. Output the narration text entirely in Vietnamese.",
  History: "History Genre: Emphasize historical accuracy, timelines, historical figures, and cause-effect analysis. Maintain an epic, majestic, and deep narrative tone. Output the narration text entirely in Vietnamese.",
  Documentary: "Documentary Genre: Authentic and objective yet engaging. Combine realistic narration with actual source materials and expert analysis. Output the narration text entirely in Vietnamese.",
  Explanation: "Explanation Genre: Explain complex concepts intuitively and comprehensibly using practical examples, vivid analogies, and step-by-step analysis. Output the narration text entirely in Vietnamese.",
  Review: "Review Genre: Analyze pros and cons fairly, provide real-world experiences, present clear comparative arguments, and deliver convincing conclusions. Output the narration text entirely in Vietnamese.",
  Education: "Education Genre: Clear, pedagogical but engaging, encouraging critical thinking, and presenting knowledge scientifically with high instructional value. Output the narration text entirely in Vietnamese.",
  News: "News Genre: Fast-paced, up-to-date, direct, and objective. Deliver core information in the first few seconds and analyze broader impacts. Output the narration text entirely in Vietnamese.",
  "Top List": "Top List Genre: Clear ordered structure, highly comparative, building curiosity towards top positions, and convincingly explaining the rankings. Output the narration text entirely in Vietnamese.",
  "True Crime": "True Crime Genre: Create a dark, suspenseful, and thrilling atmosphere. Focus on case details, clues, investigation processes, and criminal psychology. Output the narration text entirely in Vietnamese.",
  Science: "Science Genre: Use precise scientific terminology, empirical evidence, and strict logic while remaining fascinating and inspiring curiosity about the universe, tech, or nature. Output the narration text entirely in Vietnamese.",
  Psychology: "Psychology Genre: Delve into human behavior, cognitive mechanisms, and real-life psychological effects. Analyze causes through a scientific lens with relatable examples. Output the narration text entirely in Vietnamese.",
  Philosophy: "Philosophy Genre: Contemplative, profound, and highly reflective. Provoke existential questions, analyze great thinkers, and connect to real-life applications. Output the narration text entirely in Vietnamese.",
};

export const VI_STYLE_GUIDELINES: Record<string, string> = {
  Professional: "Professional Style: Standard, formal, using official terminology, tight sentence structures, objective and reliable. Write the content in Vietnamese.",
  Documentary: "Authentic Documentary Style: Narrative-rich, deep, slow-paced, captivating through real details and profound reasoning. Write the content in Vietnamese.",
  Viral: "Viral/Trendy Style: Extremely catchy phrasing, fast-paced, using rhetorical questions to spark curiosity, relatable to youth, and highly interactive. Write the content in Vietnamese.",
  Mystery: "Mystery/Suspense Style: Intriguing and mysterious tone, creating high curiosity, often ending scenes with cliffhangers or surprising revelations. Write the content in Vietnamese.",
  Drama: "Dramatic Style: Focus on intense emotional conflicts, rapid pacing, pushing events to extreme climaxes. Write the content in Vietnamese.",
  Educational: "Educational Style: Mild tone, accessible, detailed guidance, encouraging learning with clear step-by-step explanations. Write the content in Vietnamese.",
  Scientific: "Scientific Style: Empirical, realistic, strictly accurate with data, using logical theories to explain phenomena convincingly. Write the content in Vietnamese.",
};

export const VI_AUDIENCE_GUIDELINES: Record<string, string> = {
  Kids: "Kids Audience: Use simple, pure vocabulary, short sentences, cheerful and friendly tone. Avoid violence, horror, or overly deep philosophy. Target Vietnamese kids.",
  Teenagers: "Teenagers Audience: Energetic language, using popular slang and trends, fast-paced, discussing edgy and personality-driven topics. Target Vietnamese teenagers.",
  Adults: "Adults Audience: Intellectual, profound, deep thinking, using multidimensional perspectives, critical analysis, and professional vocabulary. Target Vietnamese adults.",
  Seniors: "Seniors Audience: Calm, respectful, rich in contemplation, using clear and easy-to-follow structures. Target Vietnamese seniors.",
  "General Audience": "General Audience: Balance between engaging and easy to understand, universal language, suitable for all ages and social classes. Target general Vietnamese audience.",
};

export const EN_GENRE_GUIDELINES: Record<string, string> = {
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
