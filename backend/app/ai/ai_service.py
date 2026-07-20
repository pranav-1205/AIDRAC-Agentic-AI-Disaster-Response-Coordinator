import json
import logging
from typing import Any
from google import genai
from google.genai import types as genai_types

from app.ai.prompts import SYSTEM_PROMPT
from app.ai.schemas import AIRecommendationResponse, RecommendedDestination

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self, api_key: str | None = None, model_name: str | None = None):
        self._client: genai.Client | None = None
        self._model = model_name or "gemini-2.5-flash"
        if api_key:
            self._client = genai.Client(api_key=api_key)

    async def get_recommendation(
        self,
        question: str,
        context: str,
    ) -> AIRecommendationResponse:
        if not self._client:
            print("[AIService] GEMINI_API_KEY is not set — returning degraded response")
            logger.warning("[ai] GEMINI_API_KEY is missing; client was not initialized")
            return AIRecommendationResponse(
                riskLevel="moderate",
                summary="AI service is not configured. Set GEMINI_API_KEY to enable recommendations.",
                recommendedDestination=None,
                reason="GEMINI_API_KEY is missing",
                actions=["Configure GEMINI_API_KEY in the backend .env file"],
            )

        full_prompt = f"""
{SYSTEM_PROMPT}

==================================================
USER QUESTION
==================================================

{question}

==================================================
EMERGENCY CONTEXT
==================================================

{context}

==================================================
INSTRUCTIONS
==================================================

Answer the user's question using ONLY the emergency context.

Return ONLY valid JSON matching the required schema.

Do not include Markdown.
Do not include explanations outside the JSON.
"""

        try:
            response = await self._call_gemini(full_prompt)
            return self._parse_response(response)
        except Exception as exc:
            reason = self._classify_error(exc)
            print(f"[AIService] Gemini API error (model={self._model}): {exc}")
            logger.exception(f"[ai] Gemini API error (model={self._model})")

            summary = "The AI service is temporarily unavailable."
            actions = [
                "Try again later",
                "Check your question and try rephrasing",
            ]

            if "quota" in reason.lower():
                summary = "The AI assistant has temporarily reached its free usage limit."
                actions = [
                    "Wait for the Gemini quota to reset.",
                    "All other disaster management features remain available.",
                ]

            return AIRecommendationResponse(
                riskLevel="moderate",
                summary=summary,
                recommendedDestination=None,
                reason=reason,
                actions=actions,
            )

    async def _call_gemini(self, prompt: str) -> dict[str, Any]:
        if not self._client:
            raise RuntimeError("Gemini client not initialized")

        resp = await self._client.aio.models.generate_content(
            model=self._model,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        return json.loads(resp.text.strip())

    def _classify_error(self, exc: Exception) -> str:
        msg = str(exc).lower()
        if "429" in msg or "quota" in msg or "resource_exhausted" in msg:
            return "AI quota exceeded. Please try again later."
        if "not found" in msg and "model" in msg:
            return f"AI model '{self._model}' is not available. Check GEMINI_MODEL in your .env."
        if "api key" in msg or "permission" in msg or "unauthorized" in msg:
            return "AI authentication failed. Check your GEMINI_API_KEY."
        return "An unexpected AI service error occurred."

    def _parse_response(self, data: dict[str, Any]) -> AIRecommendationResponse:
        dest = data.get("recommendedDestination")
        if isinstance(dest, dict) and dest.get("type") and dest.get("name"):
            recommended = RecommendedDestination(**dest)
        else:
            recommended = None
        return AIRecommendationResponse(
            riskLevel=data.get("riskLevel", "moderate"),
            summary=data.get("summary", ""),
            recommendedDestination=recommended,
            reason=data.get("reason", ""),
            actions=data.get("actions", []),
        )
