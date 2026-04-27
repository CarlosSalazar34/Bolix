from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from typing import List
from decimal import Decimal

from app.database import get_db
from app.models.gestor import GestorRecord, GestorCategory
from app.models.wallets import Wallet
from app.schemas.gestor import GestorRecordCreate, GestorRecord as GestorRecordSchema, GestorCategoryCreate, GestorCategory as GestorCategorySchema, GestorSummary
from middleware.auth import get_current_user

router = APIRouter()

# ── CATEGORÍAS ────────────────────────────────────────────────────────────────

@router.get("/categories", response_model=List[GestorCategorySchema])
async def get_categories(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(GestorCategory).where(
        GestorCategory.user_id == current_user.id
    ).offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/categories", response_model=GestorCategorySchema)
async def create_category(
    category: GestorCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_category = GestorCategory(
        **category.dict(),
        user_id=current_user.id
    )
    db.add(db_category)
    await db.commit()
    await db.refresh(db_category)
    return db_category

@router.post("/categories/seed", response_model=List[GestorCategorySchema])
async def seed_categories(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verificar si ya tiene categorías
    existing = await db.execute(select(GestorCategory).where(GestorCategory.user_id == current_user.id))
    if existing.scalars().first():
        return []

    defaults = [
        {"nombre": "Salario", "icono": "💰", "color": "blue", "tipo": "ingreso", "es_default": True},
        {"nombre": "Regalo", "icono": "🎁", "color": "pink", "tipo": "ingreso", "es_default": True},
        {"nombre": "Interés", "icono": "🏦", "color": "green", "tipo": "ingreso", "es_default": True},
        {"nombre": "Otros", "icono": "❓", "color": "gray", "tipo": "ingreso", "es_default": True},
        {"nombre": "Salud", "icono": "❤️", "color": "red", "tipo": "gasto", "es_default": True},
        {"nombre": "Ocio", "icono": "🎮", "color": "purple", "tipo": "gasto", "es_default": True},
        {"nombre": "Casa", "icono": "🏠", "color": "yellow", "tipo": "gasto", "es_default": True},
        {"nombre": "Café", "icono": "☕", "color": "orange", "tipo": "gasto", "es_default": True},
        {"nombre": "Educación", "icono": "🎓", "color": "indigo", "tipo": "gasto", "es_default": True},
        {"nombre": "Regalos", "icono": "🎁", "color": "pink", "tipo": "gasto", "es_default": True},
        {"nombre": "Alimentación", "icono": "🛒", "color": "green", "tipo": "gasto", "es_default": True},
    ]
    
    new_cats = []
    for d in defaults:
        cat = GestorCategory(**d, user_id=current_user.id)
        db.add(cat)
        new_cats.append(cat)
    
    await db.commit()
    return new_cats

# ── RECORDS ───────────────────────────────────────────────────────────────────

@router.get("/records", response_model=List[GestorRecordSchema])
async def get_records(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(GestorRecord).options(
        selectinload(GestorRecord.categoria)
    ).where(
        GestorRecord.user_id == current_user.id
    ).order_by(GestorRecord.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/records", response_model=GestorRecordSchema)
async def create_record(
    record: GestorRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # 1. Validar que la wallet existe y pertenece al usuario
        wallet_query = select(Wallet).where(
            and_(
                Wallet.id == record.wallet_id,
                Wallet.user_id == current_user.id
            )
        )
        wallet_result = await db.execute(wallet_query)
        wallet = wallet_result.scalar_one_or_none()
        
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet no encontrada")
        
        # 2. Validar categoría
        category_query = select(GestorCategory).where(
            and_(
                GestorCategory.id == record.categoria_id,
                GestorCategory.user_id == current_user.id
            )
        )
        category_result = await db.execute(category_query)
        category = category_result.scalar_one_or_none()
        
        if not category:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
        # 3. Crear el registro
        db_record = GestorRecord(
            **record.dict(),
            user_id=current_user.id,
            fecha=datetime.now(timezone.utc)
        )
        db.add(db_record)
        
        # 4. Actualizar saldo de la wallet (lógica contable)
        monto_decimal = Decimal(str(record.monto_convertido))
        if record.tipo == "ingreso":
            new_saldo = wallet.saldo + monto_decimal
        else:  # gasto
            new_saldo = wallet.saldo - monto_decimal
            if new_saldo < 0:
                raise HTTPException(status_code=400, detail="Saldo insuficiente")
        
        await db.execute(
            update(Wallet).where(Wallet.id == record.wallet_id).values(saldo=new_saldo)
        )
        
        await db.commit()
        await db.refresh(db_record)
        
        # Cargar relación para respuesta
        result = await db.execute(
            select(GestorRecord).options(selectinload(GestorRecord.categoria))
            .where(GestorRecord.id == db_record.id)
        )
        return result.scalar_one()
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating record: {str(e)}")

@router.put("/records/{record_id}", response_model=GestorRecordSchema)
async def update_record(
    record_id: int,
    record_update: GestorRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # 1. Obtener registro original
        record_query = select(GestorRecord).options(
            selectinload(GestorRecord.categoria),
            selectinload(GestorRecord.wallet)
        ).where(
            and_(
                GestorRecord.id == record_id,
                GestorRecord.user_id == current_user.id
            )
        )
        result = await db.execute(record_query)
        record = result.scalar_one_or_none()
        
        if not record:
            raise HTTPException(status_code=404, detail="Record no encontrado")
        
        original_wallet = record.wallet
        
        # 2. Revertir cambio original en wallet
        original_monto_decimal = Decimal(str(record.monto_convertido))
        if record.tipo == "ingreso":
            original_wallet.saldo -= original_monto_decimal
        else:  # gasto
            original_wallet.saldo += original_monto_decimal
        
        # 3. Validar nueva wallet si cambió
        if record_update.wallet_id != record.wallet_id:
            new_wallet_query = select(Wallet).where(
                and_(
                    Wallet.id == record_update.wallet_id,
                    Wallet.user_id == current_user.id
                )
            )
            new_wallet_result = await db.execute(new_wallet_query)
            new_wallet = new_wallet_result.scalar_one_or_none()
            
            if not new_wallet:
                raise HTTPException(status_code=404, detail="Nueva wallet no encontrada")
            
            target_wallet = new_wallet
        else:
            target_wallet = original_wallet
        
        # 4. Aplicar nuevo cambio
        new_monto_decimal = Decimal(str(record_update.monto_convertido))
        if record_update.tipo == "ingreso":
            new_saldo = target_wallet.saldo + new_monto_decimal
        else:  # gasto
            new_saldo = target_wallet.saldo - new_monto_decimal
            if new_saldo < 0:
                raise HTTPException(status_code=400, detail="Saldo insuficiente")
        
        # 5. Actualizar registro
        for field, value in record_update.dict().items():
            setattr(record, field, value)
        
        # 6. Actualizar saldos de wallets
        # Actualizamos la wallet original (que ya tiene el saldo revertido)
        # Y luego la target_wallet (que puede ser la misma o una nueva)
        if record_update.wallet_id != record.wallet_id:
             # Si cambió de wallet, actualizamos ambas
             target_wallet.saldo = new_saldo
        else:
             # Si es la misma, el saldo final es new_saldo
             original_wallet.saldo = new_saldo
        
        await db.commit()
        await db.refresh(record)
        
        return record
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating record: {str(e)}")

@router.delete("/records/{record_id}")
async def delete_record(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # 1. Obtener registro con wallet
        record_query = select(GestorRecord).options(
            selectinload(GestorRecord.wallet)
        ).where(
            and_(
                GestorRecord.id == record_id,
                GestorRecord.user_id == current_user.id
            )
        )
        result = await db.execute(record_query)
        record = result.scalar_one_or_none()
        
        if not record:
            raise HTTPException(status_code=404, detail="Record no encontrado")
        
        # 2. Revertir saldo en wallet
        wallet = record.wallet
        monto_decimal = Decimal(str(record.monto_convertido))
        if record.tipo == "ingreso":
            wallet.saldo -= monto_decimal
        else:  # gasto
            wallet.saldo += monto_decimal
        
        # 3. Eliminar registro y actualizar wallet
        await db.delete(record)
        
        await db.commit()
        return {"message": "Record eliminado exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting record: {str(e)}")

@router.get("/summary", response_model=GestorSummary)
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Obtener todos los records del usuario
    records_query = select(GestorRecord).where(
        GestorRecord.user_id == current_user.id
    )
    result = await db.execute(records_query)
    records = result.scalars().all()
    
    # Calcular totales
    ingresos = sum(r.monto_convertido for r in records if r.tipo == "ingreso")
    gastos = sum(r.monto_convertido for r in records if r.tipo == "gasto")
    count_ingresos = len([r for r in records if r.tipo == "ingreso"])
    count_gastos = len([r for r in records if r.tipo == "gasto"])
    
    return GestorSummary(
        total_ingresos=ingresos,
        total_gastos=gastos,
        balance=ingresos - gastos,
        count_ingresos=count_ingresos,
        count_gastos=count_gastos,
        ultima_actualizacion=datetime.now(timezone.utc)
    )
