import { useState, useEffect } from 'react'
import { fetchStatus } from '../services/api'
import type { StatusResponse } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function PerfilPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, logout } = useAuth()
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

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

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled)
    // En un caso real, aquí se llamaría a /subscribe o se pediría permiso al navegador
    if (!notificationsEnabled) {
      alert("Mano, activaste las notificaciones. ¡Pendiente con el precio!")
    }
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
    <div className="flex flex-col gap-8 pb-10 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-2xl font-bold">
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
          <p className="text-zinc-400 text-sm">Gestiona tu cuenta y ajustes</p>
        </div>
      </div>

      {/* Info de Usuario */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Nombre de Usuario</label>
          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white flex justify-between items-center">
            <span className="font-semibold">{user?.username}</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase font-bold">Activo</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Notificaciones</h3>
            <p className="text-zinc-500 text-xs">Alertas de precio y movimientos</p>
          </div>
          <button 
            onClick={toggleNotifications}
            className={`w-12 h-6 rounded-full transition-all duration-300 relative ${notificationsEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${notificationsEnabled ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>
      </div>

      {/* Status del Sistema */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Estado del Sistema</h3>
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <div className="w-4 h-4 border border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Cargando info...
          </div>
        ) : status ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden divide-y divide-zinc-800">
            {items.map((item) => (
              <div key={item.label} className="flex justify-between items-center px-4 py-3.5">
                <span className="text-zinc-400 text-xs">{item.label}</span>
                <span className="text-emerald-400 text-xs font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-zinc-800 text-center text-zinc-500 text-xs">
            No se pudo conectar con el servidor
          </div>
        )}
      </div>

      <button
        onClick={logout}
        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-4 rounded-2xl font-bold transition-all active:scale-95"
      >
        Cerrar Sesión
      </button>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm text-center">
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}
