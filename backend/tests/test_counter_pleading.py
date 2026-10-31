"""Unit tests for the Counter-Pleading & Written Statement Generator (Adversarial Defense Engine)."""

import pytest
from app.schemas.counter_pleading import (
    GenerateWrittenStatementRequest,
    PlaintParagraph,
    StatutoryBar,
)
from app.services.counter_pleading_service import CounterPleadingService

SAMPLE_COMMERCIAL_PLAINT = """
IN THE COURT OF THE DISTRICT JUDGE (COMMERCIAL), DELHI
CS (COMM) NO. 412 OF 2026

IN THE MATTER OF:
ALPHA TECH ENTERPRISES PVT. LTD.
...PLAINTIFF
VERSUS
BETA INDUSTRIAL SOLUTIONS LLP
...DEFENDANT

COMMERCIAL SUIT FOR RECOVERY OF RS. 45,00,000/- ALONG WITH INTEREST

MOST RESPECTFULLY SHEWETH:
1. That the Plaintiff is a private limited company incorporated under the Companies Act, 2013 having its registered office at Connaught Place, New Delhi.
2. That the Defendant is a limited liability partnership firm having its office at Okhla Industrial Area, New Delhi.
3. That in the month of March 2020, the Plaintiff supplied industrial hardware to the Defendant pursuant to Purchase Order No. 441.
4. That the Defendant failed to make payment of Invoice No. 892 dated 14.04.2020 amounting to Rs. 45,00,000/- despite repeated demands and reminders.
5. That the Defendant has breached the contractual terms and committed deliberate default, thereby causing substantial financial loss to the Plaintiff.
6. That the cause of action firstly arose on 14.04.2020 when the invoice was raised and continues to subsist.
7. That this Hon'ble Court has territorial and pecuniary jurisdiction to try the present commercial suit.
8. That the suit is valued at Rs. 45,00,000/- and requisite court fees have been paid.

PRAYER:
Wherefore it is prayed that a decree for Rs. 45,00,000/- be passed in favour of Plaintiff and against Defendant.
"""


def test_chunk_plaint_paragraphs():
    service = CounterPleadingService()
    paras = service.chunk_plaint_paragraphs(SAMPLE_COMMERCIAL_PLAINT)

    assert len(paras) == 8
    assert paras[0].para_number == 1
    assert "Plaintiff is a private limited company" in paras[0].text
    assert paras[0].is_substantive is False  # Formal parties & status
    assert paras[0].detected_topic == "Parties & Status"

    # Paragraph 4 is a substantive breach/payment allegation
    assert paras[3].para_number == 4
    assert paras[3].is_substantive is True
    assert "failed to make payment" in paras[3].text


def test_detect_statutory_bars():
    service = CounterPleadingService()
    paras = service.chunk_plaint_paragraphs(SAMPLE_COMMERCIAL_PLAINT)
    bars = service.detect_statutory_bars(SAMPLE_COMMERCIAL_PLAINT, paras)

    bar_ids = [b.bar_id for b in bars]

    # 1. Must detect Section 12A Commercial Courts Act non-compliance (Patil Automation)
    assert "sec_12a_cca" in bar_ids

    # 2. Must detect Limitation Act bar (transaction dates back to 2020 > 3 years)
    assert "limitation_act_bar" in bar_ids


@pytest.mark.asyncio
async def test_written_statement_assembly():
    service = CounterPleadingService()
    paras = service.chunk_plaint_paragraphs(SAMPLE_COMMERCIAL_PLAINT)
    bars = service.detect_statutory_bars(SAMPLE_COMMERCIAL_PLAINT, paras)

    req = GenerateWrittenStatementRequest(
        court_name="IN THE COURT OF THE DISTRICT JUDGE (COMMERCIAL), DELHI",
        suit_number="CS (COMM) NO. 412 OF 2026",
        plaintiff="ALPHA TECH ENTERPRISES PVT. LTD.",
        defendant="BETA INDUSTRIAL SOLUTIONS LLP",
        selected_bars=bars,
        paragraphs=paras,
        defense_strategy="aggressive_denial",
        advocate_notes="Goods were defective and rejected within 48 hours vide email dated 16.04.2020.",
    )

    ws = await service.generate_written_statement(req)

    assert "CS (COMM) NO. 412 OF 2026" in ws.title
    assert "ALPHA TECH ENTERPRISES PVT. LTD." in ws.cause_title_html
    assert "BETA INDUSTRIAL SOLUTIONS LLP" in ws.cause_title_html
    assert "PRELIMINARY OBJECTIONS" in ws.preliminary_objections_html
    assert "Patil Automation" in ws.preliminary_objections_html
    assert "PARA-WISE REPLY" in ws.para_wise_reply_html
    assert "PRAYER" in ws.prayer_html
    assert "VERIFICATION" in ws.verification_html
    assert len(ws.traversals) == 8
