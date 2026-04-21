import os
import json
from dotenv import load_dotenv
from fastapi import FastAPI, Depends
from redis import asyncio as redis
from fastapi.middleware.cors import CORSMiddleware

#imports de modulos
from middleware.auth import verify_token
from functions.dolar import get_bcv, get_binance

load_dotenv()
API_KEY_BOLIX = os.getenv("API_KEY_BOLIX")

app = FastAPI(title="api-bolix", version="1.1.0")

origins_raw = os.getenv("ALLOWED_ORIGINS", "")

origins =  [origins.strip() for origin in origins_raw.split(",") if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

# Conexión al Redis de Docker
rd = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=6379, 
    db=0, 
    decode_responses=True)

# Colores para la terminal
GREEN = "\033[92m"
BLUE = "\033[94m"
RED = "\033[91m"
RESET = "\033[0m"

@app.get("/", dependencies=[Depends(verify_token)])
async def root():
    return {"message": "Bienvenido a Bolix API", "status": "online"}

@app.get("/tasa", dependencies=[Depends(verify_token)])
async def tasa_dolar():
    cache_key = "tasas_bolix"
    last_known_key = "tasas_bolix_backup"
    
    try:
        # 1. Intentar obtener datos del caché
        cache_hit = await rd.get(cache_key)
        if cache_hit:
            print(f"{GREEN}[CACHE HIT]{RESET} Sirviendo desde Redis...")
            return json.loads(cache_hit)

        # 2. Si no hay caché, intentamos scraping real
        print(f"{BLUE}[FETCHING]{RESET} Obteniendo datos reales de BCV y Binance...")
        bcv_data = await get_bcv()
        binance_data = await get_binance()
        
        # --- EXTRACCIÓN Y CÁLCULO (Aquí estaba el error) ---
        # Extraemos solo los números
        bcv_usd = float(bcv_data.get('dolar_bcv'))
        binance_usd = float(binance_data.get('usdt'))
        
        # Ahora sí hacemos la matemática con números, no con dicts
        promedio = round((bcv_usd + binance_usd) / 2, 2)
        brecha = round(((binance_usd - bcv_usd) / bcv_usd) * 100, 2)
        estatus = "Estable" if brecha < 5 else "Alerta: Brecha Alta"
        
        resultado = {
            "dolar_bcv": bcv_usd,
            "euro_bcv": float(bcv_data.get('euro_bcv')),
            "usdt_binance": binance_usd,
            "promedio": promedio,
            "brecha_porcentual": f"{brecha}%",
            "estatus_mercado": estatus
        }
        
        from datetime import datetime
        data_historial = {
            "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "dolar_bcv": bcv_usd,
            "usdt_binance": binance_usd,
            "promedio": promedio,
            "brecha": f"{brecha}%"
        }
        
        await rd.lpush("historial_bolix", json.dumps(data_historial))
        await rd.ltrim("historial_bolix", 0, 19)

        # 3. Guardamos en Redis (Cache normal y Backup eterno)
        await rd.set(cache_key, json.dumps(resultado), ex=600)
        await rd.set(last_known_key, json.dumps(resultado))
        
        return resultado

    except Exception as e:
        print(f"{RED}[ERROR]{RESET} Falló el scraping: {e}")
        backup = await rd.get(last_known_key)
        if backup:
            print(f"{BLUE}[BACKUP]{RESET} Sirviendo último valor conocido debido a error.")
            return json.loads(backup)
        
        return {"error": "Fuentes caídas y no hay backup disponible"}
    
@app.get("/historial", dependencies=[Depends(verify_token)])
async def get_historial():
    
    try:
        # Traemos todos los elementos de la lista 'historial_bolix'
        raw_historial = await rd.lrange("historial_bolix", 0, -1)
        
        # Convertimos los strings de JSON a una lista de diccionarios de Python
        historial_procesado = [json.loads(item) for item in raw_historial]
        
        return {
            "status": "success",
            "count": len(historial_procesado),
            "data": historial_procesado
        }
    except Exception as e:
        print(f"{RED}[ERROR HISTORIAL]{RESET} {e}")
        return {"error": "No se pudo obtener el historial"}