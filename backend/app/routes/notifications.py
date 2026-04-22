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

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_CLAIM_EMAIL = os.getenv("VAPID_CLAIM_EMAIL")

class KeysModel(BaseModel):
    p256dh: str
    auth: str

class SubscriptionModel(BaseModel):
    endpoint: str
    keys: KeysModel

@router.post("/subscribe")
async def subscribe_notification(
    subscription: SubscriptionModel,
    current_username: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Get user id
    query = select(User).where(User.username == current_username)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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
    current_username: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(User).where(User.username == current_username)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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
            # If subscription is expired or invalid, we could remove it here
            if ex.response and ex.response.status_code in [404, 410]:
                await db.delete(sub)
                await db.commit()
            print(f"WebPush Error: {repr(ex)}")

    return {"message": f"Notifications sent successfully to {success_count} devices"}
