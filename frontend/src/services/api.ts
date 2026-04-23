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

export interface Wallet {
  id: number
  nombre: string
  moneda: string
  saldo: number
  es_principal_usdt: boolean
}

export interface ChatResponse {
  respuesta: string
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

// ── Chatbot (Bolo) ─────────────────────────────────────────────────────────
export async function boloTool(tool: 'ganancias' | 'saldo' | 'mercado'): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/bot/herramientas/${tool}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Error al ejecutar herramienta')
  return res.json()
}

export async function boloTexto(texto: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/bot/texto`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ texto })
  })
  if (!res.ok) throw new Error('Error al enviar texto a Bolo')
  return res.json()
}

export async function boloVoz(audioBlob: Blob): Promise<ChatResponse> {
  const formData = new FormData()
  formData.append('file', audioBlob, 'voice_note.webm')

  const token = localStorage.getItem('bolix_token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const res = await fetch(`${API_BASE}/bot/voz`, {
    method: 'POST',
    headers: headers as Record<string, string>, // <--- El cambio está aquí
    body: formData
  })
  if (!res.ok) throw new Error('Error al enviar audio a Bolo')
  return res.json()
}
// ── Wallets ───────────────────────────────────────────────────────────────
export async function fetchWallets(): Promise<Wallet[]> {
  const res = await fetch(`${API_BASE}/wallets/`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Error al cargar wallets')
  return res.json()
}

export async function createWallet(wallet: Partial<Wallet>): Promise<Wallet> {
  const res = await fetch(`${API_BASE}/wallets/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(wallet)
  })
  if (!res.ok) throw new Error('Error al crear wallet')
  return res.json()
}

export async function deleteWallet(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/wallets/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al eliminar wallet')
}

export async function updateWallet(id: number, data: Partial<Wallet>): Promise<Wallet> {
  const res = await fetch(`${API_BASE}/wallets/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Error al actualizar wallet')
  return res.json()
}
