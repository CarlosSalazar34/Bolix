import os
from datetime import datetime, timezone, timedelta
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

# Importes locales
from app.database import engine, Base, get_db
from app.models.history import History
from app.models.cache import Cache 
from functions.dolar import get_bcv, get_binance
from middleware.auth import get_current_user
from app.routes import auth, chatbot, trades, notifications, wallets  # <--- Agregado notifications

load_dotenv()

app = FastAPI(
    title="Bolix API",
    # Esto fuerza a que el candado aparezca arriba a la derecha en Swagger
    swagger_ui_parameters={"persistAuthorization": True} 
)

# Y asegúrate de que el login esté configurado así:
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Colores terminal
GREEN, BLUE, RED, RESET = "\033[92m", "\033[94m", "\033[91m", "\033[0m"

# ── CORS ──────────────────────────────────────────────────────────────────
origins_raw = os.getenv("ALLOWED_ORIGINS", "")
origins = [origin.strip() for origin in origins_raw.split(",") if origin.strip()]
if not origins: origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── STARTUP ───────────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print(f"{GREEN}Bolix Ecosystem: Tablas sincronizadas{RESET}")
    except Exception as e:
        print(f"{RED}Error sincronizando tablas (DB offline?): {e}{RESET}")

# ── RUTAS BASE ────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"app": "Bolix", "dev": "Carlos Salazar and Gabriel Mejia", "status": "online"}

@app.get("/tasa", dependencies=[Depends(get_current_user)])
async def tasa_dolar(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Cache).where(Cache.key == "tasas_bolix"))
        cache_entry = result.scalars().first()
        
        if cache_entry:
            age = (datetime.now(timezone.utc) - cache_entry.created_at).total_seconds()
            if age < 600:
                print(f"{GREEN}[CACHE HIT]{RESET} Sirviendo datos de la cache de Carlos...")
                return {
                    "dolar_bcv": float(cache_entry.data.get('dolar_bcv')),
                    "euro_bcv": float(cache_entry.data.get('euro_bcv', 0)),
                    "usdt_binance": float(cache_entry.data.get('usdt_binance')),
                    "promedio": float(cache_entry.data.get('promedio')),
                    "brecha_porcentual": cache_entry.data.get('brecha_porcentual'),
                    "estatus_mercado": cache_entry.data.get('estatus_mercado', 'Normal'),
                    "fecha": cache_entry.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "source": "cache"
                }

        # 2. Scraping Real con Manejo de Errores (Fallback)
        print(f"{BLUE}[FETCHING]{RESET} Scraping fuentes externas...")
        try:
            bcv_data = await get_bcv()
            binance_data = await get_binance()

            b_usd = float(bcv_data.get('dolar_bcv'))
            b_eur = float(bcv_data.get('euro_bcv', 0))
            bin_usd = float(binance_data.get('usdt'))
            prom = round((b_usd + bin_usd) / 2, 2)
            brecha_val = f"{round(((bin_usd - b_usd) / b_usd) * 100, 2)}%"
            
            data_json = {
                "dolar_bcv": b_usd,
                "euro_bcv": b_eur,
                "usdt_binance": bin_usd,
                "promedio": prom,
                "brecha_porcentual": brecha_val,
                "estatus_mercado": "Alerta: Brecha Alta" if ((bin_usd - b_usd) / b_usd) > 0.10 else "Normal"
            }

            # 3. Guardar nuevo registro y UPSERT en cache
            nuevo = History(
                fecha=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                dolar_bcv=b_usd, 
                usdt_binance=bin_usd, 
                promedio=prom, 
                brecha=brecha_val
            )
            db.add(nuevo)

            # Lógica de Upsert: Si existe actualiza, si no existe crea
            if cache_entry:
                await db.execute(update(Cache).where(Cache.key == "tasas_bolix").values(
                    data=data_json,
                    created_at=datetime.now(timezone.utc)
                ))
            else:
                db.add(Cache(key="tasas_bolix", data=data_json, created_at=datetime.now(timezone.utc)))
            
            await db.commit()
            
            return {
                **data_json,
                "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "source": "live"
            }

        except Exception as scrap_error:
            print(f"{RED}[SCRAPING FAILED]{RESET} Usando último historial disponible: {scrap_error}")
            # Fallback: Buscar el último registro exitoso en historial
            fallback_result = await db.execute(select(History).order_by(History.id.desc()).limit(1))
            last_entry = fallback_result.scalars().first()
            
            if last_entry:
                return {
                    "dolar_bcv": float(last_entry.dolar_bcv),
                    "euro_bcv": 0.0, # Historial no tiene euro
                    "usdt_binance": float(last_entry.usdt_binance),
                    "promedio": float(last_entry.promedio),
                    "brecha_porcentual": last_entry.brecha,
                    "estatus_mercado": "Normal",
                    "fecha": last_entry.fecha,
                    "source": "fallback_historial"
                }
            raise scrap_error

    except Exception as e:
        print(f"{RED}[ERROR]{RESET} {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error en servidor de tasas")

@app.get("/historial", dependencies=[Depends(get_current_user)])
async def get_historial(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(History).order_by(History.id.desc()).limit(20))
    historial = result.scalars().all()
    data = []
    for h in historial:
        data.append({
            "fecha": h.fecha,
            "dolar_bcv": float(h.dolar_bcv),
            "usdt_binance": float(h.usdt_binance),
            "promedio": float(h.promedio),
            "brecha": h.brecha
        })
    return {
        "status": "success",
        "count": len(data),
        "data": data
    }

@app.get("/status", dependencies=[Depends(get_current_user)])
async def server_status():
    return {
        "version": "1.2.6",
        "status": "online",
        "fuentes": ["BCV", "Binance P2P"],
        "cache_ttl": "10 min",
        "redis": "desconectado",
        "uptime": "99.9%"
    }


# ── RUTAS EXTERNAS ────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/auth", tags=["Seguridad"])
app.include_router(chatbot.router, prefix="/bot", tags=["Chatbot"])
app.include_router(trades.router, tags=["Transacciones"]) # <--- Activado
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notificaciones"])
app.include_router(wallets.router)