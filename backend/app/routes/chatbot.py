import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.trade import Trade
from app.models.user import User
from functions.dolar import get_binance
from middleware.auth import get_current_user

router = APIRouter()

@router.post("/consultar")
async def chat_logic(mensaje: str, current_user_name: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    mensaje_clean = mensaje.lower()
    
    # Buscar usuario
    result = await db.execute(select(User).where(User.username == current_user_name))
    user = result.scalar_one_of_none()
    
    if "compre" in mensaje_clean or "compré" in mensaje_clean:
        numeros = re.findall(r"[-+]?\d*\.\d+|\d+", mensaje_clean)
        if not numeros: return {"respuesta": "No entendí el monto, pajuo."}
        
        monto = float(numeros[0])
        tasa = await get_binance()
        precio = float(tasa.get('usdt'))

        nuevo_trade = Trade(user_id=user.id, tipo="COMPRA", monto_usdt=monto, precio_tasa=precio)
        db.add(nuevo_trade)
        await db.commit()
        return {"respuesta": f"Ok {user.username}, anotado: {monto} USDT a {precio} Bs."}

    if any(x in mensaje_clean for x in ["ganando", "perdiendo", "estatus"]):
        query = select(Trade).where(Trade.user_id == user.id, Trade.tipo == "COMPRA").order_by(Trade.fecha.desc())
        res_trade = await db.execute(query)
        u_compra = res_trade.scalar_one_of_none()
        
        if not u_compra: return {"respuesta": "No tienes compras registradas."}
        
        tasa_ahora = await get_binance()
        p_actual = float(tasa_ahora.get('usdt'))
        p_compra = float(u_compra.precio_tasa)
        diff = (p_actual - p_compra) / p_compra * 100

        return {"respuesta": f"Compraste a {p_compra} y ahora está en {p_actual}. Vas un {round(diff, 2)}% {'arriba 📈' if diff >= 0 else 'abajo 📉'}."}

    return {"respuesta": f"Hola {user.username}, dime 'Compré [monto]' o pregúntame cuánto vas ganando."}