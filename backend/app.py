import os
import time
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

#imports de modulos
from functions.dolar import get_bcv, get_binance

load_dotenv()

app = FastAPI(title="api-bolix", version="1.1.0")

origins_raw = os.getenv("ALLOWED_ORIGINS", "")
origins = [origin.strip() for origin in origins_raw.split(",") if origin.strip()]

# Si no hay orígenes configurados, permitir todos (desarrollo local)
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Almacenamiento en memoria (reemplaza Redis)
SERVER_START_TIME = time.time()
cache = {"data": None, "timestamp": 0}  # Caché simple con TTL
CACHE_TTL = 600  # 10 minutos en segundos
historial = []  # Lista en memoria para el historial
MAX_HISTORIAL = 20

# Colores para la terminal
GREEN = "\033[92m"
BLUE = "\033[94m"
RED = "\033[91m"
RESET = "\033[0m"


@app.get("/")
async def root():
    return {"message": "Bienvenido a Bolix API", "status": "online"}


@app.get("/status")
async def api_status():
    uptime_seconds = int(time.time() - SERVER_START_TIME)
    hours, remainder = divmod(uptime_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    uptime_str = f"{hours}h {minutes}m {seconds}s"

    cache_age = int(time.time() - cache["timestamp"]) if cache["data"] else -1
    cache_remaining = max(0, CACHE_TTL - cache_age) if cache["data"] else 0

    return {
        "version": app.version,
        "status": "online",
        "fuentes": ["BCV", "Binance P2P"],
        "cache_ttl": f"{cache_remaining}s" if cache_remaining > 0 else "Sin caché activo",
        "redis": "No utilizado (memoria local)",
        "uptime": uptime_str,
    }


@app.get("/tasa")
async def tasa_dolar():
    global cache

    try:
        # 1. Verificar caché en memoria
        now = time.time()
        if cache["data"] and (now - cache["timestamp"]) < CACHE_TTL:
            print(f"{GREEN}[CACHE HIT]{RESET} Sirviendo desde memoria...")
            return cache["data"]

        # 2. Scraping real
        print(f"{BLUE}[FETCHING]{RESET} Obteniendo datos reales de BCV y Binance...")
        bcv_data = await get_bcv()
        binance_data = await get_binance()

        bcv_usd = float(bcv_data.get('dolar_bcv'))
        binance_usd = float(binance_data.get('usdt'))

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

        # 3. Guardar en historial (en memoria)
        data_historial = {
            "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "dolar_bcv": bcv_usd,
            "usdt_binance": binance_usd,
            "promedio": promedio,
            "brecha": f"{brecha}%"
        }
        historial.insert(0, data_historial)
        if len(historial) > MAX_HISTORIAL:
            historial.pop()

        # 4. Guardar en caché
        cache = {"data": resultado, "timestamp": now}

        print(f"{GREEN}[OK]{RESET} Tasas obtenidas: BCV={bcv_usd}, Binance={binance_usd}")
        return resultado

    except Exception as e:
        print(f"{RED}[ERROR]{RESET} Falló el scraping: {e}")
        if cache["data"]:
            print(f"{BLUE}[BACKUP]{RESET} Sirviendo último valor conocido.")
            return cache["data"]
        return {"error": "Fuentes caídas y no hay backup disponible"}


@app.get("/historial")
async def get_historial():
    return {
        "status": "success",
        "count": len(historial),
        "data": historial
    }