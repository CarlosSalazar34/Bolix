import { useState } from 'react'
import { IconExchange } from '../components/icons'
import { registrarTrade } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useBolo } from '../context/BoloContext'

export default function TradesPage() {
  const { user } = useAuth()
  const { showBolo } = useBolo()
  const [monto, setMonto] = useState('')
  const [tasa, setTasa] = useState('')
  const [tipo, setTipo] = useState<'compra' | 'venta'>('compra')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      setLoading(true)
      await registrarTrade({
        user_id: user.id,
        tipo,
        monto_usdt: parseFloat(monto),
        precio_tasa: parseFloat(tasa)
      })
      showBolo(`¡Listo pana! He registrado tu ${tipo} de ${monto} USDT a una tasa de ${tasa}. ¡Papayita! 🚀`)
      setMonto('')
      setTasa('')
    } catch (error: any) {
      showBolo(`Epa mano, algo salió mal: ${error.message}. Intenta de nuevo.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Transacciones</h1>
        <p className="text-zinc-400 text-sm mt-1">Registra tus operaciones de USDT</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Switch Tipo */}
        <div className="flex p-1 bg-zinc-900 rounded-2xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setTipo('compra')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${tipo === 'compra' ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-500'}`}
          >
            Compra
          </button>
          <button
            type="button"
            onClick={() => setTipo('venta')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${tipo === 'venta' ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-500'}`}
          >
            Venta
          </button>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase ml-1">Monto USDT</label>
            <input
              type="number"
              step="0.01"
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase ml-1">Tasa de Cambio (VES)</label>
            <input
              type="number"
              step="0.01"
              required
              value={tasa}
              onChange={(e) => setTasa(e.target.value)}
              placeholder="0.00"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <IconExchange />
              Registrar {tipo === 'compra' ? 'Compra' : 'Venta'}
            </>
          )}
        </button>
      </form>

      {/* Info Card */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-5 flex flex-col gap-3">
        <h3 className="text-white font-semibold">¿Por qué registrar?</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Al registrar tus operaciones, Bolix puede calcular tu balance acumulado y ayudarte a llevar un control preciso de tus finanzas en divisas.
        </p>
      </div>
    </div>
  )
}
