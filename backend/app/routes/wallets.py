from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
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

@router.delete("/{wallet_id}")
async def delete_wallet(wallet_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Wallet).where(Wallet.id == wallet_id, Wallet.user_id == current_user.id))
    wallet = result.scalars().first()
    
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet no encontrada")
    
    await db.delete(wallet)
    await db.commit()
    return {"status": "success", "message": "Wallet eliminada"}

class WalletUpdate(BaseModel):
    nombre: str | None = None
    saldo: float | None = None
    es_principal_usdt: bool | None = None

@router.put("/{wallet_id}")
async def update_wallet(wallet_id: int, update_data: WalletUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Wallet).where(Wallet.id == wallet_id, Wallet.user_id == current_user.id))
    wallet = result.scalars().first()
    
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet no encontrada")
    
    if update_data.nombre is not None:
        wallet.nombre = update_data.nombre
    if update_data.saldo is not None:
        wallet.saldo = update_data.saldo
    if update_data.es_principal_usdt is not None:
        wallet.es_principal_usdt = update_data.es_principal_usdt
        
    await db.commit()
    await db.refresh(wallet)
    return wallet
