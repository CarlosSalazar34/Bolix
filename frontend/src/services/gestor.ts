import { api } from './api'

// ── Tipos para el Gestor ─────────────────────────────────────────────────────

export interface GestorCategory {
  id: number
  user_id: number
  nombre: string
  icono: string
  color: string
  tipo: 'gasto' | 'ingreso'
  es_default: boolean
  created_at: string
}

export interface GestorRecord {
  id: number
  user_id: number
  tipo: 'ingreso' | 'gasto'
  monto: number
  categoria_id: number
  descripcion: string | null
  fecha: string
  wallet_id: number
  tasa_aplicada: 'bcv' | 'binance' | 'promedio' | 'otro'
  tasa_valor: number
  monto_convertido: number
  created_at: string
  categoria: GestorCategory
}

export interface GestorRecordCreate {
  tipo: 'ingreso' | 'gasto'
  monto: number
  categoria_id: number
  descripcion?: string
  wallet_id: number
  tasa_aplicada: 'bcv' | 'binance' | 'promedio' | 'otro'
  tasa_valor: number
  monto_convertido: number
}

export interface GestorCategoryCreate {
  nombre: string
  icono?: string
  color?: string
  tipo: 'gasto' | 'ingreso'
  es_default?: boolean
}

export interface GestorSummary {
  total_ingresos: number
  total_gastos: number
  balance: number
  count_ingresos: number
  count_gastos: number
  ultima_actualizacion: string
}

// ── Funciones de API ─────────────────────────────────────────────────────────

export const fetchGestorCategories = async (): Promise<GestorCategory[]> => {
  const { data } = await api.get<GestorCategory[]>('/gestor/categories')
  return data
}

export const createGestorCategory = async (category: GestorCategoryCreate): Promise<GestorCategory> => {
  const { data } = await api.post<GestorCategory>('/gestor/categories', category)
  return data
}

export const fetchGestorRecords = async (skip = 0, limit = 50): Promise<GestorRecord[]> => {
  const { data } = await api.get<GestorRecord[]>('/gestor/records', {
    params: { skip, limit }
  })
  return data
}

export const createGestorRecord = async (record: GestorRecordCreate): Promise<GestorRecord> => {
  const { data } = await api.post<GestorRecord>('/gestor/records', record)
  return data
}

export const updateGestorRecord = async (id: number, record: GestorRecordCreate): Promise<GestorRecord> => {
  const { data } = await api.put<GestorRecord>(`/gestor/records/${id}`, record)
  return data
}

export const deleteGestorRecord = async (id: number): Promise<{ message: string }> => {
  const { data } = await api.delete<{ message: string }>(`/gestor/records/${id}`)
  return data
}

export const fetchGestorSummary = async (): Promise<GestorSummary> => {
  const { data } = await api.get<GestorSummary>('/gestor/summary')
  return data
}
