from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.wallet import Wallet
from app.models.user import User
from pydantic import BaseModel
from middleware.auth import get_current_user
from typing import List

router = APIRouter(prefix="/wallets", tags=["Wallets"])

class WalletCreate(BaseModel):
    nombre: str
    moneda: str = "BS"
    saldo: float = 0.0
    es_principal_usdt: bool = False

@router.get("/", response_model=List[dict])
async def get_wallets(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallets = result.scalars().all()
    return [
        {
            "id": w.id,
            "nombre": w.nombre,
            "moneda": w.moneda,
            "saldo": float(w.saldo),
            "es_principal_usdt": w.es_principal_usdt
        } for w in wallets
    ]

@router.post("/")
async def create_wallet(wallet: WalletCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    nueva = Wallet(
        user_id=current_user.id,
        nombre=wallet.nombre,
        moneda=wallet.moneda,
        saldo=wallet.saldo,
        es_principal_usdt=wallet.es_principal_usdt
    )
    db.add(nueva)
    await db.commit()
    await db.refresh(nueva)
    return nueva
