from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class GestorCategoryBase(BaseModel):
    nombre: str
    icono: str = "💰"
    color: str = "emerald"
    tipo: str  # 'gasto' o 'ingreso'
    es_default: bool = False

class GestorCategoryCreate(GestorCategoryBase):
    pass

class GestorCategory(GestorCategoryBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class GestorRecordBase(BaseModel):
    tipo: str  # 'ingreso' o 'gasto'
    monto: float
    categoria_id: int
    descripcion: Optional[str] = None
    wallet_id: int
    tasa_aplicada: str  # 'bcv', 'binance', 'promedio', 'otro'
    tasa_valor: float
    monto_convertido: float

class GestorRecordCreate(GestorRecordBase):
    pass

class GestorRecord(GestorRecordBase):
    id: int
    user_id: int
    fecha: datetime
    created_at: datetime
    categoria: GestorCategory
    
    class Config:
        from_attributes = True

class GestorSummary(BaseModel):
    total_ingresos: float
    total_gastos: float
    balance: float
    count_ingresos: int
    count_gastos: int
    ultima_actualizacion: datetime
