from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.trade import Trade
from app.models.wallets import Wallet
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from middleware.auth import get_current_user

router = APIRouter(prefix="/trades", tags=["Transacciones"])

# Esquema limpio: El usuario ya no envía user_id, se extrae del Token
# Esquema limpio: El usuario ya no envía user_id, se extrae del Token
class TradeCreate(BaseModel):
    tipo: str  # "COMPRA", "VENTA", "FONDEO"
    monto_usdt: float
    precio_tasa: float
    wallet_id: Optional[int] = None

@router.post("/registrar")
async def registrar_trade(
    trade: TradeCreate, 
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # 1. Buscar la wallet (la proporcionada o la principal por defecto)
    if trade.wallet_id:
        query_wallet = await db.execute(
            select(Wallet).filter(
                Wallet.user_id == current_user.id, 
                Wallet.id == trade.wallet_id
            )
        )
    else:
        query_wallet = await db.execute(
            select(Wallet).filter(
                Wallet.user_id == current_user.id, 
                Wallet.es_principal_usdt == True
            )
        )
    
    wallet = query_wallet.scalars().first()

    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Billetera no encontrada o no configurada"
        )

    monto_decimal = Decimal(str(trade.monto_usdt))

    # 2. Lógica de Negocio y validación de saldo
    tipo_upper = trade.tipo.upper()
    
    if tipo_upper in ["COMPRA", "FONDEO", "DEPOSITO"]:
        wallet.saldo += monto_decimal
    elif tipo_upper == "VENTA":
        if wallet.saldo < monto_decimal:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Saldo insuficiente en la billetera seleccionada"
            )
        wallet.saldo -= monto_decimal
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Tipo de transacción inválido"
        )

    # 3. Crear la instancia del modelo Trade
    nueva_trans = Trade(
        user_id=current_user.id,
        tipo=tipo_upper,
        monto_usdt=trade.monto_usdt,
        precio_tasa=trade.precio_tasa,
        wallet_id=wallet.id # Guardamos la relación
    )

    # 4. Guardar cambios (Transacción atómica)
    try:
        db.add(nueva_trans)
        await db.commit()
        await db.refresh(nueva_trans)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error al procesar el trade: {str(e)}"
        )

    return {
        "status": "success",
        "trade_id": nueva_trans.id,
        "nuevo_saldo_wallet": wallet.saldo,
        "wallet": wallet.nombre
    }

@router.get("/balance")
async def get_balance(
    tipo: Optional[str] = None, 
    fecha_inicio: Optional[datetime] = None, 
    fecha_fin: Optional[datetime] = None,
    skip: int = 0, 
    limit: int = 10, 
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # 1. Base de la consulta filtrada 100% por el dueño del Token
    query = select(Trade).where(Trade.user_id == current_user.id)

    # 2. Filtros dinámicos
    if tipo:
        query = query.where(Trade.tipo == tipo.upper())
    if fecha_inicio:
        query = query.where(Trade.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.where(Trade.fecha <= fecha_fin)

    # 3. Ejecutar historial (Ordenado por fecha más reciente)
    result = await db.execute(
        query.order_by(Trade.fecha.desc()).offset(skip).limit(limit)
    )
    trades_list = result.scalars().all()
    
    # 4. Consultar saldo actual para el resumen
    wallet_query = await db.execute(
        select(Wallet).filter(
            Wallet.user_id == current_user.id, 
            Wallet.es_principal_usdt == True
        )
    )
    wallet = wallet_query.scalars().first()

    return {
        "usuario": current_user.username,
        "email": current_user.email,
        "items_en_esta_pagina": len(trades_list),
        "pagina_actual": (skip // limit) + 1,
        "saldo_actual_usdt": wallet.saldo if wallet else 0,
        "historial": trades_list
    }

# 5. Eliminar un movimiento (Trade)
@router.delete("/{trade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trade(
    trade_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Verificamos que el trade exista y pertenezca al usuario
    result = await db.execute(
        select(Trade).where(Trade.id == trade_id, Trade.user_id == current_user.id)
    )
    db_trade = result.scalars().first()

    if not db_trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movimiento no encontrado o no autorizado"
        )

    await db.delete(db_trade)
    await db.commit()
    return None