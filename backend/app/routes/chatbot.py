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
    monto = float(numeros[0]) if numeros else None

    # 2. Lógica de COMPRA
    if any(keyword in mensaje_clean for keyword in ["compre", "compré", "comprar"]):
        if monto is None: return {"respuesta": "Dime cuánto compraste. Ej: 'Compré 100'"}
        
        tasa_data = await get_binance()
        precio = float(tasa_data.get('usdt'))

        query_wallet = await db.execute(
            select(Wallet).filter(Wallet.user_id == current_user.id, Wallet.es_principal_usdt == True)
        )
        wallet = query_wallet.scalars().first()

        if not wallet: return {"respuesta": "No tienes una billetera principal para sumar los USDT."}

        # Registrar Trade y actualizar Wallet
        nuevo_trade = Trade(user_id=current_user.id, tipo="COMPRA", monto_usdt=monto, precio_tasa=precio)
        wallet.saldo += Decimal(str(monto))
        
        db.add(nuevo_trade)
        await db.commit()
        await db.refresh(nuevo_trade)
        return {"respuesta": f"¡Anotado! Compraste {monto} USDT. Tu nuevo saldo es {wallet.saldo} USDT."}

    # 3. Lógica de VENTA
    if any(keyword in mensaje_clean for keyword in ["vendi", "vendí", "vender"]):
        if monto is None: return {"respuesta": "Dime cuánto vendiste. Ej: 'Vendí 50'"}

        tasa_data = await get_binance()
        precio = float(tasa_data.get('usdt'))

        query_wallet = await db.execute(
            select(Wallet).filter(Wallet.user_id == current_user.id, Wallet.es_principal_usdt == True)
        )
        wallet = query_wallet.scalars().first()

        if not wallet: return {"respuesta": "No tienes una billetera principal de donde restar los USDT."}

        # VALIDACIÓN DE SALDO
        if wallet.saldo < Decimal(str(monto)):
            return {"respuesta": f"No tienes suficiente saldo. Intentas vender {monto} USDT pero solo tienes {wallet.saldo} USDT."}

        # Registrar Trade y restar de Wallet
        nuevo_trade = Trade(user_id=current_user.id, tipo="VENTA", monto_usdt=monto, precio_tasa=precio)
        wallet.saldo -= Decimal(str(monto))
        
        db.add(nuevo_trade)
        await db.commit()
        await db.refresh(nuevo_trade)
        return {"respuesta": f"Venta registrada. Vendiste {monto} USDT a {precio} Bs. Tu saldo restante es {wallet.saldo} USDT."}

    # 4. Lógica de Estatus (Ganancia/Pérdida)
    if any(x in mensaje_clean for x in ["ganando", "perdiendo", "estatus", "rendimiento"]):
        query = select(Trade).where(
            Trade.user_id == current_user.id, 
            Trade.tipo == "COMPRA"
        ).order_by(Trade.fecha.desc())
        
        res_trade = await db.execute(query)
        u_compra = res_trade.scalars().first()
        
        if not u_compra: 
            return {"respuesta": "Aún no tienes compras registradas para calcular tu rendimiento."}
        
        tasa_ahora = await get_binance()
        p_actual = float(tasa_ahora.get('usdt'))
        p_compra = float(u_compra.precio_tasa)
        
        diff = ((p_actual - p_compra) / p_compra) * 100
        emoji = "arriba 📈" if diff >= 0 else "abajo 📉"

        return {"respuesta": f"Tu última compra fue a {p_compra} Bs. Como ahorita está en {p_actual} Bs., vas un {round(diff, 2)}% {emoji}."}

    # 5. Saludo / Ayuda
    return {"respuesta": f"Hola {current_user.username}, puedo registrar tus compras (ej: 'Compré 10'), ventas (ej: 'Vendí 5') o decirte cómo va tu inversión."}