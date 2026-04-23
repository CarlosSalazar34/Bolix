import os
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app import models
from dotenv import load_dotenv

# Colores para la terminal

RED = "\033[91m"

RESET = "\033[0m"

load_dotenv()

# Configuraciones

SECRET_KEY = os.getenv("JWT_SECRET")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

API_KEY_BOLIX = os.getenv("API_KEY_BOLIX")

# Esto es lo que activa el candado en Swagger y busca el token en el Header Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar la sesión",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodificamos el token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub") # Normalmente el 'sub' guarda el email o username
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Buscamos al usuario en la DB
    result = await db.execute(select(models.User).where(models.User.username == email))
    user = result.scalars().first()

    if user is None:
        raise credentials_exception
        
    return user # El objeto usuario queda disponible para tus rutas