import _ from "lodash";

export type RetentionFormat = "short" | "compact" | "standard" | "longform";

export const resolveRetentionFormat = (durationSeconds: unknown): RetentionFormat => {
  const duration = _.toNumber(durationSeconds);
  if (!_.isFinite(duration) || duration <= 0) return "compact";
  if (duration <= 60) return "short";
  if (duration <= 300) return "compact";
  if (duration <= 900) return "standard";
  return "longform";
};

const FORMAT_CADENCE: Record<RetentionFormat, string> = {
  short: `SHORT-FORM CADENCE (up to 60 seconds): begin delivering the title/thumbnail promise in the first 1-3 seconds. Establish context through action, not a preamble. Add a meaningful new fact, consequence, reveal, decision or visual proof roughly every 5-10 seconds. Use one clean escalation and reach the payoff before the final seconds; do not save all value for an outro.`,
  compact: `COMPACT VIDEO CADENCE (1-5 minutes): begin delivering the promise in the first 5-10 seconds. Establish the human situation and stakes quickly. Create a meaningful information or emotional turn roughly every 15-30 seconds, place strong evidence or a consequential reveal in the first half, and reserve enough time to explain and resolve the opening promise.`,
  standard: `STANDARD VIDEO CADENCE (5-15 minutes): prove relevance in the first 10-15 seconds, orient the viewer without a long preamble, and organize the story into escalating sections. Each section must contain evidence, a causal turn or a changed character state. Re-engage at section boundaries through a specific unresolved consequence, not generic teasing, and deliver substantial value before the midpoint.`,
  longform: `LONG-FORM CADENCE (over 15 minutes): open with a representative event, contradiction or piece of evidence that demonstrates the central promise. Use chapters with distinct questions and payoffs, alternate intensity with purposeful breathing room, and periodically re-anchor the viewer in the central question. Every chapter must change the viewer's understanding and pay off at least one setup before opening another.`,
};

export const createViewerRetentionDirective = (durationSeconds: unknown, genre = "Storytelling"): string => {
  const format = resolveRetentionFormat(durationSeconds);
  return `[VIEWER RETENTION & PROMISE CONTRACT - ${format.toUpperCase()} / ${genre || "Storytelling"}]
${FORMAT_CADENCE[format]}
- Define one concrete viewer promise that the title, thumbnail concept, opening, body and ending can all honestly support. Curiosity may delay an answer, but the opening must immediately begin earning it.
- Every beat or scene must do at least one new job: introduce actionable context, show evidence, change a relationship or character state, reveal a mechanism, force a decision, escalate a consequence, reverse an assumption, or pay off an earlier setup. Rephrasing known information is not progress.
- Never allow more than two consecutive abstract explanation beats. Ground explanation in a person, object, place, demonstration, archival source, comparison or observable consequence that can be shown on screen.
- Put the strongest supported evidence, surprise or useful insight as early as comprehension allows. Do not manufacture secrets, danger, statistics, urgency or cliffhangers merely to create retention.
- Pattern interrupts must be motivated by meaning: a new scale, location, source, timeline, perspective, sound cue, shot size or visual proof. Random motion, constant cuts, repeated zooms, loud impacts and decorative effects do not count.
- Use open loops sparingly and specifically. State what remains unresolved; close each loop with a recognizable answer or changed meaning before the video ends.
- The ending must resolve the central question, deliver the promised value and make the opening feel necessary. Avoid a generic moral, recap or call-to-action replacing the payoff.
- Preserve genre truth: comedy earns turns through observation, history/documentary through sourced evidence and causality, education through demonstration and clarity, review through criteria and comparison, and narrative through choices and consequences.
- Optimize for viewer satisfaction as well as watch time. Never copy a creator's signature wording, jokes, branding or exact format, and never make the result feel mass-produced or interchangeable.`;
};

export const createStoryboardRetentionDirective = (durationSeconds: unknown, genre = "Storytelling"): string => `${createViewerRetentionDirective(durationSeconds, genre)}
[STORYBOARD APPLICATION]
- Assign each scene one explicit retention job grounded in its exact narration. Its visible action and story evidence must make that job understandable without inventing facts.
- Adjacent scenes must differ in information, focal action or editorial perspective. A camera-angle change alone cannot disguise repeated content.
- Plan visual proof for the promise and payoff, not only atmosphere. Keep screen geography and recurring identity consistent while varying shot size, evidence type and composition when narratively justified.
- Treat music, ambience, silence and sound effects as story punctuation: support a reveal, physical action, location or emotional turn; never use repetitive impacts or synthetic beeps as automatic stimulation.`;
