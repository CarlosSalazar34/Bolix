import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.trade import Trade
from app.models.user import User
from app.models.wallets import Wallet 
from functions.dolar import get_binance
from middleware.auth import get_current_user
from decimal import Decimal

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

@router.post("/consultar")
async def chat_logic(
    mensaje: str, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    mensaje_clean = mensaje.lower()
    
    # 1. Extraer números del mensaje
    numeros = re.findall(r"[-+]?\d*\.\d+|\d+", mensaje_clean)
    monto_input = float(numeros[0]) if numeros else None

    # Detectar si habla de bolívares/bolos
    es_bolivares = any(kw in mensaje_clean for kw in ["bolivares", "bolívares", "bolos", "bs"])
    
    tasa_data = await get_binance()
    precio_usdt = float(tasa_data.get('usdt'))

    # Si el usuario dijo "1000 bolivares", lo convertimos a USDT para el registro
    monto_usdt = monto_input
    if es_bolivares and monto_input:
        monto_usdt = monto_input / precio_usdt

    # 2. Lógica de COMPRA
    if any(keyword in mensaje_clean for keyword in ["compre", "compré", "comprar"]):
        if monto_input is None: return {"respuesta": "Dime cuánto compraste. Ej: 'Compré 100 bolos'"}
        
        query_wallet = await db.execute(
            select(Wallet).filter(Wallet.user_id == current_user.id, Wallet.es_principal_usdt == True)
        )
        wallet = query_wallet.scalars().first()

        if not wallet: return {"respuesta": "No tienes una billetera principal para sumar los USDT."}

        # Registrar Trade y actualizar Wallet
        nuevo_trade = Trade(user_id=current_user.id, tipo="COMPRA", monto_usdt=monto_usdt, precio_tasa=precio_usdt)
        wallet.saldo += Decimal(str(monto_usdt))
        
        db.add(nuevo_trade)
        await db.commit()
        await db.refresh(nuevo_trade)
        
        txt_monto = f"{monto_input} BS" if es_bolivares else f"{monto_input} USDT"
        return {"respuesta": f"¡Anotado! Compraste equivalentemente {round(monto_usdt, 2)} USDT (por esos {txt_monto}). Tu nuevo saldo es {round(wallet.saldo, 2)} USDT."}

    # 3. Lógica de VENTA
    if any(keyword in mensaje_clean for keyword in ["vendi", "vendí", "vender"]):
        if monto_input is None: return {"respuesta": "Dime cuánto vendiste. Ej: 'Vendí 50 bolos'"}

        query_wallet = await db.execute(
            select(Wallet).filter(Wallet.user_id == current_user.id, Wallet.es_principal_usdt == True)
        )
        wallet = query_wallet.scalars().first()

        if not wallet: return {"respuesta": "No tienes una billetera principal de donde restar los USDT."}

        # VALIDACIÓN DE SALDO
        if wallet.saldo < Decimal(str(monto_usdt)):
            return {"respuesta": f"No tienes suficiente saldo. Intentas vender el equivalente a {round(monto_usdt, 2)} USDT pero solo tienes {round(wallet.saldo, 2)} USDT."}

        # Registrar Trade y restar de Wallet
        nuevo_trade = Trade(user_id=current_user.id, tipo="VENTA", monto_usdt=monto_usdt, precio_tasa=precio_usdt)
        wallet.saldo -= Decimal(str(monto_usdt))
        
        db.add(nuevo_trade)
        await db.commit()
        await db.refresh(nuevo_trade)
        
        txt_monto = f"{monto_input} BS" if es_bolivares else f"{monto_input} USDT"
        return {"respuesta": f"Venta registrada. Vendiste el equivalente a {round(monto_usdt, 2)} USDT (por esos {txt_monto}) a tasa de {precio_usdt} Bs. Saldo: {round(wallet.saldo, 2)} USDT."}

    # 4. Lógica de Estatus (Ganancia/Pérdida)
    if any(x in mensaje_clean for x in ["ganando", "perdiendo", "estatus", "rendimiento", "como voy", "cómo voy"]):
        # Obtener el promedio de compra
        query = select(Trade).where(
            Trade.user_id == current_user.id, 
            Trade.tipo == "COMPRA"
        )
        res_trade = await db.execute(query)
        trades = res_trade.scalars().all()
        
        if not trades: 
            return {"respuesta": "Aún no tienes compras registradas para calcular tu rendimiento."}
        
        # Calcular precio promedio ponderado
        total_monto = sum(t.monto_usdt for t in trades)
        total_costo_bs = sum(t.monto_usdt * float(t.precio_tasa) for t in trades)
        p_compra_avg = total_costo_bs / total_monto if total_monto > 0 else 0
        
        tasa_ahora = await get_binance()
        p_actual = float(tasa_ahora.get('usdt'))
        
        diff_pct = ((p_actual - float(p_compra_avg)) / float(p_compra_avg)) * 100 if p_compra_avg > 0 else 0
        emoji = "arriba 📈" if diff_pct >= 0 else "abajo 📉"
        estado = "ganando" if diff_pct >= 0 else "perdiendo"

        return {"respuesta": f"Tu precio promedio de compra es {round(p_compra_avg, 2)} Bs. Como ahorita el USDT está en {p_actual} Bs., vas {estado} un {round(abs(diff_pct), 2)}% {emoji}."}

    # 5. Consultar Tasa
    if any(x in mensaje_clean for x in ["tasa", "precio", "dolar", "dólar", "cuanto esta", "cuánto está"]):
        return {"respuesta": f"La tasa actual de Binance P2P (USDT) es de **{precio_usdt} Bs.**"}

    # 6. Saludo / Ayuda
    return {"respuesta": f"Hola {current_user.username}, soy Bolo. Puedo registrar tus compras (ej: 'Compré 100 bolos'), ventas o decirte si vas ganando o perdiendo dinero con la tasa de Binance."}