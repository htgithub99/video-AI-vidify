export interface MotionGenreCraft {
  voice: string;
  plain?: string;
  retention: string;
  plan: string;
  depth: string;
  fill: string;
  edit: string;
}
export interface MotionGenreCraftMarkers {
  viewer: RegExp;
  first: RegExp;
  hearsay: RegExp;
  omniscient: RegExp;
  collective: RegExp;
  number: RegExp;
  watching: RegExp;
  cause: RegExp;
  question: RegExp;
  sense: RegExp;
  hindsight: RegExp;
  verdict: RegExp;
  sentence: RegExp;
}
const LIVED_MODES =
  "In this genre sensory perspective, bodily reactions and plain composite bystanders are the genre itself and stay allowed in every storytelling mode; 'stick to the source' then means no invented events, outcomes, numbers, or words and acts of real named people.";
export const MOTION_GENRE_CRAFT: Record<string, MotionGenreCraft> = {
  pov: {
    voice:
      "GENRE VOICE (POV — you live it, you are not told about it): second person, present tense ('you' / 'bạn'). The viewer is one ordinary person inside the event at one source-supported vantage (a role, unit or place) for the whole video. OPEN on you in one ordinary, concrete moment at that vantage (what your hands are doing, one sensory detail, one small worry or plan) before the danger reaches you; no historical summary first. Background arrives as ENCOUNTERS, not reports: a person, object or sight reaches you and does something to you (a refugee grabs your sleeve and shows a burned hand, a messenger's horse collapses at the gate, a sergeant shoves a weapon into your arms). 'You hear', 'you see', 'you watch', 'news reaches you' and 'word comes' appear in at most one beat in five; never use the same delivery twice in a row; prefer a person who arrives and does something over 'news reaches'. Build the script from lived loops: PERCEPTION (what hits your senses right now: a sound, a smell, a weight, a blow) → REACTION (your body: you flinch, freeze, your hands shake) → ACTION (what you do: duck, load, drag, run, choose) → CONSEQUENCE (what it costs or changes for you: a wound, a fallen comrade, lost ground, a narrow escape) → NEXT DANGER that forces the next choice. Not every beat holds all five, but every three or four beats complete one loop. The subject of most sentences is you, your body, your hands, or the thing coming at you; an army, a king or a battle line is a subject only while it is physically in front of you ('the knight beside you lowers his lance', never 'the Hungarian line meets the assault'). You know only what you see, hear, are ordered or are told at that moment: commanders' secret plans, movements out of sight, motives and totals reach you as a shouted order, a messenger, a rumour, smoke on the horizon or one later realisation, never as narration. Numbers are what someone says or what you count; no closing statistics. Ordinary comrades around you may be unnamed or plainly named composites with short quoted lines (a sergeant's order, a wounded man begging you not to leave) so the stakes are personal; you go only where the source puts your force, and distant places reach you as news; when the cast includes comrades, each one appears in every chapter with a short quoted line or a concrete act, and one small thread between you (a promise, a borrowed object, a joke) returns before the end; real named leaders appear only when they are physically near you; never invent historical events or outcomes, and never give real named people invented words or acts. Pace: three to five set-piece moments told almost in real time in very short sentences; between them compress time through the body ('You sleep in your boots. Before dawn, horns.'). Prefer 'riders burst out of the dust right in front of you' over 'you see the enemy approach'; 'you shove, trip and crawl' over 'the army flees'; 'a whistle, you dive behind a wagon, splinters rain on you' over 'the catapults open fire'. End each chapter on a new danger or a choice you must make; the next chapter shows what you did. The ending stays in your present: what you see, carry and have lost, not what historians later counted. SELF-CHECK before returning: read each beat without the word 'you'; if it still works as a history narrator's line (who ruled, who claimed, who landed, how many died), rewrite it as something reaching you right now, or fold its fact into an order, a rumour or a sight in front of you. " +
      LIVED_MODES,
    plain:
      "STORYTELLING MODE (PLAIN — faithful lived account): never contradict the source and add no invented events, outcomes or outside background; keep the source's order. Events far from your vantage are compressed into one line of what people shout or say; spend the words on the moments you live, through your senses, body and actions, which this genre requires.",
    retention:
      "GENRE PRIORITY (POV): where the retention craft conflicts with this voice, the voice wins. A 'hook', 'paradox' or 'open question' is something you face in the moment (a sound you cannot place, an order that makes no sense, a gap in the enemy ring that might be bait), never an analyst's insight; the source order is the order you live it; 'specific numbers' are only what you are told or count.",
    plan:
      "PLAN (POV): state the vantage in videoDna.narrative.voice. Places include every location the protagonist physically passes through (home, camp, road, battlefield). Cast includes the protagonist (narration name 'You' / 'Bạn') with a clear look, plus one or two named composite comrades (plain everyday names) whose small thread with you (a promise, a borrowed object, a joke) starts early and whose fate is shown in the final chapter. Chapter titles, summaries and keyPoints are written as what happens to you at the vantage ('Stones smash the wagons around you; you dive for cover'); every keyPoint pairs one source event with what you sense or do; a source event the vantage cannot witness is planned as arriving through an order, a messenger, a rumour or a sight in the distance. Choose three to five set-piece moments to live almost in real time and make each chapter end on a danger or a choice.",
    depth:
      "deepen through what you physically do, carry and endure at that moment and what someone near you says about how it works (an order, a veteran's warning); never switch to an outside explanation",
    fill: "add new lived moments inside the source's events, each one a new thing happening to you: an encounter with a comrade or a civilian, a fresh small danger, a choice you must make, a cost to your body or your friends, an order or rumour that changes your plan; keep every beat short and urgent so the pace rises, never slow down or describe the same moment longer",
    edit:
      "POV CHECK: rewrite any beat where the subject is an army, a commander or 'the battle' that is not physically in front of you; turn any secret plan, out-of-sight movement or statistic into an order, rumour, messenger or what you count, or cut it; replace watching lines ('you see', 'you watch', 'you hear' that only report) with what happens to you and what you do about it; make sure every few beats complete perception → reaction → action → consequence → next danger; keep the closing in your present, without historians' totals.",
  },
  witness: {
    voice:
      "GENRE VOICE (WITNESS — 'I was there'): first person ('I' / 'tôi'), told in the past by one ordinary eyewitness at one source-supported vantage, the way a survivor tells it at a table years later. Open on one remembered concrete detail of the ordinary moment before it began. Background arrives as remembered encounters (a refugee at the gate, an order shouted down the line), not as recited reports; 'I heard' and 'I saw' open at most one beat in five; 'news reached us' or 'word came' is used at most twice in the whole video, otherwise a person arrives and tells it; 'I learned later' or 'only later' is used at most twice in the whole video. Distant events are compressed into one line of what people said then; the words go to the moments I lived. Build from memory loops: a sense that still haunts me (a sound, a smell, a face) → what I saw and did then → what I felt and feared then → what I only understood later (hindsight, used sparingly) → how it marked me. I know only what I saw, heard then, or learned afterwards, and I say which ('only later did they tell us…'); commanders' plans and totals come as what we were told or what I learned later, with honest uncertainty ('I think it was…'). Talk like a person, not a historian: plain words, short and long sentences, concrete objects, one personal stake I could lose (a friend, a brother, a promise). Comrades may be plainly named composites with short quoted lines; keep strict chronological order; I stay where I was, and events elsewhere reach me only as what I was told; keep each beat to two or three short sentences; never invent historical events or outcomes, and never give real named people invented words or acts; when the cast includes comrades, each appears in every chapter with a short quoted line or a concrete act. End on what the memory still means to me now, not on a summary of history. SELF-CHECK before returning: if a beat would work as a history narrator's line without 'I', rewrite it as what I saw, did, was told or learned later. " +
      LIVED_MODES,
    plain:
      "STORYTELLING MODE (PLAIN — faithful remembered account): never contradict the source and add no invented events, outcomes or outside background; keep the source's order. Events far from the narrator are compressed into one line of what people said then; spend the words on the moments the narrator lived and remembers through the senses, which this genre requires.",
    retention:
      "GENRE PRIORITY (WITNESS): where the retention craft conflicts with this voice, the voice wins. Hooks and open questions are the narrator's own remembered dread or unanswered doubt ('I still don't know why we didn't run'); numbers and background arrive as what I was told or learned later.",
    plan:
      "PLAN (WITNESS): state the witness's vantage, age then, and what they lost or kept in videoDna.narrative.voice. Places include every location the narrator physically passes through. Cast includes the narrator with a clear look. Chapter summaries and keyPoints are written as what I saw, did and felt there; events I could not see are planned as what I was told then or learned later. Cast includes one composite companion or relative with a plain everyday name beside the narrator; plant that personal stake early and show its outcome in the final beats. Keep strict chronological order.",
    depth:
      "deepen through what I remember physically doing, hearing and feeling then, and what I learned about it only later; never switch to a historian's explanation",
    fill: "add new remembered moments around the source's events, each one new: what I did right before and after, a person beside me and what they said, a choice I made or regret, what I only learned later; keep the telling moving forward, never linger on the same moment",
    edit:
      "WITNESS CHECK: every beat stays in the narrator's first person; rewrite detached third-person explanation as what I saw, did, was told or learned later; keep hindsight to a few lines; keep one personal stake alive and paid off; end on the memory's meaning now.",
  },
  chronicle: {
    voice:
      "GENRE VOICE (CHRONICLE — the whole story in N minutes): an energetic third-person narrator tells the source's arc in chronological order with strong time compression. Every beat is a cause or a consequence of the beat before ('but', 'so', 'which forced'), never a bare 'and then'. Each chapter is one era or phase with one defining turning point; inside it, zoom in on one concrete moment (a decision, an order, a battle instant, a person's choice) for two to four vivid beats, then zoom out with a time marker ('Ten years later…'). Dates and places are signposts at turns, not the start of every beat. Introduce each key player once with one identifying trait and aim that the source states or history firmly establishes; never invent motives or adjectives about character. Keep stakes rising toward the decisive turning point and land the real aftermath and why it still matters. Keep one tense (past) throughout. Do not address the viewer as the protagonist. Dates, numbers and quotes come strictly from the source.",
    retention:
      "GENRE PRIORITY (CHRONICLE): fresh angles and open questions must serve the causal chain; never drop chronological order except one declared teaser.",
    plan:
      "PLAN (CHRONICLE): chapters are eras or phases in order; each chapter names its turning point and one zoom-in moment; keyPoints are written as cause → effect links; key players appear once with their aim.",
    depth:
      "deepen by zooming into one concrete moment of the turning point and by showing its cause and its cost",
    fill: "add new, well-established context about the same subject and period: the cause behind a turn, how a weapon, tactic or institution worked, what a key player is known to have wanted, one vivid zoom-in moment, and the consequence that followed; every added beat teaches something new and pushes the chain forward",
    edit:
      "CHRONICLE CHECK: link beats with cause and consequence instead of 'and then'; cut runs of date-led beats that only list events; make sure each chapter has one zoom-in moment and one clear turning point; keep strict time order.",
  },
  verdict: {
    voice:
      "GENRE VOICE (VERDICT — put every answer on trial): an investigator-narrator in third person who talks to the viewer as a fellow judge. State the central question in the first two beats and why it matters, then one plain test criterion. Name two or three source-supported candidates early; every following event is presented as evidence for or against a named candidate (never as plain chronicle), each candidate getting its strongest evidence first, then the counter-evidence that breaks or weakens it. Keep the answer open until the final test, let the strongest-looking candidate face the sharpest objection, then deliver a clear verdict with its reason and what remains uncertain. Speak like a detective at a board ('Let's test it.', 'Here is the problem.'), not a textbook; ask the viewer at most one question per chapter. Facts and quotes come strictly from the source.",
    retention:
      "GENRE PRIORITY (VERDICT): the open question is the central question itself; reveal evidence in the order that keeps the verdict uncertain longest.",
    plan:
      "PLAN (VERDICT): state in videoDna.narrative.voice one central 'why' or 'how' question the source can answer, one plain test criterion and two or three named candidate answers drawn from the source. Every chapter keyPoint names the candidate it tests and whether the evidence helps or hurts it; the last keyPoints hold the final verdict and its reason.",
    depth:
      "deepen by weighing each piece of evidence against the criterion and stating what it proves and what it cannot",
    fill: "add new tests: another piece of the source's evidence weighed against the criterion, the strongest objection to it, what it proves and what it cannot, and how each candidate's standing changes; never repeat a test already made",
    edit:
      "VERDICT CHECK: the central question appears in the first two beats; every candidate gets evidence and counter-evidence; the final chapter states a clear verdict and why; at most one viewer question per chapter.",
  },
};
export const MOTION_GENRE_CRAFT_TEXT = {
  NOTES_FIELD: "fix",
  DIALOGUE: "dialogue",
  SPACE: " ",
  JOIN: "; ",
  QUOTED: /["“”«»「」『』][^"“”«»「」『』]*["“”«»「」『』]/gu,
  CONTEXT_FIELD: "chapterScript",
  NOTES_RULE: "Each beat listed in 'fix' breaks the genre voice for the reason given; rewrite those beats, keeping their facts and place and never exceeding the beat's 'maxWords'. 'chapterScript', when present, is the whole chapter for reference only: never return its beats unless they are in 'beats', and never make a rewritten beat repeat a fact, image or line already told in another beat; if the fix would duplicate a neighbouring beat, shorten the beat to only what is new.",
  FILL: (needed: number, rule: string): string =>
    `SHORT SOURCE, FILL THE LENGTH ×${needed.toFixed(1)}: this chapter's source is about ${needed.toFixed(1)} times shorter than its requested length. Reach the requested units with new content, never by slowing down, padding or saying the same thing again: ${rule}. Keep the pace of a gripping video and never exceed the part's maximum units: overshooting the length is as wrong as falling short. Never invent historical events, outcomes, numbers, quotes, deaths, or words and acts of real named people; invented people are only the protagonist, the narrator and plain composite bystanders.`,
  DEPTH: (needed: number, allowed: number, rule: string): string =>
    `SHORT SOURCE, DEPTH ×${needed.toFixed(1)}: this chapter's source is about ${needed.toFixed(1)} times shorter than its requested length${allowed > 1 ? `, beyond the ×${allowed.toFixed(1)} slow-telling stretch` : ""}. Fill the rest with depth, never with repetition or padding: ${rule}. Each added beat must give the viewer something not yet said; never invent events, numbers, quotes, deaths or real people's acts, never restate an earlier beat in new words, and keep every added beat in this genre's voice.`,
  ISSUES: {
    DETACHED: "the beat describes the event from outside; put the viewer inside it: what hits your senses, how your body reacts, what you do",
    OMNISCIENT: "the beat reveals a plan, motive or out-of-sight event the protagonist cannot know now; deliver it as an order, rumour, messenger or later realisation, or cut it",
    STATISTIC: "a number is narrated as plain fact; make it what someone says or what you count, or cut it",
    WATCHING: "the protagonist only watches, hears or receives news again; vary it: let a person deliver it with an action that affects you, or make something happen to you and show what you do",
    FIRST: "the beat drops the narrator's first person; tell it as what I saw, did, was told or learned later",
    LIST: "several beats in a row only list events; link them by cause and consequence",
    QUESTION: "the central question is not stated in the opening beats",
    VERDICT: "the ending gives no clear verdict with its reason",
    HINDSIGHT: "too many 'I learned later' lines; keep at most two in the video: turn this one into what was seen, said or done at the time, or compress it into one line of what people said then",
    SENSE: "the beat only states facts; anchor it in one concrete sensory or bodily detail of this exact moment (a sound, a smell, a weight, a pain), keeping its length",
  },
  LOG: (count: number): string => `Kiểm tra thể loại: ${count} lời thoại lệch giọng thể loại, gửi kèm cho bước biên tập sửa.`,
  DETACHED_SHARE: 0.34,
  WATCHING_EVERY: 5,
  PART_FLOOR: 0.85,
  EDIT_GROWTH: 1.15,
  EDIT_SLACK: 2,
  WORD_SPLIT: /\s+/,
  HINDSIGHT_MAX: 2,
  LIST_RUN: 3,
  QUESTION_BEATS: 3,
  VERDICT_BEATS: 4,
};
export const MOTION_GENRE_CRAFT_MARKERS: Record<string, MotionGenreCraftMarkers> = {
  en: {
    viewer: /\b(?:you|your|yours|yourself)\b/i,
    first: /\b(?:I|me|my|mine|we|us|our)\b/,
    hearsay: /\b(?:says?|said|shouts?|shouted|yells?|reports?|rumou?rs?|whispers?|tells?|told|counts?|counted|heard|word (?:is|comes|spreads)|someone|they say|messenger|scout|orders?)\b/i,
    omniscient: /\b(?:\w+'s (?:plan|strategy|intention)|strategy|secretly|unseen|unaware|unknown to|anticipated|meanwhile|elsewhere|downstream|miles away|(?:his|her|their) plan|grasps?|realizes|knows that|the khan|the king (?:knows|decides|realizes))\b/i,
    collective: /^(?:the\s+)?(?:army|armies|troops|forces|defenders|attackers|enemy|knights|kingdom|empire|nation|commanders?|nobles|the line|columns?|battle|campaign)\b/i,
    number: /\b\d[\d,.]*\b|\b(?:hundreds?|thousands?|tens? of thousands|millions?)\b/i,
    watching: /\b(?:you (?:see|watch|hear|notice|glimpse|look|observe|spot)|I (?:heard|saw|watched|noticed)|(?:news|word|a rumou?r|reports?|more news) (?:comes|came|spreads|spread|arrives|arrived|reaches|reached|reach|ripples|rippled)|\b(?:a|the|another|more|second|third|breathless|northern) (?:\w+ )?(?:report|news|rumou?r|messenger)s?\b)\b/i,
    hindsight: /\b(?:(?:I|we) (?:later )?(?:learned|heard|found out)(?: that)? later|later,? (?:I|we) (?:learned|heard|found out)|(?:I|we) (?:later|only later) (?:learned|heard)|only later|I was (?:later )?told|years later,? (?:I|you) (?:learn|hear))\b/i,
    sense: /\b(?:wind|smoke|smell|stench|taste|cold|heat|rain|mud|dust|blood|sweat|breath|throat|heart|hands?|fingers?|arms?|legs?|feet|boots?|shoulders?|eyes?|face|skin|ache|aches|burns?|burning|shak\w*|trembl\w*|stings?|hiss\w*|shouts?|screams?|roar\w*|crash\w*|thud\w*|creak\w*|shield|spear|sword|bow|arrows?|horn|banner|weight|heavy)\b/i,
    cause: /\b(?:because|so|but|therefore|which|forcing|forced|thus|as a result|until|yet|after|when)\b/i,
    question: /\?/,
    verdict: /\b(?:verdict|answer|conclusion|so (?:who|what|which)|the truth|most likely|best explains|wins?)\b/i,
    sentence: /(?<=[.!?…])\s+/u,
  },
  vi: {
    viewer: /(^|[^\p{L}])bạn([^\p{L}]|$)/iu,
    first: /(^|[^\p{L}])(?:tôi|chúng tôi|ta|chúng ta|mình)([^\p{L}]|$)/iu,
    hearsay: /(?:nghe nói|nghe kể|nghe tin|người ta nói|ai đó|hô lên|hét|thét|báo tin|báo rằng|lời đồn|đồn rằng|tin dữ|lính trinh sát|sứ giả|đếm|ra lệnh|mệnh lệnh|thì thầm|kể rằng|nói rằng)/iu,
    omniscient: /(?:bí mật|âm thầm|không ai hay|không ai biết|trong khi đó|cùng lúc đó|ở nơi khác|cách đó hàng|kế hoạch của|đã tính trước|đã lường trước|nhà vua (?:biết|nhận ra|quyết định)|nhận ra rằng)/iu,
    collective: /^(?:quân|đạo quân|binh lính|lực lượng|kỵ binh|bộ binh|hiệp sĩ|quân đội|đế quốc|vương quốc|triều đình|các tướng|chỉ huy|hàng ngũ|trận chiến|chiến dịch|kẻ thù|địch)/iu,
    number: /\d[\d.,]*|(?:hàng trăm|hàng nghìn|hàng ngàn|hàng vạn|chục nghìn|trăm nghìn|vạn quân|nghìn quân)/iu,
    watching: /(?:(?:bạn|tôi) (?:thấy|nhìn thấy|nhìn|nghe thấy|nghe nói|nghe|để ý|trông thấy|quan sát|chứng kiến)|tin (?:tức )?(?:đến|truyền đến|lan|báo về)|lời đồn (?:lan|đến))(?=[^\p{L}]|$)/iu,
    hindsight: /(?:(?:sau này|mãi sau|về sau|mãi về sau)[^.!?]{0,12}(?:tôi|bạn|chúng tôi) (?:mới )?(?:biết|nghe|hiểu))/iu,
    sense: /(?:gió|khói|mùi|lạnh|nóng|mưa|bùn|bụi|máu|mồ hôi|hơi thở|cổ họng|tim|bàn tay|tay|ngón|cánh tay|chân|vai|mắt|mặt|da|đau|rát|run|cay|rít|hét|gào|tiếng|ầm|rầm|khiên|giáo|kiếm|nỏ|cung|mũi tên|tù và|cờ|nặng)/iu,
    cause: /(?:vì|bởi|nên|nhưng|thế là|vì thế|vì vậy|khiến|buộc|cho đến khi|sau khi|khi đó|dẫn đến|kết quả)/iu,
    question: /[?？]/u,
    verdict: /(?:kết luận|phán quyết|câu trả lời|vậy ai|vậy điều gì|sự thật là|khả năng cao nhất|giải thích tốt nhất|thắng)/iu,
    sentence: /(?<=[.!?…])\s+/u,
  },
};
