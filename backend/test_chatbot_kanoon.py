"""Verification script for Chatbot using Indian Kanoon."""

import asyncio
import uuid
from app.database.session import async_session_factory
from app.models.user import User
from app.models.conversation import Conversation
from app.services.ai_service import AIService
from sqlalchemy import select


async def test_chat():
    print("=== Testing Chatbot with Indian Kanoon Data ===")
    async with async_session_factory() as db:
        # Get or create test user
        user_res = await db.execute(select(User).limit(1))
        user = user_res.scalar_one_or_none()
        if not user:
            print("No user found, creating test conversation ID directly")
            conv_id = uuid.uuid4()
        else:
            conv = Conversation(user_id=user.id, cnr="29724830", title="Test Conversation")
            db.add(conv)
            await db.commit()
            conv_id = conv.id

        ai_svc = AIService(db)
        print("Sending chat question...")
        chat_resp = await ai_svc.chat(
            conversation_id=conv_id,
            user_message="What was the main issue and outcome in the Vivek Narayan Sharma demonetization case?",
            order_filename="29724830",
        )
        print("\n=== Chatbot Answer Preview ===")
        print(str(chat_resp.answer[:400]).encode('ascii', errors='replace').decode('ascii'))
        print("\n=== Sources ===")
        print(chat_resp.sources)
        print("\n=== Suggested Questions ===")
        safe_questions = [str(q).encode('ascii', errors='replace').decode('ascii') for q in chat_resp.suggested_questions]
        print(safe_questions)
        assert len(chat_resp.answer) > 50, "Chatbot answer too short"
        assert len(chat_resp.sources) > 0, "No sources in chat response"
        print("\n[OK] Chatbot Kanoon test passed successfully!")


if __name__ == "__main__":
    asyncio.run(test_chat())
