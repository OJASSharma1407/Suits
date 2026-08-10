import asyncio
import os
import sys
import json

from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import AsyncSessionLocal
from app.services.case_service import CaseService

async def test_case():
    async with AsyncSessionLocal() as db:
        service = CaseService(db)
        # 112279388 is Vinayak Road Carriers
        case_res = await service.get_case_details("112279388")
        print("Case Title:", case_res.case_title)
        print("Orders:", len(case_res.orders))
        print("Judgments in orders:", [o.order_type for o in case_res.orders])
        print("Judges:", case_res.judges)

if __name__ == "__main__":
    asyncio.run(test_case())
