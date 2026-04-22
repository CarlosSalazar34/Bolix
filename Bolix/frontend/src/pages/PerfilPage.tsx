import { useState, useEffect } from 'react'
import { fetchStatus, fetchBalance } from '../services/api'
import type { StatusResponse, BalanceResponse } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useBolo } from '../context/BoloContext'
import { registerPushNotifications, sendSubscriptionToBackend } from '../services/pushService'

export default function PerfilPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, logout } = useAuth()
  const { showBolo } = useBolo()

  // Configuración de alertas (mock state)
  const [alertasTasa, setAlertasTasa] = useState(false)
  const [confirmaTrade, setConfirmaTrade] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [montoAlerta, setMontoAlerta] = useState('50.00')
  const [monedaBase, setMonedaBase] = useState<'USD' | 'VES'>('USD')

  useEffect(() => {
    const load = async () => {
      try {
        const [statusData, balanceData] = await Promise.all([
          fetchStatus(),
          user?.id ? fetchBalance(user.id) : Promise.resolve(null)
        ])
        setStatus(statusData)
        setBalance(balanceData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handlePushToggle = async () => {
    if (pushEnabled) {
      setPushEnabled(false)
      showBolo("Oído al tambor, ya no te mandaré push, pana.")
      return
    }

    try {
      setLoading(true)
      const sub = await registerPushNotifications()
      await sendSubscriptionToBackend(sub)
      setPushEnabled(true)
      showBolo("¡Listo el pollo! Notificaciones activadas en este navegador.")
    } catch (err: any) {
      showBolo(`Epa, algo falló con las notificaciones: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getNivel = (count: number) => {
    if (count < 5) return { label: 'Novato 🐣', color: 'text-zinc-400' }
    if (count < 20) return { label: 'Comerciante 🤝', color: 'text-emerald-400' }
    return { label: 'Tiburón del Arbitraje 🦈', color: 'text-yellow-400' }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Sincronizando con Bolo...</p>
      </div>
    )
  }

  const nivel = getNivel(balance?.total_operaciones || 0)

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
          <p className="text-zinc-400 text-sm mt-1 leading-none">{user?.username}</p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500/10 text-red-500 text-xs font-bold rounded-xl border border-red-500/20"
        >
          SALIR
        </button>
      </div>

      {/* Widget Perfil Real */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-3xl">👤</div>
          <div>
            <h2 className="text-white font-bold text-lg">{user?.username || 'Usuario Bolix'}</h2>
            <p className={`text-xs font-bold uppercase tracking-wider ${nivel.color}`}>{nivel.label}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase">Ganancia Mes</p>
            <p className="text-xl font-bold text-white">+$125.40</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase">Moneda Base</p>
            <div className="flex items-center gap-2 mt-1">
              <button 
                onClick={() => { setMonedaBase('USD'); showBolo("Cambiado a $, fino."); }}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${monedaBase === 'USD' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'}`}
              >
                USD
              </button>
              <button 
                onClick={() => { setMonedaBase('VES'); showBolo("Ahora verás todo en Bolívares."); }}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${monedaBase === 'VES' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'}`}
              >
                VES
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración de Alertas */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Configuración y Alertas</h3>
        
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden">
          {/* Switch Tasa */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div>
              <p className="text-white text-sm font-semibold">Alerta de Tasa USDT</p>
              <p className="text-zinc-500 text-[10px]">Avisar si sube de {montoAlerta} Bs.</p>
            </div>
            <button 
              onClick={() => {
                setAlertasTasa(!alertasTasa);
                showBolo(alertasTasa ? "Ya no te aviso nada de la tasa." : `¡Fino! Te aviso si el USDT pasa los ${montoAlerta}.`);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${alertasTasa ? 'bg-emerald-500' : 'bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${alertasTasa ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {/* Confirmación Trades */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div>
              <p className="text-white text-sm font-semibold">Confirmar Trades</p>
              <p className="text-zinc-500 text-[10px]">Bolo te avisará al registrar</p>
            </div>
            <button 
              onClick={() => setConfirmaTrade(!confirmaTrade)}
              className={`w-12 h-6 rounded-full transition-colors relative ${confirmaTrade ? 'bg-emerald-500' : 'bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${confirmaTrade ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {/* Push Notifs */}
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-white text-sm font-semibold">Notificaciones Push</p>
              <p className="text-zinc-500 text-[10px]">Alertas directas al navegador</p>
            </div>
            <button 
              onClick={handlePushToggle}
              className={`w-12 h-6 rounded-full transition-colors relative ${pushEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${pushEnabled ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Info API (vía Status) */}
      {status && (
        <div className="mt-2 bg-zinc-950/40 p-4 rounded-2xl border border-dashed border-zinc-800">
          <p className="text-zinc-600 text-[10px] text-center">
            Bolix API v{status.version} • {status.status} • Uptime {status.uptime}
          </p>
        </div>
      )}
    </div>
  )
}
