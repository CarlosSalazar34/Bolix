import os
from fastapi import Header, HTTPException
from dotenv import load_dotenv

load_dotenv()
API_KEY_BOLIX = os.getenv("API_KEY_BOLIX")

GREEN = "\033[92m"
BLUE = "\033[94m"
RED = "\033[91m"
RESET = "\033[0m"

#validacion para uso de la API
async def verify_token(x_api_key: str = Header(None)):
    if x_api_key != API_KEY_BOLIX:
        print(f"{RED}[SEGURIDAD]{RESET} Intento de acceso no autorizado.")
        raise HTTPException(
            status_code=403, 
            detail="No tienes permiso")