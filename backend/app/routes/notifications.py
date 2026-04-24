import os
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pywebpush import webpush, WebPushException
from pydantic import BaseModel
from typing import Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.push_subscription import PushSubscription
from middleware.auth import get_current_user

router = APIRouter()



class KeysModel(BaseModel):
    p256dh: str
    auth: str

class SubscriptionModel(BaseModel):
    endpoint: str
    keys: KeysModel

@router.post("/subscribe")
async def subscribe_notification(
    subscription: SubscriptionModel,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # user ya es el objeto recuperado por get_current_user

    # 2. Check if subscription already exists
    sub_query = select(PushSubscription).where(PushSubscription.endpoint == subscription.endpoint)
    sub_result = await db.execute(sub_query)
    existing_sub = sub_result.scalars().first()

    if existing_sub:
        # update if user changed or just return ok
        if existing_sub.user_id != user.id:
            existing_sub.user_id = user.id
            existing_sub.p256dh = subscription.keys.p256dh
            existing_sub.auth = subscription.keys.auth
            await db.commit()
        return {"message": "Subscription updated"}

    # 3. Create new subscription
    new_sub = PushSubscription(
        user_id=user.id,
        endpoint=subscription.endpoint,
        p256dh=subscription.keys.p256dh,
        auth=subscription.keys.auth
    )
    
    db.add(new_sub)
    await db.commit()

    return {"message": "Subscription added successfully"}


@router.post("/test")
async def test_notification(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # user ya es el objeto recuperado por get_current_user

    # Get user subscriptions
    sub_query = select(PushSubscription).where(PushSubscription.user_id == user.id)
    sub_result = await db.execute(sub_query)
    subscriptions = sub_result.scalars().all()

    if not subscriptions:
        raise HTTPException(status_code=400, detail="No active subscriptions found for user")

    success_count = 0
    payload = json.dumps({
        "title": "¡Prueba Bolix!",
        "body": "Las notificaciones Web Push están funcionando correctamente.",
        "icon": "/logo.png"
    })

    vapid_priv = os.getenv("VAPID_PRIVATE_KEY")
    vapid_email = os.getenv("VAPID_CLAIM_EMAIL")
    
    if not vapid_priv or not vapid_email:
        raise HTTPException(status_code=500, detail="VAPID keys not configured on server")

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
                vapid_private_key=vapid_priv,
                vapid_claims={"sub": vapid_email}
            )
            success_count += 1
        except WebPushException as ex:
            if ex.response and ex.response.status_code in [404, 410]:
                await db.delete(sub)
                await db.commit()
            print(f"WebPush Error: {repr(ex)}")
        except Exception as e:
            print(f"Generic Error: {repr(e)}")
            raise HTTPException(status_code=500, detail=f"WebPush error: {repr(e)}")

    return {"message": f"Notifications sent successfully to {success_count} devices"}
