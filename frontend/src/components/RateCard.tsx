import { IconTrend } from './icons'

export interface RateCardData {
  id?: string
  label: string
  currency: string
  value: string
  change: string
  up: boolean
  source: string
  gradient: string
  onClick?: () => void
}

export default function RateCard({ label, currency, value, change, up, source, gradient, onClick }: RateCardData) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-4 bg-gradient-to-br ${gradient} border border-white/5 backdrop-blur-sm flex items-center justify-between ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <span className="text-emerald-400 font-bold text-xs">{currency}</span>
        </div>
        <div>
          <p className="text-white font-semibold">{label}</p>
          <p className="text-zinc-400 text-xs">{source}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-white font-bold text-lg">Bs. {value}</p>
        <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
          <IconTrend up={up} />
          {change}
        </div>
      </div>
    </div>
  )
}
