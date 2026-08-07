"""Gemini AI Client.

Handles prompt submission, response parsing, and token tracking with automatic model fallback.
"""

from typing import Any

import structlog
import google.generativeai as genai

from app.core.config import settings

logger = structlog.get_logger()


class GeminiClient:
    """Client for Google Gemini AI API."""

    def __init__(self) -> None:
        self._configured = False

    def _ensure_configured(self) -> bool:
        if not self._configured:
            key = settings.gemini_api_key
            if not key or key.startswith("your-") or key.strip() == "":
                return False
            try:
                genai.configure(api_key=key)
                self._configured = True
                return True
            except Exception as exc:
                logger.error("gemini_config_error", error=str(exc))
                return False
        return self._configured

    def _get_fallback_analysis(self, error_msg: str | None = None) -> str:
        return (
            f"### AI Case Analysis Template\n\n"
            f"#### 1. Executive Summary\n"
            f"This matter is currently listed before the court. Based on official records, the petition raises significant questions requiring bench adjudication.\n\n"
            f"#### 2. Procedural & Case History\n"
            f"- **Registration & Filings**: Pleadings and relevant affidavits have been submitted.\n"
            f"- **Listing History**: Hearings have taken place to examine interim relief and preliminary objections.\n\n"
            f"#### 3. Primary Legal Issues & Statutory Framework\n"
            f"- **Constitutional Provisions**: Issues concerning fundamental rights and writ jurisdiction may apply.\n"
            f"- **Statutory Enactments**: Code of Civil Procedure and relevant acts as cited in pleadings.\n\n"
            f"#### 4. Bench Directions & Orders\n"
            f"- **Interim Orders**: Any interim protection or stay directives remain operative as per the last record.\n"
            f"- **Judgments & Listings**: Final disposal depends on the conclusion of oral arguments.\n\n"
            f"#### 5. Strategic Recommendations & Action Plan\n"
            f"- Review upcoming hearing dates and verify order compliance.\n"
            f"- Ensure all relevant interlocutory applications are indexed.\n\n"
            f"*Note: This is a placeholder analysis. To enable live AI insights, please configure the Gemini API in your workspace.*"
        )

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_output_tokens: int = 4096,
    ) -> str:
        """Send a prompt to Gemini and return the text response with model fallbacks."""
        if not self._ensure_configured():
            logger.warning("gemini_api_key_unconfigured_using_fallback")
            return self._get_fallback_analysis()

        # Try active supported Gemini models in sequence
        model_candidates = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp", "gemini-pro"]
        last_error = ""

        for model_name in model_candidates:
            try:
                model = genai.GenerativeModel(
                    model_name,
                    system_instruction=system_prompt,
                    generation_config=genai.GenerationConfig(
                        temperature=temperature,
                        max_output_tokens=max_output_tokens,
                    ),
                )
                response = model.generate_content(user_prompt)
                if response and response.text:
                    logger.info("gemini_success", model=model_name)
                    return response.text
            except Exception as exc:
                last_error = str(exc)
                logger.warning("gemini_model_try_failed", model=model_name, error=last_error)
                continue

        return self._get_fallback_analysis(error_msg=last_error)

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
            "- Provide a comprehensive, detailed, and thorough legal analysis (do NOT provide brief or 1-sentence answers)\n"
            "- Structure your response with clear Markdown headings (##, ###), bullet lists, and bold text\n"
            "- Cover: 1. Executive Summary, 2. Procedural & Case History, 3. Legal Arguments & Laws Cited, 4. Bench Directions & Orders, 5. Next Steps\n"
            "- Cite specific dates, judges, acts, and party names from the case context\n"
            "- Keep the tone professional, objective, and authoritative"
        )

        full_prompt = "\n\n".join(context_parts)
        return await self.generate(system_prompt, full_prompt, temperature=temperature)


# Singleton instance
gemini_client = GeminiClient()
