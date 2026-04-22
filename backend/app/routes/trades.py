from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.trade import Trade
from pydantic import BaseModel

router = APIRouter(prefix="/trades", tags=["Transacciones"])

class TradeCreate(BaseModel):
    user_id: int
    tipo: str 
    monto_usdt: float
    precio_tasa: float

@router.post("/registrar")
async def registrar_trade(trade: TradeCreate, db: AsyncSession = Depends(get_db)):
    nueva_trans = Trade( # <--- Usamos Trade
        user_id=trade.user_id,
        tipo=trade.tipo,
        monto_usdt=trade.monto_usdt,
        precio_tasa=trade.precio_tasa
    )
    db.add(nueva_trans)
    await db.commit()
    return {"status": "success", "message": "Transacción registrada"}

@router.get("/balance/{user_id}")
async def get_balance(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Trade).where(Trade.user_id == user_id))
    trades_list = result.scalars().all()
    return {"user_id": user_id, "total_operaciones": len(trades_list)}