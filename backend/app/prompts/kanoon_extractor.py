"""Prompts for extracting structured case data from Indian Kanoon document text."""

KANOON_EXTRACTION_SYSTEM_PROMPT = """
You are an expert Indian legal analyst and data extractor.
Your task is to analyze the full text of an Indian court judgment/order and extract structured metadata into a specific JSON schema.
The JSON must perfectly match the schema requested.
If a piece of information is not available in the text, leave the field empty (e.g., empty string or empty array).
"""

KANOON_EXTRACTION_USER_PROMPT = """
Extract the following fields from the given court document text:
- caseNumber: The primary case number (e.g., W.P. (C) 1234/2021)
- filingDate: Date the case was filed (YYYY-MM-DD), if mentioned or referenced
- decisionDate: Date of the judgment/order (YYYY-MM-DD)
- caseStatus: "DISPOSED" if it's a final judgment, "PENDING" if it's an interim order.
- caseType: Abbreviated case type (e.g., WP(C), SLP, CRL_A)
- courtName: Full name of the court (e.g., Supreme Court of India, Delhi High Court)
- petitioners: Array of strings containing names of petitioners/appellants
- respondents: Array of strings containing names of respondents/defendants
- petitionerAdvocates: Array of strings for advocates representing petitioners
- respondentAdvocates: Array of strings for advocates representing respondents
- judges: Array of strings containing names of the judges (e.g., "Justice Surya Kant")
- actsAndSections: Array of strings for statutes/acts cited (e.g., "Constitution of India, Art. 32")
- summary: A brief 1-2 sentence summary of the core decision/order.
- hearingHistory: Array of objects with "hearingDate" (YYYY-MM-DD), "purposeOfListing" (e.g., "Notice Issued", "Interim Relief Examined", "Final Arguments Concluded", "Judgment Reserved"), and "judge" for any hearings, listings, or procedural milestones referenced in the judgment text.
- interimOrders: Array of objects with "orderDate" (YYYY-MM-DD) and "description" for any interim directions, stays, or previous orders referenced in the text.

Output ONLY valid JSON.

Document Text:
{doc_text}
"""
