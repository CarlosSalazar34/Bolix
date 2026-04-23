import os
import json
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.wallet import Wallet
from app.models.trade import Trade
from app.services.bolo_logic import procesar_audio_inteligente, calcular_ganancias_totales
from functions.dolar import get_binance
from middleware.auth import get_current_user

router = APIRouter()

# Burbuja 1: Ver Ganancias (Sin Gemini, pura lógica)
@router.get("/herramientas/ganancias")
async def tool_ganancias(current_user = Depends(get_current_user), db = Depends(get_db)):
    diff, precio, error = await calcular_ganancias_totales(current_user.id, db)
    if error: return {"respuesta": error}
    
    mensaje = f"Llevas un {diff}% {'arriba 🚀' if diff >= 0 else 'abajo 📉'}. El USDT está en {precio} Bs."
    return {"respuesta": mensaje}

# Burbuja 2: Ver Saldo (Directo a Wallets)
@router.get("/herramientas/saldo")
async def tool_saldo(current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallets = result.scalars().all()
    
    if not wallets:
        return {"respuesta": "Mano, no tienes ni una wallet creada. Ve a la sección de Wallet y crea una."}
    
    resumen = "Mano, aquí tienes tus saldos:\n"
    for w in wallets:
        resumen += f"• {w.nombre}: {float(w.saldo):.2f} {w.moneda}\n"
    
    return {"respuesta": resumen}

# Burbuja 3: Estado del Mercado (Usando lógica y Gemini opcional)
@router.get("/herramientas/mercado")
async def tool_mercado(current_user = Depends(get_current_user)):
    from app.services.bolo_logic import obtener_estado_mercado
    mensaje = await obtener_estado_mercado()
    return {"respuesta": mensaje}

# Chat de texto: Usa Gemini
class ChatInput(BaseModel):
    texto: str

async def ejecutar_transaccion_bolo(db: AsyncSession, current_user: User, wallets_objetos, data: dict):
    accion = data.get("accion")
    monto_val = data.get("monto")
    monto = float(monto_val) if monto_val is not None else 0.0
    w_origen_nombre = data.get("wallet_origen")
    w_destino_nombre = data.get("wallet_destino")
    respuesta_ia = data.get("respuesta_bolo", "Oído al tambor, pana.")

    if accion in ["COMPRA", "VENTA", "TRANSFERENCIA"] and monto > 0:
        wallet_origen = next((w for w in wallets_objetos if w.nombre == w_origen_nombre), None)
        wallet_destino = next((w for w in wallets_objetos if w.nombre == w_destino_nombre), None)

        if wallet_origen and wallet_destino:
            # Obtener tasa: Prioridad a la que dijo el usuario, sino la del API
            tasa_usuario = data.get("tasa_usuario")
            if tasa_usuario:
                tasa_final = float(tasa_usuario)
            else:
                tasa_data = await get_binance()
                tasa_final = float(tasa_data.get('usdt', 0))

            monto_origen = monto
            monto_destino = monto

            # Lógica de conversión según monedas
            if wallet_origen.moneda == "BS" and wallet_destino.moneda == "USDT":
                monto_origen = monto * tasa_final
                monto_destino = monto
            elif wallet_origen.moneda == "USDT" and wallet_destino.moneda == "BS":
                monto_origen = monto
                monto_destino = monto * tasa_final
            
            if float(wallet_origen.saldo) >= monto_origen:
                wallet_origen.saldo = float(wallet_origen.saldo) - monto_origen
                wallet_destino.saldo = float(wallet_destino.saldo) + monto_destino
                
                nuevo_trade = Trade(
                    user_id=current_user.id,
                    tipo=accion,
                    monto_usdt=monto if "USDT" in [wallet_origen.moneda, wallet_destino.moneda] else 0,
                    precio_tasa=tasa_final
                )
                db.add(nuevo_trade)
                await db.commit() 
            else:
                respuesta_ia = f"Epa pana, no tienes saldo suficiente en {wallet_origen.nombre}. Necesitas {round(monto_origen, 2)} {wallet_origen.moneda}."
        else:
            # Si la IA mandó una acción pero no tenemos las wallets claras
            if accion != "CONSULTA":
                opciones = ", ".join([f"**{w.nombre}**" for w in wallets_objetos])
                respuesta_ia = f"Mano, para registrar eso necesito saber qué wallets usar. Tienes estas: {opciones}. ¿Desde cuál y hacia cuál fue la vuelta?"

    return respuesta_ia

@router.post("/texto")
async def post_texto_bolo(
    data: ChatInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallets_objetos = result.scalars().all()
    info_wallets = [f"{w.nombre} ({float(w.saldo):.2f} {w.moneda})" for w in wallets_objetos]

    from app.services.bolo_logic import procesar_texto_inteligente
    res_data = await procesar_texto_inteligente(data.texto, info_wallets)
    
    respuesta_final = await ejecutar_transaccion_bolo(db, current_user, wallets_objetos, res_data)
    
    return {"respuesta": respuesta_final}

@router.post("/voz")
async def post_audio_bolo(
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallets_objetos = result.scalars().all()
    info_wallets = [f"{w.nombre} ({float(w.saldo):.2f} {w.moneda})" for w in wallets_objetos]

    if not info_wallets:
        return {"respuesta": "Mano, no tienes wallets creadas. Crea una primero para poder ayudarte."}

    temp_path = f"temp_{current_user.id}_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())
        
        from app.services.bolo_logic import procesar_audio_inteligente
        res_data = await procesar_audio_inteligente(temp_path, info_wallets)
        
        respuesta_final = await ejecutar_transaccion_bolo(db, current_user, wallets_objetos, res_data)
        return {"respuesta": respuesta_final}

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en Bolo: {str(e)}")
    
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)