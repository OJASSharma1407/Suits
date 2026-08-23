"""Prompt templates for various AI features.

All prompts are centrally managed here per the documented architecture.
Application logic should reference these templates instead of hardcoding prompts.
"""

from typing import Any


def build_case_context(case_data: dict[str, Any]) -> str:
    """Build comprehensive case context string for AI prompts from case details data."""
    # Unwrap nested courtCaseData if present
    cdata = case_data.get("courtCaseData", case_data) if isinstance(case_data, dict) else {}
    if not isinstance(cdata, dict):
        cdata = {}

    parts = []

    cnr = cdata.get("cnr") or case_data.get("cnr", "Unknown")
    parts.append(f"**CNR:** {cnr}")

    case_num = cdata.get("caseNumber") or case_data.get("caseNumber")
    if case_num:
        parts.append(f"**Case Number:** {case_num}")

    pets = cdata.get("petitioners") or case_data.get("petitioners", [])
    resps = cdata.get("respondents") or case_data.get("respondents", [])
    if pets or resps:
        title = f"{pets[0] if pets else 'Unknown'} vs {resps[0] if resps else 'Unknown'}"
        parts.append(f"**Case Title:** {title}")

    status = cdata.get("caseStatus") or case_data.get("caseStatus", case_data.get("caseStatusLabel"))
    if status:
        parts.append(f"**Status:** {status}")

    disposal = cdata.get("disposalType") or cdata.get("disposalTypeRaw") or case_data.get("disposal_type")
    if disposal:
        parts.append(f"**Disposal Nature:** {disposal}")

    case_type = cdata.get("caseType") or cdata.get("caseTypeLabel") or case_data.get("caseType")
    if case_type:
        parts.append(f"**Case Type:** {case_type}")

    court = cdata.get("courtName") or case_data.get("courtName")
    if court:
        parts.append(f"**Court:** {court}")

    filing = cdata.get("filingDate") or case_data.get("filingDate")
    if filing:
        parts.append(f"**Filing Date:** {filing}")

    decision = cdata.get("decisionDate") or case_data.get("decisionDate")
    if decision:
        parts.append(f"**Decision Date:** {decision}")

    next_hearing = cdata.get("nextHearingDate") or case_data.get("nextHearingDate")
    if next_hearing:
        parts.append(f"**Next Hearing:** {next_hearing}")

    judges = cdata.get("judges") or case_data.get("judges", [])
    if judges:
        parts.append(f"**Judges:** {', '.join(str(j) for j in judges if j)}")

    if pets:
        parts.append(f"**Petitioners:** {', '.join(str(p) for p in pets if p)}")
    if resps:
        parts.append(f"**Respondents:** {', '.join(str(r) for r in resps if r)}")

    fir = cdata.get("firDetails") or case_data.get("fir_details")
    if isinstance(fir, dict) and fir:
        parts.append(f"**FIR Details:** FIR No. {fir.get('caseNumber', '')}, PS: {fir.get('policeStation', '')}, Year: {fir.get('year', '')}")

    acts = cdata.get("actsAndSections") or case_data.get("actsAndSections", [])
    if acts:
        parts.append(f"**Acts & Sections:** {', '.join(str(a) for a in acts if a)}")

    # Add brief summary of recent proceedings/hearings if available
    hearings = cdata.get("historyOfCaseHearings") or cdata.get("hearingHistory") or case_data.get("hearings", [])
    if isinstance(hearings, list) and hearings:
        recent = hearings[-4:]  # Last 4 hearings
        h_lines = []
        for h in recent:
            if isinstance(h, dict):
                h_date = h.get("hearingDate") or h.get("businessOnDate") or h.get("date")
                h_purp = h.get("purposeOfListing") or h.get("purpose") or "Listed"
                h_judge = h.get("judge") or ""
                h_lines.append(f"  - {h_date}: {h_purp}{f' (Before {h_judge})' if h_judge else ''}")
        if h_lines:
            parts.append("**Recent Hearing Stages:**\n" + "\n".join(h_lines))

    return "\n".join(parts)


# Prompt ID: SUITS-SUMMARY-001
CASE_SUMMARY_TEMPLATE = """Based on the case information provided, generate a concise overview including:
- Background
- Current Status
- Key Parties
- Important Dates
- Next Hearing
- One-paragraph summary

Case Context:
{case_context}
"""

# Prompt ID: SUITS-ORDER-001
ORDER_SUMMARY_TEMPLATE = """Summarize the following court order:
- Purpose of the Order
- Key Decisions
- Legal Issues Addressed
- Important Directions
- Practical Meaning for the parties

Order Content:
{order_content}
"""

# Prompt ID: SUITS-BRIEF-001
CASE_BRIEF_TEMPLATE = """Generate a comprehensive case brief with the following sections:
1. **Facts** - Key factual background
2. **Issues** - Legal questions before the court
3. **Arguments** - Key arguments from both sides
4. **Court Reasoning** - How the court analyzed the issues
5. **Decision** - The court's ruling
6. **Key Takeaways** - Important implications

Case Context:
{case_context}

Order Analysis:
{order_context}
"""

# Prompt ID: SUITS-EXPLAIN-001
PLAIN_LANGUAGE_TEMPLATE = """Explain the following legal information in simple, everyday language that a non-lawyer can understand. Avoid legal jargon where possible.

Content to explain:
{content}
"""

# Prompt ID: SUITS-TIMELINE-001
TIMELINE_TEMPLATE = """Generate a chronological timeline of this case including:
- Filing date
- All hearings
- All orders
- Judgments
- Current status

Present as a clean timeline with dates and brief descriptions.

Case Context:
{case_context}
"""

# Prompt ID: SUITS-SUGGEST-001
SUGGESTED_QUESTIONS_TEMPLATE = """Based on the current case context, generate 4-6 relevant follow-up questions that a user might want to ask. Questions should be:
- Specific to the case
- Useful for legal research
- Clear and concise

Case Context:
{case_context}
"""
