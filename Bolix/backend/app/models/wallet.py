from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    nombre = Column(String, nullable=False)  # Ej: "Banesco", "Mercantil", "Zelle"
    moneda = Column(String, default="BS")    # "BS" o "USDT"
    saldo = Column(Numeric(12, 2), default=0.00)
    
    # Para que Bolo sepa dónde meter los USDT por defecto
    es_principal_usdt = Column(Boolean, default=False)
    
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())