import asyncio
from app.clients.gemini_client import gemini_client

async def test():
    res = await gemini_client.generate_json(
        system_prompt="You are a legal scholar.",
        user_prompt='Return valid JSON: {"status": "ok", "client": "gemini_client"}',
    )
    print("Result:", res)

if __name__ == "__main__":
    asyncio.run(test())
