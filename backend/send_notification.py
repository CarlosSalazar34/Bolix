import asyncio
import os
import json
import argparse
from dotenv import load_dotenv
from pywebpush import webpush, WebPushException
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

# Forzar carga de variables desde .env
load_dotenv()

# Ajustar la ruta para poder importar de app
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.user import User
from app.models.push_subscription import PushSubscription

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_CLAIM_EMAIL = os.getenv("VAPID_CLAIM_EMAIL")

async def send_notification_to_user(username: str, title: str, body: str):
    if not VAPID_PRIVATE_KEY or not VAPID_CLAIM_EMAIL:
        print("❌ Error: Faltan las claves VAPID en el archivo .env")
        return

    engine = create_async_engine(DATABASE_URL, echo=False)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        # Buscar usuario
        query = select(User).where(User.username == username)
        result = await session.execute(query)
        user = result.scalars().first()

        if not user:
            print(f"❌ Error: Usuario '{username}' no encontrado en la base de datos.")
            return

        # Buscar suscripciones del usuario
        sub_query = select(PushSubscription).where(PushSubscription.user_id == user.id)
        sub_result = await session.execute(sub_query)
        subscriptions = sub_result.scalars().all()

        if not subscriptions:
            print(f"⚠️ El usuario '{username}' no tiene notificaciones activadas.")
            return

        print(f"Enviando notificación a {len(subscriptions)} dispositivos del usuario '{username}'...")
        
        payload = json.dumps({
            "title": title,
            "body": body,
            "icon": "/logo.png"
        })

        success_count = 0
        for sub in subscriptions:
            try:
                sub_info = {
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth": sub.auth
                    }
                }
                webpush(
                    subscription_info=sub_info,
                    data=payload,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": VAPID_CLAIM_EMAIL}
                )
                success_count += 1
            except WebPushException as ex:
                if ex.response and ex.response.status_code in [404, 410]:
                    print(f"[-] Suscripción expirada, eliminando de BD...")
                    await session.delete(sub)
                    await session.commit()
                else:
                    print(f"[-] WebPush Error: {repr(ex)}")
            except Exception as e:
                print(f"[-] Error inesperado: {repr(e)}")

        print(f"✅ Notificación enviada con éxito a {success_count} dispositivos.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Enviar notificación Web Push a un usuario de Bolix.")
    parser.add_argument("username", type=str, help="Nombre de usuario destino")
    parser.add_argument("--title", type=str, default="Aviso de Bolix", help="Título de la notificación")
    parser.add_argument("--body", type=str, required=True, help="Cuerpo/Mensaje de la notificación")
    
    args = parser.parse_args()
    
    asyncio.run(send_notification_to_user(args.username, args.title, args.body))
