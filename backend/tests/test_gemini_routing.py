"""Test Suite for Gemini 3.5 Flash primary routing with Groq fallback and Local AI preservation."""

import asyncio
import unittest
from unittest.mock import AsyncMock, patch

from app.core.config import settings
from app.services.ai_orchestrator import ai_orchestrator


class TestGeminiRouting(unittest.IsolatedAsyncioTestCase):

    def test_models_configured_to_gemini_35_flash(self):
        """Verify that settings default or resolve to gemini-3.5-flash."""
        self.assertEqual(settings.gemini_model, "gemini-3.5-flash")
        self.assertEqual(settings.prediction_gemini_model, "gemini-3.5-flash")
        self.assertEqual(settings.groq_model, "openai/gpt-oss-120b")

    async def test_generate_json_gemini_first_cloud_gemini_success(self):
        """In cloud mode, generate_json_gemini_first should call prediction_gemini_client first."""
        mock_gemini_resp = ({"outcome_distribution": [{"label": "Granted", "weight": 1.0}]}, "reasoning")

        with patch("app.services.ai_orchestrator.prediction_gemini_client.generate_prediction_json", new_callable=AsyncMock) as mock_gemini, \
             patch("app.clients.groq_client.groq_client.generate_json", new_callable=AsyncMock) as mock_groq, \
             patch("app.services.ai_orchestrator.openrouter_client.generate_json", new_callable=AsyncMock) as mock_openrouter, \
             patch.object(ai_orchestrator, "is_local", return_value=False):

            mock_gemini.return_value = mock_gemini_resp

            result = await ai_orchestrator.generate_json_gemini_first(
                system_prompt="sys",
                user_prompt="user",
            )

            self.assertEqual(result, {"outcome_distribution": [{"label": "Granted", "weight": 1.0}]})
            mock_gemini.assert_awaited_once()
            mock_groq.assert_not_called()
            mock_openrouter.assert_not_called()

    async def test_generate_json_gemini_first_groq_fallback(self):
        """When Gemini fails or returns None, generate_json_gemini_first must fall back to Groq."""
        mock_groq_resp = {"outcome_distribution": [{"label": "Dismissed", "weight": 1.0}]}

        with patch("app.services.ai_orchestrator.prediction_gemini_client.generate_prediction_json", new_callable=AsyncMock) as mock_gemini, \
             patch("app.clients.groq_client.groq_client.generate_json", new_callable=AsyncMock) as mock_groq, \
             patch("app.services.ai_orchestrator.openrouter_client.generate_json", new_callable=AsyncMock) as mock_openrouter, \
             patch.object(ai_orchestrator, "is_local", return_value=False):

            mock_gemini.return_value = (None, None)
            mock_groq.return_value = mock_groq_resp

            result = await ai_orchestrator.generate_json_gemini_first(
                system_prompt="sys",
                user_prompt="user",
            )

            self.assertEqual(result, mock_groq_resp)
            mock_gemini.assert_awaited_once()
            mock_groq.assert_awaited_once()
            mock_openrouter.assert_not_called()

    async def test_generate_json_gemini_first_local_ai_preserved(self):
        """When local AI is active, generate_json_gemini_first must route exclusively to Ollama."""
        mock_ollama_resp = {"outcome_distribution": [{"label": "Bail Granted", "weight": 0.8}]}

        with patch("app.services.ai_orchestrator.ollama_client.generate_json", new_callable=AsyncMock) as mock_ollama, \
             patch("app.services.ai_orchestrator.prediction_gemini_client.generate_prediction_json", new_callable=AsyncMock) as mock_gemini, \
             patch("app.clients.groq_client.groq_client.generate_json", new_callable=AsyncMock) as mock_groq, \
             patch.object(ai_orchestrator, "is_local", return_value=True):

            mock_ollama.return_value = mock_ollama_resp

            result = await ai_orchestrator.generate_json_gemini_first(
                system_prompt="sys",
                user_prompt="user",
            )

            self.assertEqual(result, mock_ollama_resp)
            mock_ollama.assert_awaited_once()
            mock_gemini.assert_not_called()
            mock_groq.assert_not_called()

    async def test_generate_text_gemini_first_cloud_gemini_success(self):
        """In cloud mode, generate_text_gemini_first should call gemini_client first."""
        with patch("app.services.ai_orchestrator.gemini_client.generate", new_callable=AsyncMock) as mock_gemini, \
             patch("app.clients.groq_client.groq_client.generate", new_callable=AsyncMock) as mock_groq, \
             patch("app.services.ai_orchestrator.openrouter_client.generate", new_callable=AsyncMock) as mock_openrouter, \
             patch.object(ai_orchestrator, "is_local", return_value=False):

            mock_gemini.return_value = "Concise legal summary from Gemini."

            result = await ai_orchestrator.generate_text_gemini_first(
                prompt="summarize this",
                system_prompt="sys",
            )

            self.assertEqual(result, "Concise legal summary from Gemini.")
            mock_gemini.assert_awaited_once()
            mock_groq.assert_not_called()
            mock_openrouter.assert_not_called()

    async def test_generate_text_gemini_first_groq_fallback(self):
        """When gemini_client fails or returns unavailable message, fall back to Groq."""
        with patch("app.services.ai_orchestrator.gemini_client.generate", new_callable=AsyncMock) as mock_gemini, \
             patch("app.clients.groq_client.groq_client.generate", new_callable=AsyncMock) as mock_groq, \
             patch("app.services.ai_orchestrator.openrouter_client.generate", new_callable=AsyncMock) as mock_openrouter, \
             patch.object(ai_orchestrator, "is_local", return_value=False):

            mock_gemini.return_value = "### AI Case Analysis Unavailable\n\nService error."
            mock_groq.return_value = "Legal summary generated via Groq fallback."

            result = await ai_orchestrator.generate_text_gemini_first(
                prompt="summarize this",
                system_prompt="sys",
            )

            self.assertEqual(result, "Legal summary generated via Groq fallback.")
            mock_gemini.assert_awaited_once()
            mock_groq.assert_awaited_once()
            mock_openrouter.assert_not_called()

    async def test_generate_text_gemini_first_local_ai_preserved(self):
        """When local AI is active, generate_text_gemini_first must route exclusively to Ollama."""
        with patch("app.services.ai_orchestrator.ollama_client.generate", new_callable=AsyncMock) as mock_ollama, \
             patch("app.services.ai_orchestrator.gemini_client.generate", new_callable=AsyncMock) as mock_gemini, \
             patch("app.clients.groq_client.groq_client.generate", new_callable=AsyncMock) as mock_groq, \
             patch.object(ai_orchestrator, "is_local", return_value=True):

            mock_ollama.return_value = "Summary by Local Qwen 7B."

            result = await ai_orchestrator.generate_text_gemini_first(
                prompt="summarize this",
                system_prompt="sys",
            )

            self.assertEqual(result, "Summary by Local Qwen 7B.")
            mock_ollama.assert_awaited_once()
            mock_gemini.assert_not_called()
            mock_groq.assert_not_called()


if __name__ == "__main__":
    unittest.main()
