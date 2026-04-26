import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv('backend/.env')

async def migrate():
    url = os.getenv('DATABASE_URL')
    if not url:
        print("No se encontró DATABASE_URL")
        return
    
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
    engine = create_async_engine(url)
    
    try:
        async with engine.begin() as conn:
            print("Añadiendo columna 'wallet_id' a la tabla 'transacciones'...")
            # ALTER TABLE para añadir la columna
            await conn.execute(text("""
                ALTER TABLE transacciones 
                ADD COLUMN IF NOT EXISTS wallet_id INTEGER REFERENCES wallets(id);
            """))
            print("¡Columna añadida con éxito!")
                
    except Exception as e:
        print(f"Error durante la migración: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
