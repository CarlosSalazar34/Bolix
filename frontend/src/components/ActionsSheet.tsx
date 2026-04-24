import { useState, useEffect } from 'react'
import { IconPlus, IconWhatsApp } from './icons'
import { fetchUserProfile, updateUserPaymentInfo } from '../services/api'
import type { UserProfile } from '../services/api'

interface ActionsSheetProps {
  amount: string
  result: string | null
  currency: string
  onEditQuickAmounts?: () => void
}

export default function ActionsSheet({ amount, result, currency, onEditQuickAmounts }: ActionsSheetProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingProfile, setFetchingProfile] = useState(true)
  
  const [form, setForm] = useState({
    banco: '',
    cedula: '',
    telefono: ''
  })

  useEffect(() => {
    const load = async () => {
      try {
        setFetchingProfile(true)
        const data = await fetchUserProfile()
        setProfile(data)
        setForm({
          banco: data.pago_banco || '',
          cedula: data.pago_cedula || '',
          telefono: data.pago_telefono || ''
        })
      } catch (e) {
        console.error("Error cargando perfil:", e)
      } finally {
        setFetchingProfile(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!form.banco || !form.telefono || !form.cedula) {
      alert("Por favor rellena todos los campos")
      return
    }
    setLoading(true)
    try {
      const updated = await updateUserPaymentInfo({
        pago_banco: form.banco,
        pago_cedula: form.cedula,
        pago_telefono: form.telefono
      })
      setProfile(updated)
      setShowDialog(false)
    } catch (e) {
      alert("Error al guardar en el servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleCobrar = () => {
    console.log("Intentando cobrar...", { result, profile, isConfigured })
    
    if (!result) {
      console.warn("No hay resultado para cobrar")
      return
    }
    
    // Si aún está cargando el perfil, esperamos o asumimos que no está configurado
    if (fetchingProfile) return;

    if (!profile?.pago_banco || !profile?.pago_telefono || !profile?.pago_cedula) {
      console.log("Faltan datos de pago, abriendo diálogo")
      setShowDialog(true)
      return
    }
    
    let text = `*BOLIX - Orden de Pago*\n\n`
    text += `Total a pagar: *Bs. ${result}*\n`
    text += `Referencia: ${amount} ${currency}\n\n`
    text += `*Datos de Pago Móvil:*\n`
    text += `🏦 Banco: ${profile.pago_banco}\n`
    text += `🆔 Cédula: ${profile.pago_cedula}\n`
    text += `📱 Teléfono: ${profile.pago_telefono}\n\n`
    text += `_Generado por Bolix_`
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    console.log("Abriendo WhatsApp:", whatsappUrl)
    
    // Abrir en pestaña nueva
    const win = window.open(whatsappUrl, '_blank')
    if (win) {
      win.focus()
    } else {
      // Fallback si el pop-up es bloqueado
      window.location.href = whatsappUrl
    }
  }

  const isConfigured = !!(profile?.pago_banco && profile?.pago_cedula && profile?.pago_telefono)

  return (
    <div className="flex flex-col gap-4 mt-2">
      {/* DIÁLOGO DE CONFIGURACIÓN (MODAL) */}
      {showDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDialog(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-white">Datos de Pago</h3>
                <p className="text-zinc-500 text-xs">Configura tu pago móvil para cobrar.</p>
              </div>
              <button onClick={() => setShowDialog(false)} className="text-zinc-600 hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Banco</label>
                <input
                  value={form.banco}
                  onChange={(e) => setForm({...form, banco: e.target.value})}
                  placeholder="Ej: Banesco"
                  className="w-full h-12 text-base rounded-2xl bg-zinc-950 border border-zinc-800 px-4 text-white outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Cédula</label>
                  <input
                    value={form.cedula}
                    onChange={(e) => setForm({...form, cedula: e.target.value})}
                    placeholder="V-12345678"
                    className="w-full h-12 text-base rounded-2xl bg-zinc-950 border border-zinc-800 px-4 text-white outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Teléfono</label>
                  <input
                    value={form.telefono}
                    onChange={(e) => setForm({...form, telefono: e.target.value})}
                    placeholder="0412..."
                    className="w-full h-12 text-base rounded-2xl bg-zinc-950 border border-zinc-800 px-4 text-white outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowDialog(false)}
                  className="flex-1 h-12 rounded-2xl bg-zinc-800 text-white font-bold text-sm active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 h-12 rounded-2xl bg-emerald-500 text-zinc-950 font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción principal */}
      <div className="flex items-center gap-3">
        {/* Botón Monto rápido */}
        <button 
          onClick={onEditQuickAmounts}
          className="flex-1 flex items-center gap-3 bg-zinc-800/40 border border-zinc-700/50 rounded-2xl p-4 hover:bg-zinc-800/60 transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center text-zinc-300">
            <IconPlus />
          </div>
          <div className="text-left">
            <p className="text-white text-sm font-bold">Monto rápido</p>
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight">Editar botones {currency}</p>
          </div>
        </button>

        {/* Botón Cobrar */}
        <div className="relative flex-1">
          {(!isConfigured && !fetchingProfile) && (
            <button 
              onClick={() => setShowDialog(true)}
              className="absolute -top-14 right-0 left-0 animate-bounce duration-[3000ms] z-20 w-full text-left outline-none"
            >
              <div className="bg-yellow-500/95 backdrop-blur-md rounded-xl p-2.5 shadow-xl border border-yellow-400/50 active:scale-95 transition-transform">
                <p className="text-[9px] leading-tight text-zinc-950 font-bold flex items-start gap-1.5">
                  <span className="text-xs leading-none">⚠️</span>
                  Datos de pago no configurados. Toque para configurar.
                </p>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-500/95 rotate-45 border-r border-b border-yellow-400/50" />
              </div>
            </button>
          )}

          <button 
            onClick={handleCobrar}
            disabled={!result || fetchingProfile}
            className={`w-full h-[72px] rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-[0.98] shadow-lg
              ${result 
                ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400' 
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'}`}
          >
            <span className="text-base font-black uppercase tracking-tight">
              {fetchingProfile ? '...' : 'Cobrar'}
            </span>
            <div className="flex items-center gap-1.5 opacity-80">
              <IconWhatsApp />
              <span className="text-[10px] font-bold">Cobrar por WhatsApp</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}