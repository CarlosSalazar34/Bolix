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

async def procesar_audio_inteligente(audio_path, info_wallets_string):
    """
    info_wallets_string: Una lista con nombres y saldos
    ej: ['Banesco (100.00 BS)', 'Principal USDT (50.00 USDT)']
    """
    model = genai.GenerativeModel("gemini-flash-latest")
    audio_file = genai.upload_file(path=audio_path)
    
    wallets_contexto = ", ".join(info_wallets_string)
    
    prompt = f"""
Eres 'Bolo', el asistente de Bolix. Tu personalidad: Caraqueño, directo, usa jerga (mano, fino, pana, qloq).
El usuario tiene estas wallets y saldos: {wallets_contexto}.

INSTRUCCIONES:
1. Analiza el audio para identificar la ACCIÓN, MONTO y Wallets.
2. Si el usuario dice cuánto pagó en total (ej: "compré 10 usdt y pagué 500bs"), calcula la tasa y ponla en "tasa_usuario".
3. Si NO menciona wallets, pon "accion": "CONSULTA" y pide los nombres de las wallets.
4. Siempre devuelve este JSON:
{{
    "accion": "COMPRA" | "VENTA" | "TRANSFERENCIA" | "CONSULTA",
    "monto": float,
    "tasa_usuario": float (opcional, null si no la dice),
    "wallet_origen": "nombre exacto (o null)",
    "wallet_destino": "nombre exacto (o null)",
    "respuesta_bolo": "Tu respuesta bien criolla"
}}
    """
    
    response = model.generate_content([prompt, audio_file])
    import json
    return json.loads(response.text.replace("```json", "").replace("```", ""))

async def procesar_texto_inteligente(texto, info_wallets_string):
    model = genai.GenerativeModel("gemini-flash-latest")
    
    wallets_contexto = ", ".join(info_wallets_string)
    
    prompt = f"""
Eres 'Bolo', el asistente de Bolix. Tu personalidad: Caraqueño, directo, usa jerga (mano, fino, pana, qloq).
El usuario tiene estas wallets y saldos: {wallets_contexto}.

INSTRUCCIONES:
1. Analiza el texto: "{texto}"
2. Identifica la ACCIÓN (COMPRA, VENTA, TRANSFERENCIA, CONSULTA).
3. Identifica el MONTO (siempre en la moneda de destino si es posible, o el monto principal).
4. IMPORTANTE: Si el usuario dice cuánto pagó en total (ej: "compré 10 usdt y pagué 500bs"), calcula la tasa (500/10 = 50) y ponla en "tasa_usuario".
5. Si el usuario NO menciona wallets, pon "accion": "CONSULTA" y pide los nombres de las wallets (menciona sus opciones).
6. Siempre devuelve este JSON:
{{
    "accion": "COMPRA" | "VENTA" | "TRANSFERENCIA" | "CONSULTA",
    "monto": float,
    "tasa_usuario": float (opcional, null si no la dice),
    "wallet_origen": "nombre exacto (o null)",
    "wallet_destino": "nombre exacto (o null)",
    "respuesta_bolo": "Tu respuesta bien criolla"
}}
    """
    
    response = model.generate_content(prompt)
    import json
    return json.loads(response.text.replace("```json", "").replace("```", ""))


# En app/services/bolo_logic.py
async def obtener_estado_mercado():
    tasa = await get_binance()
    precio = float(tasa.get('usdt'))
    # Aquí podrías comparar con el precio de hace 1 hora
    return f"Mano, el mercado está movido. El USDT cerró en {precio}. ¡Atento a las notificaciones!"