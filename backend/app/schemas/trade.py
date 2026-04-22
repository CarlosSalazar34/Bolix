from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime

class TradeCreate(BaseModel):
    tipo: str # "COMPRA" o "VENTA"
    monto_usdt: Decimal
    precio_tasa: Decimal

class TradeOut(BaseModel):
    id: int
    user_id: int
    tipo: str
    monto_usdt: Decimal
    precio_tasa: Decimal
    fecha: datetime

    class Config:
        from_attributes = True