import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def test_conn():
    url = os.getenv("DATABASE_URL")
    if url and url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql://", 1) # asyncpg uses postgresql:// or postgres://
    
    print(f"Connecting to: {url}")
    try:
        conn = await asyncpg.connect(url, timeout=10)
        print("Success!")
        await conn.close()
    except Exception as e:
        print(f"Error type: {type(e)}")
        print(f"Error message: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
