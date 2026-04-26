from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class GestorCategory(Base):
    __tablename__ = "gestor_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    nombre = Column(String(100), nullable=False)
    icono = Column(String(50), default="💰")
    color = Column(String(20), default="emerald")
    tipo = Column(String(10), nullable=False)  # 'gasto' o 'ingreso'
    es_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relación
    records = relationship("GestorRecord", back_populates="categoria")

class GestorRecord(Base):
    __tablename__ = "gestor_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tipo = Column(String(10), nullable=False)  # 'ingreso' o 'gasto'
    monto = Column(Float, nullable=False)
    categoria_id = Column(Integer, ForeignKey("gestor_categories.id"), nullable=False)
    descripcion = Column(String(500))
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=False)
    tasa_aplicada = Column(String(20), nullable=False)  # 'bcv', 'binance', 'promedio', 'otro'
    tasa_valor = Column(Float, nullable=False)  # valor de la tasa usada para conversión
    monto_convertido = Column(Float, nullable=False)  # monto en moneda de la wallet
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    categoria = relationship("GestorCategory", back_populates="records")
    wallet = relationship("Wallet", back_populates="gestor_records")
