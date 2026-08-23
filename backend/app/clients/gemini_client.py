"""Gemini AI Client.

Handles prompt submission, response parsing, and token tracking with automatic model fallback.
Uses Google GenAI SDK (google-genai >= 2.0) with async support via client.aio.models.
"""

import json
from typing import Any

import structlog
from google import genai
from google.genai import types

from app.core.config import settings

logger = structlog.get_logger()


class GeminiClient:
    """Client for Google Gemini AI API (google-genai >= 2.0)."""

    def __init__(self) -> None:
        self._configured = False
        self.client: genai.Client | None = None

    def _ensure_configured(self) -> bool:
        if not self._configured:
            key = settings.gemini_api_key
            if not key or key.strip() == "":
                logger.warning("gemini_api_key_missing", hint="Set GEMINI_API_KEY in .env")
                return False
            try:
                self.client = genai.Client(api_key=key)
                self._configured = True
                return True
            except Exception as exc:
                logger.error("gemini_config_error", error=str(exc))
                return False
        return self._configured

    def _get_fallback_analysis(self, error_msg: str | None = None) -> str:
        return (
            "### AI Case Analysis Template\n\n"
            "#### 1. Executive Summary\n"
            "This matter is currently listed before the court. Based on official records, "
            "the petition raises significant questions requiring bench adjudication.\n\n"
            "#### 2. Procedural & Case History\n"
            "- **Registration & Filings**: Pleadings and relevant affidavits have been submitted.\n"
            "- **Listing History**: Hearings have taken place to examine interim relief and "
            "preliminary objections.\n\n"
            "#### 3. Primary Legal Issues & Statutory Framework\n"
            "- **Constitutional Provisions**: Issues concerning fundamental rights and writ "
            "jurisdiction may apply.\n"
            "- **Statutory Enactments**: Code of Civil Procedure and relevant acts as cited "
            "in pleadings.\n\n"
            "#### 4. Bench Directions & Orders\n"
            "- **Interim Orders**: Any interim protection or stay directives remain operative "
            "as per the last record.\n"
            "- **Judgments & Listings**: Final disposal depends on the conclusion of oral "
            "arguments.\n\n"
            "#### 5. Strategic Recommendations & Action Plan\n"
            "- Review upcoming hearing dates and verify order compliance.\n"
            "- Ensure all relevant interlocutory applications are indexed.\n\n"
            "*Note: This is a placeholder analysis. To enable live AI insights, "
            "please configure the Gemini API key in your workspace.*"
        )

    def _model_candidates(self) -> list[str]:
        """Return ordered list of model names to try, deduplicating the fallback."""
        primary = settings.gemini_model or "gemini-3.6-flash"
        fallback = "gemini-3.6-flash"
        return [primary] if primary == fallback else [primary, fallback]

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_output_tokens: int = 4096,
    ) -> str:
        """Send a prompt to Gemini and return the text response."""
        if not self._ensure_configured():
            logger.warning("gemini_api_key_unconfigured_using_fallback")
            return self._get_fallback_analysis()

        last_error = ""
        for model_name in self._model_candidates():
            try:
                response = await self.client.aio.models.generate_content(  # type: ignore[union-attr]
                    model=model_name,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=temperature,
                        max_output_tokens=max_output_tokens,
                    ),
                )
                if response and response.text:
                    print(f"\\n\\033[92m=== GEMINI GENERATE SUCCESS ===\\033[0m")
                    print(f"Model: {model_name}")
                    print(f"Preview: {response.text[:200]}\\n")
                    logger.info("gemini_success", model=model_name)
                    return response.text
            except Exception as exc:
                last_error = str(exc)
                print(f"\\n\\033[91m=== GEMINI GENERATE ERROR ===\\033[0m\\nModel: {model_name}\\nError: {last_error}\\n")
                logger.warning("gemini_model_try_failed", model=model_name, error=last_error)
                continue

        return self._get_fallback_analysis(error_msg=last_error)

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_output_tokens: int = 8192,
    ) -> dict[str, Any]:
        """Send a prompt to Gemini and return a parsed JSON dict.

        Uses response_mime_type='application/json' to guarantee valid JSON output.
        Falls back to empty dict on failure.
        """
        if not self._ensure_configured():
            logger.warning("gemini_api_key_unconfigured_json_fallback")
            return {}

        last_error = ""
        for model_name in self._model_candidates():
            try:
                response = await self.client.aio.models.generate_content(  # type: ignore[union-attr]
                    model=model_name,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=temperature,
                        max_output_tokens=max_output_tokens,
                        response_mime_type="application/json",
                    ),
                )
                if response and response.text:
                    print(f"\\n\\033[92m=== GEMINI JSON SUCCESS ===\\033[0m")
                    print(f"Model: {model_name}")
                    print(f"Preview: {response.text[:200]}\\n")
                    logger.info("gemini_json_success", model=model_name)
                    return json.loads(response.text)
            except Exception as exc:
                last_error = str(exc)
                print(f"\\n\\033[91m=== GEMINI JSON ERROR ===\\033[0m\\nModel: {model_name}\\nError: {last_error}\\n")
                logger.warning("gemini_json_model_failed", model=model_name, error=last_error)
                continue

        logger.error("gemini_json_all_models_failed", error=last_error)
        return {}

    async def extract_markdown_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extract and format court order text from PDF bytes using Gemini's vision capability.

        Sends the PDF as an inline binary part and asks Gemini to produce clean Markdown.
        Falls back to a simple error message if the API is unavailable.
        """
        if not self._ensure_configured():
            logger.warning("gemini_api_key_unconfigured_pdf_fallback")
            return "*AI PDF extraction is unavailable: Gemini API key is not configured.*"

        if not pdf_bytes:
            return "*No PDF content was available for this order.*"

        prompt_text = (
            "You are a legal document transcription expert. "
            "The attached document is an official Indian court order in PDF format.\n\n"
            "Your task:\n"
            "1. Transcribe the FULL and COMPLETE text of the order faithfully.\n"
            "2. Format the output as clean, well-structured Markdown.\n"
            "3. Use `#` headings for the court name, `##` for the case title, "
            "`###` for sections like CORAM, ORDER, etc.\n"
            "4. Preserve all party names, dates, judge names, and legal citations exactly as written.\n"
            "5. Use `**bold**` for party names and judge names.\n"
            "6. Use numbered lists for court directions/orders.\n"
            "7. Do NOT summarize — transcribe the complete text.\n"
            "8. If the document is not a court order, state that clearly."
        )

        pdf_part = types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf")

        last_error = ""
        for model_name in self._model_candidates():
            try:
                response = await self.client.aio.models.generate_content(  # type: ignore[union-attr]
                    model=model_name,
                    contents=[prompt_text, pdf_part],
                    config=types.GenerateContentConfig(
                        temperature=0.1,
                        max_output_tokens=8192,
                    ),
                )
                if response and response.text:
                    logger.info(
                        "gemini_pdf_extraction_success",
                        model=model_name,
                        size_bytes=len(pdf_bytes),
                    )
                    return response.text
            except Exception as exc:
                last_error = str(exc)
                logger.warning("gemini_pdf_model_failed", model=model_name, error=last_error)
                continue

        logger.error("gemini_pdf_all_models_failed", error=last_error)
        return "*PDF extraction failed. The court order could not be processed at this time.*"

    async def generate_suggested_questions(
        self,
        case_context: str,
        last_ai_response: str,
        n: int = 4,
    ) -> list[str]:
        """Generate contextual follow-up questions based on case context and last AI reply."""
        default_questions = [
            "What happened next in this case?",
            "What laws were cited?",
            "Summarize the court's reasoning.",
            "Who are the parties involved?",
        ]

        if not self._ensure_configured():
            return default_questions

        prompt = (
            f"Based on the case details below and the assistant's last response, "
            f"generate exactly {n} short, specific follow-up questions a user might ask next.\n"
            f"Output ONLY a JSON array of strings with no extra text.\n\n"
            f"## Case Context\n{case_context}\n\n"
            f"## Last AI Response\n{last_ai_response}"
        )

        for model_name in self._model_candidates():
            try:
                response = await self.client.aio.models.generate_content(  # type: ignore[union-attr]
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.6,
                        max_output_tokens=512,
                        response_mime_type="application/json",
                    ),
                )
                if response and response.text:
                    questions = json.loads(response.text)
                    if isinstance(questions, list):
                        return [str(q) for q in questions[:n]]
            except Exception as exc:
                logger.warning("gemini_suggest_failed", model=model_name, error=str(exc))
                continue

        return default_questions

    async def generate_with_context(
        self,
        system_prompt: str,
        conversation_history: list[dict[str, str]],
        user_message: str,
        case_context: str,
        order_context: str | None = None,
        temperature: float = 0.3,
    ) -> str:
        """Generate a response with full conversation context."""
        if not self._ensure_configured():
            return "Gemini API key is not configured."

        context_parts = [f"## Case Information\n{case_context}"]

        if order_context:
            context_parts.append(f"## Relevant Order\n{order_context}")

        if conversation_history:
            history_text = "\n".join(
                f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['message']}"
                for m in conversation_history[-10:]
            )
            context_parts.append(f"## Conversation History\n{history_text}")

        context_parts.append(f"## Current Question\n{user_message}")
        context_parts.append(
            "## Response Instructions\n"
            "- Provide a comprehensive, detailed, and thorough legal analysis "
            "(do NOT provide brief or 1-sentence answers)\n"
            "- Structure your response with clear Markdown headings (##, ###), bullet lists, "
            "and bold text\n"
            "- Cover: 1. Executive Summary, 2. Procedural & Case History, "
            "3. Legal Arguments & Laws Cited, 4. Bench Directions & Orders, 5. Next Steps\n"
            "- Cite specific dates, judges, acts, and party names from the case context\n"
            "- Keep the tone professional, objective, and authoritative"
        )

        full_prompt = "\n\n".join(context_parts)
        return await self.generate(system_prompt, full_prompt, temperature=temperature)

    async def generate_with_context_stream(
        self,
        system_prompt: str,
        conversation_history: list[dict[str, str]],
        user_message: str,
        case_context: str,
        order_context: str | None = None,
        temperature: float = 0.3,
    ):
        """Generate a response with full conversation context (Streaming)."""
        if not self._ensure_configured():
            yield "Gemini API key is not configured."
            return

        context_parts = [f"## Case Information\n{case_context}"]
        if order_context:
            context_parts.append(f"## Relevant Order\n{order_context}")

        if conversation_history:
            history_text = "\n".join(
                f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['message']}"
                for m in conversation_history[-10:]
            )
            context_parts.append(f"## Conversation History\n{history_text}")

        context_parts.append(f"## Current Question\n{user_message}")
        context_parts.append(
            "## Response Instructions\n"
            "- Provide a comprehensive, detailed, and thorough legal analysis\n"
            "- Structure your response with clear Markdown headings (##, ###), bullet lists\n"
            "- Cover: 1. Executive Summary, 2. Procedural & Case History, 3. Legal Arguments, 4. Bench Directions\n"
            "- Cite specific dates, judges, acts, and party names\n"
            "- Keep the tone professional, objective, and authoritative"
        )

        full_prompt = "\n\n".join(context_parts)

        for model_name in self._model_candidates():
            try:
                # We combine system prompt and user prompt in contents for simplicity
                # Gemini system prompt is usually passed in GenerateContentConfig if supported
                combined_prompt = f"SYSTEM INSTRUCTIONS:\n{system_prompt}\n\nUSER REQUEST:\n{full_prompt}"
                
                response_stream = await self.client.aio.models.generate_content_stream( # type: ignore
                    model=model_name,
                    contents=combined_prompt,
                    config=types.GenerateContentConfig(
                        temperature=temperature,
                        max_output_tokens=4096,
                    ),
                )
                async for chunk in response_stream:
                    if chunk.text:
                        yield chunk.text
                return
            except Exception as exc:
                logger.warning("gemini_stream_model_failed", model=model_name, error=str(exc))
                continue

        yield "The Gemini API failed or rate limit was reached. Please check the backend logs."


# Singleton instance
gemini_client = GeminiClient()
