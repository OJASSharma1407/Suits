import asyncio
from google import genai
from google.genai import types
from app.core.config import settings

client = genai.Client(api_key=settings.gemini_api_key)

models_to_test = [
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
]

async def check(m):
    try:
        coro = client.aio.models.generate_content(
            model=m,
            contents='Return JSON {"status": "ok"}',
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        res = await asyncio.wait_for(coro, timeout=8.0)
        return m, "SUCCESS", res.text.strip()
    except asyncio.TimeoutError:
        return m, "TIMEOUT", "8s timeout"
    except Exception as e:
        msg = str(e)
        short = "503" if "503" in msg else ("404" if "404" in msg else ("429" if "429" in msg else msg[:50]))
        return m, "ERROR", short

async def main():
    print("Testing candidate models with 8s timeout in parallel...")
    results = await asyncio.gather(*(check(m) for m in models_to_test))
    for m, status, info in results:
        print(f"[{status}] {m:25} -> {info}")

if __name__ == "__main__":
    asyncio.run(main())
