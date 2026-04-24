import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv('backend/.env')

async def create_wallet():
    url = os.getenv('DATABASE_URL')
    if not url: return
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
    engine = create_async_engine(url)
    
    try:
        async with engine.begin() as conn:
            # Buscamos el ID de pepe
            res = await conn.execute(text("SELECT id FROM usuarios WHERE username = 'pepe'"))
            user = res.fetchone()
            
            if not user:
                print("No se encontró al usuario 'pepe'")
                return
            
            user_id = user[0]
            print(f"Creando billetera principal para pepe (ID: {user_id})...")
            
            # Limpiamos billeteras viejas para que no haya conflictos de "principal"
            await conn.execute(text(f"DELETE FROM wallets WHERE user_id = {user_id}"))
            
            # Insertar la nueva billetera
            await conn.execute(text(f"""
                INSERT INTO wallets (nombre, moneda, saldo, es_principal_usdt, user_id)
                VALUES ('Binance Principal', 'USDT', 0.0, True, {user_id})
            """))
            
            print("\n¡Billetera de pepe creada exitosamente!")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_wallet())
