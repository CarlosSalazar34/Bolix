from sqlalchemy import Column, Integer, Numeric, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from ..database import Base

class Trade(Base):
    __tablename__ = "transacciones"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"))
    tipo = Column(String) # "COMPRA" o "VENTA"
    monto_usdt = Column(Numeric(10, 2), nullable=False)
    precio_tasa = Column(Numeric(10, 2), nullable=False) # A cuánto estaba el dólar
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=True) # ID de la billetera (opcional por ahora)
    fecha = Column(DateTime(timezone=True), server_default=func.now())