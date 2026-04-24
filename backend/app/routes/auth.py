import os

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import bcrypt
from dotenv import load_dotenv

from jose import jwt

# Importes de tu estructura local
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdatePago
from app.schemas.token import Token
from middleware.auth import get_current_user

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

def create_access_token(data: dict):
    to_encode = data.copy()
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