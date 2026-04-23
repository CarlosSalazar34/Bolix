from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class HistoryBase(BaseModel):
    fecha: str
    dolar_bcv: float
    usdt_binance: float
    promedio: float
    brecha: str

class HistoryCreate(HistoryBase):
    pass

class HistoryResponse(HistoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True