const API_BASE = import.meta.env.VITE_API_URL || 'https://bolix-backend.vercel.app'

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

export interface TradeCreate {
  user_id: number
  tipo: 'compra' | 'venta'
  monto_usdt: number
  precio_tasa: number
}

export interface BalanceResponse {
  user_id: number
  total_operaciones: number
}

export type Wallet = {
  id: number
  nombre: string
  moneda: 'BS' | 'USDT'
  saldo: number
  es_principal_usdt: boolean
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

export async function registrarTrade(trade: TradeCreate): Promise<any> {
  const res = await fetch(`${API_BASE}/trades/registrar`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(trade)
  })
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function fetchBalance(userId: number): Promise<BalanceResponse> {
  const res = await fetch(`${API_BASE}/trades/balance/${userId}`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function fetchWallets(): Promise<Wallet[]> {
  const res = await fetch(`${API_BASE}/wallets`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function addWallet(wallet: Omit<Wallet, 'id'>): Promise<Wallet> {
  const res = await fetch(`${API_BASE}/wallets`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(wallet)
  })
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  return res.json()
}
