import { useState, useEffect, useMemo } from 'react'
import BottomSheet from './BottomSheet'
import type { TasaResponse } from '../services/api'

type Currency = 'USD' | 'USDT' | 'EUR'

interface CurrencyOption {
  id: Currency
  label: string
  sublabel: string
  icon: string
  getRate: (tasas: TasaResponse) => number
}

const CURRENCIES: CurrencyOption[] = [
  {
    id: 'USD',
    label: 'Dólar BCV',
    sublabel: 'Tasa oficial',
    icon: '🇺🇸',
    getRate: (t) => t.dolar_bcv,
  },
  {
    id: 'USDT',
    label: 'USDT Binance',
    sublabel: 'Binance P2P',
    icon: '₮',
    getRate: (t) => t.usdt_binance,
  },
  {
    id: 'EUR',
    label: 'Euro BCV',
    sublabel: 'Tasa oficial',
    icon: '🇪🇺',
    getRate: (t) => t.euro_bcv,
  },
]

interface ConverterSheetProps {
  open: boolean
  onClose: () => void
  tasas: TasaResponse | null
}

export default function ConverterSheet({ open, onClose, tasas }: ConverterSheetProps) {
  const [selected, setSelected] = useState<Currency>('USD')
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState<'toBs' | 'fromBs'>('toBs')

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setAmount('')
    }
  }, [open])

  const currentOption = CURRENCIES.find((c) => c.id === selected)!
  const rate = tasas ? currentOption.getRate(tasas) : 0

  const result = useMemo(() => {
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0 || rate === 0) return null
    if (direction === 'toBs') {
      return (num * rate).toFixed(2)
    } else {
      return (num / rate).toFixed(2)
    }
  }, [amount, rate, direction])

  const fromLabel = direction === 'toBs' ? currentOption.id : 'Bs'
  const toLabel = direction === 'toBs' ? 'Bs' : currentOption.id

  return (
    <BottomSheet open={open} onClose={onClose} title="Calculadora">
      <div className="flex flex-col gap-5 pb-4">

        {/* Selector de moneda */}
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Moneda</p>
          <div className='mt-3'></div>
          <div className="flex gap-2">
            {CURRENCIES.map((c) => {
              const active = selected === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all duration-200
                    ${active
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                      : 'bg-zinc-800/60 border-zinc-700/50 hover:border-zinc-600'
                    }`}
                >
                  <span className="text-xl">{c.icon}</span>
                  <span className={`text-xs font-semibold ${active ? 'text-emerald-400' : 'text-zinc-300'}`}>
                    {c.id}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tasa actual */}
        {tasas && (
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/40 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">Tasa actual</p>
              <p className="text-white font-bold text-lg">Bs. {rate.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">{currentOption.sublabel}</p>
              <p className={`text-xs font-medium mt-0.5 px-2 py-0.5 rounded-full inline-block
                ${tasas.estatus_mercado.includes('Estable')
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                {tasas.estatus_mercado.includes('Estable') ? '✅ Estable' : '⚠️ Alerta'}
              </p>
            </div>
          </div>
        )}

        {/* Dirección de conversión */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDirection(direction === 'toBs' ? 'fromBs' : 'toBs')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/50 hover:border-emerald-500/30 transition-all"
          >
            <span className="text-zinc-300 text-sm font-medium">{fromLabel}</span>
            <span className="text-emerald-400 text-lg">⇄</span>
            <span className="text-zinc-300 text-sm font-medium">{toLabel}</span>
          </button>
        </div>

        {/* Input de monto */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
            Monto en {fromLabel}
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-2xl px-5 py-4 text-white text-2xl font-bold
                placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 font-medium text-sm">
              {fromLabel}
            </span>
          </div>
        </div>

        {/* Resultado */}
        <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${result ? 'opacity-100' : 'opacity-40'}`}>
          <div className="bg-gradient-to-br from-emerald-600 to-green-800 p-5 relative">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
            <p className="text-emerald-100 text-sm font-medium">{selected === "USD" ? "Cambio en USD" : selected === "EUR" ? "Cambio en EUR" : selected === "USDT" ? "Cambio en USDT" : "Cambio en Bs"}</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-4xl font-bold text-white tracking-tight">
                {result ? `${toLabel === 'Bs' ? 'Bs.' : ''} ${result}` : '—'}
              </span>
              {result && toLabel !== 'Bs' && (
                <span className="text-emerald-200 text-sm mb-1">{toLabel}</span>
              )}
            </div>
            {result && (
              <p className="text-emerald-200/70 text-xs mt-2">
                1 {currentOption.id} = Bs. {rate.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Quick amounts */}
        {direction === 'toBs' && (
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Rápido</p>
            <div className='mb-3'></div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 5, 10, 20, 50, 100, 500, 1000].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className={`py-2 rounded-xl text-sm font-medium transition-all
                    ${amount === String(v)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-zinc-800/60 text-zinc-300 border border-zinc-700/40 hover:border-zinc-600'
                    }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="mt-3"></div>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
