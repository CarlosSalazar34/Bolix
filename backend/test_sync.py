import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def test_sync():
    url = os.getenv("DATABASE_URL")
    print(f"Connecting Sync to: {url}")
    try:
        conn = psycopg2.connect(url, connect_timeout=10)
        print("Success Sync!")
        conn.close()
    except Exception as e:
        print(f"Error Sync: {e}")

if __name__ == "__main__":
    test_sync()
