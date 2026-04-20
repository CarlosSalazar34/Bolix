from bs4 import BeautifulSoup
import asyncio
import httpx


async def get_binance(): # Aqui vas a desarrollar para obtener el precio de binance
    pass


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
    print(bcv)

asyncio.run(get_data())