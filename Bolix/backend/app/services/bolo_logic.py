import os
import google.generativeai as genai
from sqlalchemy import select, func
from app.models.trade import Trade
from app.models.wallet import Wallet
from functions.dolar import get_binance

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def calcular_ganancias_totales(user_id, db):
    """Calcula cuánto ha ganado el usuario basándose en su precio promedio de compra vs actual"""
    tasa_ahora = await get_binance()
    p_actual = float(tasa_ahora.get('usdt'))
    
    # Buscamos todas las compras
    query = select(Trade).where(Trade.user_id == user_id, Trade.tipo == "COMPRA")
    result = await db.execute(query)
    trades = result.scalars().all()
    
    if not trades:
        return 0.0, p_actual, "No tienes trades registrados, mano."

    total_usdt = sum(t.monto_usdt for t in trades)
    # Precio promedio ponderado
    costo_total_bs = sum(t.monto_usdt * t.precio_tasa for t in trades)
    p_promedio = costo_total_bs / total_usdt
    
    diff_porcentaje = ((p_actual - p_promedio) / p_promedio) * 100
    
    return round(diff_porcentaje, 2), p_actual, None

async def procesar_audio_inteligente(audio_path, wallets_usuario):
    """
    wallets_usuario: Una lista con los nombres de las wallets que el usuario tiene creadas
    ej: ['Banesco', 'Mercantil', 'Efectivo', 'Principal USDT']
    """
    model = genai.GenerativeModel("gemini-1.5-flash")
    audio_file = genai.upload_file(path=audio_path)
    
    # Le pasamos sus wallets reales para que no invente nombres
    nombres_wallets = ", ".join(wallets_usuario)
    
    prompt = prompt = f"""
Eres 'Bolo', el asistente de Bolix. Tu personalidad: Caraqueño, directo, usa jerga (mano, fino, pana, qloq).
Las wallets reales del usuario son: {nombres_wallets}.

INSTRUCCIONES:
1. Si el usuario dice "Compré 50 en Banesco", asume: origen='Banesco', destino='Principal USDT' (o la que diga USDT).
2. Si dice "Vendí 20 por Mercantil", asume: origen='Principal USDT', destino='Mercantil'.
3. Siempre devuelve este JSON:
{{
    "accion": "COMPRA" | "VENTA" | "TRANSFERENCIA" | "CONSULTA",
    "monto": float,
    "wallet_origen": "nombre exacto de la lista",
    "wallet_destino": "nombre exacto de la lista",
    "respuesta_bolo": "Tu respuesta bien criolla"
}}


    Si el usuario dice "Metí 100 de Banesco", origen es 'Banesco' y destino es 'Principal USDT'.
    Si no menciona una wallet de la lista, usa 'Desconocido'.
    """
    
    response = model.generate_content([prompt, audio_file])
    # Aquí parseamos el texto a diccionario de Python
    import json
    return json.loads(response.text.replace("```json", "").replace("```", ""))

# En app/services/bolo_logic.py
async def obtener_estado_mercado():
    tasa = await get_binance()
    precio = float(tasa.get('usdt'))
    # Aquí podrías comparar con el precio de hace 1 hora
    return f"Mano, el mercado está movido. El USDT cerró en {precio}. ¡Atento a las notificaciones!"