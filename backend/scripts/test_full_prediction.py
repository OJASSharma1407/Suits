import asyncio
from app.database.session import async_session_factory
from app.services.prediction_service import PredictionService

async def main():
    test_cnr = "SCIN010177522021"
    print(f"Testing full prediction engine for CNR: {test_cnr}...")
    async with async_session_factory() as db:
        service = PredictionService(db)
        res = await service.get_case_prediction(test_cnr, force_refresh=True)
        if res:
            print("\n=== SUCCESS: PREDICTION GENERATED ===")
            print(f"CNR: {res.target_cnr}")
            print(f"Matter Type: {res.matter_type}")
            print(f"Outcome Distribution ({len(res.outcome_distribution.outcomes)} outcomes):")
            for o in res.outcome_distribution.outcomes:
                print(f"  - {o.label}: {o.weight*100:.1f}% ({o.rationale})")
            print(f"Comparisons ({len(res.comparisons)}):")
            for c in res.comparisons[:2]:
                print(f"  - [{c.directional_effect.upper()}] {c.precedent_title}")
                print(f"    Similarities: {c.similarities}")
                print(f"    Differences: {c.differences}")
            print(f"Governing Doctrine: {res.explanation.governing_doctrine}")
            print(f"Statutory Thresholds: {len(res.explanation.statutory_thresholds)} tests")
            print(f"Hash: {res.case_state_hash}")
        else:
            print("\n=== FAILED: Prediction returned None ===")

if __name__ == "__main__":
    asyncio.run(main())
