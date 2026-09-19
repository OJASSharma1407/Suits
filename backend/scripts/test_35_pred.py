import asyncio
import json
from google import genai
from google.genai import types
from app.core.config import settings

client = genai.Client(api_key=settings.prediction_gemini_api_key)

async def main():
    model = "gemini-3.5-flash"
    system_prompt = (
        "You are the SUITS Judicial Reasoning Engine. "
        "Analyze the case and precedents. Return valid JSON only."
    )
    user_prompt = """
ACTIVE CASE: State vs Rajesh Kumar (Bail under Section 439 CrPC)
PRECEDENT: Arnesh Kumar vs State of Bihar (Guidelines on arrest and bail)

Generate JSON with:
{
  "outcome_distribution": [{"label": "Bail Granted", "weight": 0.75, "rationale": "Arnesh Kumar compliance"}],
  "comparisons": [{"precedent_title": "Arnesh Kumar vs State of Bihar", "similarities": ["Custodial necessity test"], "differences": ["Offence threshold"], "directional_effect": "supports_relief", "effect_rationale": "Mandates notice over arrest"}],
  "explanation": {
    "governing_doctrine": "Doctrine of Personal Liberty under Article 21",
    "statutory_thresholds": [{"test": "Triple Test for Bail", "status": "met", "note": "No flight risk"}],
    "critical_vulnerabilities": ["Investigation still pending"],
    "judicial_deduction_summary": "Precedents strongly favor grant of regular bail."
  }
}
"""
    print(f"Calling {model}...")
    res = await client.aio.models.generate_content(
        model=model,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )
    print("Response text length:", len(res.text))
    parsed = json.loads(res.text)
    print("Parsed JSON keys:", list(parsed.keys()))
    print("Outcome count:", len(parsed.get("outcome_distribution", [])))
    print("Comparisons count:", len(parsed.get("comparisons", [])))

if __name__ == "__main__":
    asyncio.run(main())
