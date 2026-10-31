"""Specialized prompts for Indian court counter-pleadings and Written Statements under Order VIII CPC."""

COUNTER_PLEADING_SYSTEM_PROMPT = """You are an eminent Indian Senior Advocate and Master Pleader with deep expertise in the Civil Procedure Code, 1908 (CPC), the Commercial Courts Act, 2015, and Original Side High Court practice.

You are drafting an adversarial Written Statement / Counter-Affidavit on behalf of the Defendant in response to an opposing Plaint or Writ Petition.

CRITICAL STATUTORY MANDATES (Order VIII CPC):
1. Order VIII Rule 3 CPC: Denials must be specific. General, vague, or umbrella denials are not permissible in law.
2. Order VIII Rule 4 CPC: Evasive denials are prohibited. You must answer the point of substance. If an allegation involves monetary sums, dates, or delivery, you must specifically traverse that fact.
3. Order VIII Rule 5 CPC: Every allegation of fact in the plaint, if not denied specifically or by necessary implication, shall be taken to be admitted against the Defendant.
4. Standard Indian Court Terminology:
   - "With respect to paragraph X, the contents thereof are vehemently denied as false, misconceived, contrary to record, and misleading."
   - "The Plaintiff has approached this Hon'ble Court with unclean hands and is guilty of suppressio veri and suggestio falsi."
   - "The Plaintiff is put to the strictest proof of each and every allegation contained in paragraph X."
   - "Save and except what is specifically admitted herein, each and every allegation, averment, and contention is denied in toto."

You must return valid, well-formed JSON matching the specified schema with NO markdown code-block wrappers or preamble.
"""

def build_substantive_traversals_prompt(
    paragraphs: list[dict],
    strategy: str,
    advocate_notes: str | None = None,
) -> str:
    """Prompt to generate adversarial paragraph-by-paragraph traverses for substantive allegations."""
    strategy_instructions = {
        "aggressive_denial": (
            "Aggressive Denial: Vehemently traverse all factual assertions. Plead suppression of material facts, "
            "deny any breach or liability, assert that the claim is frivolous and vexatious, and put the Plaintiff to strict proof."
        ),
        "demurrer": (
            "Demurrer / Legal Challenge: While denying liability, highlight that even if the statements are taken on face value, "
            "no actionable legal wrong or cause of action is disclosed, and the suit is legally unsustainable."
        ),
        "counter_claim": (
            "Counter-Claim Foundation: Traverse the allegations while asserting that the Plaintiff was in breach of reciprocal promises, "
            "laying down the foundation for damages, set-off, and counter-claims."
        ),
    }.get(strategy, "Aggressive Denial")

    paras_formatted = "\n\n".join(
        f"--- Paragraph {p['para_number']} ---\n{p['text']}"
        for p in paragraphs
    )

    notes_section = f"\nADVOCATE'S FACTUAL INSTRUCTIONS / DEFENSE NOTES:\n{advocate_notes}\n" if advocate_notes else ""

    return f"""TASK: Draft an adversarial, paragraph-by-paragraph traverse (Written Statement reply) under Order VIII Rule 5 CPC for the following substantive paragraphs of the Plaint.

DEFENSE STRATEGY:
{strategy_instructions}
{notes_section}
PLAINT PARAGRAPHS TO TRAVERSE:
{paras_formatted}

INSTRUCTIONS:
1. For each paragraph, provide:
   - "para_number": the integer number.
   - "allegation_summary": a 1-sentence summary of what the Plaintiff is alleging.
   - "traverse_text": a formal, adversarial court-ready paragraph in Indian legal style starting with "With respect to paragraph {para_number} of the Plaint, the contents thereof are denied as false, misconceived, and contrary to record..." followed by substantive rebuttal.

OUTPUT FORMAT:
Return a JSON object with a single key "traversals" containing an array of objects:
{{
  "traversals": [
    {{
      "para_number": 3,
      "allegation_summary": "Plaintiff claims non-payment of invoice dated 10.05.2023.",
      "traverse_text": "With respect to paragraph 3 of the Plaint, the contents thereof are vehemently denied as false, misconceived, and contrary to record. It is denied that the Defendant is liable to pay the alleged sum of Rs. ... The Plaintiff has deliberately suppressed that the goods supplied were substandard and rejected vide communication dated ... The Plaintiff is put to the strictest proof thereof."
    }}
  ]
}}
"""

def build_preliminary_submissions_prompt(
    court_name: str,
    suit_number: str,
    plaintiff: str,
    defendant: str,
    paragraphs_summary: str,
    strategy: str,
    advocate_notes: str | None = None,
) -> str:
    """Prompt to synthesize a coherent narrative for Section II: Preliminary Submissions / True Facts."""
    notes_section = f"\nADVOCATE'S FACTUAL NOTES:\n{advocate_notes}\n" if advocate_notes else ""

    return f"""TASK: Draft Section II ('PRELIMINARY SUBMISSIONS / BRIEF TRUE FACTS') of a Written Statement on behalf of the Defendant.

CASE DETAILS:
- Court: {court_name}
- Suit Number: {suit_number}
- Plaintiff: {plaintiff}
- Defendant: {defendant}
- Nature of Dispute Summary:
{paragraphs_summary}
- Strategy: {strategy}
{notes_section}

INSTRUCTIONS:
Draft 3 to 4 numbered paragraphs under 'PRELIMINARY SUBMISSIONS' setting out the Defendant's case in chronological, formal Indian pleading language.
The narrative must establish:
1. The bona fides and impeccable standing of the Defendant.
2. The real genesis of the transaction and how the Plaintiff committed prior breach or acted dishonestly.
3. Why the Plaintiff is not entitled to any equitable or monetary relief from this Hon'ble Court.

OUTPUT FORMAT:
Return a JSON object:
{{
  "preliminary_submissions": [
    "1. That at the outset, it is submitted that the present suit is a classic abuse of the process of law...",
    "2. That the true and correct facts giving rise to the present matter are that...",
    "3. That the Plaintiff has conveniently suppressed the critical correspondence dated..."
  ]
}}
"""
