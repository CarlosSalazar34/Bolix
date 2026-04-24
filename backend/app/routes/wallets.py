from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
from .. import crud, schemas, database, models
from ..database import get_db
from middleware.auth import get_current_user

router = APIRouter(
    prefix="/wallets",
    tags=["wallets"]
)

# 1. Obtener todas las wallets (AUTOMÁTICO vía Token)
@router.get("/", response_model=List[schemas.WalletResponse])
async def read_user_wallets(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = await db.execute(
        select(models.Wallet).filter(models.Wallet.user_id == current_user.id)
    )
    return result.scalars().all()

# 2. Crear una nueva wallet
@router.post("/", response_model=schemas.WalletResponse)
async def create_wallet(
    wallet: schemas.WalletCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Usamos el CRUD pero forzando el user_id del token por seguridad
    return await crud.create_user_wallet(db=db, wallet=wallet, user_id=current_user.id)

# 3. Actualizar wallet (Lógica de Principal mejorada)
@router.patch("/{wallet_id}", response_model=schemas.WalletResponse)
async def update_wallet(
    wallet_id: int, 
    wallet_data: schemas.WalletUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verificamos propiedad
    result = await db.execute(
        select(models.Wallet).filter(
            models.Wallet.id == wallet_id, 
            models.Wallet.user_id == current_user.id
        )
    )
    db_wallet = result.scalars().first()
    
    if not db_wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Wallet no encontrada o no pertenece al usuario"
        )

    # Si esta se marca como principal, reseteamos las demás en la misma transacción
    if wallet_data.es_principal_usdt:
        await db.execute(
            update(models.Wallet)
            .filter(models.Wallet.user_id == current_user.id, models.Wallet.id != wallet_id)
            .values(es_principal_usdt=False)
        )

    # Actualizamos campos dinámicamente
    update_data = wallet_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_wallet, key, value)

    try:
        await db.commit()
        await db.refresh(db_wallet)
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error al actualizar la billetera"
        )
        
    return db_wallet

# 4. Eliminar wallet (Con validación de saldo)
@router.delete("/{wallet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_wallet(
    wallet_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = await db.execute(
        select(models.Wallet).filter(
            models.Wallet.id == wallet_id, 
            models.Wallet.user_id == current_user.id
        )
    )
    db_wallet = result.scalars().first()

    if not db_wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Billetera no encontrada"
        )

    if db_wallet.saldo > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No se puede eliminar una billetera con saldo positivo. Retira los fondos primero."
        )

    await db.delete(db_wallet)
    await db.commit()
    return None