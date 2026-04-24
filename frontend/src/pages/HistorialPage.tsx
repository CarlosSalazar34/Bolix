import { useState, useEffect } from 'react'
import HistoryItem from '../components/HistoryItem'
import { fetchHistorial } from '../services/api'
import type { HistorialItem } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function HistorialPage() {
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { logout } = useAuth()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchHistorial()
        setHistorial(data.data || [])
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error de conexión'
        if (msg === 'Unauthorized') {
          logout()
        } else {
          setError(msg)
        }
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
        <p className="text-zinc-400 text-sm">Cargando historial...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Historial</h1>
        <p className="text-zinc-400 text-sm mt-1">Últimas {historial.length} consultas</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {historial.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-white font-semibold">Sin registros</p>
          <p className="text-zinc-500 text-sm text-center max-w-48">
            El historial se llena automáticamente con cada consulta a /tasa
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          {historial.map((h, i) => (
            <HistoryItem
              key={i}
              fecha={h.fecha}
              dolar_bcv={h.dolar_bcv}
              binance={h.usdt_binance}
              promedio={h.promedio}
              brecha={h.brecha}
              index={i + 1}
              showBorder={i > 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
