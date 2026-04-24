from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from . import models, schemas

# Obtener todas las wallets de un usuario
async def get_wallets_by_user(db: AsyncSession, user_id: int):
    result = await db.execute(select(models.Wallet).filter(models.Wallet.user_id == user_id))
    return result.scalars().all()

# Crear una nueva wallet
async def create_user_wallet(db: AsyncSession, wallet: schemas.WalletCreate, user_id: int | None = None):
    wallet_data = wallet.model_dump()
    if user_id is not None:
        wallet_data["user_id"] = user_id
    db_wallet = models.Wallet(**wallet_data)
    db.add(db_wallet)
    await db.commit()
    await db.refresh(db_wallet)
    return db_wallet

# Obtener la wallet principal (aquí estaba el NameError)
async def get_principal_usdt_wallet(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(models.Wallet).filter(
            models.Wallet.user_id == user_id, 
            models.Wallet.es_principal_usdt == True
        )
    )
    return result.scalars().first()