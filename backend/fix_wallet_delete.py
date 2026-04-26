import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv('backend/.env')

async def fix():
    url = os.getenv('DATABASE_URL')
    if not url: return
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
    engine = create_async_engine(url)
    
    try:
        async with engine.begin() as conn:
            print("Actualizando regla de eliminación para transacciones...")
            
            # Intentamos borrar el constraint viejo si existe
            # El nombre suele ser transacciones_wallet_id_fkey
            try:
                await conn.execute(text("ALTER TABLE transacciones DROP CONSTRAINT IF EXISTS transacciones_wallet_id_fkey;"))
            except:
                pass
                
            # Añadimos el nuevo con ON DELETE SET NULL
            await conn.execute(text("""
                ALTER TABLE transacciones 
                ADD CONSTRAINT transacciones_wallet_id_fkey 
                FOREIGN KEY (wallet_id) REFERENCES wallets(id) 
                ON DELETE SET NULL;
            """))
            print("¡Regla actualizada! Ahora puedes borrar billeteras con historial.")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix())
