import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv('backend/.env')

async def check():
    url = os.getenv('DATABASE_URL')
    if not url:
        print("No se encontró DATABASE_URL")
        return
    
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
    engine = create_async_engine(url)
    
    try:
        async with engine.connect() as conn:
            # Ver wallets
            res = await conn.execute(text("SELECT id, nombre, es_principal_usdt, user_id FROM wallets"))
            wallets = res.fetchall()
            print("\n--- BILLETERAS EN LA DB ---")
            if not wallets:
                print("No hay ninguna billetera creada.")
            for w in wallets:
                print(f"ID: {w[0]} | Nombre: {w[1]} | Principal: {w[2]} | Usuario ID: {w[3]}")
            
            # Ver usuarios
            res_u = await conn.execute(text("SELECT id, username FROM usuarios"))
            usuarios = res_u.fetchall()
            print("\n--- USUARIOS EN LA DB ---")
            for u in usuarios:
                print(f"ID: {u[0]} | Nombre: {u[1]}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
