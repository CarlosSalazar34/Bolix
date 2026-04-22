from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class WalletBase(BaseModel):
    nombre: str = Field(..., example="Banesco")
    moneda: str = Field(..., pattern="^(BS|USDT)$", example="BS")
    saldo: float = Field(0.0, ge=0)
    es_principal_usdt: bool = False

class WalletCreate(WalletBase):
    pass

class WalletUpdate(BaseModel):
    nombre: Optional[str] = None
    saldo: Optional[float] = None
    es_principal_usdt: Optional[bool] = None

class WalletOut(WalletBase):
    id: int
    user_id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True