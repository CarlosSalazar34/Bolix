import os
from fastapi import Header, HTTPException, status
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()
API_KEY_BOLIX = os.getenv("API_KEY_BOLIX")

GREEN = "\033[92m"
BLUE = "\033[94m"
RED = "\033[91m"
RESET = "\033[0m"

SECRET_KEY = os.getenv("JWT_SECRET", "bolix_secret_2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
API_KEY_BOLIX = os.getenv("API_KEY_BOLIX")

#validacion para uso de la API
async def verify_token(x_api_key: str = Header(None)):
    if x_api_key != API_KEY_BOLIX:
        print(f"{RED}[SEGURIDAD]{RESET} Intento de acceso no autorizado.")
        raise HTTPException(
            status_code=403, 
            detail="No tienes permiso")
        
async def get_current_user(authorization: str = Header(None)):
    """Extrae el usuario del token JWT enviado por la PWA"""
    token = authorization
    if not token:
        raise HTTPException(status_code=401, detail="Falta el token de sesión")
    
    try:
        # Si el token viene como "Bearer <token>", limpiamos el prefijo
        if token.startswith("Bearer "):
            token = token.split(" ")[1]
            
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            raise HTTPException(status_code=401, detail="Token inválido")
            
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Sesión expirada o token corrupto")