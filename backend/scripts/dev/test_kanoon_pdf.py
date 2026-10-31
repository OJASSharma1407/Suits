import httpx
import asyncio

async def main():
    tid = 50433551
    url = f"https://indiankanoon.org/doc/{tid}/?type=pdf"
    print(f"Fetching {url}")
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        # Try GET first
        resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
        print("GET status:", resp.status_code)
        print("GET headers:", resp.headers)
        print("GET content start:", resp.content[:50])
        
        # Try POST
        resp2 = await client.post(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
        print("\nPOST status:", resp2.status_code)
        print("POST headers:", resp2.headers)
        print("POST content start:", resp2.content[:50])

if __name__ == "__main__":
    asyncio.run(main())
