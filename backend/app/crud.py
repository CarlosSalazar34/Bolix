from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from . import models, schemas

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