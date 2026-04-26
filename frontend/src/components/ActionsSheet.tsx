import { IconWhatsApp } from './icons'
import type { UserProfile } from '../services/api'

interface ActionsSheetProps {
  amount: string
  result: string | null
  currency: string
  profile: UserProfile | null
  onEditQuickAmounts: () => void
  onConfigurePayment: () => void
}

export default function ActionsSheet({ amount, result, currency, profile, onEditQuickAmounts, onConfigurePayment }: ActionsSheetProps) {
  const hasPagoMovil = profile?.pago_banco && profile?.pago_telefono

  const handleWhatsAppShare = () => {
    if (!result || !amount) return

    let text = `💱 *Bolix* | ${amount} ${currency} = *Bs. ${result}*`
    
    if (hasPagoMovil) {
      text += `\n\n*Datos de Pago Móvil:*\n`
      text += `🏦 *Banco:* ${profile.pago_banco}\n`
      text += `📱 *Tel:* ${profile.pago_telefono}\n`
      if (profile.pago_cedula) {
        text += `🆔 *CI:* ${profile.pago_cedula}`
      }
    }

    const encodedText = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encodedText}`, '_blank')
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Aviso si faltan datos de Pago Móvil - Ahora Clickable */}
      {profile && !hasPagoMovil && (
        <button 
          onClick={onConfigurePayment}
          className="w-full px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-left hover:bg-amber-500/20 active:scale-[0.98] transition-all group"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">💡</span>
          <p className="text-[11px] text-amber-200/80 leading-tight flex-1">
            Configura tus datos de <span className="font-bold text-amber-400 underline decoration-amber-500/30 underline-offset-2">Pago Móvil</span> aquí para incluirlos al compartir.
          </p>
          <span className="text-amber-500/50 text-xs">→</span>
        </button>
      )}

      {/* Resto de botones */}
      <div className="flex gap-2">
        {/* Compartir por WhatsApp */}
        <button
          onClick={handleWhatsAppShare}
          disabled={!result}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-semibold transition-all
            ${result
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 active:scale-95'
              : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-600 cursor-not-allowed'
            }`}
        >
          <IconWhatsApp />
          Cobrar
        </button>

        {/* Editar montos rápidos */}
        <button
          onClick={onEditQuickAmounts}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-zinc-700/50 bg-zinc-800/50 text-zinc-300 text-sm font-semibold hover:border-zinc-600 active:scale-95 transition-all"
        >
          <span>✎</span>
          Personalizar
        </button>
      </div>
    </div>
  )
}
