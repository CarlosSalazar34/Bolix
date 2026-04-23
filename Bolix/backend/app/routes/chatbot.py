import os
import json
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
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
async def tool_saldo(current_user = Depends(get_current_user), db = Depends(get_db)):
    return {"respuesta": "Tienes 150.20 USDT en tu wallet principal."}

# Nota de voz: Usa el Bolo Logic con Gemini
@router.post("/voz")
async def post_audio_bolo(
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    # 1. Obtener las wallets reales del usuario para que Gemini las conozca
    result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallets_objetos = result.scalars().all()
    nombres_wallets = [w.nombre for w in wallets_objetos]

    if not nombres_wallets:
        return {"respuesta": "Mano, no tienes wallets creadas. Crea una primero para poder ayudarte."}

    # 2. Guardar el audio temporalmente
    temp_path = f"temp_{current_user.id}_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())
        
        # 3. Llamar a la IA (Bolo Logic) para extraer la intención y data
        data = await procesar_audio_inteligente(temp_path, nombres_wallets)
        
        accion = data.get("accion")
        monto = float(data.get("monto", 0))
        w_origen_nombre = data.get("wallet_origen")
        w_destino_nombre = data.get("wallet_destino")
        respuesta_ia = data.get("respuesta_bolo", "Oído al tambor, pana.")

        # 4. Lógica de ejecución financiera (Si hay movimiento de dinero)
        if accion in ["COMPRA", "VENTA", "TRANSFERENCIA"] and monto > 0:
            # Buscar los objetos wallet específicos
            wallet_origen = next((w for w in wallets_objetos if w.nombre == w_origen_nombre), None)
            wallet_destino = next((w for w in wallets_objetos if w.nombre == w_destino_nombre), None)

            if wallet_origen and wallet_destino:
                if float(wallet_origen.saldo) >= monto:
                    # Ejecutar movimiento
                    wallet_origen.saldo = float(wallet_origen.saldo) - monto
                    wallet_destino.saldo = float(wallet_destino.saldo) + monto
                    
                    # Obtener tasa actual para el registro del Trade
                    tasa_data = await get_binance()
                    tasa_actual = float(tasa_data.get('usdt', 0))

                    # Registrar en el historial de Trades
                    nuevo_trade = Trade(
                        user_id=current_user.id,
                        tipo=accion,
                        monto_usdt=monto if "usdt" in wallet_destino.nombre.lower() else 0,
                        precio_tasa=tasa_actual
                    )
                    db.add(nuevo_trade)
                    
                    await db.commit() 
                else:
                    respuesta_ia = f"Epa pana, no tienes saldo suficiente en {wallet_origen.nombre}. Estás corto por {round(monto - float(wallet_origen.saldo), 2)}."
            else:
                respuesta_ia = "Mano, no entendí bien cuáles wallets usar. Asegúrate de decir los nombres claros."

        return {"respuesta": respuesta_ia}

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en Bolo: {str(e)}")
    
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)