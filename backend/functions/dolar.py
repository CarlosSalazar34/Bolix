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
        "rows": 1,        #se indica 1 para la busqueda del mejor precio posible
        "tradeType": "BUY"
    }

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            data = response.json()
            
            if data.get('success'):
                precio = data['data'][0]['adv']['price']
                # retornar el valor en forma de diccionario
                return {"usdt": float(precio)} 
            return {"usdt": None}
    except Exception as e:
        print(f"Error en Binance: {e}")
        return {"usdt": None}


async def get_bcv():
    url = "https://www.bcv.org.ve/"
    async with httpx.AsyncClient(verify=False) as client:
        response = await client.get(url)
        soup = BeautifulSoup(response.content, "html.parser")

        dolar_div = soup.find("div", id="dolar")
        euro_div = soup.find("div", id="euro")

        dolar_bcv = dolar_div.find("strong").text.strip() if dolar_div else None
        euro_bcv = euro_div.find("strong").text.strip() if euro_div else None

        return {"dolar_bcv": round(float(dolar_bcv.replace(",", ".")), 2),
        "euro_bcv": round(float(euro_bcv.replace(",", ".")), 2)}

async def get_data():
    bcv = await get_bcv()
    binance = await get_binance()
    print(bcv)
    print(binance)

if __name__ == "__main__":
    import asyncio
    asyncio.run(get_data())