from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from decimal import Decimal

class WalletBase(BaseModel):
    nombre: str
    moneda: str
    saldo: Decimal = Field(default=0.00, max_digits=12, decimal_places=2)
    es_principal_usdt: bool = False

# ESTA ES LA CLASE QUE FALTA SEGÚN EL ERROR
class WalletCreate(WalletBase):
    user_id: int

class WalletResponse(WalletBase):
    id: int
    user_id: int
    fecha_creacion: datetime

    class Config:
        # Crucial para que Pydantic lea objetos de SQLAlchemy
        from_attributes = True
        
class WalletUpdate(BaseModel):
    nombre: Optional[str] = None
    es_principal_usdt: Optional[bool] = None