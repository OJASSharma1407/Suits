"""Prompt templates for various AI features.

All prompts are centrally managed here per the documented architecture.
Application logic should reference these templates instead of hardcoding prompts.
"""

from typing import Any


def build_case_context(case_data: dict[str, Any]) -> str:
    """Build case context string for AI prompts from case details data."""
    parts = []

    cnr = case_data.get("cnr", "Unknown")
    parts.append(f"**CNR:** {cnr}")

    pets = case_data.get("petitioners", [])
    resps = case_data.get("respondents", [])
    if pets or resps:
        title = f"{pets[0] if pets else 'Unknown'} vs {resps[0] if resps else 'Unknown'}"
        parts.append(f"**Case Title:** {title}")

    status = case_data.get("caseStatus", case_data.get("caseStatusLabel"))
    if status:
        parts.append(f"**Status:** {status}")

    case_type = case_data.get("caseType", case_data.get("caseTypeLabel"))
    if case_type:
        parts.append(f"**Case Type:** {case_type}")

    court = case_data.get("courtName")
    if court:
        parts.append(f"**Court:** {court}")

    filing = case_data.get("filingDate")
    if filing:
        parts.append(f"**Filing Date:** {filing}")

    next_hearing = case_data.get("nextHearingDate")
    if next_hearing:
        parts.append(f"**Next Hearing:** {next_hearing}")

    judges = case_data.get("judges", [])
    if judges:
        parts.append(f"**Judges:** {', '.join(judges)}")

    if pets:
        parts.append(f"**Petitioners:** {', '.join(pets)}")
    if resps:
        parts.append(f"**Respondents:** {', '.join(resps)}")

    acts = case_data.get("actsAndSections", [])
    if acts:
        parts.append(f"**Acts & Sections:** {', '.join(acts)}")

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
