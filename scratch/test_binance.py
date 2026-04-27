
import asyncio
import httpx

async def test_binance():
    url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
    payload = {
        "asset": "USDT",
        "fiat": "VES",
        "merchantCheck": False,
        "page": 1,
        "payTypes": [],
        "publisherType": None,
        "rows": 10,
        "tradeType": "BUY"
    }
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        data = response.json()
        if data.get('success'):
            prices = [float(adv['adv']['price']) for adv in data['data']]
            print(f"Prices: {prices}")
            print(f"Min: {min(prices)}")
            print(f"Max: {max(prices)}")
            print(f"Avg: {sum(prices) / len(prices)}")
        else:
            print("Failed to fetch data")

if __name__ == "__main__":
    asyncio.run(test_binance())
