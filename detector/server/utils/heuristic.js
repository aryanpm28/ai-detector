// Lightweight stylometric heuristic — secondary signal alongside the LLM judge.
// Counts common AI-writing phrases / human markers, sentence length, punctuation
// uniformity, and structural patterns. Used for scoring and offline fallback.

const AI_PHRASES = [
  // ==============================
  // AI SELF-IDENTIFICATION
  // ==============================
  'as an ai',
  'as a language model',
  'as an ai language model',
  'as an artificial intelligence',
  'as an ai system',
  'as a machine learning model',
  'as a generative ai',
  'i am an ai',
  "i'm an ai",
  'i am a language model',
  "i'm a language model",
  'i do not have personal',
  "i don't have personal",
  'i do not have feelings',
  "i don't have feelings",
  'i do not have emotions',
  "i don't have emotions",
  'i cannot express personal',
  "i can't express personal",
  'i cannot provide personal',
  "i can't provide personal",
  'i cannot experience',
  "i can't experience",
  'i do not possess personal',
  "i don't possess personal",
  'my training data',
  'my knowledge cutoff',
  'based on my training',
  'according to my training',
  'i was trained',
  'i have been trained',

  // ==============================
  // FORMAL INTRODUCTIONS
  // ==============================
  'in this passage',
  'in this article',
  'in this essay',
  'in this discussion',
  'in this section',
  'this passage explores',
  'this article explores',
  'this essay explores',
  'this discussion explores',
  'this topic explores',
  'this section discusses',
  'the following discussion',
  'the following sections',
  'in the following sections',
  'this overview',
  'this comprehensive overview',
  'this guide provides',
  'this article provides',
  'this essay provides',
  'this discussion provides',

  // ==============================
  // FORMAL TRANSITIONS
  // ==============================
  'it is important to note',
  'it is worth noting',
  'it should be noted',
  'it is crucial to',
  'it is essential to',
  'it is important that',
  'it is worth mentioning',
  'it should also be noted',
  'needless to say',
  'in conclusion',
  'to conclude',
  'in summary',
  'to summarize',
  'in essence',
  'overall',
  'ultimately',
  'notably',
  'significantly',
  'interestingly',
  'furthermore',
  'moreover',
  'additionally',
  'in addition',
  'likewise',
  'consequently',
  'therefore',
  'thus',
  'hence',
  'accordingly',
  'as a result',
  'for this reason',
  'in other words',
  'that is to say',
  'in particular',
  'particularly',
  'specifically',
  'generally speaking',
  'broadly speaking',
  'more specifically',
  'in contrast',
  'by contrast',
  'on the other hand',
  'conversely',
  'alternatively',
  'similarly',
  'in comparison',
  'with this in mind',
  'with that in mind',
  'that being said',
  'having said that',
  'taking into account',
  'taking this into consideration',
  'from this perspective',
  'from this point of view',
  'in this context',
  'in this regard',
  'in this respect',

  // ==============================
  // GENERIC AI / CORPORATE STYLE
  // ==============================
  "in today's digital age",
  "in today's fast-paced world",
  "in today's rapidly changing world",
  "in today's modern world",
  'in the modern era',
  'in the digital age',
  'in the realm of',
  'in the world of',
  'in the landscape of',
  'in the ever-evolving landscape',
  'in an increasingly digital world',
  'in an increasingly connected world',
  'in an increasingly complex world',
  'in our rapidly changing world',
  'as technology continues to evolve',
  'as society continues to evolve',
  'as the world continues to evolve',
  'delve into',
  'delving into',
  'dive into',
  'diving into',
  'explore the world of',
  'exploring the world of',
  'shed light on',
  'provide valuable insights',
  'valuable insights into',
  'gain a deeper understanding',
  'deeper understanding of',
  'a comprehensive understanding',
  'a comprehensive overview',
  'a detailed overview',
  'a thorough understanding',
  'a closer look at',

  // ==============================
  // AI BUZZWORDS
  // ==============================
  'tapestry',
  'multifaceted',
  'myriad',
  'plethora',
  'plethora of',
  'abundance of',
  'array of',
  'wide array of',
  'vast array of',
  'wide range of',
  'a wide range of',
  'a variety of',
  'a multitude of',
  'myriad of',
  'numerous ways',
  'diverse range',
  'dynamic landscape',
  'complex landscape',
  'evolving landscape',
  'intricate',
  'nuanced',
  'multidimensional',
  'holistic',
  'comprehensive',
  'robust',
  'seamless',
  'cutting-edge',
  'state-of-the-art',
  'innovative',
  'groundbreaking',
  'transformative',
  'revolutionary',
  'game-changer',
  'game changer',
  'paradigm shift',
  'synergy',
  'synergies',
  'ecosystem',
  'empower',
  'empowers',
  'empowering',
  'leverage',
  'leveraging',
  'utilize',
  'utilizing',
  'facilitate',
  'facilitates',
  'foster',
  'fosters',
  'fostering',
  'enhance',
  'enhances',
  'enhancing',
  'optimize',
  'optimizing',
  'optimise',
  'optimising',
  'streamline',
  'streamlining',

  // ==============================
  // COMMON AI VERB PHRASES
  // ==============================
  'unlock the potential',
  'unlocking the potential',
  'harness the power',
  'harnessing the power',
  'pave the way',
  'paving the way',
  'plays a crucial role',
  'play a crucial role',
  'plays an important role',
  'play an important role',
  'plays a vital role',
  'play a vital role',
  'plays a significant role',
  'play a significant role',
  'serves as a',
  'serve as a',
  'acts as a',
  'act as a',
  'stands as a testament',
  'serves as a testament',
  'underscores the importance',
  'highlighting the importance',
  'highlights the importance',
  'emphasizes the importance',
  'emphasises the importance',
  'demonstrates the importance',
  'reflects the importance',
  'contributes to',
  'contributes significantly',
  'offers a unique opportunity',
  'provides an opportunity',
  'presents an opportunity',
  'opens up new possibilities',
  'opens the door to',
  'lay the foundation',
  'lays the foundation',
  'building a foundation',
  'drives innovation',
  'driving innovation',
  'fosters innovation',
  'promotes innovation',

  // ==============================
  // AI CONCLUSION PATTERNS
  // ==============================
  'in conclusion',
  'to conclude',
  'in summary',
  'to summarize',
  'in short',
  'in essence',
  'all in all',
  'overall,',
  'ultimately,',
  'taken together',
  'when considered together',
  'considering these factors',
  'based on the above',
  'in light of the above',
  'in light of these considerations',
  'with these considerations in mind',
  'the key takeaway',
  'the key takeaway is',
  'the main takeaway',
  'the main takeaway is',
  'it is clear that',
  'it becomes clear that',
  'this demonstrates that',
  'this highlights that',
  'this shows that',

  // ==============================
  // AI QUALIFICATION / HEDGING
  // ==============================
  'it is safe to say',
  'one might argue',
  'it can be argued',
  'it could be argued',
  'it is reasonable to suggest',
  'it is reasonable to assume',
  'it is important to consider',
  'it is worth considering',
  'it is important to recognize',
  'it is important to recognise',
  'it is essential to understand',
  'it is crucial to understand',
  'it is useful to consider',
  'it is helpful to consider',
  'from a broader perspective',
  'from a practical perspective',
  'from a theoretical perspective',
  'from a broader standpoint',
  'in practical terms',
  'in theoretical terms',

  // ==============================
  // AI-LIKE FUTURE LANGUAGE
  // ==============================
  'moving forward',
  'going forward',
  'as we move forward',
  'looking ahead',
  'in the years to come',
  'in the future',
  'future developments',
  'future possibilities',
  'future applications',
  'continued advancements',
  'ongoing advancements',
  'continued innovation',
  'as technology advances',
  'as technology continues',
  'the future of',
  'shaping the future',
  'shape the future',
  'paving the way for future',

  // ==============================
  // GENERIC BENEFIT LANGUAGE
  // ==============================
  'numerous benefits',
  'several benefits',
  'key benefits',
  'significant benefits',
  'potential benefits',
  'a number of benefits',
  'offers several advantages',
  'offers numerous advantages',
  'provides several advantages',
  'provides numerous advantages',
  'key advantages',
  'significant advantages',
  'potential advantages',

  // ==============================
  // GENERIC CHALLENGE LANGUAGE
  // ==============================
  'challenges and opportunities',
  'challenges and benefits',
  'advantages and disadvantages',
  'pros and cons',
  'potential challenges',
  'potential limitations',
  'key challenges',
  'significant challenges',
  'several challenges',
  'various challenges',
  'a number of challenges',
  'despite the challenges',
  'despite the limitations',

  // ==============================
  // GENERIC EXPLANATION LANGUAGE
  // ==============================
  'for example',
  'for instance',
  'as an example',
  'as a result',
  'this means that',
  'this allows',
  'this enables',
  'this helps to',
  'this can help',
  'this makes it possible',
  'in simple terms',
  'simply put',
  'put simply',
  'in other words',
  'to put it simply',

  // ==============================
  // COMMON AI PHRASES FROM WRITING
  // ==============================
  'it is worth mentioning that',
  'it is important to understand that',
  'it is important to recognize that',
  'it is essential to understand that',
  'it is crucial to understand that',
  'one of the most important',
  'one of the key factors',
  'one of the key aspects',
  'one of the main reasons',
  'one of the most significant',
  'a key factor',
  'a key aspect',
  'a key component',
  'a key element',
  'an important factor',
  'an important aspect',
  'an important component',
  'a significant factor',
  'a significant aspect',
  'a significant component',
  'a fundamental aspect',
  'a fundamental component',
  'a critical factor',
  'a critical aspect',
  'a critical component',

  // ==============================
  // AI-SOUNDING ACADEMIC LANGUAGE
  // ==============================
  'it can be seen that',
  'it can be observed that',
  'it can be understood that',
  'it is evident that',
  'it is apparent that',
  'it is clear from',
  'evidence suggests that',
  'research suggests that',
  'studies have shown that',
  'research has shown that',
  'this suggests that',
  'this indicates that',
  'this demonstrates',
  'this illustrates',
  'this highlights',
  'this emphasizes',
  'this emphasises',
  'this reinforces',
  'this reflects',
  'this contributes to',
  'this is particularly relevant',
  'this is particularly important',

  // ==============================
  // COMMON AI POLISHING PHRASES
  // ==============================
  'clear and concise',
  'clear, concise, and',
  'simple and effective',
  'effective and efficient',
  'safe and secure',
  'flexible and scalable',
  'powerful and versatile',
  'efficient and effective',
  'seamless and efficient',
  'reliable and efficient',
  'meaningful and impactful',
  'practical and effective',
  'accessible and user-friendly',
  'user-friendly and accessible',
  'easy to understand',
  'easy to use',
  'straightforward and effective',
];

const HUMAN_SIGNALS = [
  // Personal opinion & voice
  'i think', 'i feel', 'i believe', 'in my opinion', 'personally',
  'honestly', 'to be honest', 'if you ask me', 'from my experience',
  'in my experience', 'i reckon', 'i guess', 'i suppose',
  'as far as i can tell', 'from what i can tell', 'i would say',

  // Informal / conversational
  'kinda', 'sort of', 'kind of', 'you know', 'i mean', 'actually',
  'basically', 'literally', 'seriously', 'anyway', 'anyways',
  'btw', 'lol', 'haha', 'hahaha', 'imho', 'tbh', 'imo',
  'well,', 'so,', 'yeah', 'yep', 'nope', 'nah', 'ok so',
  'right?', 'you see', 'look,', 'listen,', 'trust me',
  'not gonna lie', 'gonna', 'wanna', 'gotta', 'dunno', 'meh',
  'idk', "ain't", "i'm not sure", "i don't know", "i can't remember",
  "don't quote me", 'maybe', 'perhaps', 'probably',
];

function countMatches(text, phrases) {
  const lower = text.toLowerCase();
  let score = 0;
  for (const p of phrases) {
    if (lower.includes(p)) score += 1;
  }
  return score;
}

function avgSentenceLength(text) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  if (!sentences.length) return 15;
  const words = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0);
  return words / sentences.length;
}

/**
 * AI text often has very regular punctuation (few exclamation marks,
 * almost no informal markers like "..." or "?!" combinations).
 * Returns a small AI-leaning score.
 */
function punctuationScore(text) {
  let score = 0;
  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  const ellipses = (text.match(/\.\.\./g) || []).length;
  const emDashes = (text.match(/—|--/g) || []).length;

  // Very few informal punctuation marks → slightly more AI-like
  if (exclamations === 0 && questions <= 1) score += 4;
  if (ellipses === 0) score += 2;
  // Heavy use of em-dashes is common in polished AI output
  if (emDashes >= 3) score += 3;

  return score;
}

/**
 * Structural signals: uniform paragraph lengths, low contraction usage,
 * high ratio of long words — all weakly associated with AI writing.
 */
function structureScore(text) {
  let score = 0;
  const lower = text.toLowerCase();

  // Contractionsctions are more human
  const contractions = (lower.match(/\b\w+'(t|s|re|ve|ll|d)\b/g) || []).length;
  if (contractions === 0 && text.split(/\s+/).length > 80) score += 5;
  else if (contractions >= 5) score -= 3; // human lean (handled by clamping later)

  // Very long average word length can indicate formal AI style
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 30) {
    const avgWordLen = words.reduce((s, w) => s + w.replace(/[^a-zA-Z]/g, '').length, 0) / words.length;
    if (avgWordLen > 6.2) score += 4;
  }

  // Paragraph uniformity: many paragraphs of similar length
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 40);
  if (paragraphs.length >= 3) {
    const lengths = paragraphs.map((p) => p.trim().split(/\s+/).length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((s, l) => s + (l - avg) ** 2, 0) / lengths.length;
    if (variance < 40) score += 4; // very uniform → AI-like
  }

  return Math.max(0, score);
}

function heuristicScore(text) {
  const cleaned = text.trim();
  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;

  const aiHits = countMatches(cleaned, AI_PHRASES);
  const humanHits = countMatches(cleaned, HUMAN_SIGNALS);
  const avgLen = avgSentenceLength(cleaned);
  const punctuation = punctuationScore(cleaned);
  const structure = structureScore(cleaned);

  let aiScore = aiHits * 5;
  let humanScore = humanHits * 6;

  // Sentence length
  if (avgLen > 25) aiScore += 8;
  if (avgLen < 10) humanScore += 8;

  // Structural / punctuation signals
  aiScore += punctuation;
  aiScore += structure;

  // Short text is hard to classify — dampen both sides
  if (wordCount < 40) {
    aiScore *= 0.6;
    humanScore *= 0.6;
  }

  const total = aiScore + humanScore || 1;
  let ai = Math.round((aiScore / total) * 100);
  ai = Math.max(5, Math.min(95, ai));
  const human = 100 - ai;

  return {
    ai,
    human,
    wordCount,
    aiHits,
    humanHits,
    avgSentenceLength: Math.round(avgLen * 10) / 10,
    punctuationScore: punctuation,
    structureScore: structure,
  };
}

module.exports = { heuristicScore, AI_PHRASES, HUMAN_SIGNALS };