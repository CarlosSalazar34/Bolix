from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base

class History(Base):
    __tablename__ = "historial" 

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(String) 
    dolar_bcv = Column(Float) 
    euro_bcv = Column(Float)
    usdt_binance = Column(Float) 
    usdt_avg = Column(Float)
    promedio = Column(Float)
    brecha = Column(String) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())