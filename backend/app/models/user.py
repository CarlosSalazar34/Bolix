from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..database import Base

class User(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    pago_banco = Column(String, nullable=True)
    pago_telefono = Column(String, nullable=True)
    pago_cedula = Column(String, nullable=True)
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())

    # Recuperación de contraseña
    reset_token = Column(String, nullable=True)
    reset_token_expiry = Column(DateTime(timezone=True), nullable=True)