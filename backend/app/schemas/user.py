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
    fecha_registro: datetime

    class Config:
        from_attributes = True