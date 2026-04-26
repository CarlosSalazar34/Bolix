import { IconWhatsApp } from './icons'
import type { UserProfile } from '../services/api'

interface ActionsSheetProps {
  amount: string
  result: string | null
  currency: string
  profile: UserProfile | null
  onEditQuickAmounts: () => void
}

export default function ActionsSheet({ amount, result, currency, profile, onEditQuickAmounts }: ActionsSheetProps) {
  const handleWhatsAppShare = () => {
    if (!result || !amount) return

    let text = `💱 *Bolix* | ${amount} ${currency} = *Bs. ${result}*`
    
    if (profile?.pago_banco && profile?.pago_telefono) {
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
        WhatsApp
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
  )
}
