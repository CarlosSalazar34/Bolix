const API_BASE = import.meta.env.VITE_API_URL;

function getHeaders() {
  const token = localStorage.getItem('bolix_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface TasaResponse {
  dolar_bcv: number
  euro_bcv: number
  usdt_binance: number
  promedio: number
  brecha_porcentual: string
  estatus_mercado: string
  error?: string
}

export interface HistorialItem {
  fecha: string
  dolar_bcv: number
  usdt_binance: number
  promedio: number
  brecha: string
}

export interface HistorialResponse {
  status: string
  count: number
  data: HistorialItem[]
  error?: string
}

export interface StatusResponse {
  version: string
  status: string
  fuentes: string[]
  cache_ttl: string
  redis: string
  uptime: string
}

// ── API Calls ──────────────────────────────────────────────────────────────
export async function fetchTasas(): Promise<TasaResponse> {
  const res = await fetch(`${API_BASE}/tasa`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  if (data.dolar_bcv === undefined) throw new Error('Respuesta incompleta del servidor')
  return data
}

export async function fetchHistorial(): Promise<HistorialResponse> {
  const res = await fetch(`${API_BASE}/historial`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE}/status`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function sendChatMessage(mensaje: string): Promise<{ respuesta: string }> {
  const res = await fetch(`${API_BASE}/bot/consultar?mensaje=${encodeURIComponent(mensaje)}`, {
    method: 'POST',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  return res.json()
}
