import asyncio
from app.clients.prediction_gemini_client import prediction_gemini_client

async def test():
    system_prompt = (
        "You are the SUITS Judicial Reasoning Engine. "
        "Return valid JSON adhering to the schema."
    )
    user_prompt = (
        "Analyze this bail petition under Section 439 CrPC. "
        "Case: State vs John Doe. Precedents: Arnesh Kumar vs State of Bihar. "
        "Return JSON with outcome_distribution, comparisons, and explanation."
    )
    res, reasoning = await prediction_gemini_client.generate_prediction_json(system_prompt, user_prompt)
    print("Success:", res is not None)
    if res:
        print("Keys:", list(res.keys()))

if __name__ == "__main__":
    asyncio.run(test())
