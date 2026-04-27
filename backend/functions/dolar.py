from bs4 import BeautifulSoup
import asyncio
import httpx


async def get_binance(): 
    
    # url interna de binance p2p
    url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
    
    # parametros para que el servidor no detecte un illegal parameter
    payload = {
        "asset": "USDT",
        "fiat": "VES",
        "merchantCheck": False,
        "page": 1,
        "payTypes": [],
        "publisherType": None,
        "rows": 10,        # Obtenemos los 10 mejores precios para calcular min/max/avg
        "tradeType": "BUY"
    }

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            data = response.json()
            
            if data.get('success') and data.get('data'):
                prices = [float(adv['adv']['price']) for adv in data['data'] if adv.get('adv', {}).get('price')]
                if prices:
                    return {
                        "usdt": prices[0], # El mejor precio (mínimo)
                        "usdt_min": min(prices),
                        "usdt_max": max(prices),
                        "usdt_avg": round(sum(prices) / len(prices), 2)
                    }
            print("Binance response was not successful or empty data")
            return {"usdt": None, "usdt_min": None, "usdt_max": None, "usdt_avg": None}
    except Exception as e:
        print(f"Error en Binance: {e}")
        return {"usdt": None, "usdt_min": None, "usdt_max": None, "usdt_avg": None}


async def get_bcv():
    url = "https://www.bcv.org.ve/"
    try:
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                print(f"BCV returned status {response.status_code}")
                return {"dolar_bcv": None, "euro_bcv": None}
                
            soup = BeautifulSoup(response.content, "html.parser")

            dolar_div = soup.find("div", id="dolar")
            euro_div = soup.find("div", id="euro")

            dolar_bcv = None
            if dolar_div and dolar_div.find("strong"):
                try:
                    dolar_bcv = float(dolar_div.find("strong").text.strip().replace(",", "."))
                except (ValueError, AttributeError):
                    pass

            euro_bcv = None
            if euro_div and euro_div.find("strong"):
                try:
                    euro_bcv = float(euro_div.find("strong").text.strip().replace(",", "."))
                except (ValueError, AttributeError):
                    pass

            return {
                "dolar_bcv": round(dolar_bcv, 2) if dolar_bcv else None,
                "euro_bcv": round(euro_bcv, 2) if euro_bcv else None
            }
    except Exception as e:
        print(f"Error en BCV: {e}")
        return {"dolar_bcv": None, "euro_bcv": None}

async def get_data():
    bcv = await get_bcv()
    binance = await get_binance()
    print(bcv)
    print(binance)

if __name__ == "__main__":
    import asyncio
    asyncio.run(get_data())