import asyncio
from app.database.session import async_session_factory
from app.services.headnote_service import HeadnoteService

async def main():
    test_cnr = "SCIN010177522021"
    print(f"Testing HeadnoteService on CNR: {test_cnr}...")
    async with async_session_factory() as db:
        svc = HeadnoteService(db)
        res = await svc.get_or_generate_headnote(test_cnr, force_refresh=True)
        if res:
            print("\n=== SUCCESS: HEADNOTE GENERATED ===")
            print(f"CNR: {res.target_cnr}")
            print(f"Order Title: {res.order_title}")
            print(f"Operative Disposition: {res.headnote.operative_disposition}")
            print("\nCatchwords:")
            for cw in res.headnote.catchwords:
                print(f"  • {cw}")
            print(f"\nHeld Points ({len(res.headnote.held_points)}):")
            for idx, h in enumerate(res.headnote.held_points, 1):
                print(f"  {idx}. {h}")
            print(f"\nPrecedent Citator ({len(res.headnote.precedent_citator_table)} authorities):")
            for c in res.headnote.precedent_citator_table:
                print(f"  - [{c.treatment}] {c.precedent_name}: {c.bench_commentary}")
            print(f"\nStatutory Provisions ({len(res.headnote.statutory_provisions_considered)}):")
            for s in res.headnote.statutory_provisions_considered:
                print(f"  - [{s.nature_of_interpretation}] {s.act_name} ({s.section_article})")
            print(f"\nRatio Decidendi Summary:\n{res.headnote.ratio_decidendi_summary[:300]}...")
            print(f"\nHash: {res.order_hash}")
        else:
            print("\n=== FAILED: Headnote returned None ===")

if __name__ == "__main__":
    asyncio.run(main())
