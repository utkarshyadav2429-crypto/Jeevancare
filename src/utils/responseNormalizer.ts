/**
 * JevanCare AI Health Assistant - Response Normalizer & Speech Optimizer
 * Transforms clinical / raw AI outputs into natural, warm, conversational text and voice-friendly phonetics.
 */

/**
 * Detects user language intent: English ('en'), Hindi Devanagari ('hi'), or Hinglish Roman Hindi ('hinglish').
 */
export function detectUserLanguage(text: string): 'en' | 'hi' | 'hinglish' {
  if (!text || typeof text !== 'string') return 'en';

  // 1. Check for Devanagari Unicode Range (\u0900-\u097F)
  const devanagariRegex = /[\u0900-\u097F]/;
  if (devanagariRegex.test(text)) {
    return 'hi';
  }

  const lower = text.toLowerCase();

  // 2. High-frequency Roman Hindi / Hinglish tokens & phrases
  const hinglishTokens = [
    'mera', 'meri', 'mere', 'mujhe', 'mujhko', 'hume', 'humein', 'humko',
    'kya', 'kyu', 'kyun', 'kaise', 'kahan', 'kab', 'kitna', 'kitni',
    'hai', 'hain', 'ho', 'hua', 'hui', 'hue', 'tha', 'thi', 'the', 'hoga', 'hogi',
    'dard', 'sujan', 'swelling', 'pet', 'sar', 'sir', 'gala', 'gale', 'gardan', 'neck',
    'daant', 'dawa', 'dawai', 'dawaii', 'dawaein', 'tablet', 'goli',
    'khana', 'khane', 'subah', 'shaam', 'raat', 'pehle', 'baad', 'khali pet',
    'doctor', 'dikha', 'dikhao', 'dikhana', 'dikhaun', 'check', 'karwa', 'karwana', 'karwayein',
    'hona', 'honi', 'chahiye', 'lag', 'lagta', 'lagti', 'raha', 'rahi', 'rahe',
    'thoda', 'thodi', 'zyada', 'jyada', 'bohot', 'bahut', 'kam', 'nahi', 'nhi', 'mat',
    'kuch', 'koi', 'baat', 'problem', 'dikkat', 'takleef', 'pareshani', 'ilaj', 'upchar',
    'bukhaar', 'khansi', 'sardi', 'jukham', 'ulti', 'dast', 'saans', 'sans', 'chhati',
    'kamar', 'pair', 'hath', 'haath', 'jalan', 'khujli', 'chakkar', 'kamzori', 'thakan',
    'theek', 'thik', 'aaram', 'jaldi', 'better', 'feel', 'lena', 'lene', 'le', 'lo',
    'batao', 'bataiye', 'bata do', 'suno', 'kripya', 'pls', 'plz', 'help karo'
  ];

  // Count matches
  const words = lower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  let hinglishCount = 0;

  for (const w of words) {
    if (hinglishTokens.includes(w)) {
      hinglishCount++;
    }
  }

  // If at least 2 Hinglish keywords or >20% of words are Hinglish markers
  if (hinglishCount >= 2 || (words.length > 0 && hinglishCount / words.length >= 0.2)) {
    return 'hinglish';
  }

  return 'en';
}

/**
 * Normalizes raw LLM output into a warm, natural human-like conversational response.
 * Strips robotic section headers, hashtags, slash constructs, pipe tables, excessive bullets, and repetitive boilerplate.
 */
export function normalizeAssistantResponse(rawText: string, preferredLang?: 'en' | 'hi' | 'hinglish' | 'auto'): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText.trim();

  // 1. Remove hashtags (e.g. #Health #NeckSwelling #DoctorConsult)
  text = text.replace(/#[a-zA-Z0-9_]+/g, '');

  // 2. Remove markdown headings (#, ##, ###, ####) and horizontal rules (---, ***, ___)
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '$1');
  text = text.replace(/^[\-\*_]{3,}\s*$/gm, '');

  // 3. Remove robotic section titles / pseudo-report headers
  const roboticHeaders = [
    /\*\*What You Should Do Next:?\*\*/gi,
    /\*\*What to do next:?\*\*/gi,
    /\*\*Next Steps:?\*\*/gi,
    /\*\*Potential Causes:?\*\*/gi,
    /\*\*Possible Causes:?\*\*/gi,
    /\*\*Possible Reasons:?\*\*/gi,
    /\*\*Differential Diagnosis:?\*\*/gi,
    /\*\*Clinical Presentation:?\*\*/gi,
    /\*\*Etiology:?\*\*/gi,
    /\*\*Pathophysiology:?\*\*/gi,
    /\*\*When to Seek Immediate Emergency Care:?\*\*/gi,
    /\*\*When to see a doctor:?\*\*/gi,
    /\*\*Red Flags:?\*\*/gi,
    /\*\*Warning Signs:?\*\*/gi,
    /\*\*Summary:?\*\*/gi,
    /\*\*Key Takeaways:?\*\*/gi,
    /\*\*Recommendation:?\*\*/gi,
    /\*\*Diagnosis:?\*\*/gi,
    /\*\*Treatment Options:?\*\*/gi,
    /\*\*Medical Disclaimer:?\*\*/gi,
    /\*\*Important Note:?\*\*/gi,
    /What You Should Do Next:?/gi,
    /Potential Causes:?/gi,
    /Possible Causes:?/gi,
    /Diagnosis \/ Causes \/ Treatment \/ Next Steps/gi,
  ];

  for (const pattern of roboticHeaders) {
    text = text.replace(pattern, '');
  }

  // 4. Clean slash-heavy medical and bureaucratic phrasing
  const slashReplacements: Array<[RegExp, string]> = [
    [/\bdoctor\/ENT\s*specialist\b/gi, 'doctor or ENT specialist'],
    [/\bdoctor\/ENT\b/gi, 'doctor or ENT specialist'],
    [/\bdoctor\/physician\b/gi, 'doctor or physician'],
    [/\bdoctor\/specialist\b/gi, 'doctor or specialist'],
    [/\bphysician\/specialist\b/gi, 'physician or specialist'],
    [/\binfection\/inflammation\b/gi, 'infection or inflammation'],
    [/\bsymptoms\/signs\b/gi, 'symptoms or signs'],
    [/\bsign\/symptom\b/gi, 'sign or symptom'],
    [/\bpatient\/user\b/gi, 'person'],
    [/\buser\/patient\b/gi, 'person'],
    [/\bcause\/reason\b/gi, 'cause or reason'],
    [/\btest\/scan\b/gi, 'test or scan'],
    [/\bscan\/ultrasound\b/gi, 'scan or ultrasound'],
    [/\bmedication\/drug\b/gi, 'medication'],
    [/\bT3\/T4\/TSH\b/gi, 'thyroid tests (T3, T4, and TSH)'],
    [/\bT3\/T4\b/gi, 'T3 and T4'],
    [/\bmg\/day\b/gi, 'mg per day'],
    [/\bday\/night\b/gi, 'day or night'],
    [/\bice\/heat\b/gi, 'ice or heat'],
    [/\bwarm\/cold\b/gi, 'warm or cold'],
    [/\byes\/no\b/gi, 'yes or no'],
  ];

  for (const [pattern, replacement] of slashReplacements) {
    text = text.replace(pattern, replacement);
  }

  // 5. Convert excessive bullet points into flowing conversational paragraphs
  // If bullet lists are short, turn them into smooth sentences
  text = text.replace(/^\s*[\*\-\•]\s+/gm, '• ');
  
  // If there are many consecutive bullet points (e.g. • A \n • B \n • C), keep at most 3-4 bullet lines, or smooth them
  const lines = text.split('\n');
  const cleanedLines: string[] = [];
  let consecutiveBullets = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('• ')) {
      consecutiveBullets++;
      if (consecutiveBullets <= 4) {
        cleanedLines.push(trimmed);
      }
    } else {
      consecutiveBullets = 0;
      if (trimmed.length > 0) {
        cleanedLines.push(trimmed);
      } else if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== '') {
        cleanedLines.push('');
      }
    }
  }

  text = cleanedLines.join('\n');

  // 6. Remove redundant "I am an AI", "As an artificial intelligence" boilerplate repeats
  text = text.replace(/As an AI language model,?\s*/gi, '');
  text = text.replace(/I am an AI,?\s*not a doctor,?\s*/gi, '');
  text = text.replace(/Remember, I am an AI and cannot diagnose you\.\s*/gi, '');

  // 7. Clean markdown code blocks & pipe characters
  text = text.replace(/```[a-z]*\n[\s\S]*?\n```/g, '');
  text = text.replace(/\|/g, ' ');

  // 8. Clean trailing double asterisks or malformed markdown bold tags
  text = text.replace(/\*\*\s*\*\*/g, '');
  text = text.replace(/\s{2,}/g, ' ');

  // 9. Normalize multiple blank lines to a clean double newline
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

/**
 * Prepares text for Text-to-Speech (TTS) engine.
 * Strips markdown, emojis, URLs, expands medical abbreviations into pronounceable natural speech,
 * and creates rhythmic pause points.
 */
export function generateVoiceOptimizedText(text: string, language?: 'en' | 'hi' | 'hinglish' | 'auto'): string {
  if (!text || typeof text !== 'string') return '';

  let spoken = text.trim();

  // 1. Remove URLs, brackets, markdown tokens
  spoken = spoken.replace(/https?:\/\/\S+/g, 'link');
  spoken = spoken.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // markdown links -> label
  spoken = spoken.replace(/\[\d+\]/g, ''); // citations [1]
  spoken = spoken.replace(/[*_#`~>•]/g, '');

  // 2. Remove emojis
  spoken = spoken.replace(/[\u{1F300}-\u{1F9FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|\u{1F1E6}-\u{1F1FF}]/gu, '');

  // 3. Expand common medical units and abbreviations to spoken words
  const spokenExpansions: Array<[RegExp, string]> = [
    [/\be\.g\.,?\s*/gi, 'for example, '],
    [/\bi\.e\.,?\s*/gi, 'that is, '],
    [/\bvs\.?\s*/gi, 'versus '],
    [/\b(\d+)\s*mg\b/gi, '$1 milligrams'],
    [/\b(\d+)\s*mcg\b/gi, '$1 micrograms'],
    [/\b(\d+)\s*ml\b/gi, '$1 milliliters'],
    [/\b(\d+)\s*gm\b/gi, '$1 grams'],
    [/\b(\d+)\s*kg\b/gi, '$1 kilograms'],
    [/\bBP\b/g, 'blood pressure'],
    [/\bENT\b/g, 'E-N-T specialist'],
    [/\bER\b/g, 'emergency room'],
    [/\bPRBC\b/g, 'packed red blood cells'],
    [/\bFFP\b/g, 'fresh frozen plasma'],
    [/\bCBC\b/g, 'complete blood count'],
    [/\bECG\b/g, 'E-C-G'],
    [/\bEKG\b/g, 'E-K-G'],
    [/\bMRI\b/g, 'M-R-I scan'],
    [/\bCT\s*scan\b/gi, 'C-T scan'],
    [/\bT3,\s*T4\s*(?:and|&)\s*TSH\b/gi, 'thyroid blood tests, including T3, T4, and TSH'],
    [/\bT3,\s*T4,\s*TSH\b/gi, 'thyroid blood tests, including T3, T4, and TSH'],
    [/\bOD\b/g, 'once daily'],
    [/\bBD\b/g, 'twice daily'],
    [/\bBID\b/g, 'twice daily'],
    [/\bTDS\b/g, 'three times daily'],
    [/\bTID\b/g, 'three times daily'],
    [/\bSOS\b/g, 'as needed'],
  ];

  for (const [pattern, replacement] of spokenExpansions) {
    spoken = spoken.replace(pattern, replacement);
  }

  // 4. Ensure natural pause pacing with punctuation
  spoken = spoken.replace(/\n+/g, '. ');
  spoken = spoken.replace(/\s+/g, ' ');
  spoken = spoken.replace(/\.{2,}/g, '.');
  spoken = spoken.replace(/,\s*,/g, ',');
  spoken = spoken.replace(/\s+([.,?!])/g, '$1');

  // 5. Trim to optimal spoken length (avoid 500-word monologues; ideal is ~50-110 words for 20-50s audio)
  const words = spoken.split(' ');
  if (words.length > 130) {
    // Keep first 120 words up to last sentence boundary
    const truncated = words.slice(0, 120).join(' ');
    const lastPeriodIndex = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('?'), truncated.lastIndexOf('!'));
    if (lastPeriodIndex > 60) {
      spoken = truncated.substring(0, lastPeriodIndex + 1);
    } else {
      spoken = truncated + '.';
    }
  }

  return spoken.trim();
}
