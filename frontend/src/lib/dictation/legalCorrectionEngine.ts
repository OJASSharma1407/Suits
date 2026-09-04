/**
 * Indian Legal Vocabulary & Phonetic Auto-Correction Engine
 * 
 * Post-processes transcribed speech chunks from the Web Speech API (`en-IN`)
 * to resolve common phonetic misinterpretations of:
 * 1. Indian court & procedural vernacular (Urdu/Persian/Hindi court terminology)
 * 2. Latin legal maxims & constitutional doctrines
 * 3. Statutory citations, Acts, and Sections (CrPC, CPC, IPC, BNSS, NI Act, etc.)
 * 4. Spoken punctuation commands ("comma", "full stop", "question mark", "new line")
 */

export interface LegalCorrection {
  original: string;
  corrected: string;
}

export interface CorrectionResult {
  correctedText: string;
  corrections: LegalCorrection[];
}

interface ReplacementRule {
  pattern: RegExp;
  replacement: string | ((match: string, ...args: any[]) => string);
  correctedLabel?: string;
}

/**
 * Pre-compiled rules array ordered by specificity (higher specificity first).
 */
const CORRECTION_RULES: ReplacementRule[] = [
  // ─── Spoken Punctuation & Formatting ───
  { pattern: /\b(?:comma)\b/gi, replacement: "," },
  { pattern: /\b(?:full\s*stop|period)\b/gi, replacement: "." },
  { pattern: /\b(?:question\s*mark)\b/gi, replacement: "?" },
  { pattern: /\b(?:colon)\b/gi, replacement: ":" },
  { pattern: /\b(?:semi\s*colon|semicolon)\b/gi, replacement: ";" },
  { pattern: /\b(?:new\s*line|next\s*line)\b/gi, replacement: "\n" },

  // ─── High-Priority Latin Maxims & Common Speech Mangling ───
  {
    pattern: /\b(?:race\s*judicata|rest\s*judicata|resjudicata|race\s*judicature)\b/gi,
    replacement: "res judicata",
    correctedLabel: "res judicata",
  },
  {
    pattern: /\b(?:sir\s*sheer\s*rare\s*e|search\s*your\s*rare\s*e|sartiorari|certio\s*rari|searchio\s*rari|sir\s*show\s*rari|certio\s*rare\s*e)\b/gi,
    replacement: "certiorari",
    correctedLabel: "certiorari",
  },
  {
    pattern: /\b(?:suo\s*moto|suo\s*motto|sumoto|suomoto|so\s*moto)\b/gi,
    replacement: "suo motu",
    correctedLabel: "suo motu",
  },
  {
    pattern: /\b(?:de\s*horse|day\s*horse|the\s*horse|d\s*horse)\b(?=\s+the\s+record|\s+the\s+pleadings|\b)/gi,
    replacement: "de hors",
    correctedLabel: "de hors",
  },
  {
    pattern: /\b(?:in\s*the\s*rim\s*stay|in\s*term\s*stay|interim\s*state)\b/gi,
    replacement: "interim stay",
    correctedLabel: "interim stay",
  },
  {
    pattern: /\b(?:add\s*interim|ad-interim)\b/gi,
    replacement: "ad interim",
    correctedLabel: "ad interim",
  },
  {
    pattern: /\b(?:heavy\s*as\s*corpus|heaviest\s*corpus|have\s*yes\s*corpus)\b/gi,
    replacement: "habeas corpus",
    correctedLabel: "habeas corpus",
  },
  {
    pattern: /\b(?:man\s*damus|men\s*damus|mandamas)\b/gi,
    replacement: "mandamus",
    correctedLabel: "mandamus",
  },
  {
    pattern: /\b(?:co\s*warranto|quowarranto)\b/gi,
    replacement: "quo warranto",
    correctedLabel: "quo warranto",
  },
  {
    pattern: /\b(?:locus\s*standard|locus\s*standee|locus\s*candy)\b/gi,
    replacement: "locus standi",
    correctedLabel: "locus standi",
  },
  {
    pattern: /\b(?:primary\s*facie|prima\s*fashi|prima\s*facia|prime\s*a\s*facie)\b/gi,
    replacement: "prima facie",
    correctedLabel: "prima facie",
  },
  {
    pattern: /\b(?:pendent\s*elite|pendant\s*light|pendant\s*lite)\b/gi,
    replacement: "pendente lite",
    correctedLabel: "pendente lite",
  },
  {
    pattern: /\b(?:sub\s*juice|sub\s*judise|subjudice)\b/gi,
    replacement: "sub judice",
    correctedLabel: "sub judice",
  },
  {
    pattern: /\b(?:x\s*party|exparty|x\s*parte|ex-parte)\b/gi,
    replacement: "ex parte",
    correctedLabel: "ex parte",
  },
  {
    pattern: /\b(?:stari\s*decisis|stair\s*decisis)\b/gi,
    replacement: "stare decisis",
    correctedLabel: "stare decisis",
  },
  {
    pattern: /\b(?:ratio\s*decision\s*die|ratio\s*decidandi)\b/gi,
    replacement: "ratio decidendi",
    correctedLabel: "ratio decidendi",
  },
  {
    pattern: /\b(?:orbiter\s*dictum|obiter\s*dicta)\b/gi,
    replacement: "obiter dictum",
    correctedLabel: "obiter dictum",
  },
  {
    pattern: /\b(?:audio\s*ultra\s*partum|audi\s*alteram\s*partum|audi\s*altram\s*partem)\b/gi,
    replacement: "audi alteram partem",
    correctedLabel: "audi alteram partem",
  },
  {
    pattern: /\b(?:nemo\s*judex\s*in\s*cause\s*sua|nemo\s*judex\s*in\s*causa)\b/gi,
    replacement: "nemo judex in causa sua",
    correctedLabel: "nemo judex in causa sua",
  },
  {
    pattern: /\b(?:ultra\s*virus|ultra\s*viral)\b/gi,
    replacement: "ultra vires",
    correctedLabel: "ultra vires",
  },
  {
    pattern: /\b(?:intra\s*virus)\b/gi,
    replacement: "intra vires",
    correctedLabel: "intra vires",
  },
  {
    pattern: /\b(?:amicus\s*cure\s*e|amicus\s*curry)\b/gi,
    replacement: "amicus curiae",
    correctedLabel: "amicus curiae",
  },
  {
    pattern: /\b(?:mutatis\s*mutant\s*is|mutatus\s*mutandis)\b/gi,
    replacement: "mutatis mutandis",
    correctedLabel: "mutatis mutandis",
  },
  {
    pattern: /\b(?:in\s*lemon\s*y|in\s*lemine|in\s*liminy)\b/gi,
    replacement: "in limine",
    correctedLabel: "in limine",
  },
  {
    pattern: /\b(?:perry\s*materia|party\s*materia)\b/gi,
    replacement: "pari materia",
    correctedLabel: "pari materia",
  },
  {
    pattern: /\b(?:non\s*obstacle\s*clause|non-obstante\s*clause)\b/gi,
    replacement: "non obstante clause",
    correctedLabel: "non obstante clause",
  },
  {
    pattern: /\b(?:lease\s*pendens|list\s*pendens)\b/gi,
    replacement: "lis pendens",
    correctedLabel: "lis pendens",
  },

  // ─── Indian Court Vocabulary & Vernacular Terms ───
  {
    pattern: /\b(?:vakalat\s*nama|vakeelat\s*nama|wakalatnama|wakalat\s*nama|vocal\s*at\s*nama|vocat\s*nama)\b/gi,
    replacement: "vakalatnama",
    correctedLabel: "vakalatnama",
  },
  {
    pattern: /\b(?:punch\s*nama|panch\s*nama)\b/gi,
    replacement: "panchnama",
    correctedLabel: "panchnama",
  },
  {
    pattern: /\b(?:mudda\s*mal|mudamal)\b/gi,
    replacement: "muddamal",
    correctedLabel: "muddamal",
  },
  {
    pattern: /\b(?:rojnamcha|roj\s*namcha)\b/gi,
    replacement: "roznamcha",
    correctedLabel: "roznamcha",
  },
  {
    pattern: /\b(?:dusty\s*notice|dusty\s*service|dasti\s*service)\b/gi,
    replacement: "dasti notice",
    correctedLabel: "dasti notice",
  },
  {
    pattern: /\b(?:caviat\s*petition|kaveat\s*petition)\b/gi,
    replacement: "caveat petition",
    correctedLabel: "caveat petition",
  },
  {
    pattern: /\b(?:anticipatery\s*bail|anticipated\s*bail)\b/gi,
    replacement: "anticipatory bail",
    correctedLabel: "anticipatory bail",
  },
  {
    pattern: /\b(?:washment\s*of\s*fir|crashing\s*of\s*fir)\b/gi,
    replacement: "quashing of FIR",
    correctedLabel: "quashing of FIR",
  },
  {
    pattern: /\b(?:in\s*damnity\s*bond)\b/gi,
    replacement: "indemnity bond",
    correctedLabel: "indemnity bond",
  },
  {
    pattern: /\b(?:calendra|calandra)\b/gi,
    replacement: "kalandra",
    correctedLabel: "kalandra",
  },
  {
    pattern: /\b(?:mal\s*khana)\b/gi,
    replacement: "malkhana",
    correctedLabel: "malkhana",
  },
  {
    pattern: /\b(?:charge\s*sheet|charge-sheet)\b/gi,
    replacement: "chargesheet",
    correctedLabel: "chargesheet",
  },

  // ─── Indian Statutory Acts & Codes ───
  { pattern: /\b(?:c\s*r\s*p\s*c|cr\s*\.?\s*p\s*\.?\s*c\.?|see\s*r\s*p\s*c)\b/gi, replacement: "CrPC", correctedLabel: "CrPC" },
  { pattern: /\b(?:c\s*p\s*c|c\s*\.?\s*p\s*\.?\s*c\.?|see\s*p\s*c)\b/gi, replacement: "CPC", correctedLabel: "CPC" },
  { pattern: /\b(?:i\s*p\s*c|i\s*\.?\s*p\s*\.?\s*c\.?|eye\s*p\s*c)\b/gi, replacement: "IPC", correctedLabel: "IPC" },
  { pattern: /\b(?:b\s*n\s*s\s*s|b\.?\s*n\.?\s*s\.?\s*s\.?|bharatiya\s*nagarik\s*suraksha\s*sanhita)\b/gi, replacement: "BNSS", correctedLabel: "BNSS" },
  { pattern: /\b(?:b\s*n\s*s|b\.?\s*n\.?\s*s\.?|bharatiya\s*nyaya\s*sanhita)\b/gi, replacement: "BNS", correctedLabel: "BNS" },
  { pattern: /\b(?:b\s*s\s*a|b\.?\s*s\.?\s*a\.?|bharatiya\s*sakshya\s*adhiniyam)\b/gi, replacement: "BSA", correctedLabel: "BSA" },
  { pattern: /\b(?:n\s*i\s*act|and\s*i\s*act|negotiable\s*instruments\s*act)\b/gi, replacement: "NI Act", correctedLabel: "NI Act" },
  { pattern: /\b(?:p\s*o\s*c\s*s\s*o|pock\s*so)\s*(?:act)?\b/gi, replacement: "POCSO Act", correctedLabel: "POCSO Act" },
  { pattern: /\b(?:p\s*m\s*l\s*a|p\.?\s*m\.?\s*l\.?\s*a\.?)\b/gi, replacement: "PMLA", correctedLabel: "PMLA" },
  { pattern: /\b(?:u\s*a\s*p\s*a|u\.?\s*a\.?\s*p\.?\s*a\.?)\b/gi, replacement: "UAPA", correctedLabel: "UAPA" },
  { pattern: /\b(?:s\s*a\s*r\s*f\s*a\s*e\s*s\s*i|sarfesi|surface\s*e\s*act)\b/gi, replacement: "SARFAESI Act", correctedLabel: "SARFAESI Act" },
  { pattern: /\b(?:n\s*d\s*p\s*s|ndps\s*act)\b/gi, replacement: "NDPS Act", correctedLabel: "NDPS Act" },
  { pattern: /\b(?:i\s*b\s*c|insolvency\s*and\s*bankruptcy\s*code)\b/gi, replacement: "IBC", correctedLabel: "IBC" },
  { pattern: /\b(?:s\s*l\s*p|s\.?\s*l\.?\s*p\.?|special\s*leave\s*petition)\b/gi, replacement: "SLP", correctedLabel: "SLP" },
  { pattern: /\b(?:f\s*i\s*r|f\.?\s*i\.?\s*r\.?|eff\s*i\s*r)\b/gi, replacement: "FIR", correctedLabel: "FIR" },

  // ─── Common Statutory Sections & Articles with Spoken Numbers ───
  {
    pattern: /\b(under\s+section|u\/s|sec(?:tion)?)\s+(?:four\s+eighty\s+two|4\s*8\s*2|482)\b/gi,
    replacement: (_m, prefix) => prefix?.toLowerCase().includes("under") ? "under Section 482" : "Section 482",
    correctedLabel: "Section 482",
  },
  {
    pattern: /\b(under\s+section|u\/s|sec(?:tion)?)\s+(?:four\s+thirty\s+nine|4\s*3\s*9|439)\b/gi,
    replacement: (_m, prefix) => prefix?.toLowerCase().includes("under") ? "under Section 439" : "Section 439",
    correctedLabel: "Section 439",
  },
  {
    pattern: /\b(under\s+section|u\/s|sec(?:tion)?)\s+(?:four\s+thirty\s+eight|4\s*3\s*8|438)\b/gi,
    replacement: (_m, prefix) => prefix?.toLowerCase().includes("under") ? "under Section 438" : "Section 438",
    correctedLabel: "Section 438",
  },
  {
    pattern: /\b(under\s+section|u\/s|sec(?:tion)?)\s+(?:one\s+thirty\s+eight|1\s*3\s*8|138)\b/gi,
    replacement: (_m, prefix) => prefix?.toLowerCase().includes("under") ? "under Section 138" : "Section 138",
    correctedLabel: "Section 138",
  },
  {
    pattern: /\b(under\s+section|u\/s|sec(?:tion)?)\s+(?:three\s+zero\s+two|3\s*0\s*2|302)\b/gi,
    replacement: (_m, prefix) => prefix?.toLowerCase().includes("under") ? "under Section 302" : "Section 302",
    correctedLabel: "Section 302",
  },
  {
    pattern: /\b(under\s+section|u\/s|sec(?:tion)?)\s+(?:three\s+zero\s+seven|3\s*0\s*7|307)\b/gi,
    replacement: (_m, prefix) => prefix?.toLowerCase().includes("under") ? "under Section 307" : "Section 307",
    correctedLabel: "Section 307",
  },
  {
    pattern: /\b(under\s+section|u\/s|sec(?:tion)?)\s+(?:three\s+seventy\s+six|3\s*7\s*6|376)\b/gi,
    replacement: (_m, prefix) => prefix?.toLowerCase().includes("under") ? "under Section 376" : "Section 376",
    correctedLabel: "Section 376",
  },
  {
    pattern: /\b(under\s+section|u\/s|sec(?:tion)?)\s+(?:four\s+twenty|4\s*2\s*0|420)\b/gi,
    replacement: (_m, prefix) => prefix?.toLowerCase().includes("under") ? "under Section 420" : "Section 420",
    correctedLabel: "Section 420",
  },
  {
    pattern: /\b(under\s+section|u\/s|sec(?:tion)?)\s+(?:one\s+twenty\s+b|120\s*b|1\s*2\s*0\s*b)\b/gi,
    replacement: (_m, prefix) => prefix?.toLowerCase().includes("under") ? "under Section 120B" : "Section 120B",
    correctedLabel: "Section 120B",
  },
  {
    pattern: /\b(under\s+section|u\/s|sec(?:tion)?)\s+(?:thirty\s+four|3\s*4|34)\b/gi,
    replacement: (_m, prefix) => prefix?.toLowerCase().includes("under") ? "under Section 34" : "Section 34",
    correctedLabel: "Section 34",
  },
  // Generic Section <number>
  {
    pattern: /\b(under\s+section|u\/s|sec(?:tion)?)\s+(\d+[A-Za-z]?)\b/gi,
    replacement: (_match, prefix, num) => prefix?.toLowerCase().includes("under") ? `under Section ${num}` : `Section ${num}`,
  },
  // Articles
  {
    pattern: /\b(under\s+)?(?:art(?:icle)?)\s+(?:two\s+twenty\s+six|2\s*2\s*6|226)\b/gi,
    replacement: (_m, under) => `${under ? "under " : ""}Article 226`,
    correctedLabel: "Article 226",
  },
  {
    pattern: /\b(under\s+)?(?:art(?:icle)?)\s+(?:thirty\s+two|3\s*2|32)\b/gi,
    replacement: (_m, under) => `${under ? "under " : ""}Article 32`,
    correctedLabel: "Article 32",
  },
  {
    pattern: /\b(under\s+)?(?:art(?:icle)?)\s+(?:one\s+thirty\s+six|1\s*3\s*6|136)\b/gi,
    replacement: (_m, under) => `${under ? "under " : ""}Article 136`,
    correctedLabel: "Article 136",
  },
  {
    pattern: /\b(under\s+)?(?:art(?:icle)?)\s+(?:twenty\s+one|2\s*1|21)\b/gi,
    replacement: (_m, under) => `${under ? "under " : ""}Article 21`,
    correctedLabel: "Article 21",
  },
  {
    pattern: /\b(under\s+)?(?:art(?:icle)?)\s+(?:fourteen|1\s*4|14)\b/gi,
    replacement: (_m, under) => `${under ? "under " : ""}Article 14`,
    correctedLabel: "Article 14",
  },
  // Generic Article <number>
  {
    pattern: /\b(under\s+)?(?:art(?:icle)?)\s+(\d+[A-Za-z]?)\b/gi,
    replacement: (_match, under, num) => `${under ? "under " : ""}Article ${num}`,
  },
  // Order 39 Rules
  {
    pattern: /\border\s+(?:thirty\s+nine|39)\s+rules?\s+(?:one\s+and\s+two|1\s*(?:and|&)\s*2)\b/gi,
    replacement: "Order XXXIX Rules 1 & 2",
    correctedLabel: "Order XXXIX Rules 1 & 2",
  },
];

/**
 * Clean up punctuation spacing and capitalizes sentence beginnings
 */
function polishPunctuationAndSpacing(text: string): string {
  return text
    // Remove space before punctuation: "word ," -> "word,"
    .replace(/\s+([,.:;?!])/g, "$1")
    // Ensure space after punctuation if followed by word: "word,another" -> "word, another"
    .replace(/([,.:;?!])([A-Za-z0-9])/g, "$1 $2")
    // Multiple spaces into single space
    .replace(/[ \t]+/g, " ")
    // Trim extra spaces around newlines
    .replace(/ *\n */g, "\n")
    // Sentence capitalization after full stop, question mark, or newline
    .replace(/(?:^|[.?!]\s+|\n+)([a-z])/g, (_match, char) => _match.toUpperCase());
}

/**
 * Post-processes transcribed text using the legal vocabulary dictionary.
 * Returns the polished text and an array of unique corrections applied.
 */
export function correctLegalSpeech(rawText: string): CorrectionResult {
  if (!rawText || !rawText.trim()) {
    return { correctedText: rawText, corrections: [] };
  }

  let text = rawText;
  const correctionsMap = new Map<string, string>();

  for (const rule of CORRECTION_RULES) {
    text = text.replace(rule.pattern, (match, ...args) => {
      let replacementStr: string;
      if (typeof rule.replacement === "function") {
        replacementStr = rule.replacement(match, ...args);
      } else {
        replacementStr = rule.replacement;
      }

      if (rule.correctedLabel && match.trim().toLowerCase() !== replacementStr.trim().toLowerCase()) {
        correctionsMap.set(match.trim(), rule.correctedLabel);
      }
      return replacementStr;
    });
  }

  const polishedText = polishPunctuationAndSpacing(text);

  const corrections: LegalCorrection[] = Array.from(correctionsMap.entries()).map(
    ([original, corrected]) => ({ original, corrected })
  );

  return {
    correctedText: polishedText,
    corrections,
  };
}
