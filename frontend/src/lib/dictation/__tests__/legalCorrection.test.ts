import { correctLegalSpeech } from "../legalCorrectionEngine";

/**
 * Verification test suite for Indian Legal Vocabulary Auto-Correction
 */
export function runLegalCorrectionTests() {
  const testCases: Array<{
    name: string;
    input: string;
    expectedSubstrings: string[];
    forbiddenSubstrings?: string[];
  }> = [
    {
      name: "Quashing of FIR under Section 482 CrPC",
      input: "I am filing a washment of fir under section four eighty two of cr pc",
      expectedSubstrings: ["quashing of FIR", "Section 482", "CrPC"],
      forbiddenSubstrings: ["washment", "section four eighty two", "cr pc"],
    },
    {
      name: "Res Judicata and Suo Motu Cognizance",
      input: "The doctrine of race judicata applies and suo moto cognizance was taken",
      expectedSubstrings: ["res judicata", "suo motu"],
      forbiddenSubstrings: ["race judicata", "suo moto"],
    },
    {
      name: "De Hors the Record and Punctuation",
      input: "The order is de horse the record comma and suffers from patent illegality full stop",
      expectedSubstrings: ["de hors the record,", "patent illegality."],
      forbiddenSubstrings: ["de horse", "comma", "full stop"],
    },
    {
      name: "Vakalatnama and Caveat Petition",
      input: "Please file vakalat nama along with caviat petition and pray for in the rim stay",
      expectedSubstrings: ["vakalatnama", "caveat petition", "interim stay"],
      forbiddenSubstrings: ["vakalat nama", "caviat petition", "in the rim stay"],
    },
    {
      name: "Certiorari and Habeas Corpus under Article 226",
      input: "We seek a writ of certio rari and heavy as corpus under article two twenty six of constitution",
      expectedSubstrings: ["certiorari", "habeas corpus", "Article 226"],
      forbiddenSubstrings: ["certio rari", "heavy as corpus", "article two twenty six"],
    },
    {
      name: "Section 138 NI Act with Section 439 Bail",
      input: "Proceedings under section one thirty eight of and i act alongside section four thirty nine of crpc",
      expectedSubstrings: ["Section 138", "NI Act", "Section 439", "CrPC"],
      forbiddenSubstrings: ["section one thirty eight", "and i act", "section four thirty nine"],
    },
    {
      name: "Vernacular Terms: Panchnama, Muddamal, Roznamcha, Dasti",
      input: "The punch nama was recorded and mudda mal was deposited in mal khana with rojnamcha entry and dusty notice",
      expectedSubstrings: ["panchnama", "muddamal", "malkhana", "roznamcha", "dasti notice"],
      forbiddenSubstrings: ["punch nama", "mudda mal", "mal khana", "rojnamcha", "dusty notice"],
    },
    {
      name: "Latin Maxims: Locus Standi, Prima Facie, Pendente Lite, Sub Judice",
      input: "The petitioner lacks locus standard and no primary facie case is made out for pendent elite relief while matter is sub juice",
      expectedSubstrings: ["locus standi", "prima facie", "pendente lite", "sub judice"],
      forbiddenSubstrings: ["locus standard", "primary facie", "pendent elite", "sub juice"],
    },
    {
      name: "Ultra Vires, Audi Alteram Partem, Stare Decisis",
      input: "The statutory notification is ultra virus and violates audio ultra partum contrary to stari decisis",
      expectedSubstrings: ["ultra vires", "audi alteram partem", "stare decisis"],
      forbiddenSubstrings: ["ultra virus", "audio ultra partum", "stari decisis"],
    },
    {
      name: "New criminal codes: BNSS, BNS, BSA",
      input: "Application under b n s s and b n s and b s a",
      expectedSubstrings: ["BNSS", "BNS", "BSA"],
      forbiddenSubstrings: ["b n s s", "b n s", "b s a"],
    },
    {
      name: "Order 39 Rules 1 & 2 CPC",
      input: "Injunction sought under order thirty nine rule one and two of c p c",
      expectedSubstrings: ["Order XXXIX Rules 1 & 2", "CPC"],
      forbiddenSubstrings: ["order thirty nine", "c p c"],
    },
  ];

  let passed = 0;
  let failed = 0;
  const results: Array<{ name: string; success: boolean; output: string; error?: string }> = [];

  for (const test of testCases) {
    const { correctedText, corrections } = correctLegalSpeech(test.input);
    let success = true;
    let failureReason = "";

    for (const expected of test.expectedSubstrings) {
      if (!correctedText.includes(expected)) {
        success = false;
        failureReason = `Expected "${expected}" not found in output: "${correctedText}"`;
        break;
      }
    }

    if (success && test.forbiddenSubstrings) {
      for (const forbidden of test.forbiddenSubstrings) {
        if (correctedText.toLowerCase().includes(forbidden.toLowerCase())) {
          success = false;
          failureReason = `Forbidden string "${forbidden}" still present in output: "${correctedText}"`;
          break;
        }
      }
    }

    if (success) {
      passed++;
      results.push({ name: test.name, success: true, output: correctedText });
    } else {
      failed++;
      results.push({ name: test.name, success: false, output: correctedText, error: failureReason });
    }
  }

  return {
    total: testCases.length,
    passed,
    failed,
    results,
  };
}
