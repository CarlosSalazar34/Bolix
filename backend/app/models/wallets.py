from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base 

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"))
    nombre = Column(String(255), nullable=False)
    moneda = Column(String(10), nullable=False)
    # Coincidiendo con NUMERIC(12, 2)
    saldo = Column(Numeric(precision=12, scale=2), default=0.00)
    es_principal_usdt = Column(Boolean, default=False)
    # Coincidiendo con TIMESTAMP
    fecha_creacion = Column(DateTime, server_default=func.now())