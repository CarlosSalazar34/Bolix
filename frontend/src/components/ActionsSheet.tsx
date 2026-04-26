interface ActionsSheetProps {
  amount: string
  result: string | null
  currency: string
  onEditQuickAmounts: () => void
}

export default function ActionsSheet({ amount, result, currency, onEditQuickAmounts }: ActionsSheetProps) {
  const handleShare = () => {
    if (!result || !amount) return
    const text = `💱 Bolix | ${amount} ${currency} = Bs. ${result}`
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  return (
    <div className="flex gap-2">
      {/* Compartir resultado */}
      <button
        onClick={handleShare}
        disabled={!result}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-semibold transition-all
          ${result
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-600 cursor-not-allowed'
          }`}
      >
        <span>↗</span>
        Compartir
      </button>

      {/* Editar montos rápidos */}
      <button
        onClick={onEditQuickAmounts}
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-zinc-700/50 bg-zinc-800/50 text-zinc-300 text-sm font-semibold hover:border-zinc-600 transition-all"
      >
        <span>✎</span>
        Personalizar
      </button>
    </div>
  )
}
