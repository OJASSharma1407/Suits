"""Counter-Pleading & Written Statement Generator Service.

Implements the Adversarial Defense Engine under Order VIII CPC:
1. Deterministic paragraph chunking of plaints/petitions (0 AI tokens)
2. Deterministic statutory bar detection (Sec 12A CCA, Limitation, Order 7 Rule 11) (0 AI tokens)
3. Hybrid traversal dispatcher (Boilerplate templates + AI synthesis for substantive allegations)
4. Court-ready HTML assembly directly injectable into LegalEditor.tsx.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

import structlog

from app.clients.gemini_client import gemini_client
from app.prompts.counter_pleading_prompts import (
    COUNTER_PLEADING_SYSTEM_PROMPT,
    build_preliminary_submissions_prompt,
    build_substantive_traversals_prompt,
)
from app.schemas.counter_pleading import (
    AnalyzePlaintResponse,
    GenerateWrittenStatementRequest,
    PlaintParagraph,
    StatutoryBar,
    TraverseItem,
    WrittenStatementResponse,
)
from app.services.ai_orchestrator import AIOrchestrator

logger = structlog.get_logger()

# Regex to match numbered paragraphs in Indian court pleadings:
# Matches "1.", "2.", "(1)", "(2)", "1 )", "Paragraph 1:", "Para 1."
PARA_PATTERN = re.compile(
    r"(?:^|\n)\s*(?:(?:Paragraph|Para)\s+(\d+)[:\.]?|(\d+)\s*[\.\)]|\((\d+)\))\s+([\s\S]+?)(?=(?:\n\s*(?:(?:Paragraph|Para)\s+\d+[:\.]?|\d+\s*[\.\)]|\(\d+\)))|\Z)",
    re.MULTILINE,
)

FORMAL_TOPIC_KEYWORDS = {
    "Parties & Status": ["plaintiff is", "defendant is", "registered office", "carrying on business", "residing at", "incorporated under"],
    "Jurisdiction": ["territorial jurisdiction", "pecuniary jurisdiction", "jurisdiction of this court", "resides within", "branch office within"],
    "Cause of Action": ["cause of action arose", "cause of action firstly", "cause of action subsequently", "survives"],
    "Court Fees & Valuation": ["valued for the purpose", "court fee", "valuation", "ad valorem", "jurisdiction and court fee"],
}

SUBSTANTIVE_KEYWORDS = [
    "breach", "failed to", "defaulted", "liability", "damages", "dues", "invoice", "payment",
    "agreement", "contract", "fraud", "misrepresentation", "loss", "cheated", "demand notice",
    "undertaking", "outstanding", "interest", "penalty", "illegal", "unauthorized",
]


class CounterPleadingService:
    """Core service for the Adversarial Defense Engine."""

    def __init__(self) -> None:
        self.orchestrator = AIOrchestrator()

    # ------------------------------------------------------------------ #
    #  Paragraph Chunking & Classification                               #
    # ------------------------------------------------------------------ #

    def chunk_plaint_paragraphs(self, raw_text: str) -> list[PlaintParagraph]:
        """Split raw plaint text into discrete numbered paragraphs using regex."""
        cleaned = raw_text.replace("\r\n", "\n").strip()
        matches = list(PARA_PATTERN.finditer(cleaned))
        paragraphs: list[PlaintParagraph] = []

        if matches:
            for idx, m in enumerate(matches, 1):
                num_str = m.group(1) or m.group(2) or m.group(3)
                para_num = int(num_str) if num_str and num_str.isdigit() else idx
                body = m.group(4).strip()
                if not body:
                    continue

                topic, is_substantive = self._classify_paragraph(body)
                paragraphs.append(
                    PlaintParagraph(
                        para_number=para_num,
                        text=body,
                        is_substantive=is_substantive,
                        detected_topic=topic,
                    )
                )
        else:
            # Fallback: split by double newlines if no numbered pattern found
            blocks = [b.strip() for b in cleaned.split("\n\n") if len(b.strip()) > 30]
            for idx, block in enumerate(blocks, 1):
                topic, is_substantive = self._classify_paragraph(block)
                paragraphs.append(
                    PlaintParagraph(
                        para_number=idx,
                        text=block,
                        is_substantive=is_substantive,
                        detected_topic=topic,
                    )
                )

        return paragraphs

    def _classify_paragraph(self, text: str) -> tuple[str, bool]:
        """Classify paragraph into formal (boilerplate) vs substantive allegation."""
        lower = text.lower()

        for topic, kws in FORMAL_TOPIC_KEYWORDS.items():
            if any(kw in lower for kw in kws):
                return topic, False

        for kw in SUBSTANTIVE_KEYWORDS:
            if kw in lower:
                return "Substantive Allegation", True

        return "Factual Statement", True

    # ------------------------------------------------------------------ #
    #  Deterministic Statutory Bar Detection                             #
    # ------------------------------------------------------------------ #

    def detect_statutory_bars(
        self, raw_text: str, paragraphs: list[PlaintParagraph]
    ) -> list[StatutoryBar]:
        """Run deterministic rule engine to detect threshold legal bars under Indian law."""
        bars: list[StatutoryBar] = []
        lower = raw_text.lower()

        # 1. Section 12A Commercial Courts Act, 2015 (Patil Automation)
        is_commercial = any(
            kw in lower
            for kw in ["commercial suit", "cs (comm)", "cs(comm)", "commercial court", "commercial dispute"]
        )
        has_urgent_interim = any(
            kw in lower
            for kw in ["urgent interim relief", "ex-parte ad-interim", "ex parte interim", "section 12a(1)"]
        )
        has_mediation_pleaded = "pre-institution mediation" in lower or "mediation" in lower

        if is_commercial and not (has_urgent_interim or has_mediation_pleaded):
            bars.append(
                StatutoryBar(
                    bar_id="sec_12a_cca",
                    title="Section 12A Commercial Courts Act (Non-Compliance)",
                    statute="Section 12A, Commercial Courts Act, 2015",
                    precedent="Patil Automation Pvt. Ltd. v. Rakheja Engineers Pvt. Ltd., (2022) 10 SCC 1",
                    description=(
                        "Mandatory pre-institution mediation was not exhausted prior to filing this commercial suit, "
                        "and no urgent interim relief was contemplated or granted."
                    ),
                    suggested_objection_text=(
                        "That the present suit is barred under Section 12A of the Commercial Courts Act, 2015 and is liable "
                        "to be rejected at the threshold under Order VII Rule 11 CPC. The Plaintiff has failed to exhaust mandatory "
                        "Pre-Institution Mediation as authoritatively held by the Hon'ble Supreme Court in Patil Automation (2022)."
                    ),
                    is_selected=True,
                )
            )

        # 2. Order VII Rule 11(a) CPC - Absence of Cause of Action
        coa_para = next(
            (p for p in paragraphs if "cause of action" in p.text.lower()), None
        )
        if coa_para and len(coa_para.text.split()) < 25:
            bars.append(
                StatutoryBar(
                    bar_id="o7_r11_no_coa",
                    title="Order VII Rule 11(a) CPC (No Cause of Action Disclosed)",
                    statute="Order VII Rule 11(a), Code of Civil Procedure, 1908",
                    precedent="Dahiben v. Arvindbhai Kalyanji Bhanusali, (2020) 7 SCC 366",
                    description="The cause of action paragraph is illusory, vague, and fails to establish a clear bundle of actionable facts.",
                    suggested_objection_text=(
                        "That the Plaint does not disclose any subsisting, actionable cause of action against the answering Defendant. "
                        "The averments in the Plaint constitute an illusory cause of action created by clever drafting, which is liable "
                        "to be rejected under Order VII Rule 11(a) CPC in terms of Dahiben (2020) and T. Arivandandam (1977)."
                    ),
                    is_selected=True,
                )
            )

        # 3. Bar of Limitation (Limitation Act, 1963)
        # Scan for years in text (e.g. 2018, 2019, 2020)
        current_year = datetime.now().year
        year_matches = [
            int(y) for y in re.findall(r"\b(20[0-2][0-9]|199[0-9])\b", lower)
        ]
        earliest_dispute_year = min(year_matches) if year_matches else None

        if earliest_dispute_year and (current_year - earliest_dispute_year) > 3:
            bars.append(
                StatutoryBar(
                    bar_id="limitation_act_bar",
                    title=f"Bar of Limitation (Limitation Act, 1963 — Dispute Origin {earliest_dispute_year})",
                    statute="Section 3 read with Articles 54/55/113, Limitation Act, 1963",
                    precedent="State of Punjab v. Gurdev Singh, (1991) 4 SCC 1",
                    description=f"The alleged grievance/transactions date back to {earliest_dispute_year}, exceeding the 3-year statutory period.",
                    suggested_objection_text=(
                        f"That the present suit is ex-facie barred by the law of limitation. The transactions and causes of action alleged "
                        f"by the Plaintiff arose in/around {earliest_dispute_year}, well beyond the prescribed 3-year period under the Limitation Act, 1963. "
                        "Under Section 3 of the Limitation Act, this Hon'ble Court is bound to dismiss the suit at the threshold."
                    ),
                    is_selected=True,
                )
            )

        # 4. Lack of Territorial Jurisdiction (Section 20 CPC)
        juris_para = next(
            (p for p in paragraphs if "territorial" in p.text.lower() or "jurisdiction" in p.text.lower()),
            None,
        )
        if juris_para:
            bars.append(
                StatutoryBar(
                    bar_id="territorial_jurisdiction",
                    title="Lack of Territorial Jurisdiction (Section 20 CPC)",
                    statute="Section 20, Code of Civil Procedure, 1908",
                    precedent="ABC Laminart Pvt. Ltd. v. A.P. Agencies, (1989) 2 SCC 163",
                    description="No part of the cause of action arose within the territorial limits of this Hon'ble Court.",
                    suggested_objection_text=(
                        "That this Hon'ble Court lacks territorial jurisdiction to try the present suit. Neither does the Defendant reside "
                        "or carry on business within the local limits of this Court, nor did any material part of the cause of action arise herein."
                    ),
                    is_selected=False,  # Optional by default
                )
            )

        # 5. Order VII Rule 11(b)/(c) CPC - Valuation & Deficient Court Fees
        fee_para = next(
            (p for p in paragraphs if "court fee" in p.text.lower() or "valuation" in p.text.lower()),
            None,
        )
        if fee_para:
            bars.append(
                StatutoryBar(
                    bar_id="valuation_court_fees",
                    title="Undervaluation & Deficient Court Fees (Order VII Rule 11(b)/(c) CPC)",
                    statute="Order VII Rule 11(b)/(c) CPC read with Court Fees Act, 1870",
                    precedent="Tara Devi v. Sri Thakur Radha Krishna Maharaj, (1987) 4 SCC 69",
                    description="The suit has been arbitrarily undervalued and deficient court fees have been paid.",
                    suggested_objection_text=(
                        "That the suit has not been properly valued for the purposes of court fees and jurisdiction. The Plaintiff has "
                        "arbitrarily undervalued the relief claimed to evade requisite ad-valorem court fees under the Court Fees Act, 1870."
                    ),
                    is_selected=False,
                )
            )

        # 6. Arbitration Agreement Bar (Section 8 Arbitration Act)
        if "arbitration" in lower or "arbitrator" in lower:
            bars.append(
                StatutoryBar(
                    bar_id="sec_8_arbitration_bar",
                    title="Existence of Arbitration Agreement (Section 8 Arbitration Act)",
                    statute="Section 8, Arbitration and Conciliation Act, 1996",
                    precedent="P. Anand Gajapathi Raju v. P.V.G. Raju, (2000) 4 SCC 539",
                    description="The dispute arises out of an agreement containing a valid arbitration clause.",
                    suggested_objection_text=(
                        "That the subject matter of the present suit is governed by an arbitration agreement between the parties. "
                        "In terms of Section 8 of the Arbitration & Conciliation Act, 1996, the parties must be referred to arbitration."
                    ),
                    is_selected=True,
                )
            )

        return bars

    # ------------------------------------------------------------------ #
    #  Plaint Structure Analysis (Cause Title & Parties Extraction)       #
    # ------------------------------------------------------------------ #

    def analyze_plaint(
        self, raw_text: str, plaint_title: str | None = None
    ) -> AnalyzePlaintResponse:
        """Analyze raw plaint text and return structured response."""
        paragraphs = self.chunk_plaint_paragraphs(raw_text)
        detected_bars = self.detect_statutory_bars(raw_text, paragraphs)

        court_name = "IN THE COURT OF THE DISTRICT JUDGE, COMMERCIAL DIVISION"
        suit_number = "CS (COMM) NO. ______ OF 2026"
        plaintiff = "PLAINTIFF"
        defendant = "DEFENDANT"

        # Simple extraction heuristics for Cause Title
        first_500 = raw_text[:1200]
        court_match = re.search(
            r"(IN THE (?:HIGH COURT|COURT OF [^\n]+))", first_500, re.IGNORECASE
        )
        if court_match:
            court_name = court_match.group(1).strip().upper()

        suit_match = re.search(
            r"((?:CS|SUIT|WRIT PETITION|O\.M\.P\.)[^\n]+OF\s+\d{4})",
            first_500,
            re.IGNORECASE,
        )
        if suit_match:
            suit_number = suit_match.group(1).strip()

        vs_match = re.search(r"([\s\S]+?)\s+(?:VERSUS|VS\.?|V/S)\s+([\s\S]+)", first_500, re.IGNORECASE)
        if vs_match:
            p_cand = vs_match.group(1).split("\n")[-1].strip()
            d_cand = vs_match.group(2).split("\n")[0].strip()
            if len(p_cand) > 3 and len(p_cand) < 80:
                plaintiff = p_cand.strip(" .:-")
            if len(d_cand) > 3 and len(d_cand) < 80:
                defendant = d_cand.strip(" .:-")

        substantive_count = sum(1 for p in paragraphs if p.is_substantive)

        return AnalyzePlaintResponse(
            court_name=court_name,
            suit_number=suit_number,
            plaintiff=plaintiff,
            defendant=defendant,
            paragraphs=paragraphs,
            detected_bars=detected_bars,
            total_paragraphs=len(paragraphs),
            substantive_count=substantive_count,
        )

    # ------------------------------------------------------------------ #
    #  Boilerplate Traversal Templates (0 AI Tokens)                     #
    # ------------------------------------------------------------------ #

    def _generate_boilerplate_traverse(
        self, para_num: int, topic: str, text: str
    ) -> str:
        """Generate formal traversal without spending AI tokens."""
        if topic == "Parties & Status":
            return (
                f"With respect to paragraph {para_num} of the Plaint, the contents thereof are matter of record "
                f"and need no response, save and except what is specifically admitted herein. It is specifically denied "
                f"that the Plaintiff is entitled to maintain the present suit or that the Defendant has any subsisting "
                f"liability toward the Plaintiff."
            )
        elif topic == "Jurisdiction":
            return (
                f"With respect to paragraph {para_num} of the Plaint, the contents thereof are denied in toto as false, "
                f"misconceived, and baseless. It is vehemently denied that this Hon'ble Court has territorial or pecuniary "
                f"jurisdiction to entertain or try the present suit. The cause of action, if any, arose wholly outside the "
                f"territorial limits of this Hon'ble Court, and the suit is liable to be returned/dismissed."
            )
        elif topic == "Court Fees & Valuation":
            return (
                f"With respect to paragraph {para_num} of the Plaint, the contents are denied as wrong and untenable. "
                f"It is denied that the suit has been properly valued for the purpose of court fees and jurisdiction. "
                f"The Plaintiff has deliberately undervalued the relief claimed and affixed deficient court fees in "
                f"violation of the Court Fees Act, 1870."
            )
        elif topic == "Cause of Action":
            return (
                f"With respect to paragraph {para_num} of the Plaint, the contents thereof are denied in toto as illusory, "
                f"fabricated, and concocted. It is emphatically denied that any cause of action has ever arisen in favour of the "
                f"Plaintiff and against the answering Defendant, either on the dates alleged or at any point of time whatsoever. "
                f"The suit is devoid of any cause of action and is liable to be rejected under Order VII Rule 11 CPC."
            )
        else:
            return (
                f"With respect to paragraph {para_num} of the Plaint, the contents thereof are denied as false, misconceived, "
                f"and contrary to record. Save and except what is matter of record, each and every allegation, contention, and "
                f"insinuation contained therein is denied in toto. The Plaintiff is put to the strictest proof thereof."
            )

    # ------------------------------------------------------------------ #
    #  Hybrid Traversal Synthesis (AI API for substantive paras)         #
    # ------------------------------------------------------------------ #

    async def generate_written_statement(
        self, req: GenerateWrittenStatementRequest
    ) -> WrittenStatementResponse:
        """Synthesize full court-ready Written Statement using hybrid pipeline."""
        traversals: list[TraverseItem] = []

        substantive_paras = [p for p in req.paragraphs if p.is_substantive]
        formal_paras = [p for p in req.paragraphs if not p.is_substantive]

        # 1. Process formal paras with templates (0 AI tokens)
        formal_traversals = [
            TraverseItem(
                para_number=p.para_number,
                allegation_summary=f"Formal averment regarding {p.detected_topic}.",
                traverse_text=self._generate_boilerplate_traverse(
                    p.para_number, p.detected_topic, p.text
                ),
                is_ai_generated=False,
            )
            for p in formal_paras
        ]

        # 2. Process substantive paras with AI Orchestrator
        ai_traversals: list[TraverseItem] = []
        if substantive_paras:
            try:
                # Prepare payload for AI
                paras_payload = [
                    {"para_number": p.para_number, "text": p.text[:800]}
                    for p in substantive_paras
                ]
                user_prompt = build_substantive_traversals_prompt(
                    paragraphs=paras_payload,
                    strategy=req.defense_strategy,
                    advocate_notes=req.advocate_notes,
                )

                ai_res = await self.orchestrator.generate_json(
                    system_prompt=COUNTER_PLEADING_SYSTEM_PROMPT,
                    user_prompt=user_prompt,
                    temperature=0.1,
                    max_tokens=4000,
                )

                items = ai_res.get("traversals", [])
                for item in items:
                    p_num = item.get("para_number", 0)
                    ai_traversals.append(
                        TraverseItem(
                            para_number=p_num,
                            allegation_summary=item.get("allegation_summary", "Allegation traversed."),
                            traverse_text=item.get(
                                "traverse_text",
                                f"With respect to paragraph {p_num}, the contents are denied in toto.",
                            ),
                            is_ai_generated=True,
                        )
                    )
            except Exception as exc:
                logger.warning("ai_traversal_generation_fallback", error=str(exc))
                # Robust programmatic fallback if AI API fails or runs out of credits
                for p in substantive_paras:
                    ai_traversals.append(
                        TraverseItem(
                            para_number=p.para_number,
                            allegation_summary=f"Substantive allegation in paragraph {p.para_number}.",
                            traverse_text=(
                                f"With respect to paragraph {p.para_number} of the Plaint, the contents thereof are vehemently "
                                f"denied as false, misconceived, contrary to record, and misleading. It is emphatically denied that "
                                f"the Defendant has breached any contractual terms or defaulted on any obligations as alleged. "
                                f"The Plaintiff has approached this Hon'ble Court with unclean hands, having suppressed material facts. "
                                f"The Plaintiff is put to the strictest proof of each and every assertion contained therein."
                            ),
                            is_ai_generated=False,
                        )
                    )

        # Merge and sort all traversals by paragraph number
        all_traversals = sorted(
            formal_traversals + ai_traversals, key=lambda x: x.para_number
        )

        # 3. Generate Preliminary Submissions (Narrative Section II)
        preliminary_submissions = await self._generate_preliminary_submissions(req)

        # 4. Compile into Court-Ready HTML
        return self._assemble_court_document(
            req=req,
            traversals=all_traversals,
            preliminary_submissions=preliminary_submissions,
        )

    async def _generate_preliminary_submissions(
        self, req: GenerateWrittenStatementRequest
    ) -> list[str]:
        """Synthesize Section II (Preliminary Submissions / True Facts)."""
        summary_text = "\n".join(
            f"Para {p.para_number}: {p.text[:150]}..." for p in req.paragraphs[:6]
        )
        try:
            prompt = build_preliminary_submissions_prompt(
                court_name=req.court_name,
                suit_number=req.suit_number,
                plaintiff=req.plaintiff,
                defendant=req.defendant,
                paragraphs_summary=summary_text,
                strategy=req.defense_strategy,
                advocate_notes=req.advocate_notes,
            )
            res = await self.orchestrator.generate_json(
                system_prompt=COUNTER_PLEADING_SYSTEM_PROMPT,
                user_prompt=prompt,
                temperature=0.1,
                max_tokens=2048,
            )
            subs = res.get("preliminary_submissions", [])
            if subs and isinstance(subs, list):
                return subs
        except Exception as exc:
            logger.warning("preliminary_submissions_ai_fallback", error=str(exc))

        # Fallback
        return [
            (
                "1. That at the threshold, it is submitted that the present suit is a flagrant abuse of the process of this Hon'ble Court, "
                "instituted with the oblique motive of coercing and harassing the answering Defendant into submitting to illegitimate demands."
            ),
            (
                "2. That the true and correct facts giving rise to the dispute have been deliberately concealed by the Plaintiff. The Plaintiff "
                "has failed to come with clean hands and is guilty of suppressio veri and suggestio falsi, thereby disentitling itself to any relief."
            ),
            (
                "3. That the answering Defendant has at all material times acted with utmost bona fides, in strict adherence to all statutory "
                "and contractual obligations, and owes no legal or equitable liability whatsoever to the Plaintiff."
            ),
        ]

    # ------------------------------------------------------------------ #
    #  Assembly into Court-Ready HTML for LegalEditor                    #
    # ------------------------------------------------------------------ #

    def _assemble_court_document(
        self,
        req: GenerateWrittenStatementRequest,
        traversals: list[TraverseItem],
        preliminary_submissions: list[str],
    ) -> WrittenStatementResponse:
        """Assemble structured sections and compiled HTML matching LegalEditor standards."""

        # Cause Title HTML
        cause_title_html = f"""
<div style="text-align: center; font-weight: bold; margin-bottom: 20px;">
  <p style="margin: 0; font-size: 1.15em; letter-spacing: 0.04em;">{req.court_name}</p>
  <p style="margin: 10px 0 0 0; font-size: 1.05em;">{req.suit_number}</p>
</div>
<div style="margin-bottom: 14px;">
  <p style="margin: 0; font-weight: bold;">IN THE MATTER OF:</p>
</div>
<div style="margin-bottom: 20px;">
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
    <tr>
      <td style="vertical-align: top; width: 75%;">
        <b>{req.plaintiff}</b>
      </td>
      <td style="vertical-align: bottom; text-align: right; width: 25%;">
        <b>...PLAINTIFF</b>
      </td>
    </tr>
    <tr>
      <td colspan="2" style="text-align: center; padding: 8px 0; font-weight: bold; letter-spacing: 0.1em;">
        VERSUS
      </td>
    </tr>
    <tr>
      <td style="vertical-align: top; width: 75%;">
        <b>{req.defendant}</b>
      </td>
      <td style="vertical-align: bottom; text-align: right; width: 25%;">
        <b>...DEFENDANT</b>
      </td>
    </tr>
  </table>
</div>
<div style="text-align: center; margin: 24px 0 16px 0; font-weight: bold; letter-spacing: 0.05em;">
  <u>WRITTEN STATEMENT ON BEHALF OF THE DEFENDANT UNDER ORDER VIII RULE 1 CPC</u>
</div>
<p style="text-align: justify; margin-bottom: 16px;">
  <b>MOST RESPECTFULLY SHEWETH:</b>
</p>
"""

        # Preliminary Objections HTML
        objections_html = """
<div style="text-align: center; margin: 24px 0 14px 0; font-weight: bold; letter-spacing: 0.05em;">
  <u>I. PRELIMINARY OBJECTIONS</u>
</div>
"""
        selected_bars = [b for b in req.selected_bars if b.is_selected]
        if selected_bars:
            for idx, bar in enumerate(selected_bars, 1):
                objections_html += f"""
<p style="margin-bottom: 12px; text-align: justify;">
  <b>{idx}. {bar.title.upper()}</b><br/>
  {bar.suggested_objection_text}
  <br/><span style="font-size: 0.9em; font-style: italic;">[Statutory Authority: {bar.statute} | Precedent: {bar.precedent}]</span>
</p>
"""
        else:
            objections_html += """
<p style="margin-bottom: 12px; text-align: justify;">
  <b>1.</b> That the present suit is an abuse of the judicial process, lacks any cause of action, and is liable to be dismissed with exemplary costs.
</p>
"""

        # Preliminary Submissions HTML
        submissions_html = """
<div style="text-align: center; margin: 24px 0 14px 0; font-weight: bold; letter-spacing: 0.05em;">
  <u>II. PRELIMINARY SUBMISSIONS / BRIEF FACTS</u>
</div>
"""
        for sub in preliminary_submissions:
            submissions_html += f"""
<p style="text-indent: 40px; margin-bottom: 12px; text-align: justify;">
  {sub}
</p>
"""

        # Para-wise Reply HTML
        reply_html = """
<div style="text-align: center; margin: 26px 0 14px 0; font-weight: bold; letter-spacing: 0.05em;">
  <u>III. PARA-WISE REPLY</u>
</div>
"""
        for t in traversals:
            reply_html += f"""
<p style="text-indent: 40px; margin-bottom: 12px; text-align: justify;">
  <b>{t.para_number}.</b> {t.traverse_text}
</p>
"""

        # Prayer HTML
        prayer_html = """
<div style="text-align: center; margin: 26px 0 14px 0; font-weight: bold; letter-spacing: 0.05em;">
  <u>PRAYER</u>
</div>
<p style="text-align: justify; margin-bottom: 14px;">
  Wherefore, in the light of the preliminary objections, true facts, and submissions stated hereinabove, it is most respectfully prayed that this Hon'ble Court may graciously be pleased to:
</p>
<p style="margin-left: 30px; margin-bottom: 10px; text-align: justify;">
  <b>(a)</b> Dismiss the present suit of the Plaintiff with exemplary costs under Section 35A of the Code of Civil Procedure, 1908; and
</p>
<p style="margin-left: 30px; margin-bottom: 10px; text-align: justify;">
  <b>(b)</b> Reject the Plaint under Order VII Rule 11 CPC in terms of the preliminary objections raised herein; and
</p>
<p style="margin-left: 30px; margin-bottom: 14px; text-align: justify;">
  <b>(c)</b> Pass such other or further order(s) as this Hon'ble Court may deem fit and proper in the interest of justice and equity.
</p>
<div style="text-align: center; margin: 20px 0; font-weight: bold; font-size: 0.95em;">
  AND FOR THIS ACT OF KINDNESS, THE DEFENDANT SHALL AS IN DUTY BOUND EVER PRAY.
</div>
"""

        # Verification HTML
        verification_html = f"""
<div style="text-align: center; margin: 26px 0 14px 0; font-weight: bold; letter-spacing: 0.05em;">
  <u>VERIFICATION</u>
</div>
<p style="text-align: justify; margin-bottom: 14px; text-indent: 40px;">
  Verified at New Delhi on this day of 2026, that the contents of paragraphs 1 to {len(traversals)} of the preliminary submissions and para-wise reply are true and correct to my knowledge derived from the records maintained by the Defendant and believed to be true, and the submissions in the preliminary objections and prayer are based on legal advice received and believed to be correct. No part of it is false and nothing material has been concealed therefrom.
</p>
<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div>
    <b>FILED BY:</b><br/>
    ADVOCATE FOR THE DEFENDANT<br/>
    Enrolment No.: D/______/2015
  </div>
  <div style="text-align: right;">
    <b>DEFENDANT</b><br/>
    Through Authorized Signatory
  </div>
</div>
"""

        full_draft = (
            cause_title_html
            + objections_html
            + submissions_html
            + reply_html
            + prayer_html
            + verification_html
        )

        title = f"Written Statement — {req.suit_number}"

        return WrittenStatementResponse(
            title=title,
            cause_title_html=cause_title_html,
            preliminary_objections_html=objections_html,
            preliminary_submissions_html=submissions_html,
            para_wise_reply_html=reply_html,
            prayer_html=prayer_html,
            verification_html=verification_html,
            full_draft_html=full_draft,
            traversals=traversals,
        )


counter_pleading_service = CounterPleadingService()
