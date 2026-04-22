from pydantic import BaseModel
from datetime import datetime
from typing import Any, Dict, Optional

class CacheData(BaseModel):
    euro_bcv: float
    promedio: float
    dolar_bcv: float
    usdt_binance: float
    estatus_mercado: str
    brecha_porcentual: str

class CacheBase(BaseModel):
    key: str
    data: CacheData

class CacheResponse(CacheBase):
    created_at: datetime

    class Config:
        from_attributes = True