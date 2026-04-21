import os
import time
import json
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import asyncpg

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

# ── Base de datos PostgreSQL ────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")
SERVER_START_TIME = time.time()
CACHE_TTL = 600  # 10 minutos
MAX_HISTORIAL = 20

pool: asyncpg.Pool | None = None

async def get_pool():
    """Obtiene o crea el pool de conexiones a PostgreSQL"""
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
        # Crear tablas si no existen
        async with pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS cache (
                    key VARCHAR(100) PRIMARY KEY,
                    data JSONB NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS historial (
                    id SERIAL PRIMARY KEY,
                    fecha VARCHAR(50) NOT NULL,
                    dolar_bcv DOUBLE PRECISION NOT NULL,
                    usdt_binance DOUBLE PRECISION NOT NULL,
                    promedio DOUBLE PRECISION NOT NULL,
                    brecha VARCHAR(20) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
    return pool

# Colores para la terminal
GREEN = "\033[92m"
BLUE = "\033[94m"
RED = "\033[91m"
RESET = "\033[0m"


# ── Funciones de caché (PostgreSQL) ─────────────────────────────────────────
async def get_cache(key: str):
    """Obtiene datos del caché si no han expirado"""
    db = await get_pool()
    async with db.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT data, created_at FROM cache WHERE key = $1", key
        )
        if row:
            age = (datetime.now(timezone.utc) - row["created_at"]).total_seconds()
            if age < CACHE_TTL:
                return row["data"]
            # Caché expirado, eliminarlo
            await conn.execute("DELETE FROM cache WHERE key = $1", key)
    return None


async def set_cache(key: str, data: dict):
    """Guarda datos en el caché (upsert)"""
    db = await get_pool()
    async with db.acquire() as conn:
        await conn.execute("""
            INSERT INTO cache (key, data, created_at)
            VALUES ($1, $2::jsonb, NOW())
            ON CONFLICT (key) DO UPDATE SET data = $2::jsonb, created_at = NOW()
        """, key, json.dumps(data))


async def add_historial(data: dict):
    """Agrega un registro al historial y mantiene máximo 20"""
    db = await get_pool()
    async with db.acquire() as conn:
        await conn.execute("""
            INSERT INTO historial (fecha, dolar_bcv, usdt_binance, promedio, brecha)
            VALUES ($1, $2, $3, $4, $5)
        """, data["fecha"], data["dolar_bcv"], data["usdt_binance"],
            data["promedio"], data["brecha"])
        # Mantener solo los últimos MAX_HISTORIAL registros
        await conn.execute(f"""
            DELETE FROM historial WHERE id NOT IN (
                SELECT id FROM historial ORDER BY created_at DESC LIMIT {MAX_HISTORIAL}
            )
        """)


async def get_historial_data():
    """Obtiene todos los registros del historial"""
    db = await get_pool()
    async with db.acquire() as conn:
        rows = await conn.fetch(
            "SELECT fecha, dolar_bcv, usdt_binance, promedio, brecha FROM historial ORDER BY created_at DESC"
        )
        return [dict(row) for row in rows]


# ── Rutas ───────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Bienvenido a Bolix API", "status": "online"}


@app.get("/status")
async def api_status():
    uptime_seconds = int(time.time() - SERVER_START_TIME)
    hours, remainder = divmod(uptime_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    uptime_str = f"{hours}h {minutes}m {seconds}s"

    # Verificar estado de la DB
    db_ok = False
    try:
        db = await get_pool()
        async with db.acquire() as conn:
            await conn.fetchval("SELECT 1")
        db_ok = True
    except Exception:
        pass

    return {
        "version": app.version,
        "status": "online",
        "fuentes": ["BCV", "Binance P2P"],
        "cache_ttl": f"{CACHE_TTL}s",
        "redis": "PostgreSQL " + ("conectado ✅" if db_ok else "desconectado ❌"),
        "uptime": uptime_str,
    }


@app.get("/tasa")
async def tasa_dolar():
    cache_key = "tasas_bolix"

    try:
        # 1. Intentar obtener datos del caché
        cached = await get_cache(cache_key)
        if cached:
            print(f"{GREEN}[CACHE HIT]{RESET} Sirviendo desde PostgreSQL...")
            return cached

        # 2. Si no hay caché, scraping real
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

        # 3. Guardar en caché y historial (PostgreSQL)
        await set_cache(cache_key, resultado)

        data_historial = {
            "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "dolar_bcv": bcv_usd,
            "usdt_binance": binance_usd,
            "promedio": promedio,
            "brecha": f"{brecha}%"
        }
        await add_historial(data_historial)

        print(f"{GREEN}[OK]{RESET} Tasas: BCV={bcv_usd}, Binance={binance_usd}")
        return resultado

    except Exception as e:
        print(f"{RED}[ERROR]{RESET} Falló el scraping: {e}")
        # Intentar servir desde caché aunque esté expirado
        try:
            db = await get_pool()
            async with db.acquire() as conn:
                row = await conn.fetchrow("SELECT data FROM cache WHERE key = $1", cache_key)
                if row:
                    print(f"{BLUE}[BACKUP]{RESET} Sirviendo último valor conocido.")
                    return row["data"]
        except Exception:
            pass
        return {"error": "Fuentes caídas y no hay backup disponible"}


@app.get("/historial")
async def get_historial():
    try:
        data = await get_historial_data()
        return {
            "status": "success",
            "count": len(data),
            "data": data
        }
    except Exception as e:
        print(f"{RED}[ERROR HISTORIAL]{RESET} {e}")
        return {"status": "error", "count": 0, "data": [], "error": str(e)}