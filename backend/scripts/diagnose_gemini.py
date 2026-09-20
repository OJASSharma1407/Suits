import asyncio
from google import genai
from google.genai import types
from app.core.config import settings

client = genai.Client(api_key=settings.gemini_api_key)

async def test():
    m = 'gemini-3.6-flash'
    print("1. Plain async generate_content:")
    try:
        r = await client.aio.models.generate_content(model=m, contents="ping")
        print("  OK:", r.text.strip())
    except Exception as e:
        print("  ERR:", e)

    print("\n2. Async with response_mime_type=application/json:")
    try:
        r = await client.aio.models.generate_content(
            model=m, 
            contents='Return JSON {"status": "ok"}',
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        print("  OK:", r.text.strip())
    except Exception as e:
        print("  ERR:", e)

    print("\n3. Async with thinking_config budget=24576:")
    try:
        r = await client.aio.models.generate_content(
            model=m, 
            contents='Return JSON {"status": "ok"}',
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                thinking_config=types.ThinkingConfig(thinking_budget=24576)
            )
        )
        print("  OK:", r.text.strip())
    except Exception as e:
        print("  ERR:", e)

    print("\n4. Async with thinking_config level=high:")
    try:
        r = await client.aio.models.generate_content(
            model=m, 
            contents='Return JSON {"status": "ok"}',
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                thinking_config=types.ThinkingConfig(thinking_level="high")
            )
        )
        print("  OK:", r.text.strip())
    except Exception as e:
        print("  ERR:", e)

    print("\n5. Async without thinking_config (system + json):")
    try:
        r = await client.aio.models.generate_content(
            model=m, 
            contents='Return JSON {"status": "ok"}',
            config=types.GenerateContentConfig(
                system_instruction="You are a legal analyst.",
                response_mime_type="application/json"
            )
        )
        print("  OK:", r.text.strip())
    except Exception as e:
        print("  ERR:", e)

if __name__ == "__main__":
    asyncio.run(test())
