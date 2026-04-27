import os

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import bcrypt
from dotenv import load_dotenv

from jose import jwt

import secrets
from datetime import datetime, timedelta, timezone

# Importes de tu estructura local
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdatePago, ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.token import Token
from middleware.auth import get_current_user
from app.utils.email_utils import send_reset_email

router = APIRouter()

load_dotenv()

# ── CONFIGURACIÓN DE SEGURIDAD ──────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
# ── FUNCIONES INTERNAS ──────────────────────────────────────────────────────
def get_password_hash(password: str):
    pwd_bytes = password.encode('utf-8')
    # bcrypt limita a 72 bytes
    if len(pwd_bytes) > 72:
        pwd_bytes = pwd_bytes[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str):
    pwd_bytes = plain_password.encode('utf-8')
    if len(pwd_bytes) > 72:
        pwd_bytes = pwd_bytes[:72]
    return bcrypt.checkpw(pwd_bytes, hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Por defecto 24 horas de validez
        expire = datetime.now(timezone.utc) + timedelta(hours=24)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ── ENDPOINTS ───────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Registra un nuevo usuario. 
    Valida automáticamente vía UserCreate (email, strings, etc.)
    """
    # 1. Verificar duplicados (username o email)
    query = select(User).where(
        (User.email == user_data.email) | (User.username == user_data.username)
    )
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(
            status_code=400, 
            detail="El usuario o el correo ya existen en Bolix."
        )
    
    # 2. Crear instancia del modelo
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password)
    )
    
    try:
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user # FastAPI lo convierte a UserOut automáticamente
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error crítico al registrar.")

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    """
    Login estándar OAuth2. 
    Recibe 'username' y 'password' (form-data).
    """
    # 1. Buscar al usuario
    query = select(User).where(User.username == form_data.username)
    result = await db.execute(query)
    user = result.scalars().first()
    
    # 2. Validar contraseña
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Generar Token
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "username": user.username,
        "id": user.id
    }

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Obtiene el perfil completo del usuario autenticado."""
    return current_user

@router.patch("/update-pago", response_model=UserOut)
async def update_pago(
    pago_data: UserUpdatePago, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualiza los datos de pago móvil del usuario."""
    current_user.pago_banco = pago_data.pago_banco
    current_user.pago_telefono = pago_data.pago_telefono
    current_user.pago_cedula = pago_data.pago_cedula
    
    try:
        await db.commit()
        await db.refresh(current_user)
        return current_user
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar datos de pago.")

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    # 1. Buscar al usuario por email
    query = select(User).where(User.email == request.email)
    result = await db.execute(query)
    user = result.scalars().first()
    
    # 2. Si no existe, igual devolvemos éxito para no revelar si el correo está registrado (Seguridad)
    if not user:
        return {"message": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."}
    
    # 3. Generar token y expiración (1 hora)
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expiry = datetime.now(timezone.utc) + timedelta(hours=1)
    
    try:
        await db.commit()
        
        # 4. Enviar correo
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        reset_link = f"{frontend_url}?reset_token={token}"
        
        success = send_reset_email(user.email, reset_link)
        if not success:
             raise HTTPException(status_code=500, detail="Error al enviar el correo de recuperación.")
             
        return {"message": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."}
    except Exception as e:
        await db.rollback()
        print(f"Error en forgot_password: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor.")

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    # 1. Buscar usuario por token y validar que no haya expirado
    query = select(User).where(
        (User.reset_token == request.token) & 
        (User.reset_token_expiry > datetime.now(timezone.utc))
    )
    result = await db.execute(query)
    user = result.scalars().first()
    
    # 2. Validar que se proporcionó una nueva contraseña
    if not request.new_password:
         raise HTTPException(status_code=400, detail="No se proporcionó una nueva contraseña.")

    # 3. Actualizar contraseña
    user.hashed_password = get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    
    try:
        await db.commit()
        return {"message": "Contraseña actualizada con éxito."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar la contraseña.")