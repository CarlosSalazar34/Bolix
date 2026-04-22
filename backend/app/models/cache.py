from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base

class Cache(Base):
    __tablename__ = "cache"
    key = Column(String, primary_key=True, index=True)
    data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())