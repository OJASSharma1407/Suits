import asyncio
import json
from google import genai
from google.genai import types
from app.core.config import settings

client = genai.Client(api_key=settings.prediction_gemini_api_key)

async def test_m(model):
    system_prompt = "You are the SUITS Judicial Reasoning Engine. Return valid JSON only."
    user_prompt = """
ACTIVE CASE: State vs Rajesh Kumar (Bail under Section 439 CrPC)
PRECEDENT: Arnesh Kumar vs State of Bihar (Guidelines on arrest and bail)

Generate JSON with outcome_distribution, comparisons, and explanation.
"""
    try:
        coro = client.aio.models.generate_content(
            model=model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        res = await asyncio.wait_for(coro, timeout=15.0)
        parsed = json.loads(res.text)
        print(f"[{model}] SUCCESS! Keys: {list(parsed.keys())}")
        return True
    except Exception as e:
        err = str(e)
        short = "503" if "503" in err else ("404" if "404" in err else ("429" if "429" in err else err[:60]))
        print(f"[{model}] FAILED -> {short}")
        return False

async def main():
    for m in ["gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-3.6-flash", "gemini-3.5-flash"]:
        await test_m(m)

if __name__ == "__main__":
    asyncio.run(main())
