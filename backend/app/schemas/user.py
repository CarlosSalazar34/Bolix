from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Lo que el frontend envía para registrarse
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

# Lo que la API devuelve (Sin la contraseña, por seguridad)
class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    pago_banco: Optional[str] = None
    pago_telefono: Optional[str] = None
    pago_cedula: Optional[str] = None
    fecha_registro: datetime

    class Config:
        from_attributes = True

# Esquema para actualizar solo datos de pago
class UserUpdatePago(BaseModel):
    pago_banco: str
    pago_telefono: str
    pago_cedula: str

# Recuperación de contraseña
class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    new_password: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str