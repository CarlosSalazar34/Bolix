from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.sql import func
from app.database import Base

class History(Base):
    __tablename__ = "historial" 

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime(timezone=True), server_default=func.now()) 
    dolar_bcv = Column(Numeric(10, 2)) 
    euro_bcv = Column(Numeric(10, 2))
    usdt_binance = Column(Numeric(10, 2)) 
    usdt_avg = Column(Numeric(10, 2))
    promedio = Column(Numeric(10, 2))
    brecha = Column(String) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())