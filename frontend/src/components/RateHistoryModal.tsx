import { useState, useEffect } from 'react'
import BottomSheet from './BottomSheet'
import { fetchHistorial } from '../services/api'
import type { HistorialItem } from '../services/api'

interface RateHistoryModalProps {
  source: string | null
  onClose: () => void
}

const SOURCE_CONFIG: Record<string, { label: string; icon: string; currency: string; getValue: (item: HistorialItem) => number }> = {
  bcv: {
    label: 'Dólar BCV',
    icon: '🇻🇪',
    currency: 'USD',
    getValue: (item) => item.dolar_bcv,
  },
  euro: {
    label: 'Euro BCV',
    icon: '🇪🇺',
    currency: 'EUR',
    getValue: (item) => item.euro_bcv,
  },
  binance: {
    label: 'USDT Binance',
    icon: '₮',
    currency: 'USDT',
    getValue: (item) => item.usdt_avg,
  },
  promedio: {
    label: 'Promedio Bolix',
    icon: '📊',
    currency: 'PRO',
    getValue: (item) => item.promedio,
  },
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/30 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-3 w-24 bg-zinc-700 rounded-full" />
        <div className="h-2.5 w-16 bg-zinc-700/60 rounded-full" />
      </div>
      <div className="h-5 w-20 bg-zinc-700 rounded-full" />
    </div>
  )
}

export default function RateHistoryModal({ source, onClose }: RateHistoryModalProps) {
  const [items, setItems] = useState<HistorialItem[]>([])
  const [loading, setLoading] = useState(false)
  const [activeConfig, setActiveConfig] = useState<typeof SOURCE_CONFIG['bcv'] | null>(null)

  useEffect(() => {
    if (source && SOURCE_CONFIG[source]) {
      setActiveConfig(SOURCE_CONFIG[source])
    }
  }, [source])

  useEffect(() => {
    if (!source) return
    setLoading(true)
    setItems([])
    fetchHistorial()
      .then((res) => {
        const all = res.data || []
        setItems(all.slice(0, 20))
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [source])

  const title = activeConfig ? `${activeConfig.icon}  ${activeConfig.label}` : ''

  // Calcular stats del historial
  const values = items.map(activeConfig?.getValue || (() => 0))
  const avg = values.length ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0
  const max = values.length ? Math.max(...values) : 0
  const min = values.length ? Math.min(...values) : 0

  return (
    <BottomSheet open={!!source} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4 pb-4">

        {/* Stats banner */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Promedio', value: avg.toFixed(2) },
              { label: 'Máximo', value: max.toFixed(2) },
              { label: 'Mínimo', value: min.toFixed(2) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center py-3 px-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
              >
                <p className="text-emerald-400 text-[10px] font-semibold uppercase tracking-widest">{stat.label}</p>
                <p className="text-white font-bold text-base mt-0.5">Bs. {stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-zinc-800" />
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-semibold">Últimos 20 registros</p>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-2xl">
              📭
            </div>
            <p className="text-zinc-400 text-sm font-medium">Sin registros disponibles</p>
            <p className="text-zinc-600 text-xs">Vuelve más tarde</p>
          </div>
        )}

        {/* History list */}
        {!loading && items.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {items.map((item, i) => {
              const val = activeConfig?.getValue(item) || 0
              const prev = i < items.length - 1 ? activeConfig?.getValue(items[i + 1]) || val : val
              const isUp = val >= prev
              const date = new Date(item.fecha)
              return (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-zinc-800/50 border border-zinc-700/40 active:scale-[0.98] transition-transform"
                >
                  {/* Left: fecha + brecha */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                        ${isUp ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}
                    >
                      {isUp ? '↑' : '↓'}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                        {item.brecha ? `  ·  ${item.brecha}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right: valor */}
                  <div className="text-right">
                    <p className="text-white font-bold text-base">Bs. {val.toFixed(2)}</p>
                    <p className={`text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                      {activeConfig?.currency}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
