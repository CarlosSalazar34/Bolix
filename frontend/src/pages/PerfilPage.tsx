import { useState, useEffect } from 'react'
import { fetchStatus } from '../services/api'
import type { StatusResponse } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function PerfilPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, logout } = useAuth()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchStatus()
        setStatus(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Cargando perfil...</p>
      </div>
    )
  }

  const items = status
    ? [
        { label: 'Versión de la API', value: `v${status.version}` },
        { label: 'Estado', value: status.status === 'online' ? '🟢 En línea' : '🔴 Fuera de línea' },
        { label: 'Fuentes activas', value: status.fuentes.join(' · ') },
        { label: 'Caché TTL', value: status.cache_ttl },
        { label: 'Redis', value: status.redis === 'conectado' ? '🟢 Conectado' : '🔴 Desconectado' },
        { label: 'Uptime', value: status.uptime },
      ]
    : []

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Perfil</h1>
        <p className="text-zinc-400 text-sm mt-1">Sesión iniciada como <span className="text-emerald-400 font-semibold">{user?.username}</span></p>
      </div>

      <button
        onClick={logout}
        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3 rounded-xl font-medium transition-colors"
      >
        Cerrar Sesión
      </button>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {status && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden divide-y divide-zinc-800">
          {items.map((item) => (
            <div key={item.label} className="flex justify-between items-center px-4 py-3.5">
              <span className="text-zinc-300 text-sm">{item.label}</span>
              <span className="text-emerald-400 text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {!status && !error && (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-white font-semibold">Sin datos</p>
          <p className="text-zinc-500 text-sm text-center max-w-48">
            No se pudo obtener información del servidor
          </p>
        </div>
      )}
    </div>
  )
}
