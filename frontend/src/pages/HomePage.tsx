import { useState, useEffect, useCallback } from 'react'
import { IconRefresh } from '../components/icons'
import HeroCard from '../components/HeroCard'
import RateCard from '../components/RateCard'
import type { RateCardData } from '../components/RateCard'
import HistoryItem from '../components/HistoryItem'
import { fetchTasas, fetchHistorial } from '../services/api'
import type { TasaResponse, HistorialItem } from '../services/api'
import { registerPushNotifications, sendSubscriptionToBackend } from '../services/pushService'

export default function HomePage() {
  const [tasas, setTasas] = useState<TasaResponse | null>(null)
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const [tasaData, histData] = await Promise.all([
        fetchTasas(),
        fetchHistorial(),
      ])
      setTasas(tasaData)
      setHistorial(histData.data || [])
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Solicitar permisos de notificación apenas entre
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Solo intentar si el navegador lo soporta
        if ('Notification' in window && 'serviceWorker' in navigator) {
          // Si ya tenemos permiso, registramos silenciosamente
          // Si no, Notification.requestPermission() mostrará el prompt
          const subscription = await registerPushNotifications()
          if (subscription) {
            await sendSubscriptionToBackend(subscription)
            console.log('Push notifications registered successfully')
          }
        }
      } catch (err) {
        // Fallar silenciosamente para no interrumpir la experiencia del usuario
        console.warn('Push registration failed:', err)
      }
    }

    setupNotifications()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  // Tiempo relativo desde la última actualización
  const tiempoRelativo = () => {
    if (!lastUpdate) return '...'
    const diff = Math.floor((Date.now() - lastUpdate.getTime()) / 1000)
    if (diff < 60) return `Hace ${diff}s`
    return `Hace ${Math.floor(diff / 60)} min`
  }

  // Construir rate cards desde los datos reales
  const buildRateCards = (): RateCardData[] => {
    if (!tasas) return []
    return [
      {
        label: 'Dólar BCV',
        currency: 'USD',
        value: tasas.dolar_bcv.toFixed(2),
        change: (tasas.estatus_mercado || '').includes('Estable') ? 'Estable' : 'Alerta',
        up: true,
        source: 'BCV Oficial',
        gradient: 'from-emerald-500/20 to-emerald-900/10',
      },
      {
        label: 'Euro BCV',
        currency: 'EUR',
        value: tasas.euro_bcv.toFixed(2),
        change: 'BCV Oficial',
        up: true,
        source: 'BCV Oficial',
        gradient: 'from-green-500/20 to-green-900/10',
      },
      {
        label: 'USDT Binance',
        currency: 'USDT',
        value: tasas.usdt_binance.toFixed(2),
        change: tasas.brecha_porcentual,
        up: tasas.usdt_binance > tasas.dolar_bcv,
        source: 'Binance P2P',
        gradient: 'from-teal-500/20 to-teal-900/10',
      },
    ]
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Cargando tasas...</p>
      </div>
    )
  }

  // ── Error state ──
  if (error && !tasas) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 text-2xl">!</div>
        <p className="text-white font-semibold">Error de conexión</p>
        <p className="text-zinc-500 text-sm text-center">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-500 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">
            Hoy, {new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-2xl font-bold text-white mt-0.5 leading-tight">Tasas de Cambio</h1>
        </div>
        <button
          onClick={handleRefresh}
          className={`w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 transition-transform duration-500 ${refreshing ? 'animate-spin' : 'hover:rotate-180'}`}
        >
          <IconRefresh />
        </button>
      </div>

      {/* Error banner (si hay error pero tenemos datos previos) */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
          ⚠️ {error} — mostrando últimos datos disponibles
        </div>
      )}

      {/* Hero — Promedio */}
      {tasas && (
        <HeroCard
          promedio={tasas.promedio.toFixed(2)}
          brecha={tasas.brecha_porcentual.replace('%', '')}
          estatus={(tasas.estatus_mercado || '').includes('Estable') ? '✅ Estable' : '⚠️ Alerta'}
          ultimaActualizacion={tiempoRelativo()}
        />
      )}

      {/* Rate Cards */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Fuentes</h2>
        {buildRateCards().map((r) => (
          <RateCard key={r.currency} {...r} />
        ))}
      </div>

      {/* Quick history preview */}
      {historial.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Último registro</h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            {historial.slice(0, 2).map((h, i) => (
              <HistoryItem
                key={i}
                fecha={h.fecha}
                dolar_bcv={h.dolar_bcv}
                binance={h.usdt_binance}
                promedio={h.promedio}
                brecha={h.brecha}
                showBorder={i > 0}
              />
            ))}
          </div>
        </div>
      )}
      <div className='mt-9'></div>
    </div>
  )
}
