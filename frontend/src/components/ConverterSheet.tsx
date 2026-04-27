import { useState, useEffect, useMemo } from 'react'
import BottomSheet from './BottomSheet'
import { fetchUserProfile, type TasaResponse, type UserProfile } from '../services/api'
import ActionsSheet from './ActionsSheet'
import PaymentInfoModal from './PaymentInfoModal'

type Currency = 'USD' | 'USDT' | 'EUR' | 'PRO' | 'OTRO'

interface CurrencyOption {
  id: Currency
  label: string
  sublabel: string
  icon: string
  getRate: (tasas: TasaResponse, customRate?: number, mode?: 'min' | 'avg' | 'max') => number
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
    getRate: (t, _, mode) => {
      if (mode === 'min') return t.usdt_min ?? t.usdt_binance;
      if (mode === 'max') return t.usdt_max ?? t.usdt_binance;
      if (mode === 'avg') return t.usdt_avg ?? t.usdt_binance;
      return t.usdt_binance;
    },
  },
  {
    id: 'EUR',
    label: 'Euro BCV',
    sublabel: 'Tasa oficial',
    icon: '🇪🇺',
    getRate: (t) => t.euro_bcv,
  },
  {
    id: 'PRO',
    label: 'Promedio',
    sublabel: 'Promedio BCV y USDT',
    icon: '📊',
    getRate: (t) => t.promedio,
  },
  {
    id: 'OTRO',
    label: 'Otro',
    sublabel: 'Tasa manual',
    icon: '✏️',
    getRate: (_, custom) => custom || 0,
  },
]

interface ConverterSheetProps {
  open: boolean
  onClose: () => void
  tasas: TasaResponse | null
}

type USDTMode = 'min' | 'avg' | 'max'

const DEFAULT_AMOUNTS = [1, 5, 10, 20, 50, 100, 500, 1000]

export default function ConverterSheet({ open, onClose, tasas }: ConverterSheetProps) {
  const [selected, setSelected] = useState<Currency>('USD')
  const [usdtMode, setUsdtMode] = useState<USDTMode>('min')
  const [amount, setAmount] = useState('')
  const [customRateStr, setCustomRateStr] = useState('')
  const [direction, setDirection] = useState<'toBs' | 'fromBs'>('toBs')

  // Montos rápidos personalizables
  const [quickAmounts, setQuickAmounts] = useState<number[]>(DEFAULT_AMOUNTS)
  const [isEditingAmounts, setIsEditingAmounts] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  // Cargar perfil para Pago Móvil
  useEffect(() => {
    if (open) {
      fetchUserProfile()
        .then(setProfile)
        .catch(err => console.error('Error fetching profile for share:', err))
    }
  }, [open])

  // Cargar preferencias guardadas
  useEffect(() => {
    const saved = localStorage.getItem('bolix_quick_amounts')
    if (saved) {
      try {
        setQuickAmounts(JSON.parse(saved))
      } catch {
        setQuickAmounts(DEFAULT_AMOUNTS)
      }
    }
  }, [])

  const saveQuickAmounts = (next: number[]) => {
    setQuickAmounts(next)
    localStorage.setItem('bolix_quick_amounts', JSON.stringify(next))
  }

  const handleUpdateAmount = (index: number, value: string) => {
    const num = parseInt(value) || 0
    const next = [...quickAmounts]
    next[index] = num
    saveQuickAmounts(next)
  }

  // ── Manejo de eventos (sin useEffect de sincronización) ──
  const handleCurrencyChange = (id: Currency) => {
    setSelected(id)
    if (id === 'OTRO') {
      setDirection('toBs')
    }
  }

  const handleClose = () => {
    setAmount('')
    setIsEditingAmounts(false)
    onClose()
  }

  // ── Cálculo ──
  const currentOption = CURRENCIES.find((c) => c.id === selected)!
  const customRateNum = parseFloat(customRateStr) || 0
  const rate = tasas ? currentOption.getRate(tasas, customRateNum, usdtMode) : 0

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
    <BottomSheet open={open} onClose={handleClose} title="Calculadora">
      <div className="flex flex-col gap-5 pb-4">

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

        {/* Input tasa personalizada — solo para OTRO */}
        {selected === 'OTRO' && (
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
              Tu Tasa Personalizada (Bs)
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={customRateStr}
                onChange={(e) => setCustomRateStr(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-2xl px-5 py-4 text-white text-xl font-bold
                  placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 font-medium text-sm">
                Bs.
              </span>
            </div>
          </div>
        )}

        {/* Modos de USDT */}
        {selected === 'USDT' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest block">
              Modo de Tasa USDT
            </label>
            <div className="flex p-1 bg-zinc-950 border border-zinc-800/50 rounded-2xl gap-1">
              {(['min', 'avg', 'max'] as USDTMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setUsdtMode(m)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200
                    ${usdtMode === m 
                      ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' 
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'}`}
                >
                  {m === 'min' ? 'Mínimo' : m === 'avg' ? 'Promedio' : 'Máximo'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resultado */}
        <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${result ? 'opacity-100' : 'opacity-40'}`}>
          <div className="bg-gradient-to-br from-emerald-600 to-green-800 p-5 relative">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
            <p className="text-emerald-100 text-sm font-medium">
              {direction === 'toBs' ? 'Cambio a Bolívares' : `Cambio a ${currentOption.label}`}
            </p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-4xl font-bold text-white tracking-tight">
                {result ? `${toLabel === 'Bs' ? 'Bs.' : ''} ${result}` : '—'}
              </span>
              {result && toLabel !== 'Bs' && (
                <span className="text-emerald-200 text-sm mb-1">{toLabel}</span>
              )}
            </div>
            {result && rate > 0 && (
              <p className="text-emerald-200/70 text-xs mt-2">
                1 {selected === 'OTRO' ? 'Moneda' : currentOption.id} = Bs. {rate.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Montos Rápidos */}
        {direction === 'toBs' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Montos Rápidos</p>
              {isEditingAmounts && (
                <button
                  onClick={() => setIsEditingAmounts(false)}
                  className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-emerald-500 text-zinc-950 transition-colors"
                >
                  Guardar
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((v, i) => (
                <div key={i} className="relative">
                  {isEditingAmounts ? (
                    <input
                      type="number"
                      value={v}
                      onChange={(e) => handleUpdateAmount(i, e.target.value)}
                      className="w-full py-2 bg-zinc-950 border border-emerald-500/50 rounded-xl text-center text-base text-white outline-none animate-pulse"
                    />
                  ) : (
                    <button
                      onClick={() => setAmount(String(v))}
                      className={`w-full py-2 rounded-xl text-sm font-medium transition-all
                        ${amount === String(v)
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                          : 'bg-zinc-800/60 text-zinc-300 border border-zinc-700/40'
                        }`}
                    >
                      {v}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selector de moneda */}
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Moneda</p>
          <div className="flex gap-2 flex-wrap">
            {CURRENCIES.map((c) => {
              const active = selected === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => handleCurrencyChange(c.id)}
                  className={`flex-1 min-w-[18%] flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all duration-200
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

        {/* Acciones */}
        <ActionsSheet
          amount={amount}
          result={result}
          currency={selected}
          profile={profile}
          onEditQuickAmounts={() => setIsEditingAmounts(!isEditingAmounts)}
          onConfigurePayment={() => setPaymentModalOpen(true)}
        />

        <PaymentInfoModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          profile={profile}
          onSave={(updated) => setProfile(updated)}
        />

        {/* Dirección de conversión */}
        <div className="flex items-center gap-3 mb-10">
          {selected === 'OTRO' ? (
            <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/50 cursor-not-allowed">
              <span className="text-zinc-500 text-sm font-medium">{fromLabel}</span>
              <span className="text-zinc-600 text-lg">→</span>
              <span className="text-zinc-500 text-sm font-medium">{toLabel}</span>
            </div>
          ) : (
            <button
              onClick={() => setDirection(direction === 'toBs' ? 'fromBs' : 'toBs')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/50 hover:border-emerald-500/30 transition-all"
            >
              <span className="text-zinc-300 text-sm font-medium">{fromLabel}</span>
              <span className="text-emerald-400 text-lg">⇄</span>
              <span className="text-zinc-300 text-sm font-medium">{toLabel}</span>
            </button>
          )}
        </div>

      </div>
    </BottomSheet>
  )
}
